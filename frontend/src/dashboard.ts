/** Free-form dashboard: view mode, editor, pages and persistence. */

import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { classMap } from "lit/directives/class-map.js";
import {
  fetchHistory,
  fetchLayout,
  saveLayout,
  subscribeStates,
  toggleEntity,
  type HassLike,
} from "./api";
import { icon } from "./icons";
import { t, type Lang, type MessageKey } from "./i18n";
import {
  WIDGET_TYPES,
  clamp,
  createWidget,
  defaultLayout,
  exportLayout,
  importLayout,
  normalizeLayout,
  sortForNarrow,
  uid,
  type Layout,
  type Page,
  type Widget,
  type WidgetStyle,
  type WidgetType,
} from "./layout";
import { appStyles } from "./styles";
import { historyKey, numberField, renderEditor, renderWidget } from "./widgets";

const CATALOG: { type: WidgetType; icon: string; label: MessageKey }[] = [
  { type: "entity", icon: "mdi:toggle-switch-outline", label: "widget_entity" },
  { type: "light", icon: "mdi:lightbulb-outline", label: "widget_light" },
  { type: "climate", icon: "mdi:thermostat", label: "widget_climate" },
  { type: "sensor", icon: "mdi:chart-line", label: "widget_sensor" },
  { type: "button", icon: "mdi:button-pointer", label: "widget_button" },
  { type: "text", icon: "mdi:format-text", label: "widget_text" },
  { type: "clock", icon: "mdi:clock-outline", label: "widget_clock" },
  { type: "image", icon: "mdi:image-outline", label: "widget_image" },
  { type: "group", icon: "mdi:format-list-bulleted", label: "widget_group" },
  { type: "markdown", icon: "mdi:text-box-outline", label: "widget_markdown" },
];

interface DragState {
  id: string;
  pointerId: number;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cell: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

export class GulavillanDashboard extends LitElement {
  static styles = appStyles;

  @property({ attribute: false }) hass?: HassLike;
  @property({ type: Boolean }) narrow = false;
  @property({ attribute: false }) panel?: { title?: string; config?: Record<string, unknown> };
  @property({ attribute: false }) route?: unknown;

  @state() private layout: Layout = defaultLayout();
  @state() private status: "loading" | "ready" | "error" = "loading";
  @state() private saveState: "idle" | "saving" | "saved" | "error" = "idle";
  @state() private edit = false;
  @state() private pageId = "hem";
  @state() private selectedId = "";
  @state() private preview: "desktop" | "tablet" | "phone" = "desktop";
  @state() private stageWidth = 1200;
  @state() private toast = "";
  @state() private query = "";
  @state() private history: Record<string, number[]> = {};
  @state() private tick = 0;
  @state() private modal: { text: string; run: () => void } | null = null;

  private unsub?: () => void;
  private observer?: ResizeObserver;
  private clockTimer = 0;
  private saveTimer = 0;
  private toastTimer = 0;
  private drag: DragState | null = null;
  private undoStack: Layout[] = [];
  private undoArmed = false;
  private loaded = false;
  private historyAt = new Map<string, number>();
  private moveFrame = 0;
  private lastPointer?: PointerEvent;

  connectedCallback(): void {
    super.connectedCallback();
    this.clockTimer = window.setInterval(() => {
      if (this.drag) return;
      if (this.currentPage?.widgets.some((widget) => widget.type === "clock" || widget.type === "image")) {
        this.tick += 1;
      }
    }, 1000);
    window.addEventListener("keydown", this.onKey);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.clockTimer);
    window.clearTimeout(this.saveTimer);
    window.clearTimeout(this.toastTimer);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.observer?.disconnect();
    void this.unsub?.();
    this.unsub = undefined;
  }

  protected firstUpdated(): void {
    this.watchStage();
    void this.ensureSubscription();
    void this.maybeLoad();
  }

  private watchStage(): void {
    if (this.observer) return;
    const stage = this.renderRoot.querySelector(".stage");
    if (stage) {
      this.observer = new ResizeObserver(() => {
        const width = stage.clientWidth;
        if (width && Math.abs(width - this.stageWidth) > 2) this.stageWidth = width;
      });
      this.observer.observe(stage);
      this.stageWidth = stage.clientWidth || this.stageWidth;
    }
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass")) {
      void this.ensureSubscription();
      void this.maybeLoad();
    }
    this.syncTheme();
    if (this.status === "ready") void this.ensureHistory();
    if (!this.observer) this.watchStage();
  }

  private get uiLanguage(): Lang {
    return this.layout.language === "en" ? "en" : "sv";
  }

  private get isAdmin(): boolean {
    return this.hass?.user?.is_admin === true;
  }

  private get currentPage(): Page | undefined {
    return this.layout.pages.find((page) => page.id === this.pageId) ?? this.layout.pages[0];
  }

  private get selected(): Widget | undefined {
    return this.currentPage?.widgets.find((widget) => widget.id === this.selectedId);
  }

  private get stacked(): boolean {
    return this.narrow || this.preview === "phone" || (this.stageWidth > 0 && this.stageWidth < 640);
  }

  private get panelTitle(): string {
    const configured = this.panel?.config?.sidebar_title;
    if (typeof configured === "string" && configured.trim()) return configured;
    return this.panel?.title || "Gulavillan";
  }

  protected render(): TemplateResult {
    if (this.status === "loading" && !this.loaded) {
      return html`<div class="app"><div class="splash">${t(this.uiLanguage, "loading")}</div></div>`;
    }
    const page = this.currentPage;
    return html`
      <div class="app">
        ${this.renderToolbar()}
        ${this.status === "error" ? html`<div class="banner">${t(this.uiLanguage, "load_failed")} <button class="text-btn" @click=${() => void this.load()}>${t(this.uiLanguage, "retry")}</button></div>` : nothing}
        ${this.edit ? this.renderSubbar() : nothing}
        <div class="workspace ${classMap({ editing: this.edit, inspecting: this.edit })}">
          ${this.edit ? this.renderPalette() : nothing}
          <div class="stage ${this.preview === "desktop" ? "" : "frame"}" style=${this.preview === "tablet" ? "--frame: 834px" : this.preview === "phone" ? "--frame: 390px" : ""}>
            ${page ? this.renderCanvas(page) : nothing}
          </div>
          ${this.edit ? this.renderInspector() : nothing}
        </div>
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
        ${this.modal
          ? html`<div class="modal-back"><div class="modal"><p>${this.modal.text}</p><div class="row-end"><button class="text-btn" @click=${() => (this.modal = null)}>${t(this.uiLanguage, "cancel")}</button><button class="text-btn primary" @click=${() => { const run = this.modal?.run; this.modal = null; run?.(); }}>${t(this.uiLanguage, "confirm")}</button></div></div></div>`
          : nothing}
      </div>
    `;
  }

  private renderToolbar(): TemplateResult {
    return html`
      <header class="topbar">
        <div class="brand">${icon("mdi:home-variant")}<span>${this.panelTitle}</span></div>
        <nav class="tabs">
          ${this.layout.pages.map((page) => html`
            <button class="tab ${page.id === this.currentPage?.id ? "active" : ""}" @click=${() => this.selectPage(page.id)}>
              ${page.icon ? icon(page.icon) : nothing}${page.title}
            </button>
          `)}
        </nav>
        <span class="spacer"></span>
        ${this.saveState === "saving" ? html`<span class="status">${t(this.uiLanguage, "saving")}</span>` : nothing}
        ${this.isAdmin
          ? html`<button class="icon-btn ${this.edit ? "primary" : ""}" title=${this.edit ? t(this.uiLanguage, "done") : t(this.uiLanguage, "edit")} @click=${() => this.toggleEdit()}>${icon(this.edit ? "mdi:check" : "mdi:pencil")}</button>`
          : nothing}
      </header>
    `;
  }

  private renderSubbar(): TemplateResult {
    const lang = this.uiLanguage;
    return html`
      <div class="subbar">
        <button class="text-btn" @click=${() => this.addPage()}>${icon("mdi:plus")} ${t(lang, "add_page")}</button>
        <button class="icon-btn" title=${t(lang, "undo")} ?disabled=${!this.undoStack.length} @click=${() => this.undo()}>${icon("mdi:undo")}</button>
        <button class="text-btn" @click=${() => this.download()}>${icon("mdi:download")} ${t(lang, "export")}</button>
        <label class="text-btn">${icon("mdi:upload")} ${t(lang, "import")}<input type="file" accept="application/json,.json" hidden @change=${(event: Event) => void this.upload(event)} /></label>
        <span class="spacer"></span>
        <div class="seg" aria-label=${t(lang, "preview")}>
          ${(["desktop", "tablet", "phone"] as const).map((mode) => html`
            <button class=${mode === this.preview ? "active" : ""} @click=${() => (this.preview = mode)}>${t(lang, mode)}</button>
          `)}
        </div>
        <div class="seg">
          <button class=${this.layout.language === "sv" ? "active" : ""} @click=${() => this.patchLayout({ language: "sv" })}>SV</button>
          <button class=${this.layout.language === "en" ? "active" : ""} @click=${() => this.patchLayout({ language: "en" })}>EN</button>
        </div>
        <div class="seg">
          ${(["auto", "light", "dark"] as const).map((theme) => html`
            <button class=${this.layout.theme === theme ? "active" : ""} @click=${() => this.patchLayout({ theme })}>${t(lang, theme === "auto" ? "theme_auto" : theme === "light" ? "theme_light" : "theme_dark")}</button>
          `)}
        </div>
      </div>
    `;
  }

  private renderPalette(): TemplateResult {
    return html`<aside class="palette">${CATALOG.map((item) => html`
      <button @click=${() => this.addWidget(item.type)}>${icon(item.icon)}<span>${t(this.uiLanguage, item.label)}</span></button>
    `)}</aside>`;
  }

  private renderCanvas(page: Page): TemplateResult {
    const stacked = this.stacked;
    const width = Math.max(this.stageWidth - 24, 280);
    const cell = width / this.layout.gridColumns;
    const widgets = stacked ? sortForNarrow(page.widgets) : page.widgets;
    const bottom = page.widgets.reduce((max, widget) => Math.max(max, widget.y + widget.h), 8);
    return html`
      <div class="canvas ${classMap({ editing: this.edit, stack: stacked })}" style=${`--cols: ${this.layout.gridColumns}; height: ${stacked ? "auto" : `${bottom * cell}px`}`}>
        ${widgets.length
          ? widgets.map((widget) => this.renderPlaced(widget, cell, stacked))
          : html`<div class="banner">${t(this.uiLanguage, "empty_page")}</div>`}
      </div>
    `;
  }

  private renderPlaced(widget: Widget, cell: number, stacked: boolean): TemplateResult {
    const box = this.box(widget);
    const gap = 8;
    const style: Record<string, string> = {};
    if (widget.style.color) style.color = widget.style.color;
    if (widget.style.background) style.background = widget.style.background;
    if (widget.style.fontSize) style.fontSize = `${widget.style.fontSize}px`;
    if (widget.style.borderRadius !== undefined) style.borderRadius = `${widget.style.borderRadius}px`;
    if (!stacked) {
      style.left = `${box.x * cell}px`;
      style.top = `${box.y * cell}px`;
      style.width = `${Math.max(box.w * cell - gap, 48)}px`;
      style.height = `${Math.max(box.h * cell - gap, 48)}px`;
    }
    return html`
      <article class="widget kind-${widget.type} ${widget.id === this.selectedId ? "selected" : ""}" style=${styleMap(style)}
        @pointerdown=${(event: PointerEvent) => this.startDrag(event, widget, "move")}>
        <div class="widget-body">
          ${renderWidget(widget, {
            hass: this.hass,
            lang: this.uiLanguage,
            history: this.history,
            edit: this.edit,
            onToggle: (entityId) => void this.toggle(entityId),
            onBrightness: (entityId, value) => void this.brightness(entityId, value),
            onTemperature: (entityId, value) => void this.temperature(entityId, value),
            onService: (item) => void this.runButton(item),
            onMoreInfo: (entityId, event) => this.moreInfo(entityId, event),
          })}
        </div>
        ${this.edit
          ? html`<div class="chrome">
              ${stacked ? html`<button class="icon-btn" title=${t(this.uiLanguage, "move_up")} @pointerdown=${(event: Event) => event.stopPropagation()} @click=${() => this.nudgeOrder(widget, -1)}>${icon("mdi:chevron-up")}</button>` : nothing}
              ${stacked ? html`<button class="icon-btn" title=${t(this.uiLanguage, "move_down")} @pointerdown=${(event: Event) => event.stopPropagation()} @click=${() => this.nudgeOrder(widget, 1)}>${icon("mdi:chevron-down")}</button>` : nothing}
              <button class="icon-btn" title=${t(this.uiLanguage, "delete")} @pointerdown=${(event: Event) => event.stopPropagation()} @click=${() => this.removeWidget(widget.id)}>${icon("mdi:delete-outline")}</button>
            </div>
            ${stacked ? nothing : html`<div class="resize" @pointerdown=${(event: PointerEvent) => this.startDrag(event, widget, "resize")}>${icon("mdi:resize-bottom-right")}</div>`}`
          : nothing}
      </article>
    `;
  }

  private renderInspector(): TemplateResult {
    const lang = this.uiLanguage;
    const page = this.currentPage;
    const widget = this.selected;
    if (!page) return html``;
    return html`
      <aside class="inspector">
        ${widget
          ? html`
              <h3>${t(lang, "content")}</h3>
              ${renderEditor(widget, {
                hass: this.hass,
                lang,
                query: this.query,
                onQuery: (value) => (this.query = value),
                patch: (config) => this.updateWidget(widget.id, { config }),
              })}
              <h3>${t(lang, "appearance")}</h3>
              <label>${t(lang, "icon")}<input type="text" .value=${widget.style.icon ?? ""} placeholder="mdi:lightbulb" @input=${(event: Event) => this.updateWidget(widget.id, { style: { ...widget.style, icon: (event.target as HTMLInputElement).value } })} /></label>
              ${this.colorField(lang, "color", widget.style.color, (color) => this.updateWidget(widget.id, { style: { ...widget.style, color } }))}
              ${this.colorField(lang, "background", widget.style.background, (background) => this.updateWidget(widget.id, { style: { ...widget.style, background } }))}
              ${numberField(lang, "font_size", widget.style.fontSize ?? 16, 8, 120, 1, (fontSize) => this.updateWidget(widget.id, { style: { ...widget.style, fontSize } }))}
              ${numberField(lang, "radius", widget.style.borderRadius ?? 20, 0, 80, 1, (borderRadius) => this.updateWidget(widget.id, { style: { ...widget.style, borderRadius } }))}
              <h3>${t(lang, "position")}</h3>
              <div class="grid-2">
                ${numberField(lang, "width", widget.w, 2, this.layout.gridColumns, 1, (w) => this.updateWidget(widget.id, { w }))}
                ${numberField(lang, "height", widget.h, 2, 40, 1, (h) => this.updateWidget(widget.id, { h }))}
              </div>
              <button class="text-btn" @click=${() => this.removeWidget(widget.id)}>${icon("mdi:delete-outline")} ${t(lang, "delete")}</button>
            `
          : html`
              <h3>${t(lang, "pages")}</h3>
              <p class="hint">${t(lang, "select_widget")}</p>
              <label>${t(lang, "page_name")}<input type="text" .value=${page.title} @input=${(event: Event) => this.renamePage(page.id, (event.target as HTMLInputElement).value)} /></label>
              <label>${t(lang, "page_icon")}<input type="text" .value=${page.icon ?? ""} placeholder="mdi:home-variant" @input=${(event: Event) => this.iconPage(page.id, (event.target as HTMLInputElement).value)} /></label>
              ${this.layout.pages.length > 1 ? html`<button class="text-btn" @click=${() => this.deletePage(page.id)}>${t(lang, "delete_page")}</button>` : nothing}
            `}
      </aside>
    `;
  }

  private colorField(lang: Lang, key: "color" | "background", value: string | undefined, onChange: (value: string) => void): TemplateResult {
    return html`<label>${t(lang, key)}<span class="color-row"><input type="color" .value=${toHex(value)} @input=${(event: Event) => onChange((event.target as HTMLInputElement).value)} /><button class="text-btn" @click=${() => onChange("")}>${t(lang, "clear")}</button></span></label>`;
  }

  private async maybeLoad(): Promise<void> {
    if (this.loaded || !this.hass) return;
    this.loaded = true;
    await this.load();
  }

  private async load(): Promise<void> {
    if (!this.hass) return;
    this.status = "loading";
    try {
      this.layout = await fetchLayout(this.hass);
      this.pageId = this.layout.pages[0]?.id ?? "";
      this.status = "ready";
    } catch {
      this.layout = defaultLayout();
      this.pageId = this.layout.pages[0]?.id ?? "";
      this.status = "error";
    }
  }

  private async ensureSubscription(): Promise<void> {
    if (!this.hass || this.unsub) return;
    try {
      this.unsub = await subscribeStates(this.hass, () => {
        if (!this.drag) this.requestUpdate();
      });
    } catch {
      this.unsub = undefined;
    }
  }

  private async ensureHistory(): Promise<void> {
    if (!this.hass) return;
    const widgets = this.currentPage?.widgets.filter((widget) => widget.type === "sensor") ?? [];
    await Promise.all(widgets.map(async (widget) => {
      const entityId = String(widget.config.entity_id ?? "");
      if (!entityId) return;
      const key = historyKey(entityId, widget);
      const seen = this.historyAt.get(key) ?? 0;
      if (Date.now() - seen < 60_000) return;
      this.historyAt.set(key, Date.now());
      try {
        const values = await fetchHistory(this.hass!, entityId, Number(widget.config.hours ?? 24));
        this.history = { ...this.history, [key]: values };
      } catch {
        this.history = { ...this.history, [key]: this.history[key] ?? [] };
      }
    }));
  }

  private toggleEdit(): void {
    if (!this.isAdmin) {
      this.flash(t(this.uiLanguage, "admin_only"));
      return;
    }
    this.edit = !this.edit;
    if (!this.edit) {
      this.selectedId = "";
      void this.persist();
    }
  }

  private patchLayout(partial: Partial<Layout>): void {
    this.beforeChange();
    this.layout = normalizeLayout({ ...this.layout, ...partial });
    this.scheduleSave();
  }

  private addPage(): void {
    this.beforeChange();
    const page: Page = { id: uid("sida"), title: `${t(this.uiLanguage, "pages")} ${this.layout.pages.length + 1}`, widgets: [] };
    this.layout = { ...this.layout, pages: [...this.layout.pages, page] };
    this.pageId = page.id;
    this.selectedId = "";
    this.scheduleSave();
  }

  private selectPage(id: string): void {
    this.pageId = id;
    this.selectedId = "";
    this.query = "";
  }

  private renamePage(id: string, title: string): void {
    this.beforeChange();
    this.layout = {
      ...this.layout,
      pages: this.layout.pages.map((page) => (page.id === id ? { ...page, title } : page)),
    };
    this.scheduleSave();
  }

  private iconPage(id: string, iconName: string): void {
    this.beforeChange();
    this.layout = {
      ...this.layout,
      pages: this.layout.pages.map((page) => (page.id === id ? { ...page, icon: iconName } : page)),
    };
    this.scheduleSave();
  }

  private deletePage(id: string): void {
    if (this.layout.pages.length < 2) return;
    this.beforeChange();
    const pages = this.layout.pages.filter((page) => page.id !== id);
    this.layout = { ...this.layout, pages };
    this.pageId = pages[0]?.id ?? "";
    this.scheduleSave();
  }

  private addWidget(type: WidgetType): void {
    const page = this.currentPage;
    if (!page || !WIDGET_TYPES.includes(type)) return;
    this.beforeChange();
    const widget = createWidget(type, page, this.layout.gridColumns);
    this.layout = mapPage(this.layout, page.id, (item) => ({ ...item, widgets: [...item.widgets, widget] }));
    this.selectedId = widget.id;
    this.query = "";
    this.scheduleSave();
  }

  private updateWidget(id: string, partial: Partial<Widget> & { style?: WidgetStyle; config?: Record<string, unknown> }): void {
    this.beforeChange();
    this.layout = mapWidget(this.layout, id, (widget) => ({
      ...widget,
      ...partial,
      style: partial.style ? { ...widget.style, ...cleanStyle(partial.style) } : widget.style,
      config: partial.config ?? widget.config,
      w: partial.w ? clamp(partial.w, 2, this.layout.gridColumns) : widget.w,
      h: partial.h ? clamp(partial.h, 2, 40) : widget.h,
    }));
    this.scheduleSave();
  }

  private removeWidget(id: string): void {
    const page = this.currentPage;
    if (!page) return;
    this.beforeChange();
    this.layout = mapPage(this.layout, page.id, (item) => ({
      ...item,
      widgets: item.widgets.filter((widget) => widget.id !== id),
    }));
    if (this.selectedId === id) this.selectedId = "";
    this.scheduleSave();
  }

  private nudgeOrder(widget: Widget, direction: number): void {
    const page = this.currentPage;
    if (!page) return;
    const ordered = sortForNarrow(page.widgets);
    const index = ordered.findIndex((item) => item.id === widget.id);
    const swap = ordered[index + direction];
    if (!swap) return;
    this.beforeChange();
    this.layout = mapPage(this.layout, page.id, (item) => ({
      ...item,
      widgets: item.widgets.map((entry) => {
        if (entry.id === widget.id) return { ...entry, y: swap.y, x: swap.x };
        if (entry.id === swap.id) return { ...entry, y: widget.y, x: widget.x };
        return entry;
      }),
    }));
    this.scheduleSave();
  }

  private startDrag(event: PointerEvent, widget: Widget, mode: "move" | "resize"): void {
    const target = event.target as HTMLElement | null;
    const interactive = !!target?.closest(".chrome, button, input, textarea, select, a");
    if (!this.edit || this.stacked || (mode === "move" && interactive)) {
      if (this.edit) this.selectedId = widget.id;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const canvas = (event.currentTarget as HTMLElement).closest(".canvas") as HTMLElement | null;
    const cell = (canvas?.clientWidth || this.stageWidth) / this.layout.gridColumns;
    this.beforeChange();
    this.selectedId = widget.id;
    this.drag = {
      id: widget.id,
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      cell: cell || 32,
      nx: widget.x,
      ny: widget.y,
      nw: widget.w,
      nh: widget.h,
    };
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.lastPointer = event;
    if (this.moveFrame) return;
    this.moveFrame = requestAnimationFrame(() => {
      this.moveFrame = 0;
      const drag = this.drag;
      const current = this.lastPointer;
      if (!drag || !current) return;
      const dx = Math.round((current.clientX - drag.startX) / drag.cell);
      const dy = Math.round((current.clientY - drag.startY) / drag.cell);
      const columns = this.layout.gridColumns;
      if (drag.mode === "move") {
        drag.nw = drag.w;
        drag.nh = drag.h;
        drag.nx = clamp(drag.x + dx, 0, Math.max(0, columns - drag.w));
        drag.ny = clamp(drag.y + dy, 0, 200);
      } else {
        drag.nx = drag.x;
        drag.ny = drag.y;
        drag.nw = clamp(drag.w + dx, 2, columns - drag.x);
        drag.nh = clamp(drag.h + dy, 2, 40);
      }
      this.requestUpdate();
    });
  };

  private onPointerUp = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.drag = null;
    this.layout = mapWidget(this.layout, drag.id, (widget) => ({
      ...widget,
      x: drag.nx,
      y: drag.ny,
      w: drag.nw,
      h: drag.nh,
    }));
    this.scheduleSave();
  };

  private box(widget: Widget): { x: number; y: number; w: number; h: number } {
    if (this.drag?.id === widget.id) {
      return { x: this.drag.nx, y: this.drag.ny, w: this.drag.nw, h: this.drag.nh };
    }
    return widget;
  }

  private beforeChange(): void {
    if (this.undoArmed) return;
    this.undoStack.push(structuredClone(this.layout));
    if (this.undoStack.length > 40) this.undoStack.shift();
    this.undoArmed = true;
    window.setTimeout(() => {
      this.undoArmed = false;
    }, 700);
  }

  private undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.layout = previous;
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (!this.isAdmin) return;
    window.clearTimeout(this.saveTimer);
    this.saveState = "saving";
    this.saveTimer = window.setTimeout(() => void this.persist(), 400);
  }

  private async persist(): Promise<void> {
    if (!this.hass || !this.isAdmin) return;
    this.saveState = "saving";
    try {
      const saved = await saveLayout(this.hass, this.layout);
      if (!this.shadowRoot?.activeElement) {
        this.layout = saved;
        if (!saved.pages.some((page) => page.id === this.pageId)) {
          this.pageId = saved.pages[0]?.id ?? "";
        }
      }
      this.saveState = "saved";
      this.flash(t(this.uiLanguage, "saved"));
    } catch {
      this.saveState = "error";
      this.flash(t(this.uiLanguage, "save_failed"));
    }
  }

  private download(): void {
    const blob = new Blob([exportLayout(this.layout)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gulavillan-layout.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  private async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      this.beforeChange();
      this.layout = importLayout(await file.text());
      this.pageId = this.layout.pages[0]?.id ?? "";
      this.selectedId = "";
      this.scheduleSave();
      this.flash(t(this.uiLanguage, "import_done"));
    } catch {
      this.flash(t(this.uiLanguage, "import_invalid"));
    }
  }

  private async toggle(entityId: string): Promise<void> {
    if (!this.hass || this.edit) return;
    try {
      await toggleEntity(this.hass, entityId);
    } catch {
      this.flash(t(this.uiLanguage, "call_failed"));
    }
  }

  private async brightness(entityId: string, brightness: number): Promise<void> {
    if (!this.hass || this.edit) return;
    try {
      await this.hass.callService("light", "turn_on", { entity_id: entityId, brightness });
    } catch {
      this.flash(t(this.uiLanguage, "call_failed"));
    }
  }

  private async temperature(entityId: string, temperature: number): Promise<void> {
    if (!this.hass || this.edit) return;
    try {
      await this.hass.callService("climate", "set_temperature", { entity_id: entityId, temperature });
    } catch {
      this.flash(t(this.uiLanguage, "call_failed"));
    }
  }

  private async runButton(widget: Widget): Promise<void> {
    if (!this.hass || this.edit) return;
    const domain = String(widget.config.domain ?? "");
    const service = String(widget.config.service ?? "");
    if (!domain || !service) {
      this.flash(t(this.uiLanguage, "missing_service"));
      return;
    }
    const run = () => void this.callButton(widget, domain, service);
    if (widget.config.confirm === true) {
      this.modal = { text: t(this.uiLanguage, "confirm_service"), run };
      return;
    }
    run();
  }

  private async callButton(widget: Widget, domain: string, service: string): Promise<void> {
    if (!this.hass) return;
    let data: Record<string, unknown> = {};
    const raw = String(widget.config.data ?? "").trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("data");
        data = parsed as Record<string, unknown>;
      } catch {
        this.flash(t(this.uiLanguage, "call_failed"));
        return;
      }
    }
    const entityId = String(widget.config.entity_id ?? "");
    try {
      await this.hass.callService(domain, service, data, entityId ? { entity_id: entityId } : undefined);
      this.flash(t(this.uiLanguage, "called"));
    } catch {
      this.flash(t(this.uiLanguage, "call_failed"));
    }
  }

  private moreInfo(entityId: string, event: Event): void {
    if (this.edit) return;
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  private onKey = (event: KeyboardEvent): void => {
    if (!this.edit) return;
    if (event.composedPath().some((node) => node instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName))) {
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      this.undo();
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && this.selectedId) {
      event.preventDefault();
      this.removeWidget(this.selectedId);
      return;
    }
    if (event.key === "Escape") this.selectedId = "";
    const widget = this.selected;
    if (!widget || this.stacked) return;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const step = delta[event.key];
    if (!step) return;
    event.preventDefault();
    this.updateWidget(widget.id, {
      x: clamp(widget.x + step[0], 0, this.layout.gridColumns - widget.w),
      y: clamp(widget.y + step[1], 0, 200),
    });
  };

  private syncTheme(): void {
    if (this.layout.theme === "auto") {
      this.removeAttribute("theme");
      this.style.colorScheme = this.hass?.themes?.darkMode === false ? "light" : "dark";
      return;
    }
    this.setAttribute("theme", this.layout.theme);
    this.style.colorScheme = this.layout.theme;
  }

  private flash(text: string): void {
    this.toast = text;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast = "";
    }, 2200);
  }
}

function mapPage(layout: Layout, id: string, recipe: (page: Page) => Page): Layout {
  return { ...layout, pages: layout.pages.map((page) => (page.id === id ? recipe(page) : page)) };
}

function mapWidget(layout: Layout, id: string, recipe: (widget: Widget) => Widget): Layout {
  return {
    ...layout,
    pages: layout.pages.map((page) => ({
      ...page,
      widgets: page.widgets.map((widget) => (widget.id === id ? recipe(widget) : widget)),
    })),
  };
}

function cleanStyle(style: WidgetStyle): WidgetStyle {
  const next: WidgetStyle = {};
  if (style.color) next.color = style.color;
  if (style.background) next.background = style.background;
  if (style.fontSize) next.fontSize = style.fontSize;
  if (style.borderRadius !== undefined && style.borderRadius !== null) next.borderRadius = style.borderRadius;
  if (style.icon && style.icon.startsWith("mdi:")) next.icon = style.icon;
  return next;
}

function toHex(value: string | undefined): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#e0b15a";
}
