/*
 * SOREAL IDLE pour Windows — cœur du processus principal (Norman, 2026-10-28).
 * Ce fichier est chargé par main.js (le lanceur, qui ne change jamais) : celui de la dernière mise à jour installée s'il y en a un qui a prouvé qu'il démarre, sinon celui de l'installateur (voir main.js). Il peut donc être mis à jour SANS réinstaller.
 * Deux emplacements : __dirname = le dossier de CE fichier (celui de la mise à jour ou de l'installateur : coeur, preload, icône, src/env-local, liaison, steam) et APP = le dossier de l'application installée (jeu embarqué, graine, clé de vérification, src/maj et zip, qui ne changent jamais).
 *
 * Le jeu s'ouvre dans une fenêtre qui charge « app://soreal/ » : toutes les requêtes de la page (la page, les scripts, le moteur, les images, les voix, /api/…) sont servies par le VRAI Worker de production, exécuté ici sur une base SQLite du joueur
 * (src/env-local.mjs). Aucune connexion n'est nécessaire pour jouer ; rien n'est exposé sur le réseau (pas de port ouvert, un schéma d'adresse interne à l'application).
 */
const { app, BrowserWindow, protocol, shell, Menu, ipcMain, nativeImage, session, net, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const APP = global.__SOREAL_RACINE_APP__ || __dirname;
const ORIGINE = "app://soreal";
/* Le menu Admin lance le studio de voix par le lien « soreal-studio:// » (tools/voice-studio/installer_lien_studio.bat) : la fenêtre le confie à Windows, comme le ferait un navigateur. Aucun autre lien d'application n'est ouvert. */
const LIEN_STUDIO = /^soreal-studio:\/\/demarrer/;
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);

/*
 * Superposition Steam (Norman, 2026-10-29 : « l'interface Steam doit se superposer au jeu quand on le lance par Steam, et Maj + Tab ouvre le menu Steam »). Le raccourci ajouté à Steam autorise déjà la superposition (AllowOverlay) ; il reste à la laisser s'accrocher à
 * la fenêtre : Steam s'injecte dans le processus qui dessine à l'écran, or Chromium dessine dans un processus à part (le processus graphique) que la superposition ne voit pas. Lancé PAR Steam (Steam pose SteamGameId / SteamAppId dans l'environnement), le jeu dessine donc dans le
 * processus principal (in-process-gpu) et sans composition directe (disable-direct-composition) : la méthode que les jeux Electron de Steam emploient. Hors de Steam rien ne change (le processus graphique séparé reste plus robuste). Maj + Tab est géré par Steam lui-même :
 * le jeu n'intercepte jamais cette touche (voir before-input-event plus bas : seuls F5 et Ctrl+R).
 */
const LANCE_PAR_STEAM = Boolean(process.env.SteamGameId || process.env.SteamAppId || process.env.SteamOverlayGameId);
if (LANCE_PAR_STEAM) {
  app.commandLine.appendSwitch("in-process-gpu");
  app.commandLine.appendSwitch("disable-direct-composition");
}

/* Dossiers : en développement le dépôt lui-même ; une fois empaquetée l'application embarque sa copie (dossier « jeu » à côté de main.js). */
function dossiers() {
  const embarque = path.join(APP, "jeu");
  if (fs.existsSync(path.join(embarque, "cloudflare", "src"))) {
    return { racineDepot: embarque, dossierPublic: path.join(embarque, "cloudflare", "public"), dossierMedias: path.join(process.resourcesPath || embarque, "medias") };
  }
  const depot = path.resolve(APP, "..");
  return { racineDepot: depot, dossierPublic: path.join(depot, "cloudflare", "public"), dossierMedias: process.env.SOREAL_MEDIAS || path.join(depot, "desktop", "medias") };
}

let env = null;
let fenetre = null;
let majModule = null;
let dossierMaj = "";
let etatMaj = null;
let clePubliqueMaj = "";
let majProposee = null;     /* { version, notes, octets, nb } : ce que la page affiche en haut de la fenêtre */
let majEnCours = false;
let liaisonModule = null;
let liaison = { lie: false };       /* compte relié : { lie, jeton, email, expire } (lu au démarrage) */
let liaisonExpiree = false;         /* le serveur a refusé le jeton : à relier de nouveau */
let liaisonEnCours = false;
const appareilLiaison = "exe" + Math.random().toString(36).slice(2) + Date.now().toString(36);
const chiffrement = {
  chiffrer: (t) => { if (!safeStorage.isEncryptionAvailable()) throw new Error("CHIFFREMENT_INDISPONIBLE"); return safeStorage.encryptString(t).toString("base64"); },
  dechiffrer: (b) => safeStorage.decryptString(Buffer.from(b, "base64"))
};
let dossiersMediasActifs = [];   /* couches de médias (mises à jour d'abord, puis installateur) : lues aussi pour les bibliothèques de la voix de secours */

/* Ce que l'installateur embarque : index des médias (clé -> [taille, etag]) et empreinte du paquet de code, pour savoir ce qu'une mise à jour doit vraiment télécharger. */
function lireEmbarque(d) {
  let index = {}, codeSha = null;
  try { index = JSON.parse(fs.readFileSync(path.join(d.dossierMedias, "_index.json"), "utf8")); } catch (_e) { /* installation sans médias : tout sera proposé */ }
  try { codeSha = JSON.parse(fs.readFileSync(path.join(APP, "jeu", "_code.json"), "utf8")).sha256 || null; } catch (_e) { /* développement */ }
  return { index, codeSha };
}

async function lancerEnv(racineDepot, dossiersMedias) {
  const { creerEnvLocal } = await import(pathToFileURL(path.join(__dirname, "src", "env-local.mjs")).href);
  let graine = null;
  try { graine = JSON.parse(fs.readFileSync(path.join(APP, "graine", "catalogue.json"), "utf8")); } catch (_e) { /* pas de graine : le catalogue minimal du moteur */ }
  return creerEnvLocal({
    racineDepot,
    dossierPublic: path.join(racineDepot, "cloudflare", "public"),
    dossiersMedias,
    fichierBase: path.join(app.getPath("userData"), "soreal-idle.sqlite"),
    graine,
    utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" }
  });
}

async function demarrerJeu() {
  const d = dossiers();
  majModule = await import(pathToFileURL(path.join(APP, "src", "maj.mjs")).href);
  dossierMaj = path.join(app.getPath("userData"), "maj");
  try { clePubliqueMaj = fs.readFileSync(path.join(APP, "maj-cle-publique.pem"), "utf8"); } catch (_e) { clePubliqueMaj = ""; }
  const embarque = lireEmbarque(d);
  etatMaj = majModule.lireEtat(dossierMaj, embarque);
  /* Une mise à jour installée doit prouver qu'elle démarre : au deuxième démarrage sans validation, on revient à l'état d'avant. */
  if (etatMaj.enAttente) {
    if ((etatMaj.tentatives || 0) >= 1) etatMaj = majModule.revenirEnArriere(dossierMaj, etatMaj);
    else { etatMaj = Object.assign({}, etatMaj, { tentatives: 1 }); majModule.ecrireEtat(dossierMaj, etatMaj); }
  }
  let couches = majModule.couchesActives(dossierMaj, etatMaj);
  const medias = (c) => c.dossiersMedias.concat([d.dossierMedias]);
  dossiersMediasActifs = medias(couches);
  try {
    env = await lancerEnv(couches.racineCode || d.racineDepot, medias(couches));
  } catch (e) {
    if (!couches.racineCode && !couches.dossiersMedias.length) throw e;
    console.error("La mise à jour installée ne démarre pas, retour à la version précédente :", e && e.message || e);
    etatMaj = majModule.revenirEnArriere(dossierMaj, Object.assign({}, etatMaj, { enAttente: etatMaj.enAttente || etatMaj.version }));
    couches = majModule.couchesActives(dossierMaj, etatMaj);
    env = await lancerEnv(couches.racineCode || d.racineDepot, medias(couches));
  }

  /*
   * Bibliothèques de la voix de secours (cdn.jsdelivr.net, citées par index.html) : servies depuis la copie embarquée (medias/_externes/cdn.jsdelivr.net/…), donc sans internet ; tout autre adresse https passe normalement par le réseau.
   * La réponse porte l'en-tête CORS du CDN (le jeu s'ouvre sur app://soreal : un module importé d'une autre origine l'exige).
   */
  const TYPES_EXTERNES = { ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".data": "application/octet-stream" };
  session.defaultSession.protocol.handle("https", async (requete) => {
    try {
      const u = new URL(requete.url);
      if (u.hostname === "cdn.jsdelivr.net" && requete.method === "GET") {
        const relatif = decodeURIComponent(u.pathname).split("/").filter((s) => s && s !== "..");
        for (const racine of dossiersMediasActifs) {
          const f = path.join(racine, "_externes", "cdn.jsdelivr.net", ...relatif);
          if (fs.existsSync(f) && fs.statSync(f).isFile()) {
            return new Response(fs.readFileSync(f), { status: 200, headers: { "content-type": TYPES_EXTERNES[path.extname(f)] || "application/octet-stream", "access-control-allow-origin": "*", "cache-control": "public, max-age=31536000" } });
          }
        }
      }
    } catch (_e) { /* repli sur le réseau */ }
    return net.fetch(requete, { bypassCustomProtocolHandlers: true });
  });

  /* Coffre des médias : les fichiers reçus en clair par l'ancien programme de mise à jour sont chiffrés en tâche de fond (par petits lots), jamais pendant une action du jeu. */
  setTimeout(async () => {
    try {
      const coffre = await import(pathToFileURL(path.join(__dirname, "src", "coffre-medias.mjs")).href);
      for (const d of couches.dossiersMedias || []) await coffre.chiffrerDossier(d);
    } catch (_e) { /* au prochain démarrage */ }
  }, 20000);

  liaisonModule = await import(pathToFileURL(path.join(__dirname, "src", "liaison.mjs")).href);
  liaison = liaisonModule.lireLiaison(app.getPath("userData"), chiffrement);
  if (liaison.lie) env.definirSessionExterne({ token: liaison.jeton, expiresAt: liaison.expire });

  protocol.handle("app", async (requete) => {
    const url = new URL(requete.url);
    /* Application RELIÉE à un compte : les appels du jeu vont au serveur avec le jeton du compte (comme la version web) ; sans réseau la page voit une erreur réseau et continue avec ce qu'elle a. */
    if (liaison.lie && !liaisonExpiree && liaisonModule.transmissible(url.pathname)) {
      const corps = requete.method === "GET" || requete.method === "HEAD" ? undefined : Buffer.from(await requete.arrayBuffer());
      const r = await liaisonModule.transmettre({ urlBase: process.env.SOREAL_LIAISON_URL || majModule.URL_PRODUCTION, jeton: liaison.jeton, methode: requete.method, chemin: url.pathname, recherche: url.search, entetes: Object.fromEntries(requete.headers), corps });
      if (r && r.reponse) return r.reponse;
      if (r && r.expiree) { liaisonExpiree = true; envoyerPage("liaison:expiree", true); }
      return Response.error();
    }
    if (liaison.lie && liaisonExpiree && liaisonModule.transmissible(url.pathname)) return Response.error();
    /* Le Worker voit une adresse http ordinaire ; la page, elle, reste sur « app://soreal » (même origine à chaque lancement : le stockage de l'appareil est conservé). */
    const interne = new Request("http://soreal-idle.local" + url.pathname + url.search, { method: requete.method, headers: requete.headers, body: requete.method === "GET" || requete.method === "HEAD" ? undefined : requete.body, duplex: "half" });
    try {
      const locale = await env.fetch(interne);
      /* Une voix que l'installateur n'a pas encore (générée depuis, ou pas encore dans une mise à jour) est lue sur le serveur quand internet répond : l'administrateur peut ainsi l'écouter tout de suite. */
      if (locale.status === 404 && requete.method === "GET" && url.pathname === "/api/idle/media/voice") {
        try {
          const distante = await net.fetch((process.env.SOREAL_LIAISON_URL || majModule.URL_PRODUCTION) + url.pathname + url.search, { bypassCustomProtocolHandlers: true, signal: AbortSignal.timeout(8000) });
          if (distante.ok) return distante;
        } catch (_e) { /* hors ligne : la 404 d'origine */ }
      }
      return locale;
    } catch (e) {
      return new Response("Erreur du jeu local : " + String(e && e.message || e), { status: 500 });
    }
  });
}

/*
 * Mises à jour (modules « maj »). La page affiche un bandeau en haut de la fenêtre quand une mise à jour est proposée (« Mettre à jour » / « Plus tard ») ; l'installation se fait dans la fenêtre, avec une barre de progression, puis le jeu se relance.
 * Aucun installateur n'est téléchargé. Vérification : 8 s après l'ouverture, puis toutes les 30 minutes, seulement si internet répond.
 */
const URL_MAJ = process.env.SOREAL_MAJ_URL || "";
function envoyerPage(canal, charge) { try { if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.send(canal, charge); } catch (_e) { /* fenêtre fermée */ } }
async function verifierMaj() {
  if (!app.isPackaged && !URL_MAJ) return;
  if (majEnCours || !majModule || !clePubliqueMaj) return;
  const r = await majModule.verifierMaj({ urlBase: URL_MAJ || majModule.URL_PRODUCTION, clePublique: clePubliqueMaj, etat: etatMaj });
  if (r.ok && r.rienAFaire && r.manifeste) {
    /* le serveur est à une autre version, mais l'appareil a déjà tout : on la note sans rien afficher */
    etatMaj = Object.assign({}, etatMaj, { version: r.manifeste.version, date: r.manifeste.date || null });
    majModule.ecrireEtat(dossierMaj, etatMaj);
  }
  majProposee = r.ok && r.disponible ? { version: r.manifeste.version, notes: String(r.manifeste.notes || "").slice(0, 400), octets: r.delta.octets, nb: r.delta.nb, manifeste: r.manifeste, delta: r.delta } : null;
  envoyerPage("maj:proposee", majProposee ? { version: majProposee.version, notes: majProposee.notes, octets: majProposee.octets, nb: majProposee.nb } : null);
}
/*
 * Liaison au compte (Réglages > Ma partie) : voir src/liaison.mjs. Le jeton arrive du navigateur par une adresse locale ; la réconciliation compare la partie de cet ordinateur et celle du serveur et garde la plus avancée.
 */
function installerPontLiaison() {
  const etatPage = () => ({ lie: Boolean(liaison.lie), email: liaison.email || "", expiree: liaisonExpiree, enCours: liaisonEnCours, decision: liaison.decision || "" });
  ipcMain.handle("liaison:etat", async () => etatPage());
  /* Quel cœur tourne : un cœur de mise à jour (version 2 ou plus) ou celui de l'installateur (qui n'a pas cette réponse : la page le sait). */
  ipcMain.handle("coeur:version", async () => ({ version: 2, misAJour: typeof global.__SOREAL_COEUR_VALIDE__ === "function" }));
  ipcMain.handle("liaison:demarrer", async () => {
    if (liaisonEnCours) return { ok: false, code: "DEJA_EN_COURS" };
    if (!app.isPackaged && !process.env.SOREAL_LIAISON_URL) return { ok: false, code: "DEVELOPPEMENT" };
    if (!safeStorage.isEncryptionAvailable()) return { ok: false, code: "CHIFFREMENT_INDISPONIBLE" };
    liaisonEnCours = true;
    const urlProd = process.env.SOREAL_LIAISON_URL || majModule.URL_PRODUCTION;
    let retour = null;
    try {
      /* la partie de cet ordinateur est enregistrée tout de suite (le moteur la pousse vers la base de l'application) */
      try { if (fenetre && !fenetre.isDestroyed()) await fenetre.webContents.executeJavaScript("(async()=>{var M=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;if(M&&M.envoyerMaintenant){try{return await M.envoyerMaintenant();}catch(e){return false;}}return null;})()"); } catch (_e) { /* on lit la base telle qu'elle est */ }
      const locale = env.ligneJoueur();
      if (!locale) return { ok: false, code: "PARTIE_LOCALE_ABSENTE" };
      retour = await liaisonModule.demarrerRetour();
      envoyerPage("liaison:progression", { etape: "navigateur" });
      const adresseLiaison = urlProd + "/?liaison=" + retour.port + "&etat=" + retour.etat;
      /* Essais automatiques seulement : SOREAL_LIAISON_FICHIER_URL reçoit l'adresse au lieu d'ouvrir le navigateur (le test joue le rôle du navigateur). */
      if (process.env.SOREAL_LIAISON_FICHIER_URL) fs.writeFileSync(process.env.SOREAL_LIAISON_FICHIER_URL, adresseLiaison);
      else await shell.openExternal(adresseLiaison);
      const { jeton, expire } = await retour.attente;
      const r = await liaisonModule.reconcilier({
        urlBase: urlProd, jeton, appareil: appareilLiaison,
        locale: { cells: locale.cells, pseudo: env.pseudoLocal() },
        dossierMiseDeCote: path.join(app.getPath("userData"), "parties-mises-de-cote"),
        progression: (p) => envoyerPage("liaison:progression", p)
      });
      liaisonModule.ecrireLiaison(app.getPath("userData"), { jeton, email: r.email, expire, decision: r.decision }, chiffrement);
      liaison = { lie: true, jeton, email: r.email, expire, decision: r.decision };
      liaisonExpiree = false;
      env.definirSessionExterne({ token: jeton, expiresAt: expire });
      envoyerPage("liaison:progression", { etape: "termine", decision: r.decision });
      /* la page repart du serveur : son moteur reprend la partie du compte */
      setTimeout(() => { try { if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.reloadIgnoringCache(); } catch (_e) { /* fenêtre fermée */ } }, 1500);
      return { ok: true, decision: r.decision, fichiers: r.fichiersMisDeCote.length };
    } catch (e) {
      return { ok: false, code: String(e && e.message || e).replace(/[^A-Z_]/g, "").slice(0, 40) || "LIAISON_ECHEC" };
    } finally {
      if (retour) retour.fermer();
      liaisonEnCours = false;
    }
  });
}

function installerPontMaj() {
  ipcMain.handle("maj:etat", async () => (majProposee ? { version: majProposee.version, notes: majProposee.notes, octets: majProposee.octets, nb: majProposee.nb } : null));
  ipcMain.handle("maj:installer", async () => {
    if (!majProposee || majEnCours) return { ok: false, code: majEnCours ? "DEJA_EN_COURS" : "RIEN_A_INSTALLER" };
    majEnCours = true;
    try {
      const { manifeste, delta } = majProposee;
      etatMaj = await majModule.installerMaj({
        urlBase: URL_MAJ || majModule.URL_PRODUCTION, manifeste, delta, dossierMaj, etat: etatMaj,
        progression: (p) => envoyerPage("maj:progression", p)
      });
      envoyerPage("maj:progression", { termine: true });
      /* le jeu se ferme proprement (la base du joueur est enregistrée) puis se relance avec la mise à jour */
      setTimeout(() => { if (env) env.fermer(); app.relaunch(); app.exit(0); }, 1200);
      return { ok: true };
    } catch (e) {
      majEnCours = false;
      return { ok: false, code: "INSTALLATION_ECHEC", detail: String(e && e.message || e).slice(0, 200) };
    }
  });
  setTimeout(verifierMaj, 8000);
  setInterval(verifierMaj, 30 * 60 * 1000);
}

/*
 * Ajout à Steam (Réglages > Ma partie) : la page compose les images (affiche, capsule, bannière) à partir de la bannière du jeu et les envoie ; ce processus écrit le raccourci et les images dans Steam (src/steam.mjs).
 * Seulement depuis l'application installée : le chemin de l'exécutable doit être celui du jeu, pas celui d'Electron en développement.
 */
function donneesUrl(u) {
  const t = String(u || ""), entete = "data:image/png;base64,";
  if (!t.startsWith(entete) || t.length > 14000000) return null;
  const donnees = t.slice(entete.length);
  return Buffer.from(donnees, "base64");
}
/* .ico à une seule taille (256 x 256) qui contient directement le PNG : accepté par Windows et par Steam. */
function icoDepuisPng(png) {
  const entete = Buffer.alloc(22);
  entete.writeUInt16LE(0, 0); entete.writeUInt16LE(1, 2); entete.writeUInt16LE(1, 4);
  entete[6] = 0; entete[7] = 0; entete[8] = 0; entete[9] = 0;
  entete.writeUInt16LE(1, 10); entete.writeUInt16LE(32, 12); entete.writeUInt32LE(png.length, 14); entete.writeUInt32LE(22, 18);
  return Buffer.concat([entete, png]);
}
function installerPontSteam() {
  const exeJeu = () => process.execPath;
  ipcMain.handle("steam:etat", async () => {
    if (!app.isPackaged) return { ok: true, steam: false, developpement: true };
    const { etatSteam } = await import(pathToFileURL(path.join(__dirname, "src", "steam.mjs")).href);
    return etatSteam({ exe: exeJeu() });
  });
  ipcMain.handle("steam:ajouter", async (_ev, art) => {
    if (!app.isPackaged) return { ok: false, code: "DEVELOPPEMENT" };
    const { ajouterASteam } = await import(pathToFileURL(path.join(__dirname, "src", "steam.mjs")).href);
    const d = dossiers();
    let icone = null;
    try {
      const png = nativeImage.createFromPath(path.join(d.dossierPublic, "icons", "icon-512.png")).resize({ width: 256, height: 256, quality: "best" }).toPNG();
      icone = icoDepuisPng(png);
    } catch (_e) { /* sans icône : Steam prendra celle de l'exécutable */ }
    return ajouterASteam({
      exe: exeJeu(), icone, dossierIcone: app.getPath("userData"),
      images: { grille: donneesUrl(art && art.grille), portrait: donneesUrl(art && art.portrait), hero: donneesUrl(art && art.hero) }
    });
  });
}

function ouvrirFenetre() {
  fenetre = new BrowserWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 480,
    backgroundColor: "#071226", show: false, autoHideMenuBar: true,
    title: "SOREAL IDLE",
    icon: fs.existsSync(path.join(__dirname, "icone.ico")) ? path.join(__dirname, "icone.ico") : path.join(dossiers().dossierPublic, "icons", "icon-512.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false, backgroundThrottling: false, preload: path.join(__dirname, "preload.js") }
  });
  Menu.setApplicationMenu(null);
  fenetre.once("ready-to-show", () => fenetre.show());
  /* Sans menu, plus de raccourci d'actualisation : F5 et Ctrl+R rechargent la page (Ctrl+Maj+R et Ctrl+F5 aussi, en ignorant le cache). */
  fenetre.webContents.on("before-input-event", (ev, entree) => {
    if (entree.type !== "keyDown" || entree.alt) return;
    const touche = String(entree.key || "").toLowerCase();
    const f5 = touche === "f5", ctrlR = (entree.control || entree.meta) && touche === "r";
    if (!f5 && !ctrlR) return;
    ev.preventDefault();
    if (entree.shift || (f5 && entree.control)) fenetre.webContents.reloadIgnoringCache(); else fenetre.webContents.reload();
  });
  /* Un lien vers un site s'ouvre dans le navigateur du PC, jamais dans le jeu. */
  fenetre.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url) || LIEN_STUDIO.test(url)) shell.openExternal(url); return { action: "deny" }; });
  fenetre.webContents.on("will-navigate", (ev, url) => { if (!url.startsWith(ORIGINE)) { ev.preventDefault(); if (/^https:\/\//.test(url) || LIEN_STUDIO.test(url)) shell.openExternal(url); } });
  /* La mise à jour installée est validée quand la page s'est chargée et que la fenêtre est restée ouverte 20 s. */
  fenetre.webContents.on("did-finish-load", () => {
    /*
     * Un cœur de mise à jour est validé dès que sa page s'est chargée (Norman, 2026-10-29 : « F5 ne marche pas, les voix non plus » : fermer l'application dans les 20 premières secondes faisait REFUSER le nouveau cœur au démarrage suivant, et l'application retombait sur le cœur
     * d'origine, sans F5 ni envoi des voix au serveur). Il a démarré et il affiche le jeu : c'est la preuve que main.js demande ; seul un cœur qui plante avant d'afficher la page reste refusé.
     */
    if (typeof global.__SOREAL_COEUR_VALIDE__ === "function") global.__SOREAL_COEUR_VALIDE__();
    setTimeout(() => {
      if (majModule && etatMaj && etatMaj.enAttente && fenetre && !fenetre.isDestroyed()) etatMaj = majModule.validerMaj(dossierMaj, etatMaj);
      /* le cœur lui-même (celui d'une mise à jour) a démarré et tenu 20 s : main.js n'a plus à le surveiller */
      if (typeof global.__SOREAL_COEUR_VALIDE__ === "function" && fenetre && !fenetre.isDestroyed()) global.__SOREAL_COEUR_VALIDE__();
    }, 20000);
  });
  fenetre.loadURL(ORIGINE + "/");
  fenetre.on("closed", () => { fenetre = null; });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => { if (fenetre) { if (fenetre.isMinimized()) fenetre.restore(); fenetre.focus(); } });
  /* Identité Windows de l'application : la barre des tâches y rattache l'icône et regroupe la fenêtre sous elle (même identifiant que l'installateur). */
  app.setAppUserModelId("be.soreal.idle.windows");
  app.whenReady().then(async () => {
    await demarrerJeu();
    installerPontSteam();
    installerPontMaj();
    installerPontLiaison();
    ouvrirFenetre();
  }).catch((e) => { console.error(e); app.quit(); });
  app.on("window-all-closed", () => { if (env) env.fermer(); app.quit(); });
}
