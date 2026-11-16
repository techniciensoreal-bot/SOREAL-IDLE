/* Aides communes des tests de la chaîne secrète de l'Exilé (idle-antlers-*.test.mjs). */
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

export const CTX = { bosses: 301, difficulty: "difficile" };

export function neuf() { return normalizeIdleAdventureStateV47({}); }

export function agir(s, p, ctx = CTX, t = 1_000_000) { return applyIdleAdventureActionV47(s, p, ctx, t); }

export function ajouter(s, definitionId, level = 0) {
  const r = agir(s, { action: "addItem", definitionId, level });
  return { s: r.state, o: r.result };
}

export function equiper(s, definitionId, slot) {
  const a = ajouter(s, definitionId);
  const r = agir(a.s, { action: "equip", id: a.o.id, slot });
  return r.state;
}

export function avecAleatoire(valeurs, fn) {
  const orig = Math.random;
  let i = 0;
  const liste = Array.isArray(valeurs) ? valeurs : null;
  Math.random = () => (liste ? liste[Math.min(i++, liste.length - 1)] : valeurs);
  try { return fn(); } finally { Math.random = orig; }
}

export function possede(s, definitionId) { return s.inventory.filter(x => x.definitionId === definitionId).length; }
