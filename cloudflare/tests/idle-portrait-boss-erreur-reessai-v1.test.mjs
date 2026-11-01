import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-01) : après un NUKE le portrait du boss suivant ne s'affichait pas avant un changement de menu. Mécanisme reproduit dans le navigateur : la requête de l'image échoue quand l'adresse
 * change, la balise reste en erreur et les redessins gardent la même adresse. Garde-fou : une erreur de chargement de l'image de l'hôte la fait redemander (1 s puis 5 s), deux fois au plus par adresse.
 */
const code = readFileSync(new URL("../public/modules/apparition-boss-v1.js", import.meta.url), "utf8");

function monde() {
  const minuteries = [];
  const ecouteurs = {};
  const attrs = { src: "/api/idle/media/boss?id=106" };
  const img = {
    tagName: "IMG", isConnected: true, complete: true, naturalWidth: 0,
    getAttribute: (k) => (k in attrs ? attrs[k] : null),
    removeAttribute(k) { delete attrs[k]; journal.push("rm:" + k); },
    setAttribute(k, v) { attrs[k] = v; journal.push("set:" + k + "=" + v); },
    closest: (sel) => (sel === "#sorealIdleBossImageHostV36" ? {} : null),
  };
  const journal = [];
  const window = {
    matchMedia: () => ({ matches: false }),
    setTimeout: (f, d) => { minuteries.push({ f, d }); return minuteries.length; },
  };
  const document = {
    body: null,
    addEventListener(t, f, capture) { (ecouteurs[t] = ecouteurs[t] || []).push({ f, capture }); },
    getElementById: () => null,
  };
  const ctx = vm.createContext({ window, document, setTimeout: window.setTimeout, performance: { now: () => 0 }, console, Math, Number, URL, Boolean, Array });
  vm.runInContext(code, ctx);
  minuteries.length = 0;   // les minuteries de démarrage du module ne comptent pas
  return { window, img, attrs, journal, minuteries, ecouteurs };
}

// 1. l'erreur de chargement est écoutée en capture (l'événement « error » ne remonte pas)
{
  const m = monde();
  assert.ok(m.ecouteurs.error && m.ecouteurs.error.some((e) => e.capture === true), "écouteur d'erreur d'image en capture");
  assert.equal(typeof m.window.__SOREAL_IDLE_APPARITION_BOSS_V1__.retenter, "function");
}

// 2. erreur sur l'image de l'hôte : nouvelle demande de la MÊME adresse après 1 s, puis 5 s, puis plus rien
{
  const m = monde();
  const ecoute = m.ecouteurs.error.find((e) => e.capture).f;
  ecoute({ target: m.img });
  assert.equal(m.minuteries.length, 1);
  assert.equal(m.minuteries[0].d, 1000);
  m.minuteries[0].f();
  assert.deepEqual(m.journal, ["rm:src", "set:src=/api/idle/media/boss?id=106"], "adresse redemandée à l'identique");
  ecoute({ target: m.img });
  assert.equal(m.minuteries[1].d, 5000);
  m.minuteries[1].f();
  ecoute({ target: m.img });
  assert.equal(m.minuteries.length, 2, "jamais de boucle infinie : deux nouvelles tentatives au plus par adresse");
}

// 3. nouvelle adresse (boss suivant) : le compteur repart à zéro
{
  const m = monde();
  const ecoute = m.ecouteurs.error.find((e) => e.capture).f;
  ecoute({ target: m.img }); ecoute({ target: m.img });
  m.attrs.src = "/api/idle/media/boss?id=107";
  ecoute({ target: m.img });
  assert.equal(m.minuteries.length, 3);
  assert.equal(m.minuteries[2].d, 1000);
}

// 4. image revenue entre-temps, adresse changée ou balise partie : on ne touche à rien
{
  const m = monde();
  const ecoute = m.ecouteurs.error.find((e) => e.capture).f;
  ecoute({ target: m.img });
  m.img.naturalWidth = 175;
  m.minuteries[0].f();
  assert.deepEqual(m.journal, [], "image chargée : aucune nouvelle demande");
  m.img.naturalWidth = 0;
  ecoute({ target: m.img });
  m.attrs.src = "/api/idle/media/boss?id=108";
  m.minuteries[1].f();
  assert.deepEqual(m.journal, [], "adresse changée : aucune nouvelle demande");
  m.img.isConnected = false;
  ecoute({ target: m.img });
  m.minuteries[2].f();
  assert.deepEqual(m.journal, [], "balise retirée : aucune nouvelle demande");
}

// 5. une image hors de l'hôte du boss n'est jamais retentée
{
  const m = monde();
  const ecoute = m.ecouteurs.error.find((e) => e.capture).f;
  m.img.closest = () => null;
  ecoute({ target: m.img });
  assert.equal(m.minuteries.length, 0);
}

console.log("idle-portrait-boss-erreur-reessai-v1 OK");
