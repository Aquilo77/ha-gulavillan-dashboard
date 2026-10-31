"""Constants for the Gulavillan page."""

from __future__ import annotations

DOMAIN = "gulavillan_dashboard"
DEFAULT_PORT = 8350
MIN_PORT = 1024
MAX_PORT = 65535
COOKIE = "gulavillan_access"
ISSUE_PORT = "port_in_use"

DATA_SERVER = f"{DOMAIN}_server"

OPT_VILLA_OUTDOOR = "villa_outdoor"
OPT_VILLA_INDOOR = "villa_indoor"
OPT_VILLA_HUMIDITY = "villa_humidity"
OPT_VILLA_CLIMATE = "villa_climate"
OPT_VILLA_DOOR = "villa_door"
OPT_VILLA_LIGHTS = "villa_lights"
OPT_LIGHT_SWITCHES = "light_switches"
OPT_POWER = "power_sensor"
OPT_ENERGY = "energy_sensor"
OPT_PRICE = "price_sensor"
OPT_CHARGERS = "charger_entities"
OPT_SIDEBAR_TITLE = "sidebar_title"
OPT_SIDEBAR_ICON = "sidebar_icon"
OPT_PANEL_ADMIN = "panel_admin_only"
OPT_LEGACY = "legacy_server"

PANEL_PATH = "gulavillan"
PANEL_URL = "/gulavillan_dashboard/panel.js"
FRONTEND_DIR = "gulavillan"
REPO = "Aquilo77/ha-gulavillan-dashboard"
SERVICE_UPDATE = "update_frontend"
SERVICE_ROLLBACK = "rollback_frontend"

SINGLE_OPTIONS = (
    OPT_VILLA_OUTDOOR,
    OPT_VILLA_INDOOR,
    OPT_VILLA_HUMIDITY,
    OPT_VILLA_CLIMATE,
    OPT_VILLA_DOOR,
    OPT_POWER,
    OPT_ENERGY,
    OPT_PRICE,
    OPT_SIDEBAR_TITLE,
    OPT_SIDEBAR_ICON,
)
MULTI_OPTIONS = (
    OPT_VILLA_LIGHTS,
    OPT_LIGHT_SWITCHES,
    OPT_CHARGERS,
)
