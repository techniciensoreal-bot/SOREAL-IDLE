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

/*
 * Norman (2026-09-29) : « L'image 10 est lue trop tôt dans l'histoire et ça fausse tout les
 * textes. » Reproduit avec les VRAIS noms de fichiers de MagicienEtLeGrotte2 (1.webp .. 10.webp,
 * jamais zéro-remplis, sondés en direct sur R2) : un tri alphabétique de chaînes plaçait
 * "10.webp" en 2e position (juste après "1.webp"), avant "2.webp" .. "9.webp". Le tri doit être
 * NUMÉRIQUE sur le préfixe du nom de fichier, quel que soit l'ordre de découverte R2 (list()
 * peut renvoyer les clés dans n'importe quel ordre).
 */
{
  const keys = [
    "idle/story/MagicienEtLeGrotte2/5.webp",
    "idle/story/MagicienEtLeGrotte2/1.webp",
    "idle/story/MagicienEtLeGrotte2/10.webp",
    "idle/story/MagicienEtLeGrotte2/2.webp",
    "idle/story/MagicienEtLeGrotte2/9.webp",
    "idle/story/MagicienEtLeGrotte2/3.webp",
    "idle/story/MagicienEtLeGrotte2/4.webp",
    "idle/story/MagicienEtLeGrotte2/6.webp",
    "idle/story/MagicienEtLeGrotte2/7.webp",
    "idle/story/MagicienEtLeGrotte2/8.webp"
  ];
  for (let i = 1; i <= 10; i++) {
    assert.equal(choisirCleStoryR2_(keys, i), "idle/story/MagicienEtLeGrotte2/" + i + ".webp", "index " + i + " doit renvoyer le fichier " + i + ".webp, pas un voisin décalé par un tri alphabétique");
  }
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
