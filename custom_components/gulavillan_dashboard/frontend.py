"""Install and replace the page files under /config/www/gulavillan."""

from __future__ import annotations

import json
import logging
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any

from aiohttp import ClientError
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import FRONTEND_DIR, REPO

_LOGGER = logging.getLogger(__name__)
_BUNDLED = Path(__file__).parent / "www"
_FILES = ("app.html", "theme.css", "page.svg")
_REF = re.compile(r"^[A-Za-z0-9._/-]{1,120}$")
_MANIFEST = Path(__file__).parent / "manifest.json"


def bundled_version() -> str:
    """Return the version shipped with this integration."""
    return str(json.loads(_MANIFEST.read_text(encoding="utf-8"))["version"])


def frontend_dir(hass: HomeAssistant) -> Path:
    """Return the directory Home Assistant serves as /local/gulavillan."""
    return Path(hass.config.path("www", FRONTEND_DIR))


def previous_dir(hass: HomeAssistant) -> Path:
    """Return the single rollback copy."""
    return Path(hass.config.path("www", f"{FRONTEND_DIR}.previous"))


def read_version(hass: HomeAssistant) -> str:
    """Return the installed frontend version, or the bundled one."""
    path = frontend_dir(hass) / "version.json"
    if path.is_file():
        try:
            return str(json.loads(path.read_text(encoding="utf-8")).get("version") or "")
        except (OSError, json.JSONDecodeError):
            return ""
    return bundled_version()


def _write_version(directory: Path, version: str, source: str) -> None:
    payload = {"version": version, "source": source}
    (directory / "version.json").write_text(json.dumps(payload), encoding="utf-8")


def _verify(directory: Path) -> None:
    for name in _FILES:
        path = directory / name
        if not path.is_file() or path.stat().st_size < 20:
            raise HomeAssistantError(f"Filen {name} saknas i den nedladdade sidan.")
    html = (directory / "app.html").read_text(encoding="utf-8", errors="replace")
    css = (directory / "theme.css").read_text(encoding="utf-8", errors="replace")
    svg = (directory / "page.svg").read_text(encoding="utf-8", errors="replace")
    if "Gulavillan" not in html or "theme.css" not in html:
        raise HomeAssistantError("Den nedladdade sidan ser inte ut som Gulavillan.")
    if "--bg" not in css or "<svg" not in svg:
        raise HomeAssistantError("Tema eller villa saknas i den nedladdade sidan.")


def _swap(source: Path, hass: HomeAssistant) -> None:
    """Replace the live directory and keep the previous one."""
    _verify(source)
    dest = frontend_dir(hass)
    previous = previous_dir(hass)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if previous.exists():
        shutil.rmtree(previous)
    if dest.exists():
        dest.rename(previous)
    source.rename(dest)


def install_bundled(hass: HomeAssistant) -> None:
    """Copy the shipped page into place. Used only when nothing is installed."""
    dest = frontend_dir(hass)
    if (dest / "app.html").is_file() and (dest / "version.json").is_file():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix="gulavillan-", dir=str(dest.parent)))
    try:
        for name in _FILES:
            shutil.copy2(_BUNDLED / name, staging / name)
        _write_version(staging, bundled_version(), "bundled")
        _swap(staging, hass)
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


async def async_ensure_frontend(hass: HomeAssistant) -> None:
    """Install the bundled page the first time the integration starts."""
    await hass.async_add_executor_job(install_bundled, hass)


def rollback(hass: HomeAssistant) -> str:
    """Restore the previous frontend. The current one becomes the rollback copy."""
    dest = frontend_dir(hass)
    previous = previous_dir(hass)
    if not (previous / "app.html").is_file():
        raise HomeAssistantError("Det finns ingen tidigare version att återställa.")
    _verify(previous)
    holding = dest.parent / f"{FRONTEND_DIR}.hold"
    if holding.exists():
        shutil.rmtree(holding)
    if dest.exists():
        dest.rename(holding)
    previous.rename(dest)
    holding.rename(previous)
    return read_version(hass)


async def _download_bytes(hass: HomeAssistant, url: str) -> bytes:
    session = async_get_clientsession(hass)
    try:
        async with session.get(url, headers={"User-Agent": "gulavillan-dashboard"}) as response:
            if response.status != 200:
                raise HomeAssistantError(f"Nedladdningen svarade {response.status}.")
            return await response.read()
    except ClientError as err:
        raise HomeAssistantError("Kunde inte ladda ner sidan.") from err


async def _download_release(hass: HomeAssistant, staging: Path) -> str:
    session = async_get_clientsession(hass)
    api = f"https://api.github.com/repos/{REPO}/releases/latest"
    try:
        async with session.get(
            api,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "gulavillan-dashboard"},
        ) as response:
            if response.status != 200:
                raise HomeAssistantError(f"GitHub svarade {response.status} för senaste releasen.")
            payload: dict[str, Any] = await response.json()
    except ClientError as err:
        raise HomeAssistantError("Kunde inte läsa senaste releasen.") from err
    assets = payload.get("assets") or []
    url = next(
        (item.get("browser_download_url") for item in assets if item.get("name") == "gulavillan_dashboard.zip"),
        None,
    )
    if not url:
        raise HomeAssistantError("Senaste releasen har ingen gulavillan_dashboard.zip.")
    data = await _download_bytes(hass, str(url))
    archive = staging.parent / "gulavillan.zip"
    archive.write_bytes(data)

    def _extract() -> None:
        with zipfile.ZipFile(archive) as bundle:
            for name in _FILES:
                member = f"www/{name}"
                if member not in bundle.namelist():
                    raise HomeAssistantError(f"{member} saknas i releasen.")
                target = staging / name
                target.write_bytes(bundle.read(member))
        archive.unlink(missing_ok=True)

    await hass.async_add_executor_job(_extract)
    version = str(payload.get("tag_name") or bundled_version()).removeprefix("v")
    _write_version(staging, version, "release")
    return version


async def _download_ref(hass: HomeAssistant, ref: str, staging: Path) -> str:
    if not _REF.match(ref) or ".." in ref:
        raise HomeAssistantError("Ogiltig ref.")
    base = f"https://raw.githubusercontent.com/{REPO}/{ref}/custom_components/gulavillan_dashboard/www/"
    for name in _FILES:
        (staging / name).write_bytes(await _download_bytes(hass, base + name))
    _write_version(staging, ref, "ref")
    return ref


async def async_update_frontend(hass: HomeAssistant, ref: str | None = None) -> dict[str, str]:
    """Download a frontend and swap it into place."""
    parent = frontend_dir(hass).parent
    parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix="gulavillan-new-", dir=str(parent)))
    try:
        if ref:
            version = await _download_ref(hass, ref.strip(), staging)
        else:
            version = await _download_release(hass, staging)
        await hass.async_add_executor_job(_swap, staging, hass)
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    _LOGGER.info("Gulavillan frontend is now %s", version)
    return {"version": version}


async def async_rollback_frontend(hass: HomeAssistant) -> dict[str, str]:
    """Restore the previous frontend."""
    version = await hass.async_add_executor_job(rollback, hass)
    _LOGGER.info("Gulavillan frontend rolled back to %s", version)
    return {"version": version}
