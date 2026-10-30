/* Générateur de cloudflare/public/soreal-idle-menus-boutons-v1.css (boutons de la barre de sélection des menus) */
import { writeFileSync } from "node:fs";

const P = "html body.soreal-idle-active-v47 .soreal-idle-nav-v28 .soreal-idle-nav-button-v28";
const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s).replace(/\(/g, "%28").replace(/\)/g, "%29")}")`;
const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;
const g = (a, b, c) => `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

/* motifs 48x48 : dessins originaux, fond transparent, teintes du menu (c1 clair, c2 foncé) */
const M = {
  entrainement: (a, b) => `<rect x="3" y="21" width="42" height="6" rx="2" fill="${b}"/><rect x="6" y="11" width="8" height="26" rx="2" fill="${a}"/><rect x="34" y="11" width="8" height="26" rx="2" fill="${a}"/><rect x="1" y="16" width="5" height="16" rx="2" fill="${b}"/><rect x="42" y="16" width="5" height="16" rx="2" fill="${b}"/>`,
  combat: (a, b) => `<circle cx="24" cy="12" r="7" fill="${a}"/><rect x="22" y="18" width="4" height="16" fill="${b}"/><rect x="10" y="32" width="28" height="10" rx="3" fill="${b}"/><circle cx="17" cy="37" r="2.5" fill="${a}"/><circle cx="31" cy="37" r="2.5" fill="${a}"/>`,
  aventure: (a, b) => `<path d="M4 38 L18 14 L28 30 L34 22 L44 38 Z" fill="${b}"/><circle cx="36" cy="10" r="5" fill="${a}"/><path d="M4 38 L44 38" stroke="${a}" stroke-width="2"/><path d="M8 44 q8 -6 16 0 t16 0" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="2 3"/>`,
  renaissance: (a, b) => `<path d="M24 6 a18 18 0 1 1 -16 10" fill="none" stroke="${a}" stroke-width="5" stroke-linecap="round"/><path d="M2 12 L12 22 L16 8 Z" fill="${a}"/><circle cx="24" cy="24" r="5" fill="${b}"/>`,
  moneyPit: (a, b) => `<ellipse cx="24" cy="30" rx="20" ry="9" fill="${b}"/><ellipse cx="24" cy="28" rx="14" ry="5" fill="#000"/><circle cx="24" cy="12" r="8" fill="${a}" stroke="${b}" stroke-width="2"/><rect x="22.5" y="7" width="3" height="10" fill="${b}"/>`,
  augmentations: (a, b) => `<path d="M8 20 L24 6 L40 20" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/><path d="M8 34 L24 20 L40 34" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 46 L24 34 L40 46" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`,
  avance: (a, b) => `<path d="M18 4 H30 V18 L42 40 Q44 46 38 46 H10 Q4 46 6 40 L18 18 Z" fill="none" stroke="${a}" stroke-width="3" stroke-linejoin="round"/><path d="M12 34 H36 L42 40 Q44 46 38 46 H10 Q4 46 6 40 Z" fill="${b}" opacity=".85"/><circle cx="20" cy="38" r="2.5" fill="#fff"/><circle cx="28" cy="40" r="2" fill="#fff"/>`,
  machine: (a, b) => `<circle cx="24" cy="24" r="14" fill="${b}"/><g fill="${b}"><rect x="21" y="2" width="6" height="9"/><rect x="21" y="37" width="6" height="9"/><rect x="2" y="21" width="9" height="6"/><rect x="37" y="21" width="9" height="6"/><rect x="21" y="2" width="6" height="9" transform="rotate(45 24 24)"/><rect x="21" y="37" width="6" height="9" transform="rotate(45 24 24)"/><rect x="2" y="21" width="9" height="6" transform="rotate(45 24 24)"/><rect x="37" y="21" width="9" height="6" transform="rotate(45 24 24)"/></g><circle cx="24" cy="24" r="8" fill="#0b1c22"/><path d="M24 24 V17 M24 24 L29 27" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/>`,
  sang: (a, b) => `<path d="M24 3 C24 3 8 22 8 31 a16 16 0 0 0 32 0 C40 22 24 3 24 3 Z" fill="${b}"/><path d="M17 30 a8 8 0 0 0 7 9" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
  tower: (a, b) => `<path d="M18 46 V14 L24 4 L30 14 V46 Z" fill="${b}"/><rect x="21" y="18" width="6" height="5" fill="${a}"/><rect x="21" y="28" width="6" height="5" fill="${a}"/><rect x="21" y="38" width="6" height="5" fill="${a}"/><path d="M24 2 V-4" stroke="${a}"/><circle cx="38" cy="10" r="1.6" fill="${a}"/><circle cx="9" cy="16" r="1.3" fill="${a}"/><circle cx="40" cy="30" r="1.1" fill="${a}"/>`,
  daycare: (a, b) => `<rect x="12" y="4" width="24" height="6" rx="2" fill="${b}"/><path d="M13 10 H35 V38 Q35 44 29 44 H19 Q13 44 13 38 Z" fill="none" stroke="${a}" stroke-width="3"/><path d="M15 26 H33 V38 Q33 42 29 42 H19 Q15 42 15 38 Z" fill="${b}" opacity=".8"/>`,
  challenges: (a, b) => `<rect x="9" y="3" width="4" height="44" fill="${b}"/><path d="M13 5 H41 V27 H13 Z" fill="${a}"/><g fill="#14100c"><rect x="13" y="5" width="7" height="7"/><rect x="27" y="5" width="7" height="7"/><rect x="20" y="12" width="7" height="7"/><rect x="34" y="12" width="7" height="7"/><rect x="13" y="19" width="7" height="8"/><rect x="27" y="19" width="7" height="8"/></g>`,
  titans: (a, b) => `<path d="M6 8 Q12 26 18 22 L18 36 Q24 42 30 36 L30 22 Q36 26 42 8 Q34 12 30 16 H18 Q14 12 6 8 Z" fill="${b}"/><circle cx="19" cy="28" r="2.6" fill="${a}"/><circle cx="29" cy="28" r="2.6" fill="${a}"/>`,
  ngu: (a, b) => `<path d="M24 24 C30 10 44 10 44 24 C44 38 30 38 24 24 C18 10 4 10 4 24 C4 38 18 38 24 24 Z" fill="none" stroke="${a}" stroke-width="5" stroke-linejoin="round"/><circle cx="12" cy="24" r="2.5" fill="${b}"/><circle cx="36" cy="24" r="2.5" fill="${b}"/>`,
  wandoos: (a, b) => `<rect x="3" y="6" width="42" height="28" rx="3" fill="#06150c" stroke="${a}" stroke-width="3"/><path d="M10 14 L18 20 L10 26 M22 27 H34" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="18" y="36" width="12" height="4" fill="${b}"/><rect x="12" y="40" width="24" height="4" rx="1" fill="${b}"/>`,
  yggdrasil: (a, b) => `<path d="M22 46 V24 M26 46 V28" stroke="${b}" stroke-width="5"/><circle cx="24" cy="16" r="12" fill="${a}"/><circle cx="14" cy="22" r="8" fill="${b}"/><circle cx="34" cy="22" r="8" fill="${b}"/><path d="M24 46 q-8 -2 -14 -6 M24 46 q8 -2 14 -6" fill="none" stroke="${b}" stroke-width="3"/>`,
  diggers: (a, b) => `<path d="M8 12 Q24 0 40 12" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round"/><rect x="21.5" y="8" width="5" height="38" rx="2" fill="${b}"/><path d="M36 20 L44 14 L42 24 Z" fill="${a}"/>`,
  beards: (a, b) => `<path d="M6 12 Q6 40 24 46 Q42 40 42 12 Q34 20 24 20 Q14 20 6 12 Z" fill="${b}"/><path d="M16 30 Q24 36 32 30" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round"/><path d="M12 24 q-2 8 2 12 M36 24 q2 8 -2 12" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`,
  macguffins: (a, b) => `<path d="M6 16 H18 a5 5 0 1 1 10 0 H40 V28 a5 5 0 1 0 0 10 V44 H6 Z" fill="${b}"/><path d="M6 16 H18 a5 5 0 1 1 10 0 H40" fill="none" stroke="${a}" stroke-width="2.4"/>`,
  hacks: (a, b) => `<path d="M18 4 H30 V16 L42 38 Q44 46 36 46 H12 Q4 46 6 38 L18 16 Z" fill="none" stroke="${a}" stroke-width="3" stroke-linejoin="round"/><path d="M12 34 H36 L42 38 Q44 46 36 46 H12 Q4 46 6 38 Z" fill="${b}"/><circle cx="21" cy="38" r="2.4" fill="#d6ffe3"/><circle cx="29" cy="40" r="1.8" fill="#d6ffe3"/>`,
  questing: (a, b) => `<rect x="9" y="5" width="30" height="38" rx="3" fill="${a}" opacity=".9"/><path d="M15 15 H33 M15 22 H33 M15 29 H27" stroke="${b}" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="38" r="6" fill="#b3261e" stroke="${b}" stroke-width="1.5"/>`,
  quirks: (a, b) => `<path d="M6 8 Q15 4 24 10 Q33 4 42 8 V40 Q33 36 24 42 Q15 36 6 40 Z" fill="${b}"/><path d="M24 10 V42" stroke="${a}" stroke-width="2"/><path d="M12 16 Q17 14 20 17 M12 23 Q17 21 20 24 M28 17 Q31 14 36 16 M28 24 Q31 21 36 23" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`,
  wishes: (a, b) => `<path d="M24 2 L29.5 17 L45 18 L33 28 L37 44 L24 35 L11 44 L15 28 L3 18 L18.5 17 Z" fill="${a}" stroke="${b}" stroke-width="2" stroke-linejoin="round"/>`,
  cards: (a, b) => `<rect x="9" y="3" width="30" height="42" rx="4" fill="#f6f1e2" stroke="${b}" stroke-width="2"/><path d="M24 12 C24 12 14 22 14 28 a5 5 0 0 0 9 3 L22 38 H26 L25 31 a5 5 0 0 0 9 -3 C34 22 24 12 24 12 Z" fill="${a}"/>`,
  cooking: (a, b) => `<path d="M6 20 H42 V30 Q42 42 30 42 H18 Q6 42 6 30 Z" fill="${b}"/><rect x="2" y="17" width="44" height="5" rx="2.5" fill="${a}"/><path d="M42 24 H46 M6 24 H2" stroke="${a}" stroke-width="3" stroke-linecap="round"/><path d="M16 12 q-3 -4 0 -8 M24 12 q-3 -4 0 -8 M32 12 q-3 -4 0 -8" fill="none" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/>`,
  shop: (a, b) => `<circle cx="24" cy="21" r="15" fill="${b}"/><circle cx="24" cy="21" r="15" fill="none" stroke="${a}" stroke-width="2.4"/><path d="M16 15 Q20 10 26 11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M12 42 Q24 36 36 42 L38 46 H10 Z" fill="${a}"/>`,
  chroniques: (a, b) => `<path d="M10 8 Q10 4 15 4 H36 V38 H15 Q10 38 10 42 Q10 46 15 46 H38" fill="none" stroke="${a}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 12 H30 M16 19 H30 M16 26 H26" stroke="${b}" stroke-width="2.6" stroke-linecap="round"/>`,
  chat: (a, b) => `<path d="M6 8 H42 a3 3 0 0 1 3 3 V30 a3 3 0 0 1 -3 3 H22 L12 43 V33 H6 a3 3 0 0 1 -3 -3 V11 a3 3 0 0 1 3 -3 Z" fill="${b}" stroke="${a}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="16" cy="21" r="2.6" fill="${a}"/><circle cx="24" cy="21" r="2.6" fill="${a}"/><circle cx="32" cy="21" r="2.6" fill="${a}"/>`,
  parametres: (a, b) => `<circle cx="24" cy="24" r="14" fill="${b}"/><g fill="${b}"><rect x="21" y="2" width="6" height="9"/><rect x="21" y="37" width="6" height="9"/><rect x="2" y="21" width="9" height="6"/><rect x="37" y="21" width="9" height="6"/><rect x="21" y="2" width="6" height="9" transform="rotate(45 24 24)"/><rect x="21" y="37" width="6" height="9" transform="rotate(45 24 24)"/><rect x="2" y="21" width="9" height="6" transform="rotate(45 24 24)"/><rect x="37" y="21" width="9" height="6" transform="rotate(45 24 24)"/></g><circle cx="24" cy="24" r="14" fill="none" stroke="${a}" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="#161b27" stroke="${a}" stroke-width="2"/>`,
  admin: (a, b) => `<rect x="3" y="6" width="42" height="34" rx="3" fill="#0a0c12" stroke="${a}" stroke-width="3"/><path d="M10 16 L18 22 L10 28" fill="none" stroke="${a}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="22" y="27" width="12" height="3.4" fill="${a}"/><rect x="14" y="43" width="20" height="3" rx="1.5" fill="${b}"/>`,
};

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
  const an=t.anim, k=an.k;
  if(Array.isArray(an.c)) an.c=[light,lighter,d].slice(0,an.c.length>2?3:2).concat(an.c.length>3?[]:[]); else if(typeof an.c==="string"){ an.c = an.c.startsWith("rgba")?"rgba("+hx(light).join(",")+",.55)":an.c.startsWith("#")?lighter:hx(light).join(","); }
}
const MENUS = Object.keys(T);
const out = [];
const kf = [];
const sel = (id, part = "") => `${P}[data-menu-id-v1="${id}"] .soreal-idle-nav-deco-v1${part}`;
const ringG = (r) => `linear-gradient(90deg,${r.join(",")})`;
const MASK_V = "linear-gradient(180deg,transparent,#000 26%,#000 74%,transparent)";
const MASK_H = "linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent)";

out.push(`/* Boutons de la barre de sélection des menus (Norman, 2026-10-30) : chaque bouton reprend, en version mini, le cadre de titre de son menu (mêmes couleurs, anneau lumineux, dessin) ; le menu ACTIF a en plus une animation à lui. Fichier généré : la source est le script de dessin « gen-nav » (scratchpad), puis relu.
   Règles : aucun mot-clé de priorité forcée (le décor est un élément à part posé dans le bouton, il ne combat aucune règle existante) ; animations en boucle PARFAITE (une période exacte de la tuile, masques en dégradé aux bouts, rotation 360°, ou départ et arrivée identiques et invisibles) ; coupées par prefers-reduced-motion ; décor fourni par le HTML du bouton (règle n°4 : rien à remettre après un redessin) ; seuls les boutons des menus déjà débloqués existent (règle n°2). Tailles en pourcentage : même rendu sur téléphone (126 x 41) et dans la colonne de gauche du PC. */
@property --nb-ang-v1{syntax:"<angle>";inherits:false;initial-value:0deg}
${P}{position:relative;isolation:isolate}
${P} .soreal-idle-nav-deco-v1{position:absolute;inset:0;z-index:-1;border-radius:inherit;overflow:hidden;pointer-events:none}
${P} .soreal-idle-nav-deco-v1::before,${P} .soreal-idle-nav-deco-v1::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none}
${P} .soreal-idle-nav-deco-v1::before{display:none}
${P}.active .soreal-idle-nav-deco-v1::before{display:block}
${P} .soreal-idle-nav-deco-v1::after{padding:2px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);opacity:.72}
${P}.active .soreal-idle-nav-deco-v1::after{opacity:1}`);

for (const id of MENUS) {
  const t = T[id], an = t.anim;
  const motif = svgUrl(svg(48, 48, `<g opacity=".7">${M[id](t.a, t.b)}</g>`));
  const k = an.k;
  const name = `nbV1_${id}`;
  /* décor de base (identique actif / inactif) : voile de lecture, reflet, lueur du bas, dégradé du menu */
  const motifOpacityFix = k === "spin" ? "" : `${motif} calc(100% - 6px) 50%/auto 58% no-repeat,`;
  const base = `${motifOpacityFix}linear-gradient(115deg,transparent 0 34%,rgba(255,255,255,.09) 34% 48%,transparent 48% 54%,rgba(255,255,255,.04) 54% 60%,transparent 60%) 0 0/auto no-repeat,radial-gradient(ellipse 60% 140% at 50% 140%,rgba(${t.glow},.42),transparent 70%) 0 0/auto no-repeat,linear-gradient(180deg,${t.bg[0]} 0%,${t.bg[1]} 60%,${t.bg[2]} 100%) 0 0/auto no-repeat`;
  out.push(`\n/* ${id} */`);
  out.push(`${sel(id)}{--nb-dom-v1:${t.dom};background:${base};box-shadow:inset 0 0 12px rgba(0,0,0,.55),inset 0 0 14px rgba(${t.glow},.22)}`);
  out.push(`${sel(id, "::after")}{background:${ringG(t.ring)} border-box}`);
  out.push(`${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1{box-shadow:inset 0 0 12px rgba(0,0,0,.4),inset 0 0 18px rgba(${t.glow},.5)}`);
  const bef = sel(id, "::before");
  const act = `${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1::before`;
  const dot = (c, x, y, r) => `radial-gradient(circle at ${x}% ${y}%,${c} 0 ${r}px,transparent ${r + 1.1}px)`;
  const reduce = [];
  if (k === "rise" || k === "fall") {
    const TX = 38, TY = an.soft ? 34 : 30, r = an.big ? 2 : 1.4, dir = k === "rise" ? -1 : 1;
    const c = an.c, L = [dot(c[0], 16, 78, r), dot(c[1], 52, 38, r * 0.8), dot(c[2], 84, 88, r * 1.15), dot(c[1], 34, 12, r * 0.7), dot(c[0], 70, 58, r * 0.9)];
    const bg = L.map((l) => `${l} 0 0/${TX}px ${TY}px`).join(",");
    out.push(`${act}{background:${bg};-webkit-mask:${MASK_V};mask:${MASK_V};animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:${L.map(() => "0 0").join(",")}}to{background-position:${L.map(() => `0 ${dir * TY}px`).join(",")}}}`);
  } else if (k === "sweep") {
    const c = an.c;
    out.push(`${act}{background:linear-gradient(100deg,transparent 42%,rgba(${c},.55) 50%,transparent 58%) 100% 0/300% 100% no-repeat;animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:100% 0}to{background-position:0 0}}`);
  } else if (k === "wave") {
    const w = svgUrl(svg(60, 14, `<path d="M0 7 Q15 -3 30 7 T60 7" fill="none" stroke="${an.c}" stroke-width="1.8"/>`));
    const w2 = svgUrl(svg(60, 14, `<path d="M0 7 Q15 -3 30 7 T60 7" fill="none" stroke="${an.c}" stroke-width="1.2" opacity=".6"/>`));
    out.push(`${act}{background:${w} 0 70%/60px 14px repeat-x,${w2} 0 88%/60px 14px repeat-x;-webkit-mask:${MASK_H};mask:${MASK_H};animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:0 70%,0 88%}to{background-position:60px 70%,60px 88%}}`);
  } else if (k === "spin") {
    const gear = svgUrl(svg(48, 48, M[id](t.a, t.b)));
    out.push(`${bef}{display:block;inset:11% 6% 11% auto;aspect-ratio:1/1;border-radius:0;opacity:.75;background:${gear} center/contain no-repeat}`);
    out.push(`${act}{animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{transform:rotate(0)}to{transform:rotate(360deg)}}`);
  } else if (k === "pulse") {
    out.push(`${act}{background:radial-gradient(ellipse 70% 120% at 82% 50%,rgba(${an.c},.6),transparent 70%);animation:${name} ${an.t}s ease-in-out infinite}`);
    kf.push(`@keyframes ${name}{0%,100%{opacity:.15}50%{opacity:1}}`);
  } else if (k === "flag") {
    const ck = `conic-gradient(rgba(255,255,255,.55) 25%,transparent 0 50%,rgba(255,255,255,.55) 0 75%,transparent 0) 0 0/14px 14px repeat-x`;
    out.push(`${act}{inset:auto 0 0 0;height:34%;background:${ck};-webkit-mask:${MASK_H};mask:${MASK_H};animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:0 0}to{background-position:14px 0}}`);
  } else if (k === "scan") {
    out.push(`${act}{background:linear-gradient(180deg,transparent 43%,rgba(${hx(t.lighter).join(",")},.34) 50%,transparent 57%) 0 100%/100% 300% no-repeat,repeating-linear-gradient(0deg,transparent 0 2px,rgba(${hx(t.light).join(",")},.13) 2px 4px) 0 0/100% 4px;animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:0 100%,0 0}to{background-position:0 0,0 4px}}`);
  } else if (k === "matrix") {
    const col = (x, h, o) => svgUrl(svg(12, 26, `<defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.dom}" stop-opacity="0"/><stop offset="1" stop-color="${t.lighter}" stop-opacity="${o}"/></linearGradient></defs><rect x="${x}" y="${26 - h}" width="2" height="${h}" fill="url(#m)"/>`));
    const a1 = col(2, 14, 0.95), a2 = col(8, 9, 0.7);
    out.push(`${act}{background:${a1} 0 0/12px 26px repeat,${a2} 0 11px/12px 26px repeat;-webkit-mask:${MASK_V};mask:${MASK_V};animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:0 0,0 11px}to{background-position:0 26px,0 37px}}`);
  } else if (k === "twinkle") {
    const c = an.c;
    const L = [dot(c[0], 14, 30, 1.6), dot(c[1], 46, 70, 1.3), dot(c[0], 72, 24, 1.5), dot(c[1], 90, 62, 1.2), dot(c[0], 30, 86, 1.1)];
    out.push(`${act}{background:${L.map((l) => `${l} 0 0/100% 100% no-repeat`).join(",")};animation:${name} ${an.t}s ease-in-out infinite}`);
    kf.push(`@keyframes ${name}{0%,100%{opacity:.1;transform:scale(.85)}50%{opacity:1;transform:scale(1.05)}}`);
  } else if (k === "beam") {
    out.push(`${act}{inset:-120% -20%;border-radius:0;background:conic-gradient(from 0deg,transparent 0 8%,rgba(${hx(t.lighter).join(",")},.5) 14%,transparent 22% 50%,rgba(${hx(t.dom).join(",")},.7) 64%,transparent 72%);animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{transform:rotate(0)}to{transform:rotate(360deg)}}`);
  } else if (k === "trail") {
    const d = `radial-gradient(circle,${an.c} 0 1.7px,transparent 2.4px) 0 86%/11px 7px repeat-x`;
    out.push(`${act}{background:${d};-webkit-mask:${MASK_H};mask:${MASK_H};animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:0 86%}to{background-position:-11px 86%}}`);
  } else if (k === "rainbow") {
    out.push(`${act}{inset:auto 0 0 0;height:30%;background:linear-gradient(90deg,#ff7ad9,#ffd24a 17%,#7dffb0 34%,#5eead4 51%,#8ab4ff 68%,#c89bff 85%,#ff7ad9) 0 0/80px 100% repeat-x;opacity:.7;-webkit-mask:${MASK_H};mask:${MASK_H};animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{from{background-position:0 0}to{background-position:80px 0}}`);
  } else if (k === "shoot") {
    out.push(`${act}{background:linear-gradient(160deg,transparent 46%,rgba(255,255,255,.9) 50%,transparent 54%) 100% 0/300% 100% no-repeat,${dot(t.lighter, 20, 26, 1.4)} 0 0/100% 100% no-repeat,${dot(t.light, 64, 72, 1.3)} 0 0/100% 100% no-repeat;animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{0%,55%{background-position:100% 0,0 0,0 0}100%{background-position:0 0,0 0,0 0}}`);
  } else if (k === "blink") {
    out.push(`${act}{inset:auto 7% 24% auto;width:12%;height:12%;border-radius:1px;background:${t.a};box-shadow:0 0 6px ${t.a};animation:${name} ${an.t}s ease-in-out infinite}`);
    kf.push(`@keyframes ${name}{0%,100%{opacity:0}50%{opacity:1}}`);
  } else if (k === "chase") {
    out.push(`${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1::after{background:conic-gradient(from var(--nb-ang-v1),${t.ring.join(",")},${t.ring[0]}) border-box;animation:${name} ${an.t}s linear infinite}`);
    kf.push(`@keyframes ${name}{to{--nb-ang-v1:360deg}}`);
    out.push(`${act}{display:none}`);
  }
}
/* Les cadres de titre des pages gardent leurs couleurs d'origine (Norman, 2026-10-30 : « les titres ne sont pas comme tu me les avais montrés ») : aucune recoloration. */
out.push("\n" + kf.join("\n"));
out.push(`\n@media (prefers-reduced-motion:reduce){\n  ${P} .soreal-idle-nav-deco-v1,${P} .soreal-idle-nav-deco-v1::before,${P} .soreal-idle-nav-deco-v1::after{animation:none}\n}\n`);
writeFileSync("cloudflare/public/soreal-idle-menus-boutons-v1.css", out.join("\n"));
console.log("ok", MENUS.length, "menus");
