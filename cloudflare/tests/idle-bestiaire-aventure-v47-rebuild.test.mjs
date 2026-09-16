import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_MOB_CATALOG_V1,
  IDLE_ADVENTURE_V47,
  normalizeIdleAdventureStateV47
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
    'import {\n  IDLE_ADVENTURE_ZONES,\n  IDLE_ADVENTURE_MOB_CATALOG_V1,\n  normalizeIdleAdventureStateV47\n} from "./idle-adventure-v47.js";'
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
    "IDLE_ADVENTURE_ZONES", "IDLE_ADVENTURE_MOB_CATALOG_V1", "normalizeIdleAdventureStateV47", "nombreSorealIdle_", "stats", "entrees",
    block
  );
  fn(
    IDLE_ADVENTURE_ZONES,
    IDLE_ADVENTURE_MOB_CATALOG_V1,
    normalizeIdleAdventureStateV47,
    (v, d) => (Number.isFinite(+v) ? +v : d),
    stats,
    entrees
  );
  return entrees;
}

function expectedEntryCount() {
  return IDLE_ADVENTURE_ZONES
    .filter(z => z.id !== "safe")
    .reduce((total, zone) => {
      const catalogue = IDLE_ADVENTURE_MOB_CATALOG_V1[zone.id] || { normal: [], boss: [] };
      const mobCount = catalogue.normal.length || 1;
      const bossCount = catalogue.boss.length || 1;
      return total + mobCount + bossCount;
    }, 0);
}

// --- Joueur neuf : rien découvert, tout masqué, une entrée par image réelle du catalogue ---
{
  const entrees = buildEntries(null);
  assert.equal(entrees.length, expectedEntryCount(), "Une entrée Collection par image réelle du catalogue (fallback générique pour les zones sans catalogue), jamais un total fixe de 2 par zone.");
  assert.ok(entrees.every(e => e.decouvert === false && e.nom === "???????"), "Rien n'est découvert pour un joueur neuf — tout masqué.");
  assert.ok(entrees.every(e => typeof e.zone === "string" && e.zone.length > 0), "Chaque entrée doit porter le vrai id de zone V47 (chaîne), jamais un zoneId numérique légataire.");

  // Sewers a un catalogue réel (3 mobs, 0 boss) : 3 entrées mob + 1 entrée boss de repli.
  const sewersMobs = entrees.filter(e => e.zone === "sewers" && e.boss === 0);
  const sewersBoss = entrees.filter(e => e.zone === "sewers" && e.boss === 1);
  assert.equal(sewersMobs.length, IDLE_ADVENTURE_MOB_CATALOG_V1.sewers.normal.length, "Sewers doit avoir une entrée par mob réel du catalogue.");
  assert.equal(sewersBoss.length, 1, "Sewers n'a pas de boss au catalogue : repli sur une seule entrée générique.");

  // Une zone sans catalogue du tout (ex. beardverse) garde l'ancien comportement (1 mob + 1 boss).
  const beardverseEntries = entrees.filter(e => e.zone === "beardverse");
  assert.equal(beardverseEntries.length, 2, "Zone sans catalogue d'images : repli sur 1 entrée mob + 1 entrée boss générique.");
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
  assert.equal(
    discovered[0].nom,
    IDLE_ADVENTURE_MOB_CATALOG_V1.sewers.normal[1].split('_').filter(Boolean).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' '),
    "Le nom affiché doit dériver du vrai nom de fichier catalogue, jamais un nom générique de zone."
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

// --- Zone sans catalogue (repli générique) : une simple rencontre suffit, comme avant ---
{
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: { encounters: { beardverse: 5 }, bossEncounters: {} }
  };
  const entrees = buildEntries(rawState);
  const beardverseMob = entrees.find(e => e.zone === "beardverse" && e.boss === 0);
  assert.equal(beardverseMob.decouvert, true, "Repli générique : le compteur plat (encounters) doit toujours débloquer l'entrée pour les zones sans catalogue.");
  assert.equal(beardverseMob.rencontres, 5);
  assert.equal(beardverseMob.nom, IDLE_ADVENTURE_ZONES.find(z => z.id === "beardverse").name, "Repli générique : le nom affiché reste le vrai nom de zone, jamais un nom d'image inexistante.");
}

console.log("idle-bestiaire-aventure-v47-rebuild: OK");
