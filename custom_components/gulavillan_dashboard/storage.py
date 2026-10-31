"""Persist the SVG page in Home Assistant storage."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION
from .design import default_design
from .svg import SvgError, clean_svg

_LOGGER = logging.getLogger(__name__)


class DesignStorage:
    """Load and save the single SVG page."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self._store: Store[dict[str, Any]] = Store(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            atomic_writes=True,
        )
        self.svg = default_design()["svg"]

    async def async_load(self) -> str:
        """Load the saved drawing, or the built-in default."""
        stored = await self._store.async_load()
        if isinstance(stored, dict) and isinstance(stored.get("svg"), str):
            try:
                self.svg = clean_svg(stored["svg"])
                return self.svg
            except SvgError:
                _LOGGER.warning("Stored Gulavillan drawing was rejected; using the default")
        self.svg = default_design()["svg"]
        return self.svg

    async def async_save(self, svg: str) -> str:
        """Validate and save a drawing."""
        self.svg = clean_svg(svg)
        await self._store.async_save({"svg": self.svg})
        return self.svg
