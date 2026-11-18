import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { nguPlafondAllocationV1, nguMontantCapV1, capAllNguV1 } from "../src/idle-ngu-snapshot.js";

/*
 * Bouton « Cap » de chaque NGU (Norman, 2026-11-17 : « le plafond du défi Troll Sadistic, il faut l'ajouter »). Lu dans le jeu, build 1260, 2026-11-17 :
 * AllNGUController::energyNGUCapAmount / magicNGUCapAmount (plafond = énergie qui donne un niveau par tick ; x3 de vitesse du défi Troll déjà dans la vitesse), NGUController::cap (placement),
 * NGUController::updateCapButton (bouton visible seulement si PlayerSettings.beastOn = Heroic Sigil consommé = Questing débloqué).
 */
const context = { bosses: 100, bestGold: 1e6, adventurePower: 1e9 };
function base() {
  let s = normalizeIdleNguState({}, context, 1_000_000);
  s.adventure.unlockItems.aNumber = true;
  s = applyIdleNguAction(s, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
  s.resources.energy.cap = 1e15; s.resources.energy.current = 1e15; s.resources.energy.power = 1e9;
  return s;
}
const ligne = (s, id = "augments") => idleNguSnapshot(s, context, 1_000_000).ngus.tiers.normal.find(n => n.id === id);

// Pas de plafond (donc pas de bouton) tant que Questing n'est pas débloqué (règle n°2 : rien d'un système verrouillé).
{
  const s = base();
  s.systems.questing.unlocked = false;
  assert.equal(ligne(s).plafond, undefined);
}
// Plafond calculé par le moteur : placer exactement ce montant donne un niveau par tick (50 par seconde).
{
  const s = base();
  s.systems.questing.unlocked = true;
  const p = ligne(s).plafond;
  assert.ok(p >= 1 && Number.isFinite(p));
  const s2 = applyIdleNguAction(s, { action: "allocateNgu", ngu: "augments", value: p }, context, 1_000_000).state;
  const l = ligne(s2);
  assert.ok(Math.abs(l.secondsPerLevel - 1 / 50) < 1e-9, "au plafond : 1/50 s par niveau, obtenu " + l.secondsPerLevel);
  const moins = applyIdleNguAction(s, { action: "allocateNgu", ngu: "augments", value: Math.floor(p / 2) }, context, 1_000_000).state;
  assert.ok(ligne(moins).secondsPerLevel > 1 / 50 + 1e-9, "sous le plafond : plus lent qu'un niveau par tick");
}
// Défi Troll Sadistic : x3 de vitesse d'énergie, donc le plafond d'énergie est 3 fois plus petit ; la magie suit les complétions normales.
{
  const s = base();
  s.systems.questing.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  const avantE = ligne(s).plafond, avantM = ligne(s, "exp").plafond;
  s.challenge.completionsTier = { extreme: { troll: 1 } };
  assert.ok(Math.abs(ligne(s).plafond / avantE - 1 / 3) < 1e-3, "Troll Sadistic : plafond d'énergie / 3");
  assert.equal(ligne(s, "exp").plafond, avantM, "le Troll Sadistic ne change pas la magie");
  s.challenge.completionsTier = {}; s.challenge.completions = { troll: 1 };
  assert.ok(Math.abs(ligne(s, "exp").plafond / avantM - 1 / 3) < 1e-3, "Troll normal : plafond de magie / 3");
}
// Bornes : au moins 1, au plus 9e18 (Character::hardCap).
assert.equal(nguPlafondAllocationV1(1, 0, 1e30, 1e30), 1);
assert.equal(nguPlafondAllocationV1(2e11, 1e6, 1, 1e-9), 9e18);
assert.equal(nguPlafondAllocationV1(2e11, 9, 1e9, 1), 50 * 2e11 * 10 / 1e9);

// Client : bouton visible seulement avec le plafond du moteur ; placement lu dans NGUController::cap.
const src = fs.readFileSync(new URL("../public/modules/ngu-labo-v1.js", import.meta.url), "utf8");
assert.ok(/avecCap:n\.plafond!=null/.test(src) && /if\(b\.avecCap\)boutons\.push\(h\('button',\{type:'button',class:'max cap'/.test(src), "bouton Cap conditionné au plafond envoyé par le moteur");
assert.ok(src.includes("onClick:function(){ajusterCmd_(id,'cap');}"));
assert.ok(src.includes("1.0000020265579224") && src.includes("Math.ceil(pl/libreTotal)"), "règle de placement du jeu");
assert.ok(!/baseCost/.test(src), "aucune formule de vitesse dupliquée côté client");
assert.ok(fs.readFileSync(new URL("../public/modules/perso-boutons-v1.js", import.meta.url), "utf8").includes("pourcentNguEffectif"));
const dict = JSON.parse(fs.readFileSync(new URL("../public/modules/traduction-anglais-dict-v1.json", import.meta.url), "utf8"));
const d = dict.dict || dict;
assert.ok(Object.values(d).includes("Place this NGU's cap: the energy or magic that gains one level per tick"), "titre du bouton traduit");

// Cap all (AllNGUController::capAllEnergy) : tout revient au libre, puis plafond de chaque NGU dans l'ordre, jusqu'à épuisement ; Target -1 ignoré ; modificateur du NGU Cap Modifier.
{
  const s = base();
  s.systems.questing.unlocked = true;
  s.resources.energy.current = 1e15;
  const eux = ["augments", "wandoos"];
  const a1 = applyIdleNguAction(s, { action: "allocateNgu", ngu: "gold", value: 1000 }, context, 1_000_000).state;
  const t = applyIdleNguAction(a1, { action: "capAllNgu", resource: "energy", modifier: 1 }, context, 1_000_000).state;
  const L = idleNguSnapshot(t, context, 1_000_000).ngus.tiers.normal.filter(n => n.resource === "energy");
  assert.ok(L.length > 3);
  for (const n of L) assert.ok(n.allocation > 0, n.id + " reçoit son plafond");
  for (const id of eux) assert.ok(Math.abs(ligne(t, id).secondsPerLevel - 1 / 50) < 1e-4, id + " au plafond : un niveau par tick");
  assert.ok(Math.abs(ligne(t, "gold").secondsPerLevel - 1 / 50) < 1e-4, "l'allocation précédente a été reprise puis replacée au plafond");
  const moitie = applyIdleNguAction(a1, { action: "capAllNgu", resource: "energy", modifier: 0.5 }, context, 1_000_000).state;
  assert.ok(ligne(moitie, "augments").allocation < ligne(t, "augments").allocation * 0.51, "NGU Cap Modifier 50 %");
  // Target -1 : ignoré (reachedTarget vrai), Target 0 : plafonné
  const sans = applyIdleNguAction(a1, { action: "setNguTarget", ngu: "augments", value: -1 }, context, 1_000_000).state;
  const u = applyIdleNguAction(sans, { action: "capAllNgu", resource: "energy", modifier: 1 }, context, 1_000_000).state;
  assert.equal(ligne(u, "augments").allocation, 0, "Target -1 : ignoré");
  assert.ok(ligne(u, "wandoos").allocation > 0);
  // Énergie insuffisante : remplissage dans l'ordre jusqu'à épuisement, jamais plus que le libre.
  const peu = applyIdleNguAction(a1, { action: "capAllNgu", resource: "energy", modifier: 1 }, context, 1_000_000).state;
  assert.ok(peu.resources.energy.current >= 0);
  // Verrouillé sans Questing.
  const v = base(); v.systems.questing.unlocked = false;
  assert.throws(() => applyIdleNguAction(v, { action: "capAllNgu", resource: "energy" }, context, 1_000_000));
}
// Placement : lu dans NGUController::cap.
assert.equal(nguMontantCapV1(1000, 1, 0), 0);
assert.equal(nguMontantCapV1(1000, 1, 5000), Math.floor(Math.fround(1000 * Math.fround(1.0000020265579224))) + 1);
assert.equal(nguMontantCapV1(1000, 1, 10), 10);
assert.equal(nguMontantCapV1(0.5, 1, 99), 2, "plafond au moins 1, puis +1");
// Client : bouton Cap all conditionné au plafond, action du moteur ; le Max n'applique plus le NGU Cap Modifier.
assert.ok(src.includes("capToutVisible_(j)") && src.includes("action:'capAllNgu'") && src.includes("l[i].plafond!=null"));
const perso = fs.readFileSync(new URL("../public/modules/perso-boutons-v1.js", import.meta.url), "utf8");
assert.ok(!perso.includes("ngu.preset('cap',pourcentNgu_()/100)"), "le bouton Max n'est plus modifié par le NGU Cap Modifier");
assert.ok(d["Cap all"]);
console.log("idle-ngu-cap-bouton-v1 : OK");
