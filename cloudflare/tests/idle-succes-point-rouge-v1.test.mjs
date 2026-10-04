import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-04) : « dans succès, quand un succès est nouveau, il faut un point rouge pour signaler qu'il y a un trophée non vu — dans le menu, pas sur le menu du haut : sur la catégorie du trophée débloqué. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const profil = readFileSync("cloudflare/public/modules/profile-v1.js", "utf8");

// 1. Suivi des trophées nouveaux : extrait de l'interface avec un faux stockage.
const debut = ui.indexOf("      const CLE_SUCCES_VUS_V1=");
const fin = ui.indexOf("      function idleMenuEtatAnimeIdleV1_(id,j){");
assert.ok(debut > 0 && fin > debut);
const stockage = {};
const fabrique = new Function("localStorage", "idleEtat", "idleMenuActifV28", "window", ui.slice(debut, fin) + "\nreturn {nonVus:succesNonVusIdleV1_, nouveaux:window.__SOREAL_IDLE_SUCCES_NOUVEAUX_V1__, vus:succesVusIdleV1_, setMenu:(m)=>{idleMenuActifV28=m;}, setEtat:(e)=>{idleEtat=e;}};");
const fenetre = {};
const faux = { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = v; } };
const jeu = (...ids) => ({ systemes: { achievements: { list: ids.map((id) => ({ id, unlocked: true })) } } });
const o = fabrique(faux, jeu("a"), "aventure", fenetre);

assert.equal(o.nonVus(jeu("a"), "aventure"), false, "première visite : l'existant est considéré comme vu");
assert.deepEqual(o.nouveaux(), []);
// Un trophée arrive pendant qu'on joue ailleurs : le menu du haut s'anime (déjà en place), la page n'a encore rien capturé.
o.setEtat(jeu("a", "b")); o.setMenu("aventure");
assert.equal(o.nonVus(jeu("a", "b"), "aventure"), true);
assert.deepEqual(o.nouveaux(), []);
// On ouvre le menu : le trophée est signalé (point rouge) puis marqué comme vu.
o.setMenu("succes");
assert.deepEqual(o.nouveaux(), ["b"], "le trophée nouveau est signalé dans le menu");
assert.deepEqual(JSON.parse(stockage.soreal_idle_succes_vus_v1), ["a", "b"], "marqué comme vu");
assert.deepEqual(o.nouveaux(), ["b"], "le point reste tant qu'on est dans le menu (rendus suivants)");
// Un autre trophée tombe pendant qu'on est dans le menu : il s'ajoute.
o.setEtat(jeu("a", "b", "c"));
assert.deepEqual(o.nouveaux(), ["b", "c"]);
// On quitte le menu : plus de point ; on y revient : rien de nouveau.
o.setMenu("aventure");
assert.equal(o.nonVus(jeu("a", "b", "c"), "aventure"), false);
o.setMenu("succes");
assert.deepEqual(o.nouveaux(), [], "plus rien de nouveau au retour");

// 2. La page : point rouge sur la catégorie ET sur le trophée nouveau, seulement pour ceux-là ; aucun total (anti-spoil).
const window_ = {
  __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => null, idleHtml_: (v) => String(v == null ? "" : v).replace(/</g, "&lt;"), idleNombre_: (v) => Number(v) || 0, idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)), formatGrandNombreIdleV70_: (v) => String(v), entetePageIdleV28_: (t, s) => "<h1>" + t + "</h1>", appelerProgressionIdleCloudflareV1_() {} },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; }, head: { appendChild() {} }, createElement: () => ({}) }
};
const sandbox = { window: window_, document: window_.document, SOREAL_SESSION: null };
vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8"), sandbox);
vm.runInNewContext(profil, sandbox);
const ctx = { bosses: 100 };
const etat = normalizeIdleNguState({}, ctx, 0);
const snap = idleNguSnapshot(etat, ctx, 0);
const debloques = snap.achievements.list.filter((x) => x.unlocked);
const page = (nouveaux) => { window_.__SOREAL_IDLE_SUCCES_NOUVEAUX_V1__ = () => nouveaux; return window_.__SOREAL_IDLE_PROFILE_V1__.page({ systemes: snap }); };
if (debloques.length) {
  const un = debloques[0];
  const html = page([un.id]);
  assert.ok(html.includes('class="idle-succes-pt-v1" data-nouveaux="1"'), "point rouge sur la catégorie du trophée");
  assert.equal((html.match(/idle-succes-item-v1 nouveau/g) || []).length, 1, "et sur le trophée lui-même");
  assert.doesNotMatch(page([]), /idle-succes-pt-v1" data-nouveaux|item-v1 nouveau/, "aucun point sans trophée nouveau");
}
assert.ok(profil.includes(".idle-succes-pt-v1{") && profil.includes("#ff3b30") && profil.includes("prefers-reduced-motion"), "point rouge stylé, animation réduite si demandé");
assert.doesNotMatch(page(debloques.length ? [debloques[0].id] : []), /\/ 153|\?\?\?/, "aucun total, aucun « ??? » dans la page rendue");
console.log("idle-succes-point-rouge-v1: OK (" + debloques.length + " trophées débloqués dans le snapshot de test)");
