"""Storage and websocket layout commands."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gulavillan_dashboard.const import DOMAIN, PANEL_URL
from custom_components.gulavillan_dashboard.validation import default_layout


def _entry() -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={
            "sidebar_title": "Gulavillan",
            "sidebar_icon": "mdi:home-variant",
            "require_admin": False,
        },
    )


async def test_setup_registers_panel(hass: HomeAssistant) -> None:
    """Setting up the entry adds the sidebar panel."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    panel = hass.data["frontend_panels"][PANEL_URL]
    assert panel.sidebar_title == "Gulavillan"
    assert panel.config["_panel_custom"]["name"] == "gulavillan-dashboard"
    assert "gulavillan-panel.js" in panel.config["_panel_custom"]["module_url"]

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert PANEL_URL not in hass.data["frontend_panels"]


async def test_layout_roundtrip(hass: HomeAssistant, hass_ws_client) -> None:
    """Layouts are stored in Home Assistant and returned to every client."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "gulavillan_dashboard/layout/get"})
    message = await client.receive_json()
    assert message["success"] is True
    assert message["result"]["language"] == "sv"

    layout = default_layout()
    layout["theme"] = "dark"
    layout["pages"][0]["title"] = "Kväll"
    await client.send_json({"id": 2, "type": "gulavillan_dashboard/layout/save", "layout": layout})
    message = await client.receive_json()
    assert message["success"] is True
    assert message["result"]["theme"] == "dark"

    await client.send_json({"id": 3, "type": "gulavillan_dashboard/layout/get"})
    message = await client.receive_json()
    assert message["result"]["pages"][0]["title"] == "Kväll"


async def test_save_rejects_invalid_layout(hass: HomeAssistant, hass_ws_client) -> None:
    """Broken JSON never replaces the stored layout."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    client = await hass_ws_client(hass)

    await client.send_json({"id": 1, "type": "gulavillan_dashboard/layout/save", "layout": {"version": 1}})
    message = await client.receive_json()
    assert message["success"] is False


async def test_save_requires_admin(
    hass: HomeAssistant, hass_ws_client, hass_read_only_access_token: str
) -> None:
    """Viewers can read the layout. Only administrators can save it."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json({"id": 1, "type": "gulavillan_dashboard/layout/get"})
    message = await client.receive_json()
    assert message["success"] is True

    await client.send_json(
        {"id": 2, "type": "gulavillan_dashboard/layout/save", "layout": message["result"]}
    )
    message = await client.receive_json()
    assert message["success"] is False
    assert message["error"]["code"] == "unauthorized"
