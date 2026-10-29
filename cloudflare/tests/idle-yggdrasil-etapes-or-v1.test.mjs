import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { choisirEtapesYggR2_, choisirCleYggR2_ } from "../src/idle-media-v1.js";
/* Norman (2026-10-15) : 20 images de croissance pour le fruit d'or, rapportées au tier MAXIMUM (10, ou 24 après trois victoires au Troll). */
const num = (i) => String(i).padStart(2, "0");
const plat = Array.from({ length: 20 }, (_, i) => "idle/yggdrasil/Fruit_of_Gold_" + num(i + 1) + ".png").concat(["idle/yggdrasil/Fruit_of_Gold.png", "idle/yggdrasil/Fruit_of_Luck_01.png", "idle/yggdrasil/Fruit_of_Luck_02.png"]);
const melange = plat.slice().reverse();
const e1 = choisirEtapesYggR2_(melange, "gold");
assert.equal(e1.length, 20); assert.equal(e1[0], "idle/yggdrasil/Fruit_of_Gold_01.png"); assert.equal(e1[19], "idle/yggdrasil/Fruit_of_Gold_20.png");
assert.equal(choisirEtapesYggR2_(melange, "luck").length, 2, "chaque fruit a ses propres images");
assert.equal(choisirEtapesYggR2_(["idle/yggdrasil/Fruit_of_Gold.png"], "gold").length, 0, "une seule image : pas d'étapes");
const dossier = Array.from({ length: 20 }, (_, i) => "idle/yggdrasil/gold/" + (i + 1) + ".webp");
const e2 = choisirEtapesYggR2_(dossier.slice().reverse(), "gold");
assert.equal(e2[0], "idle/yggdrasil/gold/1.webp"); assert.equal(e2[9], "idle/yggdrasil/gold/10.webp"); assert.equal(e2[19], "idle/yggdrasil/gold/20.webp", "tri numérique (10 après 9)");
assert.equal(choisirEtapesYggR2_(["idle/yggdrasil/gold-0.png", "idle/yggdrasil/gold-1.png", "idle/yggdrasil/gold-2.png"], "gold").length, 3);
assert.equal(choisirCleYggR2_(plat, "gold"), "idle/yggdrasil/Fruit_of_Gold.png", "image simple inchangée");
/* Côté page (Norman, 2026-10-29) : le décor est un arbre ; chaque heure de pousse ajoute un fruit sur l'un des 24 emplacements, plus de terre */
const src = fs.readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const debut = src.indexOf("function heuresPousse_"), fin = src.indexOf("function intensiteAura_");
const code = src.slice(debut, src.indexOf("  /*", src.indexOf("function fruitsArbre_"))) ;
const C = vm.runInNewContext(code + "({heuresPousse_,fruitsArbre_,EMPLACEMENTS_,ORDRE_})");
const g = (growth) => ({ growth });
assert.equal(C.EMPLACEMENTS_.length, 24, "24 emplacements, un par heure");
assert.equal(new Set(C.ORDRE_.map((e) => e.join(","))).size, 24, "l'ordre d'apparition les utilise tous, une fois chacun");
assert.equal(C.fruitsArbre_(g(0)).length, 0, "aucun fruit au départ");
assert.equal(C.fruitsArbre_(g(0.5)).length, 1, "le premier fruit commence à pousser tout de suite");
assert.equal(C.fruitsArbre_(g(10)).length, 10, "à 10 h : dix fruits");
assert.equal(C.fruitsArbre_(g(10)).filter((f) => f[2] === 1).length, 10, "à 10 h : dix fruits mûrs");
const f98 = C.fruitsArbre_(g(9 + 50 / 60));
assert.equal(f98.length, 10, "à 9 h 50 : dix fruits");
assert.equal(f98.filter((f) => f[2] === 1).length, 9, "dont neuf mûrs");
assert.ok(Math.abs(f98.find((f) => f[2] < 1)[2] - 50 / 60) < 1e-9, "et un qui pousse (aux 5/6 de sa taille)");
assert.equal(C.fruitsArbre_(g(24)).length, 24, "24 fruits mûrs à la 24e heure");
assert.equal(C.fruitsArbre_(g(24)).filter((f) => f[2] === 1).length, 24);
assert.equal(C.fruitsArbre_(g(30)).length, 24, "jamais plus de 24");
assert.deepEqual(C.fruitsArbre_(g(5.5)).slice(0, 5), C.fruitsArbre_(g(5)).slice(0, 5), "un fruit mûr ne change jamais de place");
for (let h = 0; h < 23.9; h += 0.25) assert.ok(C.fruitsArbre_(g(h + 0.25)).length >= C.fruitsArbre_(g(h)).length, "le nombre de fruits ne baisse jamais");
const R = C.fruitsArbre_(g(24)); for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) assert.ok(Math.abs(R[i][0] - R[j][0]) >= 8 || Math.abs(R[i][1] - R[j][1]) >= 10, "assez de place entre deux fruits (" + i + "," + j + ")");
assert.ok(src.includes("&fruit=1") && src.includes("ygg-fruit") && !src.includes("ygg-terre") && !src.includes("terre=1"), "fruit sur l'arbre, plus de terre");
assert.ok(src.includes("function etapeCroissance_(d,v){return null;}") && !src.includes("ygg-suivante") && !src.includes("fractionSuivante_") && !src.includes("DEBUT_FRUIT_"), "plus d'images intermédiaires");
assert.ok(src.includes("--ygg-x:") && src.includes("--ygg-y:") && src.includes("--ygg-k:"), "position et taille posées sur chaque fruit");
/* Fruits de Puissance : dossier partagé idle/yggdrasil/puissance/ (20 images), les images propres à un fruit passent devant. */
const puissance = Array.from({ length: 20 }, (_, i) => "idle/yggdrasil/puissance/" + (i + 1) + ".webp");
for (const id of ["powerAlpha", "powerBeta", "powerDelta"]) {
  const e = choisirEtapesYggR2_(puissance.slice().reverse().concat(dossier), id);
  assert.equal(e.length, 20, id + " : 20 images du dossier puissance");
  assert.equal(e[0], "idle/yggdrasil/puissance/1.webp"); assert.equal(e[9], "idle/yggdrasil/puissance/10.webp"); assert.equal(e[19], "idle/yggdrasil/puissance/20.webp");
}
assert.equal(choisirEtapesYggR2_(puissance, "gold").length, 0, "le dossier puissance ne sert pas à l'or");
assert.equal(choisirEtapesYggR2_(puissance, "luck").length, 0, "ni aux autres fruits");
const propres = ["idle/yggdrasil/poweralpha/1.png", "idle/yggdrasil/poweralpha/2.png", "idle/yggdrasil/poweralpha/3.png"];
assert.deepEqual(choisirEtapesYggR2_(puissance.concat(propres), "powerAlpha"), propres, "les images propres au fruit passent devant le dossier partagé (jamais mélangées)");
assert.equal(choisirEtapesYggR2_(puissance.concat(propres), "powerBeta").length, 20, "les autres Fruits de Puissance gardent le dossier partagé");
assert.equal(choisirEtapesYggR2_(["idle/yggdrasil/Fruit_of_Power_Alpha.png", "idle/yggdrasil/puissance/1.webp", "idle/yggdrasil/puissance/2.webp"], "powerAlpha").length, 2, "l'image simple du fruit n'entre pas dans les étapes");
console.log("idle-yggdrasil-etapes-or-v1: OK");

const srcY = src;

/* Aura (Norman, 2026-10-29) : plus d'intensité par heure ; chaque fruit MÛR a une aura douce de sa couleur, le fruit qui pousse encore n'en a pas (voir idle-ygg-arbre-fruits-v1) */
assert.ok(!srcY.includes("intensiteAura_"), "plus d'intensité d'aura par heure");
const ids24 = Object.keys(JSON.parse(srcY.match(/var FRUITS_24_=(\{[^}]*\})/)[1].replace(/(\w+):true/g, '"$1":true')));
const auras = JSON.parse(srcY.match(/var AURAS_=(\{[^}]*\})/)[1].replace(/(\w+):'/g, '"$1":"').replace(/'/g, '"'));
for (const id of ids24) assert.ok(/^#[0-9a-f]{6}$/i.test(auras[id]), "couleur d'aura pour " + id);
assert.ok(srcY.includes("ygg-mur") && srcY.includes("--ygg-aura"));
console.log("ok aura des fruits");

console.log("ok fruits sur l'arbre");
