// Norman (2026-10-29) : la carte du panneau sous la borne et celle du boss précédent / suivant ont la MÊME taille, plus grande sur PC ; sur téléphone elle prend presque toute la largeur (flèches sous la carte).
import fs from "node:fs";
import assert from "node:assert/strict";
const c = fs.readFileSync("cloudflare/public/soreal-idle-carte-boss.css", "utf8").replace(/\r\n/g, "\n");
assert.equal(c.split("width:var(--mtg-largeur)").length - 1, 2, "la chronique ouverte et la fiche utilisent la même largeur");
assert.ok(c.includes("html{--mtg-largeur:min(420px,calc(100vw - 112px),calc(78vh / 1.68))}"), "valeur de repli");
assert.ok(c.includes("@media (min-width:900px) and (hover:hover) and (pointer:fine){html{--mtg-largeur:min(560px,calc(100vw - 160px),calc(86vh / 1.68))}}"), "PC : jusqu'à 560 px, 86 % de la hauteur");
assert.ok(c.includes("@media (max-width:640px){html{--mtg-largeur:min(460px,calc(100vw - 24px)"), "téléphone : presque toute la largeur");
assert.ok(c.includes("@media (max-width:640px){.mtg-fleche{top:100%;margin:12px 0 0}"), "téléphone : flèches sous la carte");
assert.ok(c.includes(".soreal-idle-modal-backdrop-v63:has(.mtg-modal-v1){padding:0;box-sizing:border-box}"), "le cadre de la fiche ne rogne pas la carte");
console.log("idle-carte-boss-taille-v1 : OK");
