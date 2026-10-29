// Norman (2026-10-29) : le jeu devient « SOREAL NGU IDLE » : l'entrée Steam déjà présente sous l'ancien nom est renommée sur place (même identifiant, mêmes images), jamais dupliquée.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const S = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "steam.mjs")).href);
assert.equal(S.NOM_STEAM, "SOREAL NGU IDLE"); assert.deepEqual([...S.ANCIENS_NOMS_STEAM], ["SOREAL IDLE"]);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "steam-renom-"));
const steam = path.join(tmp, "Steam"), config = path.join(steam, "userdata", "7", "config");
fs.mkdirSync(config, { recursive: true });
const env = { SOREAL_STEAM_DIR: steam, SOREAL_STEAM_EN_COURS: "0" };
const exe = path.win32.join("C:", "SOREAL IDLE", "SOREAL IDLE.exe"), cible = '"' + exe + '"';
// une entrée existante sous l'ANCIEN nom, avec son identifiant d'alors
const idAncien = S.identifiantRaccourci(cible, "SOREAL IDLE");
const avant = [{ k: "shortcuts", t: 0, v: [{ k: "0", t: 0, v: [{ k: "appid", t: 2, v: idAncien | 0 }, { k: "AppName", t: 1, v: "SOREAL IDLE" }, { k: "Exe", t: 1, v: cible }, { k: "StartDir", t: 1, v: '"C:\SOREAL IDLE"' }, { k: "icon", t: 1, v: "" }, { k: "ShortcutPath", t: 1, v: "" }] }] }];
fs.writeFileSync(path.join(config, "shortcuts.vdf"), S.ecrireVdf(avant));
assert.equal(S.etatSteam({ exe }, env).dejaAjoute, true, "l'entrée sous l'ancien nom compte comme déjà ajoutée");
const png = Buffer.from("png");
const r = S.ajouterASteam({ exe, images: { portrait: png, grille: png, hero: png, logo: png } }, env);
assert.equal(r.ok, true);
assert.equal(r.id, idAncien >>> 0, "l'identifiant (donc le temps de jeu et les images) est conservé");
const table = S.lireVdf(fs.readFileSync(path.join(config, "shortcuts.vdf"))).find((x) => x.k === "shortcuts").v;
assert.equal(table.length, 1, "renommée sur place : pas de doublon");
const val = (k) => table[0].v.find((x) => x.k === k).v;
assert.equal(val("AppName"), "SOREAL NGU IDLE"); assert.equal(val("appid") >>> 0, idAncien >>> 0);
for (const suffixe of ["p.png", ".png", "_hero.png", "_logo.png"]) assert.ok(fs.existsSync(path.join(config, "grid", idAncien + suffixe)), "image sous l'ancien identifiant : " + suffixe);
// une seconde mise à jour : toujours une seule entrée
assert.equal(S.ajouterASteam({ exe, images: { hero: png } }, env).ok, true);
assert.equal(S.lireVdf(fs.readFileSync(path.join(config, "shortcuts.vdf"))).find((x) => x.k === "shortcuts").v.length, 1);
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-steam-renommage-v1 : OK");
