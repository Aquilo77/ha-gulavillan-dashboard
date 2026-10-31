"""Entity grouping for the tabs. Names here are fixtures, not a real home."""

from __future__ import annotations

from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceRegistry
from homeassistant.helpers.entity_registry import EntityRegistry
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gulavillan_dashboard.catalog import build_catalog


def _entity(
    hass: HomeAssistant,
    registry: EntityRegistry,
    domain: str,
    platform: str,
    unique_id: str,
    object_id: str,
    state: str,
    attributes: dict | None = None,
    *,
    area_id: str | None = None,
    **kwargs: object,
) -> str:
    entry = registry.async_get_or_create(
        domain,
        platform,
        unique_id,
        suggested_object_id=object_id,
        **kwargs,
    )
    if area_id:
        registry.async_update_entity(entry.entity_id, area_id=area_id)
    hass.states.async_set(entry.entity_id, state, attributes or {})
    return entry.entity_id


async def test_groups_by_floor_then_area_and_skips_hidden(
    hass: HomeAssistant,
    entity_registry: EntityRegistry,
    area_registry,
    floor_registry,
) -> None:
    """Visible entities land on their floor and area. The rest stay out."""
    lower = floor_registry.async_create("Plan 1", level=1)
    upper = floor_registry.async_create("Plan 2", level=2)
    room_a = area_registry.async_create("Rum A", floor_id=lower.floor_id)
    room_b = area_registry.async_create("Rum B", floor_id=upper.floor_id)

    light = _entity(
        hass, entity_registry, "light", "test", "a", "lampa_a", "on",
        {"friendly_name": "Tak A", "brightness": 120}, area_id=room_a.id,
    )
    _entity(
        hass, entity_registry, "sensor", "test", "temp-b", "temp_b", "21.5",
        {"friendly_name": "Inne B", "device_class": "temperature", "unit_of_measurement": "\u00b0C"},
        area_id=room_b.id, original_device_class="temperature",
    )
    _entity(
        hass, entity_registry, "switch", "test", "loose", "loose_switch", "on",
        {"friendly_name": "L\u00f6s"},
    )
    _entity(
        hass, entity_registry, "light", "test", "hidden", "hidden_light", "on",
        hidden_by=er.RegistryEntryHider.USER,
    )
    _entity(
        hass, entity_registry, "light", "test", "disabled", "disabled_light", "on",
        disabled_by=er.RegistryEntryDisabler.USER,
    )
    _entity(
        hass, entity_registry, "sensor", "test", "diag", "diag_sensor", "1",
        entity_category=EntityCategory.DIAGNOSTIC,
    )

    catalog = build_catalog(hass, {})
    floors = {floor["name"]: floor for floor in catalog["floors"]}
    assert list(floors) == ["Plan 1", "Plan 2"]
    assert floors["Plan 1"]["areas"][0]["name"] == "Rum A"
    assert floors["Plan 1"]["areas"][0]["entities"][0]["entity_id"] == light
    assert floors["Plan 2"]["areas"][0]["entities"][0]["kind"] == "temperature"
    assert "belysning" in catalog["tabs"]
    assert "klimat" in catalog["tabs"]
    assert "hidden_light" not in str(catalog)
    assert "disabled_light" not in str(catalog)
    assert "diag_sensor" not in str(catalog)
    # A plain switch is not a light until the owner says so.
    assert all(
        entity["kind"] != "light" or entity["domain"] == "light"
        for floor in catalog["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
    )


async def test_entities_without_area_go_to_ovrigt(
    hass: HomeAssistant,
    entity_registry: EntityRegistry,
    device_registry: DeviceRegistry,
    area_registry,
    floor_registry,
) -> None:
    """No area means the \u00d6vrigt group. A device area still counts."""
    floor = floor_registry.async_create("Plan 1", level=1)
    room = area_registry.async_create("Rum A", floor_id=floor.floor_id)
    config = MockConfigEntry(domain="test", unique_id="lamp")
    config.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=config.entry_id,
        identifiers={("test", "lamp-device")},
        name="Device lamp",
    )
    device_registry.async_update_device(device.id, area_id=room.id)
    via_device = _entity(
        hass, entity_registry, "light", "test", "via", "via_device", "off",
        {"friendly_name": "Via device"}, device_id=device.id,
    )
    loose = _entity(
        hass, entity_registry, "light", "test", "loose-light", "loose_light", "on",
        {"friendly_name": "Utan omrade"},
    )

    catalog = build_catalog(hass, {})
    placed = {
        entity["entity_id"]: (floor["name"], area["name"])
        for floor in catalog["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
    }
    assert placed[via_device] == ("Plan 1", "Rum A")
    assert placed[loose][0] == "\u00d6vrigt"
    assert placed[loose][1] == "\u00d6vrigt"


async def test_switches_become_lights_only_when_selected(
    hass: HomeAssistant, entity_registry: EntityRegistry
) -> None:
    """TellStick-style switches stay switches until the options flow includes them."""
    switch_id = _entity(
        hass, entity_registry, "switch", "tellstick", "sw", "old_switch", "on",
        {"friendly_name": "Old switch"},
    )
    hidden = build_catalog(hass, {})
    assert "belysning" not in hidden["tabs"]

    shown = build_catalog(hass, {"light_switches": [switch_id]})
    kinds = [
        entity["kind"]
        for floor in shown["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
    ]
    assert kinds == ["light"]
    assert "belysning" in shown["tabs"]


async def test_villa_prefers_area_and_options_override(
    hass: HomeAssistant,
    entity_registry: EntityRegistry,
    area_registry,
    floor_registry,
) -> None:
    """Outdoor prefers a sensor in an area. An option replaces that guess."""
    floor = floor_registry.async_create("Plan 1", level=1)
    room = area_registry.async_create("Rum A", floor_id=floor.floor_id)
    outside_loose = _entity(
        hass, entity_registry, "sensor", "test", "out-loose", "ute_loose", "1",
        {"friendly_name": "Ute loose", "device_class": "temperature", "unit_of_measurement": "\u00b0C"},
        original_device_class="temperature",
    )
    outside_area = _entity(
        hass, entity_registry, "sensor", "test", "out-area", "ute_area", "2",
        {"friendly_name": "Ute area", "device_class": "temperature", "unit_of_measurement": "\u00b0C"},
        area_id=room.id, original_device_class="temperature",
    )
    inside = _entity(
        hass, entity_registry, "sensor", "test", "in-area", "inne_area", "21",
        {"friendly_name": "Inne", "device_class": "temperature", "unit_of_measurement": "\u00b0C"},
        area_id=room.id, original_device_class="temperature",
    )
    humidity = _entity(
        hass, entity_registry, "sensor", "test", "hum", "fukt", "40",
        {"friendly_name": "Fukt", "device_class": "humidity", "unit_of_measurement": "%"},
        original_device_class="humidity",
    )
    hass.states.async_set(
        humidity,
        "40",
        {"friendly_name": "Fukt", "device_class": "humidity", "unit_of_measurement": "%"},
    )
    area_registry.async_update(room.id, humidity_entity_id=humidity)

    catalog = build_catalog(hass, {})
    assert catalog["villa"]["outdoor"] == outside_area
    assert catalog["villa"]["indoor"] == inside
    assert catalog["villa"]["humidity"] == humidity

    override = build_catalog(hass, {"villa_outdoor": outside_loose})
    assert override["villa"]["outdoor"] == outside_loose


async def test_price_charger_lunch_and_empty_tabs(
    hass: HomeAssistant,
    entity_registry: EntityRegistry,
    device_registry: DeviceRegistry,
) -> None:
    """Price, charger and school lunch are detected without storing ids in git."""
    _entity(
        hass, entity_registry, "sensor", "price", "now", "elpris", "1.4",
        {"friendly_name": "Elpris", "unit_of_measurement": "SEK/kWh"},
        unit_of_measurement="SEK/kWh",
    )
    config = MockConfigEntry(domain="zaptec", unique_id="box")
    config.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=config.entry_id,
        identifiers={("zaptec", "box")},
        manufacturer="Zaptec",
        name="Charger",
    )
    _entity(
        hass, entity_registry, "sensor", "zaptec", "status", "charger_status", "charging",
        {"friendly_name": "Status"}, device_id=device.id,
    )
    _entity(
        hass, entity_registry, "sensor", "skolmat", "lunch", "lunch", "Pasta",
        {"friendly_name": "Lunch"},
    )
    _entity(
        hass, entity_registry, "media_player", "test", "player", "player", "off",
        {"friendly_name": "Player"},
    )
    _entity(
        hass, entity_registry, "sensor", "test", "cell", "battery", "12",
        {"friendly_name": "Cell", "device_class": "battery", "unit_of_measurement": "%"},
        original_device_class="battery",
    )

    catalog = build_catalog(hass, {})
    kinds = {
        entity["kind"]
        for floor in catalog["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
    }
    assert {"price", "charger", "lunch", "battery"} <= kinds
    assert "energi" in catalog["tabs"]
    assert "familj" in catalog["tabs"]
    assert "media" not in catalog["tabs"]
    assert "system" in catalog["tabs"]
    assert catalog["focus"]["price"]
