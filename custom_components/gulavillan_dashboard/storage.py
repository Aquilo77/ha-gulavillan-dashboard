"""Persist the dashboard layout in Home Assistant storage."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION
from .validation import LayoutError, default_layout, validate_layout

_LOGGER = logging.getLogger(__name__)


class LayoutStorage:
    """Load and save the shared dashboard layout."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            atomic_writes=True,
        )
        self.layout = default_layout()

    async def async_load(self) -> dict[str, Any]:
        """Load the layout, falling back to the built-in default."""
        stored = await self._store.async_load()
        if stored is None:
            self.layout = default_layout()
            return self.layout
        try:
            self.layout = validate_layout(stored)
        except LayoutError:
            _LOGGER.warning("Stored Gulavillan layout was invalid; using the default")
            self.layout = default_layout()
        return self.layout

    async def async_save(self, layout: dict[str, Any]) -> dict[str, Any]:
        """Validate and save a layout."""
        self.layout = validate_layout(layout)
        await self._store.async_save(self.layout)
        return self.layout
