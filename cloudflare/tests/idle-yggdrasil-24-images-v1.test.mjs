import assert from "node:assert/strict";
import fs from "node:fs";
import { choisirEtapesYggR2_, choisirCleYggR2_ } from "../src/idle-media-v1.js";

/*
 * Norman (2026-10-25) : les 17 fruits sans images de croissance en ont 24, une par heure du tier maximum de 24 h, sur un décor peint en rapport avec leur bonus.
 * R2 : idle/yggdrasil/<id>/<id>_01..24.webp, image simple idle/yggdrasil/<id>.webp, décor idle/ygg-decors/<id>.webp (hors de idle/yggdrasil/).
 */
const num = (i) => String(i).padStart(2, "0");
const ids = ["gold", "powerAlpha", "powerBeta", "powerDelta", "adventure", "knowledge", "pomegranate", "luck", "arbitrariness", "numbers", "rage", "macguffinAlpha", "watermelon", "macguffinBeta", "quirks", "angryMayo", "sadMayo", "moldyMayo", "ayyMayo", "cincoMayo", "prettyMayo"];
const cles = [];
for (const id of ids) {
  for (let i = 1; i <= 24; i++) cles.push(`idle/yggdrasil/${id}/${id}_${num(i)}.webp`);
  cles.push(`idle/yggdrasil/${id}.webp`);
}
/* Les anciennes images de Puissance (partagées, dossier puissance) restent sur R2 mais ne passent plus devant les images propres de chaque fruit. */
for (let i = 1; i <= 20; i++) cles.push("idle/yggdrasil/puissance/" + num(i) + ".webp");

for (const id of ids) {
  const e = choisirEtapesYggR2_(cles.slice().reverse(), id);
  assert.equal(e.length, 24, id + " : 24 images de pousse");
  assert.equal(e[0], `idle/yggdrasil/${id}/${id}_01.webp`);
  assert.equal(e[23], `idle/yggdrasil/${id}/${id}_24.webp`);
  assert.equal(choisirCleYggR2_(cles, id), `idle/yggdrasil/${id}.webp`, id + " : l'image simple n'est pas une étape");
}
assert.equal(choisirEtapesYggR2_(cles, "powerAlpha").length, 24, "Puissance α : ses 24 images propres passent devant le dossier partagé");
assert.equal(choisirEtapesYggR2_(cles, "adventure").every((k) => k.includes("/adventure/")), true, "les images ne se mélangent pas entre fruits");

/* La route : `sur` (défaut 20) met l'étape à l'échelle, `decor=1` sert idle/ygg-decors/ sans passer par la liste des images du fruit. */
const media = fs.readFileSync("cloudflare/src/idle-media-v1.js", "utf8");
assert.ok(media.includes('const sur=surBrut!==null&&/^\\d{1,3}$/.test(surBrut)?Math.max(2,Math.min(100,parseInt(surBrut,10))):20;'), "sur : 20 par défaut");
assert.ok(media.includes("Math.floor(k*(etapes.length-1)/(sur-1))"), "mise à l'échelle sur `sur` étapes");
assert.ok(media.includes('"idle/ygg-decors/"') && media.includes('url.searchParams.get("decor")==="1"'), "décor servi depuis idle/ygg-decors/");

/* La page : 24 images, décor derrière l'image, uniquement pour ces 17 fruits ; &sur=24 envoyé à la route. */
const page = fs.readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const liste = page.match(/var FRUITS_24_=\{([^}]*)\};/)[1].split(",").map((x) => x.split(":")[0].trim());
assert.deepEqual(liste.slice().sort(), ids.slice().sort(), "les 21 fruits aux 24 images");
assert.ok(page.includes("'&sur=24'"), "la page demande les 24 images");
assert.ok(page.includes("&amp;decor=1"), "la page demande le décor");

console.log("idle-yggdrasil-24-images-v1: OK");
