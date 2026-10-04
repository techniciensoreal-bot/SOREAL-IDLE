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
assert.ok(ui.includes("ancien==='inventaire'") && ui.includes("?'aventure'"), "un ancien menu mémorisé « inventaire » ouvre Adventure");
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
assert.match(auto, /\(estOuvert\?'<div class="soreal-idle-inv-auto-sections-v1">'\+lignes\.join\(''\)\+'<\/div>':''\)/, "les options ne sont rendues que si le panneau est ouvert");
assert.match(css, /\.soreal-idle-inv-auto-titre-v1\s*\{/, "même style que le Coffre et Info");

// --- C. Popup au survol (souris) ---
/*
 * Norman (2026-09-29) : « Il y a maintenant 2 fenêtre popup au survol d'un objet avec la souris.
 * Le popup instantané et celui qui met 1 secondes à s'ouvrir. Supprimer completement celui qui
 * met 1sec a s'ouvrir. » Choix retenu : un seul popup, le popup complet (boutons compris), ouvert
 * SANS délai au survol -- le délai d'1 s (et l'infobulle instantanée séparée qui faisait doublon
 * avec lui) sont entièrement retirés.
 */
assert.match(ui, /if\(event\.detail&&event\.detail\.pointerType==='mouse'\)return;/, "le maintien du clic (souris) n'ouvre plus le popup");
assert.match(ui, /function survolPossibleIdleV1_\(event\)\{[\s\S]{0,300}\(hover:hover\) and \(pointer:fine\)/, "seulement avec une vraie souris");
/* 2026-10-03 (Norman : « les popups s'ouvrent trop vite au passage de la souris : une demi-seconde ») : ouverture différée de 500 ms ; toujours UN seul popup (l'ancien se ferme dès qu'on change d'objet). */
assert.match(ui, /document\.addEventListener\('mouseover',function\(event\)\{[\s\S]{0,2200}ouvrirSurvolIdleV1_\(element,id\);[\s\S]{0,120}IDLE_SURVOL_DELAI_OUVERTURE_MS_V1\)/, "survol d'un objet : ouverture après 500 ms");
assert.ok(ui.includes('const IDLE_SURVOL_DELAI_OUVERTURE_MS_V1=1500;'), 'délai d une seconde et demie (2026-10-04)');
assert.ok(!ui.includes('IDLE_SURVOL_DELAI_MS_V1'), 'l ancien délai d 1 s (qui laissait deux popups) n existe plus');
assert.ok(!ui.includes('planifierSurvolIdleV1_'), 'pas de minuteur d ouverture par mouvement de souris');
assert.match(ui, /cibleDansPopupDetailsObjetAdventureIdleV207_\(cible\)\)\{\s*(annulerOuvertureSurvolIdleV1_\(\);\s*)?clearTimeout\(idleSurvolTimerFermerV1\)/, "tant que la souris est dans le popup : il reste ouvert (et aucune nouvelle ouverture en attente)");
assert.match(ui, /fermerSurvolIdleV1_\(\);\s*\},200\)/, "sortie de l'objet et du popup : fermeture après un court délai de grâce (jamais un délai d'ouverture)");
assert.match(ui, /document\.documentElement\.addEventListener\('mouseleave'/, "sortie de la fenêtre du navigateur : fermeture");
assert.match(ui, /idleAdventureDragIdV138\|\|\s*idleAdventureGesteV196\|\|\s*idleAdventureComparerEnAttenteV183/, "pas de popup pendant un glisser-déposer ni une comparaison");
assert.match(ui, /if\(left\+largeur>window\.innerWidth-marge\)left=r\.left-largeur-4;/, "le popup s'ouvre à côté de l'objet (à gauche s'il n'y a pas de place à droite)");
assert.match(ui, /idleAdventureIgnorerClicJusquaV165=0;/, "le survol n'avale pas le premier clic");

// --- D. L'ancienne infobulle instantanée séparée (doublon avec le popup complet) n'existe plus du tout. ---
assert.ok(!ui.includes("function installerInfobulleObjetAdventureIdleV1_("), "plus d'infobulle séparée : un seul popup au survol");
assert.ok(!ui.includes("function ouvrirInfobulleObjetAdventureIdleV1_("));
assert.ok(!ui.includes("sorealIdleItemInfobulleV1"));
assert.ok(!css.includes("soreal-idle-item-infobulle-v1"), "plus de style pour une infobulle qui n'existe plus");

console.log("idle-inventory-in-adventure-hover-v1 OK");
