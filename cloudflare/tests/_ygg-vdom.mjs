/*
 * Aide des tests de la page Yggdrasil (rendue par composants Preact, modules/vdom-pont-v1.js) : prépare une fenêtre de test avec un faux DOM
 * (_faux-dom-vdom.mjs), le VRAI Preact du jeu et le VRAI pont, AVANT le chargement de modules/yggdrasil-elfes-v1.js (qui lit window.preact au chargement).
 * `Y.html(joueur)` rend la page vers une chaîne HTML (l'ancien `Y.page(joueur)` ne renvoie plus que le conteneur stable du pont).
 */
import { creerDocument, chargerPreact, chargerPont } from "./_faux-dom-vdom.mjs";

export function preparerVdom(fenetre) {
  const document = creerDocument();
  fenetre.window = fenetre;
  fenetre.document = document;
  chargerPreact(fenetre);
  chargerPont(fenetre);
  return document;
}
