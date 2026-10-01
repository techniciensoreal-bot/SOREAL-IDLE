import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normaliserHistoireV1 } from "../src/idle-histoires-v1.js";

/*
 * Voix nommées (Norman, 2026-10-01 : « plusieurs voix différentes parmi un large éventail ») : registre, balises dans les textes, choix par étape,
 * studio de voix qui lit voix/<identifiant>.wav.
 */
const registreSrc = readFileSync("cloudflare/public/modules/voix-nommees-v1.js", "utf8");
const moteurSrc = readFileSync("cloudflare/public/modules/story-engine-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

const window_ = {};
vm.runInNewContext(registreSrc, { window: window_ });
const reg = window_.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
assert.equal(reg.liste.length, 11, "les 11 voix choisies à l'écoute");
assert.ok(reg.liste.every((v) => /^[a-z0-9-]{1,32}$/.test(v.id) && v.nom && ["homme", "femme"].includes(v.genre)));
assert.equal(new Set(reg.liste.map((v) => v.id)).size, reg.liste.length, "identifiants uniques");
assert.ok(!reg.liste.some((v) => v.id === "homme" || v.id === "femme" || v.id === "narrateur"), "pas de collision avec les voix de base");
assert.equal(reg.genre("vieille"), "femme");
assert.equal(reg.genre("marseille"), "homme");
assert.equal(reg.genre("inconnu"), "homme");
assert.equal(reg.existe("asmr"), true);

// Le registre est chargé avant le moteur d'histoires et l'éditeur.
const pos = (nom) => index.indexOf("/modules/" + nom);
assert.ok(pos("voix-nommees-v1.js") > 0 && pos("voix-nommees-v1.js") < pos("story-engine-v1.js"), "registre avant le moteur");
assert.ok(pos("voix-nommees-v1.js") < pos("admin-histoires-v1.js"), "registre avant l'éditeur");

// Le moteur coupe le texte aux balises des voix nommées, sans les afficher ; une parenthèse inconnue reste du texte.
const moteurWindow = { __SOREAL_IDLE_VOIX_NOMMEES_V1__: reg, document: { createElement() { return { style: {}, classList: { add() {}, remove() {} }, appendChild() {}, addEventListener() {} }; }, body: { appendChild() {} }, head: { appendChild() {} }, getElementById: () => null, addEventListener() {} }, addEventListener() {} };
vm.runInNewContext(moteurSrc, { window: moteurWindow, document: moteurWindow.document, setTimeout, clearTimeout, setInterval, clearInterval, Image: function () {}, console });
const segmenter = moteurWindow.__SOREAL_IDLE_STORY_ENGINE_V1__.segmenter;
{
  const r = segmenter("Le sorcier : (vieille) Approche, petit. (marseille) Té, fada ! (homme) Il rit. (voir note) Fin.", "narrateur");
  assert.equal(JSON.stringify(r.segments.map((s) => [s.voix, s.texte])), JSON.stringify([
    ["homme", "Le sorcier :"], ["vieille", "Approche, petit."], ["marseille", "Té, fada !"], ["homme", "Il rit. (voir note) Fin."]
  ]));
  assert.equal(r.affiche, "Le sorcier : Approche, petit. Té, fada ! Il rit. (voir note) Fin.", "balises jamais affichées, autre parenthèse conservée");
  assert.equal(segmenter("Salut.", "cool").segments[0].voix, "cool", "voix nommée par défaut de l'étape");
  assert.equal(segmenter("Salut.", "narrateur").segments[0].voix, "homme");
  assert.equal(segmenter("Salut.", "femme").segments[0].voix, "femme");
  assert.equal(segmenter("Salut.", "pas-une-voix").segments[0].voix, "homme");
  assert.equal(segmenter("(VIEILLE) Majuscules.", "narrateur").segments[0].voix, "vieille", "balises insensibles à la casse");
}

// Le serveur garde l'identifiant d'une voix nommée par étape, et ramène tout le reste au narrateur.
{
  const h = normaliserHistoireV1({ id: "voix-essai", titre: "Essai", etapes: [
    { texte: "a", parleur: "marseille" }, { texte: "b", parleur: "femme" }, { texte: "c", parleur: "narrateur" },
    { texte: "d", parleur: "Pas valide !" }, { texte: "e" }, { texte: "f", parleur: "x".repeat(40) }
  ] });
  assert.deepEqual(h.etapes.map((e) => e.parleur), ["marseille", "femme", "narrateur", "narrateur", "narrateur", "narrateur"]);
}

// Studio de voix : une voix nommée = voix/<identifiant>.wav, identifiants contrôlés, repli sur « homme ».
const studio = readFileSync("cloudflare/tools/voice-studio/serveur.py", "utf8");
assert.match(studio, /def voix_disponibles\(\)/);
assert.match(studio, /"voixNommees": voix_disponibles\(\)/);
assert.match(studio, /os\.path\.join\(DOSSIER_VOIX, nom \+ "\.wav"\)/);
assert.match(studio, /voix = donnees\.get\("voix"\) if isinstance\(donnees\.get\("voix"\), str\) and VOIX_ID_RE\.match\(donnees\.get\("voix"\)\) else "homme"/);
const installeur = readFileSync("cloudflare/tools/voice-studio/installer_voix_nommees.py", "utf8");
for (const v of reg.liste) assert.ok(installeur.includes('"' + v.id + '"'), "l'installeur copie l'extrait de " + v.id);

console.log("idle-voix-nommees-v1: OK");
