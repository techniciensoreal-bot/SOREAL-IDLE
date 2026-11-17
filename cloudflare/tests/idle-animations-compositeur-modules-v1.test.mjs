// Fluidité téléphone (Norman, 2026-11-17) : toute animation infinie des modules passe par le compositeur
// (transform, opacity, scale, rotate, translate). Un @keyframes qui anime autre chose (box-shadow, filter,
// background-position, clip-path...) et sert dans une animation `infinite` fait échouer ce test, sauf les
// restes documentés ci-dessous (masques et tracé SVG, petits et propres à un menu).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const RESTES = new Set([
  "daycare-page-v1.js gd-onde",            // vague du liquide de la Garderie : masque, à restructurer
  "ngu-labo-v1.js nlPailF", "ngu-labo-v1.js nlPailM", "ngu-labo-v1.js nlPailA", // paillettes du Labo NGU (barre pleine), petits masques
  "sang-rituel-decor-v1.js bmFluxVentre",  // stroke-dashoffset d'un tube SVG (non transformable)
]);
const r = spawnSync(process.execPath, ["cloudflare/tools/balayer-animations-lourdes-modules.mjs"], { encoding: "utf8" });
const trouves = r.stdout.split("\n").map((l) => l.trim()).filter((l) => l && l !== "aucune").map((l) => l.split(" -> ")[0]);
const nouveaux = trouves.filter((t) => !RESTES.has(t));
assert.deepEqual(nouveaux, [], "animation infinie hors compositeur : " + nouveaux.join(", "));

const lire = (f) => fs.readFileSync("cloudflare/public/modules/" + f, "utf8");
// Les pulsations de halo passent par opacity sur un calque à l'ombre statique.
assert.ok(lire("combat-effets-v1.js").includes("@keyframes cfxPouls{0%,100%{opacity:0}50%{opacity:1}}"));
assert.ok(lire("renaissance-fenetre-v1.js").includes("@keyframes rnRespire{0%,100%{opacity:0}50%{opacity:1}}"));
assert.ok(lire("intro-diaporama-v1.js").includes("@keyframes idPulse{0%,100%{opacity:0}50%{opacity:1}}"));
assert.ok(lire("tutoriel-v1.js").includes("@keyframes tuPulse{0%,100%{opacity:0}50%{opacity:1}}"));
assert.ok(lire("yggdrasil-elfes-v1.js").includes(".ygg-halo-max::after") && lire("yggdrasil-elfes-v1.js").includes("@keyframes yggBrilleMax{0%,100%{opacity:0}50%{opacity:1}}"));
// Les motifs qui défilent glissent d'une période exacte par transform / translate sur un calque plus large.
assert.ok(lire("ngu-labo-v1.js").includes("@keyframes nlAuroreA{from{translate:0 0}to{translate:1200px 0}}") && lire("ngu-labo-v1.js").includes("@keyframes nlChauves{from{translate:0 0}to{translate:-900px 0}}"));
assert.ok(lire("titans-combat-ecran-v1.js").includes("@keyframes taDefile{from{transform:translateX(0)}to{transform:translateX(220.6756px)}}"));
// 4 périodes de 50 px le long de 115 deg = 4 * 50 / sin(115 deg) en horizontal.
assert.ok(Math.abs(4 * 50 / Math.sin(115 * Math.PI / 180) - 220.6756) < 0.001);
console.log("idle-animations-compositeur-modules-v1: OK");
