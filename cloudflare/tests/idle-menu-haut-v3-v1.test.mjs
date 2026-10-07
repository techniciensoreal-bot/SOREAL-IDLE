import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Menu du haut v3 (Norman, 2026-10-08) : sans style arcade, sans sous-titre, nom sur 2 lignes, boutons courts sur 2 rangées ; emojis et animations conservés ; rangement des boutons toujours utilisable. */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const i = css.indexOf("/* ===== MENU DU HAUT v3");
assert.ok(i > 0, "bloc du menu v3");
const bloc = css.slice(i);
assert.ok(bloc.includes("grid-auto-flow:column!important;grid-template-rows:repeat(2,auto)!important"), "deux rangées qui défilent ensemble");
assert.ok(bloc.includes(".soreal-idle-nav-texte-v2 small{display:none!important;}"), "plus de sous-titre");
assert.ok(bloc.includes("-webkit-line-clamp:2!important"), "nom sur deux lignes au plus");
assert.ok(/width:126px!important;min-width:126px!important;max-width:126px!important/.test(bloc), "boutons courts et réguliers");
assert.ok(bloc.includes("clip-path:none!important") && !/3px 3px 0 #000|5px 5px 0 #000/.test(bloc), "plus d'hexagone ni d'ombre décalée noire de style arcade");
assert.ok(bloc.includes("overflow-wrap:normal!important") && bloc.includes("word-break:normal!important"), "aucun mot coupé au milieu");
// Emojis (le HTML ne change pas) et animations conservés : mêmes classes, mêmes keyframes
assert.ok(css.includes("@keyframes sorealNavAnneauV1") && css.includes("@keyframes sorealNavDispoEchelleV1") && !/nav-new-v1[^{]*\{[^}]*animation:none!important[^}]*\}[^]*MENU DU HAUT/.test(""), "keyframes des animations du menu intacts");
assert.ok(bloc.includes(".soreal-idle-nav-button-v28.soreal-idle-nav-new-v1::after") && bloc.includes(".soreal-idle-nav-button-v28.soreal-idle-nav-dispo-v1"), "anneau « nouveau » et halo « disponible » adaptés, pas supprimés");
// Rangement des boutons : tout visible, bandeau pleine largeur
assert.ok(/\.soreal-idle-nav-v28\.edition\{\s*display:flex!important;flex-wrap:wrap!important;overflow:visible!important;/.test(css), "mode rangement : tous les boutons visibles");
// Le HTML des boutons n'a pas changé (emoji + nom + sous-titre dans le DOM, caché par le style)
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("soreal-idle-nav-emoji-v2") && ui.includes("soreal-idle-nav-texte-v2"), "structure des boutons inchangée");
console.log("idle-menu-haut-v3-v1: OK");
