/*
 * SOREAL IDLE pour Windows — processus principal (Norman, 2026-10-28).
 *
 * Le jeu s'ouvre dans une fenêtre qui charge « app://soreal/ » : toutes les requêtes de la page (la page, les scripts, le moteur, les images, les voix, /api/…) sont servies par le VRAI Worker de production, exécuté ici sur une base SQLite du joueur
 * (src/env-local.mjs). Aucune connexion n'est nécessaire pour jouer ; rien n'est exposé sur le réseau (pas de port ouvert, un schéma d'adresse interne à l'application).
 */
const { app, BrowserWindow, protocol, shell, Menu } = require("electron");
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

async function demarrerJeu() {
  const d = dossiers();
  const { creerEnvLocal } = await import(pathToFileURL(path.join(__dirname, "src", "env-local.mjs")).href);
  const donnees = app.getPath("userData");
  let graine = null;
  try { graine = JSON.parse(fs.readFileSync(path.join(__dirname, "graine", "catalogue.json"), "utf8")); } catch (_e) { /* pas de graine : le catalogue minimal du moteur */ }
  env = await creerEnvLocal({
    racineDepot: d.racineDepot,
    dossierPublic: d.dossierPublic,
    dossierMedias: d.dossierMedias,
    fichierBase: path.join(donnees, "soreal-idle.sqlite"),
    graine,
    utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" }
  });

  protocol.handle("app", async (requete) => {
    const url = new URL(requete.url);
    /* Le Worker voit une adresse http ordinaire ; la page, elle, reste sur « app://soreal » (même origine à chaque lancement : le stockage de l'appareil est conservé). */
    const interne = new Request("http://soreal-idle.local" + url.pathname + url.search, { method: requete.method, headers: requete.headers, body: requete.method === "GET" || requete.method === "HEAD" ? undefined : requete.body, duplex: "half" });
    try {
      return await env.fetch(interne);
    } catch (e) {
      return new Response("Erreur du jeu local : " + String(e && e.message || e), { status: 500 });
    }
  });
}

function ouvrirFenetre() {
  fenetre = new BrowserWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 480,
    backgroundColor: "#071226", show: false, autoHideMenuBar: true,
    title: "SOREAL IDLE",
    icon: path.join(dossiers().dossierPublic, "icons", "icon-512.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  fenetre.once("ready-to-show", () => fenetre.show());
  /* Un lien vers un site s'ouvre dans le navigateur du PC, jamais dans le jeu. */
  fenetre.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  fenetre.webContents.on("will-navigate", (ev, url) => { if (!url.startsWith(ORIGINE)) { ev.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  fenetre.loadURL(ORIGINE + "/");
  fenetre.on("closed", () => { fenetre = null; });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => { if (fenetre) { if (fenetre.isMinimized()) fenetre.restore(); fenetre.focus(); } });
  app.whenReady().then(async () => {
    await demarrerJeu();
    ouvrirFenetre();
  }).catch((e) => { console.error(e); app.quit(); });
  app.on("window-all-closed", () => { if (env) env.fermer(); app.quit(); });
}
