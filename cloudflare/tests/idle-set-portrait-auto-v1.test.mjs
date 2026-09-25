import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureEquipItemV1 } from "../src/idle-adventure-v47.js";
import { equippedFullSetIdV1 } from "../src/idle-ngu-progression.js";
import { idlePortraitsSnapshotV1, idlePortraitForEquippedSetV1, IDLE_PORTRAITS_V1 } from "../src/idle-portraits-v1.js";

/*
 * Norman (2026-09-25) : « dès qu'on a les 4 pièces d'un set équipées, peu importe le niveau, l'image du joueur devient celle avec l'armure qui
 * correspond » (dossier R2 idle/player/) ; « quand il manque une image pour un objet, un emoji bien grand et centré dans sa case ».
 */
function equiper(definitions) {
  let s = createIdleAdventureStateV47();
  for (const [def, niveau] of definitions) {
    s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: def, level: niveau }, {}, Date.now()).state;
    const o = s.inventory.filter((x) => x.definitionId === def).at(-1);
    idleAdventureEquipItemV1(s, o.id, def.split(":")[1]);
  }
  return s;
}

// 4 pièces du même set, niveaux quelconques : le set est détecté
const complet = equiper([["training:head", 1], ["training:chest", 37], ["training:legs", 100], ["training:boots", 5]]);
assert.equal(equippedFullSetIdV1(complet), "training");
// 3 pièces seulement, ou un set mélangé : rien
assert.equal(equippedFullSetIdV1(equiper([["training:head", 1], ["training:chest", 1], ["training:legs", 1]])), "");
assert.equal(equippedFullSetIdV1(equiper([["training:head", 1], ["training:chest", 1], ["training:legs", 1], ["sewers:boots", 1]])), "");
assert.equal(equippedFullSetIdV1({}), "");
// Les BOTH Edgy Boots comptent pour le set Edgy
assert.equal(equippedFullSetIdV1(equiper([["edgy:head", 1], ["edgy:chest", 1], ["edgy:legs", 1], ["bothedgy:boots", 1]])), "edgy");

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
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("j.systemes.portraits.auto?j.systemes.portraits.auto.file:j.systemes.portraits.selectedFile"));
assert.ok(ui.includes("(repli?'&fallback='+encodeURIComponent(String(repli)):'')"));
const profil = readFileSync("cloudflare/public/modules/profile-v1.js", "utf8");
assert.ok(profil.includes("idle-portrait-thumb-v1") && profil.includes("ton héros en porte l’armure"));

// Emoji de repli : grand, centré, réglé selon le nombre de symboles
assert.ok(ui.includes("function emojiRepliObjetIdleV1_(emoji)") && ui.includes("idle-emoji-fallback-v1"));
assert.ok(!ui.includes("this.nextElementSibling.style.display=\'block\'\">'+\n            '<span style=\"display:none\">"), "plus d'emoji de repli minuscule et non centré");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const bloc = css.slice(css.indexOf(".idle-emoji-fallback-v1{"));
assert.ok(/width:64px;\s*height:64px;/.test(bloc) && bloc.includes("align-items:center") && bloc.includes("justify-content:center") && bloc.includes("font-size:46px"));
assert.ok(bloc.includes('data-n="2"') && bloc.includes('data-n="3"'));

console.log("idle-set-portrait-auto-v1 OK");
