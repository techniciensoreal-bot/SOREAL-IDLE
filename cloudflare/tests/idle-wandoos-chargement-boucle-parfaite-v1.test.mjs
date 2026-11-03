/* Norman (2026-11-03) : « la barre de chargement de Wandoos (orange) : les lignes à l'intérieur font des sauts ».
   Cause mesurée : le poste entier était remplacé (outerHTML) à chaque synchro (4 s) car la largeur et les chiffres du chargement figuraient dans la signature : l'animation des rayures repartait de zéro.
   Garde : (1) boucle parfaite (règle n°3) : tuile = exactement une période horizontale du motif (1 em / sin 45° = √2 em), déplacement = cette tuile, reduced-motion ; (2) la signature ignore la largeur et les chiffres, et ils sont remis EN PLACE. */
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8").replace(/\r\n/g, "\n");
const m = /\.wd-chargeur i\{([^}]*)\}/.exec(s);
assert.ok(m, "règle .wd-chargeur i");
const r = m[1];
assert.ok(/repeating-linear-gradient\(135deg,#ffb000 0 \.5em,#6b4500 \.5em 1em\)/.test(r), "motif : période 1 em le long du dégradé à 135 deg");
const p = /--p:([0-9.]+)em/.exec(r);
assert.ok(p && Math.abs(parseFloat(p[1]) - Math.SQRT2) < 1e-7, "--p = √2 em (période horizontale exacte du motif à 45 deg), pas une valeur arrondie");
assert.ok(r.includes("background-size:var(--p) 100%"), "taille de tuile = une période");
assert.ok(s.includes("@keyframes wd-defile{from{background-position:0 0}to{background-position:var(--p) 0}}"), "le glissement vaut exactement une période");
assert.ok(s.includes("prefers-reduced-motion:reduce){.wd-chargeur i{animation:none;}"), "reduced-motion coupe l'animation");
assert.ok(s.includes(".replace(/(id=\"wd-ch-fill\" style=\"width:)[^\"]*/,'$1')") && s.includes("wd-ch-(?:pct|vit|reste)"), "la signature du poste ignore la largeur et les chiffres du chargement");
assert.ok(/function majChargementEnPlace_\(neuves\)\{[\s\S]*?f\.style\.width=nf\.style\.width[\s\S]*?textContent=n\.textContent/.test(s), "largeur et chiffres remis en place");
assert.ok(/if\(nouvelles\.length===actuelles\.length\)\{\s*majChargementEnPlace_\(neuves\);/.test(s), "la remise en place est appelée quand le poste est conservé");
console.log("idle-wandoos-chargement-boucle-parfaite-v1 : OK");
