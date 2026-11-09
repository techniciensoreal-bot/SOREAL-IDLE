# Audit de cohérence — « un projet pensé en une fois » (2026-11-09)

Demande de Norman (2026-11-09) : trouver tout ce qui contredit le plan d'un projet pensé en une fois, le plus propre et optimisé possible. Référence : `design/ARCHITECTURE-CIBLE.md`, `design/PLAN-MOTEUR-UNIQUE.md`, `AGENTS.md`.

Méthode : six agents en lecture seule (Sonnet 5.5), chacun sur une dimension, preuves par chemin:ligne et comptages. Rien n'a été modifié dans le jeu. Ce document est la synthèse croisée ; les rapports bruts ne sont pas conservés (les chiffres ci-dessous en sont tirés).

**Fiabilité.** Les comptages viennent de scripts à base de regex (bornes basses ou hautes, précisées quand elles le sont). Deux constats ont été revérifiés à la main après les rapports : la liste des systèmes verrouillés envoyée au client est bien exigée par un test (`idle-audit-anti-spoil-reponse-v1.test.mjs:30`, « au moins 10 systèmes verrouillés ») ; les 6 maquettes publiques, `tmp-ch.mjs` suivi par git et les 299 WebP de boss dans `public/magic/boss` existent. Tout le reste est « rapporté par l'agent », à confirmer avant d'agir.

---

## 1. Verdict

Les critères mesurés du plan sont tenus (barres justes, moteur 64 ms, page fluide sur la vraie partie de Norman). Mais la **structure** contredit encore le plan sur huit fronts. La cause commune : le projet a grandi par couches et rattrapages (monolithe découpé mécaniquement, portage d'un tableur, copies de formules à l'écran), et chaque couche est protégée par des tests qui figent le résultat, pas l'architecture.

| # | Front | Ce qui contredit le plan | Gravité |
|---|---|---|---|
| 1 | État et formules | Le moteur est dans la page, mais l'écran continue de prédire (≈ 25 formules recopiées) ; côté moteur, aucun état résident, 2 à 4 synchros par opération | A |
| 2 | Temps et hasard | 3 horloges dans le moteur, 3 dans l'écran ; 52 `Math.random` dont 1 injectable | A |
| 3 | Contrats et schéma | Sauvegarde non versionnée ; 16 opérations mortes exposées ; catalogue de boss en copies divergentes | A |
| 4 | Règles d'AGENTS.md | Fuite anti-spoil de la liste des systèmes ; notes « Général » ; `AGENTS.md` périmé ; pas de tests structurels | A |
| 5 | Chargement et modules | 231 scripts / 6,2 Mo avant le premier affichage ; 727 cales, 574 globales implicites | A |
| 6 | CSS | ≈ 2 865 `!important`, 90 modules qui injectent du CSS, aucun système de design | A |
| 7 | Textes, médias, images | 3 mécanismes de traduction ; images de boss servies par deux chemins (965 Ko contre 12 Ko) | A |
| 8 | Dépôt et outillage | 673 Mo de `.git`, worker généré versionné, 6 étapes manuelles avant chaque push | B |

---

## 2. Front 1 — État et formules (le cœur du plan)

### Côté écran (cause racine des reculs)
- **L'écran prédit encore.** `modules/ui-boucle-v1.js:1570-1974` (`mettreAJourJeuIdleLocalV7_`, 16 sous-fonctions) tourne à 15-60 Hz et réécrit `REG.idleEtat` (66 affectations dans 14 fichiers). Le moteur local répond en quelques ms : la prédiction n'a plus de raison d'être.
- **Inventaire des formules de jeu recopiées dans l'écran** : Machine temporelle 6 endroits (et le coût de 5 000 000 par niveau écrit 3 fois : `tm-projection-v1.js:17`, `ui-machine-temporelle-v1.js:147`, `augmentations-page-v1.js:1054`) ; Augmentations 5 ; Entraînement avancé 3 ; Entraînement de base 3-4 ; Blood Magic 3 ; NGU 2 ; Wandoos 2 ; énergie/magie 4 ; Combat/vie 4-5 ; Money Pit 1 ; Garderie 1. Conformes (aucun modèle temporel local) : Labos, Hacks, Souhaits, Barbes, Yggdrasil, perks ITOPOD.
- **L'Or est écrit à 6 endroits** (`ui-boucle-v1.js:402,444,452,555`, `ui-machine-temporelle-v1.js:139`, `augmentations-page-v1.js:691`).
- **Recalages encore là** : `__tmCorr` / fondu de 600 ms, ancres de régénération (« ancre » : 173 occurrences dans 19 fichiers, « recal » : 118 dans 40). La boîte noire des reculs écrit encore dans `localStorage` : le problème n'est pas résolu à la racine.
- **Données de jeu lues dans le texte affiché ou le DOM** : le motif `/il manque .* Or/` est testé 6 fois sur `textContent` (`ui-amorcage-v1.js:241`, `sang-rituel-decor-v1.js:1183,1317,1367,1457,1532`) — échoue probablement en anglais et viole la règle n°4 ; la capacité d'achat est recalculée toutes les 800 ms par balayage du DOM (`ui-amorcage-v1.js:228-246`) ; 19 lectures de `dataset` de données de jeu dans 10 fichiers.
- **Une décision de jeu est prise dans la page** : le Rebirth automatique (Nuke auto) part d'un `setInterval` de `ui-amorcage-v1.js:970-988` ; il ne marche pas hors ligne ni sans onglet ouvert.
- **Six implémentations du rendu d'une barre** (largeur, `scaleX`, `getAnimations`, boucles propres).

### Côté moteur
- **Aucun état résident.** À chaque opération, `__idleBuildWorkbook` relit tout le catalogue et le `JSON.parse` (`idle-runtime-classeur.js:279-316`). Mesuré : `obtenirEtat` = 3 synchros complètes et 39 calculs de bonus ; `agirProgression` = 2 synchros, 26 bonus ; `synchroniser` = 4 synchros, 49 bonus. Les synchros 2 à 4 se font au même instant et n'avancent rien, mais rejouent les phases `fin:*`.
- **Deux modèles de la même donnée.** L'énergie vit dans la colonne `ENERGIE` ET dans `metaNgu.resources.energy.current`, recopiée à la main (`idle-runtime-etat.js:193-196`, `idle-runtime-progression.js:504,550,2123`). Colonnes héritées d'Apps Script encore câblées : `FORCE`, `ORGANISATION`, `ESSENCE_RENAISSANCE`, `KO_JUSQUA` (« toujours vidée » selon `idle-runtime-config.js:135`).
- **La ligne entière (jusqu'à 177 Ko) est écrite deux fois** à chaque commit : `idle_catalog` et `idle_players.state_json`. La seconde ne sert qu'à retrouver une ligne par e-mail et de filet de restauration.
- **Pas de contrat de système (avancer / appliquer / publier).** ≈ 30 fonctions `advance*` appelées dans une séquence codée en dur (`idle-ngu-systemes.js:1314-1375`) ; seuils de déblocage répétés (Machine temporelle 30, Blood Magic 37 en littéral dans `idle-ngu-actions.js:615`) ; au moins 6 implémentations de « barre qui monte par niveaux » avec des garde-fous différents (20 à 100 000 itérations) ; `1/50` et `*50` en littéral dans `idle-ngu-pistes.js` alors que `IDLE_TICK_SECONDS_V1` existe.
- **Deux méga-fonctions découpées mécaniquement** : `appliquerProgressionEnergieSorealIdle` en 16 morceaux (≈ 1 700 lignes, `idle-runtime-progression.js:462-2155`) et `construireEtatJoueurSorealIdle` en 10 (`idle-runtime-etat.js:23-1635`) ; les morceaux se passent 10 à 25 variables ; 3 tests doivent « recoller » le code (`defragmenter()`).
- **Sept stratégies de mémo** à clé « contenu de l'état » (4 chemins pour `idleNguBonuses` seul) ; l'invalidation explicite (étape 2c du plan) n'est pas faite.
- **La couche « tableur » est toujours au cœur** : `getRange(` ×180, `SpreadsheetApp` ×30, `LockService` ×28 (23 `getScriptLock` pour un cycle déjà synchrone), `CacheService` émulé pour des catalogues statiques, 162 accès `row[c.X - 1]`.
- **Le moteur local calcule et hache des réponses pour son voisin** : `allegerCataloguesV1` après chaque opération (6 catalogues, 22 pièces d'état hachés) alors que la réponse ne traverse plus aucun réseau.

---

## 3. Front 2 — Temps et hasard

- **Moteur** : 54 `Date.now()` directs, `idle-sqlite-runtime.js:1266-1268` REMPLACE `Date.now` globalement pendant une opération, un `now` passé explicitement ailleurs. L'instant du clic suit **3 règles de bornage** (`idle-ngu-actions.js:78-84`, `idle-runtime-progression.js:27-34` avec un `let` global, `index-idle-coordinator-v1.js:66-70`), la constante 5 000 ms est dupliquée. 52 `Math.random` dont un seul injectable (`context.alea`) : les parties de référence ne sont pas reproductibles pour le butin et le combat.
- **Écran** : `Date.now()` 421 occurrences (86 fichiers), `performance.now()` 144, l'heure du serveur `__SOREAL_IDLE_HEURE_V1__` seulement 40 (11 fichiers) ; `ancreSnapshotIdleV1_` corrige à la main avec le RTT.
- **Doublons de règles de temps** : le jour calendaire a 3 définitions et 2 fuseaux (Paris / Bruxelles, UTC pour la sauvegarde quotidienne) ; le plafond hors ligne est défini 3 fois ; la règle « défis sans progression hors ligne » deux fois.

---

## 4. Front 3 — Contrats, schéma, catalogues

- **Pas de sauvegarde versionnée.** Seuls `saveSchema` / `version` dans l'état NGU et une migration « legacy → V47 » ; `resourceModelVersion = 52` en dur ; 24 fonctions `normalize*` corrigent au passage. Aucune version sur la ligne joueur (38 colonnes), l'export fichier ni `idle-local-sync-v1.js`. Contredit la ligne 28 du plan et « rien n'est jamais perdu ».
- **16 opérations mortes** (21 % des 78 du contrat) renvoient `SOREAL_IDLE_V47_LEGACY_DISABLED` mais restent dans `IDLE_OPERATIONS`, le JSON de contrat, `idle-local-sync-v1.js` et `LOCALES`. Plusieurs sont encore appelées par l'écran (`ui-actions-rapides-v1.js:581,639`, `ui-boutique-v1.js:291`, `ui-magie-energie-v1.js:914,1144`, `ui-inventaire-v1.js:487`). Retrait = vérifier SOREAL-APP et monter `IDLE_PROTOCOL_VERSION`.
- **3 opérations locales hors de `OPERATIONS_DE_JEU_V1`** (`marquerVusSorealIdle`, `definirOrdreMenusSorealIdle`, `enregistrerClicsSorealIdle`) : un ancien onglet en mode serveur les appelle sans « revendiquer » la partie.
- **Catalogue des boss en copies divergentes.** Boss 289 : « Pirate Girl » dans `design/ngu-boss-names-fr.json`, « Intermission » dans `ngu-boss-fight-real-names-v1.json` (le code applique une surcharge de Norman, la copie JSON reste fausse). `design/idle-boss-extension-21-46.json` : 26 noms sur 26 divergents, plus aucun lecteur dans `src/`, `tests/`, `tools/`. `idle-ngu-boss-reference-v1.js` (520 lignes) ré-embarque les stats déjà présentes dans un JSON. La vraie source (`IDLE_BOSS`) vit en base et dans la « graine » : le dépôt ne la contient pas.
- **Constantes « choix SOREAL »** (×10 par boss au-delà de 190, facteurs de Titans, un fragment par type, convention des cœurs) : documentées en commentaire, mais `AGENTS.md` n'a pas l'exception correspondante (voir front 4).
- **Utilitaires copiés partout** : `N`/`I` dans 11 fichiers, `num` ×5, `clamp` ×3, 5 variantes de copie profonde, `idle-big-number-v1.js` (184 lignes) dont 1 fonction utilisée, `idle-ngu-progression.js` et `idle-adventure-v47.js` = barils de ré-exports ; 133 exports sans aucune référence ; 5 noms pour « boss battus » (`bossVaincus` 100, `highestBoss…` 92, `context.bosses` 23, `bossBattus` 22, `bossesRun` 14).

---

## 5. Front 4 — Règles d'AGENTS.md

- **Règle n°2 (spoil) — la plus grave.** Pour un joueur neuf, `joueur.systemes.systems` contient 25 entrées dont 24 verrouillées, avec leurs ids (dailySpin, bloodMagic, wandoos, yggdrasil, beards, hacks, wishes, cards, cooking…) et leur `kind` ; la taille révèle le total. Le code porte pourtant un commentaire « un système verrouillé n'expose ni son nom, ni son icône… » (`idle-ngu-snapshot.js:391`) : il masque des champs mais envoie l'entrée. Le test de garde exige `verrouilles.length >= 10` : **il fige la fuite**. Même risque signalé (non mesuré) pour `ngus`, `wishSlots`, `daycare`, `cards`, `macguffins`, `yggExtra`.
- **Notes de version** : le groupe « Général », toujours affiché, mentionne des systèmes dans ≈ 20 lignes sur 316 (le filtre par menu possédé ne le protège pas).
- **Totaux par `.length`** non vus par les gardes : `titans-v1.js:224` (« forme x / t.forms.length »).
- **Texte joueur « wiki »** : `ui-aventure-2-v1.js:1473` (« ID wiki 100 »).
- **`AGENTS.md` périmé** : la règle n°6 cite volumes et effets comme liés au compte ; `prefs-compte-v1.js:18` les exclut (décision de Norman, 2026-11-05).
- **Règle n°6** : 72 `setItem` à clé calculée non vérifiables statiquement (le seul hors préfixe trouvé est un jeton, légitime).
- **Règle n°4 / n°3** : `blood-magic-v1.js:357-365` insère des gouttes sans `data-morph-garder` (à confirmer avec `__auditerRedessinIdleV1__`) ; 6 `@keyframes` définis deux fois avec des corps différents ; 13 feuilles sans `prefers-reduced-motion`.
- **Tests** : 1 232 fichiers ; ≈ 375 ne font que lire du code source (909 utilisent `includes`/regex), donc cassent au renommage sans qu'une règle ait changé ; aucun test structurel ne parcourt les pages pour la règle n°2 (principe 6 du plan non réalisé) ; 24 fichiers sans test qui les nomme (dont 7 moteurs de plus de 800 lignes) ; 3 tests échouent localement par dépendance machine (`idle-graine-contenu-v1`, `idle-histoires-utiles-v1`, `idle-studio-port-libre-v1`).

---

## 6. Front 5 — Chargement et structure du frontend

- **Aucun chargement à la demande** : 231 `src=` dans `index.html`, ≈ 6,2 Mo de JS non compressé avant le premier affichage, y compris des menus verrouillés ; le plan dit l'inverse. Candidats : modules admin ≈ 270 Ko servis à tous (garde `estAdmin_()` après téléchargement), `borne-led-v1.js` 239 Ko, `sang-rituel-decor-v1.js` 212 Ko, `release-notes-v1.js` 200 Ko, `augmentations-page-v1.js` 157 Ko, `ngu-labo-v1.js` 106 Ko, `yggdrasil-elfes-v1.js` 82 Ko, `album-cartes-v1.js` 75 Ko.
- **Découpage mécanique** : 23 modules `ui-*` sont des tranches du monolithe ; 727 cales `function x(){return REG.x.apply(null,arguments);}` ; 186 appels d'amorces numérotées (`__amorcer_38`) ; `tests/_ui-ordre-origine.json` (46 Ko) fige l'ordre du monolithe supposé disparu ; 2 968 références `REG.*`.
- **Globales** : 574 `window.__…__` distinctes, 28 posées jamais lues, 4 lues jamais posées (`__SOREAL_IDLE_CHAT_MAJ_MENU__`, `__SOREAL_IDLE_FORCER_SYNCHRO_V1__`, `__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__`, `__jouerSonClicSorealV1__`).
- **Plafond contourné** : 5 fichiers à 2 583-2 699 lignes ; `borne-led-v1.js` = 239 Ko pour 2 699 lignes.
- **Minuteries et observateurs** : 137 `setInterval` (67 fichiers), 384 `setTimeout`, 140 `requestAnimationFrame` ; 13 intervalles dans `ui-amorcage-v1.js` ; 17 `MutationObserver` sur `body` ou `documentElement` en sous-arbre ; 153 `getBoundingClientRect`, 397 `querySelector(All)` ; un `setInterval` de 4 s de l'APK non confirmé comme suspendu hors visibilité (`apk-synchro-v1.js:298`).
- **Services dupliqués** : ≈ 25 formateurs de durée (alors que `time-format-v1.js` existe), `toLocaleString` 39 fois dans 25 fichiers, pas de composant de modale (34 fichiers posent un voile plein écran, 21 gèrent Échap chacun).
- **Code mort sûr** : 14 cales périmées, 5 fonctions sans test ni appel (`listeNiveau_`, `roueDisponibleIdleV1_`, `designBase`, `chroniqueBossOccupeeIdleV1_`, `capTexte_`), globales Google héritées (`__chargerJoueursGoogleIdleV1__`…), `ecartJoursV1`. **À ne pas toucher sans accord (règle n°5)** : `meteores`, `chaineNuke`, `ultraNuke`, `pluieFusees`, `superNuke`, `megaNuke` de la borne.
- **Vestiges** : en-têtes « Migrated from SOREAL-APP » et références à `Soreal_Idle_UI.html` ; suffixes de version hérités (`-v79`, `-v121`, `-v199`, `-v202`, `meta-progression-v130`, `runtime.js`, `ui.js`) ; `src/idle-adventure-v47.js` et la constante `V47`.

---

## 7. Front 6 — CSS

- `!important` : 2 517 dans les `.css` (plafond de l'audit) **+ 348 dans les modules JS** = ≈ 2 865 ; le cliquet ne voit que les feuilles. 4 feuilles concentrent 1 200 `!important` ; `soreal-idle-itopod.css:7` avoue une feuille « chargée en dernier » pour reprendre ce que les précédentes imposent.
- Spécificité : préfixes `html body.x.x` empilés, 226 `:not(#_)`, ≈ 1 070 sélecteurs de 5 classes ou plus.
- 90 modules créent un `<style>` à l'exécution (≈ 225 `@keyframes` dans des chaînes JS) : hors cache immuable, hors audit, hors cliquet.
- Aucun système de design : 2 524 couleurs hexadécimales distinctes dans les feuilles (+ 2 175 dans les modules), 79 tailles de police, 30 niveaux de `z-index`, 44 variables seulement ; `@font-face` « Bangers » qui sert des chiffres en Russo One (`soreal-idle-itopod.css:1865`).
- 444 `@keyframes` ; 6 noms définis deux fois avec des corps différents (`bgLeche`, `sorealHudAurore`, `sorealTuileReflet`, `sorealIdlePlayerHitV46`, `sorealIdleBossHitV46`, `nlScint`) — la dernière gagne, la première est morte ; 114 animations de `background-position`, 50 de `filter`, 24 de `box-shadow` (repaint à chaque image) ; 768 sélecteurs universels ; `content-visibility` absent des longues listes ; 25 points de rupture différents ; 60 à 80 classes mortes (majorant 108).
- `ui.css` 6 369 lignes, `themes.css` 2 367 lignes : pas de découpage par page ni de plafond CSS.

---

## 8. Front 7 — Textes, médias, images

- **Images de boss** : `/api/idle/media/boss?id=N` fait un `R2.list()` + recherche floue par nom (`idle-media-v1.js:1386-1424`) ; boss 5 = 964 850 octets (5 min, `must-revalidate`), le WebP de `public/magic/boss/5.webp` fait 12 722 octets (7 jours). 299 fichiers présents, les ids 289 et 296 manquent (servis seulement par R2) ; `theme-images-v1.js:173` remplace certaines images après coup (double chemin). 25 routes média dépendent de `R2.list()` ; aucun manifeste versionné ; trois fichiers de correspondance d'objets côté client + 6 de garderie.
- **Traduction : trois mécanismes concurrents** : `traduction-interface-v1.js` (EN → FR), `traduction-anglais-v1.js` (FR → EN, dictionnaire de 7 051 entrées, 954 Ko, chargé en entier), `idle-traductions-v1.js` côté moteur (7 fichiers, 159 Ko) ; 62 messages français dans le moteur. 1 548 entrées orphelines (≈ 22 %, à confirmer : faux positifs par concaténation), 1 374 sont des lignes de notes de version (29 % du fichier). Aucun garde « toute chaîne FR a une entrée » (échantillon sans trou). Mobs du miroir wiki absents du jeu et de la traduction : « Greasy Nerd's Mom », « Priest of Exile », « Skeleton Guardian », « The Consigliere » (à vérifier sur le wiki, règle n°1).
- **Cache** : `_headers` ne couvre ni `/img`, `/shop`, `/dos-cartes`, `/perks`, `/garderie`, `/cthulhu`, `/intro`, `/chargement`, `/icons`, `/trou`, `/voice*` ; aucun test ne relie les URL du code aux fichiers (ni l'inverse).
- **Poids** : `fond-pc.webp` 458 Ko, `icon-512.png` 444 Ko (devrait être très inférieur), `soreal-idle-itopod.css` 386 Ko, `augment-pcb-puissance` 337 Ko, `entetes-miniature` 279 Ko ; MediaPipe 14,5 Mo à la demande (bien).

---

## 9. Front 8 — Dépôt et outillage

- `.git` = 673 Mo ; `public/moteur-local-worker-v1.js` (1,7 Mo, **généré**) a 144 versions ; binaires Unity WebGL abandonnés (≈ 8 Mo par version) et MediaPipe (14,5 Mo) dans l'historique ; 431 fichiers sous `design/apercu-*` (PNG de 1 à 2,4 Mo).
- Déployés en production sans lien avec le jeu : `public/maquette-*.html` ×6 (`.assetsignore` ne masque que `_*.html`).
- Suivis par git : `cloudflare/tmp-ch.mjs`, `cloudflare/bench/tmp-recul.mjs`. `.gitignore` racine à 2 lignes ; `shared/`, `tmp_r2/`, `echantillons-voix-en/` non rangés.
- **Six étapes manuelles à enchaîner de mémoire avant un push** : note du jour, nouveautés, pins, catalogue des visuels, moteur local, tests. Déploiement sous 4 formes ; la CI ne régénère rien et ne détecte pas un fichier généré périmé hors du test `idle-moteur-local-v1`.

---

## 10. Plan de rattrapage proposé (par vagues, du moins risqué au plus risqué)

### Vague 0 — sans regret (≈ 1 à 2 jours, risque quasi nul)
1. **Anti-spoil** : n'envoyer que les systèmes découverts (+ un marqueur opaque pour le prochain) ; inverser l'assertion du test (absence, pas `>= 10`) ; retirer les lignes « Général » qui nomment un système ; corriger `titans-v1.js:224` et « ID wiki 100 ».
2. **`AGENTS.md`** : corriger la règle n°6 (volumes/effets propres à l'appareil) ; consigner l'exception « constante SOREAL modérée et signalée » avec un registre daté.
3. **Cliquets** : l'audit d'architecture compte aussi les `!important` des modules JS, plafonne les `setInterval`/`requestAnimationFrame`/`MutationObserver`, interdit une 2ᵉ définition de formateur de durée/nombre, vérifie que chaque `window.__X__` lu est posé.
4. **Hygiène** : retirer `tmp-ch.mjs`, `tmp-recul.mjs` ; déplacer ou masquer les 6 maquettes ; compléter `.gitignore` ; dé-exporter les 133 constantes mortes ; supprimer les 14 cales périmées et les 5 fonctions sans test ; supprimer les 6 `@keyframes` perdants (+ catalogue des visuels).
5. **Outillage** : un `preparer-push.mjs` qui enchaîne les six étapes et s'arrête à la première erreur ; un contrôle CI « la régénération du moteur local ne produit aucun diff ».
6. **Moteur** : ajouter les 3 opérations locales à `OPERATIONS_DE_JEU_V1` ; garde « déjà synchronisé à cet instant » (synchros 2 à 4 gratuites) ; une seule règle de bornage de l'instant du clic ; une seule constante de plafond hors ligne.

### Vague 1 — services communs (≈ 1 à 2 semaines, risque faible à moyen)
7. Horloge et hasard injectés dans le contexte d'opération (`Horloge`, `Alea` à graine) + test interdisant `Date.now`/`Math.random` hors de la fabrique ; un seul jour de Bruxelles.
8. `idle-outils-v1.js` (N/I/clamp/clone) ; `time-format-v1` et `number-format-v1` seuls formateurs ; composant `modale-v1`.
9. Chargeur à la demande (`charger(nom)`) : modules admin d'abord, puis notes de version, puis pages lourdes ; planificateur central (minuteries) et observateur central.
10. Manifeste média généré (`id → URL`, hash, taille) ; boss : une table, WebP 289 et 296 ajoutés, `immutable` ; en-têtes de cache pour les dossiers sans règle.
11. `catalogue/boss.json` unique (id, nomEn, nomFr, stats, image) lu par la graine, la traduction, la voix et les tests ; archiver les `design/idle-*-full*` et `*-extension*`.
12. Tests structurels (voir liste du § 11) et migration des gardes de règles vers des tests de comportement.

### Vague 2 — la source unique (≈ 3 à 6 semaines, risque moyen à élevé, derrière les parties de référence)
13. **Publication moteur « valeur + taux + instant + plafond + palier » par barre**, système par système en commençant par la Machine temporelle (6 endroits), puis suppression du rejeu de `ui-boucle-v1.js`, des recalages et de l'écriture de l'Or côté écran ; `idleEtat` en lecture seule dans la page ; booléen « attend de l'Or » publié (corrige aussi l'anglais) ; Nuke auto décidé dans le moteur.
14. **Sauvegarde versionnée** : `etatVersion` sur la ligne et l'export, registre `migrations[n]` pur et idempotent, un test par ancienne forme (les parties de référence existent) ; vérifier sur des exports réels qu'aucune partie n'est en version < 47 avant de retirer `migrateLegacyMetaToV47`.
15. **Moteur** : état résident par joueur ; compteurs de version par bloc à la place des clés « état sérialisé » et des 7 mémos ; en mode local, ni hachage ni copie de texte du pont ; une seule représentation de l'énergie, colonnes mortes retirées, `idle_players` réduit à un index.

### Vague 3 — structure (≈ plusieurs mois, risque élevé, à planifier avec Norman)
16. Registre de systèmes (`avancer` / `appliquer` / `publier`) et fonction unique de barre ; démontage des deux méga-fonctions en étapes nommées.
17. Registre déclaratif des dépendances (remplace 727 cales et 574 globales) ; amorces nommées ; renommage des suffixes `-vNN` (`git mv` + `maj-pins`) ; suppression de `_ui-ordre-origine.json`.
18. CSS : `@layer` + `tokens.css`, préfixes en `:where()`, extraction du CSS des 90 modules, retrait progressif des `!important`, boucles `background-position`/`filter` migrées vers `transform` sur pseudo-éléments (période de tuile inchangée), `content-visibility` sur les listes longues après mesure.
19. Un seul mécanisme de traduction à clés `{fr, en}` dans les notes de version et les textes du moteur ; dictionnaire généré au build, découpé par module.
20. Un seul module `Rendu` (canvas pour les barres rapides) — l'étape finale du plan.

---

## 11. Tests structurels à ajouter (principe 6 du plan)
- **T1** parcourir la vraie réponse d'un joueur neuf et d'un joueur à mi-parcours : aucun id, nom, `kind` ni taille de liste d'un système non découvert.
- **T2** notes de version : filtre appliqué pour un joueur neuf, échec si une ligne visible nomme un système (liste centralisée).
- **T3** charger les modules sur un faux navigateur, enregistrer toutes les clés `setItem` : préfixe autorisé ou liste d'exclusion déclarée.
- **T4** détecter `' / '+x.length` et « nombre / nombre » dans les chaînes affichables (liste blanche justifiée).
- **T5** `LOCALES` + `MODIFIENT_LE_JOUEUR` + liste « serveur » explicite = exactement les 78 opérations du contrat.
- **T6** aucun texte joueur ne contient « wiki » ni un nom de set.
- **T7** registre des constantes « choix SOREAL » : date et décision de Norman, échec si une nouvelle apparaît sans entrée.
- **T8** boucles : fondu d'entrée/sortie pour toute nouvelle `@keyframes` ; `__auditerRedessinIdleV1__` sur chaque menu de `IDLE_MENUS_VIVANTS_V1`.
- **T9** `window.__X__` lu ⇒ posé ; nombre de formules de jeu par système côté écran qui ne peut que baisser (cliquet).
- **T10** chaque URL média citée dans le code existe, et chaque id de boss 1 à 301 résout.

---

## 12. Décisions qui reviennent à Norman
1. Les **6 maquettes publiques** (`maquette-*.html`) : supprimer, déplacer dans `design/`, ou garder ?
2. Les **fonctions d'animation de la borne** apparemment mortes (`meteores`, `chaineNuke`, `ultraNuke`, `pluieFusees`, `superNuke`, `megaNuke`) : règle n°5, rien ne disparaît sans son accord.
3. Les **431 aperçus** de `design/apercu-*` : lesquels garder ? Faut-il **purger l'historique git** (Unity WebGL, MediaPipe, 144 versions du worker) ? Réécrire l'historique est irréversible pour les autres copies du dépôt.
4. Les **16 opérations mortes** : confirmer qu'aucun ancien client (SOREAL-APP, exe, APK) ne les appelle avant de monter `IDLE_PROTOCOL_VERSION`.
5. Les **modules admin** : chargés seulement pour un compte administrateur ?
6. Le **renommage massif** des suffixes `-vNN` : accepté (avec `maj-pins` et mise à jour des tests) ?
7. Les **constantes « choix SOREAL »** (×10 par boss au-delà de 190, Titans, fragments, cœurs) : les valider une à une ou les remplacer quand le wiki publie la valeur.
8. Les **quatre mobs** du miroir wiki absents du jeu : à ajouter après vérification directe sur le wiki (règle n°1).
9. Le **moteur local généré** : construit par la CI au déploiement (retiré de git) ou gardé versionné ?

---

## 13. Ce que cet audit n'a pas vérifié
- Aucune exécution du jeu : les constats « écran » viennent de la lecture du code (les chiffres de minuteries et de formules sont des bornes).
- Le contenu réel de R2, la taille de l'état d'un joueur en production, les octets gzip transférés.
- 30 constantes de jeu contre le wiki (une dizaine seulement vérifiées), 30 boucles d'animation contre la règle n°3, le contraste réel des textes grisés.
- Les dossiers `desktop/` et `android/` (3,8 et 3,9 Go) : à fouiller avant de retirer une globale « héritée ».
- Les pièces `ngus`, `wishSlots`, `daycare`, `cards`, `macguffins`, `yggExtra` pour la fuite anti-spoil (non mesurées une à une).

## Vague 0 : réalisé
- Cliquets de dette (agent « outillage ») dans `cloudflare/tools/audit-architecture.mjs` : `!important` du JS (348), `setInterval` (103), `requestAnimationFrame` (106), `MutationObserver` (23), styles injectés (98, plafond par fichier), formateurs de durée/nombre dupliqués (11), globales `window.__X__` lues sans être posées (liste blanche de 5), fichiers JS > 150 Ko (4, plafond par fichier en octets), lignes par feuille CSS (plafond par feuille). Valeurs mesurées le 2026-11-09, jamais en hausse ; `--detail` liste les fichiers responsables.
- `cloudflare/tools/preparer-push.mjs` : note du jour, nouveautés vertes, moteur local, pins (jusqu'à « 0 numéros montés »), catalogue des visuels, audit, suite complète 6 à la fois (`--rapide`, `--sans-moteur`, `--a-blanc`, `--connus=`) ; ne committe ni ne pousse.
- CI (`cloudflare-deploy.yml`) : étape qui reconstruit le moteur local et échoue si `moteur-local-worker-v1.js`, le wasm ou `moteur-local-v1.js` diffèrent du dépôt (le test `idle-moteur-local-v1` ne vérifiait que les empreintes, pas la fraîcheur par rapport à `src/`).
