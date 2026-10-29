// Norman (2026-10-29) : « le son de la mort du boss et celui de l'apparition du suivant sont identiques, bien souvent » : les cinq nouvelles morts de boss n'avertissaient pas l'apparition (comme le fait l'écran de victoire classique) : l'apparition du boss suivant partait
// pendant la mort, puis une seconde fois à la fin. Désormais la mort a la main (VICTOIRE_EN_COURS + annuler) et lance l'apparition une seule fois.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/morts-boss-nouvelles-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("if(A0&&A0.annuler)A0.annuler();") && s.includes("window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=true;"), "la mort annule une apparition lancée et garde la main");
assert.equal(s.split("window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=false;").length - 1, 2, "la main est rendue à la fin ET si le calque disparaît");
const i = s.indexOf("function terminer()"), j = s.indexOf("jouerApres", i);
assert.ok(i > 0 && j > i && s.slice(i, j).includes("window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=false;"), "le drapeau est levé AVANT de lancer l'apparition (sinon elle serait ignorée)");
const app = fs.readFileSync("cloudflare/public/modules/apparition-boss-v1.js", "utf8");
assert.ok(app.includes("if(window.__SOREAL_IDLE_VICTOIRE_EN_COURS__){return;}"), "l'observateur d'images ignore le changement de boss pendant une mort");
console.log("idle-mort-boss-apparition-unique-v1 : OK");

// une mort ou une victoire déjà en cours n'est jamais doublée par une seconde animation (audit 2026-10-29)
{
  const fs2 = await import("node:fs");
  const u = fs2.readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
  assert.ok(u.includes("if(window.__SOREAL_IDLE_VICTOIRE_EN_COURS__&&memeBoss&&debutCombatV1)victoireArcadeIdleV1=true;"), "pas de seconde mort par-dessus une victoire en cours");
}
