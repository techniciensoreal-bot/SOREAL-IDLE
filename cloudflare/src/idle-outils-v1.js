/*
 * Outils communs du moteur (audit de cohérence 2026-11-09, § 2 A4) : ces petites fonctions étaient redéfinies à l'identique dans onze fichiers. Une définition locale n'est remplacée par un import QUE si son corps est
 * strictement identique à celui d'ici (même test de finitude, même repli, même arrondi) ; sinon elle reste en place (voir le rapport de l'audit pour la liste des écarts : trunc/floor, repli Number(d||0), clamp sans repli...).
 */

/* N : nombre fini ou valeur de repli (`+v`). */
export const nombreV1 = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/* I : entier arrondi vers le BAS (Math.floor, pas trunc : -1,5 donne -2). */
export const entierV1 = (v, d = 0) => Math.floor(nombreV1(v, d));

/* num : variante `Number(v)` (même résultat que nombreV1 sauf pour un BigInt, que `+v` refuse). */
export function numV1(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
