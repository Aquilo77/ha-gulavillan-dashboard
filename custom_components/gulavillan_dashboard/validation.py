"""Validate dashboard layouts stored by the integration.

The rules here are the contract the frontend sends. Invalid layouts are
rejected instead of being written to ``.storage``.
"""

from __future__ import annotations

import json
import re
from typing import Any

from .const import WIDGET_TYPES

_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_ICON_RE = re.compile(r"^mdi:[a-z0-9-]+$")
_ENTITY_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
_SLUG_RE = re.compile(r"^[a-z0-9_]+$")
_COLOR_RE = re.compile(r"^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent)$")
_LANGUAGES = {"sv", "en"}
_THEMES = {"auto", "light", "dark"}
_ALIGNS = {"left", "center", "right"}
_CLOCK_MODES = {"time", "date", "both"}
_IMAGE_SOURCES = {"entity", "url"}
_IMAGE_FITS = {"cover", "contain"}
_MAX_BYTES = 750_000

_WIDGET_CONFIG: dict[str, dict[str, Any]] = {
    "entity": {"entity_id": "", "name": "", "show_toggle": True},
    "light": {"entity_id": "", "name": "", "show_brightness": True},
    "climate": {"entity_id": "", "name": "", "step": 0.5},
    "sensor": {"entity_id": "", "name": "", "hours": 24, "decimals": 1},
    "button": {
        "label": "",
        "domain": "",
        "service": "",
        "data": "",
        "entity_id": "",
        "confirm": False,
    },
    "text": {"text": "", "align": "left"},
    "clock": {"mode": "both"},
    "image": {
        "source": "entity",
        "entity_id": "",
        "url": "",
        "fit": "cover",
        "refresh": 10,
    },
    "group": {"name": "", "entity_ids": [], "show_toggle": True},
    "markdown": {"content": "", "html": False},
}


class LayoutError(ValueError):
    """A layout failed validation."""


def default_layout() -> dict[str, Any]:
    """Return the layout used before the owner has saved one."""
    return {
        "version": 1,
        "language": "sv",
        "theme": "auto",
        "gridColumns": 24,
        "pages": [
            {
                "id": "hem",
                "title": "Hem",
                "icon": "mdi:home-variant",
                "widgets": [
                    {
                        "id": "klocka",
                        "type": "clock",
                        "x": 0,
                        "y": 0,
                        "w": 10,
                        "h": 6,
                        "style": {"fontSize": 64},
                        "config": {"mode": "both"},
                    },
                    {
                        "id": "titel",
                        "type": "text",
                        "x": 10,
                        "y": 0,
                        "w": 14,
                        "h": 2,
                        "style": {"fontSize": 40},
                        "config": {"text": "Gulavillan", "align": "left"},
                    },
                    {
                        "id": "valkomst",
                        "type": "markdown",
                        "x": 10,
                        "y": 2,
                        "w": 14,
                        "h": 4,
                        "style": {},
                        "config": {
                            "content": (
                                "Det här är en fri yta.\n\n"
                                "Tryck på pennan för att lägga till, dra och "
                                "ändra storlek på widgets. Layouten sparas i "
                                "Home Assistant och följer med mellan enheter."
                            ),
                            "html": False,
                        },
                    },
                ],
            }
        ],
    }


def validate_layout(value: Any) -> dict[str, Any]:
    """Return a normalized layout or raise LayoutError."""
    if not isinstance(value, dict):
        raise LayoutError("layout must be an object")

    version = value.get("version", 1)
    if isinstance(version, bool) or not isinstance(version, int) or version != 1:
        raise LayoutError("unsupported layout version")

    language = value.get("language", "sv")
    if language not in _LANGUAGES:
        raise LayoutError("language must be sv or en")

    theme = value.get("theme", "auto")
    if theme not in _THEMES:
        raise LayoutError("theme must be auto, light or dark")

    columns = _as_int(value.get("gridColumns", 24), "gridColumns", 8, 48)
    pages_in = value.get("pages")
    if not isinstance(pages_in, list) or not pages_in:
        raise LayoutError("layout needs at least one page")
    if len(pages_in) > 20:
        raise LayoutError("too many pages")

    seen_ids: set[str] = set()
    pages: list[dict[str, Any]] = []
    for index, page in enumerate(pages_in):
        pages.append(_page(page, index, columns, seen_ids))

    layout = {
        "version": 1,
        "language": language,
        "theme": theme,
        "gridColumns": columns,
        "pages": pages,
    }
    encoded = json.dumps(layout, ensure_ascii=False, separators=(",", ":"))
    if len(encoded.encode("utf-8")) > _MAX_BYTES:
        raise LayoutError("layout is too large")
    return layout


def _page(
    page: Any, index: int, columns: int, seen_ids: set[str]
) -> dict[str, Any]:
    if not isinstance(page, dict):
        raise LayoutError(f"page {index + 1} must be an object")
    page_id = _identifier(page.get("id"), f"page-{index + 1}")
    if page_id in seen_ids:
        raise LayoutError(f"duplicate id {page_id}")
    seen_ids.add(page_id)

    title = _text(page.get("title"), f"Sida {index + 1}", 80)
    icon = _optional_icon(page.get("icon"))
    widgets_in = page.get("widgets", [])
    if not isinstance(widgets_in, list):
        raise LayoutError(f"page {title} widgets must be a list")
    if len(widgets_in) > 80:
        raise LayoutError(f"page {title} has too many widgets")

    widgets = [
        _widget(widget, widget_index, columns, seen_ids)
        for widget_index, widget in enumerate(widgets_in)
    ]
    cleaned: dict[str, Any] = {
        "id": page_id,
        "title": title,
        "widgets": widgets,
    }
    if icon:
        cleaned["icon"] = icon
    return cleaned


def _widget(
    widget: Any, index: int, columns: int, seen_ids: set[str]
) -> dict[str, Any]:
    if not isinstance(widget, dict):
        raise LayoutError(f"widget {index + 1} must be an object")
    widget_id = _identifier(widget.get("id"), f"widget-{index + 1}")
    if widget_id in seen_ids:
        raise LayoutError(f"duplicate id {widget_id}")
    seen_ids.add(widget_id)

    widget_type = widget.get("type")
    if widget_type not in WIDGET_TYPES:
        raise LayoutError(f"unknown widget type {widget_type!r}")

    x = _as_int(widget.get("x", 0), "x", 0, columns - 1)
    y = _as_int(widget.get("y", 0), "y", 0, 200)
    w = _as_int(widget.get("w", 4), "w", 2, columns)
    h = _as_int(widget.get("h", 3), "h", 2, 40)
    if x + w > columns:
        w = columns - x
    if w < 2:
        raise LayoutError("widget does not fit the grid")

    return {
        "id": widget_id,
        "type": widget_type,
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "style": _style(widget.get("style")),
        "config": _config(widget_type, widget.get("config")),
    }


def _style(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise LayoutError("style must be an object")
    style: dict[str, Any] = {}
    if "color" in value and value["color"] not in (None, ""):
        style["color"] = _color(value["color"], "color")
    if "background" in value and value["background"] not in (None, ""):
        style["background"] = _color(value["background"], "background")
    if "fontSize" in value and value["fontSize"] not in (None, ""):
        style["fontSize"] = _as_int(value["fontSize"], "fontSize", 8, 120)
    if "borderRadius" in value and value["borderRadius"] not in (None, ""):
        style["borderRadius"] = _as_int(value["borderRadius"], "borderRadius", 0, 80)
    icon = _optional_icon(value.get("icon"))
    if icon:
        style["icon"] = icon
    return style


def _config(widget_type: str, value: Any) -> dict[str, Any]:
    if value is None:
        value = {}
    if not isinstance(value, dict):
        raise LayoutError("config must be an object")
    config = dict(_WIDGET_CONFIG[widget_type])

    if widget_type in {"entity", "light", "climate", "sensor", "image", "button"}:
        if "entity_id" in value:
            config["entity_id"] = _entity(value.get("entity_id"))
    if widget_type in {"entity", "light", "climate", "sensor", "group"}:
        if "name" in value:
            config["name"] = _text(value.get("name"), "", 80, allow_empty=True)
    if widget_type == "entity" and "show_toggle" in value:
        config["show_toggle"] = _bool(value.get("show_toggle"), "show_toggle")
    if widget_type == "light" and "show_brightness" in value:
        config["show_brightness"] = _bool(value.get("show_brightness"), "show_brightness")
    if widget_type == "climate" and "step" in value:
        config["step"] = _number(value.get("step"), "step", 0.1, 5)
    if widget_type == "sensor":
        if "hours" in value:
            config["hours"] = _as_int(value.get("hours"), "hours", 1, 168)
        if "decimals" in value:
            config["decimals"] = _as_int(value.get("decimals"), "decimals", 0, 3)
    if widget_type == "button":
        if "label" in value:
            config["label"] = _text(value.get("label"), "", 80, allow_empty=True)
        if "domain" in value:
            config["domain"] = _slug(value.get("domain"), allow_empty=True)
        if "service" in value:
            config["service"] = _slug(value.get("service"), allow_empty=True)
        if "data" in value:
            config["data"] = _json_object(value.get("data"))
        if "confirm" in value:
            config["confirm"] = _bool(value.get("confirm"), "confirm")
    if widget_type == "text":
        if "text" in value:
            config["text"] = _text(value.get("text"), "", 2000, allow_empty=True)
        if "align" in value:
            align = value.get("align")
            if align not in _ALIGNS:
                raise LayoutError("align must be left, center or right")
            config["align"] = align
    if widget_type == "clock" and "mode" in value:
        mode = value.get("mode")
        if mode not in _CLOCK_MODES:
            raise LayoutError("clock mode must be time, date or both")
        config["mode"] = mode
    if widget_type == "image":
        if "source" in value:
            source = value.get("source")
            if source not in _IMAGE_SOURCES:
                raise LayoutError("image source must be entity or url")
            config["source"] = source
        if "url" in value:
            config["url"] = _url(value.get("url"))
        if "fit" in value:
            fit = value.get("fit")
            if fit not in _IMAGE_FITS:
                raise LayoutError("image fit must be cover or contain")
            config["fit"] = fit
        if "refresh" in value:
            config["refresh"] = _as_int(value.get("refresh"), "refresh", 0, 3600)
    if widget_type == "group":
        if "entity_ids" in value:
            config["entity_ids"] = _entity_list(value.get("entity_ids"))
        if "show_toggle" in value:
            config["show_toggle"] = _bool(value.get("show_toggle"), "show_toggle")
    if widget_type == "markdown":
        if "content" in value:
            config["content"] = _text(value.get("content"), "", 20000, allow_empty=True)
        if "html" in value:
            config["html"] = _bool(value.get("html"), "html")
    return config


def _as_int(value: Any, key: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or isinstance(value, str):
        raise LayoutError(f"{key} must be an integer")
    if isinstance(value, float):
        if not value.is_integer():
            raise LayoutError(f"{key} must be an integer")
        value = int(value)
    if not isinstance(value, int):
        raise LayoutError(f"{key} must be an integer")
    if value < minimum or value > maximum:
        raise LayoutError(f"{key} is out of range")
    return value


def _number(value: Any, key: str, minimum: float, maximum: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise LayoutError(f"{key} must be a number")
    number = float(value)
    if number < minimum or number > maximum:
        raise LayoutError(f"{key} is out of range")
    return number


def _bool(value: Any, key: str) -> bool:
    if not isinstance(value, bool):
        raise LayoutError(f"{key} must be true or false")
    return value


def _identifier(value: Any, fallback: str) -> str:
    if value in (None, ""):
        if _ID_RE.fullmatch(fallback):
            return fallback
        raise LayoutError("missing id")
    if not isinstance(value, str) or not _ID_RE.fullmatch(value):
        raise LayoutError("id contains unsupported characters")
    return value


def _text(value: Any, fallback: str, limit: int, allow_empty: bool = False) -> str:
    if value is None:
        value = fallback
    if not isinstance(value, str):
        raise LayoutError("text must be a string")
    cleaned = "".join(ch for ch in value if ch == "\n" or ch == "\t" or ord(ch) >= 32)
    cleaned = cleaned.strip()
    if not cleaned and not allow_empty:
        cleaned = fallback.strip()
    if len(cleaned) > limit:
        raise LayoutError("text is too long")
    return cleaned


def _optional_icon(value: Any) -> str:
    if value in (None, ""):
        return ""
    if not isinstance(value, str) or not _ICON_RE.fullmatch(value):
        raise LayoutError("icon must look like mdi:home-variant")
    return value


def _color(value: Any, key: str) -> str:
    if not isinstance(value, str) or not _COLOR_RE.fullmatch(value):
        raise LayoutError(f"{key} must be a hex color or transparent")
    return value


def _entity(value: Any) -> str:
    if value in (None, ""):
        return ""
    if not isinstance(value, str) or not _ENTITY_RE.fullmatch(value):
        raise LayoutError("entity_id is not valid")
    return value


def _entity_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        raise LayoutError("entity_ids must be a list")
    if len(value) > 40:
        raise LayoutError("too many entities in a group")
    return [_entity(item) for item in value if item not in (None, "")]


def _slug(value: Any, allow_empty: bool = False) -> str:
    if value in (None, ""):
        if allow_empty:
            return ""
        raise LayoutError("expected a service name")
    if not isinstance(value, str) or not _SLUG_RE.fullmatch(value):
        raise LayoutError("service name contains unsupported characters")
    return value


def _url(value: Any) -> str:
    if value in (None, ""):
        return ""
    if not isinstance(value, str):
        raise LayoutError("url must be a string")
    cleaned = value.strip()
    if len(cleaned) > 500 or any(ch.isspace() for ch in cleaned):
        raise LayoutError("url is not valid")
    lowered = cleaned.lower()
    if lowered.startswith(("javascript:", "data:", "file:", "vbscript:")):
        raise LayoutError("url scheme is not allowed")
    if cleaned.startswith("//"):
        raise LayoutError("url is not allowed")
    if cleaned.startswith("/"):
        return cleaned
    if lowered.startswith(("https://", "http://")):
        return cleaned
    raise LayoutError("url must be a path or http(s) address")


def _json_object(value: Any) -> str:
    if value in (None, ""):
        return ""
    if not isinstance(value, str):
        raise LayoutError("service data must be a JSON string")
    if len(value) > 4000:
        raise LayoutError("service data is too long")
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as err:
        raise LayoutError("service data must be JSON") from err
    if not isinstance(parsed, dict):
        raise LayoutError("service data must be a JSON object")
    return json.dumps(parsed, ensure_ascii=False, separators=(",", ":"))
