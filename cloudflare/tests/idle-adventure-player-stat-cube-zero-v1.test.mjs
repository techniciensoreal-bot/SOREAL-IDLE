import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « Comme par exemple ne plus avoir (+0 cube) mais juste (+0) » -- précisé
 * en clarification : le petit cadre de stats du joueur en mode Aventure (panneau
 * .soreal-idle-adventure-player-panel-v1, sous l'image du monstre).
 *
 * Cause réelle : playerStat() (modules/adventure-scene-v79.js) affichait déjà le tag "cube"
 * seulement si `cube>0` (jamais si le Cube n'a aucune contribution) -- mais format_(cube,precision)
 * ARRONDIT à l'entier le plus proche (maximumFractionDigits par défaut 0, Intl.NumberFormat). Une
 * contribution Cube réelle mais petite (ex. 0,4 après le softcap) passait donc `cube>0` (vrai) tout
 * en s'AFFICHANT "0" une fois arrondie -- exactement "(+0 cube)" à l'écran, malgré la garde. Même
 * défaut potentiel pour le tag "bonus" juste au-dessus (même formatage, même arrondi).
 */
const source = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");

const debut = source.indexOf("function playerStat(key,base,total,precision,cubeContribution){");
const fin = source.indexOf("\n    }\n", debut) + "\n    }\n".length;
assert.ok(debut > 0 && fin > debut, "playerStat introuvable");
const corps = source.slice(debut, fin);

// La garde compare désormais le texte réellement affiché (déjà arrondi), pas seulement la valeur brute.
assert.match(
  corps,
  /var bonusTexte=format_\(bonus,precision\);\s*\n\s*if\(extra\)extra\.textContent=bonus>0&&bonusTexte!==['"]0['"]\?/,
  "le tag bonus doit comparer le texte déjà formaté à \"0\", pas seulement bonus>0"
);
assert.match(
  corps,
  /var cubeTexte=format_\(cube,precision\);\s*\n\s*if\(cubeExtra\)cubeExtra\.textContent=cube>0&&cubeTexte!==['"]0['"]\?/,
  "le tag cube doit comparer le texte déjà formaté à \"0\", pas seulement cube>0"
);

// La prémisse du bug : Intl.NumberFormat (format_ réel du module) arrondit bien 0,4 à "0" à précision 0 --
// exactement le cas qui passait `cube>0` (vrai) tout en affichant "(+0 cube)" avant ce correctif.
function format_(value, precision) {
  const n = Number(value);
  if (Math.abs(n) < 1000000) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: precision || 0 }).format(n);
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}
assert.equal(format_(0.4, 0), "0", "0,4 doit bien s'arrondir à \"0\" en précision entière -- la vraie cause du bug");
assert.equal(format_(5, 0), "5", "une vraie contribution reste affichée normalement");
assert.equal(format_(0, 0), "0");

console.log("idle-adventure-player-stat-cube-zero-v1: OK");
