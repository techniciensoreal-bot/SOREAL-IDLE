/*
 * Préférences d'interface liées au COMPTE (Norman, 2026-10-16 : « les cases, les inputs, les réglages... tout doit être lié au compte et pareil sur tous les appareils »).
 * Le client garde ses choix dans le stockage du navigateur (cases cochées, montants saisis, onglets, volumes, réglages...) ; ce module les range côté serveur, dans l'état de la partie
 * (state.uiPrefs), pour qu'un autre appareil les retrouve. Le serveur ne comprend aucune clé : ce sont des couples texte -> texte, sans effet sur le jeu (jamais lus par le moteur de jeu).
 * Limites strictes (le client est hors de confiance) : forme de la clé, taille d'une valeur, nombre de clés, taille totale.
 */
export const IDLE_UI_PREFS_MAX_CLES_V1 = 400;
export const IDLE_UI_PREFS_MAX_VALEUR_V1 = 8000;
export const IDLE_UI_PREFS_MAX_TOTAL_V1 = 96000;
const FORME_CLE = /^[A-Za-z0-9_.:\-]{1,120}$/;

/* État tel qu'il est stocké : objet { clé: texte }, trié par clé (pas d'ordre qui change d'un enregistrement à l'autre). */
export function nettoyerUiPrefsV1(brut) {
  const source = brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {};
  const sortie = {};
  let total = 0;
  let n = 0;
  for (const cle of Object.keys(source).sort()) {
    const valeur = source[cle];
    if (!FORME_CLE.test(cle) || typeof valeur !== "string" || valeur.length > IDLE_UI_PREFS_MAX_VALEUR_V1) continue;
    if (n >= IDLE_UI_PREFS_MAX_CLES_V1 || total + cle.length + valeur.length > IDLE_UI_PREFS_MAX_TOTAL_V1) break;
    sortie[cle] = valeur;
    total += cle.length + valeur.length;
    n += 1;
  }
  return sortie;
}

/* Action « setUiPrefs » : { prefs: { clé: texte | null } } ; null supprime la clé. Les entrées invalides sont ignorées (jamais d'erreur : une préférence ne doit jamais casser une action). */
export function appliquerUiPrefsV1(state, prefs) {
  const courant = nettoyerUiPrefsV1(state.uiPrefs);
  const demande = prefs && typeof prefs === "object" && !Array.isArray(prefs) ? prefs : {};
  let acceptees = 0;
  let ignorees = 0;
  for (const cle of Object.keys(demande).slice(0, IDLE_UI_PREFS_MAX_CLES_V1)) {
    const valeur = demande[cle];
    if (!FORME_CLE.test(cle)) { ignorees += 1; continue; }
    if (valeur === null) { if (cle in courant) { delete courant[cle]; } acceptees += 1; continue; }
    if (typeof valeur !== "string" || valeur.length > IDLE_UI_PREFS_MAX_VALEUR_V1) { ignorees += 1; continue; }
    courant[cle] = valeur;
    acceptees += 1;
  }
  state.uiPrefs = nettoyerUiPrefsV1(courant);
  return { acceptees, ignorees, cles: Object.keys(state.uiPrefs).length };
}
