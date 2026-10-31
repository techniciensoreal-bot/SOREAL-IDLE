/*
 * SOREAL IDLE pour Windows — cœur du processus principal (Norman, 2026-10-28).
 * Ce fichier est chargé par main.js (le lanceur, qui ne change jamais) : celui de la dernière mise à jour installée s'il y en a un qui a prouvé qu'il démarre, sinon celui de l'installateur (voir main.js). Il peut donc être mis à jour SANS réinstaller.
 * Deux emplacements : __dirname = le dossier de CE fichier (celui de la mise à jour ou de l'installateur : coeur, preload, icône, src/env-local, liaison, steam) et APP = le dossier de l'application installée (jeu embarqué, graine, clé de vérification, src/maj et zip, qui ne changent jamais).
 *
 * Le jeu s'ouvre dans une fenêtre qui charge « app://soreal/ » : toutes les requêtes de la page (la page, les scripts, le moteur, les images, les voix, /api/…) sont servies par le VRAI Worker de production, exécuté ici sur une base SQLite du joueur
 * (src/env-local.mjs). Aucune connexion n'est nécessaire pour jouer ; rien n'est exposé sur le réseau (pas de port ouvert, un schéma d'adresse interne à l'application).
 */
const { app, BrowserWindow, protocol, shell, Menu, ipcMain, nativeImage, session, net, safeStorage, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const APP = global.__SOREAL_RACINE_APP__ || __dirname;
const ORIGINE = "app://soreal";
/* Le menu Admin lance le studio de voix par le lien « soreal-studio:// » (tools/voice-studio/installer_lien_studio.bat) : la fenêtre le confie à Windows, comme le ferait un navigateur. Aucun autre lien d'application n'est ouvert. */
const LIEN_STUDIO = /^soreal-studio:\/\/demarrer(?:[/?#]|$)/;   /* ancré : rien d'autre après « demarrer » (pas d'arguments injectés vers le gestionnaire de protocole) */
/* Les appels IPC ne sont acceptés que de la page du jeu (app://soreal/), jamais d'une autre origine ni d'un cadre intégré (audit 2026-10-29). */
{
  const handleOrigine = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (canal, fn) => handleOrigine(canal, (ev, ...args) => {
    const u = ev && ev.senderFrame && ev.senderFrame.url;
    if (u && !String(u).startsWith("app://soreal/")) return { ok: false, code: "ORIGINE_REFUSEE" };
    return fn(ev, ...args);
  });
}
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
  /*
   * Bandes noires pendant l'interface Steam (Norman, 2026-10-30 : « les bandes noires sont toujours là ; elles persistent une demi-seconde quand j'enlève l'interface Steam »). La superposition est une fenêtre posée par-dessus : le suivi d'occultation natif de
   * Chromium (CalculateNativeWinOcclusion) croit la fenêtre du jeu cachée, cesse de la peindre (zones noires) et ne recalcule qu'après coup. On le coupe, ainsi que la mise en veille des fenêtres « occultées » : la page continue de se peindre sous la superposition.
   */
  app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
  app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
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
  /* Graine du contenu de la production : celle de la mise à jour installée (dossier de CE fichier, voyage dans le paquet de code) ou celle de l'installateur ; la plus récente (exporteLe) l'emporte. Aucune : le catalogue minimal du moteur. */
  let graine = null;
  for (const fichier of [path.join(__dirname, "graine", "catalogue.json"), path.join(APP, "graine", "catalogue.json")]) {
    try {
      const g = JSON.parse(fs.readFileSync(fichier, "utf8"));
      if (g && Array.isArray(g.feuilles) && (!graine || String(g.exporteLe || "") > String(graine.exporteLe || ""))) graine = g;
    } catch (_e) { /* pas de graine ici */ }
  }
  return creerEnvLocal({
    racineDepot,
    dossierPublic: path.join(racineDepot, "cloudflare", "public"),
    dossiersMedias,
    fichierBase: path.join(app.getPath("userData"), "soreal-idle.sqlite"),
    fichierIndex: path.join(app.getPath("userData"), "index-medias.json"),   /* inventaire des médias gardé d'un lancement à l'autre */
    graine,
    utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" }
  });
}

async function demarrerJeu() {
  const d = dossiers();
  /* Le module de mise à jour voyage lui-même par les mises à jour du cœur (celui de l'installation en repli) : un défaut du programme d'installation se corrige sans réinstaller. */
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
    console.error("Les couches installées ne démarrent pas :", e && e.message || e);
    /*
     * Seule une mise à jour PAS ENCORE validée est mise de côté. Une version déjà validée n'est jamais effacée ni mise sur la liste noire pour un échec qui peut venir d'ailleurs (base verrouillée par l'antivirus, disque plein) :
     * cette session-là seulement démarre sur l'installateur, la suivante retente les couches (audit 2026-10-29).
     */
    const aRevenir = Boolean(etatMaj.enAttente);
    if (aRevenir) etatMaj = majModule.revenirEnArriere(dossierMaj, etatMaj);
    couches = aRevenir ? majModule.couchesActives(dossierMaj, etatMaj) : { racineCode: null, dossiersMedias: [] };
    dossiersMediasActifs = medias(couches);
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
        if (relatif.some((s) => /[\\:]/.test(s))) return new Response("refusé", { status: 400 });   /* « %5c » décodé en antislash, « C: » : jamais dans un nom de fichier servi */
        for (const racine of dossiersMediasActifs) {
          const base = path.resolve(racine, "_externes", "cdn.jsdelivr.net");
          const f = path.join(base, ...relatif);
          if (path.resolve(f).startsWith(base + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile()) {
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
      /* Norman (2026-10-29 : « je ne veux jamais avoir à réinstaller sauf force majeure ») : les images déjà présentes dans le dossier d'INSTALLATION (installateur ancien, en clair) sont chiffrées sur place, par la mise à jour, en tâche de fond ; seulement dans l'application installée (jamais le dossier de développement). Un fichier qui résiste (droits, antivirus) est repris au démarrage suivant. */
      for (const dossier of app.isPackaged ? medias(couches) : (couches.dossiersMedias || [])) await coffre.chiffrerDossier(dossier);
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
      /* Pile réseau de Chromium (celle de Chrome : proxy, certificats de Windows, antivirus) plutôt que celle de Node. */
      const r = await liaisonModule.transmettre({ urlBase: process.env.SOREAL_LIAISON_URL || majModule.URL_PRODUCTION, jeton: liaison.jeton, methode: requete.method, chemin: url.pathname, recherche: url.search, entetes: Object.fromEntries(requete.headers), corps, fetchFn: (u, o) => net.fetch(u, Object.assign({}, o, { bypassCustomProtocolHandlers: true })) });
      const admin = liaisonModule.estRouteAdmin(url.pathname);
      if (admin) journalLiaison_(url.pathname + " " + requete.method + " " + (corps ? corps.length : 0) + " o : " + (r && r.reponse ? "HTTP " + r.reponse.status : r && r.expiree ? "401 (jeton refusé par le serveur)" : "ÉCHEC RÉSEAU " + liaisonModule.derniereErreurTransmission));
      if (r && r.reponse) return r.reponse;
      if (r && r.expiree) { liaisonExpiree = true; envoyerPage("liaison:expiree", true); }
      /* Routes d'administration (voix, histoires) : la page reçoit la RAISON, lisible, au lieu d'un « Failed to fetch » muet. */
      if (admin) return new Response(JSON.stringify({ ok: false, error: r && r.expiree ? "Le serveur refuse la liaison de ce compte (jeton expiré ou révoqué) : relie de nouveau ton compte dans les Réglages." : "Impossible d'envoyer au serveur : " + (liaisonModule.derniereErreurTransmission || "pas de réponse") }), { status: r && r.expiree ? 401 : 502, headers: { "content-type": "application/json" } });
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
/* Renvoie { ok, disponible, code } pour le bouton « Vérifier les mises à jour » des Réglages (Norman, 2026-10-31) ; la vérification automatique ignore le retour. */
async function verifierMaj() {
  if (!app.isPackaged && !URL_MAJ) return { ok: false, code: "DEVELOPPEMENT" };
  if (majEnCours || !majModule || !clePubliqueMaj) return { ok: true, enCours: true };
  const r = await majModule.verifierMaj({ urlBase: URL_MAJ || majModule.URL_PRODUCTION, clePublique: clePubliqueMaj, etat: etatMaj });
  if (r.ok && r.rienAFaire && r.manifeste) {
    /* le serveur est à une autre version, mais l'appareil a déjà tout : on la note sans rien afficher */
    etatMaj = Object.assign({}, etatMaj, { version: r.manifeste.version, date: r.manifeste.date || null });
    majModule.ecrireEtat(dossierMaj, etatMaj);
  }
  majProposee = r.ok && r.disponible ? { version: r.manifeste.version, notes: String(r.manifeste.notes || "").slice(0, 400), octets: r.delta.octets, nb: r.delta.nb, manifeste: r.manifeste, delta: r.delta } : null;
  envoyerPage("maj:proposee", majProposee ? { version: majProposee.version, notes: majProposee.notes, octets: majProposee.octets, nb: majProposee.nb } : null);
  return { ok: Boolean(r.ok), disponible: Boolean(majProposee), code: r.code || "" };
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
  ipcMain.handle("maj:verifier", async () => verifierMaj());
  ipcMain.handle("maj:etat", async () => (majProposee ? { version: majProposee.version, notes: majProposee.notes, octets: majProposee.octets, nb: majProposee.nb } : null));
  ipcMain.handle("maj:installer", async () => {
    if (!majProposee || majEnCours) return { ok: false, code: majEnCours ? "DEJA_EN_COURS" : "RIEN_A_INSTALLER" };
    majEnCours = true;
    try {
      let { manifeste, delta } = majProposee;
      /*
       * Un média modifié APRÈS la publication du manifeste (une voix régénérée, par exemple) ne correspond plus à sa taille annoncée : l'installateur refuse alors toute la mise à jour (Norman, 2026-10-29 : « La mise à jour n'a pas pu être installée »,
       * en boucle). Le média fautif est écarté (jamais installé, jamais inscrit comme possédé : la mise à jour suivante le reprendra) et l'installation reprend avec le reste. Le code, lui, reste vérifié par sa signature : un paquet corrompu échoue toujours.
       */
      const ecartes = [];
      for (let essai = 0; ; essai += 1) {
        try {
          etatMaj = await majModule.installerMaj({
            urlBase: URL_MAJ || majModule.URL_PRODUCTION, manifeste, delta, dossierMaj, etat: etatMaj,
            progression: (p) => envoyerPage("maj:progression", p)
          });
          break;
        } catch (e) {
          const m = /^(?:TAILLE_INATTENDUE|EMPREINTE_INATTENDUE):(.+)$/.exec(String(e && e.message || e));
          if (!m || essai >= 20) throw e;
          const cle = m[1];
          ecartes.push(cle);
          journalLiaison_("maj : média écarté (modifié depuis la publication) " + cle);
          manifeste = Object.assign({}, manifeste, { medias: manifeste.medias.filter((x) => x[0] !== cle) });
          delta = Object.assign({}, delta, { medias: delta.medias.filter((x) => x[0] !== cle) });
          delta.nb = Math.max(0, (delta.codeChange ? 1 : 0) + delta.medias.length);
        }
      }
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
/* Petit journal des envois d'administration (voix, histoires) : userData/liaison-diagnostic.log, 64 Ko au plus. */
function journalLiaison_(ligne) {
  try {
    const f = path.join(app.getPath("userData"), "liaison-diagnostic.log");
    let ancien = "";
    try { ancien = fs.readFileSync(f, "utf8"); } catch (_e) { /* premier envoi */ }
    if (ancien.length > 60000) ancien = ancien.slice(-30000);
    fs.writeFileSync(f, ancien + new Date().toISOString() + " " + ligne + "\n");
  } catch (_e) { /* jamais bloquant */ }
}
/*
 * Ménage des mises à jour (audit 2026-10-29 : « le code de chaque mise à jour reste sur le disque pour toujours ») : après validation, on ne garde que le code installé et le précédent ;
 * un dossier qui ne sert plus que pour ses médias perd son sous-dossier « code » (les médias restent : ce sont des couches), et un dossier que plus rien ne référence disparaît.
 */
function nettoyerMaj_() {
  try {
    if (!etatMaj || etatMaj.enAttente || !dossierMaj) return;
    const gardeCode = new Set([etatMaj.codeDossier, etatMaj.precedent && etatMaj.precedent.codeDossier].filter(Boolean));
    const gardeMedias = new Set((etatMaj.mediaDossiers || []).concat((etatMaj.precedent && etatMaj.precedent.mediaDossiers) || []));
    for (const nom of fs.readdirSync(dossierMaj)) {
      if (!/^v[A-Za-z0-9]+$/.test(nom)) continue;
      const dossier = path.join(dossierMaj, nom);
      if (!gardeCode.has(nom) && !gardeMedias.has(nom)) { fs.rmSync(dossier, { recursive: true, force: true }); continue; }
      if (!gardeCode.has(nom)) fs.rmSync(path.join(dossier, "code"), { recursive: true, force: true });
    }
  } catch (_e) { /* jamais bloquant */ }
}
function installerPontSteam() {
  const exeJeu = () => process.execPath;
  ipcMain.handle("steam:etat", async () => {
    if (!app.isPackaged) return { ok: true, steam: false, developpement: true };
    const { etatSteam } = await import(pathToFileURL(path.join(__dirname, "src", "steam.mjs")).href);
    return etatSteam({ exe: exeJeu() });
  });
  ipcMain.handle("steam:ajouter", async (_ev, art) => ajouterSteam_(art));
  /* Renommage automatique (Norman, 2026-10-29 : « le nom qu'il met dans Steam doit être SOREAL NGU IDLE ») : l'entrée de Steam qui porte encore l'ancien nom est mise à jour toute seule, avec ses images, dès que Steam est fermé (le fichier de Steam ne s'écrit pas pendant qu'il tourne : on réessaie à chaque lancement). */
  if (app.isPackaged && !LANCE_PAR_STEAM) setTimeout(async () => {
    try {
      const { etatSteam } = await import(pathToFileURL(path.join(__dirname, "src", "steam.mjs")).href);
      const e = etatSteam({ exe: exeJeu() });
      if (e && e.ancienNom && !e.enCours) { const r = await ajouterSteam_(null); journalLiaison_("steam renommage " + JSON.stringify({ ok: r && r.ok, code: r && r.code })); }
    } catch (_e) { /* jamais bloquant */ }
  }, 20000);
  async function ajouterSteam_(art) {
    if (!app.isPackaged) return { ok: false, code: "DEVELOPPEMENT" };
    const { ajouterASteam } = await import(pathToFileURL(path.join(__dirname, "src", "steam.mjs")).href);
    const d = dossiers();
    /*
     * Images de l'entrée Steam (Norman, 2026-10-29 : « remplace les images par celles-ci, avec tous les formats nécessaires aux jeux non-Steam ») : fichiers du dossier art/steam, posés dans le dossier « grid » de Steam sous le nom du raccourci :
     *   <id>p.png affiche 600 x 900 · <id>.png en-tête horizontal 920 x 430 · <id>_hero.png bannière 1920 x 620 (sans texte) · <id>_logo.png logo 1280 x 720 en PNG transparent ; l'icône (.ico) va dans le raccourci lui-même.
     * Les images composées par la page restent le repli si un fichier manque.
     */
    const dossierArt = path.join(__dirname, "art", "steam");
    const lire = (nom) => { try { return fs.readFileSync(path.join(dossierArt, nom)); } catch (_e) { return null; } };
    let icone = lire("icone.ico");
    if (!icone) {
      try {
        const png = nativeImage.createFromPath(path.join(d.dossierPublic, "icons", "icon-512.png")).resize({ width: 256, height: 256, quality: "best" }).toPNG();
        icone = icoDepuisPng(png);
      } catch (_e) { /* sans icône : Steam prendra celle de l'exécutable */ }
    }
    return ajouterASteam({
      exe: exeJeu(), icone, dossierIcone: app.getPath("userData"),
      images: {
        grille: lire("grille-920x430.png") || donneesUrl(art && art.grille),
        portrait: lire("affiche-600x900.png") || donneesUrl(art && art.portrait),
        hero: lire("hero-1920x620.png") || donneesUrl(art && art.hero),
        logo: lire("logo-1280x720.png")
      }
    });
  }
}

/*
 * Icône du jeu (Norman, 2026-10-29 : « l'icône de l'exe n'a pas changé, il faut oublier l'ancien ») : celle de l'exécutable installé est figée dans le fichier (une mise à jour ne la change pas, et on ne réinstalle pas) ; on corrige donc ce que Windows affiche vraiment : l'icône de la fenêtre et de la barre des tâches, et celle des raccourcis du Bureau, du menu Démarrer et de la barre des tâches, repointés vers la nouvelle icône.
 * L'icône est copiée dans le dossier des données (chemin stable, qui survit aux mises à jour).
 */
function fichierIcone_() {
  try {
    const source = path.join(__dirname, "art", "steam", "icone.ico");
    if (!fs.existsSync(source)) return null;
    const cible = path.join(app.getPath("userData"), "icone-soreal-ngu-idle.ico");
    const neuf = fs.readFileSync(source);
    let ancien = null;
    try { ancien = fs.readFileSync(cible); } catch (_e) { /* première copie */ }
    if (!ancien || !ancien.equals(neuf)) fs.writeFileSync(cible, neuf);
    return cible;
  } catch (_e) { return null; }
}
function corrigerRaccourcis_() {
  if (process.platform !== "win32") return;
  try {
    const icone = fichierIcone_();
    if (!icone) return;
    const dossiers_ = [app.getPath("desktop"), path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs"), path.join(app.getPath("appData"), "Microsoft", "Internet Explorer", "Quick Launch", "User Pinned", "TaskBar")];
    let change = false;
    for (const dossier of dossiers_) {
      let noms = [];
      try { noms = fs.readdirSync(dossier); } catch (_e) { continue; }
      for (const nom of noms) {
        if (!/^SOREAL( NGU)? IDLE\.lnk$/i.test(nom)) continue;
        const f = path.join(dossier, nom);
        try {
          const l = shell.readShortcutLink(f);
          if (l.icon === icone) continue;
          shell.writeShortcutLink(f, "update", { icon: icone, iconIndex: 0 });
          change = true;
        } catch (_e) { /* raccourci illisible : laissé tel quel */ }
      }
    }
    /* Windows garde les anciennes icônes en cache : on lui demande de les relire. */
    if (change) { try { require("child_process").execFile("ie4uinit.exe", ["-show"], { windowsHide: true }, () => {}); } catch (_e) { /* sans effet */ } }
  } catch (_e) { /* jamais bloquant */ }
}

function ouvrirFenetre() {
  fenetre = new BrowserWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 480,
    backgroundColor: "#071226", show: false, autoHideMenuBar: true,
    title: "SOREAL NGU IDLE",
    icon: fichierIcone_() || path.join(dossiers().dossierPublic, "icons", "icon-512.png"),
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
    /* La mise à jour aussi : fermer l'application (ou Steam qui la ferme) dans les 20 premières secondes ne la fait plus annuler et mettre sur liste noire au démarrage suivant (audit 2026-10-29). */
    try { if (majModule && etatMaj && etatMaj.enAttente) { etatMaj = majModule.validerMaj(dossierMaj, etatMaj); nettoyerMaj_(); } } catch (_e) { /* jamais bloquant */ }
    setTimeout(() => {
      if (majModule && etatMaj && etatMaj.enAttente && fenetre && !fenetre.isDestroyed()) etatMaj = majModule.validerMaj(dossierMaj, etatMaj);
      /* le cœur lui-même (celui d'une mise à jour) a démarré et tenu 20 s : main.js n'a plus à le surveiller */
      if (typeof global.__SOREAL_COEUR_VALIDE__ === "function" && fenetre && !fenetre.isDestroyed()) global.__SOREAL_COEUR_VALIDE__();
    }, 20000);
  });
  /*
   * Fantôme de la superposition Steam (Norman, 2026-10-29 : « quand on ferme l'interface Steam, il reste un fantôme de l'image, qui disparaît quand on bouge la page ») : Steam dessine PAR-DESSUS la fenêtre ; à sa fermeture Chromium n'a rien à
   * repeindre (aucune partie de la page n'a changé) et l'image de Steam reste à l'écran jusqu'au prochain changement. Lancé par Steam, on force donc un repaint complet de la page à chaque changement de focus ou de taille, puis 4 fois par
   * seconde (une invalidation, pas un rendu de la page : coût négligeable) : le fantôme disparaît en un quart de seconde.
   */
  if (LANCE_PAR_STEAM) {
    const repeindre = () => { try { if (fenetre && !fenetre.isDestroyed() && fenetre.isVisible() && !fenetre.isMinimized()) fenetre.webContents.invalidate(); } catch (_e) { /* fenêtre fermée */ } };
    /* Plus de minuterie : repeindre en continu faisait CLIGNOTER une bande noire à gauche pendant que l'interface Steam est affichée (Norman, 2026-10-29). Seulement une courte rafale à chaque changement de focus, de taille ou d'affichage (la fermeture de la superposition redonne le focus). */
    /*
     * Le jeu clignotait NOIR tant que l'interface Steam était affichée (Norman, 2026-10-30) : la superposition fait perdre puis rendre le focus à la fenêtre à chaque interaction, et chaque rafale de repeintures forcées (cinq par événement, sur blur, taille, affichage…) donnait une image noire pendant que Steam
     * dessine par-dessus. Désormais : AUCUNE repeinture tant que la superposition est ouverte (la fenêtre n'a pas le focus), une seule courte rafale (deux repeintures) quand le focus REVIENT ou que la fenêtre est restaurée, et jamais plus d'une rafale toutes les 2,5 s.
     */
    let derniereRafale = 0;
    const rafale = () => {
      const maintenant = Date.now();
      if (maintenant - derniereRafale < 2500) return;
      derniereRafale = maintenant;
      repeindre();
      for (const ms of [150, 600]) setTimeout(() => { if (fenetre && !fenetre.isDestroyed() && fenetre.isFocused()) repeindre(); }, ms);
    };
    for (const evenement of ["focus", "restore", "leave-full-screen"]) fenetre.on(evenement, rafale);
    /*
     * Le jeu clignote encore NOIR tant que l'interface Steam est ouverte, en plein écran comme en fenêtre, puis reste noir une demi-seconde à sa fermeture (Norman, 2026-10-31) : les animations de la page (aurores, braises, lumières de la borne…) soumettent une image à chaque rafraîchissement
     * alors que Steam intercepte la présentation pour dessiner sa superposition, d'où des images noires. Tant que la fenêtre n'a PAS le focus (la superposition le prend), les animations CSS et les calques de dessin sont donc GELÉS (aucune nouvelle image à présenter : l'écran reste stable
     * sous la superposition, qui assombrit déjà le jeu) ; au retour du focus le gel est retiré AVANT la repeinture (plus d'attente d'une demi-seconde). Le moteur du jeu, lui, continue de tourner.
     */
    /*
     * Version allégée (Norman, 2026-10-31 : « depuis la mise à jour de l'interface Steam, les scrolls de souris sont moins fluides ») : le gel par une feuille de style universelle (« * {animation-play-state:paused!important} », canvas masqués) imposait un nouveau calcul de style de TOUTE la page à chaque perte ou retour du focus, et Steam
     * les fait alterner souvent. Désormais : (1) le gel n'a lieu qu'après 400 ms SANS focus (une alternance rapide ne fait plus rien) ; (2) il met en pause les animations en cours par l'API Web Animations (document.getAnimations()), sans toucher à aucune feuille de style, et les remet exactement où elles étaient au retour du focus ; (3) les calques de
     * dessin ne sont plus masqués. Le moteur du jeu continue de tourner.
     */
    let gele = false, minuterieGel = null;
    const JS_GEL = "(()=>{try{document.getAnimations().forEach((a)=>{if(a.playState==='running'){a.__soGele=true;a.pause();}});}catch(e){}})()";
    const JS_DEGEL = "(()=>{try{document.getAnimations().forEach((a)=>{if(a.__soGele){a.__soGele=false;a.play();}});}catch(e){}})()";
    const executer = (js) => { try { if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.executeJavaScript(js).catch(() => {}); } catch (_e) { /* fenêtre fermée */ } };
    const geler = () => {
      if (minuterieGel || gele) return;
      minuterieGel = setTimeout(() => { minuterieGel = null; if (fenetre && !fenetre.isDestroyed() && !fenetre.isFocused()) { gele = true; executer(JS_GEL); } }, 400);
    };
    const degeler = () => {
      if (minuterieGel) { clearTimeout(minuterieGel); minuterieGel = null; }
      if (gele) { gele = false; executer(JS_DEGEL); }
      repeindre();
    };
    fenetre.on("blur", geler);
    fenetre.on("focus", degeler);
  }
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
    corrigerRaccourcis_();
  }).catch((e) => {
    console.error(e);
    try { dialog.showErrorBox("SOREAL NGU IDLE", "Le jeu n'a pas pu démarrer.\n\n" + String((e && e.message) || e).slice(0, 400) + "\n\nFerme-le complètement puis relance-le ; si le problème revient, dis-le (le détail est dans le journal de l'application)."); } catch (_f) { /* sans fenêtre de dialogue */ }
    app.quit();
  });
  app.on("window-all-closed", () => { if (env) env.fermer(); app.quit(); });
}
