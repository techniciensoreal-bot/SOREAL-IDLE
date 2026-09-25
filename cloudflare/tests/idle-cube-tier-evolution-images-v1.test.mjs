import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_ADVENTURE_CUBE_TIERS_V1, idleAdventureCubeTierV1 } from "../src/idle-adventure-v47.js";
import { choisirObjetItemR2ParIdEtTier_ } from "../src/idle-media-v1.js";

/*
 * Norman (2026-09-24) : « Le cube évolue quand on le boost suffisamment. Vérifie que les statistiques qu'il procure et la transformation (avec la
 * nouvelle image du R2) sont bien programmées. » Wiki « Infinity Cube », section Cube Tiers : paliers par Power + Toughness cumulés du Cube.
 */
// --- Tableau du wiki, recopié tel quel ---
const WIKI = [
  [0, 0, 0, 0, 0, 0], [1, 100, 50, 0, 0, 0], [2, 1e3, 70, 50, 0, 0], [3, 1e4, 90, 123.11, 0, 0], [4, 1e5, 110, 208.56, 0, 0],
  [5, 1e6, 130, 303.14, 0, 0], [6, 1e7, 150, 405.16, 0, 0], [7, 1e8, 170, 513.53, 0, 0], [8, 1e9, 190, 627.48, 10, 0],
  [9, 1e10, 210, 746.43, 15, 10], [10, 1e11, 230, 869.93, 20, 20]
];
assert.deepEqual(
  IDLE_ADVENTURE_CUBE_TIERS_V1.map((t) => [t.tier, t.seuil, t.dropChancePct, t.goldDropsPct, t.hackSpeedPct, t.wishSpeedPct]),
  WIKI,
  "les 11 paliers (seuil, drop, or, vitesse hack, vitesse wish) sont exactement ceux du wiki"
);

// --- Évolution : le palier suit la somme Power + Toughness, aux seuils exacts ---
const palier = (p, t) => idleAdventureCubeTierV1({ power: p, toughness: t }).tier;
assert.equal(palier(0, 0), 0);
assert.equal(palier(60, 39), 0, "99 < 100");
assert.equal(palier(60, 40), 1, "100 : palier 1");
assert.equal(palier(500, 500), 2, "1 000 : palier 2 (Power et Toughness s'additionnent)");
assert.equal(palier(9e4, 1e4), 4);
assert.equal(palier(1e11, 0), 10);
assert.equal(palier(5e11, 5e11), 10, "au-delà du dernier palier : reste au 10");
{
  const avant = idleAdventureCubeTierV1({ power: 99, toughness: 0 });
  const apres = idleAdventureCubeTierV1({ power: 100, toughness: 0 });
  assert.equal(avant.tier, 0);
  assert.equal(apres.tier, 1);
  assert.equal(apres.dropChancePct, 50);
  assert.equal(apres.suivant.tier, 2, "le palier suivant est annoncé");
}

// --- Image de chaque palier (R2 : idle/items/Item_0100_THE_CUBE_Tier<n>.png) ; palier absent -> palier disponible le plus proche en dessous ---
const cle = (n) => ({ key: "idle/items/Item_0100_THE_CUBE_Tier" + n + ".png" });
const dossier = [0, 1, 2, 3, 5, 6, 7].map(cle); // état réel du 2026-09-24 : 4, 8, 9 et 10 pas encore présents
const fichier = (objects, tier) => { const o = choisirObjetItemR2ParIdEtTier_(objects, 100, tier, "THE CUBE"); return o ? o.key.split("/").pop() : null; };
for (const n of [0, 1, 2, 3, 5, 6, 7]) assert.equal(fichier(dossier, n), "Item_0100_THE_CUBE_Tier" + n + ".png", "palier " + n + " : sa propre image");
assert.equal(fichier(dossier, 4), "Item_0100_THE_CUBE_Tier3.png", "palier 4 sans image : l'image du palier 3, pas un 404");
assert.equal(fichier(dossier, 8), "Item_0100_THE_CUBE_Tier7.png");
assert.equal(fichier(dossier, 10), "Item_0100_THE_CUBE_Tier7.png");
assert.equal(fichier([...dossier, cle(4)], 4), "Item_0100_THE_CUBE_Tier4.png", "dès que le fichier du palier est ajouté, il est servi tel quel");
assert.equal(fichier([...dossier, cle(4), cle(8), cle(9), cle(10)], 10), "Item_0100_THE_CUBE_Tier10.png");
assert.equal(fichier([], 3), null, "aucune image du tout : rien (l'interface garde l'emoji)");
assert.equal(choisirObjetItemR2ParIdEtTier_(dossier, 99, 3), null, "un autre objet n'emprunte jamais les images du Cube");

// --- Client : l'icône du Cube suit le palier renvoyé par le serveur, et se redessine après chaque boost ---
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.match(ui, /const tier=idleEntier_\(cubeTier&&cubeTier\.tier\);/);
assert.match(ui, /urlImageCubeInfiniAdventureIdleV1_\(tier\)/);
assert.match(ui, /wikiItemId=100&tier='\+n\+'&name='\+encodeURIComponent\('THE CUBE'\)/);
assert.match(ui, /rendreSlotCubeInfiniAdventureIdleV1_\(modele\.cube,modele\.cubeTier\)/, "le patch d'équipement (après un boost du Cube) redessine l'emplacement avec le nouveau palier");
assert.match(readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8"), /cubeTier:idleAdventureCubeTierV1\(s\.cube\)/, "le serveur renvoie le palier à chaque réponse");

console.log("idle-cube-tier-evolution-images-v1 OK");
