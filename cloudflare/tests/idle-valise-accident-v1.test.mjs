import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-23) : roulettes alignées, sommeil rare et jamais simultané, ronflement propre à la valise, accident de la valise (elle vomit, on frotte), main d'apprentissage en deux temps pour le premier caca et le premier vomi. */
const lire = (p) => readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const valise = lire("modules/valise-v1.js");
const acc = lire("modules/valise-accident-v1.js");
const caca = lire("modules/coffre-accident-v1.js");
const sommeil = lire("modules/coffre-sommeil-v1.js");
const audio = lire("modules/audio-effects-v199.js");

// Roulettes sur la même ligne que les pattes du Coffre (PC), la valise garde sa taille.
assert.ok(valise.includes("function aligner()") && valise.includes("247/260") && valise.includes("216/232") && valise.includes("--vl-decal"), "alignement des roulettes");
assert.ok(valise.includes("aligner();\n      var co=coffreOuvert();"), "réalignée à chaque pas");

// Sommeil : rare (4 à 9 minutes), jamais en même temps.
assert.ok(valise.includes("cibleSommeil=240000+Math.random()*300000") && sommeil.includes("MIN=240000,MAX=540000"), "sommeil rare pour les deux");
assert.ok(valise.includes("if(window.__coffreDortIdleV1__){visibleAvant=Math.max(0,cibleSommeil-30000);return;}") && valise.includes("window.__valiseDortIdleV1__=true"), "la valise ne s'endort pas quand le Coffre dort");
assert.ok(sommeil.includes("if(window.__valiseDortIdleV1__){vuAvantSommeil=Math.max(0,cibleSommeil-30000);return;}"), "le Coffre ne s'endort pas quand la valise dort");

// Ronflement propre, plus aigu.
assert.ok(valise.includes("son('valiseRonfle')") && !valise.includes("son('coffreRonfle')") && audio.includes("function valiseRonfle_()") && audio.includes("valiseRonfle:valiseRonfle_") && audio.includes('demander_("valiseRonfle")'), "ronflement de la valise");
assert.ok(/tonal_\(c,\{type:"sawtooth",from:300,to:430/.test(audio), "plus aigu que le Coffre (300-430 Hz)");

// Vomi : cinq allers-retours, une fois par jour environ, jamais avec un caca ni un sommeil, sol sous la valise (fond derrière, devant sur les roulettes).
assert.ok(acc.includes("NIVEAU_MAX=5") && acc.includes("JOUR_MS*(.65+Math.random()*.7)") && acc.includes("JOUR_MS*(.1+Math.random()*.9)"), "environ un accident par jour");
assert.ok(acc.includes("window.__coffreDortIdleV1__||window.__valiseDortIdleV1__") && acc.includes("c.flaqueNiveau()>0"), "jamais avec un caca en cours ni pendant un sommeil");
assert.ok(acc.includes(".vl-flaque-fond-v1") && acc.includes(".vl-bete:has(.vl-flaque-fond-v1)>svg:not(.vl-haut):not(.vl-vomi-svg){position:relative;z-index:2}") && acc.includes(".vl-flaque-v1 b{clip-path:inset(54% -20px 0 -20px)}"), "le vomi passe sous la valise (perspective)");
assert.ok(acc.includes("if(n&&niveau>0){\n      retirerDoigt();") && acc.includes("niveau-=1;sauver();majFlaque();clic();"), "le frottement fait baisser le niveau ; la main part à la première frottée");
assert.ok(valise.includes("if(t.closest('.vl-flaque-v1'))"), "frotter le vomi n'ouvre ni ne ferme la valise");
assert.ok(audio.includes("valiseVomi:valiseVomi_") && acc.includes("son('valiseVomi')"), "son du vomi");

// La main : ne disparaît qu'après une vraie frottée (caca et vomi), posée sur l'inventaire tant que le Coffre / la valise n'est pas à l'écran.
assert.ok(caca.includes("if(n&&flaqueNiveau>0){retirerDoigt_();flaqueNiveau-=1;") && !caca.includes("if(fl){retirerDoigt_();suivi=Object.assign("), "caca : la main reste jusqu'à une vraie frottée");
assert.ok(caca.includes("doigtSvg:SVG_DOIGT_,doigtVu:doigtDejaVu_,"), "la main du caca est partagée");
assert.ok(acc.includes(".aide-main-v1{position:fixed") && acc.includes("document.querySelector('.soreal-idle-v151-inventory-columns')") && acc.includes("if((cible&&visible(cible))||(cibleV&&visible(cibleV))){retirerMain();return;}") && acc.includes("transform:rotate(180deg)"), "main sur l'inventaire pointant vers le bas, remplacée par celle de l'accident dès qu'il est à l'écran");
assert.ok(acc.includes("soreal_idle_vomi_doigt_vu_v1") && acc.includes("soreal_idle_vomi_v1") && acc.includes("soreal_idle_valise_prochain_vomi_v1"), "état lié au compte (clés soreal_idle_)");
assert.ok(lire("index.html").includes('<script defer src="/modules/valise-accident-v1.js?v='), "module chargé");
console.log("idle-valise-accident-v1: OK");

// Le vomi sur la valise même : une vraie coulée dessinée depuis la bouche (Norman, 2026-10-23), qui coule la première fois et fond avec le niveau ; sourire bête à une grosse dent ; bulles qui sortent du cadre.
{
  assert.ok(acc.includes("var VOMI_SVG='<svg class=\"vl-vomi-svg\" viewBox=\"0 0 320 232\"") && acc.includes("@keyframes vlCoule") && acc.includes(".vl-vomi-svg.neuf .vl-vomi-flot{animation:vlCoule"), "coulée dessinée qui coule");
  assert.ok(acc.includes("function poserVomiFacade(el,spontanee)") && acc.includes("svg.setAttribute('data-morph-garder','')") && acc.includes(".vl-bete[data-vomi=\"'+n+'\"] .vl-vomi-svg{opacity:"), "posée et retirée avec l'état, fond avec le niveau");
  /* la bouche EST l'ouverture : son bord (le dessous du couvercle) dessine le sourire ; aucune ligne de plus */
  assert.ok(!valise.includes("vl-sourire") && valise.includes("Q294 56 294 98Q160 134 26 98Z") && valise.includes("M26 98Q160 134 294 98"), "le bord du couvercle est le sourire, sans ligne en plus");
  assert.ok((valise.match(/class="vl-dent"/g) || []).length === 1 && /M96 112H117V131/.test(valise), "UNE seule grosse dent, sur la gauche");
  assert.ok(valise.includes("soreal-idle-coffre-v1{isolation:isolate;overflow:visible}") && valise.includes("border-radius:inherit;opacity:0;transition:opacity .7s ease"), "le cadre du Coffre ne coupe plus les bulles");
  assert.ok(valise.includes(".vl-bulle{position:absolute;right:-6px;bottom:calc(100% - 6px);z-index:7"), "la bulle de la valise est au-dessus d'elle");
}
console.log("idle-valise-accident-v1 (vomi, sourire, bulles): OK");
