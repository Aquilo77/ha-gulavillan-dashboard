"""Layout validation, independent of a running Home Assistant."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from custom_components.gulavillan_dashboard.validation import (
    LayoutError,
    default_layout,
    validate_layout,
)

ROOT = Path(__file__).parents[1]


def test_default_layout_is_swedish() -> None:
    """The first-run layout is valid and Swedish."""
    layout = validate_layout(default_layout())
    assert layout["language"] == "sv"
    assert layout["theme"] == "auto"
    assert layout["pages"][0]["title"] == "Hem"
    assert {widget["type"] for widget in layout["pages"][0]["widgets"]} >= {
        "clock",
        "text",
        "markdown",
    }


def test_example_layout_is_valid() -> None:
    """The importable example matches the storage contract."""
    example = json.loads((ROOT / "examples" / "hem.json").read_text(encoding="utf-8"))
    layout = validate_layout(example)
    assert len(layout["pages"]) == 2
    assert layout["pages"][0]["widgets"][3]["type"] == "light"


def test_rejects_scripts_and_bad_urls() -> None:
    """Service data and image URLs cannot carry code."""
    layout = default_layout()
    button = {
        "id": "knapp",
        "type": "button",
        "x": 0,
        "y": 8,
        "w": 4,
        "h": 3,
        "style": {},
        "config": {
            "label": "Test",
            "domain": "light",
            "service": "turn_on",
            "entity_id": "light.kok",
            "data": '{"brightness": 20}',
            "confirm": False,
        },
    }
    layout["pages"][0]["widgets"].append(button)
    saved = validate_layout(layout)
    stored = next(widget for widget in saved["pages"][0]["widgets"] if widget["id"] == "knapp")
    assert stored["config"]["data"] == '{"brightness":20}'

    button["config"]["data"] = "[]"
    with pytest.raises(LayoutError):
        validate_layout(layout)

    image = {
        "id": "bild",
        "type": "image",
        "x": 4,
        "y": 8,
        "w": 4,
        "h": 3,
        "style": {},
        "config": {"source": "url", "url": "javascript:alert(1)"},
    }
    layout["pages"][0]["widgets"] = [image]
    with pytest.raises(LayoutError):
        validate_layout(layout)


def test_rejects_unknown_shape() -> None:
    """A page list is required."""
    with pytest.raises(LayoutError):
        validate_layout({"version": 1, "pages": []})
    with pytest.raises(LayoutError):
        validate_layout({"version": 2, "pages": [{"id": "a", "title": "A", "widgets": []}]})
