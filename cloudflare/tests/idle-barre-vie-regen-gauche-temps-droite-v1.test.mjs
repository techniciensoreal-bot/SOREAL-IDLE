import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-05) : « Je veux la régen de vie à gauche dans la barre de vie. Et à droite, un timer qui dit quand la barre de vie sera pleine. »
 * La VRAIE fonction majHudPvIdleV2_ (ui-menus-v1.js) est extraite et jouée sur un faux DOM : régénération (vert) dans le côté gauche, temps avant « pleine » dans le côté droit (même format court et même ✔ que l'énergie et la magie).
 */
const src = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
const a = src.indexOf("function dureeCourteBandeauIdleV2_(sec){");
const b = src.indexOf("function majHudPvIdleV2_(pv,max,regen){");
const c = src.indexOf("/* Éléments « jumeaux »", b);
assert.ok(a > 0 && b > a && c > b, "fonctions du bandeau trouvées");

function jouer(pv, max, regen) {
  const els = {};
  const el = (id) => (els[id] = els[id] || { id, textContent: "", style: {}, dataset: {}, classList: { toggle() {} } });
  const doc = { getElementById: (id) => el(id) };
  const win = {
    __SOREAL_IDLE_TEXTE_PV_V2__: (p, m) => p + "/" + m,
    __SOREAL_IDLE_TEXTE_REGEN_PV_V2__: (r) => (r > 0 ? "+" + r + "/s" : "")
  };
  const idleNombre_ = (x) => Number(x) || 0;
  const formatGrandNombreIdleV70_ = (n) => String(n);
  const f = new Function("document", "window", "idleNombre_", "formatGrandNombreIdleV70_", src.slice(a, c) + "\nreturn majHudPvIdleV2_;")(doc, win, idleNombre_, formatGrandNombreIdleV70_);
  f(pv, max, regen);
  return { gauche: els.sorealIdleHudGPvV2.textContent, droite: els.sorealIdleHudDPvV2.textContent };
}

let r = jouer(50, 100, 5);
assert.equal(r.gauche, "+5/s", "régénération à GAUCHE");
assert.equal(r.droite, "10s", "à DROITE : (100 - 50) / 5 = 10 s avant que la vie soit pleine");
r = jouer(100, 100, 5);
assert.equal(r.droite, "✔", "vie pleine : ✔ (comme l'énergie)");
r = jouer(40, 100, 0);
assert.equal(r.gauche, "", "aucune régénération : rien à gauche");
assert.equal(r.droite, "", "aucune régénération : pas de temps annoncé");
r = jouer(0, 7200, 1);
assert.equal(r.droite, "2h 0m", "format court : heures et minutes");

/* Couleur : la régénération (côté gauche) est verte ; le temps (côté droit) garde la couleur des autres barres. */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(/\.soreal-idle-hud-pv-v2 \.soreal-idle-hud-lat-v2\.g\{color:#5dff8a!important;/.test(css), "régénération verte à gauche");
assert.ok(!/\.soreal-idle-hud-pv-v2 \.soreal-idle-hud-lat-v2\.d\{color:#5dff8a/.test(css), "plus de vert à droite");
console.log("idle-barre-vie-regen-gauche-temps-droite-v1: OK");
