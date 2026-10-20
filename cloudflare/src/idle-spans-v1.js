/*
 * Chronométrage par phase du moteur (journal de fluidité, Norman 2026-10-20 : « une synchro prend 192 ms de calcul chez moi, 28 ms sur la partie de test »). Désactivé par défaut : un seul test de booléen par
 * phase. Le Worker du moteur local l'active pour l'administrateur (message « spans ») et renvoie, avec chaque réponse, le temps passé dans chaque phase ; le journal en fait des moyennes par opération.
 */
export const SPANS_V1 = { actif: false, donnees: Object.create(null) };

export function span(nom, fn) {
  if (!SPANS_V1.actif) return fn();
  const t0 = performance.now();
  try { return fn(); } finally {
    const d = performance.now() - t0;
    const o = SPANS_V1.donnees[nom] || (SPANS_V1.donnees[nom] = { n: 0, ms: 0 });
    o.n += 1; o.ms += d;
  }
}

/* Enveloppe une fonction nommée (utilisé en fin de module : `f = enveloppeSpan("nom", f)`). */
export function enveloppeSpan(nom, f) {
  return function () {
    if (!SPANS_V1.actif) return f.apply(this, arguments);
    const t0 = performance.now();
    try { return f.apply(this, arguments); } finally {
      const d = performance.now() - t0;
      const o = SPANS_V1.donnees[nom] || (SPANS_V1.donnees[nom] = { n: 0, ms: 0 });
      o.n += 1; o.ms += d;
    }
  };
}

export function spansActiver(oui) { SPANS_V1.actif = Boolean(oui); if (!oui) SPANS_V1.donnees = Object.create(null); }
export function spansPrelever() { const d = SPANS_V1.donnees; SPANS_V1.donnees = Object.create(null); return d; }
