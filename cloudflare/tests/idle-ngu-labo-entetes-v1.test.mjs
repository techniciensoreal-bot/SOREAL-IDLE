import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

/* Norman (2026-10-30) : les deux en-tetes du laboratoire NGU (Energie = jour, Magie = nuit) ont le cadre du titre du menu NGU. */
const css = readFileSync("cloudflare/public/soreal-idle-ngu-labo-entetes-v1.css", "utf8");
const js = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/soreal-idle-ngu-labo-entetes-v1\.css\?v=\d+/.test(html), "feuille liee dans index.html");
assert.ok(css.includes('[data-nl-onglet="energy"] .nl-entete::before') && css.includes('[data-nl-onglet="magic"] .nl-entete::before'), "un fond pour le jour et un pour la nuit");
assert.ok(css.includes("border:3px solid #000") && css.includes("#ffe27a 0%,#fff0b0 30%,#d8dcff 62%,#8a98ff 100%"), "meme cadre et meme liseré que le menu NGU");
assert.ok(css.includes("@media (max-width:560px)"), "version telephone");
assert.ok(!css.includes("@keyframes") && !css.includes("animation") && !css.includes("!important"), "statique : rien a boucler, rien a redessiner");
assert.ok(js.includes('<header class="nl-entete"><div class="nl-titre"') && !js.includes("filter:drop-shadow(0 0 10px rgba(170,110,255,.7))"), "ancien titre degrade retire, balisage inchange");
// Les dessins viennent du cadre du menu (pas redessines) : le fichier est celui que le generateur produit.
const avant = css;
execFileSync("node", ["cloudflare/tools/gen-ngu-labo-entetes-v1.mjs"], { stdio: "pipe" });
assert.equal(readFileSync("cloudflare/public/soreal-idle-ngu-labo-entetes-v1.css", "utf8"), avant, "feuille a jour avec soreal-idle-entetes-d.css");
console.log("idle-ngu-labo-entetes-v1: OK");
