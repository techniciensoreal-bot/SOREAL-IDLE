import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit 2026-09-16 (page wiki réelle vérifiée en direct par Norman,
 * ngu-idle.fandom.com/wiki/The_Lonely_Flubber) : "Flubber drops in
 * Tutorial Zone and the drop chance is based off in CURRENT run's
 * highest defeated boss, starting at 0.82% at boss 59, and increasing
 * by 0.41% every boss after, up to 100% at boss 300... the item drops
 * equally from normal enemies and bosses... This item is NOT affected
 * by drop chance multipliers."
 */
const source = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");

assert.ok(
  source.includes('flubber:{name:"The Lonely Flubber",zone:"tutorial",slot:"accessory",set:"training"'),
  "The Lonely Flubber doit exister dans SPECIALS (zone tutorial, accessoire, set:training pour l'image R2 partagée)."
);
assert.ok(
  source.includes('if(z.id==="tutorial"){const flubberBoss=I(ctx.bosses);if(flubberBoss>=59&&Math.random()<C(.0082+.0041*(flubberBoss-59),0,1))'),
  "La formule exacte du wiki (0.82% dès boss 59, +0.41%/boss) doit être utilisée, jamais un taux approximé."
);
assert.ok(
  !/flubber.*dropMult/.test(source.slice(source.indexOf('if(z.id==="tutorial"){const flubberBoss'), source.indexOf('if(z.id==="tutorial"){const flubberBoss') + 300)),
  "Le drop de Flubber ne doit jamais être multiplié par dropMult (précisé explicitement par le wiki : 'NOT affected by drop chance multipliers')."
);

assert.ok(
  source.includes("set:d.set||\"\""),
  "special() doit recopier le champ set (sinon aucune image réelle n'est jamais tentée côté client pour un Special standalone)."
);

// --- Comportement réel : un tirage gagnant au boss 59 produit bien l'objet ---
{
  const realRandom = Math.random;
  Math.random = () => 0;
  try {
    const s = createIdleAdventureStateV47();
    const afterZone = applyIdleAdventureActionV47(s, { action: "selectZone", zone: "tutorial" }, { bosses: 100 }).state;
    const res = applyIdleAdventureActionV47(afterZone, { action: "zoneKill" }, { bosses: 59 });
    const flubber = (res.state.inventory || []).find((i) => i.definitionId === "flubber");
    assert.ok(flubber, "Un tirage gagnant (Math.random()=0) au boss 59 doit produire The Lonely Flubber dans l'inventaire.");
    assert.equal(flubber.slot, "accessory");
    assert.equal(flubber.set, "training", "Doit partager le dossier R2 du Training Set (SOREAL_IDLE_Tutorial_Set) pour une vraie image.");
  } finally {
    Math.random = realRandom;
  }
}

console.log("idle-flubber-tutorial-drop: OK");
