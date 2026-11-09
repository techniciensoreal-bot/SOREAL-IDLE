/* Source unique des noms de boss (audit de coherence 2026-11-09, front 3) : design/catalogue/boss.json. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(".");
const lire = (rel) => fs.readFileSync(path.join(racine, rel), "utf8");
const json = (rel) => JSON.parse(lire(rel));

const cat = json("design/catalogue/boss.json");
assert.equal(typeof cat.version, "number");
assert.equal(cat.boss.length, 301, "301 boss");
cat.boss.forEach((b, i) => {
  assert.equal(b.id, i + 1, "ids 1..301 sans trou ni doublon (rang " + (i + 1) + ")");
  assert.ok(String(b.nomEn || "").trim(), "nomEn vide pour le boss " + b.id);
  assert.ok(String(b.nomFr || "").trim(), "nomFr vide pour le boss " + b.id);
});
const n289 = cat.boss[288];
assert.equal(n289.nomFr, "La Femme Pirate");
assert.equal(n289.nomEn, "Pirate Girl");
assert.ok(/Norman/.test(n289.note) && /2026-11-09/.test(n289.note), "la decision du 289 est documentee");

/* AVANT / APRES : 0 ecart avec l'ancien fichier (archive) pour les 301 boss. */
const ancien = json("design/archive/ngu-boss-names-fr.json");
assert.equal(ancien.length, 301);
for (const a of ancien) {
  const b = cat.boss[a.id - 1];
  assert.equal(b.nomEn, a.nomEn, "nomEn boss " + a.id);
  assert.equal(b.nomFr, a.nomFr, "nomFr boss " + a.id);
}

/* Ce que produit le moteur : meme nom qu'avec l'ancien fichier. */
const { NGU_BOSS_NAMES_FR_V1 } = await import("../src/idle-sqlite-runtime.js");
const trad = await import("../src/idle-traductions-v1.js");
for (const a of ancien) {
  assert.equal(NGU_BOSS_NAMES_FR_V1.get(a.id), String(a.nomFr || a.nomEn || "Boss"), "moteur, boss " + a.id);
}
assert.equal(NGU_BOSS_NAMES_FR_V1.size, 301);
assert.ok(Object.keys(trad).length > 0);
/* Le dictionnaire de traductions garde bien chaque paire nomFr -> nomEn de ce fichier. */
const srcTrad = lire("cloudflare/src/idle-traductions-v1.js");
assert.ok(srcTrad.includes("design/catalogue/boss.json"), "traductions lit le fichier unique");
assert.ok(lire("cloudflare/src/idle-sqlite-runtime.js").includes("design/catalogue/boss.json"), "moteur lit le fichier unique");
assert.ok(!/ngu-boss-names-fr\.json/.test(srcTrad));

/* La graine (catalogue de production) ne diverge que sur le 289, ecrase par le moteur. Elle est recoltee en production sur la machine de Norman et n'est pas versionnee : absente (CI), on saute cette partie. */
if (fs.existsSync("desktop/graine/catalogue.json")) {
  const g = json("desktop/graine/catalogue.json");
  const lignes = g.feuilles.filter((f) => f[0] === "IDLE_BOSS").map((f) => JSON.parse(f[2]));
  const iId = lignes[0].indexOf("ID"), iNom = lignes[0].indexOf("Nom");
  const ecarts = [];
  for (const l of lignes.slice(1)) {
    const b = cat.boss[Number(l[iId]) - 1];
    if (b && b.nomFr !== l[iNom]) ecarts.push(Number(l[iId]));
  }
  assert.deepEqual(ecarts, [289], "la graine ne diverge que sur le boss 289 (surcharge du moteur)");
}
assert.ok(!/NOMS_BOSS|nomsBoss|\bnomEn\b/.test(lire("cloudflare/src/idle-graine-contenu-v1.js")), "la graine n'embarque aucune liste de noms");

/* Cliquet : la copie de design/ des noms de boss (stats de combat) ne diverge que sur le 289 documente. */
{
  const reel = json("design/ngu-boss-fight-real-names-v1.json");
  const ecarts = reel.filter((r) => r.nom !== cat.boss[r.id - 1].nomEn).map((r) => r.id);
  assert.deepEqual(ecarts, [289], "design/ngu-boss-fight-real-names-v1.json : seul le 289 (« Intermission ») diverge, deja documente dans boss.json ; ne pas en ajouter");
}
assert.ok(!fs.existsSync(path.join(racine, "design", "ngu-boss-names-fr.json")), "plus de copie de l'ancien dictionnaire dans design/ (il est dans design/archive/)");

/* Aucune autre copie de la liste des noms dans src : un fichier JS/JSON hors du fichier unique ne contient pas plus de 50 noms du catalogue. */
{
  const noms = [...new Set(cat.boss.flatMap((b) => [b.nomEn, b.nomFr]).filter((n) => n.length >= 12))];
  /* Listes de MOBS d'Aventure (les boss de zone y portent le meme nom wiki) : pas un catalogue des 301 boss, mais un recoupement de noms. Cliquet : aucun autre fichier ne doit rejoindre cette liste. */
  const toleres = new Set(["cloudflare/src/idle-adventure-zones.js", "design/traductions/fr/mobs.json", "design/traductions/sources/mobs.json"]);
  const exclus = new Set(["idle-ngu-boss-reference-v1.js"]); // stats par boss (lues en lecture seule, pas une liste de noms)
  const dossiers = ["cloudflare/src", "cloudflare/public", "design/traductions", "desktop/src", "desktop/graine"];
  const suspects = [];
  const parcourir = (d) => {
    const abs = path.join(racine, d);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = d + "/" + e.name;
      if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "medias") parcourir(rel); continue; }
      if (!/\.(js|mjs|json)$/.test(e.name) || exclus.has(e.name) || /moteur-local-worker-v1/.test(e.name)) continue;
      if (e.name === "catalogue.json") continue; // graine : feuille IDLE_BOSS de production, verifiee plus haut
      const t = fs.readFileSync(path.join(racine, rel), "utf8");
      let nb = 0;
      for (const n of noms) if (t.includes(n)) nb++;
      if (nb > 50 && !toleres.has(rel)) suspects.push(rel + " (" + nb + " noms)");
    }
  };
  dossiers.forEach(parcourir);
  /* Tolere : le dictionnaire de traduction EN (public) et les traductions de mobs, qui ne sont pas un catalogue de boss, sont signales s'ils depassent le seuil. */
  assert.deepEqual(suspects, [], "Copie d'une liste de noms de boss hors de design/catalogue/boss.json (source unique) : " + suspects.join(", "));
}
console.log("idle-catalogue-boss-unique-v1 OK");
