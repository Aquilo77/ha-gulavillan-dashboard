import { css } from "lit";

export const appStyles = css`
  :host {
    display: block;
    height: 100%;
    min-height: 100%;
    color: var(--gv-text);
    background: var(--gv-bg);
    font-family: var(--ha-font-family-body, "Segoe UI", system-ui, sans-serif);
    --gv-bg: var(--primary-background-color, #10151c);
    --gv-card: var(--card-background-color, #1b2430);
    --gv-text: var(--primary-text-color, #f3f0e8);
    --gv-muted: var(--secondary-text-color, #b3aa9c);
    --gv-accent: var(--primary-color, #e0b15a);
    --gv-accent-text: var(--text-primary-color, #1c1408);
    --gv-divider: var(--divider-color, rgba(255, 255, 255, 0.08));
    --gv-shadow: var(--ha-card-box-shadow, 0 12px 32px rgba(0, 0, 0, 0.18));
    --gv-radius: var(--ha-card-border-radius, 20px);
    container-type: inline-size;
  }

  :host([theme="light"]) {
    color-scheme: light;
    --gv-bg: #f4f0e7;
    --gv-card: #fffdf8;
    --gv-text: #211c16;
    --gv-muted: #6d6458;
    --gv-accent: #9a6b12;
    --gv-accent-text: #fffaf0;
    --gv-divider: rgba(48, 36, 18, 0.12);
    --gv-shadow: 0 10px 28px rgba(70, 48, 12, 0.08);
  }

  :host([theme="dark"]) {
    color-scheme: dark;
    --gv-bg: #10151c;
    --gv-card: #1b2430;
    --gv-text: #f3f0e8;
    --gv-muted: #b3aa9c;
    --gv-accent: #e0b15a;
    --gv-accent-text: #1c1408;
    --gv-divider: rgba(255, 255, 255, 0.08);
    --gv-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  }

  * { box-sizing: border-box; }

  button, input, select, textarea { font: inherit; color: inherit; }

  button { cursor: pointer; background: transparent; border: 0; padding: 0; text-align: inherit; }

  .app {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(900px 380px at 0% -10%, color-mix(in srgb, var(--gv-accent) 18%, transparent), transparent 58%),
      var(--gv-bg);
    position: relative;
  }

  .topbar, .subbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    min-height: 56px;
  }

  .subbar { min-height: 48px; padding-top: 0; flex-wrap: wrap; }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 680;
    letter-spacing: -0.03em;
    font-size: 1.2rem;
    white-space: nowrap;
  }

  .brand .ico, .brand ha-icon { width: 22px; height: 22px; color: var(--gv-accent); }

  .tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    min-width: 0;
  }

  .tab, .seg button, .icon-btn, .palette button, .text-btn {
    border: 0;
    background: transparent;
    color: var(--gv-muted);
  }

  .tab, .seg button, .text-btn {
    border-radius: 999px;
    padding: 8px 12px;
    min-height: 40px;
  }

  .tab.active, .seg button.active {
    background: color-mix(in srgb, var(--gv-accent) 20%, transparent);
    color: var(--gv-text);
  }

  .spacer { flex: 1; }

  .icon-btn, .text-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--gv-card) 88%, transparent);
    color: var(--gv-text);
    border: 1px solid var(--gv-divider);
  }

  .icon-btn.primary, .text-btn.primary {
    background: var(--gv-accent);
    color: var(--gv-accent-text);
    border-color: transparent;
  }

  .text-btn { padding: 0 14px; }

  .seg {
    display: inline-flex;
    padding: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--gv-text) 6%, transparent);
    border: 1px solid var(--gv-divider);
  }

  .workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .workspace.editing { grid-template-columns: 220px minmax(0, 1fr); }
  .workspace.inspecting { grid-template-columns: 220px minmax(0, 1fr) 320px; }

  .palette, .inspector {
    min-height: 0;
    overflow: auto;
    padding: 8px;
    border-color: var(--gv-divider);
  }

  .palette { border-right: 1px solid var(--gv-divider); display: flex; flex-direction: column; gap: 6px; }

  .palette button {
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    border-radius: 12px;
    padding: 10px 12px;
    min-height: 44px;
    color: var(--gv-text);
    background: color-mix(in srgb, var(--gv-card) 80%, transparent);
  }

  .palette button:hover, .tab:hover, .icon-btn:hover, .text-btn:hover {
    filter: brightness(1.06);
  }

  .stage {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 8px 12px 28px;
    container-type: inline-size;
  }

  .stage.frame {
    width: min(var(--frame), 100%);
    margin: 0 auto;
    border: 1px dashed var(--gv-divider);
    border-radius: 18px;
    background: color-mix(in srgb, var(--gv-bg) 70%, transparent);
  }

  .canvas {
    position: relative;
    width: 100%;
  }

  .canvas.editing {
    background-image: radial-gradient(circle, color-mix(in srgb, var(--gv-text) 28%, transparent) 1.1px, transparent 1.2px);
    background-size: calc(100cqw / var(--cols)) calc(100cqw / var(--cols));
    border-radius: 16px;
  }

  .canvas.stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: auto !important;
    background-image: none;
  }

  .widget {
    position: absolute;
    overflow: hidden;
    border-radius: var(--gv-radius);
    background: var(--gv-card);
    color: var(--gv-text);
    border: 1px solid var(--gv-divider);
    box-shadow: var(--gv-shadow);
    padding: 14px 16px;
    font-size: 16px;
  }

  .canvas.stack .widget {
    position: relative;
    left: auto !important;
    top: auto !important;
    width: auto !important;
    height: auto !important;
    min-height: 112px;
  }

  .canvas.editing .widget { touch-action: none; user-select: none; cursor: grab; }
  .canvas.editing .widget-body { pointer-events: none; }
  .canvas.editing .chrome,
  .canvas.editing .resize { pointer-events: auto; }
  .widget.selected { outline: 2px solid var(--gv-accent); outline-offset: 2px; z-index: 2; }
  .kind-text, .kind-clock {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }
  .kind-button {
    background: var(--gv-accent);
    color: var(--gv-accent-text);
    border-color: transparent;
    padding: 0;
  }
  .kind-image { padding: 0; }

  .widget-body { height: 100%; min-height: 0; }
  .kind-image .widget-body, .kind-button .widget-body { position: absolute; inset: 0; }

  .chrome, .resize { position: absolute; z-index: 3; }
  .chrome { top: 6px; right: 6px; display: none; gap: 4px; }
  .widget.selected .chrome, .canvas.stack .chrome { display: flex; }
  .chrome .icon-btn { min-width: 36px; min-height: 36px; background: var(--gv-card); }
  .resize {
    right: 2px;
    bottom: 2px;
    width: 28px;
    height: 28px;
    cursor: nwse-resize;
    color: var(--gv-muted);
    display: none;
  }
  .widget.selected .resize { display: flex; align-items: flex-end; justify-content: flex-end; }

  .tile, .sensor, .climate, .group, .prose, .clock, .text-block, .light {
    height: 100%;
    min-height: 0;
  }

  .tile, .light {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--gv-accent) 16%, transparent);
    color: var(--gv-accent);
  }
  .mark .ico, .mark ha-icon, .ico, ha-icon { width: 1.3em; height: 1.3em; }
  .mark.on { background: var(--gv-accent); color: var(--gv-accent-text); }

  .name { font-weight: 650; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .state { color: var(--gv-muted); font-size: 0.92em; margin-top: 2px; }
  .stack-text { min-width: 0; }

  .switch {
    width: 52px;
    height: 32px;
    border-radius: 999px;
    border: 0;
    padding: 0;
    background: color-mix(in srgb, var(--gv-text) 18%, transparent);
    position: relative;
    flex: none;
  }
  .switch::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    top: 4px;
    left: 4px;
    transition: transform 0.18s ease;
  }
  .switch.on { background: var(--gv-accent); }
  .switch.on::after { transform: translateX(20px); }

  .slider { width: 100%; accent-color: var(--gv-accent); margin-top: 8px; }
  .light { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
  .light .tile { height: auto; }
  .light .slider-row { margin-top: auto; }

  .clock-time {
    font-size: 1em;
    font-weight: 660;
    letter-spacing: -0.045em;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
  }
  .clock-date { margin-top: 0.2em; font-size: 0.34em; color: var(--gv-muted); text-transform: capitalize; }

  .text-block { display: flex; align-items: center; white-space: pre-wrap; line-height: 1.15; font-weight: 650; letter-spacing: -0.03em; }

  .sensor { display: flex; flex-direction: column; }
  .sensor-value {
    font-size: 2.5em;
    font-weight: 650;
    letter-spacing: -0.045em;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
  }
  .unit { font-size: 0.42em; margin-left: 0.15em; color: var(--gv-muted); font-weight: 560; }
  .spark { width: 100%; height: 38%; margin-top: auto; display: block; }
  .spark-line { fill: none; stroke: var(--gv-accent); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .spark-fill { fill: color-mix(in srgb, var(--gv-accent) 22%, transparent); stroke: none; }
  .hint { color: var(--gv-muted); font-size: 0.85em; margin-top: auto; }

  .climate { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
  .temp-row { display: flex; align-items: baseline; gap: 8px; }
  .stepper { display: flex; align-items: center; gap: 8px; }
  .stepper .icon-btn { background: color-mix(in srgb, var(--gv-text) 8%, transparent); }

  .press {
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    font-weight: 680;
    letter-spacing: -0.02em;
    text-align: left;
  }
  .press:active { transform: scale(0.985); }

  .shot, .shot img, .placeholder {
    width: 100%;
    height: 100%;
  }
  .shot img { object-fit: cover; display: block; }
  .placeholder {
    display: grid;
    place-items: center;
    gap: 6px;
    color: var(--gv-muted);
    background:
      linear-gradient(160deg, color-mix(in srgb, var(--gv-accent) 28%, transparent), transparent 55%),
      var(--gv-card);
  }

  .group { display: flex; flex-direction: column; gap: 2px; overflow: auto; }
  .group h3 { margin: 0 0 6px; font-size: 0.95em; }
  .row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: center;
    min-height: 42px;
    border-top: 1px solid var(--gv-divider);
    background: transparent;
    text-align: left;
    padding: 4px 0;
  }
  .row .switch { transform: scale(0.86); transform-origin: right center; }

  .prose { overflow: auto; line-height: 1.45; }
  .prose h1, .prose h2, .prose h3 { margin: 0 0 0.4em; letter-spacing: -0.03em; line-height: 1.1; }
  .prose h1 { font-size: 1.5em; }
  .prose h2 { font-size: 1.25em; }
  .prose p { margin: 0 0 0.6em; }
  .prose ul { margin: 0 0 0.6em; padding-left: 1.1em; }
  .prose a { color: var(--gv-accent); }

  .inspector {
    border-left: 1px solid var(--gv-divider);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .inspector h3 { margin: 4px 0; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gv-muted); }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 0.86rem; color: var(--gv-muted); }
  input[type="text"], input[type="number"], input[type="search"], select, textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--gv-divider);
    background: color-mix(in srgb, var(--gv-bg) 65%, transparent);
    padding: 10px 12px;
    min-height: 42px;
    outline: none;
  }
  textarea { min-height: 110px; resize: vertical; }
  input:focus, select:focus, textarea:focus { border-color: var(--gv-accent); }
  .check { flex-direction: row; align-items: center; gap: 8px; color: var(--gv-text); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .color-row { display: flex; gap: 8px; align-items: center; }
  input[type="color"] { width: 48px; height: 42px; padding: 4px; border: 0; background: transparent; }
  .results { display: flex; flex-direction: column; max-height: 180px; overflow: auto; border-radius: 12px; border: 1px solid var(--gv-divider); }
  .results button, .chip {
    text-align: left;
    border: 0;
    background: transparent;
    color: var(--gv-text);
    padding: 8px 10px;
  }
  .results button small, .chip small { display: block; color: var(--gv-muted); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border-radius: 999px; background: color-mix(in srgb, var(--gv-text) 8%, transparent); }

  .toast, .modal-back { position: absolute; z-index: 6; }
  .toast {
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    background: var(--gv-card);
    color: var(--gv-text);
    border: 1px solid var(--gv-divider);
    border-radius: 999px;
    padding: 10px 16px;
    box-shadow: var(--gv-shadow);
  }
  .modal-back {
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .modal {
    width: min(420px, 100%);
    background: var(--gv-card);
    color: var(--gv-text);
    border-radius: 20px;
    padding: 18px;
    box-shadow: var(--gv-shadow);
  }
  .modal .row-end { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .status, .banner {
    margin: 0 14px 8px;
    color: var(--gv-muted);
  }
  .banner {
    padding: 12px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--gv-accent) 14%, transparent);
    color: var(--gv-text);
  }
  .splash {
    margin: auto;
    text-align: center;
    color: var(--gv-muted);
  }

  @container (max-width: 980px) {
    .workspace.editing, .workspace.inspecting { grid-template-columns: minmax(0, 1fr); }
    .palette { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--gv-divider); }
    .palette button { white-space: nowrap; }
    .inspector {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 8px;
      max-height: 48%;
      z-index: 5;
      border: 1px solid var(--gv-divider);
      border-radius: 18px;
      background: var(--gv-card);
      box-shadow: var(--gv-shadow);
    }
  }
`;
