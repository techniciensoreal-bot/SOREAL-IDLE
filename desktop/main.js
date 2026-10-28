/*
 * SOREAL IDLE pour Windows — processus principal (Norman, 2026-10-28).
 *
 * Le jeu s'ouvre dans une fenêtre qui charge « app://soreal/ » : toutes les requêtes de la page (la page, les scripts, le moteur, les images, les voix, /api/…) sont servies par le VRAI Worker de production, exécuté ici sur une base SQLite du joueur
 * (src/env-local.mjs). Aucune connexion n'est nécessaire pour jouer ; rien n'est exposé sur le réseau (pas de port ouvert, un schéma d'adresse interne à l'application).
 */
const { app, BrowserWindow, protocol, shell, Menu, ipcMain, nativeImage, session, net, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const ORIGINE = "app://soreal";
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);

/* Dossiers : en développement le dépôt lui-même ; une fois empaquetée l'application embarque sa copie (dossier « jeu » à côté de main.js). */
function dossiers() {
  const embarque = path.join(__dirname, "jeu");
  if (fs.existsSync(path.join(embarque, "cloudflare", "src"))) {
    return { racineDepot: embarque, dossierPublic: path.join(embarque, "cloudflare", "public"), dossierMedias: path.join(process.resourcesPath || embarque, "medias") };
  }
  const depot = path.resolve(__dirname, "..");
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
  try { codeSha = JSON.parse(fs.readFileSync(path.join(__dirname, "jeu", "_code.json"), "utf8")).sha256 || null; } catch (_e) { /* développement */ }
  return { index, codeSha };
}

async function lancerEnv(racineDepot, dossiersMedias) {
  const { creerEnvLocal } = await import(pathToFileURL(path.join(__dirname, "src", "env-local.mjs")).href);
  let graine = null;
  try { graine = JSON.parse(fs.readFileSync(path.join(__dirname, "graine", "catalogue.json"), "utf8")); } catch (_e) { /* pas de graine : le catalogue minimal du moteur */ }
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
  majModule = await import(pathToFileURL(path.join(__dirname, "src", "maj.mjs")).href);
  dossierMaj = path.join(app.getPath("userData"), "maj");
  try { clePubliqueMaj = fs.readFileSync(path.join(__dirname, "maj-cle-publique.pem"), "utf8"); } catch (_e) { clePubliqueMaj = ""; }
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
      return await env.fetch(interne);
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
    icon: path.join(dossiers().dossierPublic, "icons", "icon-512.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false, backgroundThrottling: false, preload: path.join(__dirname, "preload.js") }
  });
  Menu.setApplicationMenu(null);
  fenetre.once("ready-to-show", () => fenetre.show());
  /* Un lien vers un site s'ouvre dans le navigateur du PC, jamais dans le jeu. */
  fenetre.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  fenetre.webContents.on("will-navigate", (ev, url) => { if (!url.startsWith(ORIGINE)) { ev.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  /* La mise à jour installée est validée quand la page s'est chargée et que la fenêtre est restée ouverte 20 s. */
  fenetre.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      if (majModule && etatMaj && etatMaj.enAttente && fenetre && !fenetre.isDestroyed()) etatMaj = majModule.validerMaj(dossierMaj, etatMaj);
    }, 20000);
  });
  fenetre.loadURL(ORIGINE + "/");
  fenetre.on("closed", () => { fenetre = null; });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => { if (fenetre) { if (fenetre.isMinimized()) fenetre.restore(); fenetre.focus(); } });
  app.whenReady().then(async () => {
    await demarrerJeu();
    installerPontSteam();
    installerPontMaj();
    installerPontLiaison();
    ouvrirFenetre();
  }).catch((e) => { console.error(e); app.quit(); });
  app.on("window-all-closed", () => { if (env) env.fermer(); app.quit(); });
}
