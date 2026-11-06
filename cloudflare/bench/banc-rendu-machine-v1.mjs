/*
 * Banc « RENDU de la Machine temporelle » (plan C9) : mesure, SANS téléphone et sans dérive, le travail que le navigateur fait par seconde pour dessiner la Machine temporelle, avec et sans chaque variante,
 * en alternance (normale, variante, normale, variante, normale) sur la MÊME page. Le travail est lu dans la trace du navigateur (Tracing) : recalcul de style, mise en page, pré-peinture, peinture, couches, rastérisation.
 * Ce n'est pas du temps d'image (le processeur graphique du téléphone n'est pas là) mais du TRAVAIL par seconde : si une variante le réduit, elle réduit aussi ce que fait le téléphone.
 *   node cloudflare/bench/banc-rendu-machine-v1.mjs [--url=http://localhost:8841/] [--ralenti=1] [--duree=8] [--variantes=bulles,sansConteneur,pause,cadre]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : d; };
const URL_JEU = arg("url", "http://localhost:8841/");
const RALENTI = Number(arg("ralenti", "1"));
const DUREE = Number(arg("duree", "8"));
const VARIANTES = arg("variantes", "bulles,sansConteneur,pause,cadre").split(",");
const PORT = 9633 + Math.floor(Math.random() * 300);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const rac = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
const vs = fs.existsSync(rac) ? fs.readdirSync(rac).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
const chrome = vs.length ? path.join(rac, vs[vs.length - 1], "chrome-win64", "chrome.exe") : "";
if (!chrome || !fs.existsSync(chrome)) { console.error("Chromium introuvable"); process.exit(2); }

const ref = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-2.json", "utf8"));
const cells = Array.isArray(ref) ? ref : Object.keys(ref).sort((a, b) => a - b).map((k) => ref[k]);
const partie = { format: "soreal-idle-partie-v1", cells, serveurAt: Date.parse(cells[15]) };

const profil = fs.mkdtempSync(path.join(os.tmpdir(), "banc-rendu-"));
const enfant = spawn(chrome, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profil, "--no-first-run", "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--window-size=406,813", "about:blank"], { stdio: "ignore" });
let ferme = false;
async function nettoyer() {
  if (ferme) return; ferme = true;
  try { enfant.kill(); } catch (_e) { /* déjà arrêté */ }
  await dormir(1500);
  try { fs.rmSync(profil, { recursive: true, force: true }); } catch (_e) { /* dossier temporaire */ }
}
async function cible() {
  for (let i = 0; i < 60; i += 1) {
    try { const l = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json(); const p = l.find((x) => x.type === "page"); if (p) return p.webSocketDebuggerUrl; } catch (_e) { /* pas prêt */ }
    await dormir(500);
  }
  throw new Error("Chromium n'a pas démarré");
}

(async () => {
  const ws = new WebSocket(await cible());
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error("DevTools refusé")); });
  let couches = []; let n = 0; const attente = new Map(); const evenements = []; let finTrace = null;
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && attente.has(d.id)) { const { ok, ko } = attente.get(d.id); attente.delete(d.id); if (d.error) ko(new Error(d.error.message)); else ok(d.result); }
    else if (d.method === "Tracing.dataCollected") evenements.push(...d.params.value);
    else if (d.method === "Tracing.tracingComplete" && finTrace) finTrace();
    else if (d.method === "LayerTree.layerTreeDidChange" && d.params.layers) couches = d.params.layers;
  };
  const envoyer = (methode, params = {}) => new Promise((ok, ko) => { const i = ++n; attente.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method: methode, params })); });
  const evaluer = async (expr) => {
    const r = await envoyer("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page : " + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
    return r.result.value;
  };
  await envoyer("Page.enable");
  await envoyer("LayerTree.enable");
  await envoyer("Emulation.setDeviceMetricsOverride", { width: 406, height: 813, deviceScaleFactor: 3, mobile: true });
  await envoyer("Emulation.setTouchEmulationEnabled", { enabled: true });
  const aller = async (url) => { await envoyer("Page.navigate", { url }); for (let i = 0; i < 80; i += 1) { await dormir(500); try { if ((await evaluer("document.readyState")) === "complete") return; } catch (_e) { /* page remplacée */ } } };

  await aller(URL_JEU);
  await evaluer("sessionStorage.setItem('soreal_idle_session_v1','essai'); 1");
  await aller(URL_JEU);
  await dormir(14000);
  const ch = await evaluer("(async()=>{const ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__; if(!ML)return {ok:false}; return await ML.chargerFichier(" + JSON.stringify(partie) + ");})()");
  if (!ch || !ch.ok) throw new Error("partie refusée");
  await aller(URL_JEU);
  await dormir(15000);
  if (RALENTI > 1) await envoyer("Emulation.setCPUThrottlingRate", { rate: RALENTI });
  await evaluer("(function(){var M=window.__SOREAL_IDLE_MESURE_REF_V1__;window.__envB=M.envReel();return window.__envB.cliquerMenu('" + arg("menu", "machine") + "');})()");
  await dormir(4000);

  const PROFIL = arg("profil", "");
  if (PROFIL) {
    /* Profil du FIL PRINCIPAL de la page pendant DUREE secondes, menu choisi ouvert, sans aucune action : où va le temps, et combien coûte le traitement de chaque réponse du moteur */
    await envoyer("Profiler.enable");
    await envoyer("Profiler.setSamplingInterval", { interval: 250 });
    await envoyer("Profiler.start");
    await dormir(DUREE * 1000);
    const { profile } = await envoyer("Profiler.stop");
    const noeuds = new Map(profile.nodes.map((n) => [n.id, n]));
    const parent = new Map();
    for (const n of profile.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
    const soi = new Map(); let total = 0, actif = 0;
    for (let i = 0; i < profile.samples.length; i += 1) {
      const id = profile.samples[i], dt = profile.timeDeltas[i] / 1000; total += dt;
      const nm = noeuds.get(id).callFrame.functionName;
      if (nm !== "(idle)" && nm !== "(program)") actif += dt;
      soi.set(id, (soi.get(id) || 0) + dt);
    }
    const nomF = (id) => { const c = noeuds.get(id).callFrame; return (c.functionName || "(anonyme)") + " " + String(c.url || "").split("/").pop().split("?")[0] + ":" + c.lineNumber; };
    const propre = new Map(), cumul = new Map();
    for (const [id, ms] of soi) {
      const k = nomF(id); propre.set(k, (propre.get(k) || 0) + ms);
      const vus = new Set(); let c = id;
      while (c !== undefined) { const kk = nomF(c); if (!vus.has(kk)) { vus.add(kk); cumul.set(kk, (cumul.get(kk) || 0) + ms); } c = parent.get(c); }
    }
    const aff = (m, n) => [...m.entries()].filter(([k]) => !/^\((idle|program|root|garbage)/.test(k)).sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, ms]) => String(ms.toFixed(0)).padStart(7) + " ms " + (ms / DUREE / 10).toFixed(1).padStart(5) + " %  " + k).join("\n");
    console.log("### profil du fil principal : " + DUREE + " s, menu " + (arg("menu", "machine")) + ", actif " + (actif / DUREE / 10).toFixed(1) + " % du temps");
    console.log("--- temps PROPRE (par fonction)\n" + aff(propre, 18));
    console.log("--- temps CUMULÉ (fonction et ce qu'elle appelle)\n" + aff(cumul, 26));
    await evaluer("(async()=>{const l=(await indexedDB.databases()).map(d=>d.name); for(const x of l){await new Promise(r=>{const q=indexedDB.deleteDatabase(x); q.onsuccess=q.onerror=q.onblocked=()=>r();});} localStorage.clear(); sessionStorage.clear(); return 1;})()");
    ws.close(); await nettoyer(); return;
  }
  const CAPTURE = arg("capture", "");
  if (CAPTURE) {
    await evaluer("Array.from(document.querySelectorAll('button')).filter(function(b){return (b.textContent||'').trim().indexOf('Super')===0;}).forEach(function(b){b.click();}); 1");
    await dormir(2500);
    await evaluer("window.__envB.cliquerMenu('machine')");
    await dormir(3000);
    await evaluer("(function(){var t=document.querySelector('" + arg("sel", ".tmm-tube") + "');if(t)t.scrollIntoView({block:'start'});return 1;})()");
    await dormir(1500);
    const rect = await evaluer("(function(){var l=Array.from(document.querySelectorAll('" + arg("sel", ".tmm-tube") + "')).map(function(e){return e.getBoundingClientRect();});if(!l.length)return null;var x0=Math.min.apply(null,l.map(function(r){return r.left;})),y0=Math.min.apply(null,l.map(function(r){return r.top;})),x1=Math.max.apply(null,l.map(function(r){return r.right;})),y1=Math.max.apply(null,l.map(function(r){return r.bottom;}));return {x:x0-6+window.pageXOffset,y:y0-6+window.pageYOffset,width:x1-x0+12,height:y1-y0+12,n:l.length};})()");
    console.log("tubes : " + JSON.stringify(rect));
    for (let k = 0; k < 4; k += 1) {
      const r = await envoyer("Page.captureScreenshot", { format: "png", ...(rect ? { clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2 } } : {}) });
      fs.writeFileSync(CAPTURE + "-" + k + ".png", Buffer.from(r.data, "base64"));
      await dormir(350);
    }
    await evaluer("(async()=>{const l=(await indexedDB.databases()).map(d=>d.name); for(const x of l){await new Promise(r=>{const q=indexedDB.deleteDatabase(x); q.onsuccess=q.onerror=q.onblocked=()=>r();});} localStorage.clear(); sessionStorage.clear(); return 1;})()");
    ws.close(); await nettoyer(); return;
  }
  const CLES = ["UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Layerize", "Commit", "RasterTask"];
  async function passe(variante) {
    await evaluer("window.__envB.variante(" + JSON.stringify(variante) + "); 1");
    await dormir(2500);
    evenements.length = 0;
    const fin = new Promise((r) => { finTrace = r; });
    await envoyer("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline", transferMode: "ReportEvents" });
    await dormir(DUREE * 1000);
    await envoyer("Tracing.end");
    await fin;
    let principal = null;
    for (const e of evenements) if (e.name === "thread_name" && e.args && e.args.name === "CrRendererMain") principal = e.tid;
    const somme = {}; let images = 0;
    for (const e of evenements) {
      if (e.name === "BeginMainThreadFrame") images += 1;
      if (e.ph !== "X" || !e.dur || !CLES.includes(e.name)) continue;
      if (e.name === "RasterTask" || e.tid === principal) somme[e.name] = (somme[e.name] || 0) + e.dur / 1000;
    }
    const dessinees = couches.filter((c) => c.drawsContent !== false);
    return { somme, images, nbCouches: couches.length, nbDessin: dessinees.length, aire: dessinees.reduce((a, c) => a + c.width * c.height, 0) / 1e6 };
  }

  const ordre = [null];
  for (const v of VARIANTES) { ordre.push(v); ordre.push(null); }
  const res = [];
  for (const v of ordre) { const r = await passe(v); res.push({ v, ...r }); process.stderr.write("."); }
  await evaluer("window.__envB.variante(null); 1");

  const RENDU = ["Paint", "Layerize", "Commit", "RasterTask"];
  const total = (r) => RENDU.reduce((a, k) => a + (r.somme[k] || 0), 0) / DUREE;   /* travail de PEINTURE : celui que la machine déclenche */
  console.log("\n### rendu Machine temporelle : travail du navigateur par seconde (ms/s), écran 406x813 @3x, ralenti x" + RALENTI + ", " + DUREE + " s par passe, alternance normale/variante");
  console.log("passe".padEnd(18) + CLES.map((k) => k.slice(0, 8).padStart(9)).join("") + "  rendu  couch  dessin  aire(Mpx)");
  res.forEach((r, i) => console.log(((r.v || "normale " + (i / 2 + 1))).padEnd(18) + CLES.map((k) => ((r.somme[k] || 0) / DUREE).toFixed(1).padStart(9)).join("") + total(r).toFixed(1).padStart(9) + String(r.nbCouches).padStart(7) + String(r.nbDessin).padStart(8) + r.aire.toFixed(2).padStart(11)));
  for (let i = 1; i < res.length - 1; i += 2) {
    const reference = (total(res[i - 1]) + total(res[i + 1])) / 2, v = total(res[i]), derive = Math.abs(total(res[i - 1]) - total(res[i + 1]));
    const net = Math.abs(reference - v) > Math.max(derive, reference * 0.1);
    console.log("=> " + res[i].v.padEnd(14) + v.toFixed(1) + " ms/s contre " + reference.toFixed(1) + " (normales voisines, dérive " + derive.toFixed(1) + ") : " + (!net ? "sans effet net" : (v < reference ? "RÉDUIT de " + ((1 - v / reference) * 100).toFixed(0) + " %" : "AUGMENTE de " + ((v / reference - 1) * 100).toFixed(0) + " %")));
  }
  await evaluer("(async()=>{const l=(await indexedDB.databases()).map(d=>d.name); for(const x of l){await new Promise(r=>{const q=indexedDB.deleteDatabase(x); q.onsuccess=q.onerror=q.onblocked=()=>r();});} localStorage.clear(); sessionStorage.clear(); return 1;})()");
  ws.close();
  await nettoyer();
})().catch(async (e) => { console.error("ÉCHEC : " + (e && e.message || e)); await nettoyer(); process.exit(1); });
