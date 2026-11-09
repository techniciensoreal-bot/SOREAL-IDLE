import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-09) : « après un rebirth, les premiers niveaux de la Machine temporelle font un recul quand je mets l'énergie la première fois ; ensuite il n'y a plus de recul ». Mesuré sur sa partie B (production) : le niveau affiché passait de N à N+1
 * pendant 3 images (50 ms), puis revenait à N au moment où la page appliquait la réponse du moteur (la barre sautait alors de 8 à 9 points). Cause : le tick lisait le niveau de départ dans l'état du moteur (déjà remplacé) alors que la fraction et
 * l'heure de départ venaient du patch précédent de la page : niveau neuf + niveaux franchis depuis l'ANCIENNE base = un niveau de trop. Les niveaux durent 0,03 à 0,5 s juste après un Rebirth, d'où « seulement la première fois ».
 * Garde : le niveau de départ est posé par le patch AVEC l'heure et la fraction (data-tm-niveau0) et le tick le lit en premier.
 */
const src = readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8");
const tick = src.slice(src.indexOf("function actualiserCompteReboursTimeMachineIdleV1_"), src.indexOf("const SEUIL_NIVEAU_RAPIDE_TM_V1"));
const patch = src.slice(src.indexOf("function patcherBarresTimeMachineIdleV1_"));
assert.ok(patch.includes("eta.dataset.tmNiveau0=") && patch.indexOf("eta.dataset.tmEtaAt=") < patch.indexOf("eta.dataset.tmNiveau0="), "le patch pose le niveau de départ avec l'heure de départ");
const i = tick.indexOf("el.dataset.tmNiveau0"), j = tick.indexOf("donneesTm?idleEntier_(piste==='or'?donneesTm.goldLevel:donneesTm.speedLevel)");
assert.ok(i > 0 && j > i, "le tick lit le niveau posé avant l'état du moteur (qui reste le repli, sans niveau posé)");
// comportement : projeter() + niveau de départ de la MÊME base ne recule jamais, même quand l'état du moteur a déjà avancé
await import("../public/modules/tm-projection-v1.js");
const P = globalThis.__SOREAL_IDLE_TM_PROJECTION_V1__;
const base = { palier: 0.1, fill0: 0.9, niveau0: 5, or: 1e15, deja: 0 };   // base posée par le patch précédent
let precedent = -1;
for (const ecoule of [0.01, 0.05, 0.08, 0.12, 0.2]) {
  const r = P.projeter(Object.assign({ ecoule }, base));
  const position = base.niveau0 + r.franchis + r.fill;
  assert.ok(position >= precedent, "la position (niveau + fraction) ne baisse jamais avec une base cohérente");
  precedent = position;
}
// l'ancien mélange : niveau du moteur NEUF (7) + niveaux franchis depuis l'ancienne base (1) = 8 alors que la position réelle est 6,x
const ancien = P.projeter(Object.assign({ ecoule: 0.12 }, base));
assert.ok(7 + ancien.franchis > base.niveau0 + ancien.franchis, "(démonstration) mélanger deux bases ajoute des niveaux : c'est ce que le niveau posé évite");
console.log("idle-tm-niveau-base-pose-v1: OK");
