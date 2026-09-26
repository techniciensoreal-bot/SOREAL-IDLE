import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) :
 *  - « Je veux réunir EXP Shop et Boutique AP dans le même menu nommé "Shop" (même visuel, séparés par un onglet ; EXP Shop de base ; un clic pour passer de l'un à l'autre). »
 *  - Classement « juste à la gauche de Settings », invisible pour les autres joueurs tant qu'un trophée ne l'a pas débloqué.
 *  - « Quand on maintient son doigt sur un bouton du menu, on passe en mode "Rangement des boutons" : on glisse un bouton et on l'intercale entre deux
 *    autres ; un bouton pour valider, visible seulement dans ce mode. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_MENUS_V1=[")) + 2);
const IDLE_MENUS_V1 = new Function(bloc + "return IDLE_MENUS_V1;")();
const ids = IDLE_MENUS_V1.map((m) => m.id);

// Menus : Shop remplace EXP Shop + Boutique AP ; Classement juste avant Settings
assert.deepEqual(ids.slice(-5), ["shop", "classement", "bestiaire", "chat", "parametres"]);
assert.ok(!ids.includes("spendExp") && !ids.includes("sellout"));

// Ordre : les identifiants enregistrés d'abord, les menus absents de l'ordre à leur place par défaut (après leur prédécesseur)
const ordonner = new Function(ui.slice(ui.indexOf("function ordonnerMenusIdleV1_(defauts,ordre){"), ui.indexOf("function menusOrdonnesIdleV1_(j){")) + "return ordonnerMenusIdleV1_;")();
const defauts = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];
assert.deepEqual(ordonner(defauts, []).map((m) => m.id), ["a", "b", "c", "d", "e"], "sans ordre : défaut");
{
  const r = ordonner(defauts, ["e", "b", "a", "c", "d"]).map((m) => m.id);
  assert.deepEqual(r, ["e", "b", "a", "c", "d"], "ordre complet respecté");
}
{
  // « d » n'est pas enregistré (menu débloqué plus tard) : il prend place juste après « c », son prédécesseur par défaut
  const r = ordonner(defauts, ["e", "b", "a", "c"]).map((m) => m.id);
  assert.deepEqual(r, ["e", "b", "a", "c", "d"]);
}
{
  const r = ordonner(defauts, ["zzz", "b", "b", "a"]).map((m) => m.id);
  assert.deepEqual(r.slice().sort(), ["a", "b", "c", "d", "e"], "identifiants inconnus et doublons ignorés, aucun menu perdu");
}

// Shop : deux onglets (un clic), EXP par défaut, Boutique AP seulement si débloquée
const shop = ui.slice(ui.indexOf("function pageShopIdleV1_(j){"), ui.indexOf("const IDLE_CLASSEMENT_ONGLETS_V1"));
assert.match(shop, /let onglet=idleShopOngletV1==='ap'\?'ap':'exp';/);
assert.ok(shop.includes("✨ EXP Shop") && shop.includes("🛍️ Boutique AP"));
assert.ok(shop.includes("boutons.length>1"), "un seul magasin disponible : pas d'onglets");
assert.ok(shop.includes("pageSelloutShopIdleV1_(j)") && shop.includes("pageSpendExpIdleV1_(j)"), "mêmes pages (même visuel) qu'avant");
assert.ok(shop.includes("IDLE_NAV_COULEURS_V1.sellout") && shop.includes("IDLE_NAV_COULEURS_V1.spendExp"), "chaque boutique garde sa couleur (AP mauve), son onglet aussi");
assert.match(ui, /case 'shop':\s*return pageShopIdleV1_\(j\);/);
assert.match(ui, /ancien==='spendExp'\|\|ancien==='sellout'\?'shop':ancien/, "un ancien menu mémorisé ouvre Shop");
assert.match(ui, /if\(id==='shop'\)\{\s*return menuDisponibleIdleV28_\('spendExp',j\)\|\|menuDisponibleIdleV28_\('sellout',j\);/);

// Classement : verrou fourni par le serveur, onglets global + 6 statistiques
assert.match(ui, /if\(id==='classement'\)\{\s*return Boolean\(j\.classement&&j\.classement\.debloque\);/);
const onglets = ui.slice(ui.indexOf("const IDLE_CLASSEMENT_ONGLETS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_CLASSEMENT_ONGLETS_V1=[")));
assert.deepEqual([...onglets.matchAll(/id:'([A-Za-z]+)'/g)].map((m) => m[1]), ["global", "boss", "rebirths", "number", "exp", "playSeconds", "achievements"]);
assert.match(ui, /\.obtenirClassementSorealIdle\(SOREAL_SESSION\)/);

// Rangement des boutons : maintien -> mode ; « Valider » seulement dans ce mode ; enregistrement serveur
assert.match(ui, /const DELAI_MAINTIEN_MS=600;/);
assert.match(ui, /if\(idleMenuEditionV1\|\|Date\.now\(\)<idleMenuClicAvaleJusquaV1\)return;/, "en mode rangement, un appui ne change pas de page");
assert.ok(ui.includes("idleMenuEditionV1?htmlBandeauRangementMenuIdleV1_():''"), "bandeau + bouton Valider uniquement en édition");
assert.match(ui, /\.definirOrdreMenusSorealIdle\(SOREAL_SESSION,ordre\)/);
assert.ok(!ui.slice(0, ui.indexOf("function htmlBandeauRangementMenuIdleV1_(){")).includes("soreal-idle-nav-valider-v1\" onclick"), "le bouton n'existe pas hors édition");

console.log("idle-shop-classement-menu-order-v1: OK");
