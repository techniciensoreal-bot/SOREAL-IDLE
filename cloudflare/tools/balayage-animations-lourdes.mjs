// Balayage : liste les @keyframes dont une propriete n'est pas composee (transform/opacity/scale/rotate/translate)
// ET qui sont utilises avec `infinite`. Usage : node cloudflare/tools/balayage-animations-lourdes.mjs [fichier.css ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const OK = new Set(['transform', 'opacity', 'scale', 'rotate', 'translate', 'offset-distance', 'transform-origin']);
export function balayer(css) {
  const kf = {};
  const re = /@keyframes\s+([\w-]+)\s*\{/g; let m;
  while ((m = re.exec(css))) {
    let i = re.lastIndex, d = 1;
    while (i < css.length && d) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
    const corps = css.slice(re.lastIndex, i - 1);
    const props = new Set();
    for (const b of corps.matchAll(/\{([^{}]*)\}/g)) for (const decl of b[1].split(';')) { const p = decl.split(':')[0].trim().toLowerCase(); if (p && !p.startsWith('animation-timing')) props.add(p); }
    kf[m[1]] = [...props];
  }
  const res = [];
  for (const [nom, props] of Object.entries(kf)) {
    const lourdes = props.filter((p) => !OK.has(p));
    if (!lourdes.length) continue;
    const usage = new RegExp('animation(?:-name)?\\s*:[^;}]*\\b' + nom + '\\b[^;}]*', 'g');
    const infinies = (css.match(usage) || []).filter((u) => /infinite/.test(u) || /animation-name/.test(u));
    if (infinies.length) res.push({ nom, lourdes });
  }
  return res;
}
if (process.argv[1] && process.argv[1].endsWith('balayage-animations-lourdes.mjs')) {
  const fichiers = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => path.join(dir, f));
  for (const f of fichiers) for (const r of balayer(fs.readFileSync(f, 'utf8'))) console.log(path.basename(f) + '\t' + r.nom + '\t' + r.lourdes.join(','));
}
