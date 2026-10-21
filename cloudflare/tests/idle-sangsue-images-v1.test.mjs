import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Rituel de la sangsue (Norman, 2026-10-20) : « on voit le fond de l'armoire à travers la sangsue, la boule bouge n'importe comment et sort au mauvais endroit ; en changeant de menu et en revenant, c'est correct ».
 * Cause : à la première ouverture, les images de la scène arrivent après le reste ; sans l'image du corps, le canal de sang et la boule se voyaient en l'air. Tant qu'une image charge, ces éléments restent cachés ;
 * les images sont aussi demandées en arrière-plan dès que Blood Magic est découvert.
 */
const src = readFileSync(new URL("../public/modules/sang-rituel-decor-v1.js", import.meta.url), "utf8");
assert.ok(src.includes("function attendreImagesScene(sc){"), "la scène attend ses images");
assert.ok(src.includes("sc.classList.toggle('bm-attend-images',!pret)"), "classe posée tant qu'une image charge");
assert.ok(/function majScene\(sc\)\{\s*attendreImagesScene\(sc\);/.test(src), "vérifié à chaque mise à jour de scène, même hors écran");
assert.ok(src.includes("addEventListener('load',relance)") && src.includes("addEventListener('error',relance)"), "la scène se met à jour dès qu'une image arrive (ou échoue)");
const regle = src.match(/\.bm-scene\[data-source="sucon"\]\.bm-attend-images :is\(([^)]*)\)\{visibility:hidden!important\}/);
assert.ok(regle, "règle CSS : éléments cachés pendant le chargement");
for (const classe of ["bm-tube-fond", "bm-paquets-corps", "bm-paquets-sortie", "bm-sangsue-img", "bm-sangsue-gl"]) assert.ok(regle[1].includes(classe), "caché pendant le chargement : " + classe);
for (const img of ["sangsue.webp", "soccle.webp", "BloodMagicSucon.webp"]) assert.ok(src.includes("PRECHARGE_SANG") && src.includes("name=" + img), "image préchargée : " + img);
assert.ok(src.includes("etat.systemes.bloodRituals.length>0"), "préchargement seulement quand Blood Magic est découvert (aucune demande avant)");
console.log("idle-sangsue-images-v1: OK");
/*
 * Norman (2026-10-21) : « le bug de la sangsue est toujours présent au premier lancement du jeu » : la demande de l'image peut ÉCHOUER (complete vaut vrai aussi en cas d'échec) ; la scène s'affichait alors sans WebGL (pas de classe bm-gl) jusqu'à ce qu'on quitte la page.
 * Reproduit dans le navigateur (deux premières demandes de sangsue.webp refusées) : avant, « bm-installe bm-marque » sans « bm-gl » pour toujours ; après, l'image est redemandée toute seule et la scène passe en WebGL en moins de 3 s.
 */
assert.ok(src.includes("if(!im.naturalWidth){") && src.includes("im.__bmEssais") && src.includes("if(essais<4){"), "image en échec : redemandée 4 fois au plus, scène cachée pendant ce temps");
assert.ok(src.includes("600*Math.pow(2,essais)") && src.includes("'_r='+Date.now()"), "délais croissants et contournement d'une réponse en échec gardée en mémoire");
assert.ok(src.includes("im.addEventListener('load',relance);im.addEventListener('error',relance);") && !src.includes("{once:true}));im.addEventListener('error'"), "l'arrivée de l'image relance toujours la scène (plus d'écouteur à usage unique)");
console.log("idle-sangsue-images-v1 (échecs): OK");
