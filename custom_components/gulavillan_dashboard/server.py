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
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util

from .const import COOKIE, DEFAULT_PORT, DOMAIN, ISSUE_PORT
from .storage import DesignStorage
from .svg import SvgError, entity_ids

_LOGGER = logging.getLogger(__name__)
_PAGE = Path(__file__).parent / "www" / "app.html"
_PUBLIC_ATTRIBUTES = (
    "friendly_name",
    "unit_of_measurement",
    "device_class",
    "icon",
    "brightness",
    "current_temperature",
    "temperature",
    "hvac_action",
)


def entry_settings(entry: Any) -> dict[str, Any]:
    """Return the port and PIN, with options overriding the original setup."""
    merged = {**entry.data, **entry.options}
    try:
        port = int(merged.get("port", DEFAULT_PORT))
    except (TypeError, ValueError):
        port = DEFAULT_PORT
    return {"port": port, "pin": str(merged.get("pin") or "").strip()}


def _access_token(entry_id: str, pin: str) -> str:
    return hashlib.sha256(f"{entry_id}:{pin}".encode()).hexdigest()


def _public_state(state: State) -> dict[str, Any]:
    attributes = {
        key: state.attributes[key]
        for key in _PUBLIC_ATTRIBUTES
        if key in state.attributes
    }
    return {"state": state.state, "attributes": attributes}


class PageServer:
    """Serve the page and push Home Assistant state to it."""

    def __init__(self, hass: HomeAssistant, entry: Any, storage: DesignStorage) -> None:
        """Initialize the server."""
        self.hass = hass
        self.entry = entry
        self.storage = storage
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
        app.router.add_get("/edit", self._page)
        app.router.add_get("/api/session", self._session)
        app.router.add_post("/api/login", self._login)
        app.router.add_get("/api/design", self._get_design)
        app.router.add_post("/api/design", self._save_design)
        app.router.add_get("/api/entities", self._entities)
        app.router.add_get("/api/history", self._history)
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
        payload = {
            "type": "state",
            "entity_id": new_state.entity_id,
            "state": _public_state(new_state),
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
        return {
            state.entity_id: _public_state(state) for state in self.hass.states.async_all()
        }

    def _deny(self) -> web.Response:
        return web.json_response({"pin_required": True}, status=401)

    async def _page(self, request: web.Request) -> web.Response:
        html = _PAGE.read_text(encoding="utf-8")
        return web.Response(
            text=html,
            content_type="text/html",
            headers={"Cache-Control": "no-store"},
        )

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
        return web.json_response({"svg": self.storage.svg})

    async def _save_design(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        try:
            body = await request.json()
        except ValueError:
            return web.json_response({"error": "invalid"}, status=400)
        try:
            svg = await self.storage.async_save(str(body.get("svg") or ""))
        except SvgError as err:
            return web.json_response({"error": str(err)}, status=400)
        return web.json_response({"svg": svg})

    async def _entities(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        entities = []
        for state in self.hass.states.async_all():
            public = _public_state(state)
            entities.append(
                {
                    "entity_id": state.entity_id,
                    "name": public["attributes"].get("friendly_name") or state.entity_id,
                    "state": public["state"],
                    "unit": public["attributes"].get("unit_of_measurement") or "",
                }
            )
        entities.sort(key=lambda item: item["entity_id"])
        return web.json_response({"entities": entities})

    async def _history(self, request: web.Request) -> web.Response:
        if not self.authorized(request):
            return self._deny()
        entity_id = request.query.get("entity_id", "")
        try:
            hours = int(request.query.get("hours", "24"))
        except ValueError:
            hours = 24
        hours = min(168, max(1, hours))
        points = await _async_history(self.hass, entity_id, hours)
        return web.json_response({"entity_id": entity_id, "points": points})

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


async def _async_history(hass: HomeAssistant, entity_id: str, hours: int) -> list[float]:
    if "recorder" not in hass.config.components or not entity_id:
        return []
    try:
        from homeassistant.components.recorder.history import get_significant_states
    except ImportError:
        return []

    start = dt_util.utcnow() - timedelta(hours=hours)

    def _read() -> list[float]:
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
        values: list[float] = []
        for item in result.get(entity_id, []):
            raw = item.state if isinstance(item, State) else item.get("state")
            try:
                values.append(float(raw))
            except (TypeError, ValueError):
                continue
        return values

    try:
        return await hass.async_add_executor_job(_read)
    except Exception:  # noqa: BLE001 - history is optional
        _LOGGER.debug("History for %s is not available", entity_id)
        return []


def sparkline_entities(svg: str) -> list[str]:
    """Entity ids mentioned in the drawing. Kept for callers that scan the page."""
    return entity_ids(svg)
