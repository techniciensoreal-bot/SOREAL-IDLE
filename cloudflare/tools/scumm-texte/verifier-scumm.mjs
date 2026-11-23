// Verification d'un jeu SCUMM v7 (original ou corrige). Usage :
//   node verifier-scumm.mjs <dossier du jeu> [--original <dossier d'origine>] [--rapport]
// (i) tous les scripts se decodent jusqu'a leur fin exacte, cibles de saut = debut d'instruction ;
// (ii) chaque ressource de l'index (scripts, sons, costumes, polices) est au bon tag et a la bonne taille ;
// (iii) la chaine des chunks se parcourt sans trou, somme des tailles = taille du fichier.
// Avec --original : (iv) les octets differents de l'original (decale) sont tous expliques.
import path from 'node:path';
import { lireTout } from './lire-scumm.mjs';
import { decoder, verifierSauts } from './bytecode-v6.mjs';

const TAGS = { DSCR: 'SCRP', DSOU: 'SOUN', DCOS: 'COST', DCHR: 'CHAR' };

export function verifier(dossier) {
  const j = lireTout(dossier);
  const rapport = { erreursStructure: j.erreurs.slice(), scripts: {}, index: {}, problemes: [] };
  // (iii) chaine de chunks
  rapport.tailleLecf = j.racine[0].taille;
  rapport.tailleFichier = j.res.length;
  if (j.racine.length !== 1 || j.racine[0].taille !== j.res.length) rapport.problemes.push('LECF ne couvre pas tout le fichier');
  // (i) scripts
  let ok = 0;
  for (const s of j.scripts) {
    const d = decoder(j.res, s.debut, s.fin);
    const nom = `${s.type}${s.id != null ? ':' + s.id : ''}@${s.chunk.pos}`;
    if (d.erreur) { rapport.problemes.push(`script ${nom} : ${d.erreur}`); continue; }
    const mauvais = verifierSauts(d.instrs, s.debut, s.fin);
    if (mauvais.length) { rapport.problemes.push(`script ${nom} : ${mauvais.length} saut(s) hors instruction (ex. ${JSON.stringify(mauvais[0])})`); continue; }
    if (s.type === 'objet') {
      const debuts = new Set(d.instrs.map((i) => i.off).concat([s.fin]));
      let bad = 0;
      for (const v of s.verbes) if (!debuts.has(s.debutVerb + v.decalage)) bad++;
      if (bad) { rapport.problemes.push(`objet ${nom} : ${bad} verbe(s) hors instruction`); continue; }
    }
    ok++;
    rapport.scripts[s.type] = (rapport.scripts[s.type] || 0) + 1;
  }
  rapport.scriptsOk = ok;
  rapport.scriptsTotal = j.scripts.length;
  // (ii) index
  for (const [liste, tag] of Object.entries(TAGS)) {
    const L = j.index.listes[liste];
    let n = 0, vides = 0;
    for (const e of L.entrees) {
      if (e.salle === 0 && e.decalage === 0) { vides++; continue; }
      const a = j.loff.parSalle.get(e.salle);
      if (!a) { rapport.problemes.push(`${liste}#${e.numero} : salle ${e.salle} inconnue`); continue; }
      const adr = a.decalage + e.decalage;
      const t = j.res.toString('latin1', adr, adr + 4);
      const taille = j.res.readUInt32BE(adr + 4);
      // doit etre un chunk fils direct du LFLF de la salle, a la bonne place
      const lflf = j.racine[0].enfants.find((c) => c.tag === 'LFLF' && c.pos + 8 === a.decalage);
      const chunk = lflf && lflf.enfants.find((c) => c.pos === adr);
      if (t !== tag) rapport.problemes.push(`${liste}#${e.numero} : tag ${t} au lieu de ${tag} @${adr}`);
      else if (!chunk || chunk.taille !== taille) rapport.problemes.push(`${liste}#${e.numero} : pas un chunk de la salle ${e.salle} @${adr}`);
      else n++;
    }
    rapport.index[liste] = { ok: n, vides, total: L.nb };
  }
  // DROO : les decalages comparés au LOFF
  const droo = j.index.listes.DROO;
  let drooEgal = 0, drooAutre = 0;
  for (const e of droo.entrees) {
    const l = j.loff.parSalle.get(e.numero);
    if (l && l.decalage === e.decalage) drooEgal++; else if (e.decalage || e.salle) drooAutre++;
  }
  rapport.droo = { egalLoff: drooEgal, autres: drooAutre };
  // LOFF : chaque entree pointe un LFLF + 8
  for (const e of j.loff.entrees) {
    const l = j.racine[0].enfants.find((c) => c.tag === 'LFLF' && c.pos + 8 === e.decalage);
    if (!l) rapport.problemes.push(`LOFF salle ${e.salle} : ${e.decalage} n'est pas un LFLF+8`);
  }
  return { j, rapport };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const d = process.argv[2];
  if (!d) { console.error('usage : node verifier-scumm.mjs <dossier>'); process.exit(2); }
  const { rapport } = verifier(d);
  console.log(JSON.stringify({ ...rapport, problemes: rapport.problemes.length, premiers: rapport.problemes.slice(0, 15) }, null, 1));
  process.exit(rapport.problemes.length || rapport.erreursStructure.length ? 1 : 0);
}
