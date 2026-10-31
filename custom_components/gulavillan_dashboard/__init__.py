"""Gulavillan free-form dashboard panel."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DATA_STORE, DOMAIN
from .panel import async_register_frontend, async_unregister_frontend
from .storage import LayoutStorage
from .websocket_api import async_register_websocket

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the integration from YAML. Configuration is done in the UI."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Load the layout, serve the panel and register websocket commands."""
    store = hass.data.get(DATA_STORE)
    if not isinstance(store, LayoutStorage):
        store = LayoutStorage(hass)
        await store.async_load()
        hass.data[DATA_STORE] = store

    async_register_websocket(hass)
    await async_register_frontend(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["entry_id"] = entry.entry_id
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the sidebar panel. The stored layout is kept."""
    async_unregister_frontend(hass)
    hass.data.get(DOMAIN, {}).pop("entry_id", None)
    return True


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload when sidebar settings change."""
    await hass.config_entries.async_reload(entry.entry_id)
