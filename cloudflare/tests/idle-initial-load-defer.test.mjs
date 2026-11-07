import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("cloudflare/public/index.html", "utf8");

const headEnd = html.indexOf("</head>");
const cssPos = html.search(/<link rel="stylesheet" href="\/soreal-idle-ui\.css\?v=\d+">/);
assert.ok(cssPos > 0 && cssPos < headEnd, "main CSS must be discovered in <head>");
assert.equal(
  html.match(/<link rel="stylesheet" href="\/soreal-idle-ui\.css\?v=\d+">/g)?.length,
  1,
  "main stylesheet must only be declared once"
);

const sameOriginClassic = [...html.matchAll(/<script([^>]*)src="(\/[^"]+)"([^>]*)><\/script>/g)];
assert.ok(sameOriginClassic.length > 30, "expected the SOREAL IDLE classic script chain");
for (const match of sameOriginClassic) {
  const attrs = match[1] + match[3];
  if (/type="module"/.test(attrs)) continue;
  assert.ok(/\bdefer\b/.test(attrs), "same-origin classic script must be deferred: " + match[2]);
}

assert.ok(
  html.includes('window.addEventListener("DOMContentLoaded",function(){') &&
  html.includes('window.__SOREAL_IDLE_STANDALONE_V1__.start();'),
  "standalone start must wait until deferred/module scripts are ready"
);

assert.match(
  html,
  /chargement\/affiche-600x900\.webp"[\s\S]*?fetchpriority="high"/,
  "initial visible banner should be high priority"
);

assert.ok(
  !/<script[^>]*(piper|onnxruntime)/i.test(html)&&!/importmap/.test(html.replace(/<!--[\s\S]*?-->/g, "")),
  "plus de voix de secours : aucun script Piper ni ONNX Runtime dans la page (2026-11-07)"
);

console.log("idle-initial-load-defer: OK");
