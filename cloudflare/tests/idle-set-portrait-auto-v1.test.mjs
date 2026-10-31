import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureEquipItemV1, idleAdventureUnequipItemV1 } from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { idlePortraitsSnapshotV1, idlePortraitForEquippedSetV1, IDLE_PORTRAITS_V1 } from "../src/idle-portraits-v1.js";

/*
 * Norman (2026-09-25, complété 2026-09-27) : « dès qu'on a les pièces d'un set équipées, peu importe le
 * niveau, l'image du joueur devient celle avec l'armure qui correspond » (dossier R2 idle/player/) ; « il
 * ne faut pas qu'on perde nos images de portrait quand on retire une pièce d'armure, il faut avoir
 * remplacé entièrement le set porté pour que l'image change » ; un set complet inclut désormais l'arme
 * (tête/torse/jambes/bottes/arme), selon les slots réels de chaque set (SETS[id].slots).
 */
function equiper(s, definitions) {
  for (const [def, niveau] of definitions) {
    s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: def, level: niveau }, {}, Date.now()).state;
    const o = s.inventory.filter((x) => x.definitionId === def).at(-1);
    idleAdventureEquipItemV1(s, o.id, def.split(":")[1]);
  }
  return s;
}
function nouvelEtat(definitions) {
  return equiper(createIdleAdventureStateV47(), definitions);
}

// 5 pièces du même set (arme incluse), niveaux quelconques : le set est détecté
let complet = nouvelEtat([["training:head", 1], ["training:chest", 37], ["training:legs", 100], ["training:boots", 5], ["training:weapon", 1]]);
assert.equal(complet.autoPortraitSet, "training");
// 4 pièces seulement (arme manquante) : pas encore détecté, l'arme est désormais obligatoire
assert.equal(nouvelEtat([["training:head", 1], ["training:chest", 1], ["training:legs", 1], ["training:boots", 1]]).autoPortraitSet, "");
// Set mélangé, ou état neuf : rien
assert.equal(nouvelEtat([["training:head", 1], ["training:chest", 1], ["training:legs", 1], ["sewers:boots", 1], ["training:weapon", 1]]).autoPortraitSet, "");
assert.equal(createIdleAdventureStateV47().autoPortraitSet, "");

// Retirer une pièce ne fait plus perdre le portrait automatique : il reste mémorisé (Norman, 2026-09-27)
idleAdventureUnequipItemV1(complet, complet.equipment.head);
assert.equal(complet.equipment.head, "", "la pièce est bien retirée");
assert.equal(complet.autoPortraitSet, "training", "le portrait automatique reste mémorisé après le retrait d'une pièce");
idleAdventureUnequipItemV1(complet, complet.equipment.weapon);
assert.equal(complet.autoPortraitSet, "training", "toujours mémorisé même en ayant retiré l'arme");

// Équiper un set COMPLET différent remplace le portrait mémorisé
complet = equiper(complet, [["sewers:head", 1], ["sewers:chest", 1], ["sewers:legs", 1], ["sewers:boots", 1], ["sewers:weapon", 1]]);
assert.equal(complet.autoPortraitSet, "sewers", "un set complet différent remplace le portrait mémorisé");

// Slots réels par set (wiki, jamais une liste fixe inventée) : Edgy n'a pas de bottes, détecté sans elles
assert.equal(
  nouvelEtat([["edgy:head", 1], ["edgy:chest", 1], ["edgy:legs", 1], ["edgy:weapon", 1]]).autoPortraitSet,
  "edgy"
);
// Wanderer's n'a pas d'arme, détecté sans elle
assert.equal(
  nouvelEtat([["wanderer:head", 1], ["wanderer:chest", 1], ["wanderer:legs", 1], ["wanderer:boots", 1]]).autoPortraitSet,
  "wanderer"
);

// Le portrait automatique est celui du set (sans avoir complété le set) ; le choix manuel est conservé
{
  const snap = idlePortraitsSnapshotV1("default", { equippedSet: "training", completedSets: {} });
  assert.equal(snap.auto.id, "training");
  assert.equal(snap.auto.file, "PlayerAPportrait17");
  assert.equal(snap.selected, "default", "le choix manuel reste enregistré");
  assert.equal(snap.selectedFile, "PlayerAPportrait16");
  assert.equal(idlePortraitsSnapshotV1("default", {}).auto, null, "aucun set porté : pas de portrait automatique");
}
// Chaque set qui a un portrait a bien une entrée automatique ; forest prend le portrait principal (pas les bonus)
for (const p of IDLE_PORTRAITS_V1.filter((x) => x.unlock.type === "set")) {
  assert.ok(idlePortraitForEquippedSetV1(p.unlock.set), "set " + p.unlock.set);
}
assert.equal(idlePortraitForEquippedSetV1("forest").id, "forest");

// Média : repli sur le portrait choisi si l'image du set manque dans R2
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
assert.ok(media.includes('searchParams.get("fallback")') && media.includes("idlePortraitPickR2KeyV1(keys,repli)"));
// Client : portrait automatique en priorité, choix manuel en repli ; vignettes R2 dans le sélecteur
const ui = lireUiComplet();
assert.ok(ui.includes("j.systemes.portraits.auto&&!j.systemes.portraits.manuel?j.systemes.portraits.auto.file:j.systemes.portraits.selectedFile"), "le portrait du set ne s'applique que sans choix manuel");
assert.ok(ui.includes("(repli?'&fallback='+encodeURIComponent(String(repli)):'')"));
// (2026-10-31 : le sélecteur a quitté Chroniques pour la borne ; le texte du set équipé n'y cite plus le nom du set)
const borneJoueur = readFileSync("cloudflare/public/modules/borne-joueur-v1.js", "utf8");
assert.ok(borneJoueur.includes("/api/idle/media/player?portrait=") && !borneJoueur.includes("Tu portes l’armure d’un set équipé"));
assert.ok(!borneJoueur.includes("classList.toggle('off'"), "le sélecteur n'est plus jamais grisé");

// Choix manuel (Norman, 2026-10-31) : « changer de portrait même avec toutes les pièces équipées »
{
  const env = { equippedSet: "training", completedSets: { training: true, sewers: true } };
  const auto = idlePortraitsSnapshotV1("sewers", env, false, 0, false);
  assert.equal(auto.manuel, false);
  assert.equal(auto.auto.id, "training", "sans choix manuel : le portrait du set s'applique comme avant");
  const manuel = idlePortraitsSnapshotV1("sewers", env, false, 0, true);
  assert.equal(manuel.manuel, true);
  assert.equal(manuel.selected, "sewers", "choix manuel : le portrait de l'état est le portrait choisi");
  assert.equal(manuel.selectedFile, "PlayerAPportrait18");
  assert.ok(manuel.auto && manuel.auto.id === "training", "le champ auto reste renvoyé (additif)");
}
{
  const ctx = { bosses: 100, basicTrainingComplete: true };
  const act = (s, p) => applyIdleNguAction(s, p, ctx, 1000);
  const snap = (s) => idleNguSnapshot(s, ctx, 0).portraits;
  let s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.adventure.completedSets.training = true;
  s.adventure.completedSets.sewers = true;
  s.adventure.autoPortraitSet = "training";
  assert.equal(snap(s).manuel, false);
  assert.equal(snap(s).auto.id, "training", "set équipé sans choix : portrait du set");
  s = act(s, { action: "portrait", id: "sewers" }).state;
  assert.equal(s.records.portraitManuel, 1);
  assert.equal(snap(s).manuel, true);
  assert.equal(snap(s).selected, "sewers", "set équipé + choix manuel = portrait choisi");
  s = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 0);
  assert.equal(snap(s).manuel, true, "le choix manuel survit à la normalisation");
  s = act(s, { action: "portrait", id: "auto" }).state;
  assert.equal(s.records.portraitManuel, 0);
  assert.equal(snap(s).manuel, false, "« auto » : retour au portrait du set");
  assert.equal(snap(s).auto.id, "training");
  assert.throws(() => act(s, { action: "portrait", id: "forest" }), /PORTRAIT_VERROUILLE/, "portrait verrouillé refusé même avec un set équipé");
  assert.equal(s.records.portraitManuel, 0, "un refus ne pose pas de choix manuel");
  assert.ok(!JSON.stringify(snap(s).list).includes('"forest"'), "aucun portrait verrouillé dans la liste");
}

// Emoji de repli : grand, centré, réglé selon le nombre de symboles
assert.ok(ui.includes("function emojiRepliObjetIdleV1_(emoji)") && ui.includes("idle-emoji-fallback-v1"));
assert.ok(!ui.includes("this.nextElementSibling.style.display=\'block\'\">'+\n            '<span style=\"display:none\">"), "plus d'emoji de repli minuscule et non centré");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const bloc = css.slice(css.indexOf(".idle-emoji-fallback-v1{"));
assert.ok(/width:64px;\s*height:64px;/.test(bloc) && bloc.includes("align-items:center") && bloc.includes("justify-content:center") && bloc.includes("font-size:46px"));
assert.ok(bloc.includes('data-n="2"') && bloc.includes('data-n="3"'));

console.log("idle-set-portrait-auto-v1 OK");
