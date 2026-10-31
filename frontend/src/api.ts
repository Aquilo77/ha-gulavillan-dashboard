/** Talk to Home Assistant through the hass object passed into the panel. */

import type { Layout } from "./layout";
import { normalizeLayout } from "./layout";

export interface HassState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface HassLike {
  states: Record<string, HassState>;
  services?: Record<string, Record<string, unknown>>;
  language?: string;
  user?: { is_admin?: boolean; name?: string; id?: string };
  themes?: { darkMode?: boolean };
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ) => Promise<unknown>;
  callWS?: <T>(message: Record<string, unknown>) => Promise<T>;
  formatEntityState?: (state: HassState) => string;
  hassUrl?: (path: string) => string;
  connection: {
    subscribeEvents: (
      callback: (event: unknown) => void,
      eventType?: string,
    ) => Promise<() => void> | (() => void);
    sendMessagePromise?: <T>(message: Record<string, unknown>) => Promise<T>;
  };
}

export async function callWS<T>(hass: HassLike, message: Record<string, unknown>): Promise<T> {
  if (typeof hass.callWS === "function") {
    return hass.callWS<T>(message);
  }
  if (!hass.connection.sendMessagePromise) {
    throw new Error("missing websocket");
  }
  return hass.connection.sendMessagePromise<T>(message);
}

export async function fetchLayout(hass: HassLike): Promise<Layout> {
  const result = await callWS<unknown>(hass, { type: "gulavillan_dashboard/layout/get" });
  return normalizeLayout(result);
}

export async function saveLayout(hass: HassLike, layout: Layout): Promise<Layout> {
  const clean = normalizeLayout(layout);
  const result = await callWS<unknown>(hass, {
    type: "gulavillan_dashboard/layout/save",
    layout: clean,
  });
  return normalizeLayout(result);
}

export async function subscribeStates(
  hass: HassLike,
  callback: () => void,
): Promise<() => void> {
  const subscribed = hass.connection.subscribeEvents(callback, "state_changed");
  if (typeof subscribed === "function") return subscribed;
  return subscribed;
}

export async function fetchHistory(
  hass: HassLike,
  entityId: string,
  hours: number,
): Promise<number[]> {
  const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const payload = await callWS<unknown>(hass, {
    type: "history/history_during_period",
    start_time: start,
    end_time: new Date().toISOString(),
    entity_ids: [entityId],
    minimal_response: false,
    no_attributes: true,
    significant_changes_only: false,
  });
  return pointsFromHistory(payload, entityId);
}

export function pointsFromHistory(payload: unknown, entityId: string): number[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload as Record<string, unknown>)[entityId];
  if (!Array.isArray(raw)) return [];
  const values: number[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const rawState = record.state ?? record.s;
    const numeric = typeof rawState === "number" ? rawState : Number.parseFloat(String(rawState));
    if (Number.isFinite(numeric)) values.push(numeric);
  }
  return values;
}

const TOGGLE_DOMAINS = new Set([
  "light",
  "switch",
  "input_boolean",
  "fan",
  "humidifier",
  "media_player",
  "climate",
  "automation",
  "remote",
  "siren",
  "valve",
  "water_heater",
  "lawn_mower",
  "vacuum",
  "alarm_control_panel",
  "lock",
  "cover",
]);

export function canToggle(entityId: string): boolean {
  return TOGGLE_DOMAINS.has(entityId.split(".")[0] ?? "");
}

export function isActive(state: string | undefined): boolean {
  return !!state && !["off", "closed", "locked", "unavailable", "unknown", "idle", "standby"].includes(state);
}

export async function toggleEntity(hass: HassLike, entityId: string): Promise<void> {
  const domain = entityId.split(".")[0];
  const state = hass.states[entityId]?.state;
  if (domain === "lock") {
    await hass.callService("lock", state === "locked" ? "unlock" : "lock", { entity_id: entityId });
    return;
  }
  if (domain === "cover") {
    await hass.callService("cover", state === "open" ? "close_cover" : "open_cover", {
      entity_id: entityId,
    });
    return;
  }
  await hass.callService("homeassistant", "toggle", { entity_id: entityId });
}

export function entityName(state: HassState | undefined, fallback: string): string {
  const name = state?.attributes.friendly_name;
  return typeof name === "string" && name.trim() ? name : fallback;
}

export function formatState(hass: HassLike | undefined, entityId: string, fallback: string): string {
  const state = hass?.states?.[entityId];
  if (!state) return fallback;
  if (hass?.formatEntityState) {
    try {
      const formatted = hass.formatEntityState(state);
      if (formatted) return formatted;
    } catch {
      /* use the raw state */
    }
  }
  return state.state;
}

export function listEntities(hass: HassLike | undefined, query: string): HassState[] {
  const states = Object.values(hass?.states ?? {});
  const needle = query.trim().toLowerCase();
  return states
    .filter((state) => {
      if (!needle) return true;
      const name = String(state.attributes.friendly_name ?? "").toLowerCase();
      return state.entity_id.includes(needle) || name.includes(needle);
    })
    .sort((a, b) => a.entity_id.localeCompare(b.entity_id, "sv"))
    .slice(0, 60);
}

export function serviceDomains(hass: HassLike | undefined): string[] {
  return Object.keys(hass?.services ?? {}).sort((a, b) => a.localeCompare(b, "sv"));
}

export function serviceNames(hass: HassLike | undefined, domain: string): string[] {
  return Object.keys(hass?.services?.[domain] ?? {}).sort((a, b) => a.localeCompare(b, "sv"));
}

export function mediaUrl(hass: HassLike | undefined, entityId: string, explicit = ""): string {
  if (explicit) return explicit;
  const state = hass?.states?.[entityId];
  if (!state) return "";
  const token = state.attributes.access_token;
  const tokenQuery = typeof token === "string" && token ? `?token=${encodeURIComponent(token)}` : "";
  if (entityId.startsWith("camera.") && tokenQuery) {
    return abs(hass, `/api/camera_proxy/${entityId}${tokenQuery}`);
  }
  if (entityId.startsWith("image.") && tokenQuery) {
    return abs(hass, `/api/image_proxy/${entityId}${tokenQuery}`);
  }
  const picture = state.attributes.entity_picture;
  if (typeof picture === "string") return abs(hass, picture);
  if (entityId.startsWith("camera.")) return abs(hass, `/api/camera_proxy/${entityId}`);
  if (entityId.startsWith("image.")) return abs(hass, `/api/image_proxy/${entityId}`);
  return "";
}

function abs(hass: HassLike | undefined, path: string): string {
  if (!path) return "";
  if (/^(https?:|data:image\/)/i.test(path)) return path;
  if (hass?.hassUrl) return hass.hassUrl(path);
  return path;
}
