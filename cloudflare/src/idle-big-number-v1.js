/*
 * SOREAL IDLE — GRAND NOMBRE V1 (mantisse / exposant base 10)
 *
 * Mission NGU (2026-09-08) : idle-ngu-progression.js::safePow()/safeProduct()
 * calculent déjà en espace logarithmique en interne, mais reconvertissent le
 * résultat en Number JS classique via Math.exp() et l'écrêtent arbitrairement
 * à [1e-300, 1e300]. Deux runs qui produiraient "en vrai" 1e400 et 1e900
 * deviennent alors STRICTEMENT IDENTIQUES (tous les deux 1e300) — ce n'est
 * pas juste un plafond, c'est une perte d'ordre total. NGU Idle en Sadistique
 * / fin de partie dépasse couramment 1e300, donc NUMBER et tout ce qui le
 * multiplie ne peuvent structurellement pas être corrects au-delà du début
 * de partie tant que ce plafond existe.
 *
 * Ce module fournit une représentation "grand nombre" minimale — une paire
 * {m, e} telle que valeur = m × 10^e, avec 1 ≤ |m| < 10 (ou m=0) — capable de
 * représenter des exposants bien au-delà de ce qu'un Number JS (max ~1.8e308)
 * peut tenir, tout en restant aussi simple que possible (règle 20 de la
 * mission : "use the simplest representation that preserves correct
 * behavior", pas une precision arbitraire coûteuse partout).
 *
 * Ce fichier est volontairement autonome (aucune dépendance) et n'est PAS
 * encore branché dans toute la chaîne de multiplicateurs NGU — seul
 * idle-ngu-progression.js::safePow()/safeProduct() a été corrigé pour s'en
 * servir en interne (voir ce fichier). Propager cette représentation à
 * attackMultiplier/defenseMultiplier et aux stats de combat qui en découlent
 * est un chantier séparé, documenté comme suite obligatoire dans le rapport
 * de mission — ne pas supposer que "NUMBER est corrigé" veut dire que toute
 * la chaîne aval l'est aussi.
 */

function finite(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/*
 * Normalise (m, e) pour que 1 <= |m| < 10 (ou m===0, e===0).
 * C'est le SEUL endroit qui doit gérer les cas limites d'arrondi
 * (ex. m calculé à 9.99999999999 qui doit rester sous 10).
 */
export function bigNormalizeV1(m, e) {
  const rawM = finite(m, 0);
  const rawE = finite(e, 0);

  if (rawM === 0) return { m: 0, e: 0 };

  const sign = rawM < 0 ? -1 : 1;
  const abs = Math.abs(rawM);

  const shift = Math.floor(Math.log10(abs));
  let mm = abs / Math.pow(10, shift);
  let ee = rawE + shift;

  // Garde-fou contre les erreurs d'arrondi flottant autour des bornes exactes.
  if (mm >= 10) {
    mm /= 10;
    ee += 1;
  } else if (mm < 1) {
    mm *= 10;
    ee -= 1;
  }

  return { m: sign * mm, e: ee };
}

export function bigFromNumberV1(n) {
  const x = finite(n, 0);
  if (x === 0) return { m: 0, e: 0 };
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / Math.pow(10, e);
  return bigNormalizeV1(m, e);
}

/*
 * Construit un grand nombre directement depuis un log10 déjà calculé —
 * c'est le pont naturel avec safePow()/safeProduct(), qui accumulent déjà
 * un logarithme (naturel) en interne : log10 = logNaturel / Math.LN10.
 */
export function bigFromLog10V1(log10Abs, sign) {
  const l = finite(log10Abs, null);
  if (l === null) return { m: 0, e: 0 };
  const s = sign < 0 ? -1 : 1;
  const e = Math.floor(l);
  const m = s * Math.pow(10, l - e);
  return bigNormalizeV1(m, e);
}

function toBigV1(v) {
  if (v && typeof v === "object" && Number.isFinite(v.e) && Number.isFinite(v.m)) {
    return v;
  }
  return bigFromNumberV1(v);
}

export function bigMultiplyV1(a, b) {
  const ba = toBigV1(a);
  const bb = toBigV1(b);
  if (ba.m === 0 || bb.m === 0) return { m: 0, e: 0 };
  return bigNormalizeV1(ba.m * bb.m, ba.e + bb.e);
}

export function bigDivideV1(a, b) {
  const ba = toBigV1(a);
  const bb = toBigV1(b);
  if (bb.m === 0) return { m: 0, e: 0 };
  if (ba.m === 0) return { m: 0, e: 0 };
  return bigNormalizeV1(ba.m / bb.m, ba.e - bb.e);
}

// Produit d'une liste de grands nombres (ou Number JS classiques mélangés).
export function bigProductV1(values) {
  let result = { m: 1, e: 0 };
  for (const value of values) {
    result = bigMultiplyV1(result, toBigV1(value));
    if (result.m === 0) return result;
  }
  return result;
}

// base^exp où base est un grand nombre et exp un exposant Number JS classique.
export function bigPowV1(base, exp) {
  const b = toBigV1(base);
  const e = finite(exp, 0);
  if (b.m === 0) return e === 0 ? { m: 1, e: 0 } : { m: 0, e: 0 };

  const log10Base = Math.log10(Math.abs(b.m)) + b.e;
  const negativeOddPower = b.m < 0 && Math.round(e) === e && Math.round(e) % 2 !== 0;

  return bigFromLog10V1(log10Base * e, negativeOddPower ? -1 : 1);
}

export function bigCompareV1(a, b) {
  const ba = toBigV1(a);
  const bb = toBigV1(b);

  if (ba.m === 0 && bb.m === 0) return 0;
  if (ba.m === 0) return bb.m > 0 ? -1 : 1;
  if (bb.m === 0) return ba.m > 0 ? 1 : -1;

  const signA = ba.m < 0 ? -1 : 1;
  const signB = bb.m < 0 ? -1 : 1;
  if (signA !== signB) return signA > signB ? 1 : -1;

  if (ba.e !== bb.e) {
    const cmp = ba.e > bb.e ? 1 : -1;
    return signA > 0 ? cmp : -cmp;
  }

  if (ba.m === bb.m) return 0;
  return ba.m > bb.m ? 1 : -1;
}

/*
 * Reconvertit en Number JS classique QUAND c'est représentable sans mentir :
 * - au-delà de ~1.79e308 (plafond réel d'un double), renvoie Infinity/-Infinity
 *   plutôt qu'une fausse valeur finie — Infinity reste correctement ORDONNÉ
 *   (toute comparaison avec un nombre fini plus petit reste juste), alors
 *   qu'un écrêtage à une constante arbitraire (l'ancien bug) ne l'est pas.
 * - en dessous de ~-324 (plus petit dénormal), renvoie 0.
 */
export function bigToNumberV1(a) {
  const v = toBigV1(a);
  if (v.m === 0) return 0;
  if (v.e > 308) return v.m > 0 ? Infinity : -Infinity;
  if (v.e < -324) return 0;
  return v.m * Math.pow(10, v.e);
}

// Formatage d'affichage uniquement — jamais utilisé pour un calcul ultérieur.
export function bigFormatV1(a, decimals) {
  const v = toBigV1(a);
  const d = Number.isFinite(decimals) ? decimals : 2;
  if (v.m === 0) return "0";
  if (v.e < 6 && v.e > -6) {
    const asNumber = bigToNumberV1(v);
    return asNumber.toFixed(d).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  return v.m.toFixed(d) + "e" + (v.e >= 0 ? "+" : "") + v.e;
}

export function bigIsFiniteV1(a) {
  const v = toBigV1(a);
  return v.e <= 308 && v.e >= -324;
}
