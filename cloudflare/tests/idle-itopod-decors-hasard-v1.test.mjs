import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleItopodRosterReponseV1, idleItopodEtagesV1, idleItopodImagePartageeV1 } from "../src/idle-itopod-roster-v1.js";

/*
 * Norman (2026-10-04) : ITOPOD calqué sur le mode Aventure (image de l'ennemi, nom dessous, choix des étages dessous), style propre de tour infinie, décors du R2 idle/itopod/ de 1 à 10 pour les 10 étages,
 * avatars et prénoms de l'équipe. Constat en production : la liste des ouvriers ne contenait que Norman et Sébastien, sans avatar (TV répond 401 aux appels sans session).
 */
// 1. Serveur : l'hôte INTERNE de TV (seul exempté du verrou « session exigée ») et les décors idle/itopod/ numérotés de 1 à 10.
{
  const urls = [];
  const env = {
    SOREAL_TV_API: { fetch: async (req) => { urls.push(req.url); return new Response(JSON.stringify({ ready: true, parEmail: { a: { nom: "Alexandra", avatarUrl: "/assets/shared/avatars/level-2/alexandra.webp" } } }), { status: 200 }); } },
    SOREAL_R2: { list: async ({ prefix }) => ({ objects: (prefix === "idle/itopod/" ? ["idle/itopod/2.webp", "idle/itopod/1.webp", "idle/itopod/etage-10.png", "idle/itopod/11.webp", "idle/itopod/notes.txt"] : ["shared/avatar-backgrounds/level-1/a.webp"]).map((key) => ({ key })), truncated: false }) }
  };
  const j = await (await idleItopodRosterReponseV1(new Request("https://x/"), env)).json();
  assert.deepEqual(urls, ["https://soreal-tv.internal/api/cosmetiques-equipe"], "hôte interne de TV");
  assert.ok(j.workers.some((w) => w.nom === "Alexandra" && w.avatar === "shared/avatars/level-2/alexandra.webp"), "prénom et avatar de l'ouvrier");
  assert.deepEqual(j.etages, { 1: "idle/itopod/1.webp", 2: "idle/itopod/2.webp", 10: "idle/itopod/etage-10.png" }, "un décor par étage de 1 à 10, rien d'autre");
  assert.equal(j.complete, true);
  assert.deepEqual(idleItopodEtagesV1(["idle/itopod/03-b.webp", "idle/itopod/03-a.webp"]), { 3: "idle/itopod/03-a.webp" });
  // Les images idle/itopod/ passent par la route partagée.
  const img = await idleItopodImagePartageeV1(new Request("https://x/"), { SOREAL_R2: { get: async (k) => (k === "idle/itopod/1.webp" ? { body: "x", httpEtag: "e" } : null) } }, new URL("https://x/api/idle/media/shared?key=idle%2Fitopod%2F1.webp"));
  assert.equal(img.status, 200);
}

// 2. Client : étage N → décor ((N − 1) mod 10) + 1, toujours le même ; avatar et prénom de l'ouvrier ; ordre image → nom ; style propre.
const src = readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8");
const fenetre = {};
const etages = {};
for (let n = 1; n <= 10; n += 1) etages[n] = "idle/itopod/" + n + ".webp";
const reponse = { ok: true, workers: [{ nom: "Alexandra", avatar: "shared/avatars/level-2/a.webp" }, { nom: "Sébastien", avatar: "" }], etages };
const ctx = { window: fenetre, document: { querySelectorAll: () => [] }, fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(reponse) }), Date, Math };
vm.runInNewContext(src, ctx);
const api = fenetre.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
api.html({ floor: 3, kills: 30, killsOnFloor: 0 });
await new Promise((r) => setTimeout(r, 20));
const html = (etage, kills = 0) => api.html({ floor: etage, kills, killsOnFloor: kills % 10 });
const decor = (h) => decodeURIComponent(h.match(/class="itp-decor" src="([^"]+)"/)[1]).split("key=")[1];
for (let e = 1; e <= 25; e += 1) assert.equal(decor(html(e)), "idle/itopod/" + (((e - 1) % 10) + 1) + ".webp", "décor de l'étage " + e);
assert.equal(decor(html(0)), "idle/itopod/1.webp");
assert.equal(decor(html(7, 3)), decor(html(7, 88)), "même décor pour un même étage, quel que soit l'ennemi");
const h1 = html(5, 7);
assert.ok(/Alexandra|Sébastien/.test(h1), "prénom d'un ouvrier");
assert.ok(h1.indexOf("itp-cadre") < h1.indexOf("itp-nom"), "l'image de l'ennemi d'abord, son nom en dessous");
let avecAvatar = 0;
for (let k = 0; k < 20; k += 1) if (html(5, k).includes("shared%2Favatars%2Flevel-2%2Fa.webp") && html(5, k).includes('class="itp-avatar"')) avecAvatar += 1;
assert.ok(avecAvatar > 0, "avatar de l'ouvrier dans l'arène");
assert.ok(html(5, 7).match(/itp-pip plein/g).length === 7, "pastilles : ennemis vaincus sur l'étage");

// 3. Page : le choix des étages vient APRÈS l'arène ; champs de saisie « jeu » avec − et + ; la feuille de style existe et est chargée.
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = meta.slice(meta.indexOf("function pageItopodIdleV1_"), meta.indexOf("function itopodEtagesIdleV1_"));
assert.ok(page.indexOf("ITOPOD_SCENE_V1__.html(d)") < page.indexOf("itp-montee"), "arène puis choix des étages");
assert.ok(page.includes("itopodDebutV1") && page.includes("itopodFinV1") && page.includes("itp-pas-bouton"));
const css = readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8");
assert.ok(css.includes(".itp-arene") && css.includes('input[type="number"]') && css.includes("select"), "style de la tour et zones de saisie");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/soreal-idle-jeu.css?v="), "feuille chargée");
console.log("idle-itopod-decors-hasard-v1: OK");

// 4. Avatars : les profils de TV (prénoms) ; les fichiers de shared/avatars/ sans profil (« Avatar 01 », monstres…) ne deviennent PAS des ennemis ; comptes techniques exclus.
{
  const { idleItopodRosterV1 } = await import("../src/idle-itopod-roster-v1.js");
  const w = idleItopodRosterV1({ parEmail: { a: { nom: "Compte", avatarUrl: "" }, b: { nom: "CompteTV", avatarUrl: "" }, c: { nom: "Alessandro", avatarUrl: "/assets/shared/avatars/level-1/x.webp" } } });
  assert.deepEqual(w.map((x) => x.nom), ["Alessandro", "Norman", "Sébastien"]);
}

// 5. Magasin des Perks : vitrines à part, image du wiki par achat (/perks/<id>.webp), aucun total.
{
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  const page = meta.slice(meta.indexOf("function pagePerksIdleV1_"), meta.indexOf("function pageQuirksIdleV1_"));
  assert.ok(page.includes("/perks/") && page.includes("pk-vitrine") && page.includes("Perk Emporium"));
  assert.ok(!/defs\.length/.test(page), "pas de total de perks (anti-spoil)");
  const { readdirSync } = await import("node:fs");
  const ids = [...readFileSync("cloudflare/src/idle-perks-v1.js", "utf8").matchAll(/\{ id: (\d+), name/g)].map((m) => m[1]);
  const fichiers = new Set(readdirSync("cloudflare/public/perks"));
  assert.deepEqual(ids.filter((i) => !fichiers.has(i + ".webp")), [], "une image par perk du catalogue");
}
console.log("idle-itopod-decors-hasard-v1 (avatars, perks): OK");
