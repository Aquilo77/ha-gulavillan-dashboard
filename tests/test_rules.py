"""Classification, override priority and energy units."""

from __future__ import annotations

from custom_components.gulavillan_dashboard.rules import (
    apply_preferences,
    energy_kwh,
    power_watts,
    score,
)


def _catalog() -> dict:
    return {
        "floors": [{
            "id": "plan",
            "name": "Plan",
            "areas": [{
                "id": "rum",
                "name": "Rum",
                "entities": [
                    {"entity_id": "light.tak", "name": "Tak", "kind": "light", "category": "lighting", "state": "on", "attributes": {}},
                    {"entity_id": "sensor.effekt", "name": "Effekt", "kind": "power", "category": "energy", "state": "1.5", "attributes": {"unit_of_measurement": "kW"}},
                    {"entity_id": "sensor.okand", "name": "Okänd", "kind": "power", "category": "energy", "state": "10", "attributes": {"unit_of_measurement": "ppm"}},
                    {"entity_id": "binary_sensor.dorr", "name": "Dörr", "kind": "door", "category": "security", "state": "off", "attributes": {}},
                ],
            }],
        }],
        "unclassified": [
            {"entity_id": "sensor.mystery", "name": "Mystery", "confidence": "low", "reason": "Saknar klass", "suggested_category": "other"},
        ],
        "tabs": ["hem", "belysning"],
    }


def test_domain_match_is_high_confidence() -> None:
    assert score("light")["confidence"] == "high"
    assert score("light")["category"] == "lighting"
    assert score("light", from_user=True)["confidence"] == "user"


def test_power_and_energy_units_are_not_interchangeable() -> None:
    assert power_watts(1.5, "kW") == 1500
    assert power_watts(10, "ppm") is None
    assert energy_kwh(500, "Wh") == 0.5
    assert energy_kwh(1.5, "kW") is None


def test_homepage_skips_unknown_units_and_does_not_invent_cost() -> None:
    catalog = apply_preferences(_catalog(), None)
    energy = next(card for card in catalog["homepage"] if card["id"] == "energy")
    assert energy["value"] == "1500 W"
    assert energy["cost"] is None
    assert "1 utan känd enhet" in energy["detail"]
    assert all(card["title"] for card in catalog["homepage"])


def test_user_override_hides_without_being_readded() -> None:
    catalog = apply_preferences(_catalog(), {
        "overrides": {"entities": {"light.tak": {"hidden": True, "name": "Behålls"}}},
        "review": {"sensor.mystery": "rejected"},
        "discovery": {"autoAddCategories": ["lighting", "energy", "security"]},
    })
    ids = [
        entity["entity_id"]
        for floor in catalog["floors"]
        for area in floor["areas"]
        for entity in area["entities"]
    ]
    assert "light.tak" not in ids
    assert catalog["review_queue"][0]["decision"] == "rejected"
    titles = [card["title"] for card in catalog["homepage"]]
    assert "Belysning" not in titles


def test_closed_door_does_not_create_a_security_card() -> None:
    catalog = apply_preferences(_catalog(), None)
    assert all(card["id"] != "security" for card in catalog["homepage"])
