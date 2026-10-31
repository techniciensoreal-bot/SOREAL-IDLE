/*
 * SOREAL IDLE - queues des chats-etageres de la Garderie (2026-10-31). DONNEES SEULEMENT, generees PAR PIXEL a partir des images de skins (768 x 1152) : pour CHAQUE chat dont la queue est
 * visible et identifiable, un SPRITE de la queue (decoupe le long d'une ligne de jonction avec le corps, avec un leger recouvrement sous le corps pour cacher la couture), et un MASQUE (alpha 0
 * a l'emplacement de la queue, 255 ailleurs) applique a l'image du decor pour que la queue d'origine n'apparaisse jamais en double. La queue est ensuite un element anime par-dessus
 * (modules/etagere-personnage-v1.js) : balancement de quelques degres autour d'un pivot a sa racine. Pose de repos (0 %) = l'image d'origine. Les accessoires attaches a la queue (noeud rose, drapeau
 * du pirate, ruban) font partie du sprite et bougent avec elle. Chats SANS queue animee : tchernobyl (ses excroissances roses sont fondues dans la chair, pas une vraie queue).
 * window.__SOREAL_IDLE_ETAGERE_QUEUES_V1__ = { <id>: { sprite, masque, left, top, larg, haut, pivot:{x,y}, angle, duree, phase [, sous] } }
 *   left/top/larg/haut = boite du sprite en % de l'image ; pivot = % de la boite du sprite ; angle = degres (de part et d'autre du repos) ; duree = secondes pour un cycle complet ;
 *   phase = delai (secondes) avant le premier mouvement : la queue reste en pose de repos puis demarre (apres un changement d'apparence elle repart donc du repos, sans a-coup) ;
 *   sous = (fibonacci seulement : halo violet semi-transparent) petit calque place SOUS le decor qui comble le trou laisse par la queue.
 * Aucune logique ni etat (regles n3 et n4) : le dessin et l'animation sont dans etagere-personnage-v1.js.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_QUEUES_V1__)return;
  window.__SOREAL_IDLE_ETAGERE_QUEUES_V1__={
    defaut:{sprite:'/garderie/queues/defaut.webp',masque:'/garderie/queues/defaut-m.webp',left:76.432,top:4.34,larg:23.438,haut:16.927,pivot:{x:71.67,y:86.15},angle:2.5,duree:7,phase:0},
    noeud:{sprite:'/garderie/queues/noeud.webp',masque:'/garderie/queues/noeud-m.webp',left:77.474,top:13.976,larg:22.526,haut:14.67,pivot:{x:60.69,y:92.9},angle:2,duree:8,phase:1.7},
    arcenciel:{sprite:'/garderie/queues/arcenciel.webp',masque:'/garderie/queues/arcenciel-m.webp',left:79.297,top:8.247,larg:20.703,haut:28.559,pivot:{x:1.89,y:12.16},angle:2,duree:9,phase:3.1},
    fibonacci:{sprite:'/garderie/queues/fibonacci.webp',masque:'/garderie/queues/fibonacci-m.webp',left:86.458,top:7.031,larg:12.891,haut:29.861,pivot:{x:4.04,y:12.79},angle:2,duree:9,phase:4.3,sous:{image:'/garderie/queues/fibonacci-s.webp',left:86.589,top:6.771,larg:13.151,haut:30.382}},
    dore:{sprite:'/garderie/queues/dore.webp',masque:'/garderie/queues/dore-m.webp',left:79.297,top:7.118,larg:20.703,haut:36.545,pivot:{x:3.14,y:11.4},angle:2,duree:8.5,phase:2.2},
    matrix:{sprite:'/garderie/queues/matrix.webp',masque:'/garderie/queues/matrix-m.webp',left:77.604,top:9.722,larg:21.745,haut:32.812,pivot:{x:9.58,y:15.34},angle:2,duree:8,phase:5},
    chauvesouris:{sprite:'/garderie/queues/chauvesouris.webp',masque:'/garderie/queues/chauvesouris-m.webp',left:87.5,top:16.667,larg:12.5,haut:31.424,pivot:{x:39.58,y:6.35},angle:2,duree:9,phase:0.9},
    pirate:{sprite:'/garderie/queues/pirate.webp',masque:'/garderie/queues/pirate-m.webp',left:78.125,top:11.806,larg:21.875,haut:22.569,pivot:{x:80.36,y:98.46},angle:2,duree:7.5,phase:2.8},
    noel:{sprite:'/garderie/queues/noel.webp',masque:'/garderie/queues/noel-m.webp',left:80.99,top:10.677,larg:18.88,haut:24.74,pivot:{x:77.93,y:97.89},angle:1.6,duree:8,phase:3.6},
    nega:{sprite:'/garderie/queues/nega.webp',masque:'/garderie/queues/nega-m.webp',left:82.812,top:11.719,larg:17.188,haut:38.976,pivot:{x:14.39,y:5.57},angle:2,duree:8.5,phase:1.2}
  };
})();
