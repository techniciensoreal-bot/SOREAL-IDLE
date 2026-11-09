/*
 * Fenêtre de l'instant du clic (Norman, 2026-11-05 : « la barre avance sans énergie »). Le client envoie l'instant de son clic (clientAt, heure du serveur) ; le moteur ne le croit
 * que s'il n'est ni dans le futur ni plus ancien que cette fenêtre. UNE seule constante pour les deux règles de bornage :
 *  - idle-ngu-actions.js `instantClicAllocationV1` (action de rythme NGU : accepte aussi clientAt <= 0, instant « maintenant » fourni par l'appelant) ;
 *  - idle-runtime-progression.js `instantClicValideV1` (synchro avant action et Entraînement de base : rejette clic <= 0, « maintenant » = Date.now()).
 * Les deux fonctions NE sont PAS fusionnées : leurs bornes diffèrent (clic <= 0 et source de « maintenant »), les unifier changerait un résultat.
 * `instantStrictementCroissantIdleV1_` (index-idle-coordinator-v1.js) est un autre sujet (horodatage de réponse strictement croissant), sans rapport avec cette fenêtre.
 */
export const FENETRE_INSTANT_CLIC_MS_V1 = 5000;
