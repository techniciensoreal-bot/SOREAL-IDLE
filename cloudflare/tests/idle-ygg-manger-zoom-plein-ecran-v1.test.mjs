// Norman (2026-10-29) : en mangeant, tous les fruits disparaissent sauf un, qui vient en zoom plein écran hors cadre puis s'efface en fondu (comme la sorcière et le fantôme Halloween) ; l'autocollant SOREAL est centré sur la bande, de travers.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const y = lire("cloudflare/public/modules/yggdrasil-elfes-v1.js");
assert.ok(y.includes("function zoomFruit_(img,k,rot)") && y.includes("position:fixed;left:'+cx+'px;top:'+cy+'px"), "copie posée sur la page entière");
assert.ok(y.includes("opacity:0}\n      ],{duration:2000") && y.includes("vh*1.3/r.height"), "grandit au-delà de l'écran puis fondu");
assert.ok(y.includes("if(!recolte){for(var z=0;z<imgs.length;z++)") && y.includes("if(img===zoomImg){"), "un seul fruit zoome, seulement en mangeant");
const b = lire("cloudflare/public/modules/ui-combat-2-v1.js");
assert.ok(b.includes("class='bn-autocollant' transform='translate(260 19) rotate(-7)"), "autocollant centré et incliné");
console.log("idle-ygg-manger-zoom-plein-ecran-v1 : OK");
