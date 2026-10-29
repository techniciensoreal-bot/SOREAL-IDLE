# Décor de l'arrière de la borne (fond du combat de boss, PC)

Mesures réelles prises dans le jeu le 2026-10-26, fenêtre 1920 × 1080, menu de gauche déployé.

## Format à livrer

| | |
|---|---|
| Taille | **2700 × 2200 px** (ratio 1,23, proche du 5:4) |
| Format | WebP ou PNG (je compresse en WebP pour R2, visé : moins de 500 Ko) |
| Fond | opaque, aucune transparence |
| Nom | `decor-borne.png` (ou .webp) |

Pourquoi : le cadre qui entoure la borne mesure **1348 × 1092 px** sur un écran 1920 × 1080. L'image est affichée en « couverture » : 2700 × 2200 est le double (écrans haute définition) et le même ratio.

## Où se place la borne

La borne (516 × 1078 px à l'écran, soit 38 % de la largeur et presque toute la hauteur) est **centrée** devant le décor. Elle cache le milieu.

```
 largeur de l'image : 100 %
 |<--- 31 % --->|<---- 38 % ---->|<--- 31 % --->|
 +--------------+----------------+--------------+  haut
 |              |                |              |
 |   DÉCOR      |  CACHÉ PAR LA  |   DÉCOR      |
 |   VISIBLE    |  BORNE         |   VISIBLE    |
 |   (gauche)   |  (point de     |   (droite)   |
 |              |   fuite ici)   |              |
 |              |                |              |
 +--------------+----------------+--------------+  bas (sol)
```

- Mets tout ce qui doit se voir dans les **deux bandes de 31 %** (gauche : de 0 à 31 % ; droite : de 69 % à 100 %).
- Le centre (de 31 % à 69 %) peut rester calme, sombre ou flou : il est caché.
- Sur une fenêtre plus étroite, le cadre se rétrécit et l'image est recadrée sur les côtés. Garde l'essentiel dans les **60 % du milieu** (hors de la zone de la borne) et ne mets rien d'important dans les coins.

## Perspective (le point crucial)

- **Point de fuite unique, au centre**, derrière la borne. Toutes les lignes (allée, rails, rangées de guirlandes, bords des tentes) convergent vers ce point central.
- **Ligne d'horizon** : à environ **42 % de la hauteur** en partant du haut.
- **Vue** : à hauteur d'yeux d'un visiteur debout au bout d'une allée de fête foraine, caméra droite (pas d'angle penché).
- **Gauche et droite symétriques en perspective**, mais avec des attractions différentes pour ne pas faire un miroir.
- **Premier plan (bas, environ 25 % de la hauteur)** : un sol d'allée (dalles, planches ou bitume humide) qui se prolonge sans détail précis : l'image peut être rognée ou étirée en bas selon la hauteur du contenu de la page.
- **Ciel (haut, environ 25 %)** : crépuscule, dégradé simple, quelques étoiles ou lueurs.

## Contenu du décor (luna park)

À gauche et à droite, en perspective et de plus en plus petits vers le point de fuite :
- une grande roue (d'un côté), des montagnes russes avec rails lumineux (de l'autre) ;
- un manège, des chapiteaux rayés, des stands de jeux sans texte lisible ;
- des guirlandes d'ampoules tendues au-dessus de l'allée, des lanternes ;
- des lumières chaudes (orange, rose) et quelques touches de bleu et de violet.

Ambiance : nuit tombante, lumineuse mais sombre au centre, pour que les barres de vie, le marquee et les boutons de la borne restent lisibles.

## À éviter

- Aucun texte, aucune enseigne lisible, aucun logo.
- Aucun personnage ni boss (ils sont dans la borne).
- Aucun élément très lumineux ou très contrasté au centre (derrière la borne) : ça fatigue l'œil et gêne la lecture.
- Pas de grain ni de flou de mouvement marqué.
- Pas de bord noir, de cadre ni de vignette ajoutés à l'image.

## Test rapide de la composition

Avant de me l'envoyer, vérifie à l'œil : en cachant le tiers central de l'image (une bande de 38 % de large au milieu), il reste deux demi-décors lisibles, et leurs lignes pointent vers le centre caché.

## Ce que je ferai ensuite

Quand tu me donnes l'emplacement du fichier : je le compresse en WebP, je le mets sur R2, je le branche derrière la borne (couverture complète, centré) et je te le montre dans le jeu avant de pousser.
