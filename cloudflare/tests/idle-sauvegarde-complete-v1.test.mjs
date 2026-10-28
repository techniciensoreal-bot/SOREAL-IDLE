import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Norman (2026-10-28) : « toutes les parties doivent être disponibles pour les autres joueurs ; fais bien un backup de leurs jeux ». Le serveur écrit chaque jour dans R2 (backups/idle/joueurs-AAAA-MM-JJ.json.gz) une copie de TOUTES les parties
 * (feuille JOUEURS entière), des profils et des réglages, depuis la tâche planifiée ; les copies de plus de 30 jours sont retirées. Joué ici avec le VRAI Worker et le vrai coordinateur (environnement de l'application Windows).
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const { creerEnvLocal } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href);
const entree = (await import(pathToFileURL(path.join(DEPOT, "cloudflare", "src", "idle-worker-entry-v1.js")).href)).default;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-sauv-"));
const medias = path.join(tmp, "r2");
const env = await creerEnvLocal({
  racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: medias, fichierBase: path.join(tmp, "b", "s.sqlite"),
  utilisateur: { email: "joueur1@soreal-idle.local", emailConnexion: "joueur1@soreal-idle.local", emails: ["joueur1@soreal-idle.local"], prenom: "Un" }
});
// un joueur existe (sa ligne est créée à la première lecture de l'état)
const page = await (await env.fetch(new Request("http://x/"))).text();
const session = JSON.parse(JSON.parse('"' + page.match(/setItem\("soreal_idle_google_session_v1","(.*?)"\);/)[1] + '"'));
const etat = await (await env.fetch(new Request("http://x/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + session.token }, body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [session.token] }) }))).json();
assert.equal(etat.ok, true);

// anciennes sauvegardes (une trop vieille, une récente) + comptage des écritures
const r2 = env.env.SOREAL_R2;
await r2.put("backups/idle/joueurs-2020-01-01.json.gz", "vieille");
const hier = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
await r2.put("backups/idle/joueurs-" + hier + ".json.gz", "recente");
let ecritures = 0; const putOrigine = r2.put.bind(r2); r2.put = (...a) => { ecritures += 1; return putOrigine(...a); };
const taches = [];
await entree.scheduled({}, env.env, { waitUntil: (p) => taches.push(p) });
await Promise.all(taches);
const jour = new Date().toISOString().slice(0, 10);
const cle = "backups/idle/joueurs-" + jour + ".json.gz";
const objet = await r2.get(cle);
assert.ok(objet, "la sauvegarde du jour existe");
const brut = Buffer.from(await objet.arrayBuffer());
const sauvegarde = JSON.parse(zlib.gunzipSync(brut).toString("utf8"));
assert.equal(sauvegarde.ok, true); assert.equal(sauvegarde.nbJoueurs, 1, "toutes les parties : ici une");
assert.equal(sauvegarde.joueurs[0][0], 1, "l'en-tête d'abord");
assert.ok(sauvegarde.joueurs.some((j) => String(j[1]).includes("joueur1@soreal-idle.local")), "la ligne du joueur y est, en entier");
assert.ok(Array.isArray(sauvegarde.profils) && Array.isArray(sauvegarde.meta));
assert.ok(!JSON.stringify(sauvegarde).includes(session.token) && !JSON.stringify(sauvegarde).includes("ils_"), "jamais de jeton de session");
assert.equal(await r2.get("backups/idle/joueurs-2020-01-01.json.gz"), null, "plus de 30 jours : retirée");
assert.ok(await r2.get("backups/idle/joueurs-" + hier + ".json.gz"), "la récente reste");
// une seule par jour : la tâche planifiée tourne toutes les 5 minutes
const avant = ecritures;
await entree.scheduled({}, env.env, { waitUntil: (p) => taches.push(p) });
await Promise.all(taches);
assert.equal(ecritures, avant, "pas de deuxième écriture le même jour");
// la route interne n'est pas joignable par le public
assert.equal((await env.fetch(new Request("http://x/__soreal-idle-v1/backup-all", { method: "POST" }))).status, 404);
// sans R2 ou sans coordinateur : sans effet, sans erreur
await entree.scheduled({}, {}, { waitUntil: (p) => taches.push(p) });
await Promise.all(taches);
env.fermer(); fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-sauvegarde-complete-v1: OK");
