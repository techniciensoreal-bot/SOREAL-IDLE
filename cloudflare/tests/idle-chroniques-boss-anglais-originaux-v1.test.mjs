import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { traduireReponseV1 } from "../src/idle-traductions-v1.js";
/* Norman (2026-10-11) : en anglais, la chronique d'un boss est le texte ORIGINAL du wiki (jamais une traduction du français, jamais le texte édité par l'administrateur). */
const en = JSON.parse(readFileSync("design/ngu-boss-stories-en.json", "utf8"));
const original = (id) => en.find((h) => h.id === id).story;

// catalogue (Fight Boss / Collection) : le texte envoyé, même édité, est remplacé par l'original du wiki, par numéro
const r = traduireReponseV1({ bossCatalogue: [
  { numero: 5, histoire: "Texte français édité par l'administrateur", conseil: "" },
  { numero: 6, histoire: "Texte français d'origine", conseil: "" },
  { numero: 7, histoire: "", conseil: "" }
] }, "en");
assert.equal(r.bossCatalogue[0].histoire, original(5), "texte édité remplacé par l'original du wiki");
assert.equal(r.bossCatalogue[1].histoire, original(6), "texte traduit remplacé par l'original du wiki");
assert.equal(r.bossCatalogue[2].histoire, "", "anti-spoil : un boss sans texte envoyé n'en reçoit pas");
// boss sélectionné et liste de la Collection
const s = traduireReponseV1({ bossSelection: 4, bossHistoire: "Texte français", x: { numero: 6, type: "boss_principal", description: "Texte français" } }, "en");
assert.equal(s.bossHistoire, original(4));
assert.equal(s.x.description, original(6));
// boss sans histoire sur le wiki (272 à 289) : la réponse reste telle quelle
assert.equal(traduireReponseV1({ numero: 272, histoire: "Texte", conseil: "" }, "en").histoire, "Texte");
// un objet qui n'est pas un boss n'est pas touché
const autre = { numero: 5, histoire: "Texte", titre: "autre" };
assert.deepEqual(traduireReponseV1(autre, "en"), autre);
// en français : rien ne change
const fr = { numero: 5, histoire: "Texte français", conseil: "" };
assert.deepEqual(traduireReponseV1(fr, "fr"), fr);
// jamais d'objet partagé modifié
const orig = { numero: 5, histoire: "Texte français", conseil: "" };
traduireReponseV1(orig, "en");
assert.equal(orig.histoire, "Texte français");
assert.ok(en.length === 283 && !en.some((h) => h.id >= 272 && h.id <= 289), "283 histoires originales, aucune pour 272 à 289");
console.log("idle-chroniques-boss-anglais-originaux-v1: OK");
