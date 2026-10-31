/** Local preview. Vite serves this file; the integration bundle does not include it. */

import example from "../../examples/hem.json";
import { createMockHass } from "./mock-hass";
import "./panel";

const hass = createMockHass();
if (!hass.callWS) throw new Error("preview websocket missing");
const params = new URLSearchParams(location.search);
const layout = JSON.parse(JSON.stringify(example)) as typeof example;
if (params.has("light")) {
  layout.theme = "light";
  hass.themes = { darkMode: false };
  document.body.style.background = "#f4f0e7";
}
await hass.callWS({ type: "gulavillan_dashboard/layout/save", layout });

const panel = document.querySelector("gulavillan-dashboard") as HTMLElement & {
  hass?: unknown;
  shadowRoot: ShadowRoot | null;
};
panel.hass = hass;

if (params.has("edit")) {
  const openEditor = () => {
    const button = panel.shadowRoot?.querySelector("button.icon-btn") as HTMLButtonElement | null;
    if (!button || button.getAttribute("title") !== "Redigera") {
      requestAnimationFrame(openEditor);
      return;
    }
    button.click();
    requestAnimationFrame(() => {
      const widget = panel.shadowRoot?.querySelector(".widget.kind-light") as HTMLElement | null;
      if (!widget) return;
      widget.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, clientX: 40, clientY: 40 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1, clientX: 40, clientY: 40 }));
    });
  };
  requestAnimationFrame(openEditor);
}

window.setInterval(() => {
  hass.touch();
  panel.hass = hass;
}, 2000);
