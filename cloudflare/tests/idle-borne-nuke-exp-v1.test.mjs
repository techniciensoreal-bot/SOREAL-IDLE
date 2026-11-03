import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « quand on fait un Nuke, qu'il mette le total d'EXP qu'on a eu sur l'écran LED ». */
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const moteur = lire("cloudflare/src/idle-runtime-combat.js"), combat = lire("cloudflare/public/modules/ui-combat-2-v1.js"), borne = lire("cloudflare/public/modules/borne-led-v1.js");
assert.ok(/defeated: defeated,\n[^\n]*\n\s*xp: xpGagnee,/.test(moteur), "le moteur renvoie l'EXP totale du Nuke (xpGagnee, déjà calculée)");
assert.ok(combat.includes("xp:(res&&res.ok&&res.nuke&&res.nuke.xp>0)?formatGrandNombreIdleV70_(res.nuke.xp):''"), "l'événement soreal-nuke-resultat porte l'EXP, formatée comme partout dans le jeu");
assert.ok(borne.includes("xp:String(d.xp||'').slice(0,18)") && borne.includes("p.xp=r.xp||'';"), "la borne reçoit l'EXP et la garde pour la scène");
assert.ok(borne.includes("var sx=p.xp?'+'+p.xp+' EXP':''") && borne.includes("text(sx,Math.floor((W-twidth(sx,1))/2)"), "la scène affiche « +EXP » sous le nombre de boss");
console.log("idle-borne-nuke-exp-v1: OK");
