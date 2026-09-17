/*
 * Parseur du miroir local du wiki NGU Idle (Norman, 2026-09-17) :
 * "il y a une COMPLETE LOCAL MIRROR de tout le wiki déjà sur le disque
 * ... plus de mystère sur les stats, plus besoin de naviguer le wiki en
 * direct." Ce module lit chaque page JSON de C:\Users\n0rma\Documents\
 * NGU-Wiki\pages (export brut de l'API MediaWiki, un fichier par page,
 * revisions[0].slots.main["*"] = le wikitext source) et en extrait les
 * templates {{Enemy|...}} sous forme structurée.
 *
 * Réutilisable : exporté comme module ES (utilisé par les tests et par
 * les scripts build-idle-*.mjs de ce dossier) ET exécutable en CLI :
 *
 *   node design/parse-ngu-wiki.mjs [dossierPages] [sortieJson]
 *
 * Par défaut, dossierPages = C:\Users\n0rma\Documents\NGU-Wiki\pages et
 * sortieJson = design/ngu-wiki-enemies-v1.json.
 *
 * Ne devine jamais une valeur manquante ou malformée : une page dont le
 * template Enemy ne contient pas au moins location/type/hp est ignorée
 * (listée dans `skipped`), jamais complétée par une valeur inventée.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_PAGES_DIR = 'C:\\Users\\n0rma\\Documents\\NGU-Wiki\\pages';
const DEFAULT_OUTPUT = new URL('./ngu-wiki-enemies-v1.json', import.meta.url);

/*
 * Extrait le bloc complet {{NomTemplate ... }} d'un wikitext, en comptant
 * la profondeur des accolades {{ }} pour trouver la VRAIE fermeture (pas
 * la première occurrence de "}}", qui peut apparaître dans un template
 * imbriqué avant la fin du template recherché).
 */
export function extractTemplateBlock(wikitext, templateName) {
  const re = new RegExp('\\{\\{\\s*' + templateName + '\\b', 'i');
  const m = re.exec(wikitext);
  if (!m) return null;

  let depth = 0;
  for (let i = m.index; i < wikitext.length; i++) {
    if (wikitext.startsWith('{{', i)) {
      depth++;
      i++;
    } else if (wikitext.startsWith('}}', i)) {
      depth--;
      i++;
      if (depth === 0) {
        return wikitext.slice(m.index, i + 1);
      }
    }
  }
  return null; // Template jamais refermé (page tronquée/corrompue) : jamais deviner.
}

/*
 * Découpe les paramètres d'un bloc de template en respectant la
 * profondeur : un "|" à l'intérieur d'un lien wiki [[Page|Affichage]] ou
 * d'un sous-template {{...}} n'est PAS un séparateur de paramètre.
 */
export function splitTemplateParams(templateBlock) {
  // Retire les accolades englobantes {{ }} et le nom du template.
  const inner = templateBlock.slice(2, -2);
  const firstPipe = inner.indexOf('|');
  if (firstPipe === -1) return [];
  const body = inner.slice(firstPipe + 1);

  const params = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      current += two;
      i++;
      continue;
    }
    if (two === '}}' || two === ']]') {
      depth = Math.max(0, depth - 1);
      current += two;
      i++;
      continue;
    }
    if (body[i] === '|' && depth === 0) {
      params.push(current);
      current = '';
      continue;
    }
    current += body[i];
  }
  if (current.length) params.push(current);

  const out = [];
  for (const raw of params) {
    const eq = raw.indexOf('=');
    if (eq === -1) continue; // Paramètre positionnel sans clé : jamais utilisé par {{Enemy}}.
    const key = raw.slice(0, eq).trim().toLowerCase();
    const value = raw.slice(eq + 1).trim();
    if (key) out.push({ key, value });
  }
  return out;
}

/*
 * Déballe un lien wiki [[Page]] ou [[Page|Affichage]] -> "Affichage" (ou
 * "Page" si pas d'affichage distinct). Laisse toute autre valeur telle
 * quelle (apostrophes wiki '' '''  retirées si présentes en tête/fin).
 */
export function unwrapWikiText(value) {
  if (value == null) return '';
  let v = String(value).trim();
  const link = /^\[\[([^\]]+)\]\]$/.exec(v);
  if (link) {
    const parts = link[1].split('|');
    v = parts.length > 1 ? parts[1] : parts[0];
  }
  return v.trim();
}

/*
 * Parse un nombre NGU, y compris la notation scientifique du wiki
 * ("5.000E+04", "1.984E+36"). Renvoie {raw, value} : `value` est null si
 * la chaîne ne commence pas par un nombre reconnaissable (ex. bf_exp
 * porte souvent une annotation texte, "0 (2 first time ever)" — dans ce
 * cas `value` capture quand même le nombre EN TÊTE de la chaîne, la
 * chaîne complète restant disponible via `raw`).
 */
export function parseNguNumber(raw) {
  const str = String(raw == null ? '' : raw).trim();
  const m = /^[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/.exec(str);
  if (!m) return { raw: str, value: null };
  const value = Number(m[0]);
  return { raw: str, value: Number.isFinite(value) ? value : null };
}

const ENEMY_FIELD_KEYS = [
  'location', 'type', 'attack_rate', 'power', 'toughness', 'hp_regen', 'hp',
  'bf_number', 'bf_exp', 'bf_power', 'bf_toughness', 'bf_hp_regen', 'bf_hp',
  'bf_next', 'bf_prev', 'boss'
];

/*
 * Parse le wikitext d'une page en une entrée Enemy structurée, ou null si
 * la page ne contient aucun template {{Enemy}} exploitable. `title` sert
 * uniquement à l'identification (nom réel NGU de la page).
 */
export function parseEnemyWikitext(wikitext, title) {
  const block = extractTemplateBlock(wikitext, 'Enemy');
  if (!block) return null;

  const params = {};
  for (const { key, value } of splitTemplateParams(block)) {
    if (ENEMY_FIELD_KEYS.includes(key)) params[key] = value;
  }

  const attackRate = parseNguNumber(params.attack_rate);
  const power = parseNguNumber(params.power);
  const toughness = parseNguNumber(params.toughness);
  const hpRegen = parseNguNumber(params.hp_regen);
  const hp = parseNguNumber(params.hp);
  const hasBossFight = params.bf_number != null;

  /*
   * Certaines fiches n'ont QUE l'onglet Boss Fight (ex. Fast Zombie,
   * Moneybags, DEFEAT : aucune apparition en Adventure Mode, jamais
   * location/hp) ; d'autres n'ont QUE l'onglet Adventure sans être dans
   * la séquence Boss Fight (ex. Priest of Exile). Une entrée n'est
   * ignorée que si elle ne porte STRICTEMENT AUCUNE donnée exploitable
   * (template présent mais vide/vandalisé) -- jamais sur la seule
   * absence de location ou de hp, qui sont chacun légitimement absents
   * selon le type de fiche.
   */
  if (!hasBossFight && hp.value == null && power.value == null) return null;
  const bfNumber = hasBossFight ? parseNguNumber(params.bf_number) : null;
  const bfPower = hasBossFight ? parseNguNumber(params.bf_power) : null;
  const bfToughness = hasBossFight ? parseNguNumber(params.bf_toughness) : null;
  const bfHpRegen = hasBossFight ? parseNguNumber(params.bf_hp_regen) : null;
  const bfHp = hasBossFight ? parseNguNumber(params.bf_hp) : null;

  return {
    title: String(title || '').trim(),
    location: params.location != null ? unwrapWikiText(params.location) : null,
    type: params.type ? unwrapWikiText(params.type) : (hasBossFight || hp.value != null ? 'normal' : null),
    isAdventureBoss: String(params.boss || '').trim().toLowerCase() === 'yes',
    attackRate: attackRate.value,
    power: power.value,
    toughness: toughness.value,
    hpRegen: hpRegen.value,
    hp: hp.value,
    bfNumber: bfNumber ? bfNumber.value : null,
    // bf_exp reste une chaîne brute : porte parfois une annotation texte
    // ("0 (2 first time ever)"), jamais tronquée à son seul préfixe
    // numérique -- mais bfExpValue expose ce préfixe pour un usage direct.
    bfExp: hasBossFight && params.bf_exp != null ? String(params.bf_exp).trim() : null,
    bfExpValue: hasBossFight && params.bf_exp != null ? parseNguNumber(params.bf_exp).value : null,
    bfPower: bfPower ? bfPower.value : null,
    bfToughness: bfToughness ? bfToughness.value : null,
    bfHpRegen: bfHpRegen ? bfHpRegen.value : null,
    bfHp: bfHp ? bfHp.value : null,
    bfNext: params.bf_next != null ? unwrapWikiText(params.bf_next) : null,
    bfPrev: params.bf_prev != null ? unwrapWikiText(params.bf_prev) : null
  };
}

/*
 * Extrait titre + wikitext bruts d'un objet JSON de page (export API
 * MediaWiki, forme query.pages.<id>.revisions[0].slots.main["*"]).
 */
export function extractPageWikitext(pageJson) {
  const pages = pageJson && pageJson.query && pageJson.query.pages;
  if (!pages) return null;
  const id = Object.keys(pages)[0];
  const page = id != null ? pages[id] : null;
  const rev = page && page.revisions && page.revisions[0];
  const wikitext = rev && rev.slots && rev.slots.main && rev.slots.main['*'];
  if (wikitext == null) return null;
  return { title: page.title || '', wikitext };
}

/*
 * Parse tout un dossier de pages exportées. Renvoie {parsed, skipped} :
 * `skipped` liste chaque fichier ignoré avec la raison exacte (jamais un
 * échec silencieux).
 */
export function parsePagesDirectory(pagesDir) {
  const files = readdirSync(pagesDir).filter(f => f.toLowerCase().endsWith('.json'));
  const parsed = [];
  const skipped = [];

  for (const file of files) {
    let json;
    try {
      json = JSON.parse(readFileSync(pagesDir + '\\' + file, 'utf8'));
    } catch (e) {
      skipped.push({ file, reason: 'JSON_PARSE_ERROR: ' + e.message });
      continue;
    }

    const extracted = extractPageWikitext(json);
    if (!extracted) {
      skipped.push({ file, reason: 'NO_WIKITEXT' });
      continue;
    }

    if (!/\{\{\s*Enemy\b/i.test(extracted.wikitext)) {
      continue; // Page normale (item, set, zone...) : pas une erreur, juste hors périmètre Enemy.
    }

    const entry = parseEnemyWikitext(extracted.wikitext, extracted.title);
    if (!entry) {
      skipped.push({ file, reason: 'ENEMY_TEMPLATE_INCOMPLETE (location/hp manquant ou template non refermé)' });
      continue;
    }

    parsed.push(entry);
  }

  parsed.sort((a, b) => {
    const an = a.bfNumber == null ? Infinity : a.bfNumber;
    const bn = b.bfNumber == null ? Infinity : b.bfNumber;
    if (an !== bn) return an - bn;
    return a.title.localeCompare(b.title);
  });

  return { parsed, skipped };
}

function isMainModule() {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
  } catch (e) {
    return false;
  }
}

if (isMainModule()) {
  const pagesDir = process.argv[2] || DEFAULT_PAGES_DIR;
  const outputArg = process.argv[3];
  const outputUrl = outputArg ? undefined : DEFAULT_OUTPUT;
  const outputPath = outputArg || fileURLToPath(DEFAULT_OUTPUT);

  const { parsed, skipped } = parsePagesDirectory(pagesDir);

  writeFileSync(outputPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');

  const byLocation = new Map();
  for (const e of parsed) byLocation.set(e.location, (byLocation.get(e.location) || 0) + 1);

  console.log('Pages Enemy parsées avec succès :', parsed.length);
  console.log('Pages ignorées :', skipped.length);
  console.log('Répartition par zone (location wiki) :');
  for (const [loc, count] of [...byLocation.entries()].sort((a, b) => b[1] - a[1])) {
    console.log('  ' + loc + ' : ' + count);
  }
  if (skipped.length) {
    console.log('Détail des pages ignorées :');
    for (const s of skipped) console.log('  ' + s.file + ' -> ' + s.reason);
  }
  console.log('Écrit dans :', outputPath);
}
