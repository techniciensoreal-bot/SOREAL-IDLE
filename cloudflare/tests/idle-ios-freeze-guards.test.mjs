import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui=readFileSync("cloudflare/public/soreal-idle-ui.js","utf8");
const ambient=readFileSync("cloudflare/public/modules/ambient-audio-v1.js","utf8");

// Visible heavy game updates are capped at 15 Hz while dt remains authoritative.
assert.ok(ui.includes("const intervalleFrameJeuVisibleV214=1000/15;"));
assert.ok(ui.includes("maintenantFrame-dernierFrameJeuVisibleV214>=intervalleFrameJeuVisibleV214"));
assert.ok(ui.includes("mettreAJourJeuIdleLocalV7_();"));
assert.ok(ui.includes("requestAnimationFrame(frameJeuV214_)"));

// iOS/iPadOS must avoid the ambient decodeAudioData/WebAudio analysis path.
assert.ok(ambient.includes("function estIOSWebKit_(){"));
assert.ok(ambient.includes("/iPad|iPhone|iPod/.test(ua)"));
assert.ok(ambient.includes("plateforme==='MacIntel' && Number(navigator.maxTouchPoints||0)>1"));
assert.ok(ambient.includes("if(estIOSWebKit_())return null;"));
assert.ok(ambient.includes("if(estIOSWebKit_())return Promise.resolve(1);"));

// Native HTMLAudio fallback stays available.
assert.ok(ambient.includes("audio=new Audio(url);"));

console.log("idle-ios-freeze-guards: OK");
