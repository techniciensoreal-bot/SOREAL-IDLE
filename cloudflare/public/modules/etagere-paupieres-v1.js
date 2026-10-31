/*
 * SOREAL IDLE — paupières des chats-étagères de la Garderie (2026-10-31). DONNÉES SEULEMENT, générées PAR PIXEL à partir des 11 images de skins (768 x 1152) : pour CHAQUE œil, le masque exact du blanc
 * (composante connexe claire jusqu'au trait noir d'ourlet de l'œil, antialiasing compris) et un petit sprite de paupière à ce masque, rempli du pelage réellement voisin (dégradé reconstitué autour de l'œil)
 * avec un trait noir épais sur le bord qui descend. Les sprites sont dans /garderie/paupieres/<id>-<n>.webp ; l'alpha du sprite sert AUSSI de masque à l'œil (la pupille ne déborde jamais du blanc).
 * window.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__ = { <id>: [ {left,top,larg,haut,image} ] } dans le même ordre que `yeux` de etagere-skins-v1.js ; left/top/larg/haut = boîte du masque, en % de l'image.
 * Tchernobyl (Norman, 2026-10-31) : DEUX paupières par œil qui se rejoignent au milieu (moitié gauche et moitié droite du masque) : {moitie, images:[gauche, droite]}, moitie = largeur de la moitié gauche en % de la boîte.
 * Fibonacci : 10 yeux (les 6 ovales de etagere-skins-v1.js + les 4 des têtes 4 et 5 détectés sur l'image, avec `cote`) ; le module personnage prend cette liste quand elle est plus longue que `yeux`.
 * Fibonacci : 10 yeux (les 6 ovales de etagere-skins-v1.js + les 4 des têtes 4 et 5 détectés sur l'image, avec `cote`) ; `tete` = rang de la tête (de la grande à la plus petite) : les paupières clignent en vague, une tête après l'autre. ; le module personnage prend cette liste quand elle est plus longue que `yeux`.
 * Fibonacci : 10 yeux (les 6 ovales de etagere-skins-v1.js + les 4 des têtes 4 et 5 détectés sur l'image, avec `cote`) ; `tete` = rang de la tête (de la grande à la plus petite) : les paupières clignent en vague, une tête après l'autre. ; le module personnage prend cette liste quand elle est plus longue que `yeux`.
 * Aucune logique ni état (règles n°3 et n°4) : le dessin et l'animation sont dans etagere-personnage-v1.js.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__)return;
  window.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__={
    defaut:[
      {left:31.38,top:15.885,larg:11.458,haut:6.424,image:'/garderie/paupieres/defaut-0.webp'},
      {left:55.859,top:15.972,larg:11.198,haut:6.337,image:'/garderie/paupieres/defaut-1.webp'}
    ],
    noeud:[
      {left:33.724,top:24.306,larg:10.417,haut:5.99,image:'/garderie/paupieres/noeud-0.webp'},
      {left:56.38,top:24.306,larg:10.417,haut:5.99,image:'/garderie/paupieres/noeud-1.webp'}
    ],
    arcenciel:[
      {left:14.062,top:17.188,larg:11.458,haut:6.076,image:'/garderie/paupieres/arcenciel-0.webp'},
      {left:33.333,top:17.708,larg:12.24,haut:6.424,image:'/garderie/paupieres/arcenciel-1.webp'}
    ],
    fibonacci:[
      {left:7.422,top:12.934,larg:7.161,haut:4.774,tete:0,image:'/garderie/paupieres/fibonacci-0.webp'},
      {left:18.49,top:13.628,larg:9.115,haut:5.382,tete:0,image:'/garderie/paupieres/fibonacci-1.webp'},
      {left:33.333,top:15.451,larg:4.818,haut:3.212,tete:1,image:'/garderie/paupieres/fibonacci-2.webp'},
      {left:40.625,top:15.885,larg:5.859,haut:3.646,tete:1,image:'/garderie/paupieres/fibonacci-3.webp'},
      {left:50.26,top:17.448,larg:3.125,haut:2.083,tete:2,image:'/garderie/paupieres/fibonacci-4.webp'},
      {left:54.688,top:17.708,larg:3.776,haut:2.344,tete:2,image:'/garderie/paupieres/fibonacci-5.webp'},
      {left:60.547,top:18.576,larg:2.083,haut:1.389,tete:3,cote:'g',image:'/garderie/paupieres/fibonacci-6.webp'},
      {left:63.281,top:18.837,larg:2.474,haut:1.476,tete:3,cote:'d',image:'/garderie/paupieres/fibonacci-7.webp'},
      {left:66.797,top:19.358,larg:1.302,haut:0.955,tete:4,cote:'g',image:'/garderie/paupieres/fibonacci-8.webp'},
      {left:68.359,top:19.444,larg:1.432,haut:0.955,tete:4,cote:'d',image:'/garderie/paupieres/fibonacci-9.webp'}
    ],
    dore:[
      {left:22.526,top:13.368,larg:13.411,haut:7.378,image:'/garderie/paupieres/dore-0.webp'},
      {left:53.516,top:13.542,larg:13.411,haut:7.639,image:'/garderie/paupieres/dore-1.webp'}
    ],
    matrix:[
      {left:30.469,top:14.497,larg:14.193,haut:7.292,image:'/garderie/paupieres/matrix-0.webp'},
      {left:56.901,top:15.278,larg:14.062,haut:7.205,image:'/garderie/paupieres/matrix-1.webp'}
    ],
    chauvesouris:[
      {left:29.948,top:15.278,larg:13.281,haut:6.163,image:'/garderie/paupieres/chauvesouris-0.webp'},
      {left:56.25,top:15.278,larg:13.281,haut:6.163,image:'/garderie/paupieres/chauvesouris-1.webp'}
    ],
    tchernobyl:[
      {left:3.776,top:11.806,larg:6.51,haut:4.167,moitie:50.0,images:['/garderie/paupieres/tchernobyl-0-g.webp','/garderie/paupieres/tchernobyl-0-d.webp']},
      {left:15.104,top:13.194,larg:8.333,haut:4.601,moitie:50.0,images:['/garderie/paupieres/tchernobyl-1-g.webp','/garderie/paupieres/tchernobyl-1-d.webp']},
      {left:30.599,top:12.326,larg:11.589,haut:6.076,moitie:49.438,images:['/garderie/paupieres/tchernobyl-2-g.webp','/garderie/paupieres/tchernobyl-2-d.webp']},
      {left:59.635,top:12.326,larg:11.068,haut:5.903,moitie:49.412,images:['/garderie/paupieres/tchernobyl-3-g.webp','/garderie/paupieres/tchernobyl-3-d.webp']},
      {left:79.427,top:14.062,larg:8.073,haut:4.427,moitie:50.0,images:['/garderie/paupieres/tchernobyl-4-g.webp','/garderie/paupieres/tchernobyl-4-d.webp']},
      {left:91.276,top:12.153,larg:5.078,haut:3.733,moitie:48.718,images:['/garderie/paupieres/tchernobyl-5-g.webp','/garderie/paupieres/tchernobyl-5-d.webp']}
    ],
    pirate:[
      {left:56.771,top:15.625,larg:14.193,haut:7.812,image:'/garderie/paupieres/pirate-0.webp'}
    ],
    noel:[
      {left:12.5,top:14.583,larg:10.286,haut:5.816,image:'/garderie/paupieres/noel-0.webp'},
      {left:32.292,top:15.538,larg:10.938,haut:5.816,image:'/garderie/paupieres/noel-1.webp'}
    ],
    nega:[
      {left:20.703,top:16.753,larg:13.672,haut:7.205,image:'/garderie/paupieres/nega-0.webp'},
      {left:54.557,top:16.753,larg:14.193,haut:7.205,image:'/garderie/paupieres/nega-1.webp'}
    ]
  };
})();
