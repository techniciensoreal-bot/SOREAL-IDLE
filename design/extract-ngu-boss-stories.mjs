// Extrait l'histoire (texte narratif) de chaque Combat de Boss (1-301) depuis
// le miroir local du wiki NGU Idle, page "Boss Fights", section "Boss listing".
//
// Structure confirmée dans le wikitext brut : chaque boss a une ligne
// {{Vanchor|N}} (stats/nom/image/exp/reference) suivie IMMEDIATEMENT d'une
// ligne colspan="5" contenant le paragraphe d'histoire de CE boss (jamais
// partagé entre deux boss). Norman (2026-09-18) : "il y a une histoire qui
// se déverrouille... je veux cette petite histoire en dessous du combat
// dans Fight Boss, pour chaque boss, et traduit en français."
//
// Utilisation : node design/extract-ngu-boss-stories.mjs
// Écrit design/ngu-boss-stories-en.json ({id, story} pour chaque boss avec
// une histoire trouvée -- absente plutôt que devinée si aucune histoire
// n'existe pour un ID donné).

import { readFileSync, writeFileSync } from 'node:fs';

const PAGE_PATH = 'C:\\Users\\n0rma\\Documents\\NGU-Wiki\\pages\\Boss Fights.json';
const OUT_PATH = new URL('./ngu-boss-stories-en.json', import.meta.url);

function stripWikiMarkup(raw) {
  let s = String(raw || '');
  // <p style="...">...</p> wrapper
  s = s.replace(/<\/?p[^>]*>/gi, '');
  // [[Link|Display]] -> Display ; [[Link]] -> Link
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // '''bold''' / ''italic''
  s = s.replace(/'''''/g, '').replace(/'''/g, '').replace(/''/g, '');
  // <br />, <br>
  s = s.replace(/<br\s*\/?>/gi, '\n');
  // HTML entities courantes
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // External links [http://... Label] -> Label
  s = s.replace(/\[https?:\/\/[^\s\]]+ ([^\]]+)\]/g, '$1');
  // <strong>/<i>/<nowiki> markup : gardé par le wiki pour la mise en forme
  // ou pour échapper un caractère (ex. <nowiki>*</nowiki> pour un
  // astérisque littéral) -- déballé (contenu conservé, balises retirées),
  // jamais affiché tel quel : histoireBossMarkupIdleV142_ échappe le texte
  // via idleHtml_ (protection XSS), donc une vraie balise HTML ressortirait
  // à l'écran comme du texte littéral "<strong>", pas du gras.
  s = s.replace(/<\/?(?:strong|i|nowiki)>/gi, '');
  return s.trim();
}

const raw = readFileSync(PAGE_PATH, 'utf8');
const page = Object.values(JSON.parse(raw).query.pages)[0];
const text = page.revisions[0].slots.main['*'];

// Ne travailler qu'à partir de la vraie table ("Boss listing"), jamais la
// table récapitulative "Boss fights that unlock things" plus haut dans la
// page (mêmes numéros de boss, aucune histoire).
const tableStart = text.indexOf('Story</p>');
if (tableStart < 0) {
  console.error('Table "Boss listing" introuvable -- abandon.');
  process.exit(1);
}
const tableText = text.slice(tableStart);

const vanchorRe = /\{\{Vanchor\|(\d+)\}\}/g;
const stories = [];
let match;
const positions = [];
while ((match = vanchorRe.exec(tableText))) {
  positions.push({ id: Number(match[1]), index: match.index });
}

for (let i = 0; i < positions.length; i++) {
  const { id, index } = positions[i];
  const nextIndex = i + 1 < positions.length ? positions[i + 1].index : tableText.length;
  const block = tableText.slice(index, nextIndex);
  // La ligne d'histoire : |colspan="5"|<p ...>...</p>  (première occurrence
  // après ce Vanchor, avant le prochain).
  const storyMatch = block.match(/\|\s*colspan="5"\s*\|(.*?)\n\|[-}]/s);
  if (!storyMatch) continue;
  const cleaned = stripWikiMarkup(storyMatch[1]);
  if (cleaned) stories.push({ id, story: cleaned });
}

stories.sort((a, b) => a.id - b.id);
writeFileSync(OUT_PATH, JSON.stringify(stories, null, 2) + '\n', 'utf8');
console.log(`${stories.length}/301 histoires extraites -> ${OUT_PATH.pathname.replace(/^\//, '')}`);
console.log('Exemple boss1:', JSON.stringify(stories.find(s => s.id === 1)));
console.log('Exemple boss301:', JSON.stringify(stories.find(s => s.id === 301)));
const missing = [];
for (let id = 1; id <= 301; id++) if (!stories.some(s => s.id === id)) missing.push(id);
console.log(`${missing.length} boss sans histoire trouvée :`, missing.length <= 30 ? missing.join(',') : missing.slice(0, 30).join(',') + '...');
