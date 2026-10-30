import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-31) : (1) compte à rebours d'Auto Merge / Auto Boost qui recule (17, 16, 17, 16) ; (2) après l'Auto Boost, il fallait changer d'onglet pour voir les boosts disparus.
 * Gardes côté client (le moteur est gardé par idle-inventaire-auto-minuteur-monotone-v1) :
 *  - le minuteur affiché ne remonte jamais sans déclenchement ;
 *  - une synchro qui change le sac (révision de l'Aventure ou taille) met la grille à jour EN PLACE (patch ciblé), jamais par un redessin de la page.
 */
const auto = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(auto.includes("el.__restePrecV1"), "le minuteur garde la valeur précédente de chaque compteur");
assert.ok(auto.includes("reste>prec&&prec>8&&reste-prec<cycle*0.5"), "pas de remontée hors déclenchement");

/* Comportement : même calcul que le tick, rejoué sur une suite de réponses légèrement en retard. */
function tick(el, now) {
  const cycle = el.cycle;
  let reste = el.rest - (now - el.at) / 1000;
  if (reste <= 0) reste = cycle - ((-reste) % cycle);
  const prec = el.prec;
  if (typeof prec === "number" && reste > prec && prec > 8 && reste - prec < cycle * 0.5) reste = prec;
  el.prec = reste;
  return Math.ceil(reste);
}
{
  const el = { cycle: 1080, rest: 1000, at: 0 };
  let dernier = Infinity;
  for (let s = 0; s < 400; s += 1) {
    if (s % 4 === 0 && s > 0) { el.rest = 1000 - s + 0.9; el.at = s * 1000; } /* réponse de synchro un peu en retard */
    const v = tick(el, s * 1000 + 100);
    assert.ok(v <= dernier, "jamais de remontée : " + dernier + " -> " + v);
    dernier = v;
  }
  /* déclenchement : repart de la période complète */
  const e2 = { cycle: 1080, rest: 3, at: 0, prec: 3.5 };
  assert.equal(tick(e2, 1000), 2);
  e2.rest = 1080; e2.at = 5000; e2.prec = 0.2;
  assert.equal(tick(e2, 5100), 1080);
}

const noyau = readFileSync("cloudflare/public/modules/ui-noyau-v1.js", "utf8").replace(/\r\n/g, "\n");
const iAvant = noyau.indexOf("const signatureSacAvantV1=signatureSacIdleV1_(REG.idleEtat);");
const iApres = noyau.indexOf("signatureSacIdleV1_(REG.idleEtat)!==signatureSacAvantV1");
assert.ok(iAvant > 0 && iApres > iAvant, "signature du sac relevée avant le remplacement de l'état, comparée après");
const bloc = noyau.slice(iApres, noyau.indexOf("Menus à l'ancienne", iApres));
assert.ok(bloc.includes("patchInventaireAdventureIdleV160_(REG.idleEtat,{action:'reconcile-v208'})"), "patch ciblé complet du sac");
assert.ok(!bloc.includes("rendreIdleEtat_"), "jamais de redessin complet de la page (règle n°4)");
assert.ok(bloc.includes("REG.idleInventoryBusyV160"), "pas de patch pendant une mutation du sac");
assert.ok(noyau.includes("function signatureSacIdleV1_(j)"), "la signature existe");
console.log("idle-inventaire-auto-affichage-immediat-v1: OK");
