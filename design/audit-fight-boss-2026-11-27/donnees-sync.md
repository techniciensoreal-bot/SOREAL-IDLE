# Audit Fight Boss (2026-11-27) : données des boss et synchronisation

Tranche : (1) données des boss, (2) synchronisation de l'état de combat / boss entre moteur local, serveur et appareils. Lecture seule ; seules des vérifications par script (hors dépôt) ont été lancées.

## Résumé

- Stats numériques (PV, attaque, défense, régénération, XP) : RAS. Vérifié par script sur les 301 boss (ratios x5 de 5 à 20 puis x10, PV = 10 x attaque, régénération x5 puis x10, XP jamais décroissante hors boss 4 -> 5 voulu, valeurs finies jusqu'à 1,98e299).
- Constat grave : le catalogue de PRODUCTION (feuille IDLE_BOSS, graine `desktop/graine/catalogue.json` du 2026-11-14) n'a que 300 lignes : l'ID 80 manque. Tout ce qui est lu par POSITION se décale d'un cran à partir du boss 80 et le boss 301 sort du catalogue.
- Synchro : un seul scénario crédible de recul (copie d'appareil à date « fraîche » mais issue d'un export périmé, S1) ; pas de doublon de victoire ni de recul sur Rebirth trouvé.

## D1 (HAUTE, confirmé sur la graine du 2026-11-14 ; à confirmer sur la base de prod) : IDLE_BOSS a 300 lignes, ID 80 absent, lecture par position

Preuve : `desktop/graine/catalogue.json`, feuille IDLE_BOSS : 300 lignes de données, IDs 1..79 puis 81..301 (manquant : 80). `design/catalogue/boss.json` (source unique des noms) a bien les 301 (le 80 est `""`). Le test `idle-catalogue-boss-unique-v1` ne contrôle que boss.json (et les noms de la graine, seulement si le fichier existe), pas le nombre de lignes ni la contiguïté des IDs de la feuille.

Propagation : `idle-runtime-catalogue.js` (`bossCatalogueConstruireSorealIdle_`) trie par ID, puis le moteur indexe par POSITION : `idle-runtime-boss.js:1626` (`catalogue[n]`), `idle-runtime-etat.js:1227` (`numero: index + 1`, `boss.nom`), `idle-runtime-admin.js:525` (`catalogue[numero - 1]`). Les stats ne bougent pas (elles viennent de `nguBossStatsV1(i)` par index, le nom Fight Boss de `NGU_BOSS_NAMES_FR_V1.get(i + 1)`), mais pour les boss de numéro >= 80 :
- histoire / chronique, conseil, driveFileId, chanceLoot, bossCible viennent de la ligne de l'ID n+2 ;
- le nom du Collection (`bossCatalogue[].nom`) est celui du boss suivant, SAUF là où l'administrateur a une surcharge de nom : la graine n'en a que pour 1..125 et 289. Donc numéros 126 à 300 (hors 289) : nom et chronique du boss suivant dans le Collection, l'album et le lecteur de chroniques (`ui-combat-2-v1.js`, `album-cartes-v1.js` lisent `bossCatalogue` par `numero`). Pour 80 à 125, seul le texte brut est décalé, masqué en prod par les surcharges `boss:N`.
- Reproduit avec le vrai moteur (harnais `creerJoueurExterneV1` + feuille IDLE_BOSS de la graine, sans surcharges) : bossVaincus=299 (boss 300 « Le Barbare ») affiche la chronique du boss 301 (« Ça y est. Il ne reste plus personne que le Traître… ») ; bossVaincus=79 (boss 80) affiche la chronique du Panthéon (boss 81) ; `bossCatalogue` a 300 entrées dont 203 noms différents de boss.json.
- Voix (hypothèse, même cause) : `texteBossParleV1` / `nomBossParleV1` sont clés par numéro réel : voix du boss N sur le texte du boss N+1.

Scénario : le joueur lit ou écoute la chronique du boss 200 (Fight Boss, Collection) : c'est celle du boss 201.

## D2 (HAUTE, confirmé par exécution) : le boss 301 est traité comme « au-delà du catalogue »

Avec 300 lignes, `n = 300` n'est pas `< catalogue.length` (`idle-runtime-boss.js:1626`) et ne déclenche pas la fin des boss (`bossFinDesBossAtteinteSorealIdle_(300)` est faux, la fin est à 301). Il tombe dans la branche « progression infinie » (`idle-runtime-boss.js:1676` et suivantes). Mesuré avec la graine :
- nom affiché : « Le Barbare +1 » (au lieu de « Le Traître aux 2 Ailes 3/4 ») ;
- chronique : celle du boss 300 ;
- XP de base : 33 au lieu de 28 (`dernier.xp * 1,18`, `idle-runtime-boss.js:1775`, écrase la référence `nguBossXpForBossNumberV1(301)` = 28) ;
- pièces x1,15 et chanceLoot recopiés du 300.
PV / attaque / défense du 301 restent corrects.
Complément (MOYENNE) : `dernierBoss` du Nuke (`idle-runtime-combat.js:959`) vaut `bossVaincus >= catalogue.length` = 300 : la scène finale de la borne se joue dès le franchissement du boss 300, alors que le jeu ne finit qu'après le 301.

Correction suggérée (non appliquée) : restaurer la ligne ID 80 dans la feuille de production ; rendre le moteur indifférent aux trous (indexer par ID, ou construire un catalogue 1..301 en remplissant les trous) ; ajouter un test qui contrôle la feuille de production / la graine (301 lignes, IDs 1..301).

## D3 (FAIBLE, confirmé) : commentaires contredisant le code sur le « plancher » catalogue

`idle-runtime-boss.js:1074-1180` (`equilibrerBossPrincipalSorealIdleV413_`) : les commentaires disent « MAX (plancher) », le code remplace pv / attaque / défense / xp par la référence (le catalogue n'est jamais plus fort). Aucun effet en jeu ; les stats brutes du catalogue (PV, Attaque, XP, Pièces) ne servent plus que dans la branche « infinie » (D2).

## S1 (MOYENNE, confirmé par lecture ; scénario conditionnel : plusieurs appareils + démarrage réellement hors ligne) : une vieille partie peut écraser une progression de boss plus avancée du même Rebirth

1. L'appareil A démarre hors ligne sur son DERNIER export gardé (`moteur-local-v1.js:213`, `exportGarde`). Le moteur y joue et inscrit « Dernière synchro » (col. 16) à l'heure courante : date « fraîche », état de base périmé. Pendant ce temps l'appareil P a envoyé une progression plus avancée (même nombre de Rebirths).
2. Au retour du réseau, l'envoi de A est refusé en « conflit » (`idle-local-sync-v1.js:355`, depuis < vu) : écran « Partie reprise ailleurs ». La copie IndexedDB de A est gardée (`moteur-local-v1.js:355` ne l'efface pas).
3. Au rechargement, `moteur-local-v1.js:237-238` adopte la copie si elle n'a pas MOINS de Rebirths que le serveur (`copieEnRetard`) ET si sa date (col. 16) est postérieure à `progressionAt` : c'est le cas (jeu hors ligne après le dernier envoi de P). La copie de A (moins de boss vaincus, `records.highestBoss` plus bas) remplace la partie du serveur et `idle-local-sync-v1.js:399` l'accepte (recu >= connu). Aucun garde-fou sur bossVaincus / highestBoss : seule `renaissances_recul` refuse (`idle-local-sync-v1.js:42,390`) ; `boss_vaincus_recul` n'est qu'une alerte.
Conséquence : recul de boss (ex. 60 -> 52) sans message. Filet : la ligne d'avant est copiée « avant-anomalie » seulement si une alerte est notée (cas bossVaincus plus bas à Rebirths égaux : oui), gardée 12 h parmi les 48 copies récentes ; l'ancienne copie de A reste dans `:ecartee` (3 emplacements).
Remède possible : comparer la génération de la ligne de base (la `progressionAt` de l'export dont la copie est issue) plutôt que l'horloge, ou refuser une copie dont `records.highestBoss` est inférieur à celui du serveur.

## S2 (MOYENNE-FAIBLE, confirmé par lecture) : import de fichier : si le premier envoi échoue, la partie importée peut être écartée

`moteur-local-v1.js:540-551` : après un import, `importPartieEnCours` est remis à faux même si l'envoi a échoué ; le message promet « l'envoi se fera tout seul » et la page se recharge 900 ms plus tard. Si le fichier a MOINS de Rebirths que la partie du serveur : (a) au rechargement, `copieEnRetard` (ligne 237) met la copie importée de côté et la partie du serveur gagne ; (b) si la page reste active, le prochain envoi normal (sans `importPartie`) est rejeté par `renaissances_recul` (`idle-local-sync-v1.js:390`). Dans les deux cas l'import est perdu en silence (copie dans `:ecartee`). Rare : fichier plus ancien en Rebirths + réseau coupé à cet instant.

## S3 (FAIBLE, confirmé) : fenêtre de secours courte pour une régression non détectée

`idle-local-sync-v1.js:127-130` : les copies « periodique » et « avant-anomalie » partagent la limite des 48 dernières (12 h à raison d'une tous les 15 min) ; les « quotidiennes » ne gardent que la ligne du premier envoi du jour. Un recul silencieux découvert après plus de 12 h ne se récupère que depuis la quotidienne.

## Vérifié sans anomalie (ne pas rechercher à nouveau)

- Table `NGU_BOSS_REFERENCE_V1` (190 entrées) + extension x10 jusqu'au 301 : aucune rupture de ratio, PV = 10 x attaque, régénération conforme, XP continue de 190 à 191 (17 -> 17). Boss 4 volontairement différent du wiki (commentaire en place).
- `design/catalogue/boss.json` : 301 ids contigus, noms FR/EN non vides ; doublons = vrais noms du jeu (Intermission 270-288 ; Living Armor / Living Armour 78-79).
- Fin des boss (`bossVaincus` >= 301 : « NONE (YOU KILLED THEM ALL) », 69/69/420) cohérente avec le jeu ; sélection d'un boss déjà vaincu refusée (`idle-runtime-joueurs.js:757`).
- Victoire : `bossVaincus` n'augmente que si le boss n'est pas déjà vaincu (`idle-runtime-progression.js:1400`) ; `highestBoss` monotone (Math.max) ; Rebirth remet bossVaincus à 0, conserve `records.highestBoss` et pose RENAISSANCES (col. 25) ; la garde `renaissances_recul` protège l'envoi et le démarrage. Le lancement d'un défi remet bossVaincus à 0 sans changer les Rebirths (alerte seulement, pas de refus : normal).
- Restauration admin : ligne restaurée datée « maintenant », `__restauration__` revendique la partie ; les appareils en cours reçoivent « conflit » et leur copie, plus ancienne, est écartée au rechargement : pas de retour en arrière par cette voie.
- Doublons : flux et gains dédupliqués côté serveur ; une victoire n'est comptée que dans la ligne, pas par événement.
- Non couvert : rejeu de combat après longue absence (`idle-runtime-progression.js` p1-p6) et trajectoire de stats (hors tranche).
