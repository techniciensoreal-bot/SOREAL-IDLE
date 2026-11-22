# Audit moteur (cloudflare/src) : rapidité et code mort, 2026-11-22

Aucun chiffre de jeu, aucune formule, aucune opération ni aucun champ de réponse n'a été modifié.

## 1. Rapidité

Mesure : `node cloudflare/bench/bench-moteur-partie-v1.mjs partie-reference-2 40` (compte avancé) et `bench-moteur.mjs` (compte neuf), profil `--cpu-prof`.

Profil AVANT (compte avancé, 14,8 s cumulées sur ~120 appels) :
1. Clé du mémo des bonus (`idleNguBonusesMemoInterneV1`, JSON.stringify de ~42 Ko) : 14 % en propre ; ~100 clés par opération (13 425 clés pour 1 885 recalculs réels).
2. `copieJsonV1` : 11,6 % (normalisation de l'état d'Aventure, bestiaire, stats).
3. `idleAdventureCleEquipementV1` : 6,6 % (clé d'équipement sérialisée puis ré-échappée dans la clé des bonus).
4. `perkBonusesV1` : 6,4 % en propre (0,5 ms par appel, ~50 appels par synchro, fonction pure refaite à chaque fois).
5. `structuredClone` (copies des mémos) 4,4 %, `wishBonusesV1`/`produitParSouhaitV1` 3,8 % (+ 99 ms de RegExp), `parserJsonSorealIdle_` 2,7 %.

Corrigé (tout est pur, clé de contenu, une copie par appel, donc résultats identiques) :
- `perkBonusesV1`, `quirkBonusesV1`, `wishBonusesV1` mémoïsés par les niveaux bornés des seuls éléments du catalogue (Map de 64 entrées max, vidée au-delà). Chaque appel reçoit sa propre copie (y compris `hackMilestoneReduction`).
- Clé du mémo des bonus : la clé d'équipement est embarquée sous forme de tableau (`idleAdventureCleEquipementPartiesV1`) au lieu d'une chaîne JSON re-échappée ; `idleAdventureCleEquipementV1` reste exportée, identique (utilisée par les tests).

Non touché (déjà optimisé, ou risque) : copies profondes de la normalisation d'Aventure, trajectoire des multiplicateurs, ~9 `normalizeIdleNguState` par opération, clé de 42 Ko (la réduire demanderait une nouvelle preuve par mutation).

Mesures (moyennes, machine au repos, 3 passes) :

| Mesure | Avant | Après | Gain |
|---|---|---|---|
| synchro (compte avancé, 4 s) | 68,6 ms | 57,6 ms | -11 ms (-16 %) |
| action : allocation | 87,0 ms | 70,7 ms | -16 ms (-19 %) |
| action : Aventure (départ) | 192,6 ms | 162,2 ms | -30 ms (-16 %) |
| obtenirEtat (compte neuf) | 21,2 ms | 18,8 ms | -2,4 ms (-11 %) |
| agirProgression zone sûre (compte neuf) | 12,8 ms | 10,1 ms | -2,7 ms (-21 %) |

## 2. Code mort

Script (hors dépôt) : chaque déclaration de niveau module de `cloudflare/src`, comptée dans src (commentaires retirés), tests, public, tools, desktop, contrat, workflows.

Supprimé :
- `challengeNguLevels` (idle-ngu-snapshot.js, enveloppe locale sans appelant ; la copie sous `desktop/dist` est un ancien build).
- `genererObjetBossSorealIdle_` (idle-runtime-collection.js, « compatibilité avec le combat principal historique », aucun appelant ; le test `idle-boss-reward-footer-v1` n'affirme que son absence d'appel).
- 236 spécificateurs d'import inutilisés dans 17 fichiers (dont 153 dans `idle-ngu-progression.js`, reste du découpage) ; une instruction entièrement inutilisée devient `import "./x.js"` (35 cas) pour garder exactement l'ordre d'évaluation des modules.

Bilan git : environ 245 lignes supprimées, 109 ajoutées (le code ajouté est le mémo des bonus), net moins 136 lignes.

Laissé, par prudence :
- `idle-sqlite-runtime.js` : ses imports inutilisés sont gardés tels quels, car `idle-bestiaire-aventure-v47-rebuild.test.mjs` affirme le texte exact de l'import (le test a échoué, annulé). 52 imports inutilisés y restent.
- `MOTIFS_CHOIX_APPAREIL_V1` (idle-local-sync-v1.js, export, aucune référence) : documente les motifs de sauvegarde, lié à `MOTIFS_A_PART_SQL` ; doute, laissé.
- `IDLE_BADAVATAR_CORPS_MAX_V1` (borne du profil, aucune référence) et `IDLE_LANGUES_V1` : constantes de bornes/langues, possibles usages côté client ou APP ; laissées.
- `idleNguItopodStatBonusPctV1` (idle-ngu-actions.js, locale, citée seulement dans un commentaire de décision) : laissée avec son commentaire.
- Aucun fichier de `cloudflare/src` n'est non référencé. Aucune opération, aucun champ de réponse, aucune action `applyIdleNguAction` ni constante de jeu n'a été touché.

## 3. Vérification

Suite entière (1 409 tests, `SOREAL_IDLE_VERIF_BONUS=1`, 6 en parallèle) : tout vert sauf 3 échecs, aucun lié à mes changements :
- `idle-bestiaire-aventure-v47-rebuild` : dû à mon nettoyage d'imports de sqlite-runtime, annulé, test relancé vert.
- `idle-audit-architecture-v1` et `idle-pins-assets-v1` : `?v=` périmés pour `soreal-idle-ui.css` / `soreal-idle-themes.css` (CSS modifiés par d'autres agents) ; se règlent avec `maj-pins.mjs`.
Deux tests créés par d'autres agents pendant la passe n'ont pas été lancés. `idle-parties-reference-v1`, `idle-bonus-memo-v1`, `idle-alea-horloge-cliquet-v1`, `idle-bonus-cle-v1`, `idle-bonus-cle-blocs-v1`, `idle-equipement-cle-v1` : verts.

Reste à faire côté responsable : `build-moteur-local.mjs` (src modifié), `maj-pins.mjs`.

## Fichiers modifiés
idle-perks-v1.js, idle-quirks-v1.js, idle-wishes-v1.js, idle-adventure-v47.js, idle-ngu-bonus.js, idle-ngu-snapshot.js, idle-runtime-collection.js, et les imports de idle-adventure-v47, idle-cards-v1, idle-ngu-actions, idle-ngu-bonus, idle-ngu-etat, idle-ngu-pistes, idle-ngu-progression, idle-ngu-ressources, idle-ngu-snapshot, idle-ngu-systemes, idle-runtime-combat, idle-runtime-etat, idle-runtime-progression.
