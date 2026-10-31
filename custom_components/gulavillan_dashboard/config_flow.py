"""Config flow for the port the Gulavillan page listens on."""

from __future__ import annotations

import socket
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .const import DEFAULT_PORT, DOMAIN, MAX_PORT, MIN_PORT

_PORT = NumberSelector(
    NumberSelectorConfig(
        min=MIN_PORT,
        max=MAX_PORT,
        step=1,
        mode=NumberSelectorMode.BOX,
    )
)
_PIN = TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))


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


def _schema(port: int, pin: str) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required("port", default=port): _PORT,
            vol.Optional("pin", default=pin): _PIN,
        }
    )


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

        errors: dict[str, str] = {}
        port = DEFAULT_PORT
        pin = ""
        if user_input is not None:
            port = _as_port(user_input.get("port")) or 0
            pin = str(user_input.get("pin") or "")
            errors = await self._validate(port, current=None)
            if not errors:
                return self.async_create_entry(
                    title=f"Gulavillan ({port})",
                    data={"port": port, "pin": pin},
                )

        return self.async_show_form(
            step_id="user",
            data_schema=_schema(port or DEFAULT_PORT, pin),
            errors=errors,
            description_placeholders={"port": str(port or DEFAULT_PORT)},
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
        if user_input is not None:
            port = _as_port(user_input.get("port")) or 0
            pin = str(user_input.get("pin") or "")
            if port < MIN_PORT or port > MAX_PORT or port == 8123 or port == (_ha_port(self.hass) or -1):
                errors["port"] = "invalid_port"
            elif port != current and not await async_port_available(port):
                errors["port"] = "port_in_use"
            else:
                self.hass.config_entries.async_update_entry(
                    self.config_entry, title=f"Gulavillan ({port})"
                )
                return self.async_create_entry(data={"port": port, "pin": pin})

        return self.async_show_form(
            step_id="init",
            data_schema=_schema(current, pin),
            errors=errors,
            description_placeholders={"port": str(current)},
        )
