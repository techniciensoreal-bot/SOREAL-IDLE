# Chantier de nettoyage progressif de SOREAL IDLE : prompt adapté

Version adaptée (2026-10-07) du prompt d'audit reçu. Elle garde ses garde-fous (rien ne change côté joueur, un sujet par commit, journal à jour) et corrige ce qui ne collait pas au dépôt réel.

## Ce qui a changé par rapport au prompt d'origine

| Prompt d'origine | Réalité vérifiée | Adaptation |
|---|---|---|
| « La CI n'a pas tourné depuis le 2 octobre » | Faux : run n°833 SUCCESS sur `27aab22` (7 oct., 13h06-13h09 UTC), 916 runs au total | La section « anomalie CI » est supprimée. On vérifie seulement le dernier run par l'API publique GitHub. |
| Extraire avec `export function` (modules ES) | Le frontend charge des scripts classiques `<script defer>` ; `soreal-idle-ui.js` est une seule fermeture de ~24 000 lignes | Extraction « module classique » : un fichier qui expose un objet `window.__SOREAL_IDLE_<NOM>_V1__`, branché par le motif hôte déjà utilisé (`__SOREAL_IDLE_META_HOST_V130__`). |
| Beaucoup de tests de chaînes | Vrai : le 7 oct., trois fonctions de boutons ont été perdues sans qu'aucun test ne casse | **Avant toute extraction, un filet de sécurité** (lot 1) : les appels `window.__x__(` des boutons doivent exister, et le comportement des zones fragiles doit être testé pour de vrai. |
| Branche de travail + PR pour chaque lot | Un seul développeur ; chaque push sur `main` part en production | Pas de PR. Travail local par petits commits ; **push uniquement quand Norman dit « push »** ; suite complète verte avant. |
| Refonte CSS, versionnement, contrat API, SQLite dans le même chantier | Sujets indépendants | Reportés en chantiers séparés (voir « Hors périmètre »). |

## Règles qui ne changent pas

1. Aucun changement de gameplay, de design, de formule, de texte ni de timing pendant une extraction. Fidélité au wiki NGU (`AGENTS.md`, règle n°1) ; aucun spoil (règle n°2).
2. Un problème à la fois, un commit par extraction, jamais plusieurs refactorings dans un même commit. Message `refactor(idle): …` / `test(idle): …`, terminé par la ligne `Co-Authored-By`.
3. Suite complète verte avant chaque commit : `for f in cloudflare/tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done` depuis la racine. Puis `node cloudflare/build-standalone.mjs` et `node --check` sur tous les fichiers JS publics avant un push.
4. Ne jamais supprimer du code « parce qu'aucun appel n'est trouvé » : il peut être appelé par `window.*`, un `onclick` dans du HTML généré, le bridge APP/TV, un nom dynamique, le Durable Object, l'admin ou un test.
5. Un test qui casse n'est jamais modifié « pour qu'il passe » : on prouve d'abord que le comportement est identique.
6. Journal : `docs/WORKLOG.md` est mis à jour après chaque lot (tâche, SHA, ce qui a bougé, tests, erreur exacte avant de corriger, prochaine action).
7. Pas de grand renommage de modules `-vXXX` ni de campagne de cache-busters : on incrémente `?v=N` seulement quand le fichier change.

## Lots, dans l'ordre

**Lot 0 : état réel.** `git status`, SHA local / `origin/main`, dernier run CI (API GitHub), suite complète, build standalone, `node --check`. Résultat consigné dans le journal.

**Lot 1 : filet de sécurité (avant de déplacer quoi que ce soit).**
- 1a. Test statique des appels de boutons : chaque `window.__x__(` présent dans un `onclick` généré par un script doit être défini quelque part (`window.__x__=`). C'est la panne exacte du 7 octobre.
- 1b. Tests de comportement du rendu sur place (identité des nœuds, blocs gardés, ordre, changement de menu), avec un mini-DOM de test.
- 1c. Tests de comportement des allocations et des réponses serveur en retard (déjà couverts pour Augmentations et Blood Magic ; compléter si un trou apparaît).

**Lot 2 : premières extractions, une par commit, choisies parce qu'elles n'ont aucun état partagé.**
- 2a. Le moteur de rendu sur place (`morpher*`, `installerMorphIdleV1_`) sort de `soreal-idle-ui.js` vers `modules/morph-v1.js`. Pas d'état de fermeture : c'est la plus propre.
- 2b. La page Blood Magic sort de `meta-progression-v130.js` (le fichier est devenu trop gros). Les tests existants (`idle-blood-magic-*`) doivent rester verts sans modification de comportement.
- Les lots suivants (Augmentations, Time Machine, Adventure, NGU) ne démarrent qu'après une cartographie écrite dans le journal et seulement si les lots précédents sont verts en production.

**Lot 3 : cartographie en lecture seule** des gros fichiers restants (responsabilités, état partagé, appels entrants/sortants, tests qui les couvrent). Aucune modification de code.

## Hors périmètre (chantiers séparés)

- `idle-sqlite-runtime.js` : le classeur est reconstruit entièrement à chaque opération. Vrai coût de performance, à traiter seul, sans le mélanger avec un découpage de fichier.
- Audit CSS (règles mortes, doublons, `!important`) : après la stabilisation du JavaScript.
- Documentation détaillée du contrat API (`idle-protocol.json`) : rétrocompatible, sans toucher SOREAL-APP ni SOREAL-TV.
- Environnement de préproduction Cloudflare : le vrai manque de sécurité actuel (un push = production).

## Vérification manuelle après un lot important

Ordinateur : connexion, navigation entre menus, Basic Training, Augmentations, Time Machine, Blood Magic (placer et retirer dans plusieurs rituels), Adventure (coffre, inventaire), boss, rebirth, sons, popups.
Téléphone : fluidité, pas de saut de page, défilement conservé, clics immédiats, barres Énergie/Magic, Adventure et inventaire.
