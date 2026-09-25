import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman : « Special Prize (condition inconnue) ». Wiki, Tips N' Tricks : « Special Prize » dans le menu Info, deux choix — 50 000 AP ou
 * A PRETTY KITTY (« Take the kitty, it gives you the AP too ») ; « if you click one of the two options for a second time it'll say
 * "Nice try, greedypants." ». Page Arbitrary Points : jamais de bonus d'AP dessus. Pas de condition de déblocage : disponible dès le départ.
 */
const ctx = { bosses: 0, basicTrainingComplete: false };
const frais = () => normalizeIdleNguState({}, ctx, 0);
const prix = (s) => idleNguSnapshot(s, ctx, 0).portraits.specialPrize;
const agir = (s, p) => applyIdleNguAction(s, p, ctx, 1000);

// Disponible dès le départ, sans aucune condition
assert.deepEqual({ ...prix(frais()) }, { ap: 50000, claimed: false, choice: "" });

// Choix « 50 000 AP »
{
  const r = agir(frais(), { action: "specialPrize", choice: "ap" });
  assert.equal(r.state.currencies.ap, 50000);
  assert.deepEqual({ ...prix(r.state) }, { ap: 50000, claimed: true, choice: "ap" });
  assert.throws(() => agir(r.state, { action: "specialPrize", choice: "kitty" }), /PRIX_SPECIAL_DEJA_RECLAME/, "second clic, même sur l'autre option : rien de plus");
}
// Choix « joli chaton » : les AP sont donnés aussi
{
  const r = agir(frais(), { action: "specialPrize", choice: "kitty" });
  assert.equal(r.state.currencies.ap, 50000, "le chaton donne aussi les 50 000 AP");
  assert.equal(prix(r.state).choice, "kitty");
  assert.throws(() => agir(r.state, { action: "specialPrize", choice: "ap" }), /PRIX_SPECIAL_DEJA_RECLAME/);
}
// Sans précision (anciens clients) : 50 000 AP
assert.equal(prix(agir(frais(), { action: "specialPrize" }).state).choice, "ap");
// Le choix survit à la Renaissance
{
  let s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
  assert.equal(normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 0).records.specialPrizeChoice, 2);
}

// Le choix « chaton » débloque le portrait « Joli chaton » (image R2 idle/Kitty/BadKittyDaycareBow.webp) ; le choix « AP » ne le débloque pas
{
  const chaton = (s) => idleNguSnapshot(s, ctx, 0).portraits.list.find((p) => p.id === "kitty");
  assert.equal(chaton(frais()).unlocked, false, "verrouillé au départ");
  assert.equal(chaton(frais()).file, "BadKittyDaycareBow");
  assert.equal(chaton(agir(frais(), { action: "specialPrize", choice: "ap" }).state).unlocked, false, "choix AP : pas de chaton");
  let s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
  assert.equal(chaton(s).unlocked, true, "choix chaton : portrait débloqué");
  s = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 0);
  s = agir(s, { action: "portrait", id: "kitty" }).state;
  assert.equal(idleNguSnapshot(s, ctx, 0).portraits.selected, "kitty", "sélectionnable");
  assert.throws(() => agir(agir(frais(), { action: "specialPrize", choice: "ap" }).state, { action: "portrait", id: "kitty" }), /PORTRAIT_VERROUILLE/);
  // Special Prize réclamé avant l'existence du choix (records.specialPrizeClaimed = 1, aucun choix enregistré) : le chaton est offert.
  const ancien = frais();
  ancien.records.specialPrizeClaimed = 1;
  ancien.records.specialPrizeChoice = 0;
  assert.equal(chaton(ancien).unlocked, true, "ancien compte ayant déjà réclamé : chaton débloqué");
  const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
  assert.ok(media.includes("IDLE_PORTRAIT_KITTY_R2_KEY_V1") && media.includes("badkittydaycarebow"), "route média : fichier R2 désigné");
  assert.ok(readFileSync("cloudflare/src/idle-portraits-v1.js", "utf8").includes('"idle/Kitty/BadKittyDaycareBow.webp"'));
}

// Client : la carte est dans le menu Info (toujours visible quand Info est ouvert), plus dans Achievements
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.match(ui, /function carteSpecialPrizeIdleV1_\(\)\{/);
assert.ok(ui.includes("{action:\\'specialPrize\\',choice:\\'ap\\'}"));
assert.ok(ui.includes("{action:\\'specialPrize\\',choice:\\'kitty\\'}"));
assert.match(ui, /Bien essayé, gourmand !/);
assert.ok(!readFileSync("cloudflare/public/modules/profile-v1.js", "utf8").includes("Special Prize</div>"));

console.log("idle-special-prize-choice-v1 OK");
