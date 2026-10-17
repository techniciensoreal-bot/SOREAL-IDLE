import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-17) : « j'ai modifié les textes et voix du boss fée ; dans Chroniques de boss, il lit le texte avec une voix pourrie générée. Ce que je crée dans ce menu doit être appliqué immédiatement partout où on
 * peut lire ce texte. » Cause : la chronique du combat lisait le texte et le nom PARLÉS fixés par l'administrateur (bossHistoireParlee / bossNomParle), mais la collection, la fiche, la carte du boss et le lecteur de
 * chroniques lisaient le texte affiché : empreintes de voix inconnues, repli sur Piper. Maintenant les quatre portent le texte/nom parlés.
 */
const lire = (p) => readFileSync("cloudflare/" + p, "utf8");
const catalogue = lire("src/idle-runtime-catalogue.js"), collection = lire("src/idle-runtime-collection.js"), etat = lire("src/idle-runtime-etat.js");
const c2 = lire("public/modules/ui-combat-2-v1.js"), chro = lire("public/modules/ui-chroniques-v1.js"), lecteur = lire("public/modules/lecteur-chroniques-v1.js");

// Serveur : les entrées de collection et du catalogue portent ce que la voix DIT.
assert.ok(catalogue.includes("export function histoireBossParleeSorealIdle_(numero)") && catalogue.includes("export function nomBossParleSorealIdle_(numero)"), "aides serveur");
assert.ok(collection.includes("histoireParlee: decouvert ? histoireBossParleeSorealIdle_(index + 1) : ''") && collection.includes("nomParle: decouvert ? nomBossParleSorealIdle_(index + 1) : ''"), "collection : seulement pour un boss découvert (anti-spoil)");
assert.ok(etat.includes("histoireParlee: histoireBossParleeSorealIdle_(index + 1)") && etat.includes("nomParle: nomBossParleSorealIdle_(index + 1)"), "catalogue des boss");

// Client : un seul assembleur d'attributs de lecture, utilisé partout.
assert.ok(c2.includes("function attrLectureBossIdleV1_(nom,histoire,nomParle,histoireParlee){") && c2.includes("attrLectureBossIdleV1_:attrLectureBossIdleV1_"), "aide client exportée");
assert.ok(c2.includes("attrLectureBossIdleV1_(b.nom,b.histoire,b.nomParle,b.histoireParlee)"), "carte du boss");
assert.ok(c2.includes("attrLectureBossIdleV1_(e.nom,e.description,e.nomParle,e.histoireParlee)"), "fiche du boss");
assert.ok(chro.includes("attrLectureBossIdleV1_(e.nom,e.description,e.nomParle,e.histoireParlee)"), "collection (Chroniques)");
assert.ok(c2.includes("composerChronique(String(b.nomParle||'').trim()||String(b.nom||'Boss'),String(b.histoireParlee||'').trim()||String(b.histoire||''))"), "lecture de toutes les chroniques d'affilée");
assert.ok(lecteur.includes("e.nomParle") && lecteur.includes("histoireParlee:String(x.histoireParlee||'')"), "lecteur de chroniques");

// Comportement de l'aide (le vrai code, sur un faux module de voix).
const debut = c2.indexOf("      function attrLectureBossIdleV1_(");
const fin = c2.indexOf("      let idleBossCarteNumeroV91=0;");
const code = c2.slice(debut, fin);
const monde = (tts) => {
  const ctx = { window: { __SOREAL_IDLE_TUTORIAL_TTS_V209__: tts }, idleHtml_: (x) => String(x).replace(/"/g, "&quot;"), attrHistoireVoixIdleV1_: (h) => (/\(\w+\)/.test(h) ? ' data-soreal-tts-histoire="' + h + '"' : "") };
  vm.createContext(ctx);
  vm.runInContext(code + "\nthis.f=attrLectureBossIdleV1_;", ctx);
  return ctx.f;
};
const tts = { composerChronique: (nom, texte) => nom + ". " + texte };
const f = monde(tts);
assert.equal(f("Fée", "Texte affiché", "Fée Clochette", "(femme) Texte dit"), ' data-soreal-tts-say="Fée Clochette. (femme) Texte dit"', "texte ET nom parlés : la voix lit ceux-là (mêmes fichiers générés que dans le combat)");
assert.equal(f("Fée", "Texte affiché", "", "(femme) Texte dit"), ' data-soreal-tts-say="Fée. (femme) Texte dit"', "texte parlé seul : le nom affiché reste lu");
assert.equal(f("Fée", "Texte affiché", "Fée Clochette", ""), ' data-soreal-tts-say="Fée Clochette. Texte affiché"', "nom parlé seul");
assert.equal(f("Fée", "Texte (marius) avec balise", "", ""), ' data-soreal-tts-histoire="Texte (marius) avec balise"', "rien de parlé : comportement d'avant (balises du récit)");
assert.equal(f("Fée", "Texte simple", "", ""), "", "rien de parlé, pas de balise : lecture du texte affiché");
const sansVoix = monde(null);
assert.equal(sansVoix("Fée", "Texte", "X", "Y"), "", "module de voix absent : on retombe sans erreur");
console.log("idle-chroniques-voix-parlee-partout-v1: OK");
