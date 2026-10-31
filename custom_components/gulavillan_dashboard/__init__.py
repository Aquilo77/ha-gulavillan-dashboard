"""Gulavillan sidebar page."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend as ha_frontend
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.service import async_register_admin_service
from homeassistant.helpers.typing import ConfigType
import voluptuous as vol

from .const import (
    DATA_SERVER,
    DOMAIN,
    OPT_LEGACY,
    PANEL_PATH,
    PANEL_URL,
    SERVICE_ROLLBACK,
    SERVICE_UPDATE,
)
from .frontend import async_ensure_frontend, async_rollback_frontend, async_update_frontend, read_version
from .server import PageServer, entry_settings
from .websocket import async_setup_commands

_LOGGER = logging.getLogger(__name__)
_PANEL_JS = str(Path(__file__).parent / "panel.js")

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register commands and services. The page itself is a config entry."""
    async_setup_commands(hass)
    _async_register_services(hass)
    await _async_register_panel_script(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Copy the page into /config/www on first run and add the sidebar panel."""
    await async_ensure_frontend(hass)
    await _async_register_panel(hass, entry)
    settings = entry_settings(entry)
    if settings.get(OPT_LEGACY):
        server = PageServer(hass, entry)
        started = await server.start()
        hass.data.setdefault(DATA_SERVER, {})[entry.entry_id] = server
        if not started:
            _LOGGER.error("Gulavillan legacy port %s is not available", settings["port"])
    else:
        _LOGGER.info(
            "Gulavillan is in the sidebar. The separate port is off until you enable it"
        )

    async def _stop(_event: object | None = None) -> None:
        await _async_stop_server(hass, entry)

    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    entry.async_on_unload(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, _stop))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the sidebar panel and stop the legacy port if it was on."""
    ha_frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)
    await _async_stop_server(hass, entry)
    return True


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Apply a new title, icon, admin flag or legacy port."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_stop_server(hass: HomeAssistant, entry: ConfigEntry) -> None:
    server = hass.data.get(DATA_SERVER, {}).pop(entry.entry_id, None)
    if isinstance(server, PageServer):
        await server.stop()


async def _async_register_panel(hass: HomeAssistant, entry: ConfigEntry) -> None:
    settings = entry_settings(entry)
    version = read_version(hass)
    ha_frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="gulavillan-panel",
        sidebar_title=str(settings.get("sidebar_title") or "Gulavillan"),
        sidebar_icon=str(settings.get("sidebar_icon") or "mdi:home"),
        js_url=f"{PANEL_URL}?v={version}",
        embed_iframe=False,
        require_admin=bool(settings.get("panel_admin_only")),
        handle_safe_area=True,
        config={"url": f"/local/gulavillan/app.html?v={version}"},
    )


async def _async_register_panel_script(hass: HomeAssistant) -> None:
    if hass.data.get(f"{DOMAIN}_panel_js"):
        return
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_URL, _PANEL_JS, cache_headers=False)]
        )
    except (RuntimeError, AttributeError, ValueError):
        _LOGGER.debug("Could not publish the panel script yet")
        return
    hass.data[f"{DOMAIN}_panel_js"] = True


def _async_register_services(hass: HomeAssistant) -> None:
    if hass.services.has_service(DOMAIN, SERVICE_UPDATE):
        return

    async def _update(call: ServiceCall) -> dict[str, str]:
        ref = str(call.data.get("ref") or "").strip() or None
        result = await async_update_frontend(hass, ref)
        entry = next(iter(hass.config_entries.async_entries(DOMAIN)), None)
        if entry is not None:
            await _async_register_panel(hass, entry)
        return result

    async def _rollback(call: ServiceCall) -> dict[str, str]:
        result = await async_rollback_frontend(hass)
        entry = next(iter(hass.config_entries.async_entries(DOMAIN)), None)
        if entry is not None:
            await _async_register_panel(hass, entry)
        return result

    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICE_UPDATE,
        _update,
        vol.Schema({vol.Optional("ref"): str}),
        SupportsResponse.OPTIONAL,
    )
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICE_ROLLBACK,
        _rollback,
        supports_response=SupportsResponse.OPTIONAL,
    )
