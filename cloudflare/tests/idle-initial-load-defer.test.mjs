import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("cloudflare/public/index.html", "utf8");

const headEnd = html.indexOf("</head>");
const cssPos = html.indexOf('<link rel="stylesheet" href="/soreal-idle-ui.css?v=17">');
assert.ok(cssPos > 0 && cssPos < headEnd, "main CSS must be discovered in <head>");
assert.equal(
  html.match(/<link rel="stylesheet" href="\/soreal-idle-ui\.css\?v=17">/g)?.length,
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
  /thumbnail\?id=1omNowtqq_YjUQitljdBXbLK9VZ0oJ7qb&sz=w1200"[\s\S]*?fetchpriority="high"/,
  "initial visible banner should be high priority"
);

assert.ok(
  html.includes('<script src="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js"'),
  "Piper phonemizer remains blocking to preserve its global before the local module"
);
assert.ok(
  !html.includes('<script defer src="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js"'),
  "do not reorder the Piper global dependency"
);

console.log("idle-initial-load-defer: OK");
