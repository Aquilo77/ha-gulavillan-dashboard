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
            assert "sensor.temperatur_ute" in body["svg"]
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
