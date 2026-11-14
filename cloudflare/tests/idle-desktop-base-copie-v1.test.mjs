import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Audit 2026-11-14 (exe Windows) : la base SQLite locale a une copie par jour (VACUUM INTO, 5 gardées) et se restaure depuis la plus récente si elle ne s'ouvre plus ; le stockage fournit transactionSync (commit atomique). */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const { creerEnvLocal } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-base-"));
const opt = { racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: path.join(tmp, "medias"), fichierBase: path.join(tmp, "base", "soreal-idle.sqlite"),
  utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" } };
fs.mkdirSync(opt.dossierMedias, { recursive: true });

let env = await creerEnvLocal(opt);
const dossier = path.join(tmp, "base", "sauvegardes-base");
const copies = () => fs.readdirSync(dossier).filter((f) => /^soreal-idle-\d{8}\.sqlite$/.test(f));
assert.equal(copies().length, 1, "une copie du jour est faite au démarrage");
env.fermer();
// Le même jour : pas de seconde copie.
env = await creerEnvLocal(opt);
assert.equal(copies().length, 1, "une seule copie par jour");
env.fermer();
// Base abîmée : elle est remplacée par la copie et gardée sous « .abimee ».
fs.writeFileSync(opt.fichierBase, "ceci n'est pas une base SQLite, juste des octets abimes ".repeat(40));
for (const ext of ["-wal", "-shm"]) fs.rmSync(opt.fichierBase + ext, { force: true });
env = await creerEnvLocal(opt);
assert.ok(fs.existsSync(opt.fichierBase + ".abimee"), "la base abîmée est gardée");
assert.equal(env.sql.exec("SELECT COUNT(*) AS n FROM idle_catalog")[0].n >= 0, true, "la base restaurée répond");
env.fermer();
// Seulement 5 copies gardées.
for (let i = 1; i <= 7; i += 1) fs.writeFileSync(path.join(dossier, "soreal-idle-2020010" + i + ".sqlite"), "x");
env = await creerEnvLocal(opt);
assert.ok(copies().length <= 6, "au plus 5 anciennes copies + celle du jour (" + copies().length + ")");
env.fermer();
const src = fs.readFileSync(path.join(DEPOT, "desktop", "src", "env-local.mjs"), "utf8");
assert.ok(src.includes("new SorealIdleCoordinatorV1({ storage: { sql, transactionSync } }, {})"), "le coordinateur reçoit transactionSync");
console.log("idle-desktop-base-copie-v1 : OK");
