// Norman (2026-10-29) : « sur téléphone, le cadre TEMPS coupe l'heure » : à 6 cases sur 375 px, la tuile Temps montrait « 01:58:… » ; l'heure rétrécit avec l'écran et n'est plus coupée.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const css = fs.readFileSync(path.join(DEPOT, "cloudflare/public/soreal-idle-themes.css"), "utf8").replace(/\r\n/g, "\n");
const debut = css.indexOf('@media (max-width:700px){\n  body.soreal-idle-active-v47 .soreal-idle-native-v4 .soreal-idle-hud-v2 .soreal-idle-summary-grid-v28 .soreal-idle-summary-v28[data-tuile="rebirth"]');
assert.ok(debut > 0, "règle téléphone de la tuile Temps présente");
const bloc = css.slice(debut, css.indexOf("/* Cadres des données plus carrés", debut));
assert.ok(bloc.startsWith("@media (max-width:700px)"), "téléphone seulement");
assert.ok(bloc.includes("--tp:1px;--tf:clamp(8px,2.65vw,12px)"), "l'heure rétrécit avec l'écran, marges latérales réduites");
assert.ok(bloc.includes('[data-tuile="rebirth"] b{letter-spacing:-.03em;text-overflow:clip}'), "sans espacement ni « … »");
/* la règle générale lit ces variables (aucun nouvel !important : le plafond CSS ne monte pas) */
const generale = css.indexOf("padding:3px var(--tp,4px)!important");
assert.ok(generale > 0 && css.includes(".soreal-idle-summary-v28 b{display:block;font-size:var(--tf,13px)!important"), "la règle générale lit --tp et --tf");
console.log("idle-tuile-temps-telephone-v1 : OK");
