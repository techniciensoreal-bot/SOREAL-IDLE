import assert from "node:assert/strict";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

/*
 * Norman (2026-09-27) : « Je vais placer plusieurs sons d'ambiance dans mon R2 soreal/idle/ambient/. » "soreal" est
 * le nom du bucket lui-même (wrangler.jsonc, bucket_name:"soreal") -- la clé réelle est donc idle/ambient/<fichier>,
 * comme les autres préfixes de ce fichier (idle/aventure/, idle/backgrounds/...). Norman dépose les fichiers
 * directement dans R2, sans build local : la liste doit être énumérée en direct, jamais figée en dur.
 */

// --- Liste : énumère bien le bon préfixe, jamais un chemin en dur ---
{
  const listed = [
    { key: "idle/ambient/foret-nuit.mp3" },
    { key: "idle/ambient/grotte.ogg" },
    { key: "idle/ambient/notice.txt" } // extension non audio : filtrée
  ];
  const fakeR2 = {
    async list(opts) {
      assert.equal(opts.prefix, "idle/ambient/", "liste bien sous idle/ambient/, jamais soreal/idle/ambient/ (le bucket s'appelle déjà soreal)");
      return { objects: listed, truncated: false };
    }
  };
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/ambient-list"),
    { SOREAL_R2: fakeR2 }
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.ok, true);
  assert.deepEqual(data.cles, ["idle/ambient/foret-nuit.mp3", "idle/ambient/grotte.ogg"], "seuls les fichiers audio, triés");
}

// --- Liste : R2 indisponible -> réponse explicite, jamais une liste vide déguisée en succès ---
{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/ambient-list"),
    {}
  );
  const data = await response.json();
  assert.equal(response.status, 503);
  assert.equal(data.ok, false);
}

// --- Fichier : sert bien un fichier sous idle/ambient/ ---
{
  const corps = new Uint8Array([1, 2, 3]);
  const fakeR2 = {
    async get(key) {
      assert.equal(key, "idle/ambient/foret-nuit.mp3");
      return { body: corps, writeHttpMetadata() {} };
    }
  };
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/ambient?key=idle%2Fambient%2Fforet-nuit.mp3"),
    { SOREAL_R2: fakeR2 }
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
}

// --- Fichier : clé hors idle/ambient/ refusée (jamais un accès R2 arbitraire via ce paramètre) ---
for (const cle of ["idle/aventure/secret.png", "../idle/ambient/x.mp3", "idle/ambient/../../autre.mp3", ""]) {
  const fakeR2 = { async get() { throw new Error("ne doit jamais être appelé"); } };
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/ambient?key=" + encodeURIComponent(cle)),
    { SOREAL_R2: fakeR2 }
  );
  assert.equal(response.status, 400, "clé refusée : " + JSON.stringify(cle));
}

// --- Fichier absent : 404, jamais une erreur serveur ---
{
  const fakeR2 = { async get() { return null; } };
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/ambient?key=idle%2Fambient%2Fintrouvable.mp3"),
    { SOREAL_R2: fakeR2 }
  );
  assert.equal(response.status, 404);
}

console.log("idle-ambient-audio-media-v1: OK");
