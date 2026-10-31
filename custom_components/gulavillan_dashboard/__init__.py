"""Gulavillan page on its own port."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DATA_SERVER
from .server import PageServer

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up from YAML. The port is chosen in the UI."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Start the page server."""
    server = PageServer(hass, entry)
    started = await server.start()
    hass.data.setdefault(DATA_SERVER, {})[entry.entry_id] = server
    if not started:
        _LOGGER.error(
            "Gulavillan is set up, but the page is not reachable until the port is changed"
        )

    async def _stop(_event: object | None = None) -> None:
        await server.stop()

    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    entry.async_on_unload(
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, _stop)
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Stop the page server. The drawing is kept."""
    server = hass.data.get(DATA_SERVER, {}).pop(entry.entry_id, None)
    if isinstance(server, PageServer):
        await server.stop()
    return True


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Restart the page server when the port or PIN changes."""
    await hass.config_entries.async_reload(entry.entry_id)
