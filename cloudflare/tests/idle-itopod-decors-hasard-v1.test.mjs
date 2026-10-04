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
assert.ok(html(5, 7).match(/itp-pip plein/g).length === 8, "pastilles : ennemi n° 8 en cours");

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

// 6. Avatars transparents sans cadre ; Level 1 flottants ; barre de vie qui descend coup après coup ; entrée dans la tour ; le serveur donne le nombre de coups (towerHitsV1).
{
  const sc = readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8");
  const fen = {};
  vm.runInNewContext(sc, { window: fen, document: { querySelectorAll: () => [] }, fetch: () => Promise.reject(new Error("x")), Date, Math });
  const api = fen.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  assert.equal(api.estFlottant("shared/avatars/level-1/a.webp"), true);
  assert.equal(api.estFlottant("shared/avatars/level-2/a.webp"), false);
  api.html({ floor: 3, kills: 30, killsOnFloor: 0, hitsParKill: 4, intervalS: 1, respawnS: 4, actif: true });
  assert.equal(api.combat.hits, 4);
  const css2 = readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8");
  assert.ok(/\.itp-ennemi \.itp-avatar\{[^}]*bottom:0[^}]*border:0[^}]*background:none/.test(css2), "avatar sans cadre, collé au bas");
  assert.ok(css2.includes(".itp-avatar.itp-flotte") && css2.includes("itpPoing") && css2.includes(".itp-vie-rempli"));
  const prog = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
  assert.ok(prog.includes("d.hitsParKill = towerHitsV1(power, idleBonus, d.floor);"), "coups par ennemi donnés à l'écran");
  const m2 = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(m2.includes("toggleSystemeMetaIdleV130_('tower')") && m2.includes("Entrer dans l’ITOPOD"), "bouton pour entrer dans la tour");
}
console.log("idle-itopod-decors-hasard-v1 (combat): OK");

// 7. Pastilles : la pastille k s'allume à l'APPARITION de l'ennemi n° k (la 1re dès le début, la 10e au dernier ennemi) ; pas de compteur en texte.
{
  const sc = readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8");
  const fen = {};
  vm.runInNewContext(sc, { window: fen, document: { querySelectorAll: () => [] }, fetch: () => Promise.reject(new Error("x")), Date, Math });
  const api = fen.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  const allumees = (sur) => (api.html({ floor: 5, kills: 50 + sur, killsOnFloor: sur }).match(/itp-pip plein/g) || []).length;
  assert.equal(allumees(0), 1, "ennemi n° 1 : une pastille");
  assert.equal(allumees(4), 5);
  assert.equal(allumees(9), 10, "ennemi n° 10 : les dix pastilles");
  assert.ok(!api.html({ floor: 5, kills: 57, killsOnFloor: 7 }).includes("itp-compte"), "plus de compteur en texte");
}
console.log("idle-itopod-decors-hasard-v1 (pastilles): OK");

// 8. Joueurs (Google…) : leur prénom devient un ennemi avec un avatar tiré au hasard, différent pour chacun, jamais du Level 1 ni un monstre ; Justine a une combattante.
{
  const { idleItopodAjouterJoueursV1, idleItopodRosterV1 } = await import("../src/idle-itopod-roster-v1.js");
  const cles = ["shared/avatars/level-1/orbe.webp", "shared/avatars/level-3/soreal-avatar-066-guerriere.webp", "shared/avatars/level-3/soreal-avatar-033-shoggoth.webp"];
  for (let i = 0; i < 12; i += 1) cles.push("shared/avatars/level-2/soreal-avatar-1" + String(i).padStart(2, "0") + "-soldat.webp");
  const base = idleItopodRosterV1({ parEmail: { a: { nom: "Alessandro", avatarUrl: "/assets/shared/avatars/level-2/soreal-avatar-100-soldat.webp" } } });
  const w = idleItopodAjouterJoueursV1(base, ["Justine", "Alessandro", "Maria", "Paul", "Zoé"], cles);
  const par = Object.fromEntries(w.map((x) => [x.nom, x.avatar]));
  assert.equal(par.Justine, "shared/avatars/level-3/soreal-avatar-066-guerriere.webp");
  const nouveaux = ["Maria", "Paul", "Zoé"].map((n) => par[n]);
  assert.equal(new Set([...nouveaux, par.Alessandro, par.Justine]).size, 5, "un avatar différent pour chacun");
  for (const a of nouveaux) assert.ok(a && !a.includes("level-1") && !/shoggoth/.test(a) && a !== par.Alessandro, "ni Level 1, ni monstre, ni celui d'un ouvrier");
  assert.equal(w.filter((x) => x.nom === "Alessandro").length, 1, "un ouvrier n'est pas dédoublé");
  assert.deepEqual(idleItopodAjouterJoueursV1(base, ["Maria"], cles), idleItopodAjouterJoueursV1(base, ["Maria"], cles), "choix stable");
  const coord = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
  assert.ok(coord.includes("/__soreal-idle-v1/noms-joueurs") && !/noms-joueurs[\s\S]{0,700}email_primary/.test(coord), "prénoms seulement, jamais d'e-mail");
}
console.log("idle-itopod-decors-hasard-v1 (joueurs): OK");

// 9. Étages 5 à 6 choisis : l'écran ne monte jamais au 7 (à l'étage de fin, retour à l'étage de départ, comme le serveur).
{
  const sc = readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8");
  const fen = {};
  vm.runInNewContext(sc, { window: fen, document: { querySelectorAll: () => [] }, fetch: () => Promise.reject(new Error("x")), Date, Math });
  const api = fen.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  const etageAffiche = (d, decalage) => { api.html(d); api.combat.decalage = decalage; return Number(api.html(d).match(/<b>(\d+)<\/b><\/span>/)[1]); };
  const d = { floor: 5, kills: 100, killsOnFloor: 0, startFloor: 5, endFloor: 6, optimalFloor: 20, hitsParKill: 1, actif: true };
  const vus = new Set();
  for (let k = 0; k < 60; k += 1) vus.add(etageAffiche(d, k));
  assert.deepEqual([...vus].sort(), [5, 6], "seulement les étages 5 et 6");
  assert.equal(etageAffiche({ ...d, floor: 6 }, 10), 5, "10 combats sur l'étage de fin : retour au départ");
  assert.equal(etageAffiche({ floor: 5, kills: 100, killsOnFloor: 0, optimalFloor: 7, hitsParKill: 1 }, 100), 7, "automatique : jusqu'à l'étage optimal, pas au-delà");
}
console.log("idle-itopod-decors-hasard-v1 (étages choisis): OK");
