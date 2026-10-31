"""The stored SVG page."""

from __future__ import annotations

DEFAULT_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" data-gulavillan="page">
  <rect width="1920" height="1080" fill="#10151c"/>
  <text x="96" y="120" fill="#e0b15a" font-size="28" font-family="system-ui, sans-serif" letter-spacing="4">GULAVILLAN</text>
  <text x="96" y="250" fill="#f4f0e8" font-size="132" font-family="system-ui, sans-serif" data-widget="clock">--:--</text>
  <text x="96" y="310" fill="#b3aa9c" font-size="32" font-family="system-ui, sans-serif" data-widget="date"></text>
  <text x="96" y="430" fill="#b3aa9c" font-size="24" font-family="system-ui, sans-serif" data-entity="sensor.temperatur" data-widget="name">Temperatur</text>
  <text x="96" y="540" fill="#f4f0e8" font-size="92" font-family="system-ui, sans-serif" data-entity="sensor.temperatur" data-widget="value" data-decimals="1">–</text>
  <text x="360" y="540" fill="#b3aa9c" font-size="36" font-family="system-ui, sans-serif" data-entity="sensor.temperatur" data-widget="unit"></text>
  <rect x="96" y="590" width="640" height="160" rx="18" fill="#1b2430" data-entity="sensor.temperatur" data-widget="sparkline" data-hours="24"/>
  <circle cx="1500" cy="280" r="70" fill="#334155" data-entity="light.vardagsrum" data-widget="state-fill" data-on="#e0b15a" data-off="#334155"/>
  <text x="96" y="860" fill="#8d8478" font-size="24" font-family="system-ui, sans-serif">Öppna /edit och låt en AI rita om den här SVG:n. data-entity kopplar formen till Home Assistant.</text>
</svg>
"""


def default_design() -> dict[str, str]:
    """Return the page shown before a design has been saved."""
    return {"svg": DEFAULT_SVG.strip()}
