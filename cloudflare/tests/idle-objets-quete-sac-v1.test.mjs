import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import { idleQuestItemObjectV1, idleQuestBagItemsV1, idleQuestQpMultiplierV1 } from "../src/idle-questing-v1.js";
import { idleAdventureAddItemV1, idleAdventureSyncInventorySlotsV1, idleAdventureInventoryCapacityV1, idleAdventureInventoryUsedV1 } from "../src/idle-adventure-v47.js";
import { MIGRATIONS, ETAT_VERSION_COURANTE, migrerEtatV1, appliquerMigrationV1 } from "../src/idle-migrations-v1.js";
import { idleDaycareEligibilityV1 } from "../src/idle-daycare-v1.js";

/*
 * Objets de quête dans le sac d'Aventure (décision de Norman, 2026-11-17 : « comme dans le vrai jeu : acheter des emplacements pour mieux organiser son
 * inventaire, dont les objets de quête »). Lu dans le jeu, build 1260 : BeastQuestController::isQuestItem (ids 278 à 287), ItemNameDesc::addLoot (première case
 * libre, sinon perdu), InventoryController::dumpAllIntoQuest (cases dans l'ordre, deleteItem laisse la case vide), ItemController::consumeItem (ctrl + clic = un
 * objet), InventoryController::mergeable / checkItemTransform (fusion, niveau 100 = itemMaxxed). Migration 56 -> 57 : l'ancien stock devient une file d'attente.
 */
const ctx = { bosses: 200, rebirths: 1 };
const T0 = 1_000_000_000;
const act = (s, payload, t = T0) => applyIdleNguAction(s, payload, ctx, t);
const avecAleatoire = (valeur, fn) => {
  const orig = Math.random;
  Math.random = () => valeur;
  try { return fn(); } finally { Math.random = orig; }
};
function base(sets = { sewers: true }) {
  let s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  s.adventure.unlockItems = Object.assign({}, s.adventure.unlockItems, { heroicSigil: true });
  s.adventure.completedSets = Object.assign({}, sets);
  return normalizeIdleNguState(s, ctx, T0);
}
const quete = (s) => avecAleatoire(0, () => act(s, { action: "questStart" })).state;
const poser = (s, liste, zone = "sewers") => {
  for (const [lv, n] of liste) for (let i = 0; i < n; i++) assert.ok(idleAdventureAddItemV1(s.adventure, idleQuestItemObjectV1(zone, lv)), "place dans le sac");
  idleAdventureSyncInventorySlotsV1(s.adventure);
};
const objets = (s, zone = "sewers") => idleQuestBagItemsV1(s.adventure, zone);
const niveaux = (s, zone = "sewers") => objets(s, zone).map((o) => o.level);
const total = (s) => objets(s, undefined).length;
const attente = (s) => { let n = 0; for (const par of Object.values(s.systems.questing.data.attente || {})) for (const c of Object.values(par)) n += c; return n; };

/* --- 1. Forme de l'objet : un objet du sac, kind "quest", id du jeu 278..287, niveau 0 --- */
{
  const o = idleQuestItemObjectV1("evilverse", 0);
  assert.equal(o.kind, "quest");
  assert.equal(o.definitionId, "quest:evilverse");
  assert.equal(o.wikiItemId, 284, "id du jeu : A Severed Human Thumb");
  assert.equal(idleQuestItemObjectV1("inconnue"), null);
  const s = base();
  const avant = idleAdventureInventoryUsedV1(s.adventure);
  poser(s, [[0, 3]]);
  assert.equal(idleAdventureInventoryUsedV1(s.adventure), avant + 3, "chaque objet de quête occupe UN emplacement du sac (aucun empilement)");
  assert.equal(Object.keys(s.adventure.itemList).some((k) => k.startsWith("quest:")), false, "pas dans la liste des objets vus (collection)");
}

/* --- 2. Drop : première case libre ; sac plein : perdu, jamais de stock caché --- */
{
  let s = quete(base());
  s.adventure.selectedZone = "sewers";
  const kill = avecAleatoire(0, () => act(s, { action: "adventure", adventure: { action: "zoneKill" } }));
  assert.deepEqual(kill.result.questDrop, { zone: "sewers", name: "Bits of String", level: 0 });
  assert.deepEqual(niveaux(kill.state), [0]);
  const cap = idleAdventureInventoryCapacityV1(kill.state.adventure);
  const plein = kill.state;
  while (idleAdventureInventoryUsedV1(plein.adventure) < cap) assert.ok(idleAdventureAddItemV1(plein.adventure, idleQuestItemObjectV1("sewers", 0)));
  idleAdventureSyncInventorySlotsV1(plein.adventure);
  const nb = total(plein);
  const perdu = avecAleatoire(0, () => act(plein, { action: "adventure", adventure: { action: "zoneKill" } }));
  assert.equal(perdu.result.questDrop.perdu, true, "lu dans le jeu (ItemNameDesc::addLoot) : plus de case libre, l'objet est perdu");
  assert.equal(total(perdu.state), nb);
  assert.equal(attente(perdu.state), 0, "rien n'est gardé en attente pour un NOUVEAU drop");
}

/* --- 3. Remise : cases parcourues DANS L'ORDRE (pas par niveau), cases laissées vides, objet verrouillé jamais remis --- */
{
  let s = quete(base());
  s.systems.perks.unlocked = true;
  s.systems.perks.data = { levels: { 66: 1, 145: 1 } };
  poser(s, [[30, 1], [0, 1], [20, 1]]);
  s.systems.questing.data.quest.required = 4;
  const [iA, iB, iC] = objets(s).map((o) => o.id);   /* cases : A (niveau 30, vaut 4), B (niveau 0, vaut 1), C (niveau 20, vaut 3) */
  const cases = idleAdventureSyncInventorySlotsV1(s.adventure).slice();
  const r = act(s, { action: "questHandIn" });
  assert.equal(r.result.handedIn, 1, "la première case suffit (4) : les suivantes ne sont pas consommées (un tri par niveau en aurait pris deux)");
  assert.deepEqual(objets(r.state).map((o) => o.id), [iB, iC]);
  assert.equal(r.state.adventure.inventorySlots[cases.indexOf(iA)], "", "la case de l'objet remis reste VIDE");
  assert.equal(r.state.adventure.inventorySlots.indexOf(iB), cases.indexOf(iB), "aucun décalage");
  assert.equal(r.state.adventure.inventorySlots.indexOf(iC), cases.indexOf(iC), "aucun décalage");
  assert.equal(r.state.adventure.revision > s.adventure.revision, true, "la révision du sac avance (le client se met à jour)");
  /* le joueur échange A et B : la remise suit l'ordre des cases (B puis A) */
  const echange = JSON.parse(JSON.stringify(s));
  const sl = echange.adventure.inventorySlots;
  const a = sl.indexOf(iA), b = sl.indexOf(iB);
  sl[a] = iB; sl[b] = iA;
  const r2 = act(echange, { action: "questHandIn" });
  assert.equal(r2.result.handedIn, 2, "B (1) puis A (4) : la quête est pleine");
  assert.deepEqual(objets(r2.state).map((o) => o.id), [iC]);

  /* verrou (Equipment.removable faux) : jamais remis */
  let v = quete(base());
  poser(v, [[0, 2]]);
  const premier = objets(v)[0];
  v.adventure.inventory.find((o) => o.id === premier.id).locked = true;
  const rv = act(v, { action: "questHandIn" });
  assert.equal(rv.result.handedIn, 1, "l'objet protégé reste dans le sac");
  assert.equal(objets(rv.state)[0].id, premier.id);
  assert.throws(() => act(v, { action: "questHandIn", itemId: premier.id }), /OBJET_VERROUILLE/);
}

/* --- 4. Un objet (ctrl + clic) : refuse hors quête / autre zone / quête pleine au lieu de détruire l'objet --- */
{
  let s = base({ sewers: true, forest: true });
  poser(s, [[0, 1]]);
  const id = objets(s)[0].id;
  assert.throws(() => act(s, { action: "questHandIn", itemId: id }), /AUCUNE_QUETE_ACTIVE/);
  let q = avecAleatoire(0.999999, () => act(s, { action: "questStart" })).state;
  assert.equal(q.systems.questing.data.quest.zone, "forest");
  assert.throws(() => act(q, { action: "questHandIn", itemId: id }), /OBJET_QUETE_AUTRE_QUETE/);
  assert.equal(niveaux(q).length, 1, "rien n'est détruit");
  let p = quete(s);
  p.systems.questing.data.quest.required = 1;
  poser(p, [[0, 1]]);
  const [a, b] = objets(p).map((o) => o.id);
  const un = act(p, { action: "questHandIn", itemId: a });
  assert.equal(un.result.progress, 1);
  assert.throws(() => act(un.state, { action: "questHandIn", itemId: b }), /QUETE_DEJA_REMPLIE/);
}

/* --- 5. Fusion dans le sac : niveau a + b + 1, 100 au plus ; niveau 100 = objet « maxé » (+2 % QP par type) --- */
{
  let s = base();
  poser(s, [[50, 1], [49, 1]]);
  const [a, b] = objets(s);
  const avant = idleQuestQpMultiplierV1(s, {});
  const r = act(s, { action: "adventure", adventure: { action: "merge", a: a.id, b: b.id } });
  assert.deepEqual(niveaux(r.state), [100]);
  assert.equal(r.state.adventure.questMaxed.sewers, true);
  assert.ok(Math.abs(idleQuestQpMultiplierV1(r.state, {}) / avant - 1.02) < 1e-9, "BeastQuestController::questRewardFactor : 1,02 par type monté au niveau 100");
  assert.equal(Object.keys(r.state.adventure.itemList).some((k) => k.startsWith("quest:")), false);
  /* par l'action de la page Questing */
  let q = base();
  poser(q, [[0, 2]]);
  assert.deepEqual(act(q, { action: "questMerge", zone: "sewers", levelA: 0, levelB: 0 }).result, { zone: "sewers", level: 1, maxed: false });
  assert.throws(() => act(q, { action: "questMerge", zone: "sewers", levelA: 7, levelB: 0 }), /OBJET_QUETE_ABSENT/);
}

/* --- 6. Pas d'équipement, de boost ni de Garderie sur un objet de quête --- */
{
  let s = base();
  poser(s, [[0, 1]]);
  const o = objets(s)[0];
  assert.throws(() => act(s, { action: "adventure", adventure: { action: "equip", id: o.id, slot: "accessory" } }), /EQUIPEMENT_INVALIDE/);
  assert.equal(idleDaycareEligibilityV1(o), "OBJET_NON_ELIGIBLE_DAYCARE");
}

/* --- 7. Migration 56 -> 57 : l'ancien stock devient une file d'attente, rien n'est perdu --- */
{
  const m = MIGRATIONS.find((x) => x.de === 56);
  assert.ok(m && m.vers === 57 && ETAT_VERSION_COURANTE === 57, "migration 56 -> 57 déclarée");
  const natif = JSON.parse(JSON.stringify(base()));   /* état natif du moteur (la migration ne joue que sur un état natif) */
  natif.etatVersion = 56;
  natif.systems.questing.data = { items: { sewers: { 0: 30, 5: 2 }, forest: { 0: 4 } }, maxedItems: { sewers: true } };
  const brut = natif;
  const migre = appliquerMigrationV1(m, JSON.parse(JSON.stringify(brut)));
  assert.equal(migre.etatVersion, 57);
  assert.equal(migre.systems.questing.data.items, undefined);
  assert.deepEqual(migre.systems.questing.data.attente, { sewers: { 0: 30, 5: 2 }, forest: { 0: 4 } });
  assert.deepEqual(migre.systems.questing.data.maxedItems, { sewers: true }, "les types déjà montés au niveau 100 le restent");
  assert.deepEqual(appliquerMigrationV1(m, JSON.parse(JSON.stringify(migre))), migre, "idempotente");
  const vide = JSON.parse(JSON.stringify(natif)); vide.systems.questing.data = { items: {} };
  const sansStock = appliquerMigrationV1(m, vide);
  assert.deepEqual(sansStock.systems.questing.data.attente, {});

  /* de bout en bout : état 56 avec 40 objets (24 places au total) -> le sac se remplit (plus haut niveau d'abord), le reste attend, puis entre dès qu'une place se libère */
  let s = base();
  const brutEtat = JSON.parse(JSON.stringify(s));
  brutEtat.etatVersion = 56;
  brutEtat.systems.questing.data.items = { sewers: { 0: 38, 9: 2 } };
  delete brutEtat.systems.questing.data.attente;
  let n = normalizeIdleNguState(brutEtat, ctx, T0);
  assert.equal(n.etatVersion, 57);
  assert.equal(attente(n) + total(n), 40, "aucune perte à la migration");
  n = advanceIdleNguState(n, 1, ctx, T0 + 1000);
  const libres = idleAdventureInventoryCapacityV1(n.adventure) - 4;
  assert.equal(total(n), libres, "le sac est rempli jusqu'à la dernière case libre");
  assert.equal(total(n) + attente(n), 40);
  assert.deepEqual(niveaux(n).slice(0, 2), [9, 9], "plus haut niveau d'abord");
  assert.equal(attente(n) > 0, true);
  /* une place se libère : l'objet en attente entre */
  const sup = objets(n)[0];
  n.adventure.inventory = n.adventure.inventory.filter((o) => o.id !== sup.id);
  n = advanceIdleNguState(n, 1, ctx, T0 + 2000);
  assert.equal(total(n), libres, "la case libérée est reprise par un objet en attente");
  assert.equal(total(n) + attente(n), 39);
  /* et le moteur ne ré-appelle pas la migration : version stable */
  assert.equal(migrerEtatV1(JSON.parse(JSON.stringify(n))).jouees.length, 0);
}

/* --- 8. Anti-spoil (règle n°2) : rien tant que Questing n'est pas ouvert, pas de total --- */
{
  const neuf = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  assert.equal(neuf.adventure.inventory.some((o) => o.kind === "quest"), false);
  const snap = idleNguSnapshot(neuf, ctx, T0).questing;
  assert.deepEqual(snap, { unlocked: false });
  const s = base();
  const q = idleNguSnapshot(s, ctx, T0).questing;
  assert.deepEqual(q.items, [], "aucun objet : liste vide, aucune ligne pour les zones sans objet");
  assert.equal(q.enAttente, 0);
  poser(s, [[0, 1]], "sewers");
  const q2 = idleNguSnapshot(s, ctx, T0).questing;
  assert.deepEqual(q2.items.map((i) => i.zone), ["sewers"], "seules les zones dont on possède un objet apparaissent");
}

/* --- 9. Client : fiche de l'objet (bouton de remise) et page Questing --- */
{
  const fiche = readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8");
  assert.ok(fiche.includes("item.kind!=='boost'&&item.kind!=='quest'&&"), "pas de bouton Équiper sur un objet de quête");
  assert.ok(fiche.includes("__SOREAL_IDLE_QUESTING_V1__.boutonsFiche(REG.idleEtat,item)"));
  const page = readFileSync("cloudflare/public/modules/questing-v1.js", "utf8");
  assert.match(page, /Aucun objet de quête dans ton sac/);
  assert.match(page, /en attente d’une case libre/);
  /* boutons de la fiche : seulement pour la quête en cours, objet libre, quête non pleine */
  const fenetre = { __SOREAL_IDLE_META_HOST_V130__: { idleHtml_: (v) => String(v == null ? "" : v), idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)) } };
  vm.runInNewContext(page, { window: fenetre });
  const bf = fenetre.__SOREAL_IDLE_QUESTING_V1__.boutonsFiche;
  const etat = (quest, unlocked = true) => ({ systemes: { questing: { unlocked, quest } } });
  const objet = { id: "i9", kind: "quest", zone: "sewers", locked: false };
  assert.match(bf(etat({ zone: "sewers", progress: 3, required: 50 }), objet), /questHandIn[^"]*itemId[^"]*i9/);
  assert.match(bf(etat({ zone: "sewers", progress: 3, required: 50 }), objet), /Tout remettre/);
  assert.equal(bf(etat(null), objet), "", "pas de quête : aucun bouton");
  assert.equal(bf(etat({ zone: "forest", progress: 3, required: 50 }), objet), "", "autre zone : aucun bouton");
  assert.equal(bf(etat({ zone: "sewers", progress: 50, required: 50 }), objet), "", "quête pleine : aucun bouton");
  assert.equal(bf(etat({ zone: "sewers", progress: 3, required: 50 }), Object.assign({}, objet, { locked: true })), "", "objet protégé : aucun bouton");
  assert.equal(bf(etat({ zone: "sewers", progress: 3, required: 50 }, false), objet), "", "système verrouillé : aucun bouton");
  assert.equal(bf(etat({ zone: "sewers", progress: 3, required: 50 }), { id: "i1", kind: "equipment", zone: "sewers" }), "", "seulement pour un objet de quête");
}

console.log("idle-objets-quete-sac-v1 OK");
