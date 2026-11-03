/*
 * SOREAL IDLE — la vie affichée pendant un combat de boss est celle du MODÈLE, jamais « le plus bas des deux » (Norman, 2026-11-03 : « le combat est un échange de coups constant ; si la barre remonte, c'est une
 * erreur de calcul ou une latence quelque part ; je veux supprimer le problème à la racine, pas de pansement »).
 *
 * Le modèle est déterministe : vie(t) = vie₀ − vitesse × (t − t₀), la page et le moteur partant du MÊME instant (le clic : snapshot.debutMs, voir definirCombatBossSorealIdle) avec les MÊMES formules (dégâts nets
 * = puissance − défense du boss, attaque du boss − défense moins la régénération defense/20). Les causes d'écart mesurées sont supprimées à la source (départ du moteur au clic, passage du clic compté depuis le clic,
 * temps de tick perdu à chaque réponse) ; il ne reste que la quantification du tick (au plus un pas de 15 Hz). Une réponse du moteur ne REMPLACE donc plus la vie affichée : elle sert à CONTRÔLER le modèle.
 *   - écart sous la tolérance : la vie du modèle (celle de la page) est gardée, rien n'est masqué ni corrigé ;
 *   - écart au-delà : le moteur fait foi (une vraie divergence : effet que la page ne modélise pas) et l'écart est SIGNALÉ au journal de diagnostic (combat_ecart:*), qu'il monte ou qu'il baisse ;
 *   - tout écart notable (> SEUIL_LOG) est signalé même quand il est gardé : une erreur de calcul future se voit tout de suite au lieu d'être cachée.
 *   window.__SOREAL_IDLE_COMBAT_VIE_V1__ = { reconcilier(local, serveur, max, nom), TOLERANCE_PCT, SEUIL_LOG_PCT, stats() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_COMBAT_VIE_V1__)return;
  var TOLERANCE_PCT=3;   /* points de pourcentage de la vie max : au-delà, le moteur fait foi */
  var SEUIL_LOG_PCT=0.5; /* points : écart signalé même quand il est gardé */
  var n={controles:0,adoptes:0,signales:0,pire:0};
  var dernier={};
  function nb(v){v=Number(v);return isFinite(v)?v:null;}
  function signaler(code,detail){
    n.signales++;
    var t=Date.now();
    if(dernier[code]&&t-dernier[code]<5000)return;
    dernier[code]=t;
    try{var D=window.__SOREAL_IDLE_DIAG_V1__;if(D&&typeof D.signaler==='function')D.signaler(code,detail);}catch(_e){}
  }
  /*
   * local : vie affichée ; serveur : vie de la réponse ; max : vie max de la réponse ; vitesse : baisse de cette vie en PV par seconde (négative = elle monte) ; age : secondes écoulées depuis l'instant du moteur.
   * La réponse décrit la vie à l'instant du MOTEUR (t₀) : on la ramène à maintenant, vie(t) = vie₀ − vitesse × (t − t₀), avant de la comparer (latence compensée, jamais ignorée). Renvoie la vie à afficher.
   */
  function reconcilier(local,serveur,max,nom,vitesse,age){
    var l=nb(local),s=nb(serveur),m=nb(max),v=nb(vitesse),a=nb(age);
    if(s!==null&&v!==null&&a!==null&&a>0&&a<30)s=Math.max(0,s-v*a);
    if(l===null)return s;
    if(s===null||m===null||!(m>0))return l;
    n.controles++;
    var ecartPts=(s-l)/m*100;   /* positif : le moteur a PLUS de vie que la page (la page est en avance) */
    if(Math.abs(ecartPts)>n.pire)n.pire=Math.abs(ecartPts);
    var libelle='page '+Math.round(l/m*1000)/10+' % / moteur '+Math.round(s/m*1000)/10+' % ('+(ecartPts>=0?'+':'')+Math.round(ecartPts*100)/100+' pt)';
    if(Math.abs(ecartPts)>TOLERANCE_PCT){
      n.adoptes++;
      signaler('combat_ecart:'+nom+':adopte'+(ecartPts>0?':remonte':':baisse'),libelle);
      return s;
    }
    if(ecartPts>SEUIL_LOG_PCT)signaler('combat_vie_remontee:'+nom,libelle+' (gardé)');
    else if(ecartPts<-SEUIL_LOG_PCT)signaler('combat_ecart:'+nom+':retard',libelle+' (gardé)');
    return l;
  }
  window.__SOREAL_IDLE_COMBAT_VIE_V1__={
    reconcilier:reconcilier,TOLERANCE_PCT:TOLERANCE_PCT,SEUIL_LOG_PCT:SEUIL_LOG_PCT,
    stats:function(){return {controles:n.controles,adoptes:n.adoptes,signales:n.signales,pireEcartPts:Math.round(n.pire*1000)/1000};},
    reinitialiser:function(){n={controles:0,adoptes:0,signales:0,pire:0};dernier={};}
  };
})();
