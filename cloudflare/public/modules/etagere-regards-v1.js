/*
 * SOREAL IDLE — regards des chats-étagères de la Garderie (2026-10-31, planche de pupilles validée par Norman). DONNÉES SEULEMENT : un SPRITE de regard par œil (iris + pupille + reflets), généré par PIXEL
 * (iris = 0,8 x la hauteur du blanc ; couleurs, formes de pupille et variantes par œil de la planche : defaut gris-bleu, noeud violet/rose fendu, arcenciel anneaux, fibonacci spirale, dore fente, matrix rectangle et glyphes,
 * chauvesouris rouge, tchernobyl jaune-vert irrégulier + un œil orange, pirate ambre, noel vert, nega croissant). Fichiers : /garderie/yeux/<id>-<n>.webp.
 * window.__SOREAL_IDLE_ETAGERE_REGARDS_V1__ = { <id>: [ {left,top,larg,haut,image} ] } : même ordre que etagere-paupieres-v1.js ; boîte du disque d'iris en % de l'image.
 * Le regard est CLIPPÉ au masque exact du blanc (alpha du sprite de paupière) par etagere-personnage-v1.js : rien ne sort du blanc, même au bout de la course de la bille. Aucune logique ni état.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_REGARDS_V1__)return;
  window.__SOREAL_IDLE_ETAGERE_REGARDS_V1__={
    defaut:[
      {left:33.26,top:16.503,larg:7.747,haut:5.165,image:'/garderie/yeux/defaut-0.webp'},
      {left:57.64,top:16.6,larg:7.617,haut:5.078,image:'/garderie/yeux/defaut-1.webp'}
    ],
    noeud:[
      {left:35.339,top:24.889,larg:7.227,haut:4.818,image:'/garderie/yeux/noeud-0.webp'},
      {left:57.995,top:24.889,larg:7.227,haut:4.818,image:'/garderie/yeux/noeud-1.webp'}
    ],
    arcenciel:[
      {left:16.138,top:17.761,larg:7.292,haut:4.905,image:'/garderie/yeux/arcenciel-0.webp'},
      {left:35.575,top:18.326,larg:7.747,haut:5.165,image:'/garderie/yeux/arcenciel-1.webp'}
    ],
    fibonacci:[
      {left:8.125,top:13.403,larg:5.794,haut:3.863,image:'/garderie/yeux/fibonacci-0.webp'},
      {left:19.805,top:14.154,larg:6.51,haut:4.34,image:'/garderie/yeux/fibonacci-1.webp'},
      {left:33.797,top:15.76,larg:3.906,haut:2.604,image:'/garderie/yeux/fibonacci-2.webp'},
      {left:41.354,top:16.229,larg:4.427,haut:2.951,image:'/garderie/yeux/fibonacci-3.webp'},
      {left:50.536,top:17.632,larg:2.539,haut:1.693,image:'/garderie/yeux/fibonacci-4.webp'},
      {left:55.146,top:17.948,larg:2.865,haut:1.866,image:'/garderie/yeux/fibonacci-5.webp'},
      {left:60.753,top:18.713,larg:1.693,haut:1.128,image:'/garderie/yeux/fibonacci-6.webp'},
      {left:63.635,top:18.964,larg:1.758,haut:1.215,image:'/garderie/yeux/fibonacci-7.webp'},
      {left:66.836,top:19.46,larg:1.237,haut:0.781,image:'/garderie/yeux/fibonacci-8.webp'},
      {left:68.513,top:19.546,larg:1.172,haut:0.781,image:'/garderie/yeux/fibonacci-9.webp'}
    ],
    dore:[
      {left:24.758,top:14.089,larg:8.919,haut:5.946,image:'/garderie/yeux/dore-0.webp'},
      {left:55.618,top:14.275,larg:9.18,haut:6.163,image:'/garderie/yeux/dore-1.webp'}
    ],
    matrix:[
      {left:33.193,top:15.228,larg:8.789,haut:5.859,image:'/garderie/yeux/matrix-0.webp'},
      {left:59.576,top:15.976,larg:8.724,haut:5.816,image:'/garderie/yeux/matrix-1.webp'}
    ],
    chauvesouris:[
      {left:32.846,top:15.884,larg:7.487,haut:4.948,image:'/garderie/yeux/chauvesouris-0.webp'},
      {left:59.148,top:15.884,larg:7.487,haut:4.948,image:'/garderie/yeux/chauvesouris-1.webp'}
    ],
    tchernobyl:[
      {left:4.492,top:12.217,larg:5.078,haut:3.342,image:'/garderie/yeux/tchernobyl-0.webp'},
      {left:16.513,top:13.64,larg:5.534,haut:3.689,image:'/garderie/yeux/tchernobyl-1.webp'},
      {left:32.724,top:12.899,larg:7.357,haut:4.905,image:'/garderie/yeux/tchernobyl-2.webp'},
      {left:61.627,top:12.92,larg:7.096,haut:4.731,image:'/garderie/yeux/tchernobyl-3.webp'},
      {left:80.802,top:14.486,larg:5.339,haut:3.559,image:'/garderie/yeux/tchernobyl-4.webp'},
      {left:91.578,top:12.53,larg:4.492,haut:2.995,image:'/garderie/yeux/tchernobyl-5.webp'}
    ],
    pirate:[
      {left:59.169,top:16.38,larg:9.375,haut:6.293,image:'/garderie/yeux/pirate-0.webp'}
    ],
    noel:[
      {left:14.13,top:15.144,larg:7.031,haut:4.688,image:'/garderie/yeux/noel-0.webp'},
      {left:34.235,top:16.099,larg:7.031,haut:4.688,image:'/garderie/yeux/noel-1.webp'}
    ],
    nega:[
      {left:23.164,top:17.451,larg:8.724,haut:5.816,image:'/garderie/yeux/nega-0.webp'},
      {left:57.281,top:17.451,larg:8.724,haut:5.816,image:'/garderie/yeux/nega-1.webp'}
    ]
  };
})();
