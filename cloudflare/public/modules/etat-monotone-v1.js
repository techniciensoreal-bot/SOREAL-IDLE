/*
 * SOREAL IDLE — « jamais de marche arrière » des nombres qui montent (Norman, 2026-10-22 : « je vois encore des chiffres faire des mini marches arrière pendant que ma vie augmente ; comment faire pour que ça n'arrive plus jamais ? »).
 *
 * Cause : deux auteurs pour un même nombre. La page prévoit la suite (régénération des PV, énergie, Or… à chaque image) ; chaque réponse du moteur REMPLACE l'état avec les valeurs de l'instant où son calcul a COMMENCÉ, donc
 * un peu en retard (de quelques dizaines de ms à plusieurs secondes sur un gros compte). Au remplacement, le nombre affiché recule d'autant. Le correctif précédent ne couvrait que les PV, hors combat, avec une tolérance fixe de 1,5 s.
 *
 * Règle générale (appliquée au remplacement de l'état, une seule fois pour tous les menus) : pour les nombres qui MONTENT (PV, énergie, magie, EXP de run, monnaies, ressources), on apprend leur vitesse de montée ; si la nouvelle valeur est
 * plus basse que l'ancienne d'AU PLUS ce que la vitesse donne pendant l'âge réel de la réponse (+ 0,3 s de marge), c'est du retard, pas un vrai retrait : la valeur déjà affichée est gardée. Un vrai retrait (achat, dégâts, renaissance)
 * dépasse ce seuil et passe tel quel. Le moteur rattrape ensuite la valeur gardée tout seul.
 *   window.__SOREAL_IDLE_MONOTONE_V1__ = { garder(ancien, nouveau, ageSecondes), stats(), reinitialiser() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MONOTONE_V1__)return;

  var MARGE_S=0.3;
  var RACINE=['energie','magie','xp','pvJoueur'];
  var pentes={};
  var dernier=0;
  var gardes={},nbGardes=0,nbRecuAnormaux=0;
  var dernierSignal={};

  function nombre_(v){return typeof v==='number'&&isFinite(v)?v:null;}
  function chemins_(nouveau){
    var l=RACINE.slice(),i;
    var cur=nouveau&&nouveau.systemes&&nouveau.systemes.currencies;
    if(cur&&typeof cur==='object')Object.keys(cur).forEach(function(k){l.push('systemes.currencies.'+k);});
    var res=nouveau&&nouveau.systemes&&nouveau.systemes.resources;
    if(res&&typeof res==='object')Object.keys(res).forEach(function(k){l.push('systemes.resources.'+k+'.current');});
    return l;
  }
  function lire_(o,chemin){
    var p=chemin.split('.'),c=o;
    for(var i=0;i<p.length;i++){if(c==null||typeof c!=='object')return null;c=c[p[i]];}
    return nombre_(c);
  }
  function ecrire_(o,chemin,v){
    var p=chemin.split('.'),c=o;
    for(var i=0;i<p.length-1;i++){if(c==null||typeof c!=='object')return false;c=c[p[i]];}
    if(c==null||typeof c!=='object')return false;
    c[p[p.length-1]]=v;return true;
  }
  /* Les objets de la réponse sont partagés avec le moteur : on ne modifie qu'une copie des niveaux traversés. */
  function copierChemin_(o,chemin){
    var p=chemin.split('.'),c=o;
    for(var i=0;i<p.length-1;i++){
      if(c[p[i]]==null||typeof c[p[i]]!=='object')return false;
      c[p[i]]=Array.isArray(c[p[i]])?c[p[i]].slice():Object.assign({},c[p[i]]);
      c=c[p[i]];
    }
    return true;
  }
  function signaler_(code,detail){
    var t=Date.now();
    if(dernierSignal[code]&&t-dernierSignal[code]<10000)return;
    dernierSignal[code]=t;
    try{var D=window.__SOREAL_IDLE_DIAG_V1__;if(D&&typeof D.signaler==='function')D.signaler(code,detail);}catch(_e){}
  }

  function garder(ancien,nouveau,ageS){
    if(!ancien||!nouveau||typeof ancien!=='object'||typeof nouveau!=='object'||ancien===nouveau)return 0;
    var maintenant=Date.now();
    var dt=dernier?(maintenant-dernier)/1000:0;
    dernier=maintenant;
    var age=Math.max(0,Number(ageS)||0);
    var garde=0;
    chemins_(nouveau).forEach(function(p){
      var a=lire_(ancien,p),n=lire_(nouveau,p);
      if(a===null||n===null)return;
      /* Hors combat seulement pour les PV : en plein combat la page est l'autorité sur ses PV (dégâts reçus). */
      if(p==='pvJoueur'&&(ancien.combatBossActif||nouveau.combatBossActif))return;
      if(n>=a){
        if(dt>0.05&&dt<5&&n>a){
          var v=(n-a)/dt,pr=pentes[p];
          pentes[p]=pr==null?v:0.7*pr+0.3*Math.min(v,pr*4+1e-9);
        }
        return;
      }
      var pente=Math.max(0,pentes[p]||0);
      /* +1 pour les grands nombres : le moteur arrondit à l'unité, la page prévoit des décimales (un recul de 1 sur 100 millions n'est jamais un vrai retrait). */
      var tolerance=pente*(age+MARGE_S)+(Math.abs(a)>=1000?1:0);
      if(a-n<=tolerance&&pente>0){
        if(copierChemin_(nouveau,p)&&ecrire_(nouveau,p,a)){garde++;gardes[p]=(gardes[p]||0)+1;nbGardes++;}
      }else if(pente>0&&(a-n)<=Math.abs(a)*0.01){
        /* Recul qui dépasse le retard attendu mais reste minuscule : accepté (peut être un vrai petit retrait), mais signalé au journal de diagnostic pour qu'on le voie. */
        nbRecuAnormaux++;
        signaler_('recul_nombre:'+p,Math.round(a*1000)/1000+' -> '+Math.round(n*1000)/1000+' (tolérance '+Math.round(tolerance*1000)/1000+', âge '+Math.round(age*1000)+' ms)');
      }
    });
    return garde;
  }
  function stats(){return {gardes:nbGardes,parChemin:Object.assign({},gardes),reculsAnormaux:nbRecuAnormaux,pentes:Object.assign({},pentes)};}
  function reinitialiser(){pentes={};dernier=0;gardes={};nbGardes=0;nbRecuAnormaux=0;dernierSignal={};}

  window.__SOREAL_IDLE_MONOTONE_V1__={garder:garder,stats:stats,reinitialiser:reinitialiser,chemins:chemins_};
})();
