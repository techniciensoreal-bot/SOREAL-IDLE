/*
 * SOREAL IDLE — pages Augmentations, Machine temporelle, Magie du sang (pont) et Entraînement avancé, avec leur allocation rapide (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function actionMetaNoyauIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaNoyauIdleV130_.apply(null,arguments);}
      function allocationMaxMetaIdleV48_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.allocationMaxMetaIdleV48_.apply(null,arguments);}

      /*
       * 2026-09-24 (Norman : « Augmentation ne fonctionne pas comme dans NGU IDLE. Il me semble qu'il y avait des + pour pouvoir y
       * placer de l'énergie comme pour Basic Training. Là, si je clique sur 50 %, ça me retire l'énergie de Basic Training… »).
       * Les boutons 0 / 25 / 50 / 100 % visaient un montant ABSOLU (une fraction du Cap) : « 50 % » d'un Cap de 500 prenait d'un coup
       * les 250 unités libres, donc l'énergie Idle de Basic Training tombait à 0. Comme Basic Training : « + » / « − » placent ou
       * retirent la valeur du champ Input (le serveur borne à l'énergie libre), « Max » place toute l'énergie libre, « Tout retirer »
       * rend tout.
       */
      /*
       * Norman (2026-09-29) : « Je veux que les zones de saisies Input conservent le dernier
       * chiffre écrit. » Avant ce correctif, la valeur tapée ne survivait qu'en mémoire (perdue à
       * chaque rechargement de page) et Basic Training avait sa PROPRE zone Input, jamais reliée à
       * celle-ci : elle affichait "125" en dur dans son modèle HTML (soreal-idle-ui.js), donc
       * chaque re-rendu complet de la page (la synchro périodique d'environ 15 s, entre autres)
       * effaçait ce que le joueur venait de taper. Une seule valeur, désormais partagée par les
       * QUATRE zones Input (Basic Training, Augmentations, Blood Magic, Time Machine -- exactement
       * comme elles partageaient déjà cette variable entre elles trois) et persistée dans
       * localStorage : elle survit à un re-rendu, à un changement de menu ET à un rechargement.
       */
      let montantAugmentIdleV1=(function(){
        try{
          const v=Math.floor(Number(localStorage.getItem('soreal_idle_montant_input_v1')));
          return Number.isFinite(v)&&v>=1?v:125;
        }catch(_e){
          return 125;
        }
      })();

      /*
       * Chaque Input est PROPRE à son menu (Norman, 2026-10-10 : « chaque Input doit être propre au menu où il se trouve »). La valeur reste une variable unique (tout le code existant la lit), mais elle est
       * échangée à chaque changement de menu : on range la valeur du menu quitté dans sa case (persistée) et on charge celle du menu atteint ; un menu qu'on n'a jamais réglé garde la valeur d'avant (héritée).
       */
      const CLE_MONTANTS_MENU_IDLE_V1='soreal_idle_montants_menu_v1';

      const montantHeriteIdleV1=montantAugmentIdleV1;

      let montantsMenuIdleV1=(function(){
        try{const o=JSON.parse(localStorage.getItem(CLE_MONTANTS_MENU_IDLE_V1)||'{}');return o&&typeof o==='object'?o:{};}catch(_e){return {};}
      })();

      let menuMontantIdleV1='';

      function menuCourantMontantIdleV1_(){
        if(!menuMontantIdleV1){const f=window.__menuActifIdleV28__;menuMontantIdleV1=typeof f==='function'?String(f()||''):'';}
        return menuMontantIdleV1;
      }

      function memoriserMontantMenuIdleV1_(){
        const m=menuCourantMontantIdleV1_();
        if(!m)return;
        montantsMenuIdleV1[m]=montantAugmentIdleV1;
        try{localStorage.setItem(CLE_MONTANTS_MENU_IDLE_V1,JSON.stringify(montantsMenuIdleV1));}catch(_e){}
      }
      window.__SOREAL_IDLE_INPUT_MENU_V1__={
        /* Au démarrage : le menu affiché retrouve SA valeur. */
        init:function(menu){
          menu=String(menu||'');
          if(!menu)return;
          menuMontantIdleV1=menu;
          const v=Math.floor(Number(montantsMenuIdleV1[menu]));
          montantAugmentIdleV1=Number.isFinite(v)&&v>=1?v:montantHeriteIdleV1;
        },
        changer:function(nouveau){
          nouveau=String(nouveau||'');
          /* Le menu quitté est celui retenu jusqu'ici (jamais relu maintenant : le menu actif est déjà le nouveau). */
          const ancien=menuMontantIdleV1;
          if(!nouveau||nouveau===ancien)return;
          if(ancien)memoriserMontantMenuIdleV1_();
          menuMontantIdleV1=nouveau;
          const v=Math.floor(Number(montantsMenuIdleV1[nouveau]));
          montantAugmentIdleV1=Number.isFinite(v)&&v>=1?v:montantHeriteIdleV1;
          try{localStorage.setItem('soreal_idle_montant_input_v1',String(montantAugmentIdleV1));}catch(_e){}
        },
        montantDe:function(menu){const v=Math.floor(Number(montantsMenuIdleV1[menu]));return Number.isFinite(v)&&v>=1?v:montantHeriteIdleV1;}
      };

      function montantAugmentLireIdleV1_(){
        const el=document.getElementById('sorealIdleAugInputV1');
        const n=Math.floor(Number(el&&el.value));
        if(Number.isFinite(n)&&n>=1){montantAugmentIdleV1=n;memoriserMontantMenuIdleV1_();}
        return montantAugmentIdleV1;
      }
      window.__saisirMontantAugmentIdleV1__=function(v){
        const n=Math.floor(Number(v));
        if(Number.isFinite(n)&&n>=1){
          montantAugmentIdleV1=n;
          try{localStorage.setItem('soreal_idle_montant_input_v1',String(n));}catch(_e){}
          memoriserMontantMenuIdleV1_();
        }
      };
      window.__lireMontantAugmentIdleV1__=function(){return montantAugmentIdleV1;};

      /*
       * Norman (2026-09-29) : « les boutons Energy Cap ; Cap, 1/2, 1/4 et IDLE Cap, 1/2, 1/4 » --
       * mêmes raccourcis que la barre d'outils de Basic Training (presetBasicTrainingIdleV120_,
       * soreal-idle-ui.js), qui ne fait qu'écrire l'Input : "cap" part du plafond d'énergie total
       * (idleEtat.energieMax), "idle" part de l'énergie idle actuellement libre (idleEtat.energie).
       * Mêmes deux sources, jamais une valeur inventée pour Augmentation.
       */
      function presetAugmentIdleV1_(source,fraction){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const input=document.getElementById('sorealIdleAugInputV1');
        if(!input)return;
        const base=source==='idle'?H.idleEntier_(j&&j.energie):H.idleEntier_(j&&j.energieMax);
        const valeur=Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0)));
        input.value=String(valeur);
        window.__saisirMontantAugmentIdleV1__(valeur);
      }
      window.__presetAugmentIdleV1__=presetAugmentIdleV1_;

      /*
       * Norman (2026-09-27) : « Je veux le même son et la même animation sur le bouton + et le chiffre qui reçoit les
       * points d'énergie que dans basic training mais dans augmentation. » Avant ce correctif, le clic attendait le
       * bruit du réseau (rendreIdleEtat_ complet, appelé seulement à la réponse serveur) pour que la barre/le chiffre
       * ne bouge, et aucun son n'était joué -- exactement comme ajusterBasicTrainingIdleV120_ (soreal-idle-ui.js) :
       * mise à jour optimiste locale IMMÉDIATE (pair.energy/upgradeEnergy, énergie idle restante) + même son
       * (btPlus/btMinus/btCap) que Basic Training, avant même l'envoi au serveur. La confirmation serveur suit
       * normalement (actionMetaNoyauIdleV130_) et corrige la valeur si besoin.
       */
      /*
       * Norman (2026-09-29) : « j'ai l'impression que la réactivité n'est pas aussi bonne que dans
       * basic training. Le jeu m'a l'air plus lent. » Cause : rendreIdleEtat_ régénère TOUT le menu
       * affiché (chaque paire Augment/Upgrade visible) à chaque clic +/-/Cap -- beaucoup plus lourd
       * qu'un patch DOM ciblé, exactement le même défaut que Basic Training évitait déjà depuis le
       * début (rafraichirBasicTrainingIdleV120_, soreal-idle-ui.js). Remplacé par une mise à jour
       * directe des seuls éléments concernés : le chiffre alloué de CETTE paire, et la barre
       * d'Énergie principale (déjà exposée sur le pont hôte, rafraichirEnergieEtBoutonsIdleV9_).
       * La barre de PROGRESSION (le remplissage vers le niveau suivant) reste inchangée ici : elle
       * dépend de progressPct, calculé côté serveur à partir d'un débit, jamais de l'allocation
       * elle-même -- un rendu complet ne la rafraîchissait pas plus vite, il ne faisait que repeindre
       * la même valeur déjà affichée, à un coût bien plus élevé.
       */
      function rafraichirAllocationAugmentIdleV1_(pairId,upgrade,value){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const span=document.getElementById('sorealIdleAugAllocV1_'+pairId+'_'+(upgrade?'upgrade':'main'));
        if(span)span.textContent=H.formatGrandNombreIdleV70_(value)+' ⚡';
        const libre=document.getElementById('sorealIdleAugEnergieLibreV1');
        if(libre){
          const j=H.getIdleEtat();
          libre.textContent=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(j&&j.energie)));
        }
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
      }

      /*
       * ===== Allocations rapides (chantier « réactivité », Norman 2026-09-30) =====
       * « L'interface n'est pas réactive : quand on retire ou remet l'énergie dans Augmentations, ça met du temps. Tout doit être aussi
       * rapide que Basic Training. » Cause : chaque clic attendait l'aller-retour serveur (file d'actions en série, puis rendu complet de
       * la page) avant de mettre à jour durée, barre et compte à rebours. Basic Training, lui, applique tout EN LOCAL, envoie en différé
       * l'état voulu (un seul envoi pour une rafale de clics) et recolle la réponse sans tout redessiner. Même principe ici :
       *  1. le clic modifie l'état local et recalcule tout de suite ce qui en dépend (durée d'un niveau = K / allocation, barre, compte à
       *     rebours), avec les constantes K envoyées par le serveur (secondsK, speedK…) -- jamais une seconde formule inventée ;
       *  2. l'allocation part en différé (70 ms), UNE seule fois par cible (la dernière valeur voulue), un envoi à la fois ;
       *  3. la réponse est recollée SANS redessiner la page si elle confirme ce que l'écran montre ; sinon (refus, plafond) rendu complet.
       */
      const IDLE_ALLOC_RAPIDE_V1={file:new Map(),timer:0,enCours:false,ancien:null,voulu:new Map()};

      function cleAllocRapideV1_(p){
        return String(p.action)+':'+String(p.system||'')+':'+String(p.resource||p.pair||p.track||p.ritual||p.ngu||'')+':'+(p.upgrade?'u':'m');
      }

      function planifierAllocRapideV1_(delai){
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(R.timer)clearTimeout(R.timer);
        R.timer=setTimeout(viderAllocRapideV1_,Math.max(15,delai||70));
      }

      /* Met une action d'allocation en attente ; la même cible est écrasée (dernière valeur voulue), en fin de file pour garder l'ordre. */
      function envoyerAllocRapideV1_(payload,delai){
        if(typeof SOREAL_SESSION==='undefined'||!SOREAL_SESSION)return;
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(payload.action==='clearAugmentAllocations'){
          Array.from(R.file.keys()).forEach(function(c){if(c.indexOf('allocateAugment:')===0)R.file.delete(c);});
        }
        const cle=cleAllocRapideV1_(payload);
        const O=window.__allocOrdreIdleV1__;
        if(O&&!O.meta){O.meta=++O.n;O.metaAt=Date.now();}
        R.file.delete(cle);
        R.file.set(cle,payload);
        /* Ce que le joueur veut, tant que le serveur ne l'a pas confirmé : réappliqué sur tout état serveur plus ancien (voir appliquerAllocationsVoulues). */
        if(payload.action==='clearRitualAllocations')Array.from(R.file.keys()).forEach(function(c){if(c.indexOf('allocateRitual:')===0)R.file.delete(c);});
        if(payload.action==='allocate'||payload.action==='allocateAugment'||payload.action==='allocateAdvancedTraining'||payload.action==='allocateRitual'||payload.action==='allocateNgu')R.voulu.set(cle,payload);
        else if(payload.action==='clearRitualAllocations'){Array.from(R.voulu.keys()).forEach(function(c){if(c.indexOf('allocateRitual:')===0)R.voulu.delete(c);});R.voulu.set(cle,payload);}
        else if(payload.action==='clearAugmentAllocations')Array.from(R.voulu.keys()).forEach(function(c){if(c.indexOf('allocateAugment:')===0)R.voulu.delete(c);});
        planifierAllocRapideV1_(delai);
      }

      function O2(){return window.__allocOrdreIdleV1__;}
      /* La file d'allocations rapides (Augmentations, Time Machine, Blood Magic, Advanced Training) a-t-elle encore des envois en attente ou en vol ? Lu par la victoire de boss, qui attend qu'ils soient partis avant de demander confirmation au serveur. */
      window.__allocRapideEnAttenteIdleV1__=function(){const R=IDLE_ALLOC_RAPIDE_V1;return Boolean(R.file.size||R.timer||R.enCours);};
      window.__viderAllocRapideIdleV1__=function(){const R=IDLE_ALLOC_RAPIDE_V1;if(R.timer){clearTimeout(R.timer);R.timer=0;}viderAllocRapideV1_();};

      function viderAllocRapideV1_(){
        const R=IDLE_ALLOC_RAPIDE_V1;
        R.timer=0;
        if(R.enCours)return;
        const suivant=R.file.entries().next();
        if(suivant.done)return;
        /* Une répartition de Basic Training, modifiée avant celle-ci, doit arriver au serveur d'abord (voir idleAllocOrdreV1 dans soreal-idle-ui.js). */
        const O=window.__allocOrdreIdleV1__;
        if(O&&O.bt&&O.bt<O.meta&&Date.now()-O.btAt<4000){planifierAllocRapideV1_(40);return;}
        const cle=suivant.value[0];
        const payload=suivant.value[1];
        /* Plusieurs Augments / Upgrades en attente : un seul appel pour le lot (audit du menu Augmentations, 2026-10-05), au lieu d'un appel — et d'une réponse complète — par cible. */
        let cles=[cle];
        let envoi=payload;
        if(payload.action==='allocateAdvancedTraining'){
          const lotAt=[[cle,payload]];
          R.file.forEach(function(p,c){if(c!==cle&&p.action==='allocateAdvancedTraining')lotAt.push([c,p]);});
          if(lotAt.length>1){
            cles=lotAt.map(function(x){return x[0];});
            envoi={action:'allocateAdvancedTrainings',items:lotAt.map(function(x){return {track:x[1].track,value:x[1].value};})};
          }
        }else if(payload.action==='allocateAugment'){
          const lot=[[cle,payload]];
          R.file.forEach(function(p,c){if(c!==cle&&p.action==='allocateAugment')lot.push([c,p]);});
          if(lot.length>1){
            cles=lot.map(function(x){return x[0];});
            envoi={action:'allocateAugments',items:lot.map(function(x){return {pair:x[1].pair,upgrade:Boolean(x[1].upgrade),value:x[1].value};})};
          }
        }
        const payloads=cles.map(function(c){return c===cle?payload:R.file.get(c);});
        cles.forEach(function(c){R.file.delete(c);});
        R.enCours=true;
        window.__SOREAL_IDLE_META_HOST_V130__.appelerProgressionIdleCloudflareV1_(
          envoi,
          function(res){
            R.enCours=false;
            /* Réponse du serveur (sauf si une valeur plus récente attend dans la file) : l'intention est soldée AVANT de recoller, pour que le serveur garde la main (plafond, refus). */
            if(res&&res.ok)cles.forEach(function(c){if(!R.file.has(c))R.voulu.delete(c);});
            reconcilierAllocRapideV1_(res);
            if(R.file.size)planifierAllocRapideV1_(20);
            else if(O2()&&!R.timer)O2().meta=0;
          },
          function(){
            R.enCours=false;
            /* Échec réseau : on remet l'action (sauf si une valeur plus récente l'a déjà remplacée) et on réessaie. */
            cles.forEach(function(c,i){if(!R.file.has(c)&&payloads[i])R.file.set(c,payloads[i]);});
            planifierAllocRapideV1_(1200);
          }
        );
      }
      window.__envoyerAllocRapideIdleV1__=envoyerAllocRapideV1_;
      window.__allocRapideEtatIdleV1__=function(){return {enAttente:IDLE_ALLOC_RAPIDE_V1.file.size,enCours:IDLE_ALLOC_RAPIDE_V1.enCours,timer:Boolean(IDLE_ALLOC_RAPIDE_V1.timer)};};

      /* Empreinte des allocations de tous les systèmes : ce que le joueur a demandé, à comparer à ce que le serveur confirme. */
      function empreinteAllocationsMetaV1_(j){
        const liste=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
        return liste.map(empreinteSystemeMetaV1_).join('|');
      }

      /* Empreinte d'UN système : ce qu'il a d'alloué (allocation globale, énergie par paire, magie par rituel, énergie et Target par piste d'Entraînement avancé). */
      function empreinteSystemeMetaV1_(x){
        return (function(x){
          const st=(x&&x.state)||{};
          const pairs=st.data&&st.data.pairs;
          const extra=pairs?Object.keys(pairs).map(function(k){return k+':'+(pairs[k]&&pairs[k].energy)+'/'+(pairs[k]&&pairs[k].upgradeEnergy);}).join(','):'';
          const rituel=(st.data&&st.data.activeRitual?st.data.activeRitual:'')+(st.data&&st.data.rituals?Object.keys(st.data.rituals).map(function(k){return k+'~'+(st.data.rituals[k]&&st.data.rituals[k].magic);}).join(','):'');
          const pistesAt=String(x&&x.id)==='advancedTraining'&&st.data&&st.data.tracks?Object.keys(st.data.tracks).map(function(k){return k+'='+(st.data.tracks[k]&&st.data.tracks[k].energy)+'/'+(st.data.tracks[k]&&st.data.tracks[k].target);}).join(','):'';
          return String(x&&x.id)+'='+JSON.stringify(st.allocation||{})+extra+rituel+pistesAt;
        })(x);
      }

      /* Les seuls systèmes dont l'empreinte diffère entre l'écran et le serveur (identifiants), ou null si leurs listes ne sont pas comparables. */
      function systemesDifferentsMetaV1_(j,srv){
        const a=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:null;
        const b=srv&&srv.systemes&&Array.isArray(srv.systemes.systems)?srv.systemes.systems:null;
        if(!a||!b||a.length!==b.length)return null;
        const diff=[];
        for(let i=0;i<a.length;i+=1){
          if(String(a[i]&&a[i].id)!==String(b[i]&&b[i].id))return null;
          if(empreinteSystemeMetaV1_(a[i])!==empreinteSystemeMetaV1_(b[i]))diff.push(String(a[i]&&a[i].id));
        }
        return diff;
      }

      function niveauxAugmentsMetaV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'augmentations');
        const pairs=s&&s.state&&s.state.data&&s.state.data.pairs||{};
        return Object.keys(pairs).map(function(k){return k+':'+pairs[k].level+'/'+pairs[k].upgradeLevel;}).join(',');
      }

      /*
       * Anti-« rollback » (Norman, 2026-10-01) : « Les menus font parfois des rollback : je mets de l'énergie et elle m'est rendue ; je dois la
       * remettre (Time Machine…). » Cause : un état serveur calculé AVANT l'allocation (réponse d'un autre appel : combat, synchro, achat…) arrivait
       * après le clic et écrasait l'état local. Tant que le serveur n'a pas confirmé une allocation voulue, on la réapplique donc sur tout état qui
       * arrive (même calcul que le clic : allocation de la piste, énergie/Magic libre en conséquence). Sans effet quand l'état contient déjà la valeur.
       */
      function appliquerAllocationsVoulues(j){
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(!j||!R.voulu.size)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        /*
         * Norman (2026-10-07) : « dans Augmentations, je mets 10K, j'attends 2 secondes, je remets 10K : la barre fait un saut en arrière, à chaque fois ». Une réponse du serveur calculée AVANT le clic
         * arrive après lui : l'allocation voulue est réappliquée (ci-dessous), mais la barre et sa durée repartaient des chiffres périmés de cette réponse. On reporte donc le visuel local, celui que le
         * clic vient de recalculer (même fraction, nouvelle vitesse), sur l'état qui arrive, au lieu de le reconstruire depuis la réponse en retard.
         */
        const precedent=H.getIdleEtat();
        const reporterVisuels=function(){
          if(!precedent||precedent===j)return;
          if(precedent.__augmentationsVisualV215&&!j.__augmentationsVisualV215){
            j.__augmentationsVisualV215=precedent.__augmentationsVisualV215;
            j.__augmentationsVisualV215.src=j.systemes&&j.systemes.augmentations;
          }
          if(precedent.__bloodMagicVisualV1&&!j.__bloodMagicVisualV1)j.__bloodMagicVisualV1=Object.assign({},precedent.__bloodMagicVisualV1);
        };
        R.voulu.forEach(function(p){
          const val=Math.max(0,Math.floor(Number(p.value)||0));
          if(p.action==='allocate'){
            const sys=systemeMetaParIdIdleV130_(j,p.system);
            if(!sys||!sys.state||!sys.state.allocation)return;
            const actuel=Math.max(0,H.idleNombre_(sys.state.allocation[p.resource]));
            const delta=val-actuel;
            if(!delta)return;
            sys.state.allocation[p.resource]=val;
            if(p.resource==='energy')j.energie=Math.max(0,H.idleNombre_(j.energie)-delta);
            else if(p.resource==='magic'&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic){
              const m=j.systemes.resources.magic;
              m.current=Math.max(0,H.idleNombre_(m.current)-delta);
            }
          }else if(p.action==='allocateAdvancedTraining'){
            const sysAt=systemeMetaParIdIdleV130_(j,'advancedTraining');
            const pisteAt=sysAt&&sysAt.state&&sysAt.state.data&&sysAt.state.data.tracks&&sysAt.state.data.tracks[p.track];
            if(!pisteAt)return;
            const actuelAt=Math.max(0,H.idleNombre_(pisteAt.energy));
            const deltaAt=val-actuelAt;
            if(!deltaAt)return;
            pisteAt.energy=val;
            if(sysAt.state.allocation)sysAt.state.allocation.energy=Math.max(0,H.idleNombre_(sysAt.state.allocation.energy)+deltaAt);
            j.energie=Math.max(0,H.idleNombre_(j.energie)-deltaAt);
          }else if(p.action==='allocateNgu'){
            const ng=j.systemes&&j.systemes.ngus;
            const listeN=ng&&ng.tiers&&ng.tiers[ng.tier||'normal'];
            const nN=Array.isArray(listeN)?listeN.filter(function(x){return x&&x.id===p.ngu;})[0]:null;
            if(!nN)return;
            const actuelN=Math.max(0,H.idleNombre_(nN.allocation));
            const deltaN=val-actuelN;
            if(!deltaN)return;
            nN.allocation=val;
            const sysN=systemeMetaParIdIdleV130_(j,'ngu');
            if(sysN&&sysN.state&&sysN.state.allocation){
              const ressN=nN.resource==='magic'?'magic':'energy';
              sysN.state.allocation[ressN]=Math.max(0,H.idleNombre_(sysN.state.allocation[ressN])+deltaN);
            }
            if(nN.resource==='magic'){
              const mN=j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
              if(mN)mN.current=Math.max(0,H.idleNombre_(mN.current)-deltaN);
            }else j.energie=Math.max(0,H.idleNombre_(j.energie)-deltaN);
          }else if(p.action==='allocateAugment'){
            const sys=systemeMetaParIdIdleV130_(j,'augmentations');
            const pair=sys&&sys.state&&sys.state.data&&sys.state.data.pairs&&sys.state.data.pairs[p.pair];
            if(!pair)return;
            const champ=p.upgrade?'upgradeEnergy':'energy';
            const actuel=Math.max(0,H.idleNombre_(pair[champ]));
            const delta=val-actuel;
            if(!delta)return;
            pair[champ]=val;
            if(sys.state.allocation)sys.state.allocation.energy=Math.max(0,H.idleNombre_(sys.state.allocation.energy)+delta);
            j.energie=Math.max(0,H.idleNombre_(j.energie)-delta);
            reporterVisuels();
            try{recalculerAugmentLocalIdleV1_(j,p.pair,Boolean(p.upgrade),val);}catch(_e){}
          }else if(p.action==='allocateRitual'){
            const sysR=systemeMetaParIdIdleV130_(j,'bloodMagic');
            const ritR=sysR&&sysR.state&&sysR.state.data&&sysR.state.data.rituals&&sysR.state.data.rituals[p.ritual];
            if(!ritR)return;
            const actuelR=Math.max(0,H.idleNombre_(ritR.magic));
            const deltaR=val-actuelR;
            if(!deltaR)return;
            ritR.magic=val;
            if(sysR.state.allocation)sysR.state.allocation.magic=Math.max(0,H.idleNombre_(sysR.state.allocation.magic)+deltaR);
            const magieR=j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
            if(magieR)magieR.current=Math.max(0,H.idleNombre_(magieR.current)-deltaR);
            reporterVisuels();
            try{recalculerBloodLocalIdleV1_(j,p.ritual,val,true);}catch(_e){}
          }else if(p.action==='clearRitualAllocations'){
            const sysC=systemeMetaParIdIdleV130_(j,'bloodMagic');
            const rituelsC=sysC&&sysC.state&&sysC.state.data&&sysC.state.data.rituals;
            if(!rituelsC)return;
            const magieC=j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
            Object.keys(rituelsC).forEach(function(id){
              const courant=Math.max(0,H.idleNombre_(rituelsC[id].magic));
              if(!courant)return;
              rituelsC[id].magic=0;
              if(sysC.state.allocation)sysC.state.allocation.magic=Math.max(0,H.idleNombre_(sysC.state.allocation.magic)-courant);
              if(magieC)magieC.current=Math.max(0,H.idleNombre_(magieC.current)+courant);
            });
          }
        });
      }
      window.__appliquerAllocationsVouluesIdleV1__=appliquerAllocationsVoulues;

      /*
       * Réponse du serveur à une allocation. Une réponse plus ancienne que la valeur affichée est ignorée (la dernière réconcilie) ; une
       * réponse qui confirme l'écran met à jour les vues serveur (durées, progression) SANS redessiner la page ; une divergence
       * (refus, plafond, niveau cible atteint) redessine tout, comme avant.
       */
      function reconcilierAllocRapideV1_(res){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(!res||!res.ok||!res.joueur)return;
        if(R.file.size||R.timer)return;
        const j=H.getIdleEtat();
        if(!j)return;
        const srv=H.protegerJoueurServeurInventaireIdleV208_(res.joueur);
        /*
         * Entraînement avancé (Norman, 2026-10-08) : « quand on place de l'énergie, la feuille se redessine parfois ». Une différence entre l'écran et la réponse (Target tapé, énergie que le serveur passe à la ligne
         * suivante avec Advance Energy, énergie retirée au Target atteint) déclenchait le rendu COMPLET de la page. Quand seul l'Entraînement avancé diffère, on adopte son état serveur et on ne met à jour que ses lignes.
         */
        const differents=systemesDifferentsMetaV1_(j,srv);
        const seulEntrainementAvance=Boolean(differents&&differents.length&&differents.every(function(id){return id==='advancedTraining';}));
        if(!seulEntrainementAvance&&empreinteAllocationsMetaV1_(j)!==empreinteAllocationsMetaV1_(srv)){
          /* Trace en console seulement (pas de message au joueur : ce sont les chiffres qui doivent être justes, voir energieLibreCoherenteIdleV1_ dans soreal-idle-ui.js). */
          try{
            console.warn('[IDLE] répartition d’énergie ajustée par le serveur',{energieEcran:Math.floor(H.idleNombre_(j.energie)),energieServeur:Math.floor(H.idleNombre_(srv.energie)),repartitionEcran:empreinteAllocationsMetaV1_(j),repartitionServeur:empreinteAllocationsMetaV1_(srv)});
          }catch(_e){}
          /* Une répartition de Basic Training encore en route vers le serveur ne doit pas être écrasée par cette réponse. */
          if(typeof window.__btAllocEnAttenteIdleV1__==='function'&&window.__btAllocEnAttenteIdleV1__()&&j.basicTraining)srv.basicTraining=j.basicTraining;
          if(typeof window.__energieLibreCoherenteIdleV1__==='function'){
            const libre=window.__energieLibreCoherenteIdleV1__(srv);
            H.setIdleEtat(srv);
            srv.energie=libre;
          }else{
            H.setIdleEtat(srv);
          }
          H.rendreIdleEtat_({ok:true,joueur:srv});
          return;
        }
        /* Confirmation : l'énergie libre affichée suit celle du serveur, corrigée de ce que l'écran a placé de son côté (Basic Training en route…). */
        if(typeof window.__energieLibreCoherenteIdleV1__==='function')j.energie=window.__energieLibreCoherenteIdleV1__(srv);
        const niveauxAvant=niveauxAugmentsMetaV1_(j);
        const ressourcesLocales=j.systemes&&j.systemes.resources;
        j.systemes=srv.systemes;
        /* Les repères des barres (Augments, rituels) partent de l'instant où le serveur a produit CETTE réponse : avec l'instant de la première réponse du chargement, la barre rattrapait tout le temps écoulé depuis à la nouvelle vitesse (Norman, 2026-10-05). */
        if(srv.__recuPerfV1)j.__recuPerfV1=srv.__recuPerfV1;
        if(ressourcesLocales&&j.systemes)j.systemes.resources=ressourcesLocales;
        /* Un niveau d'Augment gagné pendant ce temps ne redessine la page QUE si c'est la page des Augmentations qui est affichée (Norman, 2026-10-11 : l'Entraînement avancé se redessinait parfois quand on y plaçait des points). */
        const menuAfficheV1=typeof window.__menuActifIdleV28__==='function'?String(window.__menuActifIdleV28__()||''):'';
        if(niveauxAugmentsMetaV1_(j)!==niveauxAvant&&(menuAfficheV1===''||menuAfficheV1==='augmentations')&&typeof H.rafraichirMenuRacineIdleV28_==='function'){
          H.rafraichirMenuRacineIdleV28_();
          return;
        }
        if(seulEntrainementAvance)patcherAdvancedTrainingIdleV1_(j);
        var signalerPageIdleV1_=function(cle,e){var D=window.__SOREAL_IDLE_DIAG_V1__;if(D&&D.signaler)D.signaler(cle,e);};
        try{pageAugmentationsIdleV48_(j);}catch(e){signalerPageIdleV1_('page_augments',e);}
        try{if(j.systemes&&j.systemes.bloodMagicView)pageBloodMagicIdleV48_(j);}catch(e){signalerPageIdleV1_('page_blood',e);}
        if(typeof H.patcherBarresTimeMachineIdleV1_==='function')H.patcherBarresTimeMachineIdleV1_(j);
      }

      /*
       * Recalcul local d'une piste à allocation A : durée d'un niveau = K / A ; la progression (en SECONDES) ne change pas quand on
       * change l'allocation, donc fraction' = secondes / durée'. Renvoie { seconds, progress } (seconds = 0 sans allocation).
       */
      /*
       * Barres alimentées par une ressource (Norman, 2026-10-05) : en changeant l'allocation, la barre ne rattrape pas son retard et ne perd rien : elle garde la MÊME fraction et adopte la nouvelle vitesse
       * (durée du niveau = K / allocation). Sans ressource, la barre reste où elle est.
       */
      function recalculerPisteFractionIdleV1_(k,fraction,alloc){
        const a=Math.max(0,Number(alloc)||0);
        const frac=Math.max(0,Math.min(.999999,Number(fraction)||0));
        if(!(k>0)||!(a>0))return {seconds:0,progress:frac};
        return {seconds:k/a,progress:frac};
      }

      function recalculerPisteAllocIdleV1_(k,progressSecondes,alloc){
        const a=Math.max(0,Number(alloc)||0);
        if(!(k>0)||!(a>0))return {seconds:0,progress:0};
        const seconds=k/a;
        return {seconds:seconds,progress:Math.max(0,Math.min(.999999,(Math.max(0,progressSecondes)||0)/seconds))};
      }

      /* Fait avancer d'abord les barres d'Augmentations du temps écoulé, puis repart de « maintenant » : tous les repères restent cohérents. */
      /* Instant (horloge locale, performance.now) où le serveur a produit la dernière réponse : réception moins un demi aller-retour (voir standalone-bridge.js). */
      function ancreSnapshotIdleV1_(j){
        const rtt=typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0;
        const recu=j&&Number(j.__recuPerfV1);
        return (recu>0?recu:performance.now())-rtt/2;
      }

/*
       * Repère visuel des Augments (une photo du serveur à l'instant où il l'a produite) : barres, niveaux et Or sont rejoués localement depuis ce repère (soreal-idle-ui.js, patch à chaque tick).
       * Construit à partir d'un état serveur : défs (Augments), paires (niveaux, énergie placée) et Or. Utilisé au dessin de la page ET à chaque synchro (voir adopterRepereAugmentsIdleV1_).
       */
      function construireVisuelAugmentsIdleV1_(j){
        const snap=j&&j.systemes||{},defs=Array.isArray(snap.augmentations)?snap.augmentations:[];
        const sys=systemeMetaParIdIdleV130_(j,'augmentations');
        const pairs=((sys&&sys.state&&sys.state.data)||{}).pairs||{};
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0);
        const etatAug=j;
        /* Base du multiplicateur d'Augments au moment de CETTE photo du serveur : sert à répercuter tout de suite un niveau gagné sur la vie max et l'attaque (voir appliquerAugmentsSurCombatIdleV1_). */
        const sommeAugments=function(niv){
          return defs.reduce(function(a,d){
            const n=niv(d,false);
            if(!(n>0))return a;
            const u=niv(d,true);
            return a+window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.baseMultiplier)*Math.pow(n,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.exponent)||1)*(1+u*u);
          },0);
        };
        const baseAdditif=sommeAugments(function(d,up){const p=pairs[d.id]||{};return Math.max(0,Number(up?p.upgradeLevel:p.level)||0);});
        const baseMult=Math.max(1,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier)||1);
  return {
          base:{mult:baseMult,additif:baseAdditif},
          appliedRatio:1,
          src:defs,
          at:ancreSnapshotIdleV1_(etatAug),
          defs:Object.fromEntries(defs.map(function(d){return [d.id,{progress:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.progressPct),upgradeProgress:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeProgressPct),/* Norman (2026-10-02) : « quand je retire tout d'Augmentation la barre continue à monter » -- un état serveur en retard décrit encore l'ancienne allocation : sans énergie placée (allocation affichée, après les allocations voulues), la barre ne tourne pas. */seconds:(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_((pairs[d.id]||{}).energy)>0)?window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.secondsPerLevel):0,upgradeSeconds:(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_((pairs[d.id]||{}).upgradeEnergy)>0)?window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeSecondsPerLevel):0,level:window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((pairs[d.id]||{}).level),upgradeLevel:window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((pairs[d.id]||{}).upgradeLevel),waiting:Boolean(d.waitingGold),upgradeWaiting:Boolean(d.upgradeWaitingGold),goldCost:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.goldCost),upgradeGoldCost:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeGoldCost),gold:gold}];}))
  };
      }

      /*
       * Norman (2026-10-05) : « le menu Augmentations n'est toujours pas fluide, il fait des rollback pour s'accorder avec le serveur ». Avant, chaque niveau validé déclenchait une synchro puis un REDESSIN
       * complet de la page 1,5 s plus tard : toutes les barres, niveaux et coûts repassaient un instant par les chiffres (en retard) du serveur. Désormais la réponse du serveur devient directement le nouveau
       * repère (même mécanique, aucun redessin) : le niveau, la barre et l'Or restent ceux de l'écran, recalés sur le serveur à l'instant où il a calculé.
       */
      function adopterRepereAugmentsIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const snap=j&&j.systemes;
        if(!snap||!Array.isArray(snap.augmentations)||!snap.augmentations.length)return;
        /* Un visuel déjà reporté sur cet état (allocation voulue, réponse en retard) est gardé : il porte la barre locale, pas les chiffres périmés du serveur. */
        if(j.__augmentationsVisualV215&&j.__augmentationsVisualV215.src===snap.augmentations)rebaserVisuelAugmentsIdleV1_(j.__augmentationsVisualV215);
        else j.__augmentationsVisualV215=construireVisuelAugmentsIdleV1_(j);
        const mult=document.getElementById('sorealIdleAugMultV1');
        const texteMult=formatMultiplicateurIdleV1_(H.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier||1));
        if(mult&&mult.textContent!==texteMult)mult.textContent=texteMult;
      }
      window.__adopterRepereAugmentsIdleV1__=adopterRepereAugmentsIdleV1_;

      /*
       * Rejeu des niveaux terminés d'une barre d'Augment depuis son repère, EN FORMULE (et non niveau par niveau, plafonné à 200 comme avant : une barre qui gagne 5 à 12 niveaux par seconde
       * restait figée 200 niveaux derrière le serveur jusqu'à la synchro suivante, puis sautait en arrière). Le niveau n (n = niveau + 1 + j) dure sec0 × n/n0 et coûte cout0 × (n/n0)^expo
       * (expo 1 pour un Augment, 2 pour son Upgrade). `debites` cycles ont déjà été débités. Rend {k, reste, debites, debit, bloque} ; l'appelant retire `debit` de l'Or local.
       */
      /* « Bonus total Attack & Defense » : « X 10.639 » (Norman, 2026-10-10 : « X10639.000 » devient « X 10639 ») ; entier dès 100, décimales utiles en dessous, virgule française. */
      function formatMultiplicateurIdleV1_(m){
        const v=Number(m);
        if(!isFinite(v))return 'X 1';
        if(v>=100){
          const n=Math.round(v);
          return 'X '+(window.__SOREAL_IDLE_NUMBER_FORMAT_V1__&&window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.entierLisible?window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.entierLisible(n):String(n));
        }
        return 'X '+v.toFixed(v>=10?2:3).replace('.',',');
      }
      window.__formatMultiplicateurIdleV1__=formatMultiplicateurIdleV1_;

      function rejouerCyclesAugmentIdleV1_(p){
        const n0=Math.max(1,p.niv0+1),sec0=p.sec0,expo=p.expo;
        const temps=function(k){return sec0/n0*(k*n0+k*(k-1)/2);};
        const somme1=function(a,b){return (b*(b-1)-a*(a-1))/2;};
        const somme2=function(a,b){const f=function(m){return (m-1)*m*(2*m-1)/6;};return f(b)-f(a);};
        const cout=function(a,b){
          const m=b-a;
          if(m<=0)return 0;
          if(expo===1)return p.cout0/n0*(m*n0+somme1(a,b));
          return p.cout0/(n0*n0)*(m*n0*n0+2*n0*somme1(a,b)+somme2(a,b));
        };
        const total=p.reste0;
        let kMax=Math.floor(-(n0-0.5)+Math.sqrt((n0-0.5)*(n0-0.5)+2*total*n0/sec0));
        if(!(kMax>=0)||!isFinite(kMax))kMax=0;
        while(kMax>0&&temps(kMax)>total*(1+1e-12))kMax-=1;
        while(temps(kMax+1)<=total*(1+1e-12)&&kMax<1e9)kMax+=1;
        const d=Math.min(p.debites,kMax);
        let k=kMax,debit=0,debites=Math.max(p.debites,0),bloque=false;
        if(kMax>d){
          if(cout(d,kMax)<=p.gold+1e-9){
            debit=cout(d,kMax);debites=kMax;
          }else{
            let lo=d,hi=kMax;
            while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(cout(d,mid)<=p.gold+1e-9)lo=mid;else hi=mid;}
            k=lo;bloque=true;debit=cout(d,k);debites=Math.max(debites,k);
          }
        }
        return {k:k,reste:total-temps(k),debites:debites,debit:debit,bloque:bloque,coutProchain:p.cout0*Math.pow((n0+k)/n0,expo),dureeProchaine:sec0*(n0+k)/n0};
      }
      window.__rejouerCyclesAugmentIdleV1__=rejouerCyclesAugmentIdleV1_;

      /*
       * Barre « CAP » (Norman, 2026-10-10 : « quand les Ciseaux de sécurité sont cap, les niveaux ne se mettent pas à jour en temps réel ; ils ne bougent qu'une fois la barre repartie ») : quand le temps d'un niveau
       * tombe sous un tick (0,02 s, au plus 50 niveaux par seconde), le niveau, le coût et l'Or n'étaient plus rejoués en local entre deux synchros. On les rejoue ici, niveau par niveau (une barre CAP n'en gagne
       * que 50 par seconde, donc la boucle reste courte) : le niveau n dure max(0,02 s ; durée de base × n / niveau de départ) et coûte coût de base × (n / niveau de départ)^exposant, comme le moteur.
       * Même résultat que rejouerCyclesAugmentIdleV1_ : {k, reste, debites, debit, bloque}.
       */
      function rejouerCyclesAugmentPlafonneIdleV1_(p){
        const n0=Math.max(1,p.niv0+1),expo=p.expo,sec0=p.sec0;
        const coutNiveau=function(i){return p.cout0*Math.pow((n0+i)/n0,expo);};
        const dureeNiveau=function(i){return Math.max(0.02,sec0*(n0+i)/n0);};
        const total=Math.max(0,p.reste0);
        let kMax=0,temps=0;
        while(kMax<20000){
          const dn=dureeNiveau(kMax);
          if(temps+dn>total*(1+1e-12))break;
          temps+=dn;kMax+=1;
        }
        const d=Math.min(Math.max(0,p.debites),kMax);
        let k=kMax,debit=0,debites=Math.max(p.debites,0),bloque=false;
        if(kMax>d){
          let cumul=0,j=d;
          while(j<kMax){
            const c=coutNiveau(j);
            if(cumul+c>p.gold+1e-9){bloque=true;break;}
            cumul+=c;j+=1;
          }
          k=j;debit=cumul;debites=Math.max(debites,j);
        }
        let tempsK=0;
        for(let i=0;i<k;i+=1)tempsK+=dureeNiveau(i);
        return {k:k,reste:total-tempsK,debites:debites,debit:debit,bloque:bloque,coutProchain:coutNiveau(k),dureeProchaine:dureeNiveau(k)};
      }
      window.__rejouerCyclesAugmentPlafonneIdleV1__=rejouerCyclesAugmentPlafonneIdleV1_;

      /*
       * Ramène le repère à « maintenant ». Les niveaux terminés depuis le repère sont REJOUÉS (niveau, coût, durée du suivant, Or débité) exactement comme le fait le tick de soreal-idle-ui.js : l'ancien
       * calcul (reste de la division par la durée) effaçait ces niveaux sans les compter, d'où un niveau affiché qui reculait d'un cran et un Or trop haut jusqu'à la synchro suivante.
       */
      function rebaserVisuelAugmentsIdleV1_(visual){
        if(!visual||!visual.defs)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const maintenant=performance.now();
        const ecoule=Math.max(0,(maintenant-visual.at)/1000);
        const etat=H.getIdleEtat();
        const monnaies=etat&&etat.systemes&&etat.systemes.currencies;
        Object.keys(visual.defs).forEach(function(id){
          const d=visual.defs[id];
          [['progress','seconds','waiting','level','goldCost','main',1],['upgradeProgress','upgradeSeconds','upgradeWaiting','upgradeLevel','upgradeGoldCost','upgrade',2]].forEach(function(c){
            const sec0=Number(d[c[1]])||0;
            if(!(sec0>0)||d[c[2]])return;
            if(sec0<=0.0201)return;
            const niv0=Math.max(0,H.idleEntier_(d[c[3]]));
            const cout0=H.idleNombre_(d[c[4]]);
            const cle='cycles_'+c[5];
            const rj=rejouerCyclesAugmentIdleV1_({niv0:niv0,sec0:sec0,cout0:cout0,expo:c[6],reste0:(Number(d[c[0]])||0)*sec0+ecoule,debites:d[cle]||0,gold:monnaies?H.idleNombre_(monnaies.gold):0});
            if(monnaies&&rj.debit>0)monnaies.gold=Math.max(0,H.idleNombre_(monnaies.gold)-rj.debit);
            d[cle]=Math.max(0,rj.debites-rj.k);
            if(rj.k>0){d[c[3]]=niv0+rj.k;d[c[4]]=rj.coutProchain;}
            d[c[1]]=rj.dureeProchaine;
            d[c[0]]=Math.max(0,rj.reste/rj.dureeProchaine);
          });
        });
        visual.at=maintenant;
      }

      function ajusterAugmentIdleV1_(pairId,upgrade,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'augmentations');
        const pair=((s&&s.state&&s.state.data&&s.state.data.pairs)||{})[pairId]||{};
        const current=Math.max(0,H.idleNombre_(upgrade?pair.upgradeEnergy:pair.energy));
        const pas=montantAugmentLireIdleV1_();
        const idleAvant=Math.max(0,H.idleNombre_(j&&j.energie));
        const cible=mode==='plus'
          ?current+Math.min(pas,idleAvant)
          :mode==='moins'
            ?Math.max(0,current-pas)
            :mode==='zero'?0:current+idleAvant;
        const value=Math.max(0,H.idleEntier_(cible));
        const delta=value-current;

        if(delta!==0){
          try{
            const audio=window.__SOREAL_IDLE_AUDIO_V199__;
            const son=mode==='plus'?'btPlus':(mode==='moins'||mode==='zero')?'btMinus':'btCap';
            if(audio&&typeof audio[son]==='function')audio[son]();
          }catch(_e){}

          if(pair)pair[upgrade?'upgradeEnergy':'energy']=value;
          if(s&&s.state&&s.state.allocation)s.state.allocation.energy=Math.max(0,H.idleNombre_(s.state.allocation.energy)+delta);
          if(j)j.energie=Math.max(0,idleAvant-delta);
          recalculerAugmentLocalIdleV1_(j,pairId,upgrade,value);
          rafraichirAllocationAugmentIdleV1_(pairId,upgrade,value);
        }

        /* Rien n'a changé (plus d'énergie libre, déjà à zéro) : aucun envoi (audit du menu Augmentations, 2026-10-05) ; une intention déjà en attente pour cette cible, elle, part quand même. */
        if(delta===0)return;
        envoyerAllocRapideV1_({action:'allocateAugment',pair:pairId,upgrade:Boolean(upgrade),value:value});
      }
      window.__ajusterAugmentIdleV1__=ajusterAugmentIdleV1_;
      window.__cibleAugmentIdleV1__=function(id,upgrade,valeur){
        const n=Math.max(0,Math.floor(Number(valeur)||0));
        const j=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat();
        const defs=j&&j.systemes&&Array.isArray(j.systemes.augmentations)?j.systemes.augmentations:[];
        const d=defs.find(function(x){return x&&x.id===id;});
        if(d)d[upgrade?'upgradeTarget':'target']=n;
        envoyerAllocRapideV1_({action:'setAugmentTarget',pair:String(id),upgrade:Boolean(upgrade),value:n});
      };
      window.__avanceAugmentsIdleV1__=function(coche){
        const j=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat();
        if(j&&j.systemes)j.systemes.augmentationsAdvance=Boolean(coche);
        envoyerAllocRapideV1_({action:'setAugmentAdvance',enabled:Boolean(coche)});
      };

      /*
       * Recalcule tout de suite, pour la piste modifiée, la durée d'un niveau, la barre et le compte à rebours (le ticker de
       * soreal-idle-ui.js les redessine à son prochain passage, donc quasi instantanément) : durée = K / allocation, avec K (secondsK)
       * fourni par le serveur. Les autres pistes gardent leur animation en cours (rebasées sur « maintenant »).
       */
      /* « Tout retirer » : rend toute l'Energy des Augments d'un coup, en local d'abord (durées, barres, énergie libre), puis un seul envoi. */
      function viderAugmentsIdleV1_(){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'augmentations');
        if(!s||!s.state)return;
        const pairs=(s.state.data&&s.state.data.pairs)||{};
        let rendu=0;
        Object.keys(pairs).forEach(function(id){
          const p=pairs[id];
          ['energy','upgradeEnergy'].forEach(function(cle){
            const v=Math.max(0,H.idleNombre_(p&&p[cle]));
            if(!(v>0))return;
            rendu+=v;
            p[cle]=0;
            recalculerAugmentLocalIdleV1_(j,id,cle==='upgradeEnergy',0);
            rafraichirAllocationAugmentIdleV1_(id,cle==='upgradeEnergy',0);
          });
        });
        if(s.state.allocation)s.state.allocation.energy=0;
        if(rendu>0){
          try{
            const audio=window.__SOREAL_IDLE_AUDIO_V199__;
            if(audio&&typeof audio.btMinus==='function')audio.btMinus();
          }catch(_e){}
          if(j)j.energie=Math.max(0,H.idleNombre_(j.energie))+rendu;
          if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
        }
        envoyerAllocRapideV1_({action:'clearAugmentAllocations'});
      }
      window.__viderAugmentsIdleV1__=viderAugmentsIdleV1_;

      function recalculerAugmentLocalIdleV1_(j,pairId,upgrade,alloc){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const defs=j&&j.systemes&&Array.isArray(j.systemes.augmentations)?j.systemes.augmentations:[];
        const def=defs.find(function(x){return x&&x.id===pairId;});
        const visual=j&&j.__augmentationsVisualV215;
        const d=visual&&visual.defs&&visual.defs[pairId];
        if(!def||!d)return;
        const k=H.idleNombre_(upgrade?def.upgradeSecondsK:def.secondsK);
        if(!(k>0))return;
        rebaserVisuelAugmentsIdleV1_(visual);
        const cleP=upgrade?'upgradeProgress':'progress';
        const cleS=upgrade?'upgradeSeconds':'seconds';
        const cleW=upgrade?'upgradeWaiting':'waiting';
        const ancienSec=H.idleNombre_(d[cleS]);
        /* Fraction actuelle de la barre : celle de l'écran si la piste tournait, sinon celle du serveur ; elle ne change pas avec l'allocation (voir recalculerPisteFractionIdleV1_). */
        const fracAvant=ancienSec>0?Math.min(1,H.idleNombre_(d[cleP])):H.idleNombre_(upgrade?def.upgradeProgressFraction:def.progressFraction);
        const nouveau=recalculerPisteFractionIdleV1_(k,fracAvant,alloc);
        d[cleS]=nouveau.seconds;
        d[cleP]=nouveau.progress;
        d[cleW]=false;
        def[upgrade?'upgradeSecondsPerLevel':'secondsPerLevel']=nouveau.seconds>0?nouveau.seconds:null;
        def[upgrade?'upgradeProgressPct':'progressPct']=nouveau.progress;
        const texte=document.querySelector('[data-idle-aug-parniveau-v1="'+pairId+':'+(upgrade?'upgrade':'main')+'"]');
        /* Norman (2026-10-01) : plus de « ⏱ … par niveau » : cette durée dépend de l'énergie placée, elle n'a pas lieu d'être. L'élément reste, vide. */
        if(texte)texte.textContent='';
      }

      /*
       * 2026-09-24 (Norman) : « il faudrait le temps indiqué pour qu'elle prenne un niveau ». Durée d'un niveau, coût en Or, et — tant
       * que la barre est pleine faute d'Or (wiki : chaque niveau coûte de l'Or) — ce qu'il manque. Aussi rafraîchi à chaque tick par
       * soreal-idle-ui.js (data-idle-aug-eta-v1) : le compte à rebours suit la barre.
       */
      function formatDureeAugmentIdleV1_(secondes){
        let s=Math.max(0,Math.ceil(Number(secondes)||0));
        if(s<60)return s+' s';
        const j=Math.floor(s/86400);s-=j*86400;
        const h=Math.floor(s/3600);s-=h*3600;
        const m=Math.floor(s/60);s-=m*60;
        if(j>0)return j+' j '+h+' h';
        if(h>0)return h+' h '+m+' min';
        return m+' min '+s+' s';
      }
      window.__formatDureeAugmentIdleV1__=formatDureeAugmentIdleV1_;

      function texteEtaAugmentIdleV1_(x,ecoule){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const secondes=Number(x&&x.seconds);
        if(!(secondes>0))return 'Place de l’énergie pour progresser.';
        if(x.waiting){
          const manque=Math.max(0,Number(x.goldCost)-Number(x.gold));
          return manque>0
            ?'🪙 Il manque <b class="or-somme-v1">'+H.formatGrandNombreIdleV70_(manque)+' Or</b> pour le niveau suivant.'
            :'⏳ Barre pleine : plus de niveau disponible pour l’instant (défi en cours).';
        }
        const restant=secondes*(1-Math.max(0,Math.min(1,Number(x.progress)||0)))-(Number(ecoule)||0);
        const reste=((restant%secondes)+secondes)%secondes;
        return 'Niveau suivant dans '+formatDureeAugmentIdleV1_(reste||secondes);
      }
      window.__texteEtaAugmentIdleV1__=texteEtaAugmentIdleV1_;

      /*
       * Norman (2026-09-29) : « retravailler les menus Augmentations, Time Machine, Blood Magic : plus
       * clairs dans leur manière d'être utilisés, et savoir à quoi sert chaque chose. » Un bloc d'aide
       * commun aux trois pages : un résumé (à quoi sert le menu) puis des étapes numérotées. Chaque
       * phrase vient de la page wiki NGU du menu (Augmentations, Broken Time Machine, Blood Magic,
       * consultées le 2026-09-29) -- aucune valeur inventée. Anti-spoil (AGENTS.md, règle n°2) : l'appelant
       * ne passe que du texte relatif à ce que le joueur a DÉJÀ débloqué. Le bloc est repliable et son état
       * survit au re-rendu (la synchro périodique redessine la page) via localStorage.
       */
      function aideMenuOuverteIdleV1_(cle){
        try{return localStorage.getItem('soreal_idle_aide_v1_'+cle)==='1';}catch(_e){return false;}
      }
      window.__basculerAideMenuIdleV1__=function(cle,details){
        try{localStorage.setItem('soreal_idle_aide_v1_'+cle,details&&details.open?'1':'0');}catch(_e){}
      };

      function carteAideMenuIdleV1_(cle,resume,etapes){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        return '<details class="soreal-idle-aide-v1" data-idle-aide-v1="'+H.idleHtml_(cle)+'"'+(aideMenuOuverteIdleV1_(cle)?' open':'')+' ontoggle="window.__basculerAideMenuIdleV1__(\''+H.idleHtml_(cle)+'\',this)">'+
          '<summary>💡 À quoi ça sert ?</summary>'+
          '<p class="soreal-idle-aide-resume-v1">'+H.idleHtml_(resume)+'</p>'+
          '<ol class="soreal-idle-aide-etapes-v1">'+etapes.map(function(e){return '<li>'+H.idleHtml_(e)+'</li>';}).join('')+'</ol>'+
        '</details>';
      }

      /* Ligne de légende sous l'aide : ce que font les boutons de la barre d'outils (Input, Cap, Idle) -- la même pour Augmentations / Time Machine / Blood Magic. */
      function legendeAllocationIdleV1_(ressource,libre,croix){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        /* Blood Magic (Norman, 2026-10-01) : le « + » y est une croix renversée. */
        const plus=croix?'<b class="soreal-idle-blood-croix-v1">✝︎</b>':'<b>+</b>';
        /* Norman, 2026-10-08 : plus de texte explicatif sous l'aide pour le champ Input. */
        void plus;void H;void ressource;void libre;
        return '';
      }

      function pageAugmentationsIdleV48_(j){
        const sys=systemeMetaParIdIdleV130_(j,'augmentations');
        /* No Augmentations Challenge : « the augmentations feature is entirely off-limits for the duration of this challenge ». */
        if(j&&j.systemes&&j.systemes.challenge&&j.systemes.challenge.active==='noAugmentations')return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🦾 Augmentations','Menu interdit pendant le défi.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🚫 No Augmentations Challenge : le menu Augmentations est interdit tant que le défi est en cours. Termine-le ou abandonne-le pour y retourner.</div>';
        if(!sys||!sys.state||!sys.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const snap=j&&j.systemes||{},defs=Array.isArray(snap.augmentations)?snap.augmentations:[],pairs=(sys.state.data||{}).pairs||{};
        /*
         * Déblocage des Augments et de leurs Upgrades (Norman, 2026-10-04 : « toute l'énergie que je place m'est rendue » ; essai en direct sur son compte : « Ciseaux dangereux » affiché comme disponible, toute l'énergie
         * placée revenait au bout d'une seconde). Le serveur compare le seuil au boss du RUN EN COURS (context.bosses, remis à zéro à chaque Rebirth, comme tous les déblocages de systèmes) ; la page, elle, lisait le
         * meilleur boss de tous les temps (records.highestBoss = 61 contre 32 dans le run) et proposait donc des Upgrades que le serveur refusait en bloc. Le déblocage lit maintenant le même boss que le serveur ;
         * « Boss max » reste affiché pour information.
         */
        const bossMax=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(snap.records&&snap.records.highestBoss||0),boss=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j&&j.bossVaincus)),gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0),mult=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier||1);
        /*
         * Norman (2026-10-03) : chronos très précis. Un redessin de la page ne doit JAMAIS remettre la barre en arrière : si les chiffres du serveur n'ont pas changé depuis le dernier dessin (même tableau),
         * on garde le repère qui tourne déjà, rebasé à maintenant. Sinon (nouvelle réponse), le repère part de l'instant où le serveur a produit ces chiffres : réception moins un demi aller-retour.
         */
        const etatAug=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat();
        const visuelAugExistant=etatAug.__augmentationsVisualV215;
        const garderVisuelAug=Boolean(visuelAugExistant&&visuelAugExistant.src===defs&&defs.length);
        if(garderVisuelAug)rebaserVisuelAugmentsIdleV1_(visuelAugExistant);
        if(!garderVisuelAug){
        etatAug.__augmentationsVisualV215=construireVisuelAugmentsIdleV1_(j);
        rebaserVisuelAugmentsIdleV1_(etatAug.__augmentationsVisualV215);
        }
        const cap=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.resources&&snap.resources.energy&&snap.resources.energy.cap||0));
        /* Montée en puissance : du premier Augment (rang 0) au dernier (rang 5). */
        const rangAugment=function(d){const i=defs.findIndex(function(x){return x&&d&&x.id===d.id;});return Math.max(0,Math.min(5,Math.round(Math.max(0,i)*5/Math.max(1,defs.length-1))));};
        function track(def,pair,upgrade,ok){
          const value=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(upgrade?pair.upgradeEnergy:pair.energy));
          const pct=Math.max(0,Math.min(100,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(upgrade?def.upgradeProgressPct:def.progressPct)*100));
          const level=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(upgrade?pair.upgradeLevel:pair.level);
          /* Deuxième ligne d'un Augment : le vrai nom de son Upgrade (wiki NGU Idle « Augmentations » : Danger Scissors, Drinking The Milk Too…), en français. */
          const label=upgrade?'⬆️ '+(IDLE_NOMS_UPGRADES_AUGMENTS_V1[def.upgrade&&def.upgrade.id]||(def.upgrade&&def.upgrade.name)||'Upgrade'):'';
          const sousTitre='';
          /*
           * Page Augmentations refaite (Norman, 2026-10-08) : plus d’ancienne phrase de coût ; « Prochain niveau » et la somme, en gros ; la somme est VERTE quand on a l'Or et ROUGE sinon (couleur mise à
           * jour à chaque tick, voir soreal-idle-ui.js). Mêmes identifiants et mêmes data-* qu'avant : les compteurs, barres et boutons existants continuent de fonctionner.
           */
          const H=window.__SOREAL_IDLE_META_HOST_V130__;
          const coutBrut=Number(upgrade?def.upgradeGoldCost:def.goldCost)||0;
          const clef=H.idleHtml_(def.id)+':'+(upgrade?'upgrade':'main');
          const etaTexte=texteEtaAugmentIdleV1_({seconds:upgrade?def.upgradeSecondsPerLevel:def.secondsPerLevel,progress:upgrade?def.upgradeProgressPct:def.progressPct,waiting:upgrade?def.upgradeWaitingGold:def.waitingGold,goldCost:upgrade?def.upgradeGoldCost:def.goldCost,gold:gold},0);
          /* Paire « Augment (normale) + Upgrade (puissante) » : chaque piste porte son badge, son icône et sa couleur ; l'Upgrade multiplie le bonus de l'Augment par (1 + niveau²), la puissance totale ne change pas. */
          const cible=Math.max(0,H.idleEntier_(upgrade?def.upgradeTarget:def.target));
          const iconePiste=upgrade?(IDLE_ICONES_UPGRADES_AUGMENTS_V1[def.upgrade&&def.upgrade.id]||'⚡'):(IDLE_ICONES_AUGMENTS_V1[def.id]||'🦾');
          const badge=upgrade
            ?'<span class="aug-badge-v2 puissant"><i>'+iconePiste+'</i></span>'
            :'<span class="aug-badge-v2 normal"><i>'+iconePiste+'</i></span>';
          const nomPiste=upgrade?H.idleHtml_((label||'').replace('⬆️ ','')):H.idleHtml_(IDLE_NOMS_AUGMENTS_V1[def.id]||def.name||def.id);
          const cleIdUp=upgrade?'true':'false';
          return (upgrade?'<span class="aug-lien-v2" aria-hidden="true">×</span>':'')+'<div class="aug-piste-v2'+(upgrade?' upgrade':'')+'" data-rang-v1="'+rangAugment(def)+'" style="opacity:'+(ok?'1':'.45')+'">'+
            '<div class="aug-tete-v2">'+badge+'<span class="aug-nom-piste-v2">'+nomPiste+'</span></div>'+
            '<div class="aug-ligne-haut">'+
              '<div class="aug-niv-bloc"><span class="aug-niv-lib">Niveau</span><b class="aug-niv-val"><span data-idle-aug-niv-v1="'+clef+'">'+(window.__SOREAL_IDLE_NUMBER_FORMAT_V1__&&window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.entierLisible?window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.entierLisible(level):level)+'</span></b></div>'+
              '<span id="sorealIdleAugAllocV1_'+H.idleHtml_(def.id)+'_'+(upgrade?'upgrade':'main')+'" class="soreal-idle-bt-allocation-v120">'+H.formatGrandNombreIdleV70_(value)+'⚡</span>'+
            '</div>'+
            '<div class="aug-cout-ligne">'+
              '<span data-idle-aug-parniveau-v1="'+def.id+':'+(upgrade?'upgrade':'main')+'"></span>'+
              '<span class="aug-cout-lib">Prochain niveau</span>'+
              '<span class="aug-cout-val '+(gold>=coutBrut?'ok':'non')+'" data-idle-aug-cout-v1="'+clef+'" data-cout="'+coutBrut+'">'+H.formatGrandNombreIdleV70_(upgrade?def.upgradeGoldCost:def.goldCost)+' Or</span>'+
            '</div>'+
            '<div class="aug-eta" data-idle-aug-eta-v1="'+def.id+':'+(upgrade?'upgrade':'main')+'">'+etaTexte+'</div>'+
            /* tube de verre : le liquide monte avec la progression, le quadrillage donne l'échelle, le reflet ne passe que sur une piste qui porte de l'énergie */
            '<div class="aug-tube-v2"><div data-idle-aug-bar-v215="'+def.id+':'+(upgrade?'upgrade':'main')+'" class="aug-liquide-v2" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;will-change:transform;transition:none"><i class="aug-reflet-v2"></i></div></div>'+
            '<div class="aug-bas-v2">'+
              '<label class="aug-cible-v2"><span>Cible</span><input type="number" inputmode="numeric" min="0" step="1" value="'+cible+'" '+(ok?'onchange="window.__cibleAugmentIdleV1__(\''+H.idleHtml_(def.id)+'\','+cleIdUp+',this.value)"':'disabled')+' title="Niveau cible : l’énergie est retirée dès qu’il est atteint (ou passée à la piste suivante si « Faire suivre l’énergie » est coché). 0 = aucune cible."></label>'+
              '<div class="soreal-idle-bt-actions-v120">'+[['plus','+'],['moins','−'],['max','Max'],['zero','0']].map(function(b){return '<button type="button" '+(b[0]==='zero'?'title="Retirer toute l’énergie de cette barre" ':'')+(ok?'onclick="window.__ajusterAugmentIdleV1__(\''+H.idleHtml_(def.id)+'\','+upgrade+',\''+b[0]+'\')"':'disabled')+'>'+b[1]+'</button>';}).join('')+'</div>'+
            '</div></div>';
        }
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🦾 Augmentations','Renforce ton Attack et ta Defense en y investissant de l’Energy et de l’Or.')+
          carteAideMenuIdleV1_('augmentations','Chaque Augment te donne un multiplicateur d’Attack et de Defense. Les multiplicateurs de tous tes Augments s’additionnent.',[
            'Place de l’Energy sur un Augment avec + : plus il en reçoit, plus sa barre se remplit vite.',
            'Quand la barre est pleine, l’Augment gagne un niveau si tu as assez d’Or (le coût d’un niveau = coût de base × ce niveau).',
            'Chaque Augment a une Upgrade associée : elle coûte de l’Or et de l’Energy, et multiplie le bonus de l’Augment par (1 + niveau²).',
            'Chaque Augment et chaque Upgrade a sa propre Energy et progresse en parallèle des autres.',
            'Tous les niveaux sont remis à zéro à chaque Rebirth.'
          ])+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">💪 Bonus total Attack &amp; Defense<b id="sorealIdleAugMultV1">'+formatMultiplicateurIdleV1_(mult)+'</b></div><div class="soreal-idle-summary-v28">👹 Boss max<b>'+bossMax+'</b></div></div>'+
          legendeAllocationIdleV1_('Energy',true)+
          '<div class="soreal-idle-bt-toolbar-v120"><div class="soreal-idle-bt-input-box-v120"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" inputmode="decimal" value="'+montantAugmentIdleV1+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"></div><div class="soreal-idle-bt-info-v1">Énergie libre : <b id="sorealIdleAugEnergieLibreV1">'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(j&&j.energie)))+'</b> ⚡</div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>⚡ Plafond d’énergie</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.25)">1/4</button></div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderAugmentsIdleV1__()">Tout retirer</button></div>'+(window.__SOREAL_IDLE_ALLOC_V1__?window.__SOREAL_IDLE_ALLOC_V1__.compteur('energy','augmentations'):'')+'</div>'+
          '<label class="aug-avance-v2"><input type="checkbox" '+(snap.augmentationsAdvance?'checked ':'')+'onchange="window.__avanceAugmentsIdleV1__(this.checked)"><span><b>Faire suivre l’énergie</b> Quand une piste atteint sa cible, son énergie passe à la suivante (l’Augment, puis sa version puissante, paire après paire).</span></label>'+
          /*
           * Anti-spoil (2026-09-27, Norman + AGENTS.md règle n°2) : IDLE_NGU_AUGMENTATIONS est déjà trié par unlockBoss croissant
           * (idle-ngu-progression.js), donc « débloqués + le prochain » est juste une troncature à la première paire non débloquée
           * (exactement le même principe que groupeBasicTrainingIdleV120_/premierVerrouille, soreal-idle-ui.js). La paire encore
           * verrouillée montrée ensuite n'affiche ni son nom, ni son seuil ("Boss N") -- jamais une condition en clair, comme la
           * ligne verrouillée de Basic Training (icone + « ??????? »).
           */
          (function(){
            const premierVerrouilleIndex=defs.findIndex(function(def){return boss<window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0);});
            const defsVisibles=premierVerrouilleIndex<0?defs:defs.slice(0,premierVerrouilleIndex+1);
            return '<div style="display:grid;gap:10px;margin-top:10px">'+defsVisibles.map(function(def){
              const pair=pairs[def.id]||{};
              const mainOk=boss>=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0);
              if(!mainOk){
                return '<div class="soreal-idle-section-v8" style="margin:0;opacity:.55"><div style="display:flex;justify-content:space-between;gap:8px"><b>🔒 ???????</b></div><div style="font-size:14px;color:#aeb5c8;margin-top:4px">Augment verrouillé.</div></div>';
              }
              const upgradeOk=boss>=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.upgrade&&def.upgrade.unlockBoss||999999);
              /* "Boss N" n'est jamais un spoil ICI : l'augment est déjà débloqué, c'est un rappel historique, pas une condition à venir. Idem pour "Upgrade N" une fois l'upgrade lui-même débloqué. */
              return '<div class="soreal-idle-section-v8 aug-paire-v2" data-icone="'+(IDLE_ICONES_AUGMENTS_V1[def.id]||'')+'" style="margin:0;--ac:'+COULEURS_RANG_AUGMENTS_V1[rangAugment(def)]+'"><div class="aug-carte-tete"><b class="aug-nom">'+(IDLE_ICONES_AUGMENTS_V1[def.id]?'<i class="aug-icone">'+IDLE_ICONES_AUGMENTS_V1[def.id]+'</i>':'')+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(IDLE_NOMS_AUGMENTS_V1[def.id]||def.name||def.id)+'</b><span class="aug-pastilles"><em>Boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0)+'</em>'+(upgradeOk?'<em>Upgrade '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.upgrade.unlockBoss||0)+'</em>':'')+'</span></div>'+'<div class="aug-pistes-v2">'+track(def,pair,false,mainOk)+(def.upgrade?(upgradeOk?track(def,pair,true,true):'<div style="margin-top:8px;opacity:.55;font-size:14px;color:#aeb5c8">🔒 Upgrade verrouillé.</div>'):'')+'</div></div>';
            }).join('')+'</div>';
          })();
      }

      /*
       * Broken Time Machine (2026-09-25, d'après la capture du jeu fournie par Norman) : bandeau « BROKEN TIME MACHINE », deux pistes
       * (Machine Speed en vert = Energy ; Gold Multiplier en jaune = Magic) avec barre de progression vers le niveau suivant, boutons + / −,
       * champ « Target » (niveau cible ; à l'atteinte l'allocation de la piste est retirée, 0 = aucun), ressource allouée et niveau ;
       * panneau gris des facteurs du GPS. + / − placent ou retirent la valeur du champ Input (comme Basic Training et les Augmentations) ;
       * Max place toute la ressource libre de la piste. Les facteurs viennent de j.systemes.timeMachineView (mêmes valeurs que le calcul du GPS).
       */
      /*
       * Norman (2026-09-29) : « je veux garder le visuel actuel [de Time Machine], mais je veux le
       * son lié aux plus et moins de basic training et l'animation de l'énergie allouée de basic
       * training également. » Le son (btPlus/btMinus/btCap) était déjà présent -- ce qui manquait
       * était la mise à jour OPTIMISTE locale (comme ajusterAugmentIdleV1_/ajusterBasicTrainingIdleV120_) :
       * avant ce correctif, le clic attendait la réponse serveur (actionMetaNoyauIdleV130_) avant
       * que la barre/le chiffre ne bouge, exactement le symptôme "menus plus lents que Basic
       * Training". Magie : mutée sur idleEtat.systemes.resources.magic.current (le même champ que
       * le remplissage au compte-goutte de la Beta 6.5, pour rester cohérent avec lui).
       */
      /*
       * Time Machine : recalcul local de la piste modifiée (Energy = vitesse, Magic = or). Durée du niveau = K / allocation (K : speedK /
       * goldK fournis par le serveur), progression en secondes inchangée. Les deux pistes sont d'abord avancées du temps écoulé, puis le
       * tout repart de « maintenant » ; la barre et le compte à rebours sont repeints tout de suite (patcherBarresTimeMachineIdleV1_).
       */
      function rebaserVueTimeMachineIdleV1_(vue){
        const maintenant=Date.now();
        const ecoule=Math.max(0,(maintenant-(vue.__at||maintenant))/1000);
        [['speed','speedEtaSeconds'],['gold','goldEtaSeconds']].forEach(function(c){
          const eta=vue[c[1]];
          if(eta===null||eta===undefined||!Number.isFinite(Number(eta)))return;
          const avance=Math.min(ecoule,Math.max(0,Number(eta)));
          vue[c[0]+'ProgressSeconds']=Math.max(0,Number(vue[c[0]+'ProgressSeconds'])||0)+avance;
          vue[c[1]]=Math.max(0,Number(eta)-avance);
        });
        vue.__at=maintenant;
      }

      function recalculerTimeMachineLocalIdleV1_(j,ressource,alloc){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.timeMachineView;
        if(!vue)return;
        const piste=ressource==='energy'?'speed':'gold';
        const k=H.idleNombre_(vue[piste+'K']);
        if(!(k>0))return;
        rebaserVueTimeMachineIdleV1_(vue);
        const progSec=H.idleNombre_(vue[piste+'ProgressSeconds']);
        const etaAvant=vue[piste+'EtaSeconds'];
        /* Fraction actuelle : secondes écoulées sur durée du niveau (écoulé + reste) ; sans durée (aucune ressource), la fraction du serveur. */
        const fracAvant=(etaAvant!==null&&etaAvant!==undefined&&Number.isFinite(Number(etaAvant))&&progSec+Number(etaAvant)>0)
          ?progSec/(progSec+Number(etaAvant))
          :H.idleNombre_(vue[piste+'Fraction']);
        const nouveau=recalculerPisteFractionIdleV1_(k,fracAvant,alloc);
        vue[piste+'Fill']=nouveau.progress;
        vue[piste+'Fraction']=nouveau.progress;
        vue[piste+'ProgressSeconds']=nouveau.seconds>0?nouveau.progress*nouveau.seconds:progSec;
        vue[piste+'EtaSeconds']=nouveau.seconds>0?Math.max(0,(1-nouveau.progress)*nouveau.seconds):null;
        if(typeof H.patcherBarresTimeMachineIdleV1_==='function')H.patcherBarresTimeMachineIdleV1_(j);
      }

      function ajusterTimeMachineIdleV1_(ressource,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        const current=Math.max(0,H.idleNombre_(s&&s.state&&s.state.allocation&&s.state.allocation[ressource]));
        const pas=Math.max(1,Math.floor(Number((document.getElementById('sorealIdleTmInputV1')||{}).value)||montantAugmentIdleV1));
        if(Number.isFinite(pas)&&pas>=1){montantAugmentIdleV1=pas;memoriserMontantMenuIdleV1_();}
        /*
         * Norman (2026-09-29) : « il me permet d'ajouter de l'énergie même si je n'en ai pas. elle
         * est ensuite retirée mais il ne doit même pas l'accepter. » Contrairement à
         * ajusterBasicTrainingIdleV120_ (soreal-idle-ui.js, Math.min(input,idleAvant)) et
         * ajusterAugmentIdleV1_, "plus" ici ajoutait tout le pas sans jamais le plafonner à la
         * ressource libre réelle -- accepté localement puis corrigé au prochain état serveur, d'où
         * l'impression d'un ajout accepté puis retiré. Même plafond que les autres écrans.
         */
        const libre=Math.max(0,H.idleNombre_(
          ressource==='energy'
            ?(j&&j.energie)
            :(j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic&&j.systemes.resources.magic.current)
        ));
        const value=mode==='plus'
          ?current+Math.min(pas,libre)
          :mode==='moins'
            ?Math.max(0,current-pas)
            /* MAX = tout ce qui est libre (comme le serveur), jamais le plafond théorique : Norman (2026-10-02) voyait « 124K » (énergie pas encore générée) avant la vraie valeur 62,9K. */
            :mode==='zero'?0:Math.max(current,Math.min(current+libre,allocationMaxMetaIdleV48_(j,'timeMachine',ressource)));
        const delta=value-current;

        if(mode==='plus'&&delta<=0&&libre<=0&&H.messageFlottantIdleV32_){
          H.messageFlottantIdleV32_(
            ressource==='energy'
              ?'⚡ Aucune énergie Idle disponible à allouer pour le moment.'
              :'🔮 Aucune Magic disponible à allouer pour le moment.'
          );
        }

        if(delta!==0){
          if(H.jouerEffetAudioIdleV199_){
            H.jouerEffetAudioIdleV199_(
              mode==='plus'?'tmPlus':(mode==='moins'||mode==='zero')?'tmMinus':'tmCap'
            );
          }
          if(s&&s.state&&s.state.allocation)s.state.allocation[ressource]=value;
          if(ressource==='energy'){
            if(j)j.energie=Math.max(0,H.idleNombre_(j.energie)-delta);
          }else if(ressource==='magic'){
            const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
            if(ressourceMagie)ressourceMagie.current=Math.max(0,H.idleNombre_(ressourceMagie.current)-delta);
          }
          /*
           * Norman (2026-09-29, suite) : même correctif de réactivité qu'Augmentation/Blood Magic --
           * patch DOM ciblé (le chiffre alloué de CETTE piste + la barre d'Énergie/Magie principale)
           * au lieu d'un rendreIdleEtat_ complet. actionMetaNoyauIdleV130_ redessine tout dès la
           * réponse serveur de toute façon : aucune perte de cohérence, seul le clic devient instantané.
           */
          const cleAlloc=ressource==='energy'?'vitesse':'or';
          const allocSpan=document.getElementById('sorealIdleTmAllocV1_'+cleAlloc);
          if(allocSpan)allocSpan.textContent=H.formatGrandNombreIdleV70_(value);
          if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
        }

        if(delta!==0)recalculerTimeMachineLocalIdleV1_(j,ressource,value);
        envoyerAllocRapideV1_({action:'allocate',system:'timeMachine',resource:ressource,value:value});
      }
      window.__ajusterTimeMachineIdleV1__=ajusterTimeMachineIdleV1_;
      window.__cibleTimeMachineIdleV1__=function(piste,valeur){
        const n=Math.max(0,Math.floor(Number(valeur)||0));
        envoyerAllocRapideV1_({action:'setTimeMachineTarget',track:String(piste),value:n});
      };

      /*
       * Mise à jour EN PLACE des chiffres de la page Time Machine après chaque synchro (Norman, 2026-10-03 : « vérifie que ces informations soient à jour et qu'elles se mettent à jour avec les
       * changements »). Ils n'étaient écrits qu'au dessin de la page : meilleur Or, meilleur boss, niveaux, GPS restaient figés jusqu'à un changement de menu. Un facteur qui apparaît ou disparaît
       * (passe de « sans effet » à actif) change la liste affichée : on redessine alors la page une fois.
       */
      /*
       * Barre d'Or de la machine (Norman, 2026-10-03 : « la Time Machine a une barre supplémentaire dans NGU IDLE, celle du bas de la capture : c'est elle qui tique 1 fois par seconde de base »).
       * Wiki « Broken Time Machine » : « Machine Speed: speed up how fast the bar fills » ; 1 remplissage par seconde au niveau 0, +1 par niveau jusqu'à 50 (« 1 fill per tick »). Chaque
       * remplissage rapporte « Gold per Bar Fill ». Animation purement CSS, calée sur l'heure du SERVEUR (même phase pour tout le monde, aucun saut au redessin) ; jusqu'au plafond de 50
       * remplissages par seconde (« 1 fill per tick »), la barre tique de plus en plus vite.
       */
      /*
       * Or RÉEL d'un remplissage (Norman, 2026-10-10 : « 206 M Or par seconde, 293 K à chaque remplissage, 8 remplissages par seconde : le calcul n'est pas bon »). goldPerBarFill n'est que la BASE
       * (le meilleur drop d'Or) : le multiplicateur de boss, le niveau d'Or, Counterfeit Gold, la barbe, les défis et les NGU s'y appliquent ensuite. Ce que la machine verse vraiment à chaque remplissage
       * est donc l'Or brut par seconde divisé par le nombre de remplissages par seconde (cohérent avec « Or par seconde » affiché en grand).
       */
      function orReelParRemplissageIdleV1_(vue){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const fills=Math.max(1,H.idleNombre_(vue.barFillsPerSecond)||1)*Math.max(1,H.idleNombre_(vue.machineSpeedMultiplier)||1);
        const brut=H.idleNombre_(vue.grossGps);
        return brut>0?brut/fills:H.idleNombre_(vue.goldPerBarFill);
      }

      function legendeBarreOrTimeMachineIdleV1_(vue){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const n=Math.max(1,H.idleNombre_(vue.barFillsPerSecond)||1);
        return '💰 +'+H.formatGrandNombreIdleV70_(orReelParRemplissageIdleV1_(vue))+' Or à chaque remplissage · '+(n<=1?'1 remplissage par seconde':H.formatGrandNombreIdleV70_(n)+' remplissages par seconde');
      }

      function styleBarreOrTimeMachineIdleV1_(fills){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const n=Math.max(1,Math.min(50,H.idleNombre_(fills)||1));
        const periode=1/n;
        /* Plafond à 50 tiques par seconde (Norman, 2026-10-11 : « elle ne doit être cap qu'à 50 tiques par seconde, avant ça on doit la voir tiquer de plus en plus vite » : au niveau 40 elle ne tiquait plus) : la barre tique donc jusqu'au bout, plus de bascule en « scintillement » à 16/s. */
        const maintenant=typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();
        const phase=(maintenant/1000)%periode;
        /* Norman (2026-10-13) : « à 50 niveaux par seconde, la barre doit rester pleine » : au plafond de 50 remplissages par seconde, la barre d'Or reste pleine (classe .rapide) au lieu de scintiller */
        if(n>=50)return {classe:'rapide',style:''};
        return {classe:'',style:'animation-duration:'+periode.toFixed(4)+'s;animation-delay:-'+phase.toFixed(4)+'s'};
      }

      function patcherChiffresTimeMachineIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.timeMachineView;
        if(!vue||!document.querySelector('.soreal-idle-tm-v1'))return;
        const nombre=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v));};
        const pct=function(mult){return Number(H.idleNombre_(mult)*100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %';};
        const SPEC={orReel:nombre,goldPerBarFill:nombre,barFillsPerSecond:nombre,highestBossMultiplier:nombre,goldMultiplier:nombre,machineSpeedMultiplier:nombre,grossGps:nombre,netGps:nombre,diggerDrain:nombre,
          bloodMagicMultiplier:pct,nguMultiplier:pct,challengeMultiplier:pct,beardMultiplier:pct};
        const FACULTATIFS={bloodMagicMultiplier:1,nguMultiplier:1,challengeMultiplier:1,beardMultiplier:1};
        let structure=false;
        /* Brut / net : la ligne « Mineurs d'or » n'existe que si ce système est débloqué (champ diggerDrain envoyé) ; son apparition redessine la page. */
        if((vue.diggerDrain!=null)!==Boolean(document.querySelector('[data-tm-stat="diggerDrain"]')))structure=true;
        Object.keys(SPEC).forEach(function(cle){
          if(cle==='diggerDrain'&&vue.diggerDrain==null)return;
          const el=document.querySelector('[data-tm-stat="'+cle+'"]');
          const actif=!FACULTATIFS[cle]||Math.abs(H.idleNombre_(vue[cle])-1)>=1e-9;
          if(FACULTATIFS[cle]&&actif!==Boolean(el)){structure=true;return;}
          if(!el)return;
          const texte=SPEC[cle](vue[cle]);
          if(el.textContent!==texte)el.textContent=texte;
        });
        /* Bandeau d'identité : gain d'Or par seconde en grand, mis à jour avec chaque synchro. */
        document.querySelectorAll('[data-tm-hero]').forEach(function(el){
          const cle=el.getAttribute('data-tm-hero');
          if(!SPEC[cle])return;
          const texte=SPEC[cle](cle==='orReel'?orReelParRemplissageIdleV1_(vue):vue[cle]);
          if(el.textContent!==texte)el.textContent=texte;
        });
        const barreOr=document.querySelector('[data-tm-or-remplissage]');
        if(barreOr){
          const b=styleBarreOrTimeMachineIdleV1_(vue.barFillsPerSecond);
          const cle=String(H.idleNombre_(vue.barFillsPerSecond));
          if(barreOr.getAttribute('data-fills')!==cle){
            barreOr.setAttribute('data-fills',cle);
            barreOr.className='soreal-idle-tm-or-remplissage-v1'+(b.classe?' '+b.classe:'');
            barreOr.setAttribute('style',b.style);
          }
          const leg=document.querySelector('[data-tm-or-legende]');
          if(leg){const t=legendeBarreOrTimeMachineIdleV1_(vue);if(leg.textContent!==t)leg.textContent=t;}
        }
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        const data=(s&&s.state&&s.state.data)||{};
        [['vitesse',data.speedLevel],['or',data.goldLevel]].forEach(function(x){
          const el=document.querySelector('[data-tm-niveau="'+x[0]+'"]');
          if(!el)return;
          const texte=nombre(x[1]||0);
          if(el.textContent!==texte)el.textContent=texte;
        });
        /* La grande machine (modules/machine-dessin-v1.js) : rythme, aiguille, lueur, butin et mob du meilleur butin. */
        try{const D=window.__SOREAL_IDLE_TM_DESSIN_V1__;if(D)D.maj(vue);}catch(_e){}
        if(structure&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();
      }
      window.__patcherChiffresTimeMachineIdleV1__=patcherChiffresTimeMachineIdleV1_;

      function pageTimeMachineIdleV48_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const data=s.state.data||{};
        const vue=(j&&j.systemes&&j.systemes.timeMachineView)||{};
        /* Repère de temps de la vue serveur : sert au recalcul local de la progression au clic (rebaserVueTimeMachineIdleV1_). */
        if(vue&&!vue.__at)vue.__at=Date.now();
        const magic=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const magicOk=Boolean(magic&&magic.state&&magic.state.unlocked);
        const nombre=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v));};
        const pct=function(mult){return Number(H.idleNombre_(mult)*100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %';};
        const alloue=function(r){return Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation[r]));};
        const formaterEta=function(secondes){
          const total=Math.max(0,Math.ceil(H.idleNombre_(secondes)));
          if(total<=0)return '0 s';
          const h=Math.floor(total/3600);
          const m=Math.floor((total%3600)/60);
          const s=total%60;
          if(h>0)return h+' h '+String(m).padStart(2,'0')+' min '+String(s).padStart(2,'0')+' s';
          if(m>0)return m+' min '+String(s).padStart(2,'0')+' s';
          return s+' s';
        };
        /*
         * Sous-titre de chaque piste (Norman, 2026-09-29 : « savoir à quoi sert chaque chose ») : la ressource
         * qu'elle consomme et ce qu'elle apporte, d'après la page wiki « Broken Time Machine » (consultée le
         * 2026-09-29) -- Machine Speed : Energy + Or, barre plus rapide jusqu'au niveau 50 puis multiplicateur d'Or
         * par niveau ; Gold Multiplier : Magic + Or, simple multiplicateur d'Or.
         */
        const SOUS_TITRES_PISTE={
          vitesse:'Vitesse de la machine (Energy + Or) : accélère la barre jusqu’au niveau 50, puis chaque niveau multiplie l’Or produit',
          or:'Multiplicateur d’or (Magic + Or) : multiplie l’Or produit par la machine'
        };
        /*
         * Les deux barres que le joueur alimente sont maintenant les deux TOURS de la grande machine (Norman, 2026-10-20 ; modules/machine-dessin-v1.js, soreal-idle-machine.css) : l'Énergie sur la tour de gauche (vitesse, jusqu'à 50 tiques par seconde),
         * la Magie sur la tour de droite (multiplicateur d'Or). Mêmes données, mêmes boutons, mêmes champs qu'avant ; deux écrans à cristaux liquides par tour (niveau, temps restant), un tube de verre qui se remplit avec la barre.
         * Les éléments lus par le code en direct (ui-machine-temporelle-v1.js) gardent leurs attributs : data-tm-fill0, data-tm-eta-track, data-tm-eta-seconds, data-tm-niveau, #sorealIdleTmAllocV1_<piste>.
         */
        const tour=function(cle,titre,ressource,libelleAlloc,niveau,fill,cible,verrou,etaSecondes){
          const largeur=Math.max(0,Math.min(100,H.idleNombre_(fill)*100));
          const etaValide=Number.isFinite(Number(etaSecondes));
          const gauche=cle==='vitesse';
          const D=window.__SOREAL_IDLE_TM_DESSIN_V1__;
          const icone=gauche
            ?'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M19 2 7 18h8l-2 12 12-17h-8z" fill="#7dff9f" stroke="#150c06" stroke-width="2.4" stroke-linejoin="round"/></svg>'
            :'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 19.5 12.5 30 16 19.5 19.5 16 30 12.5 19.5 2 16 12.5 12.5Z" fill="#9fd2ff" stroke="#150c06" stroke-width="2.2" stroke-linejoin="round"/></svg>';
          let bulles='';
          for(let i=0;i<5;i+=1)bulles+='<i class="tmm-bulle" style="--x:'+((i*37+(gauche?0:11))%18)+'px;--d:-'+(i*0.8).toFixed(1)+'s;animation-duration:'+(3.6+i*0.5).toFixed(1)+'s"></i>';
          const tube='<div class="tmm-tube"><div class="tmm-liq"></div>'+bulles+'</div>';
          const lcds='<div class="tmm-lcds">'+
            '<div class="tmm-lcd"><i class="tmm-lcd-titre">NIVEAU</i><div class="tmm-lcd-val" data-tm-niveau="'+cle+'">'+nombre(niveau)+'</div></div>'+
            '<div class="tmm-lcd"><i class="tmm-lcd-titre">TEMPS RESTANT</i><div class="tmm-lcd-val" data-tm-lcd-eta="'+cle+'">'+(etaValide?formaterEta(etaSecondes):'—')+'</div>'+
              '<div class="tmm-barre"><div class="tmm-rempl" data-tm-fill0="'+(largeur/100).toFixed(6)+'" style="width:'+largeur.toFixed(2)+'%"></div></div>'+
              '<div class="tmm-eta" data-tm-eta-track="'+cle+'" data-tm-eta-seconds="'+(etaValide?Math.max(0,H.idleNombre_(etaSecondes)):'')+'">'+
                (etaValide?'Fin de la barre dans '+formaterEta(etaSecondes):'Alloue une ressource pour démarrer la barre')+
              '</div>'+
            '</div>'+
            '<div class="tmm-boutons">'+
              '<button type="button" title="Placer la valeur de Input" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'plus\')">+</button>'+
              '<button type="button" title="Retirer la valeur de Input" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'moins\')">−</button>'+
              '<button type="button" class="max" title="Placer toute la ressource libre" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'max\')">Max</button>'+
              '<button type="button" title="Retirer toute l’énergie de cette barre" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'zero\')">0</button>'+
            '</div>'+
            '<div class="tmm-ligne">'+
              '<div class="tmm-case"><i class="tmm-case-titre">Cible</i><input type="number" inputmode="numeric" min="0" step="1" value="'+H.idleEntier_(cible)+'" title="Niveau cible : l\'allocation est retirée dès qu\'il est atteint (0 = aucune cible)" onchange="window.__cibleTimeMachineIdleV1__(\''+(gauche?'speed':'gold')+'\',this.value)"></div>'+
              '<div class="tmm-case"><i class="tmm-case-titre" title="'+H.idleHtml_(libelleAlloc)+'">Allouée</i><output class="tmm-case-val" id="sorealIdleTmAllocV1_'+cle+'" data-idle-alloc-pop-v1>'+nombre(alloue(ressource))+'</output></div>'+
            '</div>'+
          '</div>';
          return '<section class="tmm-tour '+(gauche?'tmm-gauche':'tmm-droite')+' tmm-piste '+cle+'" style="--fill:'+largeur.toFixed(2)+'%" aria-label="'+H.idleHtml_(titre)+'">'+
            '<div class="tmm-tete">'+icone+(gauche?'ÉNERGIE':'MAGIE')+'</div>'+
            '<div class="tmm-sous">'+H.idleHtml_(SOUS_TITRES_PISTE[cle]||'')+'</div>'+
            '<div class="tmm-haut">'+(D?(gauche?D.hautEnergie():D.hautMagie()):'')+'</div>'+
            '<div class="tmm-corps">'+(gauche?tube+lcds:lcds+tube)+'</div>'+
          '</section>';
        };
        /* La grande machine : tour de gauche (Énergie), écran du meilleur butin au centre, tour de droite (Magie, seulement une fois Blood Magic débloqué : anti-spoil, AGENTS.md règle n°2). */
        const grandeMachine=function(){
          const D=window.__SOREAL_IDLE_TM_DESSIN_V1__;
          const butin=H.idleNombre_(vue.goldPerBarFill)>0?'+'+nombre(vue.goldPerBarFill)+' Or':'';
          const multi='×'+nombre((H.idleNombre_(vue.goldMultiplier)||1)*(H.idleNombre_(vue.machineSpeedMultiplier)||1));
          const centre=D?D.centre({ticks:H.idleNombre_(vue.barFillsPerSecond)||1,mob:vue.bestGoldMob||null,butin:butin,multi:multi}):'';
          return '<div class="tmm-cadre">'+(D?D.defs():'')+'<div class="tmm-machine'+(magicOk?'':' tmm-sans-magie')+'">'+
            tour('vitesse','⏱️ Vitesse de la machine','energy','Énergie allouée',data.speedLevel||0,vue.speedFill,vue.speedTarget,false,vue.speedEtaSeconds)+
            '<section class="tmm-centre">'+centre+'</section>'+
            (magicOk?tour('or','🪙 Multiplicateur d’or','magic','Magie allouée',data.goldLevel||0,vue.goldFill,vue.goldTarget,false,vue.goldEtaSeconds):'')+
          '</div></div>';
        };
        const stat=function(libelle,valeur,cle){return '<div><span>'+H.idleHtml_(libelle)+' :</span> <b'+(cle?' data-tm-stat="'+cle+'"':'')+'>'+valeur+'</b></div>';};
        const factSansEffet=function(libelle,mult,cle){return Math.abs(H.idleNombre_(mult)-1)<1e-9?'':stat(libelle,pct(mult),cle);};
        try{if(typeof requestAnimationFrame==='function'&&window.__SOREAL_IDLE_TM_DESSIN_V1__)requestAnimationFrame(function(){window.__SOREAL_IDLE_TM_DESSIN_V1__.rafraichir();});}catch(_e){}
        return '<div class="soreal-idle-tm-v1">'+
          '<header class="soreal-idle-tm-entete-v1"><h1>Machine à remonter le temps cassée</h1><p>(Ramasse cet or encore, et encore, et encore, et...)</p></header>'+
          /*
           * Bandeau d'identité (Norman, 2026-10-04 : « retravaille le menu Machine à remonter le temps cassée pour qu'il colle plus aux autres menus ; il doit avoir sa propre identité et bien nous rappeler qu'on gagne de l'OR »).
           * Une machine de laiton qui crache des pièces : le gain d'Or par seconde en grand, la barre d'Or qui bat à chaque remplissage et ce que rapporte un remplissage.
           */
          '<section class="soreal-idle-tm-hero-v1">'+
            '<div class="soreal-idle-tm-hero-pieces-v1" aria-hidden="true"><i>🪙</i><i>🪙</i><i>🪙</i><i>🪙</i><i>🪙</i></div>'+
            '<div class="soreal-idle-tm-hero-titre-v1">💰 Ta machine fabrique de l’Or</div>'+
            '<div class="soreal-idle-tm-hero-gps-v1"><b data-tm-hero="netGps">'+nombre(vue.netGps)+'</b><span> Or par seconde</span></div>'+
            '<div class="soreal-idle-tm-hero-sous-v1">'+(vue.diggerDrain!=null?'Brut <b data-tm-hero="grossGps">'+nombre(vue.grossGps)+'</b> /s − Mineurs d’or <b data-tm-hero="diggerDrain">'+nombre(vue.diggerDrain)+'</b> /s · ':'')+'<b data-tm-hero="orReel">'+nombre(orReelParRemplissageIdleV1_(vue))+'</b> Or à chaque remplissage de barre</div>'+
            (function(){const b=styleBarreOrTimeMachineIdleV1_(vue.barFillsPerSecond);return '<div class="soreal-idle-tm-or-v1"><div class="soreal-idle-tm-or-barre-v1"><div class="soreal-idle-tm-or-remplissage-v1'+(b.classe?' '+b.classe:'')+'" data-tm-or-remplissage="1" data-fills="'+H.idleNombre_(vue.barFillsPerSecond)+'" style="'+b.style+'"></div></div><div class="soreal-idle-tm-or-legende-v1" data-tm-or-legende="1">'+H.idleHtml_(legendeBarreOrTimeMachineIdleV1_(vue))+'</div></div>';})()+
          '</section>'+
          carteAideMenuIdleV1_('timeMachine','La Time Machine produit de l’Or toute seule (le GPS, Gold par seconde) en rejouant le meilleur drop d’Or que tu as obtenu en Adventure.',[
            'Vitesse de la machine (Energy + Or) : elle accélère la barre. Jusqu’au niveau 50 chaque niveau la remplit plus vite ; au-delà, chaque niveau ajoute un multiplicateur d’Or.'
          ].concat(magicOk?['Multiplicateur d’or (Magic + Or) : il multiplie simplement l’Or produit.']:[]).concat([
            'Ton meilleur boss vaincu multiplie aussi l’Or produit.',
            'Le niveau N coûte N fois le prix du niveau 1, en Or et dans la ressource allouée.',
            'Les niveaux sont remis à zéro à chaque Rebirth.'
          ]))+
          '<div class="soreal-idle-bt-toolbar-v120">'+'<div class="soreal-idle-tm-input-v1 soreal-idle-bt-input-box-v120"><label for="sorealIdleTmInputV1">🎚️ Input</label><input id="sorealIdleTmInputV1" type="text" inputmode="decimal" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" value="'+montantAugmentIdleV1+'" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"><span><b>Input</b> = quantité déplacée à chaque clic sur <b>+</b> (placer) ou <b>−</b> (retirer) ; <b>Max</b> place tout ce qui est libre. <b>Cible</b> = niveau visé : l’allocation est retirée dès qu’il est atteint (0 = pas de cible).</span></div>'+(window.__SOREAL_IDLE_ALLOC_V1__?window.__SOREAL_IDLE_ALLOC_V1__.cadres('energy','timeMachine')+(magicOk?window.__SOREAL_IDLE_ALLOC_V1__.cadres('magic','timeMachine'):''):'')+'</div>'+
          /* Anti-spoil (AGENTS.md règle n°2) : tant que Blood Magic n'est pas débloqué, la tour Magie n'apparaît pas du tout (avant : « 🔒 Magic se débloque avec Blood Magic au boss 37 »). */
          grandeMachine()+
          '<section class="soreal-idle-tm-stats-v1">'+
            '<div class="soreal-idle-tm-stats-titre-v1">🧮 Comment ton GPS est calculé</div>'+
            '<div class="soreal-idle-tm-stats-grille-v1">'+
              '<div>'+
                stat('🪙 Or de base par remplissage (avant multiplicateurs)',nombre(vue.goldPerBarFill),'goldPerBarFill')+
                stat('🔁 Remplissages de barre par seconde',nombre(vue.barFillsPerSecond),'barFillsPerSecond')+
                /* Anti-spoil : un facteur encore à 100 % (sans effet) n'est pas listé -- jamais le nom d'un système que le joueur n'a pas encore fait jouer. */
                factSansEffet('Bonus GPS Blood Magic',vue.bloodMagicMultiplier,'bloodMagicMultiplier')+
                factSansEffet('Multiplicateur GPS NGU',vue.nguMultiplier,'nguMultiplier')+
                factSansEffet('Multiplicateur des défis',vue.challengeMultiplier,'challengeMultiplier')+
              '</div>'+
              '<div>'+
                stat('👹 Multiplicateur du meilleur boss',nombre(vue.highestBossMultiplier),'highestBossMultiplier')+
                stat('🪙 Multiplicateur d’or',nombre(vue.goldMultiplier),'goldMultiplier')+
                stat('⏱️ Multiplicateur GPS de la vitesse',nombre(vue.machineSpeedMultiplier),'machineSpeedMultiplier')+
                factSansEffet('Multiplicateur GPS de la Barbe',vue.beardMultiplier,'beardMultiplier')+
              '</div>'+
            '</div>'+
            (vue.diggerDrain!=null
              ?'<div class="soreal-idle-tm-gps-v1"><div>💰 GPS brut : <b data-tm-stat="grossGps">'+nombre(vue.grossGps)+'</b> <small>(ce que la machine fabrique)</small></div><div>⛏️ − Mineurs d’or : <b data-tm-stat="diggerDrain">'+nombre(vue.diggerDrain)+'</b> <small>(l’Or que tes Mineurs actifs dépensent chaque seconde ; 0 si aucun n’est actif)</small></div><div>💎 GPS net : <b data-tm-stat="netGps">'+nombre(vue.netGps)+'</b> <small>(ce qui entre vraiment dans ta bourse)</small></div></div>'
              :'<div class="soreal-idle-tm-gps-v1"><div>💎 GPS : <b data-tm-stat="netGps">'+nombre(vue.netGps)+'</b></div></div>')+
          '</section>'+
        '</div>';
      }

      /*
       * Le mot qui suit un gain d'or (Norman, 2026-10-07 : « de plus en plus content quand la somme monte : Bah..., Ça se prend, Chouette, Cool, Pas mal, Wow, OH BORDEL, WHOUHOU, etc. »).
       * Paliers sur la somme gagnée ; au-delà du dernier, la joie reste au maximum.
       */
      const PALIERS_OR_EXCLAMATION_V1=[
        [10,'Bah…'],[100,'Ça se prend.'],[1e3,'Chouette !'],[1e4,'Cool !'],[1e5,'Pas mal !'],[1e6,'Wow !'],[1e8,'OH BORDEL !'],[1e10,'WHOUHOU !'],
        [1e13,'INCROYABLE !'],[1e16,'C’EST LA FÊTE !'],[1e20,'ON EST RICHES !!']
      ];

      function exclamationOrIdleV1_(somme){
        const n=Math.max(0,Number(somme)||0);
        for(let i=0;i<PALIERS_OR_EXCLAMATION_V1.length;i+=1){
          if(n<PALIERS_OR_EXCLAMATION_V1[i][0])return PALIERS_OR_EXCLAMATION_V1[i][1];
        }
        return 'LÉGENDAIRE !!!';
      }

      /*
       * Blood Magic : la page, les boutons et les calculs locaux vivent dans modules/blood-magic-v1.js (extrait le 2026-10-07, lot 2b du chantier de nettoyage, code déplacé sans changement).
       * Ce fichier ne garde que le branchement : les aides qu'il partage avec Augmentations et Time Machine sont prêtées au module.
       */
      const sangIdleV1=window.__SOREAL_IDLE_BLOOD_V1__?window.__SOREAL_IDLE_BLOOD_V1__.creer({
        systemeMeta:function(j,id){return systemeMetaParIdIdleV130_(j,id);},
        envoyerAllocRapide:function(payload,delai){return envoyerAllocRapideV1_(payload,delai);},
        recalculerPisteFraction:function(k,fraction,alloc){return recalculerPisteFractionIdleV1_(k,fraction,alloc);},
        ancreSnapshot:function(j){return ancreSnapshotIdleV1_(j);},
        formatDuree:function(secondes){return formatDureeAugmentIdleV1_(secondes);},
        carteAide:function(cle,resume,etapes){return carteAideMenuIdleV1_(cle,resume,etapes);},
        legendeAllocation:function(ressource,libre,croix){return legendeAllocationIdleV1_(ressource,libre,croix);},
        emojiNom:function(famille,id,nom){return emojiNomIdleV1_(famille,id,nom);},
        montant:function(){return montantAugmentIdleV1;},
        fixerMontant:function(v){montantAugmentIdleV1=v;memoriserMontantMenuIdleV1_();}
      }):null;

      function pageBloodMagicIdleV48_(j){return sangIdleV1?sangIdleV1.page(j):'';}

      function recalculerBloodLocalIdleV1_(j,ritualId,alloc,sansRedessin){return sangIdleV1?sangIdleV1.recalculerLocal(j,ritualId,alloc,sansRedessin):undefined;}

      /* Dessins (émojis) pour que les menus parlent d'eux-mêmes (Norman, 2026-10-01). */
      /* Emoji + nom (modules/icones-v1.js) : « 🔥 Bonus offensif ». Sans le module, le nom seul. */
      function emojiNomIdleV1_(famille,id,nom){
        const I=window.__SOREAL_IDLE_ICONES_V1__;
        return I&&typeof I.avec==='function'?I.avec(famille,id,nom):String(nom==null?'':nom);
      }

      /* Noms français des Augments (Norman, 2026-10-02 : « traduis le menu Augmentation, les titres des barres : Safety Scissors… ») ; le moteur garde les noms du wiki. */
      const IDLE_NOMS_AUGMENTS_V1={
        scissors:'Ciseaux de sécurité',
        milk:'Infusion de lait',
        cannon:'Implant de canon',
        minigun:'Minigun monté sur l’épaule',
        buster:'Buster d’énergie',
        exoskeleton:'Exosquelette avancé',
        laserSword:'Sabre laser'
      };

      /* Noms français des Upgrades d'Augments (wiki NGU Idle, page « Augmentations » : une Upgrade par Augment, dans le même ordre). */
      const IDLE_NOMS_UPGRADES_AUGMENTS_V1={
        dangerScissors:'Ciseaux dangereux',
        drinkMilk:'Boire aussi le lait',
        missileLauncher:'Lance-missiles',
        actualAmmo:'Vraies munitions',
        chargeShot:'Tir chargé',
        energyShield:'Bouclier d’énergie',
        quadLaser:'Sabre laser à quatre côtés'
      };

      /* Icônes des secondes pistes (Upgrades), une par Augment (Norman, 2026-10-10 : « des icônes pour les seconds menus »). */
      const IDLE_ICONES_UPGRADES_AUGMENTS_V1={dangerScissors:'🔪',drinkMilk:'🍼',missileLauncher:'🚀',actualAmmo:'🎯',chargeShot:'🔋',energyShield:'🛡️',quadLaser:'💠'};

      /* Couleur de chaque paire, du premier Augment (froid) au dernier (brûlant) : la montée en puissance se lit d'un coup d'œil. */
      const COULEURS_RANG_AUGMENTS_V1=['#6aa9ff','#3fd6c8','#6bdc5a','#ffd24a','#ff8a3d','#ff4d6d'];

      const IDLE_ICONES_AUGMENTS_V1={scissors:'✂️',milk:'🥛',cannon:'💥',minigun:'🔫',buster:'⚡',exoskeleton:'🦾',laserSword:'🗡️',insideOut:'🌀'};







      /*
       * Advanced Training (Norman, 2026-10-02 : « l'interface n'est pas bonne du tout, ce sont des barres qui avancent » -- capture du jeu d'origine :
       * une ligne par compétence avec Name / Level / Energy Allocated / Target et les boutons + et −, au-dessus la barre d'outils Input + Cap/Idle).
       * Chaque compétence a sa propre énergie (allocateAdvancedTraining) ; le Target retire l'énergie dès que le niveau voulu est atteint.
       */
      const IDLE_AT_NOMS_V1={
        power:'Puissance d’Aventure +',
        toughness:'Endurance d’Aventure +',
        block:'Réduction de dégâts du Blocage',
        wandoosEnergy:'Vidage d’énergie de Wandoos +',
        wandoosMagic:'Vidage de magie de Wandoos +'
      };

      const IDLE_AT_ORDRE_V1=['toughness','power','block','wandoosEnergy','wandoosMagic'];

      const IDLE_AT_ICONES_V1={toughness:'🛡️',power:'⚔️',block:'🧱',wandoosEnergy:'💻',wandoosMagic:'🔮'};

      function atEnergieDePisteIdleV1_(s,id){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const pistes=(s&&s.state&&s.state.data&&s.state.data.tracks)||{};
        const parPiste=Object.keys(pistes).reduce(function(somme,k){return somme+Math.max(0,H.idleNombre_(pistes[k]&&pistes[k].energy));},0);
        if(parPiste>0)return Math.max(0,H.idleNombre_(pistes[id]&&pistes[id].energy));
        /* Ancien contrat : allocation unique rattachée à la piste active. */
        const active=(s&&s.state&&s.state.data&&s.state.data.activeTrack)||'';
        return active===id?Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.energy)):0;
      }

      /* Repère d'une compétence (niveau temporaire, base, part du niveau suivant, instant du dernier état serveur, énergie, taux, gratuité, Target) : sert au dessin ET à la mise à jour sur place. */
      function atAncrageValeursIdleV1_(st,infoAt,vueAt,ancreAt,energie){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        return {
          n:Math.max(0,Math.floor(H.idleNombre_(st.tempLevel))),
          base:Math.max(0,Math.floor(H.idleNombre_(st.level)+H.idleNombre_(st.permanentLevel))),
          p:Math.max(0,Math.min(.999999,H.idleNombre_(st.progress))),
          t:ancreAt,
          a:energie,
          taux:H.idleNombre_(infoAt&&infoAt.rateParEnergie),
          gratuit:vueAt&&vueAt.gratuit?1:0,
          cible:H.idleEntier_(st.target)
        };
      }

      /*
       * Met à jour sur place les lignes de l'Entraînement avancé depuis l'état serveur déjà adopté (j) : énergie placée, Target, repère de la barre. Aucun nœud n'est recréé ; un champ en cours de saisie n'est pas touché.
       */
      function patcherAdvancedTrainingIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        const pistes=(s&&s.state&&s.state.data&&s.state.data.tracks)||{};
        const vueAt=(j&&j.systemes&&j.systemes.advancedTrainingView)||null;
        const ancreAt=ancreSnapshotIdleV1_(j);
        const lignes=document.querySelectorAll('.soreal-idle-at-ligne-v1[data-at-piste]');
        for(let i=0;i<lignes.length;i+=1){
          const el=lignes[i],id=el.getAttribute('data-at-piste'),st=pistes[id];
          if(!st)continue;
          const energie=atEnergieDePisteIdleV1_(s,id);
          const infoAt=(vueAt&&vueAt.pistes&&vueAt.pistes[id])||{};
          const av=atAncrageValeursIdleV1_(st,infoAt,vueAt,ancreAt,energie);
          const d=el.dataset;
          d.atN=String(av.n);d.atBase=String(av.base);d.atP=String(av.p);d.atT=String(av.t);d.atA=String(av.a);d.atTaux=String(av.taux);d.atGratuit=String(av.gratuit);d.atCible=String(av.cible);
          const alloc=document.getElementById('sorealIdleAtAlloc_'+id);
          const texte=H.formatGrandNombreIdleV70_(energie);
          if(alloc&&alloc.textContent!==texte)alloc.textContent=texte;
          const champ=el.querySelector('input[type="number"]');
          if(champ&&document.activeElement!==champ&&String(champ.value)!==String(av.cible))champ.value=String(av.cible);
        }
        const avance=document.querySelector('.soreal-idle-at-avance-v1 input');
        if(avance&&document.activeElement!==avance)avance.checked=Boolean(s&&s.state&&s.state.data&&s.state.data.advanceEnergy);
        const libre=document.getElementById('sorealIdleAugEnergieLibreV1');
        if(libre)libre.textContent=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(j&&j.energie)));
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
        if(typeof atTickIdleV1_==='function')atTickIdleV1_();
      }

      function pageAdvancedTrainingIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const wandoos=systemeMetaParIdIdleV130_(j,'wandoos');
        const wandoosOk=Boolean(wandoos&&wandoos.state&&wandoos.state.unlocked);
        const pistes=(s.state.data&&s.state.data.tracks)||{};
        const ids=IDLE_AT_ORDRE_V1.filter(function(id){
          if(!pistes[id])return false;
          /* Anti-spoil (règle n°2) : rien sur Wandoos tant qu'il n'est pas débloqué. */
          return wandoosOk||!(id==='wandoosEnergy'||id==='wandoosMagic');
        });
        const nombre=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v));};
        const libre=Math.max(0,H.idleNombre_(j&&j.energie));
        const vueAt=(j&&j.systemes&&j.systemes.advancedTrainingView)||null;
        const ancreAt=ancreSnapshotIdleV1_(j);
        /* Secret « Clicked the bottom right corner of the Advanced Training menu » (Norman, 2026-10-16) : un petit caca dans le coin en bas à droite de la dernière ligne ; il disparaît une fois le succès obtenu. */
        const cacaCoinHtml_=function(jeu){
          const liste=(jeu&&jeu.systemes&&jeu.systemes.achievements&&jeu.systemes.achievements.list)||[];
          if(liste.some(function(x){return x&&x.id==='secretAtCorner'&&x.unlocked;}))return '';
          return '<button type="button" class="soreal-idle-at-caca-v1" data-morph-classes-gardees="^parti$" aria-label="Caca" onclick="window.__cacaCoinIdleV1__(this)">💩</button>';
        };
        const ligne=function(id){
          const st=pistes[id]||{};
          const infoAt=(vueAt&&vueAt.pistes&&vueAt.pistes[id])||{};
          const niveau=Math.floor(H.idleNombre_(st.level)+H.idleNombre_(st.tempLevel)+H.idleNombre_(st.permanentLevel));
          const energie=atEnergieDePisteIdleV1_(s,id);
          const idH=H.idleHtml_(id);
          /* Barre de progression de la compétence (Norman, 2026-10-03) : repère du dernier état serveur (niveau temporaire, part du niveau suivant, énergie, taux), rejoué en direct par le minuteur ci-dessous. */
          const av=atAncrageValeursIdleV1_(st,infoAt,vueAt,ancreAt,energie);
          const ancrage='data-at-n="'+av.n+'" data-at-base="'+av.base+'" data-at-p="'+av.p+'" data-at-t="'+av.t+'" data-at-a="'+av.a+'" data-at-taux="'+av.taux+'" data-at-gratuit="'+av.gratuit+'" data-at-cible="'+av.cible+'"';
          return '<div class="soreal-idle-at-ligne-v1" data-at-piste="'+idH+'" '+ancrage+'>'+
            '<div class="soreal-idle-at-nom-v1"><div class="soreal-idle-at-barre-v1"><i class="soreal-idle-at-remplissage-v1" data-at-fill></i><span class="soreal-idle-at-titre-v1">'+(IDLE_AT_ICONES_V1[id]?IDLE_AT_ICONES_V1[id]+' ':'')+H.idleHtml_(IDLE_AT_NOMS_V1[id]||id)+'</span></div><div class="soreal-idle-at-detail-v1"><span data-at-bonus></span><span data-at-eta></span></div></div>'+
            '<div class="soreal-idle-at-col-v1"><span>Niveau</span><b id="sorealIdleAtNiveau_'+idH+'">'+nombre(niveau)+'</b></div>'+
            '<div class="soreal-idle-at-col-v1"><span>Énergie placée</span><b id="sorealIdleAtAlloc_'+idH+'" data-idle-alloc-pop-v1>'+nombre(energie)+'</b></div>'+
            '<label class="soreal-idle-at-col-v1 cible"><span>Cible</span><input type="number" inputmode="numeric" min="0" step="1" value="'+H.idleEntier_(st.target)+'" title="Niveau cible : l’énergie de la compétence est retirée dès qu’il est atteint (0 = aucun)" onchange="window.__cibleAdvancedTrainingIdleV1__(\''+idH+'\',this.value)"></label>'+
            '<div class="soreal-idle-at-boutons-v1">'+
              '<button type="button" title="Placer la valeur de Input" onclick="window.__ajusterAdvancedTrainingIdleV1__(\''+idH+'\',\'plus\')">+</button>'+
              '<button type="button" title="Retirer la valeur de Input" onclick="window.__ajusterAdvancedTrainingIdleV1__(\''+idH+'\',\'moins\')">−</button>'+
              '<button type="button" title="Retirer toute l’énergie de cette barre" onclick="window.__ajusterAdvancedTrainingIdleV1__(\''+idH+'\',\'zero\')">0</button>'+
            '</div>'+
            (id==='wandoosMagic'?cacaCoinHtml_(j):'')+
          '</div>';
        };
        const toolbar='<div class="soreal-idle-bt-toolbar-v120"><div class="soreal-idle-bt-input-box-v120"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" inputmode="decimal" value="'+montantAugmentIdleV1+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"></div>'+
          '<div class="soreal-idle-bt-info-v1">Énergie libre : <b id="sorealIdleAugEnergieLibreV1">'+nombre(libre)+'</b> ⚡</div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>⚡ Plafond d’énergie</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.25)">1/4</button></div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderAdvancedTrainingIdleV1__()">Tout retirer</button></div>'+(window.__SOREAL_IDLE_ALLOC_V1__?window.__SOREAL_IDLE_ALLOC_V1__.compteur('energy','advancedTraining'):'')+'</div>';
        return '<style>'+
          '.soreal-idle-at-v1{display:grid;gap:10px}'+
          '.soreal-idle-at-haut-v1{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}'+
          '.soreal-idle-at-aide-bouton-v1{min-height:44px;padding:6px 14px;border-radius:10px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:inherit;font:inherit;font-weight:900;cursor:pointer}'+
          '.soreal-idle-at-avance-v1{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;cursor:pointer}'+
          '.soreal-idle-at-avance-v1 input{width:22px;height:22px}'+
          '.soreal-idle-at-aide-v1{padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.25);background:rgba(0,0,0,.28);font-size:15px;line-height:1.55}'+
          '.soreal-idle-at-aide-v1[hidden]{display:none}'+
          '.soreal-idle-at-aide-v1 p{margin:0 0 8px}.soreal-idle-at-aide-v1 ol{margin:0;padding-left:20px;display:grid;gap:6px}'+
          /* Titre de la page (Norman, 2026-10-08) : dégradé violet-rose-bleu comme les barres, halo, filet orné ; une div (le thème du jeu pose contour et ombre noirs sur les h1). */
          '.soreal-idle-at-entete-v1{text-align:center;padding:10px 0 6px}'+
          '.soreal-idle-at-titre-page-v1{display:inline-block;max-width:100%;margin:0;font:900 clamp(26px,8vw,42px)/1.1 "Segoe UI Black","Segoe UI",system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;background:linear-gradient(90deg,#f0abfc,#c4b5fd 45%,#7dd3fc);-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important;text-shadow:none!important;filter:drop-shadow(0 0 12px rgba(192,38,211,.65))}'+
          '.soreal-idle-at-ornement-v1{display:flex;align-items:center;justify-content:center;gap:10px;margin:6px auto 4px;max-width:360px}'+
          '.soreal-idle-at-ornement-v1 i{flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#c026d3 60%,#f0abfc)}'+
          '.soreal-idle-at-ornement-v1 i:last-child{background:linear-gradient(270deg,transparent,#c026d3 60%,#7dd3fc)}'+
          '.soreal-idle-at-ornement-v1 b{font-size:15px;color:#f5d0fe;text-shadow:0 0 10px #c026d3}'+
          '.soreal-idle-at-entete-v1 p{margin:2px 0 0;font-size:14px;font-weight:700;font-style:italic;letter-spacing:.04em;color:#e9d5ff;opacity:.9}'+
          '.soreal-idle-at-liste-v1{display:grid;gap:9px}'+
          '.soreal-idle-at-ligne-v1{position:relative;display:grid;grid-template-columns:minmax(150px,1.6fr) repeat(3,minmax(76px,1fr)) auto;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.18)}'+
          '.soreal-idle-at-nom-v1{font-weight:900;font-size:16px}'+
          '.soreal-idle-at-col-v1{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}'+
          '.soreal-idle-at-col-v1 span{font-size:12px;font-weight:800;letter-spacing:.04em;opacity:.75;text-transform:uppercase}'+
          '.soreal-idle-at-col-v1 b{font-size:18px;font-variant-numeric:tabular-nums}'+
          '.soreal-idle-at-col-v1 input{width:100%;max-width:120px;box-sizing:border-box;padding:6px 8px;border-radius:8px;border:1.5px solid rgba(255,255,255,.3);background:rgba(0,0,0,.35);color:inherit;font:inherit;font-weight:800;text-align:center}'+
          '.soreal-idle-at-boutons-v1{display:flex;gap:8px}'+
          '.soreal-idle-at-boutons-v1 button{min-width:46px;min-height:44px;border-radius:10px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:inherit;font-size:22px;font-weight:900;cursor:pointer}'+
          '.soreal-idle-at-barre-v1{position:relative;overflow:hidden;min-height:44px;border-radius:12px;border:2px solid rgba(231,198,255,.7);background:linear-gradient(180deg,rgba(60,28,92,.85),rgba(34,14,56,.92));box-shadow:inset 0 2px 6px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.4)}'+
          '.soreal-idle-at-remplissage-v1{position:absolute;inset:0;transform-origin:left center;transform:scaleX(0);background:linear-gradient(90deg,#7c3aed,#c026d3 55%,#f0abfc);box-shadow:0 0 14px rgba(192,38,211,.6);will-change:transform}'+
          '.soreal-idle-at-remplissage-v1::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.14) 0 10px,transparent 10px 22px);mix-blend-mode:overlay}'+
          '.soreal-idle-at-barre-v1.pleine .soreal-idle-at-remplissage-v1{transform:scaleX(1)!important;animation:sorealAtPulseV1 1.4s ease-in-out infinite}'+
          '@keyframes sorealAtPulseV1{50%{filter:brightness(1.25)}}'+
          '.soreal-idle-at-caca-v1{position:absolute;right:3px;bottom:1px;width:22px;height:22px;padding:0;border:0;background:none;font-size:15px;line-height:22px;cursor:pointer;transform-origin:center;opacity:.85;-webkit-tap-highlight-color:transparent}'+
          '.soreal-idle-at-caca-v1.parti{pointer-events:none;opacity:0;transition:opacity .12s}'+
          '.soreal-idle-at-titre-v1{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;min-height:44px;padding:4px 10px;font-weight:900;font-size:16px;text-align:center;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.6)}'+
          '.soreal-idle-at-detail-v1{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;margin-top:4px;font-size:13px;font-weight:700;color:#e9d5ff;font-variant-numeric:tabular-nums}'+
          '@media(max-width:620px){.soreal-idle-at-ligne-v1{grid-template-columns:1fr 1fr 1fr;grid-template-areas:"nom nom nom" "niv alloc cible" "btn btn btn"}.soreal-idle-at-nom-v1{grid-column:1/-1;text-align:center}.soreal-idle-at-boutons-v1{grid-column:1/-1;justify-content:center}.soreal-idle-at-boutons-v1 button{flex:1;max-width:140px}}'+
        '</style>'+
        '<div class="soreal-idle-at-v1">'+
          '<div class="soreal-idle-at-haut-v1">'+
            '<button type="button" class="soreal-idle-at-aide-bouton-v1" onclick="window.__basculerAideAdvancedTrainingIdleV1__()">Je fais quoi ?</button>'+
            '<label class="soreal-idle-at-avance-v1"><input type="checkbox" '+(s.state.data&&s.state.data.advanceEnergy?'checked ':'')+'onchange="window.__basculerAdvanceAdvancedTrainingIdleV1__(this.checked)"> Faire suivre l’énergie</label>'+
          '</div>'+
          '<header class="soreal-idle-at-entete-v1"><div class="soreal-idle-at-titre-page-v1" role="heading" aria-level="1">Entraînement avancé</div><div class="soreal-idle-at-ornement-v1" aria-hidden="true"><i></i><b>✦</b><i></i></div><p>(C’est l’heure de muscler tes coups)</p></header>'+
          '<div class="soreal-idle-at-aide-v1" id="sorealIdleAtAideV1" hidden>'+
            '<p><b>C’est quoi ?</b> '+(wandoosOk?'L’Entraînement avancé, c’est la salle de sport de ton héros : tu y dépenses de l’énergie pour devenir plus fort en Aventure (plus de puissance, plus d’endurance, moins de dégâts quand tu bloques, et des dumps de Wandoos plus rapides).':'L’Entraînement avancé, c’est la salle de sport de ton héros : tu y dépenses de l’énergie pour devenir plus fort en Aventure (plus de puissance, plus d’endurance, moins de dégâts quand tu bloques).')+'</p>'+
            '<ol>'+
              '<li><b>Place de l’énergie.</b> Sur une compétence, avec +. La quantité placée est celle de la case Input (les boutons Max, 1/2 et 1/4 la remplissent d’un coup), et − la retire. C’est comme mettre des pièces dans une machine.</li>'+
              '<li><b>Chacun son énergie.</b> Les compétences s’entraînent en même temps, chacune avec sa propre énergie : plus tu en donnes, plus elle va vite. Mais chaque niveau demande plus de temps que le précédent, et les bonus grossissent de moins en moins : normal, les premiers muscles poussent vite.</li>'+
              '<li><b>Réservoir ou moteur ?</b> Ici, ta Puissance d’énergie compte moins que son nombre ne le laisse croire (seulement par sa racine carrée), alors que ton plafond d’énergie compte à plein. Moralité : un grand réservoir vaut mieux qu’un gros moteur.</li>'+
              '<li><b>Cible.</b> Le niveau que tu veux atteindre. Dès qu’il est atteint, l’énergie de la compétence est retirée et te revient (0 = aucun objectif). Pratique pour ne pas gaver une compétence qui a déjà fini ses pompes.</li>'+
              '<li><b>Faire suivre l’énergie.</b> Quand une compétence atteint sa cible, son énergie passe automatiquement à la ligne suivante, comme un relais.</li>'+
              '<li><b>Renaissance.</b> Les niveaux sont remis à zéro à chaque Renaissance : on refait ses abdos à chaque nouvelle vie.</li>'+
            '</ol>'+
          '</div>'+
          toolbar+
          '<div class="soreal-idle-at-liste-v1">'+ids.map(ligne).join('')+'</div>'+
        '</div>';
      }
      window.__SOREAL_IDLE_AT_PAGE_V2__=true;

      /*
       * Barres de l'Advanced Training, en direct (Norman, 2026-10-03). Mêmes formules que le moteur (advanceAdvancedTrainingV1) :
       *  - travail par seconde = énergie allouée × rateParEnergie (= √Puissance × bonus équipement / (10 000 s ou 20 000 s × 1000)) ;
       *  - passer du niveau n au suivant demande n + 1 unités de travail (coût linéaire) ; au plus 50 niveaux par seconde ; gratuit à 50 niveaux/s avec le souhait dédié ;
       *  - bonus Power/Toughness = niveau^0,4 × 10 % ; Block = (niveau + 50) / (niveau + 100) ; Wandoos = +1 % de vitesse du dump par niveau.
       * Le Target (niveau voulu) arrête la barre, comme le serveur retire l'énergie à ce moment.
       */
      function atNiveauxDepuisTravailIdleV1_(niveau,travail){
        const L=Math.max(0,Math.floor(niveau)),W=Math.max(0,travail);
        const a=2*L+1;
        let k=Math.floor((2*W)/(a+Math.sqrt(a*a+8*W)));
        const total=function(n){return n*(2*L+n+1)/2;};
        while(k>0&&total(k)>W)k-=1;
        while(total(k+1)<=W)k+=1;
        return {gagnes:k,reste:Math.max(0,W-total(k))};
      }

      function atSimulerIdleV1_(n0,p0,dt,alloc,taux,gratuit,cible){
        let n=n0,p=p0;
        if(gratuit){
          const gagnes=Math.floor(p0+50*dt);
          n=n0+gagnes;p=(p0+50*dt)-gagnes;
        }else if(alloc>0&&taux>0&&dt>0){
          const travail=p0*(n0+1)+alloc*taux*dt;
          const pas=atNiveauxDepuisTravailIdleV1_(n0,travail);
          const gagnes=Math.min(pas.gagnes,Math.floor(50*dt)+1);
          n=n0+gagnes;
          p=gagnes<pas.gagnes?0:Math.min(.999999,pas.reste/(n+1));
        }
        if(cible>0&&n>=cible){n=Math.max(n0,cible);p=0;}
        return {n:n,p:p};
      }

      function atBonusTexteIdleV1_(id,niveau){
        const fr=function(v,d){return v.toLocaleString('fr-FR',{maximumFractionDigits:d});};
        if(id==='power'||id==='toughness')return 'Bonus : +'+fr(Math.pow(Math.max(0,niveau),0.4)*10,2)+' %';
        if(id==='block')return 'Réduction : '+fr((niveau+50)/(niveau+100)*100,2)+' %';
        return 'Vitesse du dump : +'+fr(niveau,0)+' %';
      }

      /* Remplissage des barres à chaque image : même simulation que le tick (niveau, part de niveau), recalculée à partir des repères de la ligne ; ne touche que transform (aucune repeinte de mise en page). S'arrête quand plus aucune barre n'est à l'écran. */
      let atImagesActifIdleV1_=false;

      /*
       * Audit du 2026-10-10 (IDLE-AUDIT-FE-008) : cette boucle tourne à chaque image ; elle ne cherche plus ses éléments dans le document à chaque image. La liste des lignes (et la barre / le remplissage de chacune) est gardée en
       * mémoire et n'est reconstruite que si une ligne a quitté la page ou toutes les 30 images ; rien n'est dessiné quand l'onglet est caché.
       */
      let atCacheLignesIdleV1=null;

      let atImagesCompteurIdleV1=0;

      function atImagesIdleV1_(){
        if(document.hidden){requestAnimationFrame(atImagesIdleV1_);return;}
        atImagesCompteurIdleV1+=1;
        if(!atCacheLignesIdleV1||atImagesCompteurIdleV1%30===0||atCacheLignesIdleV1.some(function(c){return !c.el.isConnected;})){
          atCacheLignesIdleV1=Array.prototype.map.call(document.querySelectorAll('.soreal-idle-at-ligne-v1[data-at-piste]'),function(el){
            return {el:el,barre:el.querySelector('.soreal-idle-at-barre-v1'),rempl:el.querySelector('[data-at-fill]')};
          });
        }
        const lignes=atCacheLignesIdleV1;
        if(!lignes.length){atImagesActifIdleV1_=false;atCacheLignesIdleV1=null;return;}
        const maintenant=performance.now();
        for(let i=0;i<lignes.length;i++){
          const el=lignes[i].el,d=el.dataset,barre=lignes[i].barre,rempl=lignes[i].rempl;
          if(!rempl||(barre&&barre.classList.contains('pleine')))continue;
          const taux=Number(d.atTaux)||0,gratuit=d.atGratuit==='1',cible=Number(d.atCible)||0;
          const n0=Number(d.atN)||0,p0=Number(d.atP)||0,t0=Number(d.atT)||maintenant;
          const etat=atSimulerIdleV1_(n0,p0,Math.max(0,(maintenant-t0)/1000),Number(d.atA)||0,taux,gratuit,cible);
          const tr='scaleX('+((cible>0&&etat.n>=cible)?1:etat.p)+')';
          if(rempl.style.transform!==tr)rempl.style.transform=tr;
        }
        requestAnimationFrame(atImagesIdleV1_);
      }

      function atDemarrerImagesIdleV1_(){
        if(atImagesActifIdleV1_||typeof requestAnimationFrame!=='function')return;
        atImagesActifIdleV1_=true;
        requestAnimationFrame(atImagesIdleV1_);
      }

      function atTickIdleV1_(){
        if(document.hidden)return;   /* audit 2026-10-13 : pas de travail onglet caché */
        const lignes=document.querySelectorAll('.soreal-idle-at-ligne-v1[data-at-piste]');
        if(!lignes.length)return;
        atDemarrerImagesIdleV1_();
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const sys=j?systemeMetaParIdIdleV130_(j,'advancedTraining'):null;
        const maintenant=performance.now();
        for(let i=0;i<lignes.length;i++){
          const el=lignes[i],id=el.getAttribute('data-at-piste'),d=el.dataset;
          const taux=Number(d.atTaux)||0,gratuit=d.atGratuit==='1',cible=Number(d.atCible)||0;
          const alloc=sys?atEnergieDePisteIdleV1_(sys,id):Number(d.atA)||0;
          let n0=Number(d.atN)||0,p0=Number(d.atP)||0,t0=Number(d.atT)||maintenant;
          /* L'énergie a changé (+ / − / Target atteint côté serveur) : on rejoue jusqu'à maintenant avec l'ancienne, puis on repart de là. */
          if(Math.abs(alloc-(Number(d.atA)||0))>1e-9){
            const avant=atSimulerIdleV1_(n0,p0,Math.max(0,(maintenant-t0)/1000),Number(d.atA)||0,taux,gratuit,cible);
            n0=avant.n;p0=avant.p;t0=maintenant;
            d.atN=String(n0);d.atP=String(p0);d.atT=String(t0);d.atA=String(alloc);
          }
          const etat=atSimulerIdleV1_(n0,p0,Math.max(0,(maintenant-t0)/1000),alloc,taux,gratuit,cible);
          const niveau=(Number(d.atBase)||0)+etat.n;
          const nivEl=document.getElementById('sorealIdleAtNiveau_'+id);
          /* Audit d'Entraînement avancé (Norman, 2026-10-05) : ce passage tourne ~7 fois par seconde et réécrivait niveau et bonus de chaque piste même identiques (~40 modifications de page par seconde au repos) ; seulement s'ils changent. */
          if(nivEl){const t=H.formatGrandNombreIdleV70_(niveau);if(nivEl.textContent!==t)nivEl.textContent=t;}
          const barre=el.querySelector('.soreal-idle-at-barre-v1'),rempl=el.querySelector('[data-at-fill]');
          const travailParS=gratuit?Infinity:alloc*taux;
          const niveauxParS=gratuit?50:Math.min(50,travailParS/(etat.n+1));
          const atteint=cible>0&&etat.n>=cible;
          const pleine=!atteint&&niveauxParS>=49.9;
          if(barre)barre.classList.toggle('pleine',pleine);
          /* Le remplissage n'est PLUS écrit ici (150 ms = des à-coups) : il est dessiné à chaque image par atImagesIdleV1_ (Norman, 2026-10-10 : « les barres d'entraînement avancé avancent de manière saccadée »). */
          if(rempl&&pleine&&rempl.style.transform)rempl.style.transform='';
          const bonusEl=el.querySelector('[data-at-bonus]');
          if(bonusEl){const t=atBonusTexteIdleV1_(id,niveau);if(bonusEl.textContent!==t)bonusEl.textContent=t;}
          const etaEl=el.querySelector('[data-at-eta]');
          if(etaEl){
            let txt;
            if(atteint)txt='🎯 Target atteint';
            else if(gratuit||niveauxParS>=49.9)txt='⚡ 50 niveaux par seconde (maximum)';
            else if(!(travailParS>0))txt='Place de l’énergie pour progresser.';
            else{
              const reste=(1-etat.p)*((etat.n+1)/travailParS);
              txt='Niveau suivant dans '+formatDureeAugmentIdleV1_(reste)+(niveauxParS>=1?' · '+niveauxParS.toLocaleString('fr-FR',{maximumFractionDigits:1})+' niv/s':'');
            }
            if(etaEl.textContent!==txt)etaEl.textContent=txt;
          }
        }
      }
      if(typeof setInterval==='function'&&!window.__SOREAL_IDLE_AT_TICK_V1__){
        window.__SOREAL_IDLE_AT_TICK_V1__=true;
        setInterval(atTickIdleV1_,150);
      }

      function atPatchLigneIdleV1_(id,valeur){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const span=document.getElementById('sorealIdleAtAlloc_'+id);
        if(span)span.textContent=H.formatGrandNombreIdleV70_(valeur);
        const libre=document.getElementById('sorealIdleAugEnergieLibreV1');
        if(libre){
          const j=H.getIdleEtat();
          libre.textContent=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(j&&j.energie)));
        }
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
      }

      function ajusterAdvancedTrainingIdleV1_(id,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        const piste=s&&s.state&&s.state.data&&s.state.data.tracks&&s.state.data.tracks[id];
        if(!piste)return;
        const courant=atEnergieDePisteIdleV1_(s,id);
        const pas=montantAugmentLireIdleV1_();
        const libre=Math.max(0,H.idleNombre_(j&&j.energie));
        const valeur=Math.max(0,H.idleEntier_(mode==='zero'?0:mode==='plus'?courant+Math.min(pas,libre):Math.max(0,courant-pas)));
        const delta=valeur-courant;
        if(delta!==0){
          if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_(mode==='plus'?'btPlus':'btMinus');
          /* Ancien contrat : on matérialise d'abord l'allocation unique sur la piste active, pour ne rien compter deux fois. */
          const dejaParPiste=Object.keys(s.state.data.tracks).some(function(k){return Math.max(0,H.idleNombre_(s.state.data.tracks[k].energy))>0;});
          if(!dejaParPiste){
            const actif=s.state.data.tracks[s.state.data.activeTrack||''];
            if(actif)actif.energy=Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.energy));
          }
          piste.energy=valeur;
          if(s.state.allocation)s.state.allocation.energy=Math.max(0,H.idleNombre_(s.state.allocation.energy)+delta);
          if(j)j.energie=Math.max(0,libre-delta);
          atPatchLigneIdleV1_(id,valeur);
        }
        /* Rien n'a changé (plus d'énergie libre, déjà à zéro) : aucun envoi (audit d'Entraînement avancé, 2026-10-05). */
        if(delta===0)return;
        envoyerAllocRapideV1_({action:'allocateAdvancedTraining',track:id,value:valeur});
      }
      window.__ajusterAdvancedTrainingIdleV1__=ajusterAdvancedTrainingIdleV1_;
      /*
       * Le caca vient en zoom sur TOUT l'écran avant de disparaître (Norman, 2026-10-20 : « quand on clique dessus, il vient en zoom sur l'écran complet avant de disparaître ; là il reste en bas à gauche »). Le petit bouton s'efface tout de suite ; un
       * grand caca, posé sur la page entière (position fixe, hors de la page redessinée), part du bouton, grandit jusqu'à couvrir l'écran, glisse vers le centre puis s'efface en fondu. Le succès part au serveur à la fin
       * (une synchro avant la fin redessinerait la page en plein zoom).
       */
      window.__cacaCoinIdleV1__=function(bouton){
        if(!bouton||bouton.classList.contains('parti'))return;
        bouton.classList.add('parti');
        try{
          const r=bouton.getBoundingClientRect(),vw=window.innerWidth||document.documentElement.clientWidth,vh=window.innerHeight||document.documentElement.clientHeight;
          const cx=r.left+r.width/2,cy=r.top+r.height/2;
          const grand=document.createElement('div');
          grand.className='soreal-idle-at-caca-zoom-v1';
          grand.setAttribute('aria-hidden','true');
          grand.textContent='💩';
          grand.style.cssText='position:fixed;left:'+cx+'px;top:'+cy+'px;width:0;height:0;display:flex;align-items:center;justify-content:center;font-size:100px;line-height:1;z-index:99999;pointer-events:none;will-change:transform,opacity';
          document.body.appendChild(grand);
          const fin=Math.max(vw,vh)*1.7/100;
          const reduit=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
          const anim=grand.animate([
            {transform:'translate(0px,0px) scale(.2)',opacity:0},
            {opacity:1,offset:.1},
            {opacity:1,offset:.75},
            {transform:'translate('+(vw/2-cx)+'px,'+(vh/2-cy)+'px) scale('+fin.toFixed(2)+')',opacity:0}
          ],{duration:reduit?10:1100,easing:'ease-in',fill:'forwards'});
          anim.onfinish=function(){if(grand.parentNode)grand.parentNode.removeChild(grand);};
        }catch(_e){}
        setTimeout(function(){
          try{
            const f=window.__actionMetaIdleV130__;
            if(typeof f==='function')f({action:'cornerClick'});
          }catch(_e){}
        },1000);
      };
      window.__basculerAideAdvancedTrainingIdleV1__=function(){
        const el=document.getElementById('sorealIdleAtAideV1');
        if(el)el.hidden=!el.hidden;
      };
      window.__basculerAdvanceAdvancedTrainingIdleV1__=function(actif){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        if(s&&s.state&&s.state.data)s.state.data.advanceEnergy=Boolean(actif);
        envoyerAllocRapideV1_({action:'setAdvancedTrainingAdvance',enabled:Boolean(actif)});
      };
      window.__cibleAdvancedTrainingIdleV1__=function(id,valeur){
        const n=Math.max(0,Math.floor(Number(valeur)||0));
        /* L'écran adopte le Target tout de suite : la réponse du serveur le confirme sans écart, donc sans redessiner la page. */
        try{
          const j=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat();
          const sT=systemeMetaParIdIdleV130_(j,'advancedTraining');
          const pT=sT&&sT.state&&sT.state.data&&sT.state.data.tracks&&sT.state.data.tracks[String(id)];
          if(pT)pT.target=n;
          const ligneT=document.querySelector('.soreal-idle-at-ligne-v1[data-at-piste="'+String(id)+'"]');
          if(ligneT)ligneT.dataset.atCible=String(n);
        }catch(_e){}
        envoyerAllocRapideV1_({action:'setAdvancedTrainingTarget',track:String(id),value:n});
      };
      window.__viderAdvancedTrainingIdleV1__=function(){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        const pistes=(s&&s.state&&s.state.data&&s.state.data.tracks)||{};
        Object.keys(pistes).forEach(function(id){
          const courant=atEnergieDePisteIdleV1_(s,id);
          if(courant<=0)return;
          pistes[id].energy=0;
          if(s.state.allocation)s.state.allocation.energy=Math.max(0,H.idleNombre_(s.state.allocation.energy)-courant);
          if(j)j.energie=Math.max(0,H.idleNombre_(j.energie)+courant);
          atPatchLigneIdleV1_(id,0);
          envoyerAllocRapideV1_({action:'allocateAdvancedTraining',track:id,value:0});
        });
      };

  window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__={
    pageAugmentationsIdleV48_:pageAugmentationsIdleV48_,
    pageTimeMachineIdleV48_:pageTimeMachineIdleV48_,
    exclamationOrIdleV1_:exclamationOrIdleV1_,
    pageBloodMagicIdleV48_:pageBloodMagicIdleV48_,
    emojiNomIdleV1_:emojiNomIdleV1_,
    pageAdvancedTrainingIdleV1_:pageAdvancedTrainingIdleV1_
  };
})();
