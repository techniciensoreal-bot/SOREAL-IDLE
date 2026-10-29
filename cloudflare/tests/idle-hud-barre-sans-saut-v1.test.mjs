import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand je dépense toute ma magie ou toute mon énergie, les barres disparaissent et ça fait bouger la page où je me trouve ».
 * Norman (2026-10-28) : « ça fait encore bouger le menu dans lequel on se trouve ; ça doit vraiment être 2 choses indépendantes ». L'ancienne compensation (report sur le défilement) ne jouait que page défilée : en haut de page le contenu suivait la barre.
 * Maintenant une réserve (bloc vide juste sous le bandeau) absorbe exactement chaque variation de hauteur du bandeau, image après image (ResizeObserver, avant l'affichage) : le contenu ne bouge ni en haut de page ni défilé.
 * Mesuré dans Chrome : la position du contenu reste identique à chaque image pendant le fondu d'une barre (départ ET retour).
 */
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
/*
 * Norman (2026-10-29) : « le panneau attaque défense or et les 4 barres sont posés AU-DESSUS de l'interface ; quand il se déploie il glisse sur le menu mais ne le pousse JAMAIS ; aucun mouvement hormis la barre de PV et les autres barres ».
 * Plus de réserve ni de défilement corrigé : la page ne réserve que la hauteur de base du bandeau ; sa marge basse rentre exactement de ce que les barres d'énergie, de magie et de 3e ressource ajoutent.
 * Banc : cloudflare/tools/banc-barres-hud-v1.js ; audit des 20 pages (partie à 100 / 100 des trois ressources, chaque ressource vidée puis remplie) : chiffres, menu et contenu à 0,00 – 0,02 px (une unité de mise en page).
 */
assert.ok(hud.includes("new ResizeObserver(ajuster)") && hud.includes("hudObs.observe(h)"), "le bandeau est surveillé image après image (avant l'affichage)");
assert.ok(!/sorealIdleHudReserveV2|function absorber|fermerReserveSiStable|window\.scrollTo\(|GRACE_MS|graceJusqua/.test(hud), "plus de réserve, de défilement corrigé ni de délai : rien à rattraper");
assert.ok(hud.includes("function baseHud(h)") && hud.includes(".soreal-idle-energy-panel-v34:not(.soreal-idle-hud-pv-v2)"), "la base = le bandeau sans les barres qui vont et viennent (la barre de vie reste dans la base)");
assert.ok(hud.includes("document.documentElement.style.setProperty('--hud-decalage',v)"), "la valeur est écrite sur la racine (le redessin de la page ne touche pas à ses attributs : règle n°4)");
assert.ok(hud.includes("margin-bottom:calc(10px + var(--hud-decalage,0px))!important;z-index:30"), "marge basse du bandeau = 10 px moins ce que les barres ajoutent ; bandeau au-dessus du contenu");
assert.ok(hud.includes("var d=-(haut-baseHud(hudEl))/z;") && hud.includes("function zoomHud(h)"), "exprimé en pixels de mise en page (zoom .86 sur PC)");
assert.ok(hud.includes("tcv-actif") || hud.includes("if(!(haut>0))return;"), "bandeau caché (combat de Titan) : rien n'est calculé");
assert.ok(hud.includes("window.addEventListener('resize'") && hud.includes("surveillerHud();"), "remis à jour au changement de taille ; le bandeau (parfois recréé) est ré-attaché régulièrement");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes("soreal-idle-page-root-v28{overflow-anchor:none}"), "l'ancrage natif reste coupé (page redessinée en continu) : c'est la réserve qui compense");

console.log("idle-hud-barre-sans-saut-v1: OK");

/* Norman (2026-10-29, Machine temporelle : « retire l'énergie : la feuille bouge encore ») : le calage de position du bouton cliqué (requestAnimationFrame, avant le rattrapage de hauteur du bandeau) faisait défiler la page de 4 à 11 px */
{
  const menus = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
  const mesure = menus.slice(menus.indexOf("function hautSansTransformIdleV1_(e){"), menus.indexOf("return r.top-ty;"));
  assert.ok(mesure.includes("window.__SOREAL_IDLE_HUD_HAUT_V2__") && mesure.includes("hb.ajuster()") && mesure.indexOf("hb.ajuster()") < mesure.indexOf("e.getBoundingClientRect()"), "la mesure du calage demande d'abord au bandeau de se remettre d'aplomb");
  assert.ok(hud.includes("ajuster:ajuster"), "le bandeau expose ajuster()");
  console.log("idle-hud-barre-sans-saut-v1 (calage du clic): OK");
}
