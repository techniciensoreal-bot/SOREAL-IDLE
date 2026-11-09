import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-09) : « le menu Renaissance n'est pas apparu après 3 minutes ; il est apparu quand j'ai cliqué sur un menu ». Le menu n'existe que quand l'état dit renaissance.debloquee, recalculé seulement par une synchro : aucune n'était demandée quand l'horloge du run
 * atteint 180 s. temps-rebirth-v1.js en demande une (au plus toutes les 2,5 s) dès que le boss requis est vaincu, le menu absent et 180 s écoulées.
 */
const src = readFileSync("cloudflare/public/modules/temps-rebirth-v1.js", "utf8");
function monde(renaissance) {
  const appels = [];
  const intervalles = [];
  const horloge = { t: 1_000_000_000_000 };
  const fen = {
    document: { hidden: false, getElementById: () => null },
    setInterval: (f, ms) => intervalles.push([f, ms]),
    Date: { now: () => horloge.t },
    __SOREAL_IDLE_TIME_FORMAT_V1__: { runSecondes: (j) => Math.max(0, (horloge.t - j.renaissance.runDebuteA) / 1000), duree: String },
    __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({ renaissance }) },
    __SOREAL_IDLE_REG__: { synchroniserJeuIdleV7_: (x) => appels.push(x) }
  };
  fen.window = fen;
  vm.runInNewContext(src, fen);
  return { fen, appels, intervalles, horloge, api: fen.__SOREAL_IDLE_TEMPS_REBIRTH_V1__ };
}
const debut = 1_000_000_000_000;
{
  const m = monde({ debloquee: false, aventureRequise: false, runDebuteA: debut - 100_000 });
  assert.equal(m.intervalles.length, 2, "deux minuteries d'une seconde : le chrono et la vérification du menu");
  m.api.menuAttendu();
  assert.equal(m.appels.length, 0, "moins de 180 s : aucune synchro");
  m.horloge.t += 81_000;   // 181 s
  m.api.menuAttendu();
  assert.deepEqual(m.appels, [true], "180 s passées, menu absent : une synchro est demandée");
  m.horloge.t += 1000; m.api.menuAttendu();
  assert.equal(m.appels.length, 1, "pas plus d'une synchro toutes les 2,5 s");
  m.horloge.t += 2000; m.api.menuAttendu();
  assert.equal(m.appels.length, 2, "le moteur n'a pas encore confirmé : on redemande");
}
for (const [nom, r] of [["menu déjà là", { debloquee: true, aventureRequise: false }], ["boss requis pas vaincu", { debloquee: false, aventureRequise: true }]]) {
  const m = monde(Object.assign({ runDebuteA: debut - 500_000 }, r));
  m.api.menuAttendu();
  assert.equal(m.appels.length, 0, nom + " : aucune synchro (anti-spoil : rien n'est demandé tant que le boss n'est pas vaincu)");
}
{
  const m = monde({ debloquee: false, aventureRequise: false, runDebuteA: debut - 500_000 });
  m.fen.document.hidden = true;
  m.api.menuAttendu();
  assert.equal(m.appels.length, 0, "onglet caché : rien");
}
console.log("idle-menu-renaissance-apres-3-min-v1: OK");
