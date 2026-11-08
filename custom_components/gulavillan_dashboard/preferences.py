"""User choices for the dashboard. Discovery must not overwrite them."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN
from .rules import CATEGORIES, SCHEMA_VERSION, empty_preferences

_STORAGE_KEY = f"{DOMAIN}.preferences"
_STORAGE_VERSION = 1


def _store(hass: HomeAssistant) -> Store:
    return Store(hass, _STORAGE_VERSION, _STORAGE_KEY)


async def async_load_preferences(hass: HomeAssistant) -> dict[str, Any]:
    """Load preferences, keeping any saved overrides."""
    stored = await _store(hass).async_load()
    base = empty_preferences()
    if not isinstance(stored, dict):
        return base
    overrides = stored.get("overrides") if isinstance(stored.get("overrides"), dict) else {}
    entities = overrides.get("entities") if isinstance(overrides, dict) else {}
    review = stored.get("review") if isinstance(stored.get("review"), dict) else {}
    discovery = stored.get("discovery") if isinstance(stored.get("discovery"), dict) else {}
    base["schemaVersion"] = SCHEMA_VERSION
    base["overrides"] = {"entities": dict(entities or {})}
    base["review"] = dict(review or {})
    if discovery:
        base["discovery"].update(discovery)
    return base


async def async_save_preferences(hass: HomeAssistant, preferences: dict[str, Any]) -> None:
    """Persist preferences atomically via Home Assistant storage."""
    preferences["schemaVersion"] = SCHEMA_VERSION
    await _store(hass).async_save(preferences)


async def async_update_entity_choice(
    hass: HomeAssistant,
    entity_id: str,
    *,
    hidden: bool | None = None,
    category: str | None = None,
    name: str | None = None,
    decision: str | None = None,
) -> dict[str, Any]:
    """Merge one entity choice into the saved overrides."""
    preferences = await async_load_preferences(hass)
    entities = preferences["overrides"]["entities"]
    current = dict(entities.get(entity_id) or {})
    if hidden is not None:
        current["hidden"] = hidden
    if category in CATEGORIES:
        current["category"] = category
    if isinstance(name, str):
        current["name"] = name.strip()
    if current:
        entities[entity_id] = current
    elif entity_id in entities:
        del entities[entity_id]
    if decision in {"accepted", "rejected"}:
        preferences["review"][entity_id] = decision
        if decision == "accepted":
            current = entities.get(entity_id) or {}
            current["hidden"] = False
            entities[entity_id] = current
        if decision == "rejected":
            current = entities.get(entity_id) or {}
            current["hidden"] = True
            entities[entity_id] = current
    await async_save_preferences(hass, preferences)
    return preferences
