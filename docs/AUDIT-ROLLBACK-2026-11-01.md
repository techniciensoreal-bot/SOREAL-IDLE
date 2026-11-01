# Audit anti-rollback du jeu local — 2026-11-01 (phase 1 : lecture seule + tests de reproduction)

Aucun fichier de production n'a été modifié. Rien n'est corrigé, poussé, déployé ni publié.
Seuls ajouts : `cloudflare/tests/_repro-rollback/` (non joué par la suite normale : aucun fichier ne finit par `.test.mjs`) et cette annexe + une entrée du WORKLOG.

## 1. État vérifié

- `HEAD` local = `cfea2df7` (2 commits d'avance sur `origin/main` : `e49862f0`, `cfea2df7`, borne d'arcade, sans rapport avec les sauvegardes). `origin/main` (après `git fetch`) = `9c79cd6a`.
- CI / SHA déployé : **non vérifiés** (la commande `gh` n'est pas installée sur cette machine). Ne pas considérer le dernier déploiement comme prouvé.
- Un audit anti-rollback a déjà eu lieu le 2026-10-21 (WORKLOG, fin du fichier) et a corrigé : accusé lié à une révision, refus serveur ≠ sauvegarde, événements acquittés par numéro, copie écrite à la fermeture, copie écartée jamais détruite (3 emplacements), `copieEnAttente`, délai de 20 s sur l'envoi, date future ramenée à l'heure du serveur. J'ai relu le code actuel : ces corrections sont bien présentes et leurs tests (`idle-sauvegarde-locale-*`) passent (5 exécutés aujourd'hui : protocole, import, hors-ligne, moteur-local, audit-architecture ; la suite complète n'a pas été rejouée).
- **Ce que cet audit-là n'a pas vu** : ses tests utilisent un faux serveur dont la « Dernière synchro » est une constante (1000, 5000, 9000...). Le VRAI export du serveur n'a jamais été branché sur le VRAI module de la page. C'est précisément là que se trouve le défaut principal (A1).

## 2. Méthode de reproduction (et ses limites)

`cloudflare/tests/_repro-rollback/monde-repro.mjs` :
- RÉEL : `public/modules/moteur-local-v1.js` exécuté tel quel dans un faux navigateur (IndexedDB, fetch, événements simulés) ;
- RÉEL : `src/idle-local-sync-v1.js` (export + réception) sur une vraie base SQLite en mémoire avec le vrai coordinateur ;
- SIMULÉ : le Web Worker (le moteur de jeu). Il tient un compteur `n` (colonne « Boss vaincus », index 14, vérifié : l'export du serveur ne la recalcule pas) et la colonne « Dernière synchro » (15) ; le reste de la ligne est celui de la vraie ligne exportée.
- Limites : vraie IndexedDB, vrai Worker/WASM, vrais navigateurs (Safari/iPhone), vrai réseau, Durable Object Cloudflare : non testés.
- Exécution : `node cloudflare/tests/_repro-rollback/<fichier>.repro.mjs` ; chaque scénario affiche `ECHEC (défaut reproduit)` et le fichier sort en code 1 tant que le défaut existe. Après correctif, ils afficheront `OK` et pourront être renommés en `.test.mjs`.

## 3. Cartographie du cycle de vie d'une partie

| Étape | Source d'autorité | Interruptions / échecs | Concurrence | Reprise | Pertes possibles |
|---|---|---|---|---|---|
| Action du joueur | Worker (moteur local, SQLite mémoire) ; `appeler()` (moteur-local-v1.js:343) | Worker bloqué : `parler()` n'a aucun délai (appel et envoi restent en attente pour toujours) | file d'appels à un seul vol (`pomper`) | aucune automatique | tout depuis le dernier envoi/copie |
| Marquage | `sale=true; rev+=1` après la réponse du Worker (l.347-348) | — | `envoyer` peut extraire pendant ce temps : sûr (copie plus récente que la révision comptée) | — | aucune |
| Copie IndexedDB | `sauverCopie` 0,4 s après une action (l.114-126), à la fermeture / arrière-plan | IDB lente/bloquée : `copieEnAttente`, rien n'est écrit ni effacé | deux onglets = même clé (ROLLBACK-004) | **au démarrage seulement, et jamais quand le serveur répond (A1)** | tout le contenu de la copie (A1) |
| Instantané | `parler({type:"sortant",vider:false})` : ligne + copies des événements (l.283) | — | — | événements restent en file jusqu'à l'accusé | aucune |
| Requête | `fetch /api/v1/local/push`, délai 20 s ; `keepalive` seulement si le corps fait < 60 000 caractères (l.293) | réseau coupé, 4xx/5xx, délai : `sale=true`, retenté (10 s, 60 s au repos) | envois qui se chevauchent à la fermeture (l.276) | prochain envoi | fermeture avec une grosse ligne (> 60 000 car., le cas d'un joueur avancé) : l'envoi peut être coupé par le navigateur ; seul filet = copie IDB (neutralisée par A1) |
| Écriture serveur | `recevoirDuMoteurLocalV1` : refuse si `recu < connu` (strict) ou conflit d'appareil ; sauvegardes de sécurité avant écrasement | refus `ecrit:false` | arrivée dans le désordre : égalité de date = le dernier arrivé gagne (005a) ; date jusqu'à +15 min acceptée (005b) | — | un état plus ancien de contenu |
| Accusé | `ok && !conflit` : événements acquittés ; `ecrit:false` = refus, copie gardée ; sinon copie effacée si aucune action depuis | réponse perdue : renvoi, doublons ignorés côté serveur | réponses inversées gérées (`revAcquittee`) | — | aucune (démontré par les tests existants) |
| Reprise | `demarrer()` l.189-228 : compare `cells[15]` de la copie à celui de l'export | export sans réponse : repli sur `export-dernier` (B1) | autre appareil : conflit | copie écartée (3 emplacements, aucune interface) | voir A1, B1 |

## 4. Verdicts ROLLBACK-001 à 007

| Id | Verdict | Preuve |
|---|---|---|
| ROLLBACK-001 (l'accusé de A efface B) | **DÉJÀ PROTÉGÉ** | moteur-local-v1.js:280 (`revEnvoyee` lue avant l'extraction), :289 (`sale=false` après extraction), :308-311 (copie effacée seulement si `!sale && rev===revEnvoyee && !copieEnAttente`). Test existant `idle-sauvegarde-locale-protocole-v1` §2 : vert aujourd'hui. Reste théorique : l'effacement est une transaction IDB séparée (nouvelle connexion à chaque `kv`) ; l'ordre de création des transactions la protège en pratique (non reproductible avec une vraie IDB). Le « numéro de version » (`rev`) est propre à la page, envoyé mais ignoré par le serveur et non conservé dans la copie IDB : à retenir pour le correctif d'A1. |
| ROLLBACK-002 (extraction destructive des événements) | **DÉJÀ PROTÉGÉ** (réseau/HTTP/réponse perdue/deux envois) ; **perte réelle seulement via A1** | l.283 `vider:false` ; worker l.168-173 `acquitter` par numéro `n` ; serveur : doublons ignorés (idle-local-sync-v1.js:350, 358), limites 200/100 renvoyées (`fluxTraites`). Les événements gardés dans la copie IDB sont perdus avec elle (repro A1, 3e scénario). Ce sont des événements du fil « En direct » / journal de gains d'EXP, pas la progression. |
| ROLLBACK-003 (`ok:true,ecrit:false`) | **DÉJÀ PROTÉGÉ** | l.299-307 (`sale=true`, copie conservée, signalé) ; `envoyer` renvoie faux ; bouton « Envoyer ma partie » n'affiche plus de succès. APK : apk-synchro-v1.js:104 teste aussi `d.ecrit!==false`. Reste : un refus répété sans issue n'est que signalé (voir 005b). |
| ROLLBACK-004 (concurrence) | **RÉEL par lecture + repro (cas copie partagée)** | `envoyer(true)` passe volontairement avec `enVol` (fermeture) : les accusés par numéro/révision rendent cela sûr côté client ; côté serveur l'égalité de date est la faille (005a). Nouveau : `sauverCopie` ignore `conflit` → un onglet en conflit écrase la copie de l'onglet actif (repro 004). |
| ROLLBACK-005 (horodatages) | **RÉEL, reproduit côté serveur** | idle-local-sync-v1.js:329 (`!(recu < connu)` : l'égalité écrit toujours) et :324 (seuil de 15 min). Repros 005a et 005b. Et surtout : la date de l'export sert de « version » à A1. |
| ROLLBACK-006 (import puis reload) | **RÉEL, reproduit** (via A1) | La page écrit bien la copie avant de se recharger (test existant vert) mais elle est écartée au rechargement. L'écran promet « l'envoi se fera tout seul ». |
| ROLLBACK-007 (bascule local/serveur) | **RÉEL par lecture du code** (indirectement reproduit par A1) | voir §6. |

## 5. Constats (tableau demandé)

Priorités : P0 = perte de progression plausible en conditions normales ; P1 = perte possible dans un scénario précis ; P2 = faible probabilité, ou statistique seulement.
État réel : « reproduit » = test de reproduction qui échoue aujourd'hui sur le vrai code ; « lecture » = établi par lecture, non reproduit. Aucun n'est corrigé, testé après correctif, commité, poussé ni déployé.

### A1 — La copie de l'appareil n'est jamais reprise quand le serveur répond (P0)
- Fichier / fonction : `cloudflare/public/modules/moteur-local-v1.js` `demarrer()` l.213-228 ; `cloudflare/src/idle-local-sync-v1.js` `exporterPourMoteurLocalV1()` l.249 et l.255.
- Cause exacte : la copie est reprise seulement si `enMs(rec.cells[15]) > enMs(srv[15])`. Mais l'export appelle `runSorealIdleOperation("obtenirEtatSorealIdle")` (l.249) **qui réécrit la ligne du joueur avec « Dernière synchro » = maintenant** (mesuré : deux exports à 300 ms d'écart donnent deux dates qui avancent de 343 ms). La ligne lue juste après (l.255) a donc toujours une date plus récente que n'importe quelle copie écrite avant l'ouverture de la page : la copie est écartée (`ecarter`, l.225), jamais reprise.
- Scénario : le joueur joue ; l'envoi échoue (réseau coupé, arrière-plan iPhone, fermeture avec une ligne > 60 000 caractères donc sans `keepalive`, F5 dans les 10 s) ; la copie IDB contient tout ; il rouvre le jeu avec du réseau : la page repart de la ligne du serveur.
- Données perdues : tout ce qui n'a pas été accusé par le serveur avant la fermeture (en fonctionnement normal jusqu'à ~10 s + 0,4 s ; beaucoup plus si les envois échouent longtemps : hors-ligne, `conflit` ignoré, refus répétés) + les événements non reçus.
- Preuve : `tests/_repro-rollback/ROLLBACK-A1-reprise-copie-appareil.repro.mjs` : contrôle OK (serveur plus ancien : reprise), puis `n=5` attendu, `n=0` obtenu (« copie 1793568228591 < export du serveur 1793568228664 »), copie « écartée » conservée.
- Pourquoi les tests existants ne le voient pas : ils fixent la date du faux serveur (1000, 5000) et ne passent jamais par le vrai export.
- Correctif RECOMMANDÉ (non appliqué) : ne plus décider avec une date que l'export lui-même modifie. (1) Serveur : une version explicite de la ligne, incrémentée par chaque écriture acceptée de `recevoirDuMoteurLocalV1` (table séparée, pas la colonne 16), renvoyée dans l'export et dans chaque réponse de push. (2) Client : la copie IDB porte `base = version du serveur au dernier accusé`. Au démarrage : même version que l'export = personne d'autre n'a écrit, la copie est la suite : reprise ; version serveur plus récente = conflit réel : conserver les DEUX (copie écartée + message explicite, voire écran de choix comme sur l'APK), jamais de rejet silencieux. (3) Variante minimale, temporaire : l'export renvoie aussi la « Dernière synchro » écrite par le dernier push accepté (avant son propre réécrit) et la page compare à celle-là. Risque du correctif : une copie reprise qui écraserait le travail d'un autre appareil / d'une restauration administrateur / d'une opération d'administration (créditer EXP) si la comparaison est mal posée ; il faut garder la revendication d'appareil, la restauration (`__restauration__`) et les opérations qui modifient le joueur, et tester les 3 cas (même appareil, autre appareil, restauration). Performance : un entier de plus dans l'export et dans les réponses ; aucune écriture supplémentaire.
- État réel : reproduit.

### B1 — Démarrage hors ligne sur la ligne du matin (P0)
- Fichier / fonction : `moteur-local-v1.js` `garderExport` l.181-187, `exportGarde` l.174-180, `demarrer()` l.194-203 et l.310 (`kv("effacer")`).
- Cause exacte : « export-dernier » (la ligne telle que le serveur l'a donnée) n'est écrit qu'au démarrage en ligne (l.208). Chaque envoi accusé efface la copie de la partie (l.310). Il ne reste donc sur l'appareil que la ligne de l'ouverture. Si une ouverture ultérieure ne reçoit aucune réponse HTTP (réseau coupé, ou plus de 25 s : `EXPORT_LOCAL_LENT`, l.194), le moteur démarre sur cette ancienne ligne (aucune limite d'âge) ; le premier envoi suivant est accepté par le serveur (date plus récente, et `depuis` = date de revendication de l'ouverture précédente : pas de conflit) et écrase la progression de la journée. Concerne aussi l'exe et l'APK (même module).
- Données perdues : tout ce qui a été joué et accusé depuis la dernière ouverture en ligne (la sauvegarde `periodique` du serveur, 15 min, existe mais n'est lisible que par l'administrateur).
- Preuve : `ROLLBACK-B1-demarrage-hors-ligne-export-perime.repro.mjs` : le serveur détient `n=5`, le moteur redémarre à `n=0`, après un envoi le serveur est à `n=1` au lieu de `6` (écrasement accepté par le vrai code serveur).
- Correctif RECOMMANDÉ : garder sur l'appareil la DERNIÈRE LIGNE ACCUSÉE (écrite hors du chemin des clics, au plus 1 fois par minute et à la fermeture, pas à chaque envoi), la reprendre pour le démarrage hors ligne ; refuser tout démarrage hors ligne sur une ligne plus ancienne que la dernière accusée ; au retour du réseau, passer par la même décision de version que A1. Risque : volume d'écritures IndexedDB (ligne de 127 Ko+), quotas Safari ; ne pas écrire à chaque envoi de 10 s.
- État réel : reproduit.

### ROLLBACK-006 — Import suivi d'un rechargement (P1, conséquence d'A1)
- Fichier : `moteur-local-v1.js` `__chargerPartieIdleV1__` l.466-490 et `chargerFichier` l.395-408 ; reprise : `demarrer()` l.213-228.
- Cause : la copie importée est bien écrite avant le rechargement (protection existante) mais écartée au démarrage (A1). Le message « Partie chargée sur cet appareil (l'envoi au serveur se fera tout seul) » est faux dans ce cas.
- Preuve : `ROLLBACK-006-import-puis-rechargement.repro.mjs` (préalables OK : page rechargée, copie à 100 au moment du rechargement ; résultat : le moteur repart à `n=0` au lieu de 100).
- Correctif : celui d'A1. À vérifier en plus : le serveur ne garde la copie `avant-import` que si l'envoi porte `importPartie` ; une reprise ultérieure n'a pas ce drapeau.
- État réel : reproduit.

### ROLLBACK-004 (nouveau volet) — Onglet en conflit : sa fermeture écrase la copie de l'onglet actif (P1, latent tant qu'A1 existe)
- Fichier : `moteur-local-v1.js` `sauverCopie` l.114-122 (aucun test de `conflit`), appelée par `pagehide` / `visibilitychange` l.259-260.
- Preuve : `ROLLBACK-004-onglet-en-conflit-ecrase-copie.repro.mjs` : copie de l'onglet actif `n=5`, remplacée par `n=1`.
- Correctif : `sauverCopie` ne fait rien si `conflit` ; idéalement la copie porte un propriétaire (identifiant de l'appareil / de l'onglet) et un onglet n'écrase pas la copie d'un propriétaire plus récent. Risque : très faible ; à corriger avec A1 (devient actif dès qu'A1 est corrigé).
- État réel : reproduit.

### ROLLBACK-005 (a) — Égalité de date : le dernier arrivé gagne (P2)
- Fichier : `src/idle-local-sync-v1.js` l.329 (`!(recu < connu)`).
- Cause : à date égale, tout envoi est écrit, quel que soit son contenu. Atteignable seulement avec la même milliseconde et des réponses inversées (envois de fermeture chevauchants).
- Preuve : `ROLLBACK-005-horodatages-version.repro.mjs` (a) : serveur à `n=1` au lieu de `2` (niveau serveur ; atteignabilité faible, non démontrée de bout en bout).
- Correctif : ne pas départager par date : version serveur (voir A1) ou `rev` + identifiant d'appareil. Risque : modifie le protocole ; ne pas incrémenter `IDLE_PROTOCOL_VERSION` sans vérifier le contrat (`cloudflare/contracts/idle-protocol.json`, le champ `rev` est déjà envoyé).
- État réel : reproduit au niveau serveur.

### ROLLBACK-005 (b) — Date de +10 min acceptée : les envois honnêtes suivants sont refusés (P2)
- Fichier : `idle-local-sync-v1.js` l.324 (la date n'est ramenée à l'heure du serveur qu'au-delà de 15 min : `TOLERANCE_HORLOGE_MS`).
- Scénario : saut d'horloge de l'appareil en cours de session sans nouvelle mesure de l'écart (le Worker travaille à « horloge appareil + écart mesuré ») : une date +10 min est enregistrée ; pendant 10 min tout envoi est refusé (`ecrit:false`, la page garde `sale=true`, ne signale que dans le journal de diagnostic) ; fermer la page dans cette fenêtre = perte (A1).
- Preuve : repro 005 (b) : `ecrit=false`, serveur resté à `n=1`.
- Correctif : ramener la date ENREGISTRÉE à `min(recu, maintenant + marge de quelques secondes)` (l'alerte, elle, garde le seuil de 15 min). Risque : un moteur dont l'écart serait faux de plus de la marge verrait sa date plafonnée : sans conséquence sur le contenu.
- État réel : reproduit au niveau serveur.

### ROLLBACK-007 — Bascule local → serveur (P1 par lecture)
Chemins vérifiés dans le code :
- Worker / WASM / IndexedDB absents (`capable()`), délais (IDB 4 s, export 25 s, démarrage 20 s), erreur d'initialisation : `demarrer` rejette, `echec=true`, `actif()` devient faux, le jeu passe au serveur pour toute la session. La copie IDB n'est pas détruite (elle est lue avant l'init du Worker et laissée en place), MAIS le jeu continue sur la ligne du serveur (et chaque action de jeu passée par le serveur REVENDIQUE la partie) : au prochain démarrage local, la copie est plus ancienne que la ligne du serveur : écartée (3 emplacements, aucune interface de récupération). Aucun signal au joueur.
- Interrupteur général (`IDLE_LOCAL_DESACTIVE`, l.207 / serveur l.247) : même comportement ; la copie d'un appareil dont l'envoi échouait devient une copie écartée.
- `MODIFIENT_LE_JOUEUR` (changement de pseudo, réinitialisation de compte, partie de test/dev, crédit d'EXP admin) : `avantServeur()` (l.413) ignore le résultat de l'envoi (`await envoyer(false,true)`), le pont appelle quand même le serveur (standalone-bridge.js:362) puis recharge ; si l'envoi n'a pas abouti, la progression non envoyée est dans la copie et tombe sur A1. Pour la réinitialisation de compte c'est voulu ; pour le pseudo et le crédit d'EXP non.
- Expiration de session : `/api/v1/local/push` répond non-ok, `sale=true` à l'infini, aucune interface ; le joueur continue de jouer sans sauvegarde ; fermer = A1.
- Application de bureau : si le compte est lié, `Response.error()` hors ligne et jeton expiré (`desktop/coeur.js`) donne une absence de réponse : démarrage sur `export-dernier` (B1). Suspension / reprise de l'exe : non testée.
- Worker bloqué : `parler()` n'a aucun délai ; `enVol` reste vrai pour toujours si `parler({type:"sortant"})` ne répond pas (seul le `fetch` a le délai de 20 s, l.291-293) : plus aucun envoi ; seule la copie IDB (écrite par `sauverCopie`, qui passe aussi par le Worker : bloquée aussi) reste. P2, non reproduit.
- Correctif recommandé : (1) ne jamais basculer silencieusement : afficher un message explicite tant qu'une copie non accusée existe ; (2) bascule serveur interdite tant qu'une copie non accusée existe (lecture seule, ou proposer « envoyer d'abord ») ; (3) `avantServeur()` doit renvoyer son résultat et le pont doit refuser les opérations qui ne sont pas des réinitialisations voulues tant que l'envoi échoue ; (4) interface de récupération des copies écartées (`copiesEcartees()` existe déjà, sans écran). Risque : bloquer un joueur dont l'IDB est cassée de façon permanente ; il faut une sortie explicite (« abandonner ma copie locale »).
- État réel : lecture.

### Autres constats
- **C1 — « Temps de jeu actif » écrasé (P2, statistique)** : `battementSorealIdle` n'est pas dans `LOCALES` : il part au serveur (chat-v1.js:120, toutes les ~20 s) et, dès 120 s accumulées, écrit `stats.tempsActifSec` dans la ligne du joueur sur le serveur (idle-sqlite-runtime.js, environ l.980-990) sans toucher la colonne 16. Chaque envoi local suivant remplace toute la ligne, donc cette valeur est écrasée par celle du moteur local. Par lecture ; non reproduit par un test (il faut le vrai battement avec du temps actif). Concerne le classement « Temps de jeu », pas la progression. Correctif : porter ce compteur dans le moteur local, ou le sortir de la ligne du joueur.
- **C2 — Fermeture d'une grosse partie** : `keepalive` seulement si le corps < 60 000 caractères (l.293) ; une ligne de joueur avancé fait 127 Ko ou plus (mesure du WORKLOG du 2026-10-21) : l'envoi de fermeture n'est presque jamais en `keepalive` et peut être annulé par le navigateur à la fermeture/mise en arrière-plan (surtout iOS). Le seul filet est la copie IDB, que A1 neutralise. Non démontrable hors navigateur réel. Correctif : A1 d'abord ; ensuite, envoyer à la fermeture seulement la différence ou une ligne compressée sous 64 Ko (`CompressionStream`), sans bloquer.
- **C3 — APK** (protocole propre, `apk-synchro-v1.js`) : `pousser` envoie `flux:[]`, `gains:[]` (les événements ne sont jamais envoyés) ; `decider` se fonde sur l'égalité de chaînes de « Dernière synchro » avec une base mémorisée : l'export réécrit cette date à chaque démarrage, donc `serveurBouge` est toujours vrai ; l'écran de choix revient dès que renaissances/boss diffèrent, même si le téléphone est strictement en avance (l.53). Non audité plus loin ; pas de perte silencieuse constatée (la partie remplacée est gardée 30 jours).
- **C4 — Copies écartées sans interface** (déjà connu, WORKLOG 2026-10-21) : jusqu'à 3 ; une copie acquittée qui en chasse une autre n'est pas protégée.
- **C5 — Sauvegarde du serveur** : `sauvegarderSiBesoinLocalV1` copie la ligne avant écrasement (initiale / quotidienne / périodique 15 min, 48 copies, `avant-anomalie`, `avant-import`, `avant-restauration`) : filet réel, lisible seulement par l'administrateur (`/api/v1/local/sauvegardes`). Elle ne couvre pas ce qui n'a JAMAIS atteint le serveur (A1) et le serveur ne peut pas distinguer A1 d'un envoi normal.
- Changement de pseudo, restauration, partie A/B, préférences : voir §6.

## 6. Autres chemins examinés

- **Restauration administrateur** (`restaurerSauvegardeLocaleV1`) : copie `avant-restauration`, date mise à « maintenant », revendication `__restauration__` : toute page ouverte reçoit « conflit » à son prochain envoi. Correct. À noter : la page en conflit écrit encore sa copie à la fermeture (004).
- **Partie A/B, copierPartieASurB, préparerPartieTest** : dans `MODIFIENT_LE_JOUEUR` ; voir `avantServeur` ci-dessus. Pas de perte supplémentaire constatée.
- **Préférences du compte** : `setUiPrefs` passe par `agirProgressionSorealIdle` (moteur local, `prefs-compte-v1.js:86`) : elles voyagent avec la ligne ; pas de chemin d'écrasement propre. Une préférence changée sur un autre appareil n'est lue qu'à l'ouverture.
- **Deux appareils** : le second export revendique ; le premier reçoit « conflit » au prochain envoi (`idle-local-sync-v1.js:308`) ; sa progression non envoyée reste en copie écartée (aucune interface). C'est la règle « un seul appareil à la fois » (AGENTS.md) : voulu, mais la perte devrait être visible.
- **Réinitialisation de compte** : volontaire (MODIFIENT_LE_JOUEUR).
- **Heure** : le Worker travaille à l'heure du serveur ; le changement d'horloge de l'appareil n'a pas d'effet tant que l'écart est mesuré (005b si un saut survient en session).

## 7. Les sept questions de l'étape 8

1. **Cause la plus probable des rollbacks déjà observés** : A1 (copie de l'appareil jamais reprise parce que l'export réécrit la date de la ligne), éventuellement combiné à B1 si les rollbacks observés ont suivi une ouverture lente ou sans réseau (exe, iPhone), et à l'import (006). Je n'ai pas vu les données de production : A1 est démontré avec le vrai code serveur et le vrai module de la page, pas confirmé sur un appareil de joueur. Vérification en conditions réelles, sans risque : dans la console d'un appareil qui a subi un rollback, `await __SOREAL_IDLE_MOTEUR_LOCAL_V1__.copiesEcartees()` ; une copie dont la colonne 15 est antérieure à l'ouverture et dont la progression dépasse celle du serveur = A1 confirmé. Côté serveur : rapprocher les sauvegardes `periodique` / `quotidienne` de la ligne actuelle du compte concerné.
2. **Défauts réellement confirmés (reproduits)** : A1, B1, 006 (conséquence d'A1), 004 (copie partagée), 005a, 005b.
3. **Possibles mais non reproduits** : C1 (temps de jeu actif), C2 (coupure de l'envoi de fermeture sur iOS), Worker bloqué (aucun délai sur `parler`), expiration de session en cours de partie, `avantServeur` qui ignore un échec avant changement de pseudo / crédit d'EXP, comportement de l'APK (C3), suspension/reprise de l'exe, ordre des transactions IndexedDB avec une vraie IDB lente.
4. **Protections existantes qui fonctionnent** (code relu + tests existants exécutés) : accusé lié à une révision (l.280-311) ; refus serveur ≠ sauvegarde (l.299-307) ; événements acquittés par numéro et dédoublonnés côté serveur ; délai de 20 s sur l'envoi ; copie écrite à la fermeture ; copie écartée conservée en 3 exemplaires ; `copieEnAttente` quand IDB ne répond pas ; date future ramenée (au-delà de 15 min) ; revendication d'appareil et « conflit » ; sauvegardes serveur avant écrasement ; anti-triche en observation seulement ; heure du serveur dans le Worker.
5. **Limites qui empêchent de garantir l'absence absolue de perte** : un navigateur peut tuer la page avant la fin d'une écriture IndexedDB ou d'un envoi (surtout Safari / iOS) ; actions des ~0,4 s avant un plantage ; progression passive (sans action) non écrite en IDB entre deux envois (le moteur la recalcule à partir du temps, mais pas les événements automatiques) ; un seul appareil à la fois par conception (le perdant garde une copie écartée sans écran) ; l'IDB peut être effacée par le navigateur ou l'utilisateur ; la décision par dates est fragile tant qu'une version explicite n'existe pas.
6. **Risque résiduel après corrections** (si A1, B1, 004, 005 sont corrigés comme proposé) : fenêtre de coupure (≤ 10 s + 0,4 s) sur navigateur tué ; conflit multi-appareils réel (perdu mais conservé et visible) ; IDB indisponible sur l'appareil. Aucune estimation chiffrée possible sans mesure en production.
7. **Tests réels à faire** : sur iPhone Safari et Chrome Android, jouer 30 s, mettre en arrière-plan, tuer l'application, rouvrir avec et sans réseau, comparer `n`/boss vaincus ; rouvrir le jeu avec le réseau coupé après une longue session, puis rétablir ; import de fichier avec réseau coupé puis rechargement ; deux onglets puis fermeture de l'ancien ; grosse sauvegarde (≥ 127 Ko) : vérifier si l'envoi de fermeture arrive (journal du Worker serveur) ; exe : suspension / reprise de session Windows ; mesurer le coût du correctif (écriture de la dernière ligne accusée, taille et fréquence) sur la sauvegarde de Norman avec le journal de fluidité.

## 8. Actions suivantes proposées (aucune appliquée)

1. Décision de Norman sur le mécanisme de version (variante minimale d'A1 ou version serveur complète) et sur ce qui doit arriver en cas de vrai conflit (écran de choix comme l'APK ?).
2. Corriger A1 seul (+ 004, qui devient actif ensuite), avec ses repros transformés en `.test.mjs` ; reconstruire le Worker (`build-moteur-local.mjs`) seulement si `cloudflare/src/` change (la partie serveur de la version) ; `maj-pins` ; note du jour ; suite complète ; commit isolé.
3. Puis B1, puis 005a/b, puis C1, un commit par sujet.
4. Aucun push, déploiement, ni publication exe / APK sans l'ordre explicite de Norman.
