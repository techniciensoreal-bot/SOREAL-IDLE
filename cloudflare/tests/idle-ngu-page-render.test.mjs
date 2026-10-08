import assert from "node:assert/strict";
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
/* La page NGU est celle du laboratoire (modules/ngu-labo-v1.js), appelée par la page générique. */
vm.runInNewContext(readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8"), { window, document: window.document, setInterval: () => 1, clearInterval() {}, performance: { now: () => 5000 } });
vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), { window, document: window.document, SOREAL_SESSION: null });
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
  const html = page({ systemes: snap }, "ngu", "NGU");
  for (const nom of ["Augments", "Wandoos", "Respawn", "Gold", "Adventure α", "Power α", "Drop Chance", "Magic NGU", "PP",
    "Yggdrasil", "EXP", "Power β", "Number", "Time Machine", "Energy NGU", "Adventure β"]) {
    assert.ok(html.includes("NGU " + nom.toUpperCase()), "NGU manquant dans la page : " + nom);
  }
  assert.equal((html.match(/data-nl-ngu="/g) || []).length, 16, "un tuyau par NGU");
  assert.equal((html.match(/__SOREAL_IDLE_NGU_LABO_V1__\.ajuster\(/g) || []).length, 16 * 2, "boutons + et − sur chaque tuyau");
  assert.equal((html.match(/__SOREAL_IDLE_NGU_LABO_V1__\.cible\(/g) || []).length, 16, "un champ Target par tuyau");
  assert.equal((html.match(/__SOREAL_IDLE_NGU_LABO_V1__\.avance\(/g) || []).length, 2, "Advance Energy et Faire suivre la magie");
  assert.ok(html.includes("Vers les NGU de magie") && html.includes("Je fais quoi ?"), "boutons de l'écran d'origine");
  assert.ok(html.includes("data-nl-niv>120<"), "niveau du NGU Power α");
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
  const html = page({ systemes: snap }, "ngu", "NGU");
  assert.equal((html.match(/data-nl-ngu="/g) || []).length, 9, "seulement les 9 NGU d'énergie");
  assert.ok(!/YGGDRASIL|POWER Β|TIME MACHINE|ENERGY NGU|ADVENTURE Β/i.test(html.replace(/POWER Α|ADVENTURE Α/gi, "")), "aucun nom de NGU de magie");
  assert.ok(!html.includes("Vers les NGU de magie") && !html.includes("Faire suivre la magie"), "ni bouton ni case de magie");
}

// Evil : le sélecteur de palier apparaît
{
  state.difficulty = "difficile";
  const snap = idleNguSnapshot(state, context, 1_000_000);
  const html = page({ systemes: snap }, "ngu", "NGU");
  assert.ok(html.includes("setNguTier") && html.includes("Evil"), "palier Evil sélectionnable en difficulté Evil");
}

console.log("idle-ngu-page-render: OK");
