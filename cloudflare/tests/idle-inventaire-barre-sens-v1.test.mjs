import assert from "node:assert/strict";
import fs from "node:fs";
const m = fs.readFileSync(new URL("../public/modules/inventaire-volet-v1.js", import.meta.url), "utf8");
/* Norman (2026-10-15) : le repère de la barre à côté de l'inventaire suit le doigt (glisser vers le bas = le repère descend) */
assert.ok(m.includes("function surLaBarre(ev,c)") && m.includes("var railGeste=null;"), "geste sur la barre");
assert.ok(/addEventListener\('touchmove',function\(ev\)\{\s*if\(!railGeste/.test(m) && m.includes("{passive:false,capture:true}"), "touchmove non passif : annule le défilement natif (qui allait en sens inverse)");
assert.ok(m.includes("railGeste.s0+dy*railGeste.ratio"), "la page suit le doigt dans le même sens que le repère (proportionnel)");
assert.ok(m.includes("ratio:m.total/Math.max(1,m.barre-86)"), "même course que le repère (hauteur de la barre moins 86 px)");
/* le repère ne change pas : défilement vers le bas = repère vers le bas */
assert.ok(m.includes("var prog=Math.max(0,Math.min(1,(hb+8-r.top)/total));"), "avancement du repère inchangé");
console.log("idle-inventaire-barre-sens-v1: OK");
