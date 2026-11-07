import assert from "node:assert/strict";
import fs from "node:fs";
/* Norman (2026-11-07) : voile noir seulement sur la case de l'image du boss ; le nom du boss suivant n'est jamais dit tout de suite ; Lhu vole (visage « vole ») pendant son trajet vers Nuke ; la barre verte est entourée quand il en parle. */
const t = fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(t.includes("#sorealIdleBossImageHostV36") && !/function suivreVoile_[\s\S]{0,400}boss-current-v35/.test(t), "le voile suit la case de l'image du boss, pas toute la carte");
assert.ok(t.includes("function coupeChronique_()") && t.includes("tts.stop()") && /bossNoir_\(on\)[\s\S]*coupeChronique_\(\);\s*noirGarde=setInterval/.test(t), "la lecture de la chronique du boss suivant est coupée dès le voile");
assert.ok(t.includes("idChronique_()!==idAvant") && /idChronique_\(\)!==idAvant\)bossNoir_\(true\)/.test(t), "le voile tombe dès que la chronique d'un autre boss apparaît (avant le record)");
assert.ok(t.includes("/barre verte/i.test") && t.includes("#sorealIdleHudV2>div:nth-child(2)"), "barre verte entourée quand le texte en parle");
const c = fs.readFileSync("cloudflare/public/modules/cthulhu-scene-v1.js", "utf8");
const p = c.slice(c.indexOf("function place(selecteur)"));
assert.ok(p.indexOf("visage('vole')") !== -1 && p.indexOf("visage('vole')") < p.indexOf("return aller(") && p.indexOf("visage(posable(selecteur)") > p.indexOf("return aller("), "il vole pendant le trajet, il se pose à l'arrivée");
const s = fs.readFileSync("cloudflare/src/idle-tutoriel-v1.js", "utf8");
assert.ok(s.includes('clignoteAussi: "#sorealIdleHudV2>div:nth-child(2)", texte: "La barre verte'), "guide d'amorçage : la barre verte clignote");
console.log("idle-lhu-voile-image-vol-barre-v1: OK");
