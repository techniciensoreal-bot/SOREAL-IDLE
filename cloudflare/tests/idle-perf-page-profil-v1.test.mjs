import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Profil d'échantillonnage dans le navigateur, sur la VRAIE partie de Norman (2026-11-06, banc local, 12 actions en 24 s) : deux postes de la page, corrigés ici.
 *  1. boucle de mise à jour (ui-boucle-v1.js) : les éléments ABSENTS de la page étaient recherchés par querySelector à chaque image (le cache ne retenait que les éléments trouvés) : l'absence est retenue 120 ms, oubliée à chaque redessin ;
 *  2. Machine temporelle (machine-dessin-v1.js) : getAnimations() était rappelé sur la zone hors écran à chaque synchro ; seulement après un redessin de la page.
 */
const boucle = fs.readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
const a = boucle.indexOf("function elementAugIdleV1_(selecteur){");
const b = boucle.indexOf("(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=", a);
assert.ok(a > 0 && b > a, "elementAugIdleV1_ trouvée");
function monter() {
  let requetes = 0, maintenant = 0;
  const present = new Set();
  const doc = { querySelector: (s) => { requetes += 1; return present.has(s) ? { isConnected: true, s } : null; } };
  const win = {};
  const f = new Function("window", "document", "performance", boucle.slice(a, b) + "\nreturn elementAugIdleV1_;")(win, doc, { now: () => maintenant });
  return { f, win, present, requetes: () => requetes, avancer: (ms) => { maintenant += ms; } };
}
{
  const m = monter();
  for (let i = 0; i < 100; i += 1) { assert.equal(m.f("[x=1]"), null); m.avancer(1); }
  assert.equal(m.requetes(), 1, "100 recherches d'un élément absent en 100 ms : UNE seule requête au document");
  m.avancer(30);
  m.f("[x=1]");
  assert.equal(m.requetes(), 2, "après 120 ms l'absence est vérifiée de nouveau");
  /* l'élément apparaît (redessin) : retrouvé tout de suite si l'absence a été oubliée */
  m.present.add("[x=1]");
  m.win.__idleAugRateesV1__.clear();   /* ce que fait le crochet « après redessin » */
  const el = m.f("[x=1]");
  assert.ok(el && el.s === "[x=1]", "élément apparu après un redessin : trouvé dans la même tâche");
  const n = m.requetes();
  for (let i = 0; i < 50; i += 1) m.f("[x=1]");
  assert.equal(m.requetes(), n, "un élément trouvé reste en cache (aucune requête)");
}
assert.ok(boucle.includes("window.__idleAugRateesV1__.clear()") && boucle.includes("(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){if(window.__idleAugRateesV1__)"), "l'absence retenue est oubliée à chaque redessin de la page (règle n°4)");

const tm = fs.readFileSync("cloudflare/public/modules/machine-dessin-v1.js", "utf8");
assert.ok(tm.includes("function maj(vueMachine,apresRedessin){") && tm.includes("suivreCentre(racine,apresRedessin);") && tm.includes("}else if(apresRedessin)zonesSuivies.forEach(function(z){if(z.__tmmHors)poserPauseZone(z);});"), "getAnimations() seulement après un redessin");
assert.ok(tm.includes("function rafraichir(){maj(null,true);}"), "le crochet « après redessin » demande la remise en pause");
console.log("idle-perf-page-profil-v1: OK");
