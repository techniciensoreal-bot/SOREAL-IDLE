// Controle (iv) : compare un jeu corrige a l'original. Usage :
//   node comparer-scumm.mjs <original> <corrige> <journal.json>
// 1. « naive » = l'original dont on a seulement remplace les chaines (aucun champ recalcule) ;
// 2. chaque octet qui differe entre naive et le corrige doit etre EXPLIQUE, par une verification
//    independante : taille de chunk (le chunk contient bien une correction), entree de LOFF (meme salle,
//    meme rang de LFLF), mot de saut ou entree de verbe (meme instruction visee, comptee en rang d'instruction),
//    decalage d'index (meme chunk : meme salle, meme rang dans le LFLF, meme tag, meme contenu) ;
// 3. tout octet inexplique est une erreur. Le script liste tous les octets differents.
import fs from 'node:fs';
import path from 'node:path';
import { lireTout } from './lire-scumm.mjs';
import { decoder } from './bytecode-v6.mjs';

export function comparer(dossierOrig, dossierNouv, journal) {
  const o = lireTout(dossierOrig), n = lireTout(dossierNouv);
  const remps = journal.map((x) => x.remplacement).sort((a, b) => b.offset - a.offset);
  let naive = Buffer.from(o.res);
  for (const r of remps) naive = Buffer.concat([naive.subarray(0, r.offset), Buffer.from(r.nouveauHex, 'hex'), naive.subarray(r.offset + r.longueurAncien)]);
  const erreurs = [], expliques = [];
  if (naive.length !== n.res.length) erreurs.push(`tailles differentes : ${naive.length} vs ${n.res.length}`);
  const diffs = [];
  for (let i = 0; i < Math.min(naive.length, n.res.length); i++) if (naive[i] !== n.res[i]) diffs.push(i);
  const exp = new Map();
  const marquer = (pos, len, raison) => { for (let k = 0; k < len; k++) exp.set(pos + k, raison); };

  // chaines de chunks : memes tags / memes rangs
  const aplat = (arb, acc = []) => { for (const c of arb) { acc.push(c); if (c.enfants) aplat(c.enfants, acc); } return acc; };
  const co = aplat(o.racine), cn = aplat(n.racine);
  if (co.length !== cn.length) erreurs.push('nombre de chunks different');
  else {
    // positions de modification dans le NOUVEAU fichier (calculees par cumul, du bas vers le haut)
    // chaque chunk du nouveau doit contenir (ou non) les memes corrections que dans l'ancien
    for (let i = 0; i < co.length; i++) {
      if (co[i].tag !== cn[i].tag) { erreurs.push(`tag different au rang ${i}`); break; }
      const dTotal = remps.reduce((s, r) => s + ((r.offset >= co[i].pos && r.offset < co[i].fin) ? Buffer.from(r.nouveauHex, 'hex').length - r.longueurAncien : 0), 0);
      if (cn[i].taille !== co[i].taille + dTotal) erreurs.push(`${co[i].tag}@${co[i].pos} : taille ${cn[i].taille} != ${co[i].taille}+${dTotal}`);
      if (dTotal) marquer(cn[i].pos + 4, 4, `taille ${cn[i].tag}`);
    }
  }
  // LOFF : meme rang de LFLF
  const lflfO = o.racine[0].enfants.filter((c) => c.tag === 'LFLF'), lflfN = n.racine[0].enfants.filter((c) => c.tag === 'LFLF');
  for (let k = 0; k < o.loff.entrees.length; k++) {
    const eo = o.loff.entrees[k], en = n.loff.entrees[k];
    const ro = lflfO.findIndex((l) => l.pos + 8 === eo.decalage), rn = lflfN.findIndex((l) => l.pos + 8 === en.decalage);
    if (eo.salle !== en.salle || ro !== rn || ro < 0) erreurs.push(`LOFF salle ${eo.salle} incoherent`);
    else if (eo.decalage !== en.decalage) marquer(en.posDecalage, 4, `LOFF salle ${en.salle}`);
  }
  // scripts : memes instructions, memes cibles (en rang d'instruction)
  if (o.scripts.length !== n.scripts.length) erreurs.push('nombre de scripts different');
  else for (let k = 0; k < o.scripts.length; k++) {
    const so = o.scripts[k], sn = n.scripts[k];
    const dO = decoder(o.res, so.debut, so.fin), dN = decoder(n.res, sn.debut, sn.fin);
    if (dO.instrs.length !== dN.instrs.length) { erreurs.push(`script ${k} : nombre d'instructions different`); continue; }
    const rangO = new Map(dO.instrs.map((i, r) => [i.off, r])); rangO.set(so.fin, dO.instrs.length);
    const rangN = new Map(dN.instrs.map((i, r) => [i.off, r])); rangN.set(sn.fin, dN.instrs.length);
    for (let r = 0; r < dO.instrs.length; r++) {
      const a = dO.instrs[r], b = dN.instrs[r];
      if (a.op !== b.op || a.sous !== b.sous) { erreurs.push(`script ${k} instr ${r} : opcode different`); break; }
      if (!!a.saut !== !!b.saut) { erreurs.push(`script ${k} instr ${r} : saut different`); break; }
      if (a.saut) {
        if (rangO.get(a.saut.cible) !== rangN.get(b.saut.cible)) erreurs.push(`script ${k} instr ${r} : le saut ne vise plus la meme instruction`);
        else if (a.saut.decalage !== b.saut.decalage) marquer(b.saut.posMot, 2, 'saut');
      }
    }
    if (so.type === 'objet') {
      for (let v = 0; v < so.verbes.length; v++) {
        const ro = rangO.get(so.debutVerb + so.verbes[v].decalage), rn = rangN.get(sn.debutVerb + sn.verbes[v].decalage);
        if (ro !== rn || ro === undefined) erreurs.push(`objet ${k} verbe ${v} : entree incoherente`);
        else if (so.verbes[v].decalage !== sn.verbes[v].decalage) marquer(sn.verbes[v].posDecalage, 2, 'verbe');
      }
    }
  }
  // octets differents du .001
  const inexpliques = diffs.filter((p) => !exp.has(p));
  // les champs declares comme expliques mais qui n'ont pas change ne sont pas des erreurs

  // index : meme chunk
  const idxDiffs = [];
  if (o.idx.length !== n.idx.length) erreurs.push('index : taille differente');
  else for (let i = 0; i < o.idx.length; i++) if (o.idx[i] !== n.idx[i]) idxDiffs.push(i);
  const idxExp = new Set();
  for (const nom of ['DSCR', 'DSOU', 'DCOS', 'DCHR']) {
    const Lo = o.index.listes[nom], Ln = n.index.listes[nom];
    for (let e = 0; e < Lo.nb; e++) {
      const a = Lo.entrees[e], b = Ln.entrees[e];
      if (a.salle !== b.salle) { erreurs.push(`${nom}#${e} : salle changee`); continue; }
      if (a.salle === 0 && a.decalage === 0) continue;
      const adrO = o.loff.parSalle.get(a.salle).decalage + a.decalage, adrN = n.loff.parSalle.get(b.salle).decalage + b.decalage;
      const lo = lflfO.find((l) => l.pos + 8 === o.loff.parSalle.get(a.salle).decalage), ln = lflfN.find((l) => l.pos + 8 === n.loff.parSalle.get(b.salle).decalage);
      const rO = lo.enfants.findIndex((c) => c.pos === adrO), rN = ln.enfants.findIndex((c) => c.pos === adrN);
      const cO = lo.enfants[rO], cN = ln.enfants[rN];
      if (rO < 0 || rO !== rN) { erreurs.push(`${nom}#${e} : vise un autre chunk`); continue; }
      // contenu identique hors modifications : comparer apres retrait des differences deja expliquees
      if (cO.taille === cN.taille && !o.res.subarray(cO.pos, cO.fin).equals(n.res.subarray(cN.pos, cN.fin))) erreurs.push(`${nom}#${e} : contenu different`);
      if (a.decalage !== b.decalage) for (let k = 0; k < 4; k++) idxExp.add(b.posDecalage + k);
    }
  }
  const idxInexpl = idxDiffs.filter((p) => !idxExp.has(p));
  return {
    octetsDifferentsRes: diffs.length, inexpliquesRes: inexpliques,
    octetsDifferentsIdx: idxDiffs.length, inexpliquesIdx: idxInexpl,
    listeRes: diffs.map((p) => ({ pos: p, oct: n.res[p], raison: exp.get(p) })),
    listeIdx: idxDiffs.map((p) => ({ pos: p, oct: n.idx[p] })),
    erreurs,
  };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [a, b, jp] = process.argv.slice(2);
  const r = comparer(a, b, JSON.parse(fs.readFileSync(jp, 'utf8')));
  const resume = { ...r, listeRes: undefined, listeIdx: undefined };
  console.log(JSON.stringify(resume, null, 1));
  const parRaison = {};
  for (const x of r.listeRes) { const k = (x.raison || '?').replace(/@\d+| salle \d+/g, ''); parRaison[k] = (parRaison[k] || 0) + 1; }
  console.log('octets .001 par type :', JSON.stringify(parRaison));
  fs.writeFileSync(jp.replace(/\.json$/, '-diff.json'), JSON.stringify({ res: r.listeRes, idx: r.listeIdx }, null, 1));
  process.exit(r.erreurs.length || r.inexpliquesRes.length || r.inexpliquesIdx.length ? 1 : 0);
}
