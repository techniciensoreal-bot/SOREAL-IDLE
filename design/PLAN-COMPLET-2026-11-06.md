# SOREAL IDLE — plan complet de ce qui reste (2026-11-06)

Écrit à la demande de Norman : « un plan complet avant de commencer, pour savoir tous les problèmes que tu allais rencontrer ». Ce document est le plan. **Aucun chantier ci-dessous n'est lancé tant que Norman n'a pas validé l'ordre et les portes de décision (§ 5).**

## 1. Ce que je reconnais

- Le plan du 5 novembre (`ARCHITECTURE-CIBLE.md`) donnait les étapes et leur ordre, pas les problèmes à attendre. Je les ai découverts en route (§ 3).
- En fin de parcours j'ai écrit un « bilan » qui requalifie les étapes lourdes (état résident, flux différentiel, canvas, migration des pages, CSS) en « non justifiées par les mesures ». **C'était une décision de périmètre qui t'appartenait.** Elle est annulée ici : ces étapes restent au plan, avec des portes de décision chiffrées que tu valides.
- Des décisions ont été prises sur mes parties de référence avant d'avoir ta vraie partie. Corrigé : toute étape commence désormais par une mesure sur ton export (C0).

## 2. Où on en est, sans maquillage

| Étape du plan du 5/11 | État réel |
|---|---|
| Parties de référence, catalogue des visuels | Fait (2 parties, 458 animations cataloguées) |
| Justesse des barres (règle des 50 niveaux/s) | Fait et prouvé écran/moteur : Machine temporelle, Augmentations, rituels, NGU, Wandoos, Entraînement avancé, Barbes, Hacks, Souhaits |
| Étape 1 : noyau résident | **Partiel** : deux clés de mémo réduites (prouvées par mutation) + équipement partagé gelé. Synchro 89 -> 64 ms, action 113 -> 92 ms. Cible du plan : 20 ms. **Non atteinte.** |
| Étape 1 : flux différentiel Worker -> page | **Non fait.** Mesure : ~35 ms de traitement de réponse par action côté page |
| Étape 2 : boucle de rendu unique, barres en canvas | **Non fait** |
| Étape 3 : autres menus migrés | **Non fait** (seules les barres ont été alignées moteur/écran) |
| Étape 4 : pages sans logique de jeu, CSS | **Non fait** : 98 lignes de formules (Math.pow/sqrt/log) dans 39 modules de page ; 2 539 `!important` |
| Étape 5 : audit final | Non fait |

Mesures actuelles sur ta vraie partie (export du 6/11) : moteur 66 ms / 94 ms / 200 ms (synchro / action / début de combat) ; page au repos 0 image longue ; rafale de 12 actions : 0,56 % d'images > 20 ms, 0,14 % > 34 ms (budget 1 % et 0,1 %). **Jamais mesuré : téléphone, APK, exe, Safari, Firefox.**

## 3. Registre des risques

### 3.1 Rencontrés (avec la parade à appliquer d'office)

| # | Problème | Parade |
|---|---|---|
| 1 | Décisions prises sur des parties de référence, pas sur ton compte | C0 : mesurer d'abord sur ton export, avant chaque chantier |
| 2 | 892 des 1 177 tests lisent le **texte** du code : tout refactor en casse | Écrire d'abord un test de comportement ; adapter le test « texte » dans le même commit ; jamais supprimer sans équivalent |
| 3 | La forme du code compte (une indentation de 8 -> 6 espaces a fait échouer `fight-boss-continuous-drain`) | Lancer les tests de structure après chaque édition de page |
| 4 | Pins immuables `?v=` : maj-pins x2 + reconstruction du moteur local, sinon version périmée en ligne | Étape de fin de commit scriptée et vérifiée (empreinte du moteur en ligne = construction testée) |
| 5 | Suite complète = 15 à 19 min ; 3 tests échouent sur cette machine (catalogue local incomplet, port 49300) | Suite en clone propre (`git worktree`) ; tests ciblés pendant le travail ; complète avant chaque push |
| 6 | Arbre principal sale, réserves d'agents, refus de permissions (`reset --hard`) | Jamais `stash` ; travail et push depuis un worktree ; Norman nettoie l'arbre principal |
| 7 | Ta partie est une donnée personnelle | Jamais dans le dépôt ; copie temporaire dans le dossier du banc seulement avec ton accord, supprimée juste après l'import, bases du navigateur vidées |
| 8 | CI non observable d'ici (`gh` absent) | Vérifier en ligne par comparaison d'empreintes ; installer `gh` si tu l'acceptes |
| 9 | Règles d'AGENTS.md (anti-spoil, redessin invisible, stats instantanées, jeu local) contraignent tout changement d'état ou d'écran | Chaque chantier liste les règles qu'il touche et ajoute le test de garde correspondant |
| 10 | Mémo à clé incomplète = bonus périmés **en silence** | Preuve par mutation de chaque champ (déjà faite pour équipement et bonus) avant toute nouvelle clé |
| 11 | Antislashs perdus dans le shell (expressions régulières cassées) | Scripts écrits dans des fichiers ; recherches de texte plutôt que regex |
| 12 | Évolution du schéma de sauvegarde (le filtre d'objets a dû fusionner les anciens filtres par zone) | Toute évolution migre sans perte, testée sur les 2 parties de référence + ton export |

### 3.2 Pas encore rencontrés (probables)

- **Téléphone / APK / exe** : un CPU 3 à 5 fois plus lent peut faire dépasser le budget alors que le PC le tient ; Safari/Firefox n'ont pas `long-animation-frame` (mesure à reconstruire autrement).
- **Reprise multi-appareils et sauvegarde (règle n°7)** : tout état gardé en mémoire dans le Worker doit s'invalider à l'import, à la restauration administrateur, au conflit « partie reprise ailleurs » et au redémarrage du Worker par le navigateur.
- **Gel d'objets** : un appelant non audité qui modifierait un résultat gelé lève une erreur en production (franche, mais bloque l'opération).
- **Mise à jour de l'exe et de l'APK** (`publier-maj.mjs`) après chaque changement du moteur.
- **Interaction avec l'anti-triche en observation** et avec la sauvegarde toutes les 10 s si le moteur devient plus rapide (cadence des envois).
- **Régression visuelle** sur les 29 menus et 33 pages : le catalogue des visuels dit *quoi* existe, pas *à quoi ça ressemble* ; la validation visuelle reste manuelle (la tienne).

## 4. Chantiers

Chaque chantier : objectif mesurable, étapes, preuves exigées, règles touchées, retour arrière, effort (fourchette honnête, incertitude ±50 %).

### C0 — Mesure de référence officielle (prérequis de tout le reste)
- **Objectif** : un tableau de référence PC et téléphone sur ton export, avec protocole fixe (banc moteur + banc de page + rafale d'actions).
- **Étapes** : (1) protocole écrit (scénarios, durées) ; (2) mesure PC (faite) ; (3) mesure téléphone : voir § 7 ; (4) budgets par appareil.
- **Preuve** : `bench-moteur-partie-v1.mjs` et profil d'échantillonnage (serveur de banc avec en-tête Document-Policy).
- **Effort** : 0,5 jour + ton temps pour le téléphone.

#### C0 — état d'avancement (2026-11-06)
- **Livré** : la **mesure de référence intégrée** (`modules/mesure-reference-v1.js`, Réglages > « 📏 Mesure de référence », administrateur). Protocole v1, fixe et PASSIF : Combat de boss, Aventure, Machine temporelle, NGU, 3 s de mise en place puis 20 s de mesure chacun ; aucune action de jeu (le test le garantit : le module ne contient ni appel au moteur, ni réseau, ni écriture de stockage) ; le menu de départ est rouvert à la fin. Rapport texte à copier : appareil, mode direct ou iframe (SOREAL APP / TV), médiane, 95e centile, pire image, part des images > 20 / 34 / 50 ms, images longues par fonction, durée des opérations du moteur (calcul, file, retour), verdict contre le budget. Garde-fou : si le navigateur suspend les images (page, panneau ou application masqué), le menu est déclaré INVALIDE au lieu de bloquer (défaut trouvé pendant la mise au point).
- **Référence PC officielle** (ta vraie partie, boss 95 ; Chrome 152, 20 cœurs, 32 Go ; mode direct ; jeu local) : les 4 menus DANS LE BUDGET. Combat de boss : 1 198 images, médiane 16,7 ms, pire 33 ms, 0,17 % > 20 ms. Aventure, Machine temporelle, NGU : 1 200 images, pire 17 ms, 0 % > 20 ms. Moteur pendant la mesure : synchro x251, calcul médian 47 ms (max 73) ; action x27, calcul médian 78 ms (max 100) ; **retour vers la page jusqu'à 47 ms** (la page est parfois occupée quand la réponse arrive).
- **Reste pour clore C0 (porte P0)** : la même mesure sur ton téléphone. Procédure : Réglages > « 📏 Mesure de référence » > « Lancer la mesure » (environ 1,5 minute), ne rien toucher, laisser la page visible, puis « Copier » et coller le texte ici. À faire dans les deux modes si tu joues aux deux : jeu ouvert direct (navigateur / APK) et lancé depuis SOREAL APP. Budgets par appareil : ceux du plan (1 % / 0,1 % / 50 ms) tant que le téléphone n'a pas été mesuré ; je les ajusterai avec toi après le premier relevé.

#### C0 — RÉSULTAT TÉLÉPHONE (porte P0 franchie, 2026-11-06, APK « petit apk » en ligne : Android 10, Chrome/WebView 156, 8 cœurs, 8 Go, 406x813 @3x, mode direct)
**Les quatre menus sont HORS BUDGET sur le téléphone** (le PC est dans le budget partout). Combat de boss : 5,17 % des images > 20 ms, 0,34 % > 34 ms, pire 42 ms. Aventure : 3,24 % / 0,34 % / 50 ms. **Machine temporelle : 40 images/s, médiane 25 ms, 64 % > 20 ms, 5,5 % > 34 ms, 8 images > 50 ms (la pire)**. NGU : 3,66 % / 0,09 % / 58 ms. Moteur local sur le téléphone : synchro calcul médian **121 ms** (PC : 47), action **183 ms** (PC : 78), soit **2,3 à 2,6 fois plus lent** ; retour vers la page jusqu'à 161 ms.
Conséquences pour les portes : (1) **P3 est franchie pour le traitement des réponses** (C4) : une synchro toutes les 4 s coûte ~50 ms de fil principal à 2,6x, ce qui donne ~0,4 % d'images > 34 ms, exactement ce que le téléphone mesure ; (2) **la Machine temporelle est un problème de RENDU** (aucune image longue de script : le coût est graphique à 3x de densité) : nouveau chantier **C9** ci-dessous ; (3) le moteur est 2,5x plus lent sur le téléphone : la cible de C2 se lit sur le téléphone (action <= 90 ms), pas sur le PC.
**Outils livrés pour la suite** : (a) Réglages > « 📏 Mesure de référence » propose maintenant trois boutons : la mesure standard, le **Diagnostic Machine temporelle** (4 passes : normale / animations de la machine en pause / décor masqué / machine entière masquée, pour attribuer le coût graphique) et la **mesure avec profil par fonction** (profileur d'échantillonnage du navigateur, activé par l'en-tête `Document-Policy: js-profiling` ajouté à `_headers`) ; (b) **`cloudflare/bench/banc-telephone-emule-v1.mjs`** : écran de téléphone, agent Android, processeur ralenti (--ralenti=2.6), ta partie lue sur le disque et injectée par le protocole DevTools (jamais copiée), rapport identique. Limites : seul le fil principal est ralenti (le moteur, dans son Worker, n'est ralenti qu'x1,3 : 63 ms au lieu de 121 ms) et le rendu logiciel de Chromium n'est pas le processeur graphique du téléphone : le banc émulé reproduit la queue des images lentes dues au JavaScript (3 à 5 % > 20 ms), pas les 64 % de la Machine temporelle.
**Premières corrections tirées du profil émulé** : NGU mesurait la mise en page (`getBoundingClientRect`, 43 % du temps actif de la page) à CHAQUE image à cause d'une condition qui testait le mauvais élément ; corrigé (temps actif du fil principal 34 % -> 23 % dans NGU, test dédié). Restent au profil, par ordre : copie profonde de l'inventaire à chaque réponse (`cloneInventaireIdleV160_`, 6 à 12 %), restauration des pièces du pont (5 à 9 %), recherches DOM répétées dans la boucle de mise à jour (`getElementById`, `querySelector` 7 à 11 %), dessin de l'écran LED de la borne en combat (`drawImage` 12 %), traitement des réponses du moteur (`Worker.onmessage`).

#### C9 (nouveau) — Machine temporelle sur téléphone : coût de RENDU
- **Pourquoi** : 40 images/s, médiane 25 ms sur le téléphone ; aucun script long : le coût est graphique (SVG animé de la machine à 3x de densité).
- **Étapes** : (1) Diagnostic Machine temporelle sur le téléphone (4 passes) pour attribuer le coût (animations CSS / décor / reste de la page) ; (2) selon le résultat : réduire l'animation (moins d'éléments animés, `will-change`, couches), figer les parties lointaines, ou simplifier le décor sur petit écran sans changer ce que le joueur voit de l'état (catalogue des visuels : rien ne disparaît sans l'accord de Norman) ; (3) mesure avant/après sur le téléphone.
- **Résultats du diagnostic téléphone (2026-11-06, protocole v1, deux relevés)** : machine entière masquée = DANS le budget (0,17 % puis 0,50 % d'images > 20 ms). Normale : 2,75 % puis 7,43 % ; animations de la machine en pause : 1,70 % puis 3,10 % (le coût est divisé par 2 à 2,4) ; décor (centre et haut) masqué : 6,68 % puis 5,39 % (pas mieux que normal : le coût n'est PAS dans le décor). Conclusion : le coût est dans la machine elle-même, et pour plus de la moitié dans ses animations (images 1,25 fois sur 2 repeintes à chaque image, SVG à 3x). Le banc émulé NE reproduit PAS ce rendu (ses passes donnent 25 % normal contre 7,7 % masqué avec un processeur graphique logiciel) : il ne sert pas à trancher le rendu, seulement le script.
- **Profil par fonction (même jour)** : le script ne dépasse pas 11 à 13 % du temps dans les quatre menus ; le propre le plus lourd est la recherche d'éléments (getElementById 7-9 %, querySelector 6-10 %, querySelectorAll 4-10 %), puis getBoundingClientRect (NGU 10 %, Aventure 4 %), la borne LED en Combat (12 % propre, dessin de la borne) et dans la Machine le compte à rebours de la Time Machine (11 % cumulé) et cloneInventaireIdleV160_ (4 %). Aventure : 2,15 % > 20 ms, images longues de 46 ms (meta-progression, setTimeout) et 31 ms (ui-amorcage, ajuster) ; NGU : 0,17 % > 34 ms (pire 67 ms).
- **Huit passes (téléphone, 2026-11-06 15:52)** : normale 8,72 % ; toutes animations en pause 3,19 % ; seules animations de style en pause 4,80 % ; seuls engrenages scriptés en pause 6,01 % ; machine masquée 0,59 % (budget tenu) ; **sans bulles 2,48 %** (le gros du coût : ~6 points sur 8,7). Cause probable (lecture du code, à prouver) : la hauteur du liquide est réécrite à chaque image sur `.tmm-liq` qui est un conteneur de requête (`container-type:size`, soreal-idle-machine.css:28) ; les 34 bulles (17 par tube) sont dedans et les grosses utilisent `cqh` dans leur animation (`tmmMonte`) : chaque changement de taille force le recalcul de style des bulles et les empêche d'être animées sans le fil principal. Passes de preuve livrées : liquide sans conteneur / sans grosses bulles / sans minibulles. Correctif envisagé (après preuve, validation visuelle de Norman) : bulles dans une couche de taille constante, rognée à la surface du liquide, trajets en transform pur.
- **Sept passes (téléphone, 2026-11-06 16:35) : INVALIDE pour conclure.** Normale 27,26 % (contre 8,72 % une heure avant), machine masquée 8,30 % (contre 0,59 %), moteur plus lent (synchro médiane 164 ms contre 130, file jusqu'à 20 contre 9) : le téléphone dérivait (chaleur, charge) entre les passes. Leçon : des passes mesurées l'une APRÈS l'autre ne se comparent pas sur un appareil qui dérive ; le résultat « les bulles pèsent 6 points » du relevé précédent n'est donc pas établi non plus. Aucune hypothèse (bulles, conteneur de requête, engrenages) n'est confirmée ni infirmée.
- **Protocole corrigé (livré)** : plan ENTRELACÉ, chaque variante encadrée de deux passes normales (normale, bulles, normale, liquide sans conteneur, normale, pause, normale) et jugée contre la MOYENNE de ses deux voisines ; si les deux normales voisines diffèrent trop, la variante est déclarée « non concluante » (jamais de conclusion sur une dérive). Fonction pure `comparaisonsAppariees`, testée. À refaire appareil froid, plusieurs fois si la dérive est forte.
- **C9 RÉSOLU (2026-11-06, 20h06 Bruxelles, téléphone, Chrome, version 47df3d91)** : la cause n'était aucun élément pris seul mais le NOMBRE d'éléments SVG et animés de la machine (464 éléments, 374 SVG, 35 animations en cours). Norman a fourni trois images détourées (tour Énergie verte, centre, tour Magie bleue, ~75 Ko chacune, collées bord à bord) ; le jeu ne dessine plus que ce qui bouge dans leurs emplacements vides (221 éléments, 133 SVG, 19 animations) ; les rouages engrènent réellement (module `engrenages-v1.js`, test de non-chevauchement par surface commune). **Mesure téléphone après** : passes normales 0,9 à 1,6 % d'images > 20 ms (avant : 8,7 à 20 %, jusqu'à 50 % dans l'APK), > 34 ms : 0,08 à 0,17 %, pire image 42 à 50 ms ; le témoin « machine entière masquée » est à 1,43 % : la machine coûte autant que rien, le reste vient de la page autour.
- **Leçons de méthode** : (1) des passes mesurées l'une APRÈS l'autre ne se comparent pas sur un appareil qui dérive : toujours entrelacer et garder un témoin ; (2) le banc PC (trace du navigateur) ne reproduit pas le coût de rendu d'un téléphone : compter les éléments et les animations est une mesure fiable, sans dérive, de ce que le téléphone devra faire ; (3) avant de proposer un chantier, regarder si la réponse n'est pas déjà dans les mesures déjà en main.

- **Étape suivante de C9** : huit passes de diagnostic (livrées) pour séparer animations de style / engrenages scriptés / dessin SVG / bulles ; puis action ciblée mesurée sur le téléphone avant tout changement visuel.
- **Règles touchées** : 3 (boucles parfaites), 4 (redessin invisible) ; validation visuelle par Norman obligatoire.
- **Effort** : 2 à 5 jours selon le diagnostic. **Prérequis** : le diagnostic du téléphone.

### C1 — Cartographie des écritures d'état (aucun changement de jeu)
- **Pourquoi** : environ **670 écritures directes dans 31 fichiers** du moteur (plus les écritures indirectes). On ne versionne pas ce qu'on ne connaît pas.
- **Étapes** : outil de test qui enveloppe l'état d'une opération et journalise, par opération, quels blocs de premier niveau sont touchés ; matrice opération x bloc générée et commitée ; test qui échoue si une opération touche un bloc non déclaré.
- **Preuves** : matrice stable sur les 2 parties de référence + ton export ; aucun changement de comportement (références identiques).
- **Règles touchées** : 5 (stats instantanées), 7 (jeu local).
- **Retour arrière** : trivial (outil de test seulement).
- **Effort** : 1 à 2 jours. Risque faible.

### C2 — Versionnement par bloc (remplace les clés JSON des mémos)
- **Objectif** : action <= 60-70 ms et synchro <= 50 ms sur ton export (honnêtement : **pas 20 ms**, voir C3).
- **Étapes** : (1) une version par bloc de premier niveau, incrémentée aux sites déclarés par C1 ; (2) clé de mémo = versions des blocs lus (au lieu de ~70 Ko de JSON) ; (3) mode de vérification qui recalcule et compare à chaque réutilisation (déjà en place : `SOREAL_IDLE_VERIF_BONUS=1`) ; (4) échantillonnage en production : 1 réutilisation sur N est recalculée et comparée, divergence journalisée (observation, jamais bloquante, comme l'anti-triche) ; (5) interrupteur de retour à l'ancienne clé.
- **Preuves** : test de mutation de **chaque champ** de l'état (modèle de `idle-bonus-cle-v1`) étendu à tous les blocs ; suite complète en mode vérification ; 0 divergence pendant une semaine de jeu administrateur avant ouverture à tous.
- **Règles touchées** : 5, 7.
- **Risque : élevé** (bonus périmés silencieux). C'est pourquoi les portes (§ 5) sont chiffrées.
- **Retour arrière** : interrupteur, sans redéploiement.
- **Effort** : 3 à 6 jours.

### C3 — État résident dans le Worker
- **Objectif** : ne plus relire/réécrire la ligne du joueur à chaque opération (mesure : parsing 0,66 ms, mais copies et reparsages répétés ~15 % du temps).
- **Étapes** : état gardé en mémoire entre deux opérations ; invalidation à l'import, à la restauration, au conflit, à la reprise, au redémarrage du Worker (reconstruction depuis IndexedDB) ; écriture IndexedDB et envoi serveur inchangés.
- **Preuves** : parties de référence identiques ; test « redémarrage du Worker en pleine session » ; test de reprise multi-appareils (existe) ; toutes les précautions de la règle n°7 (1 à 6) vérifiées une à une.
- **Risque : élevé.** Gain attendu limité (10 à 15 %) : **ne se fait que si C2 laisse l'action au-dessus de 70 ms.**
- **Effort** : 4 à 8 jours.

### C4 — Flux différentiel Worker -> page
- **Porte** : seulement si C0 montre, sur téléphone, des images longues attribuées à `Worker.onmessage` au-dessus du budget.
- **Étapes** : valeurs animées seules dans le flux ; gros blocs (bestiaire, catalogue, sac) seulement au changement ; consommateurs de la page adaptés.
- **Risque** : 217 fichiers de page lisent l'objet complet ; chaque consommateur doit être migré ou alimenté par un adaptateur.
- **Effort** : 3 à 5 jours si l'adaptateur suffit, beaucoup plus sinon.

### C5 — Boucle de rendu unique et barres en canvas
- **Porte** : seulement si le téléphone dépasse le budget et que le profil désigne le rendu.
- **Règles touchées** : 3 (boucles parfaites), 4 (redessin invisible) ; catalogue des visuels à régénérer.
- **Effort** : 5 à 10 jours. Validation visuelle menu par menu par toi.

### C6 — Pages sans logique de jeu (le vrai remède aux reculs)
- **Pourquoi** : une formule de jeu côté page est un deuxième modèle qui peut diverger du moteur (cause de tous les reculs de barres). 98 lignes de formules dans 39 modules de page.
- **Étapes** : inventaire (chaque formule : doublon du moteur ou affichage pur) ; page par page, remplacer le doublon par la valeur publiée par le moteur, avec un test écran/moteur (le modèle existe : `idle-*-projection-moteur-v1`). Déjà faits : Machine temporelle, Augmentations, rituels, NGU, Wandoos, Entraînement avancé, Barbes, Hacks, Souhaits. Restent à inventorier : Yggdrasil, Diggers, Garderie, Cuisine, ITOPOD, combat client, Aventure client.
- **Règles touchées** : 2 (anti-spoil), 4, 5.
- **Effort** : 1 à 2 jours par page, environ 20 pages (3 à 5 semaines). Priorité : les pages où une barre bouge.

- **C6 — état au 2026-11-07** : inventaire terminé, rien de plus à convertir. Garderie : la page rejoue la barre à partir de `effectiveHoursPerLevel` publié par le moteur ; test `idle-garderie-projection-moteur-v1` (336 comparaisons écran / moteur, identiques). Yggdrasil, Diggers, Cuisine : aucune formule côté page. ITOPOD : scène cosmétique (valeurs du moteur). **Combat et Aventure client : il n'y a PAS deux modèles.** Le combat d'une zone est simulé UNE seule fois, par la page (`progresserZoneFightLocalIdleV1_`, ui-combat-2-v1.js) ; le moteur ne le re-simule pas, il valide la victoire (`resolveZoneFight` : PV du monstre à 0, idle-adventure-combat.js) et l'auto-kill des Titans est un SEUIL de statistiques (`advanceTitanAutoKillV1`), pas une simulation. Parité avec le wiki : `idle-adventure-combat-wiki-parity`. Aucun risque de recul par désaccord de formule entre page et moteur sur ce chantier.

### C7 — Dette CSS (2 539 `!important`)
- **Aucun gain de performance mesuré.** Risque visuel élevé. **Seulement si tu le demandes**, menu par menu, avec ta validation visuelle de chacun.
- **Effort** : 10 jours et plus.

### C8 — Audit final
- Plus aucun fichier hérité de l'ancien monolithe dépassant les seuils ; catalogue des visuels et références à jour ; note du jour ; empreintes en ligne vérifiées.

## 5. Ordre et portes de décision

Ordre : **C0 -> C1 -> porte P1 -> C2 -> porte P2 -> (C3 si P2 non atteinte) -> C6 menu par menu (en parallèle possible) -> C4 / C5 sur mesure -> C7 si demandé -> C8.**

| Porte | Critère (go / no-go) | Si non atteint |
|---|---|---|
| P0 (fin de C0) | Mesure téléphone disponible | On ne lance rien de lourd avant : sans elle, C4/C5 se décident à l'aveugle |
| P1 (fin de C1) | Matrice stable et complète ; aucune écriture non expliquée | On arrête : C2 serait dangereux |
| P2 (fin de C2) | Action <= 70 ms sur ton export ; test de mutation vert ; 0 divergence pendant 1 semaine d'observation administrateur | On corrige ou on coupe par l'interrupteur ; C3 devient nécessaire |
| P3 (avant C4/C5) | Téléphone au-dessus du budget **et** profil qui désigne l'objet du chantier | On ne le fait pas |

Tu peux t'arrêter à chaque porte : chaque chantier est livrable et en ligne seul.

## 6. Ce que « fini » veut dire, pour chaque chantier

1. Mesure avant/après sur ton export.
2. Preuve écrite (test de comportement ou de mutation), pas seulement « les tests passent ».
3. Suite complète en clone propre, 0 échec hors tests d'environnement connus.
4. Parties de référence et catalogue des visuels inchangés (ou changement voulu et expliqué).
5. Ligne dans la note du jour, sans spoil, avec traduction.
6. Vérification en ligne par empreinte (moteur et pins).
7. Retour arrière documenté et testé.

## 7. Ce dont j'ai besoin de toi

- **Mesure sur ton téléphone** (un modèle, un navigateur) : je te donne un script à coller, ou tu m'envoies ton journal de fluidité (Réglages, diagnostic) après 10 minutes de jeu.
- **Un export à jour** à chaque grosse étape (accord de copie temporaire déjà donné pour cette session).
- **Ton avis sur C7** (CSS) : oui ou non.
- **Nettoyer l'arbre principal** : `git reset --hard HEAD`, puis `git pull --ff-only`.
- Optionnel : installer `gh` pour que je suive la CI.
- **Tes priorités** : le plan est de la performance et de la robustesse, pas de nouvelles fonctions ; si tu veux intercaler des demandes de jeu, dis-moi lesquelles et où.

## 8. Estimation honnête

C0 à C2 : environ 1,5 à 2 semaines de travail. C3 : +1 semaine si nécessaire. C6 : 3 à 5 semaines. C4, C5, C7 : conditionnels. Incertitude ±50 %, plus grande sur C2 (le nombre réel d'écritures indirectes n'est pas connu avant C1).
