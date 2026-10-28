import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Confidentialité (2026-10-28) : l'export du catalogue envoyé à chaque joueur contenait la feuille CLASSEMENT, le registre de TOUS les joueurs (21 adresses e-mail avec leur nom). Elle n'est plus jamais exportée, ni dans l'application Windows.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const { creerEnvLocal } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-mail-"));
const graine = { feuilles: [
  ["CONFIG", 1, JSON.stringify(["cle", "valeur"])],
  ["IDLE_BOUTIQUE", 1, JSON.stringify(["Type", "CoutBase", "Croissance", "BonusParNiveau"])], ["IDLE_BOUTIQUE", 2, JSON.stringify(["production", 20, 1.6, 1])], ["IDLE_BOUTIQUE", 3, JSON.stringify(["capacite", 20, 1.6, 1])], ["IDLE_BOUTIQUE", 4, JSON.stringify(["puissance", 20, 1.6, 1])],
  ["CLASSEMENT", 1, JSON.stringify(["Rang", "Joueur"])], ["CLASSEMENT", 2, JSON.stringify(["autre.joueur@example.com", "Alice", 1791648102932])],
  ["JOUEURS", 1, JSON.stringify(["ID"])]
] };
const env = await creerEnvLocal({
  racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: path.join(tmp, "m"), fichierBase: path.join(tmp, "b", "s.sqlite"), graine,
  utilisateur: { email: "moi@soreal-idle.local", emailConnexion: "moi@soreal-idle.local", emails: ["moi@soreal-idle.local"], prenom: "Moi" }
});
// la graine de l'application ne reprend ni CLASSEMENT ni JOUEURS
const dansLaBase = env.sql.exec("SELECT DISTINCT sheet_name FROM idle_catalog").map((r) => r.sheet_name).sort();
assert.ok(!dansLaBase.includes("CLASSEMENT") || env.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='CLASSEMENT'").every((r) => !String(r.row_json).includes("@")), "la base de l'application ne contient pas le registre des joueurs");
assert.ok(dansLaBase.includes("IDLE_BOUTIQUE") && dansLaBase.includes("CONFIG"), "le catalogue y est");
// l'export vers le moteur local d'un joueur, même si la base du serveur contient le registre
env.sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('CLASSEMENT',1,?,0)", JSON.stringify(["Rang", "Joueur"]));
env.sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('CLASSEMENT',2,?,0)", JSON.stringify(["autre.joueur@example.com", "Alice", 1]));
const page = await (await env.fetch(new Request("http://x/"))).text();
const session = JSON.parse(JSON.parse('"' + page.match(/setItem\("soreal_idle_google_session_v1","(.*?)"\);/)[1] + '"'));
const exp = await (await env.fetch(new Request("http://x/api/v1/local/export?appareil=t", { headers: { authorization: "Bearer " + session.token } }))).json();
assert.equal(exp.ok, true);
assert.ok(exp.feuilles.length > 0 && !exp.feuilles.some((f) => f[0] === "CLASSEMENT" || f[0] === "JOUEURS"), "ni CLASSEMENT ni JOUEURS dans l'export");
assert.ok(!JSON.stringify(exp).includes("autre.joueur@example.com"), "l'adresse d'un autre joueur ne sort jamais");
env.fermer(); fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-export-sans-emails-v1: OK");
