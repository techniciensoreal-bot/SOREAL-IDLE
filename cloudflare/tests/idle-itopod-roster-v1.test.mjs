import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  idleItopodCleR2V1,
  idleItopodRosterV1,
  idleItopodDecorsParNiveauV1,
  idleItopodRosterReponseV1,
  idleItopodImagePartageeV1
} from "../src/idle-itopod-roster-v1.js";

/*
 * ITOPOD (2026-09-26) : les ennemis portent les prénoms des ouvriers et leur avatar ; décors Level 1 à 6 ; Norman et Sébastien toujours présents.
 */
const cosmetics = {
  ok: true,
  parEmail: {
    "a@x.be": { email: "a@x.be", nom: "Alessandro", avatarUrl: "/assets/shared/avatars/level-1/soreal-avatar-007-tigre.webp?v=1" },
    "b@x.be": { email: "b@x.be", nom: "Alexis", avatarUrl: "/assets/shared/avatars/level-3/soreal-avatar-065-forces-speciales.webp" },
    "c@x.be": { email: "c@x.be", nom: "Bienvenue", avatarUrl: "/assets/shared/avatars/level-1/x.webp" },
    "d@x.be": { email: "d@x.be", nom: "Sébastien", avatarUrl: "/assets/shared/avatars/level-2/seb.webp" },
    "e@x.be": { email: "e@x.be", nom: "Piégé", avatarUrl: "/assets/../secret/x.webp" }
  }
};

// Clés R2 : seulement les dossiers partagés, jamais de remontée ni d'autre dossier
assert.equal(idleItopodCleR2V1("/assets/shared/avatars/level-1/a.webp?v=3", "shared/avatars/"), "shared/avatars/level-1/a.webp");
assert.equal(idleItopodCleR2V1("/assets/shared/avatars/../secret/a.webp", "shared/avatars/"), "");
assert.equal(idleItopodCleR2V1("/assets/idle/items/a.webp", "shared/avatars/"), "");
assert.equal(idleItopodCleR2V1("/assets/shared/avatars/level-1/a.exe", "shared/avatars/"), "");
assert.equal(idleItopodCleR2V1("/assets/shared/avatars/level-5/02_paladin_sacr%C3%A9.webp?v=1", "shared/avatars/"), "shared/avatars/level-5/02_paladin_sacré.webp", "accents acceptés");
assert.equal(idleItopodCleR2V1("//shared/avatars/level-1/a.webp", "shared/avatars/"), "shared/avatars/level-1/a.webp");

// Liste : prénoms et avatars, sans e-mail, sans le profil d'accueil ; Norman et Sébastien toujours là
{
  const r = idleItopodRosterV1(cosmetics);
  assert.deepEqual(r.map((w) => w.nom), ["Alessandro", "Alexis", "Norman", "Piégé", "Sébastien"]);
  assert.equal(r.find((w) => w.nom === "Alessandro").avatar, "shared/avatars/level-1/soreal-avatar-007-tigre.webp");
  assert.equal(r.find((w) => w.nom === "Norman").avatar, "", "Norman sans profil : présent sans avatar");
  assert.equal(r.find((w) => w.nom === "Piégé").avatar, "", "chemin piégé refusé");
  assert.equal(JSON.stringify(r).includes("@"), false, "aucune adresse e-mail");
  assert.deepEqual(idleItopodRosterV1(null).map((w) => w.nom), ["Norman", "Sébastien"], "TV injoignable : au moins les deux");
  // la liste grandit avec l'équipe
  const plus = { parEmail: { ...cosmetics.parEmail, "f@x.be": { nom: "Nouveau", avatarUrl: "/assets/shared/avatars/level-1/n.webp" } } };
  assert.ok(idleItopodRosterV1(plus).some((w) => w.nom === "Nouveau"));
}

// Décors par Level 1 à 6
{
  const d = idleItopodDecorsParNiveauV1(["shared/avatar-backgrounds/level-1/b.webp", "shared/avatar-backgrounds/level-1/a.webp", "shared/avatar-backgrounds/level-6/z.webp", "shared/avatars/level-1/x.webp", "shared/avatar-backgrounds/level-9/n.webp"]);
  assert.deepEqual(d[1], ["shared/avatar-backgrounds/level-1/a.webp", "shared/avatar-backgrounds/level-1/b.webp"]);
  assert.deepEqual(d[6], ["shared/avatar-backgrounds/level-6/z.webp"]);
  assert.deepEqual(Object.keys(d), ["1", "2", "3", "4", "5", "6"]);
}

// Route : TV + R2 ; cache ; TV en panne
{
  const env = { SOREAL_R2: { list: async () => ({ objects: [{ key: "shared/avatar-backgrounds/level-2/d.webp" }], truncated: false }) } };
  let appels = 0;
  const r = await idleItopodRosterReponseV1(new Request("https://x/"), env, async () => { appels++; return new Response(JSON.stringify(cosmetics), { status: 200 }); });
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.equal(j.complete, true);
  assert.ok(j.workers.some((w) => w.nom === "Alexis"));
  assert.deepEqual(j.decors[2], ["shared/avatar-backgrounds/level-2/d.webp"]);
  await idleItopodRosterReponseV1(new Request("https://x/"), env, async () => { appels++; throw new Error("ne doit pas être rappelé"); });
  assert.equal(appels, 1, "réponse gardée en cache");
}

// Image partagée : dossiers autorisés seulement
{
  const objet = { body: "img", httpEtag: '"e"', writeHttpMetadata(h) { h.set("content-type", "image/webp"); } };
  const env = { SOREAL_R2: { get: async (k) => (k === "shared/avatars/level-1/a.webp" ? objet : null) } };
  const ok = await idleItopodImagePartageeV1(new Request("https://x/"), env, new URL("https://x/api/idle/media/shared?key=" + encodeURIComponent("shared/avatars/level-1/a.webp")));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-type"), "image/webp");
  const mauvais = await idleItopodImagePartageeV1(new Request("https://x/"), env, new URL("https://x/api/idle/media/shared?key=" + encodeURIComponent("idle/items/a.webp")));
  assert.equal(mauvais.status, 400);
  const absent = await idleItopodImagePartageeV1(new Request("https://x/"), env, new URL("https://x/api/idle/media/shared?key=" + encodeURIComponent("shared/avatars/level-1/zzz.webp")));
  assert.equal(absent.status, 404);
}

// Routes câblées dans le module média
{
  const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
  assert.ok(media.includes('"/api/idle/media/roster"') && media.includes('"/api/idle/media/shared"'));
}

// Client : Level de décor selon le palier, ennemi jamais répété deux fois de suite
{
  const fenetre = {};
  vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8"), { window: fenetre, document: { querySelectorAll: () => [] }, fetch: () => Promise.reject(new Error("x")), Date });
  const api = fenetre.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  assert.equal(api.palier(0), 1);
  assert.equal(api.palier(1599), 32);
  assert.equal(api.niveauDecor(0), 1);
  assert.equal(api.niveauDecor(1599), 6);
  const niveaux = new Set(Array.from({ length: 32 }, (_, i) => api.niveauDecor(i * 50)));
  assert.deepEqual([...niveaux].sort(), [1, 2, 3, 4, 5, 6], "les 32 paliers couvrent les 6 Levels");
  for (const n of [2, 3, 5, 7, 12, 23, 24]) {
    let prev = -1;
    for (let k = 0; k < 200; k++) {
      const i = api.indexEnnemi(n, k, 10);
      assert.ok(i >= 0 && i < n);
      assert.notEqual(i, prev, "deux ennemis de suite identiques (n=" + n + ")");
      prev = i;
    }
  }
  // sans liste chargée : le Dude d'origine
  assert.ok(api.html({ floor: 12, kills: 121, killsOnFloor: 1 }).includes("Pissed Off Dude"));
}
console.log("idle-itopod-roster-v1: OK");
