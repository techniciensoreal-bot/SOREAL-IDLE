import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Page Wishes de l'interface : un encart par slot (souhait, progression,
 * allocation 0/25/50/100 % par ressource), rendu depuis un vrai snapshot
 * serveur (j.systemes.wishSlots).
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
vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), { window, document: window.document, SOREAL_SESSION: null });
const page = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_;

const ctx = { bosses: 300 };
const act = (s, payload) => applyIdleNguAction(s, payload, ctx, 1_000_000).state;

// Verrouillé
{
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 1_000_000);
  const html = page({ systemes: idleNguSnapshot(s, ctx, 1_000_000) }, "wishes", "Wishes");
  assert.match(html, /Severed Unicorn/);
  assert.ok(!html.includes("allocateWishSlot"));
}

let s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 1_000_000);
s.systems.wishes.unlocked = true;
s.systems.hacks.unlocked = true;
s.systems.bloodMagic.unlocked = true;
s.systems.quirks.data.levels = { 56: 1 };
for (const k of ["energy", "magic", "r3"]) { s.resources[k].cap = 1000; s.resources[k].current = 1000; }
s = act(s, { action: "setWishSlot", slot: 0, wish: "1" });
s = act(s, { action: "setWishSlot", slot: 1, wish: "9" });
for (const k of ["energy", "magic", "r3"]) s = act(s, { action: "allocateWishSlot", slot: 0, resource: k, value: 100 });

{
  const html = page({ systemes: idleNguSnapshot(s, ctx, 1_000_000) }, "wishes", "Wishes");
  assert.ok(html.includes("Slots débloqués<b>2 / 4</b>"));
  assert.equal((html.match(/🔒 Slot \d/g) || []).length, 2, "slots 3 et 4 verrouillés");
  assert.equal((html.match(/action:'setWishSlot'/g) || []).length, 2, "un sélecteur par slot débloqué");
  assert.equal((html.match(/action:'allocateWishSlot'/g) || []).length, 2 * 3 * 4, "4 boutons par ressource et par slot");
  assert.ok(html.includes("Slot 1 · I Wish that wishes weren't so slow :c"));
  assert.ok(html.includes("Slot 2 · I wish I had more Energy Power I"));
  assert.ok(html.includes("Niveau suivant dans"), "le slot 1 a les trois ressources : durée affichée");
  assert.ok(html.includes("Alloue de l'Énergie, de la Magie ET de la Ressource 3"), "le slot 2 n'a rien d'alloué");
  // Le slot 2 ne propose pas le souhait déjà placé dans le slot 1.
  const selects = html.split("<select").slice(1);
  assert.ok(selects[0].includes('<option value="1" selected>'));
  assert.ok(!selects[1].includes('<option value="1"'), "souhait déjà dans un autre slot");
  // 100 % du slot 2 = cap - 100 (déjà alloué au slot 1).
  assert.ok(html.includes("action:'allocateWishSlot',slot:1,resource:'energy',value:900"));
  assert.ok(html.includes("Tous les souhaits (229)"), "231 souhaits moins Dual Wielding I et II, qui exigent les Troll Challenges Evil 4 et 6 (page Wishes)");
}

console.log("idle-wish-slots-page-render: OK");
