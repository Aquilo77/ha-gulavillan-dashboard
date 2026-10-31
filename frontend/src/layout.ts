/** Layout model shared by the editor and the stored JSON. */

export const WIDGET_TYPES = [
  "entity",
  "light",
  "climate",
  "sensor",
  "button",
  "text",
  "clock",
  "image",
  "group",
  "markdown",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
export type Language = "sv" | "en";
export type ThemeMode = "auto" | "light" | "dark";

export interface WidgetStyle {
  color?: string;
  background?: string;
  fontSize?: number;
  icon?: string;
  borderRadius?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  style: WidgetStyle;
  config: Record<string, unknown>;
}

export interface Page {
  id: string;
  title: string;
  icon?: string;
  widgets: Widget[];
}

export interface Layout {
  version: 1;
  language: Language;
  theme: ThemeMode;
  gridColumns: number;
  pages: Page[];
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const ICON_RE = /^mdi:[a-z0-9-]+$/;
const ENTITY_RE = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const SLUG_RE = /^[a-z0-9_]+$/;
const COLOR_RE = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent)$/;

const SIZES: Record<WidgetType, [number, number]> = {
  entity: [6, 4],
  light: [6, 5],
  climate: [8, 6],
  sensor: [8, 5],
  button: [4, 3],
  text: [8, 2],
  clock: [8, 5],
  image: [8, 6],
  group: [8, 7],
  markdown: [10, 5],
};

export function defaultLayout(): Layout {
  return {
    version: 1,
    language: "sv",
    theme: "auto",
    gridColumns: 24,
    pages: [
      {
        id: "hem",
        title: "Hem",
        icon: "mdi:home-variant",
        widgets: [
          {
            id: "klocka",
            type: "clock",
            x: 0,
            y: 0,
            w: 10,
            h: 6,
            style: { fontSize: 64 },
            config: { mode: "both" },
          },
          {
            id: "titel",
            type: "text",
            x: 10,
            y: 0,
            w: 14,
            h: 2,
            style: { fontSize: 40 },
            config: { text: "Gulavillan", align: "left" },
          },
          {
            id: "valkomst",
            type: "markdown",
            x: 10,
            y: 2,
            w: 14,
            h: 4,
            style: {},
            config: {
              content:
                "Det här är en fri yta.\n\nTryck på pennan för att lägga till, dra och ändra storlek på widgets. Layouten sparas i Home Assistant och följer med mellan enheter.",
              html: false,
            },
          },
        ],
      },
    ],
  };
}

export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const stamp = Date.now().toString(36);
  return `${prefix}_${stamp}_${rand}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function findSpot(
  widgets: Widget[],
  w: number,
  h: number,
  columns: number,
): { x: number; y: number } {
  const hits = (x: number, y: number) =>
    widgets.some(
      (item) => x < item.x + item.w && x + w > item.x && y < item.y + item.h && y + h > item.y,
    );
  for (let y = 0; y < 80; y += 1) {
    for (let x = 0; x <= columns - w; x += 1) {
      if (!hits(x, y)) return { x, y };
    }
  }
  const bottom = widgets.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  return { x: 0, y: bottom };
}

export function createWidget(type: WidgetType, page: Page, columns: number): Widget {
  const [w, h] = SIZES[type];
  const spot = findSpot(page.widgets, Math.min(w, columns), h, columns);
  const widget: Widget = {
    id: uid(type),
    type,
    x: spot.x,
    y: spot.y,
    w: Math.min(w, columns),
    h,
    style: {},
    config: defaultConfig(type),
  };
  if (type === "clock") widget.style.fontSize = 64;
  if (type === "text") widget.style.fontSize = 32;
  return widget;
}

export function defaultConfig(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case "entity":
      return { entity_id: "", name: "", show_toggle: true };
    case "light":
      return { entity_id: "", name: "", show_brightness: true };
    case "climate":
      return { entity_id: "", name: "", step: 0.5 };
    case "sensor":
      return { entity_id: "", name: "", hours: 24, decimals: 1 };
    case "button":
      return { label: "", domain: "", service: "", data: "", entity_id: "", confirm: false };
    case "text":
      return { text: "", align: "left" };
    case "clock":
      return { mode: "both" };
    case "image":
      return { source: "entity", entity_id: "", url: "", fit: "cover", refresh: 10 };
    case "group":
      return { name: "", entity_ids: [], show_toggle: true };
    case "markdown":
      return { content: "", html: false };
  }
}

export function normalizeLayout(input: unknown): Layout {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("invalid");
  }
  const raw = input as Record<string, unknown>;
  if (raw.version !== undefined && raw.version !== 1) throw new Error("invalid");
  const language: Language = raw.language === "en" ? "en" : "sv";
  const theme: ThemeMode =
    raw.theme === "light" || raw.theme === "dark" || raw.theme === "auto" ? raw.theme : "auto";
  const gridColumns = clamp(asInt(raw.gridColumns, 24), 8, 48);
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) throw new Error("invalid");

  const seen = new Set<string>();
  const pages = raw.pages.slice(0, 20).map((page, index) => normalizePage(page, index, gridColumns, seen));
  if (!pages.length) throw new Error("invalid");
  return { version: 1, language, theme, gridColumns, pages };
}

export function exportLayout(layout: Layout): string {
  return JSON.stringify(normalizeLayout(layout), null, 2);
}

export function importLayout(raw: string): Layout {
  return normalizeLayout(JSON.parse(raw));
}

export function sortForNarrow(widgets: Widget[]): Widget[] {
  return [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
}

function normalizePage(
  input: unknown,
  index: number,
  columns: number,
  seen: Set<string>,
): Page {
  const raw = asRecord(input);
  const id = uniqueId(raw.id, `page_${index + 1}`, seen);
  const title = clip(asString(raw.title).trim() || `Sida ${index + 1}`, 80);
  const icon = optionalIcon(raw.icon);
  const widgets = Array.isArray(raw.widgets) ? raw.widgets : [];
  const page: Page = {
    id,
    title,
    widgets: widgets
      .slice(0, 80)
      .map((widget, widgetIndex) => normalizeWidget(widget, widgetIndex, columns, seen))
      .filter((widget): widget is Widget => widget !== null),
  };
  if (icon) page.icon = icon;
  return page;
}

function normalizeWidget(
  input: unknown,
  index: number,
  columns: number,
  seen: Set<string>,
): Widget | null {
  const raw = asRecord(input);
  if (!WIDGET_TYPES.includes(raw.type as WidgetType)) return null;
  const type = raw.type as WidgetType;
  const id = uniqueId(raw.id, `${type}_${index + 1}`, seen);
  let w = clamp(asInt(raw.w, 4), 2, columns);
  const x = clamp(asInt(raw.x, 0), 0, Math.max(0, columns - 2));
  if (x + w > columns) w = columns - x;
  return {
    id,
    type,
    x,
    y: clamp(asInt(raw.y, 0), 0, 200),
    w,
    h: clamp(asInt(raw.h, 3), 2, 40),
    style: normalizeStyle(raw.style),
    config: normalizeConfig(type, raw.config),
  };
}

function normalizeStyle(input: unknown): WidgetStyle {
  const raw = asRecord(input);
  const style: WidgetStyle = {};
  const color = optionalColor(raw.color);
  const background = optionalColor(raw.background);
  const icon = optionalIcon(raw.icon);
  if (color) style.color = color;
  if (background) style.background = background;
  if (raw.fontSize !== undefined && raw.fontSize !== "") {
    style.fontSize = clamp(asInt(raw.fontSize, 16), 8, 120);
  }
  if (raw.borderRadius !== undefined && raw.borderRadius !== "") {
    style.borderRadius = clamp(asInt(raw.borderRadius, 18), 0, 80);
  }
  if (icon) style.icon = icon;
  return style;
}

function normalizeConfig(type: WidgetType, input: unknown): Record<string, unknown> {
  const raw = asRecord(input);
  const config = defaultConfig(type);
  const entity = (key = "entity_id") => {
    const value = asString(raw[key]).trim();
    config[key] = ENTITY_RE.test(value) ? value : "";
  };
  if (type === "entity" || type === "light" || type === "climate" || type === "sensor") {
    entity();
    config.name = clip(asString(raw.name).trim(), 80);
  }
  if (type === "entity") config.show_toggle = raw.show_toggle !== false;
  if (type === "light") config.show_brightness = raw.show_brightness !== false;
  if (type === "climate") config.step = clamp(asNumber(raw.step, 0.5), 0.1, 5);
  if (type === "sensor") {
    config.hours = clamp(asInt(raw.hours, 24), 1, 168);
    config.decimals = clamp(asInt(raw.decimals, 1), 0, 3);
  }
  if (type === "button") {
    entity();
    config.label = clip(asString(raw.label).trim(), 80);
    config.domain = slug(raw.domain);
    config.service = slug(raw.service);
    config.data = jsonObject(raw.data);
    config.confirm = raw.confirm === true;
  }
  if (type === "text") {
    config.text = clip(asString(raw.text), 2000);
    config.align = raw.align === "center" || raw.align === "right" ? raw.align : "left";
  }
  if (type === "clock") {
    config.mode = raw.mode === "time" || raw.mode === "date" ? raw.mode : "both";
  }
  if (type === "image") {
    entity();
    config.source = raw.source === "url" ? "url" : "entity";
    config.url = cleanUrl(asString(raw.url));
    config.fit = raw.fit === "contain" ? "contain" : "cover";
    config.refresh = clamp(asInt(raw.refresh, 10), 0, 3600);
  }
  if (type === "group") {
    config.name = clip(asString(raw.name).trim(), 80);
    const ids = Array.isArray(raw.entity_ids) ? raw.entity_ids : [];
    config.entity_ids = ids
      .map((item) => asString(item).trim())
      .filter((item) => ENTITY_RE.test(item))
      .slice(0, 40);
    config.show_toggle = raw.show_toggle !== false;
  }
  if (type === "markdown") {
    config.content = clip(asString(raw.content), 20000);
    config.html = raw.html === true;
  }
  return config;
}

function uniqueId(value: unknown, fallback: string, seen: Set<string>): string {
  let id = asString(value);
  if (!ID_RE.test(id)) id = fallback;
  if (!ID_RE.test(id)) id = uid("id");
  while (seen.has(id)) id = uid("id");
  seen.add(id);
  return id;
}

function optionalIcon(value: unknown): string {
  const icon = asString(value).trim();
  return ICON_RE.test(icon) ? icon : "";
}

function optionalColor(value: unknown): string {
  const color = asString(value).trim();
  return COLOR_RE.test(color) ? color : "";
}

function slug(value: unknown): string {
  const text = asString(value).trim();
  return SLUG_RE.test(text) ? text : "";
}

function cleanUrl(value: string): string {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 500 || /\s/.test(cleaned)) return "";
  const lowered = cleaned.toLowerCase();
  if (/^(javascript|data|file|vbscript):/.test(lowered) || cleaned.startsWith("//")) return "";
  if (cleaned.startsWith("/") || lowered.startsWith("https://") || lowered.startsWith("http://")) {
    return cleaned;
  }
  return "";
}

function jsonObject(value: unknown): string {
  const text = asString(value).trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
    return JSON.stringify(parsed);
  } catch {
    return "";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asInt(value: unknown, fallback: number): number {
  if (typeof value === "boolean") return fallback;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "boolean") return fallback;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clip(value: string, limit: number): string {
  return value.length > limit ? value.slice(0, limit) : value;
}
