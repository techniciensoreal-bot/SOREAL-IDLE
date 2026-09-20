import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,idleAdventureNiveauEstMaxV1,idleAdventureItemStatsMaxV1
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-13), Phase 9/11/12 — audit préalable (pas de code sans
 * comprendre l'existant), PUIS re-audit le même jour suite à une
 * clarification de Norman ("une arme à 3/3 en force passera 3/4 en
 * fusionnant... regarde bien le wiki NGU") :
 *
 * 1. BUG TROUVÉ (Phase 9) : remake() (appelée par merge(), le seul moyen
 *    de monter de niveau) recalculait Power/Toughness UNIQUEMENT depuis
 *    la formule de niveau, écrasant tout boost déjà absorbé — un objet
 *    boosté puis fusionné perdait systématiquement son investissement.
 *
 * 1bis. RE-CORRECTION (même jour) : la première réparation ("conserver le
 *    surplus, le réappliquer sur la formule au nouveau niveau") était
 *    elle-même inventée, jamais vérifiée. Vérifié directement sur
 *    ngu-idle.fandom.com/wiki/Inventory : "By upgrading the level of an
 *    item, you raise the CAP of stats by 1% per level... The resulting
 *    merged item will have the MAX NUMBER in each stat between the
 *    original items — e.g., if the first had 3 power and 1 toughness and
 *    the second had 1 power and 5 toughness. After merging, the result
 *    will have 3 power and 5 toughness." La fusion ne recalcule JAMAIS
 *    via une formule : elle prend le MAX de chaque stat entre les deux
 *    objets. Le "cap" (plafond théorique, basePower×(1+niveau/100))
 *    grandit à chaque fusion via le niveau, mais la valeur COURANTE ne le
 *    rattrape pas automatiquement — d'où l'exemple de Norman (3/3 → 3/4).
 *
 * 2. Maxage (Phase 11) : idleAdventureNiveauEstMaxV1 (niveau seul) reste
 *    fidèle au badge "MAXXED" officiel du jeu (wiki, page Inventory :
 *    marqué dès le niveau 100, indépendamment des boosts) — utilisée pour
 *    le badge général (Collection). Le Coffre, lui, a une exigence PLUS
 *    STRICTE (Norman : "une arme ne doit pas être considérée comme maxée
 *    si elle n'a pas le level 100 ET les stats au max grâce aux
 *    boosts") : idleAdventureObjetPleinementMaxeV1 exige EN PLUS que
 *    Power/Toughness aient atteint leur plafond réel (basePower×2 à
 *    niveau 100).
 *
 * 3. Coffre (Phase 12) : nouveau stockage séparé de l'inventaire
 *    (jamais compté dans sa capacité), qui n'accepte QUE des objets
 *    d'équipement réellement PLEINEMENT maxés (point 2 ci-dessus).
 */

/*
 * --- 1. Fusionner prend le MAX de chaque stat entre les deux objets (jamais un recalcul de formule) ---
 *
 * RÉVISÉ 2026-09-14 (Norman : "Power 4/1 alors que le maximum est 1/1",
 * voir idle-adventure-v47.js::applyBoost) : un objet créé directement via
 * addItem est toujours déjà à son propre plafond pur (basePower×(1+niveau/
 * 100)), à N'IMPORTE QUEL niveau — un boost n'y a donc plus aucun effet.
 * Pour tester "un boost déjà absorbé survit à la fusion", il faut d'abord
 * un vrai écart à combler : on fusionne deux objets de même niveau AVANT
 * de booster (exactement le mécanisme documenté plus haut, "3/3 → 3/4"),
 * ce qui donne à l'objet A un vrai plafond au-dessus de sa valeur actuelle.
 */
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.kind==="equipment";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1);
  s = r.state;
  r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1);
  s = r.state;
  const idsSetup = s.inventory.map(x => x.id);
  r = applyIdleAdventureActionV47(s, { action: "merge", a: idsSetup[0], b: idsSetup[1] }, { bosses: 17 }, 1);
  s = r.state;
  const itemId = s.inventory[0].id;
  const powerBeforeBoost = s.inventory[0].power;

  const boostId = "test-boost-1";
  s.inventory.push({ id: boostId, definitionId: "boost:power:100", name: "Boost power 100", kind: "boost", boostType: "power", strength: 100, level: 0 });

  r = applyIdleAdventureActionV47(s, { action: "boost", boostId, targetId: itemId }, { bosses: 17 }, 1);
  s = r.state;
  const boostedItem = s.inventory.find(x => x.id === itemId);
  assert.ok(boostedItem.power > powerBeforeBoost, "Le boost doit augmenter Power immédiatement (l'objet fusionné a un vrai écart à combler).");
  const powerAfterBoost = boostedItem.power;

  // Fusionne avec un deuxième objet MOINS boosté (power plus faible) : le résultat garde le MAX (celui de l'objet A, déjà boosté).
  r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 30 }, { bosses: 17 }, 1);
  s = r.state;
  const secondId = s.inventory.find(x => x.id !== itemId && x.definitionId === "forest:weapon").id;
  const secondPower = s.inventory.find(x => x.id === secondId).power;
  assert.ok(secondPower < powerAfterBoost, "Le second objet (non boosté) doit avoir un Power plus faible, pour tester le vrai cas MAX.");

  const levelBeforeSecondMerge = s.inventory.find(x => x.id === itemId).level;
  r = applyIdleAdventureActionV47(s, { action: "merge", a: itemId, b: secondId }, { bosses: 17 }, 1);
  s = r.state;

  const merged = s.inventory.find(x => x.id === itemId);
  assert.ok(merged, "L'objet survivant doit garder le même id après fusion.");
  assert.equal(
    merged.power, powerAfterBoost,
    "Fidèle au wiki : le Power fusionné doit être EXACTEMENT le MAX des deux objets (celui déjà boosté), jamais un recalcul de formule ni une perte du boost."
  );
  assert.equal(merged.level, Math.min(100, levelBeforeSecondMerge + 30 + 1), "Le niveau reste la somme des deux + 1 (borné à 100), inchangé.");
}

// --- 2. idleAdventureNiveauEstMaxV1 : seule logique de maxage ---
{
  assert.equal(idleAdventureNiveauEstMaxV1(99), false);
  assert.equal(idleAdventureNiveauEstMaxV1(100), true);
  assert.equal(idleAdventureNiveauEstMaxV1(150), true, "Une valeur au-delà de 100 (jamais censée arriver, mais défensif) reste considérée maxée.");
  assert.equal(idleAdventureNiveauEstMaxV1(undefined), false);
}

// --- 2bis. Le snapshot expose maxed directement, le client ne doit plus le recalculer seul ---
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.kind==="equipment";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 100 }, { bosses: 17 }, 1);
  s = r.state;
  const snap = idleAdventureSnapshotV47(s, 17);
  assert.equal(snap.inventory[0].maxed, true, "Un objet de niveau 100 doit être marqué maxed dans le snapshot.");
  assert.equal(snap.itemList["forest:weapon"].maxed, true, "itemList doit aussi porter maxed, pour la Collection.");
}

// --- 3. Coffre (audit 2026-09-13, Norman : emplacements fixes, "ranger nous-même dans la case appropriée") ---
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.kind==="equipment";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 100 }, { bosses: 17 }, 1);
  s = r.state;
  const maxedId = s.inventory[0].id;
  /*
   * Correctif 2026-09-18 (Norman, capture d'écran du vrai NGU en direct) :
   * un objet fraîchement créé démarre désormais à power:0/toughness:0,
   * même au niveau 100 (voir item()/special() dans idle-adventure-v47.js)
   * -- "niveau 100" seul ne suffit donc plus à être "pleinement maxé"
   * (idleAdventureObjetPleinementMaxeV1 exige AUSSI power/toughness au
   * vrai plafond). On simule ici directement l'état d'un objet déjà
   * entièrement boosté (précondition du test, pas le mécanisme de boost
   * lui-même, déjà testé plus haut dans ce fichier).
   */
  {
    const maxedItem = s.inventory.find(x => x.id === maxedId);
    const { p, t } = idleAdventureItemStatsMaxV1("forest", "weapon");
    maxedItem.power = p;
    maxedItem.toughness = t;
  }

  r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 50 }, { bosses: 17 }, 1);
  s = r.state;
  const notMaxedId = s.inventory.find(x => x.id !== maxedId).id;

  // Refuse un objet pas maxé.
  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: notMaxedId }, { bosses: 17 }, 1),
    /OBJET_NON_MAXE/,
    "Un objet niveau 50 ne doit jamais pouvoir entrer dans le coffre."
  );

  // Accepte l'objet maxé, dans SA case fixe (definitionId), jamais un choix libre.
  r = applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: maxedId }, { bosses: 17 }, 1);
  s = r.state;
  assert.equal(s.inventory.some(x => x.id === maxedId), false, "L'objet doit quitter l'inventaire.");
  assert.equal(s.coffre["forest:weapon"]?.id, maxedId, "L'objet doit occuper exactement l'emplacement forest:weapon, son emplacement fixe.");

  // Le coffre ne compte jamais dans la capacité de sac.
  const snap = idleAdventureSnapshotV47(s, 17);
  assert.equal(snap.inventoryUsed, 1, "Seul l'objet niveau 50 restant doit compter dans le sac — le coffre ne compte jamais.");

  // coffreSlots doit exposer TOUT le catalogue d'équipement (pas seulement les objets déjà déposés) —
  // les cases vides et jamais découvertes restent visibles, jamais reconstruites depuis les seuls objets obtenus.
  assert.ok(snap.coffreSlots.length > 50, "coffreSlots doit couvrir tout le catalogue d'équipement (dizaines d'emplacements), pas seulement les objets déposés.");
  const slotForestWeapon = snap.coffreSlots.find(x => x.definitionId === "forest:weapon");
  assert.equal(slotForestWeapon.occupe, true, "L'emplacement forest:weapon doit être marqué occupé (V vert).");
  assert.equal(slotForestWeapon.item.id, maxedId);
  const slotSewersWeapon = snap.coffreSlots.find(x => x.definitionId === "sewers:weapon");
  assert.equal(slotSewersWeapon.occupe, false, "Un emplacement jamais déposé doit rester vide — un trou visible, jamais comblé automatiquement.");

  // Refuse un deuxième objet dans une case déjà occupée (une case = un emplacement fixe, pas un choix libre).
  const idsBeforeSecondAdd = new Set(s.inventory.map(x => x.id));
  r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 100 }, { bosses: 17 }, 1);
  s = r.state;
  const secondMaxedId = s.inventory.find(x => x.definitionId === "forest:weapon" && !idsBeforeSecondAdd.has(x.id)).id;
  {
    const secondMaxedItem = s.inventory.find(x => x.id === secondMaxedId);
    const { p, t } = idleAdventureItemStatsMaxV1("forest", "weapon");
    secondMaxedItem.power = p;
    secondMaxedItem.toughness = t;
  }
  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: secondMaxedId }, { bosses: 17 }, 1),
    /CASE_DEJA_OCCUPEE/,
    "Une case déjà occupée doit refuser un deuxième objet — un emplacement fixe par objet du catalogue, jamais un tableau libre."
  );
  s.inventory = s.inventory.filter(x => x.id !== secondMaxedId);

  // Refuse un boost dans le coffre (jamais "maxé" au sens équipement).
  const boostId = "test-boost-2";
  s.inventory.push({ id: boostId, definitionId: "boost:power:100", name: "Boost power 100", kind: "boost", boostType: "power", strength: 100, level: 0 });
  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: boostId }, { bosses: 17 }, 1),
    /OBJET_NON_ELIGIBLE_COFFRE/,
    "Un boost ne doit jamais pouvoir entrer dans le coffre."
  );

  // Retrait vers l'inventaire : l'objet doit pouvoir être rééquipé ensuite (Norman : "on peut reprendre les items pour les réequiper au besoin").
  r = applyIdleAdventureActionV47(s, { action: "coffreRetirer", id: maxedId }, { bosses: 17 }, 1);
  s = r.state;
  assert.equal(s.coffre["forest:weapon"], undefined, "L'emplacement doit se vider au retrait.");
  assert.equal(s.inventory.some(x => x.id === maxedId), true, "L'objet doit revenir dans l'inventaire au retrait.");
  r = applyIdleAdventureActionV47(s, { action: "equip", id: maxedId, slot: "weapon" }, { bosses: 17 }, 1);
  s = r.state;
  assert.ok(equippedIdsFromState(s).has(maxedId), "Un objet retiré du coffre doit pouvoir être rééquipé normalement, sans mécanisme séparé.");

  // Persistance à travers une renormalisation (comme un rechargement de session).
  r = applyIdleAdventureActionV47(s, { action: "unequip", id: maxedId }, { bosses: 17 }, 1);
  s = r.state;
  r = applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: maxedId }, { bosses: 17 }, 1);
  s = r.state;
  const reloaded = normalizeIdleAdventureStateV47(s);
  assert.equal(typeof reloaded.coffre, "object", "Le coffre doit survivre à une renormalisation d'état (rechargement).");
  assert.equal(Array.isArray(reloaded.coffre), false, "Le coffre est désormais un objet indexé par emplacement, plus un tableau libre.");
}

function equippedIdsFromState(s) {
  return new Set([s.equipment.head, s.equipment.chest, s.equipment.legs, s.equipment.boots, s.equipment.weapon, ...(s.equipment.accessories || [])].filter(Boolean));
}

// --- 3ter. Coffre : niveau 100 SEUL ne suffit plus — il faut aussi Power/Toughness au plafond (Norman, re-audit) ---
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.kind==="equipment";});  // Fusionne un objet niveau 50 (jamais boosté) avec un objet niveau 49 : résultat niveau 100,
  // mais Power reste celui du plus fort des deux (formule niveau 50 < plafond niveau 100) — "3/3 → 3/4".
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 50 }, { bosses: 17 }, 1);
  s = r.state;
  const aId = s.inventory[0].id;
  r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 49 }, { bosses: 17 }, 1);
  s = r.state;
  const bId = s.inventory.find(x => x.id !== aId).id;
  r = applyIdleAdventureActionV47(s, { action: "merge", a: aId, b: bId }, { bosses: 17 }, 1);
  s = r.state;

  const merged = s.inventory.find(x => x.id === aId);
  assert.equal(merged.level, 100, "50+49+1 = 100 : le badge MAXXED général (niveau seul) doit déjà s'appliquer.");
  const snapAvant = idleAdventureSnapshotV47(s, 17);
  assert.equal(snapAvant.inventory.find(x => x.id === aId).maxed, true, "Le badge MAXXED général (Collection) reste vrai au niveau 100 seul, fidèle au wiki.");

  // Mais le Coffre doit REFUSER cet objet : niveau 100 sans que Power ait atteint le vrai plafond (basePower×2).
  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: aId }, { bosses: 17 }, 1),
    /OBJET_NON_MAXE/,
    "Norman : 'une arme ne doit pas être considérée comme maxée si elle n'a pas le level 100 ET les stats au max grâce aux boosts.' Niveau 100 seul ne doit jamais suffire pour le Coffre."
  );

  // Une fois toutes les statistiques RÉELLES de l'objet au plafond, le Coffre doit l'accepter.
  // forest:weapon n'a ici qu'un plafond Power utile : après ce boost l'objet est pleinement terminé.
  const boostPowerId = "test-boost-cap-power";
  const boostToughnessId = "test-boost-cap-toughness";
  s.inventory.push({ id: boostPowerId, definitionId: "boost:power:100", name: "Boost power 100", kind: "boost", boostType: "power", strength: 100000, level: 0 });
  s.inventory.push({ id: boostToughnessId, definitionId: "boost:toughness:100", name: "Boost toughness 100", kind: "boost", boostType: "toughness", strength: 100000, level: 0 });
  r = applyIdleAdventureActionV47(s, { action: "boost", boostId: boostPowerId, targetId: aId }, { bosses: 17 }, 1);
  s = r.state;

  // V210 : un objet déjà terminé ne doit plus engloutir un boost inutile.
  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "boost", boostId: boostToughnessId, targetId: aId }, { bosses: 17 }, 1),
    /OBJET_DEJA_MAXE|BOOST_STAT_DEJA_MAX/,
    "Une pièce pleinement maxée doit refuser tout boost supplémentaire."
  );
  assert.equal(
    s.inventory.some(x => x.id === boostToughnessId),
    true,
    "Le boost refusé doit rester dans l'inventaire."
  );

  r = applyIdleAdventureActionV47(s, { action: "coffreDeposer", id: aId }, { bosses: 17 }, 1);
  s = r.state;
  assert.equal(s.coffre["forest:weapon"]?.id, aId, "Une fois ses statistiques utiles au plafond réel, le Coffre doit accepter l'objet.");
}

// --- 3bis. Un objet équipé ne peut pas rejoindre le coffre directement (doit d'abord être déséquipé, comme discard()) ---
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.kind==="equipment";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 100 }, { bosses: 17 }, 1);
  s = r.state;
  const id = s.inventory[0].id;
  r = applyIdleAdventureActionV47(s, { action: "equip", id, slot: "weapon" }, { bosses: 17 }, 1);
  s = r.state;
  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "coffreDeposer", id }, { bosses: 17 }, 1),
    /OBJET_EQUIPE/,
    "Un objet équipé doit d'abord être déséquipé avant de rejoindre le coffre."
  );
}

console.log("idle-adventure-boost-merge-coffre: OK");
