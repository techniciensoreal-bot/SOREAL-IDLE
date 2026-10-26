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
/* Côté page : DEUX couches indépendantes (terre unique + fruit sans terre), toutes deux sur les heures réelles de pousse (échelle de 24 h) */
const src = fs.readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const fonctions = ["heuresPousse_", "echelleTerre_", "echelleFruit_"].map((n) => src.match(new RegExp("function " + n + "\\(v\\)\\{[^\\n]*\\n"))[0]).join("");
const C = vm.runInNewContext(fonctions + "({heuresPousse_,echelleTerre_,echelleFruit_})");
const g = (growth) => ({ growth });
assert.equal(C.echelleTerre_(g(0)), "0.140", "la terre commence minuscule");
assert.equal(C.echelleTerre_(g(24)), "1.000", "pleine taille à la 24e heure");
assert.equal(C.echelleFruit_(g(0)), "0.000"); assert.equal(C.echelleFruit_(g(0.99)), "0.000", "pas de fruit pendant la première heure");
assert.equal(C.echelleFruit_(g(1)), "0.050", "un tout petit fruit après une heure complète");
assert.equal(C.echelleFruit_(g(24)), "1.000", "pleine taille à la 24e heure");
for (let h = 1; h < 24; h += 0.5) assert.ok(Number(C.echelleFruit_(g(h + 0.5))) > Number(C.echelleFruit_(g(h))), "le fruit grossit à chaque instant (" + h + " h)");
for (let h = 0; h < 22; h += 0.5) assert.ok(Number(C.echelleTerre_(g(h + 0.5))) > Number(C.echelleTerre_(g(h))), "la terre grossit à chaque instant (" + h + " h)");
/* pas la même courbe : la terre grossit d'abord vite, le fruit d'abord lentement */
assert.ok(Number(C.echelleTerre_(g(6))) > 0.5 && Number(C.echelleFruit_(g(6))) < 0.25, "la terre est déjà grosse quand le fruit est encore petit");
assert.equal(C.echelleTerre_(g(5)), C.echelleTerre_({ growth: 5, maxTier: 24 }), "calculées sur les heures réelles, jamais sur le temps maximum débloqué");
assert.equal(C.echelleFruit_(g(30)), "1.000", "jamais plus que la taille pleine");
assert.ok(src.includes("/api/idle/media/ygg?name=terre&terre=1") && src.includes("&fruit=1") && src.includes("ygg-terre") && src.includes("ygg-fruit"), "deux images : terre et fruit");
assert.ok(src.includes("function etapeCroissance_(d,v){return null;}") && !src.includes("ygg-suivante") && !src.includes("fractionSuivante_") && !src.includes("DEBUT_FRUIT_"), "plus d'images intermédiaires");
assert.ok(src.includes("--ygg-s:") && src.includes("--ygg-f:") && src.includes("var(--ygg-f,1)") && !src.includes("transform:scale(var(--ygg-"), "tailles par largeur/hauteur (jamais un transform animé, flou)");
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

/* Aura du fruit : de la couleur du fruit, après la 12e heure, de plus en plus forte, la 24e heure beaucoup plus prononcée */
const intens = vm.runInNewContext("(" + srcY.match(/function intensiteAura_\(v\)\{[\s\S]*?\n  \}/)[0].replace("function intensiteAura_", "function") + ")");
assert.equal(intens({ growth: 0 }), 0); assert.equal(intens({ growth: 12 }), 0, "pas d'aura jusqu'à la 12e heure comprise");
assert.ok(intens({ growth: 12.5 }) > 0 && intens({ growth: 12.5 }) < 0.15, "faible au début");
assert.ok(intens({ growth: 18 }) > intens({ growth: 13 }) && intens({ growth: 23 }) > intens({ growth: 18 }), "de plus en plus forte");
assert.equal(intens({ growth: 24 }), 1, "24e heure : maximum");
assert.ok(intens({ growth: 24 }) - intens({ growth: 23 }) > 3 * (intens({ growth: 23 }) - intens({ growth: 22 })), "la dernière heure est bien plus marquée que les autres");
assert.equal(intens({ growth: 10 }), 0, "un fruit limité à 10 h n'a jamais d'aura");
const ids24 = Object.keys(JSON.parse(srcY.match(/var FRUITS_24_=(\{[^}]*\})/)[1].replace(/(\w+):true/g, '"$1":true')));
const auras = JSON.parse(srcY.match(/var AURAS_=(\{[^}]*\})/)[1].replace(/(\w+):'/g, '"$1":"').replace(/'/g, '"'));
for (const id of ids24) assert.ok(/^#[0-9a-f]{6}$/i.test(auras[id]), "couleur d'aura pour " + id);
assert.ok(srcY.includes("ygg-aura") && srcY.includes("--ygg-aura-a"));
console.log("ok aura des fruits");

console.log("ok deux couches");
