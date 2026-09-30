import assert from "node:assert/strict";
import worker from "../src/idle-worker-entry-v1.js";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

/*
 * Téléversements du menu Admin (Norman, 2026-09-30) : images d'histoire et voix générées, réservés à l'administrateur.
 * Le Worker demande au moteur si le jeton de session est celui de l'administrateur AVANT de lire le corps de la requête.
 */
function fabriquerEnv({ admin, session = true }) {
  const ecrits = [];
  const appelsMoteur = [];
  const env = {
    SOREAL_IDLE: {
      idFromName: () => "global",
      get: () => ({
        fetch: async (req) => {
          const corps = await req.json().catch(() => ({}));
          appelsMoteur.push({ chemin: new URL(req.url).pathname, corps });
          if (!session || corps.sessionToken !== "jeton-valide") return Response.json({ ok: false, error: "IDLE_SESSION_INVALIDE" }, { status: 401 });
          return Response.json({ ok: true, isAdmin: admin });
        }
      })
    },
    SOREAL_R2: {
      put: async (cle, octets, options) => { ecrits.push({ cle, taille: octets.byteLength, type: options && options.httpMetadata && options.httpMetadata.contentType }); },
      get: async (cle) => (cle === "idle/voix/0123456789abcd.m4a" ? { body: "AUDIO", httpEtag: '"e"' } : cle === "idle/story/essai/x.webp" ? { body: "IMG", httpEtag: '"i"', writeHttpMetadata(h) { h.set("content-type", "image/webp"); } } : null)
    }
  };
  return { env, ecrits, appelsMoteur };
}

const post = (chemin, corps, jeton = "jeton-valide") => new Request("https://idle.test" + chemin, {
  method: "POST",
  headers: Object.assign({ "content-type": "application/octet-stream" }, jeton ? { authorization: "Bearer " + jeton } : {}),
  body: corps
});

// 1. Administrateur : image et voix acceptées, clés R2 attendues.
{
  const { env, ecrits, appelsMoteur } = fabriquerEnv({ admin: true });
  const r = await worker.fetch(post("/api/v1/story-upload?id=essai&ext=webp", new Uint8Array([1, 2, 3])), env);
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.equal(d.ok, true);
  assert.match(d.file, /^[a-z0-9]+\.webp$/);
  assert.equal(ecrits[0].cle, "idle/story/essai/" + d.file);
  assert.equal(ecrits[0].type, "image/webp");
  assert.equal(appelsMoteur[0].corps.operation, "estAdminSorealIdle", "l'identité est vérifiée par le moteur, jamais crue sur parole");

  const v = await worker.fetch(post("/api/v1/voice-upload?h=0123456789abcd", new Uint8Array([9, 9])), env);
  assert.equal(v.status, 200);
  assert.equal(ecrits[1].cle, "idle/voix/0123456789abcd.m4a");
  assert.equal(ecrits[1].type, "audio/mp4");
}

// 2. Tout autre compte : refusé, RIEN n'est écrit.
{
  const { env, ecrits } = fabriquerEnv({ admin: false });
  const r = await worker.fetch(post("/api/v1/story-upload?id=essai&ext=webp", new Uint8Array([1])), env);
  assert.equal(r.status, 403);
  const v = await worker.fetch(post("/api/v1/voice-upload?h=0123456789abcd", new Uint8Array([1])), env);
  assert.equal(v.status, 403);
  assert.deepEqual(ecrits, []);
}

// 3. Sans jeton ou avec un jeton invalide : refusé.
{
  const { env, ecrits } = fabriquerEnv({ admin: true });
  assert.equal((await worker.fetch(post("/api/v1/story-upload?id=essai&ext=webp", new Uint8Array([1]), ""), env)).status, 403);
  assert.equal((await worker.fetch(post("/api/v1/story-upload?id=essai&ext=webp", new Uint8Array([1]), "faux-jeton"), env)).status, 403);
  assert.deepEqual(ecrits, []);
}

// 4. Paramètres invalides (même pour l'administrateur) : identifiant, type, empreinte, taille, corps vide.
{
  const { env, ecrits } = fabriquerEnv({ admin: true });
  const statut = async (chemin, corps) => (await worker.fetch(post(chemin, corps), env)).status;
  assert.equal(await statut("/api/v1/story-upload?id=../x&ext=webp", new Uint8Array([1])), 400);
  assert.equal(await statut("/api/v1/story-upload?id=essai&ext=exe", new Uint8Array([1])), 400);
  assert.equal(await statut("/api/v1/story-upload?id=essai&ext=webp", new Uint8Array([])), 400);
  assert.equal(await statut("/api/v1/voice-upload?h=../../x", new Uint8Array([1])), 400);
  assert.equal(await statut("/api/v1/voice-upload?h=ABCDEF0123456G", new Uint8Array([1])), 400);
  const gros = new Request("https://idle.test/api/v1/story-upload?id=essai&ext=webp", { method: "POST", headers: { authorization: "Bearer jeton-valide", "content-length": String(9 * 1024 * 1024) }, body: new Uint8Array([1]) });
  assert.equal((await worker.fetch(gros, env)).status, 413);
  assert.deepEqual(ecrits, []);
}

// 5. Lecture publique : image par nom exact, voix par empreinte ; entrées invalides refusées ; 404 propre.
{
  const { env } = fabriquerEnv({ admin: true });
  const get = (chemin) => traiterRequeteIdleMedia(new Request("https://idle.test" + chemin), env);
  const img = await get("/api/idle/media/story-image?id=essai&f=x.webp");
  assert.equal(img.status, 200);
  assert.equal(img.headers.get("content-type"), "image/webp");
  assert.equal((await get("/api/idle/media/story-image?id=essai&f=..%2Fsecret.webp")).status, 400);
  assert.equal((await get("/api/idle/media/story-image?id=essai&f=absent.webp")).status, 404);
  const voix = await get("/api/idle/media/voice?h=0123456789abcd");
  assert.equal(voix.status, 200);
  assert.equal(voix.headers.get("content-type"), "audio/mp4");
  assert.match(voix.headers.get("cache-control") || "", /max-age=60/, "cache court : régénérer une voix se voit vite");
  assert.equal((await get("/api/idle/media/voice?h=zz")).status, 400);
  assert.equal((await get("/api/idle/media/voice?h=ffffffffffffff")).status, 404);
}

console.log("idle-story-upload-admin-v1: OK");
