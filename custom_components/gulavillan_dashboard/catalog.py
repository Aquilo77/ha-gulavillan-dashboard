"""Group Home Assistant entities for the page.

Nothing in here is a specific home. Floors, areas and names come from the
registries at runtime. Options may point at entity ids the owner picked in
the Home Assistant UI; those ids are stored on the config entry, not in git.
"""

from __future__ import annotations

import logging
import re
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import (
    area_registry as ar,
    device_registry as dr,
    entity_registry as er,
    floor_registry as fr,
)
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)

from .const import (
    MULTI_OPTIONS,
    OPT_CHARGERS,
    OPT_ENERGY,
    OPT_LIGHT_SWITCHES,
    OPT_POWER,
    OPT_PRICE,
    OPT_VILLA_CLIMATE,
    OPT_VILLA_DOOR,
    OPT_VILLA_HUMIDITY,
    OPT_VILLA_INDOOR,
    OPT_VILLA_LIGHTS,
    OPT_VILLA_OUTDOOR,
    SINGLE_OPTIONS,
)

OTHER = "\u00d6vrigt"

_OUTDOOR_RE = re.compile(
    r"ute|utom|out|outside|weather|v[a\u00e4]der|tr[a\u00e4]dg[a\u00e5]rd|balkong|fasad",
    re.IGNORECASE,
)
_DOOR_RE = re.compile(r"ytter|entre|door|d[\u00f6o]rr|port", re.IGNORECASE)
_POWER_RE = re.compile(
    r"effekt|power|grid|eln[a\u00e4]t|f[\u00f6o]rbruk",
    re.IGNORECASE,
)
_ENERGY_RE = re.compile(r"idag|today|daily|dygn|per_day", re.IGNORECASE)
_PRICE_RE = re.compile(
    r"(sek|eur|\u00f6re|ore|kr|usd|gbp|nok|dkk).{0,8}kwh|/\s*kwh",
    re.IGNORECASE,
)
_CHARGER_PLATFORMS = frozenset(
    {"zaptec", "easee", "wallbox", "go_e", "goe", "ocpp", "tesla_wall_connector"}
)
_CHARGER_TEXT = ("zaptec", "easee", "wallbox", "go-e", "goe", "alfen")
_ACTIVE_MEDIA = frozenset({"playing", "paused", "buffering", "on"})
_UNAVAILABLE_LIMIT = 40

PUBLIC_ATTRIBUTES = (
    "friendly_name",
    "unit_of_measurement",
    "device_class",
    "icon",
    "brightness",
    "supported_color_modes",
    "color_mode",
    "current_temperature",
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "hvac_action",
    "hvac_modes",
    "min_temp",
    "max_temp",
    "preset_mode",
    "preset_modes",
    "supported_features",
    "media_title",
    "media_artist",
    "volume_level",
    "is_volume_muted",
    "entity_picture",
    "code_format",
    "code_arm_required",
    "installed_version",
    "latest_version",
    "title",
    "in_progress",
)

_SENSOR_KIND = {
    "temperature": "temperature",
    "humidity": "humidity",
    "illuminance": "illuminance",
    "power": "power",
    "energy": "energy",
    "battery": "battery",
}
_BINARY_KIND = {
    "motion": "motion",
    "occupancy": "motion",
    "door": "door",
    "window": "window",
    "opening": "opening",
    "lock": "lock",
    "smoke": "smoke",
    "moisture": "moisture",
}
_DOMAIN_KIND = {
    "light": "light",
    "climate": "climate",
    "person": "person",
    "device_tracker": "tracker",
    "alarm_control_panel": "alarm",
    "camera": "camera",
    "media_player": "media",
    "lock": "lock",
    "update": "update",
    "calendar": "calendar",
    "weather": "weather",
}


def read_options(merged: dict[str, Any]) -> dict[str, Any]:
    """Normalize port, PIN and the optional entity picks."""
    options: dict[str, Any] = {}
    for key in SINGLE_OPTIONS:
        value = merged.get(key)
        if isinstance(value, str) and value.strip():
            options[key] = value.strip()
    for key in MULTI_OPTIONS:
        raw = merged.get(key) or []
        if isinstance(raw, str):
            raw = [raw]
        cleaned = [item.strip() for item in raw if isinstance(item, str) and item.strip()]
        if cleaned:
            options[key] = cleaned
    return options


def is_visible(entry: er.RegistryEntry | None) -> bool:
    """Skip disabled, hidden and config/diagnostic entities."""
    if entry is None:
        return False
    if entry.disabled_by is not None or entry.hidden_by is not None:
        return False
    return entry.entity_category is None


def public_attributes(state: State | None) -> dict[str, Any]:
    """Return attributes the page may show. Locations and tokens stay out."""
    if state is None:
        return {}
    attributes: dict[str, Any] = {}
    for key in PUBLIC_ATTRIBUTES:
        if key not in state.attributes:
            continue
        value = state.attributes[key]
        if key == "entity_picture" and isinstance(value, str):
            if value.startswith("/") or "token" in value.lower():
                continue
        if isinstance(value, (str, int, float, bool)) or value is None:
            attributes[key] = value
        elif isinstance(value, (list, tuple)) and all(
            isinstance(item, (str, int, float, bool)) or item is None for item in value
        ):
            attributes[key] = list(value)
    return attributes


def public_state(state: State) -> dict[str, Any]:
    """Return the state payload pushed to the browser."""
    changed = state.last_changed.isoformat() if state.last_changed else None
    return {
        "state": state.state,
        "last_changed": changed,
        "attributes": public_attributes(state),
    }


def _area_id(entry: er.RegistryEntry, devices: dr.DeviceRegistry) -> str | None:
    if entry.area_id:
        return entry.area_id
    if entry.device_id:
        device = devices.async_get(entry.device_id)
        if device is not None and device.area_id:
            return device.area_id
    return None


def _device(entry: er.RegistryEntry, devices: dr.DeviceRegistry) -> dr.DeviceEntry | None:
    if not entry.device_id:
        return None
    return devices.async_get(entry.device_id)


def _label(entry: er.RegistryEntry, state: State | None) -> str:
    parts = [entry.entity_id, entry.name or "", entry.original_name or ""]
    if state is not None:
        parts.append(str(state.attributes.get("friendly_name") or ""))
    return " ".join(parts).lower()


def _device_class(entry: er.RegistryEntry, state: State | None) -> str | None:
    if state is not None:
        value = state.attributes.get("device_class")
        if isinstance(value, str) and value:
            return value
    return entry.device_class or entry.original_device_class


def _unit(entry: er.RegistryEntry, state: State | None) -> str:
    if state is not None:
        value = state.attributes.get("unit_of_measurement")
        if isinstance(value, str):
            return value
    return entry.unit_of_measurement or ""


def _is_price(entry: er.RegistryEntry, state: State | None) -> bool:
    return _PRICE_RE.search(_unit(entry, state).replace(" ", "")) is not None


def _is_charger(
    entry: er.RegistryEntry,
    device: dr.DeviceEntry | None,
    options: dict[str, Any],
) -> bool:
    if entry.entity_id in set(options.get(OPT_CHARGERS) or []):
        return True
    if entry.platform in _CHARGER_PLATFORMS:
        return True
    if device is None:
        return False
    blob = f"{device.manufacturer or ''} {device.model or ''}".lower()
    return any(token in blob for token in _CHARGER_TEXT)


def classify(
    entry: er.RegistryEntry,
    state: State | None,
    options: dict[str, Any],
    device: dr.DeviceEntry | None,
) -> str | None:
    """Return the tab bucket for one visible entity, or None to skip it."""
    domain = entry.entity_id.split(".", 1)[0]
    if domain == "light":
        return "light"
    if entry.entity_id in set(options.get(OPT_LIGHT_SWITCHES) or []):
        return "light"
    if _is_charger(entry, device, options):
        return "charger"
    if domain == "sensor" and "skolmat" in (entry.platform or ""):
        return "lunch"
    if domain == "sensor" and _is_price(entry, state):
        return "price"
    if domain in _DOMAIN_KIND:
        return _DOMAIN_KIND[domain]
    device_class = _device_class(entry, state)
    if domain == "sensor":
        return _SENSOR_KIND.get(device_class or "")
    if domain == "binary_sensor":
        return _BINARY_KIND.get(device_class or "")
    return None


def _name(entry: er.RegistryEntry, state: State | None) -> str:
    if state is not None:
        friendly = state.attributes.get("friendly_name")
        if isinstance(friendly, str) and friendly.strip():
            return friendly.strip()
    for value in (entry.name, entry.original_name):
        if isinstance(value, str) and value.strip():
            return value.strip()
    return entry.entity_id.split(".", 1)[-1].replace("_", " ")


def _prefer(
    items: list[dict[str, Any]],
    pattern: re.Pattern[str] | None = None,
    *,
    require_pattern: bool = False,
) -> str | None:
    """Prefer an entity that belongs to an area, then an optional name hint."""
    ordered = sorted(items, key=lambda item: (item["area_id"] is None, item["name"].casefold()))
    if pattern is not None:
        named = [item for item in ordered if pattern.search(item["label"])]
        if named:
            pool = named
        elif require_pattern:
            return None
        else:
            pool = ordered
    else:
        pool = ordered
    in_area = [item for item in pool if item["area_id"]]
    chosen = in_area or pool
    return chosen[0]["entity_id"] if chosen else None


def _option_entity(options: dict[str, Any], key: str, known: dict[str, dict[str, Any]]) -> str | None:
    entity_id = options.get(key)
    if isinstance(entity_id, str) and entity_id in known:
        return entity_id
    return None


def _numeric(state: State | None) -> float | None:
    if state is None:
        return None
    try:
        return float(state.state)
    except (TypeError, ValueError):
        return None


def build_catalog(hass: HomeAssistant, merged: dict[str, Any]) -> dict[str, Any]:
    """Return floors, areas and the villa bindings for the current registries."""
    options = read_options(merged)
    entities = er.async_get(hass)
    devices = dr.async_get(hass)
    areas = ar.async_get(hass)
    floors = fr.async_get(hass)

    area_entries = {area.id: area for area in areas.areas.values()}
    floor_entries = {floor.floor_id: floor for floor in floors.floors.values()}

    grouped: dict[tuple[str | None, str | None], list[dict[str, Any]]] = {}
    known: dict[str, dict[str, Any]] = {}
    unavailable: list[dict[str, str]] = []
    unavailable_count = 0
    counts = {kind: 0 for kind in (
        "light", "climate", "temperature", "humidity", "illuminance", "person",
        "tracker", "motion", "door", "window", "opening", "lock", "smoke",
        "moisture", "alarm", "camera", "media", "power", "energy", "price",
        "charger", "battery", "update", "calendar", "lunch", "weather",
    )}
    media_active = 0

    for entry in entities.entities.values():
        if not is_visible(entry):
            continue
        state = hass.states.get(entry.entity_id)
        if state is None or state.state in ("unavailable", "unknown"):
            unavailable_count += 1
            if len(unavailable) < _UNAVAILABLE_LIMIT:
                unavailable.append({"entity_id": entry.entity_id, "name": _name(entry, state)})
        device = _device(entry, devices)
        kind = classify(entry, state, options, device)
        if kind is None:
            continue
        area_id = _area_id(entry, devices)
        area = area_entries.get(area_id) if area_id else None
        if area is None:
            area_id = None
            floor_id = None
        else:
            floor_id = area.floor_id if area.floor_id in floor_entries else None
        record = {
            "entity_id": entry.entity_id,
            "name": _name(entry, state),
            "domain": entry.entity_id.split(".", 1)[0],
            "kind": kind,
            "device_class": _device_class(entry, state),
            "area_id": area_id,
            "state": state.state if state is not None else "unavailable",
            "last_changed": state.last_changed.isoformat() if state is not None and state.last_changed else None,
            "attributes": public_attributes(state),
            "device_name": device.name if device is not None else None,
            "label": _label(entry, state),
            "platform": entry.platform,
        }
        grouped.setdefault((floor_id, area_id), []).append(record)
        known[entry.entity_id] = record
        counts[kind] = counts.get(kind, 0) + 1
        if kind == "media" and record["state"] in _ACTIVE_MEDIA:
            media_active += 1

    floor_ids = {floor_id for floor_id, _area in grouped}
    ordered_floors = sorted(
        floor_ids,
        key=lambda floor_id: (
            floor_id is None,
            floor_entries[floor_id].level is None if floor_id in floor_entries else True,
            floor_entries[floor_id].level or 0 if floor_id in floor_entries else 0,
            floor_entries[floor_id].name.casefold() if floor_id in floor_entries else "",
        ),
    )
    floors_out: list[dict[str, Any]] = []
    for floor_id in ordered_floors:
        area_ids = {area_id for fid, area_id in grouped if fid == floor_id}
        ordered_areas = sorted(
            area_ids,
            key=lambda area_id: (
                area_id is None,
                area_entries[area_id].name.casefold() if area_id in area_entries else "",
            ),
        )
        areas_out = []
        for area_id in ordered_areas:
            items = grouped.get((floor_id, area_id), [])
            items.sort(key=lambda item: item["name"].casefold())
            public_items = [{key: value for key, value in item.items() if key != "label"} for item in items]
            area_name = area_entries[area_id].name if area_id in area_entries else OTHER
            areas_out.append({"id": area_id, "name": area_name, "entities": public_items})
        floor_name = floor_entries[floor_id].name if floor_id in floor_entries else OTHER
        level = floor_entries[floor_id].level if floor_id in floor_entries else None
        floors_out.append({"id": floor_id, "name": floor_name, "level": level, "areas": areas_out})

    def records(kind: str) -> list[dict[str, Any]]:
        return [item for item in known.values() if item["kind"] == kind]

    outdoor = _option_entity(options, OPT_VILLA_OUTDOOR, known) or _prefer(
        records("temperature"), _OUTDOOR_RE, require_pattern=True
    )
    if outdoor is None:
        outdoor = _prefer(records("weather"))
        outdoor_kind = "weather" if outdoor else None
    elif known[outdoor]["kind"] == "weather":
        outdoor_kind = "weather"
    else:
        outdoor_kind = known[outdoor]["kind"]

    indoor = _option_entity(options, OPT_VILLA_INDOOR, known)
    if indoor is None:
        linked = [
            area.temperature_entity_id
            for area in sorted(area_entries.values(), key=lambda area: area.name.casefold())
            if area.temperature_entity_id
            and area.temperature_entity_id in known
            and area.temperature_entity_id != outdoor
        ]
        indoor = linked[0] if linked else _prefer(
            [item for item in records("temperature") if item["entity_id"] != outdoor]
        )
    humidity = _option_entity(options, OPT_VILLA_HUMIDITY, known)
    if humidity is None:
        linked_humidity = [
            area.humidity_entity_id
            for area in sorted(area_entries.values(), key=lambda area: area.name.casefold())
            if area.humidity_entity_id and area.humidity_entity_id in known
        ]
        humidity = linked_humidity[0] if linked_humidity else _prefer(records("humidity"))
    climate = _option_entity(options, OPT_VILLA_CLIMATE, known) or _prefer(records("climate"))
    door = _option_entity(options, OPT_VILLA_DOOR, known) or _prefer(records("door"), _DOOR_RE)
    if options.get(OPT_VILLA_LIGHTS):
        lights = [entity_id for entity_id in options[OPT_VILLA_LIGHTS] if entity_id in known and known[entity_id]["kind"] == "light"]
    else:
        domain_lights = [item for item in records("light") if item["domain"] == "light"]
        domain_lights.sort(key=lambda item: (item["area_id"] is None, item["name"].casefold()))
        in_area = [item for item in domain_lights if item["area_id"]]
        lights = [item["entity_id"] for item in (in_area or domain_lights)]

    power = _option_entity(options, OPT_POWER, known)
    if power is None:
        named = [item for item in records("power") if _POWER_RE.search(item["label"])]
        power = _prefer(named) if named else None
        if power is None and records("power"):
            power = max(records("power"), key=lambda item: abs(_numeric(hass.states.get(item["entity_id"])) or 0))["entity_id"]
    energy = _option_entity(options, OPT_ENERGY, known)
    if energy is None:
        meters = [item for item in records("energy") if item["platform"] == "utility_meter" or _ENERGY_RE.search(item["label"])]
        energy = _prefer(meters) if meters else None
    price = _option_entity(options, OPT_PRICE, known) or _prefer(records("price"))
    weather = _prefer(records("weather"))

    counts["media_active"] = media_active
    tabs = ["hem"]
    if counts["light"]:
        tabs.append("belysning")
    if any(counts[kind] for kind in ("climate", "temperature", "humidity", "illuminance", "weather")):
        tabs.append("klimat")
    if any(counts[kind] for kind in ("person", "tracker", "motion")):
        tabs.append("narvaro")
    if any(counts[kind] for kind in ("alarm", "door", "window", "opening", "lock", "smoke", "moisture", "camera")):
        tabs.append("sakerhet")
    if any(counts[kind] for kind in ("power", "energy", "price", "charger")):
        tabs.append("energi")
    if media_active:
        tabs.append("media")
    if counts["battery"] or counts["update"] or unavailable_count:
        tabs.append("system")
    if counts["calendar"] or counts["lunch"]:
        tabs.append("familj")

    return {
        "floors": floors_out,
        "tabs": tabs,
        "unavailable_count": unavailable_count,
        "unavailable": unavailable,
        "focus": {"power": power, "energy": energy, "price": price, "weather": weather},
        "villa": {
            "outdoor": outdoor,
            "outdoor_kind": outdoor_kind if outdoor else None,
            "indoor": indoor,
            "humidity": humidity,
            "climate": climate,
            "door": door,
            "weather": weather,
            "lights": lights,
        },
    }


async def async_build_catalog(hass: HomeAssistant, merged: dict[str, Any]) -> dict[str, Any]:
    """Build the catalog and attach the next two days of calendar events."""
    catalog = build_catalog(hass, merged)
    await _attach_calendar(hass, catalog)
    return catalog


async def _attach_calendar(hass: HomeAssistant, catalog: dict[str, Any]) -> None:
    calendars = [
        entity
        for floor in catalog["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
        if entity["kind"] == "calendar"
    ]
    for entity in calendars:
        entity["events"] = []
    services = hass.services.async_services().get("calendar") or {}
    if not calendars or "get_events" not in services:
        return
    try:
        result = await hass.services.async_call(
            "calendar",
            "get_events",
            {
                "entity_id": [entity["entity_id"] for entity in calendars],
                "end_date_time": dt_util.now() + timedelta(hours=48),
            },
            blocking=True,
            return_response=True,
        )
    except Exception:  # noqa: BLE001 - calendars are optional
        _LOGGER.debug("Calendar events are not available")
        return
    if not isinstance(result, dict):
        return
    for entity in calendars:
        payload = result.get(entity["entity_id"])
        events = payload.get("events") if isinstance(payload, dict) else None
        if not isinstance(events, list):
            continue
        slim = []
        for event in events[:8]:
            if not isinstance(event, dict):
                continue
            slim.append(
                {
                    "summary": str(event.get("summary") or ""),
                    "start": event.get("start"),
                    "end": event.get("end"),
                }
            )
        entity["events"] = slim
