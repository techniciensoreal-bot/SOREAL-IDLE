import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Dans Automatisation de l'inventaire, je voudrais que les améliorations qu'on peut
 * acheter via un menu soit achetable également directement à l'endroit où on doit l'utiliser. Exemple le
 * filtre. »
 *
 * Portée : uniquement les améliorations vendues à un SEUL endroit sans ambiguïté (Boutique EXP ou Boutique AP) —
 * autoMerge (200 EXP), basicLootFilter (20 EXP, l'exemple de Norman), improvedLootFilter (100 000 AP). Les
 * améliorations à sources multiples (slots d'automerge, emplacements de configuration) ou obtenues par une
 * complétion de Challenge (jamais un achat) restent volontairement en texte seul : acheter au hasard la mauvaise
 * source parmi plusieurs, ou proposer un bouton "Acheter" pour un Challenge, serait faux.
 *
 * Les boutons réutilisent EXACTEMENT les mêmes appels globaux que les vraies pages Boutique EXP/Boutique AP
 * (window.__acheterExpShopIdleV1__, window.__actionMetaIdleV130__ + action sellShopBuy) : aucune nouvelle route
 * d'achat, jamais un doublon de la logique serveur.
 */
const src = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");

// --- La fonction d'achat en place réutilise les mêmes appels globaux que les vraies pages Boutique. ---
assert.ok(src.includes("window.__acheterExpShopIdleV1__(\\''+html(achat.item)+'\\',1)"), "EXP : même appel global que la page Boutique EXP (acheterExpShopIdleV1_)");
assert.ok(src.includes("window.__actionMetaIdleV130__({action:\\'sellShopBuy\\',itemId:\\''+html(achat.item)+'\\'})"), "AP : même appel global que la page Boutique AP (action sellShopBuy)");

// --- Les trois cas propres (une seule source, un coût fixe) ont bien un achat en place câblé. ---
assert.match(src, /verrou\('Achat « Auto Merge \(fusion automatique\) » dans la Boutique EXP \(menu Shop\)\.',\{type:'exp',item:'autoMerge',cout:200\}\)/);
assert.match(src, /verrou\('Achat « Filtre de butin basique » dans la Boutique EXP \(menu Shop\)\.',\{type:'exp',item:'basicLootFilter',cout:20\}\)/, "l'exemple de Norman : le filtre");
assert.match(src, /verrou\('Filtre objet par objet : « Filtre de butin amélioré » \(Boutique AP, menu Shop\)\.',\{type:'ap',item:'improvedLootFilter',cout:100000\}\)/);

// --- Les cas ambigus (plusieurs sources possibles) ou de Challenge (jamais un achat) restent SANS bouton. ---
for (const texteSansAchat of [
  "'1re complétion du No Equipment Challenge (menu Challenges).'",
  "'1re complétion du 100 Levels Challenge.'",
  "'Boutique EXP (« Slot d’automerge »), menu Perks, menu Quirks ou Boutique AP (« Emplacements de fusion d’inventaire »).'",
  "'Boutique EXP (« 2 emplacements de configuration », « Autre emplacement de configuration ») ou Boutique AP (« Emplacement de configuration »).'"
]) {
  const i = src.indexOf(texteSansAchat);
  assert.ok(i > 0, "texte introuvable : " + texteSansAchat);
  const appelVerrou = src.slice(src.lastIndexOf("verrou(", i), i + texteSansAchat.length + 1);
  assert.ok(!appelVerrou.includes(",{type:"), "ne doit jamais recevoir de spec d'achat (source ambiguë ou Challenge) : " + texteSansAchat);
}

// --- Comportement isolé de verrou()/acheterEnPlace() : bouton présent seulement avec un achat, jamais sans. ---
{
  const debut = src.indexOf("function acheterEnPlace(achat){");
  const fin = src.indexOf("  /*\n   * 2026-09-24", debut);
  assert.ok(debut > 0 && fin > debut, "bloc introuvable");
  const html = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const entier = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : 0; };
  // eslint-disable-next-line no-new-func
  const fabrique = new Function("html", "entier", src.slice(debut, fin) + "\nreturn {acheterEnPlace, verrou};");
  const { acheterEnPlace, verrou } = fabrique(html, entier);

  assert.equal(acheterEnPlace(null), "", "sans achat -> rien");
  assert.match(acheterEnPlace({ type: "exp", item: "basicLootFilter", cout: 20 }), /__acheterExpShopIdleV1__\('basicLootFilter',1\)/);
  assert.match(acheterEnPlace({ type: "exp", item: "basicLootFilter", cout: 20 }), /Acheter \(20 EXP\)<\/button>$/);
  assert.match(acheterEnPlace({ type: "ap", item: "improvedLootFilter", cout: 100000 }), /__actionMetaIdleV130__\(\{action:'sellShopBuy',itemId:'improvedLootFilter'\}\)/);
  assert.match(acheterEnPlace({ type: "ap", item: "improvedLootFilter", cout: 100000 }), /Acheter \(100k AP\)<\/button>$/, "grand nombre abrégé, comme ailleurs dans le jeu");

  assert.ok(!verrou("texte seul").includes("<button"), "verrou() sans second argument : jamais de bouton (comportement historique préservé)");
  assert.ok(verrou("texte", { type: "exp", item: "x", cout: 1 }).includes("<button"), "verrou() avec un achat : le bouton est bien inclus");
}

console.log("idle-inventory-auto-buy-in-place-v1: OK");
