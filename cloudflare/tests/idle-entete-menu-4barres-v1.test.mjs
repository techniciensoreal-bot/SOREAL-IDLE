// Norman (2026-10-30) : « pour chacun des menus, un titre qui donne juste le nom du menu avec une mini phrase explicative ; ce cadre doit faire exactement la taille de 4 barres (vie + énergie + magie + ressource 3) ; il y a déjà un espace vide au-dessus :
// espace vide + cadre = la taille des 4 barres, pour que les barres ne cachent que le titre, jamais un bouton ».
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/entete-menu-v1.js"), css = lire("cloudflare/public/soreal-idle-itopod.css"), idx = lire("cloudflare/public/index.html");
const chro = lire("cloudflare/public/modules/ui-chroniques-v1.js"), bout = lire("cloudflare/public/modules/ui-boutique-v1.js"), dict = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));
// la feuille réellement chargée porte la règle (la feuille « jeu-global » n'est jamais chargée)
assert.ok(/stylesheet" href="\/soreal-idle-itopod\.css/.test(idx) && !/soreal-idle-jeu-global/.test(idx), "la règle est dans une feuille chargée par la page");
assert.ok(css.includes(".soreal-idle-page-head-v28[data-entete-menu]{box-sizing:border-box;height:calc(var(--hud-4barres-v1,131px) - var(--vide-haut-v1,14px))"), "cadre = 4 barres - espace vide");
assert.ok(css.includes(".bm-entete[data-entete-menu]{box-sizing:border-box;height:calc(var(--hud-4barres-v1,131px) - var(--vide-haut-v1,14px))"), "la Magie du sang : son propre titre est le cadre");
assert.ok(!/data-entete-menu\][^{]*\{[^}]*!important/.test(css), "aucun !important ajouté (plafond de dette CSS)");
// la mesure : 4 hauteurs de barre + 3 écarts, mesurée sur la barre de vie ; l'espace vide = du haut de la page au haut du cadre
assert.ok(m.includes("var recouvre=3*(h+ecart)-10;") && m.includes("zoom_(document.getElementById('sorealIdleHudV2')||panneau)") && m.includes("'--hud-4barres-v1'") && m.includes("premier.getBoundingClientRect().top-racine.getBoundingClientRect().top"), "mesure : recouvrement des 4 barres (3 pas - 10 px, zoom du bandeau) et espace vide");
// menus sans cadre de titre : un cadre du même modèle ; la Magie du sang garde le sien
for (const id of ["combat", "aventure", "machine", "ngu", "yggdrasil"]) assert.ok(m.includes("  " + id + ":'"), "mini phrase du menu " + id);
assert.ok(!/\n  sang:'/.test(m) && m.includes("if(!natif&&menu==='sang')natif=racine.querySelector('.bm-entete');"), "la Magie du sang n'a pas de cadre en double");
// règle n°4 : attributs gardés par le morph, remise en place dans la même tâche, cadre généré protégé
assert.ok(m.includes("__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__") && m.includes("push('data-entete-menu')") && m.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__") && m.includes("setAttribute('data-morph-garder','')"), "redessin invisible");
assert.ok(idx.includes('modules/entete-menu-v1.js?v='), "module chargé par la page");
// les onglets passent SOUS le cadre de titre (Boutique, Chroniques) : aucun bouton avant le cadre
assert.ok(chro.includes("return barreSousEnteteIdleV1_(barre,contenu);") && bout.includes("barreSousEnteteIdleV1_(boutons.length>1?"), "onglets sous le titre");
// traductions des mini phrases générées
for (const v of Object.values({ a: "Affronte les boss de la borne d’arcade.", b: "Pars en zone, combats des ennemis et ramène du butin.", c: "Accélère et multiplie la production d’énergie et de magie.", d: "Fais monter tes NGU : des bonus permanents qui grandissent avec le temps.", e: "Fais pousser des fruits, récolte-les ou mange-les pour des bonus." })) assert.ok(dict[v], "traduit : " + v);
// police plus grande et cadre soigné : la règle \u00ab 1,5 em !important \u00bb ne touche plus les cadres marqués (sinon elle l'emporterait sur la nouvelle taille) ; le titre ne passe jamais à la ligne
assert.ok(css.includes(".soreal-idle-page-head-v28:not([data-entete-menu]) .soreal-idle-page-title-v28{font-size:1.5em!important;}"), "l'ancienne taille ne s'applique qu'aux cadres non marqués");
assert.ok(css.includes("font-size:clamp(26px,4vw,40px);") && css.includes("white-space:nowrap;overflow:hidden;text-overflow:ellipsis") && css.includes("font-size:clamp(19px,5.4vw,23px)"), "titre plus grand, sur une seule ligne (PC et téléphone)");
assert.ok(css.includes("Titre de menu plus grand et plus soigné"), "habillage du cadre");
console.log("idle-entete-menu-4barres-v1 : OK");
