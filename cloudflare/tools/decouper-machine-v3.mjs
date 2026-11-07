#!/usr/bin/env node
/*
 * Découpe de l'image DÉTOURÉE de la Machine temporelle pour PC (Norman, 2026-11-07, « Time Machine PC.png » : trois panneaux côte à côte sur une seule image de 2089 x 753 déjà détourée, hauteur commune). Les emplacements vides
 * (écrans, tubes, boutons...) sont TRANSPARENTS dans l'original : ils sont remplis d'un fond sombre opaque ici (sinon on verrait la page à travers), seul l'extérieur reste transparent. Trois tranches (tour Énergie, centre, tour Magie)
 * coupées dans les fentes entre les panneaux, enregistrées en WebP avec transparence dans public/machine-v3/. Décodage et encodage dans le Chromium de Playwright (aucune bibliothèque).
 *   node cloudflare/tools/decouper-machine-v3.mjs <image détourée .png> [dossier de sortie, défaut cloudflare/public/machine-v3]
 * zones.json : les emplacements en fractions de chaque tranche (mesurés par remplissage de zone sur l'original : composantes transparentes fermées) ; la version téléphone viendra plus tard (images séparées de Norman).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const SRC = process.argv[2], DST = process.argv[3] || "cloudflare/public/machine-v3";
if (!SRC) { console.error("usage : node cloudflare/tools/decouper-machine-v3.mjs <image détournée> [sortie]"); process.exit(2); }
/* tranches (x début inclus, x fin exclu) : marges vides retirées (colonnes 0-85 et 2004-2088), coupes dans les fentes entre panneaux (colonnes 652-675 et 1412-1436) */
const TRANCHES = { "tour-energie": [86, 662], "centre": [662, 1424], "tour-magie": [1424, 2004] };
/* emplacements vides : x0, y0, x1, y1 en pixels de l'image complète (surface intérieure) ; les socles et le cadran sont des disques opaques sombres : boîte du disque */
const ZONES = {
  "tour-energie": { titre: [182, 80, 581, 156], socle: [353, 179, 420, 246], tube: [129, 249, 196, 539], afficheur1: [260, 276, 572, 357], afficheur2: [260, 402, 572, 474], petit1: [266, 547, 389, 578], petit2: [445, 547, 570, 578], bouton1: [173, 624, 236, 680], bouton2: [278, 624, 340, 679], bouton3: [383, 624, 457, 680], bouton4: [500, 624, 569, 680] },
  "centre": { mob: [731, 57, 889, 191], info: [945, 57, 1361, 191], lcdG: [770, 283, 953, 325], cadran: [986, 232, 1076, 322], lcdD: [1141, 283, 1323, 326], fenetre: [751, 382, 1340, 494], chute: [917, 567, 1173, 674] },
  "tour-magie": { titre: [1507, 80, 1906, 156], socle: [1668, 180, 1735, 246], tube: [1893, 249, 1959, 539], afficheur1: [1516, 276, 1828, 357], afficheur2: [1517, 402, 1828, 474], petit1: [1518, 547, 1644, 578], petit2: [1701, 547, 1823, 577], bouton1: [1519, 624, 1588, 680], bouton2: [1632, 624, 1706, 680], bouton3: [1749, 624, 1812, 679], bouton4: [1853, 624, 1915, 680] }
};

const rac = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
const vs = fs.existsSync(rac) ? fs.readdirSync(rac).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
const chrome = vs.length ? path.join(rac, vs[vs.length - 1], "chrome-win64", "chrome.exe") : "";
if (!chrome || !fs.existsSync(chrome)) { console.error("Chromium introuvable"); process.exit(2); }
const PORT = 9933 + Math.floor(Math.random() * 200);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const profil = fs.mkdtempSync(path.join(os.tmpdir(), "decoupe-"));
const enfant = spawn(chrome, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profil, "--no-first-run", "--disable-extensions", "about:blank"], { stdio: "ignore" });
async function fin() { try { enfant.kill(); } catch (_e) { /* */ } await dormir(1200); try { fs.rmSync(profil, { recursive: true, force: true }); } catch (_e) { /* */ } }

/* code exécuté DANS la page : image en base64 + tranche [x0, x1) -> WebP en base64, emplacements fermés remplis de sombre */
const CODE = `(async (b64, type, tx0, tx1) => {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bmp = await createImageBitmap(new Blob([bin], { type }));
  const W = tx1 - tx0, H = bmp.height;
  const cv = new OffscreenCanvas(W, H), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, tx0, 0, W, H, 0, 0, W, H);
  const im = g.getImageData(0, 0, W, H), d = im.data;
  const vide = (p) => d[p * 4 + 3] < 20;
  const dehors = new Uint8Array(W * H), pile = [];
  const poser = (x, y) => { const p = y * W + x; if (!dehors[p] && vide(p)) { dehors[p] = 1; pile.push(p); } };
  for (let x = 0; x < W; x++) { poser(x, 0); poser(x, H - 1); }
  for (let y = 0; y < H; y++) { poser(0, y); poser(W - 1, y); }
  while (pile.length) {
    const p = pile.pop(), x = p % W, y = (p / W) | 0;
    if (x > 0) poser(x - 1, y); if (x < W - 1) poser(x + 1, y); if (y > 0) poser(x, y - 1); if (y < H - 1) poser(x, y + 1);
  }
  let remplis = 0;
  for (let p = 0; p < W * H; p++) {
    if (!vide(p) || dehors[p]) continue;
    const i = p * 4; d[i] = 7; d[i + 1] = 9; d[i + 2] = 13; d[i + 3] = 255; remplis++;
  }
  g.putImageData(im, 0, 0);
  const sortie = await cv.convertToBlob({ type: 'image/webp', quality: 0.93 });
  const buf = new Uint8Array(await sortie.arrayBuffer());
  let s = ''; for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
  return { w: W, h: H, remplis, octets: buf.length, b64: btoa(s) };
})`;

(async () => {
  let cible = null;
  for (let i = 0; i < 60 && !cible; i += 1) { try { const l = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json(); cible = (l.find((x) => x.type === "page") || {}).webSocketDebuggerUrl; } catch (_e) { /* */ } if (!cible) await dormir(250); }
  if (!cible) throw new Error("Chromium n'a pas démarré");
  const ws = new WebSocket(cible); await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error("DevTools refusé")); });
  let n = 0; const attente = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attente.has(d.id)) { const { ok, ko } = attente.get(d.id); attente.delete(d.id); if (d.error) ko(new Error(d.error.message)); else ok(d.result); } };
  const envoyer = (method, params = {}) => new Promise((ok, ko) => { const i = ++n; attente.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
  fs.mkdirSync(DST, { recursive: true });
  const type = SRC.endsWith(".png") ? "image/png" : "image/webp";
  const b64 = fs.readFileSync(SRC).toString("base64");
  const zonesJson = {};
  for (const [nom, [x0, x1]] of Object.entries(TRANCHES)) {
    const r = await envoyer("Runtime.evaluate", { expression: "(" + CODE + ")(" + JSON.stringify(b64) + "," + JSON.stringify(type) + "," + x0 + "," + x1 + ")", awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page : " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    const v = r.result.value;
    fs.writeFileSync(path.join(DST, nom + ".webp"), Buffer.from(v.b64, "base64"));
    console.log(nom.padEnd(13) + v.w + "x" + v.h + "  emplacements remplis " + v.remplis + " px  " + (v.octets / 1024).toFixed(0) + " Ko");
    const z = {};
    for (const [k, [a, b, c, e]] of Object.entries(ZONES[nom])) z[k] = { x: +((a - x0) / v.w).toFixed(5), y: +(b / v.h).toFixed(5), l: +((c - a + 1) / v.w).toFixed(5), h: +((e - b + 1) / v.h).toFixed(5), px: [a - x0, b, c - x0 + 1, e + 1] };
    zonesJson[nom] = { largeur: v.w, hauteur: v.h, zones: z };
  }
  fs.writeFileSync(path.join(DST, "zones.json"), JSON.stringify(zonesJson, null, 1) + "\n");
  ws.close(); await fin();
})().catch(async (e) => { console.error("ÉCHEC : " + (e && e.message || e)); await fin(); process.exit(1); });
