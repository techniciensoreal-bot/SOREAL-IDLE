import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { analyserMedias } from "../tools/manifeste-medias-v1.mjs";
import { IDLE_BOSS_FICHIERS_R2_V1, idleBossCleR2V1 } from "../src/idle-boss-cles-v1.js";

/*
 * T10 (audit de coherence 2026-11-09, Front 7) : medias references par le code.
 * 1. Toute adresse LITTERALE de media (/shop/x.png, /perks/...) existe dans cloudflare/public.
 * 2. Le nombre de fichiers orphelins ne peut PAS augmenter (cliquet : valeurs mesurees le 2026-11-09). Pour le baisser, supprimer le fichier (avec l'accord de Norman) PUIS baisser la valeur ;
 *    un nouveau media doit etre cite (litteralement, par prefixe dynamique ou par son nom) dans le code.
 * 3. Chaque boss 1..301 se resout : image statique du theme Magic (public/magic/boss/N.webp) ET cle R2 de la table du Worker (idle-boss-cles-v1.js) ; aucun appel a R2 ici.
 */
const r = analyserMedias();
assert.deepEqual(r.manquantes, [], "adresses de medias litterales qui n'existent pas dans public : " + JSON.stringify(r.manquantes));

const MAX_ORPHELINS = 6;   /* 2026-11-09 : garderie/armoire-v1.webp supprimé sur ordre de Norman (« armoire V1 plus besoin ») */
const MAX_OCTETS_ORPHELINS = 326898;
assert.ok(r.orphelins.length <= MAX_ORPHELINS, "orphelins en hausse (" + r.orphelins.length + " > " + MAX_ORPHELINS + ") : " + r.orphelins.map((o) => o.url).join(", "));
assert.ok(r.octetsOrphelins <= MAX_OCTETS_ORPHELINS, "poids des orphelins en hausse : " + r.octetsOrphelins);
assert.ok(r.prefixesDynamiques.includes("/perks/") && r.prefixesDynamiques.includes("/shop/"), "le manifeste reconnait les adresses construites par concatenation");

// Bosses : table de cles R2 complete et sans doublon.
const ids = Object.keys(IDLE_BOSS_FICHIERS_R2_V1).map(Number).sort((a, b) => a - b);
assert.equal(ids.length, 301);
for (let n = 1; n <= 301; n++) {
  assert.equal(ids[n - 1], n, "id " + n + " absent de la table des cles R2");
  const cle = idleBossCleR2V1(n);
  assert.match(cle, new RegExp("^idle/bosses/Boss_" + String(n).padStart(3, "0") + "_[^/]*[.](png|webp)$"), "cle R2 du boss " + n);
  const statique = existsSync("cloudflare/public/magic/boss/" + n + ".webp");
  assert.ok(cle, "boss " + n + " non resolu (statique " + statique + ")");
}
assert.equal(idleBossCleR2V1(0), "");
assert.equal(idleBossCleR2V1(302), "");
// Le theme Magic (statique) ne depasse pas 301 images et ne contient que des ids de la table.
const themeSrc = readFileSync("cloudflare/public/modules/theme-images-v1.js", "utf8");
assert.ok(/n<=301/.test(themeSrc), "le theme Magic borne les boss a 301");
for (let n = 1; n <= 301; n++) if (!existsSync("cloudflare/public/magic/boss/" + n + ".webp")) assert.ok(IDLE_BOSS_FICHIERS_R2_V1[n], "boss " + n + " sans image Magic ni cle R2");

// La route sert la cle de la table (get direct), puis seulement retombe sur le listing : R2 simule en memoire.
const { traiterRequeteIdleMedia } = await import("../src/idle-media-v1.js");
const appels = [];
const R2 = {
  async get(cle) { appels.push("get:" + cle); return cle === idleBossCleR2V1(5) ? { body: "x", httpEtag: '"e"', writeHttpMetadata(h) { h.set("content-type", "image/png"); } } : null; },
  async list() { appels.push("list"); return { objects: [], truncated: false }; },
};
const rep = await traiterRequeteIdleMedia(new Request("https://x.test/api/idle/media/boss?id=5"), { SOREAL_R2: R2 });
assert.equal(rep.status, 200);
assert.deepEqual(appels, ["get:" + idleBossCleR2V1(5)], "un seul get, aucun listing");
assert.equal(rep.headers.get("x-soreal-idle-boss-repli"), null);
const rep2 = await traiterRequeteIdleMedia(new Request("https://x.test/api/idle/media/boss?id=6"), { SOREAL_R2: R2 });
assert.equal(rep2.status, 404);
assert.ok(appels.includes("list"), "cle absente du seau : repli par listing");
console.log("idle-medias-references-v1 OK");
