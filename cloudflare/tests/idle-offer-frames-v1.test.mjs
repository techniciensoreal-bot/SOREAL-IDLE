import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-09-25) : « j'aime bien les étiquettes des Offres débutant (traits interrompus) : pareil pour tout ce que le jeu offre — Special Prize, etc. » */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

const bloc = css.slice(css.indexOf(".soreal-idle-offre-v1{"));
assert.ok(bloc.includes("border:2px dashed rgba(245,196,81,.4)"), "même contour en pointillés dorés que les Offres débutant");
assert.ok(meta.includes("border:2px dashed rgba(245,196,81,.4)"), "référence : Offres débutant du EXP Shop inchangées");

const prix = ui.slice(ui.indexOf("function carteSpecialPrizeIdleV1_(){"), ui.indexOf("function idleInfoOuvertV1_(){"));
assert.ok(prix.includes('class="soreal-idle-offre-v1"') && prix.includes("🎁 Special Prize"), "Special Prize dans le cadre offre");
assert.ok(prix.includes("soreal-idle-offre-bouton-v1") && prix.includes("Offre unique"));
assert.ok(prix.includes("Un JOLI CHATON + ") && prix.includes("choice:"+String.fromCharCode(92)+"'ap") && prix.includes("choice:"+String.fromCharCode(92)+"'kitty"), "les deux choix sont conservés");
assert.ok(meta.includes('<div class="soreal-idle-offre-v1">') && meta.includes("🎁 TON PRIX"), "prix du Daily Spin dans le cadre offre");

console.log("idle-offer-frames-v1 OK");
