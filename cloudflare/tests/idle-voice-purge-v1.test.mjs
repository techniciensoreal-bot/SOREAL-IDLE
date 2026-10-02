import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/idle-worker-entry-v1.js";

/*
 * Norman (2026-09-30) : « vérifie bien que les anciennes [voix] soient supprimées pour gagner de la place ». Purge des voix R2 inutiles :
 * tout fichier idle/voix/<empreinte>.m4a dont l'empreinte n'est dans AUCUNE histoire est supprimé ; réservé à l'administrateur.
 */
function fabriquerEnv({ admin }) {
  const supprimes = [];
  const cles = [
    { key: "idle/voix/aaaaaaaaaaaaaa.m4a", size: 1000 },
    { key: "idle/voix/bbbbbbbbbbbbbb.m4a", size: 2000 },
    { key: "idle/voix/cccccccccccccc.m4a", size: 3000 },
    { key: "idle/story/x/image.webp", size: 999999 }
  ];
  const env = {
    SOREAL_IDLE: {
      idFromName: () => "global",
      get: () => ({
        fetch: async (req) => {
          const corps = await req.json().catch(() => ({}));
          if (corps.sessionToken !== "jeton-valide") return Response.json({ ok: false, error: "IDLE_SESSION_INVALIDE" }, { status: 401 });
          if (corps.operation === "estAdminSorealIdle") return Response.json({ ok: true, isAdmin: admin });
          if (corps.operation === "listerHistoiresAdminSorealIdle") return Response.json({ ok: true, histoires: [{ voix: ["aaaaaaaaaaaaaa"] }, { voix: [] }] });
          if (corps.operation === "listerTextesAdminSorealIdle") return Response.json({ ok: true, popups: [], boss: [] });
          return Response.json({ ok: false }, { status: 400 });
        }
      })
    },
    SOREAL_R2: {
      list: async ({ prefix }) => ({ objects: cles.filter((c) => c.key.startsWith(prefix)), truncated: false }),
      delete: async (liste) => { supprimes.push(...(Array.isArray(liste) ? liste : [liste])); }
    }
  };
  return { env, supprimes };
}
const purge = (env, dry, jeton = "jeton-valide") => worker.fetch(new Request("https://idle.test/api/v1/voice-purge" + (dry ? "?dry=1" : ""), { method: "POST", headers: jeton ? { authorization: "Bearer " + jeton } : {} }), env);

// 1. Simulation : compte sans rien supprimer.
{
  const { env, supprimes } = fabriquerEnv({ admin: true });
  const d = await (await purge(env, true)).json();
  assert.deepEqual({ ok: d.ok, supprimees: d.supprimees, gardees: d.gardees, octetsLiberes: d.octetsLiberes, simulation: d.simulation }, { ok: true, supprimees: 2, gardees: 1, octetsLiberes: 5000, simulation: true });
  assert.deepEqual(supprimes, [], "la simulation ne supprime rien");
}

// 2. Purge réelle : seules les voix inutilisées de idle/voix/ partent ; les voix utilisées et les images restent.
{
  const { env, supprimes } = fabriquerEnv({ admin: true });
  const d = await (await purge(env, false)).json();
  assert.equal(d.supprimees, 2);
  assert.deepEqual(supprimes.sort(), ["idle/voix/bbbbbbbbbbbbbb.m4a", "idle/voix/cccccccccccccc.m4a"]);
  assert.ok(!supprimes.some((k) => k.includes("aaaaaaaaaaaaaa") || k.includes("story")), "voix utilisée et images intactes");
}

// 3. Pas administrateur, pas de jeton ou jeton invalide : refusé, rien de supprimé.
{
  for (const [admin, jeton] of [[false, "jeton-valide"], [true, ""], [true, "faux"]]) {
    const { env, supprimes } = fabriquerEnv({ admin });
    const r = await purge(env, false, jeton);
    assert.equal(r.status, 403);
    assert.deepEqual(supprimes, []);
  }
}

// 4. Menu Admin : bouton de nettoyage avec comptage puis confirmation ; les empreintes périmées sont retirées à l'enregistrement.
{
  const admin = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
  assert.match(admin, /🧹 Supprimer les voix inutiles/);
  assert.match(admin, /fetch\('\/api\/v1\/voice-purge'\+\(dry\?'\?dry=1':''\)/, "comptage (dry) avant la suppression");
  assert.match(admin, /window\.confirm\('Supprimer '\+d\.supprimees/, "confirmation avant de supprimer");
  assert.match(admin, /edition\.voix=\(edition\.voix\|\|\[\]\)\.filter\(function\(h\)\{return actuelles\[h\];\}\)/, "empreintes de textes modifiés retirées à l'enregistrement");
  assert.match(admin, /if\(tts_\(\)&&typeof tts_\(\)\.planNarration==='function'\)edition\.voix/, "jamais d'élagage sans le module de narration");
}

// 5. Voix des textes modifiés (chroniques de boss, popups) et voix pré-générées du manifeste (public/voice/manifest.json) : jamais purgées (Norman, 2026-10-02).
{
  const { env, supprimes } = fabriquerEnv({ admin: true });
  const appelBase = env.SOREAL_IDLE.get().fetch;
  env.SOREAL_IDLE.get = () => ({
    fetch: async (req) => {
      const copie = req.clone();
      const corps = await copie.json().catch(() => ({}));
      if (corps.operation === "listerTextesAdminSorealIdle") return Response.json({ ok: true, popups: [{ cle: "tuto:debut:0", voix: ["bbbbbbbbbbbbbb"] }], boss: [{ numero: 1, surcharge: null }, { numero: 2, surcharge: { voix: [] } }] });
      return appelBase(req);
    }
  });
  env.ASSETS = { fetch: async () => Response.json({ files: ["cccccccccccccc"] }) };
  const d = await (await purge(env, false)).json();
  assert.deepEqual({ ok: d.ok, supprimees: d.supprimees, gardees: d.gardees }, { ok: true, supprimees: 0, gardees: 3 }, "voix d'histoire + de texte modifié + du manifeste : toutes gardées");
  assert.deepEqual(supprimes, []);
  // Liste des textes illisible : on ne supprime rien.
  const { env: env2, supprimes: s2 } = fabriquerEnv({ admin: true });
  const base2 = env2.SOREAL_IDLE.get().fetch;
  env2.SOREAL_IDLE.get = () => ({ fetch: async (req) => { const c = await req.clone().json().catch(() => ({})); return c.operation === "listerTextesAdminSorealIdle" ? Response.json({ ok: false }, { status: 500 }) : base2(req); } });
  const r2 = await purge(env2, false);
  assert.equal(r2.status, 502);
  assert.deepEqual(s2, [], "textes illisibles : rien supprimé");
  // Manifeste illisible : rien supprimé non plus.
  const { env: env3, supprimes: s3 } = fabriquerEnv({ admin: true });
  env3.ASSETS = { fetch: async () => new Response("nope", { status: 404 }) };
  const r3 = await purge(env3, false);
  assert.equal(r3.status, 502);
  assert.deepEqual(s3, []);
}

console.log("idle-voice-purge-v1: OK");
