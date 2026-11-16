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
/* Images du jeu (build 1260, sharedassets0.assets), extraites le 2026-11-16, livrées en repli quand R2 n'a rien : GLOP (372) = Tier30Glop, Blue Eyes Ultimate Chestplate (342) = Tier26Chest2 (version bleue de Tier26Chest, Blue Eyes White), portraits 63 à 65 = ChallengesNormal/Evil/Sadistic, portrait 51 = PlayerPortrait_Halloween (pas encore branché : aucune condition d'obtention dans SOREAL). */
const taille = (f, n) => { const b = readFileSync(f); assert.deepEqual([...b.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]); assert.equal(b.readUInt32BE(16), n); assert.equal(b.readUInt32BE(20), n); };
taille("cloudflare/public/items/glop.png", 46);
taille("cloudflare/public/items/blue-eyes-ultimate.png", 46);
assert.ok(media.includes('342:"blue-eyes-ultimate"') && media.includes('372:"glop"'), "icônes 342 et 372");
for (const n of ["defis-normal", "defis-evil", "defis-sadistic", "halloween-51"]) {
  const b = readFileSync((n === "halloween-51" ? "design/images-jeu/portrait-" : "cloudflare/public/player/portrait-") + n + ".webp");
  assert.equal(b.slice(0, 4).toString("latin1"), "RIFF"); assert.equal(b.slice(8, 12).toString("latin1"), "WEBP");
}
assert.ok(media.includes("portrait-defis-(normal|evil|sadistic)") && media.includes('"/player/"+prBase+".webp"'), "repli des portraits de défis");
assert.equal(readFileSync("cloudflare/public/perks/56.webp").slice(8, 12).toString("latin1"), "WEBP", "perk 56");
console.log("idle-titans-image-pretre-v1: OK");
