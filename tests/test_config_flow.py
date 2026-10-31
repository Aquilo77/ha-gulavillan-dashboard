"""Config flow and options flow."""

from __future__ import annotations

from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.gulavillan_dashboard.const import DOMAIN, PANEL_URL


async def test_user_flow_creates_entry(hass: HomeAssistant) -> None:
    """A user can add the integration from the UI."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "sidebar_title": "Gulavillan",
            "sidebar_icon": "mdi:home-variant",
            "require_admin": False,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Gulavillan"
    assert result["data"]["sidebar_icon"] == "mdi:home-variant"
    await hass.async_block_till_done()
    assert PANEL_URL in hass.data["frontend_panels"]


async def test_invalid_icon_is_rejected(hass: HomeAssistant) -> None:
    """Icons have to be Material Design icons."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"sidebar_title": "Gulavillan", "sidebar_icon": "house", "require_admin": False},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"]["sidebar_icon"] == "invalid_icon"


async def test_single_instance(hass: HomeAssistant) -> None:
    """Only one dashboard entry can exist."""
    MockConfigEntry(domain=DOMAIN, data={"sidebar_title": "Gulavillan"}).add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_options_update_sidebar(hass: HomeAssistant) -> None:
    """Options change the sidebar title and reload the panel."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Gulavillan",
        data={
            "sidebar_title": "Gulavillan",
            "sidebar_icon": "mdi:home-variant",
            "require_admin": False,
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "sidebar_title": "Villan",
            "sidebar_icon": "mdi:home",
            "require_admin": True,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    panel = hass.data["frontend_panels"][PANEL_URL]
    assert panel.sidebar_title == "Villan"
    assert panel.sidebar_icon == "mdi:home"
    assert panel.require_admin is True
