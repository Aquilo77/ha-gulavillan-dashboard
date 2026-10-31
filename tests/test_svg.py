"""SVG sanitizer."""

from __future__ import annotations

import pytest

from custom_components.gulavillan_dashboard.svg import SvgError, clean_svg, entity_ids


def test_keeps_entity_bindings() -> None:
    """Live bindings survive the sanitizer."""
    svg = '<svg viewBox="0 0 10 10"><text data-entity="sensor.ute" data-widget="value">1</text></svg>'
    cleaned = clean_svg(svg)
    assert entity_ids(cleaned) == ["sensor.ute"]
    assert "data-widget" in cleaned


def test_strips_scripts_and_handlers() -> None:
    """AI output cannot carry scripts or click handlers."""
    svg = (
        "<svg><script>alert(1)</script>"
        '<rect onclick="alert(1)" href="javascript:alert(1)" />'
        "<foreignObject><div>x</div></foreignObject></svg>"
    )
    cleaned = clean_svg(svg)
    assert "script" not in cleaned.lower()
    assert "onclick" not in cleaned.lower()
    assert "javascript:" not in cleaned.lower()
    assert "foreignobject" not in cleaned.lower()


def test_rejects_non_svg() -> None:
    """Plain text is not a page."""
    with pytest.raises(SvgError):
        clean_svg("hello")
