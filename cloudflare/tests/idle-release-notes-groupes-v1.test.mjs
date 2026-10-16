import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/* Norman (2026-10-11) : notes de mise à jour regroupées par menu ; un groupe n'est montré que si le joueur possède déjà le menu (règle n°2) ; le groupe « Général » est toujours visible. */
const ui = lireUiComplet();
const i = ui.indexOf("function menusPossedesNotesMajIdleV1_(){");
const j = ui.indexOf("function htmlNotesMajIdleV1_(){");
assert.ok(i > 0 && j > i, "rendu groupé présent");
const code = ui.slice(i, j);
const idleHtml_ = (t) => String(t);
const fabrique = (ids, titans = false) => {
  const doc = { querySelectorAll: () => ids.map((id) => ({ getAttribute: () => id })) };
  const win = { __SOREAL_IDLE_META_HOST_V130__: { aventureMetaIdleV47_: () => ({ titans: titans ? [{ id: "t1", progressionUnlocked: true }] : [] }) } };
  return vm.runInNewContext("(function(document,idleHtml_,window,idleEtat){" + code + "return {possedes:menusPossedesNotesMajIdleV1_,rendu:htmlVersionNotesMajIdleV1_};})", {})(doc, idleHtml_, win, {});
};
const v = { groupes: [{ menu: "general", titre: "Général", points: ["A"] }, { menu: "tower", titre: "ITOPOD", points: ["B"] }, { menu: "wandoos", titre: "Wandoos", points: ["C"] }] };
{
  const f = fabrique(["entrainement"]);
  const html = f.rendu(v, f.possedes());
  assert.ok(html.includes("Général") && html.includes("<li>A</li>"), "Général toujours visible");
  assert.ok(!html.includes("ITOPOD") && !html.includes("Wandoos") && !html.includes("<li>B</li>"), "menus non possédés : ni titre ni ligne");
}
{
  const f = fabrique(["entrainement", "tower"]);
  const html = f.rendu(v, f.possedes());
  assert.ok(html.includes("ITOPOD") && html.includes("<li>B</li>") && !html.includes("Wandoos"), "seul le menu possédé apparaît");
}
// « Titans » n'est pas un menu de gauche : son groupe apparaît dès que les titans sont accessibles (jamais avant)
{
  const vt = { groupes: [{ menu: "general", titre: "Général", points: ["A"] }, { menu: "titans", titre: "Titans", points: ["T"] }] };
  const sans = fabrique(["entrainement"], false);
  assert.ok(!sans.rendu(vt, sans.possedes()).includes("Titans"), "titans inaccessibles : rien");
  const avec = fabrique(["entrainement"], true);
  const h = avec.rendu(vt, avec.possedes());
  assert.ok(h.includes("Titans") && h.includes("<li>T</li>"), "titans accessibles : groupe visible");
}
// ancien format
{
  const f = fabrique([]);
  assert.equal(f.rendu({ points: ["X", "Y"] }, f.possedes()), "<ul><li>X</li><li>Y</li></ul>");
}
console.log("idle-release-notes-groupes-v1: OK");
