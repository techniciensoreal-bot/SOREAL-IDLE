import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_MOB_CATALOG_V1,
  IDLE_ADVENTURE_MOB_BESTIARY_V1,
  IDLE_ADVENTURE_V47,
  normalizeIdleAdventureStateV47,
  idleAdventureMobBestiaryEntryV1
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-13) : "Les mobs du mode aventure se trouvent tous dans
 * mon R2 : soreal/idle/aventure/. Reconstruit tout en interne pour que ça
 * match. Mais les zones dans le jeu devront garder leurs noms."
 *
 * V3 (2026-09-16, Norman : "j'ai plusieurs images qui sont utilisée pour
 * le même mob [...] Chacune des image doit être reliée à un ennemi. Le
 * compte est bon normalement pour les premières zones.") — root cause :
 * une seule entrée Collection par zone/rôle (mob ou boss), quel que soit
 * le nombre réel d'images R2 (3 à 8 par zone). Reconstruit pour émettre
 * UNE entrée Collection par image du catalogue partagé avec worker.js
 * (SOREAL-APP), en suivant les rencontres PAR INDEX (mobEncountersByIndex/
 * bossEncountersByIndex, startZoneFight) — jamais un second calcul du nom
 * des images, la seule source de vérité reste IDLE_ADVENTURE_MOB_CATALOG_V1.
 * Les zones sans catalogue d'images pour l'instant (beardverse/badly/
 * boring/chocolate, aucun dossier R2 dédié) gardent l'ancien comportement
 * (une seule entrée générique par zone/rôle), pour ne jamais perdre une
 * découverte déjà comptée par le joueur faute d'art disponible.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// --- Verrous structurels ---
assert.ok(
  source.includes(
    'import {\n  IDLE_ADVENTURE_ZONES,\n  IDLE_ADVENTURE_MOB_CATALOG_V1,\n  IDLE_ADVENTURE_MOB_BESTIARY_V1,\n  normalizeIdleAdventureStateV47,\n  idleAdventureMobBestiaryEntryV1\n} from "./idle-adventure-v47.js";'
  ),
  "Le vrai catalogue de zones ET le catalogue d'images V1 doivent être importés, pas reconstruits séparément."
);
assert.ok(
  source.includes("adventureStateBestiaireV1") &&
  source.includes("zoneMobIndexBestiaireV1") &&
  source.includes("zoneBossIndexBestiaireV1"),
  "La construction du Bestiaire Aventure doit lire les compteurs PAR INDEX (mobEncountersByIndex/bossEncountersByIndex), pas un compteur unique par zone."
);

function extractSlice(src, startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  assert.ok(start >= 0, "Introuvable: " + startNeedle);
  const end = src.indexOf(endNeedle, start);
  assert.ok(end > start, "Fin introuvable: " + endNeedle);
  return src.slice(start, end + endNeedle.length);
}

const block = extractSlice(
  source,
  "const adventureStateBestiaireV1 =",
  "          });\n        });\n      });\n    });\n"
);

// --- Comportement réel : exécution du vrai code extrait, jamais une réimplémentation ---
function buildEntries(rawAdventureState) {
  const entrees = [];
  const stats = { metaNgu: { adventure: rawAdventureState } };
  const fn = new Function(
    "IDLE_ADVENTURE_ZONES", "IDLE_ADVENTURE_MOB_CATALOG_V1", "IDLE_ADVENTURE_MOB_BESTIARY_V1", "normalizeIdleAdventureStateV47", "nombreSorealIdle_", "stats", "entrees", "idleAdventureMobBestiaryEntryV1",
    block
  );
  fn(
    IDLE_ADVENTURE_ZONES,
    IDLE_ADVENTURE_MOB_CATALOG_V1,
    IDLE_ADVENTURE_MOB_BESTIARY_V1,
    normalizeIdleAdventureStateV47,
    (v, d) => (Number.isFinite(+v) ? +v : d),
    stats,
    entrees,
    idleAdventureMobBestiaryEntryV1
  );
  return entrees;
}

function expectedEntryCount() {
  return IDLE_ADVENTURE_ZONES
    .filter(z => z.id !== "safe")
    .reduce((total, zone) => {
      const catalogue = IDLE_ADVENTURE_MOB_CATALOG_V1[zone.id] || { normal: [], boss: [] };
      const bestiaire = IDLE_ADVENTURE_MOB_BESTIARY_V1[zone.id] || { normal: [], boss: [] };
      const mobCount = bestiaire.normal.length || catalogue.normal.length || 1;
      const bossCount = bestiaire.boss.length || catalogue.boss.length || 1;
      return total + mobCount + bossCount;
    }, 0);
}

// --- Joueur neuf : rien découvert, tout masqué, une entrée par image réelle du catalogue ---
{
  const entrees = buildEntries(null);
  assert.equal(entrees.length, expectedEntryCount(), "Une entrée Collection par image réelle du catalogue (fallback générique pour les zones sans catalogue), jamais un total fixe de 2 par zone.");
  assert.ok(entrees.every(e => e.decouvert === false && e.nom === "???????"), "Rien n'est découvert pour un joueur neuf — tout masqué.");
  assert.ok(entrees.every(e => typeof e.zone === "string" && e.zone.length > 0), "Chaque entrée doit porter le vrai id de zone V47 (chaîne), jamais un zoneId numérique légataire.");

  // Sewers : bestiaire wiki (3 mobs, 1 boss).
  const sewersMobs = entrees.filter(e => e.zone === "sewers" && e.boss === 0);
  const sewersBoss = entrees.filter(e => e.zone === "sewers" && e.boss === 1);
  assert.equal(sewersMobs.length, IDLE_ADVENTURE_MOB_CATALOG_V1.sewers.normal.length, "Sewers doit avoir une entrée par mob réel du catalogue.");
  assert.equal(sewersBoss.length, IDLE_ADVENTURE_MOB_BESTIARY_V1.sewers.boss.length);

  // 2026-09-23 : une zone sans images mais avec bestiaire wiki (beardverse) liste ses vrais ennemis.
  const beardverseEntries = entrees.filter(e => e.zone === "beardverse");
  assert.equal(beardverseEntries.length, IDLE_ADVENTURE_MOB_BESTIARY_V1.beardverse.normal.length + IDLE_ADVENTURE_MOB_BESTIARY_V1.beardverse.boss.length);
  // 2026-09-24 : The Nether Regions a maintenant son bestiaire (source externe) : une entrée par ennemi.
  assert.equal(entrees.filter(e => e.zone === "netherregions").length, IDLE_ADVENTURE_MOB_BESTIARY_V1.netherregions.normal.length + IDLE_ADVENTURE_MOB_BESTIARY_V1.netherregions.boss.length);
}

// --- Une rencontre sur un index précis débloque SEULEMENT l'entrée de cette image ---
{
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: { mobEncountersByIndex: { sewers: { 1: 3 } }, bossEncountersByIndex: {} }
  };
  const entrees = buildEntries(rawState);
  const sewersMobs = entrees.filter(e => e.zone === "sewers" && e.boss === 0);
  const discovered = sewersMobs.filter(e => e.decouvert);
  assert.equal(discovered.length, 1, "Seule l'image à l'index rencontré doit être découverte, jamais les autres images du même pool.");
  assert.equal(discovered[0].index, 1);
  assert.equal(discovered[0].rencontres, 3);
  /*
   * 2026-09-17 (Norman : "les MEMES noms [que NGU], tout ce qui est
   * Soreal disparait") : le nom affiché en Collection vient maintenant du
   * VRAI nom NGU (IDLE_ADVENTURE_MOB_BESTIARY_V1, sourcé du miroir wiki
   * local) quand une entrée existe pour ce zone/rôle/index, plutôt que du
   * nom dérivé du fichier image R2 (habillage SOREAL) -- jamais l'inverse.
   */
  assert.equal(
    discovered[0].nom,
    IDLE_ADVENTURE_MOB_BESTIARY_V1.sewers.normal[1].name,
    "Le nom affiché doit être le vrai nom NGU (bestiaire sourcé wiki) quand il existe, jamais l'habillage SOREAL dérivé du fichier image."
  );
  assert.ok(sewersMobs.filter(e => !e.decouvert).every(e => e.nom === "???????"), "Les autres images du même pool restent verrouillées.");
}

// --- Un boss rencontré débloque SEULEMENT l'entrée gardien correspondant à son index ---
{
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: { mobEncountersByIndex: {}, bossEncountersByIndex: { forest: { 0: 1 } } }
  };
  const entrees = buildEntries(rawState);
  const forestBosses = entrees.filter(e => e.zone === "forest" && e.boss === 1);
  const discovered = forestBosses.find(e => e.index === 0);
  assert.equal(discovered.decouvert, true);
  assert.equal(discovered.categorie, "Gardien de zone");
  assert.equal(discovered.boss, 1, "Le flag boss=1 doit être exposé pour construire l'URL R2 /api/idle/media/mob?boss=1.");
}

// --- Zone sans images mais avec bestiaire (netherregions, 2026-09-24) : découverte par index de mob ---
{
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: { mobEncountersByIndex: { netherregions: { 0: 5 } }, bossEncountersByIndex: {} }
  };
  const entrees = buildEntries(rawState);
  const premier = entrees.find(e => e.zone === "netherregions" && e.boss === 0 && e.index === 0);
  assert.equal(premier.decouvert, true, "Une rencontre enregistrée sur l'index 0 débloque le premier ennemi de The Nether Regions.");
  assert.equal(premier.rencontres, 5);
  assert.equal(premier.nom, IDLE_ADVENTURE_MOB_BESTIARY_V1.netherregions.normal[0].name);
  const autre = entrees.find(e => e.zone === "netherregions" && e.boss === 0 && e.index === 1);
  assert.equal(autre.decouvert, false, "Les autres ennemis restent non découverts.");
}

console.log("idle-bestiaire-aventure-v47-rebuild: OK");
