import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Le « banc d'essai des animations et des sons » de la page Yggdrasil (administrateur) est supprimé (Norman, 2026-10-26 : « je n'en ai plus besoin »). Rien ne doit en rester. */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(!/banc|Banc|BANC/.test(src), "aucune trace du banc d'essai dans la page Yggdrasil");
assert.ok(!src.includes("soreal_idle_ygg_anim_v1") && !src.includes("ecrireReglages_"), "plus de réglages enregistrés par le banc");
assert.ok(/var REGLAGES_DEFAUT_=\{cadence:110,sens:-1,porte:1,son:'pierre'\};/.test(src) && /function reglages_\(\)\{return \{/.test(src), "la porte garde ses valeurs d'origine (réglages fixes)");
assert.ok(!src.includes("estAdminSorealIdle_"), "la page n'a plus de bloc réservé à l'administrateur");
console.log("idle-yggdrasil-banc-supprime-v1: OK");
