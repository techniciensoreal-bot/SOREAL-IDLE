#!/usr/bin/env node
/*
 * Assemble desktop/icone.ico (icône de l'application Windows : exécutable, barre des tâches, raccourcis) à partir de PNG déjà redimensionnés.
 *   node desktop/creer-icone.mjs <dossier contenant 16.png 24.png 32.png 48.png 64.png 128.png 256.png>
 * Le fichier produit est versionné : la construction de l'installateur (construire.mjs) le réutilise tel quel.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const dossier = process.argv[2];
if (!dossier) { console.error("Indiquer le dossier des PNG (16.png … 256.png)."); process.exit(1); }
const tailles = [16, 24, 32, 48, 64, 128, 256];
const images = tailles.map((t) => ({ t, png: fs.readFileSync(path.join(dossier, t + ".png")) }));
const entete = Buffer.alloc(6);
entete.writeUInt16LE(1, 2); entete.writeUInt16LE(images.length, 4);
const table = Buffer.alloc(16 * images.length);
let decalage = 6 + table.length;
images.forEach((im, i) => {
  const o = i * 16;
  table[o] = im.t >= 256 ? 0 : im.t; table[o + 1] = im.t >= 256 ? 0 : im.t;
  table.writeUInt16LE(1, o + 4); table.writeUInt16LE(32, o + 6);
  table.writeUInt32LE(im.png.length, o + 8); table.writeUInt32LE(decalage, o + 12);
  decalage += im.png.length;
});
fs.writeFileSync(path.join(ICI, "icone.ico"), Buffer.concat([entete, table, ...images.map((i) => i.png)]));
console.log("desktop/icone.ico écrit (" + decalage + " octets, tailles " + tailles.join(", ") + ").");
