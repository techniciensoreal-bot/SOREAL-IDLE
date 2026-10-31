/*
 * Roue journalière du Money Pit (Norman, 2026-10-31 : « refaire la roue : la taille du cadre de Trou sans fond, en dessous, chacune des récompenses possibles, qui tourne VRAIMENT »).
 * Expose window.__SOREAL_IDLE_ROUE_V1__ = { rendreCarte, lancer, recevoir, echec, enCours, stAvant, totalAvant, prixAvant, memoPrix, secteurs, ... }.
 *
 * La roue n'est QU'UN AFFICHAGE : le moteur tire (opération collect/dailySpin, idle-ngu-snapshot.js, spinDaily) puis répond { reward, tier, secteur } ; la roue tourne ensuite ~4,2 s et s'arrête sur
 * le secteur `secteur` du palier `tier`. Aucun aléa ici (jamais d'angle choisi au hasard). La table des récompenses vient du moteur (state.systemes.roueJournaliere = { tier, table, derniere }) :
 * rien n'est recopié à la main côté client ; la largeur d'un secteur = son poids RÉEL (somme = 360°).
 * Exception à la règle n°2 (anti-spoil), décidée par Norman le 2026-10-31 : TOUTES les récompenses possibles sont montrées, même celles de systèmes pas encore débloqués.
 * Règle n°3 : ampoules et halo en boucle parfaite (CSS), prefers-reduced-motion : la roue s'arrête sans les tours, halo fixe.
 * Règle n°4 (redessin périodique) : tout l'état d'animation vit ICI (anim, angle courant) ; chaque rendu de la page redessine la roue à l'angle courant, le morph ne trouve donc rien à changer ;
 * l'angle est de plus remis juste après chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__), dans la même tâche.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ROUE_V1__)return;

  const DUREE_MS=4200;
  const TOURS=5;
  const PALETTE=['#e63946','#ffd24a','#3ddc84','#2a9df4','#b266ff','#ff8a3d','#19c3b1','#ff6fb1'];
  const CLAIRES={'#ffd24a':1};
  const CX=220,CY=220,RS=190;

  /* Noms affichés (le moteur donne des identifiants) et icônes ; « Beast Butter » et « MacGuffin Muffin » ont un vrai effet depuis le 2026-09-23. */
  const NOMS={energyPotionAlpha:'Potion Energy α',energyPotionBeta:'Potion Energy β',energyPotionDelta:'Potion Energy δ',magicPotionAlpha:'Potion Magic α',magicPotionBeta:'Potion Magic β',magicPotionDelta:'Potion Magic δ',luckyCharm:'Lucky Charm',superLuckyCharm:'Super Lucky Charm',energyBarBar:'Energy Bar Bar',magicBarBar:'Magic Bar Bar',littleBluePill1000:'1000 Little Blue Pill',poop:'Caca',beastButter:'Beast Butter',macguffinMuffin:'MacGuffin Muffin'};
  const INFO={energyPotionAlpha:['potE','Energy α'],energyPotionBeta:['potE','Energy β'],energyPotionDelta:['potE','Energy δ'],magicPotionAlpha:['potM','Magic α'],magicPotionBeta:['potM','Magic β'],magicPotionDelta:['potM','Magic δ'],luckyCharm:['lucky','Lucky'],superLuckyCharm:['super','Super'],energyBarBar:['barE','Bar E'],magicBarBar:['barM','Bar M'],littleBluePill1000:['pill','Pill'],poop:['poop','Caca'],beastButter:['butter','Butter'],macguffinMuffin:['muffin','Muffin']};
  const ICONES={
    ap:"<path d=\"M3 7h18v3.2a2 2 0 0 0 0 3.6V17H3v-3.2a2 2 0 0 0 0-3.6z\" fill=\"#ffd24a\"/><path d=\"M9 7v10\" stroke=\"#8a4b00\" stroke-width=\"1.4\" stroke-dasharray=\"1.6 1.8\"/><path d=\"M15 9.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L12.1 11.3l2-.3z\" fill=\"#8a4b00\"/>",
    seed:"<path d=\"M12 21v-9\" stroke=\"#bff0b0\" stroke-width=\"1.8\" stroke-linecap=\"round\"/><path d=\"M12 13c0-5-4-7-8-7 0 5 3 7 8 7z\" fill=\"#7be07b\"/><path d=\"M12 11c0-4 3-6 8-6 0 5-3 7-8 6z\" fill=\"#b4f08a\"/>",
    potE:"<path d=\"M9 3h6v2h-1v4l5 9a2 2 0 0 1-1.7 3H6.7A2 2 0 0 1 5 18l5-9V5H9z\" fill=\"#e8f1ff\"/><path d=\"M7.4 14h9.2l2.4 4.3A1.2 1.2 0 0 1 18 20H6a1.2 1.2 0 0 1-1-1.7z\" fill=\"#ffd21a\"/><circle cx=\"10.5\" cy=\"17\" r=\"1\" fill=\"#fff\"/>",
    potM:"<path d=\"M9 3h6v2h-1v4l5 9a2 2 0 0 1-1.7 3H6.7A2 2 0 0 1 5 18l5-9V5H9z\" fill=\"#e8f1ff\"/><path d=\"M7.4 14h9.2l2.4 4.3A1.2 1.2 0 0 1 18 20H6a1.2 1.2 0 0 1-1-1.7z\" fill=\"#b266ff\"/><circle cx=\"10.5\" cy=\"17\" r=\"1\" fill=\"#fff\"/>",
    barE:"<rect x=\"2.5\" y=\"8\" width=\"19\" height=\"8\" rx=\"2.4\" fill=\"#e8f1ff\"/><rect x=\"4.4\" y=\"9.9\" width=\"4\" height=\"4.2\" rx=\"1\" fill=\"#ffd21a\"/><rect x=\"9.9\" y=\"9.9\" width=\"4\" height=\"4.2\" rx=\"1\" fill=\"#ffd21a\"/><rect x=\"15.4\" y=\"9.9\" width=\"4\" height=\"4.2\" rx=\"1\" fill=\"#ffd21a\"/>",
    barM:"<rect x=\"2.5\" y=\"8\" width=\"19\" height=\"8\" rx=\"2.4\" fill=\"#e8f1ff\"/><rect x=\"4.4\" y=\"9.9\" width=\"4\" height=\"4.2\" rx=\"1\" fill=\"#b266ff\"/><rect x=\"9.9\" y=\"9.9\" width=\"4\" height=\"4.2\" rx=\"1\" fill=\"#b266ff\"/><rect x=\"15.4\" y=\"9.9\" width=\"4\" height=\"4.2\" rx=\"1\" fill=\"#b266ff\"/>",
    lucky:"<g fill=\"#5be28a\"><circle cx=\"9\" cy=\"8.6\" r=\"4\"/><circle cx=\"15\" cy=\"8.6\" r=\"4\"/><circle cx=\"9\" cy=\"14.2\" r=\"4\"/><circle cx=\"15\" cy=\"14.2\" r=\"4\"/></g><circle cx=\"12\" cy=\"11.4\" r=\"1.6\" fill=\"#1f9a50\"/><path d=\"M12 14l1.5 7\" stroke=\"#bff0b0\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>",
    super:"<g fill=\"#ffd24a\"><circle cx=\"9\" cy=\"8.6\" r=\"4\"/><circle cx=\"15\" cy=\"8.6\" r=\"4\"/><circle cx=\"9\" cy=\"14.2\" r=\"4\"/><circle cx=\"15\" cy=\"14.2\" r=\"4\"/></g><circle cx=\"12\" cy=\"11.4\" r=\"1.7\" fill=\"#b87a10\"/><path d=\"M12 14l1.5 7\" stroke=\"#fff3b0\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>",
    pill:"<g transform=\"rotate(-45 12 12)\"><rect x=\"2\" y=\"8\" width=\"20\" height=\"8\" rx=\"4\" fill=\"#fff\"/><path d=\"M12 8h6a4 4 0 0 1 0 8h-6z\" fill=\"#3a8dff\"/></g>",
    poop:"<path d=\"M12 3c2 1 2.4 2.800 1.200 4.200 2.800.1 5 1.800 5 3.800 1.800.2 3.300 1.800 3.300 3.800 0 2.200-1.900 4-4.400 4H6.900C4.300 19 3 17.200 3 15.200s1.400-3.700 3.200-3.800c0-2 2.200-3.700 5-3.800C10.200 6.500 10.600 4.200 12 3z\" fill=\"#9a6a38\"/><path d=\"M7 16c3 1.200 7 1.200 10 0\" stroke=\"#6b4420\" stroke-width=\"1.300\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M9 10.500c2-.7 4-.7 6 0\" stroke=\"#c99a60\" stroke-width=\"1.200\" fill=\"none\" stroke-linecap=\"round\"/>",
    butter:"<path d=\"M3 10l9-4 9 4v7l-9 3-9-3z\" fill=\"#ffd45a\"/><path d=\"M3 10l9-4 9 4-9 3z\" fill=\"#fff3b8\"/><path d=\"M12 13v7\" stroke=\"#c99a1e\" stroke-width=\"1.100\"/>",
    muffin:"<path d=\"M4 12c0-5 4-8 8-8s8 3 8 8z\" fill=\"#f7c6d9\"/><path d=\"M5.200 12h13.600l-1.800 9H7z\" fill=\"#c0762f\"/><path d=\"M9 12.500l.6 8M12 12.500v8.500M15 12.500l-.6 8\" stroke=\"#8a4b1c\" stroke-width=\"1\"/><circle cx=\"12\" cy=\"4.200\" r=\"1.600\" fill=\"#e63946\"/>",
    jackpot:"<path d=\"M12 2l2.900 6.300 6.900.8-5.100 4.700 1.400 6.800L12 17l-6.100 3.600 1.400-6.800L2.200 9.100l6.900-.8z\" fill=\"#ffd24a\" stroke=\"#b87a10\" stroke-width=\"1\" stroke-linejoin=\"round\"/>",
    bonus:"<rect x=\"4\" y=\"10\" width=\"16\" height=\"10\" rx=\"1.500\" fill=\"#e8f1ff\"/><rect x=\"3\" y=\"7\" width=\"18\" height=\"4\" rx=\"1.300\" fill=\"#ffffff\"/><path d=\"M11 7h2v13h-2z\" fill=\"#e63946\"/><path d=\"M12 7c-1-3-5-3.500-5-1.500S10 7 12 7zM12 7c1-3 5-3.500 5-1.500S14 7 12 7z\" fill=\"none\" stroke=\"#e63946\" stroke-width=\"1.500\"/>"
  };

  let anim=null;          /* { phase:'attente'|'tourne', fige:{...}, rot, t0, finale, fin, stAvant, prixAvant, totalAvant } */
  let repos={rot:0,cle:'',tier:-1};   /* angle de la roue à l'arrêt (mémoire de page) ; cle = échéance du tour (data.readyAt) */
  let memo={st:null};     /* dernier état rendu (pour figer au lancement) */
  let prixMemo=null,totalMemo=0;
  let minuterieSecours=null;

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function fmtN(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
  function pct(w){return (Math.round(w*10)/10).toString().replace('.',',')+' %';}
  function maintenant(){return typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();}

  /* ---------- table du moteur -> secteurs ---------- */
  function decrire(e){
    if(e.ap)return {icon:'ap',short:fmtN(e.ap),name:fmtN(e.ap)+' AP'};
    if(e.seeds)return {icon:'seed',short:fmtN(e.seeds),name:fmtN(e.seeds)+' graines'};
    const ids=Object.keys(e.items||{});
    if(ids.length>1)return {icon:'jackpot',short:'Jackpot',name:'Jackpot',jackpot:ids.map(function(id){return e.items[id]+' × '+(NOMS[id]||id);}).join(' · ')};
    const id=ids[0],n=e.items[id],inf=INFO[id]||['bonus',id];
    return {icon:inf[0],short:(n>1?n+'× ':'')+inf[1],name:n+' × '+(NOMS[id]||id)};
  }
  /* Un secteur par récompense, largeur proportionnelle au poids réel (la somme des poids = 100 = 360°). */
  function secteurs(table){
    const total=table.reduce(function(s,e){return s+(Number(e.poids)||0);},0)||100;
    let a=0;
    const liste=table.map(function(e,i){
      const d=decrire(e),ang=(Number(e.poids)||0)/total*360;
      const s=Object.assign({i:i,w:Number(e.poids)||0,a0:a,ang:ang,a1:a+ang,mid:a+ang/2,col:PALETTE[i%PALETTE.length]},d);
      a+=ang;return s;
    });
    if(liste.length>2&&liste[liste.length-1].col===liste[0].col)liste[liste.length-1].col=PALETTE[(liste.length+3)%PALETTE.length];
    return liste;
  }
  /* Secteur d'un tirage ancien (avant l'enregistrement du rang) : valeur exacte pour graines et objets, AP le plus proche. */
  function secteurDepuisLot(liste,reward){
    reward=reward||{};
    for(let i=0;i<liste.length;i++){
      const t=liste[i];
      if(reward.items&&t.name&&!t.jackpot){const id=Object.keys(reward.items)[0];if(id&&t.name===(reward.items[id]+' × '+(NOMS[id]||id)))return i;}
      if(reward.items&&t.jackpot&&Object.keys(reward.items).length>1)return i;
      if(reward.seeds&&t.icon==='seed'&&t.name===fmtN(reward.seeds)+' graines')return i;
    }
    if(reward.ap){
      let best=-1,gap=Infinity;
      liste.forEach(function(t,i){if(t.icon!=='ap')return;const nom=Number(String(t.short).replace(/\D/g,''));const g=Math.abs(nom-reward.ap);if(g<gap){gap=g;best=i;}});
      return best;
    }
    return -1;
  }

  /* ---------- dessin ---------- */
  function pt(r,deg){const a=(deg-90)*Math.PI/180;return [CX+r*Math.cos(a),CY+r*Math.sin(a)];}
  function part(s){
    const p0=pt(RS,s.a0),p1=pt(RS,s.a1);
    if(s.ang>=359.9)return 'M'+CX+' '+(CY-RS)+'A'+RS+' '+RS+' 0 1 1 '+CX+' '+(CY+RS)+'A'+RS+' '+RS+' 0 1 1 '+CX+' '+(CY-RS)+'Z';
    return 'M'+CX+' '+CY+'L'+p0[0].toFixed(2)+' '+p0[1].toFixed(2)+'A'+RS+' '+RS+' 0 '+(s.ang>180?1:0)+' 1 '+p1[0].toFixed(2)+' '+p1[1].toFixed(2)+'Z';
  }
  function etiquette(s){
    const a=s.ang;
    if(a<7)return '';
    const rot='translate('+CX+' '+CY+') rotate('+(s.mid-90)+')';
    const sc=Math.max(.78,Math.min(1.5,a/36));
    if(a<17){
      const r=a<10?152:146;
      const taille=Math.min(34*sc,2*r*Math.sin(a*Math.PI/360)*.9);
      if(taille<11)return '';
      return '<g transform="'+rot+' translate('+r+' 0) rotate(90)"><circle r="'+(taille*.62).toFixed(1)+'" fill="rgba(8,12,26,.55)"/><use href="#ic-'+s.icon+'" x="'+(-taille/2).toFixed(1)+'" y="'+(-taille/2).toFixed(1)+'" width="'+taille.toFixed(1)+'" height="'+taille.toFixed(1)+'"/></g>';
    }
    const fs=a>=60?24:(a>=34?19:(a>=24?16:13.5));
    const ti=Math.min(38*sc,30+a*.3);
    return '<g transform="'+rot+'"><g transform="translate(158 0) rotate(90)"><circle r="'+(ti*.62).toFixed(1)+'" fill="rgba(8,12,26,.55)"/><use href="#ic-'+s.icon+'" x="'+(-ti/2).toFixed(1)+'" y="'+(-ti/2).toFixed(1)+'" width="'+ti.toFixed(1)+'" height="'+ti.toFixed(1)+'"/></g>'+
      '<text x="62" y="0" dominant-baseline="central" font-family="Russo One, Arial Black, Impact, sans-serif" font-size="'+fs+'" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width="'+(fs*.22).toFixed(1)+'" paint-order="stroke" stroke-linejoin="round">'+esc(s.short)+'</text></g>';
  }
  function symboles(){
    return Object.keys(ICONES).map(function(k){return '<symbol id="ic-'+k+'" viewBox="0 0 24 24">'+ICONES[k]+'</symbol>';}).join('');
  }
  function svgRoue(liste,rot,gagnant){
    let h='<svg class="rb-svg'+(gagnant>=0?' rb-fini':'')+'" viewBox="-6 -10 452 456" role="img" aria-label="Roue journalière : toutes les récompenses possibles"><defs>'+symboles()+
      '<radialGradient id="rbMoyeu" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff6c4"/><stop offset=".45" stop-color="#f6c540"/><stop offset="1" stop-color="#8a5a06"/></radialGradient>'+
      '<linearGradient id="rbBord" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset=".5" stop-color="#d89a14"/><stop offset="1" stop-color="#8a4b00"/></linearGradient>'+
      '<radialGradient id="rbOmbre" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>'+
      '<circle cx="'+CX+'" cy="'+CY+'" r="214" fill="url(#rbBord)"/><circle cx="'+CX+'" cy="'+CY+'" r="199" fill="#5a3205"/>'+
      '<g class="rb-rot" style="transform-origin:'+CX+'px '+CY+'px;transform:rotate('+rot.toFixed(3)+'deg)">';
    liste.forEach(function(s){
      const p=part(s);
      h+='<g class="rb-sect'+(s.i===gagnant?' rb-gagne':'')+'" data-i="'+s.i+'"><path d="'+p+'" fill="'+s.col+'" stroke="rgba(255,255,255,.85)" stroke-width="'+(s.ang<4?0.6:2)+'" stroke-linejoin="round"/><path d="'+p+'" fill="url(#rbOmbre)"/>'+etiquette(s)+
        '<path class="rb-halo" d="'+p+'" fill="rgba(255,255,255,.22)" stroke="'+(s.ang<8?'#ffd24a':'#fff')+'" stroke-width="'+(s.ang<8?9:5)+'" stroke-linejoin="round"/></g>';
    });
    h+='</g><circle cx="'+CX+'" cy="'+CY+'" r="194" fill="url(#rbOmbre)" opacity=".5"/>';
    for(let k=0;k<24;k++){const p=pt(206.5,k*15);h+='<circle class="rb-ampoule'+(k%2?' b':'')+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.2" fill="#fff6c4" stroke="#8a4b00" stroke-width="1"/>';}
    h+='<circle cx="'+CX+'" cy="'+CY+'" r="30" fill="url(#rbMoyeu)" stroke="#6a4306" stroke-width="3"/><circle cx="'+CX+'" cy="'+CY+'" r="12" fill="#8a4b00"/><circle cx="'+(CX-3)+'" cy="'+(CY-4)+'" r="4" fill="#fff6c4" opacity=".8"/>'+
      '<g class="rb-aiguille" data-morph-vivant="1"><path d="M'+CX+' 52 L'+(CX-17)+' 8 Q'+CX+' -6 '+(CX+17)+' 8Z" fill="#fff" stroke="#8a4b00" stroke-width="3" stroke-linejoin="round"/><circle cx="'+CX+'" cy="14" r="5" fill="#e63946" stroke="#8a4b00" stroke-width="2"/></g></svg>';
    return h;
  }
  function legende(liste,gagnant){
    const jack=liste.filter(function(s){return s.jackpot;})[0];
    return '<div class="rb-legende">'+liste.map(function(s){
      return '<div class="rb-leg'+(s.i===gagnant?' rb-gagnant':'')+'"><i style="background:'+s.col+'"></i><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-'+s.icon+'"/></svg><span>'+esc(s.name)+'</span><em>'+pct(s.w)+'</em></div>';
    }).join('')+'</div>'+(jack?'<div class="rb-jackpot-detail"><b>Jackpot</b> : '+esc(jack.jackpot)+'</div>':'');
  }

  /* ---------- état à afficher ---------- */
  function normalise(rot){return ((rot%360)+360)%360;}
  /* Angle d'arrêt déterministe pour un secteur et un tirage donnés (même résultat à chaque rendu et après un rechargement). */
  function angleArret(s,at){
    const u=((Math.abs(Number(at)||0)*0.61803398875)%1)*2-1;
    return normalise(-(s.mid+u*s.ang*.3));
  }
  function infos(j,st){
    const r=j&&j.systemes&&j.systemes.roueJournaliere;
    const data=st&&st.data||{};
    const histo=Array.isArray(data.history)&&data.history[0]?data.history[0]:null;
    const readyAt=Number(data.readyAt)||0;
    return {r:r,histo:histo,readyAt:readyAt,pret:readyAt-maintenant()<=0};
  }
  function etatAffiche(j,st){
    if(anim){
      return {liste:secteurs(anim.fige.table),rot:anim.rot,gagnant:-1};
    }
    const f=infos(j,st);
    if(!f.r||!Array.isArray(f.r.table)||!f.r.table.length)return null;
    if(f.pret){
      const liste=secteurs(f.r.table);
      return {liste:liste,rot:repos.tier===f.r.tier?repos.rot:0,gagnant:-1};
    }
    /* déjà tourné : roue du palier du dernier tour, secteur gagnant marqué, figée */
    const tbl=f.histo&&f.r.derniere&&f.r.derniere.tier===f.histo.tier?f.r.derniere.table:f.r.table;
    const liste=secteurs(tbl);
    let g=f.histo&&Number(f.histo.secteur)>=0?Number(f.histo.secteur):(f.histo?secteurDepuisLot(liste,f.histo.reward):-1);
    if(g>=liste.length)g=-1;
    let rot=0;
    if(g>=0)rot=repos.cle===('a'+f.readyAt)?repos.rot:angleArret(liste[g],f.readyAt);
    return {liste:liste,rot:rot,gagnant:g};
  }

  function rendreCarte(st,j,boutonHtml){
    if(!anim)memo={st:st,j:j};
    const e=etatAffiche(j,st);
    if(!e)return '<div class="rb-roue"><div class="rb-roue-int"><div class="rb-titre">Roue journalière</div>'+boutonHtml+'</div></div>';
    return '<div class="rb-roue" data-roue-v1="1"><div class="rb-roue-int"><div class="rb-titre">Roue journalière</div>'+svgRoue(e.liste,e.rot,e.gagnant)+boutonHtml+legende(e.liste,e.gagnant)+'</div></div>';
  }

  /* ---------- lancement : le MOTEUR d'abord, la roue ensuite ---------- */
  function appliquerRot(){
    if(!anim)return;
    const g=document.querySelector('.rb-rot');
    if(g)g.style.transform='rotate('+anim.rot.toFixed(3)+'deg)';
  }
  function copie(o){try{return JSON.parse(JSON.stringify(o));}catch(_e){return o;}}
  function lancer(){
    if(anim||!memo.st)return;
    const f=infos(memo.j,memo.st);
    if(!f.pret||!f.r||!Array.isArray(f.r.table))return;
    anim={phase:'attente',fige:{table:copie(f.r.table),tier:f.r.tier},rot:repos.tier===f.r.tier?repos.rot:0,stAvant:copie(memo.st),prixAvant:prixMemo,totalAvant:totalMemo};
    /* le son de la roue (cliquets) est joué par recevoir() ; ce drapeau évite le jingle de réponse */
    window.__roueSonneeIdleV1__=true;
    clearTimeout(minuterieSecours);
    minuterieSecours=setTimeout(function(){if(anim&&anim.phase==='attente')echec();},9000);
    redessiner();
    if(typeof window.__collecterSystemeMetaIdleV130__==='function')window.__collecterSystemeMetaIdleV130__('dailySpin');
    else echec();
  }
  function redessiner(){
    try{
      const H=window.__SOREAL_IDLE_META_HOST_V130__;
      if(document.querySelector('.soreal-idle-page-root-v28[data-menu="moneyPit"]')&&H&&typeof H.rafraichirMenuRacineIdleV28_==='function'&&H.getIdleEtat())H.rafraichirMenuRacineIdleV28_();
    }catch(_e){}
  }
  function echec(){
    if(!anim)return;
    window.__roueSonneeIdleV1__=false;
    anim=null;clearTimeout(minuterieSecours);redessiner();
  }
  function ease(t){const e=1-Math.pow(1-t,4);const r=Math.min(1,t/.06);return e*(r*r*(3-2*r));}  /* départ vif, long ralentissement en cloche */
  /* Instants (en secondes) où la roue franchit une frontière de secteur : les cliquets du son. */
  function instantsCliquets(liste,r0,delta){
    const tps=[];let dernier=-1,idx=-1;
    for(let k=0;k<=840;k++){
      const u=k/840,phi=normalise(-(r0+delta*ease(u)));
      let ix=0;for(let i=0;i<liste.length;i++)if(phi>=liste[i].a0&&phi<liste[i].a1){ix=i;break;}
      if(idx>=0&&ix!==idx&&u*DUREE_MS/1000-dernier>=.035){tps.push(u*DUREE_MS/1000);dernier=u*DUREE_MS/1000;}
      idx=ix;
    }
    return tps;
  }
  /* Appelé par meta-progression-v130.js à la réponse du moteur. `fin` : ce qu'il faut faire quand la roue s'est arrêtée (annonce du lot). Renvoie true si la roue prend en charge l'affichage. */
  function recevoir(resultat,fin){
    if(!anim||anim.phase!=='attente'||!resultat)return false;
    const liste=secteurs(anim.fige.table);
    let g=Number(resultat.secteur);
    if(!(g>=0&&g<liste.length))g=secteurDepuisLot(liste,resultat.reward);
    if(g<0){echec();return false;}
    clearTimeout(minuterieSecours);
    const cible=angleArret(liste[g],Number(resultat.readyAt)||0);
    const r0=anim.rot;
    const delta=normalise(cible-normalise(r0))+360*TOURS;
    anim.phase='tourne';anim.t0=null;anim.gagnant=g;anim.liste=liste;anim.fin=fin;
    let reduit=false;
    try{reduit=Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){}
    const terminer=function(){
      anim.rot=r0+delta;
      /* l'état « déjà tourné » retrouve exactement cet angle (clé = échéance enregistrée par le moteur) */
      repos={rot:normalise(anim.rot),cle:'a'+(Number(resultat.readyAt)||0),tier:anim.fige.tier};
      const fn=anim.fin;
      anim=null;
      redessiner();
      if(typeof fn==='function')try{fn();}catch(_e){}
    };
    if(reduit){anim.rot=r0+delta;terminer();return true;}
    try{
      const audio=window.__SOREAL_IDLE_AUDIO_V199__;
      if(audio&&typeof audio.roueCliquets==='function')audio.roueCliquets(instantsCliquets(liste,r0,delta),DUREE_MS/1000);
    }catch(_e){}
    const cadre=function(ts){
      if(!anim||anim.phase!=='tourne')return;
      if(anim.t0==null)anim.t0=ts;
      const u=Math.min(1,(ts-anim.t0)/DUREE_MS);
      anim.rot=r0+delta*ease(u);
      appliquerRot();
      /* le pointeur « claque » à chaque secteur franchi */
      const phi=normalise(-anim.rot);let ix=0;
      for(let i=0;i<liste.length;i++)if(phi>=liste[i].a0&&phi<liste[i].a1){ix=i;break;}
      if(anim.ix!==undefined&&ix!==anim.ix){const ai=document.querySelector('.rb-aiguille');if(ai){ai.style.transform='rotate(-16deg)';setTimeout(function(){ai.style.transform='';},70);}}
      anim.ix=ix;
      if(u<1)requestAnimationFrame(cadre);else terminer();
    };
    requestAnimationFrame(cadre);
    return true;
  }

  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(appliquerRot);
  window.__lancerRoueIdleV1__=lancer;

  window.__SOREAL_IDLE_ROUE_V1__={
    rendreCarte:rendreCarte,lancer:lancer,recevoir:recevoir,echec:echec,
    enCours:function(){return Boolean(anim);},
    stAvant:function(){return anim?anim.stAvant:null;},
    totalAvant:function(){return anim?anim.totalAvant:null;},
    prixAvant:function(){return anim?anim.prixAvant:null;},
    memoPrix:function(prix,total){if(!anim){prixMemo=prix;totalMemo=total;}},
    secteurs:secteurs,secteurDepuisLot:secteurDepuisLot,NOMS:NOMS,DUREE_MS:DUREE_MS,TOURS:TOURS,ease:ease
  };
})();
