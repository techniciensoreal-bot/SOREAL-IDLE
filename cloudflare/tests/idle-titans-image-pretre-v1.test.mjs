import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Image du Prêtre d'Exilé : le jeu (build 1260) la fournit : texture « PriestOfTheExile » (Texture2D RGB24 184 x 184, 101 568 octets) de sharedassets0.assets, données dans sharedassets0.assets.resS
 * (offset 68 981 428). Extraite telle quelle (lignes remises de haut en bas), sans retouche ni dessin inventé : cloudflare/public/titans/priest.png. R2 n'en a pas : la route des images de titans
 * (/api/idle/media/titan?id=priest, même chemin que les autres titans) retombe sur ce fichier livré avec le frontend.
 */
const png = readFileSync("cloudflare/public/titans/priest.png");
assert.deepEqual([...png.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "signature PNG");
assert.equal(png.readUInt32BE(16), 184, "largeur de la texture du jeu");
assert.equal(png.readUInt32BE(20), 184, "hauteur de la texture du jeu");
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
assert.ok(media.includes('"/titans/"+id.toLowerCase()+".png"') && media.includes("env.ASSETS.fetch"), "repli sur l'image livrée quand R2 n'a rien");
/* Le Prêtre n'a aucun jeton d'image R2 : jamais l'image d'un autre titan par ressemblance de nom. */
assert.ok(!/priest:\[/.test(media), "pas de jeton R2 pour le Prêtre");
/* Icône des indices de l'Exilé (335 à 341) : « Items/Clue1 » dans la table d'objets du jeu ; texture « Clue1 » 46 x 46 extraite telle quelle, repli de la route /api/idle/media/item quand R2 n'a rien. */
const clue = readFileSync("cloudflare/public/items/clue1.png");
assert.deepEqual([...clue.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "signature PNG");
assert.equal(clue.readUInt32BE(16), 46);
assert.equal(clue.readUInt32BE(20), 46);
assert.ok(media.includes("IDLE_ITEM_ICONES_LIVREES_V1") && media.includes('335:"clue1"') && media.includes('341:"clue1"') && media.includes('"/items/"+IDLE_ITEM_ICONES_LIVREES_V1[explicitItemId]+".png"'), "repli des icônes livrées");
console.log("idle-titans-image-pretre-v1: OK");
