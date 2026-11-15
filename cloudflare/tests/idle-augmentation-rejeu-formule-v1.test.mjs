import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-05, essai partie B à toute vitesse) : une barre qui gagne 5 à 12 niveaux par seconde restait figée 200 niveaux derrière le serveur (plafond du rejeu niveau par niveau),
 * puis sautait en arrière à la synchro. Le rejeu se fait en formule : il doit donner le MÊME résultat que l'ancienne boucle, sans plafond.
 */
const meta = (readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta());
const a = meta.indexOf("      function rejouerCyclesAugmentIdleV1_(p){");
const b = meta.indexOf("      window.__rejouerCyclesAugmentIdleV1__=");
assert.ok(a > 0 && b > a);
const rejouer = vm.runInNewContext("(function(){" + meta.slice(a, b) + "\nreturn rejouerCyclesAugmentIdleV1_;})()", { Math });

// Boucle de référence niveau par niveau (2026-11-15) : durée quantifiée sur les ticks ET Or payé au DÉBUT du niveau (lu dans le jeu : AugmentController::advanceAug).
function reference(p, limite = 1e9) {
  const D = (i) => { const b = p.sec0 * (p.niv0 + 1 + i) / (p.niv0 + 1); return Math.max(1, Math.ceil(b / 0.02 - 1e-9)) * 0.02; };
  const C = (i) => p.cout0 * Math.pow((p.niv0 + 1 + i) / (p.niv0 + 1), p.expo);
  let t = p.ecoule, or = p.gold, prog = p.p0, k = 0, paies = Math.max(p.debites, prog > 0 ? 1 : 0), debit = 0, bloque = false;
  if (prog >= D(0) - 1e-9) prog = 0;
  while (k < limite) {
    const d = D(k);
    if (!(k < paies)) {
      const c = C(k);
      if (or + 1e-9 < c) { bloque = true; break; }
      if (t <= 1e-9) break;
      or -= c; debit += c; paies = k + 1; prog = Math.min(t, 0.02, d); t -= prog;
    }
    const manque = Math.max(0, d - prog);
    if (t + 1e-9 < manque) { prog += t; t = 0; break; }
    t = Math.max(0, t - manque); prog = 0; k += 1;
  }
  return { k, reste: prog, debites: paies, debit, bloque };
}

let graine = 12345;
const alea = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
let comparaisons = 0;
for (let i = 0; i < 4000; i += 1) {
  const sec0 = 0.05 + alea() * 30;
  const p = {
    niv0: Math.floor(alea() * (alea() < 0.3 ? 100000 : 300)),
    sec0,
    cout0: 1 + alea() * 1e6,
    expo: alea() < 0.5 ? 1 : 2,
    p0: alea() < 0.5 ? 0 : alea() * sec0 * 0.99,
    ecoule: alea() * sec0 * (alea() < 0.5 ? 3 : 60),
    debites: Math.floor(alea() * 4),
    gold: alea() < 0.3 ? alea() * 1e9 : 1e30
  };
  p.reste0 = p.p0 + p.ecoule;
  const ref = reference(p);
  if (ref.k > 3000) continue;
  const got = rejouer(p);
  comparaisons += 1;
  assert.equal(got.k, ref.k, "même nombre de niveaux : " + JSON.stringify(p));
  assert.equal(got.bloque, ref.bloque, "même blocage faute d'Or : " + JSON.stringify(p));
  assert.ok(Math.abs(got.reste - ref.reste) <= 1e-6 * Math.max(1, Math.abs(ref.reste), p.sec0), "même reste : " + JSON.stringify(p) + got.reste + " vs " + ref.reste);
  assert.ok(Math.abs(got.debit - ref.debit) <= 1e-6 * Math.max(1, ref.debit), "même Or débité");
  assert.equal(got.debites, ref.debites);
}
assert.ok(comparaisons > 2500, "assez de cas comparés : " + comparaisons);

// Sans plafond : 10 000 niveaux d'un coup (l'ancienne boucle s'arrêtait à 200).
{
  const r = rejouer({ niv0: 5000, sec0: 0.2, cout0: 100, expo: 1, p0: 0, ecoule: 5000, reste0: 5000, debites: 0, gold: 1e30 });
  assert.ok(r.k > 1000, "beaucoup plus de 200 niveaux rejoués : " + r.k);
}
console.log("idle-augmentation-rejeu-formule-v1: OK (" + comparaisons + " cas)");
