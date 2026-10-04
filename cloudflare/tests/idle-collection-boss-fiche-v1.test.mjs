import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « Sur PC, dans Collection, quand on ouvre une carte de boss, l'image n'est pas bien cadrée » et « je dois pouvoir éditer les textes de boss via le menu Collection ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const admin = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");

// Cadrage PC : l'image est entière (contain), centrée, dans un cadre de hauteur fixe ; plus de bandeau de 260 px qui rognait le haut.
const bloc = css.slice(css.indexOf("Fiche d'un boss bien cadrée sur PC"));
assert.ok(bloc.includes(".soreal-idle-boss-fiche-image-v1{") && bloc.includes("place-items:center") && bloc.includes("height:min(340px,44vh)"));
assert.ok(bloc.includes("object-fit:contain") && bloc.includes("height:calc(min(340px,44vh) - 20px)"), "image entière, jamais rognée");
assert.ok(!css.includes(".soreal-idle-boss-fiche-image-v1 img{max-height:260px}"), "l'ancien recadrage est retiré");

// Édition : bouton réservé à l'administrateur dans la fiche (le module le rend vide pour tout autre compte), éditeur existant réutilisé.
assert.ok(ui.includes("window.__SOREAL_IDLE_TEXTES_V1__.boutonBossHtml(n)"), "bouton dans la fiche");
assert.ok(ui.includes("soreal-idle-boss-fiche-admin-v1"));
assert.ok(admin.includes("function boutonBossHtml_(numero){\n  if(!estAdmin_()||!(Number(numero)>0))return '';"), "invisible pour un joueur ordinaire");
assert.ok(admin.includes("data-stx-boss") && admin.includes("editerBoss_(bossBtn.getAttribute('data-stx-boss'))"), "ouvre l'éditeur du boss");
// La fiche se referme à l'ouverture de l'éditeur et se rouvre (texte à jour) à sa fermeture.
assert.ok(ui.includes("closest('#sorealIdleBossCollectionModalV1 [data-stx-boss]')") && ui.includes("ouvrirBossCollectionIdleV1_(numero)"));
// Sécurité : le serveur revérifie le compte à chaque enregistrement.
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
for (const op of ["listerTextesAdminSorealIdle", "enregistrerTexteAdminSorealIdle", "supprimerTexteAdminSorealIdle"]) {
  const debut = rt.indexOf("function " + op + "(");
  assert.ok(rt.slice(debut, debut + 200).includes("exigerAdminHistoiresSorealIdle_(sessionToken)"), op + " : réservé à l'administrateur");
}
console.log("idle-collection-boss-fiche-v1: OK");
