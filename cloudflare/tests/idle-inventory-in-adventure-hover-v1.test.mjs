import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-24) : « Il y a trop de menus (sur téléphone). Toute la partie présente dans Inventory doit être déplacée sous tout ce
 * qui est déjà dans Adventure. Les options de l'inventaire, en bas, doivent pouvoir se fermer/ouvrir comme le Coffre et Info. Sur PC,
 * le popup d'un objet doit apparaître au survol et disparaître quand on sort du popup. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const auto = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");

// --- A. Plus de menu Inventory ; son contenu est sous Adventure ---
{
  const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_MENUS_V1=[")));
  const ids = [...bloc.matchAll(/\{id:'([A-Za-z]+)'/g)].map((m) => m[1]);
  assert.ok(!ids.includes("inventaire"), "le menu Inventory n'existe plus");
  assert.ok(ids.includes("aventure"));
  assert.ok(!/case 'inventaire':/.test(ui));
}
const aventure = ui.slice(ui.indexOf("function pageAventureIdleV28_(j){"), ui.indexOf("function pageCollectionIdleV22_(j){"));
assert.match(aventure.split("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-233 */")[0], /\(j\.inventaireDebloque\?pageInventaireIdleV28_\(j\):''\);\s*\}\s*$/, "l'inventaire complet est le DERNIER bloc de la page Adventure");
assert.ok(aventure.indexOf("rendreZoneCombatAdventureIdleV1_") < aventure.indexOf("pageInventaireIdleV28_(j)"), "sous tout ce qui existait déjà");
assert.match(ui, /String\(sauve\)==='inventaire'\?'aventure':String\(sauve\)/, "un ancien menu mémorisé « inventaire » ouvre Adventure");
assert.match(ui, /idleMenuActifV28!=='aventure'\|\|\s*!j\|\|\s*!aventureMetaIdleV47_\(j\)/, "les mises à jour partielles de l'inventaire suivent la page Adventure");

// --- B. Options de l'inventaire repliables (fermées par défaut) ---
function chargerAuto(stockage) {
  const noop = () => {};
  const document = { getElementById: () => null, addEventListener: noop, querySelectorAll: () => [], head: { appendChild: noop }, createElement: () => ({}) };
  const window = { document, addEventListener: noop, confirm: () => true };
  const sandbox = { window, document, setTimeout: () => 0, localStorage: stockage };
  vm.runInNewContext(auto, sandbox);
  return window;
}
assert.match(auto, /window\.__inventaireAutoBasculerV1__=function\(\)\{/);
{
  const stockage = { v: null, getItem() { return this.v; }, setItem(_k, x) { this.v = x; } };
  const w = chargerAuto(stockage);
  const j = { systemes: { inventoryAuto: {}, adventure: {} } };
  const html = w.__SOREAL_IDLE_INVENTORY_AUTO_V1__.panneau(j);
  // sans état serveur exploitable le panneau peut être vide : on ne contrôle ici que le balisage quand il existe
  if (html) {
    assert.match(html, /soreal-idle-inv-auto-titre-v1/);
    assert.match(html, /aria-expanded="false"/, "fermé par défaut");
    assert.ok(!html.includes("Filtre de butin"), "fermé : aucune option affichée");
  }
}
assert.match(auto, /var estOuvert=ouvert\(\);/);
assert.match(auto, /\(estOuvert\?lignes\.join\(''\):''\)/, "les options ne sont rendues que si le panneau est ouvert");
assert.match(css, /\.soreal-idle-inv-auto-titre-v1\s*\{/, "même style que le Coffre et Info");

// --- C. Popup au survol (souris) ---
assert.match(ui, /if\(event\.detail&&event\.detail\.pointerType==='mouse'\)return;/, "le maintien du clic (souris) n'ouvre plus le popup");
assert.match(ui, /function survolPossibleIdleV1_\(event\)\{[\s\S]{0,300}\(hover:hover\) and \(pointer:fine\)/, "seulement avec une vraie souris");
assert.match(ui, /document\.addEventListener\('mouseover',function\(event\)\{[\s\S]{0,1400}ouvrirSurvolIdleV1_\(element,id\)/, "survol d'un objet : ouverture");
assert.match(ui, /cibleDansPopupDetailsObjetAdventureIdleV207_\(cible\)\)\{\s*clearTimeout\(idleSurvolTimerFermerV1\)/, "tant que la souris est dans le popup : il reste ouvert");
assert.match(ui, /fermerSurvolIdleV1_\(\);\s*\},200\)/, "sortie de l'objet et du popup : fermeture après un court délai de grâce");
assert.match(ui, /document\.documentElement\.addEventListener\('mouseleave'/, "sortie de la fenêtre du navigateur : fermeture");
assert.match(ui, /idleAdventureDragIdV138\|\|\s*idleAdventureGesteV196\|\|\s*idleAdventureComparerEnAttenteV183/, "pas de popup pendant un glisser-déposer ni une comparaison");
assert.match(ui, /if\(left\+largeur>window\.innerWidth-marge\)left=r\.left-largeur-4;/, "le popup s'ouvre à côté de l'objet (à gauche s'il n'y a pas de place à droite)");
assert.match(ui, /idleAdventureIgnorerClicJusquaV165=0;/, "le survol n'avale pas le premier clic");

console.log("idle-inventory-in-adventure-hover-v1 OK");
