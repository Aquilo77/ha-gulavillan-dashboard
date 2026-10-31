"""Config flow for the Gulavillan dashboard."""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.selector import BooleanSelector, IconSelector, TextSelector

from .const import DEFAULT_ICON, DEFAULT_TITLE, DOMAIN
from .panel import panel_settings

_ICON_RE = re.compile(r"^mdi:[a-z0-9-]+$")
_DEFAULTS = {
    "sidebar_title": DEFAULT_TITLE,
    "sidebar_icon": DEFAULT_ICON,
    "require_admin": False,
}


def _schema(defaults: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(
                "sidebar_title", default=defaults["sidebar_title"]
            ): TextSelector(),
            vol.Required(
                "sidebar_icon", default=defaults["sidebar_icon"]
            ): IconSelector(),
            vol.Required(
                "require_admin", default=defaults["require_admin"]
            ): BooleanSelector(),
        }
    )


def _clean(user_input: dict[str, Any]) -> tuple[dict[str, Any], dict[str, str]]:
    title = str(user_input.get("sidebar_title") or "").strip()
    icon = str(user_input.get("sidebar_icon") or "").strip()
    errors: dict[str, str] = {}
    if not title or len(title) > 40 or any(ord(ch) < 32 for ch in title):
        errors["sidebar_title"] = "invalid_title"
    if not _ICON_RE.fullmatch(icon):
        errors["sidebar_icon"] = "invalid_icon"
    return (
        {
            "sidebar_title": title[:40],
            "sidebar_icon": icon,
            "require_admin": bool(user_input.get("require_admin")),
        },
        errors,
    )


class GulavillanConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a single config entry that adds the sidebar panel."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> GulavillanOptionsFlow:
        """Return the options flow."""
        return GulavillanOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Ask for the sidebar title, icon and admin visibility."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        errors: dict[str, str] = {}
        defaults = dict(_DEFAULTS)
        if user_input is not None:
            cleaned, errors = _clean(user_input)
            if not errors:
                return self.async_create_entry(
                    title=cleaned["sidebar_title"], data=cleaned
                )
            defaults = cleaned

        return self.async_show_form(
            step_id="user", data_schema=_schema(defaults), errors=errors
        )


class GulavillanOptionsFlow(OptionsFlow):
    """Change the sidebar entry without touching the saved layout."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Edit sidebar settings."""
        errors: dict[str, str] = {}
        defaults = dict(panel_settings(self.config_entry))
        if user_input is not None:
            cleaned, errors = _clean(user_input)
            if not errors:
                self.hass.config_entries.async_update_entry(
                    self.config_entry, title=cleaned["sidebar_title"]
                )
                return self.async_create_entry(data=cleaned)
            defaults = cleaned

        return self.async_show_form(
            step_id="init", data_schema=_schema(defaults), errors=errors
        )
