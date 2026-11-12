# Suivi : optimisation issue de l'audit code mort / vitesse (2026-11-12)

Demande de Norman : tout faire sans poser de questions. Règles : commits LOCAUX seulement (pas de push sans son ordre) ; rien de visuel supprimé (règle n°5) ; contrat d'opérations et schéma de sauvegarde intacts ; après tout changement de `cloudflare/src` : `node cloudflare/tools/build-moteur-local.mjs` puis `node cloudflare/tools/maj-pins.mjs` ; calcul des bonus : suite avec `SOREAL_IDLE_VERIF_BONUS=1`. Mesures : `node cloudflare/bench/bench-moteur-partie-v1.mjs` (avant : synchro ≈ 60 ms, allocation ≈ 85 ms, départ d'Aventure ≈ 190 ms).

## Étapes (cocher quand fait, validé et committé)
- [x] E1 Gardes `document.hidden` : ui-amorcage-v1.js:831, money-pit-page-v1.js:34 et :64, stats-detail-v1.js:124, ui-magie-energie-v1.js:487 (PAS le Nuke auto :970)
- [x] E2 Regex « 69 % » sans antislash : ui-noyau-v1.js:473
- [x] E3 Moteur : `defById` mémoïsé (idle-adventure-sets.js / objets) ; `idle-ngu-bonus.js:629` en `sansCopie` (`true`)
- [x] E4 Moteur : valeurs par défaut des pistes sans 1 323 clones (idle-ngu-catalogues.js:136, idle-ngu-etat.js:79)
- [x] E5 Moteur : catalogue des perks précalculé (idle-perks-v1.js:378) ; lectures répétées de fonctions pures
- [x] E6 Moteur : trajectoire, normaliser une fois + mémo pendant la projection (idle-runtime-etat.js:2051)
- [ ] E7 Moteur : sac d'Aventure, clé d'équipement une seule fois, normalisation sautée si déjà normalisé (idle-adventure-objets.js:343)
- [ ] E8 Moteur : adaptateur d'énergie inerte `simulateurEnergieAuto` + bloc p15 + expression morte (idle-runtime-progression.js:2254, 507)
- [ ] E9 Moteur : 23 `getScriptLock` remplacés par un `avecJoueur(fn)` (garder idle-run-operation-sync-critical-section)
- [ ] E10 Hygiène : retirer les `.pyc` suivis (voice-studio/__pycache__) + `.gitignore` ; outils sans citation (voir audit) ; fonctions mortes ou « tests seuls » sûres (hors borne)
- [ ] E11 Reconstruire le moteur local, maj-pins, bancs avant/après, suite complète `preparer-push.mjs --a-blanc` si possible
- [ ] E12 Bilan chiffré ici + supprimer la tâche planifiée (CronDelete)

## Reporté (décision de Norman requise)
12 @keyframes morts, 9 animations de la borne, 18 opérations désactivées du contrat, colonnes héritées, `idle_players.state_json`, observateur central et chargement à la demande (changements visuels à valider avec lui), CSS `filter`/`background-position` vers `transform`.

## Journal
- E1-E3 faits ; banc partie de référence : synchro 57 ms, allocation 78 ms, départ d'Aventure 167 ms (avant 60/85/190). Test idle-menu-alimente-effets mis à jour (chaîne gardée).
- E4 (un seul gabarit de pistes par appel ; le gros du clone reste la copie de l'état entier dans normalizeIdleNguState, 1021) et E5 (paires de bonus par perk calculées une fois) faits : synchro 56 ms, allocation 76 ms, départ 165 ms. Parties de référence OK.
- E6 fait : la trajectoire normalise l'état une fois (copie par instant) ; SOREAL_IDLE_VERIF_TRAJECTOIRE=1 compare les multiplicateurs à l'ancien chemin (stats-instantanees et augments OK ; ne PAS le combiner avec idle-parties-reference : il tire du hasard en plus). Parties de référence identiques sans le mode. Banc : synchro 54 ms, allocation 72, départ 163.
