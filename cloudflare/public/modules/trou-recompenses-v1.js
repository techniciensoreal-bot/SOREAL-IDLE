/*
 * Récompenses possibles du Trou sans fond (Norman, 2026-11-02 : « suivant ce que le joueur a en stock, montre-lui les récompenses possibles pour son palier ; dispose EXACTEMENT de la même manière le trou et la roue »,
 * puis « pas de roue, pas de secteurs : l'image du trou reste comme avant, les récompenses en dessous »).
 * Expose window.__SOREAL_IDLE_TROU_V1__ = { rendreLegende, decrire, ICONES }.
 *
 * La liste prend, dans la carte d'action du trou, la place que la légende de la roue prend dans la carte d'action de la roue (même gabarit .rb-legende / .rb-leg). Les lots viennent du moteur
 * (state.systemes.puitRecompenses = { tier, min, suivant, lots, ap }, idle-ngu-snapshot.js, moneyPitSnapshotV1) : rien n'est recopié ici.
 * Fidélité (règle n°1) : le wiki NGU Idle (page Money Pit) liste les lots de chaque palier mais NE PUBLIE AUCUNE probabilité : aucun pourcentage n'est écrit ni déduit.
 * Anti-spoil (règle n°2) : le moteur n'envoie que les lots de systèmes déjà débloqués ; aucun total, aucune case « ??? », et `suivant` / `min` ne sont jamais affichés (ils servent seulement au guetteur de money-pit-page-v1.js
 * pour redemander une synchro quand l'Or franchit un palier).
 * Règle n°4 : aucun état d'animation ici ; le rendu est une fonction pure de l'état (le morph ne trouve rien à changer).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TROU_V1__)return;

  const ICONES={
    stats:"<path d=\"M20.500 3.500l-9.800 9.800 2 2 9.800-9.800V3.500z\" fill=\"#e8f1ff\"/><path d=\"M9.500 12.500l2 2-3 3-2-2z\" fill=\"#ffd24a\"/><path d=\"M6.500 15.500l2 2-2.500 2.500-1.500-.5-.5-1.500z\" fill=\"#c68a3c\"/><path d=\"M3.500 3.500l9.800 9.800\" stroke=\"#8fa3c8\" stroke-width=\"1.300\" stroke-linecap=\"round\"/>",
    boost:"<path d=\"M12 2l6.500 8.500H14V17h-4v-6.500H5.500z\" fill=\"#3ddc84\"/><path d=\"M7 19.500h10V22H7z\" fill=\"#bff0b0\"/>",
    heart:"<path d=\"M12 21s-8-5.500-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.500-8 11-8 11z\" fill=\"#ff5a6e\"/><path d=\"M7 8.500a2.500 2.500 0 0 1 2.500-1.800\" stroke=\"#ffd0d6\" stroke-width=\"1.400\" fill=\"none\" stroke-linecap=\"round\"/>",
    regen:"<path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z\" fill=\"#7be07b\"/><path d=\"M10.500 5h3v6h6v2h-6v6h-3v-6h-6v-2h6z\" fill=\"#d6f7c8\"/>",
    cube:"<path d=\"M12 2l9 5v10l-9 5-9-5V7z\" fill=\"#5cc8ff\"/><path d=\"M12 2l9 5-9 5-9-5z\" fill=\"#c9efff\"/><path d=\"M12 12v10\" stroke=\"#1d7aa8\" stroke-width=\"1.200\"/>",
    xp:"<path d=\"M12 2l2.900 6.300 6.900.8-5.100 4.700 1.400 6.800L12 17l-6.100 3.600 1.400-6.800L2.200 9.100l6.900-.8z\" fill=\"#b266ff\" stroke=\"#6a2fb0\" stroke-width=\"1\" stroke-linejoin=\"round\"/>",
    wandoos:"<rect x=\"2.500\" y=\"4\" width=\"19\" height=\"13\" rx=\"1.800\" fill=\"#e8f1ff\"/><rect x=\"4.500\" y=\"6\" width=\"15\" height=\"9\" fill=\"#2a9df4\"/><path d=\"M8 20h8v1.500H8zM11 17h2v3h-2z\" fill=\"#cfd8ea\"/>"
  };

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function nb(v,d){const H=window.__SOREAL_IDLE_META_HOST_V130__;return H&&typeof H.formatGrandNombreIdleV70_==='function'?String(H.formatGrandNombreIdleV70_(v,d)):String(Math.round(v*100)/100).replace('.',',');}
  /* Icônes communes avec la roue (AP, graines) : lues à l'exécution. */
  function iconeSvg(id){
    const R=(window.__SOREAL_IDLE_ROUE_V1__&&window.__SOREAL_IDLE_ROUE_V1__.ICONES)||{};
    const corps=ICONES[id]||R[id]||'';
    return '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">'+corps+'</svg>';
  }

  /* Un lot du moteur -> { icon, name }. Les noms sont ceux du reste de la page (libelleRecompenseMetaV206_). */
  function decrire(l){
    if(l.adventureStats)return {icon:'stats',name:'+'+nb(l.adventureStats)+' Puissance et Endurance d’Aventure'};
    if(l.boost)return {icon:'boost',name:'Boost '+nb(l.boost)+' (Puissance, Endurance ou Spécial)'};
    if(l.adventureHp)return {icon:'heart',name:'+'+nb(l.adventureHp)+' PV max d’Aventure'};
    if(l.adventureRegen)return {icon:'regen',name:'+'+nb(l.adventureRegen,2)+' Regen PV d’Aventure'};
    if(l.cubePower)return {icon:'cube',name:'+'+nb(l.cubePower)+' Cube Puissance'};
    if(l.cubeToughness)return {icon:'cube',name:'+'+nb(l.cubeToughness)+' Cube Endurance'};
    if(l.cubeBoth)return {icon:'cube',name:'+'+nb(l.cubeBoth)+' Cube Puissance et Endurance'};
    if(l.experience)return {icon:'xp',name:'+'+nb(l.experience)+' EXP'};
    if(l.wandoos)return {icon:'wandoos',name:'+'+nb(l.wandoos)+' niveau(x) Wandoos'};
    if(l.seeds)return {icon:'seed',name:'+'+nb(l.seeds)+' graines'};
    return {icon:'ap',name:'Récompense'};
  }

  function donnees(j){
    const d=j&&j.systemes&&j.systemes.puitRecompenses;
    if(!d||typeof d!=='object')return null;
    return {tier:Math.max(0,Math.floor(Number(d.tier)||0)),lots:Array.isArray(d.lots)?d.lots:[],ap:Math.max(0,Number(d.ap)||0)};
  }

  /*
   * Liste sous le bouton : une ligne par lot possible (icône, nom), sans pourcentage ; puis l'AP toujours versé en plus. `data-mp-palier` : palier dessiné (le guetteur de la page redemande une synchro
   * et redessine si l'Or en stock change de palier).
   */
  function rendreLegende(j){
    const d=donnees(j);
    if(!d)return '';
    const tete='<div class="rb-jackpot-detail" data-trou-v1="1" data-mp-palier="'+d.tier+'"><b>Récompenses possibles avec ton Or actuel</b></div>';
    if(!d.lots.length)return tete+'<div class="rb-legende"><div class="rb-leg"><span>Avec l’Or que tu as, le trou ne te donnera rien.</span></div></div>';
    /* Un seul lot est tiré, au hasard parmi ces lots (wiki : « a random chance between all available rewards » ; tirage du moteur : moneyPitLotsDisponiblesV1) : chacun a 1 chance sur N (Norman, 2026-11-03 : afficher le % de chance). */
    const pct=(Math.round(1000/d.lots.length)/10).toString().replace('.',',')+' %';
    return tete+'<div class="rb-legende">'+d.lots.map(function(l){
      const s=decrire(l);
      return '<div class="rb-leg">'+iconeSvg(s.icon)+'<span>'+esc(s.name)+'</span><em class="rb-pct">'+pct+'</em></div>';
    }).join('')+'</div><div class="rb-jackpot-detail">Un seul de ces lots est tiré. <b>En plus</b> : '+esc(nb(d.ap))+' AP.</div>';
  }

  window.__SOREAL_IDLE_TROU_V1__={rendreLegende:rendreLegende,decrire:decrire,ICONES:ICONES};
})();
