"""Sidebar panel, websocket catalog and frontend files."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import DATA_PANELS
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gulavillan_dashboard.const import DOMAIN
from custom_components.gulavillan_dashboard.frontend import (
    async_rollback_frontend,
    async_update_frontend,
    frontend_dir,
    previous_dir,
)
from custom_components.gulavillan_dashboard.websocket import ws_alarm, ws_entities


def _entry(**options: object) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={"port": 8350, "pin": "4321"},
        options=options,
        title="Gulavillan",
    )


async def test_sidebar_panel_without_a_port(hass: HomeAssistant) -> None:
    """The page is a sidebar panel and does not open its own port."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    panel = hass.data[DATA_PANELS]["gulavillan"]
    assert panel.sidebar_title == "Gulavillan"
    assert panel.sidebar_icon == "mdi:home"
    assert panel.require_admin is False
    assert panel.component_name == "custom"
    assert (frontend_dir(hass) / "app.html").is_file()
    assert (frontend_dir(hass) / "version.json").is_file()
    await hass.config_entries.async_unload(entry.entry_id)


async def test_entities_command_and_alarm_pin(
    hass: HomeAssistant, entity_registry
) -> None:
    """The catalog is a websocket command, and the alarm still asks for the PIN."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    light = entity_registry.async_get_or_create("light", "test", "tak", suggested_object_id="tak")
    hass.states.async_set(light.entity_id, "on", {"friendly_name": "Tak"})

    class Conn:
        def __init__(self) -> None:
            self.result = None
            self.error = None

        def send_result(self, _id, result) -> None:
            self.result = result

        def send_error(self, _id, code, message) -> None:
            self.error = (code, message)

    catalog = Conn()
    ws_entities(hass, catalog, {"id": 1, "type": "gulavillan_dashboard/entities"})
    await hass.async_block_till_done()
    assert catalog.result["pin_required"] is True
    assert any(
        entity["entity_id"] == light.entity_id
        for floor in catalog.result["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
    )

    called: list[dict] = []

    async def _handle(call) -> None:
        called.append(dict(call.data))

    hass.services.async_register("alarm_control_panel", "alarm_disarm", _handle)
    alarm = entity_registry.async_get_or_create(
        "alarm_control_panel", "test", "panel", suggested_object_id="panel"
    )
    denied = Conn()
    ws_alarm(
        hass,
        denied,
        {"id": 2, "type": "gulavillan_dashboard/alarm", "entity_id": alarm.entity_id, "mode": "disarm", "pin": "0000"},
    )
    await hass.async_block_till_done()
    assert denied.error[0] == "unauthorized"
    assert called == []
    allowed = Conn()
    ws_alarm(
        hass,
        allowed,
        {"id": 3, "type": "gulavillan_dashboard/alarm", "entity_id": alarm.entity_id, "mode": "disarm", "pin": "4321"},
    )
    await hass.async_block_till_done()
    assert allowed.result == {"ok": True}
    await hass.config_entries.async_unload(entry.entry_id)


async def test_frontend_update_swaps_and_rollback_restores(
    hass: HomeAssistant, monkeypatch
) -> None:
    """A downloaded page replaces the files, and rollback puts the old one back."""
    entry = _entry()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    original = (frontend_dir(hass) / "app.html").read_text(encoding="utf-8")
    from custom_components.gulavillan_dashboard import frontend as frontend_mod

    async def _download(hass, ref, staging):
        (staging / "app.html").write_text("<title>Gulavillan</title>\ntheme.css\nNEW", encoding="utf-8")
        (staging / "theme.css").write_text(":root { --bg: #111; }", encoding="utf-8")
        (staging / "page.svg").write_text("<svg xmlns='http://www.w3.org/2000/svg'></svg>", encoding="utf-8")
        return "branch-test"

    monkeypatch.setattr(frontend_mod, "_download_ref", _download)
    result = await frontend_mod.async_update_frontend(hass, "branch-test")
    assert result["version"] == "branch-test"
    assert "NEW" in (frontend_dir(hass) / "app.html").read_text(encoding="utf-8")
    assert original in (previous_dir(hass) / "app.html").read_text(encoding="utf-8")

    restored = await async_rollback_frontend(hass)
    assert "NEW" not in (frontend_dir(hass) / "app.html").read_text(encoding="utf-8")
    assert Path(frontend_dir(hass) / "app.html").is_file()
    assert restored["version"]
    await hass.config_entries.async_unload(entry.entry_id)
