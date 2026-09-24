import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import {
  IDLE_PORTRAITS_V1,
  idlePortraitPickR2KeyV1
} from "../src/idle-portraits-v1.js";

/*
 * Audit 2026-09-24 : pages Player Portraits, Portrait pack pictures, MacGuffin Fragments (SEXY / SMART,
 * 250 %), Wishes (26, 75, 202) et Arbitrary Points / Tips N' Tricks (Special Prize : 50 000 AP, une fois).
 */
const ctx = { bosses: 100, basicTrainingComplete: true };
const fresh = () => normalizeIdleNguState({}, ctx, 0);
const snap = (s) => idleNguSnapshot(s, ctx, 0).portraits;
const act = (s, p) => applyIdleNguAction(s, p, ctx, 1000);

// Catalogue : 42 sets + 2 bonus Forest... comptes de la galerie du wiki (défaut, sets, 3 souhaits, SEXY, SMART).
{
  const sets = IDLE_PORTRAITS_V1.filter((p) => p.unlock.type === "set");
  assert.equal(sets.length, 44, "42 sets + 2 portraits bonus du set Forest");
  assert.equal(new Set(IDLE_PORTRAITS_V1.map((p) => p.id)).size, IDLE_PORTRAITS_V1.length, "identifiants uniques");
  assert.equal(IDLE_PORTRAITS_V1.filter((p) => p.unlock.type === "wish").map((p) => p.unlock.wish).sort((a, b) => a - b).join(), "26,75,202");
}

// Départ : seul le portrait par défaut (PlayerAPportrait16) est disponible.
{
  const p = snap(fresh());
  assert.equal(p.selected, "default");
  assert.equal(p.selectedFile, "PlayerAPportrait16");
  assert.equal(p.unlockedCount, 1);
  assert.throws(() => act(fresh(), { action: "portrait", id: "forest" }), /PORTRAIT_VERROUILLE/);
  assert.throws(() => act(fresh(), { action: "portrait", id: "nimporte" }), /PORTRAIT_INCONNU/);
}

// Set Forest complété : Forest + ses 2 portraits bonus.
{
  let s = fresh();
  s.adventure.completedSets.forest = true;
  assert.equal(snap(s).unlockedCount, 4);
  s = act(s, { action: "portrait", id: "forest-bonus-2" }).state;
  assert.equal(snap(s).selected, "forest-bonus-2");
  assert.equal(snap(s).selectedFile, "PlayerAPportrait21");
}

// Souhaits 26 / 75 / 202 (niveau 1) et fragments SEXY / SMART à 250 %.
{
  const s = fresh();
  s.systems.wishes.data.tracks["75"] = { level: 1, tempLevel: 0, permanentLevel: 0, progress: 0 };
  s.systems.macguffins.data.permanent.sexy = 249.99;
  s.systems.macguffins.data.permanent.smart = 250;
  const ids = snap(s).list.filter((p) => p.unlocked).map((p) => p.id).sort();
  assert.deepEqual(ids, ["default", "smart", "wish-mayo"]);
  s.systems.macguffins.data.permanent.sexy = 250;
  assert.ok(snap(s).list.find((p) => p.id === "sexy").unlocked);
}

// Un portrait choisi qui n'est plus valide retombe sur le défaut.
{
  const s = fresh();
  s.records.portrait = "sexy";
  assert.equal(snap(s).selected, "default");
}

// Special Prize : 50 000 AP une seule fois, sans bonus d'AP.
{
  let s = fresh();
  s.bonuses.yellowHeart = 1; // sans effet attendu
  const avant = s.currencies.ap;
  s = act(s, { action: "specialPrize" }).state;
  assert.equal(s.currencies.ap - avant, 50000);
  assert.equal(snap(s).specialPrize.claimed, true);
  assert.throws(() => act(s, { action: "specialPrize" }), /PRIX_SPECIAL_DEJA_RECLAME/);
}

// Média : nom du fichier du wiki avec ou sans préfixe, sans casse ni séparateur ; sinon rien (repli par défaut).
{
  const keys = ["idle/player/Portrait_PlayerAPportrait16.png", "idle/player/Portrait_PlayerAPportrait17.png", "idle/player/Portrait_PlayerPortrait-Rerednaw.png"];
  assert.equal(idlePortraitPickR2KeyV1(keys, "PlayerAPportrait17"), keys[1]);
  assert.equal(idlePortraitPickR2KeyV1(keys, "PlayerPortrait-Rerednaw"), keys[2]);
  assert.equal(idlePortraitPickR2KeyV1(keys, "PlayerAPportrait7"), "", "pas de faux positif sur un suffixe");
  assert.equal(idlePortraitPickR2KeyV1(keys, ""), "");
}

// Route média : ?portrait= sert le fichier choisi ; sans correspondance, le portrait par défaut d'avant.
{
  const { traiterRequeteIdleMedia } = await import("../src/idle-media-v1.js");
  const cles = ["idle/player/Portrait_PlayerAPportrait16.png", "idle/player/Portrait_PlayerAPportrait17.png"];
  const env = {
    SOREAL_R2: {
      list: async () => ({ objects: cles.map((key) => ({ key })), truncated: false }),
      get: async (key) => ({ body: "x", httpEtag: "e", writeHttpMetadata() {}, key })
    }
  };
  const servi = async (query) => (await traiterRequeteIdleMedia(new Request("https://idle.test/api/idle/media/player" + query), env)).headers.get("x-soreal-idle-r2-key");
  assert.equal(await servi("?zone=tutorial&portrait=PlayerAPportrait17"), cles[1]);
  assert.equal(await servi("?zone=tutorial"), cles[0], "sans portrait : défaut désigné (PlayerAPportrait16)");
  assert.equal(await servi("?zone=tutorial&portrait=PlayerPortrait-Slimy"), cles[0], "fichier absent : repli sur le défaut");
}

console.log("idle-portraits-special-prize OK");
