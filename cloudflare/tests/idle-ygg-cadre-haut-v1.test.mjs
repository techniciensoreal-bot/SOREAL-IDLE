import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-09) : « dans Yggdrasil, le cadre « Manger / récolter tous les fruits » doit se trouver en haut de page, sous le compteur de graines, et tenir sur une seule ligne ». */
const s = fs.readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const page = s.slice(s.indexOf("function page(j){"), s.indexOf("/* ---------- Actions ---------- */"));
const iMonnaies = page.indexOf("ygg-monnaies-haut"), iBas = page.indexOf("class=\"ygg-bas\""), iOnglets = page.indexOf("onglets+\n"), iGrille = page.indexOf("class=\"ygg-grille\""), iNote = page.indexOf("class=\"ygg-note\"");
assert.ok(iMonnaies > 0 && iBas > iMonnaies && iBas < iOnglets && iOnglets < iGrille && iGrille < iNote, "ordre : compteurs de graines, cadre des actions, onglets, grille, note");
assert.equal(page.split("class=\"ygg-bas\"").length - 1, 1, "le cadre n'existe qu'une fois (plus en bas)");
assert.ok(page.includes("Manger / récolter tous les fruits au tier max") && page.includes("Manger / récolter tous les fruits ≥ tier 1") && page.includes("ygg-solo"), "les deux boutons et la case sont toujours là");
assert.ok(s.includes(".ygg-actions-bas{display:flex;flex-wrap:nowrap;"), "une seule ligne (pas de retour à la ligne) en largeur normale");
assert.ok(s.includes("@container (max-width:520px){.ygg-actions-bas{flex-wrap:wrap}"), "sur une page étroite, les éléments passent l'un sous l'autre");
console.log("idle-ygg-cadre-haut-v1: OK");
