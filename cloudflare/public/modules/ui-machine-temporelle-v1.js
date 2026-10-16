/*
 * SOREAL IDLE — Machine temporelle (comptes à rebours, barres) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_machine_temporelle_v1)return;
  REG.__chargé_ui_machine_temporelle_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function patcherResumeStatsIdleV28_(){return REG.patcherResumeStatsIdleV28_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}

      function formaterEtaTimeMachineIdleV1_(secondes){
        const total=Math.max(0,Math.ceil(idleNombre_(secondes)));
        if(total<=0)return '0 s';
        const h=Math.floor(total/3600);
        const m=Math.floor((total%3600)/60);
        const s=total%60;
        if(h>0)return h+' h '+String(m).padStart(2,'0')+' min '+String(s).padStart(2,'0')+' s';
        if(m>0)return m+' min '+String(s).padStart(2,'0')+' s';
        return s+' s';
      }

      function assurerPisteMagicTimeMachineIdleV1_(){
        if(REG.idleMenuActifV28!=='machine'||!REG.idleEtat||!REG.idleEtat.systemes)return;

        const systemes=Array.isArray(REG.idleEtat.systemes.systems)
          ?REG.idleEtat.systemes.systems
          :[];
        const bloodMagic=systemes.find(function(s){
          return s&&s.id==='bloodMagic';
        });
        const magicDebloquee=Boolean(
          bloodMagic&&
          bloodMagic.state&&
          bloodMagic.state.unlocked
        );

        if(!magicDebloquee)return;

        const pisteMagic=document.querySelector(
          '.soreal-idle-tm-piste-v1.or .soreal-idle-tm-remplissage-v1'
        );

        if(!pisteMagic){
          /* audit 2026-10-13 : au plus un redessin par seconde (sinon un menu entier redessiné à chaque tick si l'élément n'apparaît jamais) */
          const maintenantPiste=Date.now();
          if(maintenantPiste-idlePisteMagicTmRedessinV1<1000)return;
          idlePisteMagicTmRedessinV1=maintenantPiste;
          rafraichirMenuRacineIdleV28_();
        }
      }

      let idlePisteMagicTmRedessinV1=0;

      let idleTmSyncNiveauV1=0;

      function actualiserCompteReboursTimeMachineIdleV1_(){
        if(REG.idleMenuActifV28!=='machine')return;
        const maintenant=Date.now();
        document.querySelectorAll('.soreal-idle-tm-eta-v1[data-tm-eta-seconds]').forEach(function(el){
          const brut=el.dataset.tmEtaSeconds;
          if(brut==='')return;
          if(!el.dataset.tmEtaAt){
            /* Le compte à rebours part de l'instant où le serveur a produit ces chiffres (réception moins un demi aller-retour), pas du premier passage du minuteur. */
            const vueTm=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.timeMachineView;
            const recuTm=REG.idleEtat&&Number(REG.idleEtat.__recuPerfV1);
            const ancreTm=(vueTm&&vueTm.__ancreTmV1!==undefined)?vueTm.__ancreTmV1:(recuTm>0?recuTm-(typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0)/2:performance.now());
            if(vueTm&&vueTm.__ancreTmV1===undefined)vueTm.__ancreTmV1=ancreTm;
            el.dataset.tmEtaAt=String(Date.now()-(performance.now()-ancreTm));
          }
          const base=Math.max(0,idleNombre_(brut));
          const at=idleNombre_(el.dataset.tmEtaAt)||maintenant;
          const pisteEl=el.closest?el.closest('.soreal-idle-tm-piste-v1'):null;
          const barreEl=pisteEl?pisteEl.querySelector('.soreal-idle-tm-remplissage-v1'):null;
          const fill0=barreEl&&barreEl.dataset.tmFill0!==undefined?Math.max(0,Math.min(1,idleNombre_(barreEl.dataset.tmFill0))):1;
          /*
           * Niveau suivant SANS attendre la synchro (Norman, 2026-10-04 : « quand j'ajoute de l'énergie à la barre Vitesse de la machine, la barre avance plus vite, mais arrivée à la fin elle ne passe pas au niveau suivant ;
           * j'ai dû ajouter de l'énergie pour qu'elle reprenne là où elle devait être »). Le niveau N dure N fois le niveau 1 : à 0 s, on passe au niveau suivant, plus long dans le même rapport, et la barre repart du reste.
           * Le serveur compte les mêmes niveaux : la synchro suivante confirme (on la demande tout de suite).
           */
          const piste=el.getAttribute('data-tm-eta-track')||'';
          const sysTm=REG.idleEtat&&REG.idleEtat.systemes&&Array.isArray(REG.idleEtat.systemes.systems)?REG.idleEtat.systemes.systems.find(function(x){return x&&x.id==='timeMachine';}):null;
          const donneesTm=sysTm&&sysTm.state&&sysTm.state.data;
          const niveau0=donneesTm?idleEntier_(piste==='or'?donneesTm.goldLevel:donneesTm.speedLevel):null;
          let restant=base-(maintenant-at)/1000;
          let palier=fill0<1&&base>0?base/(1-fill0):0;
          let franchis=0,faussesOr=false,manqueOr=0;
          if(restant<=0&&niveau0!==null&&palier>0){
            /*
             * Niveaux de la machine : ils COÛTENT de l'Or (5 000 000 × niveau visé, comme le moteur) et s'enchaînent sans pause (Norman, 2026-10-09 : « toutes les barres qui consomment de l'Or doivent enchaîner et
             * l'Or diminuer très vite ») : chaque niveau franchi débite l'Or local tout de suite ; faute d'Or, la barre reste pleine et le dit. La synchro confirme.
             */
            if(el.__tmDebitesAt!==el.dataset.tmEtaAt){el.__tmDebitesAt=el.dataset.tmEtaAt;el.__tmDebites=0;}
            let deja=el.__tmDebites||0;
            const monnaiesTm=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies;
            let orTm=idleNombre_(monnaiesTm&&monnaiesTm.gold);
            while(restant<=0&&franchis<20000){
              const cibleNiv=niveau0+franchis+1;
              if(franchis>=deja){
                const coutNiv=5000000*Math.max(1,cibleNiv);
                if(monnaiesTm&&orTm+1e-9<coutNiv){faussesOr=true;manqueOr=coutNiv-orTm;restant=0;break;}
                if(monnaiesTm)orTm-=coutNiv;
                deja+=1;
              }
              franchis+=1;
              palier=palier*(niveau0+1+franchis)/(niveau0+franchis);
              restant+=palier;
            }
            if(monnaiesTm&&deja!==(el.__tmDebites||0)){monnaiesTm.gold=Math.max(0,orTm);patcherResumeStatsIdleV28_(REG.idleEtat);}
            el.__tmDebites=deja;
          }else{
            restant=Math.max(0,restant);
            /* Barre déjà pleine (en attente d'Or côté serveur) : on le dit ; dès que l'Or suffit, on redemande l'état pour que le niveau suivant tombe sans attendre. */
            if(niveau0!==null&&fill0>=1&&base<=0){
              const coutAttente=5000000*Math.max(1,niveau0+1);
              const orAttente=idleNombre_(REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies&&REG.idleEtat.systemes.currencies.gold);
              if(orAttente+1e-9<coutAttente){faussesOr=true;manqueOr=coutAttente-orAttente;}
              else if(Date.now()-idleTmSyncNiveauV1>2000){idleTmSyncNiveauV1=Date.now();synchroniserJeuIdleV7_(true);}
            }
          }
          if(franchis>0||faussesOr){
            const niveauEl=document.querySelector('[data-tm-niveau="'+piste+'"]');
            if(niveauEl)niveauEl.textContent=formatGrandNombreIdleV70_(niveau0+franchis);
            if(Date.now()-idleTmSyncNiveauV1>2000){
              idleTmSyncNiveauV1=Date.now();
              synchroniserJeuIdleV7_(true);
            }
          }
          const secondesAffichees=Math.ceil(restant);
          if(faussesOr){
            const texteOr='🪙 Il manque <b class="or-somme-v1">'+formatGrandNombreIdleV70_(manqueOr)+' Or</b> pour le niveau suivant.';
            if(el.__orHtmlV1!==texteOr){el.innerHTML=texteOr;el.__orHtmlV1=texteOr;}
            el.dataset.tmEtaLast='or';
          }else if(el.dataset.tmEtaLast!==String(secondesAffichees)){
            el.dataset.tmEtaLast=String(secondesAffichees);
            el.__orHtmlV1=null;
            el.textContent='Fin de la barre dans '+formaterEtaTimeMachineIdleV1_(restant);
          }
          /* La barre avance avec le compte à rebours (fraction de départ + temps écoulé / durée restante au départ), plus figée entre deux synchros ; après un niveau franchi elle repart du reste du niveau suivant. */
          if(barreEl&&barreEl.dataset.tmFill0!==undefined&&base>0){
            let fill;
            /* Norman (2026-10-13) : « quand on est à 50 niveaux par seconde pour la Machine temporelle, la barre doit rester pleine » : un niveau de 0,25 s ou moins (4 par seconde et plus) ne se voit plus avancer, elle reste pleine au lieu de clignoter */
            if(faussesOr)fill=1;
            else if(palier>0&&palier<=SEUIL_NIVEAU_RAPIDE_TM_V1)fill=1;
            else if(franchis>0)fill=Math.max(0,Math.min(1,1-restant/palier));
            else if(fill0<1)fill=Math.min(1,fill0+((maintenant-at)/1000)/(base/(1-fill0)));
            else fill=1;
            const largeurTm=(fill*100).toFixed(2)+'%';
            if(barreEl.style.width!==largeurTm)barreEl.style.width=largeurTm;
          }
        });
      }

      const SEUIL_NIVEAU_RAPIDE_TM_V1=0.25;

      function patcherBarresTimeMachineIdleV1_(j){
        if(
          REG.idleMenuActifV28!=='machine' ||
          !j ||
          !j.systemes ||
          !j.systemes.timeMachineView
        ){
          return;
        }

        const vue=j.systemes.timeMachineView;
        [
          ['vitesse',vue.speedFill,vue.speedEtaSeconds],
          ['or',vue.goldFill,vue.goldEtaSeconds]
        ].forEach(function(entree){
          const remplissage=document.querySelector(
            '.soreal-idle-tm-piste-v1.'+
            entree[0]+
            ' .soreal-idle-tm-remplissage-v1'
          );
          if(!remplissage)return;

          let pct=Math.max(
            0,
            Math.min(
              100,
              idleNombre_(entree[1])*100
            )
          );

          /* niveaux très courts (durée d'un niveau = ETA / (1 - remplissage)) : barre pleine, comme dans le tick */
          const etaPatch=Number(entree[2]),resteFill=1-pct/100,palierPatch=Number.isFinite(etaPatch)&&resteFill>1e-9?etaPatch/resteFill:0;
          if(palierPatch>0&&palierPatch<=SEUIL_NIVEAU_RAPIDE_TM_V1)pct=100;
          remplissage.style.width=pct.toFixed(4)+'%';
          remplissage.dataset.tmFill0=(pct/100).toFixed(6);
          remplissage.setAttribute('aria-valuenow',pct.toFixed(4));

          const barre=remplissage.parentElement;
          if(barre){
            barre.title='Progression : '+pct.toLocaleString(
              'fr-FR',
              {minimumFractionDigits:2,maximumFractionDigits:4}
            )+' %';
          }

          const eta=document.querySelector(
            '.soreal-idle-tm-piste-v1.'+
            entree[0]+
            ' .soreal-idle-tm-eta-v1'
          );
          if(eta){
            const etaValide=Number.isFinite(Number(entree[2]));
            eta.dataset.tmEtaSeconds=etaValide?String(Math.max(0,idleNombre_(entree[2]))):'';
            /* Les chiffres ont été produits par le serveur un demi aller-retour avant leur arrivée. */
            eta.dataset.tmEtaAt=String(Date.now()-(typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0)/2);
            eta.dataset.tmEtaLast='';
            eta.textContent=etaValide
              ?'Fin de la barre dans '+formaterEtaTimeMachineIdleV1_(entree[2])
              :'Alloue une ressource pour démarrer la barre';
          }
        });

        /* Chiffres de la page (GPS, multiplicateurs, niveaux) : mis à jour en place avec la synchro. */
        if(typeof window.__patcherChiffresTimeMachineIdleV1__==='function')window.__patcherChiffresTimeMachineIdleV1__(j);
      }

  Object.assign(REG,{
    formaterEtaTimeMachineIdleV1_:formaterEtaTimeMachineIdleV1_,
    assurerPisteMagicTimeMachineIdleV1_:assurerPisteMagicTimeMachineIdleV1_,
    actualiserCompteReboursTimeMachineIdleV1_:actualiserCompteReboursTimeMachineIdleV1_,
    patcherBarresTimeMachineIdleV1_:patcherBarresTimeMachineIdleV1_
  });
})();
