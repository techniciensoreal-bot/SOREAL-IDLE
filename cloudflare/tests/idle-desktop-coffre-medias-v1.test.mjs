// Norman (2026-10-29) : « quand on installe le jeu sur PC, on a accès à toutes les images et sons dans le dossier d'installation ; j'aimerais que ce soit crypté » : les médias de l'application sont chiffrés sur le disque et rendus en clair au moment de les servir.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const DEPOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const coffre = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "coffre-medias.mjs")).href);
const { creerR2 } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href).catch(() => ({}));

// 1. aller-retour, et le fichier chiffré ne ressemble plus à une image
const webp = Buffer.concat([Buffer.from("RIFF....WEBPVP8 ", "latin1"), Buffer.alloc(2000, 7)]);
const c = coffre.chiffrer(webp);
assert.ok(coffre.estChiffre(c) && !coffre.estChiffre(webp));
assert.equal(c.length, webp.length + coffre.SURCOUT);
assert.ok(!c.includes(Buffer.from("WEBP", "latin1")) && !c.subarray(0, 4).equals(Buffer.from("RIFF", "latin1")), "plus d'en-tête d'image lisible");
assert.ok(coffre.dechiffrer(c).equals(webp), "aller-retour exact");
assert.notDeepEqual(coffre.chiffrer(webp), c, "vecteur aléatoire : deux chiffrements du même fichier diffèrent");
// 2. un fichier en clair est rendu tel quel (développement, anciennes installations) ; un fichier altéré est refusé
assert.ok(coffre.dechiffrer(webp).equals(webp));
const abime = Buffer.from(c); abime[coffre.SURCOUT + 10] ^= 1;
assert.throws(() => coffre.dechiffrer(abime), "contenu altéré refusé");

// 3. copie chiffrée pour l'installateur : médias chiffrés, « _externes » et json de racine en clair
const racine = fs.mkdtempSync(path.join(os.tmpdir(), "coffre-"));
const src = path.join(racine, "src"), dst = path.join(racine, "dst");
fs.mkdirSync(path.join(src, "idle", "bosses"), { recursive: true });
fs.mkdirSync(path.join(src, "_externes", "cdn"), { recursive: true });
fs.writeFileSync(path.join(src, "idle", "bosses", "b1.webp"), webp);
fs.writeFileSync(path.join(src, "idle", "bosses", "son.m4a"), Buffer.from("m4a-" + "x".repeat(300)));
fs.writeFileSync(path.join(src, "_externes", "cdn", "lib.mjs"), "export const a=1;");
fs.writeFileSync(path.join(src, "_index.json"), "{\"a\":1}");
const copie = coffre.copierChiffre(src, dst);
assert.equal(copie.fichiers, 4);
assert.ok(coffre.estChiffre(fs.readFileSync(path.join(dst, "idle", "bosses", "b1.webp"))));
assert.ok(coffre.estChiffre(fs.readFileSync(path.join(dst, "idle", "bosses", "son.m4a"))));
assert.equal(fs.readFileSync(path.join(dst, "_externes", "cdn", "lib.mjs"), "utf8"), "export const a=1;", "bibliothèques servies telles quelles");
assert.equal(fs.readFileSync(path.join(dst, "_index.json"), "utf8"), "{\"a\":1}");

// 4. le jeu lit en clair, avec la taille en clair, quelle que soit la forme du fichier (chiffré, en clair, dossier mixte)
fs.writeFileSync(path.join(dst, "idle", "bosses", "clair.webp"), webp);
if (creerR2) {
  const r2 = creerR2(dst);
  const o = await r2.get("idle/bosses/b1.webp");
  assert.equal(o.size, webp.length, "taille annoncée = taille en clair");
  assert.ok(Buffer.from(await o.arrayBuffer()).equals(webp), "arrayBuffer en clair");
  const corps = Buffer.from(await new Response(o.body).arrayBuffer());
  assert.ok(corps.equals(webp), "flux en clair");
  assert.equal((await r2.get("idle/bosses/son.m4a")).size, 304);
  const clair = await r2.get("idle/bosses/clair.webp");
  assert.equal(clair.size, webp.length);
  assert.ok(Buffer.from(await new Response(clair.body).arrayBuffer()).equals(webp), "fichier en clair lu tel quel");
  const liste = await r2.list({ prefix: "idle/bosses/" });
  assert.deepEqual(liste.objects.map((x) => x.key).sort(), ["idle/bosses/b1.webp", "idle/bosses/clair.webp", "idle/bosses/son.m4a"]);
}

// 5. chiffrement en tâche de fond d'un dossier reçu en clair (mises à jour de l'ancien installateur) : idempotent, « _externes » intact
const maj = path.join(racine, "maj"); fs.cpSync(src, maj, { recursive: true });
const n1 = await coffre.chiffrerDossier(maj, { pauseMs: 0 });
assert.equal(n1, 2, "les deux médias sont chiffrés, rien d'autre");
assert.equal(await coffre.chiffrerDossier(maj, { pauseMs: 0 }), 0, "idempotent");
assert.ok(coffre.lireEnClair(path.join(maj, "idle", "bosses", "b1.webp")).equals(webp));
assert.equal(fs.readFileSync(path.join(maj, "_externes", "cdn", "lib.mjs"), "utf8"), "export const a=1;");

// 6. câblage : l'installateur est construit avec la copie chiffrée, le cœur chiffre en tâche de fond, le paquet de mise à jour embarque le module
const construire = fs.readFileSync(path.join(DEPOT, "desktop", "construire.mjs"), "utf8");
assert.ok(construire.includes('const medias = path.join(ICI, "_medias-chiffres")') && construire.includes("copierChiffre(mediasClairs, medias)") && construire.includes("extraResources: avecMedias ? [{ from: medias, to: \"medias\" }]"), "installateur : copie chiffrée");
const coeur = fs.readFileSync(path.join(DEPOT, "desktop", "coeur.js"), "utf8");
assert.ok(coeur.includes("chiffrerDossier(dossier)") && coeur.includes("coffre-medias.mjs"), "cœur : chiffrement en tâche de fond des mises à jour reçues en clair");
assert.ok(coeur.includes("app.isPackaged ? medias(couches) : (couches.dossiersMedias || [])"), "dossier d'installation chiffré aussi (par la mise à jour, sans réinstaller), jamais le dossier de développement");
const { FICHIERS_COEUR } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "paquet.mjs")).href);
assert.ok(FICHIERS_COEUR.includes("desktop/src/coffre-medias.mjs"), "le module voyage dans la mise à jour");
console.log("idle-desktop-coffre-medias-v1 : OK");
fs.rmSync(racine, { recursive: true, force: true });
