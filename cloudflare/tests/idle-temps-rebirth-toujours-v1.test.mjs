import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « quand on rebirth, le temps de rebirth n'est pas affiché en haut sur la même ligne qu'Attaque, Défense, Or… Le menu Renaissance n'apparaît pas avant 3 minutes, mais le timer doit apparaître tout de suite… il ne doit jamais disparaître. » */
const lire = (f) => fs.readFileSync("cloudflare/public/modules/" + f, "utf8").replace(/\r\n/g, "\n");
const resume = lire("ui-aventure-1-v1.js"), popups = lire("ui-popups-v1.js");
assert.ok(resume.includes("if(rebirths>0||(REG.menuDisponibleIdleV28_&&REG.menuDisponibleIdleV28_('renaissance',j))){"), "la case « Temps » est dessinée dès qu'un Rebirth a eu lieu, même si le menu Renaissance n'est pas encore reproposé");
assert.ok(popups.includes("idleEntier_(records.totalRebirths||0))>0||(REG.menuDisponibleIdleV28_&&REG.menuDisponibleIdleV28_('renaissance',j)))"), "le bandeau la remet tout de suite après un Rebirth (jamais retirée)");
console.log("idle-temps-rebirth-toujours-v1: OK");
