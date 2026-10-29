// Norman (2026-10-29) : « remplace les images que l'ajout à Steam fait par celles-ci, avec tous les formats nécessaires aux jeux non-Steam, posés automatiquement à l'ajout » : affiche 600 x 900, en-tête 920 x 430, bannière 1920 x 620 (sans texte), logo 1280 x 720 en PNG transparent, icône .ico.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ART = path.join(DEPOT, "desktop", "art", "steam");
const dims = (nom) => { const b = fs.readFileSync(path.join(ART, nom)); assert.equal(b.subarray(1, 4).toString(), "PNG", nom + " est un PNG"); return { l: b.readUInt32BE(16), h: b.readUInt32BE(20), type: b[25] }; };

// 1. les images fournies ont les formats de Steam pour un jeu non-Steam
let d = dims("affiche-600x900.png"); assert.deepEqual([d.l, d.h], [600, 900], "affiche (Library Capsule)");
d = dims("grille-920x430.png"); assert.deepEqual([d.l, d.h], [920, 430], "en-tête horizontal (Library Header)");
d = dims("hero-1920x620.png"); assert.deepEqual([d.l, d.h], [1920, 620], "bannière (Library Hero, minimum 1920 x 620)");
d = dims("logo-1280x720.png"); assert.deepEqual([d.l, d.h], [1280, 720], "logo (Library Logo)"); assert.equal(d.type, 6, "logo : PNG avec canal alpha (fond transparent)");
const ico = fs.readFileSync(path.join(ART, "icone.ico"));
assert.deepEqual([ico.readUInt16LE(0), ico.readUInt16LE(2)], [0, 1], "icône .ico valide");
assert.ok(ico.readUInt16LE(4) >= 3, "icône à plusieurs tailles");

// 2. écrites dans le dossier grid de Steam sous le nom du raccourci, logo compris ; essai sur un FAUX Steam
const S = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "steam.mjs")).href);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "steam-art-"));
const steam = path.join(tmp, "Steam"), config = path.join(steam, "userdata", "42", "config");
fs.mkdirSync(config, { recursive: true });
const env = { SOREAL_STEAM_DIR: steam, SOREAL_STEAM_EN_COURS: "0" };
const lire = (n) => fs.readFileSync(path.join(ART, n));
const exe = path.win32.join("C:", "SOREAL IDLE", "SOREAL IDLE.exe");
const r = S.ajouterASteam({ exe, icone: lire("icone.ico"), dossierIcone: path.join(tmp, "donnees"), images: { portrait: lire("affiche-600x900.png"), grille: lire("grille-920x430.png"), hero: lire("hero-1920x620.png"), logo: lire("logo-1280x720.png") } }, env);
assert.equal(r.ok, true);
for (const [suffixe, fichier] of [["p.png", "affiche-600x900.png"], [".png", "grille-920x430.png"], ["_hero.png", "hero-1920x620.png"], ["_logo.png", "logo-1280x720.png"]]) {
  const f = path.join(config, "grid", r.id + suffixe);
  assert.ok(fs.existsSync(f), "image posée : " + suffixe);
  assert.ok(fs.readFileSync(f).equals(lire(fichier)), suffixe + " = " + fichier);
}
assert.ok(fs.readFileSync(path.join(tmp, "donnees", "soreal-idle.ico")).equals(lire("icone.ico")), "icône du raccourci");

// 3. câblage : le cœur lit ces fichiers, l'installateur et la mise à jour les embarquent
const coeur = fs.readFileSync(path.join(DEPOT, "desktop", "coeur.js"), "utf8");
for (const n of ["affiche-600x900.png", "grille-920x430.png", "hero-1920x620.png", "logo-1280x720.png", "icone.ico"]) assert.ok(coeur.includes(n), "le cœur lit " + n);
assert.ok(coeur.includes('path.join(__dirname, "art", "steam")'), "dossier art/steam à côté du cœur (installateur comme mise à jour)");
const { FICHIERS_COEUR, fichiersDuCode } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "paquet.mjs")).href);
const noms = fichiersDuCode(DEPOT).map((f) => f.nom);
for (const n of ["affiche-600x900.png", "grille-920x430.png", "hero-1920x620.png", "logo-1280x720.png", "icone.ico"]) assert.ok(FICHIERS_COEUR.includes("desktop/art/steam/" + n) && noms.includes("desktop/art/steam/" + n), "mise à jour : " + n);
assert.ok(fs.readFileSync(path.join(DEPOT, "desktop", "construire.mjs"), "utf8").includes('copier(path.join(ICI, "art"), path.join(STAGE, "art"))'), "installateur : dossier art embarqué");
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-steam-images-fournies-v1 : OK");
