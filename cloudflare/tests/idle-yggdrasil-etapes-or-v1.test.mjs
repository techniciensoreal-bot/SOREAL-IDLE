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
/* Côté page : image d'après la croissance / tier maximum */
const src = fs.readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const m = src.match(/function etapeCroissance_\(d,v\)\{[\s\S]*?\n  \}/);
const table = src.match(/var ETAPES_FRUITS_={[^}]*};/)[0] + src.match(/var FRUITS_24_={[^}]*};/)[0] + src.match(/function nbEtapes_\(id\)\{[^\n]*\n/)[0] + src.match(/var DEBUT_FRUIT_=3;/)[0];
const etape = vm.runInNewContext(table + "(" + m[0].replace("function etapeCroissance_", "function") + ")");
const v = (tier, growth, id = "gold") => ({ def: { id }, tier, growth });
assert.equal(etape({ maxTier: 24 }, v(0, 0)), null, "fruit non débloqué : image de départ");
assert.equal(etape({ maxTier: 24 }, v(4, 0.5)), 0, "moins d'une heure : la terre seule");
assert.equal(etape({ maxTier: 24 }, v(4, 1)), 3, "une heure : le fruit se voit déjà un tout petit peu (image 4)");
assert.equal(etape({ maxTier: 24 }, v(4, 4)), 5, "4 h : quelques images de fruit seulement");
assert.equal(etape({ maxTier: 24 }, v(24, 23.9)), 22, "presque au bout : pas la dernière");
assert.equal(etape({ maxTier: 24 }, v(24, 24)), 23, "tier max et poussé : dernière image (24 images)");
assert.equal(etape({ maxTier: 24 }, v(10, 10)), 10, "tier 10 sur 24 entièrement poussé : image 11, jamais la dernière");
assert.equal(etape({ maxTier: 10 }, v(10, 10)), 12, "maximum 10 : 10 images de fruit (image 13), jamais la 24e");
assert.equal(etape({ maxTier: 10 }, v(10, 9.5)), 11, "maximum 10 : 10 images de fruit seulement");
assert.equal(etape({ maxTier: 10 }, v(10, 1)), 3, "maximum 10, une heure : le fruit se voit déjà");
assert.equal(etape({ maxTier: 24 }, v(5, 5, "fruit-inconnu")), null, "un fruit sans images de croissance garde son image unique");
/* Les 17 autres fruits ont 24 images (une par heure du tier maximum de 24 h) : la dernière n'apparait que fruit au tier maximum ET entièrement poussé. */
assert.equal(etape({ maxTier: 24 }, v(0, 0, "luck")), null, "fruit non débloqué : image de départ");
assert.equal(etape({ maxTier: 24 }, v(24, 0, "luck")), 0, "24 images : la première au début de la pousse");
assert.equal(etape({ maxTier: 24 }, v(24, 12, "luck")), 12, "24 images : à mi-chemin");
assert.equal(etape({ maxTier: 24 }, v(24, 23.9, "luck")), 22, "24 images : pas la dernière avant la fin");
assert.equal(etape({ maxTier: 24 }, v(24, 24, "luck")), 23, "24 images : la dernière, mûr");
assert.equal(etape({ maxTier: 10 }, v(10, 10, "prettyMayo")), 12, "maximum 10 : 10 images de fruit seulement, la 24e reste pour le maximum de 24 h");
for (const id of ["powerAlpha", "powerBeta", "powerDelta"]) {
  assert.equal(etape({ maxTier: 24 }, v(24, 24, id)), 23, id + " : mêmes règles que l'or (tier max et poussé : dernière image)");
  assert.equal(etape({ maxTier: 24 }, v(4, 4, id)), 5, id + " : avance avec la croissance rapportée au tier maximum");
  assert.equal(etape({ maxTier: 24 }, v(0, 0, id)), null, id + " : non débloqué : image de départ");
}
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
assert.ok(src.includes("'&etape='+etape") && src.includes("etapeCroissance_(d,v)"), "étape envoyée à la route des images");
console.log("idle-yggdrasil-etapes-or-v1: OK");

/* La motte grandit avec le fruit (Norman, 2026-10-26) : l'image est mise à l'échelle, petite au début, pleine taille à maturité */
const srcY = fs.readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const ech = vm.runInNewContext("(" + srcY.match(/function echelleImage_\(d,v\)\{[\s\S]*?\n  \}/)[0].replace("function echelleImage_", "function") + ")");
assert.equal(ech({ maxTier: 10 }, { growth: 0 }), "0.500", "toute petite au début");
assert.equal(ech({ maxTier: 10 }, { growth: 10 }), "1.000", "pleine taille à maturité");
assert.ok(Number(ech({ maxTier: 24 }, { growth: 6 })) > 0.5 && Number(ech({ maxTier: 24 }, { growth: 6 })) < 1, "elle grandit avec le fruit");
assert.ok(srcY.includes("transform:scale(var(--ygg-echelle,1))") && srcY.includes("--ygg-echelle:"), "échelle appliquée à l'image du fruit");
console.log("ok motte qui grandit");
