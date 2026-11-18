/*
 * Aide des tests de la page NGU (rendue par composants Preact, modules/ngu-labo-v1.js, chantier de fluidité du 2026-11-18) : faux DOM + VRAI Preact + VRAI pont, à préparer AVANT le chargement du module (il lit window.preact).
 *   preparerNgu(fenetre)        -> prépare `fenetre` (window, document, preact, pont) et renvoie le faux document
 *   monterNgu(fenetre, joueur)  -> pose le conteneur du pont dans la page, appelle labo.page(joueur) puis les crochets « après redessin » (rendu réel dans le DOM) ; renvoie la chaîne donnée au morph
 *   htmlNgu(fenetre, joueur)    -> rendu synchrone vers une chaîne HTML (labo.html, tests de contenu)
 */
import { preparerVdom } from "./_ygg-vdom.mjs";

export function preparerNgu(fenetre) {
  return preparerVdom(fenetre);
}
export function monterNgu(fenetre, joueur) {
  const d = fenetre.document, L = fenetre.__SOREAL_IDLE_NGU_LABO_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__;
  if (!d.querySelector('[data-vdom="ngu"]')) {
    const c = d.createElement("div");
    c.setAttribute("id", "vdom-ngu");
    c.setAttribute("data-vdom", "ngu");
    d.body.appendChild(c);
  }
  const chaine = L.page(joueur);
  V.appliquer();
  return chaine;
}
export function htmlNgu(fenetre, joueur) {
  return fenetre.__SOREAL_IDLE_NGU_LABO_V1__.html(joueur);
}
