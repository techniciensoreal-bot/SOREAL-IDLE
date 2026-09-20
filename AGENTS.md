# SOREAL IDLE — règles d'architecture

Ce dépôt contient le moteur de jeu SOREAL IDLE **et son frontend autonome
de production**. Le Worker Cloudflare (`soreal-idle`) sert à la fois le
Durable Object SQLite et les assets de `cloudflare/public/`, dont
`soreal-idle-ui.js`.

Le fichier `SOREAL-APP/Soreal_Idle_UI.html` est désormais un snapshot
historique : le launcher APP actuel ne l'exécute plus. Il crée un ticket
opaque puis charge le frontend autonome de ce dépôt dans un iframe. Voir la
section "Relation avec SOREAL-APP / SOREAL-TV" ci-dessous avant tout
changement de contrat client/serveur.

**Il n'y a pas de Feature Guard ici** (confirmé : aucun dossier
`cloudflare/feature-guard/` dans ce dépôt, contrairement à SOREAL-APP et
SOREAL-TV). Rien n'empêche mécaniquement un commit de toucher n'importe
quelle partie du moteur — la discipline vient des règles ci-dessous et des
tests, pas d'un outil de CI qui bloquerait un scope non déclaré.

## Règle n°1 (non négociable) : fidélité au wiki NGU Idle

**Aucune valeur de mob, d'objet, de zone ou de mécanique ne doit jamais être
inventée ou approximée.** Chaque nombre (dégâts, PV, taux de drop, coût,
palier de déblocage, magnitude d'un effet...) doit être vérifié en visitant
réellement une page de https://ngu-idle.fandom.com/ — jamais depuis la
mémoire du modèle, jamais par extrapolation "raisonnable" à partir d'un
mob voisin.

Cette règle a été violée concrètement une fois (audit du 2026-09-17) : une
passe avait ajouté des bonus de dégâts pour les mobs Adventure de type
"poison" (+20% continu) et "exploder" (+15% des PV max du joueur à la
mort), en admettant explicitement dans son propre commit que la magnitude
n'était "pas publiée par le wiki" et qu'une constante SOREAL avait été
inventée à la place. Corrigé en retirant les deux bonus (aucune magnitude
de repli inventée) après vérification directe sur le wiki qu'aucune page
ne documentait de formule généralisable pour ces deux Types. Voir le
commit `fix(idle): retire les bonus de dégâts poison/exploder inventés`
(dans SOREAL-APP, où vivait le code de combat client) pour le détail
complet de la vérification.

Procédure attendue avant d'ajouter/corriger une valeur de jeu :
1. Visiter la page wiki concernée (mob, objet, zone, mécanique) et, si elle
   existe, la section générique qui documente le mécanisme (ex. "Adventure
   Mode" → "Adventure Mode Enemies" pour la liste des ennemis par zone).
2. Si la page ne publie pas la magnitude exacte dont on a besoin : ne pas
   inventer de nombre de repli. Soit réduire la fonctionnalité à ce qui est
   réellement confirmé, soit la reporter/refuser explicitement avec un
   commentaire qui dit pourquoi.
3. Citer la page/section exacte dans un commentaire à côté de la valeur
   ajoutée, pas seulement dans le message de commit.
4. Les pages wiki "stub" (peu de contenu, tag `Article stubs`) sont
   fréquentes pour les mobs Adventure secondaires — une page stub qui ne
   documente qu'un `Type` (poison/exploder/rapid/charger/...) confirme le
   Type lui-même, pas forcément une formule de dégâts associée.

## Relation avec SOREAL-APP / SOREAL-TV

- Le frontend de production vit dans **ce dépôt** :
  `cloudflare/public/index.html`, `standalone-bridge.js`,
  `soreal-idle-ui.js` et `cloudflare/public/modules/`.
- `SOREAL-APP/Soreal_Idle_UI.html` n'est plus chargé par le launcher
  courant. Ne pas y corriger un bug visible dans le frontend autonome sans
  d'abord vérifier explicitement qu'un ancien client utilise encore ce
  snapshot.
- Le client n'appelle **pas** directement ce Worker. Le vrai chemin
  (vérifié dans le code, pas supposé) :
  launcher SOREAL-APP/SOREAL-TV → ticket de lancement → frontend autonome
  SOREAL-IDLE → `/api/v1/call` sur ce Worker. Les anciens bridges APP/TV
  restent des points d'intégration/compatibilité selon le client. Pour le
  chemin serveur historique : route HTTP sur le Worker SOREAL-APP ou
  SOREAL-TV (`/api/app/idle/call` ou `/api/tv/idle/call`, définies dans
  `index-global-read-coordinator-v55.js` côté SOREAL-TV) → binding
  cross-script Durable Object `SOREAL_IDLE` (déclaré dans le
  `wrangler.jsonc` de SOREAL-TV avec `script_name: "soreal-idle"`) → ce
  dépôt, `SorealIdleCoordinatorV1.fetch()` sur la route interne
  `/__soreal-idle-v1/call`, qui appelle `runSorealIdleOperation()`.
  Le Worker de ce dépôt n'a lui-même aucune route publique utile — son
  `fetch()` racine renvoie un simple 404 (voir `idle-worker-entry-v1.js`) ;
  seul le binding Durable Object l'atteint.
- Chaque opération de jeu a un nom (`combattreAventureSorealIdle`,
  `renaitreSorealIdle`, etc., listés dans `IDLE_OPERATIONS` dans
  `idle-sqlite-runtime.js`). Le contrat machine-readable est désormais
  versionné dans `cloudflare/contracts/idle-protocol.json` et contrôlé par
  `cloudflare/tests/idle-protocol-contract.test.mjs`, qui impose
  `protocolVersion === IDLE_PROTOCOL_VERSION` et l'égalité exacte entre
  la liste JSON et `IDLE_OPERATIONS`. SOREAL-APP maintient son snapshot
  consommateur dans `cloudflare/features/idle/protocol.json` et le vérifie
  contre `IDLE_CLIENT_PROTOCOL_VERSION` et son bridge.
  Un changement cassant reste interdit sans mise à jour coordonnée :
  - renommer/supprimer une opération appelée par le client ;
  - retirer/renommer un champ de réponse ;
  - changer le type ou le sens d'un champ d'état ;
  - changer les arguments attendus par une opération.
  Dans ces cas, incrémenter `IDLE_PROTOCOL_VERSION`, mettre à jour le contrat
  JSON serveur, le snapshot APP et `IDLE_CLIENT_PROTOCOL_VERSION` dans le
  même chantier.
  **Règle : avant de renommer ou de retirer un nom d'opération ou un champ
  de réponse exposé au client, chercher son usage réel dans SOREAL-APP**
  (`Soreal_Idle_UI.html`, `cloudflare/public/cloudflare-bridge.js`) et pas
  seulement dans ce dépôt. Un grep dans ce seul dépôt ne suffit jamais à
  conclure qu'un nom est mort.
- `cloudflare/public/cloudflare-bridge.js` (SOREAL-APP) expose un
  passe-plat générique qui mirrore la plupart des noms d'`IDLE_OPERATIONS`
  symétriquement, y compris certains déjà désactivés côté serveur
  (`SOREAL_IDLE_V47_LEGACY_DISABLED`). Sa seule présence n'est pas la
  preuve qu'un nom d'opération est réellement utilisé — vérifier aussi
  qu'un vrai site d'appel existe dans `Soreal_Idle_UI.html`.
- SOREAL-APP et SOREAL-TV ont chacun leur propre AGENTS.md avec une entrée
  `idle : SOREAL IDLE` dans leur liste de zones de propriété — ce sont des
  pointeurs vers ce dépôt, pas une description de son contenu.

## Déploiement

Vérifié directement dans `.github/workflows/cloudflare-deploy.yml` (ne pas
décrire ce processus de mémoire, le relire si ce fichier change) :
- Déclenché par un push sur `main` touchant `cloudflare/**`,
  `wrangler.jsonc` ou le workflow lui-même, ou manuellement
  (`workflow_dispatch`).
- Le job exécute d'abord toute la suite de tests
  (`for f in cloudflare/tests/*.test.mjs; do node "$f"; done`) puis déploie
  avec `wrangler deploy --config wrangler.jsonc` (secret
  `CLOUDFLARE_API_TOKEN`).
- `concurrency` avec `cancel-in-progress: true` sur le groupe
  `soreal-idle-cloudflare-production` — un nouveau push annule un déploiement
  en cours plutôt que de les empiler.
- Il n'y a qu'un seul environnement de déploiement ici (pas de palier
  staging séparé comme SOREAL-APP/SOREAL-TV) : un push sur `main` qui passe
  les tests part directement en production. Donc : **pousser sur `main`
  uniquement quand la suite de tests est verte en local** (voir
  Process ci-dessous) — la CI la rejouera, mais un échec en CI ici veut
  dire un déploiement raté visible immédiatement, pas un garde-fou
  staging.

## Process attendu pour tout changement

1. Lancer la suite complète en local avant de committer :
   `for f in cloudflare/tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done`
   — zéro échec exigé.
2. Un commit par correctif logiquement distinct (pas un commit fourre-tout
   pour plusieurs sujets sans rapport) — voir l'historique git de ce dépôt
   pour le ton/la granularité attendue.
3. Pas de Feature Guard à satisfaire : une fois la suite verte, push direct
   sur `main`.
4. Si le changement touche un nom d'opération ou un champ de réponse
   exposé au client, vérifier SOREAL-APP avant de pousser (voir section
   précédente).

## Modèle de données : le classeur SQLite "à la Google Sheets"

Ce moteur est un portage d'un ancien script Google Apps Script (Google
Sheets comme base de données). Plutôt que de tout réécrire autour de
tables SQL normalisées, `idle-sqlite-runtime.js` fournit un shim qui
reproduit l'API Apps Script utilisée par la logique de jeu historique,
pour pouvoir la réutiliser telle quelle :

- **`idle_catalog`** (table SQLite réelle) : une ligne par
  `(sheet_name, row_index)`, avec `row_json` = le contenu de la ligne
  sérialisé en JSON (un tableau de cellules, comme une ligne de feuille
  Google Sheets). C'est la seule vraie source de vérité de l'état du jeu
  — feuilles de catalogue partagé (`CONFIG`, `IDLE_BOSS`, `IDLE_ZONES`,
  `IDLE_SETS`, ...) et feuille `JOUEURS` (une ligne par joueur) cohabitent
  dans la même table, distinguées par `sheet_name`.
- **`IdleSheet` / `IdleSpreadsheet` / `IdleRange`** (classes internes,
  jamais exportées) : reproduisent respectivement `Sheet`, `Spreadsheet`
  et `Range` de l'API Apps Script (`getCell`/`setCell`, `getRange`,
  `getValues`/`setValues`, `getLastRow`, etc.) au-dessus d'un tableau de
  lignes en mémoire.
- **`SpreadsheetApp`** (objet global du shim) : `openById()` renvoie le
  "classeur" (`IdleSpreadsheet`) actuellement en mémoire pour la requête en
  cours — jamais un vrai identifiant Google, juste un nom conservé pour que
  le code historique n'ait pas eu besoin d'être réécrit.
- **`LockService`** (objet global du shim) : `getScriptLock()` renvoie un
  faux verrou (`tryLock`/`waitLock`/`releaseLock`) adossé à un simple
  booléen en mémoire d'isolate (`__idleScriptLockHeldV1`), pas un vrai
  verrou distribué. Ça reste sûr uniquement parce que le cycle
  lire-modifier-écrire complet de `runSorealIdleOperation` est entièrement
  synchrone (voir `cloudflare/tests/idle-run-operation-sync-critical-section.test.mjs`,
  qui échoue bruyamment si un `await` est un jour introduit entre la
  construction du classeur et son commit).
- Cycle de vie d'une requête (`runSorealIdleOperation`,
  `idle-sqlite-runtime.js`) : `__idleBuildWorkbook(sql)` relit
  `idle_catalog` en entier et reconstruit un `IdleSpreadsheet` en mémoire
  → l'opération demandée (une fonction de `IDLE_OPERATIONS`) lit/écrit ce
  classeur via `SpreadsheetApp`/`IdleSheet` comme le ferait le script Apps
  Script d'origine → `__idleCommit(sql, workbook)` réécrit dans
  `idle_catalog` uniquement les lignes marquées "sales"
  (`sheet.dirtyRows`), et synchronise en plus `idle_players` (une table de
  lecture rapide, jamais lue par le moteur de jeu lui-même — seulement par
  les routes de diagnostic/migration).
- Ce shim n'a de sens que parce qu'un seul isolate Durable Object traite
  les requêtes d'un joueur donné à la fois — voir la note LockService
  ci-dessus avant de rendre quoi que ce soit asynchrone à l'intérieur du
  cycle lire-modifier-écrire.

## Migration depuis Google Sheets / historique

- `migration_sources` (table créée manuellement lors de la bascule hors
  Google Sheets, jamais définie par une migration de ce dépôt) doit
  contenir au moins 15 lignes `source_key LIKE 'idle:%'` toutes au statut
  `DONE` avant que `runSorealIdleOperation` n'accepte de fonctionner (sauf
  pour `obtenirAccesSorealIdle`/`testerAccesSorealIdle`, qui ne dépendent
  jamais de l'état du jeu). C'est un garde-fou volontaire : sans ça, un
  Worker fraîchement créé sans données migrées bloque tout plutôt que de
  laisser un joueur repartir avec un catalogue vide.
- `legacy_rows` (table historique, `source_key='idle:<feuille>'`) sert de
  filet de restauration : si `idle_catalog` a été vidé pour une feuille
  canonique donnée, `__idleRestoreCatalogFromLegacyV2` la reconstruit
  depuis `legacy_rows` (puis, en dernier recours pour `JOUEURS`
  spécifiquement, depuis `idle_players`) avant de laisser la requête
  échouer.
- `__idleRepairCatalogSheetNamesV1` renomme idempotemment les anciens noms
  de feuille en minuscules (`joueurs`, `config`, `boss`...) vers leurs noms
  canoniques (`JOUEURS`, `CONFIG`, `IDLE_BOSS`...) à chaque requête — un
  résidu d'une migration historique où la casse divergeait.
- Migration Durable Object SQLite : `wrangler.jsonc` ne contient qu'une
  seule entrée (`tag: "v1-idle"`, `new_sqlite_classes: ["SorealIdleCoordinatorV1"]`).
  Comme pour toute migration Durable Object Cloudflare, ce tableau est
  **append-only** : ne jamais modifier ou supprimer une entrée déjà
  déployée, seulement en ajouter une nouvelle si une future migration de
  classe est nécessaire.
