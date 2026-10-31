"""Constants for the Gulavillan dashboard."""

from __future__ import annotations

import json
from pathlib import Path

DOMAIN = "gulavillan_dashboard"
PANEL_URL = "gulavillan"
PANEL_NAME = "gulavillan-dashboard"
STATIC_URL = "/api/gulavillan_dashboard/static"
STORAGE_KEY = f"{DOMAIN}.layout"
STORAGE_VERSION = 1
DEFAULT_TITLE = "Gulavillan"
DEFAULT_ICON = "mdi:home-variant"

DATA_STORE = f"{DOMAIN}_store"
DATA_STATIC = f"{DOMAIN}_static"
DATA_WS = f"{DOMAIN}_ws"

WIDGET_TYPES = (
    "entity",
    "light",
    "climate",
    "sensor",
    "button",
    "text",
    "clock",
    "image",
    "group",
    "markdown",
)


def integration_version() -> str:
    """Return the version declared in the manifest."""
    manifest_path = Path(__file__).parent / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    version = manifest.get("version")
    if not isinstance(version, str) or not version:
        return "0.0.0"
    return version
