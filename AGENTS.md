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

## Règle n°2 (non négociable) : aucun spoil

Le joueur ne voit **que ce qu'il a déjà débloqué**. Il doit être surpris à chaque déblocage (demande de Norman, 2026-09-24).

- Un système, un onglet, un achat ou un menu encore verrouillé n'apparaît **pas du tout** : ni cadenas, ni « verrouillé », ni prix, ni condition (« bats le boss N »).
- Pas de total révélateur : jamais « 12 / 301 boss », « 5 / 284 emplacements », « 3 / 6 pièces », ni de case « ??? » pour ce qui n'est pas découvert. On affiche uniquement le nombre déjà découvert, sans dénominateur.
- Les listes envoyées par le serveur ne contiennent que ce qui est découvert (la taille d'une liste ne doit pas révéler un total).
- **Exception décidée par Norman (2026-10-10) : la page des succès.** Elle montre TOUS les trophées sous forme de cases (obtenus en couleur, médaille bronze / argent / or / platine / diamant selon les BP ; les autres grisés), avec un total « x / y » par catégorie. L'objectif d'un succès reste « ????? » tant que ce à quoi il se rapporte n'est pas débloqué, et la case dit toujours quel boss tuer pour voir les infos (`idleAchievementBossRequisV1`, `idle-achievements-v1.js`). Le SERVEUR masque lui-même ce qui n'est pas visible (ni nom ni seuil dans la réponse, seulement `voirApresBoss`) : ne jamais déplacer ce masquage côté client. Aucune autre page n'est concernée par cette exception.
- **Seconde exception décidée par Norman (2026-10-10) : le bouton « Titans »** (page Aventure). Il est visible avant l'accès, grisé, écrit « ??? » avec seulement le boss à vaincre pour l'obtenir (`titansAccesBoss`, un simple nombre calculé par le serveur dans `idle-ngu-progression.js` ; la liste des titans, elle, reste filtrée : ni nom, ni puissance). Il n'ouvre rien. Test : `idle-bouton-titans-ferme-v1.test.mjs`.
- Avant toute nouvelle interface : « ce texte, cette case ou ce compteur révèle-t-il quelque chose de verrouillé ? » Ajouter un test qui le vérifie (voir `idle-anti-spoil-collection-v1.test.mjs`, `idle-exp-shop-tabs-v1.test.mjs`).

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
  Le Worker de ce dépôt a **deux surfaces distinctes** (corrigé le
  2026-09-23 : ce paragraphe affirmait à tort « aucune route publique
  utile » alors que `idle-worker-entry-v1.js` sert bien `index.html`,
  `/api/v1/bootstrap`, `/api/v1/session` et `/api/v1/call` en public
  depuis le 2026-09-19) : (1) le chemin **public** standalone décrit
  juste au-dessus (ticket → session → `/api/v1/call`, authentifié par
  jeton de session émis par le mécanisme de ticket à usage unique -- le
  repli « clé interne » qui existait sur `/api/v1/call` a été retiré le
  2026-09-23, il n'avait aucun appelant légitime) ; (2) le chemin
  **historique** par binding Durable Object, jamais joignable depuis
  l'internet (seuls les Workers TV/APP l'appellent, avec un `user`
  vérifié côté serveur). Tout autre chemin renvoie 404.
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

## Découpage du frontend (audit d'architecture, 2026-10-16)

Le monolithe `soreal-idle-ui.js` (25 000 lignes) reste à découper ; `meta-progression-v130.js` (4 500 lignes) l'a été : il ne garde que le cœur (envoi des actions, allocation commune,
page générique d'un système, pont vers les pages). Chaque page vit dans `cloudflare/public/modules/<page>-page-v1.js` (Money Pit, Wishes, Garderie, Cartes, Yggdrasil/Diggers, Boutique EXP,
Perks/Quirks/ITOPOD, Défis, Augmentations + Machine temporelle + Entraînement avancé + pont Blood Magic). Règles pour toute nouvelle page ou tout nouveau découpage :
- un module = une IIFE qui expose `window.__SOREAL_IDLE_<NOM>_PAGE_V1__` ; le module méta garde de petites cales `function pageX(){return window.__...__.pageX.apply(null,arguments);}` ;
- un module ne lit les aides du module méta qu'À L'EXÉCUTION, par `window.__SOREAL_IDLE_META_PARTAGE_V130__` (cales en tête du module) ; jamais d'état partagé (`let`/`const`) entre deux fichiers :
  si deux pages partagent un état (ex. montants et allocation rapide des Augmentations), elles vivent dans le MÊME module ;
- les ponts `window.__x__=` des `onclick` inline voyagent avec leur page (vérifier : même liste avant/après) ;
- un test qui lit le code d'une page lit `meta-progression-v130.js` ET `lirePagesMeta()` (`cloudflare/tests/_meta-pages.mjs`, liste `PAGES_META` à compléter pour un nouveau module) ;
- ajouter le `<script defer>` dans `index.html` AVANT `meta-progression-v130.js` et monter les `?v=`.

## Architecture du code et audit (2026-10-16)

- Frontend : `soreal-idle-ui.js` (~2 000 lignes : état partagé, registre `window.__SOREAL_IDLE_REG__`, appels `__amorcer_N()`) + 23 modules `modules/ui-*-v1.js` chargés AVANT lui ; les variables partagées passent par `REG.<nom>`.
- Moteur : `idle-sqlite-runtime.js`, `idle-ngu-progression.js`, `idle-adventure-v47.js` gardent leurs exports et se répartissent en fichiers voisins (`idle-runtime-*.js`, `idle-ngu-*.js`, `idle-adventure-*.js`) ; l'état modifiable partagé vit dans un objet de contexte.
- Les tests lisent le code reconstitué (`_ui-sources.mjs`, `_src-sources.mjs`, `defragmenter()` pour les grandes fonctions découpées en `<fn>_pN`) : un test ne doit pas dépendre du fichier où vit une fonction.
- Cache : scripts, styles et dictionnaire sont `immutable` (`public/_headers`) ; après toute modification lancer `node cloudflare/tools/maj-pins.mjs` (monte les `?v=`).
- Audit : `node cloudflare/tools/audit-architecture.mjs` (test `idle-audit-architecture-v1`) : fichier ≤ 2 700 lignes, fonction ≤ 450 lignes (exceptions plafonnées dans le script), pins à jour, en-têtes de cache, syntaxe. Un rapport vert ne couvre que ces seuils.

## Déploiement

Vérifié directement dans `.github/workflows/cloudflare-deploy.yml` (ne pas
décrire ce processus de mémoire, le relire si ce fichier change) :
- Déclenché par un push sur `main` touchant `cloudflare/**`,
  `wrangler.jsonc` ou le workflow lui-même, ou manuellement
  (`workflow_dispatch`).
- Le job (limité à la branche `main`, 30 minutes au plus) enchaîne : toute la
  suite de tests (`for f in cloudflare/tests/*.test.mjs; do node "$f"; done`),
  le build du frontend autonome (`build-standalone.mjs`, qui ne modifie plus aucun fichier public depuis le 2026-10-16 : le cache est immuable ; avant : injectait le SHA
  dans `IDLE_TEST_VERSION`) et `node --check` de tous les scripts publics, la
  vérification des dépendances du runtime vocal, `wrangler deploy` avec
  `--message "git:$GITHUB_SHA"` (secret `CLOUDFLARE_API_TOKEN`), la
  vérification que le SHA annoté est bien celui actif à 100 % du trafic, puis
  un smoke test Chromium (Playwright) sur l'adresse de production.
- `concurrency` avec `cancel-in-progress: false` (corrigé le 2026-10-10 : ce
  paragraphe disait `true`) sur le groupe `soreal-idle-cloudflare-production` —
  un run déjà commencé n'est JAMAIS annulé ; GitHub ne garde qu'un run en
  attente (le plus récent). Raison, écrite dans le workflow : annuler après
  `wrangler deploy` mais avant la vérification du SHA laisserait en production
  une version non validée.
- Aucun retour arrière automatique : un smoke test qui échoue APRÈS le
  déploiement laisse la version active. Retour arrière manuel :
  `npx wrangler rollback` (ou redéployer le commit précédent).
- Il n'y a qu'un seul environnement de déploiement ici (pas de palier
  staging séparé comme SOREAL-APP/SOREAL-TV) : un push sur `main` qui passe
  les tests part directement en production. Donc : **pousser sur `main`
  uniquement quand la suite de tests est verte en local** (voir
  Process ci-dessous) — la CI la rejouera, mais un échec en CI ici veut
  dire un déploiement raté visible immédiatement, pas un garde-fou
  staging.

## Performance du moteur (synchro)

Mesuré en production le 2026-10-02 : un appel minuscule fait ~45 ms aller-retour, une synchro 1 à 2 s -- le temps est dans le CALCUL du moteur, pas dans le
réseau ni dans la lecture du classeur. Trois causes traitées, à ne pas réintroduire :
- **Catalogue des boss** : `bossCatalogueSorealIdle_()` est mémorisé (clé = le tableau renvoyé par `lireTableSorealIdle_`) ; il était reconstruit à chaque appel de
  `definitionBossSorealIdle_` (coût quadratique sur 300 boss), et le catalogue envoyé au client est filtré AVANT le calcul de `puissanceMinimum` pour les boss non découverts.
- **Bonus et équipement** : `idleNguBonuses` et `idleAdventureEquipmentStatsV47` sont mémorisés avec le CONTENU de l'état comme clé (jamais un résultat périmé : le
  moindre octet de différence recalcule), une COPIE est renvoyée, le mémo est remis à zéro au début de chaque opération (`idleNguMemoNouvelleRequeteV1`). Avant : ~207
  calculs de bonus et ~460 normalisations du sac d'Aventure par synchro (~3 s avec 450 objets). `construireSnapshotNguV1` s'exécute dans une « portée de bonus » (lecture
  seule de l'état avancé) : ne rien y MUTER qui touche les bonus.
- **Réponses allégées** (`idle-catalogues-v1.js`) : pièces stables omises, tableaux ligne par ligne.
Règles : pas de champ horodaté ni aléatoire dans l'état du moteur (il changerait la clé à chaque appel et annulerait le mémo) ; après TOUT changement du calcul des bonus ou de
l'équipement, lancer toute la suite avec `SOREAL_IDLE_VERIF_BONUS=1` (chaque réutilisation du mémo est comparée à un recalcul, et la portée vérifie que l'état n'a pas changé).
`idle-bonus-memo-v1.test.mjs` garde aussi le nombre de normalisations par synchro (non-régression de vitesse).
- **Trajectoire des multiplicateurs de combat réutilisée** (2026-10-20, `idle-runtime-etat.js`) : sur un compte qui progresse, elle coûtait la moitié d'une synchro (mesuré dans le navigateur sur la sauvegarde de Norman : 105 ms de 213). Réutilisée jusqu'à 8 s (instants décalés) si c'est le même joueur, qu'aucune opération de modification n'a eu lieu (`__opsMutantesV1`, incrémenté par `runSorealIdleOperation` pour toute opération sauf synchroniser / lire l'état / combat d'Aventure automatique) et que les multiplicateurs actuels sont à 0,2 % de ce que la liste annonçait. Toute écriture extérieure de la ligne du joueur (chargement de partie, réception du serveur, restauration) doit appeler `invaliderTrajectoireV1`. Test : `idle-trajectoire-reutilisee-v1`. Mesurer dans le navigateur (le banc Node ne reproduit pas un compte qui progresse) : compteurs `traj:reutilisee/calculee/ecart` du journal de fluidité.

## Process attendu pour tout changement

0. **Avant CHAQUE push (règle primordiale de Norman, 2026-10-28)** : `node cloudflare/tools/verifier-note-du-jour.mjs` compare la date de la dernière note de mise à jour à la date de BRUXELLES (Europe/Brussels). Même jour : compléter l'entrée du jour. Note plus
   ancienne : créer automatiquement l'entrée suivante (numéro +0,1, date de Bruxelles, `courante`, groupes par menu sans spoil, traductions anglaises, tests des listes de versions) AVANT de pousser. Ne jamais attendre qu'on le rappelle.

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

## Règle n°3 (barres et boucles d'animation) : aucune boucle imparfaite

Demande de Norman (2026-10-09) : toute animation qui se répète dans une barre (braises, étoiles, runes, aurore, plasma, code, gouttes…) doit boucler SANS À-COUP. À appliquer d'office pour toute barre existante ou
nouvelle, sans qu'il faille le redemander :
- un élément qui apparaît puis disparaît (rune, goutte, étincelle) : fondu d'ENTRÉE au début du cycle, fondu de SORTIE à la fin (opacité 0 à 0 % et à 100 %), et un mouvement toujours dans le même sens (jamais un aller-retour
  qui fait « reculer » l'icône en fin de cycle) ;
- un motif qui défile (background-position) : TOUTES les couches ont la même taille de tuile (`background-size` explicite pour chaque couche, une valeur de taille dans un `background:` en liste ne vaut que pour la dernière
  couche) et le glissement vaut exactement UNE période du motif (`--p` = largeur de la tuile ; un dégradé qui se répète tous les 150 % se décale de 150 %, pas de 200 %) ;
- les points qui défilent restent masqués aux deux bouts du liquide (masque en dégradé) ;
- `prefers-reduced-motion` coupe l'animation.
Test de garde : `cloudflare/tests/idle-barres-boucles-parfaites-v1.test.mjs` (à étendre pour une nouvelle barre animée).

## Règle n°4 (redessin périodique) : aucun redessin visible

Demande de Norman (2026-10-15 : « quand je vais dans la page NGU, elle se redessine à intervalle régulier… fais en sorte que ça ne s'installe plus jamais ») : une page mise à jour en direct ne doit JAMAIS montrer de
clignotement, de saut ni de disparition-réapparition, à aucun intervalle.

Contexte : tant qu'un des menus de `IDLE_MENUS_VIVANTS_V1` (soreal-idle-ui.js : ngu, wandoos, yggdrasil, diggers, beards, wishes, hacks, daycare) est ouvert, une synchro part toutes les 4 s et la page est redessinée par le
morph (`modules/morph-v1.js`), qui compare le HTML neuf à la page et RETIRE tout ce que le HTML neuf ne contient pas. Or plusieurs modules AJOUTENT des choses à la page après le rendu : un redessin les retirait, puis le
module les remettait 80 à 400 ms plus tard — d'où un clignotement à intervalle régulier (couche de particules et cadre lumineux des barres actives, boutons de pourcentage personnalisés, tuyaux de NGU, scène du Blood Magic).
Règles pour tout module qui modifie la page après le rendu :
- un bloc AJOUTÉ (couche, bouton…) porte `data-morph-garder` : le morph le laisse où il est ;
- un attribut POSÉ par le module sur un élément de la page s'inscrit dans `window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__` (liste de noms) ; un élément dont le module dessine lui-même tous les attributs (toile,
  tracé SVG) porte `data-morph-vivant` (descendants compris) ;
- un élément ANIMÉ par le module (valeurs réécrites à chaque image) inscrit une fonction dans `window.__SOREAL_IDLE_APRES_REDESSIN_V1__` : elle est appelée juste après le redessin, dans la même tâche, pour remettre
  l'état animé avant que l'image soit peinte ;
- jamais d'attente (setTimeout, minuterie) entre le redessin et la remise en état : tout ce qui est visible doit revenir dans la même tâche ou la prochaine image d'animation.
Blood Magic (Norman, 2026-10-15 : « plus jamais un seul bug d'animation dans Blood Magic ») : les animations de la scène d'un rituel ne dépendent JAMAIS d'un chiffre affiché ni d'un objet d'animation lu dans le DOM. (1) Une fin de niveau
(coupure, punaise, jet…) part de l'événement `soreal-rituel-termine` envoyé par le tick de soreal-idle-ui.js à chaque rituel rejoué : le compteur affiché est borné (blood-magic-v1.js) et peut rester immobile alors que des
rituels se terminent (la coupure ne partait alors plus). (2) L'avancement du niveau (`phaseRituelEtat`, sang-rituel-decor-v1.js) est CALCULÉ comme la barre le calcule (repère + temps écoulé, modulo 1), et non lu sur
`getAnimations()[0]` de la barre (annulée et recréée à chaque synchro) ; une animation CSS se choisit par son nom (`animationCss`), jamais par son rang. (3) Les classes `bm-*` de la scène sont posées par le module : la scène porte
`data-morph-classes-gardees` pour qu'un redessin de la page ne les retire pas en pleine animation. Tout nouveau rituel animé suit ces trois règles.
Contrôle : menu ouvert, dans la console, `await window.__auditerRedessinIdleV1__()` (ou `('ngu')`) force un redessin et liste les nœuds remplacés et les attributs perdus ; tout doit être vide, hormis les `nb-suf` (couleur des
nombres, recréés dans la même image) et le texte. À refaire pour chaque menu touché, et pour tout nouveau menu ajouté à `IDLE_MENUS_VIVANTS_V1`. Test de garde : `cloudflare/tests/idle-redessin-invisible-v1.test.mjs`.

## Règle n°5 (statistiques instantanées) : jamais dépendantes du menu affiché

Demande de Norman (2026-10-16) : l'état du personnage est déterminé par les événements du gameplay, jamais par l'onglet consulté. Un niveau gagné, un bonus débloqué ou une statistique modifiée agit tout de suite, quel que soit le menu ouvert, sans minuterie ni recalcul global ajouté.
- **Moteur** : chaque opération valide les niveaux de tous les systèmes (`syncIdleNguState`) AVANT de calculer attaque, défense et vie max (`statsCombatPrincipalSorealIdleV413_`). Ne jamais calculer une statistique avant cette synchro.
- **Client** : le combat local utilise `combatPrincipal.multiplicateurAttaqueTotal/DefenseTotal`. Entre deux synchros, ils suivent `combatPrincipal.trajectoire` (valeurs futures calculées par le MÊME moteur pour tous les systèmes : `trajectoireMultiplicateursCombatSorealIdle_`, `idle-runtime-etat.js` ; appliquées par `appliquerTrajectoireStatsIdleV1_`, `ui-combat-1-v1.js`, depuis le tick existant). Un nouveau système qui entre dans `idleNguBonuses` est couvert sans code de plus : NE PAS écrire de rejeu local propre à un système pour les multiplicateurs de combat, et ne rien lire de la page (DOM) pour le gameplay.
- **Gardes** : `idle-stats-instantanees-moteur-v1` (la trajectoire annoncée égale ce que le vrai moteur donne à l'instant annoncé, pour Augmentations et NGU ; liste vide quand rien ne progresse) et `idle-augments-instantanes-v1` (client : interpolation, aucune minuterie, seule la trajectoire écrit les multiplicateurs). Un système avec un bonus d'attaque/défense qui n'entre PAS dans `idleNguBonuses` n'est pas couvert : l'y faire entrer.
- Coût : un calcul de plus par réponse quand rien ne change, au plus quatre quand quelque chose progresse (voir `cloudflare/bench/bench-moteur.mjs`).

## Règle n°6 (préférences liées au compte) : jamais seulement sur l'appareil

Demande de Norman (2026-10-16) : cases, saisies, onglets ouverts, volumes, effets, réglages... tout est lié au COMPTE et identique sur tous les appareils. Mécanisme (`modules/prefs-compte-v1.js`, chargé en premier ; côté serveur `src/idle-ui-prefs-v1.js`, action `setUiPrefs`, `state.uiPrefs`, `systemes.uiPrefs` pièce d'état allégée) : toute clé `localStorage` qui commence par `soreal_idle_` ou `sorealIdle` est recopiée sur le serveur (envoi groupé 1,5 s après le dernier changement) et remise dans chaque appareil (le pont `standalone-bridge.js` appelle `appliquer` à chaque réponse ; le compte l'emporte ; un changement venu d'un autre appareil au chargement recharge la page une fois).
- **Nouvelle préférence** : la ranger dans `localStorage` sous une clé `soreal_idle_<nom>_v1` (valeur texte ≤ 8 000 caractères, clé ≤ 120 caractères `A-Za-z0-9_.:-`) suffit ; ne rien garder seulement en mémoire de page (perdu au rechargement) et ne jamais écrire le stockage par un autre moyen que `localStorage.setItem/removeItem`.
- **Exclus** (liste `EXCLUES` du module) : jeton de session, diagnostic, mesures de performance (changent toutes les 10 s), cache admin, position d'une fenêtre. Une donnée qui change souvent ou propre à l'appareil s'y ajoute.
- Valeurs de jeu (cibles de niveaux, cases « avancer l'énergie à la barre suivante », etc.) : elles vivent déjà dans l'état du jeu côté serveur (actions `setNguTarget`, `setNguAdvance`, `setAugmentTarget`...), ne pas les dupliquer dans les préférences.
- Gardes : `idle-prefs-compte-serveur-v1` (coffre borné, action, état) et `idle-prefs-compte-client-v1` (le vrai module sur un faux navigateur).

## Règle n°7 (jeu local) : le moteur tourne dans la page de CHAQUE joueur

Décision de Norman (2026-10-19 : « le vrai NGU Idle est un jeu local ; je veux que tout le monde soit en local ») : le MÊME moteur que le serveur (`SorealIdleCoordinatorV1` + `runSorealIdleOperation`) s'exécute dans un Web Worker de la page, sur SQLite en mémoire (sql.js). Plus d'attente de confirmation, plus de recalage : les barres ne reculent plus. Le serveur garde le chat, les classements, « En direct », les comptes, les opérations d'administration et la SAUVEGARDE.
- **Fichiers** : `cloudflare/local/moteur-local-worker.js` (Worker) → construit par `node cloudflare/tools/build-moteur-local.mjs` (esbuild ; dépendances dans `cloudflare/local/package.json`) en `public/moteur-local-worker-v1.js` + `sql-wasm-v1.wasm`. **Ces deux fichiers sont VERSIONNÉS et générés : après TOUTE modification de `cloudflare/src/`, relancer la construction, puis `node cloudflare/tools/maj-pins.mjs`** (le test `idle-moteur-local-v1` refuse des fichiers périmés). Côté page : `public/modules/moteur-local-v1.js` (aiguillage, IndexedDB, envoi) et `standalone-bridge.js` (`callIdleV1` appelle le moteur local pour les opérations de la liste `LOCALES`). Côté serveur : `src/idle-local-sync-v1.js` (export au démarrage, réception, sauvegardes, interrupteur) ; routes `/api/v1/local/{export,push,alertes,sauvegardes,restaurer,interrupteur}`.
- **Actif par défaut** pour tous ; coupé seulement par `?local=0` (choix de l'appareil), un navigateur sans Worker/WebAssembly/IndexedDB, un moteur qui ne démarre pas, ou l'**INTERRUPTEUR GÉNÉRAL** (`POST /api/v1/local/interrupteur {actif:false}`, administrateur : l'export répond `IDLE_LOCAL_DESACTIVE`, chaque page retombe sur le mode serveur au prochain chargement, sans redéployer). Test : `idle-moteur-local-defaut-v1`.
- **Nouvelle opération de jeu** : l'ajouter à `LOCALES` (moteur-local-v1.js) ET à `OPERATIONS_DE_JEU_V1` (idle-local-sync-v1.js) si elle modifie la ligne du joueur ; une opération d'administration/de test qui modifie le joueur va dans `MODIFIENT_LE_JOUEUR` (la page envoie son état, appelle le serveur, puis se recharge). Une opération qui lit ou écrit des données PARTAGÉES (chat, flux, classement, profils, bugs…) reste au serveur. Un nuke laissé au serveur a déjà ramené une partie au boss 1 : ne jamais classer une action de jeu comme « serveur ».
- **Heure** : le moteur travaille à l'HEURE DU SERVEUR (`Date` du Worker = horloge de l'appareil + écart mesuré, `__SOREAL_IDLE_ECART_V1__`) : changer l'horloge de l'appareil ne change rien (temps hors ligne, récompenses du jour, échéances).
- **Précautions (toutes obligatoires, ne jamais en retirer une sans accord)** : (1) `IndexedDB` garde la dernière ligne et les événements pas encore reçus ; reprise au démarrage si elle est plus récente que celle du serveur ; (2) envoi toutes les 10 s si une action a eu lieu (1 min au repos), à la fermeture et via le bouton « Envoyer ma partie » (Réglages) ; (3) **un seul appareil joue à la fois** : l'export revendique la partie, un envoi d'un appareil arrivé avant reçoit un « conflit » (écran « Partie reprise sur un autre appareil ») ; une action de jeu passée par le serveur (ancien onglet) revendique aussi ; (4) **sauvegardes de sécurité côté serveur** avant tout écrasement (`initiale`, `quotidienne` 30 j, `periodique` 48, `avant-anomalie`, `avant-restauration`) ; lecture et restauration par l'administrateur (`/api/v1/local/sauvegardes`, `/restaurer`) ; (5) l'**anti-triche est en OBSERVATION** : il note (`/api/v1/local/alertes`) et n'écarte jamais une progression (demande de Norman : peu de joueurs, un faux positif serait pire) ; (6) l'identité (ID, nom, rang, e-mails) reste celle du serveur ; un état plus ancien n'écrase jamais un plus récent.
- **Sauvegarde par fichier (Réglages, pour tout le monde, 2026-10-20)** : « Exporter ma partie » télécharge la ligne du joueur (38 colonnes) + l'instant du moteur ; « Charger une partie » la remet (`idle-partie-fichier-v1.js`, Worker `importer`) : identité du compte et préférences conservées, TOUTES les dates décalées de (maintenant − instant de l'export) pour qu'aucun temps hors ligne ne soit compté ; le Worker vérifie par une synchro et remet l'ancienne ligne si le moteur refuse ; le serveur garde une copie `avant-import`. Un nouveau champ de date dans l'état doit tenir dans la règle de décalage (clé en `At/Ms/Jusqua/Until…` ou nombre ≈ horodatage hors montants) : test `idle-partie-fichier-v1`.
- **Anti-spoil** : le moteur embarque tout le catalogue du jeu (aucun texte n'est affiché pour autant : la règle n°2 vaut pour l'interface) ; l'export ne contient que la ligne du joueur et les feuilles de catalogue, jamais celle des autres.
- **Piège d'outillage** : en bash, ne jamais passer de regex avec antislash à `node -e`/`replace` (ils disparaissent) : écrire un fichier (heredoc `'E'` ou outil d'écriture).

## Ports réservés au studio de voix (8765) et à son pilote (8766)

Aucun serveur de test ou d'aperçu (script, `http.server`, `node -e`, maquette) n'écoute en dur sur 8765 ou 8766 : port éphémère (0) ou 8791 et plus ; tout serveur de fond est arrêté en fin de tâche. Depuis le 2026-10-16 le lancement du studio résiste à un intrus sur son port (`cloudflare/tools/voice-studio/liberer_port.py`, partagé par `lancer.bat`, `lancer_depuis_lien.bat` et `pilote.py` : le studio se reconnaît à `serveur.py`, un serveur de développement intrus — node, python, deno, bun — est arrêté, tout autre programme est signalé sans être touché) ; test `idle-studio-port-libre-v1`. Ne jamais revenir à « quelque chose écoute sur 8765 donc le studio tourne ».

## Album des boss (2026-10-29)

Page 0 = affiche découpée en 9 cartes (dos tant que non gagnées ; le total 301 sert seulement au calcul côté client et n'est jamais affiché) ; ensuite 9 cartes par page, uniquement les boss vaincus. Chaque page garde TOUJOURS 9 emplacements (`completer`, `.alb-pochette-vide` invisible) et la place des barres de navigation est réservée en permanence (`--alb-nav-h/-b`) : ni la dernière page ni l'ouverture du livre ne changent la taille ou la position du classeur. Le saut « ±10 » = 10 feuilles (20 pages sur PC).
