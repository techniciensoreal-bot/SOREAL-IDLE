import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleNguRebirthTimeFactor } from "../src/idle-ngu-progression.js";

/* Norman (2026-09-26) : le panneau Rebirth suit l'horloge du run (NGU : facteur 0,3781 à 45:22 ; SOREAL affichait 0,376, valeur du dernier rafraîchissement). */
const src = readFileSync("cloudflare/public/modules/rebirth-live-v1.js", "utf8");

function charger(etat, dom) {
  const fenetre = {
    __SOREAL_IDLE_LIRE_ETAT_V1__: () => etat,
    __SOREAL_IDLE_TIME_FORMAT_V1__: { runSecondes: (j, now) => (Number(now ?? Date.now()) - Number(j.renaissance.runDebuteA)) / 1000 },
    __SOREAL_IDLE_NUMBER_FORMAT_V1__: { grandNombre: (v, d) => (d ? Number(v).toFixed(d) : String(Math.round(Number(v)))) }
  };
  vm.runInNewContext(src, { window: fenetre, document: dom, setInterval() {} });
  return fenetre.__SOREAL_IDLE_REBIRTH_LIVE_V1__;
}

// 1. Même formule que le serveur, sur toute la plage (paliers du wiki compris)
{
  const api = charger({}, {});
  for (const s of [10, 119, 120, 179, 180, 239, 240, 299, 300, 419, 420, 599, 600, 719, 720, 899, 900, 1799, 1800, 2722, 3599, 3600, 7200, 86400, 1209600]) {
    const a = api.facteurTemps(s), b = idleNguRebirthTimeFactor(s);
    assert.ok(Math.abs(a - b) <= Math.abs(b) * 1e-12, s + " s : " + a + " vs " + b);
  }
  // le point de la capture NGU : 45:22 -> 0,37806 (NGU 0,37810 quelques dixièmes plus tard)
  assert.ok(Math.abs(api.facteurTemps(45 * 60 + 22) - 0.378056) < 1e-5);
}

// 2. Le panneau est réécrit avec le facteur du moment, le NUMBER et la Variation en proportion
{
  const cellules = {};
  const cree = (libelle, texte) => {
    const valeur = { textContent: texte };
    const carte = { querySelector: () => valeur };
    cellules[libelle] = valeur;
    return { textContent: libelle, parentElement: carte };
  };
  const labels = [cree("NUMBER au Rebirth", "48"), cree("Variation", "×48.087"), cree("Rebirth Time Factor", "×0.376")];
  const bloc = { querySelectorAll: () => labels };
  const dom = { getElementById: (id) => (id === "sorealIdleBlocRenaissanceV27" ? bloc : null) };
  const debut = Date.now() - (45 * 60 + 22) * 1000;
  const etat = { renaissance: { runDebuteA: debut }, systemes: { rebirth: { number: 1, nextNumber: 48.087, preview: { currentTimeFactor: 0.37568 } } } };
  charger(etat, dom).maj();
  assert.ok(Math.abs(Number(cellules["Rebirth Time Factor"].textContent.slice(1)) - 0.378) < 0.001);
  assert.equal(cellules["NUMBER au Rebirth"].textContent, "48");
  assert.ok(Math.abs(Number(cellules["Variation"].textContent.slice(1)) - 48.39) < 0.05);
}
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/rebirth-live-v1.js?v=1"));
console.log("idle-rebirth-live-v1: OK");
