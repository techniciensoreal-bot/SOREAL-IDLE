# Fonds des Labos (ex-Mineurs d'or) — prompt ChatGPT, style cartoon

Demande de Norman (2026-11-08) : les mineurs d'or deviennent des **Labos** : des **savants fous** qui concoctent des **potions** pour donner l'effet. Style **cartoon**. Les **établis sont déjà dessinés** dans l'image ; il n'y a plus qu'à y placer le savant fou. Les **ustensiles sont VIDES** : le jeu y met lui-même le liquide (couleur de la potion, niveau, bulles animées).

Les images actuelles (cavernes de mine) restent en place tant que celles-ci ne sont pas prêtes.

## Comment l'utiliser
1. Joins ce fichier à une conversation neuve avec ChatGPT et dis-lui :
   > Lis le fichier joint en entier. Génère UNE image en suivant à la lettre le prompt « IMAGE LABOS PC » (format 1536 × 1024, la grille de pixels, les 12 labos, la zone de chaque établi, les ustensiles VIDES, les interdits). Ne génère rien d'autre.
2. Si ChatGPT remplit un ustensile de liquide, dis-lui : « Refais l'image : tous les ustensiles en verre doivent être VIDES (verre transparent, aucun liquide, aucune bulle, aucune fumée). »
3. Dépose l'image dans `cloudflare/public/img/mineurs/fonds/labos-pc.webp`. Ne corrige pas la grille à la main : je mesure les vraies positions et je découpe chaque labo (comme pour les cavernes). Pour le téléphone, on agrandit les découpes (même méthode qu'avant), aucune image téléphone à demander.

## Règles communes (déjà dans le prompt)
- **Style cartoon** : contours noirs épais et réguliers, couleurs vives et saturées, formes arrondies et un peu exagérées, ombrage à aplats (cel shading), lumière joyeuse et un peu folle. Pas de réalisme, pas de gravure sombre.
- **Aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucun liquide dans les ustensiles, aucune bulle, fumée ni étincelle animée.**
- Chaque labo est une **salle dans la roche** (même cadre que les cavernes : arche de pierre cartoon, deux lanternes), de proportions 10 : 9.
- **À gauche : sol vide sur le tiers gauche** (le savant fou y sera posé). **À droite : l'établi.**

---

## IMAGE LABOS PC (1536 × 1024, paysage)

Coller tel quel :

« Illustration de jeu vidéo en **style cartoon** : contours noirs épais et réguliers, couleurs vives et saturées, formes arrondies et exagérées, ombrage à aplats (cel shading), lumière joyeuse. **Coupe d'une mine vue de face, à plat, sans perspective** : un mur de roche (cartoon, brun-gris, texture simple et uniforme) dans lequel sont creusés **12 laboratoires de savants fous**, rangés en **4 colonnes × 3 rangées**. Format **1536 × 1024 pixels**.

**Grille exacte** (pixels, origine en haut à gauche ; chaque labo fait 336 × 302) :
- colonnes (x de départ) : 50, 416, 782, 1148 ;
- rangées (y de départ) : 28, 360, 692.
Chaque labo est une **salle rectangulaire aux coins supérieurs en arche**, bordée d'un **cadre de pierre cartoon net** (gros blocs arrondis), avec **une lanterne de chaque côté du haut**. Entre les labos : roche pleine de texture uniforme, sans motif.

**Dans CHAQUE labo, la même organisation** (coordonnées en pixels DANS le labo, origine = son coin haut gauche) :
- **Sol plat** : la ligne du sol est à **y = 240** ; au-dessus, le mur du fond (de la couleur du labo), en dessous, le sol de pierre.
- **Le tiers gauche (x de 20 à 140) est VIDE : aucun meuble, aucun objet, aucun personnage** (un savant fou y sera ajouté plus tard).
- **Un grand établi de laboratoire à droite** : plateau en bois épais, dessus à **y = 190**, de x = 150 à x = 320, avec ses pieds jusqu'au sol (y = 240). L'établi est dessiné en entier (bois, tiroirs ou étagère dessous).
- **Posés sur le plateau (tous VIDES, en verre transparent à contours noirs épais, avec seulement de petits reflets blancs ; l'intérieur de chaque ustensile est entièrement vide et clair, jamais de liquide, de bulle, de fumée ni de couleur de potion)** :
  - **un GRAND flacon** (fiole d'Erlenmeyer ou ballon rond selon le labo), **centré à x = 232, base à y = 190, hauteur 80 (de y = 110 à y = 190), largeur 64** ;
  - **deux tubes à essai** dans un petit support en bois, **x de 160 à 200, base à y = 190, hauteur 50** ;
  - **un bécher** : **x de 275 à 305, base à y = 190, hauteur 45** ;
  - **un serpentin de verre en spirale** (tube vide) accroché au mur : **x de 255 à 315, y de 70 à 130**.
- Tous ces ustensiles et ces **emplacements doivent rester propres et lisibles** : rien devant eux, rien qui les cache.

**Décor propre à chaque labo** (sur les murs, au plafond et sur l'établi autour des ustensiles ; **mêmes ustensiles vides partout**, seul le décor et la couleur changent) :
Rangée 1 (mur brun chaud) :
1. labo de la **chance** : fers à cheval, trèfles à quatre feuilles, dés dorés géants, bocal de pièces d'or sur l'établi ;
2. labo de **Wandoos** : vieux écrans à tube cathodique, disquettes, câbles, claviers ; coins du mur couverts de pixels de papier peint ;
3. labo des **statistiques** : cadrans et jauges, diagrammes en barres sur le mur, haltères, grande règle ;
4. labo de l'**aventure** : cartes au trésor, boussole géante, cordes, sac à dos, pelle.
Rangée 2 (mur gris-bleu puis violet) :
5. labo de l'**énergie** : bobines Tesla, éclairs dessinés figés sur le mur, grosses piles, câbles ;
6. labo de la **magie** : cristaux violets, grimoire ouvert, runes abstraites (aucune lettre lisible), chapeau pointu sur un crochet ;
7. labo de la **barbe d'énergie** : mèches de barbe dorée qui pendent du plafond, grand peigne, rasoir et blaireau géants, étincelles vertes figées ;
8. labo de la **barbe de magie** : même idée en violet.
Rangée 3 (mur violet profond puis rouge) :
9. labo des **étoiles (PP)** : télescope, cartes du ciel, étoiles dorées suspendues, planétaire ;
10. labo de la **garderie** : biberons, hochets, mobiles, cubes de jeu, petit lit à barreaux, doudou ;
11. labo du **sang** : tuyaux rouges, chauve-souris, crânes rigolos, chaîne, grand chaudron rouge éteint posé au sol près de l'établi (vide) ;
12. labo de l'**EXP (savoir)** : piles de livres, bibliothèque, mortier de diplômé, globe, tableau noir (sans texte).

**Interdits : aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucun liquide ni bulle ni fumée ni étincelle dans ou autour des ustensiles, aucune ouverture de plus que les 12 labos.** »

---

## Ce que le jeu fait ensuite (pour ton information)
- Il recadre chaque labo dans l'image (jamais l'image entière : le nombre de labos reste caché tant qu'on ne les a pas découverts).
- Il pose le **savant fou** (dessiné en SVG, animé : il remue sa potion, rit, hoche la tête) sur le tiers gauche vide.
- Il met le **liquide** dans le grand flacon, les tubes et le bécher aux coordonnées ci-dessus : la couleur de la potion de ce labo, le niveau qui monte, les bulles qui montent, le serpentin qui coule quand le labo travaille.
