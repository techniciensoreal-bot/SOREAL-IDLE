/* CHIEN (Norman, 2026-11-03 : « un vrai chien de profil », « il ne se retourne JAMAIS » : aucun miroir, le chien reste de profil, tourné vers le bouton, du début à la fin).
   Dessiné à la main, 24 colonnes x 15 rangées, de profil, tourné vers la DROITE. Lettres : W crème, X ambre, D brun, R rouge (collier), Y jaune (médaille), ' ' = point ÉTEINT (œil, truffe : un point noir se lit parfaitement sur le museau crème), '.' = vide.
   Tête crème carrée posée plus haut que le dos, museau qui dépasse vers l'avant, truffe éteinte, œil éteint entouré de crème, oreille brune qui pend du haut-arrière de la tête, collier rouge, corps ambre sur le dos et la croupe, blanc sur le ventre et le poitrail,
   quatre pattes de 2 colonnes (un vide entre l'avant et l'arrière : on voit le dessous du ventre), chaussettes blanches, pattes lointaines brunes, queue en crochet détachée du corps. */
var DOG_TETES=[
  ['.WWWWW...','DDDWWWW..','DDDW WW..','DDDWWWWW ','DDDWWWWWW','DD.WWWDDW'],    /* A : museau long à truffe éteinte au bout */
  ['..WWWW...','.DDWWWWW.','DDDW WWW.','DDDWWWWWW','DDDWWWWW ','.D.WWWDDW'],    /* B : tête plus ronde, museau plus bas */
  ['.WWWWW...','DDDWWWW..','DDDWWWW..','DDDW WWW ','DDDWWWWWW','DD.WWDDDW'],    /* C : œil plus bas, gueule plus marquée */
  ['.WWWWW...','DDDWWWWD.','DDDW W WD','DDDWWWW W','DDDWWWWWW','DD.WWDDW.']     /* trois-quarts : les deux oreilles, les deux yeux, la truffe décalée (pivot) */
];
function dogBuild(o){
  var Wd=24,Hd=15,g=[],i,j,by=o.by||0,hy=o.hy,ft=o.pas||0,tete=DOG_TETES[o.tete||0];
  for(j=0;j<Hd;j++){g.push([]);for(i=0;i<Wd;i++)g[j].push('.');}
  function p(c,r,ch){if(c>=0&&c<Wd&&r>=0&&r<Hd)g[r][c]=ch;}
  function rc(c0,r0,c1,r1,ch){var r,c;for(r=r0;r<=r1;r++)for(c=c0;c<=c1;c++)p(c,r,ch);}
  function leg(c0,top,coul,pied){var r;for(r=top;r<=12;r++)rc(c0,r,c0+1,r,coul);rc(c0,13,c0+1,13,pied);rc(c0,14,c0+2,14,pied);}   /* patte de 2 colonnes : jambe, chaussette, pied qui avance d'un point */
  leg(7+ft,11+by,'D','D');leg(11-ft,11+by,'D','D');                                /* pattes lointaines, brunes */
  if(!o.lift)leg(4-ft+(o.mi?1:0),o.mi?12:11+by,'X','W');                           /* patte arrière proche : ambre, chaussette blanche */
  leg(14+ft+(o.cp?1:0),11+by,'W','W');                                             /* patte avant proche : blanche */
  /* corps : croupe et selle ambre, ventre et poitrail blancs */
  rc(5,5+by,13,5+by,'X');rc(4,6+by,14,7+by,'X');rc(4,8+by,6,10+by,'X');
  rc(7,8+by,17,9+by,'W');rc(14,7+by,17,7+by,'W');rc(7,10+by,13,10+by,'D');rc(14,10+by,16,10+by,'W');
  if(hy>=6)rc(15,Math.min(6+by,hy)-0,18,hy+1,'W');                                  /* tête baissée : le cou descend jusqu'à elle */
  rc(15,6+by,17,6+by,'R');p(16,7+by,'Y');                                          /* collier rouge sur une rangée + médaille */
  var tq=o.queue?[[2,5],[2,4],[3,3],[4,3]]:[[2,5],[1,4],[1,3],[2,2]];             /* queue en crochet, détachée du corps d'un point ; elle frétille entre deux positions */
  tq.forEach(function(q){p(q[0],q[1]+by,'X');});
  tete.forEach(function(row,v){var u;for(u=0;u<9;u++){var ch=row.charAt(u);if(ch==='.')continue;p(15+u,hy+v,ch);}});
  if(o.lift){rc(4,10+by,6,11+by,'X');p(7,12,'X');p(8,12,'X');p(9,11,'D');p(10,10,'D');p(11,9,'D');p(12,9,'W');p(12,10,'W');p(13,9,'W');}   /* patte arrière levée : cuisse, genou plié, jambe ambre et pied blanc qui pointent vers l'avant (côté bouton) : cuisse ambre, genou, jambe brune qui monte, pied crème */
  return g.map(function(r){return r.join('');});
}
/* DE FACE (Norman, 2026-11-03 : « au moment de faire pipi, il doit se mettre FACE À NOUS, lever la patte arrière GAUCHE, le jet vient de là ») : vraies poses dessinées, jamais un miroir du profil ; le chien de face a sa patte arrière gauche (côté droit de l'écran, côté bouton) repliée et levée à 45 degrés ;
   tête crème avec deux oreilles brunes qui pendent de chaque côté, deux yeux éteints, truffe éteinte au centre bas du museau, collier rouge et médaille, poitrail blanc, pattes avant crème, taches ambres aux flancs, arrière-train visible derrière, queue en crochet d'un côté. */
function dogFace(o){
  var Wd=24,Hd=15,g=[],i,j,hl=o.hl==null?8:o.hl;
  for(j=0;j<Hd;j++){g.push([]);for(i=0;i<Wd;i++)g[j].push('.');}
  function p(c,r,ch){if(c>=0&&c<Wd&&r>=0&&r<Hd)g[r][c]=ch;}
  function rc(c0,r0,c1,r1,ch){var r,c;for(r=r0;r<=r1;r++)for(c=c0;c<=c1;c++)p(c,r,ch);}
  function tete(hl){                                                    /* tête de face : 8 colonnes, oreilles de chaque côté, yeux et truffe éteints */
    rc(hl+1,0,hl+6,0,'W');rc(hl,1,hl+7,3,'W');rc(hl+1,4,hl+6,4,'W');rc(hl+2,5,hl+5,5,'W');
    rc(hl-2,1,hl-1,4,'D');p(hl-1,5,'D');rc(hl+8,1,hl+9,4,'D');p(hl+8,5,'D');          /* oreilles brunes qui pendent */
    p(hl+2,2,' ');p(hl+5,2,' ');p(hl+3,4,' ');p(hl+4,4,' ');                          /* yeux et truffe : points éteints */
    p(hl+3,5,'D');p(hl+4,5,'D');                                                      /* gueule */
  }
  if(o.long){rc(3,6,hl,10,'X');rc(4,5,hl-3,5,'X');rc(4,11,5,12,'X');rc(4,13,5,13,'W');rc(3,14,5,14,'W');rc(7,11,8,14,'D');[[1,8],[0,7],[0,6],[1,5]].forEach(function(q){p(q[0],q[1],'X');});}   /* trois-quarts : le corps s'allonge vers l'arrière, 4 pattes en tout, queue en crochet détachée */
  /* pattes arrière : droite au sol (côté gauche de l'écran), gauche (côté bouton) selon la pose */
  var hx=hl-3;                                                                       /* position de la patte arrière droite */
  if(!o.long){rc(hx,11,hx+1,12,'X');rc(hx,13,hx+1,13,'W');rc(hx-1,14,hx+1,14,'W');}
  rc(hl-1,7,hl,10,'X');rc(hl+7,7,hl+8,10,'X');                                       /* taches ambre aux flancs */
  if(!o.long){rc(hl-3,9,hl-2,11,'X');if(!o.lift&&!o.mi)rc(hl+9,9,hl+10,11,'X');}      /* hanches vues derrière (la hanche gauche disparaît quand la patte se lève : la jambe part de là) */
  rc(hl+1,7,hl+6,9,'W');rc(hl+2,10,hl+5,10,'W');                                     /* poitrail blanc */
  rc(hl+1,6,hl+6,6,'R');p(hl+3,7,'Y');p(hl+4,7,'Y');                                 /* collier rouge et médaille jaune */
  rc(hl+1,11,hl+2,14,'W');rc(hl+5,11,hl+6,14,'W');rc(hl,14,hl+2,14,'W');rc(hl+5,14,hl+7,14,'W');   /* pattes avant crème, droites */
  var qx=hl-6;if(!o.long)[[qx+1,8],[qx,7],[qx,6],[qx+1,5]].forEach(function(q){p(q[0],q[1],'X');});   /* queue en crochet, d'un côté */
  var gx=hl+9;                                                                       /* patte arrière gauche (côté droit de l'écran, côté bouton) */
  /* patte levée : UN SEUL segment DROIT de 2 points de large, qui pivote autour de la hanche (16,5 ; 11) ; la couleur ne change que par bandes le long de l'axe : haut de la cuisse ambre, jambe brune, pied crème */
  function jambe(x1,y1){
    var x0=16.5,y0=11,n=Math.round(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))),raide=Math.abs(y1-y0)>=Math.abs(x1-x0),k,t,x,y,ch;
    for(k=0;k<=n;k++){t=k/n;x=x0+(x1-x0)*t;y=y0+(y1-y0)*t;ch=t<0.35?'X':t<0.75?'D':'W';
      if(raide){p(Math.floor(x),Math.round(y),ch);p(Math.floor(x)+1,Math.round(y),ch);}
      else{p(Math.round(x),Math.floor(y),ch);p(Math.round(x),Math.floor(y)+1,ch);}}
  }
  if(o.long){}
  else if(o.lift)jambe(21.5,1.5);                                                   /* tendue, droite en l'air : environ 62 degrés au-dessus de l'horizontale, 10 à 11 points */
  else if(o.mi)jambe(23.5,7);                                                       /* il la soulève : la même jambe droite, à environ 30 degrés */
  else{rc(gx,11,gx+1,12,'X');rc(gx,13,gx+1,13,'W');rc(gx,14,gx+2,14,'W');}
  tete(hl);
  return g.map(function(r){return r.join('');});
}
var DOGS=null;
/* poses : de profil a / b = renifle (museau près du sol, queue qui frétille, pas), arret = campé ; p1 / p2 = pivot (la tête se tourne de face, puis le corps) ; de face : face = campé, fmi = il soulève la patte arrière gauche, flevee = patte levée ; patteF = (colonne, rangée) juste sous le pied levé = origine du jet */
function dogsInit(){
  if(DOGS)return DOGS;
  var P9={a:{hy:8},b:{hy:7,queue:1,pas:1},arret:{hy:0,cp:1}},k,res={grand:{}};
  for(k in P9)res.grand[k]=dogBuild(P9[k]);
  res.grand.p1=dogBuild({hy:0,cp:1,tete:3});                                                  /* pivot 1 : la tête se tourne de trois-quarts (les deux oreilles, les deux yeux), le corps reste le même à 4 pattes */
  res.grand.p2=dogFace({long:1,hl:10});res.grand.face=dogFace({});res.grand.fmi=dogFace({mi:1});res.grand.flevee=dogFace({lift:1});
  res.grand.patte=[12,9];res.grand.patteF=[21,9];res.grand.larg=24;res.grand.haut=15;
  DOGS=res;return res;
}
