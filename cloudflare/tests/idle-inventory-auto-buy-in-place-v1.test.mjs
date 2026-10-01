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

// --- ANTI-SPOIL (AGENTS.md règle n°2, 2026-10-01) : une amélioration non obtenue n'apparaît plus du tout (ni texte de condition, ni
// achat en place) : verrou() ne rend plus rien et plus aucun appel ne lui passe de texte ni de spec d'achat. Le helper
// acheterEnPlace() est conservé (testé ci-dessous) pour un futur rendu conditionné à la découverte de l'achat. ---
assert.match(src, /function verrou\(\)\{return '';\}/, "verrou() est neutralisé");
assert.ok(!/verrou\('/.test(src), "plus aucun texte de condition passé à verrou()");
assert.ok(!src.includes("🔒"), "aucun cadenas dans le panneau d'automatisation");

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

  assert.equal(verrou(), "", "verrou() ne rend plus rien (anti-spoil)");
}

console.log("idle-inventory-auto-buy-in-place-v1: OK");
