# Labos — version 2 : l'établi est une image à part (2 images au lieu d'une)

Remarque de Norman (2026-11-08) : « tu vas avoir du mal à découper le bureau à chaque fois ; on aurait dû le générer à part ». Il a raison : avec les établis et les ustensiles dessinés dans le fond, il faudrait détourer 12 établis et leurs ustensiles à la main pour y mettre le liquide et poser le savant entre les deux.

## Le principe : des couches
De l'arrière vers l'avant, le jeu empile :
1. **le décor du labo** (mur, sol, décor propre à chaque labo, cadre de pierre, lanternes), SANS établi ni ustensile ;
2. **le liquide** (dessiné par le jeu : couleur de la potion, niveau, bulles) ;
3. **le savant fou** (dessiné par le jeu) ;
4. **l'établi et ses ustensiles**, UNE seule image transparente, la même pour les 12 labos, posée par-dessus : le verre est **transparent**, donc le liquide se voit à travers, et la tige de mélange du savant semble plonger dans le flacon.

Donc **2 images à générer** :
- **IMAGE A** : les 12 décors sans établi (une édition de ton image actuelle, pour garder le même style et les mêmes décors) ;
- **IMAGE B** : l'établi avec ses ustensiles vides, en PNG transparent.

Ton image actuelle est gardée comme référence dans `design/labos-v0-avec-etablis.webp`.

---

## IMAGE B — l'établi et ses ustensiles (PNG TRANSPARENT, 1024 × 1024)

À faire en premier (c'est elle qui fixe les positions des ustensiles). Coller tel quel :

« Illustration de jeu vidéo en **style cartoon** : contours noirs épais et réguliers, couleurs vives et saturées, formes arrondies et exagérées, ombrage à aplats (cel shading). **Un établi de laboratoire de savant fou, vu de face, parfaitement à plat, sans perspective**, avec **ses ustensiles en verre, tous VIDES**. **Fond entièrement TRANSPARENT (PNG avec canal alpha)** : aucun mur, aucun sol, aucune ombre portée, aucun décor. Format **1024 × 1024 pixels**.

**Placement exact** (pixels, origine en haut à gauche) :
- **L'établi** : plateau de bois épais dont le **dessus est à y = 620**, de **x = 40 à x = 984** ; dessous, deux tiroirs et des pieds épais qui descendent jusqu'à **y = 1000** (le bas de l'image, 24 px de marge). Bois brun cartoon, planches visibles, poignées de tiroirs métalliques.
- **Posés sur le plateau, de gauche à droite, tous alignés sur le dessus du plateau (leur base touche y = 620)** :
  1. **un support en bois avec DEUX tubes à essai** : de **x = 95 à x = 317**, hauteur **280** (de y = 340 à y = 620) ;
  2. **un GRAND flacon** (fiole d'Erlenmeyer) : **centré sur x = 495, largeur 350 (de x = 320 à x = 670), hauteur 440 (de y = 180 à y = 620)**, goulot étroit en haut, bouchon de liège **posé à côté** du flacon, jamais dessus (goulot ouvert) ;
  3. **un bécher** : de **x = 690 à x = 810**, hauteur **250** (de y = 370 à y = 620) ;
  4. **un alambic à serpentin** (colonne de verre avec un tube en spirale) : de **x = 830 à x = 984**, hauteur **440** (de y = 180 à y = 620).

**VERRE** : chaque ustensile est en **verre transparent**, à contour noir épais, **avec uniquement de petits reflets blancs semi-transparents**. **L'intérieur de chaque ustensile est entièrement TRANSPARENT (canal alpha)** : on doit voir à travers, comme si le verre était vide. **Aucun liquide, aucune bulle, aucune fumée, aucune couleur de potion, aucun bouchon sur les goulots, aucun objet devant ou dans les ustensiles.** Les ustensiles ne se touchent pas entre eux (au moins 15 px d'espace).

**Interdits : aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucun fond, aucun liquide.** »

Si le fond n'est pas transparent ou si l'intérieur du verre est blanc/gris au lieu de transparent, dis à ChatGPT : « Refais l'image avec un VRAI canal alpha : fond transparent ET intérieur du verre transparent. »

---

## IMAGE A — les 12 décors SANS établi (édition de ton image actuelle)

Joins l'image actuelle (`labos-v0-avec-etablis.webp`) à ChatGPT, puis dis-lui :

« **Reprends exactement cette image** (même format, même grille de 12 labos, même style cartoon, mêmes cadres de pierre, mêmes lanternes, mêmes couleurs de murs, mêmes décors propres à chaque labo) **et fais ces seuls changements dans CHAQUE labo** :
1. **Supprime l'établi** (plateau, tiroirs, pieds) **et tous les ustensiles en verre** (grand flacon, tubes à essai et leur support, bécher) **ainsi que le serpentin de verre accroché au mur.**
2. **Reconstitue à leur place le mur du fond et le sol de pierre**, comme s'il n'y avait jamais eu d'établi : le sol continue jusqu'à la droite du labo.
3. **Laisse la moitié droite du bas de chaque labo dégagée** : aucun objet posé au sol, aucun meuble, aucun objet devant le mur, **de la moitié du labo jusqu'au cadre de droite, sur la hauteur du sol et de l'établi** (de 50 % à 100 % de la largeur, de 55 % à 85 % de la hauteur). Les décors propres à chaque labo (fers à cheval, écrans, boussole, bobines Tesla, cristaux, peignes, télescope, mobiles, tuyaux, livres…) **restent sur les murs et dans le tiers gauche haut / le haut du labo**, jamais dans cette zone dégagée.
4. **Le tiers gauche du sol reste vide** (aucun objet au sol, aucun personnage).
**Ne change rien d'autre.** Pas de texte, pas de lettre, pas de personnage, pas de liquide. »

Si des objets (bocal, globe, chaudron, cubes…) restent dans la zone dégagée, dis-lui : « Déplace ces objets sur le mur ou dans le haut du labo ou supprime-les ; la zone du bas à droite doit être totalement libre. »

---

## Ensuite
- Dépose : `cloudflare/public/img/mineurs/fonds/labos-decors.webp` (image A) et `cloudflare/public/img/mineurs/fonds/labos-etabli.png` (image B, PNG transparent).
- Je mesure les labos de l'image A (découpe comme pour les cavernes), je mesure les ustensiles de l'image B (position et forme exactes de chaque verre) et je branche les couches : décor, liquide, savant, établi.
- Aucune image téléphone : les labos se recadrent en pleine largeur (et on agrandit les découpes plus tard si tu veux).
