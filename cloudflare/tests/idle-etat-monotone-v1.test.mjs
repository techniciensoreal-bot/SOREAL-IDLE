import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : « je vois encore des chiffres faire des mini marches arrière pendant que ma vie augmente ». La page prévoit la suite des nombres qui montent ; la réponse du moteur (calculée plus tôt) les
 * remplaçait par une valeur plus ancienne. etat-monotone-v1.js : un recul qui ne dépasse pas ce que la vitesse de montée donne pendant l'âge de la réponse est du retard, il est ignoré ; un vrai retrait passe.
 */
const code = readFileSync(new URL("../public/modules/etat-monotone-v1.js", import.meta.url), "utf8");
function monde() {
  let t = 1_000_000;
  const signaux = [];
  const fen = { __SOREAL_IDLE_DIAG_V1__: { signaler: (c, d) => signaux.push([c, d]) }, Date: { now: () => t } };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { M: fen.__SOREAL_IDLE_MONOTONE_V1__, avancer: (ms) => { t += ms; }, signaux };
}
const etat = (o) => Object.assign({ energie: 0, pvJoueur: 100, pvJoueurMax: 100, combatBossActif: false, systemes: { currencies: { gold: 0 }, resources: { energy: { current: 0 } } } }, o);

// 1. Régénération : la page est en avance sur la réponse (calculée 0,2 s plus tôt) : jamais de marche arrière.
{
  const m = monde();
  let affiche = etat({ energie: 100.0 });
  // Deux montées normales pour apprendre la vitesse (1 par seconde).
  for (const v of [100.4, 100.8]) { m.avancer(400); const n = etat({ energie: v }); m.M.garder(affiche, n, 0.1); affiche = n; }
  // La page a déjà prévu 101,4 ; la réponse arrive avec la valeur de 0,2 s plus tôt (101,0) : ancienne valeur gardée.
  m.avancer(400);
  const rep = etat({ energie: 101.0 });
  const ancien = etat({ energie: 101.4 });
  assert.equal(m.M.garder(ancien, rep, 0.2), 1);
  assert.equal(rep.energie, 101.4, "pas de marche arrière de l'énergie");
  // Le moteur rattrape ensuite : la valeur suivante, plus haute, est adoptée telle quelle.
  m.avancer(400);
  const suite = etat({ energie: 101.9 });
  m.M.garder(rep, suite, 0.1);
  assert.equal(suite.energie, 101.9);
}

// 2. Un vrai retrait (achat, allocation) passe tel quel : bien au-delà du retard attendu.
{
  const m = monde();
  let aff = etat({ energie: 1000 });
  for (const v of [1400, 1800]) { m.avancer(400); const n = etat({ energie: v }); m.M.garder(aff, n, 0.1); aff = n; }   // vitesse ~1000/s
  m.avancer(400);
  const rep = etat({ energie: 400 });                                   // dépensé : -1800 -> 400
  m.M.garder(etat({ energie: 2200 }), rep, 0.1);
  assert.equal(rep.energie, 400, "un vrai retrait n'est jamais masqué");
}

// 3. Sans vitesse apprise (première réponse), rien n'est gardé : on ne masque jamais sans preuve.
{
  const m = monde();
  const rep = etat({ energie: 90 });
  assert.equal(m.M.garder(etat({ energie: 100 }), rep, 5), 0);
  assert.equal(rep.energie, 90);
}

// 4. Monnaies et ressources (chemins imbriqués) ; l'objet partagé de la réponse n'est pas modifié sur place.
{
  const m = monde();
  let aff = etat({ systemes: { currencies: { gold: 1000 }, resources: { energy: { current: 50 } } } });
  for (const g of [1400, 1800]) { m.avancer(400); const n = etat({ systemes: { currencies: { gold: g }, resources: { energy: { current: 50 + (g - 1000) / 100 } } } }); m.M.garder(aff, n, 0.1); aff = n; }
  m.avancer(400);
  const partage = { gold: 2000 };
  const rep = etat({ systemes: { currencies: partage, resources: { energy: { current: 57 } } } });
  m.M.garder(etat({ systemes: { currencies: { gold: 2300 }, resources: { energy: { current: 58 } } } }), rep, 0.2);
  assert.equal(rep.systemes.currencies.gold, 2300, "Or : pas de marche arrière");
  assert.equal(rep.systemes.resources.energy.current, 58, "ressource : pas de marche arrière");
  assert.equal(partage.gold, 2000, "l'objet de la réponse du moteur n'est pas modifié (copie)");
}

// 5. PV : hors combat seulement (en combat la page est l'autorité sur ses PV).
{
  const m = monde();
  let aff = etat({ pvJoueur: 10 });
  for (const v of [12, 14]) { m.avancer(400); const n = etat({ pvJoueur: v }); m.M.garder(aff, n, 0.1); aff = n; }
  m.avancer(400);
  const rep = etat({ pvJoueur: 15 });
  m.M.garder(etat({ pvJoueur: 15.8 }), rep, 0.2);
  assert.equal(rep.pvJoueur, 15.8, "PV hors combat : pas de marche arrière");
  const repC = etat({ pvJoueur: 12, combatBossActif: true });
  m.M.garder(etat({ pvJoueur: 15.8, combatBossActif: true }), repC, 0.2);
  assert.equal(repC.pvJoueur, 12, "en combat : une baisse de PV est de vrais dégâts");
}

// 6. Un recul minuscule qui dépasse le retard attendu est accepté mais signalé au journal.
{
  const m = monde();
  let aff = etat({ energie: 1000000 });
  for (const v of [1000400, 1000800]) { m.avancer(400); const n = etat({ energie: v }); m.M.garder(aff, n, 0.05); aff = n; }
  m.avancer(400);
  const rep = etat({ energie: 1000500 });
  m.M.garder(etat({ energie: 1001500 }), rep, 0.05);
  assert.equal(rep.energie, 1000500);
  assert.ok(m.signaux.some((s) => /^recul_nombre:energie/.test(s[0])), "signalé au journal de diagnostic");
}

// 7. Câblage : appelé au remplacement de l'état, avec l'âge réel de la réponse ; chargé par la page.
const ui = readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
assert.ok(ui.includes("M.garder(idleEtat,v,"), "le remplacement de l'état passe par la garde");
assert.ok(ui.includes("window.__SOREAL_IDLE_CALER_RECU_V1__"), "âge réel de la réponse");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/etat-monotone-v1.js?v='), "module chargé");
console.log("idle-etat-monotone-v1: OK");
