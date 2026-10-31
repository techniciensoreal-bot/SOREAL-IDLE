/*
 * SOREAL IDLE — données géométriques des 11 skins de la Garderie (chats-étagères 768 x 1152, images sur R2 : idle/garderie-skins/<id>.webp).
 * DONNÉES SEULEMENT, mesurées sur les images par cloudflare/tools/mesurer-skins-garderie.py (ovales blancs = composantes connexes très claires du tiers haut ; planches mesurées sur le profil de luminosité)
 * puis vérifiées à l'œil sur une superposition (pupilles, paupière à moitié fermée, 6 emplacements) : tout est en % de l'image.
 * window.__SOREAL_IDLE_ETAGERE_SKINS_V1__ = { ordre:[ids], skins:{ id:{ image, yeux, pupille, paupiere, pots } } }
 *   yeux     : [{left,top,larg,haut,cote:'g'|'d',couleur}] ovales blancs ouverts (même repère que oeil_() d'etagere-personnage-v1.js : left/top/width/height en %) ; cote = 'g' ou 'd' DANS SA TÊTE
 *              (la classe et la boucle de l'œil : et-og / et-od), couleur = pelage autour de l'œil, pour la paupière de CET œil. yeux:[] = aucun ovale ouvert (aucun skin n'est dans ce cas).
 *              Particularités : pirate = 1 seul ovale (l'autre œil est sous le cache-œil) ; fibonacci = 6 ovales (3 têtes imbriquées, de la grande à la minuscule) ;
 *              tchernobyl = 6 (tête gauche, tête centrale, tête droite) ; noel = paupières orange (la tache du pelage) ; les autres = 2.
 *   pupille  : fraction de la HAUTEUR de l'ovale (0,28 : .et-iris height:28 %, centrée dans l'ovale).
 *   paupiere : couleur par défaut de la paupière (celle du 1er œil) ; la paupière épouse l'ovale (border-radius:50 % + overflow:hidden de .et-oeil, comme aujourd'hui).
 *   pots     : même logique que daycare-page-v1.js (positionPlace) : haut/larg = HAUT_POT/LARG_POT (% de l'image), compartiments[c] = { sol (ligne de la planche, bas du bocal), gauche/droite (largeur utile du
 *              compartiment), cx:[centre bocal 0, centre bocal 1] }, places[i] pour i = 0..5 dans l'ordre PLACES de daycare (haut en bas, 2 par compartiment) = { cx, sol, echelle } ; axe = centre de l'intérieur.
 * Branchement (à faire dans daycare-page-v1.js, pas ici) : au lieu des constantes SOLS/HAUT_POT/LARG_POT/CENTRES/AXE,
 *   const S=window.__SOREAL_IDLE_ETAGERE_SKINS_V1__.skins[idSkin].pots, p=S.places[i];
 *   top = p.sol - S.haut*p.echelle ; left = p.cx - S.larg*p.echelle/2 ; largeur/hauteur du bocal = S.larg*echelle / S.haut*echelle.
 *   Yeux : etagere-personnage-v1.js appelle oeil_() une fois par entrée de yeux (iris = pupille x hauteur de l'ovale, couleur de paupière = couleur de l'entrée).
 * Aucune logique, aucun état : le module ne touche pas à la page (règles n°3 et n°4 : rien à animer ni à redessiner ici).
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_SKINS_V1__)return;
  var ORDRE=['defaut','noeud','arcenciel','fibonacci','dore','matrix','chauvesouris','tchernobyl','pirate','noel','nega'];
  var SKINS={
    defaut:{image:'/api/idle/media/garderie-skin?id=defaut',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':32.03,'top':16.32,'larg':8.85,'haut':4.69,'cote':'g','couleur':'#faefe1'},
        {'left':56.64,'top':16.41,'larg':8.72,'haut':4.77,'cote':'d','couleur':'#faefe1'}
      ],
      pupille:0.28,paupiere:'#faefe1',
      pots:{haut:13.8,larg:13.2,axe:49.61,
        compartiments:[
          {'sol':46.53,'gauche':17.32,'droite':81.9,'cx':[35.4,63.82]},
          {'sol':65.45,'gauche':17.32,'droite':81.9,'cx':[35.4,63.82]},
          {'sol':83.07,'gauche':17.32,'droite':81.9,'cx':[35.4,63.82]}
        ],
        places:[{'cx':35.4,'sol':46.53,'echelle':1},{'cx':63.82,'sol':46.53,'echelle':1},{'cx':35.4,'sol':65.45,'echelle':1},{'cx':63.82,'sol':65.45,'echelle':1},{'cx':35.4,'sol':83.07,'echelle':1},{'cx':63.82,'sol':83.07,'echelle':1}]}},
    noeud:{image:'/api/idle/media/garderie-skin?id=noeud',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':34.38,'top':24.74,'larg':8.2,'haut':4.43,'cote':'g','couleur':'#f5e8dc'},
        {'left':57.03,'top':24.74,'larg':8.2,'haut':4.51,'cote':'d','couleur':'#f5e8dc'}
      ],
      pupille:0.28,paupiere:'#f5e8dc',
      pots:{haut:13.8,larg:13.2,axe:50.91,
        compartiments:[
          {'sol':52.43,'gauche':19.79,'droite':82.03,'cx':[37.22,64.6]},
          {'sol':69.27,'gauche':19.79,'droite':82.03,'cx':[37.22,64.6]},
          {'sol':85.24,'gauche':19.79,'droite':82.03,'cx':[37.22,64.6]}
        ],
        places:[{'cx':37.22,'sol':52.43,'echelle':1},{'cx':64.6,'sol':52.43,'echelle':1},{'cx':37.22,'sol':69.27,'echelle':1},{'cx':64.6,'sol':69.27,'echelle':1},{'cx':37.22,'sol':85.24,'echelle':1},{'cx':64.6,'sol':85.24,'echelle':1}]}},
    arcenciel:{image:'/api/idle/media/garderie-skin?id=arcenciel',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':14.97,'top':17.8,'larg':9.51,'haut':4.86,'cote':'g','couleur':'#9c8c84'},
        {'left':34.38,'top':18.23,'larg':10.16,'haut':5.3,'cote':'d','couleur':'#9b8a82'}
      ],
      pupille:0.28,paupiere:'#9c8c84',
      pots:{haut:13.8,larg:13.2,axe:49.74,
        compartiments:[
          {'sol':45.83,'gauche':16.15,'droite':83.33,'cx':[34.96,64.52]},
          {'sol':64.76,'gauche':16.15,'droite':83.33,'cx':[34.96,64.52]},
          {'sol':82.47,'gauche':16.15,'droite':83.33,'cx':[34.96,64.52]}
        ],
        places:[{'cx':34.96,'sol':45.83,'echelle':1},{'cx':64.52,'sol':45.83,'echelle':1},{'cx':34.96,'sol':64.76,'echelle':1},{'cx':64.52,'sol':64.76,'echelle':1},{'cx':34.96,'sol':82.47,'echelle':1},{'cx':64.52,'sol':82.47,'echelle':1}]}},
    fibonacci:{image:'/api/idle/media/garderie-skin?id=fibonacci',
      /* 6 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':7.68,'top':13.11,'larg':6.64,'haut':4.34,'cote':'g','couleur':'#38215f'},
        {'left':18.75,'top':13.8,'larg':8.59,'haut':4.77,'cote':'d','couleur':'#291b50'},
        {'left':33.59,'top':15.62,'larg':4.43,'haut':2.69,'cote':'g','couleur':'#311e57'},
        {'left':40.89,'top':16.06,'larg':5.21,'haut':3.12,'cote':'d','couleur':'#271b4e'},
        {'left':50.52,'top':17.62,'larg':2.6,'haut':1.74,'cote':'g','couleur':'#341e5d'},
        {'left':55.08,'top':17.88,'larg':3.12,'haut':1.91,'cote':'d','couleur':'#271c4f'}
      ],
      pupille:0.28,paupiere:'#38215f',
      pots:{haut:13.8,larg:13.2,axe:50.0,
        compartiments:[
          {'sol':44.88,'gauche':17.06,'droite':82.94,'cx':[35.51,64.49]},
          {'sol':64.15,'gauche':17.06,'droite':82.94,'cx':[35.51,64.49]},
          {'sol':81.77,'gauche':17.06,'droite':82.94,'cx':[35.51,64.49]}
        ],
        places:[{'cx':35.51,'sol':44.88,'echelle':1},{'cx':64.49,'sol':44.88,'echelle':1},{'cx':35.51,'sol':64.15,'echelle':1},{'cx':64.49,'sol':64.15,'echelle':1},{'cx':35.51,'sol':81.77,'echelle':1},{'cx':64.49,'sol':81.77,'echelle':1}]}},
    dore:{image:'/api/idle/media/garderie-skin?id=dore',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':23.05,'top':13.63,'larg':11.2,'haut':6.25,'cote':'g','couleur':'#f8bf15'},
        {'left':53.91,'top':13.89,'larg':11.33,'haut':6.34,'cote':'d','couleur':'#f2a70a'}
      ],
      pupille:0.28,paupiere:'#f8bf15',
      pots:{haut:13.8,larg:13.2,axe:49.35,
        compartiments:[
          {'sol':45.49,'gauche':16.15,'droite':82.55,'cx':[34.74,63.96]},
          {'sol':65.02,'gauche':16.15,'droite':82.55,'cx':[34.74,63.96]},
          {'sol':82.64,'gauche':16.15,'droite':82.55,'cx':[34.74,63.96]}
        ],
        places:[{'cx':34.74,'sol':45.49,'echelle':1},{'cx':63.96,'sol':45.49,'echelle':1},{'cx':34.74,'sol':65.02,'echelle':1},{'cx':63.96,'sol':65.02,'echelle':1},{'cx':34.74,'sol':82.64,'echelle':1},{'cx':63.96,'sol':82.64,'echelle':1}]}},
    matrix:{image:'/api/idle/media/garderie-skin?id=matrix',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':31.12,'top':14.84,'larg':12.11,'haut':5.99,'cote':'g','couleur':'#1f8138'},
        {'left':57.68,'top':15.54,'larg':11.85,'haut':6.08,'cote':'d','couleur':'#1f8138'}
      ],
      pupille:0.28,paupiere:'#1f8138',
      pots:{haut:13.8,larg:13.2,axe:50.0,
        compartiments:[
          {'sol':46.44,'gauche':17.06,'droite':82.94,'cx':[35.51,64.49]},
          {'sol':65.02,'gauche':17.06,'droite':82.94,'cx':[35.51,64.49]},
          {'sol':83.25,'gauche':17.06,'droite':82.94,'cx':[35.51,64.49]}
        ],
        places:[{'cx':35.51,'sol':46.44,'echelle':1},{'cx':64.49,'sol':46.44,'echelle':1},{'cx':35.51,'sol':65.02,'echelle':1},{'cx':64.49,'sol':65.02,'echelle':1},{'cx':35.51,'sol':83.25,'echelle':1},{'cx':64.49,'sol':83.25,'echelle':1}]}},
    chauvesouris:{image:'/api/idle/media/garderie-skin?id=chauvesouris',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':31.38,'top':15.71,'larg':10.03,'haut':4.69,'cote':'g','couleur':'#1f1b20'},
        {'left':57.55,'top':15.71,'larg':9.9,'haut':4.6,'cote':'d','couleur':'#1f1b20'}
      ],
      pupille:0.28,paupiere:'#1f1b20',
      pots:{haut:13.8,larg:13.2,axe:50.13,
        compartiments:[
          {'sol':45.75,'gauche':17.32,'droite':82.94,'cx':[35.69,64.57]},
          {'sol':65.1,'gauche':17.32,'droite':82.94,'cx':[35.69,64.57]},
          {'sol':82.81,'gauche':17.32,'droite':82.94,'cx':[35.69,64.57]}
        ],
        places:[{'cx':35.69,'sol':45.75,'echelle':1},{'cx':64.57,'sol':45.75,'echelle':1},{'cx':35.69,'sol':65.1,'echelle':1},{'cx':64.57,'sol':65.1,'echelle':1},{'cx':35.69,'sol':82.81,'echelle':1},{'cx':64.57,'sol':82.81,'echelle':1}]}},
    tchernobyl:{image:'/api/idle/media/garderie-skin?id=tchernobyl',
      /* 6 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':4.43,'top':12.07,'larg':5.21,'haut':3.12,'cote':'g','couleur':'#c17756'},
        {'left':16.02,'top':13.45,'larg':6.12,'haut':3.3,'cote':'d','couleur':'#a25540'},
        {'left':31.9,'top':12.67,'larg':8.59,'haut':4.86,'cote':'g','couleur':'#b06348'},
        {'left':61.33,'top':12.67,'larg':8.33,'haut':4.69,'cote':'d','couleur':'#aa5a40'},
        {'left':80.6,'top':14.32,'larg':5.99,'haut':3.12,'cote':'g','couleur':'#a65e3f'},
        {'left':91.8,'top':12.41,'larg':3.91,'haut':2.69,'cote':'d','couleur':'#8b473c'}
      ],
      pupille:0.28,paupiere:'#c17756',
      pots:{haut:13.8,larg:13.2,axe:49.28,
        compartiments:[
          {'sol':45.75,'gauche':16.28,'droite':82.29,'cx':[34.76,63.81]},
          {'sol':65.02,'gauche':16.28,'droite':82.29,'cx':[34.76,63.81]},
          {'sol':82.81,'gauche':16.28,'droite':82.29,'cx':[34.76,63.81]}
        ],
        places:[{'cx':34.76,'sol':45.75,'echelle':1},{'cx':63.81,'sol':45.75,'echelle':1},{'cx':34.76,'sol':65.02,'echelle':1},{'cx':63.81,'sol':65.02,'echelle':1},{'cx':34.76,'sol':82.81,'echelle':1},{'cx':63.81,'sol':82.81,'echelle':1}]}},
    pirate:{image:'/api/idle/media/garderie-skin?id=pirate',
      /* 1 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':57.42,'top':16.06,'larg':11.98,'haut':6.51,'cote':'d','couleur':'#d46d10'}
      ],
      pupille:0.28,paupiere:'#d46d10',
      pots:{haut:13.8,larg:13.2,axe:46.94,
        compartiments:[
          {'sol':46.09,'gauche':18.23,'droite':75.65,'cx':[34.31,59.57]},
          {'sol':65.02,'gauche':18.23,'droite':75.65,'cx':[34.31,59.57]},
          {'sol':82.64,'gauche':18.23,'droite':75.65,'cx':[34.31,59.57]}
        ],
        places:[{'cx':34.31,'sol':46.09,'echelle':1},{'cx':59.57,'sol':46.09,'echelle':1},{'cx':34.31,'sol':65.02,'echelle':1},{'cx':59.57,'sol':65.02,'echelle':1},{'cx':34.31,'sol':82.64,'echelle':1},{'cx':59.57,'sol':82.64,'echelle':1}]}},
    noel:{image:'/api/idle/media/garderie-skin?id=noel',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':13.15,'top':15.02,'larg':8.46,'haut':4.77,'cote':'g','couleur':'#d57c26'},
        {'left':33.33,'top':15.97,'larg':8.72,'haut':4.69,'cote':'d','couleur':'#bb671d'}
      ],
      pupille:0.28,paupiere:'#d57c26',
      pots:{haut:13.8,larg:13.2,axe:49.48,
        compartiments:[
          {'sol':45.83,'gauche':17.32,'droite':81.64,'cx':[35.33,63.63]},
          {'sol':65.02,'gauche':17.32,'droite':81.64,'cx':[35.33,63.63]},
          {'sol':82.81,'gauche':17.32,'droite':81.64,'cx':[35.33,63.63]}
        ],
        places:[{'cx':35.33,'sol':45.83,'echelle':1},{'cx':63.63,'sol':45.83,'echelle':1},{'cx':35.33,'sol':65.02,'echelle':1},{'cx':63.63,'sol':65.02,'echelle':1},{'cx':35.33,'sol':82.81,'echelle':1},{'cx':63.63,'sol':82.81,'echelle':1}]}},
    nega:{image:'/api/idle/media/garderie-skin?id=nega',
      /* 2 ovale(s) blanc(s) mesurés (cloudflare/tools/mesurer-skins-garderie.py) ; couleur = pelage autour de l'œil */
      yeux:[
        {'left':21.61,'top':17.27,'larg':11.72,'haut':6.25,'cote':'g','couleur':'#080706'},
        {'left':55.73,'top':17.27,'larg':12.24,'haut':6.34,'cote':'d','couleur':'#080706'}
      ],
      pupille:0.28,paupiere:'#080706',
      pots:{haut:13.8,larg:13.2,axe:48.7,
        compartiments:[
          {'sol':45.4,'gauche':16.02,'droite':81.38,'cx':[34.32,63.08]},
          {'sol':64.76,'gauche':16.02,'droite':81.38,'cx':[34.32,63.08]},
          {'sol':82.64,'gauche':16.02,'droite':81.38,'cx':[34.32,63.08]}
        ],
        places:[{'cx':34.32,'sol':45.4,'echelle':1},{'cx':63.08,'sol':45.4,'echelle':1},{'cx':34.32,'sol':64.76,'echelle':1},{'cx':63.08,'sol':64.76,'echelle':1},{'cx':34.32,'sol':82.64,'echelle':1},{'cx':63.08,'sol':82.64,'echelle':1}]}}
  };
  window.__SOREAL_IDLE_ETAGERE_SKINS_V1__={ordre:ORDRE,skins:SKINS};
})();
