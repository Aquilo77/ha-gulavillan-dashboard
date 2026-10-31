"""Port configuration."""

from __future__ import annotations

from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gulavillan_dashboard.const import DOMAIN


async def test_user_chooses_port(hass: HomeAssistant, socket_enabled: None) -> None:
    """The page port is chosen in the UI."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"port": 18765, "pin": ""},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["port"] == 18765
    assert result["title"] == "Gulavillan (18765)"
    await hass.async_block_till_done()


async def test_rejects_home_assistant_port(hass: HomeAssistant) -> None:
    """The page cannot take Home Assistant's own port."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"port": 8123, "pin": ""},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"]["port"] == "invalid_port"


async def test_options_change_port(hass: HomeAssistant, socket_enabled: None) -> None:
    """The port can be changed from the integration page."""
    entry = MockConfigEntry(domain=DOMAIN, data={"port": 18766, "pin": ""}, title="Gulavillan (18766)")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"port": 18767, "pin": "1234"},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.title == "Gulavillan (18767)"
    assert entry.options["port"] == 18767
    await hass.config_entries.async_unload(entry.entry_id)


async def test_options_store_entity_picks(hass: HomeAssistant, socket_enabled: None) -> None:
    """Villa bindings and light switches are chosen in the options flow."""
    entry = MockConfigEntry(domain=DOMAIN, data={"port": 18768, "pin": ""}, title="Gulavillan (18768)")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "port": 18768,
            "pin": "",
            "villa_outdoor": "sensor.ute",
            "light_switches": ["switch.lampa"],
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.options["villa_outdoor"] == "sensor.ute"
    assert entry.options["light_switches"] == ["switch.lampa"]
    await hass.config_entries.async_unload(entry.entry_id)
