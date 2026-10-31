"""Config flow for the port the Gulavillan page listens on."""

from __future__ import annotations

import socket
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    IconSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .const import (
    DEFAULT_PORT,
    DOMAIN,
    MAX_PORT,
    MIN_PORT,
    MULTI_OPTIONS,
    OPT_CHARGERS,
    OPT_ENERGY,
    OPT_LIGHT_SWITCHES,
    OPT_POWER,
    OPT_PRICE,
    OPT_VILLA_CLIMATE,
    OPT_VILLA_DOOR,
    OPT_VILLA_HUMIDITY,
    OPT_VILLA_INDOOR,
    OPT_VILLA_LIGHTS,
    OPT_LEGACY,
    OPT_PANEL_ADMIN,
    OPT_SIDEBAR_ICON,
    OPT_SIDEBAR_TITLE,
    OPT_VILLA_OUTDOOR,
    SINGLE_OPTIONS,
)

_BOOL_OPTIONS = (OPT_PANEL_ADMIN, OPT_LEGACY)

_PORT = NumberSelector(
    NumberSelectorConfig(
        min=MIN_PORT,
        max=MAX_PORT,
        step=1,
        mode=NumberSelectorMode.BOX,
    )
)
_PIN = TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))
_TEXT = TextSelector()
_BOOL = BooleanSelector()
_ICON = IconSelector()


def _ha_port(hass: Any) -> int | None:
    api = getattr(getattr(hass, "config", None), "api", None)
    port = getattr(api, "port", None)
    return int(port) if isinstance(port, int) else None


def _as_port(value: Any) -> int | None:
    if isinstance(value, bool) or value in (None, ""):
        return None
    try:
        port = int(value)
    except (TypeError, ValueError):
        return None
    if port < MIN_PORT or port > MAX_PORT:
        return None
    return port


async def async_port_available(port: int) -> bool:
    """Return True when nothing is listening on this port."""

    def _bind() -> bool:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("0.0.0.0", port))
        except OSError:
            return False
        finally:
            sock.close()
        return True

    return _bind()


def _field(key: str, selector: EntitySelector, current: Any) -> tuple[Any, EntitySelector]:
    """Prefill a selector without forcing the previous value back in."""
    if current:
        return vol.Optional(key, description={"suggested_value": current}), selector
    return vol.Optional(key), selector


def _schema(port: int, pin: str) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required("port", default=port): _PORT,
            vol.Optional("pin", default=pin): _PIN,
        }
    )


def _options_schema(port: int, pin: str, current: dict[str, Any]) -> vol.Schema:
    """Port, PIN, villa bindings and which switches count as lights."""
    fields: dict[Any, Any] = {
        vol.Required("port", default=port): _PORT,
        vol.Optional("pin", default=pin): _PIN,
    }
    singles = {
        OPT_VILLA_OUTDOOR: EntitySelector({"domain": "sensor", "device_class": "temperature"}),
        OPT_VILLA_INDOOR: EntitySelector({"domain": "sensor", "device_class": "temperature"}),
        OPT_VILLA_HUMIDITY: EntitySelector({"domain": "sensor", "device_class": "humidity"}),
        OPT_VILLA_CLIMATE: EntitySelector({"domain": "climate"}),
        OPT_VILLA_DOOR: EntitySelector({"domain": "binary_sensor", "device_class": "door"}),
        OPT_POWER: EntitySelector({"domain": "sensor", "device_class": "power"}),
        OPT_ENERGY: EntitySelector({"domain": "sensor", "device_class": "energy"}),
        OPT_PRICE: EntitySelector({"domain": "sensor"}),
    }
    multiples = {
        OPT_VILLA_LIGHTS: EntitySelector({"domain": ["light", "switch"], "multiple": True}),
        OPT_LIGHT_SWITCHES: EntitySelector({"domain": "switch", "multiple": True}),
        OPT_CHARGERS: EntitySelector(
            {"domain": ["sensor", "binary_sensor", "switch", "number"], "multiple": True}
        ),
    }
    plain = {
        OPT_SIDEBAR_TITLE: _TEXT,
        OPT_SIDEBAR_ICON: _ICON,
        OPT_PANEL_ADMIN: _BOOL,
        OPT_LEGACY: _BOOL,
    }
    for key, selector in singles.items():
        marker, selector = _field(key, selector, current.get(key) or "")
        fields[marker] = selector
    for key, selector in multiples.items():
        marker, selector = _field(key, selector, list(current.get(key) or []))
        fields[marker] = selector
    for key, selector in plain.items():
        marker, selector = _field(key, selector, current.get(key) or "")
        fields[marker] = selector
    return vol.Schema(fields)


def clean_options(
    user_input: dict[str, Any],
    port: int,
    pin: str,
    previous: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Keep the port, PIN and entity picks.

    A missing key keeps the previous choice. An empty value clears it.
    """
    previous = previous or {}
    data: dict[str, Any] = {"port": port, "pin": pin}
    for key in SINGLE_OPTIONS:
        if key not in user_input:
            if previous.get(key):
                data[key] = previous[key]
            continue
        value = user_input.get(key)
        if isinstance(value, str) and value.strip():
            data[key] = value.strip()
    for key in MULTI_OPTIONS:
        if key not in user_input:
            if previous.get(key):
                data[key] = previous[key]
            continue
        raw = user_input.get(key) or []
        if isinstance(raw, str):
            raw = [raw]
        cleaned = [item.strip() for item in raw if isinstance(item, str) and item.strip()]
        if cleaned:
            data[key] = cleaned
    for key in _BOOL_OPTIONS:
        if key in user_input:
            data[key] = bool(user_input[key])
        elif key in previous:
            data[key] = bool(previous[key])
    return data


class GulavillanConfigFlow(ConfigFlow, domain=DOMAIN):
    """Ask which port the page should use."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> GulavillanOptionsFlow:
        """Return the options flow."""
        return GulavillanOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Choose the port and an optional PIN."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            pin = str(user_input.get("pin") or "").strip()
            return self.async_create_entry(
                title="Gulavillan",
                data={"port": DEFAULT_PORT, "pin": pin},
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Optional("pin", default=""): _PIN}),
            description_placeholders={"port": str(DEFAULT_PORT)},
        )

    async def _validate(self, port: int, current: int | None) -> dict[str, str]:
        if port < MIN_PORT or port > MAX_PORT:
            return {"port": "invalid_port"}
        ha_port = _ha_port(self.hass)
        if port == 8123 or (ha_port is not None and port == ha_port):
            return {"port": "invalid_port"}
        if port != current and not await async_port_available(port):
            return {"port": "port_in_use"}
        return {}


class GulavillanOptionsFlow(OptionsFlow):
    """Change the port or PIN from the integration page."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Edit the listener settings."""
        current = int(self.config_entry.options.get("port", self.config_entry.data.get("port", DEFAULT_PORT)))
        pin = str(self.config_entry.options.get("pin", self.config_entry.data.get("pin", "")))
        errors: dict[str, str] = {}
        merged = {**self.config_entry.data, **self.config_entry.options}
        if user_input is not None:
            port = _as_port(user_input.get("port")) or 0
            pin = str(user_input.get("pin") or "").strip()
            legacy = bool(user_input.get(OPT_LEGACY))
            ha_port = _ha_port(self.hass)
            if port < MIN_PORT or port > MAX_PORT or port == 8123 or port == ha_port:
                errors["port"] = "invalid_port"
            elif legacy and port != current and not await async_port_available(port):
                errors["port"] = "port_in_use"
            else:
                self.hass.config_entries.async_update_entry(
                    self.config_entry, title=f"Gulavillan ({port})"
                )
                return self.async_create_entry(
                    data=clean_options(user_input, port, pin, merged)
                )

        return self.async_show_form(
            step_id="init",
            data_schema=_options_schema(current, pin, merged),
            errors=errors,
            description_placeholders={"port": str(current)},
        )
