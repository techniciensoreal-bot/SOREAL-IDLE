import assert from "node:assert/strict";
import fs from "node:fs";
import { transmissible, estFichierScummvm, jetonDuReferer, jetonDuChemin, cheminScummvmServeur, transmettreFichierScummvm } from "../../desktop/src/liaison.mjs";

/* Menu Énigmes dans l'exe (Norman, 2026-11-24) : les fichiers du moteur et du jeu sont relayés depuis le serveur, avec le jeton de compte (dans l'adresse ou repris du Referer de la page du moteur). */
const JETON = "abcdEFGH12345.zyxwvutsrqponmlkjihgfedcba_-ABC";
const REF = "app://soreal/api/idle/scummvm/" + JETON + "/moteur/scummvm.html";

assert.ok(transmissible("/api/v1/scummvm-acces") && transmissible("/api/v1/scummvm-sauvegardes"), "accès et sauvegardes du jeu vont au serveur (comme le compte)");
assert.ok(estFichierScummvm("/api/idle/scummvm/x/jeux.json") && estFichierScummvm("/data/index.json") && estFichierScummvm("/scummvm.ini"));
assert.ok(!estFichierScummvm("/api/idle/media/voice") && !estFichierScummvm("/api/v1/call") && !estFichierScummvm("/datax/a"), "rien d'autre n'est relayé");

assert.equal(jetonDuReferer(REF), JETON);
assert.equal(jetonDuReferer("app://soreal/index.html"), "", "pas de jeton hors du moteur");
assert.equal(jetonDuReferer("n'importe quoi"), "");
// adresse déjà tokenée : inchangée ; chemins absolus du moteur : le jeton du Referer est inséré ; sans Referer : refus (404 côté exe)
assert.equal(cheminScummvmServeur("/api/idle/scummvm/" + JETON + "/jeux/DOTT/TENTACLE.001", ""), "/api/idle/scummvm/" + JETON + "/jeux/DOTT/TENTACLE.001");
assert.equal(cheminScummvmServeur("/data/index.json", REF), "/api/idle/scummvm/" + JETON + "/moteur/data/index.json");
assert.equal(cheminScummvmServeur("/scummvm.ini", REF), "/api/idle/scummvm/" + JETON + "/moteur/scummvm.ini");
assert.equal(cheminScummvmServeur("/api/idle/scummvm/jeux/DOTT/index.json", REF), "/api/idle/scummvm/" + JETON + "/jeux/DOTT/index.json");
assert.equal(cheminScummvmServeur("/data/index.json", ""), null);
// Dans l'exe aucune requête n'a de Referer : le dernier jeton vu dans une adresse du moteur sert de secours
assert.equal(jetonDuChemin("/api/idle/scummvm/" + JETON + "/moteur/scummvm.wasm"), JETON);
assert.equal(jetonDuChemin("/data/index.json"), "");
assert.equal(jetonDuChemin("/api/idle/scummvm/jeux/DOTT/index.json"), "", "« jeux » n'est pas un jeton");
assert.equal(cheminScummvmServeur("/data/index.json", "", JETON), "/api/idle/scummvm/" + JETON + "/moteur/data/index.json");
assert.equal(cheminScummvmServeur("/scummvm.ini", "", JETON), "/api/idle/scummvm/" + JETON + "/moteur/scummvm.ini");
assert.equal(cheminScummvmServeur("/api/idle/scummvm/jeux/DOTT/TENTACLE.001", "", JETON), "/api/idle/scummvm/" + JETON + "/jeux/DOTT/TENTACLE.001");
assert.equal(cheminScummvmServeur("/data/index.json", "", "pas un jeton"), null, "jeton de secours invalide : refus");
assert.equal(cheminScummvmServeur("/data/../../etc", REF), null, "pas de remontée de dossier");
assert.equal(cheminScummvmServeur("/api/v1/call", REF), null);

// Relais : plage demandée transmise, flux rendu tel quel, en-têtes utiles conservés, jamais l'autorisation de la page
let vu = null;
const faux = async (url, opts) => { vu = { url, opts }; return new Response("abcd", { status: 206, headers: { "content-type": "application/octet-stream", "content-range": "bytes 0-3/10", "accept-ranges": "bytes", "set-cookie": "x=1", "x-secret": "1", "content-length": "4", "content-encoding": "br" } }); };
const r = await transmettreFichierScummvm({ urlBase: "https://prod.exemple", methode: "GET", chemin: "/api/idle/scummvm/" + JETON + "/jeux/DOTT/TENTACLE.001", entetes: { range: "bytes=0-3", authorization: "Bearer local", cookie: "z" }, fetchFn: faux });
assert.equal(r.status, 206);
assert.equal(vu.url, "https://prod.exemple/api/idle/scummvm/" + JETON + "/jeux/DOTT/TENTACLE.001");
assert.equal(vu.opts.headers.range, "bytes=0-3");
assert.ok(!vu.opts.headers.authorization && !vu.opts.headers.cookie, "aucun jeton de session de la page n'est envoyé");
assert.equal(r.headers.get("content-range"), "bytes 0-3/10");
assert.ok(!r.headers.get("set-cookie") && !r.headers.get("x-secret"), "seuls les en-têtes utiles sont gardés");
assert.ok(!r.headers.get("content-length") && !r.headers.get("content-encoding"), "jamais la taille annoncée (compressée) : le flux décompressé irait au-delà et serait coupé");
assert.equal(await r.text(), "abcd");
assert.equal(await transmettreFichierScummvm({ methode: "GET", chemin: "/x", fetchFn: async () => { throw new Error("hors ligne"); } }), null, "pas de réseau : null (l'exe renvoie une erreur réseau)");

// Branchement dans le cœur de l'exe : avant l'envoi au Worker local
const coeur = fs.readFileSync(new URL("../../desktop/coeur.js", import.meta.url), "utf8");
assert.ok(coeur.includes("dernierJetonScummvm") && coeur.includes("jetonDuChemin(url.pathname)"), "le jeton vu est gardé pour les chemins absolus");
assert.ok(coeur.indexOf("estFichierScummvm(url.pathname)") > 0 && coeur.indexOf("estFichierScummvm(url.pathname)") < coeur.indexOf("liaisonModule.transmissible(url.pathname)"), "relais des fichiers du jeu avant les appels du jeu");
console.log("idle-desktop-scummvm-relais-v1: OK");
