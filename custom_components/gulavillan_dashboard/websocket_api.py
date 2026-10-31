"""WebSocket commands that read and write the shared layout."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant

from .const import DATA_STORE, DOMAIN
from .storage import LayoutStorage
from .validation import LayoutError, validate_layout


def async_register_websocket(hass: HomeAssistant) -> None:
    """Register layout commands once per Home Assistant instance."""
    if hass.data.get(f"{DOMAIN}_ws"):
        return
    websocket_api.async_register_command(hass, ws_get_layout)
    websocket_api.async_register_command(hass, ws_save_layout)
    hass.data[f"{DOMAIN}_ws"] = True


def _store(hass: HomeAssistant) -> LayoutStorage | None:
    store = hass.data.get(DATA_STORE)
    if not isinstance(store, LayoutStorage):
        return None
    if not any(
        entry.state is ConfigEntryState.LOADED
        for entry in hass.config_entries.async_entries(DOMAIN)
    ):
        return None
    return store


def _layout_payload(value: Any) -> dict[str, Any]:
    try:
        return validate_layout(value)
    except LayoutError as err:
        raise vol.Invalid(str(err)) from err


@websocket_api.websocket_command({vol.Required("type"): "gulavillan_dashboard/layout/get"})
@websocket_api.async_response
async def ws_get_layout(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the stored layout."""
    store = _store(hass)
    if store is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Gulavillan is not set up"
        )
        return
    connection.send_result(msg["id"], store.layout)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "gulavillan_dashboard/layout/save",
        vol.Required("layout"): _layout_payload,
    }
)
@websocket_api.async_response
async def ws_save_layout(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Replace the stored layout. Administrators only."""
    if connection.user is None or not connection.user.is_admin:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Only administrators can save the layout",
        )
        return
    store = _store(hass)
    if store is None:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, "Gulavillan is not set up"
        )
        return
    saved = await store.async_save(msg["layout"])
    connection.send_result(msg["id"], saved)
