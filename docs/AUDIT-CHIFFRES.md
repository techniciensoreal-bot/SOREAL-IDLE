# Audit « code → wiki » des chiffres de SOREAL IDLE (2026-09-24)

Demande de Norman : comparer **tous** les chiffres présents dans SOREAL IDLE au wiki, pour retirer les faux chiffres de l'ancienne version
(quand les valeurs étaient inventées). Sens inverse de `design/wiki-number-coverage.mjs` (wiki → code).

## Méthode et limites (à lire avant de conclure)

- Outil : `node design/code-number-audit.mjs > sortie.json`. Il retire commentaires et chaînes de `cloudflare/src/*.js`, extrait les
  littéraux numériques et regarde si chacun existe dans le miroir du wiki (pages, templates, extra, external) à 4 chiffres significatifs
  près (le wiki abrège : « 1.5 M », « 4.062E+09 »). 6 453 valeurs distinctes dans le corpus.
- **Ce que ça prouve** : un chiffre *absent* du wiki est un candidat à examiner. **Ce que ça ne prouve pas** : qu'un chiffre *présent*
  soit correct (un « 0,35 » ou un « 25 » existe forcément quelque part dans 1 110 pages) ; c'est pourquoi les vraies preuves restent les
  tests `idle-wiki-table-*` qui recalculent les tables du wiki avec les fonctions du moteur.
- Les chiffres à un ou deux chiffres significatifs (coefficients, plafonds) sont ceux qui se cachent le mieux : ils sont donc revus à la
  main (section B), pas par l'outil.
- Les **feuilles de catalogue** stockées en base (IDLE_BOSS, IDLE_LOOTS, IDLE_SETS, IDLE_ZONES, IDLE_BOUTIQUE, IDLE_SORTS, IDLE_COLLECTIONS,
  IDLE_APPARENCES, IDLE_REPOS, IDLE_DEBLOCAGES, CONFIG) ne sont pas du code : elles ne sont pas couvertes par cet outil (section C).

## Résultat de l'outil

27 fichiers, ≈ 11 600 littéraux non triviaux, **86 absents du wiki** :

| Fichier | Absents | Nature |
|---|---|---|
| `idle-adventure-v47.js` | 66 | valeurs `p:` / `t:` (Power / Toughness de fin de niveau) de 60 sets, lignes 672 à 1010 ; un 6,5 h de cooldown (ligne 632) ; une chance de drop `.22` (ligne 4308) |
| `idle-sqlite-runtime.js` | 9 | conversions de date (1899, 86 400 000, 30,4375) et bornes `1e-300` : constantes techniques |
| `idle-ngu-progression.js` | 6 | `1e-300` (garde de division) et `baseGold: 1.5625e20` (Time Machine, ligne 652) |
| `idle-media-v1.js` | 3 | durée de cache HTTP 604 800 s : technique |
| `idle-ngu-boss-reference-v1.js` | 2 | ligne 180 : un boss (PV 4,0625e10, attaque 4,0625e9, défense 2,1875e9) absent du wiki |
| `idle-macguffins-v1.js` | 1 | cooldown 47,5 h du MacGuffin bêta |
| `idle-sellout-shop-v1.js` | 1 | 43 200 s (12 h) du Super Lucky Charm |

À examiner : les 66 valeurs `p:`/`t:` (le wiki publie les fiches « Item data » par pièce ; ce sont vraisemblablement des sommes de set
recalculées, à comparer aux totaux « Total Power / Toughness » des pages de sets — déjà vérifiés par script pour certains sets, voir
`WIKI-COVERAGE.md`), le cooldown 6,5 h, la chance `.22`, `baseGold 1.5625e20`, le boss ligne 180, les 47,5 h et 12 h.

## A. Retiré aujourd'hui (jamais lu, sans source wiki)

Dans `CONFIG_SOREAL_IDLE` (`idle-sqlite-runtime.js`), constantes **définies mais lues nulle part** (comptage des références) : `MULTIPLICATEUR_PV_BOSS`
(1,5), `NIVEAU_RENAISSANCE` (8), `DEFENSE_ARMURE_COEFFICIENT` (0,35), `PV_ARMURE_COEFFICIENT` (5), `MULTIPLICATEUR_ATTAQUE_BOSS` (1,32) et tout
le bloc `AVENTURE` (niveau de déblocage 2, 5 ennemis par zone, coût d'entrée 30 × 1,35, PV ennemi × 1,55, attaque ennemie × 1,34, récompenses de
base 2 et 4). Et, le même jour, dans les victoires de boss principal : les « pièces » (colonne inventée `pieces` de IDLE_BOSS), le tirage d'objet
(`chanceLoot`, 45 % par défaut) et leur affichage (voir `WORKLOG.md`).

## B. Encore utilisés, sans source wiki (à trancher, non modifiés)

Constantes de `CONFIG_SOREAL_IDLE` toujours lues par le code :

| Constante | Valeur | Lue par | Remarque |
|---|---|---|---|
| `PV_JOUEUR_BASE`, `PV_PAR_ENDURANCE` | 100, 20 | création d'un joueur, PV du joueur (≈ 6 usages) | le wiki (Boss Fights) donne « HP = 10 × attaque » ; la valeur de départ 100 + 20 × endurance est de l'ancienne version |
| `DEFENSE_PAR_ENDURANCE` | 0,5 | ligne ≈ 11 161 (ancien combat) | ancien modèle de défense |
| `DEGATS_BOSS_MIN_PCT` | 0,12 | ligne ≈ 11 207 (ancien combat) | plancher de dégâts inventé |
| `ATTAQUE_BOSS_BASE`, `BOSS_PV_BASE` | 2, 800 | repli quand le catalogue de boss est vide | remplacés par la référence wiki (`idle-ngu-boss-reference-v1.js`) dès que le catalogue existe |
| `INVENTAIRE_CAPACITE_BASE` / `MAX` | 18 / 90 | ancien inventaire (19 usages) | le wiki : 24 places de départ, 60 au maximum (achats compris) ; l'inventaire d'Aventure actuel a sa propre capacité |
| `PROGRESSION_HORS_LIGNE_MAX_SECONDES` | 12 h | rattrapage de **Basic Training** hors ligne | le wiki ne donne aucun plafond ; le moteur des autres systèmes plafonne à 30 jours (`EARLY_GAME_MAX_OFFLINE_SECONDS`) — voir `HORS-LIGNE.md` |
| `ENERGIE_BASE`, `PROD_SECONDE_BASE`, `FORCE_BASE`… | 500, 1, 1 | départ d'une partie | 500 d'énergie de départ à 250 : validé par Norman en jouant les deux jeux |

Paramètres lus dans la feuille CONFIG avec un repli codé en dur : `MANA_BASE` 45, `MANA_PAR_NIVEAU` 3, `MANA_REGEN_BASE_SEC` 0,12,
`MANA_REGEN_PAR_NIVEAU` 0,004 (ancienne mécanique de mana, dont les achats sont désactivés), `PUISSANCE_BASE_FIXE` 4.

## C. Feuilles de catalogue en base (non couvertes par l'outil)

Encore lues par le code : `IDLE_BOSS` (nom, histoire, image ; **les PV / attaque / EXP viennent désormais de la référence wiki**, seules les colonnes
`pieces` et `chanceLoot` étaient inventées : plus lues pour les victoires), `IDLE_LOOTS` et `IDLE_SETS` (ancien butin — à confirmer que plus aucun chemin actif
n'y puise depuis la suppression des objets de boss), `IDLE_ZONES` (zones historiques), `IDLE_BOUTIQUE` (ancienne boutique, désactivée), `IDLE_SORTS`
(anciens sorts, désactivés), `IDLE_COLLECTIONS`, `IDLE_APPARENCES`, `IDLE_REPOS`, `IDLE_DEBLOCAGES`. **Prochain pas proposé** : lister pour chaque feuille
la fonction qui la lit et si elle est atteignable depuis l'interface ; supprimer le code et les feuilles des chemins désactivés (les dépôts contiennent
déjà des tests qui verrouillent leur désactivation).
