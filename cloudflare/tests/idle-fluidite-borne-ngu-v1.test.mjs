import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-10) : « la page Fight Boss n'est plus fluide depuis le nouveau design ; NGU non plus ».
 * Causes trouvées :
 *  - Fight Boss : un filtre drop-shadow couvrait TOUTE la borne (600 x 1100 px) et était recalculé à chaque image dès qu'un néon, un bouton ou une étoile s'animait ; les néons latéraux et les trois boutons animaient en plus
 *    une box-shadow (repeinte à chaque image) ;
 *  - NGU : le liquide des tuyaux n'avançait que 10 fois par seconde (setInterval 100 ms) et le halo de chaque tuyau était un flou (filter: blur) à opacité animée.
 * Règle : on n'anime que transform, opacity et filter simple (carte graphique), jamais box-shadow ni un filtre sur un grand conteneur.
 */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const borne = css.match(/\.borne-v2\{container-type:inline-size;[^}]*\}/);
assert.ok(borne, "règle de la borne trouvée");
assert.ok(!/filter\s*:/.test(borne[0]), "aucun filtre sur la borne entière");
assert.ok(css.includes(".borne-v2::after{content:\"\";display:block;position:absolute") && css.includes("radial-gradient(ellipse at 50% 35%,rgba(0,0,0,.72)"), "ombre portée = image fixe");
for (const nom of ["bnLuitB", "bnLuitR", "bnBtnLuit", "bnBtnBague"]) {
  const m = css.match(new RegExp("@keyframes " + nom + "\{.*"));
  assert.ok(m, nom + " existe");
  assert.ok(!/box-shadow/.test(m[0]), nom + " n'anime plus de box-shadow");
}

const ngu = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
assert.ok(!ngu.includes("setInterval(tick_,100)"), "plus d'horloge à 10 images par seconde");
assert.ok(ngu.includes("requestAnimationFrame(boucle_)") && ngu.includes("var complet=maintenant-dernierComplet>=100"), "liquide à chaque image, textes toutes les 100 ms");
assert.ok(!/\.nl-tuyau::before\{[^}]*filter:blur/.test(ngu), "halo des tuyaux sans flou");
console.log("idle-fluidite-borne-ngu-v1: OK");
