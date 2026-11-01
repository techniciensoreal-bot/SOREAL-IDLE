# Audit fluidité de l'APK hors ligne (analyse seule, 2026-11-01)

Plainte de Norman : « L'application Android hors ligne est vraiment pénible. Beaucoup de lourdeurs dans les menus. L'application en ligne n'a pas ça. Même l'écran réagit moins bien au toucher. »
Précisions : le menu le plus lourd est « Fight boss » ; « il est important que tout soit fluide dans chaque menu ». Téléphone : Redmi Note 14 Pro+ 5G (écran 120 Hz, WebView Chromium).

Nature de ce document : lecture du code + quelques mesures sur PC. **Rien n'a été mesuré sur le téléphone** (`adb` absent du PC : `where adb` ne trouve rien ; aucun appareil listé). Chaque chiffre est marqué MESURÉ (sur ce PC), COMPTÉ (analyse statique du dépôt) ou ESTIMÉ (raisonnement, à confirmer sur le téléphone). Aucun fichier du dépôt n'a été modifié en dehors de ce rapport ; aucun serveur n'a été lancé.

Point de départ à vérifier : un audit « perf(apk) » a déjà été committé le 2026-11-01 09:13 (`38c61773`) et un correctif d'images (`857d32a5`). Les assets embarqués dans `android/hors-ligne/app/src/main/assets/public` datent du build initial (ils n'ont pas `borne-led-v1.js`). **Il faut vérifier sur le téléphone, dans Réglages, le numéro de code actif** : si ces correctifs n'ont pas été publiés par `publier-maj.mjs --apk`, la plainte porte peut-être sur l'ancien code.

---

## 1. Cartographie : ce que fait l'APK hors ligne

| Élément | APK hors ligne | Version en ligne | Preuve |
|---|---|---|---|
| Conteneur | `WebView` native plein écran, origine fictive `https://appassets.androidplatform.net` | Chrome / navigateur, HTTP/2 réel | `MainActivity.java:53-54, 222-224, 270` |
| Service des fichiers | `shouldInterceptRequest` (Java) pour CHAQUE requête (page, 205 scripts, 22 feuilles, images, sons) : lecture dans l'APK (`openFd`) ou dans `files/maj/` | Réseau + cache HTTP + Cloudflare | `MainActivity.java:84-145, 241` |
| Service worker | `sw-idle-v1.js` (1,73 Mo) = le VRAI Worker de production + sql.js + IndexedDB. Reçoit seulement `/`, `/index.html`, `/api/*` | SW léger de simple cache de coque (`public/sw-idle-v1.js`) | `sw-android.js:384-442`, `demarrage.html:25` |
| Moteur de jeu | Web Worker `moteur-local-worker-v1.js` (1,67 Mo) + sql.js dans la page (comme en ligne) ET une SECONDE base sql.js complète dans le service worker | Un seul moteur (le Worker de la page) ; le serveur est distant | `moteur-local-v1.js:22-23`, `sw-android.js:239-300` |
| Rôle du SW pour le jeu | Reçoit les « push » de la partie (toutes les 30 s au lieu de 10 s), `battementSorealIdle` (au plus 1 calcul réel / 90 s), chat, médias `/api/idle/media/*`, images (Cache API) | Idem mais sur le réseau | `sw-android.js:333-383, 410-441` |
| Stockage | IndexedDB du Worker de page + IndexedDB du SW (ligne joueur seule à chaque changement, base entière toutes les 2 min) | IndexedDB du Worker de page | `sw-android.js:195-225, 330` |
| Réglages WebView | JS, DOM storage, `databaseEnabled`, `mediaPlaybackRequiresUserGesture(false)`, zoom coupé, `hardwareAccelerated="true"`, `largeHeap`, Safe Browsing coupé. **Aucun** `setLayerType`, `setRenderPriority`, `overScrollMode`, `setOffscreenPreRaster`, `setCacheMode` | Réglages Chrome par défaut | `MainActivity.java:225-235`, `AndroidManifest.xml` |
| Détection mobile du jeu | Pas de mode « économe » commun. `mobile()` = `innerWidth <= 700`, utilisé par la borne LED seulement ; `effets-legers-v1.js` coupe (par défaut sur l'APK) les animations du menu du haut et des décors | idem (effets complets par défaut) | `borne-led-v1.js:873`, `effets-legers-v1.js:15-22` |
| Mises à jour | `Maj.java` : fil d'arrière-plan basse priorité | Aucune | `MainActivity.java:327-337` |

---

## 2. Tableau classé par probabilité d'impact (global, tous menus)

Légende « APK ? » : R = reconstruction de l'APK nécessaire (Java/manifeste) ; M = mise à jour des assets suffit (`publier-maj.mjs --apk`).

| # | Cause | Preuve | Effet attendu menus / toucher | Correctif proposé | Risque | APK ? |
|---|---|---|---|---|---|---|
| 1 | **Pas de cache de code V8 pour 5,1 Mo de JS + 1,9 Mo de CSS** : les réponses de `shouldInterceptRequest` ne passent pas par le cache HTTP, donc a priori pas de « code cache » Chromium. Tout le JS est recompilé à chaque lancement, et chaque grosse fonction se compile à la première utilisation (ESTIMÉ, à confirmer au profileur) | COMPTÉ : 205 scripts = 5 114 364 octets, 22 feuilles = 1 883 385 octets (`index.html`) ; plus 1,7 Mo (SW) + 1,7 Mo (Worker) à compiler | Démarrage lent ; à la PREMIÈRE ouverture de chaque menu, saccade (compilation paresseuse) ; en ligne le cache de code existe | Mesurer d'abord (chrome://inspect > Performance > « Compile Script » au 1er clic). Pistes : servir les scripts via le Cache API depuis le SW (le cache de code existe pour le Cache Storage) ; ou `WebViewAssetLoader` (même chemin, sans gain garanti). Ne rien décider sans mesure | Moyen (change le chemin de chargement) | M pour SW ; R pour le Java |
| 2 | **Fight boss : panneau LED canvas redessiné à ~31 i/s avec ~2 `drawImage` par point allumé** (voir §3) | `borne-led-v1.js:749-759, 978` | Plus gros coût CPU principal du menu le plus lourd ; occupe le fil principal qui traite aussi le toucher | Ne redessiner que si la grille a changé ; `getContext('2d',{alpha:false})` ; `pointer-events:none` (§3) | Faible (rendu identique) | M |
| 3 | **Réveil du service worker toutes les 30 s** : Android arrête un SW après ~30 s d'inactivité ; chaque envoi de la partie le réveille, donc : analyse de 1,73 Mo de JS, `initSqlJs`, relecture de la base entière depuis IndexedDB (plusieurs Mo), graine. 2 bases sql.js en mémoire en plus du Worker (ESTIMÉ) | `moteur-local-v1.js:23` (30 s), `sw-android.js:289-327` (démarrer) | Pics CPU/mémoire périodiques (ramasse-miettes, throttling thermique) qui sont ressentis comme des à-coups toutes les 30 s, surtout en combat | Pour l'APK, ne pas confier la sauvegarde au SW : écrire seulement dans l'IndexedDB du Worker de page (le SW ne sert que pour chat/médias) ; ou espacer l'envoi à 60 s ; ou n'envoyer au SW qu'au passage en arrière-plan / à la fermeture | Moyen-élevé : la copie du SW est un filet de sécurité (règle n°7). Ne pas retirer sans accord de Norman | M |
| 4 | **Timers de fond sur toutes les pages** : `nuke-blindage` 150 ms (6,7 Hz, partout), `actualiserNavAlimente` 500 ms, deux boucles à 800 ms qui font `querySelectorAll` sur toute la page + regex sur `textContent`, défis 1 s, `effets-legers` 3 s, `ajuster` 1,5 s, bandes de la borne 4 s | `nuke-blindage-v1.js:161`, `ui-amorcage-v1.js:227, 303, 520, 782, 921`, `effets-legers-v1.js:35`, `borne-bandes-sync-v1.js:20` | Chacun est petit, mais ~10 réveils/s du fil principal ; sur Augmentations/Boutique (beaucoup de lignes) la requête à 800 ms parcourt des centaines de nœuds. Un réveil au mauvais moment retarde un « touch » | Mode économe : doubler les périodes sur mobile ; n'exécuter `nuke-blindage` que dans le menu combat ; remplacer les `querySelectorAll` par des listes mémorisées | Faible | M |
| 5 | **Boucle de jeu à chaque image d'écran (120 Hz sur ce téléphone)** : `frameJeuV214_` refait le tick complet à chaque image tant que son coût moyen est < 4,5 ms (ESTIMÉ : à 120 Hz, jusqu'à 120 ticks/s) | `ui-boucle-v1.js:1944-1951` | Chaque tick écrit le DOM (barres, compteurs, PV). Sur un écran 120 Hz le plafond « 60 images/s » voulu par Norman n'est pas appliqué : seule une moyenne de coût limite | Plafonner à 60 Hz (intervalle ≥ 15 ms) : visuellement identique (les barres sont calculées sur le temps réel `dt`) | Très faible | M |
| 6 | **Synchro de 4 s pour les menus « vivants » + combat** : à chaque réponse le morph recompare toute la page. Coût moteur MESURÉ sur PC : `obtenirEtat` 21 ms, `agirProgression` 11 ms, `battement` 1 ms (Worker, hors fil principal) ; à ×3 à ×5 sur un téléphone (ESTIMÉ) = 60 à 110 ms de Worker, puis JSON + morph sur le fil principal | `ui-boucle-v1.js:2045-2051`, bench ci-dessous | Une saccade toutes les 4 s dans Fight boss et dans NGU/Wandoos/Yggdrasil/Diggers/Beards/Wishes/Hacks | Réponse allégée déjà en place ; mesurer avec `diag-fluidite` la durée du morph ; passer à 8 s sur mobile pour les menus vivants non combat | Faible | M |
| 7 | **Animations CSS infinies : 232 règles** (COMPTÉ) dont ~100 dans le menu du haut (`nav-deco` 61, `alimente` 34). Sur l'APK ces deux familles sont coupées par défaut (`soreal-nav-calme`), **sauf si le compte a un choix explicite** : les préférences suivent le COMPTE (règle n°6), donc une case posée sur PC (`soreal_idle_effet_nav_v1 = '1'`) réactive tout sur le téléphone | `effets-legers-v1.js:15-22`, `prefs-compte-v1.js` | Si la préférence est posée : ~100 animations en permanence = rendu GPU constant, 20-25 i/s (journal du 24/10) | Vérifier les clés dans le compte de Norman ; séparer la préférence par appareil (`soreal_idle_effet_*` ajouté à `EXCLUES` sur APK) ou clé spécifique APK | Faible | M |
| 8 | **Filtres et ombres** : 77 règles `filter` globales + 54 `drop-shadow` + 495 `box-shadow` (COMPTÉ) ; `itopod.css` (372 Ko) et `themes.css` (262 Ko) contiennent à eux seuls 118 `filter` et 68 `drop-shadow` | analyse CSS | `filter`/`drop-shadow` sur des éléments animés forcent un nouveau calque + une passe GPU par image ; `box-shadow` animé repeint à chaque image | Sur mobile, retirer le `drop-shadow` des éléments à animation infinie (classe `soreal-mode-eco` sur `<html>`) | Change légèrement l'ombre (à faire valider), sinon sans effet visible | M |
| 9 | **Aucun `content-visibility`, 2 `contain:` seulement** sur tout le CSS (COMPTÉ) ; 3 903 règles globales + 4 `backdrop-filter` | analyse CSS | Chaque changement de style revalide un grand arbre ; défilement des longues pages (Augmentations, Boutique, Chroniques, Inventaire) plus lent | `contain: layout paint` sur les panneaux de page, `content-visibility:auto` + `contain-intrinsic-size` sur les lignes répétées hors écran | Moyen (peut décaler le défilement si la taille intrinsèque est mal estimée) | M |
| 10 | **Requêtes interceptées en Java et par le SW** : chaque ressource passe par `shouldInterceptRequest` ; les fichiers sans `?v=` (images de `public/`, ex. `/shop`, `/trou`, `/garderie`, `/perks`) reçoivent `Cache-Control: no-cache` ; les images `/api/idle/media/*` réveillent le SW (avec cache du SW, mais requête interprocessus à chaque `<img>` recréé) | `MainActivity.java:96-99`, `sw-android.js:333-349, 391-399` | Images qui arrivent tard au changement de menu ; latence à chaque `<img>` recréé | `max-age` long pour les images de `public/` (comme déjà fait pour `/__medias`) ; garder les `<img>` en place lors des redessins | Faible | R pour l'en-tête Java ; M pour la page |
| 11 | **Pas de réglage tactile explicite** : pas de `overScrollMode`, `touch-action` seulement dans 3 feuilles (15 règles). Le viewport est `width=device-width,initial-scale=1` (pas de délai de 300 ms). Écouteurs `touchstart/pointermove` : tous `passive:true` sauf un `wheel` non passif (souris, sans effet au toucher) (COMPTÉ) | `index.html`, `carte-boss-magic-v1.js:298` | Le toucher n'est pas freiné par des écouteurs bloquants ; sa lenteur vient du fil principal occupé (causes 2-6) | `touch-action: manipulation` global, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: none` | Faible | M (CSS) |
| 12 | **Pas de mode « économe » commun** : 5 `innerWidth<=700` dispersés, un seul `matchMedia`, aucune classe `<html>` partagée (COMPTÉ) | `grep innerWidth` | Chaque correctif mobile est refait module par module | Créer `soreal-mode-eco` (APK ou petit écran tactile) posée très tôt, lue par CSS et JS | Faible | M |

### Mesures faites sur ce PC (MESURÉES)
- Banc du moteur (`node cloudflare/bench/bench-moteur.mjs`, PC de bureau) : `obtenirEtat` 21,3 ms (p95 27,7), `agirProgression` 11,2 ms, `battement` 1,17 ms, `enregistrerClics` 1,06 ms, `obtenirEtat` après 6 h d'absence 23,7 ms. Un Redmi Note 14 Pro+ (Snapdragon 7s Gen 3) est, en estimation prudente, 3 à 5 fois plus lent par cœur : 60 à 120 ms par synchro de menu vivant, dans le Worker (hors fil principal tant que le Worker n'est pas en concurrence avec le SW réveillé).
- Taille de la ligne joueur : non mesurée ici (~150 Ko d'après la consigne) ; son envoi traverse structured clone + `JSON.parse` + `UPDATE` + relecture de toutes les lignes JOUEURS + écriture IndexedDB dans le SW, toutes les 30 s (`sw-android.js:210-232`).
- Démarrage : 205 scripts (5,11 Mo), 22 feuilles (1,88 Mo), Worker 1,67 Mo, wasm 0,68 Mo, SW 1,73 Mo, `modules/` 21 Mo au total sur disque (dont MediaPipe chargé à la demande), 625 Mo de médias embarqués.
- Nombre de requêtes interceptées au démarrage : ~230 (205 scripts + 22 feuilles + page + polices) passant par `shouldInterceptRequest` ; en usage, chaque image/média s'y ajoute.
- Non mesurables sans téléphone : coût par image, nombre de nœuds DOM, durée du morph, temps de réveil du SW.

---

## 3. Fight boss (menu le plus lourd)

Structure : borne d'arcade `.borne-v2` avec un grand panneau LED (canvas) + 1 petit écran LED (nom du joueur), couches d'effets (`combat-effets`, `foudre-borne`, `nuke-blindage` calque, particules), boutons Fight / Stop / Nuke, journal, barres de vie ; 326 règles CSS ciblant ce menu dont 27 animations infinies, 6 `filter`, 6 `drop-shadow`, 69 `box-shadow`, 3 `mix-blend-mode`, 1 `backdrop-filter` (COMPTÉ, `data-menu="combat"`).

### 3.1 Canvas LED (`borne-led-v1.js`)
- Grille sur téléphone : point de 3 px CSS arrondi en pixels d'écran. ESTIMÉ pour dpr ≈ 2,75 : point = 8 px, hôte ≈ 360 × 144 px CSS → grille ≈ 123 × 49 = **~6 000 points**, canvas ≈ 984 × 392 px (`grille()`, lignes 876-880 ; rapport 90/36 sous 470 px, `soreal-idle-borne-led-v1.css`). Sur PC : 120 × 40 = 4 800 points en canvas 480 × 160 : **presque le même nombre d'appels de dessin, sur un processeur plus lent et avec 4 fois plus de pixels**.
- `Panel.draw` (lignes 749-759), chaque image : efface deux tableaux, exécute la scène, recopie le fond (`drawImage` plein canevas), puis **un `drawImage` de halo (24 × 24 px, mode `lighter`) pour chaque point d'intensité ≥ 70, puis un `drawImage` de cœur pour chaque point > 0**. Avec 1 500 à 3 000 points allumés (la jauge de vie occupe 19 rangées de large), c'est 3 000 à 6 000 appels par image.
- Cadence : `boucle` limite à 32 ms sur mobile (`lastTs`, ligne 978) : ~31 images/s, jamais moins, **même si rien n'a changé** (seul le chemin `prefers-reduced-motion` compare une signature, lignes 765-769). Estimation : 3 000 à 6 000 appels × 2-5 µs = 6 à 30 ms de fil principal par image, donc 20 à 90 % du temps du fil principal. C'est la cause la plus plausible de « l'écran réagit moins bien au toucher » dans Fight boss.
- Petit écran du joueur : redessiné seulement si sa signature change (`dessinerMinis`, ligne 1016) : négligeable.
- Aucun `pointer-events:none` sur `.bn-led-canvas` (le seul `pointer-events` du fichier est sur `.bn-pv-source`) : le canvas reçoit les touchers de sa zone ; sans conséquence fonctionnelle mais inutile.
- Autres : `actif()` coupe bien la boucle hors écran / onglet masqué (lignes 969-971, IntersectionObserver). `nuke-blindage` interroge toutes les 150 ms même hors combat.

### 3.2 Allègements pour la borne, SANS changer l'apparence
1. **Ne pas redessiner si la grille n'a pas changé** : après `fn(t)` comparer `this.v`/`this.c` (6 Ko) avec la copie de l'image précédente et le `gain` ; si identiques, sauter les ~6 000 `drawImage`. Dans les scènes fixes (FIGHT !, vie du boss constante, noms) c'est la plupart des images. Rendu strictement identique. Gain attendu : très grand dans les scènes calmes.
2. **`getContext('2d', {alpha:false})`** (le fond est opaque) : évite la composition avec transparence. Identique.
3. **`pointer-events:none` sur les canvas LED** : toucher plus net. Identique.
4. **Regrouper les halos** : dessiner le halo d'une série de points contigus de même couleur en une passe (ou pré-composer une ligne) : identique visuellement si le calcul reste le même ; gain moyen, travail plus long. À garder pour plus tard.
5. **Ne dessiner qu'une image sur deux pendant les scènes lentes** (défilement de texte à 14 colonnes/s, fondus) : 31 → 20 i/s ; **changerait légèrement la fluidité des défilements** (à faire valider par Norman). Les scènes d'action (hit, nuke) resteraient à 31.
6. Ce qui changerait l'apparence (à proposer seulement avec accord) : grille de 4 px au lieu de 3 px sur téléphone (≈ −45 % de points), suppression des halos, plafond de 100 colonnes.

### 3.3 Autres coûts du menu
- Halos / néons de la borne et des boutons (`soreal-idle-borne-joueur-v1.css` : 2 `filter`, 1 `blur`, 9 `box-shadow`, 3 `text-shadow`) ; `carte-boss.css` : 9 `filter`, 3 `drop-shadow`, 4 `blur`. Les animations infinies (27) tournent tant que le menu est ouvert, y compris celles sous des `filter` : mode économe = les figer hors action (`animation-play-state: paused` tant que le combat n'est pas en cours).
- Particules / effets (`combat-effets-v1.js`) : éléments DOM créés/retirés par `setTimeout`, `getBoundingClientRect` mis en mémoire ; `tic` toutes les 100 ms seulement avec un état actif. Faible.
- Synchro de combat toutes les 4 s (`ui-boucle-v1.js:2045`) : saccade périodique (cause 6).
- Décompte automatique : `setInterval(..., 100)` (`ui-combat-1-v1.js:1450`) ; faible.
- Tick de jeu à chaque image (cause 5).

---

## 4. Classement par menu (coût attendu sur WebView mobile)

Méthode : COMPTÉ = règles CSS filtrées par `data-menu`, canvas (`getContext`), `requestAnimationFrame`, timers, taille des modules ; la note A (pire) à D (léger) est une ESTIMATION. À confirmer menu par menu avec le journal de fluidité sur le téléphone. Tous les menus partagent le coût fixe du bandeau du haut, du menu du haut et des décors globaux (232 animations infinies globales, causes 7-8-9).

| Rang | Menu | Éléments coûteux (COMPTÉ) | Note | Ce qui nuit au toucher | Allègement sûr |
|---|---|---|---|---|---|
| 1 | **Fight boss** | Canvas LED ×2, 27 animations infinies, filtres, tick 120 Hz, synchro 4 s, effets DOM | A | Fil principal saturé par le canvas | §3.2 (1 à 3), plafond 60 Hz du tick |
| 2 | **Magie du sang** | `sang-rituel-decor-v1.js` 207 Ko, 8 `requestAnimationFrame`, canvas, scène avec classes `bm-*` ; 2 animations infinies du menu | A- | Animations de scène continues ; morph protégé par `data-morph-classes-gardees` | Plafonner les rAF de la scène à 30 i/s ; pause quand l'onglet de la scène n'est pas visible |
| 3 | **ITOPOD** | `itopod.css` 372 Ko (surtout règles générales), badavatars rendus (canvas profil), 25 `drop-shadow` dans la feuille | B+ | Beaucoup de personnages animés simultanément | Mode économe : figer les badavatars hors écran (IntersectionObserver), `content-visibility` |
| 4 | **Augmentations** | `augmentations-page-v1.js` 146 Ko, 5 rAF (montants, allocation rapide), 186 règles CSS, nombreuses lignes ; boucle 800 ms qui parcourt `[data-idle-aug-cout-v1]` | B+ | Boucle de 800 ms sur beaucoup de nœuds ; recalcul de bonus à chaque niveau | Mémoriser la liste des lignes ; `contain: layout paint` par ligne ; `content-visibility:auto` |
| 5 | **Machine temporelle** | `machine-dessin-v1.js` (canvas, 2 rAF), `ui-machine-temporelle-v1.js` (3 rAF), 16 animations, filtres ; déjà allégée aujourd'hui (`04af6925`) | B | Rendu du liquide / de la tour | Contrôler après publication de `04af6925` |
| 6 | **Aventure** | `ui-aventure-1/2-v1.js` (124 + 152 Ko), 3 rAF, combat auto à cadence rapide, événements toutes les ?; journal de butin | B | Redessin du journal et du sac à chaque combat auto | Limiter le journal affiché, `contain` sur le sac, redessin différé |
| 7 | **Entraînement** | 7 animations infinies, 8 `drop-shadow`, barres de `bt-*` animées, boutons de pourcentage | B | Nombreuses barres animées en même temps | Figer les lueurs des barres inactives |
| 8 | **Renaissance** | 5 animations, 3 filtres, étoiles du bouton | B- | Étoiles + halos | Pause hors action |
| 9 | **NGU / Wandoos / Yggdrasil / Mineurs / Barbes / Souhaits / Hacks** (menus « vivants ») | `ngu-labo` 3 rAF, `wandoos-retro` 3 rAF ; synchro + morph complet toutes les 4 s ; tuyaux et scène | B- | Morph toutes les 4 s | 8 s sur mobile, et ne remorpher que les cellules changées |
| 10 | **Chroniques / Album / Cartes** | `album*.css` 43 Ko, cartes holographiques avec gyroscope (`album-titans-v1.js` 8 rAF), `will-change` ×4, `filter`/`drop-shadow`, images nombreuses | B- | Cartes 3D + écouteurs de mouvement | Désactiver le gyroscope et les holographies hors fiche ouverte ; images à `max-age` long |
| 11 | **Garderie** | `daycare-page-v1.js` 3 rAF, bocaux avec ombrage | C+ | Animations de bocaux | Pause hors écran |
| 12 | **Boutique EXP / Trou sans fond / MacGuffins / Défis / Perks-Quirks** | Peu d'animations (0 infinie par menu), listes longues, `roue-journaliere` 2 rAF | C | Défilement de listes longues | `content-visibility:auto` sur les lignes |
| 13 | **Chat** | `chat-v1.js`, branche APK spécifique, un rAF ; listes de messages ; appels vers le SW | C | Réveil du SW pour chaque envoi | Espacer le sondage quand le chat est fermé |
| 14 | **Réglages / Succès / Classement / Bestiaire** | Aucune animation infinie par menu (règles `data-menu` sans animation) ; Succès : grille de médailles | C- à D | Grille de succès | `content-visibility:auto` |

Les pires, à traiter d'abord : Fight boss, Magie du sang, ITOPOD, Augmentations (ordre de probabilité d'impact sur le fil principal).

### Mode économe commun proposé (aucune modification d'apparence validée)
Une classe `soreal-mode-eco` sur `<html>`, posée avant le premier rendu, quand `window.AndroidSoreal` existe (ou petit écran tactile). Actions sans effet visible :
- tick de jeu plafonné à 60 Hz ; périodes des timers de fond doublées (§2 cause 4) ;
- animations infinies hors écran / hors action en pause (`animation-play-state:paused`, IntersectionObserver), sans changer ce qui est vu à l'écran ;
- `touch-action:manipulation`, `-webkit-tap-highlight-color:transparent`, `overscroll-behavior:none` ;
- `contain: layout paint` sur les panneaux de page et les lignes répétées, `content-visibility:auto` avec `contain-intrinsic-size` mesuré pour les listes (risque : saut de défilement si la taille estimée est mauvaise) ;
- canvas : `alpha:false`, redessin seulement si changement, `pointer-events:none`.
Ce qui CHANGERAIT l'apparence (à ne faire qu'avec accord) : retirer `drop-shadow`/`blur` des éléments animés, réduire la grille LED, passer les défilements LED à 20 i/s, supprimer halos et étincelles.

---

## 5. Plan ordonné de correctifs sûrs (gros gain d'abord)

Aucun n'a été appliqué. Tous ne demandent qu'une mise à jour des assets (`publier-maj.mjs --apk`), sauf mention.

1. **Vérifier ce que le téléphone exécute vraiment** (Réglages > code actif) et publier si les correctifs du matin n'y sont pas (`38c61773`, `857d32a5`, `04af6925`). Gratuit, peut suffire à expliquer une partie de la plainte.
2. **Borne LED** : saut du redessin si rien n'a changé + `alpha:false` + `pointer-events:none` (rendu identique, gain principal pour Fight boss).
3. **Plafonner le tick de jeu à 60 Hz** (`ui-boucle-v1.js:1944`) : écran 120 Hz.
4. **Mode économe commun** (classe `<html>`) + règles `touch-action`/`tap-highlight`/`overscroll` + `content-visibility`/`contain` sur listes et panneaux.
5. **Timers de fond** : `nuke-blindage` limité au menu combat ; boucles 800 ms mémorisées ; périodes doublées sur APK.
6. **Préférences d'effets** : vérifier qu'aucun `soreal_idle_effet_*` du compte ne réactive les animations sur l'APK ; clés propres à l'appareil sur APK.
7. **Magie du sang / ITOPOD / Augmentations** : pause des rAF hors écran, cadence 30 i/s des scènes, `contain` par ligne.
8. **Sauvegarde du SW** : examiner (avec accord de Norman, règle n°7) un envoi moins fréquent ou différé vers le SW, pour supprimer les réveils toutes les 30 s.
9. **Cache de code** : mesurer d'abord, puis seulement tester le service des scripts par Cache API depuis le SW.
10. **Images** : `max-age` long pour les fichiers de `public/` sans `?v=` (Java : RECONSTRUCTION) ; sinon les garder en place dans les redessins (assets).

## 6. À mesurer sur le vrai téléphone

- `chrome://inspect` sur le PC (débogage WebView activé : `MainActivity.java:219`) : onglet Performance pendant 10 s dans Fight boss, puis dans Augmentations ; relever le temps de script par image, le temps de « Paint/Composite » et les tâches longues. Comparer avec la même page en ligne dans Chrome sur le même téléphone.
- Activer « Afficher les mises à jour de calque » / « FPS meter » (DevTools > Rendering) ; vérifier la cadence réelle à 120 Hz.
- Journal de fluidité de l'admin (`diag-fluidite-v1.js` : `tache_longue`, `combat_saut`, `lot_lent`, compteurs `traj:*`) : comparer APK hors ligne et en ligne, notamment les tâches > 80 ms toutes les 4 s et toutes les 30 s.
- Réveil du SW : DevTools > Application > Service Workers (arrêt / démarrage) et durée de `demarrer()` ; taille réelle de la base exportée et de la ligne du joueur.
- Premier clic de chaque menu : présence de « Compile Script » (hypothèse n°1 du cache de code).
- Mémoire : `adb shell dumpsys meminfo be.soreal.idle` (deux bases sql.js + Worker + 5 Mo de JS) et température après 10 minutes.
- Réglages d'effets réellement actifs (`localStorage` : `soreal_idle_effet_nav_v1`, `soreal_idle_effet_decor_v1`).
