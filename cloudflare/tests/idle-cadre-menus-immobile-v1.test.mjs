import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-09) : le cadre qui contient tous les menus bougeait au passage d'une page longue à une page courte (la barre de défilement apparaît / disparaît, la largeur de la page change de ~20 px). */
const css = fs.readFileSync("cloudflare/public/soreal-idle-lisibilite-v1.css", "utf8");
assert.ok(/(^|\n)html\{scrollbar-gutter:stable\}/.test(css), "la place de la barre de défilement est toujours réservée");
const html = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes("soreal-idle-lisibilite-v1.css"), "la feuille est chargée");
console.log("idle-cadre-menus-immobile-v1: OK");
