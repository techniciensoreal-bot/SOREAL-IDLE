import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
import { IDLE_PERKS_CATALOG_V1 } from "../src/idle-perks-v1.js";
import { IDLE_QUIRKS_CATALOG_V1 } from "../src/idle-quirks-v1.js";
import { IDLE_WISHES_CATALOG_V1 } from "../src/idle-wishes-v1.js";
import { IDLE_NGU_TRACKS } from "../src/idle-ngu-progression.js";
import { IDLE_NGU_CATALOG_V1 } from "../src/idle-ngu-catalog-v1.js";
import { IDLE_MACGUFFIN_TYPES_V1 } from "../src/idle-macguffins-v1.js";
import { traduireReponseV1 } from "../src/idle-traductions-v1.js";

/*
 * Audit de traduction (Norman, 2026-10-10) :
 *  1. « Il y a encore écrit des "Number" dans certaines descriptions » -> en français, plus aucun « Number » / « NUMBER » affiché (Nombre / NOMBRE), sauf les NOMS PROPRES du jeu d'origine
 *     (« A Number », « The Number 7 », « Number Set », sort « Blood NUMBER Boost »), et aucun mot anglais de description (the, of, your, each, level…) dans les atouts, manies et souhaits.
 *  2. « La version anglaise ne contient aucun mot de français, sauf si c'est dans le jeu de base » -> aucune valeur du dictionnaire anglais ne contient de français
 *     (hors noms propres SOREAL : Sébastien, le nom de la langue « Français »…).
 * Ce que le joueur voit en français = table du serveur (design/traductions/fr, remplacement de chaîne entière) PUIS couche d'interface (modules/traduction-interface-v1.js).
 */
const R = "cloudflare/public/modules/";

// ---------- 2. Dictionnaire anglais : aucune valeur ne contient de français ----------
const dico = JSON.parse(readFileSync(R + "traduction-anglais-dict-v1.json", "utf8"));
const NOMS_PROPRES = /Sébastien|Français|Léa|Soréalle|Faïte|Mickaël/g;
const ACCENTS = /[àâäçéèêëîïôöùûüœæ]/i;
// Mots-outils français qui n'existent pas en anglais (les homographes bénins comme « plus », « sort », « pour », « boss », « combat », « minutes » sont écartés).
const MOTS_FRANCAIS = /(?<![\p{L}\p{N}'’-])(le|la|les|des|du|un|une|et|ou|avec|dans|sur|ton|ta|tes|ce|cette|ces|est|sont|tu|vous|qui|que|qu|au|aux|par|chaque|niveau|niveaux|ne|pas|sans|tout|tous|toute|toutes|mais|donc|puis|aussi|comme|quand|si|déjà|encore|très|ici|où|deux|trois|fois|pour|aucun|aucune|votre|vos|nous|notre|nos|mon|mes|ma|il|elle|ils|elles|leur|leurs)(?![\p{L}\p{N}'’-])/giu;
const suspects = [];
for (const [fr, en] of Object.entries(dico)) {
  // « EST. POWER » = « estimated power » (abréviation anglaise, pas le verbe français « est »).
  const v = en.replace(NOMS_PROPRES, "").replace(/\bEST\./g, "");
  // Les guillemets français « » et les noms de fichiers/chemins ne sont pas du texte français : on ne regarde que accents et mots-outils.
  const bruit = v.replace(/\b(pour|combat|boss|minutes?|plus|sort|sorts|pause|ton)\b/gi, (m) => (m.toLowerCase() === "pour" ? "pour" : ""));
  if (ACCENTS.test(v)) suspects.push(["accent", fr, en]);
  else {
    const m = bruit.match(MOTS_FRANCAIS);
    // « pour » est aussi un verbe anglais (to pour) : toléré seul.
    const vrais = (m || []).filter((x) => x.toLowerCase() !== "pour");
    if (vrais.length) suspects.push([vrais.join(","), fr, en]);
  }
}
assert.deepEqual(suspects.map((s) => s[0] + " | " + s[1].slice(0, 60) + " => " + s[2].slice(0, 80)), [], "valeurs anglaises contenant du français");

// Cas corrigés par l'audit : plus de « mise à day », plus de « décor », plus de « Chroniques » dans une valeur anglaise.
for (const en of Object.values(dico)) {
  assert.ok(!/\bà day\b/.test(en), "mise à day : " + en.slice(0, 60));
  assert.ok(!/\bChroniques\b/.test(en), "Chroniques en anglais : " + en.slice(0, 60));
}
assert.equal(dico["Voir les notes de mise à jour"], "See the release notes");
assert.equal(dico["NIVEAU"], "LEVEL");
assert.equal(dico["JOUER"], "PLAY");
assert.equal(dico["Chroniques"], "Chronicles");

// ---------- 1. Français : plus de « Number » affiché ----------
function tables() {
  const m = new Map();
  for (const f of readdirSync("design/traductions/fr")) {
    for (const [en, fr] of Object.entries(JSON.parse(readFileSync("design/traductions/fr/" + f, "utf8")))) if (typeof fr === "string" && fr && fr !== en) m.set(en, fr);
  }
  return m;
}
const TABLE = tables();
function chargerInterface() {
  const win = {};
  const ctx = { window: win, document: { readyState: "complete", addEventListener() {}, getElementById() { return null; }, body: {} }, localStorage: { getItem: () => "fr" }, MutationObserver: function () { this.observe = () => {}; }, requestAnimationFrame() {} };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(R + "traduction-interface-v1.js", "utf8"), ctx);
  return ctx.window.__SOREAL_IDLE_TRADUCTION_TEXTE_V1__;
}
const ui = chargerInterface();
const affiche = (s) => ui(TABLE.get(s) ?? s);

// Cas de base : NUMBER / Number sont traduits, les noms propres du jeu d'origine sont intacts.
assert.equal(affiche("NUMBER"), "NOMBRE");
assert.equal(affiche("Number"), "Nombre");
assert.equal(affiche("Multiplies Number"), "Multiplie le Nombre");
assert.equal(ui("Rebirth réussi · NUMBER"), "Renaissance réussie · NOMBRE");
assert.equal(ui("NUMBER au Rebirth"), "NOMBRE à la Renaissance");
assert.equal(ui("🔢 Number"), "🔢 Nombre");
assert.equal(ui("Number Hack"), "Piratage du Nombre");
assert.equal(ui("A Number"), "A Number", "nom d'objet du jeu d'origine : intact");
assert.equal(ui("The Number 7"), "The Number 7");
assert.equal(ui("Number Set"), "Number Set");
assert.equal(ui("Blood NUMBER Boost"), "Blood NUMBER Boost", "nom de sort : intact");
assert.equal(ui("Chaque Blood ajoute 1 au multiplicateur du NUMBER (le « Blood magic bonus » du Rebirth)."), "Chaque Blood ajoute 1 au multiplicateur du NOMBRE (le « Blood magic bonus » de la Renaissance).");
// Noms propres qui étaient devenus mi-anglais mi-français.
assert.equal(ui("Reverse Beard"), "Reverse Beard");
assert.equal(ui("Beard Cage"), "Beard Cage");
assert.equal(ui("Fruit of Angry Mayo"), "Fruit of Angry Mayo");
assert.equal(ui("Fruit of Power α"), "Fruit de Puissance α");
assert.equal(ui("Fruit of Numbers Auto-Activate"), "Activation auto : Fruit des Nombres");
assert.equal(ui("No Time Machine Challenge"), "Défi sans Machine temporelle");
assert.equal(ui("Attack/Defense Hack"), "Piratage Attaque/Défense");
assert.equal(ui("Adventure Stats"), "Stats d’Aventure");
assert.equal(ui("Cap Magic total requis"), "Plafond Magie total requis");
assert.equal(ui("Chercher un perk…"), "Chercher un atout…");

// Descriptions : après la table du serveur et la couche d'interface, plus aucun « number » (hors noms propres) ni mot d'anglais courant dans les atouts, manies et souhaits.
const ANGLAIS = /(?<![\p{L}\p{N}'’_-])(the|of|to|your|you|by|and|for|with|each|is|are|will|when|more|this|that|from|its|if|can|has|have|number|numbers|level|levels|per|reduces|increases|multiplies|hack|perk|perks|wish|quirk|quirks)(?![\p{L}\p{N}'’_-])/giu;
const sansNomsPropres = (s) => s.replace(/A Number|The Number 7|Number Set|Blood NUMBER Boost/g, "");
function verifier(nom, liste) {
  const fautes = [];
  for (const e of liste) {
    for (const champ of ["name", "effect"]) {
      const texte = e[champ];
      if (typeof texte !== "string") continue;
      const d = sansNomsPropres(affiche(texte));
      const m = d.match(ANGLAIS);
      if (m) fautes.push(nom + " #" + e.id + "." + champ + " : " + [...new Set(m)].join(",") + " | " + d.slice(0, 80));
    }
  }
  assert.deepEqual(fautes, [], nom + " : anglais restant à l'affichage français");
}
verifier("atouts", IDLE_PERKS_CATALOG_V1);
verifier("manies", IDLE_QUIRKS_CATALOG_V1);
verifier("souhaits", IDLE_WISHES_CATALOG_V1);
verifier("NGU", IDLE_NGU_CATALOG_V1);
// Et surtout : aucun « Number » (casse indifférente) n'est affiché pour ces catalogues.
for (const [nom, liste] of [["atouts", IDLE_PERKS_CATALOG_V1], ["manies", IDLE_QUIRKS_CATALOG_V1], ["souhaits", IDLE_WISHES_CATALOG_V1], ["NGU", IDLE_NGU_CATALOG_V1]]) {
  for (const e of liste) for (const champ of ["name", "effect"]) {
    if (typeof e[champ] === "string") assert.ok(!/\bnumbers?\b/i.test(sansNomsPropres(affiche(e[champ]))), nom + " #" + e.id + "." + champ + " affiche encore « Number » : " + affiche(e[champ]));
  }
}

// Pistes NGU (barbes, piratages, souhaits) : noms, effets -> aucun « Number » / « NUMBER » affiché.
// Seuls les champs AFFICHÉS comptent (jamais un identifiant interne comme id: "number").
const CHAMPS_PISTES = new Set(["name", "effect", "label", "desc", "description", "title", "texte"]);
const CHAMPS_MACGUFFIN = new Set(["name", "nom", "effet", "label", "desc", "description", "title", "texte"]); // « effect » y est un identifiant interne
function marcher(v, acc, champs, champ) {
  if (typeof v === "string") { if (champ && champs.has(champ)) acc.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => marcher(x, acc, champs, champ));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) marcher(x, acc, champs, k);
  return acc;
}
for (const s of marcher(IDLE_NGU_TRACKS, [], CHAMPS_PISTES)) {
  assert.ok(!/\bnumbers?\b/i.test(sansNomsPropres(affiche(s))), "piste NGU : « Number » affiché : " + s.slice(0, 60) + " -> " + affiche(s).slice(0, 60));
}
for (const t of IDLE_MACGUFFIN_TYPES_V1) {
  for (const s of marcher(t, [], CHAMPS_MACGUFFIN)) assert.ok(!/\bnumbers?\b/i.test(sansNomsPropres(affiche(s))), "MacGuffin : « Number » affiché : " + s);
}
// Les textes de saisie (placeholder) et les infobulles se traduisent dans les deux langues, y compris sur un champ <input> et quand l'attribut est réécrit après coup.
const srcInterface = readFileSync(R + "traduction-interface-v1.js", "utf8");
assert.ok(srcInterface.includes("'placeholder'") && srcInterface.includes("attributeFilter:ATTRIBUTS"), "français : placeholder, aria-label et attributs réécrits");
const srcAnglais = readFileSync(R + "traduction-anglais-v1.js", "utf8");
assert.ok(srcAnglais.includes("exclAttr_") && srcAnglais.includes("traduireAttributs_(racine)"), "anglais : le placeholder d'un champ de saisie est traduit (sa valeur jamais)");
// La traduction côté serveur ne change que le texte affiché : jamais un identifiant ni une valeur.
const brut = { id: "number", effect: "NUMBER", n: 5 };
const traduit = traduireReponseV1(brut, "fr");
assert.equal(traduit.id, "number", "identifiant intact");
assert.equal(traduit.n, 5, "valeur intacte");
console.log("idle-audit-traduction-v1: OK");
