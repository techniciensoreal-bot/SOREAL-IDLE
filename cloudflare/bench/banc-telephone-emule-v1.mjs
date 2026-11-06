/*
 * Banc « TÉLÉPHONE ÉMULÉ » (plan design/PLAN-COMPLET-2026-11-06.md, C0 ; Norman, 2026-11-06 : sur son téléphone aucun menu ne tient le budget). Reproduit sur PC les conditions mesurées : écran de téléphone (406x813 @3x, tactile),
 * agent utilisateur Android, processeur RALENTI (Emulation.setCPUThrottlingRate), puis déroule la mesure de référence intégrée au jeu (modules/mesure-reference-v1.js) et imprime son rapport.
 * Pilote le Chromium de Playwright DÉJÀ installé (aucun téléchargement) par le protocole DevTools, sans bibliothèque.
 *
 *   node cloudflare/bench/banc-telephone-emule-v1.mjs [--url=http://localhost:8841/] [--ralenti=2.6] [--partie=<fichier export>] [--diag] [--duree=90]
 *
 *   --ralenti : facteur de ralentissement du processeur (1 = PC). À CALIBRER : le moteur du téléphone de Norman calcule 2,3 à 2,6 fois plus lentement que son PC (synchro 121 ms contre 47 ms ; action 183 ms contre 78 ms).
 *   --partie  : une partie « Exporter ma partie » (format soreal-idle-partie-v1). Elle est LUE sur le disque et injectée dans la page par le protocole : jamais copiée dans un dossier servi, jamais dans le dépôt. Absente : la partie de référence 2.
 *   --diag    : lance le diagnostic de la Machine temporelle (4 passes) au lieu des 4 menus.
 *   --profil  : mesure avec le profil par fonction (profileur d'échantillonnage du navigateur).
 *   Le serveur du banc (cloudflare/tools/essai-local.mjs, port au choix) doit tourner. Les données de la page (IndexedDB, stockage) sont supprimées à la fin.
 * Limites (dites dans le rapport) : le rendu logiciel de Chromium sans fenêtre n'est pas le processeur graphique du téléphone ; seul le fil principal est ralenti.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const arg = (nom, defaut) => { const a = process.argv.find((x) => x.startsWith("--" + nom + "=")); return a ? a.slice(nom.length + 3) : defaut; };
const URL_JEU = arg("url", "http://localhost:8841/");
const RALENTI = Number(arg("ralenti", "2.6"));
const PARTIE = arg("partie", "");
const DIAG = process.argv.includes("--diag");
const PROFIL = process.argv.includes("--profil");
const DUREE_MAX_S = Number(arg("duree", "150"));
const PORT = 9333 + Math.floor(Math.random() * 300);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const racinePlaywright = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
const versions = fs.existsSync(racinePlaywright) ? fs.readdirSync(racinePlaywright).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
const chrome = versions.length ? path.join(racinePlaywright, versions[versions.length - 1], "chrome-win64", "chrome.exe") : "";
if (!chrome || !fs.existsSync(chrome)) { console.error("Chromium de Playwright introuvable : " + (chrome || racinePlaywright)); process.exit(2); }

let contenuPartie = null;
if (PARTIE) {
  const brut = JSON.parse(fs.readFileSync(PARTIE, "utf8"));
  contenuPartie = brut.format === "soreal-idle-partie-v1" ? brut : { format: "soreal-idle-partie-v1", cells: Array.isArray(brut) ? brut : Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]), serveurAt: Date.now() };
} else {
  const ref = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-2.json", "utf8"));
  const cells = Array.isArray(ref) ? ref : Object.keys(ref).sort((a, b) => a - b).map((k) => ref[k]);
  contenuPartie = { format: "soreal-idle-partie-v1", cells, serveurAt: Date.parse(cells[15]) };
}

const profil = fs.mkdtempSync(path.join(os.tmpdir(), "banc-tel-"));
const enfant = spawn(chrome, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profil, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--window-size=406,813", "about:blank"], { stdio: "ignore" });
let ferme = false;
async function nettoyer() {
  if (ferme) return; ferme = true;
  try { enfant.kill(); } catch (_e) { /* déjà arrêté */ }
  await dormir(1500);
  try { fs.rmSync(profil, { recursive: true, force: true }); } catch (_e) { /* fichiers encore tenus : sans gravité, c'est un dossier temporaire */ }
}
process.on("exit", () => { try { enfant.kill(); } catch (_e) { /* */ } });

async function cible() {
  for (let i = 0; i < 60; i += 1) {
    try { const r = await fetch("http://127.0.0.1:" + PORT + "/json/list"); const l = await r.json(); const p = l.find((x) => x.type === "page"); if (p) return p.webSocketDebuggerUrl; } catch (_e) { /* pas encore prêt */ }
    await dormir(500);
  }
  throw new Error("Chromium n'a pas démarré");
}

(async () => {
  const ws = new WebSocket(await cible());
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error("connexion DevTools refusée")); });
  let n = 0; const attente = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attente.has(d.id)) { const { ok, ko } = attente.get(d.id); attente.delete(d.id); if (d.error) ko(new Error(d.error.message)); else ok(d.result); } };
  const envoyer = (methode, params = {}) => new Promise((ok, ko) => { const i = ++n; attente.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method: methode, params })); });
  const evaluer = async (expr) => { const r = await envoyer("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error("page : " + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text)); return r.result.value; };

  await envoyer("Page.enable");
  await envoyer("Emulation.setDeviceMetricsOverride", { width: 406, height: 813, deviceScaleFactor: 3, mobile: true });
  await envoyer("Emulation.setTouchEmulationEnabled", { enabled: true });
  await envoyer("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36", platform: "Linux armv8l" });
  const aller = async (url) => { await envoyer("Page.navigate", { url }); for (let i = 0; i < 80; i += 1) { await dormir(500); try { if ((await evaluer("document.readyState")) === "complete") return; } catch (_e) { /* page en cours de remplacement */ } } };

  /* 1. page, jeton de banc, puis la partie injectée dans le moteur local (sans fichier servi) */
  await aller(URL_JEU);
  await evaluer("sessionStorage.setItem('soreal_idle_session_v1','essai'); 1");
  await aller(URL_JEU);
  await dormir(14000);
  const charge = await evaluer("(async()=>{const ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__; if(!ML)return {ok:false,erreur:'moteur local absent'}; return await ML.chargerFichier(" + JSON.stringify(contenuPartie) + ");})()");
  if (!charge || !charge.ok) throw new Error("chargement de la partie refusé : " + JSON.stringify(charge));
  await aller(URL_JEU);
  await dormir(15000);

  /* 2. ralentissement du processeur, puis la mesure de référence intégrée */
  await envoyer("Emulation.setCPUThrottlingRate", { rate: RALENTI });
  await evaluer("window.__resBanc=null; window.__SOREAL_IDLE_MESURE_REF_V1__.lancer(" + (DIAG ? "window.__SOREAL_IDLE_MESURE_REF_V1__.PLAN_DIAG_MACHINE,'diagnostic Machine temporelle'" : (PROFIL ? "null,'mesure avec profil par fonction',{profil:true}" : "")) + ").then(function(r){window.__resBanc=r||'interrompue';}); 1");
  let texte = "";
  for (let s = 0; s < DUREE_MAX_S; s += 2) {
    await dormir(2000);
    texte = await evaluer("(document.getElementById('soreal-idle-mesure-ref-texte')||{}).value||''");
    if (texte) break;
  }
  await envoyer("Emulation.setCPUThrottlingRate", { rate: 1 });
  console.log("### banc téléphone ÉMULÉ : écran 406x813 @3x, processeur ralenti x" + RALENTI + ", " + (PARTIE ? "partie fournie" : "partie de référence 2") + ", Chromium sans fenêtre (rendu logiciel : le processeur graphique du téléphone n'est pas émulé)");
  console.log(texte || "(aucun rapport dans le temps imparti)");

  /* 3. nettoyage : la partie n'existe plus nulle part */
  await evaluer("(async()=>{const l=(await indexedDB.databases()).map(d=>d.name); for(const x of l){await new Promise(r=>{const q=indexedDB.deleteDatabase(x); q.onsuccess=q.onerror=q.onblocked=()=>r();});} localStorage.clear(); sessionStorage.clear(); return l;})()");
  ws.close();
  await nettoyer();
})().catch(async (e) => { console.error("ÉCHEC du banc : " + (e && e.message || e)); await nettoyer(); process.exit(1); });
