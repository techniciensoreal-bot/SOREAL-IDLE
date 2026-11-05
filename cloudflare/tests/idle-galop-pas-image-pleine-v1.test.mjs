import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-05) : « on voit encore l'image complète avant qu'on revienne à cheval quand on meurt dans fight boss ». Le retour « galop » rapetisse l'image AVANT de la rendre visible (sinon une image pleine grandeur apparaît pendant une image). */
const src = readFileSync("cloudflare/public/modules/reapparitions-v1.js", "utf8");
const g = src.slice(src.indexOf("{id:'galop'"), src.indexOf("{id:'marche'"));
const iTransform = g.indexOf("scale(0.07)");
const iOpacite = g.indexOf("X.sujet.style.opacity=1");
assert.ok(iTransform > 0 && iOpacite > 0, "pose de départ et opacité présentes");
assert.ok(iTransform < iOpacite, "l'image est rapetissée avant d'être rendue visible");
assert.ok(g.indexOf("scale('+s.toFixed(4)") > iOpacite, "la boucle d'animation continue ensuite");
console.log("idle-galop-pas-image-pleine-v1: OK");
