// Norman (2026-10-30) : « la sangsue crache un jet comme si elle était bloquée, puis les boules n'apparaissent plus dans son ventre ; je dois changer de page et revenir » :
// un redessin de la page (morph) retire l'animation de la boule alors que la cadence est la même ; le ventre est maintenant rebâti dès qu'elle manque (au plus une fois toutes les 1,5 s).
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("if(sc.__cle===cle&&m>1&&!attente&&!sc.__fige&&paq[0]&&paq[0].getAnimations&&!paq[0].getAnimations().length&&performance.now()-(sc.__cleAt||0)>1500)sc.__cle='';"), "la boule sans animation déclenche la reconstruction du ventre");
assert.ok(s.indexOf("sc.__cle='';\n  if(sc.__cle!==cle){") > 0, "la reconstruction passe par le chemin habituel (le sang mémorisé revient)");
console.log("idle-sangsue-boule-sans-animation-v1 : OK");
