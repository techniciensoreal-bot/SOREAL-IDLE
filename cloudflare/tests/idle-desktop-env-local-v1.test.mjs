import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * SOREAL IDLE pour Windows (Norman, 2026-10-28) : le VRAI Worker tourne dans l'application, sur une base SQLite du joueur, avec ASSETS (dossier public), SOREAL_R2 (dossier de médias) et le Durable Object remplacés par des équivalents locaux
 * (desktop/src/env-local.mjs). Ce test lance cet environnement et joue un tour complet sans réseau : page, session locale, appel du jeu, médias, redémarrage avec la même base.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const { creerEnvLocal } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-desk-"));
const medias = path.join(tmp, "medias");
fs.mkdirSync(path.join(medias, "idle", "voix"), { recursive: true });
fs.writeFileSync(path.join(medias, "idle", "voix", "abc.m4a"), "voix");
fs.mkdirSync(path.join(medias, "idle", "bosses"), { recursive: true });
fs.writeFileSync(path.join(medias, "idle", "bosses", "Boss_1_Test.png"), "png");
const opt = {
  racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: medias, fichierBase: path.join(tmp, "base", "soreal-idle.sqlite"),
  utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" }
};
const get = (env, chemin, init) => env.fetch(new Request("http://soreal-idle.local" + chemin, init));
{
  const env = await creerEnvLocal(opt);
  // la page d'accueil porte la session locale (posée avant tout autre script)
  const page = await (await get(env, "/")).text();
  const m = page.match(/<head[^>]*><script>try\{localStorage\.setItem\("soreal_idle_google_session_v1","(.*?)"\);\}/);
  assert.ok(m, "session locale injectée au début du <head>");
  const session = JSON.parse(JSON.parse('"' + m[1] + '"'));
  assert.ok(session.token.startsWith("ils_") && session.expiresAt > Date.now());
  // un fichier du dossier public est servi directement ; un fichier absent répond 404
  assert.equal((await get(env, "/modules/ui-menus-v1.js")).status, 200);
  assert.equal((await get(env, "/fichier-absent.js")).status, 404);
  // routes du Worker : bootstrap, appel du jeu avec la session locale
  assert.equal((await (await get(env, "/api/v1/bootstrap")).json()).ok, true);
  const appel = await get(env, "/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + session.token }, body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [session.token] }) });
  const etat = await appel.json();
  assert.equal(etat.ok, true, "le joueur local joue sans réseau : " + JSON.stringify(etat).slice(0, 120));
  // médias : mêmes clés que le bucket
  const r2 = env.env.SOREAL_R2;
  assert.ok(await r2.get("idle/voix/abc.m4a") && !(await r2.get("idle/voix/absent.m4a")));
  const liste = await r2.list({ prefix: "idle/", delimiter: "/" });
  assert.deepEqual(liste.delimitedPrefixes.sort(), ["idle/bosses/", "idle/voix/"]);
  assert.equal((await r2.list({ prefix: "idle/voix/" })).objects[0].key, "idle/voix/abc.m4a");
  // le export du moteur du navigateur et son démarrage : la session locale suffit
  const exp = await (await get(env, "/api/v1/local/export?appareil=t", { headers: { authorization: "Bearer " + session.token } })).json();
  assert.equal(exp.ok, true, "export pour le moteur local de la page : " + JSON.stringify(exp).slice(0, 120));
  env.fermer();
}
{
  // redémarrage : la même base, une nouvelle session, aucune re-semence
  const env = await creerEnvLocal(opt);
  assert.equal(env.premiere, false, "la base du joueur est conservée d'un lancement à l'autre");
  env.fermer();
}
// le moteur de la page : un joueur « externe » (Google, ou joueur local de l'application) entre par une session Google (un ticket APP / TV perd le drapeau et son accès serait refusé)
const worker = fs.readFileSync(path.join(DEPOT, "cloudflare", "local", "moteur-local-worker.js"), "utf8");
assert.ok(worker.includes("if (exp.user && exp.user.externe === true) {") && worker.includes("coord.createGoogleSessionV1({ email: exp.user.email"), "joueur externe : session Google dans le moteur local");
assert.ok(fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "moteur-local-worker-v1.js"), "utf8").includes("createGoogleSessionV1"), "moteur reconstruit");
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-desktop-env-local-v1: OK");
