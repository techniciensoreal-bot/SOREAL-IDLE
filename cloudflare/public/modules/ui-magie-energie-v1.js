/*
 * SOREAL IDLE — Énergie, Magie et sorts (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_magie_energie_v1)return;
  REG.__chargé_ui_magie_energie_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function formatEntierLisibleIdleV1_(){return REG.formatEntierLisibleIdleV1_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function energieReserveeIdleV23_(){return REG.energieReserveeIdleV23_.apply(null,arguments);}
  function totalAllocationBasicTrainingIdleV120_(){return REG.totalAllocationBasicTrainingIdleV120_.apply(null,arguments);}
  function mettreAJourBarreProgressionContinueV1_(){return REG.mettreAJourBarreProgressionContinueV1_.apply(null,arguments);}
  function coutBaseEntrainementIdleV73_(){return REG.coutBaseEntrainementIdleV73_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function conserverPositionIdleV24_(){return REG.conserverPositionIdleV24_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function ajouterLogCombatIdleV70_(){return REG.ajouterLogCombatIdleV70_.apply(null,arguments);}
  function protegerJoueurServeurInventaireIdleV208_(){return REG.protegerJoueurServeurInventaireIdleV208_.apply(null,arguments);}
  function appliquerSynchroCombatSansReflowIdleV116_(){return REG.appliquerSynchroCombatSansReflowIdleV116_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function resumeStatsIdleV28_(){return REG.resumeStatsIdleV28_.apply(null,arguments);}

      /* Bandeau : part de chaque barre déjà générée (disponible + dépensée), en pourcentage du plafond. */
      /*
       * La barre de Magie ne s'efface PAS tant qu'il reste de la Magie à générer (Norman, 2026-10-12 : « j'ai acheté 30K de plafond et la barre a mis 10 secondes à s'afficher » ; « j'ai mis MAX pour la Time Machine, il restait 2 minutes de
       * Magie à générer et pourtant la barre a disparu puis est réapparue »). Elle n'est « vide » que si plus rien n'est disponible ET qu'il n'y a plus rien à produire (plafond atteint ou production nulle).
       */
      function magieEncoreAGenererIdleV1_(){
        const m=typeof donneesMagieGenereeIdleV1_==='function'?donneesMagieGenereeIdleV1_():null;
        return !!(m&&m.parSeconde>0&&m.cap-m.generee>=1);
      }

      /*
       * 2026-09-24 (Norman : « quand tous mes points sont générés et que j'en place dans Augmentation, le compteur continue à générer des
       * points et retombe à 0 vers 17-20, puis recommence sans arrêt »). Le serveur ne laisse à l'énergie libre que
       * Cap − (Basic Training + TOUS les systèmes qui en retiennent : Augmentations, NGU, Time Machine, Wishes…) ; le client, lui, ne
       * retirait du Cap que Basic Training : avec toute l'énergie placée dans Augmentation il continuait donc à « générer » localement
       * jusqu'à la prochaine synchronisation, qui ramenait la valeur du serveur (0). Somme lue dans le snapshot, comme le moteur.
       */
      function allocationMetaEnergieIdleV1_(){
        const liste=
          REG.idleEtat&&
          REG.idleEtat.systemes&&
          Array.isArray(REG.idleEtat.systemes.systems)
            ?REG.idleEtat.systemes.systems
            :[];

        return liste.reduce(function(total,sys){
          return total+
            Math.max(
              0,
              idleNombre_(
                sys&&
                sys.state&&
                sys.state.allocation&&
                sys.state.allocation.energy
              )
            );
        },0);
      }

      /*
       * Saisie fractionnaire (2026-09-27, Norman) : "1/8" dans un champ Input (Basic Training,
       * Augmentations, Time Machine) doit se transformer, à la validation ou en cliquant en
       * dehors du champ, en 1/8 de l'énergie idle libre du joueur -- pas un montant absolu tapé
       * au hasard. "n/d" -> Math.floor(energieLibre * n/d), jamais moins que 1. Renvoie null si
       * le texte n'est pas une fraction "n/d" (l'appelant retombe alors sur le parsing normal).
       */
      function idleParseFractionEnergieV1_(valeur,energieLibre){
        const texte=String(valeur==null?'':valeur).trim();
        const m=texte.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
        if(!m)return null;
        const n=Number(m[1].replace(',','.'));
        const d=Number(m[2].replace(',','.'));
        if(!Number.isFinite(n)||!Number.isFinite(d)||d<=0||n<0)return null;
        return Math.max(1,Math.floor(Math.max(0,idleNombre_(energieLibre))*(n/d)));
      }

      /*
       * Branché sur onblur/onchange d'un input "Input" (Basic Training/Augmentations/Time
       * Machine) : si la valeur tapée est une fraction "n/d", la réécrit en toutes lettres
       * (le joueur voit tout de suite le vrai montant, jamais "1/8" qui resterait affiché).
       * Sans effet si ce n'est pas une fraction (nombre déjà entier, champ vide...).
       */
      function idleResoudreFractionInputV1_(input){
        if(!input)return;
        const resolu=idleParseFractionEnergieV1_(input.value,REG.idleEtat&&REG.idleEtat.energie);
        if(resolu!=null)input.value=String(resolu);
      }

      function formatEnergieIdleV50_(v){
        return formatEntierLisibleIdleV1_(Math.max(0,idleNombre_(v)));
      }

      function metaTickEnergieIdleV114_(){
        const prod=
          Math.max(
            0.01,
            idleNombre_(
              REG.idleEtat &&
              REG.idleEtat.productionSeconde
            ) || 0.25
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-29 */
        const minimumMs=20;

        const gain=
          Math.max(
            1,
            Math.ceil(
              prod*minimumMs/1000-
              1e-12
            )
          );

        const dureeMs=
          Math.max(
            minimumMs,
            1000*gain/prod
          );

        return {
          gain:gain,
          dureeMs:dureeMs
        };
      }

      /*
       * Même mécanique que metaTickEnergieIdleV114_ (taille/durée d'un tick local, sous la barre
       * minimale de 20ms), mais lue depuis resourceInfo.magic.perSecond -- jamais idleEtat.
       * productionSeconde, propre à l'Énergie.
       */
      function metaTickMagieIdleV1_(){
        const infoMagie=
          REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceInfo&&
          REG.idleEtat.systemes.resourceInfo.magic;

        const prod=
          Math.max(
            0.01,
            idleNombre_(infoMagie&&infoMagie.perSecond)||0.25
          );

        const minimumMs=20;

        const gain=
          Math.max(
            1,
            Math.ceil(
              prod*minimumMs/1000-
              1e-12
            )
          );

        const dureeMs=
          Math.max(
            minimumMs,
            1000*gain/prod
          );

        return {
          gain:gain,
          dureeMs:dureeMs
        };
      }

      function gainParTickEnergieIdleV34_(){
        return Math.max(
          1,
          idleEntier_(
            metaTickEnergieIdleV114_()
              .gain
          )
        );
      }

      function energieDisponibleIdleV9_(){
        if(!REG.idleEtat){
          return 0;
        }

        return Math.max(
          0,
          idleNombre_(
            REG.idleEtat.energie
          ) -
          energieReserveeIdleV23_()
        );
      }

      /*
       * 2026-09-24 (Norman : « au-dessus de la barre d'énergie, un compteur avec les mêmes chiffres que la barre verte, mais avec le total
       * RÉELLEMENT GÉNÉRÉ et non le total actuel : ça permet de savoir combien il nous reste à partager ; avoir les deux informations est
       * utile ») : barre verte = énergie disponible ; compteur = disponible + déjà placée (Basic Training et tous les autres systèmes).
       */
      function energieGenereeTotaleIdleV1_(){
        if(!REG.idleEtat)return 0;
        return energieDisponibleIdleV9_()+
          totalAllocationBasicTrainingIdleV120_()+
          allocationMetaEnergieIdleV1_();
      }

      /*
       * 2026-09-25 (Norman : « à côté de "Généré : 250/500", un compteur qui indique dans combien de temps toute l'énergie sera générée,
       * par exemple 15 minutes 22 secondes ») : (cap - déjà généré) / production par seconde ; l'énergie déjà placée compte comme générée.
       */
      function formatDureeEnergieIdleV1_(secondes){
        let s=Math.max(0,Math.ceil(Number(secondes)||0));
        const j=Math.floor(s/86400);s-=j*86400;
        const h=Math.floor(s/3600);s-=h*3600;
        const m=Math.floor(s/60);s-=m*60;
        const parties=[];
        if(j>0)parties.push(j+' j');
        if(j>0||h>0)parties.push(h+' h');
        if(j>0||h>0||m>0)parties.push(m+' min');
        if(j===0)parties.push(s+' s');
        return parties.join(' ');
      }

      function texteTempsEnergiePleineIdleV1_(){
        const max=idleEntier_(REG.idleEtat&&REG.idleEtat.energieMax);
        const reste=max-energieGenereeTotaleIdleV1_();
        if(!(max>0))return '';
        /* Moins d'une énergie manquante (décimales d'allocation) : pleine, jamais « Pleine dans 1 s ». */
        if(reste<1)return '✅ Énergie pleine';
        const prod=idleNombre_(REG.idleEtat&&REG.idleEtat.productionSeconde);
        if(!(prod>0))return '';
        return '⏱ Pleine dans '+formatDureeEnergieIdleV1_(reste/prod);
      }

      /*
       * Norman (2026-09-30) : « pour la barre énergie et magie, les données doivent être les mêmes... tout doit être identique entre les 2 barres
       * mis à part les couleurs et le nom ». La Magie affiche donc les mêmes lignes que l'Énergie : « Généré : X / Y · Pleine dans … » (X = magie
       * disponible + magie déjà placée, comme pour l'énergie) et « Tick : … · +N 🔮 ».
       */
      function allocationMetaMagieIdleV1_(){
        const liste=
          REG.idleEtat&&
          REG.idleEtat.systemes&&
          Array.isArray(REG.idleEtat.systemes.systems)
            ?REG.idleEtat.systemes.systems
            :[];
        return liste.reduce(function(total,sys){
          return total+Math.max(0,idleNombre_(sys&&sys.state&&sys.state.allocation&&sys.state.allocation.magic));
        },0);
      }

      function donneesMagieGenereeIdleV1_(){
        const sy=REG.idleEtat&&REG.idleEtat.systemes;
        const info=sy&&sy.resourceInfo&&sy.resourceInfo.magic;
        const ressource=sy&&sy.resources&&sy.resources.magic;
        if(!info||!ressource)return null;
        const cap=Math.max(0,idleNombre_(info.capRun));
        const generee=Math.min(cap,Math.max(0,idleNombre_(ressource.current))+allocationMetaMagieIdleV1_());
        return {cap:cap,generee:generee,parSeconde:Math.max(0,idleNombre_(info.perSecond))};
      }

      function texteMagieGenereeIdleV1_(){
        const m=donneesMagieGenereeIdleV1_();
        if(!m)return '';
        const reste=m.cap-m.generee;
        let temps='';
        if(m.cap>0){
          if(reste<1)temps='✅ Magie pleine';
          else if(m.parSeconde>0)temps='⏱ Pleine dans '+formatDureeEnergieIdleV1_(reste/m.parSeconde);
        }
        return '🔮 Reste à générer : '+formatEnergieIdleV50_(reste<1?0:Math.max(0,reste))+(temps?' · '+temps:'');
      }

      /* Norman (2026-10-01) : « Niveau par seconde » à la place de « Tick » et « Production », identique pour l'Énergie et la Magie. */
      function texteNiveauParSecondeIdleV1_(parSeconde){
        return 'Niveau par seconde : +'+idleNombre_(parSeconde).toLocaleString('fr-FR',{maximumFractionDigits:2})+'/s';
      }

      function texteTickMagieIdleV1_(){
        const m=donneesMagieGenereeIdleV1_();
        return texteNiveauParSecondeIdleV1_(m?m.parSeconde:0);
      }

      function texteEnergieGenereeIdleV1_(){
        const temps=texteTempsEnergiePleineIdleV1_();
        const resteBrut=idleEntier_(REG.idleEtat&&REG.idleEtat.energieMax)-energieGenereeTotaleIdleV1_();
        const reste=resteBrut<1?0:resteBrut;
        return '🔋 Reste à générer : '+
          formatEnergieIdleV50_(reste)+
          (temps?' · '+temps:'');
      }

      /*
       * Infobulle de l'énergie — à l'origine une transcription exacte de NGU (capture de Norman,
       * 2026-09-25). Corrigé le 2026-09-29 (Norman : « j'ai 100000 d'énergie et je ne peux pas
       * monter au dessus... l'intitulé doit être corrigé ») : la 1re ligne ("plafonnée à X") se lisait
       * comme un mur absolu, surtout combinée à la 3e ligne qui répète le même "100 000" pour un
       * joueur qui n'a encore aucun bonus de Plafond (Perks/Quirks/Souhaits) ni acheté de Plafond
       * contre de l'EXP -- alors qu'aucun des deux (ni resourceCapacityForCurrent/
       * idleNguEffectiveResourceStatV1 côté serveur, hardCap réel 9e18, ni IDLE_NGU_RESOURCE_PURCHASES.
       * energy.cap, achetable dès le boss 17) ne bloque réellement la croissance au-delà de 100 000 --
       * seule la croissance NATURELLE (+1 tous les 20 obtenus) s'arrête à ce nombre précis, exactement
       * comme documenté sur le wiki. Reformulé pour distinguer clairement "ton maximum ACTUEL" (qui
       * continue de grandir par d'autres moyens) de cette seule croissance passive. Aucun chiffre
       * inventé : mêmes valeurs qu'avant (info.capRun/capAfterRebirth), toujours fournies par le
       * serveur (j.systemes.resourceInfo.energy).
       */
      function nombreInfobulleIdleV1_(v,decimales){
        const n=idleNombre_(v);
        return n.toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:decimales||0});
      }

      function texteInfobulleEnergieIdleV1_(info){
        if(!info)return '';
        const lignes=[
          'Ton maximum d’énergie ACTUEL sur ce Rebirth : '+nombreInfobulleIdleV1_(info.capRun)+' (pas un plafond absolu : achète du Plafond contre de l’EXP, ou obtiens des Perks/Quirks/Souhaits d’Énergie, pour continuer à le faire grandir).',
          'Au Rebirth, tu auras '+nombreInfobulleIdleV1_(info.capAfterRebirth)+(idleNombre_(info.capAfterRebirth)>=2?' énergies.':' énergie.'),
          'Croissance naturelle au Rebirth : toutes les 20 énergies obtenues ajoutent 1 énergie à ton max, mais SEULEMENT cette croissance-ci s’arrête à 100 000 — au-delà, seuls le Plafond (EXP) et tes bonus la font encore grandir.',
          'Tu produis actuellement '+nombreInfobulleIdleV1_(info.perSecond,2)+(idleNombre_(info.perSecond)>=2?' énergies':' énergie')+' par seconde.',
          '',
          'Vitesse d’énergie actuelle : '+nombreInfobulleIdleV1_(info.speed,2)+', la barre se remplit tous les '+nombreInfobulleIdleV1_(info.ticksPerFill,2)+' ticks. '+
            (info.nextSpeed!=null
              ?'Prochain palier de vitesse : '+nombreInfobulleIdleV1_(info.nextSpeed,1)+'.'
              :'Vitesse maximale : la barre se remplit à chaque tick.'),
          '',
          'RACCOURCI : appuie sur R pour récupérer l’énergie de toutes les fonctions sauf l’entraînement.'
        ];
        return lignes.join('\n');
      }

      function infoEnergieIdleV1_(){
        return REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceInfo
          ?REG.idleEtat.systemes.resourceInfo.energy
          :null;
      }

      /*
       * Norman (2026-09-29) : « Au survol de la souris sur la barre "Magie",
       * les infos sont les mêmes que pour Énergie. » Cause : le panneau
       * Magie partage la classe .soreal-idle-energy-panel-v34 avec le
       * panneau Énergie (même style de carte) -- le survol détectait bien
       * "un panneau ressource", mais ouvrirInfobulleEnergieIdleV1_ affichait
       * toujours le texte ÉNERGIE, quel que soit le panneau réellement
       * survolé. Même source serveur que l'énergie (resourceInfoV1,
       * générique par ressource) : seule la croissance du plafond "+1 tous
       * les 20 obtenus" est propre à l'Énergie (capGain=0 pour la Magie,
       * idle-ngu-progression.js) -- absente ici, jamais inventée pour la
       * Magie.
       */
      function infoMagieIdleV1_(){
        return REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceInfo
          ?REG.idleEtat.systemes.resourceInfo.magic
          :null;
      }

      function texteInfobulleMagieIdleV1_(info){
        if(!info)return '';
        const lignes=[
          'Ton maximum de Magie ACTUEL sur ce Rebirth : '+nombreInfobulleIdleV1_(info.capRun)+' (pas un plafond absolu : achète du Plafond contre de l’EXP, ou obtiens des Perks/Quirks/Souhaits de Magie, pour continuer à le faire grandir).',
          'Au Rebirth, tu auras '+nombreInfobulleIdleV1_(info.capAfterRebirth)+' de Magie.',
          'Tu produis actuellement '+nombreInfobulleIdleV1_(info.perSecond,2)+' de Magie par seconde.',
          '',
          'Vitesse de Magie actuelle : '+nombreInfobulleIdleV1_(info.speed,2)+', la barre se remplit tous les '+nombreInfobulleIdleV1_(info.ticksPerFill,2)+' ticks. '+
            (info.nextSpeed!=null
              ?'Prochain palier de vitesse : '+nombreInfobulleIdleV1_(info.nextSpeed,1)+'.'
              :'Vitesse maximale : la barre se remplit à chaque tick.'),
          '',
          'RACCOURCI : appuie sur T pour récupérer toute la Magie allouée dans toutes les fonctions.'
        ];
        return lignes.join('\n');
      }

      /*
       * Infobulle de la 3e ressource (Norman, 2026-10-09 : « chaque barre a son propre popup »). Mêmes données serveur que l'énergie et la magie (resourceInfo.r3 : maximum, production, vitesse), aucune règle inventée ;
       * pas de raccourci clavier (aucun n'est documenté pour elle) et pas de croissance naturelle du maximum (propre à l'énergie).
       */
      function infoR3IdleV1_(){
        return REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceInfo
          ?REG.idleEtat.systemes.resourceInfo.r3
          :null;
      }

      function texteInfobulleR3IdleV1_(info){
        if(!info)return '';
        const lignes=[
          'Ton maximum de 3e ressource ACTUEL sur ce Rebirth : '+nombreInfobulleIdleV1_(info.capRun)+' (pas un plafond absolu : achète du Plafond contre de l’EXP pour continuer à le faire grandir).',
          'Au Rebirth, tu auras '+nombreInfobulleIdleV1_(info.capAfterRebirth)+' de 3e ressource.',
          'Tu produis actuellement '+nombreInfobulleIdleV1_(info.perSecond,2)+' de 3e ressource par seconde.',
          '',
          'Vitesse actuelle : '+nombreInfobulleIdleV1_(info.speed,2)+', la barre se remplit tous les '+nombreInfobulleIdleV1_(info.ticksPerFill,2)+' ticks. '+
            (info.nextSpeed!=null
              ?'Prochain palier de vitesse : '+nombreInfobulleIdleV1_(info.nextSpeed,1)+'.'
              :'Vitesse maximale : la barre se remplit à chaque tick.')
        ];
        return lignes.join('\n');
      }

      /* Ressource d'un panneau du bandeau : 'energy', 'magic' ou 'r3' ; la barre de VIE n'a pas d'infobulle (null). */
      function ressourceInfobulleIdleV1_(p){
        if(!p||!p.classList)return null;
        if(p.classList.contains('soreal-idle-hud-pv-v2'))return null;
        if(p.classList.contains('soreal-idle-magic-panel-v1'))return 'magic';
        if(p.classList.contains('soreal-idle-hud-r3-v2'))return 'r3';
        return 'energy';
      }

      function texteInfobulleRessourceIdleV1_(ressource){
        if(ressource==='magic')return texteInfobulleMagieIdleV1_(infoMagieIdleV1_());
        if(ressource==='r3')return texteInfobulleR3IdleV1_(infoR3IdleV1_());
        if(ressource==='energy')return texteInfobulleEnergieIdleV1_(infoEnergieIdleV1_());
        return '';
      }

      function fermerInfobulleEnergieIdleV1_(){
        const el=document.getElementById('sorealIdleEnergieInfobulleV1');
        if(el)el.remove();
      }

      function ouvrirInfobulleEnergieIdleV1_(ancre,ressource){
        const texte=texteInfobulleRessourceIdleV1_(ressource);
        if(!texte||!ancre)return;
        fermerInfobulleEnergieIdleV1_();
        const el=document.createElement('div');
        el.id='sorealIdleEnergieInfobulleV1';
        el.className='soreal-idle-energie-infobulle-v1';
        el.dataset.ressource=ressource;
        el.setAttribute('role','tooltip');
        el.textContent=texte;
        document.body.appendChild(el);
        const r=ancre.getBoundingClientRect();
        const largeur=Math.min(320,window.innerWidth-16);
        el.style.width=largeur+'px';
        el.style.left=Math.max(8,Math.min(window.innerWidth-largeur-8,r.left))+'px';
        const hauteur=el.offsetHeight;
        const dessous=r.bottom+6;
        el.style.top=(dessous+hauteur<=window.innerHeight-8?dessous:Math.max(8,r.top-hauteur-6))+'px';
      }

      function rafraichirInfobulleEnergieIdleV1_(){
        const el=document.getElementById('sorealIdleEnergieInfobulleV1');
        if(!el)return;
        const texte=texteInfobulleRessourceIdleV1_(el.dataset.ressource);
        if(texte)el.textContent=texte;
      }

      function installerInfobulleEnergieIdleV1_(){
        if(window.__sorealIdleInfobulleEnergieV1)return;
        window.__sorealIdleInfobulleEnergieV1=true;
        function panneau(cible){
          return cible&&cible.closest?cible.closest('.soreal-idle-energy-panel-v34'):null;
        }
        /* PC : l'infobulle suit le survol du panneau, comme dans NGU ; chaque barre a la sienne, la barre de vie n'en a pas. */
        document.addEventListener('mouseover',function(ev){
          if(ev.pointerType==='touch')return;
          const p=panneau(ev.target);
          const ressource=ressourceInfobulleIdleV1_(p);
          if(p&&ressource&&!panneau(ev.relatedTarget))ouvrirInfobulleEnergieIdleV1_(p,ressource);
        });
        document.addEventListener('mouseout',function(ev){
          if(panneau(ev.target)&&!panneau(ev.relatedTarget))fermerInfobulleEnergieIdleV1_();
        });
        /* Téléphone : un appui sur le panneau l'ouvre, un appui ailleurs la ferme. */
        document.addEventListener('click',function(ev){
          const p=panneau(ev.target);
          const ressource=ressourceInfobulleIdleV1_(p);
          const ouverte=document.getElementById('sorealIdleEnergieInfobulleV1');
          if(p&&ressource&&window.matchMedia&&window.matchMedia('(hover:none)').matches){
            if(ouverte)fermerInfobulleEnergieIdleV1_();else ouvrirInfobulleEnergieIdleV1_(p,ressource);
          }else if(ouverte&&!window.matchMedia('(hover:hover)').matches){
            fermerInfobulleEnergieIdleV1_();
          }
        });
        setInterval(rafraichirInfobulleEnergieIdleV1_,1000);
      }

      function rafraichirEnergieEtBoutonsIdleV9_(){
        if(!REG.idleEtat){
          return;
        }

        const energieDisponible =
          energieDisponibleIdleV9_();

        const energieEl =
          document.getElementById(
            'sorealIdleEnergieValeurV4'
          );

        if(energieEl){
          energieEl.textContent=texteEnergieGenereeIdleV1_();
        }

        const energieOverlayEl2=
          document.getElementById(
            'sorealIdleEnergyOverlayV1'
          );

        if(energieOverlayEl2){
          energieOverlayEl2.textContent=
            formatEnergieIdleV50_(
              energieDisponible
            )+
            ' / '+
            idleEntier_(
              REG.idleEtat.energieMax
            );
        }

        const summaryEnergieEl=
          document.getElementById(
            'sorealIdleSummaryEnergieV50'
          );

        if(summaryEnergieEl){
          summaryEnergieEl.textContent=
            formatEnergieIdleV50_(
              energieDisponible
            )+
            ' / '+
            idleEntier_(
              REG.idleEtat.energieMax
            );
        }

        const systemesRessources=REG.idleEtat.systemes||{};
        const infoMagic=systemesRessources.resourceInfo&&systemesRessources.resourceInfo.magic;
        const ressourceMagic=systemesRessources.resources&&systemesRessources.resources.magic;

        if(infoMagic&&ressourceMagic){
          /*
           * Norman (2026-09-29) : remplissage au compte-goutte pour la Magie. ressourceMagic.current
           * avance désormais localement tick par tick (bloc dédié plus haut dans cette fonction,
           * comme idleEtat.energie) -- il doit donc primer sur budgetMagic.available, un instantané
           * figé de la dernière synchro serveur (les deux valent la même chose AU MOMENT d'une synchro,
           * cf. idleNguResourceBudget : available===current, seule ressourceMagic.current continue de
           * bouger entre deux synchros).
           */
          const magicDisponible=Math.max(0,idleNombre_(ressourceMagic.current));
          const magicCap=Math.max(0,idleNombre_(infoMagic.capRun));
          const magicValeur=document.getElementById('sorealIdleMagicValeurV1');
          const magicOverlay=document.getElementById('sorealIdleMagicOverlayV1');
          const magicBar=document.getElementById('sorealIdleMagicBarV1');
          const magicSpeed=document.getElementById('sorealIdleMagicSpeedV1');

          if(magicValeur){
            magicValeur.textContent=texteMagieGenereeIdleV1_();
          }
          if(magicOverlay){
            magicOverlay.textContent=
              formatEnergieIdleV50_(magicDisponible)+
              ' / '+
              formatEnergieIdleV50_(magicCap);
          }
          if(magicBar){
            mettreAJourBarreProgressionContinueV1_(
              magicBar,
              magicDisponible,
              magicCap
            );
          }
          if(magicSpeed){
            magicSpeed.textContent=texteTickMagieIdleV1_();
          }
        }

        /* V13 : la barre représente uniquement le temps avant le prochain tic. */

        const types = [
          'force',
          'endurance',
          'organisation'
        ];

        document
          .querySelectorAll(
            '.soreal-idle-training-button-v5'
          )
          .forEach(function(btn){
            const type =
              btn.getAttribute(
                'data-idle-training'
              );

            if(
              types.indexOf(type) === -1
            ){
              return;
            }

            const niveauBase =
              type === 'force'
                ? idleEntier_(REG.idleEtat.force) +
                  idleEntier_(
                    REG.idleAchatsEnvoyesV23.force
                  ) +
                  idleEntier_(
                    REG.idleAchatsEnAttenteV7.force
                  )
                : type === 'endurance'
                  ? idleEntier_(REG.idleEtat.endurance) +
                    idleEntier_(
                      REG.idleAchatsEnvoyesV23.endurance
                    ) +
                    idleEntier_(
                      REG.idleAchatsEnAttenteV7.endurance
                    )
                  : idleEntier_(REG.idleEtat.organisation) +
                    idleEntier_(
                      REG.idleAchatsEnvoyesV23.organisation
                    ) +
                    idleEntier_(
                      REG.idleAchatsEnAttenteV7.organisation
                    );

            const prochainCout =
              coutBaseEntrainementIdleV73_(
                REG.idleEtat
              ) *
              Math.max(
                1,
                niveauBase
              );

            btn.textContent =
              idleEntier_(
                prochainCout
              ) +
              ' ⚡';

            btn.disabled =
              energieDisponible <
              prochainCout;
          });

        document
          .querySelectorAll(
            '.soreal-idle-zone-button-v16'
          )
          .forEach(function(btn){
            const zoneId=
              idleEntier_(
                btn.getAttribute(
                  'data-aventure-zone'
                )
              );

            const zones=
              REG.idleEtat &&
              REG.idleEtat.aventure &&
              Array.isArray(
                REG.idleEtat.aventure.zones
              )
                ?REG.idleEtat.aventure.zones
                :[];

            const zone=
              zones.find(function(z){
                return idleEntier_(z.id)===zoneId;
              });

            if(!zone){
              return;
            }

            btn.disabled=
              REG.idleAventureEnCoursV17 ||
              !zone.debloquee;
          });
      }

      function messageFlottantIdleV32_(
        texte
      ){
        const ancien=
          document.getElementById(
            'sorealIdleToastV32'
          );

        if(ancien){
          ancien.remove();
        }

        const el=
          document.createElement(
            'div'
          );

        el.id=
          'sorealIdleToastV32';
        el.className=
          'soreal-idle-toast-inline-v32';
        el.textContent=
          String(texte||'');

        document.body.appendChild(el);

        setTimeout(function(){
          if(el&&el.parentNode){
            el.remove();
          }
        },2500);
      }

      let idleSortActionV90=false;

      let idleSortPurchaseTimerV101=null;

      function sortParIdIdleV90_(id){
        const sorts=
          REG.idleEtat&&
          REG.idleEtat.magie&&
          Array.isArray(
            REG.idleEtat.magie.sorts
          )
            ?REG.idleEtat.magie.sorts
            :[];

        return sorts.find(
          function(sort){
            return String(
              sort.id||''
            )===String(
              id||''
            );
          }
        )||null;
      }

      function texteEffetSortIdleV90_(
        sort,
        effet
      ){
        const s=sort||{};
        const e=effet||{};

        if(e.type==='soin_boss'){
          return '💚 '+
            String(s.nom||'Sort')+
            ' soigne le boss de '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' ❤️.';
        }

        if(e.type==='degats_sacres'){
          return '✨ '+
            String(s.nom||'Sort')+
            ' brûle le mort-vivant pour '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' dégâts.';
        }

        if(s.type==='heal_pct'){
          return '❤️ '+
            String(s.nom||'Sort')+
            ' rend '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' ❤️.';
        }

        if(
          s.type==='damage_power' ||
          s.type==='damage_boss_pct'
        ){
          return String(s.emoji||'✨')+
            ' '+
            String(s.nom||'Sort')+
            ' inflige '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' dégâts.';
        }

        if(s.type==='shield_pct'){
          return '🛡️ Barrière active : -'+
            idleNombre_(e.valeur)+
            '% dégâts pendant '+
            idleNombre_(e.duree)+
            ' s.';
        }

        if(s.type==='cleanse'){
          return '❄️ Paralysie purgée · immunité '+
            idleNombre_(e.duree)+
            ' s.';
        }

        if(s.type==='vulnerability_pct'){
          return '🌌 Le boss devient vulnérable de +'+
            idleNombre_(e.valeur)+
            '% pendant '+
            idleNombre_(e.duree)+
            ' s.'+
            (
              e.sceauBrise
                ?' Le sceau est brisé.'
                :''
            );
        }

        return String(s.emoji||'✨')+
          ' '+
          String(s.nom||'Sort')+
          ' lancé.';
      }

      function rafraichirMagieOptimisteIdleV101_(){
        conserverPositionIdleV24_(
          function(){
            rendreIdleEtat_({
              ok:true,
              joueur:REG.idleEtat
            });
          }
        );
      }

      function envoyerAchatsSortsIdleV101_(){
        if(
          REG.idleSortPurchaseBusyV101 ||
          !REG.idleSortPurchaseQueueV101.length ||
          !SOREAL_SESSION
        ){
          return;
        }

        const lot=
          REG.idleSortPurchaseQueueV101
            .splice(
              0,
              REG.idleSortPurchaseQueueV101.length
            );

        REG.idleSortPurchaseBusyV101=true;

        google.script.run
          .withSuccessHandler(function(res){
            REG.idleSortPurchaseBusyV101=false;

            if(
              !res ||
              !res.ok
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-149 */
              synchroniserJeuIdleV7_(
                true
              );

              messageFlottantIdleV32_(
                '❌ '+
                (
                  res&&res.message
                    ?res.message
                    :'Achat magique refusé.'
                )
              );
            }else if(
              !REG.idleSortPurchaseQueueV101.length &&
              res.joueur
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-150 */
              REG.idleEtat=
                res.joueur;

              rafraichirMagieOptimisteIdleV101_();
            }

            if(
              REG.idleSortPurchaseQueueV101.length
            ){
              setTimeout(
                envoyerAchatsSortsIdleV101_,
                25
              );
            }
          })
          .withFailureHandler(function(e){
            REG.idleSortPurchaseBusyV101=false;

            synchroniserJeuIdleV7_(
              true
            );

            messageFlottantIdleV32_(
              '❌ '+
              (
                e&&e.message
                  ?e.message
                  :'Erreur pendant l’achat magique.'
              )
            );

            if(
              REG.idleSortPurchaseQueueV101.length
            ){
              setTimeout(
                envoyerAchatsSortsIdleV101_,
                120
              );
            }
          })
          .acheterSortsSorealIdle(
            SOREAL_SESSION,
            lot
          );
      }

      function planifierAchatsSortsIdleV101_(){
        if(idleSortPurchaseTimerV101){
          clearTimeout(
            idleSortPurchaseTimerV101
          );
        }

        idleSortPurchaseTimerV101=
          setTimeout(
            function(){
              idleSortPurchaseTimerV101=null;
              envoyerAchatsSortsIdleV101_();
            },
            55
          );
      }

      function acheterSortIdleV90_(
        sortId
      ){
        if(
          !SOREAL_SESSION ||
          !REG.idleEtat ||
          !REG.idleEtat.magie ||
          !REG.idleEtat.magie.debloquee
        ){
          return;
        }

        const sort=
          sortParIdIdleV90_(
            sortId
          );

        if(
          !sort ||
          sort.achete ||
          !sort.disponibleNiveau
        ){
          return;
        }

        const cout=
          Math.max(
            0,
            idleNombre_(
              sort.coutPieces
            )
          );

        if(
          idleNombre_(
            REG.idleEtat.pieces
          )<
          cout
        ){
          messageFlottantIdleV32_(
            '🪙 Pas assez de pièces.'
          );
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-151 */
        REG.idleEtat.pieces=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.pieces
            )-
            cout
          );

        sort.achete=true;
        sort.achetable=false;

        if(
          !Array.isArray(
            REG.idleEtat.magie.sortsAchetes
          )
        ){
          REG.idleEtat.magie.sortsAchetes=[];
        }

        if(
          REG.idleEtat.magie.sortsAchetes.indexOf(
            String(sort.id)
          )===-1
        ){
          REG.idleEtat.magie.sortsAchetes.push(
            String(sort.id)
          );
        }

        if(
          REG.idleSortPurchaseQueueV101.indexOf(
            String(sort.id)
          )===-1
        ){
          REG.idleSortPurchaseQueueV101.push(
            String(sort.id)
          );
        }

        rafraichirMagieOptimisteIdleV101_();

        messageFlottantIdleV32_(
          String(sort.emoji||'🔮')+
          ' Sort appris : '+
          String(sort.nom||'')
        );

        planifierAchatsSortsIdleV101_();
      }

      function lancerSortIdleV90_(
        sortId,
        cible
      ){
        if(
          idleSortActionV90 ||
          !SOREAL_SESSION ||
          !REG.idleEtat
        ){
          return;
        }

        const sort=
          sortParIdIdleV90_(
            sortId
          );

        if(!sort){
          return;
        }

        if(
          String(cible||'')==='boss' &&
          !REG.idleEtat.combatBossActif
        ){
          messageFlottantIdleV32_(
            '⚔️ Lance le combat avant de cibler le boss.'
          );
          return;
        }

        idleSortActionV90=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleSortActionV90=false;

            if(
              !res ||
              !res.ok
            ){
              messageFlottantIdleV32_(
                '❌ '+
                (
                  res&&res.message
                    ?res.message
                    :'Sort impossible.'
                )
              );
              return;
            }

            const nomSort=
              res.sort&&res.sort.nom
                ?res.sort.nom
                :sort.nom;

            ajouterLogCombatIdleV70_(
              'skill',
              texteEffetSortIdleV90_(
                res.sort||sort,
                res.effet||{}
              )
            );

            if(
              res.sort &&
              res.sort.type==='cleanse'
            ){
              REG.idleParalysieJusquaV70=0;
            }

            if(res.joueur){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-152 */
              const adventureRestPvAvantSortV1=REG.idleEtat&&REG.idleEtat.adventureRestPv;
              const joueurSortProtegeV208=
                protegerJoueurServeurInventaireIdleV208_(
                  res.joueur
                );
              if(!appliquerSynchroCombatSansReflowIdleV116_(joueurSortProtegeV208)){
                REG.idleEtat=joueurSortProtegeV208;
                if(adventureRestPvAvantSortV1!=null)REG.idleEtat.adventureRestPv=adventureRestPvAvantSortV1;
              }

              rendreIdleEtat_({
                ok:true,
                joueur:REG.idleEtat
              });
            }

            messageFlottantIdleV32_(
              String(
                res.sort&&res.sort.emoji||'✨'
              )+
              ' '+
              String(nomSort||'Sort')
            );
          })
          .withFailureHandler(function(e){
            idleSortActionV90=false;

            messageFlottantIdleV32_(
              '❌ '+
              (
                e&&e.message
                  ?e.message
                  :'Erreur magique.'
              )
            );
          })
          .lancerSortSorealIdle(
            SOREAL_SESSION,
            String(sortId||''),
            String(cible||'joueur')
          );
      }

      function boutonsCibleSortIdleV90_(
        sort,
        compact
      ){
        const cibles=
          Array.isArray(
            sort&&sort.cibles
          )
            ?sort.cibles
            :[];

        const now=heureServeurIdleV1_();

        const cooldown=
          Math.max(
            0,
            (
              idleNombre_(
                sort&&sort.cooldownJusqua
              )-
              now
            )/
            1000
          );

        const mana=
          REG.idleEtat&&REG.idleEtat.magie
            ?idleNombre_(
                REG.idleEtat.magie.mana
              )
            :0;

        const baseDisabled=
          (
            cooldown>0 ||
            mana<
            idleNombre_(
              sort&&sort.coutMana
            ) ||
            idleSortActionV90
          );

        return cibles.map(
          function(cible){
            const boss=
              cible==='boss';

            const disabled=
              baseDisabled ||
              (
                boss &&
                !(
                  REG.idleEtat&&
                  REG.idleEtat.combatBossActif
                )
              );

            if(compact){
              return `
                <button
                  type="button"
                  class="soreal-idle-quick-spell-v90${boss?' boss-target':''}"
                  data-sort-idle-v90="${idleHtml_(sort.id)}"
                  data-sort-target-v90="${idleHtml_(cible)}"
                  onclick="window.__lancerSortIdleV90__('${idleHtml_(sort.id)}','${idleHtml_(cible)}')"
                  ${disabled?'disabled':''}
                >
                  ${idleHtml_(sort.emoji||'✨')}
                  ${boss?'Boss':'Moi'}
                  <small>
                    ${formatGrandNombreIdleV70_(sort.coutMana)} mana
                    ${
                      cooldown>0
                        ?' · '+cooldown.toFixed(0)+'s'
                        :''
                    }
                  </small>
                </button>
              `;
            }

            return `
              <button
                type="button"
                class="soreal-idle-spell-button-v90${boss?' boss-target':''}"
                data-sort-idle-v90="${idleHtml_(sort.id)}"
                data-sort-target-v90="${idleHtml_(cible)}"
                onclick="window.__lancerSortIdleV90__('${idleHtml_(sort.id)}','${idleHtml_(cible)}')"
                ${disabled?'disabled':''}
              >
                ${boss?'👹 Cibler le boss':'❤️ Me cibler'}
                ${
                  cooldown>0
                    ?' · '+cooldown.toFixed(0)+'s'
                    :''
                }
              </button>
            `;
          }
        ).join('');
      }

      function pageMagieIdleV90_(
        j
      ){
        const magie=
          j&&j.magie
            ?j.magie
            :null;

        if(
          !magie ||
          !magie.debloquee
        ){
          /* ANTI-SPOIL : menu verrouillé = rien d'affiché (le menu est de toute façon masqué). */
          return '';
        }

        const sorts=
          Array.isArray(
            magie.sorts
          )
            ?magie.sorts
            :[];

        return `
          ${entetePageIdleV28_(
            '🔮 Magasin de magie',
            'Apprends des sorts, gère ton mana et utilise les bons pouvoirs au bon moment.'
          )}

          <div class="soreal-idle-note-v4" style="margin-bottom:12px">
            Le mana se régénère volontairement lentement.
            Les cooldowns empêchent de spammer les soins.
            Un soin lancé sur un boss mort-vivant lui inflige des dégâts sacrés.
          </div>

          <div class="soreal-idle-spell-grid-v90">
            ${sorts.map(function(sort){
              const achete=
                Boolean(sort.achete);

              const niveauOk=
                Boolean(sort.disponibleNiveau);

              return `
                <div
                  class="soreal-idle-spell-card-v90${
                    achete
                      ?' learned'
                      :''
                  }${
                    niveauOk
                      ?''
                      :' locked'
                  }"
                >
                  <div class="soreal-idle-spell-title-v90">
                    <div class="soreal-idle-spell-icon-v90">
                      ${idleHtml_(sort.emoji||'✨')}
                    </div>

                    <div>
                      ${idleHtml_(sort.nom||'Sort')}
                      <div style="margin-top:2px;color:#8999b1;font-size:11px">
                        ${
                          achete
                            ?'✓ APPRIS'
                            :'Niveau '+idleEntier_(sort.niveauRequis)
                        }
                      </div>
                    </div>
                  </div>

                  <div class="soreal-idle-spell-desc-v90">
                    ${idleHtml_(sort.description||'')}
                  </div>

                  <div class="soreal-idle-spell-meta-v90">
                    <span class="soreal-idle-spell-chip-v90">
                      🔮 ${formatGrandNombreIdleV70_(sort.coutMana)} mana
                    </span>
                    <span class="soreal-idle-spell-chip-v90">
                      ⏱️ ${idleNombre_(sort.cooldownSec)} s
                    </span>
                    ${
                      !achete
                        ?'<span class="soreal-idle-spell-chip-v90">🪙 '+
                          formatGrandNombreIdleV70_(sort.coutPieces)+
                          '</span>'
                        :''
                    }
                  </div>

                  <div class="soreal-idle-spell-actions-v90">
                    ${
                      !achete
                        ?`
                          <button
                            type="button"
                            class="soreal-idle-spell-button-v90 buy"
                            onclick="window.__acheterSortIdleV90__('${idleHtml_(sort.id)}')"
                            ${
                              (
                                !niveauOk ||
                                idleNombre_(j.pieces)<
                                idleNombre_(sort.coutPieces)
                              )
                                ?'disabled'
                                :''
                            }
                          >
                            🔓 Apprendre · ${formatGrandNombreIdleV70_(sort.coutPieces)} 🪙
                          </button>
                        `
                        :boutonsCibleSortIdleV90_(
                            sort,
                            false
                          )
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      function actualiserManaSortsIdleV90_(
        maintenant
      ){
        const magie=
          REG.idleEtat&&REG.idleEtat.magie
            ?REG.idleEtat.magie
            :null;

        if(
          !magie ||
          !magie.debloquee
        ){
          return;
        }

        const max=
          Math.max(
            1,
            idleNombre_(
              magie.manaMax
            )
          );

        magie.mana=
          Math.min(
            max,
            Math.max(
              0,
              idleNombre_(
                magie.mana
              )+
              Math.max(
                0,
                idleNombre_(
                  magie.regenSeconde
                )
              )*
              (
                Math.max(
                  0,
                  maintenant-
                  (
                    magie.__tickLocalV90||
                    maintenant
                  )
                )/
                1000
              )
            )
          );

        magie.__tickLocalV90=
          maintenant;

        const texte=
          document.getElementById(
            'sorealIdleManaTextV90'
          );

        if(texte){
          texte.textContent=
            formatGrandNombreIdleV70_(
              magie.mana
            )+
            ' / '+
            formatGrandNombreIdleV70_(
              max
            );
        }

        const fill=
          document.getElementById(
            'sorealIdleManaFillV90'
          );

        if(fill){
          fill.style.width=
            Math.max(
              0,
              Math.min(
                100,
                magie.mana/max*100
              )
            )+
            '%';
        }

        document
          .querySelectorAll(
            '[data-sort-idle-v90]'
          )
          .forEach(function(button){
            const sort=
              sortParIdIdleV90_(
                button.getAttribute(
                  'data-sort-idle-v90'
                )
              );

            if(!sort)return;

            const cible=
              button.getAttribute(
                'data-sort-target-v90'
              )||'joueur';

            const restant=
              Math.max(
                0,
                (
                  idleNombre_(
                    sort.cooldownJusqua
                  )-
                  heureServeurIdleV1_()
                )/
                1000
              );

            button.disabled=
              Boolean(
                idleSortActionV90 ||
                restant>0 ||
                idleNombre_(
                  magie.mana
                )<
                idleNombre_(
                  sort.coutMana
                ) ||
                (
                  cible==='boss' &&
                  !REG.idleEtat.combatBossActif
                )
              );

            const small=
              button.querySelector(
                'small'
              );

            if(small){
              small.textContent=
                formatGrandNombreIdleV70_(
                  sort.coutMana
                )+
                ' mana'+
                (
                  restant>0
                    ?' · '+
                      restant.toFixed(0)+
                      's'
                    :''
                );
            }
          });
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-153 */
      function rendreBarreEnergiePersistanteIdleV1_(j){
        const systemes=j&&j.systemes?j.systemes:{};
        const infoMagic=systemes.resourceInfo&&systemes.resourceInfo.magic
          ?systemes.resourceInfo.magic
          :null;
        const ressourceMagic=systemes.resources&&systemes.resources.magic
          ?systemes.resources.magic
          :null;
        const budgetMagic=systemes.resourceBudget&&systemes.resourceBudget.magic
          ?systemes.resourceBudget.magic
          :null;
        const magicDisponible=budgetMagic
          ?Math.max(0,idleNombre_(budgetMagic.available))
          :Math.max(0,idleNombre_(ressourceMagic&&ressourceMagic.current));
        const magicCap=infoMagic
          ?Math.max(0,idleNombre_(infoMagic.capRun))
          :Math.max(0,idleNombre_(ressourceMagic&&ressourceMagic.cap));
        const magicPct=magicCap>0
          ?Math.max(0,Math.min(100,magicDisponible/magicCap*100))
          :0;

        const ressourceR3=systemes.resources&&systemes.resources.r3?systemes.resources.r3:null;
        /* Prototype HUD : la 3e ressource n'apparaît qu'une fois qu'on en possède (rien de verrouillé n'est montré). */
        const r3Visible=Boolean(ressourceR3&&idleNombre_(ressourceR3.current)>0);
        const r3Cap=ressourceR3?Math.max(1,idleNombre_(ressourceR3.cap)):1;
        const r3Val=ressourceR3?Math.max(0,idleNombre_(ressourceR3.current)):0;

        return `
          <div class="soreal-idle-hud-v2" id="sorealIdleHudV2">
          ${resumeStatsIdleV28_(j)}
          <div class="soreal-idle-energy-panel-v34${energieDisponibleIdleV9_()<1?' soreal-idle-vide-v2':''}">
            <div class="soreal-idle-energy-head-v34">
              <div class="soreal-idle-energy-title-v34">
                ⚡ Énergie d'entraînement
              </div>

              <div
                id="sorealIdleEnergieValeurV4"
                class="soreal-idle-energy-number-v34"
              >
                ${texteEnergieGenereeIdleV1_()}
              </div>
            </div>

            <div
              id="sorealIdleEnergySpeedV34"
              class="soreal-idle-energy-speed-v34"
            >
              ${texteNiveauParSecondeIdleV1_(j.productionSeconde)}
            </div>

            <span class="soreal-idle-hud-lat-v2 g" id="sorealIdleHudGEnergieV2"></span>
            <div class="soreal-idle-energybar-wrap-v11">
              <i class="soreal-idle-depense-v2" id="sorealIdleDepenseEnergieV2"></i>
              <div
                id="sorealIdleEnergyBarV11"
                class="soreal-idle-energybar-v11"
              ><i class="soreal-idle-bulles-v2"></i></div>
              <div
                id="sorealIdleEnergyOverlayV1"
                class="soreal-idle-energybar-overlay-v1"
              >
                ${formatEnergieIdleV50_(energieDisponibleIdleV9_())} / ${formatEntierLisibleIdleV1_(j.energieMax)}
              </div>
            </div>
            <span class="soreal-idle-hud-lat-v2 d" id="sorealIdleHudDEnergieV2"></span>
          </div>

          ${infoMagic&&ressourceMagic?`
            <div class="soreal-idle-energy-panel-v34 soreal-idle-magic-panel-v1${magicDisponible<1&&!magieEncoreAGenererIdleV1_()?' soreal-idle-vide-v2':''}">
              <div class="soreal-idle-energy-head-v34">
                <div class="soreal-idle-energy-title-v34">
                  🔮 Magie
                </div>

                <div
                  id="sorealIdleMagicValeurV1"
                  class="soreal-idle-energy-number-v34"
                >
                  ${texteMagieGenereeIdleV1_()}
                </div>
              </div>

              <div
                id="sorealIdleMagicSpeedV1"
                class="soreal-idle-energy-speed-v34"
              >
                ${texteTickMagieIdleV1_()}
              </div>

              <span class="soreal-idle-hud-lat-v2 g" id="sorealIdleHudGMagieV2"></span>
              <div class="soreal-idle-energybar-wrap-v11 soreal-idle-magicbar-wrap-v1">
                <i class="soreal-idle-depense-v2" id="sorealIdleDepenseMagieV2"></i>
                <div
                  id="sorealIdleMagicBarV1"
                  class="soreal-idle-energybar-v11 soreal-idle-magicbar-v1"
                  style="width:${magicPct.toFixed(4)}%"
                ><i class="soreal-idle-bulles-v2"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b class="gr gr1"></b><b class="gr gr2"></b></i></div>
                <div
                  id="sorealIdleMagicOverlayV1"
                  class="soreal-idle-energybar-overlay-v1"
                >
                  ${formatEnergieIdleV50_(magicDisponible)} / ${formatEnergieIdleV50_(magicCap)}
                </div>
              </div>
              <span class="soreal-idle-hud-lat-v2 d" id="sorealIdleHudDMagieV2"></span>
            </div>
          `:''}

          ${r3Visible?`
            <div class="soreal-idle-energy-panel-v34 soreal-idle-hud-r3-v2">
              <div class="soreal-idle-energy-head-v34">
                <div class="soreal-idle-energy-title-v34">🧪 ${idleHtml_((window.__SOREAL_IDLE_PERSO_PCT_V1__&&window.__SOREAL_IDLE_PERSO_PCT_V1__.nomR3&&window.__SOREAL_IDLE_PERSO_PCT_V1__.nomR3())||'Ressource 3')}</div>
                <div class="soreal-idle-energy-number-v34"></div>
              </div>
              <span class="soreal-idle-hud-lat-v2 g" id="sorealIdleHudGR3V2"></span>
              <div class="soreal-idle-energybar-wrap-v11">
                <div id="sorealIdleHudR3BarV2" class="soreal-idle-energybar-v11 soreal-idle-hud-r3bar-v2" style="width:${Math.min(100,r3Val/r3Cap*100).toFixed(3)}%"><i class="soreal-idle-bulles-v2"></i></div>
                <div id="sorealIdleHudR3TexteV2" class="soreal-idle-energybar-overlay-v1">${formatEnergieIdleV50_(r3Val)} / ${formatEnergieIdleV50_(r3Cap)}</div>
              </div>
              <span class="soreal-idle-hud-lat-v2 d" id="sorealIdleHudDR3V2"></span>
            </div>
          `:''}

          <div class="soreal-idle-energy-panel-v34 soreal-idle-hud-pv-v2" id="sorealIdleHudPvV2">
            <div class="soreal-idle-energy-head-v34">
              <div class="soreal-idle-energy-title-v34">❤️ Vie</div>
              <div class="soreal-idle-energy-number-v34"></div>
            </div>
            <span class="soreal-idle-hud-lat-v2 g" id="sorealIdleHudGPvV2"></span>
            <div class="soreal-idle-energybar-wrap-v11">
              <div id="sorealIdleHudPvBarV2" class="soreal-idle-energybar-v11 soreal-idle-hud-pvbar-v2" style="width:100%"><i class="soreal-idle-bulles-v2"></i></div>
              <div id="sorealIdleHudPvTexteV2" class="soreal-idle-energybar-overlay-v1"></div>
            </div>
            <span class="soreal-idle-hud-lat-v2 d" id="sorealIdleHudDPvV2"></span>
          </div>
          </div>
        `;
      }

      function htmlReglagesOrageSortsIdleV1_(){
        const O=window.__SOREAL_IDLE_ORAGE_V1__;
        if(!REG.idlePartieDevV1||!REG.idlePartieDevV1.actif||!O||!O.niveauxSorts)return '';
        const noms={numberBoost:'🔢 Boost du nombre par le sang (1er)',ironPill:'💊 Iron Pill (2e)',bloodSpaghetti:'🍝 Spaghetti de sang (3e)',counterfeitGold:'💰 Counterfeit Gold (4e)',leeches:'🪱 Leeches (5e, le dernier)'};
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🔯 Pentacles des sorts de Blood Magic (développement)</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Section visible seulement en développement : le sceau, le pentacle, les runes et le sang qui tombent, de plus en plus riches selon le sort ; la piste d’ambiance bascule en même temps sur la piste d’orage.</div>'+
          Object.keys(O.niveauxSorts).map(function(id){
            return '<div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#dce5f3;margin-bottom:8px"><span style="flex:1;min-width:0">'+idleHtml_(noms[id]||id)+'</span>'+
              '<button type="button" class="soreal-idle-expand-button-v25" aria-label="Voir" title="Voir cet orage" onclick="window.__apercuOrageSortIdleV1__(\''+id+'\')">▶</button></div>';
          }).join('')+
        '</div>';
      }

  Object.assign(REG,{
    magieEncoreAGenererIdleV1_:magieEncoreAGenererIdleV1_,
    allocationMetaEnergieIdleV1_:allocationMetaEnergieIdleV1_,
    idleResoudreFractionInputV1_:idleResoudreFractionInputV1_,
    formatEnergieIdleV50_:formatEnergieIdleV50_,
    metaTickEnergieIdleV114_:metaTickEnergieIdleV114_,
    metaTickMagieIdleV1_:metaTickMagieIdleV1_,
    energieDisponibleIdleV9_:energieDisponibleIdleV9_,
    energieGenereeTotaleIdleV1_:energieGenereeTotaleIdleV1_,
    allocationMetaMagieIdleV1_:allocationMetaMagieIdleV1_,
    donneesMagieGenereeIdleV1_:donneesMagieGenereeIdleV1_,
    texteMagieGenereeIdleV1_:texteMagieGenereeIdleV1_,
    texteNiveauParSecondeIdleV1_:texteNiveauParSecondeIdleV1_,
    texteEnergieGenereeIdleV1_:texteEnergieGenereeIdleV1_,
    installerInfobulleEnergieIdleV1_:installerInfobulleEnergieIdleV1_,
    rafraichirEnergieEtBoutonsIdleV9_:rafraichirEnergieEtBoutonsIdleV9_,
    messageFlottantIdleV32_:messageFlottantIdleV32_,
    acheterSortIdleV90_:acheterSortIdleV90_,
    lancerSortIdleV90_:lancerSortIdleV90_,
    pageMagieIdleV90_:pageMagieIdleV90_,
    actualiserManaSortsIdleV90_:actualiserManaSortsIdleV90_,
    rendreBarreEnergiePersistanteIdleV1_:rendreBarreEnergiePersistanteIdleV1_,
    htmlReglagesOrageSortsIdleV1_:htmlReglagesOrageSortsIdleV1_
  });
})();
