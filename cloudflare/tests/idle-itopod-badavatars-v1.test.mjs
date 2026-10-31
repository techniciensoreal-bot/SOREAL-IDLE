import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleItopodCleR2V1, IDLE_ITOPOD_BADAVATARS_PREFIX_V1 } from "../src/idle-itopod-roster-v1.js";

/* Personnages aléatoires de l'ITOPOD (badavatars) : reproductibles, jamais de Vetements ni d'Accessoires, barbe possible pour les deux corps, design valide au sens de l'éditeur de SOREAL-TV. */
const fenetre = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-catalogue-v1.js", "utf8"), { window: fenetre });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8"), { window: fenetre, Math, String, Object });
const B = fenetre.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__;
assert.ok(B && typeof B.tirer === "function" && typeof B.rendreHtml === "function");
assert.deepEqual([...B.categoriesTirables].sort(), ["Barbe", "Bouche", "Cheveux", "Nez", "Oreille_Droite", "Oreille_Gauche", "Yeux"]);

/* Règles de validation de SOREAL-TV (cloudflare/src/domains/trophies/badavatar-editeur-rules.js), recopiées. */
const BASE = "shared/badavatars/", BODIES = ["Body_Homme", "Body_Femme"];
const CATEGORIES = ["Vetements", "Cheveux", "Yeux", "Oreilles", "Oreille_Gauche", "Oreille_Droite", "Nez", "Bouche", "Barbe", "Accessoires"];
const EXT = /\.(png|webp|jpe?g)$/i;
function earSide(key) {
  if (typeof key !== "string" || !key.startsWith(BASE + "Oreilles/")) return "";
  const dirs = key.slice((BASE + "Oreilles/").length).split("/").slice(0, -1).map((s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const left = dirs.some((s) => /(^|[_ -])(gauche|left)(?=$|[_ -])/.test(s));
  const right = dirs.some((s) => /(^|[_ -])(droite|droit|right)(?=$|[_ -])/.test(s));
  return left && !right ? "Oreille_Gauche" : right && !left ? "Oreille_Droite" : "";
}
function validAsset(key, category) {
  const oreille = category === "Oreille_Gauche" || category === "Oreille_Droite";
  const prefix = oreille ? BASE + "Oreilles/" : BASE + category + "/";
  return typeof key === "string" && key.startsWith(prefix) && (!oreille || earSide(key) !== "") && key.length < 240 && !key.includes("..") && !key.includes("\\") && !/[?#\u0000-\u001f]/.test(key) && EXT.test(key);
}
function validateDesign(v) {
  if (!v || v.version !== 1 || !BODIES.includes(v.gender) || !validAsset(v.body, v.gender)) return false;
  if (!v.parts || typeof v.parts !== "object" || Array.isArray(v.parts)) return false;
  if (Object.keys(v.parts).some((k) => !CATEGORIES.includes(k))) return false;
  return Object.entries(v.parts).every(([c, p]) => p && validAsset(p.key, c) && ["x", "y", "scale", "rotation"].every((k) => typeof p[k] === "number" && Number.isFinite(p[k])) &&
    Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.scale >= 0.15 && p.scale <= 4 && Math.abs(p.rotation) <= 360 && (p.order === undefined || (Number.isInteger(p.order) && p.order >= 1 && p.order <= 1000000)));
}

const vus = { Body_Homme: 0, Body_Femme: 0 }, barbes = { Body_Homme: 0, Body_Femme: 0 };
for (let i = 1; i <= 400; i++) {
  const d = B.tirer(i);
  assert.equal(JSON.stringify(d), JSON.stringify(B.tirer(i)), "même graine, même personnage");
  assert.ok(validateDesign(d), "design valide, graine " + i);
  assert.ok(!Object.keys(d.parts).some((c) => c === "Vetements" || c === "Accessoires"), "jamais de vêtements ni d'accessoires");
  assert.ok(!/Vetements|Accessoires/.test(JSON.stringify(d)), "aucune clé de Vetements/Accessoires");
  for (const c of ["Cheveux", "Yeux", "Oreille_Gauche", "Oreille_Droite", "Nez", "Bouche"]) assert.ok(d.parts[c], c + " toujours présent");
  vus[d.gender]++;
  if (d.parts.Barbe) barbes[d.gender]++;
}
assert.ok(vus.Body_Homme > 100 && vus.Body_Femme > 100, "les deux corps sortent");
assert.ok(barbes.Body_Homme > 0 && barbes.Body_Femme > 0, "la barbe sort pour les deux corps");
assert.notEqual(JSON.stringify(B.tirer(1)), JSON.stringify(B.tirer(2)));
assert.ok(validateDesign(B.tirer(7, { genre: "Body_Femme", barbe: true })) && B.tirer(7, { genre: "Body_Femme", barbe: true }).parts.Barbe, "une femme à barbe est possible");
assert.ok(!B.tirer(7, { genre: "Body_Homme", barbe: false }).parts.Barbe);

/* Le catalogue ne contient aucune pièce de Vetements / Accessoires. */
assert.ok(!/Vetements|Accessoires/.test(readFileSync("cloudflare/public/modules/itopod-badavatars-catalogue-v1.js", "utf8")));

/* Rendu : une image par pièce, zIndex = order, transformation comme l'éditeur. */
const html = B.rendreHtml(B.tirer(3), { url: (k) => "/x/" + k });
assert.match(html, /translate\(.*%,.*%\) rotate\(.*deg\) scale\(/);
assert.equal((html.match(/<img /g) || []).length, 1 + Object.keys(B.tirer(3).parts).length);

/* Route d'image : les noms avec virgule du dossier badavatars passent, pas les autres dossiers ni les sorties de dossier. */
const k = "idle/badavatars/Body_Homme/Image ChatGPT 13 oct. 2026, 16_38_49-4.webp";
assert.equal(IDLE_ITOPOD_BADAVATARS_PREFIX_V1, "idle/badavatars/");
assert.equal(idleItopodCleR2V1("/assets/" + k, IDLE_ITOPOD_BADAVATARS_PREFIX_V1), k);
assert.match(B.rendreHtml(B.tirer(3)), /key=idle%2Fbadavatars%2F/, "les images viennent de la copie idle/badavatars/");
assert.equal(idleItopodCleR2V1("shared/avatars/a,b.webp", "shared/avatars/"), "", "la virgule reste refusée ailleurs");
assert.equal(idleItopodCleR2V1("idle/badavatars/../x.webp", IDLE_ITOPOD_BADAVATARS_PREFIX_V1), "");
/* Un nom d'équipe = un visage fixe (casse et accents ignorés) ; des noms différents donnent en général des visages différents. */
const noms = ["Norman", "Sébastien", "Justine", "Élodie", "Marc", "Léa", "Thomas", "Camille", "Julien", "Sarah", "Antoine", "Chloé"];
for (const n of noms) {
  assert.equal(JSON.stringify(B.tirerPourNom(n)), JSON.stringify(B.tirerPourNom(n)));
  assert.equal(JSON.stringify(B.tirerPourNom(n)), JSON.stringify(B.tirerPourNom("  " + n.toUpperCase() + " ")), "casse et espaces ignorés");
  assert.ok(validateDesign(B.tirerPourNom(n)));
}
assert.equal(JSON.stringify(B.tirerPourNom("Élodie")), JSON.stringify(B.tirerPourNom("elodie")), "accents ignorés");
assert.ok(new Set(noms.map((n) => JSON.stringify(B.tirerPourNom(n)))).size >= 11, "noms différents, visages différents");
assert.equal(typeof B.versionCatalogue, "number", "catalogue versionné (figé)");

/* Branchement dans la scène de l'ITOPOD et dans index.html. */
const scene = readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8");
assert.ok(scene.includes("tirerPourNom(ennemi.nom)"), "visage fixe pour un nom d'équipe");
assert.ok(scene.includes("B.tirer('k:'"), "sans nom : graine par kills et étage");
assert.ok(scene.includes("data-itp-repli"));
assert.ok(scene.includes("MORPH_ATTRIBUTS_GARDES_V1__") && scene.includes("push('data-itp-repli')"), "attribut de repli gardé par le morph");
assert.ok(scene.includes("avatarGenere(ennemi,kills,etage,ancien)||ancien"), "repli sur l'ancien avatar");
const index = readFileSync("cloudflare/public/index.html", "utf8");
const pos = (s) => index.indexOf(s);
assert.ok(pos("itopod-badavatars-catalogue-v1.js") > 0 && pos("itopod-badavatars-catalogue-v1.js") < pos("itopod-badavatars-v1.js") && pos("itopod-badavatars-v1.js") < pos("itopod-scene-v1.js"), "scripts avant la scène, catalogue d'abord");
assert.ok(readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8").includes(".itp-ennemi[data-itp-repli] .itp-badav{display:none}"));
console.log("idle-itopod-badavatars-v1: ok");
