/*
 * Régénère IDLE_ADVENTURE_MOB_BESTIARY_V1 (cloudflare/src/idle-adventure-v47.js)
 * à partir du miroir local du wiki NGU Idle (Norman, 2026-09-17 : "copie
 * absolument tout dans le jeu... plus besoin de naviguer le wiki en
 * direct"), via le parseur design/parse-ngu-wiki.mjs.
 *
 * La version V1 de ce bestiaire (2026-09-17, plus tôt le même jour) avait
 * été construite à la main, page wiki par page wiki, pour seulement 8 des
 * 15 zones jouables (tutorial/sewers/forest/sky/hsb/clock/2d + cave
 * partielle, 3 des 16 ennemis réels). La V2 (même jour) a couvert les 15
 * zones "Normal" au complet (tutorial -> chocolate).
 *
 * V3 (2026-09-18, Norman : "tu peux faire pareil mais pour les mobs
 * aventure maintenant" -- suite de l'audit des boss) : ajoute les 17
 * zones Evil/Sadistic (IDLE_ADVENTURE_ZONES, ajoutées le même jour) au
 * ZONE_MAP -- le miroir local les contenait déjà (confirmé via
 * `node design/parse-ngu-wiki.mjs` seul, répartition par zone), inutile
 * de retourner naviguer le wiki en direct. 16/17 ont un `location`
 * exploitable (noms EXACTS du champ `location` des fiches {{Enemy}}
 * individuelles, PAS forcément identiques au titre de la page de zone --
 * ex. "Typo Zonw" avec la même coquille que le nom de zone SOREAL,
 * "The Fad-lands" en minuscule contrairement au titre de page "The
 * Fad-Lands"). La 17e, aethereansea ("The Aethereal Sea"), n'a AUCUNE
 * fiche {{Enemy}} individuelle sur le miroir -- sa page de zone est un
 * stub wiki ("{{Stub}}", "It was formerly named 'The Aethereal Sea Part
 * 1' but apparently an intended Part 2 got cancelled") sans ennemis
 * nommés/statés listés ailleurs sur le wiki. Volontairement absente du
 * bestiaire plutôt que devinée -- même principe que les Combats de Boss
 * 184-301 (idle-ngu-boss-reference-v1.js) dont le wiki lui-même ne
 * documente plus les valeurs.
 */

/*
 * ATTENTION (audit zones 2026-09-23) : ne pas relancer tel quel. Le miroir
 * local a depuis perdu ou renommé plusieurs fiches par collision de casse
 * Windows (ex. "KING CIRCLE" remplacé par la redirection "King Circle",
 * "The Slammer" ; "Kitten In a Mech Woman", "EVIL SPIKY HAIRED GUY" en
 * casse différente) : une régénération supprimerait ou renommerait des
 * entrées déjà vérifiées. Comparer d'abord
 * avec git diff et ne garder que les écarts prouvés.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parsePagesDirectory } from './parse-ngu-wiki.mjs';

const PAGES_DIR = 'C:\\Users\\n0rma\\Documents\\NGU-Wiki\\pages';
const TARGET_FILE = new URL('../cloudflare/src/idle-adventure-v47.js', import.meta.url);

// Zone SOREAL (IDLE_ADVENTURE_ZONES) -> nom réel de la zone sur le wiki
// NGU (champ `location` du template {{Enemy}}). Couvre maintenant les 32
// zones de combat (Normal + Evil/Sadistic ; "safe" exclue, aucun combat).
// aethereansea absente : voir commentaire d'en-tête (pas de fiche
// {{Enemy}} individuelle sur le miroir pour cette zone).
const ZONE_MAP = {
  tutorial: 'Tutorial Zone',
  sewers: 'Sewers',
  forest: 'Forest',
  cave: 'Cave of Many Things',
  sky: 'The Sky',
  hsb: 'High Security Base',
  clock: 'Clock Dimension',
  '2d': 'The 2D Universe',
  ancient: 'Ancient Battlefield',
  avsp: 'A Very Strange Place',
  mega: 'Mega Lands',
  beardverse: 'The Beardverse',
  badly: 'Badly Drawn World',
  boring: 'Boring-Ass Earth',
  chocolate: 'Chocolate World',
  evilverse: 'The Evilverse',
  pinkprincess: 'Pretty Pink Princess Land',
  metaland: 'Meta Land',
  interdimensional: 'Interdimensional Party',
  typozone: 'Typo Zonw',
  fadlands: 'The Fad-lands',
  jrpgville: 'JRPGVille',
  radlands: 'The Rad-Lands',
  backtoschool: 'Back To School',
  westworld: 'The West World',
  breadverse: 'The Breadverse',
  seventies: "That 70's Zone",
  halloweenies: 'The Halloweenies',
  construction: 'Construction Zone',
  duckduck: 'DUCK DUCK ZONE',
  netherregions: 'The Nether Regions'
};

/*
 * Audit 2026-09-23 (zones) : une valeur non publiée par le wiki ("?", ex.
 * attack_rate des ennemis de The Rad-Lands) sort désormais `null`, jamais
 * `0` -- un 0 écrit en dur était une valeur inventée (le wiki dit "?").
 */
function jsNumber(n) {
  if (n == null || !Number.isFinite(n)) return 'null';
  return String(n);
}

/*
 * Audit 2026-09-23 (zones) : le statut "boss d'Aventure" ne vient plus
 * seulement de `boss=yes` sur la fiche {{Enemy}} : la section "Enemies" de
 * la page de zone marque chaque boss avec {{BossLink|...}} (icône
 * BossIcon dans le wikitexte étendu). THE OUTLAW / THE SHERIFF (The West
 * World) n'ont pas `boss=yes` sur leur fiche mais sont bien listés en
 * {{BossLink}} sur la page de zone ET dans la colonne "Bosses" du tableau
 * "Adventure Mode Enemies" -- ils étaient classés à tort en normal[].
 */
function zonePageBossTitles(location) {
  const file = PAGES_DIR + '\\' + location.replace(/[<>:"/\\|?*]/g, '_').trim() + '.json';
  let json;
  try { json = JSON.parse(readFileSync(file, 'utf8')); } catch { return new Set(); }
  const text = json.__expandedWikitext || '';
  const start = text.search(/^==\s*Enemies\s*==\s*$/m);
  if (start === -1) return new Set();
  const out = new Set();
  for (const line of text.slice(start).split('\n').slice(1)) {
    if (/^==/.test(line)) break;
    const m = /^\*\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\](.*)$/.exec(line.trim());
    if (m && /BossIcon/.test(m[2])) out.add(m[1].trim().toLowerCase());
  }
  return out;
}

function formatEntry(m) {
  const type = String(m.type || 'normal').trim().toLowerCase();
  return '{name:' + JSON.stringify(m.title) + ',type:' + JSON.stringify(type) +
    ',attackRate:' + jsNumber(m.attackRate) + ',power:' + jsNumber(m.power) +
    ',toughness:' + jsNumber(m.toughness) + ',hpRegen:' + jsNumber(m.hpRegen) +
    ',maxHp:' + jsNumber(m.hp) + '}';
}

function extractObjectLiteralBlock(source, marker) {
  const idx = source.indexOf(marker);
  if (idx === -1) return null;
  const braceStart = source.indexOf('{', idx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        // Inclut l'éventuel `)` de Object.freeze(...) et le `;` final.
        let end = i + 1;
        while (source[end] === ')') end++;
        if (source[end] === ';') end++;
        return { start: idx, end, braceStart, braceEnd: i };
      }
    }
  }
  return null;
}

function run() {
  const { parsed, skipped } = parsePagesDirectory(PAGES_DIR);
  console.log('Wiki : ' + parsed.length + ' entrées Enemy parsées, ' + skipped.length + ' ignorées.');

  const zoneLines = [];
  const summary = [];
  for (const [zoneId, location] of Object.entries(ZONE_MAP)) {
    const mobs = parsed.filter(e => e.location === location && e.hp != null);
    const pageBosses = zonePageBossTitles(location);
    const isBoss = m => m.isAdventureBoss || pageBosses.has(m.title.toLowerCase());
    const normal = mobs.filter(m => !isBoss(m));
    const boss = mobs.filter(isBoss);
    summary.push(zoneId + ': normal=' + normal.length + ' boss=' + boss.length);
    zoneLines.push(
      '  ' + JSON.stringify(zoneId) + ':{normal:[' + normal.map(formatEntry).join(',') +
      '],boss:[' + boss.map(formatEntry).join(',') + ']}'
    );
  }

  const newBlock =
    'export const IDLE_ADVENTURE_MOB_BESTIARY_V1=Object.freeze({\n' +
    zoneLines.join(',\n') +
    '\n});';

  const targetPath = new URL(TARGET_FILE);
  const source = readFileSync(targetPath, 'utf8');
  const found = extractObjectLiteralBlock(source, 'export const IDLE_ADVENTURE_MOB_BESTIARY_V1');
  if (!found) {
    console.error('IDLE_ADVENTURE_MOB_BESTIARY_V1 introuvable dans ' + targetPath + ' -- rien écrit.');
    process.exit(1);
  }

  const updated = source.slice(0, found.start) + newBlock + source.slice(found.end);
  writeFileSync(targetPath, updated, 'utf8');

  console.log('Zones régénérées (mob normal / boss d\'Aventure, sourcé wiki) :');
  for (const line of summary) console.log('  ' + line);
  console.log('Écrit dans : ' + targetPath.pathname.replace(/^\//, ''));
}

run();
