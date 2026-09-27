import assert from "node:assert/strict";
import { traiterRequeteIdleMedia, choisirCleStoryR2_ } from "../src/idle-media-v1.js";

/*
 * Cinématique « Le Magicien et la Grotte » (2026-09-27) : images plein écran servies depuis
 * idle/story/<id>/, dans l'ordre alphabétique du nom de fichier (convention numérique attendue
 * côté R2, 1_..., 2_..., ...).
 */

// choisirCleStoryR2_ : tri alphabétique, index 1-based, hors bornes = "".
{
  const keys = [
    "idle/story/MagicienEtLaGrotte/3_le-sorcier.webp",
    "idle/story/MagicienEtLaGrotte/1_la-hutte.webp",
    "idle/story/MagicienEtLaGrotte/2_le-chaudron.webp"
  ];
  assert.equal(choisirCleStoryR2_(keys, 1), "idle/story/MagicienEtLaGrotte/1_la-hutte.webp");
  assert.equal(choisirCleStoryR2_(keys, 2), "idle/story/MagicienEtLaGrotte/2_le-chaudron.webp");
  assert.equal(choisirCleStoryR2_(keys, 3), "idle/story/MagicienEtLaGrotte/3_le-sorcier.webp");
  assert.equal(choisirCleStoryR2_(keys, 4), "");
  assert.equal(choisirCleStoryR2_(keys, 0), "");
  assert.equal(choisirCleStoryR2_([], 1), "");
}

// Route : id invalide (traversal, caractères hors charte) -> 400, jamais atteindre R2.
{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/story?id=..%2F..%2Fetc&index=1"),
    {}
  );
  assert.equal(response.status, 400);
}

// Route : index invalide (0, texte, négatif) -> 400.
{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/story?id=MagicienEtLaGrotte&index=0"),
    {}
  );
  assert.equal(response.status, 400);
}

// Route : R2 absent -> 503, jamais un crash.
{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/story?id=StoryMediaTestSansR2&index=1"),
    {}
  );
  assert.equal(response.status, 503);
  assert.match(await response.text(), /histoire indisponible/i);
}

// Route : R2 présent, sert la bonne image par index, 404 hors bornes.
{
  const fichiers = new Map([
    ["idle/story/StoryMediaTestAvecR2/1_intro.webp", new Uint8Array([1])],
    ["idle/story/StoryMediaTestAvecR2/2_chaudron.webp", new Uint8Array([2])]
  ]);
  const env = {
    SOREAL_R2: {
      list: async () => ({
        objects: Array.from(fichiers.keys()).map(key => ({ key })),
        truncated: false
      }),
      get: async key => {
        if (!fichiers.has(key)) return null;
        const bytes = fichiers.get(key);
        return {
          body: bytes,
          httpEtag: '"test"',
          writeHttpMetadata() {}
        };
      }
    }
  };

  const un = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/story?id=StoryMediaTestAvecR2&index=1"),
    env
  );
  assert.equal(un.status, 200);
  assert.equal(un.headers.get("x-soreal-idle-r2-key"), "idle/story/StoryMediaTestAvecR2/1_intro.webp");

  const deux = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/story?id=StoryMediaTestAvecR2&index=2"),
    env
  );
  assert.equal(deux.headers.get("x-soreal-idle-r2-key"), "idle/story/StoryMediaTestAvecR2/2_chaudron.webp");

  const horsBornes = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/story?id=StoryMediaTestAvecR2&index=3"),
    env
  );
  assert.equal(horsBornes.status, 404);
}

console.log("idle-media-story: OK");
