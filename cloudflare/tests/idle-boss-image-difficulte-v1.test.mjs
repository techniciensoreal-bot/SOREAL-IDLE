import assert from "node:assert/strict";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";
import { idleBossCleR2V1, idleBossVarianteDifficulteV1, IDLE_BOSS_FICHIERS_EVIL_R2_V1, IDLE_BOSS_FICHIERS_SADISTIC_R2_V1 } from "../src/idle-boss-cles-v1.js";

/*
 * Norman (2026-10-17) : « quand on commence le jeu en difficulté evil, ce sont ces images qui devront être utilisées » (images 3D, dossier R2 idle/bosses-evil/ ; photos réalistes pour Sadistic : idle/bosses-sadistic/).
 * Norman (2026-11-09) : le paramètre difficulty de /api/idle/media/boss était ignoré par ce Worker (un joueur Evil ou Sadistic voyait l'image normale) : « non, ce n'est pas voulu ». La route sert la variante, et
 * retombe sur l'image normale quand la variante manque (ids 289 et 296, ou clé absente du seau).
 */
assert.equal(idleBossVarianteDifficulteV1("difficile"), "evil");
assert.equal(idleBossVarianteDifficulteV1("extreme"), "sadistic");
for (const d of ["", "normal", undefined, null, "n'importe quoi"]) assert.equal(idleBossVarianteDifficulteV1(d), "normal", "toute autre valeur : image normale");
assert.equal(Object.keys(IDLE_BOSS_FICHIERS_EVIL_R2_V1).length, 299);
assert.equal(Object.keys(IDLE_BOSS_FICHIERS_SADISTIC_R2_V1).length, 299);
assert.match(idleBossCleR2V1(5, "difficile"), /^idle\/bosses-evil\/Boss_005_.+\.webp$/);
assert.match(idleBossCleR2V1(5, "extreme"), /^idle\/bosses-sadistic\/Boss_005_.+\.webp$/);
assert.match(idleBossCleR2V1(5), /^idle\/bosses\/Boss_005_/, "sans difficulté : image normale, inchangée");
assert.equal(idleBossCleR2V1(289, "difficile"), "", "pas d'image Evil pour le 289 : le serveur retombe sur la normale");
assert.equal(idleBossCleR2V1(296, "extreme"), "");
assert.match(idleBossCleR2V1(106, "difficile"), /Toupée/, "clé UTF-8 telle que dans R2");

// de bout en bout avec un faux R2 : la variante est servie, sinon l'image normale
const cles = new Set([idleBossCleR2V1(5), idleBossCleR2V1(5, "difficile"), idleBossCleR2V1(5, "extreme"), idleBossCleR2V1(289)]);
const R2 = {
  async get(cle) { return cles.has(cle) ? { body: "x", httpEtag: '"e"', writeHttpMetadata(h) { h.set("content-type", "image/webp"); } } : null; },
  async list() { return { objects: [], truncated: false, delimitedPrefixes: [] }; }
};
const appel = (q) => traiterRequeteIdleMedia(new Request("https://soreal.test/api/idle/media/boss?" + q), { SOREAL_R2: R2 });
{
  const r = await appel("id=5&difficulty=difficile");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-soreal-idle-r2-key"), idleBossCleR2V1(5, "difficile"), "Evil : l'image Evil");
  assert.equal(r.headers.get("x-soreal-idle-boss-variante"), "evil");
}
{
  const r = await appel("id=5&difficulty=extreme");
  assert.equal(r.headers.get("x-soreal-idle-r2-key"), idleBossCleR2V1(5, "extreme"), "Sadistic : l'image Sadistic");
  assert.equal(r.headers.get("x-soreal-idle-boss-variante"), "sadistic");
}
{
  const r = await appel("id=5");
  assert.equal(r.headers.get("x-soreal-idle-r2-key"), idleBossCleR2V1(5));
  assert.equal(r.headers.get("x-soreal-idle-boss-variante"), "normal", "sans difficulté : normale");
}
{
  const r = await appel("id=289&difficulty=difficile");
  assert.equal(r.status, 200, "pas d'image Evil pour le 289 : l'image normale est servie, jamais un 404");
  assert.equal(r.headers.get("x-soreal-idle-r2-key"), idleBossCleR2V1(289));
  assert.equal(r.headers.get("x-soreal-idle-boss-variante"), "normal");
}
{
  cles.delete(idleBossCleR2V1(5, "difficile"));   // clé retirée du seau
  const r = await appel("id=5&difficulty=difficile");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-soreal-idle-r2-key"), idleBossCleR2V1(5), "variante absente du seau : repli sur la normale");
}
console.log("idle-boss-image-difficulte-v1: OK");
