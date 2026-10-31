// Exe Windows (Norman, 2026-10-28 : « je ne dois plus jamais avoir à réinstaller l'exe, il recevra juste des mises à jour ») :
// le lanceur desktop/main.js charge le cœur de la dernière mise à jour s'il a prouvé qu'il démarre, sinon celui de l'installateur ; le cœur voyage dans le paquet de mise à jour.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import Module from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = Module.createRequire(import.meta.url);
const sourceLanceur = fs.readFileSync(path.join(DEPOT, "desktop", "main.js"), "utf8");

/* Une « application installée » factice : le vrai lanceur, un cœur embarqué qui se signale, un dossier de données avec une mise à jour. */
function monde({ miseAJour = true, coeurMaj = 'global.__coeur = "maj";' } = {}) {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), "coeur-"));
  const app = path.join(racine, "app"), donnees = path.join(racine, "donnees");
  fs.mkdirSync(app, { recursive: true });
  fs.mkdirSync(path.join(donnees, "maj"), { recursive: true });
  fs.writeFileSync(path.join(app, "main.js"), sourceLanceur);
  fs.writeFileSync(path.join(app, "coeur.js"), 'global.__coeur = "embarque";');
  if (miseAJour) {
    fs.writeFileSync(path.join(donnees, "maj", "etat.json"), JSON.stringify({ codeDossier: "v1" }));
    fs.mkdirSync(path.join(donnees, "maj", "v1", "code", "desktop"), { recursive: true });
    fs.writeFileSync(path.join(donnees, "maj", "v1", ".ok"), "");
    fs.writeFileSync(path.join(donnees, "maj", "v1", "code", "desktop", "coeur.js"), coeurMaj);
  }
  return { app, donnees, temoin: path.join(donnees, "maj", "coeur-essai.json"), refuses: path.join(donnees, "maj", "coeur-refuse.json") };
}

function lancer(m, { verrou = true } = {}) {
  const etat = { quitte: false };
  const faux = { app: { getPath: () => m.donnees, requestSingleInstanceLock: () => verrou, quit: () => { etat.quitte = true; } } };
  const charge = Module._load;
  Module._load = function (demande, ...reste) { return demande === "electron" ? faux : charge.call(this, demande, ...reste); };
  delete global.__coeur; delete global.__SOREAL_COEUR_VALIDE__;
  const chemin = path.join(m.app, "main.js");
  for (const k of Object.keys(require.cache)) if (k.startsWith(path.dirname(m.app))) delete require.cache[k];
  try { require(chemin); } finally { Module._load = charge; }
  return { coeur: global.__coeur, valide: global.__SOREAL_COEUR_VALIDE__, quitte: etat.quitte, racine: global.__SOREAL_RACINE_APP__ };
}

/* 1. aucune mise à jour : le cœur de l'installateur */
let m = monde({ miseAJour: false });
let r = lancer(m);
assert.equal(r.coeur, "embarque"); assert.equal(r.racine, m.app, "le cœur connaît le dossier de l'application installée");
assert.ok(!fs.existsSync(m.temoin));

/* 2. une mise à jour avec un cœur : il est chargé, sous surveillance, jusqu'à ce qu'il se déclare valide */
m = monde();
r = lancer(m);
assert.equal(r.coeur, "maj", "le cœur de la mise à jour est préféré");
assert.ok(fs.existsSync(m.temoin), "témoin d'essai posé avant le chargement");
r.valide();
assert.ok(!fs.existsSync(m.temoin), "le cœur validé efface le témoin");
r = lancer(m);
assert.equal(r.coeur, "maj", "un cœur validé reste en service");
r.valide();

/* 3. un cœur qui n'a jamais été validé (le programme s'est fermé avant) : refusé au démarrage suivant */
m = monde();
lancer(m);
r = lancer(m);
assert.equal(r.coeur, "embarque", "témoin resté : retour au cœur de l'installateur");
assert.deepEqual(JSON.parse(fs.readFileSync(m.refuses, "utf8")), ["v1"]);
assert.equal(lancer(m).coeur, "embarque", "il reste refusé");

/* 4. un cœur qui plante dès son chargement : refusé tout de suite, l'application démarre quand même */
m = monde({ coeurMaj: 'throw new Error("cassé");' });
r = lancer(m);
assert.equal(r.coeur, "embarque");
assert.deepEqual(JSON.parse(fs.readFileSync(m.refuses, "utf8")), ["v1"]);
assert.ok(!fs.existsSync(m.temoin), "pas de témoin laissé par un cœur qui ne s'est pas chargé");

/* 5. seconde instance : elle ne charge rien et ne touche pas au témoin de la première */
m = monde();
lancer(m);
assert.ok(fs.existsSync(m.temoin));
r = lancer(m, { verrou: false });
assert.equal(r.quitte, true); assert.equal(r.coeur, undefined, "aucun cœur chargé");
assert.ok(fs.existsSync(m.temoin), "le témoin de l'instance qui joue est intact");
assert.ok(!fs.existsSync(m.refuses), "et rien n'est refusé à tort");

/* 6. un nom de dossier piégé dans l'état n'est jamais suivi */
m = monde();
fs.writeFileSync(path.join(m.donnees, "maj", "etat.json"), JSON.stringify({ codeDossier: "../../x" }));
assert.equal(lancer(m).coeur, "embarque");

/* 7. le cœur voyage dans le paquet de mise à jour (sauf le lanceur et la vérification des signatures) */
const { fichiersDuCode, FICHIERS_COEUR } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "paquet.mjs")).href);
const noms = fichiersDuCode(DEPOT).map((f) => f.nom);
/* la graine de contenu (desktop/graine/) est un fichier LOCAL de la machine de Norman, jamais versionné : absente sur un dépôt vierge (CI), elle n'est pas dans le paquet */
for (const f of FICHIERS_COEUR) { if (f === "desktop/graine/catalogue.json" && !fs.existsSync(path.join(DEPOT, "desktop", "graine", "catalogue.json"))) continue; assert.ok(noms.includes(f), f + " dans le paquet"); }
for (const f of ["desktop/main.js", "desktop/src/maj.mjs", "desktop/src/zip.mjs", "desktop/maj-cle-publique.pem"]) assert.ok(!noms.includes(f), f + " reste celui de l'installateur");
/* le cœur chargé depuis la mise à jour n'importe rien d'absent du paquet */
for (const f of FICHIERS_COEUR.filter((x) => x.endsWith(".mjs"))) {
  const code = fs.readFileSync(path.join(DEPOT, f), "utf8");
  for (const [, spec] of code.matchAll(/from "(\.[^"]+)"/g)) assert.ok(FICHIERS_COEUR.includes("desktop/src/" + spec.replace("./", "")), f + " importe " + spec + " : absent du paquet");
}
const coeur = fs.readFileSync(path.join(DEPOT, "desktop", "coeur.js"), "utf8");
assert.match(coeur, /global\.__SOREAL_RACINE_APP__/, "le cœur lit le dossier de l'application");
assert.match(coeur, /__SOREAL_COEUR_VALIDE__/, "le cœur se déclare valide après 20 s");
assert.equal((coeur.match(/path\.join\(APP, /g) || []).length >= 5, true, "jeu, graine, clé et maj.mjs viennent de l'installateur");
console.log("idle-desktop-coeur-v1 : OK");

/* Norman (2026-10-29) : « F5 et les voix ne marchent pas » : un cœur de mise à jour fermé dans les 20 premières secondes était REFUSÉ au démarrage suivant, l'application retombait sur le cœur d'origine (sans F5, sans envoi des voix au serveur) */
{
  const { readFileSync: lire } = await import("node:fs");
  const coeur = lire("desktop/coeur.js", "utf8"), preload = lire("desktop/preload.js", "utf8"), textes = lire("cloudflare/public/modules/textes-admin-v1.js", "utf8");
  const chargement = coeur.slice(coeur.indexOf('fenetre.webContents.on("did-finish-load"'), coeur.indexOf("fenetre.loadURL(ORIGINE"));
  assert.ok(chargement.indexOf("global.__SOREAL_COEUR_VALIDE__()") < chargement.indexOf("setTimeout(() => {"), "le cœur est validé dès que la page est chargée, avant le délai de 20 s de la mise à jour");
  assert.ok(coeur.includes('ipcMain.handle("coeur:version"') && preload.includes("coeurVersion: () => ipcRenderer.invoke(\"coeur:version\")"), "la page peut savoir quel cœur tourne");
  assert.ok(textes.includes("function diagnostiquerAdminExe_(msg)") && textes.includes("trop ancienne") && textes.includes("compte non relié") && textes.includes("la liaison a expiré") && textes.includes("le serveur ne te reconnaît pas comme administrateur"), "le refus d'enregistrer les voix est expliqué (cœur d'origine, compte non relié, liaison expirée, serveur)");
  console.log("idle-desktop-coeur-v1 (cœur validé tout de suite, diagnostic des voix): OK");
}

/* Norman (2026-10-29) : « l'interface Steam doit se superposer au jeu quand on le lance par Steam ; Maj + Tab ouvre le menu Steam » : lancé par Steam, le jeu dessine dans le processus principal (la superposition s'accroche au processus qui dessine) */
{
  const { readFileSync: lire } = await import("node:fs");
  const coeur = lire("desktop/coeur.js", "utf8");
  assert.ok(coeur.includes("process.env.SteamGameId || process.env.SteamAppId || process.env.SteamOverlayGameId") && coeur.includes('app.commandLine.appendSwitch("in-process-gpu")') && coeur.includes('app.commandLine.appendSwitch("disable-direct-composition")'), "lancé par Steam : dessin dans le processus principal, sans composition directe");
  assert.ok(coeur.indexOf("LANCE_PAR_STEAM") < coeur.indexOf("app.whenReady()"), "réglé avant l'ouverture de l'application");
  assert.ok(/if \(LANCE_PAR_STEAM\) \{[^}]*in-process-gpu/.test(coeur), "seulement lancé par Steam (hors de Steam le processus graphique séparé reste)");
  const entree = coeur.slice(coeur.indexOf('webContents.on("before-input-event"'), coeur.indexOf("Un lien vers un site"));
  assert.ok(entree.length > 100 && !/tab/i.test(entree) && /f5/.test(entree), "Maj + Tab n'est jamais intercepté par le jeu (seuls F5 et Ctrl+R le sont)");
  assert.ok(lire("desktop/src/steam.mjs", "utf8").includes('entier("AllowOverlay", 1)'), "le raccourci Steam autorise la superposition");
  assert.ok(/if \(LANCE_PAR_STEAM\) \{[^}]*CalculateNativeWinOcclusion[^}]*disable-backgrounding-occluded-windows/.test(coeur), "lancé par Steam : le suivi d'occultation de Chromium est coupé (bandes noires sous la superposition, 2026-10-30)");
  console.log("idle-desktop-coeur-v1 (superposition Steam): OK");
}
/* Norman (2026-10-31) : l'interface Steam faisait clignoter le jeu en noir tant qu'elle était ouverte : les animations sont gelées quand la fenêtre perd le focus, dégelées AVANT la repeinture au retour du focus */
{
  const coeurSteam = fs.readFileSync(new URL("../../desktop/coeur.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.ok(/if \(LANCE_PAR_STEAM\) \{[\s\S]*fenetre\.on\("blur", geler\);[\s\S]*fenetre\.on\("focus", degeler\);/.test(coeurSteam), "gel des animations à la perte du focus, dégel au retour (Steam seulement)");
  assert.ok(coeurSteam.includes("animation-play-state:paused!important") && coeurSteam.includes("canvas{visibility:hidden!important}"), "animations CSS et calques de dessin gelés");
  assert.ok(/const degeler = async \(\) => \{[\s\S]*removeInsertedCSS\(cle\)[\s\S]*repeindre\(\);/.test(coeurSteam), "le gel est retiré avant la repeinture");
}
/* Norman (2026-10-31) : « il n'y a plus que 3 ennemis dans l'ITOPOD » : l'exe lit la liste des prénoms sur le serveur (SOREAL TV est hors de portée de son Worker local), en garde la dernière copie et la relit hors ligne. */
{
  const coeurRoster = fs.readFileSync(new URL("../../desktop/coeur.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.ok(coeurRoster.includes('url.pathname === "/api/idle/media/roster"') && coeurRoster.includes("roster-itopod.json"), "liste des ennemis de l'ITOPOD : serveur d'abord, copie locale ensuite");
  assert.ok(coeurRoster.indexOf("roster-itopod.json") < coeurRoster.indexOf("const locale = await env.fetch(interne)"), "avant le Worker local");
}
console.log("idle-desktop-coeur-v1 (liste des ennemis de l'ITOPOD): OK");
