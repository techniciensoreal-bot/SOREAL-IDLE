/* Calcule les sorties de normalizeIdleNguState pour toutes les formes, hasard et horloge gelés. Utilisé pour générer references/migrations-avant.json AVANT le chantier (empreintes sha256 : état entier + une par clé de premier niveau), puis par le test. */
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { figerLeHasard, reglerHorloge } from "./_partie-reference.mjs";
import { construireFormes, MAINTENANT_FORMES } from "./_migrations-formes.mjs";

export const empreinte = (o) => crypto.createHash("sha256").update(JSON.stringify(o === undefined ? null : o)).digest("hex").slice(0, 24);

export async function sorties() {
  const { normalizeIdleNguState } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-ngu-etat.js").href);
  const out = {};
  for (const f of construireFormes()) {
    figerLeHasard();
    reglerHorloge(MAINTENANT_FORMES);
    out[f.nom] = JSON.parse(JSON.stringify(normalizeIdleNguState(JSON.parse(JSON.stringify(f.raw)), f.ctx, MAINTENANT_FORMES)));
  }
  return out;
}

export function empreintes(sorties_) {
  const r = {};
  for (const [nom, e] of Object.entries(sorties_)) r[nom] = { tout: empreinte(e), cles: Object.fromEntries(Object.keys(e).sort().map((k) => [k, empreinte(e[k])])) };
  return r;
}
