import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { IDLE_PORTRAITS_V1 } from "../src/idle-portraits-v1.js";
import { IDLE_DAYCARE_SKIN_IDS_V1 } from "../src/idle-daycare-skins-v1.js";

/* Apparences du chat de la Garderie : possession par condition, jamais révélatrices (règle n°2). */
const ctx = { bosses: 0, basicTrainingComplete: false };
const frais = () => normalizeIdleNguState({}, ctx, 0);
const skins = (s) => idleNguSnapshot(s, ctx, 0).daycare.skins;
const agir = (s, p) => applyIdleNguAction(s, p, ctx, 1000);

assert.equal(IDLE_DAYCARE_SKIN_IDS_V1.length, 11);
assert.deepEqual({ ...skins(frais()) }, { actif: "defaut", possedes: ["defaut"] });

// noeud : Special Prize chaton (et rattrapage), pas le choix AP
{
  assert.deepEqual(skins(agir(frais(), { action: "specialPrize", choice: "ap" }).state).possedes, ["defaut"]);
  const s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
  assert.deepEqual(skins(s).possedes, ["defaut", "noeud"]);
  const r = agir(s, { action: "daycareSkin", id: "noeud" });
  assert.equal(r.result.skin, "noeud");
  assert.equal(skins(r.state).actif, "noeud");
  // survit à la normalisation (identifiant texte)
  assert.equal(skins(normalizeIdleNguState(JSON.parse(JSON.stringify(r.state)), ctx, 0)).actif, "noeud");
  const ancien = frais();
  ancien.records.specialPrizeClaimed = 1;
  ancien.records.specialPrizeChoice = 0;
  assert.ok(skins(ancien).possedes.includes("noeud"), "Special Prize réclamé avant le choix : chaton offert");
}
// arcenciel : souhait 44 niveau 1
{
  const s = frais();
  s.systems.wishes = s.systems.wishes || {};
  const src = readFileSync("cloudflare/src/idle-daycare-skins-v1.js", "utf8");
  assert.ok(src.includes("IDLE_DAYCARE_WISH_ART_ID_V1 = 44") && src.includes("IDLE_DAYCARE_FIBONACCI_NIVEAU_V1 = 1597"));
}
// possession par env direct (fibonacci / matrix / arcenciel)
{
  const { skinsPossedesV1, skinActifV1, choisirSkinV1 } = await import("../src/idle-daycare-skins-v1.js");
  const st = { records: {} };
  const env = (o) => ({ specialPrizeChoice: 0, wishLevel: () => 0, perkLevel: () => 0, achats: () => 0, ...o });
  assert.deepEqual(skinsPossedesV1(st, env({ wishLevel: (id) => (id === 44 ? 1 : 0) })), ["defaut", "arcenciel"]);
  assert.deepEqual(skinsPossedesV1(st, env({ perkLevel: (id) => (id === 94 ? 1596 : 0) })), ["defaut"]);
  assert.deepEqual(skinsPossedesV1(st, env({ perkLevel: (id) => (id === 94 ? 1597 : 0) })), ["defaut", "fibonacci"]);
  assert.deepEqual(skinsPossedesV1(st, env({ achats: (id) => (id === "daycareKittyArt" ? 1 : 0) })), ["defaut", "matrix"]);
  // skins sans condition publiée : jamais possédés, même avec tout
  const tout = skinsPossedesV1(st, env({ specialPrizeChoice: 2, wishLevel: () => 99, perkLevel: () => 9999, achats: () => 9 }));
  assert.deepEqual(tout, ["defaut", "noeud", "arcenciel", "fibonacci", "matrix"]);
  for (const id of ["dore", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"]) {
    assert.ok(!tout.includes(id));
    assert.throws(() => choisirSkinV1(st, id, env({})), /SKIN_GARDERIE_VERROUILLE/);
  }
  assert.throws(() => choisirSkinV1(st, "inconnu", env({})), /SKIN_GARDERIE_INCONNU/);
  // repli sur defaut quand le choix n'est plus possédé
  st.records.daycareSkin = "fibonacci";
  assert.equal(skinActifV1(st, env({})), "defaut");
}
// action refusée côté moteur
assert.throws(() => agir(frais(), { action: "daycareSkin", id: "matrix" }), /SKIN_GARDERIE_VERROUILLE/);
assert.throws(() => agir(frais(), { action: "daycareSkin", id: "nega" }), /SKIN_GARDERIE_VERROUILLE/);

// Le portrait « chaton » n'existe plus parmi les portraits de joueur
assert.ok(!IDLE_PORTRAITS_V1.some((p) => p.id === "kitty" || p.file === "BadKittyDaycareBow"));
{
  const s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
  s.records.portrait = "kitty";
  assert.equal(idleNguSnapshot(s, ctx, 0).portraits.selected, "default", "ancien choix : repli sur le portrait par défaut");
  assert.throws(() => agir(s, { action: "portrait", id: "kitty" }), /PORTRAIT_INCONNU/);
  assert.equal(idleNguSnapshot(s, ctx, 0).portraits.specialPrize.choice, "kitty", "le choix du Special Prize reste");
}
// Route média : liste blanche
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
assert.ok(media.includes("/api/idle/media/garderie-skin") && media.includes("IDLE_DAYCARE_SKIN_IDS_V1.includes(id)") && media.includes('"idle/garderie-skins/"+id+".webp"'));
assert.ok(!media.includes("badkittydaycarebow"));

console.log("idle-daycare-skins-v1 OK");
