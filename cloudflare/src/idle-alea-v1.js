/*
 * Hasard du moteur (audit de cohérence 2026-11-09, § 2 B1) : point d'entrée unique pour tirer au sort via le contexte d'une opération. `contexte.alea` (une fonction sans argument qui renvoie un nombre dans [0, 1[) permet à un test
 * ou à un rejeu de fournir un hasard à graine ; sans lui, c'est Math.random, EXACTEMENT comme avant (aucun tirage ne change). Les appels directs à Math.random et Date.now du moteur sont plafonnés par
 * tests/idle-alea-horloge-cliquet-v1.test.mjs : un nouveau tirage passe par ici.
 */
export function aleaV1(contexte) {
  return (contexte && typeof contexte.alea === "function") ? contexte.alea : Math.random;
}
