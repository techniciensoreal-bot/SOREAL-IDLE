import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/* Cible de complétions d'un rituel de Blood Magic (Norman, 2026-11-20 : « il devra arrêter avant que le prochain niveau ne prenne l'or »). */
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 60 };
const prepare = () => {
  let s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.bloodMagic.unlocked = true; s.currencies.gold = 1e15; s.resources.magic.current = 1e9; s.resources.magic.cap = 1e9;
  return applyIdleNguAction(s, { action: "allocateRitual", ritual: "tack", value: 1e9 }, ctx, 1_000_000).state;
};
const jouer = (s, n = 40) => { for (let i = 0; i < n; i++) s = advanceIdleNguState(s, 30, ctx, 1_000_000 + (i + 1) * 30_000); return s; };

{ /* sans cible : le rituel enchaîne */
  const s = jouer(prepare());
  assert.ok(s.systems.bloodMagic.data.rituals.tack.completions > 1000);
}
{ /* avec cible : s'arrête pile à la cible, sans payer le niveau suivant */
  let s = applyIdleNguAction(prepare(), { action: "setRitualTarget", ritual: "tack", value: 3 }, ctx, 1_000_000).state;
  const or0 = s.currencies.gold;
  s = jouer(s);
  const r = s.systems.bloodMagic.data.rituals.tack;
  assert.equal(r.completions, 3, "exactement la cible");
  assert.equal(r.progress, 0, "aucun niveau suivant démarré (donc payé)");
  assert.equal(or0 - s.currencies.gold, 3 * 30_000_000, "l'Or de 3 niveaux seulement (30 M chacun)");
  const vue = idleNguSnapshot(s, ctx, 5_000_000).bloodMagicView.rituals.find((x) => x.id === "tack");
  assert.equal(vue.cibleAtteinte, true); assert.equal(vue.secondsPerCompletion, null);
  /* relever la cible relance le rituel */
  s = applyIdleNguAction(s, { action: "setRitualTarget", ritual: "tack", value: 5 }, ctx, 5_000_000).state;
  s = jouer(s, 40);
  assert.equal(s.systems.bloodMagic.data.rituals.tack.completions, 5);
  /* 0 = pas de cible */
  s = applyIdleNguAction(s, { action: "setRitualTarget", ritual: "tack", value: 0 }, ctx, 9_000_000).state;
  assert.equal(s.systems.bloodMagic.data.rituals.tack.target, 0);
}
{ /* verrouillé tant que Blood Magic ne l'est pas ; rituel inconnu refusé */
  const s = normalizeIdleNguState({}, { ...ctx, bosses: 10 }, 1_000_000); s.systems.bloodMagic.unlocked = false;
  assert.throws(() => applyIdleNguAction(s, { action: "setRitualTarget", ritual: "tack", value: 3 }, { ...ctx, bosses: 10 }, 1_000_000), /SYSTEME_VERROUILLE/);
  assert.throws(() => applyIdleNguAction(prepare(), { action: "setRitualTarget", ritual: "nope", value: 3 }, ctx, 1_000_000), /RITUEL_INVALIDE/);
}
/* Client : champ « Cible » et copie du rejeu local */
const vdom = fs.readFileSync(new URL("../public/modules/blood-magic-vdom-v1.js", import.meta.url), "utf8");
const boucle = fs.readFileSync(new URL("../public/modules/ui-boucle-v1.js", import.meta.url), "utf8");
assert.ok(/SaisieCible/.test(vdom) && /__cibleRituelBloodIdleV1__/.test(vdom), "champ Cible sur chaque rituel");
assert.ok(/quotaB/.test(boucle) && /quotaLocal/.test(boucle), "le rejeu local respecte la cible");
console.log("idle-blood-cible-rituel-v1: OK");
