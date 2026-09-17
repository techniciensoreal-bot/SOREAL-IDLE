/*
 * Régénère IDLE_ADVENTURE_MOB_BESTIARY_V1 (cloudflare/src/idle-adventure-v47.js)
 * à partir du miroir local du wiki NGU Idle (Norman, 2026-09-17 : "copie
 * absolument tout dans le jeu... plus besoin de naviguer le wiki en
 * direct"), via le parseur design/parse-ngu-wiki.mjs.
 *
 * La version V1 de ce bestiaire (2026-09-17, plus tôt le même jour) avait
 * été construite à la main, page wiki par page wiki, pour seulement 8 des
 * 15 zones jouables (tutorial/sewers/forest/sky/hsb/clock/2d + cave
 * partielle, 3 des 16 ennemis réels). Cette V2 couvre les 15 zones au
 * complet (tutorial -> chocolate), directement depuis le miroir local --
 * la disponibilité de CE miroir est précisément ce qui change ici.
 *
 * Utilisation : node design/build-idle-adventure-bestiary-v2.mjs
 * (réécrit cloudflare/src/idle-adventure-v47.js en place, uniquement le
 * bloc IDLE_ADVENTURE_MOB_BESTIARY_V1 -- rien d'autre dans ce fichier
 * n'est touché).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { parsePagesDirectory } from './parse-ngu-wiki.mjs';

const PAGES_DIR = 'C:\\Users\\n0rma\\Documents\\NGU-Wiki\\pages';
const TARGET_FILE = new URL('../cloudflare/src/idle-adventure-v47.js', import.meta.url);

// Zone SOREAL (IDLE_ADVENTURE_ZONES) -> nom réel de la zone sur le wiki
// NGU (champ `location` du template {{Enemy}}). Seules les 15 zones
// jouables de ce moteur (IDLE_ADVENTURE_ZONES, hors "safe") ont une
// entrée ici -- toutes les autres zones/mondes présents dans le miroir
// (Rad-Lands, Evilverse, Construction Zone, etc.) sont réels mais ne
// correspondent à AUCUNE zone jouable ici, donc ignorés par ce script
// (pas d'endroit où les mettre sans construire de nouvelles zones,
// explicitement hors du périmètre Phase 1 demandé par Norman).
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
  chocolate: 'Chocolate World'
};

function jsNumber(n) {
  if (n == null || !Number.isFinite(n)) return '0';
  return String(n);
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
    const normal = mobs.filter(m => !m.isAdventureBoss);
    const boss = mobs.filter(m => m.isAdventureBoss);
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
