/*
 * SOREAL IDLE — expressions des chats-étagères de la Garderie (2026-10-31) : regards et paupières EXPRESSIFS, naturels, propres à chaque chat. Aucune minuterie, aucun état : ce module fabrique, à partir de PETITES TABLES,
 * les @keyframes (CSS) d'un cycle LONG par chat ; etagere-personnage-v1.js les injecte avec les yeux (règle n°4 : tout est dessiné par le rendu de la page).
 * Règle n°3 (boucle parfaite) : à 0 % et à 100 % la pose du regard et la paupière sont IDENTIQUES (la table finit sur la pose du début, au centre) ; aucune paupière ni saccade ne chevauche la fin du cycle.
 * Cycles pairwise premiers entre eux (34 à 61 s) : deux chats ne sont jamais synchrones. Les DEUX yeux d'un chat suivent les mêmes keyframes (regard et paupière synchrones) ; l'amplitude propre à chaque œil
 * (jamais hors du blanc, marge d'1 px) vient des variables CSS --ax/--ay posées sur l'œil par etagere-personnage-v1.js ; --bq vaut 1 pour les yeux « g » (la bille qui tombe, rare : une fois par cycle).
 * Table d'un chat : suite de FIXATIONS « <pose><durée en s>[<paupière><décalage en s>] » séparées par des espaces.
 *   poses    : C centre, L gauche, R droite, U haut, D bas, UL UR DL DR diagonales ; B = la bille qui tombe (7,2 s, durée fixe : l'iris roule au bas du blanc, la paupière se ferme 3 fois pour le remettre en place).
 *   paupières: n clignement rapide (0,15 s), l clignement lent (0,5 s, le regard s'abaisse un peu), d double clignement, p mi-clos paresseux (42 % pendant 1,5 s), s mi-clos soupçonneux (30 % pendant 1,8 s),
 *              L longue fermeture (1,6 s). Une paupière tient dans sa fixation (jamais à cheval sur deux poses). Les durées sont mises à l'échelle pour faire exactement le cycle.
 *   Un regard vers le bas s'accompagne d'une paupière un peu plus basse (10 %) ; vers le haut, la paupière est déjà au plus haut (elle ne monte pas plus : le sprite est entièrement hors de l'œil au repos).
 * Saccade : 0,22 s (courbe cubic-bezier : départ vif, arrivée amortie = inertie), puis fixation. Pendant que la paupière est TOTALEMENT fermée le regard ne bouge pas, sauf les remises en place de la bille (invisibles).
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_EXPR_V1__)return;
  var SAC=0.22,BILLE_DUREE=7.2;
  var POSES={C:[0,0],L:[-1,0],R:[1,0],U:[0,-1],D:[0,1],UL:[-0.75,-0.75],UR:[0.75,-0.75],DL:[-0.75,0.75],DR:[0.75,0.75]};
  /* enveloppes de paupière : [décalage s, fermeture 0..1] ; dip = abaissement du regard (en amplitudes verticales) */
  var EV={
    n:{c:[[0,0],[0.05,1],[0.08,1],[0.15,0]]},
    l:{c:[[0,0],[0.2,1],[0.27,1],[0.5,0]],dip:[[0,0],[0.2,0.35],[0.27,0.35],[0.5,0]]},
    d:{c:[[0,0],[0.05,1],[0.08,1],[0.14,0],[0.3,0],[0.35,1],[0.38,1],[0.46,0]]},
    p:{c:[[0,0],[0.35,0.42],[1.85,0.42],[2.25,0]],dip:[[0,0],[0.35,0.2],[1.85,0.2],[2.25,0]]},
    s:{c:[[0,0],[0.25,0.3],[2.05,0.3],[2.35,0]]},
    L:{c:[[0,0],[0.35,1],[1.95,1],[2.45,0]]}
  };
  /* la bille : décalages (en % de la taille de l'iris) et fermetures, relatifs au début de la séquence */
  var BILLE_POS=[[0,0,0],[0.8,0,0],[1,2,8],[1.2,5,18],[1.45,14,23],[1.75,22,20],[2.05,12,23],[2.3,18,22],[2.55,10,22],[3.46,10,22],[3.58,6,15],[5.06,6,15],[5.18,3,8],[6.46,3,8],[6.58,0,0],[7.2,0,0]];
  var BILLE_LID=[[0,0],[3.3,0],[3.45,1],[3.6,1],[3.8,0],[4.9,0],[5.05,1],[5.2,1],[5.4,0],[6.2,0],[6.4,1],[6.65,1],[6.9,0],[7.2,0]];
  /* une table par chat : cycle (s), table. Cycles premiers entre eux : 34 39 49 55 et 37 41 43 47 53 59 61. */
  var TABLES={
    defaut:{T:37,t:'C2.8l0.7 R2.6 C2.4n0.8 DL2.2 UL2 B C3 L2.8 C2n0.6 D2 UR2 C3.6L0.5 R2.4 UL1.8 C1.8'},
    noeud:{T:41,t:'C2.4l0.6 UR2.2 C2.2 R2.4 DR2.2l0.5 B C2.6 L2.4 UL2 C2.6l0.6 UR2.2 C2n0.6 R2 C2.6l0.6 L2.4 DR1.8 C2'},
    arcenciel:{T:43,t:'C1.8n0.5 L1.2 R1.2 C1.4 U1.1 C1.4n0.5 DR1.1 L1.2 C1.4 UR1.1 D1.1 B C1.6d0.4 R1.3 UL1.1 C1.3 L1.4 C1.4n0.5 DL1.1 C1.6n0.5 R1.5 UR1.2 C1.6 L1.2 U1 C1.6'},
    fibonacci:{T:47,t:'C2.6n0.8 R2 C2.2 DL1.8 L2 C2.6d0.7 UR1.8 B C2.2 D1.8 C2.6n0.8 UL2 R2 C2.2 DR1.6 C2.4n0.7 L2 C2'},
    dore:{T:53,t:'C3.6p0.8 R2.6 C2.6n0.8 L2.4 C3.6p0.7 UL2 R2.2 B C3.4n1 DR1.8 C3.8s0.6 L2.4 UR2 C3.4p0.6 R2.4 C2.6'},
    matrix:{T:59,t:'C1.8d0.5 L1 C1.4 R1 C1.8d0.5 U1 C1.4 D1 C1.8d0.5 UR1 C1.4 B DL1 C1.8d0.5 R1 C1.2 L1.2 C1.6n0.4 UL1 C1.6d0.5 DR1.1 C1.4 R1 C1.8d0.5 L1.2 U1 C1.6 D1 C1.8d0.5 UR1 C1.6'},
    chauvesouris:{T:61,t:'C3n0.6 L3.4s0.35 C2.6 R3.4s0.35 C2.6n0.8 UL2 B C2.6n0.8 DR1.6 C3 L3.6s0.35 C2.4 R2.2 C2.6n0.8 L2 UR1.6 C3 R3.4s0.35 DL1.8 C2.6'},
    tchernobyl:{T:34,t:'C2n0.5 UL1.2 DR1.4 R1 C2 L1.3 U1.1 C2n0.5 DL1.2 UR1 B D1.2 C2 R1.4 UL1 C2d0.5 L1.2 DR1.1 C1.6'},
    pirate:{T:39,t:'C2.8l0.7 L3 C2.4 L3.4s0.35 C3.2 UL1.8 C2.6l0.7 R2.4 C2.2 D1.8 C2.6l0.7 L3.4s0.35 C2.4'},
    noel:{T:49,t:'C2.4n0.7 U2.4 C2 D2 C2.4n0.7 UR1.8 C2 DL1.8 C2.6l0.6 B U2 C2 D1.8 C2.4n0.7 UL1.6 C2 R2 C2.4d0.6 UR1.8 C3.2L0.5 D1.8 C2'},
    nega:{T:55,t:'C4.6l0.8 R4.5 C4 L4 C4.2L0.6 B DR3.4 C4.6n1 UL3.4 C4.6l0.8 R3.4 C4'}
  };
  /* SOUFFLE : mouvement de vie par DÉFORMATION douce de tout le chat (image + yeux, même transformation autour du bas-centre : les yeux restent exactement sur leur place) : il respire (étirement vertical de
     quelques millièmes) et sa tête se balance à peine (cisaillement horizontal de ~0,1°, plus marqué en haut : les oreilles bougent plus que la base, le nez suit). [période s, étirement, cisaillement °] ;
     périodes distinctes d'un chat à l'autre, boucle parfaite (0 % = 100 % = repos), coupé en mouvement réduit. */
  var SOUFFLE={defaut:[5.3,0.005,0.10],noeud:[4.7,0.004,0.14],arcenciel:[3.9,0.006,0.08],fibonacci:[6.1,0.005,0.12],dore:[7.3,0.003,0.06],matrix:[4.3,0.004,0.05],
    chauvesouris:[6.7,0.005,0.10],tchernobyl:[3.7,0.007,0.16],pirate:[5.9,0.005,0.12],noel:[5.1,0.005,0.14],nega:[8.3,0.003,0.05]};
  function souffleCss(id){
    var q=SOUFFLE[id];
    if(!q)return '';
    var sy=num(1+q[1]),sx=num(1-q[1]*0.4),sy2=num(1+q[1]*0.4);
    var cible='#gd-fig-'+id+' .gd-img,#gd-fig-'+id+' .et-oeil';
    return '@keyframes etS-'+id+'{0%,100%{transform:scale(1,1) skewX(0deg)}30%{transform:scale('+sx+','+sy+') skewX(0deg)}55%{transform:scale('+num(1-q[1]*0.15)+','+sy2+') skewX('+num(q[2])+'deg)}80%{transform:scale(1,1.0005) skewX('+num(-q[2]*0.5)+'deg)}}\n'+
      '@media (prefers-reduced-motion:no-preference){'+cible+'{animation:etS-'+id+' '+q[0]+'s ease-in-out 0s infinite}}';
  }
  var PAS_ENTRE=0.1;

  function parse(txt){
    var out=[];
    txt.split(/\s+/).forEach(function(w){
      if(!w)return;
      if(w==='B'){out.push({b:true});return;}
      var m=/^(UL|UR|DL|DR|C|L|R|U|D)([\d.]+)(?:(n|l|d|p|s|L)([\d.]+))?$/.exec(w);
      if(!m)throw new Error('expression : fixation illisible « '+w+' »');
      out.push({pose:m[1],d:parseFloat(m[2]),ev:m[3]||'',at:m[4]?parseFloat(m[4]):0});
    });
    return out;
  }
  function lin(pts,t){   /* interpolation linéaire par morceaux ; pts = [[t,v...]] triés */
    var n=pts.length;
    if(t<=pts[0][0])return pts[0].slice(1);
    if(t>=pts[n-1][0])return pts[n-1].slice(1);
    for(var i=1;i<n;i++){
      if(t<=pts[i][0]){
        var a=pts[i-1],b=pts[i],k=b[0]===a[0]?1:(t-a[0])/(b[0]-a[0]),r=[];
        for(var j=1;j<a.length;j++)r.push(a[j]+(b[j]-a[j])*k);
        return r;
      }
    }
    return pts[n-1].slice(1);
  }
  function temps(listes){   /* union triée des instants (arrondis à 0,1 ms) */
    var s={};
    listes.forEach(function(l){l.forEach(function(p){s[Math.round(p[0]*10000)]=1;});});
    return Object.keys(s).map(Number).sort(function(a,b){return a-b;}).map(function(x){return x/10000;});
  }
  function pct(t,T){var v=(t/T*100).toFixed(3).replace(/\.?0+$/,'');return (v===''?'0':v)+'%';}
  function num(v){var s=(Math.round(v*1000)/1000).toString();return s==='-0'?'0':s;}

  /* construit {T, regard:'@keyframes …', paupiere:'@keyframes …', stats} pour un chat */
  function construire(id){
    var spec=TABLES[id];
    if(!spec)return null;
    var T=spec.T,ent=parse(spec.t);
    var nB=ent.filter(function(e){return e.b;}).length,S=0;
    ent.forEach(function(e){if(!e.b)S+=e.d;});
    var f=(T-BILLE_DUREE*nB)/S;
    var derniere=ent.filter(function(e){return !e.b;}).pop().pose;
    var gaze=[[0,POSES[derniere][0],POSES[derniere][1]]],dip=[[0,0]],ball=[[0,0,0]],lidBase=[[0,POSES[derniere][1]>0?1:0]],lidEv=[];
    var prev=derniere,ts=0,centre=0,evNb={};
    function baseY(p){return POSES[p][1]>0?Math.min(1,POSES[p][1]):0;}
    ent.forEach(function(e){
      if(e.b){
        gaze.push([ts,POSES[prev][0],POSES[prev][1]],[ts+0.3,0,0]);
        lidBase.push([ts,baseY(prev)],[ts+0.3,0]);
        BILLE_POS.forEach(function(p){ball.push([ts+p[0],p[1],p[2]]);});
        lidEv.push(BILLE_LID.map(function(p){return [ts+p[0],p[1]];}));
        prev='C';ts+=BILLE_DUREE;return;
      }
      var d=e.d*f;
      gaze.push([ts,POSES[prev][0],POSES[prev][1]],[ts+SAC,POSES[e.pose][0],POSES[e.pose][1]]);
      lidBase.push([ts,baseY(prev)],[ts+SAC,baseY(e.pose)]);
      if(e.pose==='C')centre+=d;
      if(e.ev){
        var E=EV[e.ev],len=E.c[E.c.length-1][0];
        var at=Math.max(e.at,SAC+0.1);
        if(at+len>d-PAS_ENTRE)at=Math.max(SAC+0.05,d-PAS_ENTRE-len);
        if(at+len<=d){
          lidEv.push(E.c.map(function(p){return [ts+at+p[0],p[1]];}));
          if(E.dip)E.dip.forEach(function(p){dip.push([ts+at+p[0],p[1]]);});
          evNb[e.ev]=(evNb[e.ev]||0)+1;
        }
      }
      prev=e.pose;ts+=d;
    });
    gaze.push([T,POSES[prev][0],POSES[prev][1]]);dip.push([T,0]);ball.push([T,0,0]);lidBase.push([T,baseY(prev)]);
    [gaze,dip,ball,lidBase].forEach(function(a){a.sort(function(x,y){return x[0]-y[0];});});
    /* dip : points isolés → on les complète à zéro hors des enveloppes (lin tient la dernière valeur : on referme chaque enveloppe) */
    var dipSeg=dip;
    /* regard : pose (unités d'amplitude) + abaissement + bille (en % de l'iris) */
    var tG=temps([gaze,dipSeg,ball]);
    var kfG=tG.map(function(t){
      var g=lin(gaze,t),d=lin(dipSeg,t)[0]||0,b=lin(ball,t);
      var x=g[0],y=g[1]+d;
      var tx=x===0&&b[0]===0?'0':'calc(var(--ax)*'+num(x)+(b[0]?'+var(--bq)*'+num(b[0])+'%':'')+')';
      var ty=y===0&&b[1]===0?'0':'calc(var(--ay)*'+num(y)+(b[1]?'+var(--bq)*'+num(b[1])+'%':'')+')';
      return pct(t,T)+'{transform:translate('+tx+','+ty+')}';
    });
    /* paupière : fermeture = max(pose du regard, enveloppes) ; c=1 : fermé (translate 0) ; c=0 : ouvert (sprite entièrement hors de l'œil) */
    var base=lidBase.map(function(p){return [p[0],p[1]*0.1];});
    var tL=temps([base].concat(lidEv));
    var kfL=tL.map(function(t){
      var c=lin(base,t)[0];
      lidEv.forEach(function(ev){
        if(t>=ev[0][0]&&t<=ev[ev.length-1][0])c=Math.max(c,lin(ev,t)[0]);
      });
      var k=num(1-c);
      return pct(t,T)+'{transform:translate(calc(var(--ox)*'+k+'),calc(var(--oy)*'+k+'))}';
    });
    return {
      T:T,
      regard:'@keyframes etG-'+id+'{'+kfG.join('')+'}',
      paupiere:'@keyframes etP-'+id+'{'+kfL.join('')+'}',
      stats:{centre:centre/T,evenements:evNb,billes:nB}
    };
  }
  var memo={};
  function cycle(id){var s=TABLES[id];return s?s.T:0;}
  /* CSS d'un chat (une fois) : keyframes + règles d'animation, limitées à « mouvement non réduit » (en mouvement réduit : regard centré, yeux ouverts) */
  function cssDe(id){
    if(memo[id]!==undefined)return memo[id];
    var c=construire(id);
    if(!c){memo[id]='';return '';}
    var k='.et-k-'+id;
    memo[id]=c.regard+'\n'+c.paupiere+'\n@media (prefers-reduced-motion:no-preference){'+
      k+' .et-ir{animation:etG-'+id+' '+c.T+'s cubic-bezier(.3,.85,.35,1) var(--dg,0s) infinite}'+
      k+' .et-paup.et-sp{animation:etP-'+id+' '+c.T+'s ease-in-out var(--dl,0s) infinite}}\n'+souffleCss(id);
    return memo[id];
  }
  window.__SOREAL_IDLE_ETAGERE_EXPR_V1__={souffleCss:souffleCss,SOUFFLE:SOUFFLE,cycle:cycle,cssDe:cssDe,construire:construire,TABLES:TABLES,ids:Object.keys(TABLES)};
})();
