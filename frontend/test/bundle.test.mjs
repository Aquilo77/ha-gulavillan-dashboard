import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bundlePath = new URL(
  "../../custom_components/gulavillan_dashboard/frontend/gulavillan-panel.js",
  import.meta.url,
);

test("built panel defines the sidebar element", () => {
  const source = readFileSync(bundlePath, "utf8");
  assert.match(source, /gulavillan-dashboard/);
  assert.match(source, /customElements/);
  assert.doesNotMatch(source, /createMockHass/);
  assert.ok(source.length > 10_000);
});
