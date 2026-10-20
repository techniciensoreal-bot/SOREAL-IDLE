import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-20) : « ma vie est passée de 1.19Tg à 1.20Tg et est revenue à 1.19 une fraction de seconde ». Cause : l'entraînement local déduisait défense et vie max des multiplicateurs de combat AVANT leur
   mise à jour par la trajectoire ; après une réponse du moteur (multiplicateurs en retard de 0,1 à 0,3 s), la vie max retombait une image. Garde : la trajectoire passe D'ABORD, dans le tick et au remplacement de l'état. */
const boucle = readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
const iEntrainement = boucle.indexOf("        progresserBasicTrainingLocalIdleV120_(");
const iAvant = boucle.lastIndexOf("appliquerTrajectoireStatsIdleV1_();", iEntrainement);
assert.ok(iEntrainement > 0 && iAvant > 0 && iEntrainement - iAvant < 1200, "la trajectoire est appliquée juste avant l'entraînement local dans le tick");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const iSetter = ui.indexOf("Object.defineProperty(UI_PARTAGE_V1,'idleEtat'");
const bloc = ui.slice(iSetter, ui.indexOf("configurable:true});", iSetter));
assert.ok(bloc.indexOf("idleEtat=v;") > 0 && bloc.indexOf("UI_PARTAGE_V1.appliquerTrajectoireStatsIdleV1_()") > bloc.indexOf("idleEtat=v;"), "au remplacement de l'état, la trajectoire est appliquée tout de suite après");
console.log("idle-vie-sans-recul-trajectoire-v1: OK");
