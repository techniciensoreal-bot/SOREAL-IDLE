import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-28) : « hier, j'ai eu une déconnexion internet et je n'ai plus pu jouer ; pourtant je voulais le jeu totalement en local » (application Android = TWA, qui ouvre le site dans Chrome).
 * Remède : service worker (copie de la page, des scripts versionnés, du moteur local et de sa base SQL), dernier export du serveur gardé dans IndexedDB pour démarrer le moteur sans réseau, jeton et accès mémorisés pour rouvrir le jeu hors ligne.
 * Vérifié à la main dans Chrome le 2026-10-28 : serveur coupé, rechargement de la page, moteur démarré (« horsLigne »), énergie qui progresse.
 */
const sw = readFileSync("cloudflare/public/sw-idle-v1.js", "utf8");
const pont = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
const moteur = readFileSync("cloudflare/public/modules/moteur-local-v1.js", "utf8");
const entetes = readFileSync("cloudflare/public/_headers", "utf8");

// service worker
assert.ok(sw.includes("fetch('/index.html', { cache: 'reload' })") && sw.includes("moteur-local-worker-v1") && sw.includes("sql-wasm-v1"), "précharge la page, le moteur local et sa base SQL");
assert.ok(sw.includes("if (r.method !== 'GET') return;") && sw.includes("if (r.headers.get('range')) return;"), "ni les actions du jeu (POST), ni les sons (requêtes partielles)");
assert.ok(sw.includes("if (u.pathname.indexOf('/api/') === 0) {") && sw.includes("r.destination === 'image'"), "aucun appel /api/ en copie, sauf les images");
assert.ok(sw.includes("Promise.race([reseau, limite])") && sw.includes("}, 3000)"), "page : réseau d'abord, copie après 3 s");
assert.ok(/\[\?&\]v=\[0-9a-zA-Z\]\+/.test(sw) && sw.includes("copieDabord_(e, cle)"), "fichiers versionnés : copie d'abord (jamais périmée, leur adresse change)");
assert.ok(/\/sw-idle-v1\.js\s+Cache-Control: no-cache/.test(entetes), "le service worker n'est jamais figé par le cache HTTP");

// pont : enregistrement, arrêt d'urgence, jeton et accès hors ligne
assert.ok(pont.includes('register("/sw-idle-v1.js",{scope:"/"})') && pont.includes('get("sw")==="0"'), "enregistrement + arrêt d'urgence ?sw=0");
assert.ok(pont.includes('const DERNIER_JETON_KEY="horsligne_soreal_jeton_v1"') && pont.includes('const ACCES_OK_KEY="horsligne_soreal_acces_v1"'), "clés SANS préfixe soreal_idle_ : jamais recopiées sur le serveur avec les préférences du compte");
assert.ok(!/horsligne_soreal/.test(readFileSync("cloudflare/public/modules/prefs-compte-v1.js", "utf8")) && !/^(soreal_idle_|sorealIdle)/.test("horsligne_soreal_jeton_v1"), "le jeton n'entre pas dans les préférences du compte");
assert.ok(pont.includes("horsLigneV1()") && pont.includes("reseauAbsent=!(erreur&&erreur.status)"), "hors ligne : session échue tolérée, accès déjà accordé suffisant");
assert.ok(pont.includes('localStorage.removeItem(DERNIER_JETON_KEY)') && pont.includes('localStorage.removeItem(ACCES_OK_KEY)'), "la déconnexion efface jeton et accès mémorisés");

// moteur : repli sur le dernier export, jamais sur un refus du serveur
assert.ok(moteur.includes('const CLE_EXPORT="export-dernier"') && moteur.includes("const g=rep?null:await exportGarde(jeton);"), "repli seulement si AUCUNE réponse HTTP (rep absent), jamais sur un refus du serveur");
assert.ok(moteur.includes('g.jeton===(await empreinteJeton(jeton))') && !/jeton:jeton|jeton:String\(jeton\)/.test(moteur), "l'export est rangé sous l'empreinte du jeton, jamais le jeton lui-même");
assert.ok(moteur.includes("copie=JSON.parse(JSON.stringify(exp))") && moteur.includes("if(!horsLigne)garderExport(jeton,exp);"), "copie prise avant la fusion de la partie de l'appareil, gardée seulement après un vrai export");
console.log("idle-hors-ligne-v1: OK");
