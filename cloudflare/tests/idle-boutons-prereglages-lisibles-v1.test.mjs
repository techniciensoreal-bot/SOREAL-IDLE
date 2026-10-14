import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-14) : « les boutons 1/2, 1/4 ou Input personnalisés ne sont pas très lisibles, sur PC comme sur APP » : plus de 12 px avec contour noir de 1 px. */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const regle = css.split("\n").find((l) => l.includes(".soreal-idle-bt-presets-v120:not(.soreal-idle-bt-total-v1) button{grid-column:span 1!important"));
assert.ok(regle, "règle des boutons de préréglage de la barre d'outils");
const taille = Number((/font-size:(\d+)px!important/.exec(regle) || [])[1]);
assert.ok(taille >= 16, "boutons de préréglage d'au moins 16 px (étaient en 12 px) : " + taille);
assert.ok(regle.includes("-webkit-text-stroke:0!important"), "plus de contour noir qui mange les petites lettres");
assert.ok(/\.soreal-idle-bt-presets-v120 button\{font-size:18px!important[^}]*min-height:46px!important/.test(css), "zone de clic d'au moins 46 px");
assert.ok(/\.soreal-idle-bt-input-box-v120 input\{font-size:20px!important/.test(css), "champ Input plus grand et contrasté");
assert.ok(/\.soreal-idle-bt-presets-v120>span[^{]*\{font-size:16px!important[^}]*color:#dbe6fb!important/.test(css), "libellés plus clairs (Input, Plafond d'énergie, Idle)");
console.log("Boutons de préréglage lisibles: OK");
