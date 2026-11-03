/*
 * Circuits imprimés de la page Augmentations : MONTÉE EN PUISSANCE (Norman, 2026-11-03 : « les 3 premiers peuvent rester comme ils sont, mais au-delà on doit sentir une montée en puissance ; inspire-toi de ces circuits imprimés : leurs
 * couleurs et leurs complexités, ils mélangent des couleurs »). Les trois premiers (✂️ 🥛 💥) gardent les motifs de soreal-idle-itopod.css ; les cinq suivants (🔫 ⚡ 🦾 🗡️ 🌀) reçoivent, de plus en plus riches :
 * pistes à 45° de plusieurs couleurs (plus nombreuses, plus fines), bus de pistes parallèles, composants à broches, vias, points lumineux avec halo, taches de lumière de couleurs mélangées dans le fond.
 * Produit cloudflare/public/soreal-idle-augment-pcb-puissance-v1.css (tuiles SVG sans raccord : chaque élément qui touche un bord est redessiné de l'autre côté).   Lancer : node cloudflare/tools/gen-pcb-puissance-v1.mjs
 */
import fs from "node:fs";

const W = 300, H = 240;
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f1 = (n) => String(Math.round(n * 10) / 10);

/* un élément = { svg: (dx,dy) => chaîne, box: [x0,y0,x1,y1] } : dessiné aux 9 décalages qui le font rentrer dans la tuile (aucun raccord visible) */
function enTuile(elements) {
  const out = [];
  for (const e of elements) {
    for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) {
      const [x0, y0, x1, y1] = e.box;
      if (x1 + dx < 0 || x0 + dx > W || y1 + dy < 0 || y0 + dy > H) continue;
      out.push(e.svg(dx, dy));
    }
  }
  return out.join("");
}
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

function genererTuile(graine, tier, couleurs) {
  const R = mulberry32(graine), choix = (a) => a[Math.floor(R() * a.length)];
  const nTraces = [10, 16, 20, 26, 33, 43, 57][tier], nBus = [0, 0, 1, 1, 2, 3, 4][tier], nPuces = [2, 2, 3, 4, 6, 7, 8][tier], nLueurs = [0, 0, 0, 5, 9, 14, 22][tier], nVias = [8, 13, 16, 20, 28, 38, 50][tier];
  const els = [];
  const defs = couleurs.map((c, i) => `<radialGradient id='g${i}'><stop offset='0' stop-color='${c}' stop-opacity='.7'/><stop offset='.45' stop-color='${c}' stop-opacity='.22'/><stop offset='1' stop-color='${c}' stop-opacity='0'/></radialGradient>`).join("");
  // pistes à 45°
  for (let k = 0; k < nTraces; k++) {
    let x = 10 * Math.floor(R() * (W / 10)), y = 10 * Math.floor(R() * (H / 10)), d = Math.floor(R() * 8);
    const pts = [[x, y]], n = 3 + Math.floor(R() * (3 + tier));
    for (let s = 0; s < n; s++) {
      const len = 10 * (2 + Math.floor(R() * 5)), diag = d % 2 === 1;
      x += DIRS[d][0] * len; y += DIRS[d][1] * len; pts.push([x, y]);
      d = (d + (R() < 0.5 ? 1 : 7) + (R() < 0.25 ? (R() < 0.5 ? 1 : 7) : 0)) % 8;
      void diag;
    }
    const c = choix(couleurs), w = choix([1.1, 1.5, 1.9, 2.4]), op = 0.32 + 0.3 * R();
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const box = [Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) + 4, Math.max(...ys) + 4];
    const dd = "M" + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L");
    const [a, b] = [pts[0], pts[pts.length - 1]], pastille = R() < 0.7;
    els.push({ box, svg: (dx, dy) => `<g transform='translate(${dx} ${dy})'><path d='${dd}' fill='none' stroke='${c}' stroke-opacity='${f1(op)}' stroke-width='${w}' stroke-linejoin='round' stroke-linecap='round'/>${pastille ? `<circle cx='${a[0]}' cy='${a[1]}' r='2.6' fill='none' stroke='${c}' stroke-opacity='${f1(op + 0.15)}' stroke-width='1.2'/><circle cx='${b[0]}' cy='${b[1]}' r='1.8' fill='${c}' fill-opacity='${f1(op + 0.2)}'/>` : ""}</g>` });
  }
  // bus de pistes parallèles (3 à 6 fils qui prennent un coude à 45°)
  for (let k = 0; k < nBus; k++) {
    const x0 = 10 * Math.floor(R() * 12), y0 = 20 + 10 * Math.floor(R() * 18), l1 = 40 + 10 * Math.floor(R() * 8), dg = 10 * (2 + Math.floor(R() * 3)), l2 = 30 + 10 * Math.floor(R() * 8), m = 3 + Math.floor(R() * 4), c = choix(couleurs), sens = R() < 0.5 ? 1 : -1;
    const box = [x0 - 2, y0 - 2 - m * 4 - dg, x0 + l1 + dg + l2 + 2, y0 + dg + m * 4 + 2];
    let lignes = "";
    for (let i = 0; i < m; i++) { const o = i * 4.2; lignes += `<path d='M${x0} ${f1(y0 + o)}H${x0 + l1}L${x0 + l1 + dg} ${f1(y0 + o + sens * dg)}H${x0 + l1 + dg + l2}' fill='none' stroke='${c}' stroke-opacity='.42' stroke-width='1.3' stroke-linejoin='round'/>`; }
    els.push({ box, svg: (dx, dy) => `<g transform='translate(${dx} ${dy})'>${lignes}</g>` });
  }
  // composants à broches
  /* les composants ne se chevauchent JAMAIS (Norman, 2026-11-03 : « bouger les mini puces noires pour qu'elles ne se chevauchent pas ») : emplacement tiré au hasard puis refusé s'il touche un autre composant (broches comprises + 14 points de marge, y compris de l'autre côté de la tuile) */
  const posees = [];
  const libre = (x, y, w, h) => posees.every((q) => [-W, 0, W].every((dx) => [-H, 0, H].every((dy) => x - 14 >= q.x + q.w + 14 + dx || x + w + 14 <= q.x - 14 + dx || y - 14 >= q.y + q.h + 14 + dy || y + h + 14 <= q.y - 14 + dy)));
  for (let k = 0; k < nPuces; k++) {
    let w = 0, h = 0, x = 0, y = 0, ok = false;
    for (let essai = 0; essai < 600 && !ok; essai++) {
      w = 28 + 6 * Math.floor(R() * 7); h = 18 + 6 * Math.floor(R() * 5); x = 12 + Math.floor(R() * (W - w - 24)); y = 12 + Math.floor(R() * (H - h - 24));
      ok = libre(x, y, w, h);
    }
    if (!ok) continue;
    posees.push({ x, y, w, h });
    const c = choix(couleurs);
    let broches = "";
    for (let px = x + 5; px < x + w - 3; px += 5) broches += `<path d='M${px} ${y - 4}V${y}M${px} ${y + h}V${y + h + 4}'/>`;
    for (let py = y + 5; py < y + h - 3; py += 5) broches += `<path d='M${x - 4} ${py}H${x}M${x + w} ${py}H${x + w + 4}'/>`;
    els.push({ box: [x - 6, y - 6, x + w + 6, y + h + 6], svg: (dx, dy) => `<g transform='translate(${dx} ${dy})'><rect x='${x}' y='${y}' width='${w}' height='${h}' rx='2' fill='#050a0e' fill-opacity='.78' stroke='${c}' stroke-opacity='.55' stroke-width='1.3'/><g stroke='${c}' stroke-opacity='.5' stroke-width='1.1'>${broches}</g><circle cx='${x + 5}' cy='${y + 5}' r='1.6' fill='${c}' fill-opacity='.55'/><path d='M${x + 10} ${y + h / 2}H${x + w - 8}' stroke='${c}' stroke-opacity='.28' stroke-width='1.4'/></g>` });
  }
  // vias
  for (let k = 0; k < nVias; k++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H), c = choix(couleurs);
    els.push({ box: [x - 4, y - 4, x + 4, y + 4], svg: (dx, dy) => `<circle cx='${x + dx}' cy='${y + dy}' r='2.1' fill='#05080d' stroke='${c}' stroke-opacity='.55' stroke-width='1.1'/>` });
  }
  // points lumineux avec halo
  for (let k = 0; k < nLueurs; k++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H), i = Math.floor(R() * couleurs.length), r = 10 + Math.floor(R() * (8 + tier * 3)), c = couleurs[i];
    els.push({ box: [x - r, y - r, x + r, y + r], svg: (dx, dy) => `<circle cx='${x + dx}' cy='${y + dy}' r='${r}' fill='url(#g${i})'/><circle cx='${x + dx}' cy='${y + dy}' r='1.7' fill='${c}' fill-opacity='.95'/>` });
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><defs>${defs}</defs>${enTuile(els)}</svg>`;
}
const uri = (svg) => 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';

/* base : couleur de la carte (inchangée : --pcb-base / --pcb-acc de soreal-idle-itopod.css) ; couleurs mélangées de plus en plus nombreuses ; taches de lumière de plus en plus fortes */
const CARTES = [
  { icone: "🥛", base: "#123a7a", fond: "#081833", acc: "#8fd0ff", tier: 0, couleurs: ["#8fd0ff", "#cfe9ff"], taches: [] },
  { icone: "💥", base: "#7a1428", fond: "#330811", acc: "#f0a47e", tier: 1, couleurs: ["#f0a47e", "#ffd0a8"], taches: [["#f0a47e", 12, 78, 30]] },
  { icone: "🔫", base: "#5a2a8c", fond: "#26123b", acc: "#dcb0ff", tier: 2, couleurs: ["#dcb0ff", "#ff9be6"], taches: [["#ff9be6", 22, 80, 28]] },
  { icone: "⚡", base: "#1a1b20", fond: "#0b0c10", acc: "#8fffee", tier: 3, couleurs: ["#4df0ff", "#7dff9a", "#fff36b"], taches: [["#4df0ff", 20, 84, 26], ["#fff36b", 16, 14, 78]] },
  { icone: "🦾", base: "#733d08", fond: "#2a1202", acc: "#ffd08a", tier: 4, couleurs: ["#ffb347", "#ff6b3d", "#ffe27a"], taches: [["#ff6b3d", 26, 76, 30], ["#ffe27a", 22, 20, 70], ["#ff9a3d", 18, 52, 90]] },
  { icone: "🗡️", base: "#0a525a", fond: "#04222a", acc: "#9ffff0", tier: 5, couleurs: ["#7dffd6", "#5ad0ff", "#c9e8e0", "#9bff7a"], taches: [["#5ad0ff", 28, 82, 24], ["#9bff7a", 22, 16, 76], ["#7dffd6", 22, 50, 50]] },
  { icone: "🌀", base: "#86185e", fond: "#2a0620", acc: "#ffb3ec", tier: 6, couleurs: ["#ff7ad9", "#7df0ff", "#ffd86b", "#b78bff", "#7dff9a"], taches: [["#ff7ad9", 34, 80, 26], ["#7df0ff", 28, 14, 72], ["#ffd86b", 26, 52, 92], ["#b78bff", 24, 40, 18]] }
];
const P = 'html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu="augmentations"] .aug-paire-v2';
let css = "/* GÉNÉRÉ par cloudflare/tools/gen-pcb-puissance-v1.mjs : ne pas éditer à la main. Circuits imprimés des augmentations 2 à 8 (chacun sa propre disposition, jamais celle du 1er) : montée en puissance (couleurs mélangées, complexité croissante). Aucune règle importante. */\n";
for (const c of CARTES) {
  const tuile = genererTuile(7000 + c.tier * 131 + 17, c.tier, c.couleurs);
  const vis = (a) => `radial-gradient(circle,#05080d 0 2.2px,${a} 2.6px 4.4px,transparent 4.9px)`;
  const taches = c.taches.map(([col, pct, x, y]) => `radial-gradient(ellipse 46% 58% at ${x}% ${y}%,color-mix(in srgb,${col} ${pct}%,transparent),transparent 72%)`).join(",\n  ");
  css += `${P}[data-icone="${c.icone}"]::after{background:
  ${vis(c.acc)} calc(100% - 3px) 3px/10px 10px no-repeat,
  ${vis(c.acc)} calc(100% - 3px) calc(100% - 3px)/10px 10px no-repeat,
  ${vis(c.acc)} 16px calc(100% - 3px)/10px 10px no-repeat,
  ${uri(tuile)} 0 0/${W}px ${H}px,
  ${taches},
  linear-gradient(165deg,color-mix(in srgb,${c.base} 96%,transparent),${c.fond})}
`;
}
fs.writeFileSync(new URL("../public/soreal-idle-augment-pcb-puissance-v1.css", import.meta.url), css);
console.log("ok", Math.round(css.length / 1024) + " Ko", CARTES.length + " cartes");
