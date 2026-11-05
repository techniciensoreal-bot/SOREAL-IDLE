/*
 * Copie profonde de données JSON : MÊME résultat que JSON.parse(JSON.stringify(v)) (nombres non finis -> null, undefined/fonctions ignorés dans un objet et remplacés par null dans un tableau, toJSON appelé), 5 fois plus vite
 * (0,27 ms au lieu de 1,37 ms sur l'état de Norman, 130 Ko ; un état est copié une dizaine de fois par opération). Plan design/PLAN-MOTEUR-UNIQUE.md, étape 2. Test : idle-clone-json-v1.
 */
export function copieJsonV1(v) {
  if (v === null) return null;
  const t = typeof v;
  if (t === "number") return Number.isFinite(v) ? (v === 0 ? 0 : v) : null;   /* -0 devient 0 comme dans l'aller-retour JSON */
  if (t === "string" || t === "boolean") return v;
  if (t !== "object") return undefined;
  if (typeof v.toJSON === "function") return copieJsonV1(v.toJSON());
  if (Array.isArray(v)) {
    const n = v.length, o = new Array(n);
    for (let i = 0; i < n; i++) { const c = copieJsonV1(v[i]); o[i] = c === undefined ? null : c; }
    return o;
  }
  const o = {};
  const cles = Object.keys(v);
  for (let i = 0; i < cles.length; i++) { const k = cles[i]; const c = copieJsonV1(v[k]); if (c !== undefined) o[k] = c; }
  return o;
}
