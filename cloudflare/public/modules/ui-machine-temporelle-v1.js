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

      /* Écran LCD « temps restant » et tube de verre de la tour (Norman, 2026-10-20) : le texte d'origine (« Fin de la barre dans … ») reste lu par les lecteurs d'écran ; l'écran n'affiche que le temps. */
      function poserLcdTmIdleV1_(etaEl,texte,rouge){
        const piste=etaEl&&etaEl.closest?etaEl.closest('.tmm-piste'):null;
        const lcd=piste?piste.querySelector('[data-tm-lcd-eta]'):null;
        if(lcd&&lcd.textContent!==texte)lcd.textContent=texte;
        /* Somme d'Or manquante : écrite en rouge dans l'écran (style en ligne : aucun !important de plus dans le CSS), remise à la couleur normale dès que le texte redevient un temps. */
        if(lcd){const c=rouge?'#ff3b3b':'';if(lcd.style.color!==c)lcd.style.color=c;}
      }
      /*
       * Niveau du tube (Norman, 2026-11-01 : « le menu Machine temporelle est plus lent que les autres, il y a une latence quand je place les points ») : la hauteur du liquide passait par une variable CSS (`--fill`)
       * écrite sur la tour entière, à chaque image. Une variable héritée recalcule le style de TOUT le sous-arbre de la tour (tube, dizaines de bulles animées, dessin de la machine) : mesuré, la page tombait à 45-50 images
       * par seconde (images de 33 ms) contre 60 pour Augmentations ou NGU, et la barre avançait par à-coups. La hauteur s'écrit désormais DIRECTEMENT sur l'élément du liquide : seul ce nœud est recalculé, rendu identique, 60 images par seconde.
       */
      function poserTubeTmIdleV1_(barreEl,largeur){
        const piste=barreEl&&barreEl.closest?barreEl.closest('.tmm-piste'):null;
        if(!piste)return;
        let liq=piste.__tmLiqV1;
        if(!liq||!liq.isConnected){liq=piste.querySelector('.tmm-liq');piste.__tmLiqV1=liq;}
        if(liq&&liq.style.height!==largeur)liq.style.height=largeur;
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
          '.tmm-piste.or .tmm-rempl'
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
        document.querySelectorAll('.tmm-eta[data-tm-eta-seconds]').forEach(function(el){
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
          const pisteEl=el.closest?el.closest('.tmm-piste'):null;
          const barreEl=pisteEl?pisteEl.querySelector('.tmm-rempl'):null;
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
          let franchis=0,faussesOr=false,manqueOr=0,orPresent=0,bloqueDefi=false;
          /* Défi des 100 niveaux (2026-11-03) : budget partagé (modules/defi-niveaux-100-v1.js) ; Infinity hors défi, comportement inchangé. */
          const D100=typeof window!=='undefined'?window.__SOREAL_IDLE_DEFI100_V1__:null;
          const vueD100=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.timeMachineView;
          const supportD100=vueD100||el;
          const cleD100='tm:'+(piste==='or'||piste==='gold'?'gold':'speed');
          const plafD100=D100?D100.plafond(supportD100,cleD100):Infinity;
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
              /* Budget du défi épuisé : aucun niveau de plus, la barre reste PLEINE (ni Or manquant affiché, ni niveau validé). */
              if(franchis>=plafD100){bloqueDefi=true;faussesOr=true;restant=0;break;}
              const cibleNiv=niveau0+franchis+1;
              if(franchis>=deja){
                const coutNiv=5000000*Math.max(1,cibleNiv);
                if(monnaiesTm&&orTm+1e-9<coutNiv){faussesOr=true;manqueOr=coutNiv-orTm;orPresent=orTm;restant=0;break;}
                if(monnaiesTm)orTm-=coutNiv;
                deja+=1;
              }
              franchis+=1;
              palier=palier*(niveau0+1+franchis)/(niveau0+franchis);
              restant+=palier;
            }
            if(D100)D100.noter(supportD100,cleD100,franchis);
            if(monnaiesTm&&deja!==(el.__tmDebites||0)){monnaiesTm.gold=Math.max(0,orTm);patcherResumeStatsIdleV28_(REG.idleEtat);}
            el.__tmDebites=deja;
          }else{
            restant=Math.max(0,restant);
            /* Barre déjà pleine (en attente d'Or côté serveur) : on le dit ; dès que l'Or suffit, on redemande l'état pour que le niveau suivant tombe sans attendre. */
            /* Norman (2026-11-03) : « fin de la barre dans 0s » restait affiché faute d'Or. Un niveau très court (≤ 0,25 s) est posé barre pleine (fill0=1) avec un reste base>0 : tester base<=0 le laissait passer sans jamais vérifier l'Or. C'est le temps restant (0) qui compte. */
            if(niveau0!==null&&restant<=0&&D100&&D100.actif()&&D100.reste()<=0){bloqueDefi=true;faussesOr=true;}
            else if(niveau0!==null&&restant<=0){   /* temps restant nul : l'Or décide, que la barre affichée soit à 100 % ou à 99,99 % (Norman, 2026-11-03 : « fin de la barre dans 0s » restait affiché par rapport à l'Or manquant) */
              const coutAttente=5000000*Math.max(1,niveau0+1);
              const orAttente=idleNombre_(REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies&&REG.idleEtat.systemes.currencies.gold);
              if(orAttente+1e-9<coutAttente){faussesOr=true;manqueOr=coutAttente-orAttente;orPresent=orAttente;}
              else if(Date.now()-idleTmSyncNiveauV1>(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(2000):2000)){idleTmSyncNiveauV1=Date.now();synchroniserJeuIdleV7_(true);}
            }
          }
          if(franchis>0||faussesOr){
            const niveauEl=document.querySelector('[data-tm-niveau="'+piste+'"]');
            if(niveauEl)niveauEl.textContent=formatGrandNombreIdleV70_(niveau0+franchis);
            if(Date.now()-idleTmSyncNiveauV1>(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(2000):2000)){
              idleTmSyncNiveauV1=Date.now();
              synchroniserJeuIdleV7_(true);
            }
          }
          const secondesAffichees=Math.ceil(restant);
          /* Norman (2026-11-03) : « je voulais juste que la SOMME sur la ligne Niveau suivant devienne rouge » : le temps restant garde son compte à rebours ; seule la somme du niveau suivant (data-tm-prix) passe en rouge quand l'Or manque (style en ligne, aucun !important de plus), puis redevient normale. */
          const prixEl=pisteEl?pisteEl.querySelector('[data-tm-prix]'):null;
          if(prixEl){const cp=(faussesOr&&!bloqueDefi)?'#ff3b3b':'';if(prixEl.style.color!==cp)prixEl.style.color=cp;}
          if(el.dataset.tmEtaLast!==String(secondesAffichees)){
            el.dataset.tmEtaLast=String(secondesAffichees);
            el.__orHtmlV1=null;
            el.textContent='Fin de la barre dans '+formaterEtaTimeMachineIdleV1_(restant)+(palier>0?' · '+(1/palier<0.005?'< 0,01':Math.min(50,1/palier).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}))+' niv/s':'');
            poserLcdTmIdleV1_(el,formaterEtaTimeMachineIdleV1_(restant));
          }
          /* La barre avance avec le compte à rebours (fraction de départ + temps écoulé / durée restante au départ), plus figée entre deux synchros ; après un niveau franchi elle repart du reste du niveau suivant. */
          if(barreEl&&barreEl.dataset.tmFill0!==undefined&&base>0){
            let fill;
            /* Norman (2026-10-13) : « quand on est à 50 niveaux par seconde pour la Machine temporelle, la barre doit rester pleine » : un niveau de 0,25 s ou moins (4 par seconde et plus) ne se voit plus avancer, elle reste pleine au lieu de clignoter */
            if(faussesOr)fill=1;
            else if(palier>0&&palier<=SEUIL_NIVEAU_RAPIDE_TM_V1)fill=1;
            else if(palier>0&&palier<=SEUIL_NIVEAU_CYCLE_TM_V1)fill=0;   /* dessinée en tours par la boucle d'animation */
            else if(franchis>0)fill=Math.max(0,Math.min(1,1-restant/palier));
            else if(fill0<1)fill=Math.min(1,fill0+((maintenant-at)/1000)/(base/(1-fill0)));
            else fill=1;
            /* Fluidité (Norman, 2026-10-19 : « la barre de la machine temporelle n'est pas en 60 ips ») : ce calcul ne tourne qu'à 15 Hz et la largeur n'avait que deux décimales. On ne fait plus qu'enregistrer la valeur et sa VITESSE ; une boucle d'animation propre (lissageBarresTmIdleV1_) dessine à chaque image. */
            let tauxTm=0;
            if(faussesOr||(palier>0&&palier<=SEUIL_NIVEAU_RAPIDE_TM_V1))tauxTm=0;
            else if(franchis>0)tauxTm=palier>0?1/palier:0;
            else if(fill0<1)tauxTm=base>0?(1-fill0)/base:0;
            barreEl.__tmAnim={f:fill,t:Date.now(),r:tauxTm,p:(!faussesOr&&palier>SEUIL_NIVEAU_RAPIDE_TM_V1&&palier<=SEUIL_NIVEAU_CYCLE_TM_V1)?palier:0};
            const largeurTm=(Math.max(0,Math.min(1,fill+decalageBarreTmIdleV1_(barreEl,maintenant)))*100).toFixed(4)+'%';
            if(barreEl.style.width!==largeurTm)barreEl.style.width=largeurTm;
            poserTubeTmIdleV1_(barreEl,largeurTm);
            if(typeof lancerLissageBarresTmIdleV1_==='function')lancerLissageBarresTmIdleV1_();
          }
        });
      }

      /* Norman (2026-11-04) : « toutes les barres du jeu doivent refléter ce qui se passe vraiment : si elle tique 49 fois par seconde, on doit la voir 49 fois par seconde. Pas 50, pas 48. L'effet stroboscope est plaisant dans ce jeu » : la barre n'est PLEINE ET FIXE qu'au cap de 50 niveaux par seconde (niveau de 0,02 s) ; en dessous elle tourne à la vraie cadence (un tour par niveau), calée sur l'horloge du jeu. */
      const SEUIL_NIVEAU_RAPIDE_TM_V1=0.02,SEUIL_NIVEAU_CYCLE_TM_V1=0.25;   /* au-dessus d'un niveau par 0,25 s, la barre avance normalement (franchissement visible) */

      /*
       * Plus aucun recul de barre à la réponse du moteur (Norman, 2026-11-01 : « on règle complètement la latence de la Machine temporelle »). Le moteur applique une allocation au moment où il reçoit la requête, un peu après le clic
       * (attente de 70 ms + appel) : sa barre est donc légèrement en avance ou en retard sur celle que l'écran a déjà recalculée au clic, et la réponse la faisait sauter d'autant. Comme pour les barres d'Augmentations, l'écran garde
       * son affichage : l'écart entre ce qui est affiché et la valeur du moteur (projetée à l'instant présent) devient un décalage visuel qui fond en 600 ms, la barre rejoignant la valeur du moteur sans saut. Un écart de plus de 5 %
       * (niveau gagné, refus, plafond, autre appareil) n'est jamais lissé : la barre prend tout de suite la valeur du moteur.
       */
      const DUREE_FONTE_DECALAGE_TM_V1=600;
      const ECART_MAX_DECALAGE_TM_V1=0.05;
      function decalageBarreTmIdleV1_(barreEl,maintenant){
        const c=barreEl&&barreEl.__tmCorr;
        if(!c)return 0;
        const p=(maintenant-c.t)/c.dur;
        if(!(p<1)){barreEl.__tmCorr=null;return 0;}
        return c.d*(1-Math.max(0,p));
      }

      /* Dessin d'une barre à l'instant donné : valeur enregistrée + vitesse × temps écoulé, bornée à 100 %, largeur à 4 décimales (pas de marche d'escalier). */
      function peindreBarreTmIdleV1_(barreEl,maintenant){
        const a=barreEl&&barreEl.__tmAnim;
        if(!a){
          /* barre immobile qui rejoint la valeur du moteur : valeur du moteur + décalage qui fond */
          const c=barreEl&&barreEl.__tmCorr;
          if(!c||c.base===undefined)return;
          const l=(Math.max(0,Math.min(1,c.base+decalageBarreTmIdleV1_(barreEl,maintenant)))*100).toFixed(4)+'%';
          if(barreEl.style.width!==l)barreEl.style.width=l;
          poserTubeTmIdleV1_(barreEl,l);
          return;
        }
        const hg=typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():maintenant;
        const fill=a.p>0?((hg/1000)/a.p)%1:Math.max(0,Math.min(1,a.f+a.r*Math.max(0,maintenant-a.t)/1000+decalageBarreTmIdleV1_(barreEl,maintenant)));
        const largeur=(fill*100).toFixed(4)+'%';
        if(barreEl.style.width!==largeur)barreEl.style.width=largeur;
        poserTubeTmIdleV1_(barreEl,largeur);
      }
      let idleLissageTmV1=0;
      function lancerLissageBarresTmIdleV1_(){
        if(idleLissageTmV1||typeof requestAnimationFrame!=='function')return;
        const image=function(){
          idleLissageTmV1=0;
          if(REG.idleMenuActifV28!=='machine')return;
          const barres=document.querySelectorAll('.tmm-rempl');
          let anime=false;
          const maintenant=Date.now();
          barres.forEach(function(b){if(b.__tmAnim||b.__tmCorr){anime=true;peindreBarreTmIdleV1_(b,maintenant);}});
          if(anime)idleLissageTmV1=requestAnimationFrame(image);
        };
        idleLissageTmV1=requestAnimationFrame(image);
      }

      /* depuisMaintenant : les chiffres viennent d'un calcul LOCAL à l'instant même (clic), pas d'une réponse du moteur : l'ancre est maintenant, jamais l'instant d'une réponse précédente. */
      function patcherBarresTimeMachineIdleV1_(j,depuisMaintenant){
        if(
          REG.idleMenuActifV28!=='machine' ||
          !j ||
          !j.systemes ||
          !j.systemes.timeMachineView
        ){
          return;
        }

        const vue=j.systemes.timeMachineView;
        const affichees=[];   /* [barre, fraction affichée avant ce patch] : sert à fondre l'écart avec la valeur du moteur (decalageBarreTmIdleV1_) */
        [
          ['vitesse',vue.speedFill,vue.speedEtaSeconds],
          ['or',vue.goldFill,vue.goldEtaSeconds]
        ].forEach(function(entree){
          const remplissage=document.querySelector(
            '.tmm-piste.'+
            entree[0]+
            ' .tmm-rempl'
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
          const avantPx=parseFloat(remplissage.style.width);
          if(Number.isFinite(avantPx)){
            /* fraction réellement affichée à cet instant (décalage en cours compris) */
            affichees.push([remplissage,avantPx/100]);
          }
          remplissage.__tmAnim=null;   // la synchro vient de poser la valeur ; le prochain calcul relance l'animation
          remplissage.__tmCorr=null;
          remplissage.style.width=pct.toFixed(4)+'%';
          poserTubeTmIdleV1_(remplissage,pct.toFixed(4)+'%');
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
            '.tmm-piste.'+
            entree[0]+
            ' .tmm-eta'
          );
          if(eta){
            const etaValide=Number.isFinite(Number(entree[2]));
            eta.dataset.tmEtaSeconds=etaValide?String(Math.max(0,idleNombre_(entree[2]))):'';
            /* Les chiffres ont été produits par le serveur un demi aller-retour avant leur arrivée. */
            /* Norman (2026-11-05, « plus jamais un recul de barre ») : les chiffres du moteur datent du DÉBUT de son calcul (100 à 200 ms avant leur arrivée sur un gros compte) ; l'ancre est la réception CALÉE (__recuPerfV1, qui retranche cet âge), la même que celle du tick plus haut. Avec l'heure d'arrivée, la barre était posée trop en arrière du moteur de (retard x vitesse), d'où un recul à chaque changement d'allocation, énorme quand la barre va vite. */
            const rttTm=typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0;
            const recuCaleTm=Number(j&&j.__recuPerfV1);
            const ancrePatchTm=(!depuisMaintenant&&recuCaleTm>0&&recuCaleTm<=performance.now()?recuCaleTm:performance.now())-(depuisMaintenant?0:rttTm/2);
            eta.dataset.tmEtaAt=String(Date.now()-(performance.now()-ancrePatchTm));
            eta.dataset.tmEtaLast='';
            eta.textContent=etaValide
              ?'Fin de la barre dans '+formaterEtaTimeMachineIdleV1_(entree[2])+(palierPatch>0?' · '+(1/palierPatch<0.005?'< 0,01':Math.min(50,1/palierPatch).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}))+' niv/s':'')
              :'Alloue une ressource pour démarrer la barre';
            poserLcdTmIdleV1_(eta,etaValide?formaterEtaTimeMachineIdleV1_(entree[2]):'—');
          }
        });

        /* La valeur du moteur est projetée à l'instant présent (même tâche, pas d'image figée), puis l'écart avec l'affichage d'avant fond en douceur au lieu de faire sauter la barre. */
        if(affichees.length){
          try{actualiserCompteReboursTimeMachineIdleV1_();}catch(_e){}
          const maintenantFonte=Date.now();
          affichees.forEach(function(x){
            const b=x[0];
            const apres=parseFloat(b.style.width)/100;
            const ecart=x[1]-apres;
            if(!Number.isFinite(ecart)||Math.abs(ecart)<1e-5||Math.abs(ecart)>ECART_MAX_DECALAGE_TM_V1)return;
            b.__tmCorr={d:ecart,t:maintenantFonte,dur:DUREE_FONTE_DECALAGE_TM_V1,base:b.__tmAnim?undefined:apres};
            const l=(Math.max(0,Math.min(1,apres+ecart))*100).toFixed(4)+'%';
            b.style.width=l;
            poserTubeTmIdleV1_(b,l);
            if(typeof lancerLissageBarresTmIdleV1_==='function')lancerLissageBarresTmIdleV1_();
          });
        }

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
