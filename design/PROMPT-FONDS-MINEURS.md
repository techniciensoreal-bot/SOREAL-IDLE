# Fonds du menu Mineurs d'or — prompts pour ChatGPT (PC et téléphone)

Demande de Norman (2026-11-08) : « un prompt pour ChatGPT qui génère les 2 images de fond, une pour le PC et une pour le téléphone ». À donner **un prompt à la fois**, dans une conversation neuve. Les 12 cavités sont **différentes**, chacune en rapport avec ce que son mineur rapporte.

## Limite de ChatGPT, et ce que ça change
ChatGPT produit au mieux **1536 × 1024** (paysage), **1024 × 1536** (portrait) ou 1024 × 1024. Une seule image portrait ne peut pas porter 12 cavernes assez grandes pour un téléphone (chacune ferait environ 468 × 220, trop petite pour y poser les boutons). D'où :
- **PC : une image** (1536 × 1024), 12 cavités en 4 colonnes × 3 rangées. Elle tient.
- **Téléphone : deux images** (1024 × 1536 chacune), **6 cavités chacune** (2 colonnes × 3 rangées) : la partie haute de la mine, puis la partie basse. Sur le téléphone, je découpe chaque cavité et je l'affiche en pleine largeur, une sous l'autre.

Au total **3 images** (PC, téléphone haut, téléphone bas). Si tu préfères une seule image téléphone, il faudra la générer en deux morceaux de toute façon.

## Anti-spoil (règle n°2) : ce que fait le jeu
Les 12 cavités sont dessinées, mais **le jeu n'affiche que les cavités des mineurs découverts** : les autres sont recouvertes par un panneau de roche (je le pose par-dessus, aux coordonnées exactes de la grille ci-dessous). Pour que ça se voie le moins possible : **la roche entre les cavités doit être de texture uniforme**, sans motif unique qui trahirait la place d'une cavité, et **les cadres de cavité doivent être des rectangles nets** (voir plus bas).

## Règles communes (déjà dans les prompts)
- Dessin : gravure sombre, dark fantasy / steampunk, traits fins, teintes sourdes sépia, laiton et patine.
- **Aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucune flamme ni poussière animée.**
- Chaque cavité est un **rectangle aux coins supérieurs en arche légère**, de **proportions 10 : 9**, bordé d'un cadre de pierre net ; à l'intérieur, **le tiers gauche du sol est vide** (le mineur y sera posé) ; le sol est à 74 % de la hauteur de la cavité ; le haut de la voûte et le bas (roche et terre) sont calmes (le titre et les boutons sont posés par-dessus).
- Couleur par profondeur : terre brune en haut → gris-bleu → violet profond → rouge braise tout en bas.

---

## IMAGE 1 — PC (1536 × 1024, paysage)

Coller tel quel :

« Illustration de jeu vidéo, **coupe d'une mine vue de face, à plat, sans perspective**, en gravure sombre dark fantasy / steampunk, traits fins, teintes sourdes sépia, laiton et patine. Format **1536 × 1024 pixels**. La coupe est un mur de roche sombre, de texture uniforme, dans lequel sont creusées **12 cavités**, rangées en **4 colonnes × 3 rangées**. **La couleur dominante change avec la profondeur** : la rangée du haut est en terre brune chaude, la rangée du milieu en gris-bleu puis violet, la rangée du bas en violet profond puis rouge braise.

**Grille exacte** (pixels, origine en haut à gauche ; chaque cavité fait 336 × 302) :
- colonnes (x de départ) : 50, 416, 782, 1148 ;
- rangées (y de départ) : 28, 360, 692.
Chaque cavité est un rectangle à coins supérieurs en arche légère, bordé d'un **cadre de pierre net**, éclairé par des lampes à huile. **À l'intérieur de chaque cavité : le tiers gauche du sol est VIDE** (un personnage y sera posé plus tard) ; le sol est plat et situé aux trois quarts de la hauteur de la cavité ; le haut de la voûte et le bas sont sombres et sans détail. Entre les cavités : **de la roche pleine de texture uniforme, sans aucun motif particulier**.

**Contenu des 12 cavités** (de gauche à droite, rangée par rangée) :
Rangée 1 (terre brune) :
1. caveau au trésor : coffres cerclés de fer, sacs empilés sur des étagères, fers à cheval cloués, éclats de gemmes dans la roche ;
2. salle informatique : vieux écrans à tube cathodique éteints sur des établis, grosse tour beige, câbles au sol ;
3. salle de manomètres : armoire de laiton à cadrans et jauges, tuyaux de cuivre, tableau de cadrans ;
4. salle des cartes : cartes punaisées sur la roche, grosse boussole de laiton, cordes, piolets et épées dans un râtelier, lanternes.
Rangée 2 (gris-bleu, violet) :
5. salle de dynamo : bobines de cuivre, grande sphère d'acier, câbles épais, arcs électriques figés vert pâle sur les murs ;
6. grotte aux cristaux : amas de cristaux violets au sol et au plafond, runes abstraites gravées (aucune lettre lisible) ;
7. mèches de barbe dorée qui pendent du plafond comme des stalactites, grand peigne doré planté au sol, étincelles vertes figées ;
8. mèches de barbe violette qui pendent du plafond, grand peigne planté au sol, étincelles violettes figées.
Rangée 3 (violet profond, rouge braise) :
9. grotte aux étoiles : plafond piqueté d'étoiles dorées, gros sac de toile marqué d'une étoile au sol ;
10. crèche : berceaux à barreaux, mobiles suspendus, petits lits, doudous, lumière douce ;
11. caverne du chaudron : grand chaudron rouge sombre sur un foyer de braises, mares de sang, chaînes et crochets ;
12. bibliothèque troglodyte : piles de livres, étagères creusées, grosse sphère de verre sur un socle, pupitre.

**Interdits : aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucune flamme ni particule animée, aucune ouverture de plus que les 12 cavités.** »

---

## IMAGE 2 — Téléphone, partie haute (1024 × 1536, portrait) : cavités 1 à 6

« Même style que l'image précédente (gravure sombre dark fantasy / steampunk, traits fins, teintes sourdes sépia, laiton et patine). Format **1024 × 1536 pixels**, **coupe d'une mine vue de face, à plat, sans perspective** : mur de roche sombre de texture uniforme avec **6 cavités** en **2 colonnes × 3 rangées**.

**Grille exacte** (pixels, origine en haut à gauche ; chaque cavité fait 468 × 421) :
- colonnes (x de départ) : 32, 524 ;
- rangées (y de départ) : 40, 520, 1000.
Chaque cavité : rectangle à coins supérieurs en arche légère, **cadre de pierre net**, lampes à huile. **Le tiers gauche du sol de chaque cavité est VIDE** ; sol plat aux trois quarts de la hauteur ; haut de la voûte et bas sans détail. Entre les cavités : roche pleine à texture uniforme, sans motif.

Couleurs : les deux premières rangées en **terre brune chaude**, la troisième en **gris-bleu**.

Contenu (de gauche à droite, rangée par rangée) :
1. caveau au trésor : coffres cerclés de fer, sacs sur des étagères, fers à cheval, éclats de gemmes ;
2. salle informatique : vieux écrans à tube cathodique éteints sur des établis, tour beige, câbles ;
3. salle de manomètres : armoire de laiton à cadrans, tuyaux de cuivre, tableau de cadrans ;
4. salle des cartes : cartes punaisées, boussole de laiton, cordes, piolets, râtelier d'armes, lanternes ;
5. salle de dynamo : bobines de cuivre, sphère d'acier, câbles, arcs électriques figés vert pâle ;
6. grotte aux cristaux : cristaux violets au sol et au plafond, runes abstraites sans lettre lisible.

**Interdits : aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucune flamme ni particule animée, aucune ouverture de plus que les 6 cavités.** »

---

## IMAGE 3 — Téléphone, partie basse (1024 × 1536, portrait) : cavités 7 à 12

Même demande que l'image 2 (mêmes colonnes 32 et 524, mêmes rangées 40, 520, 1000, même taille 468 × 421, mêmes règles), avec ces couleurs et ce contenu :

« Couleurs : première rangée en **gris-bleu profond avec reflets dorés et violets**, deuxième rangée en **violet profond**, troisième rangée en **rouge braise**.

Contenu (de gauche à droite, rangée par rangée) :
7. mèches de barbe dorée pendant du plafond comme des stalactites, grand peigne doré au sol, étincelles vertes figées ;
8. mèches de barbe violette pendant du plafond, grand peigne au sol, étincelles violettes figées ;
9. grotte aux étoiles : plafond d'étoiles dorées, gros sac de toile marqué d'une étoile ;
10. crèche : berceaux à barreaux, mobiles, petits lits, doudous, lumière douce ;
11. caverne du chaudron : grand chaudron rouge sombre sur un foyer de braises, mares de sang, chaînes et crochets ;
12. bibliothèque troglodyte : piles de livres, étagères creusées, sphère de verre, pupitre. »

---

## Après la génération
- Dépose les 3 images dans `cloudflare/public/img/mineurs/fonds/` : `fond-pc.webp`, `fond-tel-haut.webp`, `fond-tel-bas.webp`.
- Si ChatGPT ne respecte pas la grille à la lettre (c'est fréquent), ne la corrige pas à la main : envoie-moi l'image, je mesure les vraies positions des cavités et j'adapte les coordonnées de découpe.
- Le mineur de base (mannequin) reste un prompt à part : `MINEURS-REFONTE-V2.md`.
