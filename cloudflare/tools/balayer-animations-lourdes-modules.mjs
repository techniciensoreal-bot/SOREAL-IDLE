// Balayage : liste les @keyframes dont les propriétés ne sont pas du compositeur
// (transform, opacity, scale, rotate, translate) et qui servent dans une animation `infinite`.
// Usage : node cloudflare/tools/balayer-animations-lourdes-modules.mjs   (code 1 s'il en reste)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'modules');
const OK = new Set(['transform', 'opacity', 'scale', 'rotate', 'translate', 'offset-distance']);
const out = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const re = /@keyframes\s+([\w-]+)\s*\{/g; let m;
  while ((m = re.exec(src))) {
    let i = re.lastIndex, d = 1;
    while (i < src.length && d) { const c = src[i++]; if (c === '{') d++; else if (c === '}') d--; }
    const body = src.slice(re.lastIndex, i);
    const props = new Set();
    for (const p of body.matchAll(/([a-z-]+)\s*:/g)) props.add(p[1]);
    const lourdes = [...props].filter(p => !OK.has(p));
    if (!lourdes.length) continue;
    const nom = m[1];
    const infinite = new RegExp('animation(?:-name)?\\s*:[^;\'"}]*\\b' + nom + '\\b[^;\'"}]*infinite|animation[^;\'"}]*infinite[^;\'"}]*\\b' + nom + '\\b').test(src);
    if (infinite) out.push(f + ' ' + nom + ' -> ' + lourdes.join(','));
  }
}
console.log(out.join('\n') || 'aucune');
process.exit(out.length ? 1 : 0);
