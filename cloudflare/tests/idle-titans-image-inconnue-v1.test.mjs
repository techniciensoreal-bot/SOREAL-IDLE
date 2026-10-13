import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : dans le menu Titans, l'image d'un titan est remplacée par un « ? » tant qu'on n'a pas effectué un premier combat contre lui (aucune image n'est alors demandée au serveur). */
const titans = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
const ecran = readFileSync("cloudflare/public/modules/titans-combat-ecran-v1.js", "utf8");
assert.ok(titans.includes("function titanVu(t){") && titans.includes("ent(t.state&&t.state.kills)>0") && titans.includes("localStorage.getItem(cleVu(t.id))==='1'"), "vu = déjà vaincu ou combat déjà lancé");
assert.ok(titans.includes('class="ttn-portrait ttn-inconnu"') && titans.includes('<span class="ttn-point">?</span>'), "carte : un « ? » à la place de l'image");
assert.ok(/titanVu\(t\)\s*\?'<div class="ttn-portrait"><img id="ttnImg_'/.test(titans), "l'image n'est écrite que pour un titan vu");
assert.ok(titans.includes("if(!titanVu(t))return '<span class=\"soreal-idle-titan-icone-v1\""), "l'icône du bouton Titans suit la même règle");
assert.ok(titans.includes("function lancerCombatTitan_(id){\n  var t=registre[id];\n  if(!t)return;\n  marquerVu(id);") || titans.replace(/\r\n/g, "\n").includes("function lancerCombatTitan_(id){\n  var t=registre[id];\n  if(!t)return;\n  marquerVu(id);"), "lancer un combat révèle le titan");
assert.ok(ecran.includes("marquerVu(f.titanId)"), "un combat en cours (même après rechargement) révèle le titan");
{ // règle pure
  const vu = (kills, flag) => kills > 0 || flag;
  assert.equal(vu(0, false), false, "jamais affronté : ?");
  assert.equal(vu(0, true), true, "combat lancé (même perdu) : image");
  assert.equal(vu(2, false), true, "déjà vaincu : image");
}
console.log("idle-titans-image-inconnue-v1: OK");
