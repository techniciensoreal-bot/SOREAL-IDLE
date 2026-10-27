import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-27) : la zone sûre s'affiche en 3D (Evil) ou en photo (Sadistic) : l'adresse de l'image porte la difficulté. */
const scene = readFileSync(new URL("../public/modules/adventure-scene-v79.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const m = /function safeZoneUrl_\(a\)\{[\s\S]*?\n  \}/.exec(scene);
assert.ok(m, "safeZoneUrl_ introuvable");
const make = (diff) => new Function("window", "safeZoneVisualZone_", "URLSearchParams", m[0] + "; return safeZoneUrl_;")(
  { __SOREAL_IDLE_ITEM_DIFFICULTE_V1__: { difficulte: () => diff } }, () => "sky", URLSearchParams);
assert.equal(make("")({}), "/api/idle/media/safe-zone?zone=sky");
assert.equal(make("difficile")({}), "/api/idle/media/safe-zone?zone=sky&difficulty=difficile");
assert.equal(make("extreme")({}), "/api/idle/media/safe-zone?zone=sky&difficulty=extreme");
/* Sans le module de difficulté chargé, rien ne casse. */
assert.equal(new Function("window", "safeZoneVisualZone_", "URLSearchParams", m[0] + "; return safeZoneUrl_;")({}, () => "sky", URLSearchParams)({}), "/api/idle/media/safe-zone?zone=sky");
/* Le module de difficulté est chargé avant la scène. */
assert.ok(index.indexOf("item-difficulte-v1.js") < index.indexOf("adventure-scene-v79.js"));
/* Le Worker IDLE sert la route lui-même (idle-media-v1.js) : mêmes dossiers, résolus avant la liste des zones normales. */
const media = readFileSync(new URL("../src/idle-media-v1.js", import.meta.url), "utf8");
assert.ok(media.includes('const IDLE_SAFE_ZONES_EVIL_R2_PREFIX="idle/safe-zones-evil/"'));
assert.ok(media.includes('const IDLE_SAFE_ZONES_SADISTIC_R2_PREFIX="idle/safe-zones-sadistic/"'));
assert.ok(media.indexOf("prefixesSafeZoneParDifficulte_(url)){") > media.indexOf("function prefixesSafeZoneParDifficulte_"));
const corps = media.slice(media.indexOf("async function adventureSafeZone_"));
assert.ok(corps.indexOf("prefix of prefixesSafeZoneParDifficulte_(url)") < corps.indexOf("const folder=await dossierZoneAventureR2_(env,zone);"));

console.log("idle-safe-zone-difficulte-v1: OK");
