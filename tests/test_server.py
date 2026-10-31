"""The page server on its own port."""

from __future__ import annotations

import aiohttp
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gulavillan_dashboard.const import DOMAIN


def _entry(port: int, pin: str = "") -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={"port": port, "pin": pin},
        title=f"Gulavillan ({port})",
    )


async def test_page_is_the_shipped_drawing(hass: HomeAssistant, socket_enabled: None) -> None:
    """The port serves the drawing from the integration, and it cannot be edited."""
    entry = _entry(18770)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    async with aiohttp.ClientSession() as session:
        async with session.get("http://127.0.0.1:18770/") as response:
            html = await response.text()
            assert response.status == 200
            assert "Redigera" not in html
        async with session.get("http://127.0.0.1:18770/api/design") as response:
            body = await response.json()
            assert "data-slot=\"outdoor\"" in body["svg"]
            assert "sensor." not in body["svg"]
            assert "data-widget=\"sparkline\"" in body["svg"]
            assert "data-action=\"toggle\"" in body["svg"]
        async with session.post("http://127.0.0.1:18770/api/design", json={"svg": "<svg></svg>"}) as response:
            assert response.status == 405
        async with session.get("http://127.0.0.1:18770/edit") as response:
            assert response.status == 404

    await hass.config_entries.async_unload(entry.entry_id)


async def test_pin_locks_the_api(hass: HomeAssistant, socket_enabled: None) -> None:
    """A PIN set in Home Assistant is required before the drawing can be read."""
    entry = _entry(18771, "4321")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    jar = aiohttp.CookieJar(unsafe=True)
    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        async with session.get("http://127.0.0.1:18771/api/design") as response:
            assert response.status == 401
        async with session.post("http://127.0.0.1:18771/api/login", json={"pin": "0000"}) as response:
            assert response.status == 401
        async with session.post("http://127.0.0.1:18771/api/login", json={"pin": "4321"}) as response:
            assert response.status == 200
        async with session.get("http://127.0.0.1:18771/api/design") as response:
            assert response.status == 200

    await hass.config_entries.async_unload(entry.entry_id)


async def test_home_groups_entities(hass: HomeAssistant, socket_enabled: None, entity_registry, floor_registry, area_registry) -> None:
    """The home endpoint is behind the PIN and groups a light by floor and area."""
    floor = floor_registry.async_create("Plan 1", level=1)
    room = area_registry.async_create("Rum A", floor_id=floor.floor_id)
    light = entity_registry.async_get_or_create("light", "test", "tak", suggested_object_id="tak")
    entity_registry.async_update_entity(light.entity_id, area_id=room.id)
    hass.states.async_set(light.entity_id, "on", {"friendly_name": "Tak"})

    entry = _entry(18772)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    async with aiohttp.ClientSession() as session:
        async with session.get("http://127.0.0.1:18772/theme.css") as response:
            css = await response.text()
            assert response.status == 200
            assert "--bg:" in css
        async with session.get("http://127.0.0.1:18772/") as response:
            html = await response.text()
            assert "Belysning" in html
            assert "#10151c" not in html
        async with session.get("http://127.0.0.1:18772/api/home") as response:
            body = await response.json()
            assert response.status == 200
            assert body["floors"][0]["name"] == "Plan 1"
            assert body["floors"][0]["areas"][0]["entities"][0]["entity_id"] == light.entity_id
            assert "belysning" in body["tabs"]

    await hass.config_entries.async_unload(entry.entry_id)


async def test_alarm_action_requires_page_pin(hass: HomeAssistant, socket_enabled: None, entity_registry) -> None:
    """Arming or disarming asks for the page PIN again."""
    alarm = entity_registry.async_get_or_create(
        "alarm_control_panel", "test", "panel", suggested_object_id="panel"
    )
    hass.states.async_set(alarm.entity_id, "disarmed", {"friendly_name": "Panel"})

    async def _handle(call) -> None:
        hass.data["alarm_calls"] = call.data

    hass.services.async_register("alarm_control_panel", "alarm_disarm", _handle)

    entry = _entry(18773, "4321")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    jar = aiohttp.CookieJar(unsafe=True)
    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        async with session.post(
            "http://127.0.0.1:18773/api/action",
            json={"action": "alarm", "entity_id": alarm.entity_id, "mode": "disarm", "pin": "4321"},
        ) as response:
            assert response.status == 401
        async with session.post("http://127.0.0.1:18773/api/login", json={"pin": "4321"}) as response:
            assert response.status == 200
        async with session.post(
            "http://127.0.0.1:18773/api/action",
            json={"action": "alarm", "entity_id": alarm.entity_id, "mode": "disarm"},
        ) as response:
            assert response.status == 403
        async with session.post(
            "http://127.0.0.1:18773/api/action",
            json={"action": "alarm", "entity_id": alarm.entity_id, "mode": "disarm", "pin": "4321"},
        ) as response:
            assert response.status == 200

    await hass.config_entries.async_unload(entry.entry_id)
