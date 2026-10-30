/*
 * Victoires par boss (Norman, 2026-10-30 : « sur les cartes, on doit voir le nombre de fois qu'on a tué ce boss ») : compteur { "<numéro du boss>": nombre de victoires } dans les statistiques du joueur (stats.victoiresBoss).
 * Compté à chaque boss principal vaincu, au combat comme au NUKE. Avant cette date rien n'était compté : la Collection affiche au moins 1 pour un boss déjà vaincu, puis le vrai total grandit à partir de maintenant.
 */
export function compterVictoireBossV1_(stats, numero) {
  const n = Math.floor(Number(numero) || 0);
  if (!stats || n < 1 || n > 999) return;
  const o = normaliserVictoiresBossV1_(stats.victoiresBoss);
  o[String(n)] = Math.min(1e9, (o[String(n)] || 0) + 1);
  stats.victoiresBoss = o;
}

/* Copie propre : seulement des clés « numéro de boss » et des entiers positifs (la lecture des statistiques ne garde rien d'autre). */
export function normaliserVictoiresBossV1_(v) {
  const o = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of Object.keys(v).slice(0, 400)) {
      const n = Math.floor(Number(v[k]) || 0);
      if (/^\d{1,3}$/.test(k) && n > 0) o[k] = Math.min(1e9, n);
    }
  }
  return o;
}
