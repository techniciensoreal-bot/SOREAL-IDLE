/*
 * SOREAL IDLE — Blood Magic : page, boutons de rituels, calculs locaux optimistes. Extrait de meta-progression-v130.js le 2026-10-07 (docs/CHANTIER-NETTOYAGE.md, lot 2b),
 * code déplacé SANS changement de comportement. Le module reçoit de meta-progression-v130.js les aides qu'il partage avec Augmentations et Time Machine (objet « hote »)
 * et expose ses points d'entrée ; ses boutons restent des fonctions window (window.__ajusterRituelBloodMagicIdleV1__...), comme avant.
 *
 *   window.__SOREAL_IDLE_BLOOD_V1__ = { creer(hote) -> { page(j), recalculerLocal(j,ritualId,alloc,sansRedessin) } }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_BLOOD_V1__)return;

function creer(hote){
  const systemeMetaParIdIdleV130_=hote.systemeMeta;
  const envoyerAllocRapideV1_=hote.envoyerAllocRapide;
  const recalculerPisteFractionIdleV1_=hote.recalculerPisteFraction;
  const ancreSnapshotIdleV1_=hote.ancreSnapshot;
  const formatDureeAugmentIdleV1_=hote.formatDuree;
  const carteAideMenuIdleV1_=hote.carteAide;
  const legendeAllocationIdleV1_=hote.legendeAllocation;
  const emojiNomIdleV1_=hote.emojiNom;

      /*
       * Norman (2026-09-29) : « Dans Blood magic, la manière dont tu l'as reproduit, ça n'est pas
       * opérationnel. » Cause : allocationMetaIdleV48_ (boutons 0/25/50/100% d'un montant ABSOLU) est
       * exactement le défaut déjà diagnostiqué et corrigé pour Augmentation le 2026-09-24 (voir le
       * commentaire juste au-dessus de cette fonction) -- jamais corrigé pour Blood Magic, resté sur
       * l'ancien helper générique. Remplacé par le même schéma Input + Cap/1/2/1/4 + Idle (Basic
       * Training/Augmentation), optimiste comme ajusterAugmentIdleV1_/ajusterTimeMachineIdleV1_.
       */
      /*
       * Norman (2026-09-29) : même correctif de réactivité qu'Augmentation (voir
       * rafraichirAllocationAugmentIdleV1_ plus haut) -- un patch DOM ciblé plutôt qu'un
       * rendreIdleEtat_ complet à chaque clic. La confirmation serveur (actionMetaNoyauIdleV130_)
       * continue de déclencher un rendu complet dès la réponse, donc aucune perte de cohérence :
       * seul le clic lui-même devient instantané.
       */
      function rafraichirAllocationBloodMagicIdleV1_(ritualId,value){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const sys=systemeMetaParIdIdleV130_(H.getIdleEtat(),'bloodMagic');
        const total=Math.max(0,H.idleNombre_(sys&&sys.state&&sys.state.allocation&&sys.state.allocation.magic));
        const toolbarSpan=document.getElementById('sorealIdleBloodAllocV1');
        if(toolbarSpan)toolbarSpan.textContent=H.formatGrandNombreIdleV70_(total);
        /* Magie libre (Norman, 2026-10-05 : elle restait à 100 alors que tout était placé) : suit l'état local mis à jour par le clic. */
        const libreEl=document.getElementById('sorealIdleBloodLibreV1');
        const etatLibre=H.getIdleEtat();
        const magieLibre=etatLibre&&etatLibre.systemes&&etatLibre.systemes.resources&&etatLibre.systemes.resources.magic;
        if(libreEl&&magieLibre){const t=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(magieLibre.current)));if(libreEl.textContent!==t)libreEl.textContent=t;}
        /* Compteur de CE rituel : mis à jour sur place, sans redessiner la page. */
        const compteur=document.getElementById('sorealIdleBloodRitualAllocV1_'+ritualId);
        const texte=H.formatGrandNombreIdleV70_(value);
        if(compteur&&compteur.textContent!==texte)compteur.textContent=texte;
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
      }

      /*
       * Blood Magic : recalcul local d'UN rituel (Norman, 2026-10-07 : plusieurs rituels reçoivent de la Magic en même temps). Durée d'une complétion = K / Magic allouée à ce rituel
       * (K : secondsK du rituel, fourni par le serveur, ou déduit de celui du rituel sélectionné par le rapport des durées de base du catalogue).
       * Le visuel (barre + compte à rebours) est mis à jour tout de suite ; le ticker de soreal-idle-ui.js le repeint. Les repères visuels sont rangés par rituel.
       */
      function recalculerBloodLocalIdleV1_(j,ritualId,alloc,sansRedessin){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.bloodMagicView;
        if(!vue)return;
        const catalogue=Array.isArray(j.systemes.bloodRituals)?j.systemes.bloodRituals:[];
        let rv=(vue.rituals||[]).find(function(x){return x&&x.id===ritualId;});
        if(!rv){
          const sel=catalogue.find(function(r){return r&&r.id===vue.activeRitual;});
          const cible=catalogue.find(function(r){return r&&r.id===ritualId;});
          const kSel=H.idleNombre_(vue.secondsK);
          if(!(kSel>0)||!sel||!cible||!(H.idleNombre_(sel.baseSeconds)>0))return;
          const sys=systemeMetaParIdIdleV130_(j,'bloodMagic');
          const rit=sys&&sys.state&&sys.state.data&&sys.state.data.rituals&&sys.state.data.rituals[ritualId];
          const brut=Math.max(0,H.idleNombre_(rit&&rit.progress));
          const ref=Math.max(0,H.idleNombre_(rit&&rit.progressRef));
          rv={id:ritualId,magic:0,secondsPerCompletion:null,etaSeconds:null,progressFraction:ref>0?Math.min(.999999,brut/ref):0,secondsK:kSel*H.idleNombre_(cible.baseSeconds)/H.idleNombre_(sel.baseSeconds),progressSeconds:brut};
          vue.rituals=(vue.rituals||[]).concat([rv]);
        }
        const k=H.idleNombre_(rv.secondsK);
        if(!(k>0))return;
        const visuels=(j.__bloodMagicVisualV1&&typeof j.__bloodMagicVisualV1==='object'&&!j.__bloodMagicVisualV1.ritual)?j.__bloodMagicVisualV1:{};
        const visuel=visuels[ritualId];
        const maintenant=performance.now();
        /* Fraction actuelle de la barre (celle de l'écran si elle tournait, sinon celle du serveur) : elle ne change pas avec l'allocation. */
        let fracAvant;
        if(visuel&&H.idleNombre_(visuel.secondsPerCompletion)>0){
          const ecoule=Math.max(0,(maintenant-(visuel.at||maintenant))/1000);
          const sec=H.idleNombre_(visuel.secondsPerCompletion);
          fracAvant=Math.min(1,(1-H.idleNombre_(visuel.etaSeconds)/sec)+ecoule/sec);
        }else{
          fracAvant=H.idleNombre_(rv.progressFraction);
        }
        const nouveau=recalculerPisteFractionIdleV1_(k,fracAvant,alloc);
        const progSec=nouveau.seconds>0?nouveau.progress*nouveau.seconds:H.idleNombre_(rv.progressSeconds);
        rv.magic=alloc;
        rv.secondsPerCompletion=nouveau.seconds>0?nouveau.seconds:null;
        rv.etaSeconds=nouveau.seconds>0?Math.max(0,(1-nouveau.progress)*nouveau.seconds):null;
        rv.progressFraction=nouveau.progress;
        rv.progressSeconds=progSec;
        if(vue.activeRitual===ritualId){
          vue.secondsPerCompletion=rv.secondsPerCompletion;vue.etaSeconds=rv.etaSeconds;vue.progressFraction=rv.progressFraction;vue.progressSeconds=rv.progressSeconds;
        }
        const suivants=Object.assign({},visuels);
        if(nouveau.seconds>0)suivants[ritualId]={ritual:ritualId,secondsPerCompletion:nouveau.seconds,etaSeconds:rv.etaSeconds,at:maintenant,src:rv};
        else delete suivants[ritualId];
        j.__bloodMagicVisualV1=Object.keys(suivants).length?suivants:null;
        /*
         * Plus de Magic sur le rituel (Norman, 2026-10-05 : « si j'enlève toute la magie, la barre continue de monter ») : la barre tournait encore, animée par le navigateur, car plus aucun repère ne la pilotait. On la fige là où elle en
         * était ; elle repart de ce point (donnée du serveur) dès qu'on remet de la Magic.
         */
        const barreRituel=document.querySelector('[data-idle-blood-bar-v1="'+ritualId+'"]');
        const figees=(window.__bloodFigeV1&&typeof window.__bloodFigeV1==='object')?window.__bloodFigeV1:(window.__bloodFigeV1={});
        if(nouveau.seconds>0){
          delete figees[ritualId];
          saignerPisteIdleV1_(barreRituel,true);
        }else{
          saignerPisteIdleV1_(barreRituel,false);
          figees[ritualId]=nouveau.progress;
          if(barreRituel){
            if(barreRituel.__idleAugAnimationV217){barreRituel.__idleAugAnimationV217.cancel();barreRituel.__idleAugAnimationV217=null;delete barreRituel.dataset.idleAugDurationV217;}
            barreRituel.style.width='100%';
            barreRituel.style.transform='scaleX('+nouveau.progress+')';
          }
        }
        const ligne=document.getElementById('sorealIdleBloodEtaLineV1_'+ritualId);
        if(ligne){
          ligne.style.display='';
          ligne.textContent=nouveau.seconds>0
            ?'⏱ '+formatDureeAugmentIdleV1_(rv.etaSeconds)+' avant le prochain rituel complété'
            :'Alloue de la Magic (ci-dessus) pour faire progresser ce rituel.';
        }
        /* Un rituel qui reçoit de la Magic pour la première fois n'a pas encore de barre dans la page : un seul redessin LOCAL (sans aller-retour réseau). */
        if(!sansRedessin&&nouveau.seconds>0&&!barreRituel&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();
      }

      /* Les gouttes de la barre qui saigne (même balisage au rendu et à la mise à jour en direct). */
      const SANG_GOUTTES_HTML_V1='<span class="sang-g-v1" style="left:9%;animation-delay:-.1s"></span><span class="sang-g-v1" style="left:24%;animation-delay:-.9s;animation-duration:1.9s"></span><span class="sang-g-v1" style="left:41%;animation-delay:-.5s"></span><span class="sang-g-v1" style="left:57%;animation-delay:-1.3s;animation-duration:2.1s"></span><span class="sang-g-v1" style="left:73%;animation-delay:-.3s;animation-duration:1.7s"></span><span class="sang-g-v1" style="left:90%;animation-delay:-1.1s"></span>';
      /* Norman (2026-10-06) : « quand je retire toute l'énergie d'une barre de Blood Magic, même si la barre est entamée, elle ne doit plus saigner » : la barre se fige ET cesse de saigner ; elle saigne de nouveau dès qu'on remet de la Magic. */
      function saignerPisteIdleV1_(barre,oui){
        const piste=barre&&barre.parentNode;
        if(!piste||!piste.classList)return;
        const gouttes=piste.querySelectorAll('.sang-g-v1');
        if(oui){
          piste.classList.add('saigne-v1');
          if(!gouttes.length)barre.insertAdjacentHTML('afterend',SANG_GOUTTES_HTML_V1);
        }else{
          piste.classList.remove('saigne-v1');
          for(let i=0;i<gouttes.length;i++)gouttes[i].parentNode.removeChild(gouttes[i]);
        }
      }

      function ajusterBloodMagicIdleV1_(mode,ritualId){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const data=s&&s.state&&s.state.data;
        const id=ritualId||(data&&data.activeRitual);
        if(!data||!id||!data.rituals||!data.rituals[id])return;
        const current=Math.max(0,H.idleNombre_(data.rituals[id].magic));
        const pas=Math.max(1,Math.floor(Number((document.getElementById('sorealIdleBloodInputV1')||{}).value)||hote.montant()));
        if(Number.isFinite(pas)&&pas>=1)hote.fixerMontant(pas);
        const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
        const idleAvant=Math.max(0,H.idleNombre_(ressourceMagie&&ressourceMagie.current));
        const cible=mode==='plus'
          ?current+Math.min(pas,idleAvant)
          :mode==='moins'
            ?Math.max(0,current-pas)
            :current+idleAvant;
        const value=Math.max(0,H.idleEntier_(cible));
        const delta=value-current;

        if(delta!==0){
          if(H.jouerEffetAudioIdleV199_){
            H.jouerEffetAudioIdleV199_(
              mode==='plus'?'bloodPlus':mode==='moins'?'bloodMinus':'bloodCap'
            );
          }
          data.rituals[id].magic=value;
          if(s.state.allocation)s.state.allocation.magic=Math.max(0,H.idleNombre_(s.state.allocation.magic)+delta);
          if(ressourceMagie)ressourceMagie.current=Math.max(0,idleAvant-delta);
          recalculerBloodLocalIdleV1_(j,id,value);
          rafraichirAllocationBloodMagicIdleV1_(id,value);
        }

        envoyerAllocRapideV1_({action:'allocateRitual',ritual:id,value:value});
      }
      window.__ajusterBloodMagicIdleV1__=ajusterBloodMagicIdleV1_;

      function viderBloodMagicIdleV1_(){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const data=s&&s.state&&s.state.data;
        if(!data||!data.rituals)return;
        const ids=Object.keys(data.rituals).filter(function(id){return H.idleNombre_(data.rituals[id].magic)>0;});
        if(!ids.length)return;
        if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_('bloodMinus');
        const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
        ids.forEach(function(id){
          const courant=Math.max(0,H.idleNombre_(data.rituals[id].magic));
          data.rituals[id].magic=0;
          if(s.state.allocation)s.state.allocation.magic=Math.max(0,H.idleNombre_(s.state.allocation.magic)-courant);
          if(ressourceMagie)ressourceMagie.current=Math.max(0,H.idleNombre_(ressourceMagie.current)+courant);
          recalculerBloodLocalIdleV1_(j,id,0);
          rafraichirAllocationBloodMagicIdleV1_(id,0);
        });
        envoyerAllocRapideV1_({action:'clearRitualAllocations'});
      }
      window.__viderBloodMagicIdleV1__=viderBloodMagicIdleV1_;

      /* Même raccourcis que la barre d'outils de Basic Training/Augmentation : "cap" part du plafond réel de Magic, "idle" part de la Magic actuellement libre. */
      function presetBloodMagicIdleV1_(source,fraction){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const input=document.getElementById('sorealIdleBloodInputV1');
        if(!input)return;
        const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
        const base=source==='idle'?H.idleEntier_(ressourceMagie&&ressourceMagie.current):H.idleEntier_(ressourceMagie&&ressourceMagie.cap);
        const valeur=Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0)));
        input.value=String(valeur);
      }
      window.__presetBloodMagicIdleV1__=presetBloodMagicIdleV1_;

      /*
       * Norman : « Je pense que Blood Magic nécessite des boutons Cap + et - également », pour
       * chaque rituel (capture NGU jointe). Le serveur n'a qu'UNE SEULE allocation Magic partagée,
       * versée au rituel ACTIF (data.activeRitual, selectRitual) -- jamais une réserve indépendante
       * par rituel. Le bouton d'un rituel non actif l'active donc d'abord (comme le ferait le joueur
       * en cliquant "Choisir ce rituel"), puis applique le même ajustement que la barre d'outils
       * principale -- aucune capacité serveur inventée, seulement le même modèle déjà réel.
       */
      /* Le bouton d'un rituel place ou retire de la Magic sur CE rituel ; les autres gardent la leur. Le rituel touché devient le « rituel sélectionné » (celui de la barre d'outils du haut). */
      function ajusterRituelBloodMagicIdleV1_(ritualId,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const data=s&&s.state&&s.state.data;
        if(data&&data.activeRitual!==ritualId){
          data.activeRitual=ritualId;
          if(j.systemes&&j.systemes.bloodMagicView)j.systemes.bloodMagicView.activeRitual=ritualId;
          envoyerAllocRapideV1_({action:'selectRitual',ritual:ritualId});
        }
        ajusterBloodMagicIdleV1_(mode,ritualId);
      }
      window.__ajusterRituelBloodMagicIdleV1__=ajusterRituelBloodMagicIdleV1_;
      /* Noms français des rituels de Blood Magic (Norman, 2026-10-01 : « traduits aussi le nom des rituels ») ; le moteur garde les noms du wiki. */
      const IDLE_BLOOD_NOMS_RITUELS_V1={
        tack:'Se piquer avec une punaise',
        papercuts:'Cinquante coupures de papier',
        hickey:'Un énorme suçon',
        barbedWire:'Avaler un bol de fil barbelé',
        bloodBank:'Braquage de la banque du sang',
        decapitation:'Se décapiter soi-même',
        woodchipper:'Faire un câlin à une déchiqueteuse',
        insideOut:'Se retourner comme un gant'
      };
      const IDLE_ICONES_SORTS_V1={numberBoost:'🔢',ironPill:'💊',bloodSpaghetti:'🍝',counterfeitGold:'💰',leeches:'🪱'};
      const IDLE_ICONES_RITUELS_V1={tack:'📍',papercuts:'📄',hickey:'💋',barbedWire:'⛓️',bloodBank:'🏦',decapitation:'💀',woodchipper:'🪵',insideOut:'🌀'};
      window.__idleBloodInfosOuvertesV1=window.__idleBloodInfosOuvertesV1||{};
      window.__basculerInfoSortBloodIdleV1__=function(id,bouton){
        const ouvert=!window.__idleBloodInfosOuvertesV1[id];
        window.__idleBloodInfosOuvertesV1[id]=ouvert;
        const zone=document.getElementById('sorealIdleBloodSortInfosV1_'+id);
        if(zone)zone.hidden=!ouvert;
        if(bouton)bouton.setAttribute('aria-expanded',ouvert?'true':'false');
      };

      /* Rangs (1 à 4) des sorts de Blood Magic que CE joueur a déjà découverts (mêmes conditions que la liste du menu) : le fil « En direct » ne nomme jamais un sort qu'il ne connaît pas. Le dernier sort n'est jamais nommé. */
      window.__SOREAL_IDLE_SORTS_CONNUS_V1__=function(j){
        const rangs={1:true};
        try{
          const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
          const data=s&&s.state&&s.state.data||{};
          const sp=data.spells||{};
          const n=function(v){v=Number(v);return v>0?v:0;};
          const pic=Math.max(n(data.bloodPeak),n(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.blood));
          if(pic>=100||n(sp.ironPill)>0)rangs[2]=true;
          if(pic>=1e4||n(sp.bloodSpaghettiBloodSpent)>0)rangs[3]=true;
          if(pic>=1e6||n(sp.counterfeitGoldBloodSpent)>0)rangs[4]=true;
        }catch(e){}
        return rangs;
      };
      function pageBloodMagicIdleV48_(j){
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-bloodmagic-v1"><div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div></div>';
        const snap=j&&j.systemes||{};
        const defs=Array.isArray(snap.bloodRituals)?snap.bloodRituals:[];
        const data=s.state.data||{};
        const rituals=data.rituals||{};
        const flags=snap.adventure&&snap.adventure.unlockFlags||{};
        const blood=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.blood||0);
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0);
        const spells=data.spells||{};
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const nb=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const pctFr=function(v){return Number(v).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %';};
        /*
         * Sorts (Norman, 2026-09-29 : « savoir à quoi sert chaque chose »). Descriptions, formules et recharge d'après la
         * page wiki « Blood Magic » (section The Spells, consultée le 2026-09-29). Anti-spoil (AGENTS.md règle n°2) : un sort
         * n'apparaît qu'une fois DÉCOUVERT -- son « Minimum Blood Required » a déjà été atteint (data.bloodPeak, mémorisé côté
         * serveur, car chaque sort dépense tout le Blood) ou il a déjà servi. Le minimum lui-même n'est jamais affiché.
         * Le Number Boost (minimum 1) est le sort de départ : toujours visible.
         */
        const bloodPeak=Math.max(blood,H.idleNombre_(data.bloodPeak));
        const depense=function(k){return Math.max(0,H.idleNombre_(spells[k]));};
        const pctSpaghetti=function(total){return total>=1e4?Math.log2(total/1e4)+1:0;};
        const pctCounterfeit=function(total){return total>=1e6?Math.pow(Math.log2(total/1e6)+1,2):0;};
        const maintenant=Date.now();
        const prete=H.idleNombre_(spells.ironPillReadyAt);
        const rechargeIron=prete>maintenant?prete-maintenant:0;
        const spellDefs=[
          {id:'numberBoost',nom:'Blood NUMBER Boost',visible:true,
            desc:'Chaque Blood ajoute 1 au multiplicateur du NUMBER (le « Blood magic bonus » du Rebirth). Valable pour le Rebirth en cours.',
            actuel:'Bonus actuel : +'+nb(Math.max(0,H.idleNombre_(spells.numberBoost||1)-1)),
            apercu:blood>0?'En le lançant maintenant : +'+nb(Math.max(0,H.idleNombre_(spells.numberBoost||1)-1)+Math.floor(blood)):''},
          {id:'ironPill',nom:'Iron Pill',visible:bloodPeak>=100||depense('ironPill')>0,
            desc:'Augmente pour toujours tes stats d’Adventure. Avec G = Blood^0,25 : Puissance +G, Endurance +G, PV +3 × G, Regen PV +0,03 × G. Recharge de 11,5 h.',
            actuel:'Total acquis : +'+nb(depense('ironPill'),2),
            apercu:'',recharge:rechargeIron},
          {id:'bloodSpaghetti',nom:'Blood Spaghetti',visible:bloodPeak>=1e4||depense('bloodSpaghettiBloodSpent')>0,
            desc:'Augmente la Drop Chance de (log₂(Blood ÷ 10 000) + 1) %, où Blood est le total sacrifié à ce sort durant ce Rebirth.',
            actuel:'Bonus actuel : +'+pctFr(Math.max(0,(H.idleNombre_(spells.bloodSpaghetti||1)-1)*100)),
            apercu:blood>0&&depense('bloodSpaghettiBloodSpent')+blood>=1e4?'En le lançant maintenant : +'+pctFr(pctSpaghetti(depense('bloodSpaghettiBloodSpent')+Math.floor(blood))):''},
          {id:'counterfeitGold',nom:'Counterfeit Gold',visible:bloodPeak>=1e6||depense('counterfeitGoldBloodSpent')>0,
            desc:'Augmente le GPS de la Time Machine de (log₂(Blood ÷ 1 000 000) + 1)² %, où Blood est le total sacrifié à ce sort durant ce Rebirth.',
            actuel:'Bonus actuel : +'+pctFr(Math.max(0,(H.idleNombre_(spells.counterfeitGold||1)-1)*100)),
            apercu:blood>0&&depense('counterfeitGoldBloodSpent')+blood>=1e6?'En le lançant maintenant : +'+pctFr(pctCounterfeit(depense('counterfeitGoldBloodSpent')+Math.floor(blood))):''}
        ].filter(function(sp){return sp.visible;});
        /* Dernier sort (THE END) : invisible sous 5e22 de sang, sauf si la pièce est déjà trouvée. */
        const pieces494=snap.adventure&&snap.adventure.theEnd&&Array.isArray(snap.adventure.theEnd.pieces)&&snap.adventure.theEnd.pieces.some(function(p){return p.id===494;});
        if(blood>=5e22||pieces494)spellDefs.push({id:'leeches',nom:'3%q6(;>_<,$H8e',desc:'',actuel:'',apercu:''});
        const allocMagicActuelle=Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.magic));
        const ressourceMagie=snap.resources&&snap.resources.magic;
        const magicLibre=Math.max(0,H.idleNombre_(ressourceMagie&&ressourceMagie.current));
        const bmView=snap.bloodMagicView||null;
        /*
         * Norman (2026-09-29) : « blood magic n'a pas de barre d'avancement comme dans NGU Idle. »
         * Même mécanisme que __augmentationsVisualV215 (soreal-idle-ui.js, patch ciblé à chaque tick)
         * mais pour un seul élément : seul le rituel ACTIF progresse réellement (bloodMagicViewV1).
         */
        {
          /* Un repère visuel par rituel qui reçoit de la Magic ; un redessin sans nouvelle réponse garde le repère qui tourne déjà (jamais de retour en arrière). */
          const etatB=H.getIdleEtat();
          const exB=(etatB.__bloodMagicVisualV1&&typeof etatB.__bloodMagicVisualV1==='object'&&!etatB.__bloodMagicVisualV1.ritual)?etatB.__bloodMagicVisualV1:{};
          const visuelsB={};
          ((bmView&&bmView.rituals)||[]).forEach(function(rv){
            if(!rv||rv.secondsPerCompletion==null)return;
            const ex=exB[rv.id];
            visuelsB[rv.id]=(ex&&ex.src===rv)?ex:{ritual:rv.id,secondsPerCompletion:rv.secondsPerCompletion,etaSeconds:rv.etaSeconds,at:ancreSnapshotIdleV1_(etatB),src:rv};
          });
          etatB.__bloodMagicVisualV1=Object.keys(visuelsB).length?visuelsB:null;
        }
        const toolbar=legendeAllocationIdleV1_('Magic',false,true)+'<div class="soreal-idle-bt-toolbar-v120">'+
          '<div class="soreal-idle-bt-input-box-v120"><label for="sorealIdleBloodInputV1">🎚️ Input</label><input id="sorealIdleBloodInputV1" type="text" value="'+hote.montant()+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de la Magic libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"></div>'+
          '<div class="soreal-idle-bt-info-v1">Magic libre : <b id="sorealIdleBloodLibreV1">'+H.formatGrandNombreIdleV70_(magicLibre)+'</b> 🔮 · Magic allouée aux rituels : <b id="sorealIdleBloodAllocV1" class="soreal-idle-bt-allocation-v120">'+H.formatGrandNombreIdleV70_(allocMagicActuelle)+'</b> 🔮</div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>Magic Cap</span><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'cap\',.25)">1/4</button></div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderBloodMagicIdleV1__()">Tout retirer</button></div>'+
        '</div>';
        const rituelsHtml=defs.map(function(def,idxRituel){
          /* Montée en puissance : du premier rituel (rang 0) au dernier (rang 5), répartis sur les rituels disponibles. */
          const rangRituel=Math.max(0,Math.min(5,Math.round(idxRituel*5/Math.max(1,defs.length-1))));
          const r=rituals[def.id]||{};
          /* Le serveur ne liste plus que les rituels débloqués (idleNguSnapshot) : plus de carte « 🔒 Verrouillé » (anti-spoil). */
          const unlocked=true;
          const selectionne=data.activeRitual===def.id;
          const rv=((bmView&&bmView.rituals)||[]).find(function(x){return x&&x.id===def.id;})||null;
          const magieR=rv?Math.max(0,H.idleNombre_(rv.magic)):0;
          const active=magieR>0;
          const progressionActive=active&&rv&&rv.secondsPerCompletion!=null;
          const figeesB=(window.__bloodFigeV1&&typeof window.__bloodFigeV1==='object')?window.__bloodFigeV1:{};
          const fractionVue=rv?H.idleNombre_(rv.progressFraction):0;
          const pct=progressionActive?Math.max(0,Math.min(1,1-H.idleNombre_(rv.etaSeconds)/rv.secondsPerCompletion)):(fractionVue>0?fractionVue:(figeesB[def.id]!=null?H.idleNombre_(figeesB[def.id]):0));
          const montrerBarre=active||figeesB[def.id]!=null;
          const etaTexte=rv&&rv.etaSeconds!=null
            ?'⏱ '+formatDureeAugmentIdleV1_(rv.etaSeconds)+' avant le prochain rituel complété'
            :(montrerBarre?'Alloue de la Magic (ci-dessus) pour faire progresser ce rituel.':'');
          const idHtml=H.idleHtml_(def.id);
          /*
           * Barre de progression du rituel actif vers sa prochaine complétion (Norman, 2026-09-29 :
           * « blood magic n'a pas de barre d'avancement comme dans NGU Idle »). Même famille que la
           * barre d'Augmentation (.soreal-idle-bt-track-v120/.soreal-idle-bt-fill-v120), animée en
           * continu par animerBarreCycliqueIdleV217_ (soreal-idle-ui.js) -- seule couleur distincte
           * (rouge sang) pour rester dans le thème de la page.
           */
          const barre=montrerBarre
            ?'<div class="soreal-idle-bt-track-v120'+(progressionActive?' saigne-v1':'')+'"><div data-idle-blood-bar-v1="'+idHtml+'" class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+pct+');transform-origin:left center;will-change:transform;background:#9a2138;transition:none"></div>'+(progressionActive?SANG_GOUTTES_HTML_V1:'')+'</div>'
            :'';
          return '<div id="sorealIdleBloodRitualV1_'+idHtml+'" class="soreal-idle-section-v8" data-rang-v1="'+rangRituel+'" style="margin:0;opacity:'+(unlocked?'1':'.55')+'">'+
            '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+(IDLE_ICONES_RITUELS_V1[def.id]?IDLE_ICONES_RITUELS_V1[def.id]+' ':'')+H.idleHtml_(IDLE_BLOOD_NOMS_RITUELS_V1[def.id]||def.name||def.id)+'<span id="sorealIdleBloodMarkerV1_'+idHtml+'">'+(selectionne?' ▶':'')+'</span></b><span>'+H.idleEntier_(r.completions||0)+' complété(s)</span></div>'+
            '<div class="soreal-idle-blood-ritual-desc-v1">Chaque fois qu’il se termine : <b>−'+H.formatGrandNombreIdleV70_(def.gold||0)+' Gold</b> → <b>+'+H.formatGrandNombreIdleV70_(def.blood||0)+' Blood</b></div>'+
            barre+
            /* Compteur de Magic allouée à CE rituel (Norman, 2026-10-05) : le rituel actif porte toute l'allocation, les autres 0 ; le chiffre gonfle quand on y ajoute de la Magic (modules/alloc-pop-v1.js, crochet data-idle-alloc-pop-v1). */
            '<div class="soreal-idle-blood-alloc-ligne-v1">🔮 Magic allouée : <b id="sorealIdleBloodRitualAllocV1_'+idHtml+'" data-idle-alloc-pop-v1="1">'+H.formatGrandNombreIdleV70_(magieR)+'</b></div>'+
            '<div id="sorealIdleBloodEtaLineV1_'+idHtml+'" style="font-size:14px;color:#c7d2fe;margin:3px 0;'+(etaTexte?'':'display:none')+'">'+H.idleHtml_(etaTexte)+'</div>'+
            '<div class="soreal-idle-bt-actions-v120" style="margin-top:9px"><button type="button" title="Placer la valeur de Input en Magic sur ce rituel (les autres rituels gardent la leur)" onclick="window.__ajusterRituelBloodMagicIdleV1__(\''+idHtml+'\',\'plus\')" aria-label="Placer"><span class="soreal-idle-blood-croix-v1">✝︎</span></button><button type="button" title="Retirer la valeur de Input" onclick="window.__ajusterRituelBloodMagicIdleV1__(\''+idHtml+'\',\'moins\')">−</button><button type="button" title="Placer toute la Magic libre sur ce rituel" onclick="window.__ajusterRituelBloodMagicIdleV1__(\''+idHtml+'\',\'cap\')">Max</button></div>'+
          '</div>';
        }).join('');
        /*
         * Norman (2026-10-01) : « les sorts en haut, pas sur une ligne complète : des blocs côte à côte, sur 2 lignes quand il y en a trop, avec un
         * « i » cliquable pour les effets ; chaque bloc dans les tons mauve-rouge ». Un bloc par sort DÉCOUVERT (anti-spoil inchangé : spellDefs
         * ne contient que les sorts découverts). L'état ouvert/fermé des « i » est gardé en mémoire (les rendus ne le referment pas).
         */
        /* Rituel sonore du sort (modules/audio-effects-v199.js : sortBlood), du plus modeste au plus terrifiant. Jamais bloquant. */
        window.__sonSortBloodIdleV1__=function(id){try{const a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&a.sortBlood)a.sortBlood(String(id||''));}catch(e){}};
        const sortsHtml='<h3 class="soreal-idle-blood-titre-v1">Sorts <small>dépensent tout ton Blood</small></h3><div class="soreal-idle-blood-sorts-v1">'+spellDefs.map(function(sp){
          const recharge=sp.recharge>0;
          const peutLancer=blood>0&&!recharge;
          const idSort=H.idleHtml_(sp.id);
          const infos=(sp.desc?'<div class="soreal-idle-blood-sort-desc-v1">'+H.idleHtml_(sp.desc)+'</div>':'')+(sp.apercu?'<div class="soreal-idle-blood-sort-apercu-v1">'+H.idleHtml_(sp.apercu)+'</div>':'');
          const ouvert=Boolean(window.__idleBloodInfosOuvertesV1&&window.__idleBloodInfosOuvertesV1[sp.id]);
          return '<div class="soreal-idle-blood-sort-v1" data-sort="'+idSort+'">'+
            '<div class="soreal-idle-blood-sort-tete-v1"><b>'+(IDLE_ICONES_SORTS_V1[sp.id]?IDLE_ICONES_SORTS_V1[sp.id]+' ':'')+H.idleHtml_(sp.nom)+'</b>'+(infos?'<button type="button" class="soreal-idle-blood-info-v1" title="Voir les effets" aria-expanded="'+(ouvert?'true':'false')+'" onclick="window.__basculerInfoSortBloodIdleV1__(\''+idSort+'\',this)">i</button>':'')+'</div>'+
            (sp.actuel?'<div class="soreal-idle-blood-sort-actuel-v1">'+H.idleHtml_(sp.actuel)+'</div>':'')+
            (infos?'<div id="sorealIdleBloodSortInfosV1_'+idSort+'" class="soreal-idle-blood-sort-infos-v1"'+(ouvert?'':' hidden')+'>'+infos+'</div>':'')+
            (recharge?'<div class="soreal-idle-blood-sort-apercu-v1">⏳ Prêt dans '+formatDureeAugmentIdleV1_(sp.recharge/1000)+'</div>':'')+
            '<button type="button" class="soreal-idle-expand-button-v25 soreal-idle-blood-lancer-v1" '+(peutLancer?'onclick="window.__sonSortBloodIdleV1__(\''+sp.id+'\');window.__actionMetaV47__({action:\'castBloodSpell\',spell:\''+sp.id+'\'})"':'disabled')+'>'+(blood>0?(recharge?'En recharge':'Lancer avec tout mon Blood ('+H.formatGrandNombreIdleV70_(blood)+')'):'Pas assez de Blood')+'</button></div>';
        }).join('')+'</div>';

        /*
         * Norman (2026-09-29) : « Décore la page blood magic pour qu'elle ait l'air plus sanglante
         * sans pour autant qu'elle soit toute rouge. » soreal-idle-bloodmagic-v1 (soreal-idle-ui.css)
         * porte tout l'habillage (fond sombre lie-de-vin très désaturé, gouttes discrètes en haut de
         * carte, liseré) -- jamais un simple aplat rouge, et rien de tout ça n'existe ailleurs.
         */
        return '<div class="soreal-idle-bloodmagic-v1">'+
          H.entetePageIdleV28_('🩸 Blood Magic','Transforme de la Magic et de l’Or en Blood, puis dépense ce Blood dans des sorts.')+
          carteAideMenuIdleV1_('bloodMagic','Le Blood sert à lancer des sorts. Le plus courant, Blood NUMBER Boost, ajoute 1 au multiplicateur du NUMBER (le « Blood magic bonus » du Rebirth) par Blood dépensé : c’est ce qui te donne un plus gros nombre au Rebirth.',[
            'Choisis un rituel et place-y de la Magic avec + : plus il en reçoit, plus vite il se termine.',
            'Chaque fois qu’un rituel se termine, il dépense de l’Or et produit du Blood.',
            'Le Blood s’accumule dans ta réserve. Lancer un sort utilise tout ton Blood d’un coup.',
            'Le Blood est remis à zéro à chaque Rebirth. Les effets des sorts ne durent que jusqu’au prochain Rebirth, sauf ceux marqués « permanent ».'
          ])+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">🩸 Blood<b>'+H.formatGrandNombreIdleV70_(blood)+'</b></div><div class="soreal-idle-summary-v28">🪙 Gold<b>'+H.formatGrandNombreIdleV70_(gold)+'</b></div></div>'+
          sortsHtml+
          toolbar+
          '<h3 class="soreal-idle-blood-titre-v1">Rituels <small>produisent du Blood</small></h3><div style="display:grid;gap:10px">'+rituelsHtml+'</div>'+
        '</div>';
      }

  return {page:pageBloodMagicIdleV48_,recalculerLocal:recalculerBloodLocalIdleV1_};
}

window.__SOREAL_IDLE_BLOOD_V1__={creer:creer};
})();
