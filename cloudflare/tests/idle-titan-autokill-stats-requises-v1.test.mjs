import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { titanAutoKillPossibleV1, IDLE_ADVENTURE_TITANS, createIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/* Norman (2026-10-14) : « on ne doit pas pouvoir cocher auto kill pour un titan quand on n'a pas les statistiques nécessaires ». */
const coche = (etat, ctx, enabled, id = "t1") => applyIdleNguAction(etat, { action: "adventure", adventure: { action: "setAutoKillTitan", id, enabled } }, ctx, 1000).state;

// --- serveur : refus sans les stats Auto-kill, accord avec, décocher toujours possible ---
{
  const faible = { bosses: 300, adventurePower: 100, adventureToughness: 100, difficulty: "extreme" };
  const fort = { bosses: 300, adventurePower: 5000, adventureToughness: 5000, difficulty: "extreme" };
  let etat = normalizeIdleNguState(null, faible, 1000);
  etat.difficulty = "extreme";
  assert.throws(() => coche(etat, faible, true), /AUTOKILL_STATS_INSUFFISANTES/, "stats trop faibles : la case ne peut pas être cochée");
  assert.ok(!(etat.adventure.titans.t1 && etat.adventure.titans.t1.autoKill === true), "rien n'a été coché");
  const moitie = { bosses: 300, adventurePower: 5000, adventureToughness: 100, difficulty: "extreme" };
  assert.throws(() => coche(etat, moitie, true), /AUTOKILL_STATS_INSUFFISANTES/, "il faut la Puissance ET l'Endurance");
  etat = coche(etat, fort, true);
  assert.equal(etat.adventure.titans.t1.autoKill, true, "stats suffisantes : cochée");
  const decoche = coche(etat, faible, false);
  assert.equal(decoche.adventure.titans.t1.autoKill, false, "décocher reste possible même avec des stats insuffisantes");
}

// --- règle pure ---
{
  const s = createIdleAdventureStateV47();
  const grb = IDLE_ADVENTURE_TITANS.find((t) => t.id === "t1");
  assert.equal(titanAutoKillPossibleV1(s, grb, { power: grb.autoKillP - 1, toughness: grb.autoKillT }), false);
  assert.equal(titanAutoKillPossibleV1(s, grb, { power: grb.autoKillP, toughness: grb.autoKillT - 1 }), false);
  assert.equal(titanAutoKillPossibleV1(s, grb, { power: grb.autoKillP, toughness: grb.autoKillT }), true);
  assert.equal(titanAutoKillPossibleV1(s, grb, undefined), false, "stats inconnues : refusé");
  /* Walderp : jamais avant sa forme finale battue. */
  const walderp = IDLE_ADVENTURE_TITANS.find((t) => t.forms);
  assert.ok(walderp, "un titan à formes existe");
  assert.equal(titanAutoKillPossibleV1(s, walderp, { power: 1e300, toughness: 1e300 }), false, "titan à formes : forme finale non battue");
  /* Un titan à paliers : atteindre les stats du palier le plus facile suffit. */
  const palier = IDLE_ADVENTURE_TITANS.find((t) => t.difficulties && Object.values(t.difficulties).some((e) => e && e.autoKillP > 0));
  assert.ok(palier);
  const facile = Object.values(palier.difficulties).filter((e) => e && e.autoKillP > 0).sort((a, b) => a.autoKillP - b.autoKillP)[0];
  assert.equal(titanAutoKillPossibleV1(s, palier, { power: facile.autoKillP, toughness: facile.autoKillT }), true);
  assert.equal(titanAutoKillPossibleV1(s, palier, { power: 1, toughness: 1 }), false);
}

// --- client : la case est grisée tant que les conditions ne sont pas remplies (jamais si elle est déjà cochée : on doit pouvoir la décocher) ---
{
  const t = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
  assert.ok(t.includes("function autoKillCochable(t){") && t.includes("if(t.state&&t.state.autoKill===true)return true;"), "une case déjà cochée reste modifiable");
  assert.ok(t.includes("(autoKillCochable(t)?'':'disabled ')"), "case désactivée sans les stats");
  assert.ok(t.includes("Monte tes stats pour pouvoir activer l’Auto-kill de ce Titan."), "message clair, sans aucun chiffre (anti-spoil)");
}
console.log("Auto-kill d'un titan : stats requises: OK");
