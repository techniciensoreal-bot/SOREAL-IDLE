# Prompt pour générer les trois images de la Machine temporelle

À donner au générateur d'images, UNE image à la fois, (texte seul, sans image de gabarit).
Les mesures sont en pixels, origine en haut à gauche de chaque image.

---

## Prompt commun (à coller en tête des trois demandes)

Illustration de jeu vidéo, vue de face, parfaitement symétrique à plat (aucune perspective, aucune rotation), d'un élément d'une **machine à remonter le temps** de style **rétro-futuriste / steampunk luxueux** : métal brossé sombre et laiton poli, rivets, nervures, vitres épaisses, câbles et tuyaux, éclairage cinématographique doux avec reflets propres, ombres douces dessinées DANS l'image, finition « jeu mobile haut de gamme », très détaillé, net, belle, jamais plat ni cartoon grossier. Palette : acier anthracite, laiton chaud, touches de lumière. Même style, mêmes matériaux et même éclairage (lumière venant du haut-gauche) sur les trois images, pour qu'elles forment UNE seule machine une fois collées.

**Règles strictes :**
1. **Fond transparent** (PNG avec canal alpha) autour de la machine. Aucun décor, aucun sol, aucune ombre portée à l'extérieur.
2. **Aucun texte, aucune lettre, aucun chiffre, aucun logo, aucune pièce d'or, aucun personnage, aucun engrenage visible dans les emplacements** : le jeu ajoute lui-même tout ce qui bouge ou s'écrit.
3. **Les emplacements décrits plus bas sont des creux VIDES** : un cadre métallique net (biseau, vis aux coins) autour d'une surface intérieure **unie, sombre (presque noire), mate, sans reflet, sans dégradé marqué, sans motif**. Les coordonnées données sont celles de la SURFACE INTÉRIEURE vide ; le cadre décoratif est dessiné autour, à l'extérieur de ces rectangles. Respecter les positions et tailles **au pixel près** (tolérance 3 px) : le jeu pose ses éléments exactement dessus.
4. Pas de cadre gris autour de l'ensemble, pas de rectangle de fond : la silhouette de la machine se détache directement sur la transparence.
5. **Connecteurs** : voir la section dédiée plus bas. Ils sont indispensables.

---

## Connecteurs (essentiels : les images se collent côte à côte sur PC et s'empilent sur téléphone)

Ce sont de gros boutons / manchons d'accouplement en métal gris acier, **tous identiques en forme, taille et matière sur les trois images**, avec un joint sombre au bout. Ils dépassent du corps de la machine **jusqu'au bord exact de l'image**, de façon que deux images posées bord à bord (sans aucun espace) aient leurs connecteurs qui **se rejoignent exactement, face à face**.

**Latéraux (sur les trois images, à gauche ET à droite) :** deux connecteurs par côté, aux mêmes hauteurs sur les trois images :
- connecteur n° 1 : de y = 400 à y = 610 (210 px de haut) ;
- connecteur n° 2 : de y = 870 à y = 1060 (190 px de haut) ;
- profondeur : 40 px, du bord de l'image (x = 0 à gauche, x = 1200 à droite) vers l'intérieur ; le bout touche le bord de l'image, parfaitement plat et vertical.
- Les connecteurs de gauche et de droite sont l'image miroir l'un de l'autre.

**Dessus (en haut), pour l'empilement sur téléphone :**
- sur la **machine centrale** et sur la **tour Magie (bleue)** : un connecteur vertical centré sur le haut de l'image, de x = 540 à x = 660 (120 px de large), de y = 0 à y = 40, bout plat touchant le bord supérieur de l'image ;
- le dessous de ces éléments reçoit le même connecteur (voir « dessous » ci-dessous).

**Dessous (en bas) :** pour que les éléments s'accouplent par le haut et le bas, la **machine centrale** et la **tour Énergie (verte)** portent le même connecteur centré en bas (x = 540 à 660, sur les 40 derniers pixels de la hauteur de l'image) et la **tour Énergie** porte aussi le connecteur du haut (x = 540 à 660, y = 0 à 40) ; ainsi l'ordre d'empilement est : machine centrale, tour Énergie, tour Magie.

---

## Image 1 — Machine centrale (1200 × 1800 px)

Corps de la machine : large pupitre d'un seul tenant, plus haut que les tours, avec un grand écran en haut, un tableau de bord au milieu, une fenêtre technique, et une goulotte de sortie en bas. Le décor autour des emplacements doit être le plus beau de l'ensemble (cadres en laiton gravés, voyants éteints, boulons, câbles, tuyaux en arc qui retombent sur les côtés).

Emplacements vides (surface intérieure, rectangles sauf mention) :
| Emplacement | x début | y début | x fin | y fin | Contenu du creux |
|---|---|---|---|---|---|
| **Petit écran du mob** (l'image du monstre) | 120 | 90 | 1080 | 700 | verre sombre uni, 960 × 610 |
| **Petit écran nom + butin** (le nom du mob et ce qu'il donne) | 120 | 730 | 1080 | 850 | verre sombre uni, 960 × 120, bande plate, vraiment SÉPARÉ de l'écran du mob par un montant métallique de 30 px |
| **Afficheur gauche** | 90 | 930 | 440 | 1090 | écran sombre uni, 350 × 160 |
| **Cadran rond** | centre (600, 1010) | rayon 110 | | | disque sombre uni de 220 px de diamètre, cerclé de laiton, sans aiguille ni graduation |
| **Afficheur droit** | 760 | 930 | 1110 | 1090 | écran sombre uni, 350 × 160 |
| **Fenêtre longue** (où tournent des engrenages ajoutés par le jeu) | 90 | 1180 | 1110 | 1400 | vitre sombre unie, 1020 × 220 |
| **Sortie du bas** (où tombent des pièces ajoutées par le jeu) | 420 | 1480 | 780 | 1680 | goulotte vide sombre, 360 × 200 |

Connecteurs : latéraux à gauche et à droite (400–610 et 870–1060), un en haut (540–660, y 0–40), un en bas (540–660, y 1760–1800).

---

## Image 2 — Tour Énergie, VERTE (1200 × 1500 px)

Tour verticale à gauche de la machine. **Toute la lumière, les voyants, le liquide visible et les accents sont d'un vert vif émeraude** (jamais d'autre couleur d'accent). Style identique à la machine centrale.

| Emplacement | x début | y début | x fin | y fin | Contenu du creux |
|---|---|---|---|---|---|
| **Plaque de titre** | 150 | 70 | 1050 | 210 | bandeau sombre uni, 900 × 140 (le jeu y écrit le titre) |
| **Petit socle rond** | centre (600, 330) | rayon 90 | | | disque sombre uni (le jeu y pose une icône) |
| **Tube de verre** (liquide ajouté par le jeu) | 90 | 430 | 300 | 1230 | tube vertical vide, verre clair presque transparent à reflets discrets, fond sombre uni, 210 × 800, arrondi en haut et en bas, bagues métalliques aux extrémités DESSINÉES À L'EXTÉRIEUR du rectangle |
| **Afficheur du haut** | 350 | 430 | 1110 | 640 | écran sombre uni, 760 × 210 |
| **Afficheur du bas** (plus grand) | 350 | 700 | 1110 | 1010 | écran sombre uni, 760 × 310 |
| **Quatre boutons carrés vides** | n° 1 : 90–315 · n° 2 : 355–580 · n° 3 : 620–845 · n° 4 : 885–1110 | | | | y de 1290 à 1420 ; creux carrés sombres unis de 225 × 130, seul le cadre est dessiné |

Connecteurs : latéraux (400–610 et 870–1060), un en haut ET un en bas (540–660).

---

## Image 3 — Tour Magie, BLEUE (1200 × 1500 px)

Miroir fonctionnel de la tour Énergie : même structure, même style, **tout en bleu électrique** (voyants, lumière, accents). Seule la position du tube et des afficheurs est inversée.

| Emplacement | x début | y début | x fin | y fin | Contenu du creux |
|---|---|---|---|---|---|
| **Plaque de titre** | 150 | 70 | 1050 | 210 | bandeau sombre uni, 900 × 140 |
| **Petit socle rond** | centre (600, 330) | rayon 90 | | | disque sombre uni |
| **Tube de verre** (à droite) | 900 | 430 | 1110 | 1230 | tube vertical vide, 210 × 800 |
| **Afficheur du haut** (à gauche) | 90 | 430 | 850 | 640 | écran sombre uni, 760 × 210 |
| **Afficheur du bas** (plus grand) | 90 | 700 | 850 | 1010 | écran sombre uni, 760 × 310 |
| **Quatre boutons carrés vides** | n° 1 : 90–315 · n° 2 : 355–580 · n° 3 : 620–845 · n° 4 : 885–1110 | | | | y de 1290 à 1420 ; creux carrés sombres unis de 225 × 130 |

Connecteurs : latéraux (400–610 et 870–1060), un en haut seulement (540–660) ; rien en bas.

---

## Contrôle avant de me les envoyer

- Les trois images ont la même largeur (1200 px) ; hauteurs : 1800 / 1500 / 1500 ; fond transparent.
- Les connecteurs latéraux sont aux mêmes y sur les trois images et touchent exactement le bord gauche et droit.
- Tous les creux sont vides, unis, sans texte ; leurs positions respectent les tableaux.
- Les trois images se ressemblent (matériaux, lumière) ; Énergie = vert, Magie = bleu, centre = neutre (acier et laiton).

