/** Widget bodies and their editors. */

import { html, nothing, type TemplateResult } from "lit";
import {
  canToggle,
  entityName,
  formatState,
  isActive,
  listEntities,
  mediaUrl,
  serviceDomains,
  serviceNames,
  type HassLike,
} from "./api";
import { icon, domainIcon } from "./icons";
import { t, type Lang } from "./i18n";
import { renderBlock } from "./markdown";
import type { Widget } from "./layout";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export interface WidgetActions {
  hass?: HassLike;
  lang: Lang;
  history: Record<string, number[]>;
  edit: boolean;
  onToggle: (entityId: string) => void;
  onBrightness: (entityId: string, value: number) => void;
  onTemperature: (entityId: string, value: number) => void;
  onService: (widget: Widget) => void;
  onMoreInfo: (entityId: string, event: Event) => void;
}

export interface EditorActions {
  hass?: HassLike;
  lang: Lang;
  query: string;
  onQuery: (value: string) => void;
  patch: (config: Record<string, unknown>) => void;
}

export function renderWidget(widget: Widget, actions: WidgetActions): TemplateResult {
  switch (widget.type) {
    case "entity":
      return renderEntity(widget, actions, false);
    case "light":
      return renderLight(widget, actions);
    case "climate":
      return renderClimate(widget, actions);
    case "sensor":
      return renderSensor(widget, actions);
    case "button":
      return renderButton(widget, actions);
    case "text":
      return renderText(widget, actions.lang);
    case "clock":
      return renderClock(widget, actions.lang);
    case "image":
      return renderImage(widget, actions);
    case "group":
      return renderGroup(widget, actions);
    case "markdown":
      return renderMarkdown(widget, actions.lang);
  }
}

export function renderEditor(widget: Widget, actions: EditorActions): TemplateResult {
  const lang = actions.lang;
  const config = widget.config;
  const field = (key: string, label: string, value: string) => html`
    <label>${label}
      <input type="text" .value=${value} @input=${(event: Event) => actions.patch({ ...config, [key]: inputValue(event) })} />
    </label>
  `;
  if (widget.type === "entity" || widget.type === "light" || widget.type === "climate" || widget.type === "sensor") {
    return html`
      ${field("name", t(lang, "name"), String(config.name ?? ""))}
      ${entityPicker(String(config.entity_id ?? ""), actions, (entityId) => actions.patch({ ...config, entity_id: entityId }))}
      ${widget.type === "entity" ? check(lang, "show_toggle", config.show_toggle !== false, (value) => actions.patch({ ...config, show_toggle: value })) : nothing}
      ${widget.type === "light" ? check(lang, "show_brightness", config.show_brightness !== false, (value) => actions.patch({ ...config, show_brightness: value })) : nothing}
      ${widget.type === "climate" ? numberField(lang, "step", Number(config.step ?? 0.5), 0.1, 5, 0.1, (value) => actions.patch({ ...config, step: value })) : nothing}
      ${widget.type === "sensor" ? html`
        ${numberField(lang, "hours", Number(config.hours ?? 24), 1, 168, 1, (value) => actions.patch({ ...config, hours: value }))}
        ${numberField(lang, "decimals", Number(config.decimals ?? 1), 0, 3, 1, (value) => actions.patch({ ...config, decimals: value }))}
      ` : nothing}
    `;
  }
  if (widget.type === "button") {
    const domain = String(config.domain ?? "");
    return html`
      ${field("label", t(lang, "label"), String(config.label ?? ""))}
      <label>${t(lang, "domain")}
        <input list="gv-domains" .value=${domain} @input=${(event: Event) => actions.patch({ ...config, domain: inputValue(event) })} />
        <datalist id="gv-domains">${serviceDomains(actions.hass).map((item) => html`<option value=${item}></option>`)}</datalist>
      </label>
      <label>${t(lang, "service")}
        <input list="gv-services" .value=${String(config.service ?? "")} @input=${(event: Event) => actions.patch({ ...config, service: inputValue(event) })} />
        <datalist id="gv-services">${serviceNames(actions.hass, domain).map((item) => html`<option value=${item}></option>`)}</datalist>
      </label>
      ${entityPicker(String(config.entity_id ?? ""), actions, (entityId) => actions.patch({ ...config, entity_id: entityId }), "target_entity")}
      <label>${t(lang, "service_data")}
        <textarea .value=${String(config.data ?? "")} @input=${(event: Event) => actions.patch({ ...config, data: (event.target as HTMLTextAreaElement).value })}></textarea>
      </label>
      ${check(lang, "confirm_first", config.confirm === true, (value) => actions.patch({ ...config, confirm: value }))}
    `;
  }
  if (widget.type === "text") {
    return html`
      <label>${t(lang, "text")}
        <textarea .value=${String(config.text ?? "")} @input=${(event: Event) => actions.patch({ ...config, text: (event.target as HTMLTextAreaElement).value })}></textarea>
      </label>
      ${alignField(lang, String(config.align ?? "left"), (align) => actions.patch({ ...config, align }))}
    `;
  }
  if (widget.type === "clock") {
    const mode = String(config.mode ?? "both");
    return html`
      <label>${t(lang, "mode")}
        <select .value=${mode} @change=${(event: Event) => actions.patch({ ...config, mode: inputValue(event) })}>
          <option value="both">${t(lang, "both")}</option>
          <option value="time">${t(lang, "time")}</option>
          <option value="date">${t(lang, "date")}</option>
        </select>
      </label>
    `;
  }
  if (widget.type === "image") {
    const source = String(config.source ?? "entity");
    return html`
      <label>${t(lang, "source")}
        <select .value=${source} @change=${(event: Event) => actions.patch({ ...config, source: inputValue(event) })}>
          <option value="entity">${t(lang, "camera")}</option>
          <option value="url">${t(lang, "url")}</option>
        </select>
      </label>
      ${source === "url"
        ? field("url", t(lang, "url"), String(config.url ?? ""))
        : entityPicker(String(config.entity_id ?? ""), actions, (entityId) => actions.patch({ ...config, entity_id: entityId }), "camera")}
      <label>${t(lang, "fit")}
        <select .value=${String(config.fit ?? "cover")} @change=${(event: Event) => actions.patch({ ...config, fit: inputValue(event) })}>
          <option value="cover">${t(lang, "cover")}</option>
          <option value="contain">${t(lang, "contain")}</option>
        </select>
      </label>
      ${numberField(lang, "refresh", Number(config.refresh ?? 10), 0, 3600, 1, (value) => actions.patch({ ...config, refresh: value }))}
    `;
  }
  if (widget.type === "group") {
    const ids = Array.isArray(config.entity_ids) ? config.entity_ids.map(String) : [];
    return html`
      ${field("name", t(lang, "name"), String(config.name ?? ""))}
      ${check(lang, "show_toggle", config.show_toggle !== false, (value) => actions.patch({ ...config, show_toggle: value }))}
      <div class="chips">
        ${ids.map((id) => html`<button class="chip" @click=${() => actions.patch({ ...config, entity_ids: ids.filter((item) => item !== id) })}>${id}</button>`)}
      </div>
      ${entityPicker("", actions, (entityId) => {
        if (!entityId || ids.includes(entityId)) return;
        actions.patch({ ...config, entity_ids: [...ids, entityId] });
      }, "add_entity")}
    `;
  }
  return html`
    <label>${t(lang, "content")}
      <textarea .value=${String(config.content ?? "")} @input=${(event: Event) => actions.patch({ ...config, content: (event.target as HTMLTextAreaElement).value })}></textarea>
    </label>
    <p class="hint">${config.html ? t(lang, "html_hint") : t(lang, "markdown_hint")}</p>
    ${check(lang, "allow_html", config.html === true, (value) => actions.patch({ ...config, html: value }))}
  `;
}

function renderEntity(widget: Widget, actions: WidgetActions, wide: boolean): TemplateResult {
  const entityId = String(widget.config.entity_id ?? "");
  const state = actions.hass?.states?.[entityId];
  const name = String(widget.config.name || entityName(state, entityId || t(actions.lang, "no_entity")));
  const active = isActive(state?.state);
  const iconName = widget.style.icon || (typeof state?.attributes.icon === "string" ? state.attributes.icon : "") || (entityId ? domainIcon(entityId) : "mdi:shape-outline");
  const showToggle = widget.config.show_toggle !== false && !!entityId && canToggle(entityId);
  return html`
    <div class="tile ${wide ? "wide" : ""}">
      <button class="mark ${active ? "on" : ""}" @click=${(event: Event) => entityId && actions.onMoreInfo(entityId, event)}>${icon(iconName)}</button>
      <button class="stack-text" @click=${(event: Event) => entityId && actions.onMoreInfo(entityId, event)}>
        <div class="name">${name}</div>
        <div class="state">${entityId ? formatState(actions.hass, entityId, t(actions.lang, "unknown")) : t(actions.lang, "no_entity")}</div>
      </button>
      ${showToggle
        ? html`<button class="switch ${active ? "on" : ""}" aria-label=${name} @click=${(event: Event) => { event.stopPropagation(); actions.onToggle(entityId); }}></button>`
        : nothing}
    </div>
  `;
}

function renderLight(widget: Widget, actions: WidgetActions): TemplateResult {
  const entityId = String(widget.config.entity_id ?? "");
  const state = actions.hass?.states?.[entityId];
  const brightness = Number(state?.attributes.brightness ?? 0);
  const active = state?.state === "on";
  return html`
    <div class="light">
      ${renderEntity(widget, actions, false)}
      ${widget.config.show_brightness !== false && entityId
        ? html`<div class="slider-row">
            <input class="slider" type="range" min="1" max="255" .value=${String(brightness || 1)} aria-label=${t(actions.lang, "brightness")}
              @input=${(event: Event) => actions.onBrightness(entityId, Number((event.target as HTMLInputElement).value))}
              @click=${(event: Event) => event.stopPropagation()} />
            <div class="state">${active ? `${Math.round((brightness / 255) * 100)}%` : formatState(actions.hass, entityId, "")}</div>
          </div>`
        : nothing}
    </div>
  `;
}

function renderClimate(widget: Widget, actions: WidgetActions): TemplateResult {
  const entityId = String(widget.config.entity_id ?? "");
  const state = actions.hass?.states?.[entityId];
  const current = state?.attributes.current_temperature;
  const target = Number(state?.attributes.temperature ?? state?.attributes.target_temp_high ?? NaN);
  const step = Number(widget.config.step ?? state?.attributes.target_temp_step ?? 0.5);
  const name = String(widget.config.name || entityName(state, entityId || t(actions.lang, "no_entity")));
  return html`
    <div class="climate">
      <div>
        <div class="name">${name}</div>
        <div class="state">${entityId ? formatState(actions.hass, entityId, "") : t(actions.lang, "no_entity")}</div>
      </div>
      <div class="temp-row">
        <span class="sensor-value">${formatMaybe(current, actions.lang, 1)}<span class="unit">°</span></span>
      </div>
      ${entityId
        ? html`<div class="stepper">
            <button class="icon-btn" @click=${(event: Event) => { event.stopPropagation(); actions.onTemperature(entityId, roundStep(target, -step)); }}>${icon("mdi:chevron-down")}</button>
            <div><div class="state">${t(actions.lang, "target")}</div><strong>${formatMaybe(target, actions.lang, 1)}°</strong></div>
            <button class="icon-btn" @click=${(event: Event) => { event.stopPropagation(); actions.onTemperature(entityId, roundStep(target, step)); }}>${icon("mdi:chevron-up")}</button>
          </div>`
        : nothing}
    </div>
  `;
}

function renderSensor(widget: Widget, actions: WidgetActions): TemplateResult {
  const entityId = String(widget.config.entity_id ?? "");
  const state = actions.hass?.states?.[entityId];
  const decimals = Number(widget.config.decimals ?? 1);
  const numeric = Number.parseFloat(state?.state ?? "");
  const name = String(widget.config.name || entityName(state, entityId || t(actions.lang, "no_entity")));
  const unit = typeof state?.attributes.unit_of_measurement === "string" ? state.attributes.unit_of_measurement : "";
  const series = [...(actions.history[historyKey(entityId, widget)] ?? [])];
  if (Number.isFinite(numeric)) series.push(numeric);
  return html`
    <div class="sensor">
      <div class="name">${name}</div>
      <div class="sensor-value">${entityId ? formatMaybe(numeric, actions.lang, decimals) : "–"}<span class="unit">${unit}</span></div>
      ${series.length > 1 ? spark(series) : html`<div class="hint">${t(actions.lang, "history_empty")}</div>`}
    </div>
  `;
}

function renderButton(widget: Widget, actions: WidgetActions): TemplateResult {
  const label = String(widget.config.label || t(actions.lang, "widget_button"));
  const iconName = widget.style.icon || "mdi:button-pointer";
  return html`<button class="press" ?disabled=${actions.edit} @click=${(event: Event) => { event.stopPropagation(); actions.onService(widget); }}>${icon(iconName)}<span>${label}</span></button>`;
}

function renderText(widget: Widget, lang: Lang): TemplateResult {
  const align = String(widget.config.align ?? "left");
  const text = String(widget.config.text || t(lang, "placeholder_text"));
  return html`<div class="text-block" style="justify-content: ${align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"}; text-align: ${align}">${text}</div>`;
}

function renderClock(widget: Widget, lang: Lang): TemplateResult {
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const now = new Date();
  const mode = String(widget.config.mode ?? "both");
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(now);
  const date = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now);
  return html`<div class="clock">${mode !== "date" ? html`<div class="clock-time">${time}</div>` : nothing}${mode !== "time" ? html`<div class="clock-date">${date}</div>` : nothing}</div>`;
}

function renderImage(widget: Widget, actions: WidgetActions): TemplateResult {
  const source = String(widget.config.source ?? "entity");
  const entityId = String(widget.config.entity_id ?? "");
  const url = source === "url" ? String(widget.config.url ?? "") : mediaUrl(actions.hass, entityId);
  const fit = String(widget.config.fit ?? "cover");
  const refresh = Number(widget.config.refresh ?? 0);
  const stamp = refresh > 0 ? Math.floor(Date.now() / (refresh * 1000)) : 0;
  const src = url && stamp && !url.startsWith("data:") ? `${url}${url.includes("?") ? "&" : "?"}t=${stamp}` : url;
  if (!src) {
    return html`<div class="placeholder">${icon(widget.style.icon || "mdi:image-outline")}<span>${t(actions.lang, "image_empty")}</span></div>`;
  }
  return html`<div class="shot"><img alt="" src=${src} style="object-fit: ${fit}" @error=${(event: Event) => ((event.target as HTMLImageElement).style.display = "none")} /></div>`;
}

function renderGroup(widget: Widget, actions: WidgetActions): TemplateResult {
  const ids = Array.isArray(widget.config.entity_ids) ? widget.config.entity_ids.map(String) : [];
  const showToggle = widget.config.show_toggle !== false;
  return html`
    <div class="group">
      ${widget.config.name ? html`<h3>${widget.config.name}</h3>` : nothing}
      ${ids.length
        ? ids.map((entityId) => {
            const state = actions.hass?.states?.[entityId];
            const active = isActive(state?.state);
            return html`<div class="row">
              <span class="mark ${active ? "on" : ""}">${icon(widget.style.icon || (typeof state?.attributes.icon === "string" ? state.attributes.icon : domainIcon(entityId)))}</span>
              <button @click=${(event: Event) => actions.onMoreInfo(entityId, event)}><div class="name">${entityName(state, entityId)}</div><div class="state">${formatState(actions.hass, entityId, t(actions.lang, "unknown"))}</div></button>
              <span></span>
              ${showToggle && canToggle(entityId)
                ? html`<button class="switch ${active ? "on" : ""}" @click=${(event: Event) => { event.stopPropagation(); actions.onToggle(entityId); }}></button>`
                : nothing}
            </div>`;
          })
        : html`<div class="hint">${t(actions.lang, "group_empty")}</div>`}
    </div>
  `;
}

function renderMarkdown(widget: Widget, lang: Lang): TemplateResult {
  const content = String(widget.config.content || t(lang, "placeholder_markdown"));
  return html`<div class="prose">${unsafeHTML(renderBlock(content, widget.config.html === true))}</div>`;
}

function spark(values: number[]): TemplateResult {
  const width = 240;
  const height = 64;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / Math.max(1, values.length - 1);
  const line = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * (height - 6) - 3;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const fill = `${line} L ${width} ${height} L 0 ${height} Z`;
  return html`<svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path class="spark-fill" d=${fill}></path><path class="spark-line" d=${line}></path></svg>`;
}

function entityPicker(
  selected: string,
  actions: EditorActions,
  onPick: (entityId: string) => void,
  labelKey: "entity" | "target_entity" | "camera" | "add_entity" = "entity",
): TemplateResult {
  const matches = listEntities(actions.hass, actions.query);
  return html`
    <label>${t(actions.lang, labelKey)}
      <input type="search" placeholder=${t(actions.lang, "search_entities")} .value=${actions.query} @input=${(event: Event) => actions.onQuery(inputValue(event))} />
    </label>
    ${selected ? html`<div class="state">${selected}</div>` : nothing}
    <div class="results">
      ${matches.length
        ? matches.map((state) => html`<button @click=${() => onPick(state.entity_id)}>${entityName(state, state.entity_id)}<small>${state.entity_id}</small></button>`)
        : html`<div class="hint">${t(actions.lang, "no_entities")}</div>`}
    </div>
  `;
}

function check(lang: Lang, key: "show_toggle" | "show_brightness" | "confirm_first" | "allow_html", checked: boolean, onChange: (value: boolean) => void): TemplateResult {
  return html`<label class="check"><input type="checkbox" .checked=${checked} @change=${(event: Event) => onChange((event.target as HTMLInputElement).checked)} />${t(lang, key)}</label>`;
}

function numberField(
  lang: Lang,
  key: "step" | "hours" | "decimals" | "refresh" | "font_size" | "radius" | "width" | "height",
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void,
): TemplateResult {
  return html`<label>${t(lang, key)}<input type="number" min=${min} max=${max} step=${step} .value=${String(value)} @input=${(event: Event) => onChange(Number(inputValue(event)))} /></label>`;
}

function alignField(lang: Lang, value: string, onChange: (value: string) => void): TemplateResult {
  return html`<label>${t(lang, "align")}<select .value=${value} @change=${(event: Event) => onChange(inputValue(event))}><option value="left">${t(lang, "left")}</option><option value="center">${t(lang, "center")}</option><option value="right">${t(lang, "right")}</option></select></label>`;
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

function formatMaybe(value: unknown, lang: Lang, decimals: number): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "–";
  return new Intl.NumberFormat(lang === "sv" ? "sv-SE" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numeric);
}

function roundStep(current: number, delta: number): number {
  const base = Number.isFinite(current) ? current : 20;
  return Math.round((base + delta) * 10) / 10;
}

export function historyKey(entityId: string, widget: Widget): string {
  return `${entityId}:${Number(widget.config.hours ?? 24)}`;
}

export { numberField };
