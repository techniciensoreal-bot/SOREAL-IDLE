/* Générateur de cloudflare/public/soreal-idle-menus-boutons-v1.css (boutons de la barre de sélection des menus).
   Norman (2026-10-30) : le petit bouton montre les DEUX GRANDS DESSINS du cadre de titre de son menu (extraits par ce script des feuilles soreal-idle-entetes-*.css / itopod.css, jamais redessinés).
   Ouvert = il brille ; fermé = sombre ; il TRAVAILLE = ses deux dessins s'animent (classe travail-v1, posée par la barre). */
import { readFileSync, writeFileSync } from "node:fs";

const P = "html body.soreal-idle-active-v47 .soreal-idle-nav-v28 .soreal-idle-nav-button-v28";

/* thèmes : bg [haut, milieu, bas], ring [couleurs du dégradé 90deg], glow, a (clair), b (foncé), anim */
const T = {
  entrainement: { bg: ["#322628", "#1b1214", "#120b0c"], ring: ["#ff4a36", "#ff9a2e", "#ffd27a", "#ff9a2e", "#ff4a36"], glow: "255,120,50", a: "#ffd27a", b: "#c9372a", anim: { k: "rise", c: ["#ff9a2e", "#ffd27a", "#ff4a36"], t: 2.4 } },
  combat: { bg: ["#1a1040", "#0d0a2a", "#070618"], ring: ["#ff2d9a", "#7a5cff", "#2ad4ff", "#7a5cff", "#ff2d9a"], glow: "255,45,154", a: "#ffd24a", b: "#7a5cff", anim: { k: "chase", t: 2.6 } },
  aventure: { bg: ["#143629", "#1d4d36", "#4a4326"], ring: ["#f2d26b", "#9c6a24", "#ffe9a8", "#9c6a24", "#f2d26b"], glow: "242,210,107", a: "#ffe9a8", b: "#2c6a49", anim: { k: "trail", c: "#ffe9a8", t: 1.6 } },
  renaissance: { bg: ["#1a0f2e", "#3c1a5c", "#7a2b4a"], ring: ["#ffd27a", "#ff7a2e", "#fff1a8", "#ff7a2e", "#ffd27a"], glow: "255,160,70", a: "#ffd27a", b: "#b9487a", anim: { k: "rise", c: ["#fff1a8", "#ffd27a", "#ff9a5e"], t: 3.4 } },
  moneyPit: { bg: ["#2a1d06", "#170f03", "#0a0602"], ring: ["#ffe58a", "#e0a21a", "#8a5a06", "#e0a21a", "#ffe58a"], glow: "240,180,40", a: "#ffd24a", b: "#8a5a06", anim: { k: "fall", c: ["#ffd24a", "#fff0a8", "#e0a21a"], t: 2.2, big: true } },
  augmentations: { bg: ["#2a1522", "#170a14", "#0f060c"], ring: ["#ff6a1a", "#ffb02e", "#ffe58a", "#ffb02e", "#ff6a1a"], glow: "255,138,26", a: "#ffd24a", b: "#ff8a1a", anim: { k: "sweep", c: "255,210,74", t: 2.8 } },
  avance: { bg: ["#10303f", "#0a1f2c", "#06131c"], ring: ["#19e3ff", "#7dffd0", "#e6fbff", "#7dffd0", "#19e3ff"], glow: "25,227,255", a: "#9fe9ff", b: "#19c8a0", anim: { k: "wave", c: "rgba(120,240,255,.55)", t: 2.6 } },
  machine: { bg: ["#16363f", "#0c1f26", "#07151a"], ring: ["#22b8cf", "#9fe9ff", "#ffe08a", "#9fe9ff", "#22b8cf"], glow: "34,184,207", a: "#ffe08a", b: "#22a0b8", anim: { k: "spin", t: 8 } },
  sang: { bg: ["#3a0a14", "#220510", "#12030a"], ring: ["#7a0f24", "#ff3a52", "#ffd0d5", "#ff3a52", "#7a0f24"], glow: "255,58,82", a: "#ff7a8a", b: "#c01833", anim: { k: "fall", c: ["#ff3a52", "#ff7a8a", "#c01833"], t: 2.8, big: true } },
  tower: { bg: ["#05071a", "#0b1438", "#1b3b6b"], ring: ["#c9b8ff", "#7fd6ff", "#ffffff", "#7fd6ff", "#c9b8ff"], glow: "127,214,255", a: "#ffffff", b: "#6aa6e8", anim: { k: "rise", c: ["#ffffff", "#bfe9ff", "#c9b8ff"], t: 4 } },
  daycare: { bg: ["#0b2a2c", "#08191d", "#050e12"], ring: ["#ff7ad9", "#ffd24a", "#7dffb0", "#5eead4", "#8ab4ff", "#ff7ad9"], glow: "94,234,212", a: "#5eead4", b: "#2fb9a6", anim: { k: "rainbow", t: 3.2 } },
  challenges: { bg: ["#3a2a1c", "#6b3004", "#9a4a0c"], ring: ["#ffe08a", "#c0651a", "#ffd24a", "#c0651a", "#ffe08a"], glow: "255,160,50", a: "#ffe08a", b: "#e0801f", anim: { k: "flag", t: 1.8 } },
  titans: { bg: ["#3a2c2a", "#241a19", "#150b0b"], ring: ["#ff7a1a", "#b8322e", "#5b3a34", "#b8322e", "#ff7a1a"], glow: "255,100,40", a: "#ff7a1a", b: "#8a2420", anim: { k: "pulse", c: "255,90,30", t: 2.4 } },
  ngu: { bg: ["#1a2150", "#10143a", "#080a22"], ring: ["#ffe27a", "#fff0b0", "#d8dcff", "#8a98ff", "#ffe27a"], glow: "216,220,255", a: "#fff0b0", b: "#8a98ff", anim: { k: "beam", t: 7 } },
  wandoos: { bg: ["#0b2216", "#07170f", "#030c07"], ring: ["#eae3ca", "#b9b08f", "#7b7459", "#b9b08f", "#eae3ca"], glow: "125,255,160", a: "#9dffb8", b: "#2f8f56", anim: { k: "scan", t: 2.6 } },
  yggdrasil: { bg: ["#0e2a1a", "#0a1d12", "#05100a"], ring: ["#f0cc62", "#3f9b5a", "#17492b", "#3f9b5a", "#f0cc62"], glow: "90,200,120", a: "#8ee08a", b: "#2f7a45", anim: { k: "rise", c: ["#d8ff7a", "#f0cc62", "#8ee08a"], t: 4.2, soft: true } },
  diggers: { bg: ["#3a2410", "#24160a", "#150c05"], ring: ["#ffd98a", "#c98a2b", "#6b4210", "#c98a2b", "#ffd98a"], glow: "255,190,80", a: "#ffd98a", b: "#9a9aa4", anim: { k: "twinkle", c: ["#ffe9a8", "#ffd24a"], t: 1.8 } },
  beards: { bg: ["#3b230f", "#26160a", "#160c05"], ring: ["#ffcf8a", "#b5651d", "#5e300a", "#b5651d", "#ffcf8a"], glow: "230,150,70", a: "#ffcf8a", b: "#9a5a22", anim: { k: "wave", c: "rgba(255,207,138,.5)", t: 3 } },
  macguffins: { bg: ["#2c1040", "#1b0a2c", "#10051a"], ring: ["#ffe6a0", "#ec4899", "#a855f7", "#ec4899", "#ffe6a0"], glow: "236,72,153", a: "#ffe6a0", b: "#a855f7", anim: { k: "sweep", c: "255,140,220", t: 3 } },
  hacks: { bg: ["#04160c", "#020d07", "#010603"], ring: ["#00c27a", "#39ff6a", "#d6ffe3", "#39ff6a", "#00c27a"], glow: "57,255,106", a: "#7dffa0", b: "#00a060", anim: { k: "matrix", t: 1.6 } },
  questing: { bg: ["#3a2410", "#2a1a0a", "#1b1006"], ring: ["#4a280a", "#a8742a", "#f0cf78", "#a8742a", "#4a280a"], glow: "226,184,90", a: "#f0cf78", b: "#7a4a14", anim: { k: "pulse", c: "240,200,100", t: 2.6 } },
  quirks: { bg: ["#2a1636", "#1a0e24", "#100716"], ring: ["#ff8c22", "#e07bb8", "#b7e03a", "#3fd0c0", "#ff8c22"], glow: "224,123,184", a: "#ffd0ea", b: "#a0408a", anim: { k: "rise", c: ["#ff8c22", "#e07bb8", "#b7e03a"], t: 3, big: true } },
  wishes: { bg: ["#1d1450", "#0e0a32", "#080620"], ring: ["#ffd24a", "#c89bff", "#5fe3ff", "#c89bff", "#ffd24a"], glow: "155,92,255", a: "#ffd24a", b: "#9b5cff", anim: { k: "shoot", t: 4.6 } },
  cards: { bg: ["#0e6a45", "#0a5236", "#063a25"], ring: ["#8a5a14", "#ffe08a", "#c8902a", "#fff0b0", "#c8902a", "#ffe08a", "#8a5a14"], glow: "255,224,138", a: "#d02828", b: "#ffe08a", anim: { k: "sweep", c: "255,240,176", t: 3 } },
  cooking: { bg: ["#6e290f", "#4a1b09", "#2c1005"], ring: ["#ffd29a", "#ea580c", "#8a2f06", "#ea580c", "#ffd29a"], glow: "234,88,12", a: "#ffd29a", b: "#c2410c", anim: { k: "rise", c: ["#ffd29a", "#fff0dc", "#ff9a5e"], t: 3.6, soft: true } },
  shop: { bg: ["#3e1646", "#2a0e34", "#180720"], ring: ["#c8902a", "#ffe27a", "#d946c8", "#ffe27a", "#c8902a"], glow: "217,70,200", a: "#ffe27a", b: "#8a2f9c", anim: { k: "chase", t: 2.8 } },
  chroniques: { bg: ["#3a2a14", "#291c0c", "#1a1106"], ring: ["#f1dfae", "#d2ae6a", "#8a6a2a", "#d2ae6a", "#f1dfae"], glow: "226,190,110", a: "#f1dfae", b: "#8a6a2a", anim: { k: "sweep", c: "255,236,180", t: 3.4 } },
  chat: { bg: ["#10313a", "#0b2328", "#061214"], ring: ["#2ff0d0", "#7cffe8", "#ffd27a", "#ffb02e", "#2ff0d0"], glow: "47,240,208", a: "#7cffe8", b: "#16a898", anim: { k: "pulse", c: "47,240,208", t: 2.2 } },
  parametres: { bg: ["#485066", "#2c3345", "#1b2030"], ring: ["#eef2fa", "#8793a8", "#e6ebf5", "#6a7388", "#eef2fa"], glow: "220,230,245", a: "#dfe5f1", b: "#6a7388", anim: { k: "spin", t: 10 } },
  admin: { bg: ["#2a1218", "#171b24", "#0b0d12"], ring: ["#dc2626", "#ff8a8a", "#dc2626", "#7a1414", "#dc2626"], glow: "220,38,38", a: "#ff8a8a", b: "#7a1414", anim: { k: "blink", t: 1.4 } },
};

export const DOM = {"entrainement":"#e63b2e","combat":"#ff2d9a","aventure":"#58b947","renaissance":"#fff04a","moneyPit":"#c49a00","augmentations":"#ff8a1a","avance":"#1aa0ff","machine":"#0f8f8f","sang":"#6e0d22","tower":"#e4ecff","daycare":"#a8f0cc","challenges":"#ff9060","titans":"#6a4a3c","ngu":"#3d7bff","wandoos":"#9be01a","yggdrasil":"#1a4a2a","diggers":"#80802a","beards":"#d2a070","macguffins":"#c25cf0","hacks":"#00ff66","questing":"#a08ae8","quirks":"#f0a0d8","wishes":"#2b1f8a","cards":"#18a06a","cooking":"#a8421a","shop":"#9a2088","chroniques":"#f6f0d0","chat":"#22e0e0","parametres":"#8793a8","admin":"#1c1f28"};
const hx=(h)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=(r)=>"#"+r.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
const mix=(h,o,p)=>toHex(hx(h).map((v,i)=>v*(1-p)+hx(o)[i]*p));
for (const [id,d] of Object.entries(DOM)) {
  const t=T[id], light=mix(d,"#ffffff",.5), lighter=mix(d,"#ffffff",.8), dark=mix(d,"#000000",.55);
  const lum=(hx(d)[0]*.3+hx(d)[1]*.59+hx(d)[2]*.11)/255;
  const base=lum>.6?.62:lum>.35?.5:.12;   /* fond : la couleur dominante assombrie pour que le texte reste lisible */
  t.dom=d; t.light=light; t.lighter=lighter; t.dark=dark;
  t.bg=[mix(d,"#000000",Math.max(0,base-.12)),mix(d,"#000000",base+.1),mix(d,"#000000",Math.min(.9,base+.22))];
  t.ring=[dark,d,lighter,d,dark]; t.glow=hx(d).join(","); t.a=lighter; t.b=d;
}

/* ---- extraction des grands cadres (fond, dessins, liseré, style du titre) ---- */
const SOURCES = ["entetes-a", "entetes-b", "entetes-c", "entetes-d", "itopod"];
function coupe(s) { /* virgules de premier niveau */
  const r = []; let d = 0, cur = "", q = false;
  for (const ch of s) {
    if (ch === '"') q = !q;
    if (!q) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && d === 0) { r.push(cur.trim()); cur = ""; continue; } }
    cur += ch;
  }
  if (cur.trim()) r.push(cur.trim());
  return r;
}
function finDeclaration(s) { /* jusqu'au premier « ; » hors guillemets et parenthèses (le fond est suivi d'autres déclarations, ex. animation) */
  let d = 0, q = false;
  for (let i = 0; i < s.length; i++) { const ch = s[i]; if (ch === '"') q = !q; if (q) continue; if (ch === "(") d++; if (ch === ")") d--; if (ch === ";" && d === 0) return s.slice(0, i); }
  return s;
}
const CADRES2 = {}, CADRES = {}, LISERES = {}, TITRES = {};
for (const f of SOURCES) {
  const t = readFileSync(`cloudflare/public/soreal-idle-${f}.css`, "utf8");
  const re = /\[data-menu="([A-Za-z]+)"\] (?:\.soreal-idle-page-head-v28|\.bm-entete)\[data-entete-menu\]::before\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(t))) {
    const i = m[2].indexOf("background:");
    if (i < 0) continue;
    if (CADRES[m[1]]) { if (!CADRES2[m[1]]) CADRES2[m[1]] = coupe(finDeclaration(m[2].slice(i + 11))); continue; } /* la première règle est la version PC, la seconde (≤ 560 px) la version téléphone */
    CADRES[m[1]] = coupe(finDeclaration(m[2].slice(i + 11)));
  }
  const reA = /\[data-menu="([A-Za-z]+)"\] \.soreal-idle-page-head-v28\[data-entete-menu\]::after\s*\{([^}]*)\}/g;
  while ((m = reA.exec(t))) {
    const b = m[2].match(/background:([^;]*border-box)/);
    if (b && !LISERES[m[1]]) LISERES[m[1]] = b[1].trim();
  }
  const reT = /\[data-menu="([A-Za-z]+)"\] \.soreal-idle-page-head-v28\[data-entete-menu\] \.soreal-idle-page-title-v28\s*\{([^}]*)\}/g;
  while ((m = reT.exec(t))) TITRES[m[1]] = Object.assign(TITRES[m[1]] || {}, Object.fromEntries(m[2].split(";").filter(Boolean).map((x) => [x.slice(0, x.indexOf(":")).trim(), x.slice(x.indexOf(":") + 1).trim()])));
}
const urlDe = (couche) => { const x = couche.match(/^url\("[^"]*"\)/); if (!x) throw new Error("couche sans dessin : " + couche.slice(0, 60)); return x[0]; };
const degrade = (couche) => { /* le dégradé seul, sans sa position ni sa taille */
  const k = couche.indexOf("("); let d = 0;
  for (let i = k; i < couche.length; i++) { if (couche[i] === "(") d++; if (couche[i] === ")" && --d === 0) return couche.slice(0, i + 1); }
  throw new Error("dégradé mal fermé");
};
/* Le fond du bouton est le fond du grand cadre RÉDUIT : toute longueur en px devient une part de la largeur du bouton (cqw ; le cadre PC fait ~320 px de large), les images (data:) restent telles quelles. */
const LARGEUR_CADRE = 320;
const cq = (n) => (Number(n) * 100 / LARGEUR_CADRE).toFixed(3).replace(/\.?0+$/, "") + "cqw";
const reduit = (couche) => couche.split(/(url\("[^"]*"\))/).map((s) => (s.startsWith("url(") ? s : s.replace(/(-?\d*\.?\d+)px/g, (_, n) => (Number(n) === 0 ? "0" : cq(n))))).join("");

/* Dessins originaux (secours : un second dessin DIFFÉRENT là où le grand cadre répète deux fois le même emblème), cohérents avec le thème du menu ; a = clair, b = ton moyen. */
const ORIG = {
  glove: (a, b) => `<path d="M12 22c0-8 6-14 15-14 8 0 13 5 13 12v10c0 6-4 10-10 10H20c-5 0-8-4-8-9z" fill="${a}"/><rect x="16" y="38" width="22" height="7" rx="2" fill="${b}"/><path d="M26 20c4 0 8 1 11 4" stroke="${b}" stroke-width="2" fill="none"/>`,
  joystick: (a, b) => `<circle cx="24" cy="12" r="7" fill="${a}"/><rect x="22" y="18" width="4" height="16" fill="${b}"/><rect x="8" y="32" width="32" height="10" rx="3" fill="${b}"/><circle cx="16" cy="37" r="2.5" fill="${a}"/><circle cx="32" cy="37" r="2.5" fill="${a}"/>`,
  coin: (a, b) => `<circle cx="24" cy="24" r="18" fill="${a}"/><circle cx="24" cy="24" r="13" fill="none" stroke="${b}" stroke-width="3"/><path d="M24 15l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="${b}"/>`,
  flame: (a, b) => `<path d="M24 4c3 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 6-12 0 4 2 6 4 6 0-6-1-12 2-18z" fill="${a}"/><path d="M24 24c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 3-5 6-11z" fill="${b}"/>`,
  shovel: (a, b) => `<path d="M22 4h4v22h-4z" fill="${b}"/><rect x="18" y="2" width="12" height="5" rx="2" fill="${a}"/><path d="M14 26h20l-4 18H18z" fill="${a}"/><path d="M24 28v14" stroke="${b}" stroke-width="2"/>`,
  drop: (a, b) => `<path d="M24 4C18 14 10 22 10 31a14 14 0 0 0 28 0C38 22 30 14 24 4z" fill="${a}"/><path d="M17 32a7 7 0 0 0 7 7" stroke="${b}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  tower: (a, b) => `<rect x="14" y="14" width="20" height="30" fill="${a}"/><path d="M12 14V6h5v4h4V6h6v4h4V6h5v8z" fill="${b}"/><rect x="21" y="32" width="6" height="12" rx="3" fill="${b}"/><rect x="20" y="20" width="3" height="6" fill="${b}"/><rect x="26" y="20" width="3" height="6" fill="${b}"/>`,
  gem: (a, b) => `<path d="M12 8h24l8 12-20 24L4 20z" fill="${a}"/><path d="M4 20h40M16 8l-4 12 12 24M32 8l4 12-12 24" stroke="${b}" stroke-width="2" fill="none"/>`,
  flag: (a, b) => `<rect x="10" y="4" width="4" height="40" fill="${b}"/><path d="M14 6h26v22H14z" fill="${a}"/>` + [[14, 6], [27, 6], [20.5, 11.5], [33.5, 11.5], [14, 17], [27, 17], [20.5, 22.5], [33.5, 22.5]].map(([x, y]) => `<rect x="${x}" y="${y}" width="6.5" height="5.5" fill="${b}"/>`).join(""),
  skull: (a, b) => `<path d="M10 20c0-10 6-16 14-16s14 6 14 16c0 5-2 8-5 10v8H15v-8c-3-2-5-5-5-10z" fill="${a}"/><circle cx="18" cy="22" r="4" fill="${b}"/><circle cx="30" cy="22" r="4" fill="${b}"/><path d="M22 30l2-3 2 3z" fill="${b}"/><path d="M8 18C2 14 2 6 6 2c0 6 4 9 8 10zM40 18c6-4 6-12 2-16 0 6-4 9-8 10z" fill="${b}"/>`,
  leaf: (a, b) => `<path d="M8 40C8 18 22 6 42 6c0 22-12 34-34 34z" fill="${a}"/><path d="M10 38C20 26 28 18 38 10" stroke="${b}" stroke-width="2.5" fill="none"/>`,
  apple: (a, b) => `<path d="M24 14c-6-5-16-2-16 10 0 10 7 20 12 20 2 0 3-1 4-1s2 1 4 1c5 0 12-10 12-20 0-12-10-15-16-10z" fill="${a}"/><path d="M24 14c0-5 2-8 6-10" stroke="${b}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M30 6c4-2 8 0 8 0-1 4-5 5-8 3z" fill="${b}"/>`,
  comb: (a, b) => `<rect x="4" y="10" width="40" height="9" rx="3" fill="${a}"/>` + [7, 13, 19, 25, 31, 37].map((x) => `<rect x="${x}" y="19" width="3" height="18" fill="${b}"/>`).join(""),
  scissors: (a, b) => `<circle cx="14" cy="38" r="6" fill="none" stroke="${a}" stroke-width="3"/><circle cx="34" cy="38" r="6" fill="none" stroke="${a}" stroke-width="3"/><path d="M17 33L36 4M31 33L12 4" stroke="${b}" stroke-width="4" stroke-linecap="round"/>`,
  puzzle: (a, b) => `<path d="M8 14h10a5 5 0 1 1 10 0h12v10a5 5 0 1 0 0 10v10H28a5 5 0 1 0-10 0H8V34a5 5 0 1 1 0-10z" fill="${a}" stroke="${b}" stroke-width="2"/>`,
  book: (a, b) => `<path d="M4 10c8-3 14-2 20 2v30c-6-4-12-5-20-2z" fill="${a}"/><path d="M44 10c-8-3-14-2-20 2v30c6-4 12-5 20-2z" fill="${b}"/>`,
  chip: (a, b) => `<circle cx="24" cy="24" r="20" fill="${a}"/><circle cx="24" cy="24" r="13" fill="none" stroke="${b}" stroke-width="3" stroke-dasharray="6 5"/><circle cx="24" cy="24" r="6" fill="${b}"/>`,
  chef: (a, b) => `<path d="M12 28c-6-2-8-12-1-15 1-6 9-9 13-4 4-5 12-2 13 4 7 3 5 13-1 15z" fill="${a}"/><rect x="12" y="28" width="24" height="14" rx="2" fill="${b}"/>`,
  mug: (a, b) => `<rect x="8" y="12" width="26" height="30" rx="4" fill="${a}"/><path d="M34 18h4a5 5 0 0 1 0 14h-4" stroke="${a}" stroke-width="4" fill="none"/><path d="M8 12c0-6 6-8 10-6 4-3 10-1 10 4 4 0 6 2 6 2H8z" fill="${b}"/>`,
};
/* Renaissance (Norman, 2026-10-30) : un tourbillon (spirale) à gauche, un signe infini à droite, deux dessins SVG originaux (jamais un caractère de police). */
const spirale = (() => { let p = "M24 24"; for (let i = 1; i <= 90; i++) { const th = i * 0.21, r = 1.2 + th * 1.05; p += "L" + (24 + r * Math.cos(th)).toFixed(2) + " " + (24 + r * Math.sin(th)).toFixed(2); } return p; })();
ORIG.tourbillon = (a, b) => `<g id="tourbillon"><path d="${spirale}" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="${spirale}" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
ORIG.infini = (a, b) => `<g id="infini"><path d="M24 24C30 12 44 14 44 24S30 36 24 24C18 12 4 14 4 24S18 36 24 24z" fill="none" stroke="${b}" stroke-width="6" stroke-linejoin="round"/><path d="M24 24C30 12 44 14 44 24S30 36 24 24C18 12 4 14 4 24S18 36 24 24z" fill="none" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
/* Couleurs NATURELLES des dessins originaux (Norman : en couleur, jamais une teinte unique) : [couleur 1, couleur 2] */
const PAL = { glove: ["#e63946", "#8d1b26"], joystick: ["#e63946", "#6b7280"], coin: ["#ffd24a", "#b8860b"], flame: ["#ff7a1a", "#ffd23b"], shovel: ["#c9ccd1", "#8b5a2b"], drop: ["#d81e3c", "#ff8a9a"],
  tower: ["#c9b79c", "#7a6a55"], gem: ["#4fd1ff", "#e8fbff"], flag: ["#ffffff", "#222222"], skull: ["#e8e2d0", "#7a3b3b"], comb: ["#e9c46a", "#8d5a2b"], scissors: ["#f4a261", "#d0d4da"],
  puzzle: ["#9b5de5", "#e0c8ff"], book: ["#c0392b", "#e8c58a"], chip: ["#e63946", "#ffffff"], chef: ["#ffffff", "#aeb4bd"], mug: ["#e9a23b", "#fff4d6"], tourbillon: ["#7fe3ff", "#2b6cff"], infini: ["#ffe27a", "#ff8a1a"] };
/* Barbes : peigne NOIR (reflet gris), ciseaux en acier (reflets) aux anneaux ROUGES ; MacGuffins : pièce de puzzle VERT BOUTEILLE (dégradé, reflet, bord plus foncé) */
ORIG.comb = () => '<g id="peigne"><rect x="4" y="9" width="40" height="10" rx="3" fill="#15151a"/><rect x="6" y="10.5" width="36" height="2.2" rx="1" fill="#5b5f6b"/>' + [7, 12.5, 18, 23.5, 29, 34.5, 40].map((x) => `<rect x="${x - 1}" y="19" width="2.6" height="19" rx="1.2" fill="#15151a"/>`).join("") + '</g>';
ORIG.scissors = () => '<g id="ciseaux"><defs><linearGradient id="ac" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset=".5" stop-color="#9aa3af"/><stop offset="1" stop-color="#5b6470"/></linearGradient></defs><path d="M17 31L36 3l3 2L22 35zM31 31L12 3 9 5l17 30z" fill="url(#ac)" stroke="#3d4450" stroke-width="1"/><circle cx="14" cy="38" r="6" fill="none" stroke="#d62839" stroke-width="3.4"/><circle cx="34" cy="38" r="6" fill="none" stroke="#d62839" stroke-width="3.4"/><circle cx="24" cy="31" r="2" fill="#e8edf3" stroke="#3d4450"/></g>';
ORIG.puzzle = () => '<g id="puzzle"><defs><linearGradient id="vb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f9e78"/><stop offset=".55" stop-color="#0b6e4f"/><stop offset="1" stop-color="#004634"/></linearGradient></defs><path d="M8 14h10a5 5 0 1 1 10 0h12v10a5 5 0 1 0 0 10v10H28a5 5 0 1 0-10 0H8V34a5 5 0 1 1 0-10z" fill="url(#vb)" stroke="#003a2b" stroke-width="2"/><path d="M11 17h6M11 20v4" stroke="#7fe0bf" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>';
/* Yggdrasil : l'arbre (tronc brun, feuillage vert) à gauche, la pomme dorée (avec son reflet) à droite */
ORIG.arbre = () => '<g id="arbre"><path d="M20 44c1-8 1-14-1-20h10c-2 6-2 12-1 20z" fill="#7a4a21"/><path d="M22 44c.5-8 .5-14-1-20h2c-1 6-1 12-.5 20z" fill="#5a3412"/><circle cx="24" cy="14" r="10" fill="#2f9e44"/><circle cx="13" cy="21" r="8" fill="#3fae4a"/><circle cx="35" cy="21" r="8" fill="#37a24a"/><circle cx="24" cy="23" r="9" fill="#4cc15a"/><circle cx="20" cy="11" r="3" fill="#8be28f" opacity=".7"/></g>';
ORIG.pommeor = () => '<g id="pommeor"><path d="M24 15c-6-5-17-2-17 10 0 10 7 20 13 20 2 0 3-1 4-1s2 1 4 1c6 0 13-10 13-20 0-12-11-15-17-10z" fill="#f2b705"/><path d="M24 15c-6-5-17-2-17 10 0 6 2 11 5 15 1-12 6-21 12-25z" fill="#ffd84d"/><ellipse cx="15" cy="23" rx="3" ry="6" fill="#fff6c9" opacity=".85" transform="rotate(-20 15 23)"/><path d="M24 15c0-5 2-8 6-10" stroke="#6b3e12" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M30 7c4-2 9 0 9 0-1 4-6 5-9 3z" fill="#3fae4a"/></g>';
const svg64 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="64" height="48">${inner}</svg>`;
/* Gant de boxe (Entraînement) : rouge, poignet blanc à lacet, reflet ; tourné vers la gauche (il frappe de droite à gauche). Même dessin pour le bouton et le grand cadre. */
ORIG.gant = () => '<g id="gant"><path d="M44 10C44 6 38 4 30 4 15 4 5 11 5 24s9 20 24 20h15z" fill="#d62828"/><path d="M44 10C44 6 38 4 30 4 15 4 5 11 5 24c0 4 1 8 3 11 3-14 14-24 36-25z" fill="#ef4b4b"/><path d="M9 22c4-8 12-12 20-12" stroke="#ffb3b3" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/><path d="M10 30c5 5 14 7 24 5" stroke="#8d1b1b" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="44" y="10" width="15" height="34" rx="3" fill="#f6f6f6" stroke="#b8bcc4" stroke-width="1.2"/><path d="M47 18h9M47 24h9M47 30h9" stroke="#c9ccd3" stroke-width="2" stroke-linecap="round"/></g>';
const BOCAL = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M8 3h8v2.2c0 .5-.3.9-.7 1.2C14.2 7 14 7.6 14 8.2V9c1.9.8 3 2.5 3 4.6V18a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4.4C7 11.5 8.100 9.800 10 9v-.8c0-.6-.2-1.200-1.300-1.800C8.300 6.100 8 5.700 8 5.200z" fill="#bfeaff" fill-opacity=".45" stroke="#7fc8e8" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.300 14.500c1.500-1 3-1 4.700 0s3.200 1 4.700 0" fill="none" stroke="#3fd17a" stroke-width="1.9" stroke-linecap="round"/></svg>`;
const encode = (s) => `url("data:image/svg+xml,${encodeURIComponent(s).replace(/\(/g, "%28").replace(/\)/g, "%29")}")`;
const svg48 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">${inner}</svg>`;

/* Les deux dessins de chaque menu : g (gauche) et d (droite) = n° de couche du grand cadre, « o:nom » = dessin original de secours, « s:nom » = dessin composé. `drop` = couches retirées du fond (elles sont dessinées par les deux éléments).
   m = mouvement quand le menu travaille, t = durée d'une boucle (s). Jamais deux dessins identiques ni de la même famille (test). */
const SPEC = {
  entrainement: { g: 1, d: "o:gant", drop: [1, 2], m: "sway", t: 1.6 }, combat: { g: "o:coin", d: "o:joystick", drop: [], m: "twinkle", t: 1.8 },
  aventure: { g: 1, d: 2, drop: [1, 2], m: "bob", t: 2.6 }, renaissance: { g: "o:tourbillon", d: "o:infini", drop: [1, 2], m: "spin", t: 6, md: "pulse", td: 2.4 },
  moneyPit: { g: 2, d: "o:shovel", drop: [2, 6], m: "pulse", t: 2.2 }, augmentations: { g: 1, d: 2, drop: [1, 2], m: "pulse", t: 2 },
  avance: { g: 4, d: 5, drop: [4, 5], m: "bob", t: 2.2 }, machine: { g: 1, d: 2, drop: [1, 2], m: "spin", t: 9 },
  sang: { g: 3, d: "o:drop", drop: [3, 4], m: "bob", t: 2.4 }, tower: { g: 1, d: "o:tower", drop: [1, 2], m: "bob", t: 2.8, tour: true },
  daycare: { g: "s:bocal", d: "o:gem", drop: [], m: "bob", t: 3 }, challenges: { g: 1, d: "o:flag", drop: [1, 2], m: "sway", t: 1.4 },
  titans: { g: 1, d: "o:skull", drop: [1, 2], m: "pulse", t: 2.6 }, ngu: { g: 0, d: 1, drop: [0, 1], m: "pulse", t: 3.2 },
  wandoos: { g: "s:logo", d: "s:boutons", drop: [2, 3, 4, 5, 6, 7, 8], m: "twinkle", t: 1.6 }, yggdrasil: { g: "o:arbre", d: "o:pommeor", drop: [], m: "sway", t: 3.6 },
  diggers: { g: 1, d: 5, drop: [1, 2, 5, 6], m: "sway", t: 1.5 }, beards: { g: "o:comb", d: "o:scissors", drop: [], m: "sway", t: 3 },
  macguffins: { g: 2, d: "o:puzzle", drop: [2, 3], m: "pulse", t: 2.4 }, hacks: { g: 1, d: 2, drop: [1, 2], m: "twinkle", t: 1.4 },
  questing: { g: 1, d: 2, drop: [1, 2], m: "sway", t: 3 }, quirks: { g: 1, d: "o:book", drop: [1, 2], m: "bob", t: 2.2 },
  wishes: { g: 1, d: 2, drop: [1, 2], m: "twinkle", t: 2.8 }, cards: { g: 0, d: "o:chip", drop: [0, 1], m: "sway", t: 2.6 },
  cooking: { g: 5, d: "o:chef", drop: [5, 6], m: "bob", t: 2 }, shop: { g: 1, d: 2, drop: [1, 2], m: "twinkle", t: 2.4 },
  chroniques: { g: 0, d: 1, drop: [0, 1], m: "sway", t: 3.2 }, chat: { g: 0, d: "o:mug", drop: [0, 1], m: "bob", t: 2 },
  parametres: { g: 4, d: 6, drop: [4, 6], m: "spin", t: 10 }, admin: { g: 4, d: 5, drop: [4, 5], m: "twinkle", t: 1.6 },
};
/* Un dessin = { bg: valeur de background de l'élément, asp: largeur / hauteur } */
function dessin(id, cote, t) {
  const sp = SPEC[id], v = sp[cote], L = CADRES[id], a = t.lighter, b = t.light;
  if (typeof v === "number") {
    const c = L[v];
    if (c.startsWith("url(")) {
      const u = urlDe(c), m = decodeURIComponent(u).match(/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/);
      return { bg: sp.tour ? `${u} 0 0/100% 33.3333% repeat-y` : `${u} center/contain no-repeat`, asp: m ? Number(m[1]) / Number(m[2]) : 1 };
    }
    return { bg: degrade(c) + " no-repeat", asp: 1 }; /* gradient du cadre (pièce d'or...) */
  }
  const [genre, nom] = v.split(":");
  if (genre === "o" && nom === "gant") return { bg: encode(svg64(ORIG.gant())) + " center/contain no-repeat", asp: 64 / 48 };
  if (genre === "o") return { bg: encode(svg48(ORIG[nom](...(PAL[nom] || [a, b])))) + " center/contain no-repeat", asp: 1 };
  if (nom === "bocal") return { bg: encode(BOCAL("#a8f0cc")) + " center/contain no-repeat", asp: 1 };
  if (nom === "logo") return { bg: "linear-gradient(#ff3b3b,#ff3b3b) 8% 8%/38% 38% no-repeat,linear-gradient(#5bd13a,#5bd13a) 54% 8%/38% 38% no-repeat,linear-gradient(#3b7bff,#3b7bff) 8% 54%/38% 38% no-repeat,linear-gradient(#ffd23b,#ffd23b) 54% 54%/38% 38% no-repeat", asp: 1 };
  if (nom === "boutons") return { bg: "linear-gradient(#d4d0c8,#d4d0c8) 0 36%/28% 28% no-repeat,linear-gradient(#d4d0c8,#d4d0c8) 36% 36%/28% 28% no-repeat,linear-gradient(#d4d0c8,#d4d0c8) 72% 36%/28% 28% no-repeat", asp: 1.2 };
  throw new Error("dessin inconnu " + v);
}

const MENUS = Object.keys(T);
for (const id of Object.keys(DOM)) if (!SPEC[id]) throw new Error("menu sans dessins : " + id);
for (const id of MENUS) if (!SPEC[id] || (!CADRES[id] && id !== "daycare")) throw new Error("cadre introuvable : " + id);

const out = [];
const sel = (id, part = "") => `${P}[data-menu-id-v1="${id}"] .soreal-idle-nav-deco-v1${part}`;
const MOUVEMENTS = {
  sway: "0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}",
  bob: "0%,100%{transform:translateY(2px)}50%{transform:translateY(-3px)}",
  pulse: "0%,100%{transform:scale(.9)}50%{transform:scale(1.14)}",
  twinkle: "0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.08)}",
  spin: "from{transform:rotate(0)}to{transform:rotate(360deg)}",
};
const echelle = (v, k) => v.replace(/(-?\d*\.?\d+)px/g, (_, n) => (Math.round(Number(n) * k * 100) / 100) + "px");

out.push(`/* Boutons de la barre de sélection des menus (Norman, 2026-10-30) : chaque petit bouton est le GRAND CADRE DE TITRE de son menu, réduit (même fond, mêmes illustrations, même liseré, même couleur de nom ; fichier généré par tools/gen-menus-boutons-v1.mjs depuis les feuilles des cadres).
   Toute longueur du fond est en cqw (part de la largeur du bouton) : la composition garde sa forme quelle que soit la taille du bouton. Deux dessins DIFFÉRENTS par bouton (jamais le même emblème deux fois).
   Menu OUVERT (.active) = il brille ; menu fermé = sombre ; menu qui TRAVAILLE (.travail-v1, posée par la barre) = les deux dessins s'animent, ouvert ou non, mais jamais du seul fait d'être ouvert.
   Fichier généré : ne pas l'éditer à la main. Gardes : aucun mot-clé de priorité forcée, boucles parfaites (départ = arrivée, rotation complète), coupées en mouvement réduit, aucun texte (règle n°2), décor fourni par le HTML du bouton (règle n°4). */
${P}{position:relative;isolation:isolate}
${P} .soreal-idle-nav-deco-v1{position:absolute;inset:0;z-index:-1;border-radius:inherit;overflow:hidden;pointer-events:none;container-type:size}
/* Assombrissement par couche (jamais un filtre sur le décor entier) : le fond (::before) et le liseré (::after) sont sombres sauf menu ouvert ; les deux dessins gardent TOUJOURS leurs couleurs pleines (Norman, 2026-10-31 : menus non sélectionnés aussi), et brillent en plus quand le menu est ouvert. */
${P} .soreal-idle-nav-deco-v1::before,${P} .soreal-idle-nav-deco-v1::after{filter:brightness(.5) saturate(.55);transition:filter .25s}
${P}.active .soreal-idle-nav-deco-v1::before,${P}.active .soreal-idle-nav-deco-v1::after{filter:brightness(1.2) saturate(1.2)}
${P} .soreal-idle-nav-deco-v1::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none}
${P} .soreal-idle-nav-deco-v1::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;padding:2px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
${P} .soreal-idle-nav-deco-v1 .nb-g,${P} .soreal-idle-nav-deco-v1 .nb-d{position:absolute;top:0;bottom:0;margin:auto 0;height:62cqh;max-width:30cqw;display:block;transform-origin:50% 50%}
${P} .soreal-idle-nav-deco-v1 .nb-g{left:3cqw}
${P} .soreal-idle-nav-deco-v1 .nb-d{right:3cqw}
${P}.active .soreal-idle-nav-deco-v1 .nb-g,${P}.active .soreal-idle-nav-deco-v1 .nb-d{filter:brightness(1.2) saturate(1.2) drop-shadow(0 0 4px rgba(255,255,255,.55)) drop-shadow(0 0 7px var(--nb-dom-v1,#fff))}
${P} .soreal-idle-nav-cadre-v2{display:none}
${P}{align-items:center;justify-content:center}
${P} .soreal-idle-nav-texte-v2{flex:1 1 auto;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 36px;margin-left:6px}
${P} .soreal-idle-nav-texte-v2 b{text-align:center;margin:0}
@media (max-width:700px){${P} .soreal-idle-nav-texte-v2{margin-left:2px}}`);
/* Le bouton garde son retrait d'origine (gauche 8 px, droite 14 px, imposé par la feuille des thèmes) : 6 px de marge à gauche du texte (2 px sur téléphone, où le retrait est 4 / 6 px) recentrent le nom (garde de mesure dans le test). */

for (const id of MENUS) {
  const t = T[id], sp = SPEC[id], L = CADRES[id] || [];
  const g = dessin(id, "g", t), d = dessin(id, "d", t);
  const fond = L.filter((_, i) => !sp.drop.includes(i)).map(reduit);
  const ring = LISERES[id] || `linear-gradient(90deg,${t.ring.join(",")}) border-box`;
  out.push(`\n/* ${id} */`);
  const base = fond.length ? fond.join(",") : `radial-gradient(ellipse 60% 140% at 50% 140%,rgba(${t.glow},.42),transparent 70%),linear-gradient(180deg,${t.bg[0]} 0%,${t.bg[1]} 55%,${t.bg[2]} 100%)`;
  out.push(`${sel(id)}{--nb-dom-v1:${t.dom};box-shadow:inset 0 0 12px rgba(0,0,0,.55),inset 0 0 14px rgba(${t.glow},.22)}`);
  out.push(`${sel(id, "::before")}{background:${base}}`);
  out.push(`${sel(id, "::after")}{background:${ring}}`);
  out.push(`${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1{box-shadow:inset 0 0 12px rgba(0,0,0,.4),inset 0 0 18px rgba(${t.glow},.5)}`);
  const taille = (x) => (sp.tour ? ";height:100cqh;width:46.7cqh;max-width:none;aspect-ratio:auto" : `;aspect-ratio:${x.asp.toFixed(3)}`);   /* ITOPOD : la grande tour (3 étages entiers, ni coupée ni rapetissée) sur toute la hauteur, comme son cadre */
  out.push(`${sel(id, " .nb-g")}{background:${g.bg}${taille(g)}}`);
  out.push(`${sel(id, " .nb-d")}{background:${d.bg}${taille(d)}}`);
  /* le nom du menu : couleur, halo et contour du titre du grand cadre, réduits (même famille de police : feuille itopod) */
  const ti = TITRES[id] || {};
  const regles = [`color:${ti.color || "#fff"}`];
  regles.push(`text-shadow:${ti["text-shadow"] ? echelle(ti["text-shadow"], 0.45) : "0 1px 0 rgba(0,0,0,.85)," + `0 0 6px rgba(${t.glow},.8)`}`);
  if (ti["-webkit-text-stroke"]) regles.push(`-webkit-text-stroke:${echelle(ti["-webkit-text-stroke"], 0.5)}`);
  if (ti["font-family"]) regles.push(`font-family:${ti["font-family"]}`);
  out.push(`${P}[data-menu-id-v1="${id}"] .soreal-idle-nav-texte-v2 b{${regles.join(";")}}`);
  const md = sp.md || sp.m, td = sp.td || sp.t, ease = sp.m === "spin" ? "linear" : "ease-in-out", easeD = md === "spin" ? "linear" : "ease-in-out";
  out.push(`${P}[data-menu-id-v1="${id}"].travail-v1 .soreal-idle-nav-deco-v1 .nb-g{animation:nbV1_${sp.m} ${sp.t}s ${ease} infinite}`);
  out.push(`${P}[data-menu-id-v1="${id}"].travail-v1 .soreal-idle-nav-deco-v1 .nb-d{animation:nbV1_${md} ${td}s ${easeD} infinite;animation-delay:-${(td / 2).toFixed(2)}s${md === "spin" ? ";animation-direction:reverse" : ""}}`);
}
out.push("\n" + Object.entries(MOUVEMENTS).map(([n, c]) => `@keyframes nbV1_${n}{${c}}`).join("\n"));
out.push(`\n@media (prefers-reduced-motion:reduce){\n  ${P} .soreal-idle-nav-deco-v1 .nb-g,${P} .soreal-idle-nav-deco-v1 .nb-d{animation:none}\n}\n`);
writeFileSync("cloudflare/public/soreal-idle-menus-boutons-v1.css", out.join("\n"));

/* ---- les grands cadres de titre : la MÊME composition que la miniature, à toute largeur ----
   Norman (2026-10-30) : « le petit menu comme visuel du grand ». Les dessins du cadre sont dimensionnés sur sa HAUTEUR (px, ou « auto N% »), jamais sur sa largeur : le dessin de gauche reste collé à gauche, celui de droite
   à droite, le ciel en dégradé sur toute la largeur. Un ancien réglage de itopod.css (NGU : cercles en pourcentage de la largeur) étirait le soleil et la lune en gros disques flous sur un écran large : cette feuille,
   chargée avant itopod.css, remet pour chaque menu le fond de sa miniature (celui de sa feuille de cadre) avec une spécificité plus forte, sans !important. Combat (marquise d'arcade, déjà juste à toutes les largeurs),
   Sang (cadre de rituel propre) et Garderie (pas de grand cadre) ne sont pas touchés. Fichier généré : ne pas l'éditer à la main. */
const HEAD = "html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28";
const gros = [];
/* Entraînement, version PC (Norman, 2026-10-30) : à GAUCHE l'haltère, collée au bord et coupée par lui (≈ 40 % de sa largeur dépasse), dont la barre MONTE ET DESCEND comme un développé (cycle de 2,4 s) ; à DROITE un GANT DE BOXE
   (même dessin que le petit bouton) collé au bord droit, légèrement coupé, qui FRAPPE de droite à gauche (un coup rapide, retour plus lent, pause ; un coup toutes les 1,8 s). Une seule animation de background-position
   de 7,2 s (3 cycles d'haltère = 4 coups de gant, boucle parfaite : 0 % = 100 %), échantillonnée toutes les 0,1 s ; seules ces deux couches bougent (mêmes tailles de tuile pour toutes), sur le ::before existant : rien n'est ajouté
   au DOM. Largeur de l'haltère = 1,384 × la hauteur du cadre (156 × 70 à 62 % de la hauteur), celle du gant = 0,827 × la hauteur (64 × 48) ; hauteur du cadre = celle des 4 barres. Téléphone inchangé. */
function haltere(r) {
  const L = CADRES.entrainement.slice();
  const position = (c) => { const k = c.startsWith("url(") ? c.indexOf('")') + 2 : degrade(c).length; const tail = (c.slice(k).split("/")[0] || "").trim().replace(/\s*(no-repeat|repeat-x|repeat-y|repeat)$/, ""); return tail || "0% 0%"; };
  const H = "var(--ent-h)", REPOS = "46%", COUPE_G = -0.55, COUPE_D = 0.125, COURSE = 0.5;
  L[1] = urlDe(L[1]) + ` calc(${H} * ${COUPE_G}) ${REPOS}/auto 62% no-repeat`;
  L[2] = encode(svg64(ORIG.gant())) + ` calc(100% + ${H} * ${COUPE_D}) 50%/auto 62% no-repeat`;
  const lisse = (x) => x * x * (3 - 2 * x);
  const coup = (p) => (p < 0.2 ? Math.sqrt(p / 0.2) : p < 0.3 ? 1 : p < 0.8 ? 1 - lisse((p - 0.3) / 0.5) : 0); /* 0 = repos, 1 = coup à fond */
  const pos = (dy, s) => L.map((c, i) => (i === 1 ? `calc(${H} * ${COUPE_G}) calc(${REPOS} + ${dy.toFixed(2)}px)` : i === 2 ? `calc(100% + ${H} * ${(COUPE_D - COURSE * s).toFixed(4)}) 50%` : position(c))).join(",");
  const T = 7.2, N = 72, cadres = [];
  for (let k = 0; k <= N; k++) {
    const tt = k * T / N;
    cadres.push(`${(k * 100 / N).toFixed(3).replace(/\.?0+$/, "")}%{background-position:${pos(7 * Math.cos(2 * Math.PI * tt / 2.4), coup((tt % 1.8) / 1.8 * 1.8))}}`);
  }
  const reglePc = r(L).replace("{background:", "{--ent-h:calc(var(--hud-4barres-v1,131px) - var(--vide-haut-v1,14px));animation:nbEntHalteres 7.2s linear infinite;background:");
  return [
    `@media (min-width:561px){${reglePc}}`,
    `@media (max-width:560px){${r(CADRES2.entrainement || CADRES.entrainement)}}`,
    `@keyframes nbEntHalteres{${cadres.join("")}}`,
    `@media (prefers-reduced-motion:reduce){${HEAD}[data-menu="entrainement"] .soreal-idle-page-head-v28[data-entete-menu][data-entete-menu]::before{animation:none}}`,
  ];
}
const COUVERTS = [];
for (const id of MENUS) {
  if (["combat", "sang", "daycare"].includes(id) || !CADRES[id]) continue;
  COUVERTS.push(id);
  const r = (L) => `${HEAD}[data-menu="${id}"] .soreal-idle-page-head-v28[data-entete-menu][data-entete-menu]::before{background:${L.join(",")}}`;
  if (id === "entrainement") { gros.push(...haltere(r)); continue; }
  gros.push(`@media (min-width:561px){${r(CADRES[id])}}`, `@media (max-width:560px){${r(CADRES2[id] || CADRES[id])}}`);
}
writeFileSync("cloudflare/public/soreal-idle-entetes-miniature-v1.css", `/* Cadres de titre à toute largeur (voir tools/gen-menus-boutons-v1.mjs) : même fond que la miniature du bouton, dimensionné sur la hauteur. Menus : ${COUVERTS.join(", ")}. */\n` + gros.join("\n") + "\n");
console.log("ok", MENUS.length, "menus");
