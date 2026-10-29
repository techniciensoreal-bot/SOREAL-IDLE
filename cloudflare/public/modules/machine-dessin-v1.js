/*
 * SOREAL IDLE — le dessin de la Machine à remonter le temps (Norman, 2026-10-20 : « une grosse machine avec un écran et l'image du mob qui nous a rapporté le plus gros butin d'Or ; l'énergie sur la partie gauche, la magie sur la partie droite ;
 * des engrenages qui tournent de plus en plus vite jusqu'à 50 tiques par seconde » ; maquette validée : public/maquette-machine-temporelle-v1.html).
 *
 *   window.__SOREAL_IDLE_TM_DESSIN_V1__ = { defs(), centre(opts), hautEnergie(), hautMagie(), rafraichir(), maj(vue) }
 *
 * Tout le dessin est du balisage SVG statique (aucun enfant créé par le script) : le redessin périodique de la page (morph) le laisse en place (data-morph-vivant, AGENTS.md règle n°4). Le script ne fait que :
 *  - lancer les rotations (WAAPI) : la VITESSE change (playbackRate), jamais la phase, donc aucun saut quand le rythme change ; toujours le même sens ; la vitesse est lissée (elle monte progressivement) ;
 *  - tenir à jour les quelques textes et attributs dynamiques (vitesse, aiguille, lueur, image et nom du mob, butin).
 * Mouvement réduit (prefers-reduced-motion) : rien ne tourne.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TM_DESSIN_V1__)return;

  var calme=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function arr(v,n){return Number(v).toFixed(n===undefined?2:n);}
  function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* ---------- engrenages : dents trapézoïdales, rayons, moyeu ; l'engrènement est calculé (phases) ---------- */
  function cheminDents(ro,ri,n){
    var pas=2*Math.PI/n,d='';
    for(var i=0;i<n;i++){
      var a=i*pas,p=[[ri,a-pas*.31],[ro,a-pas*.15],[ro,a+pas*.15],[ri,a+pas*.31]];
      for(var k=0;k<4;k++){d+=(i===0&&k===0?'M':'L')+arr(p[k][0]*Math.cos(p[k][1]))+' '+arr(p[k][0]*Math.sin(p[k][1]));}
    }
    return d+'Z';
  }
  /* Une roue : groupe positionné (translate) contenant le groupe qui tourne (.tmm-rot : dents, sens, décalage de départ). */
  function roue(cx,cy,ro,n,sens,off,teinte){
    var ri=ro*.84,nb=ro>40?6:5,trous='';
    for(var i=0;i<nb;i++){var a=i*2*Math.PI/nb;trous+='<circle cx="'+arr(ri*.5*Math.cos(a))+'" cy="'+arr(ri*.5*Math.sin(a))+'" r="'+arr(ri*.16)+'" fill="#0b0805" stroke="#150c06" stroke-width="2"/>';}
    return '<g transform="translate('+arr(cx,1)+' '+arr(cy,1)+')"><g class="tmm-rot" data-dents="'+n+'" data-sens="'+sens+'" data-off="'+arr(off,2)+'" style="transform:rotate('+arr(off,2)+'deg)">'+
      '<path d="'+cheminDents(ro,ri,n)+'" fill="url(#tmmPignon'+(teinte==='B'?'B':'')+')" stroke="#150c06" stroke-width="3" stroke-linejoin="round"/>'+
      '<circle r="'+arr(ri*.78)+'" fill="none" stroke="#150c06" stroke-width="2.4" opacity=".55"/>'+
      '<circle r="'+arr(ri*.78)+'" fill="none" stroke="#fff7d0" stroke-width="1.4" opacity=".22" transform="translate(-1.4 -1.4)"/>'+
      trous+
      '<circle r="'+arr(ri*.24)+'" fill="url(#tmmRivet)" stroke="#150c06" stroke-width="2.4"/><circle r="'+arr(ri*.08)+'" fill="#150c06"/>'+
      '<path d="M'+arr(-ri*.7)+' '+arr(-ri*.25)+' A'+arr(ri*.74)+' '+arr(ri*.74)+' 0 0 1 '+arr(-ri*.2)+' '+arr(-ri*.7)+'" fill="none" stroke="#fff" opacity=".35" stroke-width="3" stroke-linecap="round"/>'+
      '</g></g>';
  }
  /* Phase d'engrènement : le contact des deux roues doit tomber entre deux dents (la somme des phases vaut une demi-dent). */
  function decalageMesh(thetaDeg,offA,nA,nB){
    var pasA=360/nA,pasB=360/nB,phiA=(((thetaDeg-offA)/pasA)%1+1)%1,phiB=(((.5-phiA)%1)+1)%1;
    return thetaDeg+180-pasB*phiB;
  }
  function chaine(x0,y0,defs){
    var x=x0,y=y0,prev=null,out='';
    defs.forEach(function(d){
      var off=0,sens=1;
      if(prev){
        var dd=prev.ro*.92+d.ro*.92,th=d.theta||0;
        x+=dd*Math.cos(th*Math.PI/180);y+=dd*Math.sin(th*Math.PI/180);
        off=decalageMesh(th,prev.off,prev.n,d.n);sens=-prev.sens;
      }
      out+=roue(x,y,d.ro,d.n,sens,off,d.teinte);
      prev={ro:d.ro,n:d.n,off:off,sens:sens,x:x,y:y};
      d.pos=prev;
    });
    return {svg:out,roues:defs.map(function(d){return d.pos;})};
  }

  /* ---------- définitions communes (dégradés), posées une seule fois dans la page ---------- */
  function defs(){
    return '<svg class="tmm-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs>'+
      '<linearGradient id="tmmLait" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset=".35" stop-color="#e3b04b"/><stop offset=".75" stop-color="#a8691f"/><stop offset="1" stop-color="#6e4210"/></linearGradient>'+
      '<linearGradient id="tmmLaitH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4210"/><stop offset=".25" stop-color="#e3b04b"/><stop offset=".5" stop-color="#ffe9a6"/><stop offset=".75" stop-color="#d09a38"/><stop offset="1" stop-color="#6e4210"/></linearGradient>'+
      '<linearGradient id="tmmAcier" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfd8e3"/><stop offset=".5" stop-color="#7b8a9c"/><stop offset="1" stop-color="#36424f"/></linearGradient>'+
      '<linearGradient id="tmmPignon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset=".5" stop-color="#d49a36"/><stop offset="1" stop-color="#7a4a12"/></linearGradient>'+
      '<linearGradient id="tmmPignonB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e5ecf4"/><stop offset=".5" stop-color="#8795a8"/><stop offset="1" stop-color="#3c4856"/></linearGradient>'+
      '<radialGradient id="tmmVerre" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>'+
      '<radialGradient id="tmmPiece" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c4"/><stop offset=".5" stop-color="#ffc931"/><stop offset="1" stop-color="#a86a00"/></radialGradient>'+
      '<radialGradient id="tmmRivet" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2c0"/><stop offset=".55" stop-color="#c08a2a"/><stop offset="1" stop-color="#4a2c0a"/></radialGradient>'+
      '<radialGradient id="tmmLampeR" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd0cc"/><stop offset=".5" stop-color="#ff3a2e"/><stop offset="1" stop-color="#7a0f0a"/></radialGradient>'+
      '<radialGradient id="tmmLampeA" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#ffb300"/><stop offset="1" stop-color="#7a4a00"/></radialGradient>'+
      '<radialGradient id="tmmLampeV" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d8ffd0"/><stop offset=".5" stop-color="#37e05a"/><stop offset="1" stop-color="#0f6a24"/></radialGradient>'+
      '<radialGradient id="tmmLueur" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffb43a" stop-opacity=".75"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="tmmHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf55" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf55" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="tmmOrbe" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#e0f1ff"/><stop offset=".45" stop-color="#4aa8ff"/><stop offset="1" stop-color="#0f3f8a"/></radialGradient>'+
      '<pattern id="tmmScan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000"/></pattern>'+
      '<filter id="tmmOmbre" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>'+
      '</defs></svg>';
  }

  /* ---------- l'image du mob du meilleur butin ---------- */
  function urlMob(m){
    if(!m||typeof m!=='object')return '';
    if(m.titan)return '/api/idle/media/titan?id='+encodeURIComponent(String(m.titan));
    if(!m.zone)return '';
    var p=new URLSearchParams();
    p.set('zone',String(m.zone));
    p.set('boss',m.boss?'1':'0');
    p.set('seed',String(Math.max(0,Math.floor(Number(m.seed)||0))));
    if(m.name)p.set('name',String(m.name));
    return '/api/idle/media/mob?'+p.toString();
  }

  /* Le multiplicateur peut être très grand (« ×1,23 Qa ») : la police rétrécit pour tenir dans l'écran. */
  function taillePoliceMulti(t){var n=String(t).length;return n>11?14:n>9?17:n>7?20:26;}

  /* Taille du nom du mob (Norman, 2026-10-23) : le nom a toute la largeur de l'écran (300 sur 324) sur sa propre ligne, au-dessus ; plus il est long, plus il rapetisse (jamais sous 9). */
  function tailleNom(nom){var n=Math.max(1,String(nom||'').length);return Math.max(9,Math.min(16,Math.floor(300/(n*.62))));}
  /*
   * Le tas d'Or sous la goulotte (Norman, 2026-10-29 : « pour chaque M, T, UVG… un tas un peu plus gros ; pas à l'infini, mais une dizaine de tas différents ») : dix tailles, choisies d'après l'unité du butin d'une barre (la même que celle affichée :
   * K, M, B, T… Uvg…). Seuils (rang de l'unité : 0 rien, 1 K, 2 M, 4 T, 22 Uvg) : sous M, puis M, B, T, Sx, Oc, Vg, Uvg, Tvg, Qavg ; 10 niveaux, le dernier ne grossit plus. Chaque niveau est plus large, un peu plus haut et porte plus de pièces.
   */
  var SEUILS_TAS=[0,2,3,4,7,9,21,22,24,25];   /* rangs d'unité : M=2, B=3, T=4, Sx=7, Oc=9, Vg=21, Uvg=22, Tvg=24, Qavg=25 (audit 2026-10-29 : les anciens seuils ne tombaient pas sur Sx, Vg, Tvg) */
  function niveauTas(or){
    var g=Number(or)||0,rang=g>=1000?Math.floor(Math.log10(g)/3+1e-9):0,n=0,i;
    for(i=0;i<SEUILS_TAS.length;i++)if(rang>=SEUILS_TAS[i])n=i;
    return n;
  }
  function tasInterieur(niv){
    var B=686,w=62+niv*6,t=650-niv*1.9,L=280-w,R=280+w;   /* de plus en plus large et haut (sans dépasser le bec de la goulotte), plus de pièces à chaque niveau */
    var d='M'+L.toFixed(1)+' '+B+' Q'+(L+6).toFixed(1)+' '+(t+24).toFixed(1)+' '+(L+30).toFixed(1)+' '+(t+22).toFixed(1)+' Q'+(L+52).toFixed(1)+' '+t.toFixed(1)+' 280 '+t.toFixed(1)+' Q'+(R-52).toFixed(1)+' '+t.toFixed(1)+' '+(R-30).toFixed(1)+' '+(t+22).toFixed(1)+' Q'+(R-6).toFixed(1)+' '+(t+24).toFixed(1)+' '+R.toFixed(1)+' '+B+' Z';
    var clair='',sombre='',nb=5+niv*3,k;
    for(k=0;k<nb;k++){
      var fx=((k*0.6180339+.13)%1),x=L+12+fx*(2*w-24),dx=Math.abs(x-280)/w,haut=t+8+dx*dx*(B-t-18),y=haut+(((k*0.3819661+.2)%1))*(B-haut-9);
      if(k%3===2)sombre+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3"/>';
      else clair+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="5"/>';
    }
    return '<path d="'+d+'" fill="url(#tmmPiece)" stroke="#150c06" stroke-width="3" stroke-linejoin="round"/><g fill="#ffe9a0" opacity=".85">'+clair+'</g><g fill="#b87400" opacity=".7">'+sombre+'</g>';
  }

  /* ---------- le centre : la grande machine (écran, cadran, baie d'engrenages, goulotte à pièces) ---------- */
  function centre(opts){
    opts=opts||{};
    var ticks=Math.max(1,Math.min(50,Number(opts.ticks)||1));
    var url=urlMob(opts.mob);
    var nom=opts.mob&&opts.mob.name?String(opts.mob.name):'';
    var butin=opts.butin?String(opts.butin):'';
    var multi=opts.multi?String(opts.multi):'×1';
    var graduations='';
    for(var v=0;v<=50;v+=5){var a=(-120+240*v/50)*Math.PI/180-Math.PI/2,r1=v%10===0?27:31;graduations+='<path d="M'+arr(r1*Math.cos(a))+' '+arr(r1*Math.sin(a))+' L'+arr(35*Math.cos(a))+' '+arr(35*Math.sin(a))+'" stroke-width="'+(v%10===0?2.4:1.4)+'"/>';}
    var grille='';
    for(var i=0;i<9;i++)grille+='<path d="M'+arr(118+i*40.5,1)+' 116 V330" stroke="#2cff9f" stroke-opacity=".07" stroke-width="1"/>';
    for(var j=0;j<6;j++)grille+='<path d="M118 '+(116+j*36)+' H442" stroke="#2cff9f" stroke-opacity=".07" stroke-width="1"/>';
    var train=chaine(104,540,[{ro:56,n:16,teinte:'A'},{ro:38,n:11,teinte:'B'},{ro:50,n:14,teinte:'A'},{ro:34,n:10,teinte:'B'},{ro:52,n:15,teinte:'A'}]);
    var dessus='';
    [[0,-70],[3,-110]].forEach(function(c){
      var m=train.roues[c[0]],th=c[1],ro=26,n=9,pr=(m.ro+ro)*.92;
      dessus+=roue(m.x+pr*Math.cos(th*Math.PI/180),m.y+pr*Math.sin(th*Math.PI/180),ro,n,-m.sens,decalageMesh(th,m.off,m.n,n),'B');
    });
    var pieces='';
    for(var p=0;p<8;p++)pieces+='<g class="tmm-piece" data-rang="'+p+'"><ellipse cx="280" cy="626" rx="11" ry="11" fill="url(#tmmPiece)" stroke="#150c06" stroke-width="2.4"/><ellipse cx="280" cy="626" rx="6.5" ry="6.5" fill="none" stroke="#a86a00" stroke-width="1.6"/></g>';
    var ecran;
    if(url){
      ecran='<image id="tmmFond" x="118" y="116" width="324" height="214" preserveAspectRatio="xMidYMid slice" opacity=".55" style="filter:blur(9px) saturate(1.2)" href="'+esc(url)+'"/>'+
        '<image id="tmmImage" class="tmm-mob" x="146" y="120" width="268" height="172" preserveAspectRatio="xMidYMid meet" href="'+esc(url)+'"/>';
    }else{
      /* Aucun butin d'Or encore cette renaissance : un cadran d'horloge qui attend. */
      ecran='<g id="tmmAttente" transform="translate(280 204)" opacity=".85"><circle r="56" fill="none" stroke="#2cff9f" stroke-opacity=".5" stroke-width="5"/><circle r="46" fill="none" stroke="#2cff9f" stroke-opacity=".25" stroke-width="2"/><path d="M0 -36 V0 L24 14" fill="none" stroke="#7dffd0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle r="6" fill="#7dffd0"/></g>';
    }
    return '<svg class="tmm-svg" viewBox="0 0 560 700" role="img" aria-label="La machine à remonter le temps" data-morph-vivant="1" data-tmm-centre="1" data-sans-couleur-nombre="1">'+
      '<clipPath id="tmmClipEcran"><rect x="118" y="116" width="324" height="214" rx="16"/></clipPath>'+
      '<clipPath id="tmmClipBaie"><rect x="52" y="476" width="456" height="120" rx="18"/></clipPath>'+
      '<clipPath id="tmmClipChute"><rect x="246" y="610" width="68" height="84"/></clipPath>'+
      '<rect x="6" y="640" width="548" height="48" rx="14" fill="#2d2118" stroke="#150c06" stroke-width="4"/><rect x="14" y="646" width="532" height="10" rx="5" fill="#5a4330" opacity=".7"/>'+
      '<g filter="url(#tmmOmbre)"><path d="M20 90 Q20 56 54 56 H130 Q150 18 280 18 Q410 18 430 56 H506 Q540 56 540 90 V626 Q540 640 526 640 H34 Q20 640 20 626 Z" fill="url(#tmmLait)" stroke="#150c06" stroke-width="5" stroke-linejoin="round"/></g>'+
      '<path d="M32 96 V628" stroke="#fff3c0" stroke-width="5" opacity=".28" stroke-linecap="round"/><path d="M528 96 V628" stroke="#000" stroke-width="6" opacity=".25" stroke-linecap="round"/><path d="M150 40 Q280 6 410 40" fill="none" stroke="#fff3c0" stroke-width="4" opacity=".4" stroke-linecap="round"/>'+
      '<g fill="url(#tmmRivet)" stroke="#150c06" stroke-width="2"><circle cx="40" cy="80" r="6"/><circle cx="520" cy="80" r="6"/><circle cx="40" cy="620" r="6"/><circle cx="520" cy="620" r="6"/><circle cx="40" cy="350" r="5"/><circle cx="520" cy="350" r="5"/><circle cx="40" cy="470" r="5"/><circle cx="520" cy="470" r="5"/></g>'+
      /* tuyaux latéraux et vapeur */
      '<rect x="30" y="116" width="26" height="330" rx="13" fill="url(#tmmLaitH)" stroke="#150c06" stroke-width="4"/><rect x="504" y="116" width="26" height="330" rx="13" fill="url(#tmmLaitH)" stroke="#150c06" stroke-width="4"/>'+
      '<g fill="url(#tmmAcier)" stroke="#150c06" stroke-width="3"><rect x="25" y="170" width="36" height="14" rx="4"/><rect x="25" y="300" width="36" height="14" rx="4"/><rect x="25" y="410" width="36" height="14" rx="4"/><rect x="499" y="170" width="36" height="14" rx="4"/><rect x="499" y="300" width="36" height="14" rx="4"/><rect x="499" y="410" width="36" height="14" rx="4"/></g>'+
      '<g fill="#f4efe6" stroke="#9aa3ad" stroke-width="1.5"><circle class="tmm-vapeur" style="--d:0s" cx="43" cy="112" r="11"/><circle class="tmm-vapeur" style="--d:1.1s" cx="43" cy="112" r="9"/><circle class="tmm-vapeur" style="--d:2.2s" cx="43" cy="112" r="10"/><circle class="tmm-vapeur" style="--d:.5s" cx="517" cy="112" r="11"/><circle class="tmm-vapeur" style="--d:1.6s" cx="517" cy="112" r="9"/><circle class="tmm-vapeur" style="--d:2.7s" cx="517" cy="112" r="10"/></g>'+
      /* bandeau-titre et voyants */
      '<path d="M70 38 H490 L476 82 H84 Z" fill="#2a1a0c" stroke="#150c06" stroke-width="4" stroke-linejoin="round"/><path d="M78 44 H482 L471 76 H89 Z" fill="none" stroke="#e3b04b" stroke-width="2"/>'+
      '<text x="280" y="68" text-anchor="middle" font-family="Bangers,cursive" font-size="36" letter-spacing="4" fill="#ffe39a" stroke="#150c06" stroke-width="1" paint-order="stroke">MACHINE TEMPORELLE</text>'+
      '<g stroke="#150c06" stroke-width="3"><circle cx="82" cy="100" r="11" fill="url(#tmmLampeR)"/><circle cx="108" cy="100" r="11" fill="url(#tmmLampeA)"/><circle cx="452" cy="100" r="11" fill="url(#tmmLampeA)"/><circle cx="478" cy="100" r="11" fill="url(#tmmLampeV)"/></g>'+
      '<g><circle class="tmm-lampe" style="--d:0s" cx="82" cy="100" r="11" fill="url(#tmmHalo)"/><circle class="tmm-lampe" style="--d:.6s" cx="108" cy="100" r="11" fill="url(#tmmHalo)"/><circle class="tmm-lampe" style="--d:1.2s" cx="452" cy="100" r="11" fill="url(#tmmHalo)"/><circle class="tmm-lampe" style="--d:1.8s" cx="478" cy="100" r="11" fill="url(#tmmHalo)"/></g>'+
      /* écran : cadre en laiton, verre, mob du meilleur butin */
      '<rect x="96" y="100" width="368" height="248" rx="30" fill="url(#tmmLait)" stroke="#150c06" stroke-width="5"/><rect x="108" y="108" width="344" height="232" rx="24" fill="#120c07" stroke="#150c06" stroke-width="3"/><rect x="116" y="114" width="328" height="218" rx="18" fill="#04120d"/>'+
      '<g clip-path="url(#tmmClipEcran)"><rect x="118" y="116" width="324" height="214" fill="#07201a"/><g opacity=".85">'+grille+'</g>'+ecran+
      '<rect x="118" y="116" width="324" height="214" fill="url(#tmmVerre)"/><rect class="tmm-rouleau" x="118" y="116" width="324" height="36" fill="#7dffd0" opacity=".14"/><rect x="118" y="116" width="324" height="214" fill="url(#tmmScan)" opacity=".5"/>'+
      '<rect x="118" y="276" width="324" height="54" fill="#000" opacity=".66"/>'+
      '<text id="tmmNomMob" x="130" y="296" font-family="Russo One,sans-serif" font-size="'+tailleNom(nom)+'" fill="#e8f7ee" opacity=".95">'+esc(nom)+'</text>'+
      '<text x="130" y="322" font-family="Russo One,sans-serif" font-size="11" letter-spacing="1" fill="#7dffd0" opacity=".85">MEILLEUR BUTIN D’OR</text>'+
      '<text id="tmmButin" x="430" y="324" text-anchor="end" font-family="Russo One,sans-serif" font-size="21" fill="#ffd84a" stroke="#000" stroke-width="2" style="paint-order:stroke">'+esc(butin)+'</text></g>'+
      '<rect x="116" y="114" width="328" height="218" rx="18" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="3"/><path d="M130 130 Q250 118 360 126 L330 150 Q230 146 150 156 Z" fill="#fff" opacity=".12"/>'+
      '<g fill="url(#tmmRivet)" stroke="#150c06" stroke-width="2"><circle cx="112" cy="118" r="5"/><circle cx="448" cy="118" r="5"/><circle cx="112" cy="330" r="5"/><circle cx="448" cy="330" r="5"/></g>'+
      /* bandeau de commande : vitesse (affichage, cadran) et voyants */
      '<rect x="52" y="360" width="456" height="104" rx="18" fill="#2a1a0c" stroke="#150c06" stroke-width="4"/><rect x="58" y="366" width="444" height="92" rx="14" fill="none" stroke="#e3b04b" stroke-width="2" opacity=".8"/>'+
      '<rect x="74" y="384" width="140" height="56" rx="10" fill="#03100c" stroke="#150c06" stroke-width="3"/><rect x="78" y="388" width="132" height="48" rx="7" fill="none" stroke="#46586a" stroke-width="1.5"/>'+
      '<text x="86" y="403" font-family="Russo One,sans-serif" font-size="10" letter-spacing="2" fill="#6fd9b3" opacity=".85">VITESSE</text>'+
      '<text id="tmmVitesse" x="204" y="430" text-anchor="end" font-family="Russo One,sans-serif" font-size="26" fill="#7dffd0" stroke="#042a1c" stroke-width="3" style="paint-order:stroke">'+Math.round(ticks)+' /s</text>'+
      '<g transform="translate(280 414)"><circle r="46" fill="url(#tmmLait)" stroke="#150c06" stroke-width="4"/><circle r="37" fill="#0c0805" stroke="#150c06" stroke-width="3"/><circle r="37" fill="url(#tmmVerre)" opacity=".7"/>'+
      '<g stroke="#ffe39a" stroke-linecap="round">'+graduations+'</g>'+
      '<g id="tmmAiguille" style="transform:rotate('+arr(-120+240*ticks/50,1)+'deg);transition:transform .45s cubic-bezier(.2,.8,.2,1)"><path d="M-3 6 L0 -33 L3 6 Z" fill="#ff4a3a" stroke="#150c06" stroke-width="1.6" stroke-linejoin="round"/></g>'+
      '<circle r="6" fill="url(#tmmRivet)" stroke="#150c06" stroke-width="2"/><text y="28" text-anchor="middle" font-family="Russo One,sans-serif" font-size="9" fill="#ffe39a" opacity=".8">TIQUES/S</text></g>'+
      /* second écran, comme celui de la vitesse : le MULTIPLICATEUR d'Or (la Magie le fait monter, et les niveaux d'Énergie au-dessus de 50 aussi) */
      '<rect x="346" y="384" width="140" height="56" rx="10" fill="#03100c" stroke="#150c06" stroke-width="3"/><rect x="350" y="388" width="132" height="48" rx="7" fill="none" stroke="#46586a" stroke-width="1.5"/>'+
      '<text x="358" y="403" font-family="Russo One,sans-serif" font-size="10" letter-spacing="2" fill="#6fd9b3" opacity=".85">MULTIPLICATEUR</text>'+
      '<text id="tmmMulti" x="476" y="430" text-anchor="end" font-family="Russo One,sans-serif" font-size="'+taillePoliceMulti(multi)+'" fill="#ffd84a" stroke="#3a2a00" stroke-width="3" style="paint-order:stroke">'+esc(multi)+'</text>'+
      /* baie d'engrenages */
      '<rect x="46" y="470" width="468" height="132" rx="22" fill="url(#tmmAcier)" stroke="#150c06" stroke-width="5"/><rect x="52" y="476" width="456" height="120" rx="18" fill="#0b0805"/>'+
      '<g clip-path="url(#tmmClipBaie)"><rect x="52" y="476" width="456" height="120" fill="#17100a"/><path d="M52 536 H508" stroke="#000" stroke-width="30" opacity=".25"/>'+train.svg+dessus+
      '<rect id="tmmLueurBaie" x="52" y="476" width="456" height="120" fill="url(#tmmLueur)" opacity="0"/><rect x="52" y="476" width="456" height="120" fill="url(#tmmVerre)" opacity=".5"/></g>'+
      '<rect x="52" y="476" width="456" height="120" rx="18" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="3"/>'+
      '<g fill="url(#tmmRivet)" stroke="#150c06" stroke-width="2"><circle cx="58" cy="482" r="4.5"/><circle cx="502" cy="482" r="4.5"/><circle cx="58" cy="590" r="4.5"/><circle cx="502" cy="590" r="4.5"/></g>'+
      /* goulotte à pièces et tas d'Or */
      '<path d="M232 600 H328 L316 626 H244 Z" fill="url(#tmmLait)" stroke="#150c06" stroke-width="4" stroke-linejoin="round"/><rect x="244" y="622" width="72" height="14" rx="4" fill="#2a1a0c" stroke="#150c06" stroke-width="3"/>'+
      '<g clip-path="url(#tmmClipChute)"><rect id="tmmFluxOr" x="262" y="626" width="36" height="24" rx="8" fill="url(#tmmPiece)" opacity="0" style="transition:opacity .6s ease"/>'+pieces+'</g>'+
      '<g id="tmmTas" transform="translate(0 4)" data-niveau="'+(opts.tas|0)+'">'+tasInterieur(opts.tas|0)+'</g>'+
      '</svg>';
  }

  /* ---------- le haut des tours : deux roues (Énergie) ; l'orbe et son anneau de runes (Magie) ---------- */
  function hautEnergie(){
    var b=decalageMesh(4,0,12,14);
    return '<svg viewBox="0 0 150 86" aria-hidden="true" data-morph-vivant="1">'+roue(40,46,30,12,1,0,'A')+roue(102,50,38,14,-1,b,'B')+'<path d="M8 82 H142" stroke="#150c06" stroke-width="4" stroke-linecap="round"/></svg>';
  }
  function hautMagie(){
    var runes='';
    var signes=['ᚠ','ᚦ','ᚱ','ᚲ','ᛉ','ᛟ','ᛞ','ᛗ'];
    for(var i=0;i<8;i++){var a=i*Math.PI/4,x=30*Math.cos(a),y=30*Math.sin(a);runes+='<text x="'+arr(x,1)+'" y="'+arr(y+4,1)+'" text-anchor="middle" font-size="10" fill="#cfe8ff" opacity=".9" font-family="serif" transform="rotate('+(i*45+90)+' '+arr(x,1)+' '+arr(y,1)+')">'+signes[i]+'</text>';}
    var etinc='';
    for(var k=0;k<5;k++)etinc+='<circle class="tmm-etincelle" style="--d:'+(k*.5)+'s" cx="'+(-30+k*15)+'" cy="36" r="2.2" fill="#cfe8ff"/>';
    return '<svg viewBox="0 0 150 86" aria-hidden="true" data-morph-vivant="1"><g transform="translate(75 44)"><circle class="tmm-orbe" r="40" fill="#3d8bff" opacity=".35"/>'+
      '<g class="tmm-anneau"><circle r="36" fill="none" stroke="#150c06" stroke-width="6"/><circle r="36" fill="none" stroke="#e3b04b" stroke-width="3" stroke-dasharray="14 6"/>'+runes+'</g>'+
      '<circle r="20" fill="url(#tmmOrbe)" stroke="#150c06" stroke-width="3"/><path d="M-10 -9 Q-3 -17 6 -13" fill="none" stroke="#fff" opacity=".55" stroke-width="3" stroke-linecap="round"/>'+etinc+
      '<path d="M-62 40 H62" stroke="#150c06" stroke-width="4" stroke-linecap="round"/></g></svg>';
  }

  /* ---------- animation : la vitesse change, la phase ne saute jamais ---------- */
  var cible=1,vue=1,derniere=0,boucle=0;
  var anneaux=new WeakSet();
  function tourDeReference(t){return .06+.86*Math.pow((Math.max(1,Math.min(50,t))-1)/49,.75);}   /* tours par seconde de la roue de 16 dents : 1 tique = très lente, 50 = vitesse maximale encore lisible */
  /*
   * Roues des tours (Norman, 2026-10-26) : « quand aucune énergie ni magie n'est allouée, les roues liées à ce cadre ne doivent plus tourner ; celles de la machine continuent ; elles tournent plus ou moins vite selon la somme attribuée, au maximum tant que la
   * barre est maxée, et quand elle redescend, tout doucement, les engrenages suivent le rythme ». Cadence d'une tour = niveaux par seconde de sa barre = allocation / K (K : durée du niveau à 1 unité, envoyée par le serveur et posée sur la tour par la page :
   * data-tm-alloc, data-tm-k), plafonnée à 50 comme la machine. Zéro allocation : roues arrêtées. La vitesse est lissée : elle monte vite, redescend lentement ; jamais de saut de phase.
   */
  var tours={vitesse:{cible:0,vue:0},or:{cible:0,vue:0}};
  function ticksTour(piste){
    var s=document.querySelector('.tmm-tour.'+piste);
    if(!s)return 0;
    var a=Number(s.getAttribute('data-tm-alloc')),k=Number(s.getAttribute('data-tm-k'));
    return a>0&&k>0?Math.min(50,a/k):0;
  }
  function viserTours(depart){
    ['vitesse','or'].forEach(function(c){var t=tours[c];t.cible=ticksTour(c);if(depart)t.vue=t.cible;});
  }
  function cleTour(el){var t=el.closest?el.closest('.tmm-tour'):null;return t?(t.classList.contains('vitesse')?'vitesse':'or'):'';}
  function vitesseRoueTour(t){return t<=0?0:(t>=1?tourDeReference(t):tourDeReference(1)*t);}   /* tours par seconde de la roue de 16 dents ; sous 1 niveau par seconde, proportionnelle */
  function rythmeAnneau(t){return t<=0?0:.15+2.2*Math.pow(Math.min(1,t/50),.75);}
  function cadenceRoue(r){
    var dents=16/(parseInt(r.getAttribute('data-dents'),10)||16);
    if(r.closest&&r.closest('.tmm-haut')){var c=cleTour(r);return Math.max(0,vitesseRoueTour(c?tours[c].vue:0)*dents*10);}
    return Math.max(.0001,tourDeReference(vue)*dents*10);
  }
  function lancerRoues(racine){
    if(calme)return;
    if(!racine.__toursInit){racine.__toursInit=true;viserTours(true);}
    racine.querySelectorAll('.tmm-rot').forEach(function(r){
      if(r.__tmmAnim)return;
      var off=parseFloat(r.getAttribute('data-off'))||0,sens=parseFloat(r.getAttribute('data-sens'))||1;
      r.style.transform='';
      r.__tmmAnim=r.animate([{transform:'rotate('+off+'deg)'},{transform:'rotate('+(off+360*sens)+'deg)'}],{duration:10000,iterations:Infinity,easing:'linear'});
      r.__tmmAnim.playbackRate=cadenceRoue(r);
    });
    reglerPieces(racine);
    racine.querySelectorAll('.tmm-anneau').forEach(function(g){
      if(g.__tmmAnim)return;
      g.__tmmAnim=g.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:22000,iterations:Infinity,easing:'linear'});
      g.__tmmAnim.playbackRate=rythmeAnneau(tours.or.vue);
    });
  }
  /*
   * Pièces dans la goulotte (Norman, 2026-10-29 : « il y en a une qui fait des haut-bas, je n'aime pas ; je préfère qu'elles se suivent toutes à la file ») : une FILE régulière. Toutes les pièces tombent exactement de la même façon (même durée de chute, même vitesse, jamais d'aller-retour) ;
   * seul le nombre de pièces par seconde change avec le rythme (1, 2, 4 ou 8), réparties à intervalles égaux : la cadence ne touche jamais la vitesse d'une pièce. La cadence n'est réglée que lorsqu'elle change de palier (pas à chaque image).
   */
  var CHUTE_PIECE=.5;   /* secondes de chute de chaque pièce */
  function reglerPieces(racine){
    var cad=vue<=2?1:vue<=4?2:vue<=8?4:8;
    if(racine.__cadencePieces===cad&&racine.querySelector('.tmm-piece').__tmmAnim)return;
    racine.__cadencePieces=cad;
    var periode=8/cad,f=Math.min(.99,CHUTE_PIECE/periode);   /* 8 pièces décalées d'une période/8 : cad pièces par seconde */
    var kf=[{transform:'translateY(0)',opacity:0},{transform:'translateY('+(24*.12).toFixed(2)+'px)',opacity:1,offset:+(f*.12).toFixed(4)},{transform:'translateY('+(24*.8).toFixed(2)+'px)',opacity:1,offset:+(f*.8).toFixed(4)},{transform:'translateY(24px)',opacity:0,offset:+f.toFixed(4)},{transform:'translateY(24px)',opacity:0}];
    racine.querySelectorAll('.tmm-piece').forEach(function(g){
      var rang=parseInt(g.getAttribute('data-rang'),10)||0;
      var opt={duration:periode*1000,iterations:Infinity,delay:-rang*periode*1000/8,easing:'linear'};
      try{
        if(g.__tmmAnim){g.__tmmAnim.effect.setKeyframes(kf);g.__tmmAnim.effect.updateTiming(opt);}
        else g.__tmmAnim=g.animate(kf,opt);
      }catch(_e){try{if(g.__tmmAnim)g.__tmmAnim.cancel();}catch(_f){} g.__tmmAnim=g.animate(kf,opt);}
      if(g.style.display)g.style.display='';
    });
  }
  function appliquerVitesse(){
    var racine=document.querySelector('.tmm-machine');
    if(!racine)return;
    racine.querySelectorAll('.tmm-rot').forEach(function(r){
      if(r.__tmmAnim)r.__tmmAnim.playbackRate=cadenceRoue(r);
    });
    racine.querySelectorAll('.tmm-anneau').forEach(function(g){
      if(g.__tmmAnim)g.__tmmAnim.playbackRate=rythmeAnneau(tours.or.vue);
    });
    reglerPieces(racine);
    var flux=document.getElementById('tmmFluxOr');if(flux)flux.style.opacity=String(Math.max(0,Math.min(1,(vue-18)/20))*.85);
    var lueur=document.getElementById('tmmLueurBaie');if(lueur)lueur.style.opacity=String(Math.max(0,(vue-6)/44)*.9);
  }
  function image(t){
    boucle=0;
    if(!document.querySelector('.tmm-machine'))return;
    var dt=Math.min(.1,(t-derniere)/1000);derniere=t;
    var bouge=false,diff=cible-vue;
    if(Math.abs(diff)>.01){vue+=diff*Math.min(1,dt*3.2);bouge=true;}
    else if(vue!==cible){vue=cible;bouge=true;}
    ['vitesse','or'].forEach(function(c){
      var T=tours[c],d=T.cible-T.vue;
      /* monte vite, redescend tout doucement : les roues suivent le rythme de la barre */
      if(Math.abs(d)>.005){T.vue+=d*Math.min(1,dt*(d>0?3.2:.7));bouge=true;}
      else if(T.vue!==T.cible){T.vue=T.cible;bouge=true;}
    });
    if(bouge){appliquerVitesse();boucle=requestAnimationFrame(image);}
  }
  function lancerBoucle(){if(!boucle){derniere=performance.now();boucle=requestAnimationFrame(image);}}
  function viser(ticks){
    cible=Math.max(1,Math.min(50,Number(ticks)||1));
    if(calme){vue=cible;return;}
    lancerBoucle();
  }

  /* Tient à jour les textes et attributs dynamiques de la machine (à chaque synchro) ; lance les rotations si le dessin vient d'apparaître. */
  function maj(vueMachine){
    var racine=document.querySelector('.tmm-machine');
    if(!racine)return;
    var v=vueMachine||(window.__SOREAL_IDLE_LIRE_ETAT_V1__&&((window.__SOREAL_IDLE_LIRE_ETAT_V1__()||{}).systemes||{}).timeMachineView)||null;
    if(!v)return;
    var H=window.__SOREAL_IDLE_META_HOST_V130__;
    var ticks=Math.max(1,Math.min(50,Number(v.barFillsPerSecond)||1));
    lancerRoues(racine);
    viser(ticks);
    viserTours(false);   /* allocation lue sur les tours (posée par la page) ; la boucle lisse la vitesse des roues et de l'anneau */
    if(!calme)lancerBoucle();
    var ia=document.getElementById('tmmAiguille');if(ia)ia.style.transform='rotate('+arr(-120+240*ticks/50,1)+'deg)';
    var tv=document.getElementById('tmmVitesse');var texteV=Math.round(ticks)+' /s';if(tv&&tv.textContent!==texteV)tv.textContent=texteV;
    var multi=document.getElementById('tmmMulti');
    if(multi&&H&&typeof H.formatGrandNombreIdleV70_==='function'){
      var m=(Number(v.goldMultiplier)||1)*(Number(v.machineSpeedMultiplier)||1);
      var tm='×'+H.formatGrandNombreIdleV70_(m);
      if(multi.textContent!==tm){multi.textContent=tm;multi.setAttribute('font-size',String(taillePoliceMulti(tm)));}
    }
    var tas=document.getElementById('tmmTas');
    if(tas){var nv=niveauTas(v.goldPerBarFill);if(tas.getAttribute('data-niveau')!==String(nv)){tas.setAttribute('data-niveau',String(nv));tas.innerHTML=tasInterieur(nv);}}
    var butin=document.getElementById('tmmButin');
    if(butin&&H&&typeof H.formatGrandNombreIdleV70_==='function'){var tb='+'+H.formatGrandNombreIdleV70_(Number(v.goldPerBarFill)||0)+' Or';if(butin.textContent!==tb)butin.textContent=tb;}
    var nomMob=document.getElementById('tmmNomMob');var nom=v.bestGoldMob&&v.bestGoldMob.name?String(v.bestGoldMob.name):'';if(nomMob){if(nomMob.textContent!==nom)nomMob.textContent=nom;var tn=String(tailleNom(nom));if(nomMob.getAttribute('font-size')!==tn)nomMob.setAttribute('font-size',tn);}
    /* Le mob a changé (un meilleur butin a été obtenu) : image remplacée sur place ; première apparition (aucun mob avant) : la page est redessinée par l'appelant. */
    var u=urlMob(v.bestGoldMob);
    ['tmmImage','tmmFond'].forEach(function(id){var im=document.getElementById(id);if(im&&u&&im.getAttribute('href')!==u)im.setAttribute('href',u);});
    var presente=Boolean(document.getElementById('tmmImage')),attendue=Boolean(u);
    if(presente!==attendue&&typeof H.rafraichirMenuRacineIdleV28_==='function'&&Date.now()-(maj.__redessin||0)>1500){maj.__redessin=Date.now();H.rafraichirMenuRacineIdleV28_();}
  }
  function rafraichir(){maj(null);}

  /* Après chaque redessin de la page (AGENTS.md règle n°4) : les rotations repartent dans la même tâche. */
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(rafraichir);

  window.__SOREAL_IDLE_TM_DESSIN_V1__={niveauTas:niveauTas,tasInterieur:tasInterieur,defs:defs,centre:centre,hautEnergie:hautEnergie,hautMagie:hautMagie,rafraichir:rafraichir,maj:maj,urlMob:urlMob};
})();
