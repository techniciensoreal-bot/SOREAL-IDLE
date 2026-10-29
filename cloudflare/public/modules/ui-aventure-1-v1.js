/*
 * SOREAL IDLE — Aventure (zones, combat d'aventure, équipement) (partie 1) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_aventure_1_v1)return;
  REG.__chargé_ui_aventure_1_v1=true;

  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function catalogueSetsCollectionIdleV164_(){return REG.catalogueSetsCollectionIdleV164_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function rafraichirEnergieEtBoutonsIdleV9_(){return REG.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
  function refuserEquipementDefiIdleV1_(){return REG.refuserEquipementDefiIdleV1_.apply(null,arguments);}
  function planifierRenduOptimisteIdleV60_(){return REG.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
  function ajouterActionRapideIdleV60_(){return REG.ajouterActionRapideIdleV60_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function arreterCombatAutoIdleV30_(){return REG.arreterCombatAutoIdleV30_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function fermerPopupRenaissanceIdleV63_(){return REG.fermerPopupRenaissanceIdleV63_.apply(null,arguments);}
  function journalCombatEstEnBasV70_(){return REG.journalCombatEstEnBasV70_.apply(null,arguments);}
  function cloneInventaireIdleV160_(){return REG.cloneInventaireIdleV160_.apply(null,arguments);}
  function marquePerfInventaireIdleV160_(){return REG.marquePerfInventaireIdleV160_.apply(null,arguments);}
  function patchResumeInventaireIdleV160_(){return REG.patchResumeInventaireIdleV160_.apply(null,arguments);}
  function patchGrilleSacInventaireIdleV160_(){return REG.patchGrilleSacInventaireIdleV160_.apply(null,arguments);}
  function rendreTrashAdventureIdleV165_(){return REG.rendreTrashAdventureIdleV165_.apply(null,arguments);}
  function patchEquipementInventaireIdleV160_(){return REG.patchEquipementInventaireIdleV160_.apply(null,arguments);}
  function patchCoffreInventaireIdleV160_(){return REG.patchCoffreInventaireIdleV160_.apply(null,arguments);}
  function patchBonusInventaireIdleV160_(){return REG.patchBonusInventaireIdleV160_.apply(null,arguments);}
  function restaurerFicheInventaireIdleV160_(){return REG.restaurerFicheInventaireIdleV160_.apply(null,arguments);}
  function appliquerMutationOptimisteInventaireIdleV160_(){return REG.appliquerMutationOptimisteInventaireIdleV160_.apply(null,arguments);}
  function recalculerUtilisationInventaireIdleV160_(){return REG.recalculerUtilisationInventaireIdleV160_.apply(null,arguments);}
  function enfilerMutationInventaireIdleV160_(){return REG.enfilerMutationInventaireIdleV160_.apply(null,arguments);}
  function basicTrainingIdleV120_(){return REG.basicTrainingIdleV120_.apply(null,arguments);}
  function systemeMetaParIdIdleV130_(){return REG.systemeMetaParIdIdleV130_.apply(null,arguments);}
  function urlMobR2IdleV1_(){return REG.urlMobR2IdleV1_.apply(null,arguments);}
  function restPvInitialIdleV1_(){return REG.restPvInitialIdleV1_.apply(null,arguments);}
  function pageInventaireIdleV28_(){return REG.pageInventaireIdleV28_.apply(null,arguments);}

      function idleNombre_(v){
        const n=Number(v);
        return Number.isFinite(n)?n:0;
      }

      function idleEntier_(v){
        return Math.max(0,Math.floor(idleNombre_(v)));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-23 */
      function pousserEtatVersRuntimePartageIdleV1_(){
        if(
          window.__SOREAL_IDLE_RUNTIME_V1__&&
          typeof window.__SOREAL_IDLE_RUNTIME_V1__.pushState==='function'
        ){
          window.__SOREAL_IDLE_RUNTIME_V1__.pushState(REG.idleEtat);
        }
      }

      /*
       * 2026-09-23 : les nombres de PV / regen changeaient de largeur à chaque
       * rafraîchissement (formatGrandNombreIdleV70_ retire les zéros finaux :
       * "1.60" devenait "1.6") et le suffixe de regen disparaissait dès que les
       * PV étaient pleins, d'où un affichage qui clignote et dont les chiffres
       * bougent. Décimales fixes ici, suffixe toujours présent tant que la
       * regen est > 0, et chiffres tabulaires (soreal-idle-ui.css).
       */
      /*
       * Chiffres de vie du duel : TOUJOURS deux décimales, quelle que soit la valeur (Norman, 2026-10-02 : « de 35,04 à 35 les chiffres bougent ; 35,5 au lieu de 35,50
       * aussi »). « 35,00 » reste « 35,00 », « 1,50K » reste « 1,50K » : le nombre de caractères ne dépend que de l'ordre de grandeur, jamais du dernier chiffre.
       */
      function formaterPvFixeIdleV1_(valeur){
        const n=Math.max(0,idleNombre_(valeur));
        if(n<1000)return n.toFixed(2).replace('.',',');
        const rang=Math.floor(Math.log10(n)/3+1e-9);
        /* Mêmes unités que number-format-v1.js (suffixe) : les noms jusqu'à Tg, puis des lettres AA (10^96), AB… (2026-10-25). */
        const noms=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid','Sxd','Spd','Ocd','Nod','Vg','Uvg','Dvg','Tvg','Qavg','Qivg','Sxvg','Spvg','Ocvg','Novg','Tg'];
        const apres=rang-noms.length;
        const unite=rang<noms.length?noms[rang]:(apres<676?String.fromCharCode(65+Math.floor(apres/26))+String.fromCharCode(65+apres%26):null);
        if(unite===null)return n.toExponential(2);
        return (n/Math.pow(1000,rang)).toFixed(2)+unite;
      }

      function formaterDecimalesFixesIdleV1_(valeur,decimales){
        const n=idleNombre_(valeur);
        if(Math.abs(n)>=1000)return formatGrandNombreIdleV70_(n,decimales);
        return n.toFixed(Math.max(0,decimales)).replace('.',',');
      }

      /*
       * Note de combat de l'Aventure (« Prochain combat dans 3 s… ») : le texte change chaque seconde ; la note est maintenant ÉCRITE EN PLACE (textContent) au lieu d'être remplacée en entier (outerHTML) à chaque
       * changement : un nœud de moins retiré et recréé par seconde (audit de la page Aventure, Norman 2026-10-10). Seul le bouton « Combattre » du départ est encore remplacé, une fois.
       */
      function poserNoteCombatAdventureIdleV1_(el,texte){
        if(!el)return;
        if(el.classList&&el.classList.contains('soreal-idle-adventure-fight-note-v1')){
          if(el.textContent!==texte)el.textContent=texte;
          return;
        }
        el.outerHTML='<div class="soreal-idle-adventure-fight-note-v1">'+idleHtml_(texte)+'</div>';
      }

      function libererFocusIdleV24_(){
        const actif=
          document.activeElement;

        if(
          actif &&
          typeof actif.blur==='function'
        ){
          actif.blur();
        }
      }

      /*
       * Annonces en fondu (2026-09-26, Norman) : set complété (« est-ce qu'on a bien les récompenses ? ») et Tutorial Cube devenu Infinity Cube
       * (« les gens ne vont pas comprendre ce qu'il s'est passé »). On compare l'état de l'Aventure à chaque seconde ; le premier état observé sert
       * de référence (rien n'est annoncé au chargement pour ce qui était déjà acquis).
       */
      let idleEvenementsVusV1=null;

      function surveillerEvenementsAventureIdleV1_(){
        const a=REG.idleEtat?aventureMetaIdleV47_(REG.idleEtat):null;
        if(!a||typeof a!=='object')return;
        const complets=a.completedSets&&typeof a.completedSets==='object'?Object.keys(a.completedSets).filter(function(k){return a.completedSets[k];}):[];
        const cube=Boolean(a.cube&&a.cube.unlocked);
        if(idleEvenementsVusV1===null){
          idleEvenementsVusV1={sets:new Set(complets),cube:cube};
          return;
        }
        const notice=window.__sorealFadeNoticeV1__;
        complets.forEach(function(setId){
          if(idleEvenementsVusV1.sets.has(setId))return;
          idleEvenementsVusV1.sets.add(setId);
          if(typeof notice!=='function')return;
          let def=null;
          try{def=catalogueSetsCollectionIdleV164_(a)[setId]||null;}catch(_e){}
          const libelle=def&&def.reward?libelleRecompenseSetAdventureIdleV163_(def.reward):'';
          /* Norman (2026-09-27) : « je veux un son de victoire en même temps que la notification fade in fade out apparait. » */
          jouerEffetAudioIdleV199_('setComplete');
          notice('🧩 Set complété : '+String((def&&def.name)||setId),[libelle?'Bonus obtenu : '+libelle:'Bonus du set obtenu !']);
        });
        if(cube&&!idleEvenementsVusV1.cube){
          idleEvenementsVusV1.cube=true;
          if(typeof notice==='function'){
            notice('🧊 Infinity Cube débloqué !',[
              'Ton Tutorial Cube a atteint le niveau 100 : il s’est transformé en Infinity Cube.',
              'Il prend place à côté de ton arme. Glisse-y tes boosts : ils sont convertis en Power et Toughness, sans limite.'
            ],{dureeMs:7000});
          }
        }else if(!cube){
          idleEvenementsVusV1.cube=false;
        }
      }

      function rendrePendingIdleV7_(){
        ['force','endurance','organisation']
          .forEach(function(type){
            const el=
              document.getElementById(
                'sorealIdlePendingV7_'+type
              );

            if(!el)return;

            const q=
              idleEntier_(
                REG.idleAchatsEnAttenteV7[type]
              )+
              idleEntier_(
                REG.idleAchatsEnvoyesV23[type]
              );

            el.textContent=
              q>0
                ?' +'+q+' réservé'
                :'';
          });

        rafraichirEnergieEtBoutonsIdleV9_();
      }

      function idleFastCountObjectV60_(
        objet
      ){
        return Object.keys(
          objet||{}
        ).reduce(
          function(total,cle){
            return total+
              Math.max(
                0,
                idleEntier_(
                  objet[cle]
                )
              );
          },
          0
        );
      }

      function equiperObjetIdleV10_(
        objetId
      ){
        libererFocusIdleV24_();

        if(
          !REG.idleEtat ||
          !objetId ||
          !SOREAL_SESSION
        ){
          return;
        }

        jouerEffetAudioIdleV199_('equip');

        const inventaire=
          Array.isArray(
            REG.idleEtat.inventaire
          )
            ?REG.idleEtat.inventaire
            :[];

        const objet=
          inventaire.find(
            function(item){
              return String(
                item&&item.id||''
              )===
              String(
                objetId
              );
            }
          );

        if(!objet){
          return;
        }

        if(!REG.idleEtat.equipement){
          REG.idleEtat.equipement={};
        }

        const slot=
          String(
            objet.slot||''
          );

        const ancien=
          REG.idleEtat.equipement[
            slot
          ]||null;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-95 */
        REG.idleEtat.equipement[
          slot
        ]=
          objet;

        if(!ancien){
          REG.idleEtat.inventaireUtilise=
            Math.max(
              0,
              idleEntier_(
                REG.idleEtat.inventaireUtilise
              )-1
            );

          REG.idleEtat.inventaireLibre=
            Math.max(
              0,
              idleEntier_(
                REG.idleEtat.inventaireCapacite
              )-
              idleEntier_(
                REG.idleEtat.inventaireUtilise
              )
            );
        }

        if(!REG.idleEtat.forge){
          REG.idleEtat.forge={};
        }

        const forgeMeta=
          REG.idleEtat.forgeMeta||{
            base:5,
            croissance:1.65
          };

        const forgeNiveau=
          idleEntier_(
            objet.forge
          );

        REG.idleEtat.forge[slot]={
          niveau:
            forgeNiveau,
          cout:
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  forgeMeta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      forgeMeta.croissance
                    )
                  ),
                  forgeNiveau
                )
              )
            )
        };

        const delta=
          idleNombre_(
            objet.bonusPuissance
          )-
          idleNombre_(
            ancien&&ancien.bonusPuissance
          );

        REG.idleEtat.bonusEquipement=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.bonusEquipement
            )+
            delta
          );

        REG.idleEtat.puissance=
          Math.max(
            1,
            idleNombre_(
              REG.idleEtat.puissance
            )+
            delta
          );

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'equip',
          String(objetId)
        );

        messageFlottantIdleV32_(
          '🛡️ Équipé'
        );
      }

      function acheterAmeliorationIdleV12_(
        type
      ){
        libererFocusIdleV24_();

        if(
          !REG.idleEtat ||
          !SOREAL_SESSION ||
          [
            'production',
            'capacite',
            'puissance'
          ].indexOf(type)===-1
        ){
          return;
        }

        const cout=
          idleEntier_(
            REG.idleEtat &&
            REG.idleEtat.coutsBoutique &&
            REG.idleEtat.coutsBoutique[type]
          );

        if(cout<=0){
          messageFlottantIdleV32_(
            '❌ Coût introuvable.'
          );
          return;
        }

        if(
          idleEntier_(
            REG.idleEtat.pieces
          )<cout
        ){
          messageFlottantIdleV32_(
            '❌ Pas assez d’or.'
          );
          return;
        }

        if(!REG.idleEtat.ameliorations){
          REG.idleEtat.ameliorations={
            production:0,
            capacite:0,
            puissance:0
          };
        }

        REG.idleEtat.pieces=
          Math.max(
            0,
            idleEntier_(
              REG.idleEtat.pieces
            )-
            cout
          );

        REG.idleEtat.ameliorations[type]=
          idleEntier_(
            REG.idleEtat.ameliorations[type]
          )+1;

        const niveau=
          idleEntier_(
            REG.idleEtat.ameliorations[type]
          );

        const meta=
          REG.idleEtat &&
          REG.idleEtat.boutiqueMeta &&
          REG.idleEtat.boutiqueMeta[type]
            ?REG.idleEtat.boutiqueMeta[type]
            :null;

        if(
          meta &&
          REG.idleEtat.coutsBoutique
        ){
          REG.idleEtat.coutsBoutique[type]=
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  meta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      meta.croissance
                    )
                  ),
                  niveau
                )
              )
            );

          if(!REG.idleEtat.bonusBoutique){
            REG.idleEtat.bonusBoutique={};
          }

          const ancienBonusV111=
            idleNombre_(
              REG.idleEtat.bonusBoutique[type]
            );

          const nouveauBonusV111=
            niveau*
            idleNombre_(
              meta.bonusParNiveau
            );

          REG.idleEtat.bonusBoutique[type]=
            nouveauBonusV111;

          const deltaBonusV111=
            nouveauBonusV111-
            ancienBonusV111;

          if(type==='production'){
            REG.idleEtat.productionSeconde=
              Math.max(
                .01,
                idleNombre_(
                  REG.idleEtat.productionSeconde
                )+
                deltaBonusV111
              );
          }else if(type==='capacite'){
            REG.idleEtat.energieMax=
              Math.max(
                1,
                idleNombre_(
                  REG.idleEtat.energieMax
                )+
                deltaBonusV111
              );
          }else if(type==='puissance'){
            REG.idleEtat.puissance=
              Math.max(
                1,
                idleNombre_(
                  REG.idleEtat.puissance
                )+
                deltaBonusV111
              );
          }
        }

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'shop',
          type
        );
      }

      function zoneAventureLocaleIdleV30_(
        zoneId
      ){
        const zones=
          REG.idleEtat &&
          REG.idleEtat.aventure &&
          Array.isArray(
            REG.idleEtat.aventure.zones
          )
            ?REG.idleEtat.aventure.zones
            :[];

        const id=
          idleEntier_(
            zoneId
          );

        return zones.find(
          function(z){
            return (
              idleEntier_(z.id)===
              id
            );
          }
        ) || null;
      }

      function cooldownAventureRestantIdleV100_(){
        const fin=
          REG.idleEtat&&
          REG.idleEtat.aventure
            ?Math.max(
                0,
                idleNombre_(
                  REG.idleEtat.aventure.cooldownJusqua
                )
              )
            :0;

        return Math.max(
          0,
          (
            fin-
            heureServeurIdleV1_()
          )/
          1000
        );
      }

      function actualiserCooldownAventureIdleV100_(
        maintenant
      ){
        if(
          !REG.idleEtat ||
          !REG.idleEtat.aventure
        ){
          return;
        }

        const fin=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.aventure.cooldownJusqua
            )
          );

        const restant=
          Math.max(
            0,
            (
              fin-
              maintenant
            )/
            1000
          );

        document
          .querySelectorAll(
            '[id^="sorealIdleAdventureCooldown_"]'
          )
          .forEach(function(el){
            el.textContent=
              restant>0.01
                ?'⏳ Prochaine rencontre dans '+
                  restant.toFixed(1)+
                  ' s'
                :'✅ Rencontre disponible';

            el.classList.toggle(
              'ready',
              restant<=0.01
            );
          });

        const zones=
          REG.idleEtat.aventure&&
          Array.isArray(
            REG.idleEtat.aventure.zones
          )
            ?REG.idleEtat.aventure.zones
            :[];

        document
          .querySelectorAll(
            '.soreal-idle-zone-button-v16[data-aventure-zone]'
          )
          .forEach(function(button){
            const id=
              idleEntier_(
                button.getAttribute(
                  'data-aventure-zone'
                )
              );

            const zone=
              zones.find(function(z){
                return idleEntier_(z.id)===id;
              });


            button.disabled=
              Boolean(
                REG.idleAventureEnCoursV17 ||
                !zone ||
                !zone.debloquee
              );
          });
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-101 */
      function combattreAventureIdleV17_(
        zoneId
      ){
        // IDLE_ADVENTURE_NO_ENERGY_V44 : Aventure (V47 comme cette
        // ancienne mécanique) est indépendante de l'énergie.
        REG.idleReserveAventureV23=0;

        arreterCombatAutoIdleV30_(
          '🤖 Combat automatique désactivé : ancienne mécanique retirée.'
        );
      }

      function renaitreIdleV14_(){
        libererFocusIdleV24_();

        if(REG.idleRenaissanceEnCoursV14){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-105 */
        if(
          !REG.idleEtat ||
          !REG.idleEtat.renaissance ||
          !REG.idleEtat.renaissance.debloquee
        ){
          toastIdleV5_(
            'Rebirth pas encore disponible : il faut au moins 3 minutes de run avant de pouvoir renaître.'
          );

          return;
        }

        const gain=Math.max(1,idleNombre_(REG.idleEtat&&REG.idleEtat.renaissance&&REG.idleEtat.renaissance.nextNumber||1));

        fermerPopupRenaissanceIdleV63_();

        const modal=
          document.createElement(
            'div'
          );

        modal.id=
          'sorealIdleRenaissanceModalV63';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="Confirmer la Renaissance">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">♻️</div>'+
              '<div class="soreal-idle-modal-title-v63">Nouvelle Renaissance</div>'+
              '<div class="soreal-idle-modal-gain-v63">+'+
                idleEntier_(gain)+
                ' nombre</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-modal-info-v63">'+
                '<strong>Le cycle recommence.</strong><br>'+
                'Boss du run, niveaux de Basic Training et progressions temporaires du run seront remis à zéro.<br><br>'+
                '<strong>Conservé :</strong> inventaire, équipement, sets, collection, progression Aventure, capacité du sac et toutes les progressions permanentes (NGU, Perks, Quirks, Hacks, Wishes, Cards, MacGuffins…).'+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupRenaissanceIdleV63__()">Annuler</button>'+
              '<button type="button" class="soreal-idle-modal-button-v63 confirm" onclick="window.__executerRenaissanceIdleV63__()">♻️ Renaître</button>'+
            '</div>'+
          '</div>';

        modal.addEventListener(
          'click',
          function(event){
            if(event.target===modal){
              fermerPopupRenaissanceIdleV63_();
            }
          }
        );

        document.body.appendChild(
          modal
        );
      }

      /* Pose tout de suite la classe rouge clignotante sur le bouton Adventure (sans attendre le prochain rendu du menu) quand on est mis K.O. hors du menu Adventure. */
      function marquerBoutonAventureKoIdleV1_(){
        if(REG.idleMenuActifV28==='aventure')return;
        try{
          const bouton=document.querySelector('.soreal-idle-nav-button-v28[data-menu-id-v1="aventure"]');
          if(bouton)bouton.classList.add('soreal-idle-nav-adventure-ko-v1');
        }catch(e){}
      }

      function formatGrandNombreIdleV70_(valeur,decimales){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        return api&&typeof api.grandNombre==='function'
          ?api.grandNombre(valeur,decimales)
          :String(Math.round(idleNombre_(valeur)));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-139 */
      let idleAdventureLogV1=[];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-140 */
      let idleAdventureLogAutoScrollV1_=true;

      let idleAdventureLogScrollMemoV1_=0;

      let idleAdventureLogResumeTimerV1_=null;

      /* Norman (2026-10-29) : le journal de combat revient tout en bas après 10 secondes sans qu'on y touche (molette, appui ou défilement repoussent l'échéance). */
      const IDLE_ADVENTURE_LOG_RESUME_MS_V1=10000;

      /*
       * critique (2026-09-27, Norman : « Quand on met ou recoit un coup critique ») : suffixe
       * visuel distinct sur la ligne de dégâts, jamais un type à part -- la ligne garde sa
       * couleur habituelle (manual/player/enemy), seul "💥 Coup critique !" accroche l'œil.
       */
      function ajouterLogAventureIdleV1_(type,texte,rareteClasse,critique){
        const classe=String(rareteClasse||'');
        idleAdventureLogV1.push({
          type:String(type||'system'),
          texte:String(texte||''),
          rareteClasse:/^idle-loot-rarity-[0-6]$/.test(classe)?classe:'',
          critique:Boolean(critique)
        });
        if(idleAdventureLogV1.length>80){
          idleAdventureLogV1.splice(0,idleAdventureLogV1.length-80);
        }
        dessinerJournalAventureIdleV1_();
      }

      /*
       * Norman (2026-09-27) : « Parfois, je meurs en mode aventure et dans le journal de combat, ma mort
       * n'apparaît pas. » Cause : une mort par combat automatique (en ligne ou hors ligne) se résout entièrement
       * côté serveur, jamais via terminerCombatAdventureLocalV2_ (le seul autre endroit qui alimente le journal).
       * j.autoAventureHorsLigne (combats/victoires/defaites) est le delta calculé PAR CE SYNC UNIQUEMENT (jamais
       * cumulatif) -- on ne le traite donc qu'une fois par réponse serveur réellement nouvelle (serveurTs change à
       * chaque appel), pour ne jamais logger deux fois le même lot en cas de nouveaux rendus sans nouvelle synchro.
       */
      let idleDerniereSyncAutoDefaiteAventureV1_=0;

      function verifierDefaiteAutoAventureIdleV1_(j){
        const ts=idleNombre_(j&&j.serveurTs);
        if(!ts||ts===idleDerniereSyncAutoDefaiteAventureV1_)return;
        idleDerniereSyncAutoDefaiteAventureV1_=ts;
        const infos=j&&j.autoAventureHorsLigne;
        const defaites=Math.max(0,idleEntier_(infos&&infos.defaites));
        if(defaites<=0)return;
        /*
         * Norman (2026-09-29) : « il devra pouvoir lire dans le journal de combat la manière dont il est mort. »
         * derniereDefaite (monstre/zone/ko de la défaite qui a arrêté le farm) précise le récit générique
         * ci-dessous quand le serveur le fournit ; sinon (anciens clients, ou champ manquant) le message
         * générique reste identique au comportement historique.
         */
        const d=infos&&infos.derniereDefaite;
        const cible=d?[d.monstre,d.zone].filter(Boolean).join(' · '):'';
        if(cible){
          const suffixe=defaites>1?' ('+defaites+' défaites au total pendant ton absence)':'';
          ajouterLogAventureIdleV1_(
            'enemy',
            (d.ko
              ?'💀 Tu as été mis K.O. par '+cible+' pendant ton absence.'
              :'⏱️ Le combat contre '+cible+' a traîné trop longtemps pendant ton absence : le farm automatique s’est arrêté.')+
              suffixe
          );
          return;
        }
        ajouterLogAventureIdleV1_(
          'enemy',
          defaites>1
            ?'⚔️ Combat automatique : tu as été mis K.O. '+defaites+' fois pendant ton absence.'
            :'⚔️ Combat automatique : tu as été mis K.O. pendant ton absence.'
        );
      }

      /* Rendu d'une ligne, partagé entre le journal live (dessinerJournalAventureIdleV1_) et le rendu complet de la page Aventure (même markup dupliqué avant ce correctif). */
      function rendreLigneJournalAventureIdleV1_(l){
        const suffixeCritique=l.critique?' <span class="soreal-idle-adventure-log-crit-v1">💥 Coup critique !</span>':'';
        return '<div class="soreal-idle-adventure-log-line-v1 '+idleHtml_(l.type)+(l.rareteClasse?' '+idleHtml_(l.rareteClasse):'')+'">'+idleHtml_(l.texte)+suffixeCritique+'</div>';
      }

      function dessinerJournalAventureIdleV1_(){
        const host=document.getElementById('sorealIdleAdventureLogV1');
        if(!host)return;
        attacherEcouteurScrollJournalAventureIdleV1_(host);
        /*
         * Journal incrémental (audit de la page Aventure, Norman 2026-10-10) : avant, chaque nouvelle ligne faisait REDESSINER les 80 lignes (innerHTML) ; on ne retire maintenant que les lignes sorties du journal et on
         * n'ajoute que les nouvelles. Si le contenu de l'élément ne correspond plus à ce qui a été dessiné (page redessinée), on repart d'un dessin complet.
         */
        if(!idleAdventureLogV1.length){
          host.__htmlLignesV1=null;
          host.innerHTML='<div class="soreal-idle-adventure-log-line-v1 system">Le journal commencera au prochain combat.</div>';
        }else{
          const nouvelles=idleAdventureLogV1.map(rendreLigneJournalAventureIdleV1_);
          const anciennes=host.__htmlLignesV1;
          let fait=false;
          if(Array.isArray(anciennes)&&anciennes.length&&host.children.length===anciennes.length){
            const n=anciennes.length;
            let k=0;
            for(;k<n;k+=1){
              let ok=true;
              for(let i=0;i<n-k;i+=1){if(i>=nouvelles.length||anciennes[k+i]!==nouvelles[i]){ok=false;break;}}
              if(ok)break;
            }
            if(k<n){
              for(let i=0;i<k;i+=1)host.removeChild(host.firstChild);
              for(let i=n-k;i<nouvelles.length;i+=1)host.insertAdjacentHTML('beforeend',nouvelles[i]);
              fait=true;
            }
          }
          if(!fait)host.innerHTML=nouvelles.join('');
          host.__htmlLignesV1=nouvelles;
        }
        /* Défilement vers le bas groupé : lire scrollHeight juste après avoir écrit une ligne FORCE la mise en page à chaque ligne (journal de Norman, 2026-10-20 : 71 % du temps de script passé à forcer des mises en page). Une seule lecture par image, au moment où le navigateur va de toute façon calculer la page. */
        if(idleAdventureLogAutoScrollV1_&&!host.__defilementProgrammeV1){
          host.__defilementProgrammeV1=true;
          requestAnimationFrame(function(){
            host.__defilementProgrammeV1=false;
            if(idleAdventureLogAutoScrollV1_&&host.isConnected)host.scrollTop=host.scrollHeight;
          });
        }
      }

      function gererScrollJournalAventureIdleV1_(event){
        const host=event&&event.currentTarget;
        if(!host)return;
        const enBas=journalCombatEstEnBasV70_(host);
        idleAdventureLogAutoScrollV1_=enBas;
        idleAdventureLogScrollMemoV1_=host.scrollTop;

        clearTimeout(idleAdventureLogResumeTimerV1_);
        if(!enBas){
          idleAdventureLogResumeTimerV1_=setTimeout(function(){
            idleAdventureLogAutoScrollV1_=true;
            const hostActuel=document.getElementById('sorealIdleAdventureLogV1');
            if(hostActuel)hostActuel.scrollTop=hostActuel.scrollHeight;
          },IDLE_ADVENTURE_LOG_RESUME_MS_V1);
        }
      }

      function attacherEcouteurScrollJournalAventureIdleV1_(host){
        if(!host||host.dataset.idleScrollBoundV1==='1')return;
        host.dataset.idleScrollBoundV1='1';
        host.addEventListener('scroll',gererScrollJournalAventureIdleV1_,{passive:true});
        ['wheel','pointerdown','touchstart'].forEach(function(nom){host.addEventListener(nom,function(){if(!idleAdventureLogAutoScrollV1_)gererScrollJournalAventureIdleV1_({currentTarget:host});},{passive:true});});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-141 */
      function restaurerScrollJournalAventureIdleV1_(){
        const host=document.getElementById('sorealIdleAdventureLogV1');
        if(!host)return;
        attacherEcouteurScrollJournalAventureIdleV1_(host);
        host.scrollTop=idleAdventureLogAutoScrollV1_
          ?host.scrollHeight
          :Math.min(idleAdventureLogScrollMemoV1_,host.scrollHeight);
      }

      function resumeStatsIdleV28_(j){
        const combat=j&&j.combatPrincipal?j.combatPrincipal:{};
        const systemes=j&&j.systemes?j.systemes:{};
        const monnaies=systemes.currencies||{};
        const records=systemes.records||{};
        const number=
          j&&j.renaissance&&j.renaissance.number!==undefined
            ?j.renaissance.number
            :j&&j.renaissance&&j.renaissance.multiplicateur!==undefined
              ?j.renaissance.multiplicateur
              :1;
        const apVisible=Boolean(
          idleNombre_(monnaies.ap)>0||
          (systemes.selloutShop&&systemes.selloutShop.unlockedEver)
        );
        const rebirths=Math.max(0,idleEntier_(records.totalRebirths||0));
        /* Temps du Rebirth en cours (Norman, 2026-10-24 : « une info qu'on aime avoir sous l'œil ») : une case de plus, seulement une fois le menu Renaissance découvert (règle n°2). Mise à jour chaque seconde par modules/temps-rebirth-v1.js. */
        let tempsRebirth='';
        try{
          if(REG.menuDisponibleIdleV28_&&REG.menuDisponibleIdleV28_('renaissance',j)){
            const api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
            if(api&&typeof api.runSecondes==='function')tempsRebirth='<div class="soreal-idle-summary-v28" data-tuile="rebirth" title="Temps du Rebirth en cours">⏱️ Temps<b id="sorealIdleSummaryRebirthTempsV1" data-sans-traduction>'+api.duree(api.runSecondes(j))+'</b></div>';
          }
        }catch(_e){tempsRebirth='';}

        /* Bouton plein écran / écran normal (modules/plein-ecran-v1.js) : dernière case de la rangée, PC seulement ; --nb-tuiles réserve sa colonne. */
        const nbTuiles=4+(apVisible?1:0)+(tempsRebirth?1:0);
        const boutonPleinEcran='<button type="button" class="soreal-idle-pe-v1" onclick="window.__sorealPleinEcranV1__&amp;&amp;window.__sorealPleinEcranV1__()" title="Plein écran ou écran normal" aria-label="Plein écran ou écran normal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="pe-ent" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path class="pe-sor" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg></button>';

        return `
          <div class="soreal-idle-summary-grid-v28" style="--nb-tuiles:${nbTuiles}">
            <div class="soreal-idle-summary-v28" data-tuile="attack">
              ⚔️ Attaque
              <b id="sorealIdleSummaryAttackV50">${formatGrandNombreIdleV70_(combat.attaque||j.puissance||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28" data-tuile="defense">
              🛡️ Défense
              <b id="sorealIdleSummaryDefenseV50">${formatGrandNombreIdleV70_(combat.defense||j.defense||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28" data-tuile="gold">
              🪙 Or
              <b id="sorealIdleSummaryGoldV50">${formatGrandNombreIdleV70_(monnaies.gold||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28" data-tuile="exp">
              ⭐ EXP
              <b id="sorealIdleSummaryExpV50">${formatGrandNombreIdleV70_(monnaies.experience||j.xp||0)}</b>
            </div>
            ${apVisible
              ?`<div class="soreal-idle-summary-v28" data-tuile="ap">
                  💠 AP
                  <b id="sorealIdleSummaryApV210">${formatGrandNombreIdleV70_(monnaies.ap||0)}</b>
                </div>`
              :''}
            ${tempsRebirth}
            ${boutonPleinEcran}
          </div>
        `;
      }

      function aventureMetaIdleV47_(j){
        return j&&j.systemes&&j.systemes.adventure&&typeof j.systemes.adventure==='object'
          ?j.systemes.adventure
          :null;
      }

      function aventureDebloqueeIdleV47_(j){
        const a=aventureMetaIdleV47_(j);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        return zones.some(function(z){return z&&z.id==='tutorial'&&z.unlocked;});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-178 */
      const IDLE_INVENTORY_ACTIONS_V160=new Set([
        'equip','unequip','merge','boost','cube','discard','setLock',
        'trashPut','trashRecover','coffreDeposer','coffreRetirer','reorderInventory'
      ]);

      let idleAdventureSnapshotDiffereV208=null;

      const IDLE_ADVENTURE_INVENTORY_FIELDS_V208=[
        'inventory','inventorySlots','equipment','itemList',
        'completedSets','setRewards','permanent','unlockItems','unlockFlags',
        'skillState','cube','cubeTier','inventoryCapacity','inventoryUsed',
        'accessorySlotsCapacity','stats','trash','coffreSlots','secondWeaponUnlocked','dualWieldRatio','theEnd'
      ];

      function revisionAdventureServeurIdleV208_(a){
        return Math.max(0,idleEntier_(a&&a.revision));
      }

      function fusionnerAdventureServeurAvecInventaireLocalV208_(serveur,local){
        if(!serveur)return serveur;
        if(!local)return cloneInventaireIdleV160_(serveur);
        const fusion=cloneInventaireIdleV160_(serveur);
        IDLE_ADVENTURE_INVENTORY_FIELDS_V208.forEach(function(cle){
          if(Object.prototype.hasOwnProperty.call(local,cle)){
            fusion[cle]=cloneInventaireIdleV160_(local[cle]);
          }
        });
        return fusion;
      }

      function joueurAvecAdventureIdleV208_(joueur,aventure){
        if(!joueur||!aventure)return joueur;
        const copie=Object.assign({},joueur);
        copie.systemes=Object.assign({},joueur.systemes||{});
        copie.systemes.adventure=aventure;
        return copie;
      }

      function memoriserAdventureDiffereeIdleV208_(aventure){
        if(!aventure)return;
        const revision=revisionAdventureServeurIdleV208_(aventure);
        const precedente=revisionAdventureServeurIdleV208_(
          idleAdventureSnapshotDiffereV208
        );
        if(!idleAdventureSnapshotDiffereV208||revision>precedente){
          idleAdventureSnapshotDiffereV208=
            cloneInventaireIdleV160_(aventure);
        }
      }

      function appliquerAdventureDiffereeIdleV208_(){
        if(
          REG.idleInventoryBusyV160||
          REG.idleInventoryMutationQueueV160.length||
          !idleAdventureSnapshotDiffereV208||
          !REG.idleEtat
        ){
          return false;
        }

        const differee=idleAdventureSnapshotDiffereV208;
        idleAdventureSnapshotDiffereV208=null;

        const revisionDifferee=
          revisionAdventureServeurIdleV208_(differee);
        const revisionConfirmee=
          revisionAdventureServeurIdleV208_(
            REG.idleInventoryConfirmedAdventureV160
          );

        if(revisionDifferee<=revisionConfirmee){
          return false;
        }

        const courant=aventureMetaIdleV47_(REG.idleEtat);
        const fightLocal=
          courant&&courant.fight&&courant.fight.active
            ?cloneInventaireIdleV160_(courant.fight)
            :null;
        const prochain=cloneInventaireIdleV160_(differee);
        if(fightLocal)prochain.fight=fightLocal;

        REG.idleEtat.systemes=Object.assign({},REG.idleEtat.systemes||{});
        REG.idleEtat.systemes.adventure=prochain;
        REG.idleInventoryConfirmedAdventureV160=
          cloneInventaireIdleV160_(differee);
        REG.idleAdventureRevisionServeurV208=Math.max(
          REG.idleAdventureRevisionServeurV208,
          revisionDifferee
        );

        pousserEtatVersRuntimePartageIdleV1_();
        patchInventaireAdventureIdleV160_(
          REG.idleEtat,
          {action:'reconcile-v208',confirmed:true}
        );
        return true;
      }

      function estMutationInventaireAdventureIdleV160_(payload){
        return Boolean(
          payload&&
          IDLE_INVENTORY_ACTIONS_V160.has(String(payload.action||''))
        );
      }

      function casesSacAdventureIdleV162_(a){
        if(!a)return [];
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        const itemById=new Map(items.map(function(item){
          return [String(item&&item.id||''),item];
        }));
        const equipes=new Set();
        REG.ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
          const id=equipment[slot];
          if(id)equipes.add(String(id));
        });
        (Array.isArray(equipment.accessories)?equipment.accessories:[])
          .forEach(function(id){if(id)equipes.add(String(id));});

        const capacite=Math.max(0,idleEntier_(a.inventoryCapacity||24));
        const cases=Array(capacite).fill(null);
        const places=new Set();
        const ordre=Array.isArray(a.inventorySlots)?a.inventorySlots:[];

        for(let i=0;i<Math.min(capacite,ordre.length);i+=1){
          const id=String(ordre[i]||'');
          const item=id?itemById.get(id):null;
          if(item&&!equipes.has(id)&&!places.has(id)){
            cases[i]=item;
            places.add(id);
          }
        }

        items.forEach(function(item){
          const id=String(item&&item.id||'');
          if(!id||equipes.has(id)||places.has(id))return;
          const libre=cases.indexOf(null);
          if(libre>=0){
            cases[libre]=item;
            places.add(id);
          }
        });
        return cases;
      }

      function modeleInventaireAdventureIdleV160_(j){
        const a=aventureMetaIdleV47_(j);
        if(!a)return null;
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        const itemById=new Map(items.map(function(i){return [String(i.id),i];}));
        const sacItems=casesSacAdventureIdleV162_(a);
        const capacite=Math.max(0,idleEntier_(a.inventoryCapacity||24));
        const utilise=idleEntier_(
          a.inventoryUsed!=null?a.inventoryUsed:sacItems.filter(Boolean).length
        );
        return {
          a:a,
          items:items,
          equipment:equipment,
          itemById:itemById,
          sacItems:sacItems,
          capacite:capacite,
          utilise:utilise,
          cube:a.cube||{},
          cubeTier:a.cubeTier,
          accessorySlotsCapacity:idleEntier_(a.accessorySlotsCapacity||2),
          secondWeaponUnlocked:Boolean(a.secondWeaponUnlocked),
          theEnd:a.theEnd
        };
      }

      function patchInventaireAdventureIdleV160_(j,options){
        if(
          REG.idleMenuActifV28!=='aventure'||
          !j||
          !aventureMetaIdleV47_(j)
        ){
          return false;
        }

        if(REG.idleAdventureDragIdV138){
          REG.idleInventoryDeferredPatchV160=true;
          return false;
        }

        const opt=options||{};
        const action=String(opt.action||'');
        /* audit 2026-10-13 : un patch différé (après un glisser-déposer) ou une réconciliation ne sait pas quelle action a été manquée : on remet alors à jour équipement, coffre et bonus, pas seulement la grille du sac */
        const patchToutV1=action==='deferred'||action==='reconcile-v208';
        const marqueId=opt.transactionId||REG.idleInventorySequenceV160||0;
        marquePerfInventaireIdleV160_('patch-start',marqueId);

        const modele=modeleInventaireAdventureIdleV160_(j);
        if(!modele)return false;

        patchResumeInventaireIdleV160_(modele);
        patchGrilleSacInventaireIdleV160_(modele);

        const trashActuelV165=document.querySelector('[data-idle-trash-slot-v165]');
        /* Changer de page du sac ne touche pas la corbeille (Norman, 2026-10-21) : elle n'est plus recréée. */
        if(trashActuelV165&&action!=='page'){
          const tplTrashV165=document.createElement('template');
          tplTrashV165.innerHTML=
            rendreTrashAdventureIdleV165_(modele.a&&modele.a.trash).trim();
          const trashSuivantV165=tplTrashV165.content.firstElementChild;
          /* Remplacée seulement si elle diffère : sinon l'icône de la corbeille était recréée à chaque mise à jour (clignotement de l'inventaire). */
          if(trashSuivantV165&&!trashActuelV165.isEqualNode(trashSuivantV165))trashActuelV165.replaceWith(trashSuivantV165);
        }

        if(
          patchToutV1||['equip','unequip','merge','boost','cube','setLock'].indexOf(action)!==-1
        ){
          patchEquipementInventaireIdleV160_(modele);
        }

        if(
          patchToutV1||
          action==='coffreDeposer'||
          action==='coffreRetirer'
        ){
          patchCoffreInventaireIdleV160_(modele);
        }

        if(
          patchToutV1||(opt.confirmed&&
          ['equip','unequip','merge','boost','cube'].indexOf(action)!==-1)
        ){
          patchBonusInventaireIdleV160_(modele);
        }

        restaurerFicheInventaireIdleV160_(modele);
        REG.idleInventoryPerfV160.patches+=1;
        REG.idleInventoryPerfV160.globalRendersAvoided+=1;
        marquePerfInventaireIdleV160_('patch-end',marqueId);
        return true;
      }

      function remplacerAdventureInventaireIdleV160_(base){
        if(!REG.idleEtat||!base)return;
        const courant=aventureMetaIdleV47_(REG.idleEtat);
        const fightLocal=courant&&courant.fight&&courant.fight.active
          ?courant.fight
          :null;

        REG.idleEtat.systemes=Object.assign({},REG.idleEtat.systemes||{});
        REG.idleEtat.systemes.adventure=Object.assign(
          {},
          cloneInventaireIdleV160_(base),
          fightLocal?{fight:fightLocal}:{}
        );

        REG.idleInventoryMutationQueueV160.forEach(function(tx){
          appliquerMutationOptimisteInventaireIdleV160_(
            REG.idleEtat.systemes.adventure,
            tx.payload,
            tx.id
          );
        });
        recalculerUtilisationInventaireIdleV160_(
          REG.idleEtat.systemes.adventure
        );
      }

      /* No Equipment Challenge (page Challenges) : on peut changer de tenue mais rien ne compte tant que le défi est actif (Norman, 2026-10-17) ; sert à griser les pièces portées. */
      function equipementBloqueParDefiIdleV1_(){
        const c=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.challenge;
        return Boolean(c&&c.active==='noEquipment');
      }

      function actionAdventureIdleV47_(payload){
        const action=payload||{};
        if(estMutationInventaireAdventureIdleV160_(action)){
          enfilerMutationInventaireIdleV160_(action);
          return;
        }
        actionMetaIdleV130_({
          action:'adventure',
          adventure:action
        });
      }

      /*
       * Choix de zone FIABLE (2026-09-26, Norman : « la flèche droite / gauche n'interrompt pas le combat ; le nom de la zone change mais on
       * continue de combattre dans l'ancienne »). actionMetaIdleV130_ ABANDONNE en silence toute action envoyée pendant qu'une autre est en cours
       * (le combat en envoie en continu) : le nom choisi s'affichait (état local) mais le serveur ne changeait jamais de zone. Le choix est donc
       * mémorisé et renvoyé tant que le canal est occupé (le dernier choix l'emporte), pour les flèches comme pour le menu déroulant.
       */
      let idleZoneCibleEnAttenteV1='';

      let idleZoneTimerV1=0;

      let idleZoneEssaisV1=0;

      function envoyerChoixZoneFiableIdleV1_(){
        clearTimeout(idleZoneTimerV1);
        idleZoneTimerV1=0;
        if(!idleZoneCibleEnAttenteV1)return;
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.estOccupeIdleV130_==='function'&&api.estOccupeIdleV130_()&&idleZoneEssaisV1<80){
          idleZoneEssaisV1+=1;
          idleZoneTimerV1=setTimeout(envoyerChoixZoneFiableIdleV1_,120);
          return;
        }
        const cible=idleZoneCibleEnAttenteV1;
        idleZoneCibleEnAttenteV1='';
        actionAdventureIdleV47_({action:'selectZone',zone:cible});
      }

      function selectionnerZoneAdventureIdleV47_(id){
        const cible=String(id||'safe');
        const a=aventureMetaIdleV47_(REG.idleEtat);
        if(a){
          /*
           * Changer de zone interrompt le combat en cours : le serveur le vide, mais la synchronisation client garde le combat LOCAL tant qu'il est
           * actif (appliquerSynchroCombatSansReflowIdleV116_) — la zone affichée changeait, le combat continuait dans l'ancienne. On l'arrête ici.
           */
          /* Un combat de TITAN se livre en Zone sûre : choisir une zone, Zone sûre comprise, l'arrête (Norman, 2026-10-12). */
          if(a.fight&&a.fight.active&&(String(a.fight.zone||'')!==cible||a.fight.titanId)){
            a.fight={active:false,zone:'',monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};
          }
          a.selectedZone=cible;
          patchZoneAdventureSansReflowIdleV1_(REG.idleEtat);
          pousserEtatVersRuntimePartageIdleV1_();
        }
        idleZoneCibleEnAttenteV1=cible;
        idleZoneEssaisV1=0;
        envoyerChoixZoneFiableIdleV1_();
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-187 */
      function patchZoneAdventureSansReflowIdleV1_(j){
        if(REG.idleMenuActifV28!=='aventure')return;
        const a=aventureMetaIdleV47_(j);
        if(!a)return;
        const selected=String(a.selectedZone||'safe');
        const zones=Array.isArray(a.zones)?a.zones:[];
        const zone=zones.find(function(z){return z&&String(z.id)===selected;})||null;
        const picker=document.getElementById('idleZoneSelectCustom');
        if(picker){
          const value=picker.querySelector('.team-sort-trigger-value');
          if(value)value.textContent=String((zone&&(zone.name||zone.id))||selected||'—');
          picker.classList.remove('open');
          picker.querySelectorAll('.team-sort-option[data-zone-id]').forEach(function(btn){
            const active=String(btn.getAttribute('data-zone-id')||'')===selected;
            btn.classList.toggle('active',active);
            const arrow=btn.querySelector('.team-sort-option-arrow');
            if(active&&!arrow){
              const mark=document.createElement('span');
              mark.className='team-sort-option-arrow';
              mark.textContent='✓';
              btn.appendChild(mark);
            }else if(!active&&arrow){
              arrow.remove();
            }
          });
        }

        const panneauJoueur=document.querySelector('.soreal-idle-adventure-player-panel-v1');
        const note=panneauJoueur&&panneauJoueur.nextElementSibling;
        if(note){
          note.outerHTML=
            selected==='safe'
              ?'<div class="soreal-idle-adventure-fight-note-v1">🛡️ Zone sûre : choisis une autre zone pour combattre.</div>'
              :'<div class="soreal-idle-adventure-fight-note-v1">'+idleHtml_(texteProchainCombatAdventureIdleV165_())+'</div>';
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-188 */
      function zoneAdventureDeplacerV1_(delta){
        if(!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        const debloquees=zones.filter(function(z){return z&&z.unlocked;});
        if(!debloquees.length)return;
        const selectionnee=String((a&&a.selectedZone)||'safe');
        let idx=debloquees.findIndex(function(z){return String(z.id)===selectionnee;});
        if(idx<0)idx=0;
        idx=(idx+delta+debloquees.length)%debloquees.length;
        selectionnerZoneAdventureIdleV47_(debloquees[idx].id);
      }

      function zoneAdventurePrecedenteV1_(){zoneAdventureDeplacerV1_(-1);}

      function zoneAdventureSuivanteV1_(){zoneAdventureDeplacerV1_(1);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-192 */
      function respawnReductionAdventureIdleV1_(j){
        return Math.max(
          0,
          Math.min(
            0.915,
            idleNombre_(j&&j.systemes&&j.systemes.bonuses&&j.systemes.bonuses.respawnReduction)
          )
        );
      }

      const IDLE_ADVENTURE_RESPAWN_MS_V1=4000;

      function fxIdleV1_(cible,type,texte){
        const fx=window.SorealCombatFxV1;
        if(!fx)return;
        try{fx.jouer(cible,type,texte);}catch(e){}
      }

      function titanMultDegatsJoueurIdleV1_(fight,maintenant){
        const api=window.SorealTitanComportementsV1;
        return api&&REG.idleTitanEtatV1&&fight&&fight.titanId?api.multDegatsJoueur(fight.titanId,REG.idleTitanEtatV1,maintenant):1;
      }

      function titanCompetenceDesactiveeIdleV1_(competence){
        const api=window.SorealTitanComportementsV1;
        return Boolean(api&&REG.idleTitanEtatV1&&api.competenceDesactivee(REG.idleTitanEtatV1.id,REG.idleTitanEtatV1,competence));
      }

      function titanJoueurParalyseIdleV1_(maintenant){
        const api=window.SorealTitanComportementsV1;
        return Boolean(api&&REG.idleTitanEtatV1&&api.joueurParalyse(REG.idleTitanEtatV1,maintenant));
      }

      /* Identité du combat de titan terminé (id + heure de départ) : jointe à la résolution pour que le serveur la rattache au bon combat. */
      let idleAdventureResolutionIdentiteV2={titanId:'',titanStartedAt:0};

      let idleAdventureRespawnZoneV165='';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-193 */
      let idleAdventureRestRegenLastAtV166=Date.now();

      function reinitialiserHorlogeRegenReposAdventureIdleV166_(maintenant){
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        idleAdventureRestRegenLastAtV166=now;
        return now;
      }

      function ecouleRegenReposAdventureIdleV166_(maintenant){
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        const precedent=Math.max(
          0,
          idleNombre_(idleAdventureRestRegenLastAtV166)||now
        );
        idleAdventureRestRegenLastAtV166=now;
        return Math.max(0,(now-precedent)/1000);
      }

      function dureeRespawnAdventureIdleV165_(){
        return Math.max(
          0,
          IDLE_ADVENTURE_RESPAWN_MS_V1*
          (1-respawnReductionAdventureIdleV1_(REG.idleEtat))
        );
      }

      function texteProchainCombatAdventureIdleV165_(){
        const restantMs=REG.idleAdventureRespawnAtV1
          ?Math.max(0,REG.idleAdventureRespawnAtV1-Date.now())
          :dureeRespawnAdventureIdleV165_();
        const secondes=Math.max(0,Math.ceil(restantMs/1000));
        return '⏳ Prochain combat dans '+secondes+' seconde'+(secondes>1?'s':'');
      }

      function annulerRespawnAdventureIdleV165_(){
        if(REG.idleAdventureRespawnTimerV165){
          clearTimeout(REG.idleAdventureRespawnTimerV165);
          REG.idleAdventureRespawnTimerV165=0;
        }
        REG.idleAdventureRespawnAtV1=0;
        REG.idleAdventureRespawnStartPendingV165=false;
        idleAdventureRespawnZoneV165='';
      }

      function programmerRespawnAdventureIdleV165_(departMs){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const zone=String((a&&a.selectedZone)||'safe');
        if(!a||zone==='safe'){
          annulerRespawnAdventureIdleV165_();
          return;
        }
        const depart=Math.max(0,idleNombre_(departMs)||Date.now());
        REG.idleAdventureRespawnAtV1=depart+dureeRespawnAdventureIdleV165_();
        idleAdventureRespawnZoneV165=zone;
        REG.idleAdventureRespawnStartPendingV165=false;
        if(REG.idleAdventureRespawnTimerV165)clearTimeout(REG.idleAdventureRespawnTimerV165);

        const tenter=function(){
          const courant=aventureMetaIdleV47_(REG.idleEtat);
          const zoneCourante=String((courant&&courant.selectedZone)||'safe');
          if(
            !courant||
            zoneCourante==='safe'||
            zoneCourante!==idleAdventureRespawnZoneV165
          ){
            annulerRespawnAdventureIdleV165_();
            return;
          }
          const restant=REG.idleAdventureRespawnAtV1-Date.now();
          if(restant>1){
            REG.idleAdventureRespawnTimerV165=setTimeout(tenter,restant);
            return;
          }
          if(REG.idleAdventureResolutionPendingV2||metaOccupeIdleV130_()){
            REG.idleAdventureRespawnTimerV165=setTimeout(tenter,16);
            return;
          }
          REG.idleAdventureRespawnTimerV165=0;
          REG.idleAdventureRespawnStartPendingV165=true;
          REG.idleAdventureRespawnAtV1=0;
          actionAdventureIdleV47_({
            action:'startZoneFight',
            restHp:REG.idleEtat&&REG.idleEtat.adventureRestPv
          });
        };

        REG.idleAdventureRespawnTimerV165=setTimeout(
          tenter,
          Math.max(0,REG.idleAdventureRespawnAtV1-Date.now())
        );
      }

      function skillBasicTrainingAdventureIdleV3_(group,index){
        const bt=basicTrainingIdleV120_();
        const list=bt&&Array.isArray(bt.skills)
          ?bt.skills.filter(function(skill){return skill&&skill.group===group;})
          :[];
        return list[index]||null;
      }

      function competenceAdventureDebloqueeIdleV3_(def,group){
        const skill=skillBasicTrainingAdventureIdleV3_(group,def.btIndex);
        return Boolean(skill&&skill.unlocked);
      }

      function niveauWishAdventureIdleV4_(wishId){
        const wishes=systemeMetaParIdIdleV130_(REG.idleEtat,'wishes');
        const tracks=wishes&&wishes.state&&wishes.state.data&&wishes.state.data.tracks;
        const track=tracks&&tracks[String(wishId)];
        return Math.max(0,idleEntier_(track&&track.level));
      }

      function competenceAdventureAvanceeDebloqueeIdleV4_(id,a){
        const skillId=String(id||'');
        const flags=a&&a.unlockFlags||{};
        if(skillId==='paralyze'){
          return Math.max(
            0,
            idleEntier_(
              REG.idleEtat&&REG.idleEtat.systemes&&
              REG.idleEtat.systemes.challenge&&
              REG.idleEtat.systemes.challenge.completions&&
              REG.idleEtat.systemes.challenge.completions.basic
            )
          )>=5;
        }
        if(skillId==='hyperRegen')return Boolean(flags.hyperRegenUnlocked);
        if(skillId==='beastMode')return Boolean(flags.beastModeUnlocked);
        if(skillId==='megaBuff')return niveauWishAdventureIdleV4_(8)>=1;
        if(skillId==='ohShit')return niveauWishAdventureIdleV4_(58)>=1;
        if(skillId==='move69')return Boolean(flags.move69Unlocked);
        return false;
      }

      function groupeCompetenceAdventureIdleV4_(def){
        if(REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.indexOf(def)>=0)return'attack';
        if(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3.indexOf(def)>=0)return'defense';
        return'advanced';
      }

      function competenceAdventureDisponibleIdleV4_(def,group,a){
        if(!def)return false;
        return group==='advanced'
          ?competenceAdventureAvanceeDebloqueeIdleV4_(def.id,a)
          :competenceAdventureDebloqueeIdleV3_(def,group);
      }

      function definitionCompetenceAdventureIdleV3_(id){
        return REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3
          .concat(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3)
          .concat(REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4)
          .find(function(def){return def.id===String(id||'');})||null;
      }

      function beastModeActifAdventureIdleV4_(a){
        return Boolean(a&&a.skillState&&a.skillState.beastMode);
      }

      function multiplicateurBeastPowerAdventureIdleV4_(a){
        if(!beastModeActifAdventureIdleV4_(a))return 1;
        return a&&a.unlockFlags&&a.unlockFlags.purpleLiquidMaxed?1.5:1.4;
      }

      function multiplicateurPowerManuelAdventureIdleV3_(maintenant,a){
        let mult=1;
        if(REG.idleAdventureManualStateV3.offensiveBuffUntil>maintenant)mult*=1.2;
        if(REG.idleAdventureManualStateV3.ultimateBuffUntil>maintenant)mult*=1.3;
        if(REG.idleAdventureManualStateV3.megaBuffUntil>maintenant)mult*=1.2;
        mult*=multiplicateurBeastPowerAdventureIdleV4_(a);
        return mult;
      }

      function multiplicateurToughnessManuelAdventureIdleV3_(maintenant){
        let mult=1;
        if(REG.idleAdventureManualStateV3.defensiveBuffUntil>maintenant)mult*=1.2;
        if(REG.idleAdventureManualStateV3.ultimateBuffUntil>maintenant)mult*=1.3;
        if(REG.idleAdventureManualStateV3.megaBuffUntil>maintenant)mult*=1.2;
        return mult;
      }

      function multiplicateurChargeAdventureIdleV3_(a){
        return Math.max(
          2,
          idleNombre_(a&&a.setRewards&&a.setRewards.chargeMultiplier)||2
        );
      }

      function intervalleIdleAttackAdventureIdleV4_(a){
        return a&&a.unlockFlags&&a.unlockFlags.redLiquidMaxed?800:1000;
      }

      function cooldownDureeAdventureIdleV4_(def,a){
        const base=Math.max(0,idleNombre_(def&&def.cooldown));
        if(!def||def.id==='move69')return base;
        /* Specials « Move Cooldowns » de l'équipement (Ring of Might, Sands of Time, Infinity Charm : 50 % max). */
        /* Wiki « Red Liquid (set) » : le -20 % porte sur le « global cooldown timer » (délai entre deux moves différents) et la vitesse d'Idle Attack, PAS sur le cooldown propre de chaque move. Le délai global est simulé à part (appliquerDelaiGlobalAdventureIdleV1_) : 1 s, 0,8 s avec ce set. */
        const equipement=Math.max(0,Math.min(95,idleNombre_(a&&a.stats&&a.stats.specials&&a.stats.specials.moveCooldownPct)));
        return base*(1-equipement/100);
      }

      /*
       * Délai global entre deux actions (Norman, 2026-10-08, vérifié dans le vrai jeu : « dès qu'une action est faite, peu importe laquelle, toutes les autres ont 1 s de CD »).
       * Wiki « Red Liquid (set) » : « -20% on the global cooldown timer [...] the cooldown between using different moves » -> 0,8 s avec ce set (même drapeau que la vitesse d'Idle Attack).
       * Le wiki ne publie pas la durée de base : 1 s, confirmée par Norman dans NGU Idle. N'allonge jamais un délai déjà plus long.
       */
      function appliquerDelaiGlobalAdventureIdleV1_(idUtilise,maintenant,a){
        const fin=maintenant+intervalleIdleAttackAdventureIdleV4_(a);
        REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.concat(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3,REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4).forEach(function(d){
          if(d.id===idUtilise)return;
          if(idleNombre_(REG.idleAdventureManualStateV3.cooldownUntil[d.id])<fin)REG.idleAdventureManualStateV3.cooldownUntil[d.id]=fin;
        });
      }

      function cooldownRestantAdventureIdleV3_(id,maintenant){
        return Math.max(
          0,
          idleNombre_(REG.idleAdventureManualStateV3.cooldownUntil[id])-maintenant
        );
      }

      function prerequisCompetenceAdventureIdleV4_(id,maintenant){
        const skillId=String(id||'');
        if(skillId==='megaBuff'){
          return ['offensiveBuff','defensiveBuff','ultimateBuff'].every(function(x){
            return cooldownRestantAdventureIdleV3_(x,maintenant)<=0;
          });
        }
        if(skillId==='ohShit'){
          return ['heal','paralyze','hyperRegen'].every(function(x){
            return cooldownRestantAdventureIdleV3_(x,maintenant)<=0;
          });
        }
        return true;
      }

      /*
       * Audit d'Aventure (Norman, 2026-10-05) : les raccourcis sont actualisés ~15 fois par seconde et réassignaient « disabled », « hidden », « aria-pressed » et les textes à CHAQUE passage, même identiques : ~187
       * modifications de page par seconde au repos, qui relançaient aussi les observateurs de la page. Chaque valeur n'est écrite que si elle change.
       */
      function posteIdleSiChangeV1_(el,propriete,valeur){
        if(el&&el[propriete]!==valeur)el[propriete]=valeur;
      }

      function attributIdleSiChangeV1_(el,nom,valeur){
        if(el&&el.getAttribute(nom)!==valeur)el.setAttribute(nom,valeur);
      }

      function rafraichirCommandesAdventureIdleV3_(maintenant){
        const root=document.getElementById('sorealIdleAdventureManualV3');
        if(!root)return;
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        const a=aventureMetaIdleV47_(REG.idleEtat);
        /*
         * Paralysie (Norman, 2026-10-04 : « quand un titan ou un ennemi nous freeze, il faut le voir sur les raccourcis d'attaque, parade etc. : tout devient grisé ou autre chose, sinon on dirait un bug, l'interface qui
         * ne répond plus ») : tous les raccourcis et l'Idle Mode sont grisés, marqués d'un éclair, et un bandeau dit pourquoi et pendant combien de temps.
         */
        const paralyse=titanJoueurParalyseIdleV1_(now);
        root.classList.toggle('paralyse-v1',paralyse);
        /* Norman (2026-10-10) : plus de phrase « Paralysé » au-dessus (elle décalait l'interface) ; seuls les raccourcis jaunes et grisés (classe paralyse-v1) le montrent. */
        root.classList.toggle('manual-active',!REG.idleAdventureIdleModeV3);
        const toggle=root.querySelector('[data-adventure-idle-toggle]');
        if(toggle){
          toggle.classList.toggle('active',REG.idleAdventureIdleModeV3);
          attributIdleSiChangeV1_(toggle,'aria-pressed',REG.idleAdventureIdleModeV3?'true':'false');
          const value=toggle.querySelector('b');
          if(value)posteIdleSiChangeV1_(value,'textContent',REG.idleAdventureIdleModeV3?'ON':'OFF');
          toggle.classList.toggle('paralyse-v1',paralyse);
        }
        root.querySelectorAll('[data-adventure-skill]').forEach(function(btn){
          const id=String(btn.getAttribute('data-adventure-skill')||'');
          const def=definitionCompetenceAdventureIdleV3_(id);
          if(!def)return;
          const group=groupeCompetenceAdventureIdleV4_(def);
          const unlocked=competenceAdventureDisponibleIdleV4_(def,group,a);
          const restant=cooldownRestantAdventureIdleV3_(id,now);
          const prerequisOk=prerequisCompetenceAdventureIdleV4_(id,now);
          const desactivee=titanCompetenceDesactiveeIdleV1_(id);
          posteIdleSiChangeV1_(btn,'disabled',Boolean(REG.idleAdventureIdleModeV3||!unlocked||restant>0||!prerequisOk||desactivee||paralyse));
          btn.classList.toggle('titan-off',desactivee);
          btn.classList.toggle('paralyse-v1',paralyse);
          btn.classList.toggle('locked',!unlocked);
          const cd=btn.querySelector('.soreal-idle-adventure-skill-cd-v3');
          if(cd)posteIdleSiChangeV1_(cd,'textContent',paralyse?'⚡':(restant>0?(restant/1000).toFixed(restant<10000?1:0)+'s':''));
          const label=btn.querySelector('.soreal-idle-adventure-skill-label-v3');
          if(label&&id==='move69'){
            const uses=Math.max(0,idleEntier_(a&&a.skillState&&a.skillState.move69Uses));
            posteIdleSiChangeV1_(label,'textContent','Move 69 · '+uses+'/69');
          }
          let active=false;
          if(id==='block')active=REG.idleAdventureManualStateV3.blockUntil>now;
          else if(id==='defensiveBuff')active=REG.idleAdventureManualStateV3.defensiveBuffUntil>now;
          else if(id==='offensiveBuff')active=REG.idleAdventureManualStateV3.offensiveBuffUntil>now;
          else if(id==='ultimateBuff')active=REG.idleAdventureManualStateV3.ultimateBuffUntil>now;
          else if(id==='megaBuff')active=REG.idleAdventureManualStateV3.megaBuffUntil>now;
          else if(id==='hyperRegen')active=REG.idleAdventureManualStateV3.hyperRegenUntil>now;
          else if(id==='paralyze')active=REG.idleAdventureManualStateV3.enemyParalyzedUntil>now;
          else if(id==='charge')active=REG.idleAdventureManualStateV3.charge;
          else if(id==='parry')active=REG.idleAdventureManualStateV3.parryArmed;
          else if(id==='beastMode')active=beastModeActifAdventureIdleV4_(a);
          btn.classList.toggle('effect-active',active);
        });
      }

      function basculerIdleModeAdventureIdleV3_(){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const fight=a&&a.fight;
        const maintenant=Date.now();
        if(fight&&fight.active){
          appliquerRegenCombatAdventureIdleV2_(a,fight,maintenant);
        }
        REG.idleAdventureIdleModeV3=!REG.idleAdventureIdleModeV3;
        try{
          localStorage.setItem(
            'sorealIdleAdventureIdleModeV3',
            REG.idleAdventureIdleModeV3?'1':'0'
          );
        }catch(e){}
        if(REG.idleAdventureIdleModeV3){
          REG.idleAdventureFightNextPlayerHitV2=
            maintenant+intervalleIdleAttackAdventureIdleV4_(a);
        }
        rafraichirCommandesAdventureIdleV3_(maintenant);
      }

      /*
       * Journal de combat, mode manuel (2026-09-27, Norman : « Quand je passe en mode manuel, je
       * ne vois pas l'indication de mes attaques dans le journal de combat. Je veux une phrase en
       * verte. "Redrum lance soin" avec explications. ») : def optionnel (le skill qui a déclenché
       * le soin -- « heal » ou « ohShit ») pour nommer l'action comme les lignes d'attaque le font déjà.
       */
      function appliquerHealAdventureIdleV4_(a,fight,def){
        const max=Math.max(0,idleNombre_(fight&&fight.playerHpMax));
        if(fight&&fight.active&&max>0){
          const avant=idleNombre_(fight.playerHp);
          fight.playerHp=Math.min(
            max,
            avant+max*.15
          );
          const soigne=Math.round(fight.playerHp-avant);
          REG.idleFxSoinJusqua=Math.max(REG.idleFxSoinJusqua,Date.now()+2500);
          if(soigne>0){
            fxIdleV1_('joueur','soin','+'+soigne);
            ajouterLogAventureIdleV1_(
              'manual',
              (REG.idleEtat&&REG.idleEtat.nom||'Vous')+' lance '+(def&&def.label?def.label:'Soin')+' : +'+soigne+' PV !'
            );
          }
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }
        return false;
      }

      function appliquerParalyzeAdventureIdleV4_(maintenant){
        REG.idleAdventureManualStateV3.enemyParalyzedUntil=
          Math.max(REG.idleAdventureManualStateV3.enemyParalyzedUntil,maintenant+3000);
      }

      function appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant){
        if(fight&&fight.active){
          appliquerRegenCombatAdventureIdleV2_(a,fight,maintenant);
        }
        REG.idleAdventureManualStateV3.hyperRegenUntil=
          Math.max(REG.idleAdventureManualStateV3.hyperRegenUntil,maintenant+5000);
      }

      function attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant,chargeMemorisee){
        if(!fight||!fight.active)return false;
        let multiplier=Math.max(0,idleNombre_(def&&def.multiplier)||1);
        if(def&&def.id==='ultimate'){
          const bossRecord=Math.max(
            Math.max(0,idleEntier_(REG.idleEtat&&REG.idleEtat.bossVaincus)),
            Math.max(0,idleEntier_(REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.records&&REG.idleEtat.systemes.records.highestBoss))
          );
          const jrpg=Boolean(a&&a.completedSets&&a.completedSets.jrpg);
          multiplier=(jrpg?4:2)+bossRecord*.01;
        }
        /* Wiki Skills : Parry x1 (x3 avec le set Slimy complété). */
        if(def&&def.id==='parry'&&a&&a.completedSets&&a.completedSets.slimy)multiplier=3;
        /* Riposte de Parry : Charge consommée au lancement de la parade, jamais la Charge courante. */
        if(chargeMemorisee>0){
          multiplier*=chargeMemorisee;
        }else if(REG.idleAdventureManualStateV3.charge){
          multiplier*=multiplicateurChargeAdventureIdleV3_(a);
          REG.idleAdventureManualStateV3.charge=false;
        }
        const power=
          Math.max(0,idleNombre_(a&&a.stats&&a.stats.power))*
          multiplicateurPowerManuelAdventureIdleV3_(maintenant,a);
        const toughness=
          Math.max(0,idleNombre_(fight.mobToughness))*
          (def&&def.pierce?1-Math.max(0,Math.min(.99,def.pierce)):1);
        const avant=Math.max(0,idleNombre_(fight.monsterHp));
        const degats=Math.min(
          avant,
          degatsJoueurAdventureIdleV2_(
            power,
            toughness,
            multiplier*titanMultDegatsJoueurIdleV1_(fight,maintenant),
            facteurAleatoireDegatsAdventureIdleV2_()
          )
        );
        fight.monsterHp=Math.max(0,avant-degats);
        impactMonstreAdventureIdleV1_();
        fxIdleV1_('mob',titanMultDegatsJoueurIdleV1_(fight,maintenant)===0?'invincible':({strong:'fort',piercing:'perce',ultimate:'ultime'})[def&&def.id]||'coup',idleEntier_(degats));
        /* Mode manuel, en vert -- distinct du bleu 'player' de l'attaque idle automatique (Norman, 2026-09-27). */
        ajouterLogAventureIdleV1_(
          'manual',
          (REG.idleEtat&&REG.idleEtat.nom||'Vous')+' lance '+(def&&def.label?def.label:'Attaque')+' : '+
          idleEntier_(degats)+' dégâts sur '+
          libelleEnnemiAdventureIdleV1_(fight)+' !'
        );
        if(fight.monsterHp<=0){
          terminerCombatAdventureLocalV2_(fight,true);
        }else{
          pousserEtatVersRuntimePartageIdleV1_();
        }
        return true;
      }

      function utiliserCompetenceAdventureIdleV3_(id){
        if(REG.idleAdventureIdleModeV3)return;
        if(titanJoueurParalyseIdleV1_(Date.now()))return;
        if(titanCompetenceDesactiveeIdleV1_(id))return;
        const def=definitionCompetenceAdventureIdleV3_(id);
        if(!def)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const group=groupeCompetenceAdventureIdleV4_(def);
        if(!competenceAdventureDisponibleIdleV4_(def,group,a))return;
        const maintenant=Date.now();
        if(
          cooldownRestantAdventureIdleV3_(def.id,maintenant)>0||
          !prerequisCompetenceAdventureIdleV4_(def.id,maintenant)
        )return;
        const fight=a&&a.fight;

        const attaqueBase=group==='attack';
        const requiertCombat=
          (attaqueBase&&def.id!=='parry')||
          def.id==='paralyze'||
          def.id==='ohShit';
        if(requiertCombat&&(!fight||!fight.active))return;

        REG.idleAdventureManualStateV3.cooldownUntil[def.id]=
          maintenant+cooldownDureeAdventureIdleV4_(def,a);
        appliquerDelaiGlobalAdventureIdleV1_(def.id,maintenant,a);
        /* Un son propre à chaque bouton (modules/audio-effects-v199.js : skill_<id>). */
        jouerEffetAudioIdleV199_('skill_'+def.id);

        if(group==='attack'){
          if(def.id==='parry'){
            /*
             * Wiki Skills : Parry « Blocks 50% of incoming damage and automatically
             * attacks » ; set Slimy : « Parry's reflected attack » ; The Beast :
             * le renvoi de dégâts « will activate Parry ». La riposte part donc
             * quand la prochaine attaque ennemie est parée (parade pré-lançable
             * avant le combat), pas au lancement. Parry est « Affected by Charge » :
             * la Charge active est consommée ici et mémorisée pour la riposte.
             */
            REG.idleAdventureManualStateV3.parryArmed=true;
            REG.idleAdventureManualStateV3.parryChargeMult=1;
            if(REG.idleAdventureManualStateV3.charge){
              REG.idleAdventureManualStateV3.parryChargeMult=multiplicateurChargeAdventureIdleV3_(a);
              REG.idleAdventureManualStateV3.charge=false;
            }
          }else{
            attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant);
          }
        }else if(group==='defense'&&def.id==='block'){
          /* Block Damage Reduction : (Level+50)/(Level+100) d'Advanced Training, exposé par le serveur (audit 2026-09-23). */
          let reduction=(a&&a.stats&&Number.isFinite(Number(a.stats.blockReduction)))?Number(a.stats.blockReduction):.5;
          if(REG.idleAdventureManualStateV3.charge){
            reduction=Math.min(.99,reduction*multiplicateurChargeAdventureIdleV3_(a));
            REG.idleAdventureManualStateV3.charge=false;
          }
          REG.idleAdventureManualStateV3.blockReduction=reduction;
          REG.idleAdventureManualStateV3.blockUntil=maintenant+3000;
        }else if(group==='defense'&&def.id==='defensiveBuff'){
          REG.idleAdventureManualStateV3.defensiveBuffUntil=maintenant+15000;
          fxIdleV1_('joueur','buffDef');
        }else if(group==='defense'&&def.id==='heal'){
          appliquerHealAdventureIdleV4_(a,fight,def);
        }else if(group==='defense'&&def.id==='offensiveBuff'){
          REG.idleAdventureManualStateV3.offensiveBuffUntil=maintenant+15000;
          fxIdleV1_('joueur','buffOff');
        }else if(group==='defense'&&def.id==='charge'){
          REG.idleAdventureManualStateV3.charge=true;
        }else if(group==='defense'&&def.id==='ultimateBuff'){
          REG.idleAdventureManualStateV3.ultimateBuffUntil=maintenant+15000;
          fxIdleV1_('joueur','buffUlt');
        }else if(def.id==='paralyze'){
          appliquerParalyzeAdventureIdleV4_(maintenant);
        }else if(def.id==='hyperRegen'){
          appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant);
        }else if(def.id==='beastMode'){
          if(!a.skillState||typeof a.skillState!=='object')a.skillState={};
          a.skillState.beastMode=!Boolean(a.skillState.beastMode);
          actionAdventureIdleV47_({
            action:'setBeastMode',
            enabled:Boolean(a.skillState.beastMode)
          });
        }else if(def.id==='megaBuff'){
          REG.idleAdventureManualStateV3.offensiveBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.defensiveBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.ultimateBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.megaBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.cooldownUntil.offensiveBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('offensiveBuff'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.defensiveBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('defensiveBuff'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.ultimateBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('ultimateBuff'),a
            );
        }else if(def.id==='ohShit'){
          appliquerHealAdventureIdleV4_(a,fight,def);
          appliquerParalyzeAdventureIdleV4_(maintenant);
          appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant);
          REG.idleAdventureManualStateV3.cooldownUntil.heal=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('heal'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.paralyze=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('paralyze'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.hyperRegen=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('hyperRegen'),a
            );
        }else if(def.id==='move69'){
          if(!a.skillState||typeof a.skillState!=='object')a.skillState={};
          a.skillState.move69Uses=Math.min(
            69,
            Math.max(0,idleEntier_(a.skillState.move69Uses))+1
          );
          if(a.skillState.move69Uses>=69)a.skillState.endPiece481=true;
          ajouterLogAventureIdleV1_(
            'system',
            'A million realities collide in your mind, echoing a unified message: '+
            idleEntier_(a.skillState.move69Uses)
          );
          actionAdventureIdleV47_({action:'useMove69'});
        }

        rafraichirCommandesAdventureIdleV3_(maintenant);
      }

      function rendreBoutonCompetenceAdventureIdleV3_(def,group){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const unlocked=competenceAdventureDisponibleIdleV4_(def,group,a);
        const label=def.id==='move69'
          ?def.label+' · '+Math.max(0,idleEntier_(a&&a.skillState&&a.skillState.move69Uses))+'/69'
          :def.label;
        /* ANTI-SPOIL (règle n°2) : aucune condition de déblocage dans l'infobulle d'une compétence verrouillée. */
        const titreVerrouillage='';
        return '<button type="button" class="soreal-idle-adventure-skill-v3'+
          (unlocked?'':' locked')+'" data-adventure-skill="'+idleHtml_(def.id)+'" '+
          (titreVerrouillage?'title="'+idleHtml_(titreVerrouillage)+'" ':'')+
          'onclick="window.__utiliserCompetenceAdventureIdleV3__(\''+idleHtml_(def.id)+'\')" '+
          (unlocked?'':'disabled')+'>'+
          '<span class="soreal-idle-adventure-skill-icon-v3">'+idleHtml_(def.icon)+'</span>'+
          '<span class="soreal-idle-adventure-skill-label-v3">'+idleHtml_(label)+'</span>'+
          '<span class="soreal-idle-adventure-skill-cd-v3"></span>'+
        '</button>';
      }

      function rendreCommandesAdventureIdleV3_(){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const avancees=REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4.filter(function(def){
          return competenceAdventureAvanceeDebloqueeIdleV4_(def.id,a);
        });
        return '<div id="sorealIdleAdventureManualV3" class="soreal-idle-adventure-manual-v3'+
          (REG.idleAdventureIdleModeV3?'':' manual-active')+'">'+
          /* Norman (2026-10-13) : petit bouton discret du journal des attaques sur la même ligne qu'Idle Mode (modules/journal-attaques-v1.js). */
          '<div class="soreal-idle-adventure-idle-ligne-v1">'+
          '<button type="button" class="soreal-idle-adventure-idle-toggle-v3'+
            (REG.idleAdventureIdleModeV3?' active':'')+'" data-adventure-idle-toggle '+
            'aria-pressed="'+(REG.idleAdventureIdleModeV3?'true':'false')+'" '+
            'onclick="window.__basculerIdleModeAdventureIdleV3__()">'+
            '<span>Idle Mode</span><b>'+(REG.idleAdventureIdleModeV3?'ON':'OFF')+'</b>'+
          '</button>'+
          '<button type="button" class="soreal-idle-journal-mini-v1" title="Journal des attaques" aria-label="Journal des attaques" '+
            'onclick="window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__&&window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__.ouvrir()">📖</button>'+
          '</div>'+
          '<div class="soreal-idle-adventure-manual-grid-v3">'+
            '<div class="soreal-idle-adventure-skill-row-v3 attack">'+
              REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.map(function(def){
                return rendreBoutonCompetenceAdventureIdleV3_(def,'attack');
              }).join('')+
            '</div>'+
            '<div class="soreal-idle-adventure-skill-row-v3 defense">'+
              REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3.map(function(def){
                return rendreBoutonCompetenceAdventureIdleV3_(def,'defense');
              }).join('')+
            '</div>'+
            (avancees.length
              ?'<div class="soreal-idle-adventure-skill-row-v3 advanced">'+
                avancees.map(function(def){
                  return rendreBoutonCompetenceAdventureIdleV3_(def,'advanced');
                }).join('')+
              '</div>'
              :'')+
          '</div>'+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-196 */
      const IDLE_ADVENTURE_MOB_NOM_CACHE_V1={};

      function cleMobNomCacheV1_(zone,boss,seed){
        return zone+'|'+(boss?'1':'0')+'|'+seed;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-197 */
      function nomDepuisCleR2AdventureIdleV1_(cle,zoneId){const api=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;return api&&typeof api.nomDepuisCleR2==='function'?api.nomDepuisCleR2(cle,zoneId):'Créature';}

      function resoudreNomEnnemiAdventureIdleV1_(zoneId,boss,seed){
        const cle=cleMobNomCacheV1_(zoneId,boss,seed);
        if(IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]!==undefined)return;
        IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]=null;
        fetch(urlMobR2IdleV1_(zoneId,boss,seed),{method:'HEAD'})
          .then(function(r){
            const key=r&&r.headers?r.headers.get('x-soreal-idle-r2-key'):'';
            IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]=
              key?nomDepuisCleR2AdventureIdleV1_(key,zoneId):'';
          })
          .catch(function(){
            IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]='';
          });
      }

      function libelleEnnemiAdventureIdleV1_(fight){
        const boss=Boolean(fight&&fight.boss);
        const generique=boss?'le boss de zone':'l’ennemi';
        // Le runtime fournit le nom exact du bestiaire NGU. Il est prioritaire
        // sur tout nom déduit d'une ancienne clé R2/illustration.
        const nomNGU=String(fight&&fight.mobName||'').trim();
        if(nomNGU)return nomNGU;
        const zoneId=String(fight&&fight.zone||'').toLowerCase();
        if(!zoneId)return generique;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-198 */
        const seed=Math.max(0,Number(fight&&fight.monsterIndex)||0);
        const cle=cleMobNomCacheV1_(zoneId,boss,seed);
        const nomResolu=IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle];

        if(nomResolu)return nomResolu;
        if(nomResolu===undefined)resoudreNomEnnemiAdventureIdleV1_(zoneId,boss,seed);
        return generique;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-199 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-200 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-201 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-202 */
      function regenReposAdventureIdleV3_(a,zoneCourante){
        const stats=(a&&a.stats)||{};
        const total=Math.max(
          Math.max(0,idleNombre_(stats.regenBase)||1),
          Math.max(0,idleNombre_(stats.regen))
        );
        /* Le x5 (x10 avec le set GRB) est celui du REPOS en Safe Zone : pendant un combat de Titan, qui se livre dans la Safe Zone, la régénération reste la normale (Norman, 2026-10-10 : « on a x5 à la regen en combattant un titan »). */
        if(zoneCourante==='safe'&&!(a&&a.fight&&a.fight.active)){
          return total*(a&&a.setRewards&&a.setRewards.safeZoneRegen10x?10:5);
        }
        return total;
      }

      function facteurAleatoireDegatsAdventureIdleV2_(){
        return .8+Math.random()*.4;
      }

      function degatsJoueurAdventureIdleV2_(power,toughness,idleBonus,facteur){
        const base=Math.max(
          0,
          idleNombre_(power)-idleNombre_(toughness)/2
        );
        return Math.max(
          0,
          Math.round(
            base*
            Math.max(0,idleNombre_(idleBonus)||1)*
            Math.max(.8,Math.min(1.2,idleNombre_(facteur)||1))
          )
        );
      }

      function degatsEnnemiAdventureIdleV2_(power,toughness,facteur){
        const p=Math.max(0,idleNombre_(power));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-203 */
        const base=Math.max(
          p*.1,
          p-idleNombre_(toughness)/2
        );
        return Math.max(
          0,
          Math.round(
            base*
            Math.max(.8,Math.min(1.2,idleNombre_(facteur)||1))
          )
        );
      }

      function multiplicateurIdleAttackAdventureIdleV2_(a){
        const sp=a&&a.stats&&a.stats.specials;
        const serveur=sp&&Number(sp.idleAttackMultiplier);
        if(serveur>0)return serveur;
        return Boolean(sp&&sp.idleAttack)
          ?1.5
          :1.2;
      }

      function intervalleAttaqueEnnemiAdventureIdleV2_(fight){
        return Math.max(
          100,
          Math.round(
            Math.max(.1,idleNombre_(fight&&fight.mobAttackRate)||1)*1000
          )
        );
      }

      function identiteFightAdventureIdleV2_(fight){
        return [
          String(fight&&fight.zone||''),
          String(fight&&fight.monsterIndex!=null?fight.monsterIndex:''),
          fight&&fight.boss?'1':'0',
          String(fight&&fight.mobName||''),
          String(fight&&fight.monsterHpMax||'')
        ].join('|');
      }

      function memoriserRestPvIdleV1_(valeur){
        const n=idleNombre_(valeur);
        REG.idleAdventureRestPvMemoV1=Number.isFinite(n)?Math.max(0,n):null;
      }

      function resetHorlogesFightAdventureIdleV2_(){
        REG.idleAdventureFightNextPlayerHitV2=0;
        REG.idleAdventureFightNextEnemyHitV2=0;
        REG.idleAdventureFightLastRegenAtV2=0;
        REG.idleAdventureFightIdentityV2='';
      }

      function envoyerResolutionAdventurePendingV2_(){
        if(
          !REG.idleAdventureResolutionPendingV2||
          metaOccupeIdleV130_()||
          !SOREAL_SESSION
        ){
          return false;
        }
        const action=REG.idleAdventureResolutionPendingV2;
        actionMetaIdleV130_({
          action:'adventure',
          adventure:{action:action,titanId:idleAdventureResolutionIdentiteV2.titanId,titanStartedAt:idleAdventureResolutionIdentiteV2.titanStartedAt}
        });
        if(metaOccupeIdleV130_()){
          REG.idleAdventureResolutionPendingV2='';
          return true;
        }
        return false;
      }

      function appliquerRegenCombatAdventureIdleV2_(a,fight,jusquaMs){
        if(!fight||!fight.active)return;
        const jusqua=Math.max(0,idleNombre_(jusquaMs));
        if(!REG.idleAdventureFightLastRegenAtV2){
          REG.idleAdventureFightLastRegenAtV2=jusqua;
          return;
        }
        const secondes=Math.max(
          0,
          (jusqua-REG.idleAdventureFightLastRegenAtV2)/1000
        );
        if(!(secondes>0))return;

        const regenBaseJoueur=
          Math.max(0,idleNombre_(a&&a.stats&&a.stats.regen))*
          (REG.idleAdventureIdleModeV3?1.2:1);
        const debutRegen=REG.idleAdventureFightLastRegenAtV2;
        const hyperSecondes=Math.max(
          0,
          (Math.min(jusqua,REG.idleAdventureManualStateV3.hyperRegenUntil)-debutRegen)/1000
        );
        /* Saignement du titan : facteur sur la régénération, négatif au-delà de 10 cumuls (le joueur perd alors des PV). */
        const apiTitanRegen=window.SorealTitanComportementsV1;
        const multSaignement=REG.idleTitanEtatV1&&apiTitanRegen&&fight.titanId?apiTitanRegen.multRegenJoueur(fight.titanId,REG.idleTitanEtatV1):1;
        const regenJoueur=
          regenBaseJoueur*multSaignement*(secondes+(multSaignement>0?hyperSecondes*4:0));
        const regenEnnemi=
          Math.max(0,idleNombre_(fight.mobHpRegen));

        if(regenJoueur>0){
          fight.playerHp=Math.min(
            idleNombre_(fight.playerHpMax),
            idleNombre_(fight.playerHp)+regenJoueur
          );
        }else if(regenJoueur<0){
          fight.playerHp=Math.max(0,idleNombre_(fight.playerHp)+regenJoueur);
        }
        if(regenEnnemi>0){
          fight.monsterHp=Math.min(
            idleNombre_(fight.monsterHpMax),
            idleNombre_(fight.monsterHp)+regenEnnemi*secondes
          );
        }
        REG.idleAdventureFightLastRegenAtV2=jusqua;
      }

      function terminerCombatAdventureLocalV2_(fight,victoire){
        if(!fight||!fight.active)return;
        const nom=libelleEnnemiAdventureIdleV1_(fight);
        const finCombatMsV166=
          reinitialiserHorlogeRegenReposAdventureIdleV166_(Date.now());

        if(victoire){
          REG.idleEtat.adventureRestPv=Math.max(0,idleNombre_(fight.playerHp));
          memoriserRestPvIdleV1_(REG.idleEtat.adventureRestPv);
          programmerRespawnAdventureIdleV165_(finCombatMsV166);
          ajouterLogAventureIdleV1_(
            'system',
            'Vous avez vaincu '+nom+' !'
          );
          idleAdventureResolutionIdentiteV2={titanId:String(fight.titanId||''),titanStartedAt:idleNombre_(fight.titanStartedAt)};
          REG.idleAdventureResolutionPendingV2='resolveZoneFight';
          /* Titan vaincu : l'écran de combat joue son départ (il rapetisse en tournant) puis annonce son retour (modules/titans-combat-ecran-v1.js). */
          if(fight.titanId){try{window.dispatchEvent(new CustomEvent('soreal-titan-vaincu',{detail:{id:String(fight.titanId),nom:String(nom||'')}}));}catch(_e){}}
          /* Les histoires ne se déclenchent plus sur un boss de zone Aventure (Norman, 2026-09-30 : « uniquement ceux de Fight Boss »). */
        }else{
          REG.idleEtat.adventureRestPv=0;
          memoriserRestPvIdleV1_(0);
          REG.idleAdventureKoAlertV1=true;
          marquerBoutonAventureKoIdleV1_();
          ajouterLogAventureIdleV1_(
            'enemy',
            'Vous avez été mis K.O. par '+nom+' ! Retour à la Safe Zone…'
          );
          idleAdventureResolutionIdentiteV2={titanId:String(fight.titanId||''),titanStartedAt:idleNombre_(fight.titanStartedAt)};
          REG.idleAdventureResolutionPendingV2='loseZoneFight';
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-204 */
        fight.active=false;
        resetHorlogesFightAdventureIdleV2_();
        pousserEtatVersRuntimePartageIdleV1_();
        envoyerResolutionAdventurePendingV2_();
      }

      function impactMonstreAdventureIdleV1_(){
        const el=document.getElementById('sorealIdleAdventureSceneMobV1');
        if(!el)return;

        /* Relance de l'animation SANS lecture de mise en page : « void el.offsetWidth » forçait un calcul complet de la page à chaque coup. La classe est retirée maintenant, puis remise deux images plus tard (le navigateur a alors vraiment pris en compte le retrait). */
        const jeton=(el.__impactJetonV1||0)+1;
        el.__impactJetonV1=jeton;
        el.classList.remove('impact-boss-v46');
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            if(el.__impactJetonV1!==jeton||!el.isConnected)return;
            el.classList.add('impact-boss-v46');
            setTimeout(function(){
              if(el.__impactJetonV1===jeton)el.classList.remove('impact-boss-v46');
            },260);
          });
        });
      }

      function trouverWalderpIdleV147_(){
        actionAdventureIdleV47_({action:'titanFound',titan:'t5'});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-211 */
      const IDLE_ADVENTURE_UNLOCK_ITEMS_V1={
        aNumber:{nom:'Un nombre',systeme:'NGU'},
        giantSeed:{nom:'Graine géante',systeme:'Yggdrasil'},
        scrapPaper:{nom:'Bout de papier',systeme:'Diggers'},
        uugHair:{nom:'Poil d\'UUG',systeme:'Beards'},
        pissedOffKey:{nom:'Clé furieuse',systeme:'la Tour'},
        wandoos98:{nom:'Wandoos 98',systeme:'Wandoos'}
      };

      /*
       * Menu « Objets de déblocage » (Norman, 2026-10-04 : « dans le jeu de base c'est en utilisant un objet ») : on utilise désormais l'objet du sac (bouton « Utiliser » de sa fiche, ou clic droit). Le menu ne reste
       * que comme secours pour un déblocage dont l'objet réel n'est plus dans le sac (anciens joueurs).
       */
      function objetsDeblocageDisponiblesAdventureIdleV1_(a){
        const items=a&&a.unlockItems&&typeof a.unlockItems==='object'?a.unlockItems:{};
        const sac=a&&Array.isArray(a.inventory)?a.inventory:[];
        return Object.keys(IDLE_ADVENTURE_UNLOCK_ITEMS_V1).filter(function(id){
          if(!items[id])return false;
          return !sac.some(function(o){const d=o&&REG.IDLE_UNLOCK_PAR_OBJET_V1[o.definitionId];return d&&d.cle===id;});
        });
      }

      function utiliserObjetDeblocageIdleV1_(id){
        actionAdventureIdleV47_({action:'useUnlockItem',itemId:String(id||'')});
      }

      function consommerDeblocageAdventureIdleV47_(id){
        actionAdventureIdleV47_({action:'consumeUnlock',item:String(id||'')});
      }

      function consommerObjetSkillAdventureIdleV4_(id){
        actionAdventureIdleV47_({action:'consumeSkillItem',id:String(id||'')});
      }

      /* Norman (2026-10-07) : « je clique sur Transformer mais rien ne se passe… ah si, mais ça a pris du temps » : la transformation attend son tour derrière les appels en cours, puis le serveur la calcule ; on le dit tout de suite. */
      function annoncerTransformationIdleV1_(){
        try{
          let t=document.getElementById('sorealIdleTransformationV1');
          if(!t){
            t=document.createElement('div');
            t.id='sorealIdleTransformationV1';
            t.setAttribute('role','status');
            t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:2147483000;padding:10px 18px;border:3px solid #000;border-radius:8px;background:#3a2a05;color:#ffd24a;font-weight:800;box-shadow:3px 3px 0 #000;pointer-events:none;';
            document.body.appendChild(t);
          }
          t.textContent='🧪 Transformation en cours…';
          clearTimeout(t.__finV1);
          t.__finV1=setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},6000);
        }catch(_e){}
      }

      function transformerObjetAdventureIdleV4_(id){
        annoncerTransformationIdleV1_();
        actionAdventureIdleV47_({action:'transformAdventureItem',id:String(id||'')});
      }

      function equiperObjetAdventureIdleV47_(id,slot){
        jouerEffetAudioIdleV199_('equip');
        actionAdventureIdleV47_({action:'equip',id:String(id||''),slot:String(slot||'')});
      }

      function desequiperObjetAdventureIdleV47_(id,targetIndex){
        const payload={
          action:'unequip',
          id:String(id||'')
        };
        if(targetIndex!=null){
          payload.targetIndex=idleEntier_(targetIndex);
        }
        actionAdventureIdleV47_(payload);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-212 */
      function fusionnerObjetAdventureIdleV47_(idA,idB){
        actionAdventureIdleV47_({action:'merge',a:String(idA||''),b:String(idB||'')});
      }

      function boosterCubeAdventureIdleV47_(boostId){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-213 */
        actionAdventureIdleV47_({
          action:'boost',
          boostId:String(boostId||''),
          toCube:true
        });
      }

      function actionMetaV47_(payload){
        actionMetaIdleV130_(payload||{});
      }

      function setDiggerIdleV47_(id,niveau){
        actionMetaV47_({action:'setDiggerLevel',digger:String(id||''),level:Math.max(0,idleEntier_(niveau))});
      }

      function toggleDiggerIdleV47_(id,actif){
        actionMetaV47_({action:'toggleDigger',digger:String(id||''),active:Boolean(actif)});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-214 */
      function toggleMenuZoneAdventureIdleV1_(event){
        if(event)event.stopPropagation();
        document.getElementById('idleZoneSelectCustom')?.classList.toggle('open');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-215 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-216 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-217 */
      function rendreZoneCombatAdventureIdleV1_(a,nomJoueur){
        const fight=a&&a.fight;
        const stats=a&&a.stats||{};
        const pvMaxRepos=Math.max(0,idleNombre_(stats.hp));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-218 */
        if(REG.idleEtat&&(REG.idleEtat.adventureRestPv==null||REG.idleEtat.adventureRestPv>pvMaxRepos)){
          REG.idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
        }
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-219 */
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-220 */
        const pvMax=fight&&fight.active?idleEntier_(fight.playerHpMax):idleEntier_(pvMaxRepos);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-221 */
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-222 */
        const zoneCourante=String((a&&a.selectedZone)||'safe');
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-223 */
        return ''+
          '<div class="soreal-idle-adventure-player-panel-v1" aria-hidden="true"></div>'+
          (fight&&fight.active
            ?'<div class="soreal-idle-adventure-fight-note-v1">⚔️ Combat en cours…</div>'
            :zoneCourante==='safe'
              ?'<div class="soreal-idle-adventure-fight-note-v1">🛡️ Zone sûre : choisis une autre zone pour combattre.</div>'
              :'<div class="soreal-idle-adventure-fight-note-v1">'+idleHtml_(texteProchainCombatAdventureIdleV165_())+'</div>'
          )+
          rendreCommandesAdventureIdleV3_()+
          '<div class="soreal-idle-section-v8">'+
            '<div id="sorealIdleAdventureLogV1" class="soreal-idle-adventure-log-v1">'+
              (idleAdventureLogV1.length
                ?idleAdventureLogV1.map(rendreLigneJournalAventureIdleV1_).join('')
                :'<div class="soreal-idle-adventure-log-line-v1 system">Le journal commencera au prochain combat.</div>'
              )+
            '</div>'+
          '</div>';
      }

function pageAventureIdleV28_(j){
        document.documentElement.setAttribute('data-vue-aventure',REG.idleVueAventureV1);
        const a=aventureMetaIdleV47_(j);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        const debloquee=aventureDebloqueeIdleV47_(j);
        if(!a||!debloquee){
          /* ANTI-SPOIL (règle n°2) : Adventure encore fermé = rien d'affiché (ni cadenas, ni condition). */
          return '';
        }
        const selected=String(a.selectedZone||'safe');
        const zone=zones.find(function(z){return z&&z.id===selected;})||zones.find(function(z){return z&&z.unlocked;})||null;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-226 */
        const titans=(Array.isArray(a.titans)?a.titans:[]).filter(function(t){
          return t&&t.progressionUnlocked!==false;
        });
        const deblocagesDisponibles=objetsDeblocageDisponiblesAdventureIdleV1_(a);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-227 */
        /* Bascule Aventure / Titans (Norman, 2026-10-08) : plus de menu Titans, un bouton au-dessus des zones ouvre la page des titans, le bouton Aventure revient aux zones. Rien n'est affiché tant qu'aucun titan n'est débloqué. */
        const iconeTitan=titans.length&&window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.icone?window.__SOREAL_IDLE_TITANS_V1__.icone(j):'';
        const bascule=titans.length?(
          '<div class="soreal-idle-bascule-aventure-v1'+(iconeTitan?' avec-icone':'')+'">'+
            '<button type="button" class="soreal-idle-expand-button-v25'+(REG.idleVueAventureV1==='titans'?'':' actif')+'" onclick="window.__vueAventureIdleV1__(\'zones\')">🗺️ Aventure</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25'+(REG.idleVueAventureV1==='titans'?' actif':'')+(window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.disponible&&window.__SOREAL_IDLE_TITANS_V1__.disponible(j)?' soreal-idle-titan-brille-v1':'')+'" onclick="window.__vueAventureIdleV1__(\'titans\')">👹 Titans</button>'+iconeTitan+
          '</div>'
        ):(Number(a.titansAccesBoss)>0?(
          /* Exception à la règle n°2 voulue par Norman (2026-10-10) : le bouton Titans se montre avant l'accès, en ???, avec le boss à vaincre ; il n'ouvre rien. */
          '<div class="soreal-idle-bascule-aventure-v1">'+
            '<button type="button" class="soreal-idle-expand-button-v25 actif" onclick="window.__vueAventureIdleV1__(\'zones\')">🗺️ Aventure</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25 soreal-idle-titans-ferme-v1" disabled aria-disabled="true"><b>???</b><small>Vaincs le boss '+idleHtml_(String(Math.floor(Number(a.titansAccesBoss))))+'</small></button>'+
          '</div>'
        ):'');
        if(REG.idleVueAventureV1==='titans'&&titans.length&&window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.section){
          return bascule+window.__SOREAL_IDLE_TITANS_V1__.section(j);
        }
        return bascule+''+
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-228 */
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-229 */
          '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🗺️ Zones</div>'+
            '<div class="soreal-idle-zone-picker-v1">'+
              '<button type="button" class="soreal-idle-zone-arrow-v1" onclick="window.__zoneAdventurePrecedenteV1__()" aria-label="Zone précédente">◀</button>'+
              '<div class="team-sort-custom soreal-idle-zone-custom-v1" id="idleZoneSelectCustom">'+
                '<button type="button" class="team-sort-trigger"'+(window.__SOREAL_IDLE_ZONES_STYLE_V1__&&zone?' style="'+idleHtml_(window.__SOREAL_IDLE_ZONES_STYLE_V1__.style(zone.id,false))+'"':'')+' onclick="window.__toggleMenuZoneAdventureIdleV1__(event)">'+
                  '<span class="team-sort-trigger-main">'+
                    '<span class="team-sort-trigger-label">Zone</span>'+
                    '<span class="team-sort-trigger-value">'+(window.__SOREAL_IDLE_ZONES_STYLE_V1__&&zone?'<span class="zone-ico-v1" aria-hidden="true">'+window.__SOREAL_IDLE_ZONES_STYLE_V1__.icone(zone.id)+'</span>':'')+idleHtml_((zone&&(zone.name||zone.id))||'—')+'</span>'+
                  '</span>'+
                  '<span class="team-sort-arrow">▼</span>'+
                '</button>'+
                '<div class="team-sort-menu">'+
                  /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-230 */
                  zones.filter(function(z){return z&&z.unlocked;}).map(function(z){
                    const active=String(z.id)===selected;
                    /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-231 */
                    const idleInfo=(z.idleP!=null&&z.idleT!=null)
                      ?' · Puissance Idle '+formatGrandNombreIdleV70_(z.idleP)+' · Endurance Idle '+formatGrandNombreIdleV70_(z.idleT)
                      :'';
                    /* Personnalité de la zone (Norman, 2026-10-28, modules/zones-personnalite-v1.js) : icône et couleur de toute la ligne, pour repérer les zones d'un coup d'œil. */
                const perso=window.__SOREAL_IDLE_ZONES_STYLE_V1__;
                const styleZone=perso?' style="'+idleHtml_(perso.style(z.id,active))+'"':'';
                const iconeZone=perso?'<span class="zone-ico-v1" aria-hidden="true">'+perso.icone(z.id)+'</span>':'';
                return '<button type="button" data-zone-id="'+idleHtml_(z.id)+'" class="team-sort-option zone-perso-v1'+(active?' active':'')+'"'+styleZone+' title="Puissance '+formatGrandNombreIdleV70_(z.p||0)+' · Endurance '+formatGrandNombreIdleV70_(z.t||0)+idleInfo+'" onclick="window.__selectionnerZoneAdventureIdleV47__(\''+idleHtml_(z.id)+'\');window.__toggleMenuZoneAdventureIdleV1__();">'+
                      iconeZone+'<span>'+idleHtml_(z.name||z.id)+'</span>'+
                      (active?'<span class="team-sort-option-arrow">✓</span>':'')+
                    '</button>';
                  }).join('')+
                '</div>'+
              '</div>'+
              '<button type="button" class="soreal-idle-zone-arrow-v1" onclick="window.__zoneAdventureSuivanteV1__()" aria-label="Zone suivante">▶</button>'+
            '</div>'+
          '</div>'+
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-232 */
          (zone?rendreZoneCombatAdventureIdleV1_(a,j.nom):'')+
          /* Les cartes des titans ont leur propre vue dans cette page (bouton « Titans » en haut, modules/titans-v1.js). */''+
          (deblocagesDisponibles.length?'<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🎒 Un objet t’attend : ton sac est plein</div><div style="display:grid;gap:8px">'+deblocagesDisponibles.map(function(id){const d=IDLE_ADVENTURE_UNLOCK_ITEMS_V1[id];return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:rgba(255,200,120,.08);border:1px solid rgba(255,200,120,.35)"><span><b>'+idleHtml_(d.nom)+'</b><br><small>Libère une place dans ton sac : l’objet y arrivera, puis utilise-le pour débloquer '+idleHtml_(d.systeme)+'.</small></span></div>';}).join('')+'</div></div>':'')+
          /* 2026-09-24 (Norman : « trop de menus sur téléphone ») : tout l'Inventory (équipement, sac, coffre, options) est maintenant sous la page Adventure. */
          (j.inventaireDebloque?pageInventaireIdleV28_(j):'');
      }

      function libelleRecompenseSetAdventureIdleV163_(reward){
        const r=reward&&typeof reward==='object'?reward:{};
        const parts=[];
        const addNombre=function(key,label,suffix){
          const value=idleNombre_(r[key]);
          if(value)parts.push('+'+formatGrandNombreIdleV70_(value)+(suffix||'')+' '+label);
        };
        addNombre('experience','EXP');
        addNombre('ap','AP');
        addNombre('energySpeed','Energy Speed');
        addNombre('energyPower','Energy Power');
        addNombre('energyBars','Energy Bars');
        addNombre('magicPower','Magic Power');
        addNombre('magicBars','Magic Bars');
        addNombre('magicCap','Magic Cap');
        if(idleNombre_(r.respawn)>0)parts.push('Ennemis Adventure '+formatGrandNombreIdleV70_(idleNombre_(r.respawn)*100,2)+' % plus rapides');
        if(idleNombre_(r.drop)>0)parts.push('+'+formatGrandNombreIdleV70_(idleNombre_(r.drop)*100,2)+' % Drop Chance');
        if(r.safeZoneRegen10x)parts.push('Safe Zone : HP Regen ×10');
        if(r.noEquipmentChallenge)parts.push('Débloque No Equipment Challenge');
        if(r.idleAttack)parts.push('Idle Attack améliorée');
        if(r.wandoosMeh)parts.push('Wandoos MEH débloqué');
        if(idleNombre_(r.diggerSlot)>0)parts.push('+'+idleEntier_(r.diggerSlot)+' emplacement Digger');
        if(idleNombre_(r.luckyCharms)>0)parts.push('+'+idleEntier_(r.luckyCharms)+' Lucky Charms');
        if(idleNombre_(r.extraDropLevelChance)>0)parts.push('+'+formatGrandNombreIdleV70_(idleNombre_(r.extraDropLevelChance)*100,2)+' % chance niveau de drop bonus');
        if(idleNombre_(r.boostEffectiveness)>0)parts.push('+'+formatGrandNombreIdleV70_(idleNombre_(r.boostEffectiveness)*100,2)+' % efficacité des Boosts');
        if(idleNombre_(r.nguSpeedPct)>0)parts.push('+'+formatGrandNombreIdleV70_(r.nguSpeedPct,2)+' % NGU Speed');
        return parts.length?parts.join(' · '):'Récompense NGU sans bonus numérique affichable ici';
      }

      /* Special Boost (2026-09-25) : un objet accepte encore un boost tant qu'UN de ses Specials n'est pas plein (les points remplissent les Specials dans l'ordre de la fiche). */
      function specialAcceptePlusDeBoostIdleV1_(item){
        const tous=item&&Array.isArray(item.specialsAll)?item.specialsAll:null;
        if(!tous||!tous.length)return null;
        return tous.some(function(sv){return idleNombre_(sv.value)+1e-9<idleNombre_(sv.max);});
      }

      /*
       * 2026-09-23 : le drapeau "occupé" vit UNIQUEMENT dans le module
       * meta-progression-v130.js (celui qui envoie réellement les requêtes).
       * Depuis le split UI V9, ce monolithe en gardait une copie jamais
       * assignée, donc toujours false : la résolution d'un combat de zone
       * n'était jamais acquittée (idleAdventureResolutionPendingV2 restait
       * armé) et le combat suivant ne démarrait plus, jusqu'au rechargement.
       */
      function metaOccupeIdleV130_(){
        const api=window.__SOREAL_IDLE_META_V130__;
        return Boolean(api&&typeof api.estOccupeIdleV130_==="function"&&api.estOccupeIdleV130_());
      }

      function actionMetaIdleV130_(payload){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.actionMetaIdleV130_==='function'){
          return api.actionMetaIdleV130_(payload);
        }
      }

      /*
       * ANTI-SPOIL (règle n°2, Norman 2026-10-08 : « on peut acheter des choses pour des menus qu'on n'a pas encore débloqués : graines, Yggdrasil… ») : un article de la boutique AP
       * lié à un système encore verrouillé n'apparaît pas du tout (ni nom, ni prix, ni rayon qui ne contiendrait que lui).
       */
      const IDLE_AP_SYSTEME_DE_L_ARTICLE_V1={
        magicPotionAlpha:'bloodMagic',magicPotionBeta:'bloodMagic',magicPotionDelta:'bloodMagic',magicBarBar:'bloodMagic',
        resource3PotionAlpha:'hacks',resource3PotionBeta:'hacks',resource3PotionDelta:'hacks',
        macguffinMuffin:'macguffins',
        icarusFertilizer1:'yggdrasil',icarusFertilizer10:'yggdrasil',icarusFertilizer100:'yggdrasil',yggdrasilHarvestLight:'yggdrasil',heartBrown:'yggdrasil',
        littleBluePill1000:'tower',littleBluePill10000:'tower',littleBluePill100000:'tower',lazyItopodFloorShifter:'tower',heartGreen:'tower',pp25:'tower',pp100:'tower',pp500:'tower',
        beastButter1:'questing',beastButter10:'questing',beastButter100:'questing',questReminder:'questing',fasterQuesting:'questing',extendedQuestBank:'questing',goToQuestZoneButton:'questing',heartOrange:'questing',
        mayoInfuser:'cards',regularBlackPens:'cards',mayoGenerator:'cards',extraDeckSize:'cards',extraTagSlot:'cards',heartRainbow:'cards',
        luckyCharm:'adventure',superLuckyCharm:'adventure',improvedLootFilter:'adventure',extraInventorySpace:'adventure',autoMergeBoostTimers:'adventure',filterBoostsIntoCube:'adventure',loadoutSlot:'adventure',
        extraAccessorySlot1:'adventure',extraAccessorySlot2:'adventure',extraAccessorySlot3:'adventure',extraAccessorySlot4:'adventure',extraAccessorySlot5:'adventure',extraAccessorySlotEvil:'adventure',
        autoNuker:'adventure',inventoryMergeSlots:'adventure',adventureLight:'adventure',adventureAdvancer:'adventure',
        customEnergyMagicButtons:'bloodMagic',moreCustomEnergyMagicButtons:'bloodMagic',customIdleEnergyMagicButtons:'bloodMagic',
        dailySpinTimeBank:'dailySpin',extraBeardSlot:'beards',daycareSpeedBoost:'daycare',daycareKittyArt:'daycare',diggerSlots:'diggers',macguffinSlot:'macguffins',heartPurple:'macguffins',
        nguCapModifier:'ngu',customResource3Button:'hacks',anotherCustomResource3Button:'hacks',customIdleResource3Button:'hacks',resource3NameRandomizer:'hacks',heartGrey:'hacks',
        fasterWishes:'wishes',heartPink:'wishes'
      };

      function articleApVisibleIdleV1_(j,item){
        if(!item||item.effectActive!==true)return false;
        const systeme=IDLE_AP_SYSTEME_DE_L_ARTICLE_V1[item.id];
        if(!systeme)return true;
        if(systeme==='adventure'){
          const rec=j&&j.systemes&&j.systemes.records;
          return Boolean(rec&&idleNombre_(rec.highestBoss)>=4);
        }
        const sys=systemeMetaParIdIdleV130_(j,systeme);
        return Boolean(sys&&sys.state&&sys.state.unlocked);
      }

  Object.assign(REG,{
    idleNombre_:idleNombre_,
    idleEntier_:idleEntier_,
    pousserEtatVersRuntimePartageIdleV1_:pousserEtatVersRuntimePartageIdleV1_,
    formaterPvFixeIdleV1_:formaterPvFixeIdleV1_,
    poserNoteCombatAdventureIdleV1_:poserNoteCombatAdventureIdleV1_,
    surveillerEvenementsAventureIdleV1_:surveillerEvenementsAventureIdleV1_,
    rendrePendingIdleV7_:rendrePendingIdleV7_,
    idleFastCountObjectV60_:idleFastCountObjectV60_,
    equiperObjetIdleV10_:equiperObjetIdleV10_,
    acheterAmeliorationIdleV12_:acheterAmeliorationIdleV12_,
    zoneAventureLocaleIdleV30_:zoneAventureLocaleIdleV30_,
    cooldownAventureRestantIdleV100_:cooldownAventureRestantIdleV100_,
    actualiserCooldownAventureIdleV100_:actualiserCooldownAventureIdleV100_,
    combattreAventureIdleV17_:combattreAventureIdleV17_,
    renaitreIdleV14_:renaitreIdleV14_,
    formatGrandNombreIdleV70_:formatGrandNombreIdleV70_,
    ajouterLogAventureIdleV1_:ajouterLogAventureIdleV1_,
    verifierDefaiteAutoAventureIdleV1_:verifierDefaiteAutoAventureIdleV1_,
    dessinerJournalAventureIdleV1_:dessinerJournalAventureIdleV1_,
    restaurerScrollJournalAventureIdleV1_:restaurerScrollJournalAventureIdleV1_,
    resumeStatsIdleV28_:resumeStatsIdleV28_,
    aventureMetaIdleV47_:aventureMetaIdleV47_,
    aventureDebloqueeIdleV47_:aventureDebloqueeIdleV47_,
    revisionAdventureServeurIdleV208_:revisionAdventureServeurIdleV208_,
    fusionnerAdventureServeurAvecInventaireLocalV208_:fusionnerAdventureServeurAvecInventaireLocalV208_,
    joueurAvecAdventureIdleV208_:joueurAvecAdventureIdleV208_,
    memoriserAdventureDiffereeIdleV208_:memoriserAdventureDiffereeIdleV208_,
    appliquerAdventureDiffereeIdleV208_:appliquerAdventureDiffereeIdleV208_,
    estMutationInventaireAdventureIdleV160_:estMutationInventaireAdventureIdleV160_,
    casesSacAdventureIdleV162_:casesSacAdventureIdleV162_,
    patchInventaireAdventureIdleV160_:patchInventaireAdventureIdleV160_,
    remplacerAdventureInventaireIdleV160_:remplacerAdventureInventaireIdleV160_,
    equipementBloqueParDefiIdleV1_:equipementBloqueParDefiIdleV1_,
    actionAdventureIdleV47_:actionAdventureIdleV47_,
    selectionnerZoneAdventureIdleV47_:selectionnerZoneAdventureIdleV47_,
    patchZoneAdventureSansReflowIdleV1_:patchZoneAdventureSansReflowIdleV1_,
    zoneAdventurePrecedenteV1_:zoneAdventurePrecedenteV1_,
    zoneAdventureSuivanteV1_:zoneAdventureSuivanteV1_,
    fxIdleV1_:fxIdleV1_,
    titanMultDegatsJoueurIdleV1_:titanMultDegatsJoueurIdleV1_,
    titanJoueurParalyseIdleV1_:titanJoueurParalyseIdleV1_,
    reinitialiserHorlogeRegenReposAdventureIdleV166_:reinitialiserHorlogeRegenReposAdventureIdleV166_,
    ecouleRegenReposAdventureIdleV166_:ecouleRegenReposAdventureIdleV166_,
    texteProchainCombatAdventureIdleV165_:texteProchainCombatAdventureIdleV165_,
    annulerRespawnAdventureIdleV165_:annulerRespawnAdventureIdleV165_,
    programmerRespawnAdventureIdleV165_:programmerRespawnAdventureIdleV165_,
    competenceAdventureDisponibleIdleV4_:competenceAdventureDisponibleIdleV4_,
    definitionCompetenceAdventureIdleV3_:definitionCompetenceAdventureIdleV3_,
    beastModeActifAdventureIdleV4_:beastModeActifAdventureIdleV4_,
    multiplicateurPowerManuelAdventureIdleV3_:multiplicateurPowerManuelAdventureIdleV3_,
    multiplicateurToughnessManuelAdventureIdleV3_:multiplicateurToughnessManuelAdventureIdleV3_,
    intervalleIdleAttackAdventureIdleV4_:intervalleIdleAttackAdventureIdleV4_,
    cooldownDureeAdventureIdleV4_:cooldownDureeAdventureIdleV4_,
    rafraichirCommandesAdventureIdleV3_:rafraichirCommandesAdventureIdleV3_,
    basculerIdleModeAdventureIdleV3_:basculerIdleModeAdventureIdleV3_,
    attaqueManuelleAdventureIdleV3_:attaqueManuelleAdventureIdleV3_,
    utiliserCompetenceAdventureIdleV3_:utiliserCompetenceAdventureIdleV3_,
    rendreCommandesAdventureIdleV3_:rendreCommandesAdventureIdleV3_,
    libelleEnnemiAdventureIdleV1_:libelleEnnemiAdventureIdleV1_,
    regenReposAdventureIdleV3_:regenReposAdventureIdleV3_,
    facteurAleatoireDegatsAdventureIdleV2_:facteurAleatoireDegatsAdventureIdleV2_,
    degatsJoueurAdventureIdleV2_:degatsJoueurAdventureIdleV2_,
    degatsEnnemiAdventureIdleV2_:degatsEnnemiAdventureIdleV2_,
    multiplicateurIdleAttackAdventureIdleV2_:multiplicateurIdleAttackAdventureIdleV2_,
    intervalleAttaqueEnnemiAdventureIdleV2_:intervalleAttaqueEnnemiAdventureIdleV2_,
    identiteFightAdventureIdleV2_:identiteFightAdventureIdleV2_,
    memoriserRestPvIdleV1_:memoriserRestPvIdleV1_,
    resetHorlogesFightAdventureIdleV2_:resetHorlogesFightAdventureIdleV2_,
    envoyerResolutionAdventurePendingV2_:envoyerResolutionAdventurePendingV2_,
    appliquerRegenCombatAdventureIdleV2_:appliquerRegenCombatAdventureIdleV2_,
    terminerCombatAdventureLocalV2_:terminerCombatAdventureLocalV2_,
    impactMonstreAdventureIdleV1_:impactMonstreAdventureIdleV1_,
    trouverWalderpIdleV147_:trouverWalderpIdleV147_,
    utiliserObjetDeblocageIdleV1_:utiliserObjetDeblocageIdleV1_,
    consommerDeblocageAdventureIdleV47_:consommerDeblocageAdventureIdleV47_,
    consommerObjetSkillAdventureIdleV4_:consommerObjetSkillAdventureIdleV4_,
    transformerObjetAdventureIdleV4_:transformerObjetAdventureIdleV4_,
    equiperObjetAdventureIdleV47_:equiperObjetAdventureIdleV47_,
    desequiperObjetAdventureIdleV47_:desequiperObjetAdventureIdleV47_,
    fusionnerObjetAdventureIdleV47_:fusionnerObjetAdventureIdleV47_,
    boosterCubeAdventureIdleV47_:boosterCubeAdventureIdleV47_,
    actionMetaV47_:actionMetaV47_,
    setDiggerIdleV47_:setDiggerIdleV47_,
    toggleDiggerIdleV47_:toggleDiggerIdleV47_,
    toggleMenuZoneAdventureIdleV1_:toggleMenuZoneAdventureIdleV1_,
    pageAventureIdleV28_:pageAventureIdleV28_,
    libelleRecompenseSetAdventureIdleV163_:libelleRecompenseSetAdventureIdleV163_,
    specialAcceptePlusDeBoostIdleV1_:specialAcceptePlusDeBoostIdleV1_,
    metaOccupeIdleV130_:metaOccupeIdleV130_,
    articleApVisibleIdleV1_:articleApVisibleIdleV1_
  });
})();
