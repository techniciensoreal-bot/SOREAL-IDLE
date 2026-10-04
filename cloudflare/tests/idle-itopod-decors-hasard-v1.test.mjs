import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleItopodRosterReponseV1 } from "../src/idle-itopod-roster-v1.js";

/*
 * Norman (2026-10-04) : « dans ITOPOD, utilise des décors au hasard présents dans soreal/shared/avatar-backgrounds/, les prénoms des ouvriers et leurs avatars, dans un cadre au format du décor, pas trop grand pas
 * trop petit, avec l'avatar de l'ouvrier/responsable. » Constat en production : la liste des ouvriers ne contenait que Norman et Sébastien, sans avatar (TV répond 401 aux appels sans session).
 */
// 1. Serveur : la liaison de service appelle l'hôte INTERNE de TV (seul exempté du verrou « session exigée »), plus l'adresse publique.
{
  const urls = [];
  const env = {
    SOREAL_TV_API: { fetch: async (req) => { urls.push(req.url); return new Response(JSON.stringify({ ready: true, parEmail: { a: { nom: "Alexandra", avatarUrl: "/assets/shared/avatars/level-2/alexandra.webp" } } }), { status: 200 }); } },
    SOREAL_R2: { list: async () => ({ objects: [{ key: "shared/avatar-backgrounds/level-1/a.webp" }], truncated: false }) }
  };
  const r = await idleItopodRosterReponseV1(new Request("https://x/"), env);
  const j = await r.json();
  assert.deepEqual(urls, ["https://soreal-tv.internal/api/cosmetiques-equipe"], "hôte interne de TV");
  assert.ok(j.workers.some((w) => w.nom === "Alexandra" && w.avatar === "shared/avatars/level-2/alexandra.webp"), "prénom et avatar de l'ouvrier");
  assert.equal(j.complete, true);
}

// 2. Client : décor tiré au hasard parmi TOUS les décors (tous Levels), jamais le même deux fois de suite, stable pour un même ennemi ; cadre au format du décor.
const src = readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8");
const fenetre = {};
const reponse = { ok: true, workers: [{ nom: "Alexandra", avatar: "shared/avatars/level-2/a.webp" }, { nom: "Sébastien", avatar: "" }], decors: { 1: ["shared/avatar-backgrounds/level-1/a.webp", "shared/avatar-backgrounds/level-1/b.webp"], 2: ["shared/avatar-backgrounds/level-2/c.webp"], 3: [], 4: ["shared/avatar-backgrounds/level-4/d.webp", "shared/avatar-backgrounds/level-4/e.webp"], 5: [], 6: [] } };
const ctx = { window: fenetre, document: { querySelectorAll: () => [] }, fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(reponse) }), Date, Math };
vm.runInNewContext(src, ctx);
const api = fenetre.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
api.html({ floor: 3, kills: 30, killsOnFloor: 0 });
await new Promise((r) => setTimeout(r, 20));
const html = (kills, etage = 3) => api.html({ floor: etage, kills, killsOnFloor: kills % 10 });
const decors = new Set();
let precedent = "";
for (let k = 0; k < 300; k += 1) {
  const m = html(k).match(/class="fond" src="([^"]+)"/);
  assert.ok(m, "un décor à chaque ennemi");
  const d = decodeURIComponent(m[1]);
  assert.notEqual(d, precedent, "jamais le même décor deux fois de suite (ennemi " + k + ")");
  precedent = d; decors.add(d);
}
assert.equal(decors.size, 5, "tous les décors de tous les Levels sont utilisés, au hasard");
assert.equal(html(42), html(42), "stable d'un rendu à l'autre pour un même ennemi");
assert.ok(new Set(Array.from({ length: 12 }, (_, k) => html(k).match(/class="fond" src="([^"]+)"/)[1])).size >= 3, "ça varie vraiment");
// Cadre : prénom de l'ouvrier, avatar (proportionnel), image du décor qui donne sa hauteur, largeur raisonnable.
const h1 = html(7);
assert.ok(h1.includes("Alexandra") || h1.includes("Sébastien"), "prénom d'un ouvrier");
assert.ok(h1.includes("max-width:260px") && h1.includes("height:auto") && h1.includes("max-height:420px"), "cadre au format du décor, ni trop grand ni trop petit");
let avecAvatar = 0;
for (let k = 0; k < 20; k += 1) if (html(k).includes("shared%2Favatars%2Flevel-2%2Fa.webp") && html(k).includes("width:42%")) avecAvatar += 1;
assert.ok(avecAvatar > 0, "avatar de l'ouvrier dans le cadre");
console.log("idle-itopod-decors-hasard-v1: OK");
