#!/usr/bin/env node
/*
 * Détourage des trois images de la machine (Norman, 2026-11-06 : « supprimer le cadre gris autour » ; les boutons gris de chaque image doivent se connecter à ceux de la voisine). Le fond gris uni autour du cadre devient TRANSPARENT :
 * remplissage de zone depuis les quatre bords (couleur du fond), puis bord adouci (alpha proportionnel à la part de fond dans le pixel, couleur du trait noir) pour ne laisser aucun liseré gris.
 * Les dimensions ne changent pas (les positions de zones.json restent valables). Le travail se fait dans le Chromium de Playwright (décodage et encodage WebP avec transparence), sans aucune bibliothèque.
 *   node cloudflare/tools/detourer-machine-v2.mjs <dossier des originaux> [dossier de sortie]
 * Originaux attendus : centre.webp, tour-energie.webp, tour-magie.webp (aussi lus en .png).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const SRC = process.argv[2], DST = process.argv[3] || SRC;
if (!SRC) { console.error("usage : node cloudflare/tools/detourer-machine-v2.mjs <dossier des originaux> [sortie]"); process.exit(2); }
const rac = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
const vs = fs.existsSync(rac) ? fs.readdirSync(rac).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
const chrome = vs.length ? path.join(rac, vs[vs.length - 1], "chrome-win64", "chrome.exe") : "";
if (!chrome || !fs.existsSync(chrome)) { console.error("Chromium introuvable"); process.exit(2); }

const PORT = 9933 + Math.floor(Math.random() * 200);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const profil = fs.mkdtempSync(path.join(os.tmpdir(), "detour-"));
const enfant = spawn(chrome, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profil, "--no-first-run", "--disable-extensions", "about:blank"], { stdio: "ignore" });
async function fin() { try { enfant.kill(); } catch (_e) { /* */ } await dormir(1200); try { fs.rmSync(profil, { recursive: true, force: true }); } catch (_e) { /* */ } }

/* code exécuté DANS la page : reçoit l'image en base64, rend le WebP détouré en base64 */
const CODE = `(async (b64, type) => {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bmp = await createImageBitmap(new Blob([bin], { type }));
  const W = bmp.width, H = bmp.height;
  const cv = new OffscreenCanvas(W, H), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const im = g.getImageData(0, 0, W, H), d = im.data;
  /* couleur du fond : médiane des quatre coins */
  const coins = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].map(([x, y]) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; });
  const fond = [0, 1, 2].map((k) => coins.map((c) => c[k]).sort((a, b) => a - b)[1]);
  const proche = (i, tol) => Math.abs(d[i] - fond[0]) <= tol && Math.abs(d[i + 1] - fond[1]) <= tol && Math.abs(d[i + 2] - fond[2]) <= tol;
  const TOL = 16;
  const bg = new Uint8Array(W * H);
  const pile = [];
  const poser = (x, y) => { const p = y * W + x; if (!bg[p] && proche(p * 4, TOL)) { bg[p] = 1; pile.push(p); } };
  for (let x = 0; x < W; x++) { poser(x, 0); poser(x, H - 1); }
  for (let y = 0; y < H; y++) { poser(0, y); poser(W - 1, y); }
  while (pile.length) {
    const p = pile.pop(), x = p % W, y = (p / W) | 0;
    if (x > 0) poser(x - 1, y); if (x < W - 1) poser(x + 1, y); if (y > 0) poser(x, y - 1); if (y < H - 1) poser(x, y + 1);
  }
  /* POCHES enfermées : de la couleur du fond, pas reliées au bord (sous l'arc des tuyaux du haut). Composantes petites et situées dans le haut de l'image seulement : les panneaux vides (plus sombres) et le reste du cadre ne sont jamais touchés. */
  const poches = [];
  const vu = new Uint8Array(W * H);
  const TOLP = 9;
  for (let p0 = 0; p0 < W * H; p0++) {
    if (bg[p0] || vu[p0] || !proche(p0 * 4, TOLP)) continue;
    const comp = [p0]; vu[p0] = 1; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k], x = p % W, y = (p / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) { if (q >= 0 && !bg[q] && !vu[q] && proche(q * 4, TOLP)) { vu[q] = 1; comp.push(q); } }
    }
    if (comp.length >= 40) poches.push({ comp, x0, y0, x1, y1, aire: comp.length });
  }
  const retirees = [];
  for (const po of poches) {
    const haut = po.y1 < H * 0.14;   /* entièrement dans le haut de l'image */
    if (haut && po.aire < 40000 && po.y1 - po.y0 >= 8 && po.x1 - po.x0 >= 20) { for (const p of po.comp) bg[p] = 1; retirees.push([po.x0, po.y0, po.x1, po.y1, po.aire]); }
  }
  const gardees = poches.filter((po) => !(po.y1 < H * 0.14 && po.aire < 40000 && po.y1 - po.y0 >= 8 && po.x1 - po.x0 >= 20)).map((po) => [po.x0, po.y0, po.x1, po.y1, po.aire]).slice(0, 12);
  /* couleur du trait : sombre (pixels les plus sombres voisins du fond) */
  let n = 0; const trait = [0, 0, 0];
  for (let p = 0; p < W * H; p++) {
    if (bg[p]) continue;
    const x = p % W, y = (p / W) | 0;
    if ((x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W])) {
      const i = p * 4; if (d[i] + d[i + 1] + d[i + 2] < 90) { trait[0] += d[i]; trait[1] += d[i + 1]; trait[2] += d[i + 2]; n++; }
    }
  }
  const noir = n ? trait.map((v) => Math.round(v / n)) : [8, 8, 10];
  const lumFond = (fond[0] + fond[1] + fond[2]) / 3, lumNoir = (noir[0] + noir[1] + noir[2]) / 3;
  let transp = 0, bord = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (bg[p]) { d[i + 3] = 0; transp++; continue; }
    const x = p % W, y = (p / W) | 0;
    if ((x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W])) {
      /* pixel de bord : mélange fond / trait ; la part de fond devient de la transparence, la couleur redevient celle du trait */
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      const t = Math.max(0, Math.min(1, (lum - lumNoir) / Math.max(1, lumFond - lumNoir)));
      if (t > 0.04) { d[i] = noir[0]; d[i + 1] = noir[1]; d[i + 2] = noir[2]; d[i + 3] = Math.round((1 - t) * 255); bord++; }
    }
  }
  g.putImageData(im, 0, 0);
  const sortie = await cv.convertToBlob({ type: 'image/webp', quality: 0.92 });
  const buf = new Uint8Array(await sortie.arrayBuffer());
  let s = ''; for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
  return { w: W, h: H, fond, noir, transparents: transp, bord, octets: buf.length, retirees, gardees, b64: btoa(s) };
})`;

(async () => {
  let cible = null;
  for (let i = 0; i < 60 && !cible; i += 1) { try { const l = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json(); cible = (l.find((x) => x.type === "page") || {}).webSocketDebuggerUrl; } catch (_e) { /* */ } if (!cible) await dormir(500); }
  if (!cible) throw new Error("Chromium n'a pas démarré");
  const ws = new WebSocket(cible); await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error("DevTools refusé")); });
  let n = 0; const attente = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attente.has(d.id)) { const { ok, ko } = attente.get(d.id); attente.delete(d.id); if (d.error) ko(new Error(d.error.message)); else ok(d.result); } };
  const envoyer = (method, params = {}) => new Promise((ok, ko) => { const i = ++n; attente.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
  fs.mkdirSync(DST, { recursive: true });
  for (const nom of ["centre", "tour-energie", "tour-magie"]) {
    const f = ["webp", "png"].map((e) => path.join(SRC, nom + "." + e)).find((x) => fs.existsSync(x));
    if (!f) throw new Error("original introuvable : " + nom);
    const type = f.endsWith(".png") ? "image/png" : "image/webp";
    const r = await envoyer("Runtime.evaluate", { expression: "(" + CODE + ")(" + JSON.stringify(fs.readFileSync(f).toString("base64")) + "," + JSON.stringify(type) + ")", awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page : " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    const v = r.result.value;
    fs.writeFileSync(path.join(DST, nom + ".webp"), Buffer.from(v.b64, "base64"));
    console.log('   poches retirées (x0,y0,x1,y1,aire) : ' + JSON.stringify(v.retirees) + '\n   poches de la couleur du fond GARDÉES : ' + JSON.stringify(v.gardees));
  console.log(nom.padEnd(14) + v.w + "x" + v.h + "  fond " + v.fond.join(",") + "  trait " + v.noir.join(",") + "  transparents " + (v.transparents / (v.w * v.h) * 100).toFixed(1) + " %  bord adouci " + v.bord + " px  -> " + (v.octets / 1024).toFixed(0) + " Ko");
  }
  ws.close(); await fin();
})().catch(async (e) => { console.error("ÉCHEC : " + (e && e.message || e)); await fin(); process.exit(1); });
