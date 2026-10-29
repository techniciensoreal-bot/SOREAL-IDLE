// Norman (2026-10-29) : en plein écran le cadre des menus de gauche n'est pas centré en hauteur (collé au haut, plus loin du bas) et ses icônes sortent du cadre quand on le fait défiler.
import fs from "node:fs";
import assert from "node:assert/strict";
const css = fs.readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8").replace(/\r\n/g, "\n");
assert.ok(css.includes("position:sticky;top:14px;margin:0 0 14px!important;contain:paint;"), "menu de gauche : à 14 px du haut (le bas en laisse 12 : voir __ajusterMenuHauteurIdleV1__) et ses icônes découpées dans le cadre");
const am = fs.readFileSync("cloudflare/public/modules/ui-amorcage-v1.js", "utf8");
assert.ok(am.includes("window.innerHeight-Math.max(haut,12)-12"), "hauteur disponible : 12 px de marge en bas, sans compter plus que 12 px en haut");
console.log("idle-menu-gauche-centre-et-ap-v1 : OK");
