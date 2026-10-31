"""HTTP server for the SVG page, on its own port."""

from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import timedelta
from pathlib import Path
from typing import Any

from aiohttp import web
from homeassistant.const import EVENT_STATE_CHANGED
from homeassistant.core import Event, HomeAssistant, State, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util

from .catalog import async_build_catalog, build_catalog, is_visible, public_state
from .const import COOKIE, DEFAULT_PORT, DOMAIN, ISSUE_PORT

_LOGGER = logging.getLogger(__name__)
_PAGE = Path(__file__).parent / "www" / "app.html"
_SVG = Path(__file__).parent / "www" / "page.svg"
_THEME = Path(__file__).parent / "www" / "theme.css"
_ALARM_SERVICES = {
    "disarm": "alarm_disarm",
    "arm_home": "alarm_arm_home",
    "arm_away": "alarm_arm_away",
    "arm_night": "alarm_arm_night",
}
_TOGGLE_DOMAINS = {"light", "switch", "input_boolean", "fan", "script"}


def entry_settings(entry: Any) -> dict[str, Any]:
    """Return the port and PIN, with options overriding the original setup."""
    merged = {**entry.data, **entry.options}
    try:
        port = int(merged.get("port", DEFAULT_PORT))
    except (TypeError, ValueError):
        port = DEFAULT_PORT
    return {**merged, "port": port, "pin": str(merged.get("pin") or "").strip()}


def _access_token(entry_id: str, pin: str) -> str:
    return hashlib.sha256(f"{entry_id}:{pin}".encode()).hexdigest()


def _merged(entry: Any) -> dict[str, Any]:
    return {**entry.data, **entry.options}


def _visible_state(hass: HomeAssistant, state: State) -> dict[str, Any] | None:
    entry = er.async_get(hass).async_get(state.entity_id)
    if not is_visible(entry):
        return None
    return public_state(state)


class PageServer:
    """Serve the page and push Home Assistant state to it."""

    def __init__(self, hass: HomeAssistant, entry: Any) -> None:
        """Initialize the server."""
        self.hass = hass
        self.entry = entry
        self.clients: set[web.WebSocketResponse] = set()
        self._runner: web.AppRunner | None = None
        self._unsub: Any = None
        self._stopped = False

    @property
    def port(self) -> int:
        """Return the configured port."""
        return int(entry_settings(self.entry)["port"])

    @property
    def pin(self) -> str:
        """Return the configured PIN. Empty means the page is open."""
        return str(entry_settings(self.entry)["pin"])

    def token(self) -> str:
        """Return the cookie value for the current PIN."""
        return _access_token(self.entry.entry_id, self.pin)

    def authorized(self, request: web.Request) -> bool:
        """Return True when the request may read the page."""
        if not self.pin:
            return True
        given = request.cookies.get(COOKIE, "")
        if len(given) != len(self.token()):
            return False
        return hmac.compare_digest(given, self.token())

    async def start(self) -> bool:
        """Start listening. Return False when the port cannot be used."""
        app = web.Application()
        app["page"] = self
        app.router.add_get("/", self._page)
        app.router.add_get("/theme.css", self._theme)
        app.router.add_get("/api/session", self._session)
        app.router.add_post("/api/login", self._login)
        app.router.add_get("/api/design", self._get_design)
        app.router.add_get("/api/home", self._home)
        app.router.add_post("/api/action", self._action)
        app.router.add_get("/api/history", self._history)
        app.router.add_get("/api/camera/{entity_id}", self._camera)
        app.router.add_get("/api/live", self._live)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", self.port)
        try:
            await site.start()
        except OSError:
            await runner.cleanup()
            _LOGGER.error("Gulavillan could not listen on port %s", self.port)
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                ISSUE_PORT,
                is_fixable=False,
                severity=ir.IssueSeverity.ERROR,
                translation_key=ISSUE_PORT,
                translation_placeholders={"port": str(self.port)},
            )
            return False

        self._runner = runner
        self._unsub = self.hass.bus.async_listen(EVENT_STATE_CHANGED, self._on_state)
        ir.async_delete_issue(self.hass, DOMAIN, ISSUE_PORT)
        _LOGGER.info("Gulavillan page listening on port %s", self.port)
        return True

    async def stop(self) -> None:
        """Stop listening and close browsers connected to the page."""
        if self._stopped:
            return
        self._stopped = True
        if self._unsub is not None:
            self._unsub()
            self._unsub = None
        for client in list(self.clients):
            await client.close()
        self.clients.clear()
        if self._runner is not None:
            await self._runner.cleanup()
            self._runner = None

    @callback
    def _on_state(self, event: Event) -> None:
        new_state = event.data.get("new_state")
        if new_state is None or not self.clients:
            return
        public = _visible_state(self.hass, new_state)
        if public is None:
            return
        payload = {
            "type": "state",
            "entity_id": new_state.entity_id,
            "state": public,
        }
        for client in list(self.clients):
            self.hass.async_create_task(self._send(client, payload))

    async def _send(self, client: web.WebSocketResponse, payload: dict[str, Any]) -> None:
        if client.closed:
            self.clients.discard(client)
            return
        try:
            await client.send_json(payload)
        except ConnectionError:
            self.clients.discard(client)

    def _snapshot(self) -> dict[str, Any]:
        snapshot: dict[str, Any] = {}
        for state in self.hass.states.async_all():
            public = _visible_state(self.hass, state)
            if public is not None:
                snapshot[state.entity_id] = public
        return snapshot

    def _deny(self) -> web.Response:
        return web.json_response({"pin_required": True}, status=401)

    async def _page(self, request: web.Request) -> web.Response:
        html = _PAGE.read_text(encoding="utf-8")
        return web.Response(
            text=html,
            content_type="text/html",
            headers={"Cache-Control": "no-store"},
        )

    async def _theme(self, request: web.Request) -> web.Response:
        css = _THEME.read_text(encoding="utf-8")
        return web.Response(
            text=css,
            content_type="text/css",
            headers={"Cache-Control": "no-store"},
        )

    async def _home(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        return web.json_response(await async_build_catalog(self.hass, _merged(self.entry)))

    async def _session(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        return web.json_response(
            {"ok": True, "pin_required": bool(self.pin), "port": self.port}
        )

    async def _login(self, request: web.Request) -> web.Response:
        if not self.pin:
            return web.json_response({"ok": True})
        try:
            body = await request.json()
        except ValueError:
            body = {}
        submitted = str(body.get("pin") or "").strip()
        given = _access_token(self.entry.entry_id, submitted)
        if not hmac.compare_digest(given, self.token()):
            return self._deny()
        response = web.json_response({"ok": True})
        response.set_cookie(
            COOKIE,
            self.token(),
            httponly=True,
            samesite="Lax",
            max_age=60 * 60 * 24 * 30,
            path="/",
        )
        return response

    async def _get_design(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        return web.json_response({"svg": _SVG.read_text(encoding="utf-8")})

    def _catalog(self) -> dict[str, Any]:
        return build_catalog(self.hass, _merged(self.entry))

    def _kind(self, entity_id: str, catalog: dict[str, Any] | None = None) -> str | None:
        catalog = catalog or self._catalog()
        for floor in catalog["floors"]:
            for area in floor["areas"]:
                for entity in area["entities"]:
                    if entity["entity_id"] == entity_id:
                        return str(entity["kind"])
        return None

    def _pin_matches(self, submitted: str) -> bool:
        if not self.pin:
            return False
        given = _access_token(self.entry.entry_id, submitted.strip())
        if len(given) != len(self.token()):
            return False
        return hmac.compare_digest(given, self.token())

    async def _call(self, domain: str, service: str, data: dict[str, Any]) -> web.Response:
        try:
            await self.hass.services.async_call(domain, service, data, blocking=False)
        except Exception:  # noqa: BLE001 - the page reports a failed control
            _LOGGER.debug("Service %s.%s failed", domain, service)
            return web.json_response({"error": "failed"}, status=400)
        return web.json_response({"ok": True})

    async def _action(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        try:
            body = await request.json()
        except ValueError:
            return web.json_response({"error": "invalid"}, status=400)
        action = str(body.get("action") or "")
        entity_id = str(body.get("entity_id") or "")
        catalog = self._catalog()
        if action == "toggle":
            return await self._toggle(entity_id, catalog)
        if action == "turn_off":
            return await self._turn_off(body.get("entity_ids") or [], catalog)
        if action == "brightness":
            return await self._brightness(entity_id, body.get("brightness_pct"), catalog)
        if action == "climate_temperature":
            return await self._climate_temperature(entity_id, body.get("temperature"), catalog)
        if action == "climate_mode":
            return await self._climate_mode(entity_id, str(body.get("hvac_mode") or ""), catalog)
        if action == "alarm":
            return await self._alarm(entity_id, str(body.get("mode") or ""), str(body.get("pin") or ""), body.get("code"), catalog)
        if action == "media":
            return await self._media(entity_id, body, catalog)
        return web.json_response({"error": "not_allowed"}, status=400)

    async def _toggle(self, entity_id: str, catalog: dict[str, Any]) -> web.Response:
        domain = entity_id.split(".", 1)[0] if "." in entity_id else ""
        entry = er.async_get(self.hass).async_get(entity_id)
        kind = self._kind(entity_id, catalog)
        allowed = kind == "light" or domain in {"input_boolean", "fan", "script"}
        if not is_visible(entry) or not allowed or domain not in _TOGGLE_DOMAINS:
            return web.json_response({"error": "not_toggleable"}, status=400)
        return await self._call("homeassistant", "toggle", {"entity_id": entity_id})

    async def _turn_off(self, entity_ids: Any, catalog: dict[str, Any]) -> web.Response:
        if not isinstance(entity_ids, list) or not entity_ids:
            return web.json_response({"error": "not_allowed"}, status=400)
        cleaned = [str(entity_id) for entity_id in entity_ids]
        if any(self._kind(entity_id, catalog) != "light" for entity_id in cleaned):
            return web.json_response({"error": "not_allowed"}, status=400)
        return await self._call("homeassistant", "turn_off", {"entity_id": cleaned})

    async def _brightness(self, entity_id: str, raw: Any, catalog: dict[str, Any]) -> web.Response:
        if self._kind(entity_id, catalog) != "light" or not entity_id.startswith("light."):
            return web.json_response({"error": "not_allowed"}, status=400)
        try:
            percent = int(raw)
        except (TypeError, ValueError):
            return web.json_response({"error": "invalid"}, status=400)
        percent = min(100, max(0, percent))
        service = "turn_on" if percent else "turn_off"
        data: dict[str, Any] = {"entity_id": entity_id}
        if percent:
            data["brightness_pct"] = percent
        return await self._call("light", service, data)

    async def _climate_temperature(self, entity_id: str, raw: Any, catalog: dict[str, Any]) -> web.Response:
        if self._kind(entity_id, catalog) != "climate":
            return web.json_response({"error": "not_allowed"}, status=400)
        try:
            temperature = float(raw)
        except (TypeError, ValueError):
            return web.json_response({"error": "invalid"}, status=400)
        if temperature < 5 or temperature > 35:
            return web.json_response({"error": "invalid"}, status=400)
        return await self._call(
            "climate",
            "set_temperature",
            {"entity_id": entity_id, "temperature": temperature},
        )

    async def _climate_mode(self, entity_id: str, mode: str, catalog: dict[str, Any]) -> web.Response:
        if self._kind(entity_id, catalog) != "climate":
            return web.json_response({"error": "not_allowed"}, status=400)
        allowed = {"off", "heat", "cool", "heat_cool", "auto", "dry", "fan_only"}
        state = self.hass.states.get(entity_id)
        if state is not None and isinstance(state.attributes.get("hvac_modes"), list):
            allowed = {str(item) for item in state.attributes["hvac_modes"]}
        if mode not in allowed:
            return web.json_response({"error": "not_allowed"}, status=400)
        return await self._call("climate", "set_hvac_mode", {"entity_id": entity_id, "hvac_mode": mode})

    async def _alarm(
        self,
        entity_id: str,
        mode: str,
        pin: str,
        code: Any,
        catalog: dict[str, Any],
    ) -> web.Response:
        if self._kind(entity_id, catalog) != "alarm" or mode not in _ALARM_SERVICES:
            return web.json_response({"error": "not_allowed"}, status=400)
        if not self._pin_matches(pin):
            return web.json_response({"error": "pin_required"}, status=403)
        data: dict[str, Any] = {"entity_id": entity_id}
        if isinstance(code, str) and code.strip():
            data["code"] = code.strip()[:32]
        return await self._call("alarm_control_panel", _ALARM_SERVICES[mode], data)

    async def _media(self, entity_id: str, body: dict[str, Any], catalog: dict[str, Any]) -> web.Response:
        if self._kind(entity_id, catalog) != "media":
            return web.json_response({"error": "not_allowed"}, status=400)
        command = str(body.get("command") or "")
        if command == "play_pause":
            return await self._call("media_player", "media_play_pause", {"entity_id": entity_id})
        if command == "volume":
            try:
                level = float(body.get("volume_level"))
            except (TypeError, ValueError):
                return web.json_response({"error": "invalid"}, status=400)
            level = min(1.0, max(0.0, level))
            return await self._call(
                "media_player",
                "volume_set",
                {"entity_id": entity_id, "volume_level": level},
            )
        return web.json_response({"error": "not_allowed"}, status=400)

    async def _camera(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        entity_id = request.match_info["entity_id"]
        if self._kind(entity_id) != "camera":
            return web.Response(status=404)
        try:
            from homeassistant.components.camera import async_get_image

            image = await async_get_image(self.hass, entity_id, timeout=5)
        except Exception:  # noqa: BLE001 - a missing snapshot is an empty frame
            _LOGGER.debug("Camera image for %s is not available", entity_id)
            return web.Response(status=404)
        return web.Response(
            body=image.content,
            content_type=image.content_type,
            headers={"Cache-Control": "no-store"},
        )

    async def _history(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        entity_id = request.query.get("entity_id", "")
        try:
            hours = int(request.query.get("hours", "24"))
        except ValueError:
            hours = 24
        hours = min(168, max(1, hours))
        entry = er.async_get(self.hass).async_get(entity_id)
        samples = [] if not is_visible(entry) else await _async_history(self.hass, entity_id, hours)
        return web.json_response(
            {
                "entity_id": entity_id,
                "points": [sample["v"] for sample in samples],
                "samples": samples,
            }
        )

    async def _live(self, request: web.Request) -> web.WebSocketResponse:
        socket = web.WebSocketResponse(heartbeat=30)
        await socket.prepare(request)
        if not self.authorized(request):
            await socket.close(code=4401, message=b"pin")
            return socket
        self.clients.add(socket)
        await socket.send_json({"type": "snapshot", "states": self._snapshot()})
        try:
            async for _message in socket:
                continue
        finally:
            self.clients.discard(socket)
        return socket


async def _async_history(hass: HomeAssistant, entity_id: str, hours: int) -> list[dict[str, Any]]:
    if "recorder" not in hass.config.components or not entity_id:
        return []
    try:
        from homeassistant.components.recorder.history import get_significant_states
    except ImportError:
        return []

    start = dt_util.utcnow() - timedelta(hours=hours)

    def _read() -> list[dict[str, Any]]:
        result = get_significant_states(
            hass,
            start,
            None,
            [entity_id],
            None,
            True,
            False,
            False,
            True,
            False,
        )
        samples: list[dict[str, Any]] = []
        for item in result.get(entity_id, []):
            raw = item.state if isinstance(item, State) else item.get("state")
            stamp = item.last_changed if isinstance(item, State) else item.get("last_changed")
            try:
                value = float(raw)
            except (TypeError, ValueError):
                continue
            samples.append(
                {"t": stamp.isoformat() if hasattr(stamp, "isoformat") else stamp, "v": value}
            )
        return samples

    try:
        return await hass.async_add_executor_job(_read)
    except Exception:  # noqa: BLE001 - history is optional
        _LOGGER.debug("History for %s is not available", entity_id)
        return []

