// Norman (2026-10-30) : « le premier lancement de l'exe met du temps : l'interface est figée, puis le jeu s'affiche ».
// Cause : l'inventaire des ~5 000 médias (images, voix, musiques) se faisait d'un bloc, en synchrone, dans le processus de l'application (5,8 s sur disque chaud, bien plus au premier lancement avec l'antivirus).
// Désormais : manifeste « _inventaire-medias-v1.json » écrit à la fabrication de l'installateur (aucun fichier ouvert), sinon parcours ASYNCHRONE parallèle commencé dès le démarrage, gardé d'un lancement à l'autre.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const D = path.resolve("desktop") + path.sep;
const { creerR2 } = await import(pathToFileURL(D + "src/env-local.mjs").href);
const { copierChiffre } = await import(pathToFileURL(D + "src/coffre-medias.mjs").href);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "idx-"));
const source = path.join(tmp, "source");
for (let d = 0; d < 6; d += 1) {
  fs.mkdirSync(path.join(source, "idle", "d" + d), { recursive: true });
  for (let i = 0; i < 40; i += 1) fs.writeFileSync(path.join(source, "idle", "d" + d, "f" + i + ".webp"), Buffer.alloc(200 + i, d));
}
fs.writeFileSync(path.join(source, "catalogue.json"), "{}");

// 1. parcours asynchrone (dossier sans manifeste) : la boucle d'événements reste libre, le résultat est exact et gardé dans le fichier d'index
const cache = path.join(tmp, "index-medias.json");
{
  let ticks = 0;
  const iv = setInterval(() => { ticks += 1; }, 1);
  const r2 = creerR2([source], cache);
  await r2.prechauffer();
  clearInterval(iv);
  assert.ok(ticks > 0, "le parcours ne bloque pas la boucle d'événements");
  const o = await r2.head("idle/d3/f7.webp");
  assert.equal(o.size, 207, "taille exacte (fichier en clair)");
  assert.equal((await r2.list({ prefix: "idle/d0/", limit: 1000 })).objects.length, 40, "list : tous les fichiers du dossier");
  assert.ok(fs.existsSync(cache), "l'inventaire est gardé pour le lancement suivant");
}
// 2. lancement suivant : le cache est relu (mêmes tailles) ; un fichier ajouté invalide le cache de la couche
{
  const r2 = creerR2([source], cache);
  assert.equal((await r2.head("idle/d3/f7.webp")).size, 207, "mêmes tailles depuis le cache");
  fs.writeFileSync(path.join(source, "idle", "d3", "neuf.webp"), Buffer.alloc(11));
  const r2b = creerR2([source], cache);
  assert.equal((await r2b.head("idle/d3/neuf.webp")).size, 11, "un fichier ajouté est vu (signature des dossiers)");
}
// 3. installateur : le manifeste est écrit par copierChiffre, lu sans ouvrir de fichier, n'est jamais listé, et les médias se lisent déchiffrés
{
  const dest = path.join(tmp, "installateur");
  const r = copierChiffre(source, dest);
  assert.ok(fs.existsSync(path.join(dest, "_inventaire-medias-v1.json")) && r.fichiers > 200, "manifeste écrit à la fabrication");
  const r2 = creerR2([dest]);
  const o = await r2.head("idle/d2/f5.webp");
  assert.equal(o.size, 205, "taille EN CLAIR depuis le manifeste (le fichier chiffré fait 33 octets de plus)");
  assert.equal(await r2.head("_inventaire-medias-v1.json"), null, "le manifeste n'est pas un média");
  const corps = Buffer.from(await (await r2.get("idle/d2/f5.webp")).arrayBuffer());
  assert.ok(corps.length === 205 && corps[0] === 2, "lecture déchiffrée");
}
// 4. la fabrication de l'installateur et le lancement utilisent bien ces points
const env = fs.readFileSync(D + "src/env-local.mjs", "utf8").replace(/\r\n/g, "\n"), coeur = fs.readFileSync(D + "coeur.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(env.includes("env.SOREAL_R2.prechauffer().catch(() => {});") && env.includes("creerR2(opt.dossiersMedias || opt.dossierMedias, opt.fichierIndex)"), "l'inventaire commence au démarrage, en tâche de fond");
assert.ok(env.includes('sql.exec("BEGIN");') && env.includes('sql.exec("COMMIT")'), "la graine du catalogue s'écrit en une seule transaction");
assert.ok(coeur.includes('fichierIndex: path.join(app.getPath("userData"), "index-medias.json")'), "l'inventaire est gardé dans le dossier de données du joueur");
assert.ok(!/function construire\(\) \{\n\s+index = new Map\(\);/.test(env), "plus d'inventaire synchrone");
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-desktop-index-medias-v1 : OK");
