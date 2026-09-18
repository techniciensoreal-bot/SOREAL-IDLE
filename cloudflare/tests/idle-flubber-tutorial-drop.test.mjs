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
    assert.equal(
      flubber.level, 10,
      "Doit tomber au niveau 10 (wiki : 'Item Drop Level / Drop Zone(s): lvl 10 in Tutorial Zone'), jamais niveau 0."
    );
  } finally {
    Math.random = realRandom;
  }
}

assert.ok(
  source.includes('flubber:{name:"The Lonely Flubber",zone:"tutorial",slot:"accessory",set:"training",dropLevel:10,p:0,t:0,customDropRoll:true}'),
  "flubber doit porter customDropRoll:true pour être exclu du pool générique 4% (candidates plus bas), et dropLevel:10 (wiki : 'lvl 10 in Tutorial Zone')."
);
assert.ok(
  source.includes("!d.bossOnly&&!d.customDropRoll&&I(ctx.bosses)>=I(d.requiresBoss)"),
  "Le filtre du pool générique (candidates) doit exclure les SPECIALS customDropRoll, pas seulement bossOnly -- sinon un objet avec sa propre formule dédiée (ex. flubber) reste EN PLUS éligible au pool générique, cumulant les deux et tombant bien avant son vrai seuil."
);

/*
 * Correctif 2026-09-18 (Norman, en direct : "le drop était beaucoup trop
 * élevé") : avant ce correctif, flubber n'étant ni bossOnly ni doté d'un
 * requiresBoss, il restait éligible au pool générique ~4% (candidates)
 * EN PLUS de son roll dédié -- il pouvait donc tomber dès le tout premier
 * kill de la Tutorial Zone, bien avant le seuil réel du boss 59. Avec
 * Math.random() toujours gagnant et bosses=0 (aucun boss vaincu, très en
 * dessous du seuil 59), aucun flubber ne doit désormais apparaître --
 * seul le pool générique pourrait autrement le produire à ce stade.
 */
{
  const realRandom = Math.random;
  Math.random = () => 0;
  try {
    const s = createIdleAdventureStateV47();
    const afterZone = applyIdleAdventureActionV47(s, { action: "selectZone", zone: "tutorial" }, { bosses: 100 }).state;
    // bosses:4 -- le minimum réel pour débloquer la Tutorial Zone (boss:4 dans IDLE_ADVENTURE_ZONES), largement sous le seuil 59 du flubber.
    const res = applyIdleAdventureActionV47(afterZone, { action: "zoneKill" }, { bosses: 4 });
    const flubber = (res.state.inventory || []).find((i) => i.definitionId === "flubber");
    assert.ok(
      !flubber,
      "Avant le boss 59, aucun flubber ne doit pouvoir tomber, même avec un pool générique toujours gagnant (Math.random()=0) -- flubber ne doit plus être un candidat de ce pool."
    );
  } finally {
    Math.random = realRandom;
  }
}

console.log("idle-flubber-tutorial-drop: OK");
