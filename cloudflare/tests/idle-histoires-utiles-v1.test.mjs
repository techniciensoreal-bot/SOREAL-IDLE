import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chargerPlanVoix, clesVoixObsoletes } from "../../desktop/src/voix-utiles.mjs";
import { calculerRetirees, appliquerRetirees, lireEtat } from "../../desktop/src/maj.mjs";
import { creerR2 } from "../../desktop/src/env-local.mjs";

/*
 * Histoires supprimées du jeu (Norman, 2026-11-01 : dossiers idle/story/MagicienEtLaGrotte et MagicienEtLeGrotte2 encore dans l'exe) : un média d'histoire idle/story/<id>/… n'est utile que si <id> est une histoire ACTUELLE du catalogue
 * (desktop/graine/catalogue.json) ; sinon il n'est ni téléchargé, ni embarqué (exe, APK), ni listé aux mises à jour, et il est retiré du disque LOCAL par la récolte (jamais de R2). Les applications déjà installées ne le servent plus.
 */
const R = path.resolve(import.meta.dirname, "..", "..");
const lire = (f) => fs.readFileSync(path.join(R, f), "utf8");
const bruit = () => {};

/* Les parties 1 et 2 lisent le VRAI catalogue de production (desktop/graine/catalogue.json, jamais dans le dépôt : absent en CI et dans un clone) : elles sont sautées s'il manque. */
async function avecVraiCatalogue() {
/* ---- 1. le vrai catalogue : seule l'introduction existe ---- */
const reel = chargerPlanVoix(R);
assert.ok(reel.ok, "catalogue réel exploitable : " + reel.raison);
assert.ok(reel.histoiresIds.has("Intro"));
assert.ok(!reel.histoiresIds.has("MagicienEtLaGrotte") && !reel.histoiresIds.has("MagicienEtLeGrotte2"), "les deux histoires supprimées ne sont plus au catalogue");
{
  const ancien = "2020-01-01T00:00:00Z";
  const entrees = [
    { cle: "idle/story/MagicienEtLaGrotte/01_a.webp", taille: 1000, date: ancien },
    { cle: "idle/story/MagicienEtLeGrotte2/10.webp", taille: 2000, date: ancien },
    { cle: "idle/story/Intro/1.webp", taille: 3000, date: ancien },                 // histoire actuelle : gardée
    { cle: "idle/story/fichier-isole.webp", taille: 4000, date: ancien },            // pas dans un dossier d'histoire : jamais touché
    { cle: "idle/bosses/Boss_001.webp", taille: 5000, date: ancien },                // autre dossier : jamais touché
    { cle: "idle/story/NouvelleHistoire/1.webp", taille: 6000, date: "2999-01-01T00:00:00Z" }, // posée APRÈS l'export du catalogue : gardée par prudence
    { cle: "idle/story/SansDate/1.webp", taille: 7000 }                              // sans date : gardée par défaut
  ];
  const sortie = await clesVoixObsoletes(entrees, { journal: bruit });
  assert.deepEqual([...sortie].sort(), ["idle/story/MagicienEtLaGrotte/01_a.webp", "idle/story/MagicienEtLeGrotte2/10.webp"]);
  const ecarte = await clesVoixObsoletes(entrees, { journal: bruit, sansDate: "ecarter" });
  assert.ok(ecarte.has("idle/story/SansDate/1.webp") && !ecarte.has("idle/story/NouvelleHistoire/1.webp"), "publication : sans date = écarté, mais jamais une histoire plus récente que l'export");
}

/* ---- 2. garde-fous : catalogue absent / sans introduction / sans date d'export => rien n'est écarté ---- */
{
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-hist-"));
  const copier = (f) => { const d = path.join(racine, f); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(R, f), d); };
  for (const f of ["cloudflare/public/modules/voix-nommees-v1.js", "cloudflare/public/modules/voix-expressions-v1.js", "cloudflare/public/modules/tutorial-tts-v202.js", "cloudflare/public/voice/manifest.json", "cloudflare/src/idle-voix-purge-v1.js"]) copier(f);
  const entree = [{ cle: "idle/story/Ancienne/1.webp", taille: 10, date: "2020-01-01T00:00:00Z" }];
  const catalogue = JSON.parse(lire("desktop/graine/catalogue.json"));
  const ecrire = (c) => { fs.mkdirSync(path.join(racine, "desktop", "graine"), { recursive: true }); fs.writeFileSync(path.join(racine, "desktop", "graine", "catalogue.json"), JSON.stringify(c)); };
  try {
    assert.equal((await clesVoixObsoletes(entree, { racine, journal: bruit })).size, 0, "catalogue absent");
    ecrire(Object.assign({}, catalogue));
    assert.equal((await clesVoixObsoletes(entree, { racine, journal: bruit })).size, 1, "catalogue sain : l'histoire inconnue est obsolète");
    ecrire(Object.assign({}, catalogue, { histoires: [{ id: "Autre", etapes: [], voix: [] }] }));
    assert.equal((await clesVoixObsoletes(entree, { racine, journal: bruit })).size, 0, "catalogue sans l'introduction = périmé : aucun média d'histoire écarté");
    ecrire(Object.assign({}, catalogue, { exporteLe: null }));
    assert.equal((await clesVoixObsoletes(entree, { racine, journal: bruit })).size, 0, "catalogue sans date d'export : rien n'est écarté");
    ecrire(Object.assign({}, catalogue, { textes: catalogue.textes.slice(0, 10) }));
    assert.equal((await clesVoixObsoletes(entree, { racine, journal: bruit })).size, 0, "catalogue incomplet : rien n'est écarté");
  } finally { fs.rmSync(racine, { recursive: true, force: true }); }
}

}
if (fs.existsSync(path.join(R, "desktop", "graine", "catalogue.json"))) await avecVraiCatalogue();
else console.log("idle-histoires-utiles-v1 : parties 1 et 2 sautées (catalogue de production absent du dépôt)");

/* ---- 3. applications déjà installées : clé retirée du manifeste = plus servie, fichier de mise à jour supprimé ---- */
{
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-maj-"));
  try {
    const maj = path.join(dossier, "maj"), install = path.join(dossier, "install");
    const voix = "idle/voix/00000000000001.m4a", histoire = "idle/story/Ancienne/1.webp", image = "idle/bosses/b.webp", garde = "idle/voix/00000000000002.m4a";
    for (const [base, cle] of [[path.join(maj, "v1", "medias"), histoire], [path.join(maj, "v1", "medias"), voix], [install, histoire], [install, voix], [install, image], [install, garde]]) {
      fs.mkdirSync(path.dirname(path.join(base, ...cle.split("/"))), { recursive: true });
      fs.writeFileSync(path.join(base, ...cle.split("/")), "x");
    }
    const etat = lireEtat(maj, { index: { [voix]: [1, "a"], [histoire]: [1, "b"], [image]: [1, "c"], [garde]: [1, "d"] } });
    etat.mediaDossiers = ["v1"];
    const manifeste = { medias: [[image, 1, "c"], [garde, 1, "d"]] };
    const retirees = calculerRetirees(manifeste, etat);
    assert.deepEqual(retirees.sort(), [histoire, voix].sort(), "seules les voix et histoires absentes du manifeste sont retirées (jamais une image)");
    const apres = appliquerRetirees(maj, etat, manifeste);
    assert.ok(!(histoire in apres.index) && !(voix in apres.index) && image in apres.index);
    assert.ok(!fs.existsSync(path.join(maj, "v1", "medias", ...histoire.split("/"))) && !fs.existsSync(path.join(maj, "v1", "medias", ...voix.split("/"))), "fichiers de mise à jour supprimés");
    assert.ok(fs.existsSync(path.join(install, ...histoire.split("/"))), "le dossier d'installation n'est jamais touché");
    /* une clé de nouveau publiée n'est plus retirée */
    assert.deepEqual(calculerRetirees({ medias: [[histoire, 1, "b"], [image, 1, "c"], [garde, 1, "d"]] }, apres), [voix]);
    /* le R2 de l'application ne sert plus une clé retirée, même présente dans l'installation */
    const r2 = creerR2([install], null, (cle) => retirees.includes(cle));
    assert.equal(await r2.get(histoire), null);
    assert.equal(await r2.head(voix), null);
    assert.ok(await r2.head(garde), "une voix utile reste servie");
    assert.ok(await r2.head(image));
    assert.deepEqual((await r2.list({ prefix: "idle/story/" })).objects.map((o) => o.key), []);
  } finally { fs.rmSync(dossier, { recursive: true, force: true }); }
}

/* ---- 4. câblage : récolte (téléchargement + nettoyage local), exe, APK, mises à jour, applications ---- */
{
  const recolte = lire("desktop/recolter.mjs");
  assert.match(recolte, /clesVoixObsoletes\(objets\)/);
  assert.match(recolte, /NETTOYAGE LOCAL \(jamais R2\)/);
  assert.match(recolte, /retiré du disque local/, "le nettoyage local est journalisé");
  assert.doesNotMatch(recolte.replace(/\/\*[\s\S]*?\*\//g, ""), /r2["']?,\s*["']object["']?,\s*["']delete/, "la récolte ne supprime rien sur R2");
  assert.match(lire("android/construire-hors-ligne.mjs"), /voixObsoletesAEcarter/);
  assert.match(lire("desktop/construire.mjs"), /voixObsoletesAEcarter/);
  assert.match(lire("desktop/publier-maj.mjs"), /clesVoixObsoletes/);
  assert.match(lire("desktop/src/voix-utiles.mjs"), /idle\\\/story|"story"/, "les dossiers idle/story sont parcourus à la construction");
  assert.match(lire("desktop/coeur.js"), /cleRetiree/);
  assert.match(lire("desktop/coeur.js"), /appliquerRetirees/);
  /* APK : Maj.java retire déjà du dossier de mise à jour et de l'index toute clé que le manifeste ne liste plus (aucune reconstruction Java requise) */
  const maj = lire("android/hors-ligne/app/src/main/java/be/soreal/idle/Maj.java");
  assert.match(maj, /nettoyerMedias\(medias, etags, index\)/);
  assert.match(maj, /publiees\.contains\(k\)/);
}

console.log("idle-histoires-utiles-v1 : OK");
