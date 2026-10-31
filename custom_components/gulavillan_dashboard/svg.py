"""Sanitize AI-authored SVG and read the live bindings inside it."""

from __future__ import annotations

import re

MAX_SVG_BYTES = 400_000
_ENTITY_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
_SCRIPT_BLOCK = re.compile(
    r"<\s*(script|foreignObject|iframe|object|embed|image|link|meta)\b[^>]*>.*?<\s*/\s*\1\s*>",
    re.IGNORECASE | re.DOTALL,
)
_SCRIPT_TAG = re.compile(
    r"<\s*(script|foreignObject|iframe|object|embed|image|link|meta)\b[^>]*\/?>",
    re.IGNORECASE,
)
_EVENT_ATTR = re.compile(
    r"""\s+on[a-z0-9_-]+\s*=\s*(['"]).*?\1""",
    re.IGNORECASE | re.DOTALL,
)
_BAD_URL = re.compile(
    r"""(?P<attr>href|xlink:href|src)\s*=\s*(?P<q>['"])\s*(?:javascript:|data:|https?:|//)[^'"]*(?P=q)""",
    re.IGNORECASE,
)
_BAD_STYLE = re.compile(r"expression\s*\(|javascript:|@import|url\s*\(", re.IGNORECASE)
_STYLE_ATTR = re.compile(
    r"""(?P<attr>style)\s*=\s*(?P<q>['"])(?P<body>.*?)(?P=q)""",
    re.IGNORECASE | re.DOTALL,
)
_ENTITY_ATTR = re.compile(
    r"""data-entity\s*=\s*(['"])(?P<id>[^'"]+)(['"])""",
    re.IGNORECASE,
)


class SvgError(ValueError):
    """The submitted drawing is not usable."""


def clean_svg(value: str) -> str:
    """Return a safe SVG document, or raise SvgError."""
    if not isinstance(value, str):
        raise SvgError("svg must be text")
    raw = value.strip()
    if not raw:
        raise SvgError("svg is empty")
    if len(raw.encode("utf-8")) > MAX_SVG_BYTES:
        raise SvgError("svg is too large")
    if "<svg" not in raw.lower():
        raise SvgError("svg must contain an svg element")

    cleaned = _SCRIPT_BLOCK.sub("", raw)
    cleaned = _SCRIPT_TAG.sub("", cleaned)
    cleaned = _EVENT_ATTR.sub("", cleaned)
    cleaned = _BAD_URL.sub("", cleaned)

    def _style(match: re.Match[str]) -> str:
        body = match.group("body")
        if _BAD_STYLE.search(body):
            return ""
        return match.group(0)

    cleaned = _STYLE_ATTR.sub(_style, cleaned)
    if "<svg" not in cleaned.lower():
        raise SvgError("svg must contain an svg element")
    return cleaned


def entity_ids(svg: str) -> list[str]:
    """Return the entity ids bound in the drawing, in order."""
    found: list[str] = []
    seen: set[str] = set()
    for match in _ENTITY_ATTR.finditer(svg):
        entity_id = match.group("id").strip()
        if _ENTITY_RE.fullmatch(entity_id) and entity_id not in seen:
            seen.add(entity_id)
            found.append(entity_id)
    return found
