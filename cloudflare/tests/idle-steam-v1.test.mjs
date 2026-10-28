import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Ajout à Steam (Norman, 2026-10-28) : raccourci « jeu non-Steam » (shortcuts.vdf binaire), images de la bibliothèque (grid/), icône ; nom exact « SOREAL IDLE ». Essayé ici sur un FAUX dossier Steam (SOREAL_STEAM_DIR) :
 * jamais sur le vrai Steam du développeur.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const S = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "steam.mjs")).href);

// CRC32 : valeur de référence connue (« 123456789 » -> cbf43926)
assert.equal(S.crc32("123456789"), 0xcbf43926);
// l'identifiant d'un raccourci a toujours le bit de poids fort levé et dépend de l'exécutable ET du nom
const id = S.identifiantRaccourci('"' + path.win32.join("C:", "Jeux", "SOREAL IDLE.exe") + '"', S.NOM_STEAM);
assert.ok(id >= 0x80000000 && id <= 0xffffffff);
assert.notEqual(id, S.identifiantRaccourci('"' + path.win32.join("C:", "Autre", "SOREAL IDLE.exe") + '"', S.NOM_STEAM));
assert.equal(S.NOM_STEAM, "SOREAL IDLE", "nom correctement écrit");

// VDF : aller-retour octet pour octet
const exemple = [{ k: "shortcuts", t: 0, v: [{ k: "0", t: 0, v: [{ k: "appid", t: 2, v: -123 }, { k: "AppName", t: 1, v: "Autre jeu" }, { k: "tags", t: 0, v: [{ k: "0", t: 1, v: "favori" }] }] }] }];
const octets = S.ecrireVdf(exemple);
assert.deepEqual(S.lireVdf(octets), exemple);
assert.ok(S.ecrireVdf(S.lireVdf(octets)).equals(octets));
assert.throws(() => S.lireVdf(Buffer.from([0, 0x61])), /VDF_TRONQUE/);

// faux Steam avec un raccourci d'un autre jeu déjà présent
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "steam-essai-"));
const steam = path.join(tmp, "Steam");
const config = path.join(steam, "userdata", "123456", "config");
fs.mkdirSync(config, { recursive: true });
fs.mkdirSync(path.join(steam, "userdata", "0"), { recursive: true });   // dossier système : ignoré
fs.writeFileSync(path.join(config, "shortcuts.vdf"), octets);
const env = { SOREAL_STEAM_DIR: steam, SOREAL_STEAM_EN_COURS: "0" };
const exe = path.win32.join("C:", "Program Files", "SOREAL IDLE", "SOREAL IDLE.exe");
assert.deepEqual(S.comptesSteam(steam), ["123456"]);
let e = S.etatSteam({ exe }, env);
assert.equal(e.steam, true); assert.equal(e.comptes, 1); assert.equal(e.dejaAjoute, false);

const png = Buffer.from("png-factice");
const dossierIcone = path.join(tmp, "donnees");
// Steam ouvert : refus, rien n'est écrit
assert.equal(S.ajouterASteam({ exe, images: { hero: png } }, Object.assign({}, env, { SOREAL_STEAM_EN_COURS: "1" })).code, "STEAM_OUVERT");
assert.ok(S.lireVdf(fs.readFileSync(path.join(config, "shortcuts.vdf")))[0].v.length === 1, "refus : le fichier n'a pas bougé");
// Steam fermé : ajout
let r = S.ajouterASteam({ exe, icone: Buffer.from("ico"), dossierIcone, images: { grille: png, portrait: png, hero: png } }, env);
assert.equal(r.ok, true); assert.equal(r.comptes, 1);
const apres = S.lireVdf(fs.readFileSync(path.join(config, "shortcuts.vdf")));
const table = apres.find((x) => x.k === "shortcuts").v;
assert.equal(table.length, 2, "l'autre jeu est conservé, SOREAL IDLE ajouté à la suite");
assert.equal(table[0].v.find((x) => x.k === "AppName").v, "Autre jeu");
const nous = table[1].v, val = (k) => nous.find((x) => x.k === k).v;
assert.equal(table[1].k, "1");
assert.equal(val("AppName"), "SOREAL IDLE");
assert.equal(val("Exe"), '"' + exe + '"');
assert.equal(val("StartDir"), '"' + path.win32.join("C:", "Program Files", "SOREAL IDLE") + '"');
assert.equal(val("icon"), path.join(dossierIcone, "soreal-idle.ico"));
assert.equal(val("appid") >>> 0, r.id, "l'appid du fichier est celui des noms d'images");
assert.ok(fs.existsSync(path.join(config, "shortcuts.vdf.soreal-sauvegarde")), "sauvegarde de l'ancien fichier");
for (const suffixe of ["p.png", ".png", "_hero.png"]) assert.ok(fs.existsSync(path.join(config, "grid", r.id + suffixe)), "image " + suffixe);
assert.equal(fs.readFileSync(path.join(dossierIcone, "soreal-idle.ico")).toString(), "ico");
// une deuxième fois : mise à jour, jamais de doublon
e = S.etatSteam({ exe }, env);
assert.equal(e.dejaAjoute, true);
r = S.ajouterASteam({ exe, images: { hero: png } }, env);
assert.equal(r.ok, true);
assert.equal(S.lireVdf(fs.readFileSync(path.join(config, "shortcuts.vdf"))).find((x) => x.k === "shortcuts").v.length, 2, "pas de doublon");
// pas de Steam / fichier illisible
assert.equal(S.ajouterASteam({ exe }, { SOREAL_STEAM_DIR: path.join(tmp, "absent") }).code, "STEAM_ABSENT");
fs.writeFileSync(path.join(config, "shortcuts.vdf"), Buffer.from([0, 1, 2, 3]));
assert.equal(S.ajouterASteam({ exe }, env).code, "SHORTCUTS_ILLISIBLE");
assert.deepEqual([...fs.readFileSync(path.join(config, "shortcuts.vdf"))], [0, 1, 2, 3], "fichier illisible : jamais réécrit");

// le jeu : section seulement dans l'application (pont sorealDesktop), jamais dans un navigateur
const mod = fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "modules", "steam-v1.js"), "utf8");
assert.ok(mod.includes("if(!pont())return '';") && mod.includes("window.sorealDesktop"), "aucune section hors de l'application");
assert.ok(fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "modules", "ui-reglages-v1.js"), "utf8").includes("window.__SOREAL_IDLE_STEAM_V1__.sectionHtml()"), "section dans les Réglages");
const pre = fs.readFileSync(path.join(DEPOT, "desktop", "preload.js"), "utf8");
assert.ok(pre.includes('exposeInMainWorld("sorealDesktop"') && !/require\("(fs|child_process)"\)/.test(pre), "le pont n'expose que l'ajout à Steam");
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-steam-v1: OK");
