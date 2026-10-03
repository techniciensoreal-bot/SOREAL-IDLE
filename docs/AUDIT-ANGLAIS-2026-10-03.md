# Audit de l'anglais restant dans SOREAL IDLE (2026-10-03)

Demande de Norman : lister tout ce qui est écrit en anglais dans le jeu pour choisir ensuite ce qu'on traduit ou pas.

**Méthode.** Balayage automatique de toutes les chaînes de `cloudflare/src/*.js`, `cloudflare/public/soreal-idle-ui.js` et `cloudflare/public/modules/*.js`, puis lecture des catalogues (comptés directement dans les modules, pas estimés). Les chaînes purement techniques (SQL, identifiants, noms de classes CSS, en-têtes HTTP, polices) sont écartées : le joueur ne les voit pas. Les compteurs ci-dessous sont des nombres d'entrées visibles par le joueur.

**Déjà en français** : noms des boss (300), noms d'objets et de sets (406 objets, 69 sets, fait aujourd'hui), noms de zones, noms des Augmentations et de leurs Upgrades, textes d'histoire et tutoriels, boutique AP (noms des objets traduits côté client), textes d'aide des menus, messages d'erreur.

Pour chaque ligne : **Où le joueur le voit**, **Nombre**, **Exemples**, **Remarque**.

---

## A. Noms de menus (barre du haut)

Où : bandeau de navigation, titres de pages. Nombre : 25 menus encore en anglais sur 31.

| Anglais actuel | Traduction possible |
|---|---|
| Basic Training, Advanced Training | Entraînement de base, Entraînement avancé |
| Fight Boss, Adventure, Rebirth | Combat de boss, Aventure, Renaissance |
| Money Pit, Time Machine, Blood Magic | Puits d'argent, Machine à remonter le temps, Magie du sang |
| Wandoos, NGU, Yggdrasil, ITOPOD | noms propres : probablement à garder |
| Gold Diggers, Beards, Perks, Quirks, Wishes, Hacks, Cards, Cooking | Mineurs d'or, Barbes, Avantages, Manies, Souhaits, Piratages, Cartes, Cuisine |
| Challenges, Titans, MacGuffins, Item Daycare, Questing, Achievements | Défis, Titans, MacGuffins, Garderie d'objets, Quêtes, Succès |
| Shop, Chat, Settings | Boutique, Chat, Paramètres |

Remarque : déjà français : Classement, Collection, Augmentations. Ces noms sont aussi cités dans les aides et le patch note ; les changer demande de relire ces textes.

## B. Statistiques et bonus (popups d'objets, Collection, coffre)

Où : popup d'objet, lignes « Spécial », recherche du coffre, Collection. Nombre : environ 30 libellés.

Exemples : Energy Speed / Power / Cap / Bars, Magic Speed / Power / Cap / Bars, Resource 3 Power / Cap / Bars, Drop Chance, Gold Drops, Beard Speed, NGU Speed, Seed Gain, Wish Speed, Hack Speed, Wandoos Speed, Respawn, Yggdrasil Yield, Augment Speed, Quest Drops, Move Cooldowns, Daycare Speed, Arbitrary Points (AP), EXP.

Remarque : la recherche du coffre (« Magic Power ») utilise ces libellés ; si on traduit, on décide si l'ancien nom anglais reste cherchable.

## C. Compétences de combat

Où : Fight Boss, Aventure. Nombre : 6 compétences avancées encore en anglais (les attaques de base sont déjà en français).

Exemples : Paralyze, Hyper Regen, Beast Mode, Mega Buff, Oh Shit, Move 69. Boutons du menu d'action : « Fight Boss » dans l'en-tête du duel.

## D. Perks, Quirks, Wishes (menus Perks / Quirks / Wishes)

Où : listes de ces trois menus. Nombre : **231 Perks, 186 Quirks, 231 Wishes**, chacun avec un **nom ET une description** en anglais (soit environ 1 300 textes).

Exemples : « The Newbie Magic Perk — Gain 1 Magic Power, 1 Magic Bar, and 10k Magic Cap! », « I wish that wishes kicked ass », « Baby's First Quirk: Magic Power », « Boosted Boosts I ».

Remarque : ce sont des jeux de mots du jeu d'origine ; une traduction fidèle demande un vrai travail d'adaptation, et la règle n°1 (aucune valeur inventée) impose de ne toucher qu'au texte, jamais aux nombres.

## E. Boutique AP, Boutique EXP, Cards, Hearts, MacGuffins, Succès

| Catalogue | Nombre | Exemples |
|---|---|---|
| Boutique AP (noms côté serveur) | 81 | Energy Potion α, Beast Butter (x1), Lucky Charm, Improved Loot Filter. Déjà traduits à l'affichage : pilules bleues, nuke, wishes plus rapides (traductions faites côté client, une par une) |
| Cards (noms de types de mayo) | 14 types, dont environ 7 en anglais | Angry, Sad, Moldy, Ayy Lmayo, Cinco de Mayo ; paliers « Pretty, Crappy, Okay, Good, Great » ; « Gold Drop Card Tier Up I » (les noms de types de cartes sont déjà français) |
| Hearts | 10 | My Red Heart, My Rainbow Heart… (déjà traduits côté objets depuis aujourd'hui, mais pas les noms de la page Hearts) |
| MacGuffins | 22 | Energy Power MacGuffin Fragment… |
| Succès | 153 | « Defeat Boss N », « Energy Power 10 », « Defeat THE BEAST V1! » |
| NGU (16 NGU) | 16 noms + descriptions | Augments, Gold, Power α/β, Adventure α, Drop Chance, PP, Number — effets en anglais (« Attack & defense », « Multiplies Number ») |

## F. Ennemis et Titans

Où : Collection (bestiaire), combats d'Aventure. Nombre : **283 noms d'ennemis** + 14 Titans.

Exemples d'ennemis : A Small Piece of Fluff, A Slightly Bigger Mouse, Skeleton, Gorgonzola, Kid On a Cloud, Hooloovoo. Titans : GRB, Grand Corrupted Tree, Jake From Accounting, UUG, Walderp, The Beast, The Exile, Greasy Nerd, The Godmother, IT HUNGERS, ROCK LOBSTER, AMALGAMATE, TIPPI THE TUTORIAL MOUSE, THE TRAITOR.

Remarque : même précédent que les boss et les objets (nom cosmétique, identifiants inchangés). Les noms de Titans sont aussi dans les aides et les histoires.

## G. Séquence finale (« The End »)

Où : écran de fin. Nombre : 18 lignes de dialogue (« DO NOT ASCEND. », « NGU.EXE WILL NOW CLOSE. », « A FATAL EXCEPTION HAS OCCURED. »…) et le titre « THE END ». Remarque : fait partie de l'effet voulu du jeu d'origine ; à traduire seulement si on veut un rendu entièrement français.

## H. Défis, Quêtes, Cuisine, Daycare

Défis : niveaux de difficulté Normal / Evil / Sadistic, bouton Fight Boss, intitulés « Troll : or », « GROS troll : tout » (déjà français pour la plupart). Quêtes : objets de quête (A Dreamcatcher, A Useless College Diploma, A Toothbrush, A Smaller Caterpillar) et « Quests give 20% more QP! ». Daycare : « The Cricket ».

## I. Mots anglais mélangés dans des phrases françaises

Beaucoup de textes d'aide gardent des termes du jeu : Energy, Magic, Cap, Power, Toughness, Rebirth, Boost, Gold, Boss, Idle, Tick, Special… (ex. « Place de l'Energy sur un Augment avec + »). Ce n'est pas une traduction manquante mais un choix de vocabulaire : à trancher globalement (garder ces termes « de jeu » ou les franciser partout), un par un serait incohérent.

## J. Hors joueurs

Messages d'administration (studio de voix, éditeur de textes), journaux et en-têtes du serveur : en anglais ou techniques, non visibles par les joueurs. Rien à traduire sauf souhait contraire.

---

## Ce qui reste à décider (par ordre de visibilité pour le joueur)

1. **Menus (A)** : les noms de la barre du haut.
2. **Statistiques (B)** : les ~30 libellés de bonus.
3. **Vocabulaire général (I)** : Energy / Magic / Cap / Power… on garde ou on traduit partout.
4. **Perks / Quirks / Wishes (D)** : le plus gros chantier (~1 300 textes), à faire par lots.
5. **Ennemis et Titans (F)**, **Succès**, **Boutique**, **Cards** (E) : noms cosmétiques, comme pour les boss.
6. **Compétences (C)**, **The End (G)**, **Quêtes/Défis (H)**.

Règle n°1 respectée : toute traduction ne change que l'affichage, jamais un nombre ni un identifiant ; les noms propres de NGU (Wandoos, NGU, Yggdrasil, ITOPOD, MacGuffin) sont proposés « à garder ».
