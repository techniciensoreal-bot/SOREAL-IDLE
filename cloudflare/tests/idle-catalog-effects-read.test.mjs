import assert from "node:assert/strict";
import { auditCatalogEffectsRead } from "../../design/audit-catalog-effects-read.mjs";

/*
 * Audit de seconde passe (2026-09-24) : « catalogué mais non branché ».
 * Le script design/audit-catalog-effects-read.mjs exécute chaque perk, quirk et souhait au niveau 1 et
 * regarde (a) quels champs d'agrégateur il change, (b) si ces champs sont lus quelque part, (c) sinon si
 * son id est cité. Ce test fige le résultat : tout NOUVEL effet catalogué sans consommateur fait échouer,
 * et chaque exception connue est expliquée ici (jamais approximée : voir docs/WORKLOG.md).
 */
const r = await auditCatalogEffectsRead();

/* Aucun champ d'agrégateur (perks / quirks / souhaits) n'est agrégé sans être lu. */
for (const kind of ["perks", "quirks", "wishes"]) {
  const unread = r[kind].filter((e) => e.strictUnread.length).map((e) => `${e.id}:${e.strictUnread.join("+")}`);
  assert.deepEqual(unread, [], `${kind} : champs d'agrégateur jamais lus`);
}

/* Entrées sans effet agrégé ni id cité : uniquement les exceptions documentées. */
const NON_DETECTES = {
  perks: {
    30: "lu par niveau dans idle-yggdrasil-extra-v1.js (Poop des kills ITOPOD)",
    231: "perk-blague « ERROR » : aucun effet réel dans le texte du wiki"
  },
  quirks: {
    13: "Beast's Fertilizer : lu par id dans idle-yggdrasil-extra-v1.js",
    176: "quirk-blague « A PROBLEM HAS BEEN DETECTED » : aucun effet réel"
  },
  wishes: {
    26: "portrait de joueur (cosmétique), aucun effet de jeu",
    40: "QP du Godmother : lu par la table TITAN_QP_V1 (idle-adventure-v47.js)",
    41: "QP du Titan suivant le Godmother : TITAN_QP_V1",
    44: "art du Daycare Kitty (cosmétique)",
    59: "NON IMPLÉMENTÉ : Blood MacGuffin α +20 %/niveau (arrondi non publié, voir WORKLOG 2026-09-24)",
    60: "NON IMPLÉMENTÉ : Fruit of MacGuffin α +20 %/niveau (arrondi non publié)",
    74: "QP du Greasy Nerd : TITAN_QP_V1",
    75: "portrait de joueur (cosmétique), aucun effet de jeu"
  }
};
for (const kind of ["perks", "quirks", "wishes"]) {
  const found = r[kind].filter((e) => e.noEffect && !e.idCited).map((e) => String(e.id)).sort();
  assert.deepEqual(found, Object.keys(NON_DETECTES[kind]).sort(), `${kind} : entrées sans consommateur détecté`);
}

/* Sellout : aucun objet achetable-passif dont l'id n'est lu nulle part (AP débités pour rien). */
assert.deepEqual(r.sellout.filter((e) => e.dangerous).map((e) => e.id), []);

/* Objets Sellout catalogués mais non achetables (garde EFFET_BOUTIQUE_AP_INACTIF) : liste figée. */
const NON_ACHETABLES = [
  "instaTrainingCap", "customEnergyMagicButtons", "moreCustomEnergyMagicButtons", "customIdleEnergyMagicButtons",
  "lazyItopodFloorShifter", "questReminder", "nguCapModifier", "daycareKittyArt", "customResource3Button",
  "anotherCustomResource3Button", "customIdleResource3Button", "resource3NameRandomizer", "adventureLight",
  "adventureAdvancer"
].sort();
const nonAchetables = r.sellout.filter((e) => !e.buyable).map((e) => e.id).sort();
assert.deepEqual(nonAchetables, NON_ACHETABLES,
  "un objet Sellout non achetable de plus : l'ajouter à la liste avec sa raison, ou le brancher");

console.log("idle-catalog-effects-read ok");
