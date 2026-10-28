/*
 * LIAISON de l'application Windows à un compte Google (Norman, 2026-10-28 : « une fois connecté à internet, il doit envoyer sa partie au serveur, comme s'il avait toujours eu internet » ; « la plus avancée gagne »).
 *
 * Déroulement (main.js orchestre, ce module fait le travail) :
 *  1. Le joueur clique « Relier mon compte Google » : l'application écoute sur 127.0.0.1 (port libre, code secret « etat ») et ouvre la page du jeu dans le NAVIGATEUR du PC (Google refuse la connexion dans une fenêtre intégrée) ;
 *     la page (standalone-bridge.js, ?liaison=<port>&etat=<code>) connecte le joueur avec Google puis renvoie le navigateur vers l'application avec le jeton de session du serveur. Rien n'est lancé côté web : aucune partie n'est prise à un autre appareil.
 *  2. RÉCONCILIATION : la partie de cet ordinateur et celle du serveur sont comparées ; la PLUS AVANCÉE est gardée (renaissances, puis boss vaincus), l'autre est mise de côté dans un fichier (même format que « Exporter ma partie »), jamais détruite ;
 *     le serveur garde en plus sa copie « avant-import ».
 *  3. Ensuite l'application est « reliée » : les appels du jeu (/api/v1/call, /api/v1/local/*) sont transmis au serveur avec le jeton du compte, comme dans la version web ; le moteur reste local ; sans internet, le jeu continue
 *     (dernier export gardé) et la partie repart au retour du réseau. Le jeton est gardé chiffré (Windows) dans le dossier de données de l'application.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { URL_PRODUCTION } from "./maj.mjs";

const COL_DERNIERE_SYNCHRO = 15, COL_BOSS_VAINCUS = 14, COL_RENAISSANCES = 24;
const JETON_RE = /^ils_[0-9a-f]{20,200}$/;

/* ---------- comparaison : 1 = la partie de cet ordinateur est strictement plus avancée, -1 = celle du serveur, 0 = égalité (le serveur est alors gardé : rien n'est écrasé) ---------- */
export function progression(cells) {
  return [Number(cells && cells[COL_RENAISSANCES]) || 0, Number(cells && cells[COL_BOSS_VAINCUS]) || 0];
}
export function comparer(locale, serveur) {
  const a = progression(locale), b = progression(serveur);
  for (let i = 0; i < a.length; i += 1) { if (a[i] > b[i]) return 1; if (a[i] < b[i]) return -1; }
  return 0;
}

/* ---------- serveur de retour (127.0.0.1 seulement) ---------- */
export function demarrerRetour({ delaiMs = 300000 } = {}) {
  const etat = crypto.randomBytes(18).toString("hex");
  let resoudre, rejeter;
  const attente = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
  const page = (titre, texte) => "<!doctype html><meta charset=utf-8><title>SOREAL IDLE</title><body style=\"font-family:system-ui;background:#071226;color:#e8ecfa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0\"><div style=\"max-width:460px;text-align:center;padding:24px\"><h1 style=\"color:#ffd24a\">" + titre + "</h1><p>" + texte + "</p></div>";
  const serveur = http.createServer((req, res) => {
    const u = new URL(req.url, "http://127.0.0.1");
    if (u.pathname !== "/liaison" || req.method !== "GET") { res.writeHead(404); res.end("introuvable"); return; }
    const jeton = u.searchParams.get("jeton") || "", code = u.searchParams.get("etat") || "", expire = Number(u.searchParams.get("expire")) || 0;
    if (code !== etat || !JETON_RE.test(jeton)) { res.writeHead(400, { "content-type": "text/html; charset=utf-8" }); res.end(page("Liaison refusée", "Ce lien n’est pas celui de la liaison en cours. Recommence depuis SOREAL IDLE.")); return; }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(page("✅ Compte relié", "Tu peux fermer cet onglet et retourner dans SOREAL IDLE : ta partie se prépare."));
    resoudre({ jeton, expire });
  });
  const minuterie = setTimeout(() => { rejeter(new Error("LIAISON_DELAI")); fermer(); }, delaiMs);
  function fermer() { clearTimeout(minuterie); try { serveur.close(); serveur.closeAllConnections && serveur.closeAllConnections(); } catch (_e) { /* déjà fermé */ } }
  attente.then(() => setTimeout(fermer, 500), () => {});
  return new Promise((ok, ko) => {
    serveur.on("error", ko);
    serveur.listen(0, "127.0.0.1", () => ok({ port: serveur.address().port, etat, attente, fermer }));
  });
}

/* ---------- aide : appels au serveur ---------- */
async function appelServeur(urlBase, jeton, chemin, { methode = "GET", corps, fetchFn = fetch, delaiMs = 30000 } = {}) {
  const r = await fetchFn(urlBase + chemin, {
    method: methode, cache: "no-store", signal: AbortSignal.timeout(delaiMs),
    headers: Object.assign({ authorization: "Bearer " + jeton, accept: "application/json" }, corps ? { "content-type": "application/json" } : {}),
    body: corps ? JSON.stringify(corps) : undefined
  });
  const donnees = await r.json().catch(() => null);
  return { status: r.status, ok: r.ok, donnees };
}

function fichierPartie(cells, nom, instant) {
  return JSON.stringify({ format: "soreal-idle-partie-v1", version: 1, exporteLe: new Date(instant).toISOString(), serveurAt: instant, nom: String(nom || cells[1] || ""), cells });
}
function mettreDeCote(dossier, prefixe, cells, nom, instant) {
  fs.mkdirSync(dossier, { recursive: true });
  const d = new Date(instant), p = (n) => String(n).padStart(2, "0");
  const f = path.join(dossier, prefixe + "-" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + ".json");
  fs.writeFileSync(f, fichierPartie(cells, nom, instant));
  return f;
}

/*
 * Réconciliation. locale = { cells (38 colonnes), pseudo } ; retourne { decision: 'locale' | 'serveur', email, fichiersMisDeCote, pseudo }.
 * Erreurs (messages) : ACCES_REFUSE, SESSION_REFUSEE, EXPORT_REFUSE, SERVEUR_INDISPONIBLE, ENVOI_REFUSE. Dans tous les cas d'échec RIEN n'est écrasé côté serveur avant que la partie écartée n'ait été mise de côté.
 */
export async function reconcilier({ urlBase = URL_PRODUCTION, jeton, appareil, locale, dossierMiseDeCote, fetchFn = fetch, maintenant = Date.now(), progression: signaler = () => {} }) {
  if (!locale || !Array.isArray(locale.cells) || locale.cells.length < 30) throw new Error("PARTIE_LOCALE_ABSENTE");
  signaler({ etape: "verification" });
  let r;
  try { r = await appelServeur(urlBase, jeton, "/api/v1/call", { methode: "POST", corps: { operation: "obtenirAccesSorealIdle", args: [jeton] }, fetchFn }); }
  catch (_e) { throw new Error("SERVEUR_INDISPONIBLE"); }
  if (r.status === 401) throw new Error("SESSION_REFUSEE");
  if (!r.ok || !r.donnees || r.donnees.autorise === false) throw new Error("ACCES_REFUSE");

  signaler({ etape: "comparaison" });
  let exp;
  try { exp = await appelServeur(urlBase, jeton, "/api/v1/local/export?appareil=" + encodeURIComponent(appareil), { fetchFn }); }
  catch (_e) { throw new Error("SERVEUR_INDISPONIBLE"); }
  if (exp.status === 401) throw new Error("SESSION_REFUSEE");
  if (!exp.ok || !exp.donnees || exp.donnees.ok === false || !exp.donnees.joueurs) throw new Error("EXPORT_REFUSE");
  let serveur;
  try { serveur = JSON.parse(exp.donnees.joueurs.ligne); } catch (_e) { throw new Error("EXPORT_REFUSE"); }
  const email = String(exp.donnees.user && exp.donnees.user.email || "");
  const pseudoServeur = String((exp.donnees.profils && exp.donnees.profils[0] && exp.donnees.profils[0].pseudo) || "");
  const fichiers = [];

  if (comparer(locale.cells, serveur) > 0) {
    /* La partie de cet ordinateur est plus avancée : celle du serveur est mise de côté (fichier) AVANT d'être remplacée (le serveur garde aussi sa copie « avant-import »). */
    signaler({ etape: "envoi" });
    fichiers.push(mettreDeCote(dossierMiseDeCote, "partie-du-serveur", serveur, serveur[1], maintenant));
    const cells = locale.cells.slice();
    cells[COL_DERNIERE_SYNCHRO] = new Date(Math.max(Date.now(), Number(exp.donnees.serveurAt) || 0) + 1).toISOString();   /* version de la ligne : toujours plus récente que celle que le serveur vient de donner (la lecture de l'état l'a avancée) */
    let p;
    try { p = await appelServeur(urlBase, jeton, "/api/v1/local/push", { methode: "POST", corps: { cells, flux: [], gains: [], appareil, depuis: Number(exp.donnees.serveurAt) || maintenant, rev: 1, importPartie: true }, fetchFn }); }
    catch (_e) { throw new Error("SERVEUR_INDISPONIBLE"); }
    if (!p.ok || !p.donnees || p.donnees.ok === false || p.donnees.ecrit !== true) throw new Error("ENVOI_REFUSE");
    /* le pseudo choisi sur cet ordinateur, si le compte n'en a pas encore */
    if (!pseudoServeur && locale.pseudo) {
      try { await appelServeur(urlBase, jeton, "/api/v1/call", { methode: "POST", corps: { operation: "definirPseudoSorealIdle", args: [jeton, locale.pseudo] }, fetchFn }); } catch (_e) { /* pseudo déjà pris : la page le redemandera */ }
    }
    return { decision: "locale", email, fichiersMisDeCote: fichiers, pseudo: locale.pseudo || pseudoServeur };
  }
  /* La partie du serveur est la plus avancée (ou égale) : celle de cet ordinateur est mise de côté, elle peut être rechargée avec « Charger une partie ». */
  fichiers.push(mettreDeCote(dossierMiseDeCote, "partie-de-cet-ordinateur", locale.cells, locale.cells[1], maintenant));
  return { decision: "serveur", email, fichiersMisDeCote: fichiers, pseudo: pseudoServeur };
}

/* ---------- jeton gardé chiffré ---------- */
export function lireLiaison(dossier, chiffrement) {
  try {
    const o = JSON.parse(fs.readFileSync(path.join(dossier, "liaison.json"), "utf8"));
    if (!o || o.lie !== true || typeof o.jeton !== "string") return { lie: false };
    const jeton = chiffrement.dechiffrer(o.jeton);
    return JETON_RE.test(jeton) ? { lie: true, jeton, email: String(o.email || ""), expire: Number(o.expire) || 0, decision: o.decision || "", date: o.date || "" } : { lie: false };
  } catch (_e) { return { lie: false }; }
}
export function ecrireLiaison(dossier, { jeton, email, expire, decision }, chiffrement) {
  fs.mkdirSync(dossier, { recursive: true });
  const f = path.join(dossier, "liaison.json");
  fs.writeFileSync(f + ".nouveau", JSON.stringify({ v: 1, lie: true, jeton: chiffrement.chiffrer(jeton), email, expire, decision, date: new Date().toISOString() }));
  fs.renameSync(f + ".nouveau", f);
}

/* ---------- transmission des appels de la page au serveur (application reliée) ---------- */
export function transmissible(chemin) {
  return chemin === "/api/v1/call" || chemin.startsWith("/api/v1/local/");
}
/* Retourne { reponse } (la réponse du serveur, ré-emballée), { expiree: true } (jeton refusé), ou null (pas de réseau : la page doit voir une erreur réseau, pas une réponse). */
export async function transmettre({ urlBase = URL_PRODUCTION, jeton, methode, chemin, recherche = "", entetes = {}, corps, fetchFn = fetch, delaiMs = 45000 }) {
  try {
    const h = { authorization: "Bearer " + jeton };
    for (const nom of ["content-type", "accept", "accept-language"]) if (entetes[nom]) h[nom] = entetes[nom];
    const r = await fetchFn(urlBase + chemin + recherche, { method: methode, headers: h, body: methode === "GET" || methode === "HEAD" ? undefined : corps, cache: "no-store", signal: AbortSignal.timeout(delaiMs) });
    if (r.status === 401) return { expiree: true };
    const sortie = new Headers();
    r.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie"].includes(k)) sortie.set(k, v); });
    return { reponse: new Response(Buffer.from(await r.arrayBuffer()), { status: r.status, headers: sortie }) };
  } catch (_e) {
    return null;
  }
}
