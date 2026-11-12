import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";
import { applyIdleInventoryAutoActionV1, idleInventoryAutoSnapshotV1, normalizeIdleInventoryAutoV1 } from "../src/idle-inventory-auto-v1.js";

/*
 * Norman (2026-11-04) : « pour les configurations d'équipement, on doit pouvoir leur donner un nom, les réorganiser et voir le total de bonus qu'on a avec ce stuff. Le popup quand on veut enregistrer doit être au format
 * du site. Il ne doit rester aucun popup avec le look Windows de base. »
 */
const adv = () => { const s = createIdleAdventureStateV47(); s.inventoryAuto = normalizeIdleInventoryAutoV1(null); return s; };
const addItem = (s, definitionId, level = 0) => { const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {}); Object.assign(s, r.state); return s.inventory.find((x) => x.id === r.result.id); };
const equip = (s, id, slot) => Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id, slot }, {}).state);
const env = { loadoutSlots: 3 };
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

{
  const s = adv();
  const arme = addItem(s, "sewers:weapon");
  const casque = addItem(s, "sewers:head");
  equip(s, arme.id, "weapon");
  equip(s, casque.id, "head");
  const st = { adventure: s };

  // enregistrer sur la configuration 1, la nommer
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
  const r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutRename", index: 0, name: "  Boss \u0000  de   fin  très très très long  " }, env);
  assert.ok(r.name.length <= 24 && !/[\u0000-\u001f]/.test(r.name) && r.name.startsWith("Boss de fin"), "nom nettoyé et limité à 24 caractères : " + JSON.stringify(r.name));
  // enregistrer de nouveau garde le nom
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
  assert.equal(normalizeIdleInventoryAutoV1(st.adventure.inventoryAuto).loadouts[0].name, r.name, "réenregistrer garde le nom");

  // un nom sur une configuration VIDE ne rend pas la configuration équipable (ne déséquipe jamais tout)
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutRename", index: 2, name: "Vide nommée" }, env);
  assert.throws(() => applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 2 }, env), /LOADOUT_VIDE/);
  assert.throws(() => applyIdleInventoryAutoActionV1(st, { mode: "loadoutRename", index: 3, name: "x" }, env), /LOADOUT_VERROUILLE/);

  // le total : Power et Endurance des pièces, PV = Power x 3, Regen = Endurance x 0,03
  const snap = idleInventoryAutoSnapshotV1(st.adventure, env);
  const lo = snap.loadouts[0];
  assert.equal(lo.name, r.name);
  const pw = [arme, casque].reduce((a, x) => a + Number(st.adventure.inventory.find((o) => o.id === x.id).power || 0), 0);
  assert.ok(Math.abs(lo.total.power - pw) < 1e-9, "total Power = somme des pièces");
  assert.ok(Math.abs(lo.total.hp - pw * 3) < 1e-9 && Math.abs(lo.total.regen - lo.total.toughness * 0.03) < 1e-9, "PV max et Regen PV comme le moteur");
  assert.equal(lo.total.absentes, 0);
  assert.equal(snap.loadouts[2].vide, true, "configuration nommée mais sans pièce : vide");

  // réorganiser : échange avec la voisine, bornes respectées
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutMove", index: 0, direction: 1 }, env);
  let sn = idleInventoryAutoSnapshotV1(st.adventure, env);
  assert.equal(sn.loadouts[1].name, r.name, "la configuration est descendue d'un rang");
  assert.equal(applyIdleInventoryAutoActionV1(st, { mode: "loadoutMove", index: 0, direction: -1 }, env).moved, false, "déjà tout en haut : rien ne bouge");
  assert.equal(applyIdleInventoryAutoActionV1(st, { mode: "loadoutMove", index: 2, direction: 1 }, env).moved, false, "déjà tout en bas des emplacements débloqués");

  // une pièce disparue du sac est comptée comme absente
  st.adventure.inventory = st.adventure.inventory.filter((o) => o.id !== casque.id);
  sn = idleInventoryAutoSnapshotV1(st.adventure, env);
  assert.equal(sn.loadouts[1].total.absentes, 1, "pièce absente du sac signalée");
}

// équiper une configuration reprend automatiquement au coffre les pièces qui y sont rangées (Norman, 2026-11-04)
{
  const s = adv();
  const arme = addItem(s, "sewers:weapon");
  const casque = addItem(s, "sewers:head");
  equip(s, arme.id, "weapon");
  equip(s, casque.id, "head");
  const st = { adventure: s };
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
  // le joueur range le casque au coffre (déséquipé, sorti du sac) et déséquipe l'arme
  Object.assign(st.adventure, applyIdleAdventureActionV47(st.adventure, { action: "unequip", id: casque.id }, {}).state);
  Object.assign(st.adventure, applyIdleAdventureActionV47(st.adventure, { action: "unequip", id: arme.id }, {}).state);
  const objCasque = st.adventure.inventory.find((o) => o.id === casque.id);
  st.adventure.inventory = st.adventure.inventory.filter((o) => o.id !== casque.id);
  st.adventure.coffre = st.adventure.coffre || {};
  st.adventure.coffre[objCasque.definitionId] = objCasque;
  // avant d'équiper : le casque n'est pas « absent », il est au coffre (compté dans le total)
  const avant = idleInventoryAutoSnapshotV1(st.adventure, env).loadouts[0].total;
  assert.equal(avant.absentes, 0, "une pièce au coffre n'est pas absente");
  assert.equal(avant.auCoffre, 1, "la pièce rangée au coffre est signalée");
  const res = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 0 }, env);
  assert.equal(res.fromCoffre, 1, "une pièce reprise au coffre");
  assert.equal(st.adventure.equipment.head, casque.id, "le casque rangé au coffre est équipé");
  assert.equal(st.adventure.equipment.weapon, arme.id, "l'arme du sac est équipée");
  assert.ok(!Object.values(st.adventure.coffre).some((o) => o && o.id === casque.id), "le casque a quitté le coffre");
}

// client : nom, flèches, total ; confirmation au format du site
{
  const ui = lire("public/modules/inventory-auto-v1.js");
  const cfg = lire("public/modules/inventory-configs-v1.js");
  assert.ok(ui.includes("loadoutRename") && ui.includes("loadoutMove") && ui.includes("loadoutIcon") && cfg.includes("ic-total") && cfg.includes("ic-nom-champ"), "nom, dessin, déplacement et total dans la bande et l'éditeur (zone du sac)");
  assert.ok(!/window\.confirm|[^.\w]confirm\(/.test(ui), "plus de confirm natif dans le panneau");
}

// AUCUN popup natif dans tout le code public (alert est redirigée vers la fenêtre du site par dialogue-site-v1.js)
{
  const rep = new URL("../public/modules/", import.meta.url);
  const natifs = [];
  for (const nom of readdirSync(rep)) {
    if (!nom.endsWith(".js") || nom === "dialogue-site-v1.js" || nom.startsWith("mediapipe")) continue;
    const src = readFileSync(new URL(nom, rep), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    if (/window\.confirm\s*\(|window\.prompt\s*\(|[^.\w$]confirm\s*\(|[^.\w$]prompt\s*\(/.test(src)) natifs.push(nom);
  }
  assert.deepEqual(natifs, [], "popups natifs confirm/prompt restants : " + natifs.join(", "));
  const dlg = lire("public/modules/dialogue-site-v1.js");
  assert.ok(dlg.includes("confirmer:") && dlg.includes("alerter:") && dlg.includes("saisir:") && dlg.includes("window.alert=function"), "fenêtres du site : confirmer, alerter, saisir ; alert redirigée");
  assert.ok(/dialogue-site-v1\.js\?v=\d+/.test(lire("public/index.html")), "chargée par la page");
}
// « sac plein » : un message clair au format du site à la place du code d'erreur (Norman, 2026-11-04)
{
  const meta = lire("public/modules/meta-progression-v130.js");
  assert.ok(meta.includes("function messageRefusJeuV1_(brut)") && meta.includes("Ton sac est plein") && /SAC_PLEIN\|INVENTAIRE_PLEIN/.test(meta), "message « sac plein »");
  assert.ok(meta.includes("?messageRefusJeuV1_(res.message)") && meta.includes("?messageRefusJeuV1_(e.message)"), "utilisé pour les refus du moteur et les erreurs d'appel");
}
console.log("idle-loadouts-noms-total-v1: OK");
