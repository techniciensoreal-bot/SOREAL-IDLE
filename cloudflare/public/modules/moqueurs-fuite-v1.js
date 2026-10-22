/*
 * SOREAL IDLE — les trois moqueurs de la « Fuite » (Norman, 2026-10-22 : « trois personnes qui apparaissent du bas de l'écran en glissant vers le centre, en nous pointant du doigt, avec des HAHA ; plus grands, au premier plan,
 * coupés à la ceinture ; animés ; et ils repartent vers le bas, un tout petit peu plus vite »).
 *
 * Quand on prend la fuite en plein combat de boss, trois spectateurs en gros pixels jaillissent du bas de TOUT l'écran du duel (devant la photo du boss ET la photo du joueur ; Norman : « ils prennent tout l'écran »), coupés à la ceinture par le bord de l'écran, sautillent, se balancent, renversent la tête de rire, nous pointent du
 * doigt en piquant, se tapent le ventre ; des bulles « HAHA » éclatent au-dessus d'eux ; puis ils redescendent et quittent l'écran par le bas. Les sons restent ceux du jeu (« wah-wah » de fuite + rires, voir __fuirBossIdleV1__).
 * Le calque est AJOUTÉ à la borne : data-morph-garder (règle n°4 d'AGENTS.md), un redessin de la page ne le retire pas. Aucun effet avec « réduire les animations ». Durée : 4,3 s.
 *   window.__SOREAL_IDLE_MOQUEURS_V1__ = { jouer(hote) -> bool, scene(ctx, t, LW, LH), duree }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MOQUEURS_V1__)return;

  var LH0=160;              /* définition de l'écran : 160 gros pixels de HAUT ; la largeur suit la forme de l'arène */
  var ENTREE=0.45,FIN=1.7,SORTIE=0.38,DUREE=2.5;   /* Norman (2026-10-22) : à l'écran le temps du rire du jeu (≈ 2,2 s), pas plus */

  /* ---------- police 5×7 (H et A suffisent pour « HA » / « HAHA ») ---------- */
  var G={
    A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
    H:['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
    ' ':['.....','.....','.....','.....','.....','.....','.....']
  };
  function larg(t,e){return t.length*6*e-e;}
  function texte(c,t,x,y,e,couleur){
    var x0=Math.round(x-larg(t,e)/2);
    for(var i=0;i<t.length;i++){var g=G[t[i]];if(!g)continue;for(var r=0;r<7;r++)for(var k=0;k<5;k++){if(g[r][k]!=='#')continue;c.fillStyle=couleur;c.fillRect(x0+i*6*e+k*e,y+r*e,e,e);}}
  }
  function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

  /* ---------- une personne en pixels, animée (pieds en (x,y)) ---------- */
  var PEAUX=['#f2c9a0','#c98f5b','#7b4a26'];
  var CHEMISES=['#c0392b','#2e86de','#f39c12'];
  var CHEVEUX=['#2b1b0e','#d8b24a','#1b1b1b'];
  function personne(c,x,y,s,t,g,mode){
    var peau=PEAUX[g%3],chem=CHEMISES[g%3],chev=CHEVEUX[(g+1)%3];
    var ph=g*1.9;
    var rire=Math.sin(t*14+ph),gros=rire>0.3;                              /* éclat de rire */
    var rebond=Math.abs(Math.sin(t*7+ph))*s*1.4;                            /* ils sautillent */
    var xb=x+Math.sin(t*3+ph)*s*0.8,yb=y-rebond;                            /* ils se balancent */
    var jab=0.5+0.5*Math.sin(t*9.5+ph*1.3);                                 /* le doigt piqué vers nous */
    var ep=gros?s*0.6:0;                                                    /* épaules secouées */
    rect(c,xb-4*s,yb-11*s-ep,8*s,7*s+ep,chem);
    rect(c,xb-4*s,yb-5*s,8*s,s,'#1e2233');                                   /* ceinture */
    var hy=gros?-1.2*s:0,hx=Math.sin(t*14+ph)*s*0.3;                        /* tête renversée en arrière */
    var tx=xb+hx,ty=yb-17*s+hy-ep;
    rect(c,tx-3*s,ty,6*s,6*s,peau);rect(c,tx-3*s,ty-s,6*s,2*s,chev);
    rect(c,tx-2*s,ty+2*s,1.6*s,s,'#1a1a1a');rect(c,tx+0.4*s,ty+2*s,1.6*s,s,'#1a1a1a');   /* yeux plissés */
    var bh=gros?3.4:1.5;
    rect(c,tx-1.8*s,ty+4*s,3.6*s,bh*s,'#3a0d0d');rect(c,tx-1.8*s,ty+4*s,3.6*s,0.9*s,'#ffffff');   /* bouche qui s'ouvre et se ferme */
    if(gros)rect(c,tx-0.9*s,ty+4*s+(bh-1)*s,1.8*s,0.9*s,'#d9435a');         /* la langue */
    if(g%2===1){var f=((t*1.8+ph)%1);rect(c,tx-3.2*s,ty+3*s+f*s*4,0.9*s,1.4*s,'#9fd8ff');}   /* larme qui coule */
    var sy=yb-10*s-ep;
    if(mode==='face'){
      var sz=(3.4+jab*1.8)*s;                                               /* la main grossit quand elle se jette vers nous */
      rect(c,xb+3*s,sy,2*s,5*s,chem);
      rect(c,xb+2.4*s,yb-6.4*s-jab*s*1.5,sz,sz,peau);
      rect(c,xb+3.4*s,yb-9.4*s-jab*s*1.5,1.6*s,3.4*s,peau);
    }else{
      var dir=mode==='gauche'?1:-1,sx=xb+dir*4*s;
      var lon=6*s+jab*s*3.2;                                                /* le bras s'allonge en piquant */
      var n=Math.floor(lon/(1.6*s));
      for(var k=0;k<=n;k++){var px=sx+dir*k*1.6*s,py=sy+k*0.95*s;rect(c,px-(dir<0?2*s:0),py,2*s,2*s,k===n?peau:chem);}
      var hxp=sx+dir*(n+1)*1.6*s,hyp=sy+(n+0.5)*0.95*s;
      rect(c,hxp-(dir<0?s:0),hyp+0.3*s,s,s,peau);                           /* l'index au bout */
    }
    var tape=Math.sin(t*14+ph)>0?-s:0,od=mode==='gauche'?-1:1;               /* l'autre main tape le ventre */
    rect(c,xb+od*3.5*s-(od>0?0:2*s),yb-7.5*s+tape,2*s,2*s,peau);
  }
  function bulle(c,x,hautTete,mot,e,t,g,pop,LW_){
    var bw=larg(mot,e)+6,bh=7*e+6;
    x=Math.max(bw/2+1,Math.min(LW_-bw/2-1,x));
    var bx=Math.round(x-bw/2),by=Math.round(hautTete-bh-6+Math.round(Math.sin(t*14+g)*1.5)-(pop?3:0));
    rect(c,bx-(pop?2:0),by-(pop?2:0),bw+(pop?4:0),bh+(pop?4:0),pop?'#fff2a8':'#ffffff');rect(c,bx,by,bw,bh,'#ffffff');
    rect(c,Math.round(x)-3,by+bh,6,4,'#ffffff');rect(c,Math.round(x)-1,by+bh+4,3,2,'#ffffff');
    texte(c,mot,x,by+3,e,'#111111');
  }

  /* ---------- la scène : trois moqueurs coupés à la ceinture par le bas de l'écran ---------- */
  function taille(LH){return Math.max(5,Math.round(LH/20));}   /* taille d'un pixel de personne : ~70 % de la hauteur de l'écran */
  function gens(LW_,LH){
    var s=taille(LH),bas=LH+4*s-2;   /* la ceinture est à 4 pixels de personne au-dessus des pieds : on la cale sur le bord bas */
    return [
      {x:LW_*0.18,y:bas,t0:0.00,mode:'gauche',dx:-LW_*0.2,graine:1},
      {x:LW_*0.82,y:bas,t0:0.18,mode:'droite',dx: LW_*0.2,graine:2},
      {x:LW_*0.50,y:bas,t0:0.36,mode:'face',  dx:  0,graine:3}
    ];
  }
  function scene(c,t,LW_,LH){
    var G3=gens(LW_,LH),S=taille(LH);
    c.clearRect(0,0,LW_,LH);
    c.fillStyle='rgba(12,14,36,0.55)';c.fillRect(0,0,LW_,LH);                /* l'image du boss reste visible, assombrie */
    [G3[2],G3[0],G3[1]].forEach(function(p){                                 /* le centre est derrière : dessiné en premier */
      var u=t-p.t0;if(u<0)return;
      var a=Math.min(1,u/ENTREE);
      var e=1+2.70158*Math.pow(a-1,3)+1.70158*Math.pow(a-1,2);               /* jaillit du bas, dépasse un peu, se pose */
      var x=p.x+p.dx*(1-e);                                                  /* part un peu plus loin, glisse vers le centre */
      var y=p.y+(LH+120)*(1-e);
      var b=Math.max(0,(t-(FIN+p.t0))/SORTIE);                               /* sortie : ils redescendent en accélérant */
      if(b>=1)return;
      y+=(LH+130)*b*b;
      personne(c,x,y,S,t,p.graine,p.mode);
      if(a>=1&&b===0){
        var cyc=Math.floor((t-p.t0)*5+p.graine),fr=((t-p.t0)*5+p.graine)%1;
        if(cyc%3!==2)bulle(c,x,y-19*S,(cyc%2===0)?'HAHA':'HA',2,t,p.graine,fr<0.18,LW_);
      }
    });
  }

  /* ---------- mise en scène sur la borne ---------- */
  var styleOk=false;
  function style_(){
    if(styleOk||document.getElementById('soreal-idle-moqueurs-style'))return;
    styleOk=true;
    var s=document.createElement('style');s.id='soreal-idle-moqueurs-style';
    s.textContent='.soreal-idle-boss-transition-v61.moq-fuite{position:absolute;inset:0;z-index:30;display:block;pointer-events:none;overflow:hidden;border-radius:14px;background:transparent;font-size:0}'+
      '.soreal-idle-boss-transition-v61.moq-fuite canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}'+
      '.soreal-idle-boss-transition-v61.moq-fuite::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px)}';
    (document.head||document.documentElement).appendChild(s);
  }
  function jouer(hote){
    try{
      if(!hote)return false;
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
      style_();
      /* Tout l'écran du duel (photo du boss + photo du joueur + VS), pas seulement l'image du boss. */
      var arene=(hote.closest&&hote.closest('.soreal-idle-duel-versus-row-v42'))||hote;
      /* Le calque n'est PAS posé dans la grille de l'arène (un enfant de plus y ajoutait une ligne : la borne grandissait de ~140 px) mais dans son conteneur (flex), à la place exacte de l'arène : rien ne bouge. */
      var duel=(arene.closest&&arene.closest('.soreal-idle-duel-v41'))||arene.parentElement||arene;
      var anc=duel.querySelector('.moq-fuite');if(anc)anc.remove();
      var rd=duel.getBoundingClientRect(),r=rd,LH=LH0;   /* Norman (2026-10-22) : sur PC les moqueurs doivent couvrir TOUT l'écran de la borne (le cadre du duel), pas seulement l'arène */
      var LW=Math.max(120,Math.min(420,Math.round(LH*(r.width||LH)/(r.height||LH))));
      var calque=document.createElement('div');
      calque.className='soreal-idle-boss-transition-v61 moq-fuite';
      calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
      var cv=document.createElement('canvas');cv.width=LW;cv.height=LH;calque.appendChild(cv);
      calque.style.cssText='inset:auto;right:auto;bottom:auto;left:0;top:0;width:'+Math.round(r.width)+'px;height:'+Math.round(r.height)+'px';
      duel.appendChild(calque);
      var c=cv.getContext('2d');c.imageSmoothingEnabled=false;
      var t0=performance.now(),fini=false;
      (function image(now){
        if(fini)return;
        var t=(now-t0)/1000;
        if(!calque.isConnected){fini=true;return;}
        if(t>=DUREE){fini=true;if(calque.parentNode)calque.parentNode.removeChild(calque);return;}
        scene(c,t,LW,LH);
        requestAnimationFrame(image);
      })(t0);
      return true;
    }catch(_e){return false;}
  }

  window.__SOREAL_IDLE_MOQUEURS_V1__={jouer:jouer,scene:scene,duree:DUREE,entree:ENTREE,fin:FIN,sortie:SORTIE};
})();
