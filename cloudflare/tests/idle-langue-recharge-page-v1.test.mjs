// Norman (2026-11-01) : « il faut actualiser la page quand on passe de français à anglais » : jeu ouvert, le changement de langue envoie le choix au compte puis recharge la page.
import fs from "node:fs";
import assert from "node:assert/strict";
const a = fs.readFileSync("cloudflare/public/modules/ui-amorcage-v1.js", "utf8").replace(/\r\n/g, "\n");
const f = a.slice(a.indexOf("window.__changerLangueIdleV1__=function(langue){"));
const rec = f.slice(0, f.indexOf("synchroniserJeuIdleV7_(true)"));
assert.ok(rec.includes("document.querySelector('.soreal-idle-page-root-v28')") && rec.includes("__SOREAL_IDLE_PREFS_V1__.envoyer()") && rec.includes("location.reload()") && rec.includes("return;"), "jeu ouvert : envoi au compte puis rechargement, sans resynchronisation inutile");
assert.ok(rec.indexOf("__SOREAL_IDLE_PREFS_V1__.envoyer()") < rec.indexOf("location.reload()"), "le choix part au compte avant le rechargement");
console.log("idle-langue-recharge-page-v1 : OK");
