/*
 * Petit analyseur JavaScript (jetons) pour extraire des fonctions du frontend dans les tests, sans dépendance externe.
 * Utilisé par _ui-sources.mjs : extraireFonction / extraireDeclaration.
 */
const KW_REGEX_BEFORE = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'do', 'else', 'instanceof', 'yield', 'await']);
const PUNCT3 = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??='];
const PUNCT2 = ['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '**'];
const isIdStart = (c) => /[A-Za-z_$ -￿]/.test(c);
const isIdPart = (c) => /[A-Za-z0-9_$ -￿]/.test(c);

export function tokenize(src) {
  const toks = []; let i = 0; const n = src.length;
  const tplStack = []; // pile de profondeurs d'accolades pour ${ }
  let braceDepth = 0;
  const lastSig = () => toks.length ? toks[toks.length - 1] : null;
  const regexAllowed = () => {
    const p = lastSig();
    if (!p) return true;
    if (p.t === 'num' || p.t === 'str' || p.t === 'tpl' || p.t === 're') return false;
    if (p.t === 'id') return false;
    if (p.t === 'kw') return KW_REGEX_BEFORE.has(p.v);
    if (p.t === 'p') return !(p.v === ')' || p.v === ']' || p.v === '}' || p.v === '++' || p.v === '--');
    return true;
  };
  const readTemplate = (start) => { // i est juste après ` ou } de ${..} ; lit jusqu'à ${ ou `
    let j = start;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') { toks.push({ t: 'tpl', v: src.slice(start - 1, j + 1), s: start - 1, e: j + 1 }); return j + 1; }
      if (c === '$' && src[j + 1] === '{') { toks.push({ t: 'tpl', v: src.slice(start - 1, j + 2), s: start - 1, e: j + 2, open: true }); tplStack.push(braceDepth); braceDepth++; return j + 2; }
      j++;
    }
    throw new Error('gabarit non terminé');
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) throw new Error('commentaire non terminé'); i = e + 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; if (src[j] === '\n' && src[j - 1] !== '\\') { /* chaîne cassée */ } j++; }
      toks.push({ t: 'str', v: src.slice(i, j + 1), s: i, e: j + 1 }); i = j + 1; continue;
    }
    if (c === '`') { i = readTemplate(i + 1); continue; }
    if (c === '}' && tplStack.length && tplStack[tplStack.length - 1] === braceDepth - 1) {
      // fin d'une expression ${...} : on reprend le gabarit
      tplStack.pop(); braceDepth--;
      i = readTemplate(i + 1); // le jeton 'tpl' suivant commence par }
      toks[toks.length - 1].cont = true;
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1, inClass = false;
      while (j < n) {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '[') inClass = true; else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) break;
        else if (d === '\n') throw new Error('regex non terminée ligne ?');
        j++;
      }
      j++; while (j < n && /[a-z]/i.test(src[j])) j++;
      toks.push({ t: 're', v: src.slice(i, j), s: i, e: j }); i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i + 1; while (j < n && /[0-9A-Za-z_.]/.test(src[j])) { if ((src[j] === 'e' || src[j] === 'E') && (src[j + 1] === '+' || src[j + 1] === '-')) j++; j++; }
      toks.push({ t: 'num', v: src.slice(i, j), s: i, e: j }); i = j; continue;
    }
    if (isIdStart(c)) {
      let j = i + 1; while (j < n && isIdPart(src[j])) j++;
      const v = src.slice(i, j);
      const kw = /^(function|return|typeof|case|in|of|delete|void|throw|new|do|else|instanceof|if|for|while|try|catch|finally|switch|const|let|var|class|async|await|yield|break|continue|default|this|null|true|false|undefined)$/.test(v);
      toks.push({ t: kw && v !== 'of' && v !== 'async' && v !== 'await' && v !== 'yield' && v !== 'undefined' && v !== 'this' && v !== 'null' && v !== 'true' && v !== 'false' ? 'kw' : 'id', v, s: i, e: j }); i = j; continue;
    }
    // ponctuation
    let p = c;
    const s4 = src.substr(i, 4), s3 = src.substr(i, 3), s2 = src.substr(i, 2);
    if (PUNCT3.includes(s4)) p = s4; else if (PUNCT3.includes(s3)) p = s3; else if (PUNCT2.includes(s2)) p = s2;
    if (p === '{') braceDepth++;
    if (p === '}') braceDepth--;
    toks.push({ t: 'p', v: p, s: i, e: i + p.length }); i += p.length;
  }
  return toks;
}

// numéro de ligne (0-indexé) d'un offset
export function lineIndex(src) {
  const starts = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (off) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= off) lo = m; else hi = m - 1; } return lo; };
}



/* Fin de la fonction `function nom(...){...}` commençant à l'offset debut (indice de fin exclu), ou -1. */
export function finFonction(texte, debut) {
  const toks = tokenize(texte.slice(debut));
  let i = 0; while (i < toks.length && !(toks[i].t === 'p' && toks[i].v === '(')) i++;
  let d = 0;
  for (; i < toks.length; i++) { const x = toks[i]; if (x.t === 'p' && '({['.includes(x.v)) d++; else if (x.t === 'p' && ')}]'.includes(x.v)) { d--; if (d === 0 && x.v === '}') return debut + x.e; } else if (x.t === 'tpl' && x.open) d++; else if (x.t === 'tpl' && x.cont) d--; }
  return -1;
}
/* Fin de l'instruction (`;` au niveau 0) commençant à debut. */
export function finInstruction(texte, debut) {
  const toks = tokenize(texte.slice(debut)); let d = 0;
  for (const x of toks) { if (x.t === 'p' && '({['.includes(x.v)) d++; else if (x.t === 'p' && ')}]'.includes(x.v)) d--; else if (x.t === 'tpl' && x.open) d++; else if (x.t === 'tpl' && x.cont) d--; else if (x.t === 'p' && x.v === ';' && d === 0) return debut + x.e; }
  return -1;
}

/*
 * Découpe un fichier « IIFE » (module du frontend) en instructions de premier niveau : { kind: 'function' | 'var' | 'stmt', names, debut, fin }
 * (décalages de texte ; `debut` inclut les commentaires collés au-dessus). Sert à remettre les modules dans l'ordre du monolithe d'origine (_ui-sources.mjs).
 */
export function decouper(src) {
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
  let bodyOpen = -1;
  for (let i = 0; i < toks.length; i++) { if (toks[i].t === 'kw' && toks[i].v === 'function' && depthAt[i] === 1) { let j = i; while (!(toks[j].t === 'p' && toks[j].v === '{')) j++; bodyOpen = j; break; } }
  if (bodyOpen < 0) throw new Error('corps IIFE introuvable');
  const bodyClose = match[bodyOpen]; const D = depthAt[bodyOpen] + 1;
  const isP = (i, v) => toks[i] && toks[i].t === 'p' && toks[i].v === v;
  const isKw = (i, v) => toks[i] && toks[i].t === 'kw' && toks[i].v === v;
  function stmtEnd(i) {
    const t = toks[i];
    const apres = (k) => (isP(k, '{') ? match[k] : stmtEnd(k));
    if ((t.t === 'kw' && t.v === 'function') || (t.t === 'id' && t.v === 'async' && isKw(i + 1, 'function'))) {
      let j = i; while (!isP(j, '(')) j++; j = match[j] + 1; while (!isP(j, '{')) j++; return match[j];
    }
    if (t.t === 'kw' && t.v === 'if') {
      let j = i + 1; j = match[j] + 1; let e = apres(j);
      while (isKw(e + 1, 'else')) { let k = e + 2; if (isKw(k, 'if')) k = match[k + 1] + 1; e = apres(k); }
      return e;
    }
    if (t.t === 'kw' && (t.v === 'for' || t.v === 'while') && isP(i + 1, '(')) return apres(match[i + 1] + 1);
    if (t.t === 'kw' && t.v === 'try') {
      let e = match[i + 1];
      if (isKw(e + 1, 'catch')) { let k = e + 2; if (isP(k, '(')) k = match[k] + 1; e = match[k]; }
      if (isKw(e + 1, 'finally')) e = match[e + 2];
      return e;
    }
    if (t.t === 'kw' && t.v === 'switch') return match[match[i + 1] + 1];
    if (t.t === 'kw' && t.v === 'do') { let e = apres(i + 1); const k = e + 2; e = match[k]; if (isP(e + 1, ';')) e++; return e; }
    if (isP(i, '{')) return match[i];
    let j = i;
    while (j < bodyClose) {
      if (isP(j, ';') && depthAt[j] === D) return j;
      if (j > i && depthAt[j] === D && toks[j].t === 'kw' && /^(function|const|let|var)$/.test(toks[j].v) && lineOf(toks[j].s) > lineOf(toks[j - 1].e - 1)) return j - 1;
      j++;
    }
    return bodyClose - 1;
  }
  const items = [];
  let i = bodyOpen + 1;
  while (i < bodyClose) {
    const e = stmtEnd(i); const t = toks[i];
    const it = { kind: 'stmt', names: [], ti: i, te: e };
    if (t.t === 'kw' && t.v === 'function' && toks[i + 1] && toks[i + 1].t === 'id') { it.kind = 'function'; it.names = [toks[i + 1].v]; }
    else if (t.t === 'id' && t.v === 'async' && isKw(i + 1, 'function') && toks[i + 2].t === 'id') { it.kind = 'function'; it.names = [toks[i + 2].v]; }
    else if (t.t === 'kw' && /^(const|let|var)$/.test(t.v)) {
      it.kind = 'var'; const names = [];
      if (toks[i + 1].t === 'id') {
        names.push(toks[i + 1].v);
        for (let k = i + 2; k <= e; k++) if (isP(k, ',') && depthAt[k] === D && toks[k + 1].t === 'id') names.push(toks[k + 1].v);
      }
      it.names = names;
    }
    it.s = toks[i].s; it.e = toks[e].e; items.push(it); i = e + 1;
  }
  const lines = src.split('\n'); const off = [0]; for (const l of lines) off.push(off[off.length - 1] + l.length + 1);
  const estCommentaire = (l) => /^\s*(\/\*|\*|\*\/)/.test(l) || /^\s*\/\*.*\*\/\s*$/.test(l) || /^\s*\/\//.test(l);
  items.forEach((it) => {
    const l0 = lineOf(it.s); const avant = src.slice(off[l0], it.s);
    let c0 = l0; const premier = avant.trim() === '';
    if (premier) while (c0 > 0 && estCommentaire(lines[c0 - 1])) c0--;
    it.debut = premier ? off[c0] : it.s;
    const l1 = lineOf(it.e - 1); const apres = src.slice(it.e, off[l1 + 1] - 1);
    it.fin = apres.trim() === '' ? Math.min(off[l1 + 1], src.length) : it.e;
  });
  return { items, prefixe: src.slice(0, items.length ? items[0].debut : 0), suffixe: src.slice(items.length ? items[items.length - 1].fin : 0) };
}
