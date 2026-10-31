"""Register the sidebar panel and the static frontend bundle."""

from __future__ import annotations

import logging
import re
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_panel_exists, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    DATA_STATIC,
    DEFAULT_ICON,
    DEFAULT_TITLE,
    DOMAIN,
    PANEL_NAME,
    PANEL_URL,
    STATIC_URL,
    integration_version,
)

_LOGGER = logging.getLogger(__name__)
_ICON_RE = re.compile(r"^mdi:[a-z0-9-]+$")
_FRONTEND = Path(__file__).parent / "frontend"


def panel_settings(entry: ConfigEntry) -> dict[str, object]:
    """Return the sidebar settings stored on the config entry."""
    merged = {**entry.data, **entry.options}
    title = str(merged.get("sidebar_title") or DEFAULT_TITLE).strip() or DEFAULT_TITLE
    icon = str(merged.get("sidebar_icon") or DEFAULT_ICON).strip()
    if not _ICON_RE.fullmatch(icon):
        icon = DEFAULT_ICON
    return {
        "sidebar_title": title[:40],
        "sidebar_icon": icon,
        "require_admin": bool(merged.get("require_admin", False)),
    }


async def async_register_frontend(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Serve the bundle and add the sidebar entry."""
    bundle = _FRONTEND / "gulavillan-panel.js"
    if not bundle.is_file():
        _LOGGER.error("Gulavillan frontend bundle is missing at %s", bundle)
        return

    await _async_register_static(hass)
    settings = panel_settings(entry)
    if async_panel_exists(hass, PANEL_URL):
        async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)

    version = integration_version()
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=PANEL_NAME,
        sidebar_title=str(settings["sidebar_title"]),
        sidebar_icon=str(settings["sidebar_icon"]),
        module_url=f"{STATIC_URL}/gulavillan-panel.js?v={version}",
        embed_iframe=False,
        trust_external=False,
        require_admin=bool(settings["require_admin"]),
        config={
            "domain": DOMAIN,
            "version": version,
            "sidebar_title": settings["sidebar_title"],
        },
    )


def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Remove the sidebar entry. Static files stay registered."""
    async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)


async def _async_register_static(hass: HomeAssistant) -> None:
    if hass.data.get(DATA_STATIC):
        return
    http = getattr(hass, "http", None)
    if http is None:
        _LOGGER.error(
            "The HTTP integration is not available, so the Gulavillan panel cannot be served"
        )
        return
    await http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, str(_FRONTEND), False)]
    )
    hass.data[DATA_STATIC] = True
