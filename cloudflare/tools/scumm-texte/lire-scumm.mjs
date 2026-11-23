// Lecteur de la structure d'un jeu SCUMM v7 (Day of the Tentacle) : fichier d'index
// (TENTACLE.000) + fichier de ressources (TENTACLE.001), tous deux chiffres par XOR 0x69.
// Formats verifies dans ScummVM (engines/scumm/resource.cpp, room.cpp, script.cpp).
//
// Chunk : tag(4) + taille(4, grand-boutiste, EN-TETE COMPRIS) + contenu.
// TENTACLE.001 : LECF > { LOFF, LFLF* } ; LFLF > { ROOM, SCRP*, SOUN*, COST*, CHAR* } ;
// ROOM > { RMHD, ..., OBCD*, EXCD, ENCD, NLSC, LSCR*, ... }.
// LOFF : nombre(1) puis (salle(1), decalage(4, petit-boutiste))* ; decalage = debut du LFLF + 8.
// Index : RNAM, MAXS, DROO, DSCR, DSOU, DCOS, DCHR, DOBJ, AARY ; DROO/DSCR/DSOU/DCOS/DCHR :
// nombre(2 LE), puis nombre octets « salle », puis nombre decalages (4 LE) ; le decalage d'une
// ressource est RELATIF au debut de sa salle (debut du LFLF + 8).
import fs from 'node:fs';
import path from 'node:path';

export const CLE_XOR = 0x69;

export function xorBuffer(buf) {
  const out = Buffer.from(buf);
  for (let i = 0; i < out.length; i++) out[i] ^= CLE_XOR;
  return out;
}

// Chunks qui contiennent d'autres chunks (les autres sont des feuilles pour nous).
export const CONTENEURS = new Set(['LECF', 'LFLF', 'ROOM', 'OBCD']);

export function lireJeu(dossier) {
  const idx = xorBuffer(fs.readFileSync(path.join(dossier, 'TENTACLE.000')));
  const res = xorBuffer(fs.readFileSync(path.join(dossier, 'TENTACLE.001')));
  return { idx, res };
}

export function ecrireJeu(dossier, jeu) {
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, 'TENTACLE.000'), xorBuffer(jeu.idx));
  fs.writeFileSync(path.join(dossier, 'TENTACLE.001'), xorBuffer(jeu.res));
}

export function tag4(buf, pos) {
  return buf.toString('latin1', pos, pos + 4);
}

// Liste les chunks de premier niveau entre debut et fin ; verifie qu'ils se suivent sans trou.
export function listerChunks(buf, debut, fin, erreurs) {
  const out = [];
  let p = debut;
  while (p < fin) {
    if (p + 8 > fin) { (erreurs || []).push(`chunk tronque a ${p}`); break; }
    const tag = tag4(buf, p);
    const taille = buf.readUInt32BE(p + 4);
    if (taille < 8 || p + taille > fin) {
      (erreurs || []).push(`taille invalide ${tag}@${p} (${taille}) fin=${fin}`);
      break;
    }
    out.push({ tag, pos: p, taille, fin: p + taille });
    p += taille;
  }
  if (p !== fin) (erreurs || []).push(`les chunks ne tombent pas sur la fin (${p} != ${fin})`);
  return out;
}

// Arbre complet (descend dans CONTENEURS).
export function arbre(buf, debut = 0, fin = buf.length, erreurs = []) {
  const noeuds = listerChunks(buf, debut, fin, erreurs);
  for (const n of noeuds) {
    if (CONTENEURS.has(n.tag)) {
      // LECF, LFLF, ROOM, OBCD : contenu directement apres l'en-tete
      n.enfants = arbre(buf, n.pos + 8, n.fin, erreurs);
    }
  }
  return noeuds;
}

export function lireLoff(res, racine) {
  const lecf = racine.find((n) => n.tag === 'LECF');
  const loff = lecf.enfants.find((n) => n.tag === 'LOFF');
  const nb = res[loff.pos + 8];
  const entrees = [];
  for (let i = 0; i < nb; i++) {
    const p = loff.pos + 9 + i * 5;
    entrees.push({ salle: res[p], decalage: res.readUInt32LE(p + 1), posDecalage: p + 1 });
  }
  return { chunk: loff, entrees, parSalle: new Map(entrees.map((e) => [e.salle, e])) };
}

const LISTES_INDEX = ['DROO', 'DSCR', 'DSOU', 'DCOS', 'DCHR'];

export function lireIndex(idx) {
  const erreurs = [];
  const chunks = listerChunks(idx, 0, idx.length, erreurs);
  const listes = {};
  for (const c of chunks) {
    if (!LISTES_INDEX.includes(c.tag)) continue;
    const nb = idx.readUInt16LE(c.pos + 8);
    const posSalles = c.pos + 10;
    const posOffs = posSalles + nb;
    if (posOffs + nb * 4 !== c.fin) erreurs.push(`${c.tag} : taille incoherente`);
    const entrees = [];
    for (let i = 0; i < nb; i++) {
      entrees.push({
        numero: i,
        salle: idx[posSalles + i],
        posSalle: posSalles + i,
        decalage: idx.readUInt32LE(posOffs + i * 4),
        posDecalage: posOffs + i * 4,
      });
    }
    listes[c.tag] = { chunk: c, nb, entrees };
  }
  return { chunks, listes, erreurs };
}

// Adresse absolue (dans TENTACLE.001) d'une ressource de l'index.
export function adresseRessource(loff, entree) {
  const l = loff.parSalle.get(entree.salle);
  if (!l) return null;
  return l.decalage + entree.decalage;
}

// Tous les scripts du jeu avec leur zone de code [debut, fin) :
//  global (SCRP), local (LSCR : id sur 1 octet, DOTT est en SCUMM v6 pour ScummVM), entree (ENCD), sortie (EXCD),
//  objet (OBCD : table de verbes dans le chunk VERB, decalages relatifs au debut du VERB).
export function listerScripts(res, racine) {
  const scripts = [];
  const lecf = racine.find((n) => n.tag === 'LECF');
  for (const lflf of lecf.enfants.filter((n) => n.tag === 'LFLF')) {
    const room = lflf.enfants.find((n) => n.tag === 'ROOM');
    for (const c of lflf.enfants) {
      if (c.tag === 'SCRP') {
        scripts.push({ type: 'global', lflf, chemin: [lecf, lflf, c], chunk: c, debut: c.pos + 8, fin: c.fin });
      }
    }
    if (!room) continue;
    for (const c of room.enfants) {
      const chemin = [lecf, lflf, room, c];
      if (c.tag === 'LSCR') {
        scripts.push({ type: 'local', id: res[c.pos + 8], lflf, room, chemin, chunk: c, debut: c.pos + 9, fin: c.fin });
      } else if (c.tag === 'ENCD' || c.tag === 'EXCD') {
        scripts.push({ type: c.tag === 'ENCD' ? 'entree' : 'sortie', lflf, room, chemin, chunk: c, debut: c.pos + 8, fin: c.fin });
      } else if (c.tag === 'OBCD') {
        const verb = c.enfants.find((n) => n.tag === 'VERB');
        const cdhd = c.enfants.find((n) => n.tag === 'CDHD');
        if (!verb) continue;
        // table : (cle(1), decalage LE16)* terminee par une cle 0
        let p = verb.pos + 8;
        const verbes = [];
        while (res[p] !== 0) {
          verbes.push({ cle: res[p], decalage: res.readUInt16LE(p + 1), posDecalage: p + 1 });
          p += 3;
        }
        p += 1;
        const objId = cdhd ? res.readUInt16LE(cdhd.pos + 8) : null;
        scripts.push({
          type: 'objet', id: objId, lflf, room, chemin: [lecf, lflf, room, c, verb], chunk: verb, debut: p, fin: verb.fin,
          verbes, debutVerb: verb.pos,
        });
      }
    }
  }
  return scripts;
}

export function numeroSalle(loff, lflf) {
  for (const e of loff.entrees) if (e.decalage === lflf.pos + 8) return e.salle;
  return null;
}

export function lireTout(dossier) {
  const jeu = typeof dossier === 'string' ? lireJeu(dossier) : dossier;
  const erreurs = [];
  const racine = arbre(jeu.res, 0, jeu.res.length, erreurs);
  const loff = lireLoff(jeu.res, racine);
  const index = lireIndex(jeu.idx);
  return { ...jeu, racine, loff, index, erreurs: erreurs.concat(index.erreurs), scripts: listerScripts(jeu.res, racine) };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const dossier = process.argv[2];
  if (!dossier) { console.error('usage : node lire-scumm.mjs <dossier du jeu>'); process.exit(2); }
  const j = lireTout(dossier);
  console.log('erreurs de structure :', j.erreurs.length ? j.erreurs : 'aucune');
  console.log('salles (LOFF) :', j.loff.entrees.length, ' scripts :', j.scripts.length);
  for (const t of ['global', 'local', 'entree', 'sortie', 'objet']) {
    console.log(' ', t, j.scripts.filter((s) => s.type === t).length);
  }
}
