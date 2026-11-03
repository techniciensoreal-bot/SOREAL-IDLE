import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-03) : « pendant la danse de Leatherface, il ne doit pas y avoir de sang qui gicle ». La danse de victoire (danseFinale) ne contient plus aucune gerbe de sang
 * (burst en rouge/rose) ; le sang reste réservé à la scène de DÉFAITE (tueRie).
 */
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
const i = led.indexOf("function danseFinale(");
assert.ok(i > 0, "danseFinale présente");
const j = led.indexOf("\n}\n", i);
const corps = led.slice(i, j);
assert.ok(!/burst\(/.test(corps), "aucune gerbe (burst) pendant la danse de Leatherface");
assert.ok(!/\bROS\b/.test(corps.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune couleur de sang rose dans la danse");
assert.ok(led.includes("function tueRie(") && /burst\(bx,by\+2,u,44,5,34,1\.9,\[ROU,ROU,ROU,ROS\],22\)/.test(led), "le sang de la défaite (tueRie) est conservé");
console.log("idle-borne-danse-sans-sang-v1 : OK");
