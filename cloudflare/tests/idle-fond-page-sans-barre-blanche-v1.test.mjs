import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-04) : même correctif que SOREAL APP (7b65d12) pour ne plus avoir de barre blanche en bas (Android, bord à bord) : fond sombre sur <html> et schéma de couleurs sombre. */
const html = readFileSync("cloudflare/public/index.html", "utf8");
const manifest = JSON.parse(readFileSync("cloudflare/public/manifest.webmanifest", "utf8"));
assert.ok(html.includes('<meta name="color-scheme" content="dark">'), "schéma de couleurs sombre seulement (jamais « light dark »)");
assert.ok(!html.includes('content="light dark"'));
assert.ok(html.includes("<style>html{background:#071226;color-scheme:dark}</style>"), "fond sur <html>, pas seulement sur <body>");
assert.ok(html.includes("viewport-fit=cover"), "bord à bord");
assert.equal(manifest.background_color, "#071226", "même fond que la page");
assert.ok(html.includes("body{min-height:100vh;background:#071226;"), "le body garde le même fond");
console.log("idle-fond-page-sans-barre-blanche-v1: OK");
