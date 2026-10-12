import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-12) : « quand un menu manque d'or, je voudrais que ce soit plus voyant : il manque 1.59 T (pièce d'or) » ; puis « enlève "barre pleine :" et mets la somme en doré ». */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(ui.includes("'🪙 Il manque <b class=\"or-somme-v1\">'+formatGrandNombreIdleV70_(coutOrB-orLiveB)+' Or</b> pour le prochain rituel.'") && ui.includes("const texteOr='🪙 Il manque <b class=\"or-somme-v1\">'") && meta.includes("?'🪙 Il manque <b class=\"or-somme-v1\">'"), "pièce d'or, « Il manque » et somme en balise dorée dans les trois menus (Blood Magic, Time Machine, Augmentations)");
assert.ok(!ui.includes("Barre pleine : il manque") && !meta.includes("Barre pleine : il manque") && !decor.includes("Barre pleine : il manque"), "plus de « Barre pleine : » devant le message");
assert.ok(!ui.includes("'⏳ Barre pleine : il manque") && ui.includes("function ecrireSiChangeIdleV1_(el,texte){") && ui.includes("el.__orHtmlV1!==texte"), "écriture HTML mémorisée : pas de réécriture à chaque tick");
assert.ok(ui.includes(".soreal-idle-tm-eta-v1').forEach(function(el){") && ui.includes("/il manque .* Or/i"), "la ligne de la Time Machine passe aussi en rouge");
assert.ok(decor.includes("/il manque .* Or/i.test(ligneEta.textContent||'')") && decor.includes("/Barre pleine|validation|il manque .* Or/i"), "le décor de Magie du sang reconnaît le nouveau message (attente d'Or)");
assert.ok(/\.or-somme-v1\.or-somme-v1\{color:#ffd23f!important;font-weight:900/.test(css) && /\.or-non\{color:#ffe1e1!important;font-weight:800;font-size:1\.08em[^}]*border:1\.5px solid rgba\(255,105,105,\.7\)/.test(css), "somme dorée dans une pastille rouge bien visible");
for (const t of ["🪙 Il manque 1,59T Or pour le niveau suivant.", "🪙 Il manque 12 Or pour le prochain rituel."]) assert.ok(/il manque .* Or/i.test(t), "le texte reste reconnu par les autres repères : " + t);
assert.ok(css.includes("button.clear{grid-column:1/-1!important;padding:6px 10px!important}"), "« Tout retirer » prend toute la ligne (téléphone)");
console.log("idle-manque-or-voyant-v1: OK");
