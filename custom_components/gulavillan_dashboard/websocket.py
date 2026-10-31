"""Websocket commands used by the sidebar page."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .access import pin_matches
from .catalog import async_build_catalog
from .const import DOMAIN
from .server import _ALARM_SERVICES, entry_settings

_LOGGER = logging.getLogger(__name__)


def _entry(hass: HomeAssistant) -> Any | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


@websocket_api.websocket_command({vol.Required("type"): "gulavillan_dashboard/entities"})
@websocket_api.async_response
async def ws_entities(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return floors, areas and villa bindings for the logged-in user."""
    entry = _entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Gulavillan is not set up")
        return
    settings = entry_settings(entry)
    catalog = await async_build_catalog(hass, {**entry.data, **entry.options})
    catalog["pin_required"] = bool(settings["pin"])
    connection.send_result(msg["id"], catalog)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "gulavillan_dashboard/alarm",
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("mode"): vol.In(_ALARM_SERVICES),
        vol.Optional("pin"): str,
        vol.Optional("code"): str,
    }
)
@websocket_api.async_response
async def ws_alarm(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Arm or disarm after the page PIN, when one is configured."""
    entry = _entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Gulavillan is not set up")
        return
    settings = entry_settings(entry)
    if settings["pin"] and not pin_matches(entry.entry_id, settings["pin"], str(msg.get("pin") or "")):
        connection.send_error(msg["id"], "unauthorized", "Pinkoden stämmer inte")
        return
    data: dict[str, Any] = {"entity_id": msg["entity_id"]}
    code = str(msg.get("code") or "").strip()
    if code:
        data["code"] = code[:32]
    await hass.services.async_call(
        "alarm_control_panel",
        _ALARM_SERVICES[msg["mode"]],
        data,
        blocking=False,
    )
    connection.send_result(msg["id"], {"ok": True})


def async_setup_commands(hass: HomeAssistant) -> None:
    """Register the page commands once."""
    if hass.data.get(f"{DOMAIN}_ws"):
        return
    websocket_api.async_register_command(hass, ws_entities)
    websocket_api.async_register_command(hass, ws_alarm)
    hass.data[f"{DOMAIN}_ws"] = True
    _LOGGER.debug("Gulavillan websocket commands registered")
