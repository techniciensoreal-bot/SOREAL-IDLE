#!/usr/bin/env node
/*
 * Gabarits de mise en page des trois images de la machine (Norman, 2026-11-06) : rectangles et cercles de couleurs unies à positions EXACTES (1200 x 1500 px), sans aucun texte, à donner à un générateur d'images
 * comme image de référence. Écrit trois PNG dans design/gabarits-machine/. Aucune dépendance (encodeur PNG minimal : zlib + CRC).
 *   node cloudflare/tools/gabarits-machine-v2.mjs
 * Les mêmes rectangles servent ensuite à brancher les éléments du jeu (zones.json écrit à côté).
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const L = 1200;
let H = 1500;   /* hauteur de l'image en cours (la machine centrale « haute » fait 1800) */
const COUL = { fond: [38, 38, 44], cadre: [64, 64, 74], magenta: [255, 0, 255], cyan: [0, 255, 255], jaune: [255, 255, 0], vert: [0, 255, 0], orange: [255, 128, 0], rouge: [255, 0, 0], bleu: [0, 0, 255] };

function toile() { const px = Buffer.alloc(L * H * 3); for (let i = 0; i < L * H; i += 1) { px[i * 3] = COUL.fond[0]; px[i * 3 + 1] = COUL.fond[1]; px[i * 3 + 2] = COUL.fond[2]; } return px; }
function rect(px, x0, y0, x1, y1, c) { for (let y = Math.max(0, y0); y < Math.min(H, y1); y += 1) for (let x = Math.max(0, x0); x < Math.min(L, x1); x += 1) { const i = (y * L + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; } }
function cercle(px, cx, cy, r, c) { for (let y = cy - r; y <= cy + r; y += 1) for (let x = cx - r; x <= cx + r; x += 1) { if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= 0 && y >= 0 && x < L && y < H) { const i = (y * L + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; } } }

const TAB_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc(buf) { let c = 0xffffffff; for (const b of buf) c = TAB_CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function bloc(type, data) { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const t = Buffer.from(type); const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); }
function png(px) {
  const brut = Buffer.alloc((L * 3 + 1) * H);
  for (let y = 0; y < H; y += 1) { brut[y * (L * 3 + 1)] = 0; px.copy(brut, y * (L * 3 + 1) + 1, y * L * 3, (y + 1) * L * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(L, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc("IHDR", ihdr), bloc("IDAT", zlib.deflateSync(brut, { level: 9 })), bloc("IEND", Buffer.alloc(0))]);
}

/* ---- les trois mises en page : coordonnées en pixels sur 1200 x 1500 ---- */
const centrale = {
  nom: "1-machine-centrale",
  zones: [
    { id: "ecran", forme: "rect", x0: 120, y0: 90, x1: 1080, y1: 560, couleur: "magenta", role: "écran du mob (grand rectangle)" },
    { id: "lcdGauche", forme: "rect", x0: 90, y0: 640, x1: 440, y1: 800, couleur: "cyan", role: "afficheur gauche" },
    { id: "cadran", forme: "cercle", cx: 600, cy: 720, r: 110, couleur: "jaune", role: "cadran rond" },
    { id: "lcdDroit", forme: "rect", x0: 760, y0: 640, x1: 1110, y1: 800, couleur: "cyan", role: "afficheur droit" },
    { id: "fenetre", forme: "rect", x0: 90, y0: 900, x1: 1110, y1: 1130, couleur: "vert", role: "fenêtre longue (engrenages ajoutés par le jeu)" },
    { id: "sortie", forme: "rect", x0: 420, y0: 1230, x1: 780, y1: 1420, couleur: "orange", role: "sortie du bas, VIDE (pièces ajoutées par le jeu)" }
  ]
};
const tour = (nom, tubeGauche) => {
  const tube = tubeGauche ? { x0: 90, x1: 300 } : { x0: 900, x1: 1110 };
  const aff = tubeGauche ? { x0: 350, x1: 1110 } : { x0: 90, x1: 850 };
  return {
    nom,
    zones: [
      { id: "titre", forme: "rect", x0: 150, y0: 70, x1: 1050, y1: 210, couleur: "rouge", role: "plaque de titre" },
      { id: "socle", forme: "cercle", cx: 600, cy: 330, r: 90, couleur: "bleu", role: "petit socle rond" },
      { id: "tube", forme: "rect", x0: tube.x0, y0: 430, x1: tube.x1, y1: 1230, couleur: "vert", role: "tube de verre vide" },
      { id: "afficheur1", forme: "rect", x0: aff.x0, y0: 430, x1: aff.x1, y1: 640, couleur: "cyan", role: "afficheur du haut" },
      { id: "afficheur2", forme: "rect", x0: aff.x0, y0: 700, x1: aff.x1, y1: 1010, couleur: "cyan", role: "afficheur du bas (plus grand)" },
      ...[0, 1, 2, 3].map((i) => ({ id: "bouton" + (i + 1), forme: "rect", x0: 90 + i * 265, y0: 1290, x1: 90 + i * 265 + 225, y1: 1420, couleur: "orange", role: "bouton carré vide n° " + (i + 1) }))
    ]
  };
};
/* MACHINE CENTRALE HAUTE (Norman, 2026-11-06 : « la machine n'est pas assez haute, l'image du boss est trop petite ») : 1200 x 1800, écran du haut presque carré (960 x 700) ; le reste est le même, décalé de 300 px vers le bas.
   Les boutons gris de liaison doivent rester AUX MÊMES HAUTEURS que sur les tours (y = 400 à 610 et 870 à 1060 sur 1500 de haut, soit en pixels de l'image : à garder tels quels). */
const centraleHaute = {
  nom: "1b-machine-centrale-haute", h: 1800,
  zones: [
    { id: "ecran", forme: "rect", x0: 120, y0: 90, x1: 1080, y1: 790, couleur: "magenta", role: "écran du mob (grand, presque carré)" },
    { id: "lcdGauche", forme: "rect", x0: 90, y0: 880, x1: 440, y1: 1040, couleur: "cyan", role: "afficheur gauche" },
    { id: "cadran", forme: "cercle", cx: 600, cy: 960, r: 110, couleur: "jaune", role: "cadran rond" },
    { id: "lcdDroit", forme: "rect", x0: 760, y0: 880, x1: 1110, y1: 1040, couleur: "cyan", role: "afficheur droit" },
    { id: "fenetre", forme: "rect", x0: 90, y0: 1140, x1: 1110, y1: 1370, couleur: "vert", role: "fenêtre longue (engrenages ajoutés par le jeu)" },
    { id: "sortie", forme: "rect", x0: 420, y0: 1470, x1: 780, y1: 1660, couleur: "orange", role: "sortie du bas, VIDE (pièces ajoutées par le jeu)" }
  ]
};
const images = [centrale, centraleHaute, tour("2-tour-energie", true), tour("3-tour-magie", false)];

const sortie = path.join("design", "gabarits-machine");
fs.mkdirSync(sortie, { recursive: true });
const zonesJson = {};
for (const im of images) {
  H = im.h || 1500;
  const px = toile();
  /* cadre sombre autour pour que les bords restent lisibles */
  rect(px, 0, 0, L, 24, COUL.cadre); rect(px, 0, H - 24, L, H, COUL.cadre); rect(px, 0, 0, 24, H, COUL.cadre); rect(px, L - 24, 0, L, H, COUL.cadre);
  for (const z of im.zones) {
    const c = COUL[z.couleur];
    if (z.forme === "rect") rect(px, z.x0, z.y0, z.x1, z.y1, c); else cercle(px, z.cx, z.cy, z.r, c);
  }
  fs.writeFileSync(path.join(sortie, im.nom + ".png"), png(px));
  zonesJson[im.nom] = { largeur: L, hauteur: H, zones: im.zones };
}
fs.writeFileSync(path.join(sortie, "zones.json"), JSON.stringify(zonesJson, null, 2));
console.log("gabarits écrits dans " + sortie + " : " + images.map((i) => i.nom + ".png").join(", "));
