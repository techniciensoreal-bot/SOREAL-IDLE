import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-25) : « le fond d'écran d'Énigmes s'écrase quand on enlève le plein écran ». Un redessin de la page retire les styles posés en ligne sur le décor ; la mesure ne doit donc JAMAIS être mémorisée à part : on compare avec les styles réellement posés. */
const src = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(!src.includes("__scvCle"), "aucune mesure mémorisée en dehors de l'élément");
assert.ok(src.includes("d.style.width!==wd||d.style.height!==Math.round(DECOR_IMG.h*s)+'px'"), "comparaison avec les styles réels du décor");
assert.ok(src.includes("bas.style.top!==hb"), "position de l'avancement relue à chaque passage");
console.log("idle-scummvm-decor-redessin-v1: OK");
