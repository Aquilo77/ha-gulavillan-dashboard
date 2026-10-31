/** In-memory hass object for the local preview. Not part of the panel bundle. */

import type { HassLike, HassState } from "./api";
import { defaultLayout, type Layout } from "./layout";

type Listener = (event?: unknown) => void;

export function createMockHass(): HassLike & { touch: () => void } {
  let layout: Layout = defaultLayout();
  const listeners = new Set<Listener>();
  const states: Record<string, HassState> = {
    "light.vardagsrum": state("light.vardagsrum", "on", "Vardagsrum", { brightness: 180, icon: "mdi:floor-lamp" }),
    "light.kok": state("light.kok", "off", "Kök", { brightness: 0, icon: "mdi:ceiling-light" }),
    "light.hall": state("light.hall", "on", "Hall", { brightness: 80, icon: "mdi:wall-sconce" }),
    "switch.utelampor": state("switch.utelampor", "on", "Utelampor", { icon: "mdi:outdoor-lamp" }),
    "climate.vardagsrum": state("climate.vardagsrum", "heat", "Vardagsrum", {
      current_temperature: 21.4,
      temperature: 21.5,
      hvac_action: "heating",
      unit_of_measurement: "°C",
    }),
    "sensor.temperatur_ute": state("sensor.temperatur_ute", "4.8", "Temperatur ute", { unit_of_measurement: "°C", icon: "mdi:thermometer" }),
    "sensor.luftfuktighet_vardagsrum": state("sensor.luftfuktighet_vardagsrum", "42", "Luftfuktighet", { unit_of_measurement: "%", icon: "mdi:water-percent" }),
    "binary_sensor.ytterdorr": state("binary_sensor.ytterdorr", "off", "Ytterdörr", { device_class: "door", icon: "mdi:door" }),
    "fan.badrum": state("fan.badrum", "off", "Badrumsfläkt", { icon: "mdi:fan" }),
    "script.god_natt": state("script.god_natt", "off", "God natt", { icon: "mdi:weather-night" }),
    "camera.entre": state("camera.entre", "idle", "Entré", { entity_picture: entranceSvg() }),
  };

  const notify = () => listeners.forEach((listener) => listener());

  const hass: HassLike & { touch: () => void } = {
    states,
    user: { is_admin: true, name: "Dev", id: "dev" },
    themes: { darkMode: true },
    services: {
      light: { turn_on: {}, turn_off: {}, toggle: {} },
      switch: { turn_on: {}, turn_off: {}, toggle: {} },
      climate: { set_temperature: {}, turn_on: {}, turn_off: {} },
      script: { turn_on: {} },
      fan: { turn_on: {}, turn_off: {}, toggle: {} },
      homeassistant: { toggle: {} },
    },
    formatEntityState: (entity) => {
      const map: Record<string, string> = { on: "På", off: "Av", heat: "Värme", idle: "Vilande", unavailable: "Otillgänglig" };
      return map[entity.state] ?? entity.state;
    },
    hassUrl: (path) => path,
    connection: {
      subscribeEvents: (callback) => {
        listeners.add(callback);
        return Promise.resolve(() => listeners.delete(callback));
      },
    },
    callService: async (domain, service, data, target) => {
      const entityId = String(target?.entity_id ?? data?.entity_id ?? "");
      const entity = states[entityId];
      if (entity && (service === "toggle" || service === "turn_on" || service === "turn_off")) {
        if (service === "toggle") entity.state = entity.state === "on" ? "off" : "on";
        if (service === "turn_on") entity.state = domain === "climate" ? "heat" : "on";
        if (service === "turn_off") entity.state = "off";
        if (typeof data?.brightness === "number") entity.attributes.brightness = data.brightness;
      }
      if (entity && service === "set_temperature" && typeof data?.temperature === "number") {
        entity.attributes.temperature = data.temperature;
        entity.state = "heat";
      }
      notify();
    },
    callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
      if (message.type === "gulavillan_dashboard/layout/get") return layout as T;
      if (message.type === "gulavillan_dashboard/layout/save") {
        layout = message.layout as Layout;
        return layout as T;
      }
      if (message.type === "history/history_during_period") {
        const ids = message.entity_ids as string[];
        const entityId = ids[0];
        const base = entityId?.includes("fukt") ? 42 : entityId?.includes("ute") ? 5 : 21;
        const values = Array.from({ length: 24 }, (_, index) => ({
          state: String(base + Math.sin(index / 3) * (entityId?.includes("ute") ? 2.4 : 0.6)),
          last_updated: new Date(Date.now() - (24 - index) * 3600_000).toISOString(),
        }));
        return { [entityId]: values } as T;
      }
      throw new Error(`unknown command ${String(message.type)}`);
    },
    touch: () => {
      const outdoor = states["sensor.temperatur_ute"];
      const current = Number.parseFloat(outdoor.state);
      outdoor.state = (current + (Math.random() - 0.45) * 0.15).toFixed(1);
      notify();
    },
  };
  return hass;
}

function state(entityId: string, value: string, name: string, attributes: Record<string, unknown>): HassState {
  return { entity_id: entityId, state: value, attributes: { friendly_name: name, ...attributes } };
}

function entranceSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#243044"/><rect x="70" y="150" width="500" height="160" fill="#d7c4a3"/><polygon points="50,160 320,40 590,160" fill="#e0b15a"/><rect x="290" y="190" width="70" height="120" fill="#1b2430"/><rect x="120" y="190" width="80" height="60" fill="#f6f1e7"/><rect x="440" y="190" width="80" height="60" fill="#f6f1e7"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
