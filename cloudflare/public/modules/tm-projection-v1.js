/*
 * SOREAL IDLE — projection d'une piste de la Machine temporelle (Norman, 2026-11-05 : « je veux que ça fonctionne comme le jeu original sous Unity » ; plan design/PLAN-MOTEUR-UNIQUE.md, étapes 3 et 4).
 *
 * UNE SEULE formule pour « où en est la barre dans t secondes » : celle du moteur (idle-ngu-pistes.js, advanceTimeMachine). La durée d'un niveau est proportionnelle à (niveau + 1) ; chaque niveau franchi coûte 5 000 000 × niveau
 * visé en Or et, faute d'Or, la barre reste PLEINE (jamais de perte de progression). HISTORIQUE (2026-11-05) : l'ancien pas du moteur remettait le reste de la barre à l'ÉCHELLE de la nouvelle durée au passage d'un niveau (artefact du pas
 * grossier : ×2 au passage du niveau 0 au niveau 1), ce qui faisait sauter la barre de l'écran après un Rebirth. Le moteur découpe maintenant le temps aux événements (fin de barre, Or suffisant : Or progressif comme le jeu d'origine) :
 * le temps restant continue sur le niveau suivant en SECONDES, exactement comme ci-dessous. Fonction PURE (aucun DOM, aucune horloge).
 *
 *   window.__SOREAL_IDLE_TM_PROJECTION_V1__.projeter({ palier, fill0, ecoule, niveau0, or, deja, plafond }) ->
 *     { fill, restant, palier, franchis, deja, or, faussesOr, manqueOr, bloqueDefi }
 *   palier  : durée du niveau en cours (secondes, plancher d'un tick compris) ; brut : la même SANS plancher (facultatif) ; fill0 : fraction de barre au départ (0 à 1) ; ecoule : secondes écoulées depuis le départ ;
 *   niveau0 : niveau au départ ; or : Or disponible au départ (null = pas de contrôle d'Or) ; deja : niveaux déjà débités localement (pas de double débit) ; plafond : niveaux au plus autorisés (défi), Infinity sinon.
 */
(function(root){
'use strict';
if(root.__SOREAL_IDLE_TM_PROJECTION_V1__)return;
var COUT_PAR_NIVEAU=5000000;
var TICK=1/50;   /* un niveau dure au moins un tick : 50 niveaux par seconde au plus (wiki NGU Idle, page Energy, section Ticks ; cloudflare/src/idle-tick-v1.js) */
function coutNiveau(niveauVise){return COUT_PAR_NIVEAU*Math.max(1,niveauVise);}
function projeter(p){
  var step=Number(p.palier)>0?Number(p.palier):0;
  var brut=Number(p.brut)>0?Number(p.brut):step;   /* durée du niveau en cours SANS le plancher d'un tick (speedStepBrut / goldStepBrut du moteur) */
  var fill0=Math.max(0,Math.min(1,Number(p.fill0)||0));
  var ecoule=Math.max(0,Number(p.ecoule)||0);
  var niveau0=Number(p.niveau0)||0;
  var plafond=p.plafond===undefined?Infinity:p.plafond;
  var or=p.or===null||p.or===undefined?null:Number(p.or);
  var deja=Math.max(0,Math.floor(Number(p.deja)||0));
  var out={fill:fill0,restant:0,palier:step,franchis:0,deja:deja,or:or,faussesOr:false,manqueOr:0,bloqueDefi:false};
  if(!(step>0))return out;
  var prog=fill0*step+ecoule;   /* progression en secondes, à l'échelle du niveau en cours (comme d.speedProgress) */
  var franchis=0;
  while(prog>=step-1e-12&&franchis<20000){   /* même tolérance que le moteur (avancerTmProgressifV1) : un niveau qui se termine exactement à l'instant demandé est compté */
    if(franchis>=plafond){out.bloqueDefi=true;out.faussesOr=true;prog=step;break;}
    var cible=niveau0+franchis+1;
    if(franchis>=deja){
      var cout=coutNiveau(cible);
      if(or!==null&&or+1e-9<cout){out.faussesOr=true;out.manqueOr=cout-or;prog=step;break;}   /* barre pleine en attente d'Or */
      if(or!==null)or-=cout;
      deja+=1;
    }
    franchis+=1;
    brut=brut*(niveau0+1+franchis)/(niveau0+franchis);
    var pas=Math.max(TICK,brut);                             /* durée du niveau suivant, au moins un tick */
    prog=Math.max(0,prog-step);                              /* le reste du temps continue sur le niveau suivant, en SECONDES : le moteur découpe maintenant le temps aux événements (Or progressif, avancerTmProgressifV1) */
    step=pas;
  }
  out.franchis=franchis;out.deja=deja;out.or=or;out.palier=step;
  out.restant=Math.max(0,step-prog);
  out.fill=Math.max(0,Math.min(1,prog/step));
  return out;
}
root.__SOREAL_IDLE_TM_PROJECTION_V1__={projeter:projeter,coutNiveau:coutNiveau};
})(typeof window!=='undefined'?window:globalThis);
