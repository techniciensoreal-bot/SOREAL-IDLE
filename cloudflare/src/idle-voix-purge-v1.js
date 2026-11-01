/*
 * Purge STRICTE des voix (Norman, 2026-11-01 : « tout ce que je considère comme validé dans les voix doit être la SEULE version qui existe après ça ; "Supprimer les voix inutiles" supprime les voix qui ne sont pas liées aux
 * histoires quand j'ai fait Enregistrer »). Fonction PURE, partagée par la route POST /api/v1/voice-purge?strict=1 (idle-worker-entry-v1.js) et l'outil desktop/purger-voix-obsoletes.mjs --strict.
 *
 * Une voix (idle/voix/<empreinte de 14 hexa>.m4a) est UTILE si et seulement si :
 *   (a) son empreinte est dans une liste « voix » déclarée d'un texte enregistré ou d'une histoire (`declarees`) ;
 *   (b) c'est une voix statique du manifeste public/voice/manifest.json (`manifeste`) qui n'est PAS liée à un texte enregistré (`liees` : empreintes calculées, avec le vrai module de narration, à partir du texte d'origine, affiché ou
 *       dit d'un texte qui a une liste « voix ») ;
 *   (c) c'est une voix anglaise (`anglaises`, facultatif : celles du manifeste ne sont jamais dans `liees`, qui ne vient que de textes français).
 * Tout le reste est à supprimer : voix orphelines, anciennes variantes d'un texte enregistré, y compris celles que le manifeste cite encore. (a) l'emporte toujours : une voix déclarée n'est JAMAIS supprimée.
 * Une clé qui n'a pas la forme d'une voix (sous-dossier, autre extension) n'est jamais touchée (raison « inattendu »).
 */
const CLE_VOIX = /^idle\/voix\/([0-9a-f]{14})\.m4a$/;

export function planPurgeVoixStrictV1({ fichiers, declarees, manifeste, anglaises, liees }) {
  const dec = new Set([...(declarees || [])].map(String));
  const man = new Set([...(manifeste || [])].map(String));
  const ang = new Set([...(anglaises || [])].map(String));
  const lie = new Set([...(liees || [])].map(String));
  const gardees = [];
  const aSupprimer = [];
  const inattendus = [];
  for (const f of fichiers || []) {
    const cle = String(f.cle);
    const taille = Number(f.taille) || 0;
    const m = CLE_VOIX.exec(cle);
    if (!m) { inattendus.push({ cle, taille }); continue; }
    const h = m[1];
    if (dec.has(h)) gardees.push({ cle, taille, raison: "declaree" });
    else if (ang.has(h)) gardees.push({ cle, taille, raison: "anglaise" });
    else if (man.has(h) && !lie.has(h)) gardees.push({ cle, taille, raison: "statique" });
    else aSupprimer.push({ cle, taille, raison: man.has(h) ? "ancienne-variante-d-un-texte-enregistre" : "orpheline" });
  }
  return { gardees, aSupprimer, inattendus, octetsLiberes: aSupprimer.reduce((s, x) => s + x.taille, 0) };
}

/* Corps de requête : { liees: [empreintes], confirmer: <nombre exact de fichiers à supprimer> }. Toute entrée invalide est ignorée. */
export function lireCorpsPurgeV1(corps) {
  const liees = Array.isArray(corps && corps.liees) ? corps.liees.map(String).filter((h) => /^[0-9a-f]{14}$/.test(h)).slice(0, 20000) : [];
  const confirmer = Number.isInteger(corps && corps.confirmer) && corps.confirmer >= 0 ? corps.confirmer : null;
  return { liees, confirmer };
}
