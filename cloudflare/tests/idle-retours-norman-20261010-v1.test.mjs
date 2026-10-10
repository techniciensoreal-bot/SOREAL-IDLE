import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, advanceIdleNguState, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Retours de Norman du 2026-10-10 (suite) :
 *  - une case à cocher « Auto-kill » PAR TITAN : sans elle GRB n'était jamais tué tout seul (aucun écran n'activait l'ancien réglage global) ;
 *  - un titan prêt fait briller l'onglet Titans et montre une icône animée, SAUF s'il se tue tout seul ;
 *  - paralysie : plus de phrase au-dessus des raccourcis (elle décalait l'interface) ;
 *  - bouton Trier : l'icône est posée sur une pastille sombre ;
 *  - Time Machine : l'Or d'un remplissage affiché est l'Or RÉEL (Or brut par seconde / remplissages par seconde), pas la base ;
 *  - borne : même affichage sur PC et téléphone (chronique en dessous).
 */
const lire = (p) => readFileSync(p, "utf8");

// --- serveur : la case d'un titan le fait tuer tout seul, les autres non ---
{
  const ctx = { bosses: 300, adventurePower: 5000, adventureToughness: 5000, difficulty: "extreme" };
  let etat = normalizeIdleNguState(null, ctx, 1000);
  etat.difficulty = "extreme";
  const dix = 10 * 24 * 3600;
  const sans = advanceIdleNguState(etat, dix, ctx, 1000 + dix * 1000);
  assert.ok(!sans.adventure.titans.t1 || sans.adventure.titans.t1.kills === 0, "case non cochée : aucun auto-kill");
  etat = applyIdleNguAction(etat, { action: "adventure", adventure: { action: "setAutoKillTitan", id: "t1", enabled: true } }, ctx, 1000).state;
  assert.equal(etat.adventure.titans.t1.autoKill, true);
  const avec = advanceIdleNguState(etat, dix, ctx, 1000 + dix * 1000);
  assert.ok(avec.adventure.titans.t1.kills >= 200, "case cochée : GRB est tué à chaque réapparition (obtenu : " + avec.adventure.titans.t1.kills + ")");
  const autre = avec.adventure.titans.t2;
  assert.ok(!autre || autre.kills === 0, "un titan dont la case n'est pas cochée n'est pas touché");
  const decoche = applyIdleNguAction(avec, { action: "adventure", adventure: { action: "setAutoKillTitan", id: "t1", enabled: false } }, ctx, 1000 + dix * 1000).state;
  assert.equal(decoche.adventure.titans.t1.autoKill, false);
  const avant = decoche.adventure.titans.t1.kills;
  const encore = advanceIdleNguState(decoche, dix, ctx, 1000 + 2 * dix * 1000);
  assert.equal(encore.adventure.titans.t1.kills, avant, "case décochée : plus d'auto-kill");
  assert.throws(() => applyIdleNguAction(etat, { action: "adventure", adventure: { action: "setAutoKillTitan", id: "nimporte", enabled: true } }, ctx, 1000), /TITAN_INCONNU/);
}

// --- client : case à cocher, icône, brillance ---
{
  const t = lire("cloudflare/public/modules/titans-v1.js");
  assert.ok(t.includes("__autoKillTitanV1__") && t.includes("setAutoKillTitan") && t.includes("ttnAuto_"), "case à cocher par titan");
  assert.ok(t.includes("function seTueTout(t)") && t.includes("&&!seTueTout(t)"), "un titan qui se tue tout seul ne fait ni briller ni apparaître l'icône");
  assert.ok(t.includes("soreal-idle-titan-icone-v1") && t.includes("icone:icone"));
  const ui = lire("cloudflare/public/soreal-idle-ui.js");
  assert.ok(ui.includes("iconeTitan") && ui.includes("avec-icone"), "icône à droite du bandeau Aventure / Titans");
  const css = lire("cloudflare/public/soreal-idle-themes.css");
  assert.ok(css.includes("@keyframes soreal-idle-titan-icone-v1{0%,100%{") && css.includes("grid-template-columns:1fr 1fr auto"), "icône animée, boucle sans à-coup (départ = arrivée)");
}

// --- paralysie, tri, Time Machine ---
{
  const ui = lire("cloudflare/public/soreal-idle-ui.js");
  assert.ok(!ui.includes("data-paralysie-v1") && !ui.includes("Paralysé ! Plus de capacités"), "plus de phrase de paralysie");
  assert.ok(ui.includes('<span class="bouton-icone-sombre-v1">🗂️</span> Trier'));
  assert.ok(lire("cloudflare/public/soreal-idle-itopod.css").includes(".bouton-icone-sombre-v1{"));
  const meta = lire("cloudflare/public/modules/meta-progression-v130.js");
  assert.ok(meta.includes("function orReelParRemplissageIdleV1_(vue)") && meta.includes('data-tm-hero="orReel"') && meta.includes("Or de base par remplissage"), "Or réel par remplissage");
  assert.ok(!meta.includes('data-tm-hero="goldPerBarFill"'));
}

// --- borne identique sur PC et téléphone ---
{
  const css = lire("cloudflare/public/soreal-idle-itopod.css");
  assert.ok(!css.includes("min-width:561px"), "plus de mise en page PC séparée pour la chronique");
  assert.ok(css.includes("@media all{") && css.includes("margin:-160px auto 0!important"));
}
console.log("idle-retours-norman-20261010-v1: OK");
