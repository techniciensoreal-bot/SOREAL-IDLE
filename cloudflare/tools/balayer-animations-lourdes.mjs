// Liste les @keyframes dont les propriétés ne sont pas compositeur (transform/opacity/scale/rotate/translate) et qui servent dans une animation infinie.
// Usage : node cloudflare/tools/balayer-animations-lourdes.mjs fichier.css [...]
import fs from 'node:fs';
const OK = new Set(['transform', 'opacity', 'scale', 'rotate', 'translate', 'animation-timing-function']);
for (const f of process.argv.slice(2)) {
  const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const kf = {};
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    let i = re.lastIndex, d = 1;
    while (d && i < css.length) { const c = css[i++]; if (c === '{') d++; else if (c === '}') d--; }
    const corps = css.slice(re.lastIndex, i - 1);
    const props = new Set();
    for (const b of corps.matchAll(/\{([^{}]*)\}/g)) for (const p of b[1].split(';')) { const n = p.split(':')[0].trim(); if (n) props.add(n); }
    kf[m[1]] = [...props];
  }
  const out = [];
  for (const [nom, props] of Object.entries(kf)) {
    const lourdes = props.filter((p) => !OK.has(p));
    if (!lourdes.length) continue;
    const inf = new RegExp('animation[^;{}]*\\b' + nom + '\\b[^;{}]*infinite|animation[^;{}]*infinite[^;{}]*\\b' + nom + '\\b').test(css);
    if (inf) out.push(nom + ' : ' + lourdes.join(', '));
  }
  console.log(f + '\n  ' + (out.join('\n  ') || '(aucune)'));
}
