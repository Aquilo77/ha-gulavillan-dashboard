"""Dashboard rules from the building template.

Domain and device class decide the category. A name is only a secondary hint.
User overrides outrank automatic suggestions. Power and energy are never mixed,
and a cost is not invented from a price.
"""

from __future__ import annotations

from typing import Any

SCHEMA_VERSION = 1

CATEGORIES = (
    "lighting",
    "climate",
    "energy",
    "security",
    "media",
    "vehicle",
    "weather",
    "presence",
    "family",
    "system",
)

# High-confidence kinds already verified by domain or device_class.
KIND_CATEGORY = {
    "light": "lighting",
    "climate": "climate",
    "temperature": "climate",
    "humidity": "climate",
    "illuminance": "climate",
    "power": "energy",
    "energy": "energy",
    "price": "energy",
    "door": "security",
    "window": "security",
    "opening": "security",
    "lock": "security",
    "smoke": "security",
    "moisture": "security",
    "alarm": "security",
    "camera": "security",
    "media": "media",
    "charger": "vehicle",
    "weather": "weather",
    "person": "presence",
    "tracker": "presence",
    "motion": "presence",
    "calendar": "family",
    "lunch": "family",
    "battery": "system",
    "update": "system",
}

CATEGORY_TAB = {
    "lighting": "belysning",
    "climate": "klimat",
    "energy": "energi",
    "security": "sakerhet",
    "media": "media",
    "vehicle": "energi",
    "weather": "klimat",
    "presence": "narvaro",
    "family": "familj",
    "system": "system",
}

DEFAULT_PREFERENCES: dict[str, Any] = {
    "schemaVersion": SCHEMA_VERSION,
    "discovery": {
        "enabled": True,
        "reconcileMinutes": 15,
        "autoAddCategories": list(CATEGORIES),
    },
    "overrides": {"entities": {}},
    "review": {},
}


def empty_preferences() -> dict[str, Any]:
    """Return a fresh preferences document. Overrides start empty."""
    return {
        "schemaVersion": SCHEMA_VERSION,
        "discovery": dict(DEFAULT_PREFERENCES["discovery"]),
        "overrides": {"entities": {}},
        "review": {},
    }


def power_watts(value: float, unit: str) -> float | None:
    """Convert a power reading to watts. Unknown units are left out of sums."""
    key = unit.strip().lower().replace(" ", "")
    if key == "w":
        return value
    if key == "kw":
        return value * 1000.0
    return None


def energy_kwh(value: float, unit: str) -> float | None:
    """Convert an energy reading to kWh. Power units are not accepted."""
    key = unit.strip().lower().replace(" ", "")
    if key == "kwh":
        return value
    if key == "wh":
        return value / 1000.0
    if key == "mwh":
        return value * 1000.0
    return None


def score(kind: str | None, *, from_user: bool = False) -> dict[str, str] | None:
    """Return category and confidence for a kind already chosen from HA metadata."""
    if not kind:
        return None
    category = KIND_CATEGORY.get(kind)
    if category is None:
        return {"category": "other", "confidence": "low", "reason": "Okänd typ"}
    if from_user:
        return {"category": category, "confidence": "user", "reason": "Valt av användaren"}
    return {"category": category, "confidence": "high", "reason": "Domän eller enhetsklass"}


def _number(state: str) -> float | None:
    try:
        return float(state)
    except (TypeError, ValueError):
        return None


def _alert(entity: dict[str, Any]) -> bool:
    state = str(entity.get("state") or "")
    kind = entity.get("kind")
    if state in {"unavailable", "unknown"}:
        return True
    if kind == "alarm":
        return state not in {"disarmed", "off"}
    if kind == "lock":
        return state in {"unlocked", "on", "open"}
    if kind in {"door", "window", "opening", "smoke", "moisture"}:
        return state in {"on", "open"}
    return False


def _entities(catalog: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        entity
        for floor in catalog.get("floors") or []
        for area in floor.get("areas") or []
        for entity in area.get("entities") or []
    ]


def _drop_entity(catalog: dict[str, Any], entity_id: str) -> None:
    for floor in catalog.get("floors") or []:
        kept_areas = []
        for area in floor.get("areas") or []:
            area["entities"] = [item for item in area.get("entities") or [] if item["entity_id"] != entity_id]
            if area["entities"]:
                kept_areas.append(area)
        floor["areas"] = kept_areas
    catalog["floors"] = [floor for floor in catalog.get("floors") or [] if floor.get("areas")]


def apply_preferences(catalog: dict[str, Any], preferences: dict[str, Any] | None) -> dict[str, Any]:
    """Apply saved choices without replacing them with a new discovery pass."""
    prefs = preferences or empty_preferences()
    overrides = (prefs.get("overrides") or {}).get("entities") or {}
    review_state = prefs.get("review") or {}
    auto = set(((prefs.get("discovery") or {}).get("autoAddCategories")) or CATEGORIES)

    for entity in list(_entities(catalog)):
        choice = overrides.get(entity["entity_id"]) or {}
        if choice.get("hidden") or review_state.get(entity["entity_id"]) == "rejected":
            _drop_entity(catalog, entity["entity_id"])
            continue
        if isinstance(choice.get("name"), str) and choice["name"].strip():
            entity["name"] = choice["name"].strip()
        if choice.get("category") in CATEGORIES:
            entity["category"] = choice["category"]
            entity["confidence"] = "user"
            entity["reason"] = "Valt av användaren"

    entities = _entities(catalog)
    review: list[dict[str, Any]] = []
    for item in catalog.get("unclassified") or []:
        decision = review_state.get(item["entity_id"])
        review.append({**item, "decision": decision or "pending"})

    homepage: list[dict[str, Any]] = []

    def add(card: dict[str, Any]) -> None:
        if card["category"] in auto:
            homepage.append(card)

    lights = [entity for entity in entities if entity.get("kind") == "light"]
    if lights:
        lit = sum(1 for entity in lights if entity.get("state") == "on")
        add({
            "id": "lighting",
            "category": "lighting",
            "title": "Belysning",
            "value": f"{lit} tända",
            "detail": f"{len(lights)} lampor",
            "tab": "belysning",
        })

    climate = [entity for entity in entities if entity.get("category") == "climate"]
    if climate:
        add({
            "id": "climate",
            "category": "climate",
            "title": "Klimat",
            "value": str(len(climate)),
            "detail": "Temperatursensorer och klimat",
            "tab": "klimat",
        })

    power_values: list[float] = []
    power_skipped = 0
    energy_values: list[float] = []
    for entity in entities:
        if entity.get("kind") not in {"power", "energy"}:
            continue
        number = _number(str(entity.get("state")))
        unit = str((entity.get("attributes") or {}).get("unit_of_measurement") or "")
        if number is None:
            continue
        if entity["kind"] == "power":
            watts = power_watts(number, unit)
            if watts is None:
                power_skipped += 1
            else:
                power_values.append(watts)
        else:
            kwh = energy_kwh(number, unit)
            if kwh is not None:
                energy_values.append(kwh)
    if power_values or energy_values:
        parts = []
        if power_values:
            parts.append(f"{round(sum(power_values))} W")
        if energy_values:
            parts.append(f"{round(sum(energy_values), 2)} kWh")
        detail = "Bara sensorer med enhet W/kW eller Wh/kWh"
        if power_skipped:
            detail += f", {power_skipped} utan känd enhet utelämnade"
        add({
            "id": "energy",
            "category": "energy",
            "title": "Energi",
            "value": ", ".join(parts),
            "detail": detail,
            "tab": "energi",
            "cost": None,
        })

    deviations = [
        entity for entity in entities
        if entity.get("category") == "security" and _alert(entity)
    ]
    if deviations:
        add({
            "id": "security",
            "category": "security",
            "title": "Säkerhet",
            "value": f"{len(deviations)} avvikelser",
            "detail": deviations[0].get("name") or "",
            "tab": "sakerhet",
        })

    playing = [
        entity for entity in entities
        if entity.get("kind") == "media" and entity.get("state") in {"playing", "paused", "buffering", "on"}
    ]
    if playing:
        add({
            "id": "media",
            "category": "media",
            "title": "Media",
            "value": str(len(playing)),
            "detail": playing[0].get("name") or "",
            "tab": "media",
        })

    chargers = [entity for entity in entities if entity.get("kind") == "charger"]
    if chargers:
        add({
            "id": "vehicle",
            "category": "vehicle",
            "title": "Laddning",
            "value": str(chargers[0].get("state") or ""),
            "detail": chargers[0].get("name") or "",
            "tab": "energi",
        })

    weather = [entity for entity in entities if entity.get("kind") == "weather"]
    if weather:
        add({
            "id": "weather",
            "category": "weather",
            "title": "Väder",
            "value": str(weather[0].get("state") or ""),
            "detail": weather[0].get("name") or "",
            "tab": "klimat",
        })

    catalog["review_queue"] = review
    catalog["homepage"] = homepage
    catalog["preferences"] = {
        "schemaVersion": prefs.get("schemaVersion", SCHEMA_VERSION),
        "discovery": prefs.get("discovery") or DEFAULT_PREFERENCES["discovery"],
    }
    return catalog
