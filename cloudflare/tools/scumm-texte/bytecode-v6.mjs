// Decodeur de bytecode SCUMM v6/v7 (Day of the Tentacle). Ne calcule PAS la pile : seulement les
// longueurs exactes des instructions (operandes en ligne, sous-codes, chaines en ligne) et les
// sauts relatifs. Table etablie d'apres scummvm-tools (descumm6.cpp, next_line_V67) et le moteur
// (engines/scumm/script_v6.cpp : o6_jump, o6_wait, decodeParseString, resStrLen).
//
// Un saut (jump 0x73, jumpTrue 0x5C, jumpFalse 0x5D, et les attentes waitForActor / waitUntilActorDrawn /
// waitUntilActorTurned) porte un mot signe de 2 octets ; la cible = (position juste apres le mot) + decalage.
// beginOverride (0x95) est suivi d'un jump 0x73 ordinaire : rien de special.

const aucun = new Set();
function plage(a, b) { for (let i = a; i <= b; i++) aucun.add(i); }
plage(0x0c, 0x1a); plage(0x5e, 0x6a); plage(0x6c, 0x72); plage(0x74, 0x95); plage(0x96, 0x96);
plage(0x98, 0x9a); plage(0x9f, 0xa3); plage(0xa6, 0xa8); plage(0xaa, 0xad); plage(0xaf, 0xb3);
plage(0xbd, 0xbf); plage(0xc4, 0xcd); plage(0xd0, 0xd2); plage(0xd5, 0xd8); plage(0xdd, 0xdd);
plage(0xe1, 0xe1); plage(0xe4, 0xe4); plage(0xec, 0xed);

const OCTET = new Set([0x00, 0x02, 0x06, 0x0a, 0x42, 0x46, 0x4a, 0x4e, 0x52, 0x56, 0x5a]);
const MOT = new Set([0x01, 0x03, 0x07, 0x0b, 0x43, 0x47, 0x4b, 0x4f, 0x53, 0x57, 0x5b, 0xd4, 0xe3]);
const SAUT = new Set([0x5c, 0x5d, 0x73]);

function ens(...lst) { const s = new Set(); for (const x of lst) { if (Array.isArray(x)) for (let i = x[0]; i <= x[1]; i++) s.add(i); else s.add(x); } return s; }
const SOUS = {
  0x6b: ens([0x90, 0x97], 0x99, 0x9a, 0x9c, 0x9d, 0xd6),
  0x9b: ens([0x64, 0x77]),
  0x9c: ens(0xac, 0xae, 0xaf, 0xb0, 0xb1, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xba, 0xbb, 0xd5, 0xdc),
  0x9d: ens([0x4c, 0x63], 0xc5, 0xc6, [0xd7, 0xeb]),
  0x9e: ens(0xc4, [0x7c, 0x8c], 0xff),
  0xa5: ens(0x8d, 0x8e, 0x8f),
  0xa9: ens(0xa8, 0xa9, 0xaa, 0xab, 0xe2, 0xe8),
  0xae: ens(0x9e, 0x9f, 0xa0),
  0xbc: ens([0xc7, 0xcc]),
  0xc0: ens([0xc7, 0xcb]),
};
const PRINT = ens(0x41, 0x42, 0x43, 0x45, 0x47, 0x48, 0x4a, 0x4b, 0xfe, 0xff);
for (const o of [0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9]) SOUS[o] = PRINT;

// Longueur (zero inclus) d'une chaine SCUMM a partir de p ; renvoie aussi les zones de codes 0xFF.
export function lireChaine(buf, p, fin) {
  let q = p;
  const codes = [];
  for (;;) {
    if (q >= fin) throw new Error(`chaine non terminee a ${p}`);
    const c = buf[q++];
    if (c === 0) break;
    if (c === 0xff) {
      const deb = q - 1;
      const code = buf[q++];
      if (code !== 1 && code !== 2 && code !== 3 && code !== 8) q += 2;
      codes.push([deb, q]);
    }
  }
  return { debut: p, fin: q - 1, finZero: q, codes };
}

// Decode UNE instruction a la position p ; renvoie {off, len, op, sous, saut, chaine, nom}
export function instruction(buf, p, fin) {
  const op = buf[p];
  let q = p + 1;
  const ins = { off: p, op, sous: null, saut: null, chaine: null };
  const verifier = (n) => { if (q + n > fin) throw new Error(`instruction ${op.toString(16)}@${p} depasse la fin du script`); };
  if (OCTET.has(op)) { verifier(1); q += 1; }
  else if (MOT.has(op)) { verifier(2); q += 2; }
  else if (SAUT.has(op)) {
    verifier(2);
    const dec = buf.readInt16LE(q);
    ins.saut = { posMot: q, decalage: dec, cible: q + 2 + dec };
    q += 2;
  } else if (op === 0x97 || op === 0xba || op === 0xbb) {
    ins.chaine = lireChaine(buf, q, fin); q = ins.chaine.finZero;
  } else if (aucun.has(op)) {
    // rien
  } else if (SOUS[op]) {
    verifier(1);
    const s = buf[q++];
    ins.sous = s;
    if (!SOUS[op].has(s)) throw new Error(`sous-code ${s.toString(16)} inconnu pour l'opcode ${op.toString(16)}@${p}`);
    if ((op >= 0xb4 && op <= 0xb9) && s === 0x4b) { ins.chaine = lireChaine(buf, q, fin); q = ins.chaine.finZero; }
    else if (op === 0x9d && s === 0x58) { ins.chaine = lireChaine(buf, q, fin); q = ins.chaine.finZero; }
    else if (op === 0x9e && s === 0x7d) { ins.chaine = lireChaine(buf, q, fin); q = ins.chaine.finZero; }
    else if (op === 0xbc || op === 0xc0) { verifier(2); q += 2; }
    else if (op === 0xa9 && (s === 0xa8 || s === 0xe2 || s === 0xe8)) {
      verifier(2);
      const dec = buf.readInt16LE(q);
      ins.saut = { posMot: q, decalage: dec, cible: q + 2 + dec };
      q += 2;
    }
  } else if (op === 0xa4) {
    verifier(3);
    const s = buf[q++];
    ins.sous = s;
    if (s !== 205 && s !== 208 && s !== 212) throw new Error(`sous-code arrayOps ${s} inconnu @${p}`);
    q += 2;
    if (s === 205) { ins.chaine = lireChaine(buf, q, fin); q = ins.chaine.finZero; }
  } else {
    throw new Error(`opcode invalide ${op.toString(16)}@${p}`);
  }
  ins.len = q - p;
  return ins;
}

// Decode [debut, fin) en entier ; doit tomber EXACTEMENT sur fin. Renvoie {instrs, erreur, starts}.
export function decoder(buf, debut, fin) {
  const instrs = [];
  let p = debut;
  try {
    while (p < fin) {
      const ins = instruction(buf, p, fin);
      instrs.push(ins);
      p += ins.len;
    }
  } catch (e) {
    return { instrs, erreur: e.message, fin: p };
  }
  if (p !== fin) return { instrs, erreur: `fin atteinte a ${p} au lieu de ${fin}`, fin: p };
  return { instrs, erreur: null, fin: p };
}

// Chaque cible de saut doit etre le debut d'une instruction (ou la fin du script).
export function verifierSauts(instrs, debut, fin) {
  const debuts = new Set(instrs.map((i) => i.off));
  debuts.add(fin);
  const mauvais = [];
  for (const i of instrs) {
    if (i.saut && !debuts.has(i.saut.cible)) mauvais.push({ off: i.off, cible: i.saut.cible, debut, fin });
  }
  return mauvais;
}
