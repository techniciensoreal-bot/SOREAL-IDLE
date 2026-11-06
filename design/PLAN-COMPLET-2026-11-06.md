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
