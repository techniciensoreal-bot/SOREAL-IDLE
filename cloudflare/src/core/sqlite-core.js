/*
 * Extrait de SOREAL-TV (cloudflare/src/core/sqlite-core.js) lors du
 * découpage de SOREAL IDLE en dépôt dédié (2026-09-15) — seules les 3
 * fonctions réellement utilisées par le moteur de jeu, dupliquées ici
 * à l'identique plutôt que partagées entre dépôts (même principe déjà
 * appliqué à chaque satellite Worker déjà extrait : jamais de
 * dépendance croisée entre dépôts déployés séparément).
 */

export function sqlRows(cursor) {
  return cursor ? Array.from(cursor) : [];
}

export function safeJson(value, fallback=null) {
  if(value == null || value === "") return fallback;
  try { return JSON.parse(String(value)); } catch(_) { return fallback; }
}

export function jsonText(value) {
  return JSON.stringify(value == null ? null : value);
}
