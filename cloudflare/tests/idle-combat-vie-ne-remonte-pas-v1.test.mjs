import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-03) : « à chaque combat sur la borne, la vie descend, remonte une fois légèrement et descend jusqu'au bout... personne ne heal dans fight boss... c'est la barre joueur et boss en même temps ».
 * Mesure (vrai moteur local, image par image) : la page avance les deux barres sans attendre le moteur ; la première réponse après Fight est un peu EN RETARD sur l'écran (boss 99,14 % à l'écran contre 99,61 %
 * dans la réponse ; joueur 66,32 % contre 66,42 %). Quand l'état est remplacé d'un bloc pendant le combat (réponse reçue pendant qu'un combat d'Aventure est actif), les deux barres remontaient de l'écart.
 * etat-monotone-v1.js : tant que le MÊME boss est combattu des deux côtés, la vie du boss et celle du joueur ne remontent jamais du fait d'un remplacement ; hors combat (régénération du repos) et pour un autre
 * boss, rien n'est touché ; un vrai retrait (dégâts) passe tel quel.
 */
const code = readFileSync(new URL("../public/modules/etat-monotone-v1.js", import.meta.url), "utf8");
function monde() {
  let t = 1_000_000;
  const signaux = [];
  const fen = { __SOREAL_IDLE_DIAG_V1__: { signaler: (c, d) => signaux.push([c, d]) }, Date: { now: () => t } };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { M: fen.__SOREAL_IDLE_MONOTONE_V1__, signaux, avancer: (ms) => { t += ms; } };
}
const etat = (o) => Object.assign({ energie: 0, pvJoueur: 6_632_000, pvJoueurMax: 10_000_000, bossPv: 9_914_000, bossPvMax: 10_000_000, bossSelection: 4, bossVaincus: 3, bossId: "b4", bossActuel: "Boss 4", combatBossActif: true, systemes: {} }, o);

// 1. Les valeurs mesurées : l'écran est en avance sur la réponse, les deux barres ne remontent pas.
{
  const m = monde();
  const ancien = etat({});
  const reponse = etat({ pvJoueur: 6_642_000, bossPv: 9_961_000 });
  m.M.garder(ancien, reponse, 0.2);
  assert.equal(reponse.bossPv, 9_914_000, "la vie du boss ne remonte pas");
  assert.equal(reponse.pvJoueur, 6_632_000, "la vie du joueur ne remonte pas");
  assert.equal(m.M.stats().gardesCombat, 2);
}

// 2. Un vrai retrait (la réponse est plus basse que l'écran) passe tel quel : l'écran se corrige vers le bas.
{
  const m = monde();
  const reponse = etat({ pvJoueur: 6_000_000, bossPv: 9_000_000 });
  m.M.garder(etat({}), reponse, 0.2);
  assert.equal(reponse.bossPv, 9_000_000);
  assert.equal(reponse.pvJoueur, 6_000_000);
}

// 3. Hors combat : la régénération du repos reste libre de monter (la valeur de la réponse n'est pas touchée par cette règle).
{
  const m = monde();
  const reponse = etat({ combatBossActif: false, pvJoueur: 7_000_000, bossPv: 10_000_000 });
  m.M.garder(etat({ combatBossActif: false }), reponse, 0.2);
  assert.equal(reponse.pvJoueur, 7_000_000);
  assert.equal(reponse.bossPv, 10_000_000);
  assert.equal(m.M.stats().gardesCombat, 0);
}

// 4. Un autre boss (victoire puis boss suivant, Renaissance) : la vie pleine du suivant est adoptée.
{
  const m = monde();
  const reponse = etat({ bossSelection: 5, bossVaincus: 4, bossId: "b5", bossActuel: "Boss 5", bossPv: 50_000_000, bossPvMax: 50_000_000 });
  m.M.garder(etat({ bossPv: 1000 }), reponse, 0.2);
  assert.equal(reponse.bossPv, 50_000_000, "le boss suivant arrive avec sa vie pleine");
  const renaissance = etat({ bossVaincus: 0, bossSelection: 1, bossId: "b1", bossActuel: "Boss 1", bossPv: 500, bossPvMax: 500 });
  m.M.garder(etat({}), renaissance, 0.2);
  assert.equal(renaissance.bossPv, 500);
}

// 5. Un combat qui n'est pas actif des deux côtés (démarrage tout juste ordonné, fuite, défaite) : aucune retenue.
{
  const m = monde();
  const reponse = etat({ combatBossActif: false, pvJoueur: 10_000_000, bossPv: 10_000_000 });
  m.M.garder(etat({}), reponse, 0.2);
  assert.equal(reponse.bossPv, 10_000_000);
  assert.equal(reponse.pvJoueur, 10_000_000);
}

// 6. Une remontée importante est signalée au journal de diagnostic (preuve pour la suite), une petite non.
{
  const m = monde();
  m.M.garder(etat({}), etat({ pvJoueur: 6_642_000, bossPv: 9_961_000 }), 0.2);
  assert.equal(m.signaux.length, 0, "écart de 0,5 point : pas de signal");
  m.M.garder(etat({}), etat({ bossPv: 10_000_000 }), 0.2);
  m.M.garder(etat({ bossPv: 5_000_000 }), etat({ bossPv: 9_000_000 }), 0.2);
  assert.ok(m.signaux.some((s) => s[0] === "combat_vie_remontee:bossPv"), "gros écart signalé");
}

// 7. Câblage : le remplacement de l'état passe par garder() (soreal-idle-ui.js) et le module est chargé.
const ui = readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
assert.ok(/M\.garder\(idleEtat,v,/.test(ui), "le setter de l'état appelle garder()");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/etat-monotone-v1.js?v='), "module chargé");

console.log("idle-combat-vie-ne-remonte-pas-v1: OK");
