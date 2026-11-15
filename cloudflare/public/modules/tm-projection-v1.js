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
  /*
   * COPIE de la boucle du moteur (avancerTmProgressifV1, idle-ngu-pistes.js). Lu dans le jeu (build 1260, 2026-11-15) : l'Or du niveau est payé AU DÉBUT (barre à 0, premier tick) ; sans assez d'Or la barre ne bouge pas ;
   * à la fin du niveau la barre repart de 0 sans report. gps = Or par seconde net de la machine : l'Or arrive pendant que la barre attend (le moteur l'ajoute en continu). « Payé » = barre > 0 (fill0 > 0 ou deja >= 1).
   */
  var step=Number(p.palier)>0?Number(p.palier):0;
  var brut=Number(p.brut)>0?Number(p.brut):step;
  var fill0=Math.max(0,Math.min(1,Number(p.fill0)||0));
  var ecoule=Math.max(0,Number(p.ecoule)||0);
  var niveau0=Number(p.niveau0)||0;
  var plafond=p.plafond===undefined?Infinity:p.plafond;
  var or0=p.or===null||p.or===undefined?null:Number(p.or);
  var gps=Math.max(0,Number(p.gps)||0);
  var deja=Math.max(0,Math.floor(Number(p.deja)||0));
  var out={fill:fill0,restant:0,palier:step,franchis:0,deja:deja,or:or0,faussesOr:false,manqueOr:0,bloqueDefi:false};
  if(!(step>0)||ecoule<=1e-12)return out;   /* le moteur ne traite aucun événement sans temps écoulé */
  var PAYE=1e-9;
  var prog=fill0*step;
  var franchis=0,tau=0,debit=0;
  var paye=prog>0||deja>=1;
  var garde=0;
  while(garde++<20000){
    if(franchis>=plafond){out.bloqueDefi=true;out.faussesOr=true;paye=false;prog=0;break;}
    if(!paye){
      var cible=niveau0+franchis+1,cout=coutNiveau(cible);
      if(or0!==null){
        var dispo=or0+gps*tau-debit;
        if(dispo+1e-9<cout){
          var attente=gps>0?(cout-dispo)/gps:Infinity;
          if(tau+attente<=ecoule+1e-12){tau+=attente;}
          else{out.faussesOr=true;out.manqueOr=Math.max(0,cout-(dispo+gps*(ecoule-tau)));prog=0;tau=ecoule;break;}
        }
      }
      debit+=cout;deja=franchis+1;paye=true;prog=PAYE;
    }
    var manque=Math.max(0,step-prog);
    if(ecoule-tau+1e-12<manque){prog+=ecoule-tau;tau=ecoule;break;}
    tau+=manque;prog=0;paye=false;franchis+=1;
    brut=brut*(niveau0+1+franchis)/(niveau0+franchis);
    step=Math.max(1,Math.ceil(brut/TICK-1e-9))*TICK;
  }
  out.franchis=franchis;out.deja=deja;out.or=or0===null?null:or0-debit;out.palier=step;
  out.restant=Math.max(0,step-prog);
  out.fill=Math.max(0,Math.min(1,prog/step));
  return out;
}
root.__SOREAL_IDLE_TM_PROJECTION_V1__={projeter:projeter,coutNiveau:coutNiveau};
})(typeof window!=='undefined'?window:globalThis);
