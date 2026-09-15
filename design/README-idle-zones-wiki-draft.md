# SOREAL IDLE — Contenu des 47 zones, sourcé wiki (draft, 2026-09-15 nuit)

## Où on en est

Suite à la décision "j'oublie ce Google Sheet, je reprends sur le wiki les vraies informations" :

1. **Mécanisme d'écriture** : construit, testé, déployé (voir commits `SOREAL-IDLE` `1ebcb6f` et `SOREAL-TV` `595d6221`). Rien n'a encore été poussé dans le jeu — j'ai besoin du secret `SOREAL_IDLE_MIGRATION_SECRET` pour déclencher l'appel final.
2. **Données réelles capturées** : la page wiki `Adventure_Mode` contenait en fait TOUTES les 47 zones en un seul tableau (seuils Power/Toughness, items par set, drops) — sauvegardé intégralement dans `ngu-wiki-reference/adventure-zones-master-table.md`.
3. **Courbe de progression SOREAL calculée** : `idle-zones-wiki-draft-v1.json` (46 zones, la zone 1 "Safe Zone" n'a pas de combat donc pas de ligne). Le script `build-idle-zones-wiki-draft.mjs` calcule chaque valeur `basePuissance` en conservant EXACTEMENT le ratio de difficulté réel entre chaque zone du wiki (zone N / zone N-1), juste compressé sur une échelle plus petite pour SOREAL au lieu des nombres astronomiques du vrai jeu (jusqu'à 1e35).

## Ce qui est un vrai calcul (fiable, pas inventé)

- L'**ordre des 47 zones**, leurs **seuils de déblocage** (`niveauRequis` = le numéro de boss réel du wiki, conservé tel quel), et le **ratio de puissance** zone-à-zone : directement dérivés du wiki, reproductibles avec le script.
- La liste des **14 Titans** et leur position exacte dans l'ordre des zones.

## Ce qui est un DRAFT à valider par toi

- **Les noms de zones, d'ennemis et de boss** (`sorealName`, `enemyName`, `bossName` dans le JSON) : j'ai gardé le thème logistique/associatif de "Quai des Palettes" / "Palette Infernale" (les deux seuls noms existants que j'ai trouvés) et improvisé le reste dans le même esprit, en miroir de l'escalade absurde du vrai jeu (zone banale → de plus en plus délirant). Les zones Titan n'ont pas d'ennemi normal (`enemyName: "-"`), seulement un boss — comme dans le vrai jeu. À toi de tout renommer librement, ça ne casse rien dans les calculs.
- **L'échelle finale choisie** (`SOREAL_ZONE47_TARGET = 250000` dans le script) : un choix arbitraire de ma part ("assez grand pour impressionner, pas besoin de gérer des nombres à 35 chiffres"). Change juste cette constante et relance le script si tu veux une échelle différente — tout le reste se recalcule automatiquement en gardant les bons ratios.
- **L'or par zone** : même principe, ancré sur le vrai or de Sewers (800-1000) mais avec une cible finale que j'ai choisie (9000 à la zone 47) — également ajustable en une constante.
- **PV/Attaque ennemi et boss** (`pvEnnemi`, `attaqueEnnemi`, `pvBoss`, `attaqueBoss`) : calculés proportionnellement à `basePuissance` (ratios provisoires ×40/×1/×320/×8) plutôt qu'indépendamment inventés — mais voir point 1 ci-dessous, ces colonnes existent peut-être déjà en double via les constantes `AVENTURE.*` du moteur.

## Ce qui reste à faire avant de pouvoir pousser en jeu

1. **Confirmer le mapping exact des colonnes IDLE_ZONES** (`PVEnnemi`, `PVBoss`, `AttaqueEnnemi`, `AttaqueBoss`, `CoutEntree`) — le moteur a déjà des constantes de formule (`AVENTURE.MULTIPLICATEUR_PV_ENNEMI`, `COUT_ENTREE_BASE`, `CROISSANCE_COUT_ENTREE`) qui pourraient déjà calculer ça automatiquement à partir de la position de la zone, plutôt que d'avoir besoin d'une valeur par zone — à vérifier avant de pousser ces colonnes pour ne pas dupliquer une logique qui existe déjà (mes ratios ×40/×1/×320/×8 sont un point de départ, pas une valeur confirmée).
2. **Les objets/sets qui droppent** (IDLE_LOOTS/IDLE_SETS) — le thème de chaque set est déjà choisi (`setTheme` dans le JSON, ex. "Tenue Bénévole" pour la zone 2), mais les objets individuels (casque/plastron/jambières/bottes/arme/accessoire) ne sont pas encore nommés.
3. **Convertir tout ça en lignes exactes** pour `replaceCatalogSheets()` et les pousser via `/api/admin/idle-catalog-replace` (nécessite le secret).

## Fichiers

- `idle-zones-wiki-draft-v1.json` — les 46 zones calculées (nom, ennemi, boss, puissance, or, PV/attaque, thème de set — tout en draft sauf l'ordre/seuils de déblocage/ratios qui viennent du wiki).
- `build-idle-zones-wiki-draft.mjs` — le script qui les a générés (relançable si tu changes une constante).
- `ngu-wiki-reference/adventure-zones-master-table.md` — la donnée wiki brute complète, à consulter pour la prochaine étape (noms d'objets individuels).
