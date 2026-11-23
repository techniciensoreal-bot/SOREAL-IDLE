// Remplace des chaines de texte (de longueur differente) dans les scripts d'un jeu SCUMM v6 (Day of the
// Tentacle) et recalcule tout ce qui depend des tailles : sauts relatifs du script, tailles des chunks
// (script, conteneurs, ROOM, LFLF, LECF), table des verbes d'un objet (OBCD), LOFF, et les decalages de
// DSCR / DSOU / DCOS / DCHR dans TENTACLE.000. Les fichiers sont dechiffres (XOR 0x69) puis rechiffres.
//
// Usage :
//   node patcher-texte.mjs <dossier du jeu> <dossier de sortie> --cherche "texte" --par "nouveau" [--tous] [--offset N]
//     (option repetable : chaque couple --cherche/--par est une correction ; \xNN accepte ; --journal fichier.json)
// Le dossier de sortie recoit les DEUX fichiers (TENTACLE.000, TENTACLE.001) ; le dossier source n'est jamais ecrit.
import fs from 'node:fs';
import path from 'node:path';
import { lireTout, ecrireJeu } from './lire-scumm.mjs';
import { decoder } from './bytecode-v6.mjs';

// Encodage texte -> octets (CP850/CP437 : memes codes pour les accents francais courants) ; \xNN litteral.
const ACCENTS = { 'é': 0x82, 'è': 0x8a, 'à': 0x85, 'ê': 0x88, 'ç': 0x87, 'ù': 0x97, 'ô': 0x93, 'î': 0x8c, 'â': 0x83, 'ë': 0x89, 'ï': 0x8b, 'û': 0x96, 'É': 0x90, 'À': 0xb7, 'ü': 0x81, 'ö': 0x94 };
export function encoder(texte) {
  const out = [];
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (c === '\\' && texte[i + 1] === 'x') { out.push(parseInt(texte.substr(i + 2, 2), 16)); i += 3; continue; }
    if (ACCENTS[c] !== undefined) out.push(ACCENTS[c]);
    else if (c.charCodeAt(0) < 128) out.push(c.charCodeAt(0));
    else throw new Error(`caractere non encodable : ${c}`);
  }
  return Buffer.from(out);
}

// Toutes les chaines en ligne de tous les scripts : {script, instr, debut, fin, codes}
export function chainesDuJeu(j) {
  const out = [];
  for (const s of j.scripts) {
    const d = decoder(j.res, s.debut, s.fin);
    if (d.erreur) throw new Error(`script non decodable ${s.type}@${s.chunk.pos} : ${d.erreur}`);
    for (const i of d.instrs) if (i.chaine) out.push({ script: s, instr: i, debut: i.chaine.debut, fin: i.chaine.fin, codes: i.chaine.codes });
  }
  return out;
}

// Resout une correction « cherche -> par » en remplacements minimaux {offset, longueurAncien, nouveau}
// (prefixe et suffixe communs retires). Les offsets sont ceux du fichier ORIGINAL.
export function resoudre(j, { cherche, par, tous = false, offset = null }) {
  const a = encoder(cherche), b = encoder(par);
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const trouves = [];
  for (const c of chainesDuJeu(j)) {
    let from = c.debut;
    for (;;) {
      const k = j.res.indexOf(a, from);
      if (k < 0 || k + a.length > c.fin) break;
      from = k + 1;
      if (k < c.debut) continue;
      // ne doit pas chevaucher un code 0xFF
      if (c.codes.some(([x, y]) => k < y && k + a.length > x)) continue;
      trouves.push(k);
    }
  }
  let sel = trouves;
  if (offset != null) sel = trouves.filter((k) => k <= offset && offset < k + a.length);
  if (!sel.length) throw new Error(`« ${cherche} » introuvable dans une chaine de script`);
  if (!tous && sel.length > 1) throw new Error(`« ${cherche} » trouve ${sel.length} fois (${sel.join(', ')}) : preciser --offset ou --tous`);
  return sel.map((k) => ({
    offset: k + pre,
    longueurAncien: a.length - pre - suf,
    nouveau: b.subarray(pre, b.length - suf),
    cherche, par,
  }));
}

// Applique UN remplacement a un jeu en memoire (re-lit la structure). Renvoie {jeu, journal}.
export function appliquer(jeu, rempl) {
  const j = lireTout({ idx: jeu.idx, res: jeu.res });
  if (j.erreurs.length) throw new Error('structure invalide avant correction : ' + j.erreurs[0]);
  const { offset } = rempl;
  const mStart = offset, mEnd = offset + rempl.longueurAncien, D = rempl.nouveau.length - rempl.longueurAncien;
  const f = (x) => (x >= mEnd ? x + D : x);

  const ch = chainesDuJeu(j).find((c) => offset >= c.debut && mEnd <= c.fin);
  if (!ch) throw new Error(`offset ${offset} hors d'une chaine de script`);
  if (ch.codes.some(([x, y]) => mStart < y && mEnd > x)) throw new Error('le remplacement chevauche un code 0xFF');
  const s = ch.script;
  const dec = decoder(j.res, s.debut, s.fin);

  const res = Buffer.concat([j.res.subarray(0, mStart), rempl.nouveau, j.res.subarray(mEnd)]);
  const idx = Buffer.from(j.idx);
  const journal = [];
  const poser32BE = (pos, v, raison) => { const old = res.readUInt32BE(pos); res.writeUInt32BE(v, pos); journal.push({ fichier: 1, pos, ancien: old, nouveau: v, raison }); };

  // (c) tailles : le chunk du script et tous ses conteneurs
  for (const c of s.chemin) poser32BE(c.pos + 4, c.taille + D, `taille ${c.tag}@${c.pos}`);
  if (s.type === 'objet') {
    // le chemin d'un objet finit par VERB : OBCD en fait partie, ROOM, LFLF, LECF aussi (deja traites)
  }
  // (b) sauts du script
  for (const i of dec.instrs) {
    if (!i.saut) continue;
    const E = i.saut.posMot + 2;
    const nouvelle = f(i.saut.cible) - f(E);
    if (nouvelle < -32768 || nouvelle > 32767) throw new Error(`saut hors limites a ${i.off}`);
    if (nouvelle !== i.saut.decalage) {
      const p = f(i.saut.posMot);
      res.writeInt16LE(nouvelle, p);
      journal.push({ fichier: 1, pos: p, ancien: i.saut.decalage, nouveau: nouvelle, raison: `saut @${i.off}` });
    }
  }
  // table des verbes d'un objet
  if (s.type === 'objet') {
    for (const v of s.verbes) {
      const nv = f(s.debutVerb + v.decalage) - s.debutVerb;
      if (nv !== v.decalage) {
        if (nv > 0xffff) throw new Error('verbe hors limites');
        res.writeUInt16LE(nv, f(v.posDecalage));
        journal.push({ fichier: 1, pos: f(v.posDecalage), ancien: v.decalage, nouveau: nv, raison: `verbe ${v.cle}` });
      }
    }
  }
  // LOFF
  for (const e of j.loff.entrees) {
    const nv = f(e.decalage);
    if (nv !== e.decalage) {
      res.writeUInt32LE(nv, f(e.posDecalage));
      journal.push({ fichier: 1, pos: f(e.posDecalage), ancien: e.decalage, nouveau: nv, raison: `LOFF salle ${e.salle}` });
    }
  }
  // (d) index : decalage relatif a la salle
  for (const nom of ['DSCR', 'DSOU', 'DCOS', 'DCHR']) {
    for (const e of j.index.listes[nom].entrees) {
      if (e.salle === 0 && e.decalage === 0) continue;
      const base = j.loff.parSalle.get(e.salle).decalage;
      const nv = f(base + e.decalage) - f(base);
      if (nv !== e.decalage) {
        idx.writeUInt32LE(nv, e.posDecalage);
        journal.push({ fichier: 0, pos: e.posDecalage, ancien: e.decalage, nouveau: nv, raison: `${nom}#${e.numero}` });
      }
    }
  }
  return { jeu: { idx, res }, journal };
}

export function corriger(jeu, corrections) {
  const j0 = lireTout({ idx: jeu.idx, res: jeu.res });
  let remps = [];
  for (const c of corrections) remps = remps.concat(resoudre(j0, c));
  remps.sort((x, y) => y.offset - x.offset);   // du plus haut au plus bas : les offsets d'origine restent valides
  let cur = jeu;
  const journal = [];
  for (const r of remps) {
    const o = appliquer(cur, r);
    cur = o.jeu;
    journal.push({ remplacement: { offset: r.offset, longueurAncien: r.longueurAncien, nouveau: r.nouveau.toString('latin1'), nouveauHex: r.nouveau.toString('hex'), cherche: r.cherche, par: r.par }, champs: o.journal });
  }
  return { jeu: cur, journal, remplacements: remps };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const a = process.argv.slice(2);
  const [src, dst] = a;
  if (!src || !dst) { console.error('usage : node patcher-texte.mjs <source> <sortie> --cherche "x" --par "y" [--tous] [--offset N] [--journal f.json]'); process.exit(2); }
  if (path.resolve(src) === path.resolve(dst)) { console.error('la sortie doit etre un AUTRE dossier'); process.exit(2); }
  const corrections = [];
  let journalPath = null;
  for (let i = 2; i < a.length; i++) {
    if (a[i] === '--cherche') corrections.push({ cherche: a[++i], par: null, tous: false, offset: null });
    else if (a[i] === '--par') corrections[corrections.length - 1].par = a[++i];
    else if (a[i] === '--tous') corrections[corrections.length - 1].tous = true;
    else if (a[i] === '--offset') corrections[corrections.length - 1].offset = Number(a[++i]);
    else if (a[i] === '--journal') journalPath = a[++i];
  }
  const jeu = lireTout(src);
  const r = corriger({ idx: jeu.idx, res: jeu.res }, corrections);
  ecrireJeu(dst, r.jeu);
  // les autres fichiers du jeu (taille de plusieurs Go : on ne les copie pas ici)
  const resume = r.journal.map((x) => ({ ...x.remplacement, champs: x.champs.length }));
  console.log(JSON.stringify(resume, null, 1));
  if (journalPath) fs.writeFileSync(journalPath, JSON.stringify(r.journal, null, 1));
}
