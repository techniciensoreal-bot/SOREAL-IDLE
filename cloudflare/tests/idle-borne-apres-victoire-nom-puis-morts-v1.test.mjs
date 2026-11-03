import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-03) : « quand on gagne et que victoire est affiché ou toute autre scène de victoire, la première information qui suit doit être le numéro et le nom du boss actuel. J'ai l'info du nombre de fois tué. Elle doit venir après le nom. »
 * Après VICTOIRE ! (ou un NUKE), la borne LED enchaîne « #N · NOM » (scène de base), puis « TUÉ N FOIS » (scène morts), avant tout objet actif ou tableau des scores.
 */
const src = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(src.includes("var apresVictoire=false;"), "drapeau « une victoire vient d'avoir lieu »");
assert.ok(src.includes("if(vic&&!L.vic){pousser('win',now);apresVictoire=true;}"), "la victoire arme le drapeau");
assert.ok(src.includes("if(nk&&!L.nuke)apresVictoire=true;"), "un NUKE aussi (scène de victoire)");
const i = src.indexOf("function suivante(now){");
const corps = src.slice(i, src.indexOf("function pousser(", i));
const iVic = corps.indexOf("if(apresVictoire){apresVictoire=false;rot=1;return mk('base',now);}");
assert.ok(iVic > 0, "après une victoire : le nom du boss d'abord, puis la rotation repart sur « morts »");
assert.ok(iVic < corps.indexOf("objetDu(now)"), "avant tout objet actif");
assert.ok(corps.includes("['base','morts','score','base']") && corps.indexOf("'base','morts'") > iVic, "séquence : nom puis TUÉ N FOIS");
assert.ok(corps.indexOf("apresVictoire=false;combatFight") > 0, "un combat qui reprend annule le drapeau");
console.log("idle-borne-apres-victoire-nom-puis-morts-v1 : OK");
