import assert from "node:assert/strict";
import { PAGES_META } from "./_meta-pages.mjs";
import { preparerNgu, monterNgu, htmlNgu } from "./_ngu-vdom.mjs";
import { evenement } from "./_faux-dom-vdom.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Audit NGU 2026-09-23 : la page NGU de l'interface affiche les 16 vrais NGU
 * à partir d'un vrai snapshot serveur (pas d'un jeu de données inventé pour le test).
 */
const MODULE_PATH = "cloudflare/public/modules/meta-progression-v130.js";
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;

const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
/* Page NGU rendue par composants Preact (2026-11-18) : faux DOM, vrai Preact et vrai pont, préparés avant le chargement du module. */
const actionsMeta = [];
window.__actionMetaV47__ = (p) => actionsMeta.push(p);
preparerNgu(window);
/* La page NGU est celle du laboratoire (modules/ngu-labo-v1.js), appelée par la page générique. */
vm.runInNewContext(readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8"), { window, document: window.document, setInterval: () => 1, clearInterval() {}, performance: { now: () => 5000 } });
{
  const bac = { window, document: window.document, SOREAL_SESSION: null };
  vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), bac);
  for (const f of PAGES_META) vm.runInNewContext(readFileSync("cloudflare/public/modules/" + f, "utf8"), bac);
}
const page = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_;

const context = { bosses: 100, bestGold: 1e6, adventurePower: 1e9 };
let state = normalizeIdleNguState({}, context, 1_000_000);

// Verrouillé tant que A Number n'est pas consommé
{
  const snap = idleNguSnapshot(state, context, 1_000_000);
  const html = page({ systemes: snap }, "ngu", "NGU");
  assert.match(html, /Rien à afficher pour le moment/);
  assert.doesNotMatch(html, /🔒|verrouill|A Number|Débloqué/i, "anti-spoil : aucune condition de déblocage");
}

state.adventure.unlockItems.aNumber = true;
state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
state.resources.energy.cap = 1000;
state.resources.energy.current = 1000;
state.resources.energy.power = 1e9;
state = applyIdleNguAction(state, { action: "allocateNgu", ngu: "powerAlpha", value: 500 }, context, 1_000_000).state;
state.systems.ngu.data.ngus.normal.powerAlpha.level = 120;

{
  const snap = idleNguSnapshot(state, context, 1_000_000);
  const html = htmlNgu(window, { systemes: snap });
  for (const nom of ["Augments", "Wandoos", "Respawn", "Gold", "Adventure α", "Power α", "Drop Chance", "Magic NGU", "PP",
    "Yggdrasil", "EXP", "Power β", "Number", "Time Machine", "Energy NGU", "Adventure β"]) {
    assert.ok(html.includes("NGU " + nom.toUpperCase()), "NGU manquant dans la page : " + nom);
  }
  assert.equal((html.match(/<div class="nl-barre[^"]*" data-nl-ngu="/g) || []).length, 16, "un tuyau par NGU");
  /* Boutons et champs branchés (clic -> API du module, relue à l'exécution comme l'ancien onclick) : + − Max et 0 sur chaque tuyau (2026-10-09), un champ Target par tuyau, Advance Energy et Faire suivre la magie. */
  monterNgu(window, { systemes: snap });
  const API = window.__SOREAL_IDLE_NGU_LABO_V1__, doc = window.document;
  const appels = [], reels = { ajuster: API.ajuster, cible: API.cible, avance: API.avance };
  API.ajuster = (id, mode) => appels.push(["ajuster", id, mode]);
  API.cible = (id, v) => appels.push(["cible", id, v]);
  API.avance = (res, coche) => appels.push(["avance", res, coche]);
  const boutons = doc.querySelectorAll(".nl-barre .nl-boutons button");
  assert.equal(boutons.length, 16 * 4, "boutons + − Max et 0 sur chaque tuyau (2026-10-09)");
  boutons.forEach((b) => evenement(b, "click"));
  assert.equal(appels.filter((a) => a[0] === "ajuster").length, 64, "chaque bouton appelle ajuster");
  assert.deepEqual([...new Set(appels.map((a) => a[2]))].sort(), ["max", "moins", "plus", "zero"], "les quatre modes");
  const champs = doc.querySelectorAll(".nl-barre .nl-cible input");
  assert.equal(champs.length, 16, "un champ Target par tuyau");
  champs.forEach((c) => evenement(c, "change"));
  assert.equal(appels.filter((a) => a[0] === "cible").length, 16, "chaque champ Target appelle cible");
  const coches = doc.querySelectorAll(".nl-avance input");
  assert.equal(coches.length, 2, "Advance Energy et Faire suivre la magie");
  coches.forEach((c) => evenement(c, "change"));
  assert.equal(appels.filter((a) => a[0] === "avance").map((a) => a[1]).join(), "energy,magic", "les deux cases appellent avance");
  Object.assign(API, reels);
  assert.ok(html.includes("Vers les NGU de magie") && html.includes("Je fais quoi ?"), "boutons de l'écran d'origine");
  assert.ok(html.includes('data-nl-niv="">120<'), "niveau du NGU Power α");
  assert.ok(html.includes("+600 %"), "Power α niveau 120 : 120 x 5 % = 600 %");
  assert.ok(!html.includes("setNguTier"), "en difficulté Normal, un seul palier : pas de bouton de changement");
  assert.ok(html.includes("Normal"), "le palier courant est indiqué");
  /* Couleurs de la capture de NGU Idle (échantillonnées sur l'image). */
  for (const [id, couleur] of Object.entries({ augments: "#868686", wandoos: "#7a96f5", respawn: "#a6deb9", gold: "#ffffa9", adventureAlpha: "#f2bb6a", powerAlpha: "#ed3e3e", dropChance: "#daf11a", pp: "#cfca15" })) {
    assert.ok(new RegExp('data-nl-ngu="' + id + '"[^>]*--nl-c:' + couleur).test(html), "couleur de " + id);
  }
  assert.ok(/data-nl-ngu="magicNgu"[^>]*--nl-c:#9e19f1/.test(html), "couleur de Magic NGU");
  /* Le tuyau de Power α porte sa progression et son énergie pour le rejeu en direct. */
  assert.ok(/data-nl-ngu="powerAlpha" data-nl-res="energy" data-nl-p="[0-9.e-]+" data-nl-spl="[0-9.e+-]+" data-nl-n="120" data-nl-cible="0"/.test(html), "ancrage de la progression");
}
// Anti-spoil : tant que la magie n'est pas découverte, aucun NGU de magie ni bouton « Vers les NGU de magie »
{
  const snap = idleNguSnapshot(state, context, 1_000_000);
  snap.ngus.magicUnlocked = false;
  const html = htmlNgu(window, { systemes: snap });
  assert.equal((html.match(/<div class="nl-barre[^"]*" data-nl-ngu="/g) || []).length, 9, "seulement les 9 NGU d'énergie");
  assert.ok(!/YGGDRASIL|POWER Β|TIME MACHINE|ENERGY NGU|ADVENTURE Β/i.test(html.replace(/POWER Α|ADVENTURE Α/gi, "")), "aucun nom de NGU de magie");
  assert.ok(!html.includes("Vers les NGU de magie") && !html.includes("Faire suivre la magie"), "ni bouton ni case de magie");
}

// Evil : le sélecteur de palier apparaît
{
  state.difficulty = "difficile";
  const snap = idleNguSnapshot(state, context, 1_000_000);
  const html = htmlNgu(window, { systemes: snap });
  monterNgu(window, { systemes: snap });
  const evil = window.document.querySelectorAll(".nl-paliers button").find((b) => b.textContent === "Evil");
  assert.ok(html.includes("Evil") && evil && !evil.hasAttribute("disabled"), "palier Evil sélectionnable en difficulté Evil");
  evenement(evil, "click");
  assert.equal(JSON.stringify(actionsMeta.pop()), JSON.stringify({ action: "setNguTier", tier: "evil" }), "le bouton Evil envoie setNguTier");
}

console.log("idle-ngu-page-render: OK");
