# Contrôle croisé : Wishes, Hacks, NGU, Advanced Training, Augmentations

Date : 2026-09-25. Lecture seule : aucun fichier du jeu modifié. Écarts détaillés en JSON dans `wishes-hacks-ngu.json` (même dossier). Scripts d'analyse sous `%LOCALAPPDATA%\Temp\claude\xc\` (hors dépôt).

Sources confrontées :
- **Jeu** : `cloudflare/src/idle-wishes-v1.js`, `idle-ngu-catalog-v1.js`, `idle-ngu-progression.js` (IDLE_NGU_TRACKS.hacks / advancedTraining, IDLE_NGU_AUGMENTATIONS, HACK_HARD_CAP_V1), `idle-cards-v1.js`, `idle-macguffins-v1.js`, `idle-questing-v1.js`, `public/soreal-idle-ui.js`.
- **Wiki local** : pages Wishes (tableaux Page 1 à 11), Hacks, NGU, Advanced Training, Augmentations, plus Energy, Magic, Resource 3, Questing, Blood Magic, Yggdrasil, Secrets and Spoilers (recoupements sur les totaux de souhaits).
- **Tierces** : `ngu-idle-calculators-ts` (wish/hacks/ngus/advTraining) et `gear-optimizer` (Wish/Hack/NGU/Augment : formules seulement, les tables de données ItemAux ne sont pas dans la copie).

Note de méthode : la source tierce `wish.ts` porte un champ « mode » (Evil / Sadistic) et la page Wishes du wiki a, pour quelques lignes, une valeur affichée différente de sa `data-sort-value`. Le jeu a été transcrit sur la valeur affichée ; la source tierce coïncide avec `data-sort-value`.

---

## (D) Résumé chiffré

| Catégorie | Entrées | Jeu = wiki | Jeu = source tierce | Remarques |
|---|---|---|---|---|
| Wishes : présence | 231 (id 0 à 230) | 231/231 | 231/231 | aucun manquant, aucun en trop |
| Wishes : niveaux max | 231 | 231/231 | 228/231 | 88, 89, 218 |
| Wishes : diviseur | 231 | 231/231 (valeur affichée) | 228/231 | 91, 192, 204 |
| Wishes : nom | 231 | 230/231 | 162/231 exacts (69 écarts d'espace ou de « was ») | seul écart de fond : 202 (rebrand voulu) |
| Wishes : texte d'effet | 231 | 222/231 identiques, 9 avec balisage wiki `[[..]]` ou espaces seulement | n/a | pas d'écart de sens |
| Wishes : effet chiffré | 113 avec props | n/a | 112/113 | 189 (voir B) |
| Wishes : branchement | 231 | n/a | n/a | 225 branchés (dont 1 partiel : n°4), 6 non branchés |
| Hacks | 15 | 15/15 | 15/15 | effet/niveau, bonus de milestone, niveaux/milestone, diviseur, niveau max ; les 15 effets sont lus |
| NGU (16 x 3 paliers) | 48 | 48/48 (coût, %/niveau, soft cap, exposant, coefficient) | 32/48 | les 16 écarts sont tous le coût Sadistic de la source tierce (50x plus bas) |
| Advanced Training | 5 | 5/5 | 5/5 | formules et temps de base identiques |
| Augmentations (7 + 7 upgrades) | 14 | 13/14 | 13/14 | upgrade Quadruple Sided Laser Sword : or x1000 trop bas |

---

## (A) MANQUANTS

**Catalogues : rien ne manque.** 231 souhaits, 15 hacks, 48 NGU, 5 pistes d'Advanced Training, 14 augments/upgrades sont présents.

**Ce qui manque est côté effet** (voir C). Les deux trous connus, exactement ce que disent les sources :

**Souhaits 59 « I wish Blood MacGuffin α also didn't suck » et 60 « I wish Fruit of MacGuffin α also didn't suck »**
- Wiki (page Wishes, Page 3) : 10 niveaux, diviseur 4,00e20, difficulté Evil. Effet 59 : « improve the spell's outcome by 20% per level ». Effet 60 : « improve the fruit's benefits by 20% per level ». La page Blood Magic donne « Total Wish output 22 Sx (2,2E22) », soit 4e20 x 55, ce qui confirme diviseur et 10 niveaux. Aucune formule de Blood Magic ni de Yggdrasil n'inclut ces souhaits (contrairement au n°61, cité `Wish_61` dans la formule d'EXP).
- Source tierce `wish.ts` : les deux entrées existent (id 59 et 60, mode Evil, 10 niveaux, 4e20) mais **`props` est vide `[]`** : le calculateur ne modélise aucune Stat pour eux, car l'effet porte sur une action (sort, fruit), pas sur une statistique. gear-optimizer : aucune donnée de souhait.
- Jeu : entrées présentes avec texte, niveaux et diviseur exacts, `bonus: {}`, et `idle-macguffins-v1.js` ne lit que les souhaits 2, 24 et 25. Effet non branché.
- Formule non publiée. Hypothèse la plus simple : niveaux gagnés (`macguffinBloodSpellLevelsV1` pour le sort, `macguffinFruitLevelsV1` pour le fruit) x (1 + 0,2 x niveau du souhait), arrondi. À valider avant d'implémenter.

---

## (B) ÉCARTS DE VALEUR

Classés par gravité pour le gameplay.

### Wishes

| id | Champ | Jeu | Wiki | Source tierce | Verdict |
|---|---|---|---|---|---|
| 91 « Energy Power VI » | diviseur | 1e21 | affiché 1,00E+21, `data-sort-value` 1e23 | 1e23 | **Jeu faux (x100 trop bas).** La page Energy donne 5,5 Sp (5,5E24) = 1e23 x 55 ; les siblings 92 à 97 sont à 1e23 |
| 88 « Resource 3 Power V » | niveaux | 1 | page Wishes : 1 ; page Resource 3 : 10 (total 2,75E23 = 5e21 x 55) | 10 | **Jeu faux.** +3 %/niveau donc max +30 % (jeu : +3 %) |
| 89 « Resource 3 Barfs V » | niveaux | 1 | idem (10 sur Resource 3) | 10 | **Jeu faux.** max +15 % R3 Bars (jeu : +1,5 %) |
| 189 « Bosses V » | effet/niveau | +1 % Attack/Defense | texte wiki : « 1% » | ATTACK 100, DEFENSE 100 (+100 %/niveau) | **Jeu probablement faux.** Les Bosses VI, VII, VIII (191, 192, 219) sont à +100 %/niveau ; le texte du 189 est la copie du 188. 20 niveaux : +2000 % contre +20 % |
| 192 « Bosses VII » | diviseur | 6e25 | affiché 6,00E+25, `data-sort-value` 4e26 | 4e26 | Incertain. 6e25 reste monotone (191 : 2e25, 219 : 1,8e26), 4e26 dépasserait le 219 |
| 204 « Titan 12 gave me some QP » | diviseur | 3e26 | affiché 3e26 (Wishes) et 3E+26 (page Questing) ; `data-sort-value` 1e27 | 1e27 | Incertain. Le jeu suit deux pages du wiki ; la source tierce (mars 2025) est peut-être plus récente |
| 218 « Adventure VI » | niveaux | 20 | 20 | 10 | Incertain (le n°226 « part 2 » a 10 niveaux) |
| 202 | nom | « ... Norman & Sébastien's next Idle game » | « ... 4G's next Idle game » | idem wiki | Rebrand voulu, aucune action |

Écarts de conception :
- **Difficulté des souhaits non modélisée.** Le catalogue affirme « every wish 0-230 is Normal-accessible ». Or la source tierce classe 95 souhaits Evil et 136 Sadistic, et les 112 souhaits que le wiki recoupe dans ses pages de fonctionnalités (Hacks, NGU, Energy, Magic, Resource 3, Questing, Blood Magic...) portent tous « Evil » ou « Sadistic » : 112/112 concordent avec la source tierce. Le jeu n'impose aucune restriction de difficulté (`setWishSlotV1`, UI `meta-progression-v130.js`). Liste exacte des ids par difficulté dans le JSON.
- **Échelle de temps de la formule des Wishes (à trancher par mesure en jeu).** Le jeu calcule des secondes : `diviseur x (niveau+1) / (produit des 6 termes)^0,17 / multiplicateurs`, plancher 4 h (`wishSecondsForLevelV1`). gear-optimizer traite la même quantité en **ticks** (plancher = minutes x 60 x 50), soit secondes = ticks / 50 ; `ngu-idle-calculators` donne une vitesse avec facteur `100/50` (= 2). Trois échelles incompatibles ; le wiki ne donne pas d'unité. Les Hacks du jeu, eux, divisent bien les ticks par 50 (`advanceHackTrack`). Si gear-optimizer a raison, les souhaits sont 50x trop lents tant que le plancher de 4 h n'est pas atteint.

### NGU

Jeu = wiki sur les 48 lignes (coût de base, %/niveau, soft cap, exposant, coefficient). Écarts avec la source tierce : les 16 NGU Sadistic ont un coût 50x plus bas chez elle (Augments 2e38 contre 1e40, jusqu'à Adventure β 2e43 contre 1e45). Le wiki confirme « 50 quintillion (5e19) times slower than evil » : la source tierce est à ignorer sur ce point. Détail mineur : elle donne 0,06 pour Energy Wandoos speed mais 0,1 pour Magic Wandoos speed au niveau Sadistic (le wiki et le jeu appliquent 0,06 % aux deux ; probable coquille).

### Hacks

Aucun écart : 15/15 sur les cinq paramètres, dans les trois sources. Les niveaux maximaux (7720 ... 6262) et la formule de temps `diviseur x 1,0078^niveau x (niveau+1) / (R3 x Puissance x vitesse)` concordent avec gear-optimizer. Les réducteurs de milestone (perks 113/114/115/217/218/219, quirks 57/58/59/60/174/175, souhaits 76/77/78) correspondent à ceux de la source tierce.

### Advanced Training

Aucun écart : Power/Toughness = niveau^0,4 x 10 %, Block = (niveau+50)/(niveau+100), Wandoos Dump = +1 %/niveau, 10 000 s (20 000 s pour Wandoos) au niveau 0 avec 1000 de cap et 1 de Puissance, racine carrée de la Puissance, 50 niveaux/s. La source tierce ajoute que Power AT augmente aussi les PV max et Toughness AT la régénération : le jeu le fait (`hp x multPower`, `regen x multToughness`).

### Augmentations

- **Upgrade « Quadruple Sided Laser Sword »** : or de base du jeu 1,5625e20 ; le wiki donne « 156.25 Sext » (sextillion = 1e21, donc 1,5625e23) et gear-optimizer redonne 1,5625e23 par sa formule (1e7 x 50^6 x 1000^2). **Jeu faux, facteur 1000.** Le test `tests/idle-wiki-table-augmentations.test.mjs` (ligne 18) fige la mauvaise valeur : à corriger avec le catalogue.
- Les 13 autres lignes (multiplicateur de base, or, secondes, boss de déblocage, exposants 1 à 1,6) concordent avec le wiki ; or et énergie sont retrouvés par les formules de gear-optimizer.
- **Laser Sword Challenge** (à vérifier) : le jeu ajoute +0,01 à l'écart d'exposant entre rangs par complétion. gear-optimizer ajoute en plus +0,05 dès la 1re complétion et +0,05 à 20 complétions. Pour un Laser Sword (rang 6) l'exposant serait 1,96 au lieu de 1,66 dès la 1re complétion.
- Diviseurs de vitesse Evil 2,5e12 et Sadistic 2,5e27 : conformes au wiki. gear-optimizer utilise 2,08e27 (division par 1,2 qu'il appelle « HACK ») ; probablement le perk « Welcome to Sadistic » (+20 % Aug Speed), à vérifier qu'il est appliqué.

---

## (C) EFFETS PRÉSENTS MAIS NON BRANCHÉS

Méthode : pour chaque souhait, recherche d'un consommateur (clés de `bonus` lues par `wishBonusesV1`/questing, table `IDLE_CARDS_WISH_EFFECTS_V1`, `wishLevelV1(state, id)` dans le moteur, `wishLevel(...)` dans MacGuffins, portraits, récompenses de titans, UI).

Répartition des 231 : 93 via `bonus` du catalogue, 95 via les Cartes, 34 branchés par identifiant en dur (titans QP, hacks, NGU speed, MacGuffins, portraits, rebirth, daycare, cube, AT...), 3 via emplacements d'inventaire (7, 22, 57) ; total 225 branchés (dont le n°4, partiel), sans double comptage.

**Non branchés (6) :**

| id | Nom | Effet attendu | Remarque |
|---|---|---|---|
| 28 | dual wield weapons | 2e arme, +5 % de ses stats par niveau (10 niveaux) | aucune trace de double arme |
| 45 | dual wield weapons II | +5 % d'efficacité de la 2e arme par niveau | idem |
| 59 | Blood MacGuffin α also didn't suck | +20 %/niveau au sort | voir (A) |
| 60 | Fruit of MacGuffin α also didn't suck | +20 %/niveau au fruit | voir (A) |
| 44 | more cute Daycare Kitty Art | cosmétique | sans effet mécanique connu |
| 203 | ARE YOU SURE YOU WISH TO SHUT DOWN? | non documenté | aucun effet dans le wiki ni dans la source tierce |

**Partiel (1) :** n°4 « money Pit didn't suck » : le niveau Wandoos Money Pit à 100 est branché ; les nouveaux paliers Money Pit à partir de e50 or (récompenses de stats et de seeds) n'existent pas (`moneyPitTierV48_` s'arrête à 1e30).

Hacks : les 15 effets sont lus (`hackFxV1`). NGU : les 16 effets sont lus (`nguEffectsV1` ; Magic NGU et Energy NGU alimentent `nguSpeedMultiplierV1`). Advanced Training : les 5 pistes sont lues (power, toughness, block, dumps Wandoos). Augmentations : les 7 paires sont sommées dans `idleNguAugmentationMultiplier`.

Souhaits branchés hors catalogue, à titre d'information (aucun n'est faux) : 8 et 58 (MEGA BUFF et OH SHIT) le sont côté client (`soreal-idle-ui.js:16311-16312`), pas côté serveur.

---

## Résumé pour le gameplay (10 lignes)

1. Les catalogues sont complets et fidèles au wiki : 231/231 souhaits, 15/15 hacks, 48/48 NGU, 5/5 Advanced Training. Aucun manquant.
2. Souhaits 88 et 89 (Resource 3 Power V / Bars V) : 1 niveau au lieu de 10 (coquille de la page Wishes, la page Resource 3 et la source tierce disent 10) : le joueur perd 27 % de R3 Power et 13,5 % de R3 Bars.
3. Souhait 189 (Bosses V) : +1 % au lieu de +100 % d'Attack/Defense par niveau (probable copie du texte du 188) : jusqu'à +2000 % perdus sur 20 niveaux.
4. Souhait 91 (Energy Power VI) : diviseur 1e21 au lieu de 1e23, il coûte 100x trop peu.
5. Augment « Quadruple Sided Laser Sword » : coût en or 1000x trop bas (1,5625e20 au lieu de 1,5625e23) ; le test l'entérine.
6. Souhaits 28, 45 (double arme), 59, 60 (MacGuffin α) et 203 sans effet ; le 4 sans ses paliers Money Pit e50 ; le 44 est cosmétique.
7. Les souhaits ne sont pas limités par difficulté (95 Evil, 136 Sadistic selon la source tierce et 112/112 pages du wiki) : un joueur Normal accède à tout le catalogue.
8. Échelle de temps des Wishes à mesurer en jeu : gear-optimizer la lit en ticks (secondes / 50), le jeu en secondes : risque de souhaits 50x trop lents.
9. Laser Sword Challenge : il manque peut-être +0,05 (1re complétion) et +0,05 (20e) sur l'exposant des augments (gear-optimizer).
10. Incertains, à ne pas changer sans preuve : souhaits 192 (6e25 ou 4e26), 204 (3e26 ou 1e27), 218 (20 ou 10 niveaux). La source tierce est fiable sur les niveaux et effets, périmée sur le coût NGU Sadistic (50x plus bas).
