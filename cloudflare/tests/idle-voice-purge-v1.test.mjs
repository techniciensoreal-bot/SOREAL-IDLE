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

console.log("idle-voice-purge-v1: OK");
