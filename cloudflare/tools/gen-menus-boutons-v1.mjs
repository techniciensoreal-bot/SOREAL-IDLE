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

/* ---- extraction des dessins des grands cadres ---- */
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
const CADRES = {};
for (const f of SOURCES) {
  const t = readFileSync(`cloudflare/public/soreal-idle-${f}.css`, "utf8");
  const re = /\[data-menu="([A-Za-z]+)"\] (?:\.soreal-idle-page-head-v28|\.bm-entete)\[data-entete-menu\]::before\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(t))) {
    const i = m[2].indexOf("background:");
    if (i < 0 || CADRES[m[1]]) continue; /* la première règle est la version PC */
    CADRES[m[1]] = coupe(m[2].slice(i + 11));
  }
}
const urlDe = (couche) => { const x = couche.match(/^url\("[^"]*"\)/); if (!x) throw new Error("couche sans dessin : " + couche.slice(0, 60)); return x[0]; };
const degrade = (couche) => { /* le dégradé seul, sans sa position ni sa taille */
  const k = couche.indexOf("("); let d = 0;
  for (let i = k; i < couche.length; i++) { if (couche[i] === "(") d++; if (couche[i] === ")" && --d === 0) return couche.slice(0, i + 1); }
  throw new Error("dégradé mal fermé");
};

/* Les deux dessins de chaque menu : indices des couches du grand cadre (feuilles entetes-*, itopod). `m` = mouvement du dessin quand le menu travaille, `t` = durée d'une boucle (s). */
const SPEC = {
  entrainement: { c: [1, 2], m: "sway", t: 1.6 }, combat: { c: [0, 0], m: "twinkle", t: 1.8, special: "ampoules" },
  aventure: { c: [1, 2], m: "bob", t: 2.6 }, renaissance: { c: [1, 2], m: "spin", t: 7 },
  moneyPit: { c: [2, 6], m: "pulse", t: 2.2, special: "pieces" }, augmentations: { c: [1, 2], m: "pulse", t: 2 },
  avance: { c: [4, 5], m: "bob", t: 2.2 }, machine: { c: [1, 2], m: "spin", t: 9 },
  sang: { c: [3, 4], m: "bob", t: 2.4 }, tower: { c: [1, 2], m: "bob", t: 2.8 },
  daycare: { c: [0, 0], m: "bob", t: 3, special: "bocal" }, challenges: { c: [1, 2], m: "sway", t: 1.4 },
  titans: { c: [1, 2], m: "pulse", t: 2.6 }, ngu: { c: [0, 1], m: "pulse", t: 3.2 },
  wandoos: { c: [0, 0], m: "twinkle", t: 1.6, special: "fenetre" }, yggdrasil: { c: [8, 9], m: "sway", t: 3.6, special: "ecorce" },
  diggers: { c: [1, 2], m: "sway", t: 1.5 }, beards: { c: [4, 4], m: "sway", t: 3 },
  macguffins: { c: [2, 3], m: "pulse", t: 2.4 }, hacks: { c: [1, 2], m: "twinkle", t: 1.4 },
  questing: { c: [1, 2], m: "sway", t: 3 }, quirks: { c: [1, 2], m: "bob", t: 2.2 },
  wishes: { c: [1, 2], m: "twinkle", t: 2.8 }, cards: { c: [0, 1], m: "sway", t: 2.6 },
  cooking: { c: [5, 6], m: "bob", t: 2 }, shop: { c: [1, 2], m: "twinkle", t: 2.4 },
  chroniques: { c: [0, 1], m: "sway", t: 3.2 }, chat: { c: [0, 1], m: "bob", t: 2 },
  parametres: { c: [4, 6], m: "spin", t: 10 }, admin: { c: [4, 5], m: "twinkle", t: 1.6 },
};
const BOCAL = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M8 3h8v2.2c0 .5-.3.9-.7 1.2C14.2 7 14 7.6 14 8.2V9c1.9.8 3 2.5 3 4.6V18a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4.4C7 11.5 8.100 9.800 10 9v-.8c0-.6-.2-1.200-1.300-1.800C8.300 6.100 8 5.700 8 5.200z" fill="none" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.300 14.500c1.500-1 3-1 4.700 0s3.200 1 4.700 0" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const encode = (s) => `url("data:image/svg+xml,${encodeURIComponent(s).replace(/\(/g, "%28").replace(/\)/g, "%29")}")`;
/* dessin g (gauche) et d (droite) d'un menu : valeur de `background` */
function dessins(id) {
  const sp = SPEC[id], L = CADRES[id];
  if (sp.special === "pieces") return [degrade(L[2]), degrade(L[6])];                         /* les deux grosses pièces d'or du cadre */
  if (sp.special === "ampoules") return [degrade(L[0]), degrade(L[0])];                       /* les ampoules de la marquise */
  if (sp.special === "ecorce") return [degrade(L[8]), degrade(L[9])];                                                   /* les deux troncs du cadre */
  if (sp.special === "bocal") return [1,2].map(() => encode(BOCAL("#a8f0cc")) + " center/contain no-repeat");      /* pas de grand cadre : le bocal de la Garderie */
  if (sp.special === "fenetre") {                                                              /* le logo coloré et les trois boutons gris de la fenêtre du cadre */
    return [
      "linear-gradient(#ff3b3b,#ff3b3b) 4px 4px/13px 13px no-repeat,linear-gradient(#5bd13a,#5bd13a) 19px 4px/13px 13px no-repeat,linear-gradient(#3b7bff,#3b7bff) 4px 19px/13px 13px no-repeat,linear-gradient(#ffd23b,#ffd23b) 19px 19px/13px 13px no-repeat",
      "linear-gradient(#d4d0c8,#d4d0c8) 0 12px/9px 9px no-repeat,linear-gradient(#d4d0c8,#d4d0c8) 12px 12px/9px 9px no-repeat,linear-gradient(#d4d0c8,#d4d0c8) 24px 12px/9px 9px no-repeat",
    ];
  }
  return sp.c.map((i) => `${urlDe(L[i])} center/contain no-repeat`);
}

/* largeur du dessin : sa forme (viewBox) à la hauteur du bouton, bornée pour ne pas manger le nom du menu */
const largeur = (bg) => {
  const m = bg.match(/^url\("data:image\/svg\+xml,([^"]*)"\)/);
  if (!m) return 34;
  const v = decodeURIComponent(m[1]).match(/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/);
  return v ? Math.round(Math.max(26, Math.min(40, 34 * Number(v[1]) / Number(v[2])))) : 34;
};
const MENUS = Object.keys(T);
for (const id of Object.keys(DOM)) if (!SPEC[id]) throw new Error("menu sans dessins : " + id);
for (const id of MENUS) if (!SPEC[id] || !CADRES[id] && !["daycare"].includes(id)) throw new Error("cadre introuvable : " + id);

const out = [];
const sel = (id, part = "") => `${P}[data-menu-id-v1="${id}"] .soreal-idle-nav-deco-v1${part}`;
const ringG = (r) => `linear-gradient(90deg,${r.join(",")})`;
const MOUVEMENTS = {
  sway: "0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}",
  bob: "0%,100%{transform:translateY(2px)}50%{transform:translateY(-3px)}",
  pulse: "0%,100%{transform:scale(.9)}50%{transform:scale(1.14)}",
  twinkle: "0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.08)}",
  spin: "from{transform:rotate(0)}to{transform:rotate(360deg)}",
};

out.push(`/* Boutons de la barre de sélection des menus (Norman, 2026-10-30) : chaque petit bouton montre les DEUX GRANDS DESSINS du cadre de titre de son menu (mêmes images, extraites des feuilles des cadres par tools/gen-menus-boutons-v1.mjs).
   Menu OUVERT (.active) = il brille ; menu fermé = sombre ; menu qui TRAVAILLE (.travail-v1, posée par la barre) = les deux dessins s'animent, ouvert ou non, mais jamais du seul fait d'être ouvert.
   Fichier généré : ne pas l'éditer à la main. Gardes : aucun mot-clé de priorité forcée, boucles parfaites (départ = arrivée, rotation complète), coupées en mouvement réduit, aucun texte (règle n°2), décor fourni par le HTML du bouton (règle n°4). */
${P}{position:relative;isolation:isolate}
${P} .soreal-idle-nav-deco-v1{position:absolute;inset:0;z-index:-1;border-radius:inherit;overflow:hidden;pointer-events:none;filter:brightness(.5) saturate(.55);transition:filter .25s}
${P}.active .soreal-idle-nav-deco-v1{filter:brightness(1.2) saturate(1.2)}
${P} .soreal-idle-nav-deco-v1::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 0 34%,rgba(255,255,255,.09) 34% 48%,transparent 48% 60%)}
${P} .soreal-idle-nav-deco-v1::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;padding:2px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
${P} .soreal-idle-nav-deco-v1 .nb-g,${P} .soreal-idle-nav-deco-v1 .nb-d{position:absolute;top:0;bottom:0;margin:auto 0;width:34px;height:34px;display:block;transform-origin:50% 50%}
${P} .soreal-idle-nav-deco-v1 .nb-g{left:5px}
${P} .soreal-idle-nav-deco-v1 .nb-d{right:5px}
${P}.active .soreal-idle-nav-deco-v1 .nb-g,${P}.active .soreal-idle-nav-deco-v1 .nb-d{filter:drop-shadow(0 0 4px rgba(255,255,255,.55)) drop-shadow(0 0 7px var(--nb-dom-v1,#fff))}
${P} .soreal-idle-nav-cadre-v2{visibility:hidden}
${P} .soreal-idle-nav-texte-v2{padding-right:38px}`);

for (const id of MENUS) {
  const t = T[id], sp = SPEC[id];
  const [g, d] = dessins(id);
  out.push(`\n/* ${id} */`);
  out.push(`${sel(id)}{--nb-dom-v1:${t.dom};background:radial-gradient(ellipse 60% 140% at 50% 140%,rgba(${t.glow},.42),transparent 70%) 0 0/auto no-repeat,linear-gradient(180deg,${t.bg[0]} 0%,${t.bg[1]} 55%,${t.bg[2]} 100%);box-shadow:inset 0 0 12px rgba(0,0,0,.55),inset 0 0 14px rgba(${t.glow},.22)}`);
  out.push(`${sel(id, "::after")}{background:${ringG(t.ring)} border-box}`);
  out.push(`${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1{box-shadow:inset 0 0 12px rgba(0,0,0,.4),inset 0 0 18px rgba(${t.glow},.5)}`);
  out.push(`${sel(id, " .nb-g")}{background:${g};width:${largeur(g)}px}`);
  out.push(`${sel(id, " .nb-d")}{background:${d};width:${largeur(d)}px${id === "beards" ? ";scale:-1 1" : ""}}`);
  out.push(`${P}[data-menu-id-v1="${id}"].travail-v1 .soreal-idle-nav-deco-v1 .nb-g{animation:nbV1_${sp.m} ${sp.t}s ${sp.m === "spin" ? "linear" : "ease-in-out"} infinite}`);
  out.push(`${P}[data-menu-id-v1="${id}"].travail-v1 .soreal-idle-nav-deco-v1 .nb-d{animation:nbV1_${sp.m} ${sp.t}s ${sp.m === "spin" ? "linear" : "ease-in-out"} infinite;animation-delay:-${(sp.t / 2).toFixed(2)}s${sp.m === "spin" ? ";animation-direction:reverse" : ""}}`);
}
out.push("\n" + Object.entries(MOUVEMENTS).map(([n, c]) => `@keyframes nbV1_${n}{${c}}`).join("\n"));
out.push(`\n@media (prefers-reduced-motion:reduce){\n  ${P} .soreal-idle-nav-deco-v1 .nb-g,${P} .soreal-idle-nav-deco-v1 .nb-d{animation:none}\n}\n`);
writeFileSync("cloudflare/public/soreal-idle-menus-boutons-v1.css", out.join("\n"));
console.log("ok", MENUS.length, "menus");
