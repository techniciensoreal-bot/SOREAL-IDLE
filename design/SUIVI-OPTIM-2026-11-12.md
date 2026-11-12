# Suivi : optimisation issue de l'audit code mort / vitesse (2026-11-12)

Demande de Norman : tout faire sans poser de questions. Règles : commits LOCAUX seulement (pas de push sans son ordre) ; rien de visuel supprimé (règle n°5) ; contrat d'opérations et schéma de sauvegarde intacts ; après tout changement de `cloudflare/src` : `node cloudflare/tools/build-moteur-local.mjs` puis `node cloudflare/tools/maj-pins.mjs` ; calcul des bonus : suite avec `SOREAL_IDLE_VERIF_BONUS=1`. Mesures : `node cloudflare/bench/bench-moteur-partie-v1.mjs` (avant : synchro ≈ 60 ms, allocation ≈ 85 ms, départ d'Aventure ≈ 190 ms).

## Étapes (cocher quand fait, validé et committé)
- [x] E1 Gardes `document.hidden` : ui-amorcage-v1.js:831, money-pit-page-v1.js:34 et :64, stats-detail-v1.js:124, ui-magie-energie-v1.js:487 (PAS le Nuke auto :970)
- [x] E2 Regex « 69 % » sans antislash : ui-noyau-v1.js:473
- [x] E3 Moteur : `defById` mémoïsé (idle-adventure-sets.js / objets) ; `idle-ngu-bonus.js:629` en `sansCopie` (`true`)
- [x] E4 Moteur : valeurs par défaut des pistes sans 1 323 clones (idle-ngu-catalogues.js:136, idle-ngu-etat.js:79)
- [x] E5 Moteur : catalogue des perks précalculé (idle-perks-v1.js:378) ; lectures répétées de fonctions pures
- [x] E6 Moteur : trajectoire, normaliser une fois + mémo pendant la projection (idle-runtime-etat.js:2051)
- [~] E7 Moteur : sac d'Aventure, clé d'équipement une seule fois, normalisation sautée si déjà normalisé (idle-adventure-objets.js:343)
- [~] E8 Moteur : adaptateur d'énergie inerte `simulateurEnergieAuto` + bloc p15 + expression morte (idle-runtime-progression.js:2254, 507)
- [~] E9 Moteur : 23 `getScriptLock` remplacés par un `avecJoueur(fn)` (garder idle-run-operation-sync-critical-section)
- [x] E10 Hygiène : retirer les `.pyc` suivis (voice-studio/__pycache__) + `.gitignore` ; outils sans citation (voir audit) ; fonctions mortes ou « tests seuls » sûres (hors borne)
- [x] E11 Reconstruire le moteur local, maj-pins, bancs avant/après, suite complète `preparer-push.mjs --a-blanc` si possible
- [x] E12 Bilan chiffré ici + supprimer la tâche planifiée (CronDelete)

## Reporté (décision de Norman requise)
12 @keyframes morts, 9 animations de la borne, 18 opérations désactivées du contrat, colonnes héritées, `idle_players.state_json`, observateur central et chargement à la demande (changements visuels à valider avec lui), CSS `filter`/`background-position` vers `transform`.

## Journal
- E1-E3 faits ; banc partie de référence : synchro 57 ms, allocation 78 ms, départ d'Aventure 167 ms (avant 60/85/190). Test idle-menu-alimente-effets mis à jour (chaîne gardée).
- E4 (un seul gabarit de pistes par appel ; le gros du clone reste la copie de l'état entier dans normalizeIdleNguState, 1021) et E5 (paires de bonus par perk calculées une fois) faits : synchro 56 ms, allocation 76 ms, départ 165 ms. Parties de référence OK.
- E6 fait : la trajectoire normalise l'état une fois (copie par instant) ; SOREAL_IDLE_VERIF_TRAJECTOIRE=1 compare les multiplicateurs à l'ancien chemin (stats-instantanees et augments OK ; ne PAS le combiner avec idle-parties-reference : il tire du hasard en plus). Parties de référence identiques sans le mode. Banc : synchro 54 ms, allocation 72, départ 163.
- E7 REPORTÉ : sauter la normalisation du sac pour un état « déjà normalisé » (WeakSet) est dangereux, l'état est modifié après normalisation par les actions ; un correctif sûr demande un compteur de version par bloc (≈ 28 sites d'écriture).
- E8 REPORTÉ : le bloc p15 n'est pas purement mort : il remet `statsCombat.energieTickResteMs` à 0 (resteMs du simulateur inerte) ; le retirer pourrait changer un résultat. À traiter avec une vérification de cette valeur, hors vitesse.
- E9 REPORTÉ : 23 `getScriptLock` à remplacer, gain de vitesse nul (verrou = booléen), touche le test de section critique ; faible intérêt.
- E10 fait : `.pyc` retirés de git + `.gitignore`. Outils « sans citation » CONSERVÉS : figer-partie-reference.mjs (régénère les parties de référence, AGENTS.md), banc-barres-v1.js, decouper/detourer/gabarits-machine (production d'images), lancer-jeu-local.bat, titans-r2-renommage (trace de migration).
- E11 fait : moteur local reconstruit, pins montés. Suite complète (1 250 fichiers, 6 à la fois) : seuls les 3 échecs connus de la machine (idle-graine-contenu-v1, idle-histoires-utiles-v1, idle-studio-port-libre-v1, signalés à l'audit du 09/11).
## Bilan (E12)
Partie de référence avancée, banc `bench-moteur-partie-v1.mjs` : synchro 60 -> 54 ms (-10 %), allocation 85 -> 72 ms (-15 %), départ d'Aventure 190 -> 163 ms (-14 %). Rien n'est poussé (pas d'ordre) : 5 commits locaux + un dernier de régénération. Avant le push : note du jour (verifier-note-du-jour.mjs) + marquer-nouveautes-push.mjs.
Restes (décision ou chantier à part) : sac d'Aventure (compteur de version par bloc), p15/energieTickResteMs, getScriptLock, 12 keyframes morts, 9 animations de la borne, 18 opérations désactivées, colonnes héritées, observateur central, chargement à la demande, CSS vers transform.

## Deuxième passe (Norman : « ne pas s'arrêter »)
- [x] F1 Moteur : bloc d'énergie inerte (p15 + simulateur) remplacé par ses effets exacts (constantes), sans changer un résultat
- [ ] F2 Moteur : sac d'Aventure, normalisation évitée de façon SÛRE (vérification optionnelle en mode test)
- [ ] F3 Moteur : 23 `getScriptLock` -> un seul `avecJoueur`
- [ ] F4 Moteur : fonctions « tests seuls » et utilitaires copiés (idle-big-number, cleAvecLangue, etc.)
- [ ] F5 Frontend : 12 keyframes jamais référencés retirés + catalogue des visuels régénéré (rien de joué ne disparaît)
- [ ] F6 Frontend : globales posées jamais lues + cales périmées
- [ ] F7 Frontend : formateurs de durée/nombre dupliqués -> les modules communs existants
- [ ] F8 Reconstruire moteur local, pins, suite complète, bilan, CronDelete
