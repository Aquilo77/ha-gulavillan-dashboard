import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { messageKeys } from "../src/i18n";
import {
  createWidget,
  defaultLayout,
  findSpot,
  importLayout,
  normalizeLayout,
  sortForNarrow,
  type Page,
} from "../src/layout";

test("default layout is Swedish and fits the grid", () => {
  const layout = normalizeLayout(defaultLayout());
  assert.equal(layout.language, "sv");
  assert.equal(layout.theme, "auto");
  assert.equal(layout.pages[0]?.title, "Hem");
  for (const widget of layout.pages[0]?.widgets ?? []) {
    assert.ok(widget.x + widget.w <= layout.gridColumns);
    assert.ok(widget.w >= 2 && widget.h >= 2);
  }
});

test("unknown widgets are dropped and broken input is rejected", () => {
  const layout = normalizeLayout({
    language: "en",
    pages: [{ id: "hem", title: "Home", widgets: [{ id: "bad", type: "script" }, { type: "clock" }] }],
  });
  assert.equal(layout.language, "en");
  assert.equal(layout.pages[0]?.widgets.length, 1);
  assert.equal(layout.pages[0]?.widgets[0]?.type, "clock");
  assert.throws(() => normalizeLayout({ pages: [] }), /invalid/);
  assert.throws(() => importLayout("{"), /JSON|Unexpected|invalid/i);
});

test("new widgets snap into the first free cell", () => {
  const page: Page = {
    id: "hem",
    title: "Hem",
    widgets: [
      {
        id: "a",
        type: "text",
        x: 0,
        y: 0,
        w: 24,
        h: 2,
        style: {},
        config: { text: "A", align: "left" },
      },
    ],
  };
  const spot = findSpot(page.widgets, 6, 4, 24);
  assert.deepEqual(spot, { x: 0, y: 2 });
  const widget = createWidget("sensor", page, 24);
  assert.equal(widget.type, "sensor");
  assert.equal(widget.y, 2);
});

test("narrow order follows the canvas from top to bottom", () => {
  const ordered = sortForNarrow([
    { id: "b", type: "text", x: 0, y: 3, w: 4, h: 2, style: {}, config: {} },
    { id: "a", type: "text", x: 4, y: 0, w: 4, h: 2, style: {}, config: {} },
  ]);
  assert.deepEqual(ordered.map((widget) => widget.id), ["a", "b"]);
});

test("example layout normalizes without losing widgets", () => {
  const example = JSON.parse(readFileSync(new URL("../../examples/hem.json", import.meta.url), "utf8"));
  const layout = normalizeLayout(example);
  assert.equal(layout.language, "sv");
  assert.equal(layout.pages.length, 2);
  assert.equal(layout.pages[0]?.widgets.length, example.pages[0].widgets.length);
  assert.ok(layout.pages[0]?.widgets.some((widget) => widget.type === "sensor"));
});

test("Swedish and English have the same messages", () => {
  assert.deepEqual(messageKeys("sv").sort(), messageKeys("en").sort());
});
