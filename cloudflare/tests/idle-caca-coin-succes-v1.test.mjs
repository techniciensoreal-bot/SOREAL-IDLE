import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import { idleAchievementV1 } from "../src/idle-achievements-v1.js";
import { IDLE_NGU_META_VERSION, IDLE_NGU_SAVE_SCHEMA, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Succès secret « Clicked the bottom right corner of the Advanced Training menu » (Norman, 2026-10-16) : un petit caca dans le coin en bas à droite de la
 * ligne « Vidage de magie de Wandoos + » ; au clic il grandit en zoom puis s'efface en fondu, et le succès apparaît.
 */
assert.equal(idleAchievementV1("secretAtCorner").tracked, true);
assert.equal(idleAchievementV1("secretAtCorner").bp, 60);

const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
function etat(wandoos) {
  return { version: IDLE_NGU_META_VERSION, saveSchema: IDLE_NGU_SAVE_SCHEMA, systems: { wandoos: { unlocked: wandoos, data: {} } }, currencies: {}, records: {} };
}
// Sans Wandoos : refusé (le caca n'existe pas à l'écran).
assert.throws(() => applyIdleNguAction(etat(false), { action: "cornerClick" }, ctx, Date.now()), /SYSTEME_VERROUILLE/);
// Avec Wandoos : le drapeau est posé et le succès est débloqué au tick suivant.
{
  let s = applyIdleNguAction(etat(true), { action: "cornerClick" }, ctx, Date.now()).state;
  assert.equal(s.records.cornerClicked, 1);
  s = advanceIdleNguState(s, 1, ctx, Date.now());
  assert.ok(s.systems.achievements.data.unlocked.secretAtCorner !== undefined, "succès débloqué");
}

const meta = (readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta());
assert.ok(meta.includes("(id==='wandoosMagic'?cacaCoinHtml_(j):'')"), "le caca n'est que sur la ligne Vidage de magie");
assert.ok(meta.includes("data-morph-classes-gardees=\"^parti$\""), "un redessin n'interrompt pas l'animation");
assert.ok(meta.includes("sorealAtCacaPartiV1{0%{transform:scale(1);opacity:0}8%{opacity:1}100%{transform:scale(14);opacity:0}}"), "zoom puis fondu, fondu d'entrée/sortie");
assert.ok(meta.includes("prefers-reduced-motion:reduce"), "mouvement réduit");
assert.ok(meta.includes("f({action:'cornerClick'})"));
assert.ok(/x\.id==='secretAtCorner'&&x\.unlocked/.test(meta), "disparu une fois le succès obtenu");
console.log("idle-caca-coin-succes-v1: OK");
{
  const src = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
  assert.ok(src.includes('a.id === "secretBeardsMenu" || a.id === "secretAtCorner"'), "trophée caché : son objectif n'est jamais dit avant qu'il soit obtenu");
}
