/* Analyse d'un module ES (fichier serveur, outil des tests _src-sources.mjs) : instructions de premier niveau, noms, références, importations, exports. */
import { readFileSync } from 'node:fs';
import { tokenize, lineIndex } from './_js-scan.mjs';

export function analyzeEsm(path, texteForce) {
  const raw = texteForce !== undefined ? texteForce : readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  const src = raw.replace(/\r\n/g, '\n');
  const toks = tokenize(src);
  const lineOf = lineIndex(src);
  const depthAt = new Array(toks.length); const match = new Array(toks.length).fill(-1);
  const stack = []; let d = 0;
  toks.forEach((t, i) => {
    const isOpen = (t.t === 'p' && '({['.includes(t.v)) || (t.t === 'tpl' && t.open);
    const isClose = (t.t === 'p' && ')}]'.includes(t.v)) || (t.t === 'tpl' && t.cont);
    if (isClose) { d--; const o = stack.pop(); match[i] = o; match[o] = i; }
    depthAt[i] = d;
    if (isOpen) { stack.push(i); d++; }
  });
  const isP = (i, v) => toks[i] && toks[i].t === 'p' && toks[i].v === v;
  const isKw = (i, v) => toks[i] && toks[i].t === 'kw' && toks[i].v === v;
  const isId = (i, v) => toks[i] && toks[i].t === 'id' && toks[i].v === v;
  const N = toks.length;
  function stmtEnd(i) {
    const t = toks[i];
    const apres = (k) => (isP(k, '{') ? match[k] : stmtEnd(k));
    if (isId(i, 'export')) return stmtEnd(i + (isKw(i + 1, 'default') ? 2 : 1));
    if (isKw(i, 'function') || (isId(i, 'async') && isKw(i + 1, 'function'))) {
      let j = i; while (!isP(j, '(')) j++; j = match[j] + 1; while (!isP(j, '{')) j++; return match[j];
    }
    if (isKw(i, 'class')) { let j = i; while (!isP(j, '{')) j++; return match[j]; }
    if (isKw(i, 'if')) { let j = match[i + 1] + 1; let e = apres(j); while (isKw(e + 1, 'else')) { let k = e + 2; if (isKw(k, 'if')) k = match[k + 1] + 1; e = apres(k); } return e; }
    if ((isKw(i, 'for') || isKw(i, 'while')) && isP(i + 1, '(')) return apres(match[i + 1] + 1);
    if (isKw(i, 'try')) { let e = match[i + 1]; if (isKw(e + 1, 'catch')) { let k = e + 2; if (isP(k, '(')) k = match[k] + 1; e = match[k]; } if (isKw(e + 1, 'finally')) e = match[e + 2]; return e; }
    if (isKw(i, 'switch')) return match[match[i + 1] + 1];
    if (isKw(i, 'do')) { let e = apres(i + 1); const k = e + 2; e = match[k]; if (isP(e + 1, ';')) e++; return e; }
    if (isP(i, '{')) { // bloc ou « export { … } » géré plus haut ; ici bloc seul
      return match[i];
    }
    let j = i;
    while (j < N) {
      if (isP(j, ';') && depthAt[j] === 0) return j;
      if (j > i && depthAt[j] === 0 && (isKw(j, 'function') || isKw(j, 'const') || isKw(j, 'let') || isKw(j, 'var') || isKw(j, 'class') || isId(j, 'export') || isId(j, 'import')) && lineOf(toks[j].s) > lineOf(toks[j - 1].e - 1)) return j - 1;
      j++;
    }
    return N - 1;
  }
  const stmts = [];
  let i = 0;
  while (i < N) {
    let e;
    if (isId(i, 'import') && !isP(i + 1, '(') && !isP(i + 1, '.')) { e = i; while (e < N && !isP(e, ';')) { if (toks[e].t === 'str' && isId(e - 1, 'from')) { if (isP(e + 1, ';')) e++; break; } e++; } }
    else if (isId(i, 'export') && isP(i + 1, '{')) { e = match[i + 1]; if (isId(e + 1, 'from')) e += 2; if (isP(e + 1, ';')) e++; }
    else if (isId(i, 'export') && isP(i + 1, '*')) { e = i; while (!isP(e, ';')) e++; }
    else e = stmtEnd(i);
    const st = { ti: i, te: e, kind: 'stmt', names: [], exported: false };
    let k = i;
    if (isId(k, 'import') && !isP(k + 1, '(') && !isP(k + 1, '.')) { st.kind = 'import'; }
    else if (isId(k, 'export') && (isP(k + 1, '{') || isP(k + 1, '*'))) { st.kind = 'reexport'; }
    else {
      if (isId(k, 'export')) { st.exported = true; k++; if (isKw(k, 'default')) { st.kind = 'default'; k = -1; } }
      if (k >= 0) {
        if (isKw(k, 'function') && toks[k + 1] && toks[k + 1].t === 'id') { st.kind = 'function'; st.names = [toks[k + 1].v]; }
        else if (isId(k, 'async') && isKw(k + 1, 'function') && toks[k + 2].t === 'id') { st.kind = 'function'; st.names = [toks[k + 2].v]; }
        else if (isKw(k, 'class') && toks[k + 1].t === 'id') { st.kind = 'class'; st.names = [toks[k + 1].v]; }
        else if (isKw(k, 'const') || isKw(k, 'let') || isKw(k, 'var')) {
          st.kind = 'var'; st.decl = toks[k].v; const names = [];
          if (toks[k + 1].t === 'id') { names.push(toks[k + 1].v); for (let q = k + 2; q <= e; q++) if (isP(q, ',') && depthAt[q] === 0 && toks[q + 1].t === 'id') names.push(toks[q + 1].v); }
          else names.push('?');
          st.names = names;
        }
      }
    }
    st.declTi = (st.exported && st.kind !== 'default') ? i + 1 : i; // premier jeton de la déclaration (sans « export »)
    st.s = toks[i].s; st.e = toks[e].e;
    stmts.push(st); i = e + 1;
  }
  const lines = src.split('\n'); const off = [0]; for (const l of lines) off.push(off[off.length - 1] + l.length + 1);
  const estCom = (l) => /^\s*(\/\*|\*|\*\/)/.test(l) || /^\s*\/\*.*\*\/\s*$/.test(l) || /^\s*\/\//.test(l);
  /* Début de texte d'une instruction : on remonte sur les commentaires collés au-dessus (blocs multi-lignes compris, aucune ligne vide entre eux). */
  const debutLigne = (pos) => src.lastIndexOf('\n', pos - 1) + 1;
  const remonter = (s) => {
    let pos = debutLigne(s);
    for (;;) {
      if (pos <= 0) return 0;
      const finPrec = pos - 1; const debPrec = src.lastIndexOf('\n', finPrec - 1) + 1;
      const ligne = src.slice(debPrec, finPrec).trim();
      if (ligne.startsWith('//')) { pos = debPrec; continue; }
      if (ligne.endsWith('*/')) {
        const i = src.lastIndexOf('/*', finPrec);
        if (i < 0 || src.slice(debutLigne(i), i).trim() !== '') return pos;
        pos = debutLigne(i); continue;
      }
      return pos;
    }
  };
  stmts.forEach((st) => {
    const l0 = lineOf(st.s); const avant = src.slice(off[l0], st.s); const premier = avant.trim() === '';
    st.startOff = premier ? remonter(st.s) : st.s;
    const c0 = lineOf(st.startOff);
    const l1 = lineOf(st.e - 1); const apres = src.slice(st.e, off[l1 + 1] - 1);
    st.endOff = apres.trim() === '' ? Math.min(off[l1 + 1], src.length) : st.e;
    st.startLine = c0; st.endLine = l1;
  });
  // références
  const nameIdx = new Map();
  stmts.forEach((st, k) => st.names.forEach((n) => { if (n !== '?' && !nameIdx.has(n)) nameIdx.set(n, k); }));
  function isRefToken(k) {
    const t = toks[k]; if (t.t !== 'id') return false;
    const p = toks[k - 1]; if (p && p.t === 'p' && (p.v === '.' || p.v === '?.')) return false;
    const nx = toks[k + 1];
    if (nx && nx.t === 'p' && nx.v === ':' && p && p.t === 'p' && (p.v === '{' || p.v === ',')) {
      let o = k - 1, dd = 0; for (let m = k - 1; m >= 0; m--) { const tt = toks[m]; if (tt.t === 'p' && ')}]'.includes(tt.v)) dd++; else if (tt.t === 'p' && '({['.includes(tt.v)) { if (dd === 0) { o = m; break; } dd--; } }
      if (toks[o].v === '{') return false;
    }
    return true;
  }
  stmts.forEach((st) => { st.refs = new Set(); st.refNames = new Set(); if (st.kind === 'import') return; for (let k = st.ti; k <= st.te; k++) if (isRefToken(k)) { st.refNames.add(toks[k].v); const j = nameIdx.get(toks[k].v); if (j !== undefined) st.refs.add(j); } });
  stmts.forEach((st, k) => st.refs.delete(k));
  const refBy = stmts.map(() => new Set());
  stmts.forEach((st, k) => st.refs.forEach((m) => refBy[m].add(k)));
  // importations : nom local -> { indice d'instruction, texte du spécificateur, source }
  const importes = new Map();
  stmts.forEach((st, idx) => {
    if (st.kind !== 'import') return;
    const t0 = st.ti; const sourceTok = toks[st.te].t === 'str' ? toks[st.te] : toks[st.te - 1];
    const source = sourceTok.v.slice(1, -1);
    // import X from / import {a as b, c} from / import * as ns from
    let k = t0 + 1;
    if (toks[k].t === 'id' && !isP(k, '{') && toks[k].v !== 'type') { importes.set(toks[k].v, { idx, spec: 'default:' + toks[k].v, source }); k++; if (isP(k, ',')) k++; }
    if (isP(k, '*')) { const ns = toks[k + 2].v; importes.set(ns, { idx, spec: '*:' + ns, source }); }
    else if (isP(k, '{')) { for (let q = k + 1; q < match[k]; q++) { if (toks[q].t === 'id') { if (isId(q + 1, 'as')) { importes.set(toks[q + 2].v, { idx, spec: toks[q].v + ' as ' + toks[q + 2].v, source }); q += 2; } else if (!isP(q - 1, '.')) importes.set(toks[q].v, { idx, spec: toks[q].v, source }); } } }
  });
  return { raw, crlf, src, toks, depthAt, match, stmts, refBy, nameIdx, isRefToken, importes, lineOf };
}
