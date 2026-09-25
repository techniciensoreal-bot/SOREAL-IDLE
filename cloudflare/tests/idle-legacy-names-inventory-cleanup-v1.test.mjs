import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BASIC_TRAINING_V411 } from "../src/idle-basic-training.js";

/*
 * Norman (2026-09-24) : « il y a encore des noms de l'ancien SOREAL IDLE : dans Basic Training, je vois un niveau Contre-palette. Corrige avec
 * les vrais noms tout ce qui pourrait rester, traduis en français. » ; « il y a une fenêtre inutile dans Inventaire (bandeau + cadres Sac,
 * Cube, Sets) : supprime pour gagner de la place » ; « fusionne les messages informatifs Aventure / Inventaire ».
 * Vrais noms : wiki NGU, page « Basic Training » (Idle Attack, Regular Attack, Strong Attack, Parry, Piercing Attack, Ultimate Attack /
 * Block, Defensive Buff, Heal, Offensive Buff, Charge, Ultimate Buff).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// --- Basic Training : les 12 entraînements, vrais noms en français, ids (sauvegardes) inchangés ---
const noms = Object.fromEntries(BASIC_TRAINING_V411.skills.map((s) => [s.id, s.name]));
assert.deepEqual(noms, {
  attaque_passive: "Attaque passive",           // Idle Attack
  attaque_reguliere: "Attaque régulière",       // Regular Attack
  attaque_renforcee: "Attaque puissante",       // Strong Attack
  contre_palette: "Parade",                     // Parry
  percee_quai: "Attaque perçante",              // Piercing Attack
  ultime_soreal: "Attaque ultime",              // Ultimate Attack
  blocage: "Blocage",                           // Block
  defense_renforcee: "Bonus défensif",          // Defensive Buff
  recuperation: "Soin",                         // Heal
  boost_offensif: "Bonus offensif",             // Offensive Buff
  charge_logistique: "Charge",                  // Charge
  ultime_logistique: "Bonus ultime"             // Ultimate Buff
});
for (const nom of Object.values(noms)) assert.ok(!/palette|quai|logisti|soreal/i.test(nom), "aucun nom de l'ancien SOREAL : " + nom);
assert.match(ui, /\{id:'ultimateBuff',label:'Bonus ultime'/, "compétence d'Aventure en français");

// --- Textes de l'ancien SOREAL retirés (Essence, pièces, forge, magasin de magie, maîtrises/procédures) ---
for (const mort of ["Essence SOREAL", "Renaissances & Essence", "Pièces & boutique", "Forge & matériaux", "Soin de fortune", "Mana & Magie débloqués", "Améliorations débloquées", "Maîtrises", "Procédures", "artefacts…"]) {
  assert.ok(!ui.includes(mort) && !meta.includes(mort), "texte de l'ancien SOREAL encore présent : " + mort);
}
assert.match(ui, /ton NOMBRE grandit : il multiplie ton Attaque et ta Défense/, "Renaissance : le vrai mécanisme (NOMBRE)");
assert.match(meta, /Avantages permanents achetés avec des Points de Perk \(PP\)/);
assert.match(meta, /Particularités permanentes achetées avec des Points de Quirk \(QP\)/);

// --- Inventory : plus de bandeau ni de cadres Sac / Cube / Sets ; le sac reste dans son titre ---
const inventaire = ui.slice(ui.indexOf("function pageInventaireIdleV28_(j){"), ui.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-281 */"));
assert.ok(!inventaire.includes("Glisse un objet pour l’équiper"), "bandeau « Inventory » retiré");
assert.ok(!inventaire.includes("soreal-idle-summary-grid-v28") && !inventaire.includes("summary-v28"), "cadres Sac / Cube / Sets retirés");
assert.match(inventaire, /return ''\+\s*'<div class="soreal-idle-v151-inventory-columns">'/);
assert.match(inventaire, /🎒 Sac \('\+utilise\+' \/ '\+capacite\+'\)/, "le sac garde son compteur dans son titre");
const resume = ui.slice(ui.indexOf("function patchResumeInventaireIdleV160_(modele){"), ui.indexOf("function cleSlotEquipementInventaireIdleV160_"));
assert.ok(!resume.includes("summary-grid"), "la mise à jour partielle ne dépend plus des cadres supprimés");
assert.match(resume, /titreSac\.textContent='🎒 Sac \('\+modele\.utilise\+' \/ '\+modele\.capacite\+'\)'/, "et met toujours à jour le compteur du sac");

// --- Messages informatifs Aventure / Inventaire fusionnés : l'inventaire est dans la page Aventure ---
assert.match(ui, /que tu peux équiper dans ton INVENTAIRE, juste en dessous dans cette même page Aventure !/);
assert.ok(!ui.includes("tout nouveau menu INVENTAIRE"), "plus de « nouveau menu INVENTAIRE »");
assert.ok(!ui.includes("Adventure et Inventory."), "plus de menu Inventory annoncé comme déblocage séparé");

console.log("idle-legacy-names-inventory-cleanup-v1 OK");
