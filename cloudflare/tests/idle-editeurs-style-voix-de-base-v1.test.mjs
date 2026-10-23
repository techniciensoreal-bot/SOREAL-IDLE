import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normaliserHistoireV1 } from "../src/idle-histoires-v1.js";

/* Norman (2026-10-23) : l'éditeur de guides et celui d'histoires ressemblent à l'éditeur de voix de base : toujours le texte en jaune tel que le joueur le lit, et dessous les personnages (texte dit, prononciation) avec génération d'une voix précise. */
const lire = (p) => readFileSync(new URL("../public/modules/" + p, import.meta.url), "utf8");

// Serveur : le texte affiché d'une étape d'histoire est gardé seulement s'il existe.
{
  const avec = normaliserHistoireV1({ id: "h1", titre: "T", etapes: [{ texte: "(femme) Salut", affiche: "  Salut toi  " }] });
  assert.equal(avec.etapes[0].affiche, "Salut toi");
  const sans = normaliserHistoireV1({ id: "h2", titre: "T", etapes: [{ texte: "Salut" }] });
  assert.ok(!("affiche" in sans.etapes[0]), "pas de champ vide enregistré");
}

// Lecteur d'histoires : le cadre jaune l'emporte sur le texte dit sans balises.
const moteur = lire("story-engine-v1.js");
assert.ok(moteur.includes("String(etapes[i].affiche||'').trim()||decoupe.affiche"));

// Éditeur d'histoires : cadre jaune, personnages dessous, cases à cocher, génération de la sélection.
const adm = lire("admin-histoires-v1.js");
assert.ok(adm.includes("data-adm-affiche") && adm.includes("Texte tel que les joueurs le lisent") && adm.includes("adm-or-v1"), "cadre jaune");
assert.ok(adm.includes("data-adm-sel") && adm.includes("function genererSelection_()") && adm.includes("act==='voix-sel'"), "sélection d'un personnage");
assert.ok(adm.includes("ta.value===ta.getAttribute('data-adm-aff-init')"), "un cadre jaune intact n'enregistre rien");

// Éditeur de guides : même cadre jaune, bouton « Texte et voix » (éditeur de base), retour du texte au guide.
const tuto = lire("admin-tutoriel-v1.js");
assert.ok(tuto.includes("data-ae=\"voix\"") && tuto.includes("Texte tel que le joueur le lit") && tuto.includes("majTexteEtape:majTexteEtape_"), "guide : cadre jaune et bouton");
const moteurTuto = lire("tutoriel-v1.js");
assert.ok(moteurTuto.includes("champsDepuisSource:true") && moteurTuto.includes("apresEnregistrer:function(o)"), "guide : le texte affiché vient du guide");
const txt = lire("textes-admin-v1.js");
assert.ok(txt.includes("!def.champsDepuisSource") && txt.includes("edition.def.apresEnregistrer({champs:charge_(valeurs).champs})"), "éditeur de base : texte affiché lié à sa source");
console.log("idle-editeurs-style-voix-de-base-v1: OK");
