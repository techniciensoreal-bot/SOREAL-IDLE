import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync("cloudflare/public/index.html", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// Lighthouse / axe: zoom must remain available.
assert.match(index, /<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">/);
assert.ok(!index.includes("user-scalable=no"));
assert.ok(!index.includes("maximum-scale=1"));
assert.ok(!index.includes('["gesturestart","gesturechange","gestureend"]'));
assert.ok(!index.includes("e.touches&&e.touches.length>1"));
assert.ok(!index.includes("e.ctrlKey)e.preventDefault()"));

// Lighthouse / axe: the rendered game must keep one main landmark.
const outerMain = (ui.match(/<main class="soreal-idle-native-v4">/g) || []).length;
const legacyOuterSection = (ui.match(/<section class="soreal-idle-native-v4">/g) || []).length;
assert.equal(outerMain, 3, "loading, error and game renderings must use <main>");
assert.equal(legacyOuterSection, 0, "rendered app must not drop the main landmark");

// Lighthouse / axe: confirmed low-contrast styles are corrected.
assert.ok(
  css.includes("background:color-mix(in srgb,var(--nav-color,#2b4165) 68%,#000 32%) !important;"),
  "active nav color must be darkened before white text is applied"
);
assert.ok(css.includes("color:#fff !important;"));
assert.match(
  css,
  /\.soreal-idle-bt-lock-v120,[\s\S]*?color:#d1d5db;/,
  "locked Basic Training requirement text must use the accessible light gray"
);

console.log("idle-lighthouse-accessibility: OK");
