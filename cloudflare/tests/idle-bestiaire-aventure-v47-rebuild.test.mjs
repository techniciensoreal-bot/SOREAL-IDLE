import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_ADVENTURE_ZONES, IDLE_ADVENTURE_V47, normalizeIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-13) : "Les mobs du mode aventure se trouvent tous dans
 * mon R2 : soreal/idle/aventure/. Reconstruit tout en interne pour que ça
 * match. Mais les zones dans le jeu devront garder leurs noms."
 *
 * Cause racine confirmée par audit : le Bestiaire > Aventure lisait un
 * catalogue légataire (monstresAventureSorealIdleGameV409_, table
 * IDLE_ZONES, zoneId NUMÉRIQUES) totalement disjoint des vraies zones V47
 * (IDLE_ADVENTURE_ZONES, id en chaîne). Pire : marquerRencontreBestiaireSorealIdle_
 * (l'écriture de "rencontres" pour ce catalogue) n'est jamais appelée par
 * le vrai chemin de combat actuel (rollKill/startZoneFight) — seulement
 * par un "combat auto" légataire injoignable depuis l'UI actuelle. Le
 * Bestiaire Aventure ne pouvait donc RIEN découvrir.
 *
 * Reconstruit pour lire directement s.zone.kills/bossKills (la vraie
 * source de vérité du combat Aventure réel, idle-adventure-v47.js) et les
 * vrais noms de zone déjà affichés au joueur (IDLE_ADVENTURE_ZONES.name),
 * jamais un nom générique inventé.
 *
 * V2 (2026-09-15, Norman : "tous les ennemis rencontrés en aventure
 * n'apparaissent pas dans collection... j'ai rencontré au moins 1 boss et
 * 2 mobs" alors que Collection n'en montrait que 2) — kills/bossKills
 * n'incrémentent qu'en cas de VICTOIRE (rollKill), jamais pour une simple
 * rencontre (combat perdu ou fui), malgré le libellé "👁️ rencontre(s)"
 * affiché à l'écran. Bascule sur zone.encounters/bossEncounters, un
 * nouveau compteur incrémenté dans startZoneFight dès le début du combat
 * — kills/bossKills gardent leur rôle inchangé ailleurs (tirage du boss).
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// --- Verrous structurels ---
assert.ok(
  source.includes('import {\n  IDLE_ADVENTURE_ZONES,\n  normalizeIdleAdventureStateV47\n} from "./idle-adventure-v47.js";'),
  "Le vrai catalogue de zones V47 doit être importé, pas reconstruit séparément."
);
assert.ok(
  source.includes("adventureStateBestiaireV1") && source.includes("zoneEncountersBestiaireV1") && source.includes("zoneBossEncountersBestiaireV1"),
  "La construction du Bestiaire Aventure doit lire les vraies rencontres V47 (zone.encounters/bossEncounters), pas seulement les victoires (kills/bossKills)."
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
  "      });\n    });\n"
);

// --- Comportement réel : exécution du vrai code extrait, jamais une réimplémentation ---
function buildEntries(rawAdventureState) {
  const entrees = [];
  const stats = { metaNgu: { adventure: rawAdventureState } };
  const fn = new Function(
    "IDLE_ADVENTURE_ZONES", "normalizeIdleAdventureStateV47", "nombreSorealIdle_", "stats", "entrees",
    block
  );
  fn(IDLE_ADVENTURE_ZONES, normalizeIdleAdventureStateV47, (v, d) => (Number.isFinite(+v) ? +v : d), stats, entrees);
  return entrees;
}

// --- Joueur neuf : rien découvert, tout masqué ---
{
  const entrees = buildEntries(null);
  // 14 zones réelles (safe exclue) x 2 (mob + boss) = 28 entrées.
  const zonesReelles = IDLE_ADVENTURE_ZONES.filter(z => z.id !== "safe");
  assert.equal(entrees.length, zonesReelles.length * 2, "Deux entrées (mob + gardien) par vraie zone V47, jamais la zone 'safe'.");
  assert.ok(entrees.every(e => e.decouvert === false && e.nom === "???????"), "Rien n'est découvert pour un joueur neuf — tout masqué.");
  assert.ok(entrees.every(e => typeof e.zone === "string" && e.zone.length > 0), "Chaque entrée doit porter le vrai id de zone V47 (chaîne), jamais un zoneId numérique légataire.");
}

// --- Un mob rencontré dans une zone précise débloque SEULEMENT l'entrée mob de cette zone ---
{
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: { encounters: { sewers: 3 }, bossEncounters: {} }
  };
  const entrees = buildEntries(rawState);
  const sewersMob = entrees.find(e => e.zone === "sewers" && e.boss === 0);
  const sewersBoss = entrees.find(e => e.zone === "sewers" && e.boss === 1);
  const forestMob = entrees.find(e => e.zone === "forest" && e.boss === 0);

  assert.equal(sewersMob.decouvert, true, "3 rencontres dans sewers doit découvrir l'entrée mob de sewers.");
  assert.equal(sewersMob.rencontres, 3);
  assert.equal(sewersMob.nom, IDLE_ADVENTURE_ZONES.find(z => z.id === "sewers").name, "Le nom affiché doit être le VRAI nom de zone déjà utilisé dans le jeu (ex. 'Biobox maudites'), jamais un nom générique.");
  assert.equal(sewersBoss.decouvert, false, "Rencontrer des mobs normaux ne doit jamais débloquer le gardien de zone tant qu'il n'a pas été rencontré séparément.");
  assert.equal(forestMob.decouvert, false, "Une autre zone non visitée doit rester verrouillée.");
}

// --- Un boss de zone rencontré débloque SEULEMENT l'entrée gardien, avec le bon flag pour l'image R2 ---
{
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: { encounters: { tutorial: 10 }, bossEncounters: { tutorial: 1 } }
  };
  const entrees = buildEntries(rawState);
  const tutorialBoss = entrees.find(e => e.zone === "tutorial" && e.boss === 1);
  assert.equal(tutorialBoss.decouvert, true);
  assert.equal(tutorialBoss.categorie, "Gardien de zone");
  assert.equal(tutorialBoss.boss, 1, "Le flag boss=1 doit être exposé pour construire l'URL R2 /api/idle/media/mob?boss=1.");
}

// --- Norman (2026-09-15) : une rencontre PERDUE ou FUIE doit quand même être découverte ---
{
  // kills/bossKills restent à 0 (aucune victoire) alors que les vraies
  // rencontres (startZoneFight) sont bien à 1 — c'est exactement le
  // scénario signalé : combat livré mais pas gagné.
  const rawState = {
    version: IDLE_ADVENTURE_V47,
    zone: {
      kills: {},
      bossKills: {},
      encounters: { tutorial: 2 },
      bossEncounters: { tutorial: 1 }
    }
  };
  const entrees = buildEntries(rawState);
  const tutorialMob = entrees.find(e => e.zone === "tutorial" && e.boss === 0);
  const tutorialBoss = entrees.find(e => e.zone === "tutorial" && e.boss === 1);
  assert.equal(tutorialMob.decouvert, true, "Un mob rencontré (même sans victoire) doit apparaître dans Collection.");
  assert.equal(tutorialMob.rencontres, 2);
  assert.equal(tutorialBoss.decouvert, true, "Un boss rencontré (même sans victoire) doit apparaître dans Collection.");
}

console.log("idle-bestiaire-aventure-v47-rebuild: OK");
