/*
 * SOREAL IDLE — Système Méta (Yggdrasil, Gold Diggers, Perks, Quirks,
 * ITOPOD, Challenges, Augmentations, Time Machine, Blood Magic,
 * Money Pit / Daily Spin, Boutique EXP).
 * Extrait du monolithe soreal-idle-ui.js (UI split V9), sans changement
 * fonctionnel : mêmes fonctions, mêmes signatures, mêmes bridges
 * window.__x__ pour les gestionnaires onclick inline.
 *
 * Ce module dépend d'état et de fonctions qui vivent dans la fermeture
 * du monolithe (session, état joueur en cours, synchronisation serveur,
 * rendu partagé). Comme le monolithe et ce module s'exécutent dans deux
 * portées JS séparées (deux balises <script> distinctes), ces
 * dépendances sont exposées explicitement par le monolithe via
 * window.__SOREAL_IDLE_META_HOST_V130__ avant tout appel réel (l'ordre
 * de chargement des <script> n'a pas d'importance (les modules chargent
 * avant le monolithe) : ce pont n'est relu qu'au moment de l'exécution
 * réelle des fonctions ci-dessous, jamais au chargement du module.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_META_V130__)return;

      let idleMetaBusyV130=false;


      function systemeMetaParIdIdleV130_(j,id){
        const liste=
          j&&j.systemes&&Array.isArray(j.systemes.systems)
            ?j.systemes.systems
            :[];

        return liste.find(function(s){
          return s&&s.id===String(id||'');
        }) || null;
      }


      /*
       * 2026-09-23 : un startZoneFight qui n'aboutit pas (verrou serveur
       * SOREAL_IDLE_OCCUPE, timeout réseau, refus serveur, appel abandonné
       * car le module était occupé) laissait idleAdventureRespawnStartPendingV165
       * à true pour toujours : plus aucun respawn n'était reprogrammé et
       * l'aventure restait figée jusqu'à un aller-retour Safe Zone.
       */
      function estDemarrageCombatZoneV1_(payload){
        return Boolean(
          payload&&
          payload.action==='adventure'&&
          payload.adventure&&
          payload.adventure.action==='startZoneFight'
        );
      }

      function libererDemarrageCombatEnEchecV1_(payload){
        if(estDemarrageCombatZoneV1_(payload)){
          window.__SOREAL_IDLE_META_HOST_V130__.setIdleAdventureRespawnStartPending(false);
        }
      }

      function actionMetaIdleV130_(payload){
        if(
          idleMetaBusyV130 ||
          !SOREAL_SESSION
        ){
          libererDemarrageCombatEnEchecV1_(payload);
          return;
        }

        idleMetaBusyV130=true;

        window.__SOREAL_IDLE_META_HOST_V130__.appelerProgressionIdleCloudflareV1_(
          payload||{},
          function(res){
            idleMetaBusyV130=false;

            if(
              res &&
              res.ok &&
              res.joueur
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-287 */
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-288 */
              const adventureRestPvAvantV1=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat()&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().adventureRestPv;
              const joueurMetaProtegeV208=
                window.__SOREAL_IDLE_META_HOST_V130__.protegerJoueurServeurInventaireIdleV208_(
                  res.joueur
                );
              if(!window.__SOREAL_IDLE_META_HOST_V130__.appliquerSynchroCombatSansReflowIdleV116_(joueurMetaProtegeV208)){
                window.__SOREAL_IDLE_META_HOST_V130__.setIdleEtat(joueurMetaProtegeV208);
                if(adventureRestPvAvantV1!=null)window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().adventureRestPv=adventureRestPvAvantV1;
              }

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-289 */
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-290 */
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-291 */
              const estCycleCombatZoneV1=Boolean(
                payload&&
                payload.action==='adventure'&&
                payload.adventure&&
                ['startZoneFight','resolveZoneFight','loseZoneFight'].indexOf(payload.adventure.action)!==-1
              );
              if(
                payload&&payload.action==='adventure'&&payload.adventure&&
                payload.adventure.action==='startZoneFight'
              ){
                window.__SOREAL_IDLE_META_HOST_V130__.setIdleAdventureRespawnStartPending(false);
              }

              const estMutationInventaireAdventureV1=Boolean(
                payload&&
                payload.action==='adventure'&&
                payload.adventure&&
                window.__SOREAL_IDLE_META_HOST_V130__.estMutationInventaireAdventureIdleV160_(payload.adventure)
              );

              if(!estCycleCombatZoneV1){
                if(estMutationInventaireAdventureV1){
                  const aventureFraicheV1=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(joueurMetaProtegeV208);
                  const aventureCouranteV1=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
                  const fightLocalV1=aventureCouranteV1&&aventureCouranteV1.fight&&aventureCouranteV1.fight.active
                    ?aventureCouranteV1.fight
                    :null;
                  if(aventureFraicheV1&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat()&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes){
                    window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes=Object.assign({},window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes,{
                      adventure:Object.assign(
                        {},
                        aventureFraicheV1,
                        fightLocalV1?{fight:fightLocalV1}:{}
                      )
                    });
                  }
                  window.__SOREAL_IDLE_META_HOST_V130__.patchInventaireAdventureIdleV160_(
                    window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
                    {
                      action:payload.adventure.action,
                      confirmed:true
                    }
                  );
                }else{
                  window.__SOREAL_IDLE_META_HOST_V130__.rendreIdleEtat_({
                    ok:true,
                    joueur:joueurMetaProtegeV208
                  });
                }
              }else if(
                payload&&
                payload.adventure&&
                payload.adventure.action==='loseZoneFight'
              ){
                window.__SOREAL_IDLE_META_HOST_V130__.patchZoneAdventureSansReflowIdleV1_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
              }else if(
                payload&&
                payload.adventure&&
                payload.adventure.action==='resolveZoneFight'
              ){
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-292 */
                window.__SOREAL_IDLE_META_HOST_V130__.patchInventaireAdventureIdleV160_(
                  window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
                  {action:'loot',confirmed:true}
                );
              }
              window.__SOREAL_IDLE_META_HOST_V130__.pousserEtatVersRuntimePartageIdleV1_();

              if(
                res.resultat &&
                Object.keys(res.resultat).length
              ){
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-293 */
                if(!estCycleCombatZoneV1){
                  window.__SOREAL_IDLE_META_HOST_V130__.messageFlottantIdleV32_(
                    '✅ Progression mise à jour'
                  );
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-294 */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='loseZoneFight'
                ){
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_('💀 Vaincu ! Retour à la Safe Zone pour te soigner.');
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-295 */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='resolveZoneFight'
                ){
                  if(Array.isArray(res.resultat.drops)&&res.resultat.drops.length){
                    res.resultat.drops.forEach(function(objet){
                      const aventureLoot=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
                      const sacLoot=aventureLoot&&Array.isArray(aventureLoot.inventory)
                        ?aventureLoot.inventory
                        :[];
                      const objetSnapshot=sacLoot.find(function(x){
                        return String(x&&x.id||'')===String(objet&&objet.id||'');
                      })||objet;
                      const rarete=window.__SOREAL_IDLE_META_HOST_V130__.idleRareteClasseObjetAdventureIdleV1_(objetSnapshot);
                      const classeLog=rarete
                        ?rarete.replace('idle-rarity-','idle-loot-rarity-')
                        :'';
                      window.__SOREAL_IDLE_META_HOST_V130__.ajouterLogAventureIdleV1_(
                        'system',
                        (objet&&(objet.name||objet.nom)||'Un objet')+' obtenu !',
                        classeLog
                      );
                    });
                  }
                  if(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.gold)>0){
                    window.__SOREAL_IDLE_META_HOST_V130__.ajouterLogAventureIdleV1_(
                      'system',
                      '+ '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.gold)+' or ! Chouette !'
                    );
                  }
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-296 */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='consumeUnlock'&&
                  res.resultat.flag
                ){
                  const nomsSystemesDeblocageV1={
                    ngu:'NGU',yggdrasil:'Yggdrasil',diggers:'Diggers',
                    beards:'Beards',tower:'la Tour',wandoos:'Wandoos'
                  };
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '🔓 '+
                    (nomsSystemesDeblocageV1[res.resultat.flag]||res.resultat.flag)+
                    ' débloqué !'
                  );
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-297 */
                if(
                  payload&&payload.action==='moneyPit'&&
                  res.resultat.reward
                ){
                  const libelleBoost=res.resultat.boost
                    ?'Boost '+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res.resultat.boost.type)+' +'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.boost.strength)+' · '
                    :'';
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '🕳️ Lot remporté : '+
                    libelleBoost+
                    formaterRecompenseIdleV1_(res.resultat.reward)
                  );
                }
                if(
                  payload&&payload.action==='collect'&&
                  payload.system==='dailySpin'&&
                  res.resultat.reward
                ){
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '🎡 Lot remporté : '+
                    formaterRecompenseIdleV1_(res.resultat.reward)
                  );
                }
              }

              return;
            }

            libererDemarrageCombatEnEchecV1_(payload);

            window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
              res&&res.message
                ?res.message
                :'Action impossible.'
            );
          },
          function(e){
            idleMetaBusyV130=false;
            libererDemarrageCombatEnEchecV1_(payload);

            window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur de métaprogression.'
            );
          }
        );
      }


      function ajusterAllocationMetaIdleV130_(
        systemeId,
        ressource,
        delta
      ){
        const s=
          systemeMetaParIdIdleV130_(
            window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
            systemeId
          );

        if(!s)return;

        const actuelle=
          window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(
            s.state&&
            s.state.allocation&&
            s.state.allocation[ressource]
          );

        actionMetaIdleV130_({
          action:'allocate',
          system:systemeId,
          resource:ressource,
          value:Math.max(
            0,
            Math.min(
              100,
              actuelle+
              window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(delta)
            )
          )
        });
      }


      function toggleSystemeMetaIdleV130_(id){
        const s=
          systemeMetaParIdIdleV130_(
            window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
            id
          );

        actionMetaIdleV130_({
          action:'toggle',
          system:id,
          active:!(
            s&&s.state&&s.state.active
          )
        });
      }


      function collecterSystemeMetaIdleV130_(id){
        actionMetaIdleV130_({
          action:'collect',
          system:id
        });
      }


      window.__actionMetaIdleV130__=
        actionMetaIdleV130_;

      window.__ajusterAllocationMetaIdleV130__=
        ajusterAllocationMetaIdleV130_;

      window.__toggleSystemeMetaIdleV130__=
        toggleSystemeMetaIdleV130_;

      window.__collecterSystemeMetaIdleV130__=
        collecterSystemeMetaIdleV130_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-298 */
      const IDLE_LIBELLES_MONNAIE_RECOMPENSE_V1={
        gold:'🪙 Or',experience:'⭐ EXP',ap:'💠 AP',pp:'🔷 PP',
        seeds:'🌱 Graines',blood:'🩸 Sang'
      };
      function formaterRecompenseIdleV1_(reward){
        return Object.keys(reward||{}).map(function(cle){
          return '+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(reward[cle]))+' '+
            (IDLE_LIBELLES_MONNAIE_RECOMPENSE_V1[cle]||cle);
        }).join(' · ')||'rien';
      }

      function libelleRessourceMetaIdleV130_(id){const api=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;return api&&typeof api.libelleRessource==='function'?api.libelleRessource(id):String(id||'');}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-299 */
      const IDLE_SPEND_EXP_STATS_V1=[
        {
          id:'speed',
          nom:'Vitesse',
          icone:'⏩',
          explication:'Augmente la vitesse à laquelle cette ressource est générée : plus la valeur est élevée, plus vite ta barre progresse.'
        },
        {
          id:'power',
          nom:'Puissance',
          icone:'💪',
          explication:'Augmente la quantité de ressource produite à chaque génération.'
        },
        {
          id:'cap',
          nom:'Plafond',
          icone:'📦',
          explication:'Augmente la quantité maximale de ressource que tu peux stocker.'
        },
        {
          id:'bars',
          nom:'Barres',
          icone:'📊',
          explication:'Augmente le nombre de barres de cette ressource et donc ta capacité de progression.'
        }
      ];

      function idleExpShopIdInput_(res,stat){
        return 'idle-exp-qty-'+res+'-'+stat;
      }
      function idleExpShopIdApercu_(res,stat){
        return 'idle-exp-cost-'+res+'-'+stat;
      }

      function idleExpShopBoutonsLotIdleV1_(res,stat,achat){
        const tiers=Array.isArray(achat.bulkTiers)&&achat.bulkTiers.length?achat.bulkTiers:[1];
        return '<div class="soreal-idle-exp-actions-v210">'+tiers.map(function(qty){
          const cout=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((achat.cost||0)*qty);
          const gain=window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_((achat.gain||0)*qty,2);
          return '<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterRessourceMetaIdleV130__(\''+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\','+qty+')">'+
              '<b>+'+gain+'</b>'+
              '<small>×'+qty+' achat'+(qty>1?'s':'')+' · '+cout+' EXP</small>'+
            '</button>';
        }).join('')+'</div>';
      }

      function idleExpShopLotPersonnaliseIdleV1_(res,stat,achat){
        const idInput=idleExpShopIdInput_(res,stat);
        const idApercu=idleExpShopIdApercu_(res,stat);
        const coutUnitaire=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(achat.cost||0);
        return '<div class="soreal-idle-exp-custom-v210">'+
          '<label>Quantité personnalisée</label>'+
          '<input type="number" min="1" step="1" value="1" id="'+idHtml_attr_(idInput)+'" '+
            'oninput="window.__idleExpShopApercuLotPersonnalise__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\','+coutUnitaire+')">'+
          '<button type="button" class="soreal-idle-exp-buy-v210 primary" onclick="window.__acheterRessourceLotPersonnaliseMetaIdleV130__(\''+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\')">'+
            '<b>Acheter</b><small><span id="'+idHtml_attr_(idApercu)+'">'+coutUnitaire+'</span> EXP</small>'+
          '</button>'+
        '</div>';
      }

      function idHtml_attr_(v){const a=window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__;return a&&a.attr?a.attr(v):String(v||'');}

      window.__idleExpShopApercuLotPersonnalise__=function(res,stat,coutUnitaire){
        const input=document.getElementById(idleExpShopIdInput_(res,stat));
        const apercu=document.getElementById(idleExpShopIdApercu_(res,stat));
        if(!input||!apercu)return;
        let qty=Math.floor(Number(input.value));
        if(!Number.isFinite(qty)||qty<1)qty=1;
        apercu.textContent=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(coutUnitaire*qty);
      };

      function idleExpShopNewbieOffersIdleV1_(res,stat,offres,utilisees){
        const restantes=(offres||[]).filter(function(o){return utilisees.indexOf(o.id)===-1;});
        if(!restantes.length)return '';
        return '<div class="soreal-idle-exp-newbie-v210">'+
          '<div class="soreal-idle-window-title-v31">🎁 Offres débutant</div>'+
          '<div class="soreal-idle-note-v4">Offres à usage unique : elles disparaissent après achat.</div>'+
          '<div class="soreal-idle-exp-actions-v210">'+
            restantes.map(function(o){
              return '<button type="button" class="soreal-idle-exp-buy-v210 offer" onclick="window.__acheterNewbieOfferMetaIdleV130__(\''+
                window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(o.id)+'\')">'+
                '<b>Offre unique</b><small>+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(o.gain,2)+' · '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(o.cost)+' EXP</small>'+
              '</button>';
            }).join('')+
          '</div>'+
        '</div>';
      }

      function idleExpShopStatBlocIdleV1_(res,stat,x,achat,verrou,newbieCatalogue,newbieUtilisees){
        const auMax=achat&&window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x[stat.id])>=achat.hardCap-1e-9;
        const verrouille=achat&&achat.unlockBoss&&verrou&&verrou.unlocked===false;
        return '<div class="soreal-idle-exp-stat-v210">'+
          '<div class="soreal-idle-exp-stat-head-v210">'+
            '<span>'+stat.icone+' '+stat.nom+'</span>'+
            '<div class="soreal-idle-exp-current-v211"><small>Actuel</small><strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(x[stat.id]||0,2)+'</strong></div>'+
          '</div>'+
          '<div class="soreal-idle-exp-help-v210">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat.explication||'')+'</div>'+
          (!achat
            ?'<div class="soreal-idle-note-v4">Indisponible.</div>'
            :verrouille
              ?'<div class="soreal-idle-exp-lock-v210">🔒 Atteins le Boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(verrou.neededBosses)+' pour débloquer cet achat.</div>'
              :auMax
                ?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>'
                :idleExpShopBoutonsLotIdleV1_(res.id,stat.id,achat)+
                  idleExpShopLotPersonnaliseIdleV1_(res.id,stat.id,achat)+
                  idleExpShopNewbieOffersIdleV1_(res.id,stat.id,(newbieCatalogue&&newbieCatalogue[stat.id])||null,newbieUtilisees)
          )+
        '</div>';
      }

      function pageSpendExpIdleV1_(j){
        const m=j&&j.systemes?j.systemes:{};
        const r=m.resources||{};
        const achats=m.resourcePurchases||{};
        const verrousBoss=m.resourcePurchaseUnlock||{};
        const newbie=m.newbieOffers||{};
        const newbieCatalogueParRessource=newbie.catalog||{};
        const newbieUtilisees=Array.isArray(newbie.used)?newbie.used:[];
        const exp=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((m.currencies&&m.currencies.experience)||0);
        const magicSysteme=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const r3Systeme=systemeMetaParIdIdleV130_(j,'hacks');
        const ressources=[
          {id:'energy',unlocked:Boolean(m.records&&window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(m.records.highestBoss)>=1)},
          {id:'magic',unlocked:Boolean(magicSysteme&&magicSysteme.state&&magicSysteme.state.unlocked)},
          {id:'r3',unlocked:Boolean(r3Systeme&&r3Systeme.state&&r3Systeme.state.unlocked)}
        ];

        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
          '✨ Boutique EXP',
          'Utilise ton EXP pour améliorer durablement la génération et la capacité de tes ressources.'
        )+
        '<style>'+
          '.soreal-idle-exp-balance-v210{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 17px;margin:0 0 14px;border-radius:16px;background:#17203f;color:#fff;border:1px solid #17203f;box-shadow:0 8px 18px rgba(23,32,63,.16)}'+
          '.soreal-idle-exp-balance-v210 span{font-size:12px;font-weight:900;letter-spacing:.02em;color:#fff}.soreal-idle-exp-balance-v210 b{display:inline-flex;align-items:center;justify-content:center;min-width:72px;padding:7px 11px;border-radius:999px;background:#f1c65b;color:#17203f;font-size:18px;line-height:1;font-weight:1000;box-shadow:inset 0 1px 0 rgba(255,255,255,.55)}'+
          '.soreal-idle-exp-resource-v210{margin:16px 0 8px;padding:10px 13px;border-radius:12px;background:#e9edf7;color:#27334f;border-left:4px solid #5968ee;border-top:1px solid #d8deec;border-right:1px solid #d8deec;border-bottom:1px solid #d8deec;font-size:13px;font-weight:1000;letter-spacing:.01em}'+
          '.soreal-idle-exp-stat-v210{margin:8px 0;padding:14px;border-radius:15px;background:#fff;color:#17203f;border:1px solid #d9dfeb;box-shadow:0 4px 13px rgba(31,41,70,.06)}'+
          '.soreal-idle-exp-stat-head-v210{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#17203f;font-size:14px;font-weight:1000}.soreal-idle-exp-stat-head-v210>span{min-width:0}'+
          '.soreal-idle-exp-current-v211{display:flex;align-items:baseline;gap:6px;flex:0 0 auto;padding:5px 8px;border-radius:9px;background:#f1f3f8;color:#17203f;border:1px solid #e0e4ee}.soreal-idle-exp-current-v211 small{font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:#6f7789;font-weight:900}.soreal-idle-exp-current-v211 strong{font-size:14px;color:#17203f;font-weight:1000}'+
          '.soreal-idle-exp-help-v210{margin:6px 0 12px;color:#596174;font-size:11px;line-height:1.5;font-weight:750}'+
          '.soreal-idle-exp-actions-v210{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:7px}'+
          '.soreal-idle-exp-buy-v210{appearance:none;min-height:48px;border:1px solid #243154;border-radius:11px;padding:8px 10px;background:#26345a;color:#fff !important;cursor:pointer;text-align:left;display:flex;flex-direction:column;justify-content:center;gap:3px;box-shadow:0 3px 8px rgba(31,41,70,.12);transition:transform .12s ease,background .12s ease,box-shadow .12s ease}'+
          '.soreal-idle-exp-buy-v210:hover{background:#33436f;box-shadow:0 5px 12px rgba(31,41,70,.16);transform:translateY(-1px)}.soreal-idle-exp-buy-v210:active{transform:translateY(0)}.soreal-idle-exp-buy-v210 b{font-size:12px;line-height:1.1;color:#fff !important}.soreal-idle-exp-buy-v210 small{font-size:9px;line-height:1.25;color:#dce3f2 !important;opacity:1}'+
          '.soreal-idle-exp-buy-v210.primary{background:#5968ee;border-color:#4d5bdd;color:#fff !important}.soreal-idle-exp-buy-v210.primary:hover{background:#4d5bdd}.soreal-idle-exp-buy-v210.offer{background:#fff4cf;border-color:#e5c86c;color:#5e4810 !important;box-shadow:none}.soreal-idle-exp-buy-v210.offer b,.soreal-idle-exp-buy-v210.offer small{color:#5e4810 !important}.soreal-idle-exp-buy-v210.offer:hover{background:#ffedb2}'+
          '.soreal-idle-exp-custom-v210{display:grid;grid-template-columns:minmax(120px,1fr) 90px minmax(112px,auto);gap:7px;align-items:end;margin-top:9px;padding-top:9px;border-top:1px solid #e5e8f0}.soreal-idle-exp-custom-v210 label{grid-column:1/-1;font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#6d7485;font-weight:900}.soreal-idle-exp-custom-v210 input{width:100%;height:43px;box-sizing:border-box;padding:9px 10px;border-radius:10px;border:1px solid #cfd6e3;background:#fff;color:#17203f;font-weight:900;outline:none}.soreal-idle-exp-custom-v210 input:focus{border-color:#5968ee;box-shadow:0 0 0 3px rgba(89,104,238,.12)}'+
          '.soreal-idle-exp-newbie-v210{margin-top:10px;padding:10px;border-radius:11px;background:#fffaf0;border:1px solid #eee0b8}.soreal-idle-exp-newbie-v210 .soreal-idle-window-title-v31{margin-bottom:5px;padding:0;background:transparent;border:0;box-shadow:none;color:#5e4810;font-size:12px}.soreal-idle-exp-newbie-v210 .soreal-idle-note-v4{margin:0 0 8px;color:#76642f;font-size:10px}'+
          '.soreal-idle-exp-lock-v210,.soreal-idle-exp-max-v210{padding:9px 10px;border-radius:10px;background:#f1f3f7;color:#596174;border:1px solid #e0e4ec;font-size:11px;font-weight:850}.soreal-idle-exp-max-v210{background:#edf8f0;color:#326341;border-color:#cfe6d5}'+
          '@media(max-width:560px){.soreal-idle-exp-stat-v210{padding:12px}.soreal-idle-exp-stat-head-v210{align-items:flex-start}.soreal-idle-exp-current-v211{flex-direction:column;gap:1px;align-items:flex-end}.soreal-idle-exp-actions-v210{grid-template-columns:1fr 1fr}.soreal-idle-exp-custom-v210{grid-template-columns:1fr 1fr}.soreal-idle-exp-custom-v210 input{grid-column:1}.soreal-idle-exp-custom-v210 .soreal-idle-exp-buy-v210{grid-column:2}}'+
        '</style>'+
        '<div class="soreal-idle-exp-balance-v210"><span>⭐ EXP disponible</span><b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(exp)+'</b></div>'+
        ressources.map(function(res){
          const titre=libelleRessourceMetaIdleV130_(res.id);
          if(!res.unlocked){
            return '<div class="soreal-idle-exp-resource-v210">🔒 '+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(titre)+' · verrouillé</div>';
          }
          const x=r[res.id]||{};
          const couts=achats[res.id]||{};
          const verrousRessource=verrousBoss[res.id]||{};
          const newbieCatalogueRessource=newbieCatalogueParRessource[res.id]||{};
          return '<div class="soreal-idle-exp-resource-v210">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(titre)+'</div>'+
            IDLE_SPEND_EXP_STATS_V1.map(function(stat){
              return idleExpShopStatBlocIdleV1_(
                res,
                stat,
                x,
                couts[stat.id],
                verrousRessource[stat.id],
                newbieCatalogueRessource,
                newbieUtilisees
              );
            }).join('');
        }).join('')+idleExpShopAventureIdleV1_(m);
      }

      function idleExpShopAventureIdleV1_(m){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const noms={adventurePower:'⚔️ Puissance d’aventure',adventureToughness:'🛡️ Robustesse d’aventure',adventureHp:'❤️ PV max d’aventure',adventureRegen:'💗 Régénération d’aventure',inventorySpace:'🎒 Espaces d’inventaire',accessorySlot1:'💍 Slot d’accessoire',accessorySlot2:'💍 Autre slot d’accessoire',diggerSlot:'⛏️ Slot de Digger'};
        const items=Array.isArray(m.expShop)?m.expShop:[];
        const rj=m.richJerks||{};
        return '<div class="soreal-idle-exp-resource-v210">Aventure et divers</div>'+
          items.map(function(it){
            const fini=it.nextCost==null;
            const tiers=it.max!=null&&it.max>1?[1,5,10]:it.max===1?[1]:[1,10,100];
            return '<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span>'+(noms[it.id]||H.idleHtml_(it.name))+'</span><div class="soreal-idle-exp-current-v211"><small>Acheté</small><strong>'+H.idleEntier_(it.purchased)+(it.max!=null?' / '+H.idleEntier_(it.max):'')+'</strong></div></div>'+
              (fini?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>':'<div class="soreal-idle-exp-actions-v210">'+tiers.map(function(q){return '<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterExpShopIdleV1__(\''+H.idleHtml_(it.id)+'\','+q+')"><b>+'+H.formatGrandNombreIdleV70_((it.gain||0)*q,2)+'</b><small>×'+q+' · dès '+H.idleEntier_(it.nextCost)+' EXP</small></button>';}).join('')+'</div>')+
              '</div>';
          }).join('')+
          ['attack','defense'].map(function(stat){
            const niveau=stat==='attack'?rj.attackLevel:rj.defenseLevel;
            return '<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span>'+(stat==='attack'?'🗡️ Attaque':'🛡️ Défense')+' pour riches (Rich Jerks)</span><div class="soreal-idle-exp-current-v211"><small>Niveau</small><strong>'+H.idleEntier_(niveau||0)+'</strong></div></div><div class="soreal-idle-exp-actions-v210">'+[1,10,100].map(function(q){return '<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterRichJerksIdleV1__(\''+stat+'\','+q+')"><b>+'+H.idleEntier_((rj.pctPerLevel||10)*q)+' %</b><small>×'+q+' · '+H.idleEntier_((rj.cost||30)*q)+' EXP</small></button>';}).join('')+'</div></div>';
          }).join('');
      }
      function acheterExpShopIdleV1_(item,quantite){
        actionMetaIdleV130_({action:'buyExpShop',item:String(item),quantity:Math.max(1,Math.floor(Number(quantite))||1)});
      }
      window.__acheterExpShopIdleV1__=acheterExpShopIdleV1_;
      function acheterRichJerksIdleV1_(stat,niveaux){
        actionMetaIdleV130_({action:'richJerks',stat:String(stat),levels:Math.max(1,Math.floor(Number(niveaux))||1)});
      }
      window.__acheterRichJerksIdleV1__=acheterRichJerksIdleV1_;

      function acheterRessourceMetaIdleV130_(ressource,stat,quantite){
        const payload={action:'buyResource',resource:ressource,stat:stat};
        const qty=Math.floor(Number(quantite));
        if(Number.isFinite(qty)&&qty>1)payload.quantity=qty;
        actionMetaIdleV130_(payload);
      }
      window.__acheterRessourceMetaIdleV130__=acheterRessourceMetaIdleV130_;

      function acheterRessourceLotPersonnaliseMetaIdleV130_(ressource,stat){
        const input=document.getElementById(idleExpShopIdInput_(ressource,stat));
        let qty=input?Math.floor(Number(input.value)):1;
        if(!Number.isFinite(qty)||qty<1)qty=1;
        acheterRessourceMetaIdleV130_(ressource,stat,qty);
      }
      window.__acheterRessourceLotPersonnaliseMetaIdleV130__=acheterRessourceLotPersonnaliseMetaIdleV130_;

      function acheterNewbieOfferMetaIdleV130_(ressource,stat,offerId){
        actionMetaIdleV130_({action:'buyNewbieOffer',resource:ressource,stat:stat,offerId:offerId});
      }
      window.__acheterNewbieOfferMetaIdleV130__=acheterNewbieOfferMetaIdleV130_;



      function selectionnerPisteMetaIdleV131_(
        systemeId,
        pisteId
      ){
        actionMetaIdleV130_({
          action:'selectTrack',
          system:systemeId,
          track:pisteId
        });
      }


      window.__selectionnerPisteMetaIdleV131__=
        selectionnerPisteMetaIdleV131_;


      function rendrePistesSystemeMetaIdleV131_(s){
        const pistes=
          Array.isArray(s&&s.tracks)
            ?s.tracks
            :[];

        if(!pistes.length){
          return '';
        }

        return '<div class="soreal-idle-section-v8" style="margin-top:10px">'+
          '<div class="soreal-idle-window-title-v31">🎯 Piste active</div>'+
          '<div class="soreal-idle-shop-grid-v12">'+
            pistes.map(function(p){
              const st=p.state||{};
              const niveau=
                window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st.level)+
                window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st.tempLevel)+
                window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st.permanentLevel);
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-300 */
              const verrouillee=p.unlocked===false;

              return '<button type="button" class="soreal-idle-expand-button-v25" style="'+
                (p.active?'outline:2px solid rgba(255,255,255,.65);':'')+
                (verrouillee?'opacity:.55;':'')+
                '" '+
                (verrouillee
                  ?'disabled'
                  :'onclick="window.__selectionnerPisteMetaIdleV131__(\''+
                    window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                    '\',\''+
                    window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(p.id)+
                    '\')"'
                )+
                '>'+
                (verrouillee?'🔒 ':p.active?'▶️ ':'')+
                window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(p.name||p.id)+
                (verrouillee?'':' · '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(niveau))+
                '<br><small>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(verrouillee?'Verrouillée':(p.effect||''))+'</small>'+
              '</button>';
            }).join('')+
          '</div>'+
        '</div>';
      }


      function rendreAllocationsSystemeMetaIdleV130_(s){
        const ressources=
          Array.isArray(s&&s.resources)
            ?s.resources
            :[];

        if(!ressources.length){
          return '';
        }

        return '<div class="soreal-idle-shop-grid-v12">'+
          ressources.map(function(r){
            const valeur=
              window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(
                s.state&&
                s.state.allocation&&
                s.state.allocation[r]
              );

            return '<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31">'+
                libelleRessourceMetaIdleV130_(r)+
              '</div>'+
              '<div class="soreal-idle-note-v4">'+
                'Allocation : <strong>'+valeur.toFixed(0)+' %</strong>'+
              '</div>'+
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__ajusterAllocationMetaIdleV130__(\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                  '\',\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(r)+
                  '\',-10)">−10 %</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__ajusterAllocationMetaIdleV130__(\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                  '\',\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(r)+
                  '\',10)">+10 %</button>'+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>';
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-301 */
      function rendreBoutonMoneyPitIdleV1_(j,st){
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold);
        const nextAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.nextAt);
        const restantMs=nextAt-Date.now();
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          const h=Math.floor(restantS/3600);
          const m=Math.floor((restantS%3600)/60);
          const sec=restantS%60;
          const libelle=h>0?(h+'h '+m+'m'):(m>0?(m+'m '+sec+'s'):(sec+'s'));
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled>🕳️ En recharge · '+libelle+'</button>';
        }
        if(gold<100000){
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled>🕳️ Jeter de l’or (100 000 Or requis, '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(gold)+' actuel)</button>';
        }
        return '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'moneyPit\'})">🕳️ Balance ton argent</button>';
      }

      function rendreBoutonDailySpinIdleV203_(st){
        const readyAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.readyAt);
        const restantMs=readyAt-Date.now();
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          const h=Math.floor(restantS/3600);
          const m=Math.floor((restantS%3600)/60);
          const libelle=h>0?(h+'h '+m+'m'):(m>0?(m+'m'):(restantS+'s'));
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled>🎡 Prochain tour · '+libelle+'</button>';
        }
        return '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__collecterSystemeMetaIdleV130__(\'dailySpin\')">🎡 Fais-moi tourner, bébé !</button>';
      }

      function rendreSystemeMetaIdleV130_(
        j,
        s,
        detail
      ){
        if(!s)return '';

        const unlocked=
          Boolean(
            s.unlock&&s.unlock.unlocked
          );

        const st=
          s.state||{};

        const verrou=
          !unlocked
            ?[
                s.unlock&&s.unlock.bosses
                  ?'Boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(s.unlock.bosses)
                  :'',
                s.unlock&&s.unlock.rebirths
                  ?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(s.unlock.rebirths)+' Renaissance(s)'
                  :'',
                s.unlock&&s.unlock.sets
                  ?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(s.unlock.sets)+' set(s) complété(s)'
                  :'',
                s.unlock&&s.unlock.difficulty
                  ?'Difficulté '+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.unlock.difficulty)
                  :''
              ].filter(Boolean).join(' · ')
            :'';

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-302 */
        const collecte=[
          'yggdrasil',
          'dailySpin',
          'bloodMagic'
        ].indexOf(s.id)!==-1;

        return '<div class="soreal-idle-section-v8" style="'+
          (!unlocked?'opacity:.62':'')+
          '">'+
          '<div class="soreal-idle-window-title-v31">'+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.icon||'⚙️')+' '+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.name||s.id)+
            (unlocked?'':' 🔒')+
          '</div>'+
          '<div class="soreal-idle-note-v4">'+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(
              unlocked
                ?s.desc||''
                :'Déblocage : '+verrou
            )+
          '</div>'+
          (unlocked
            ?'<div class="soreal-idle-note-v4" style="margin-top:7px">'+
                'Niveau <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(st.level||0)+'</strong>'+
                ' · temporaire <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(st.tempLevel||0)+'</strong>'+
                ' · permanent <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(st.permanentLevel||0)+'</strong>'+
              '</div>'+
              (detail
                ?rendrePistesSystemeMetaIdleV131_(s)+
                  rendreAllocationsSystemeMetaIdleV130_(s)
                :'')+
              (detail
                ?'<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px">'+
                    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__toggleSystemeMetaIdleV130__(\''+
                      window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                      '\')">'+
                      (st.active?'⏸️ Désactiver':'▶️ Activer')+
                    '</button>'+
                    (s.id==='dailySpin'
                      ?rendreBoutonDailySpinIdleV203_(st)
                      :(collecte
                        ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__collecterSystemeMetaIdleV130__(\''+
                          window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                          '\')">📥 Récolter / utiliser</button>'
                        :'')
                    )+
                    (s.id==='moneyPit'?rendreBoutonMoneyPitIdleV1_(j,st):'')+
                    (s.id==='diggers'
                      ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'buyDigger\'})">⛏️ Améliorer l’équipe</button>'
                      :'')+
                    (s.id==='titans'
                      ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'titan\'})">👹 Affronter le Colosse</button>'
                      :'')+
                  '</div>'
                :'')
            :'')+
        '</div>';
      }


      function bandeauMetaIdleV130_(j){
        const m=
          j&&j.systemes
            ?j.systemes
            :{};

        const c=m.currencies||{};

        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31 gold">🧭 Progression permanente</div>'+
          '<div class="soreal-idle-note-v4">'+
            '✨ EXP '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.experience||0)+
            ' · ⭐ PP '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.pp||0)+
            ' · 📋 QP '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.qp||0)+
            ' · 🪙 Or '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.gold||0)+
            ' · 🩸 Sang '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.blood||0)+
            ' · 🌱 Graines '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.seeds||0)+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin-top:6px">'+
            'Difficulté : <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(m.difficulty||'normal')+'</strong>'+
          '</div>'+
        '</div>';
      }


      
      function pageYggdrasilIdleV47_(j){
        const s=systemeMetaParIdIdleV130_(j,'yggdrasil');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🌱 Yggdrasil','Fais pousser des fruits pendant plusieurs heures.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Trouve la Giant Seed pour débloquer Yggdrasil.</div>';
        const data=s.state.data||{};
        const fruits=data.fruits||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.yggFruits)?j.systemes.yggFruits:[];
        const seeds=j&&j.systemes&&j.systemes.currencies?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j.systemes.currencies.seeds||0):0;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🌱 Yggdrasil','Chaque tier permet une heure de croissance supplémentaire. Mange un fruit pour son effet ou récolte-le pour davantage de graines.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">Seeds<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(seeds)+'</b></div><div class="soreal-idle-summary-v28">Réservé Energy<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(data.reserved&&data.reserved.energy||0)+'</b></div><div class="soreal-idle-summary-v28">Réservé Magic<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(data.reserved&&data.reserved.magic||0)+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){const f=fruits[def.id]||{};const tier=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(f.tier||0);const growth=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(f.growthHours||0);return '<div class="soreal-idle-section-v8" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>Tier '+tier+'</span></div><div style="font-size:12px;color:#aeb5c8;margin-top:5px">Croissance '+window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_(growth)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_(tier)+' · coût activation '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.activationCost||0)+' '+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.resource||'energy')+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaV47__({action:\'upgradeYggFruit\',fruit:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\'})">Tier +1</button><button type="button" class="soreal-idle-expand-button-v25" '+(f.active?'disabled':'onclick="window.__actionMetaV47__({action:\'activateYggFruit\',fruit:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\'})"')+'>'+(f.active?'En croissance':'Activer')+'</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaV47__({action:\'useYggFruit\',fruit:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\',mode:\'eat\'})">Manger</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaV47__({action:\'useYggFruit\',fruit:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\',mode:\'harvest\'})">Récolter</button></div></div>';}).join('')+'</div>';
      }

      function pageDiggersIdleV47_(j){
        const s=systemeMetaParIdIdleV130_(j,'diggers');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⛏️ Gold Diggers','Transforme le GPS de la Time Machine en bonus permanents.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Trouve le Scrap of Paper pour débloquer les Gold Diggers.</div>';
        const data=s.state.data||{};
        const diggers=data.diggers||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.diggerDefinitions)?j.systemes.diggerDefinitions:[];
        const active=Object.keys(diggers).filter(function(id){return diggers[id]&&diggers[id].active;}).length;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⛏️ Gold Diggers','Monte leur niveau maximum puis choisis le niveau actif. Les Diggers consomment le GPS produit par la Time Machine.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">Slots<b>'+active+' / '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(data.slots||1)+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){const d=diggers[def.id]||{};const run=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.runLevel||0);const max=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.maxLevel||0);return '<div class="soreal-idle-section-v8" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>'+run+' / '+max+'</span></div><div style="font-size:12px;color:#aeb5c8;margin-top:5px">Drain base '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.drain||0)+' GPS · cap '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.cap||0)+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaV47__({action:\'upgradeDigger\',digger:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\'})">Max +1</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__setDiggerIdleV47__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+Math.max(0,run-1)+')">−</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__setDiggerIdleV47__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+Math.min(max,run+1)+')">+</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__toggleDiggerIdleV47__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+(!d.active)+')">'+(d.active?'Désactiver':'Activer')+'</button></div></div>';}).join('')+'</div>';
      }

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-303 */
function pagePerksIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'perks');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⭐ Perks','Maîtrises permanentes achetées avec des Points de Perk (PP).')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Système verrouillé.</div>';
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.perkDefinitions)?j.systemes.perkDefinitions:[];
        const pp=j&&j.systemes&&j.systemes.currencies?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j.systemes.currencies.pp||0):0;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⭐ Perks','Chaque Perk a son propre coût plat et son propre plafond. Dépense tes PP pour les améliorer une par une.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">PP disponibles<b>'+pp+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(perk){
            const niveau=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(levels[perk.id]||0);
            const cap=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(perk.cap||0);
            const auMax=niveau>=cap;
            const cout=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(perk.cost||0);
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(perk.name||('Perk '+perk.id))+'</b><span>'+niveau+' / '+cap+'</span></div>'+
              '<div style="font-size:12px;color:#aeb5c8;margin-top:5px">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(perk.effect||'')+'</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                (auMax
                  ?'<span class="soreal-idle-note-v4">✔ Maximum atteint</span>'
                  :'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__acheterPerkIdleV1__('+perk.id+')">⭐ Acheter ('+cout+' PP)</button>')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

function pageQuirksIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'quirks');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('📚 Quirks','Procédures permanentes achetées avec des Points de Quirk (QP).')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Système verrouillé.</div>';
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.quirkDefinitions)?j.systemes.quirkDefinitions:[];
        const qp=j&&j.systemes&&j.systemes.currencies?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j.systemes.currencies.qp||0):0;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('📚 Quirks','Chaque Quirk a son propre coût plat et son propre plafond. Dépense tes QP pour les améliorer une par une.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">QP disponibles<b>'+qp+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(quirk){
            const niveau=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(levels[quirk.id]||0);
            const cap=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(quirk.cap||0);
            const auMax=niveau>=cap;
            const cout=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(quirk.cost||0);
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(quirk.name||('Quirk '+quirk.id))+'</b><span>'+niveau+' / '+cap+'</span></div>'+
              '<div style="font-size:12px;color:#aeb5c8;margin-top:5px">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(quirk.effect||'')+'</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                (auMax
                  ?'<span class="soreal-idle-note-v4">✔ Maximum atteint</span>'
                  :'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__acheterQuirkIdleV1__('+quirk.id+')">📚 Acheter ('+cout+' QP)</button>')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-304 */
function pageItopodIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'tower');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🏢 ITOPOD','Infinite Tower of Pissed-Off Dudes — grimpe les étages, gagne des PP.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Système verrouillé.</div>';
        const d=(s.state.data)||{};
        const etage=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.floor);
        const kills=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.kills);
        const versProchainEtage=d.killsOnFloor!=null?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.killsOnFloor):kills%10;
        const plusHaut=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.highestFloor||d.floor);
        const optimal=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.optimalFloor);
        const auto=d.startFloor==null||d.endFloor==null;
        const debut=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.startFloor==null?0:d.startFloor);
        const fin=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.endFloor==null?optimal:d.endFloor);
        const ppProgress=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.ppProgress));
        const pp=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.pp)||0);
        const actif=Boolean(s.state.active);
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
          '🏢 ITOPOD',
          'Infinite Tower of Pissed-Off Dudes — chaque 10 ennemis vaincus fait monter d’un étage ; (200 + Étage) PPP par kill (700 en Evil, 2000 en Sadistic), 1 000 000 PPP = 1 PP. Sur l’étage de fin, 10 kills te ramènent à l’étage de départ.'
        )+
        '<div class="soreal-idle-summary-grid-v28">'+
          '<div class="soreal-idle-summary-v28">Étage<b>'+etage+'</b></div>'+
          '<div class="soreal-idle-summary-v28">PP disponibles<b>'+pp+'</b></div>'+
        '</div>'+
        '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">📊 Progression</div>'+
          '<div class="soreal-idle-note-v4">'+
            '🗡️ Ennemis vaincus (total) : <b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(kills)+'</b>'+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin-top:5px">'+
            '⬆️ Vers le prochain étage : <b>'+versProchainEtage+' / 10</b>'+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin-top:5px">'+
            '🏔️ Étage le plus haut : <b>'+plusHaut+'</b> · Étage optimal (un coup suffit) : <b>'+optimal+'</b>'+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin-top:5px">'+
            '🔷 Progression PP : <b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(ppProgress)+' / 1 000 000</b>'+
          '</div>'+
          '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__toggleSystemeMetaIdleV130__(\'tower\')">'+
              (actif?'⏸️ Désactiver':'▶️ Activer')+
            '</button>'+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin-top:9px">Étages : '+(auto?'automatique (montée jusqu’à l’étage optimal)':'départ '+debut+' → fin '+fin)+'</div>'+
          '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:6px">'+
            'Départ <input id="itopodDebutV1" type="number" min="0" value="'+debut+'" style="width:80px"> Fin <input id="itopodFinV1" type="number" min="0" max="1600" value="'+fin+'" style="width:80px">'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__itopodEtagesIdleV1__()">Appliquer</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__itopodAutoIdleV1__()">Auto</button>'+
          '</div>'+
        '</div>';
      }

function itopodEtagesIdleV1_(){
        const debut=document.getElementById('itopodDebutV1');
        const fin=document.getElementById('itopodFinV1');
        actionMetaIdleV130_({action:'towerFloors',start:Number(debut&&debut.value)||0,end:Number(fin&&fin.value)||0});
      }
      window.__itopodEtagesIdleV1__=itopodEtagesIdleV1_;

function itopodAutoIdleV1_(){
        actionMetaIdleV130_({action:'towerFloors',auto:true});
      }
      window.__itopodAutoIdleV1__=itopodAutoIdleV1_;

function acheterPerkIdleV1_(perkId){
        actionMetaIdleV130_({action:'buyPerk',perkId:Number(perkId)});
      }
      window.__acheterPerkIdleV1__=acheterPerkIdleV1_;

function acheterQuirkIdleV1_(quirkId){
        actionMetaIdleV130_({action:'buyQuirk',quirkId:Number(quirkId)});
      }
      window.__acheterQuirkIdleV1__=acheterQuirkIdleV1_;

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-305 */
function pageChallengesIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'challenges');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🏁 Défis','Défis à restriction, pour des récompenses permanentes.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Système verrouillé.</div>';
        const defs=j&&j.systemes&&Array.isArray(j.systemes.challengeDefinitions)?j.systemes.challengeDefinitions:[];
        const actif=defs.find(function(d){return d&&d.active;})||null;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🏁 Défis'+(defs[0]&&defs[0].tier==='difficile'?' (Evil)':defs[0]&&defs[0].tier==='extreme'?' (Sadistic)':''),'Démarre un défi débloqué, atteins son objectif de boss, puis valide-le pour la récompense. Un seul défi actif à la fois. Les défis Evil et Sadistic ont leurs propres compteurs et récompenses.')+
          (actif
            ?'<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">Défi actif<b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(actif.name||actif.id)+'</b></div></div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__validerDefiIdleV1__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(actif.id)+'\')">✔ Valider</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__abandonnerDefiIdleV1__()">✖ Abandonner</button>'+
              '</div>'
            :'')+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){
            const statut=
              !def.unlocked?'🔒 Verrouillé'
              :!def.implemented?'🚧 En préparation'
              :def.active?'▶️ Actif'
              :'✅ Prêt';
            const peutDemarrer=Boolean(def.unlocked)&&Boolean(def.implemented)&&!actif;
            return '<div class="soreal-idle-section-v8" style="margin:0'+(def.unlocked?'':';opacity:.62')+'">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.completion||0)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.max||0)+'</span></div>'+
              '<div style="font-size:12px;color:#aeb5c8;margin-top:5px">'+statut+
                (def.targetBoss?' · Objectif boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.targetBoss):'')+
                ' · Récompense '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.reward&&def.reward.experience||0)+' EXP / '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.reward&&def.reward.ap||0)+' AP'+
              '</div>'+
              (peutDemarrer
                ?'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__demarrerDefiIdleV1__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\')">▶️ Démarrer</button>'+
                  '</div>'
                :'')+
            '</div>';
          }).join('')+'</div>';
      }

function demarrerDefiIdleV1_(challengeId){
        actionMetaIdleV130_({action:'challenge',mode:'start',challenge:String(challengeId)});
      }
      window.__demarrerDefiIdleV1__=demarrerDefiIdleV1_;

function validerDefiIdleV1_(challengeId){
        actionMetaIdleV130_({action:'challenge',mode:'complete',challenge:String(challengeId)});
      }
      window.__validerDefiIdleV1__=validerDefiIdleV1_;

function abandonnerDefiIdleV1_(){
        actionMetaIdleV130_({action:'challenge',mode:'stop'});
      }
      window.__abandonnerDefiIdleV1__=abandonnerDefiIdleV1_;

function allocationMaxMetaIdleV48_(j,systemId,resource){
        const snapshot=j&&j.systemes&&typeof j.systemes==='object'?j.systemes:{};
        const systems=Array.isArray(snapshot.systems)?snapshot.systems:[];
        const cap=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snapshot.resources&&snapshot.resources[resource]&&snapshot.resources[resource].cap||0));
        const usedOther=systems.reduce(function(total,s){
          if(!s||s.id===systemId)return total;
          return total+Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(s.state&&s.state.allocation&&s.state.allocation[resource]||0));
        },0);
        return Math.max(0,cap-usedOther);
      }

      function allocationMetaIdleV48_(j,systemId,resource,label){
        const s=systemeMetaParIdIdleV130_(j,systemId);
        const current=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(s&&s.state&&s.state.allocation&&s.state.allocation[resource]||0));
        const max=allocationMaxMetaIdleV48_(j,systemId,resource);
        const targets=[0,.25,.5,1].map(function(p){return Math.floor(max*p);});
        return '<div class="soreal-idle-section-v8" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(label)+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(current)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(max)+'</span></div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+targets.map(function(value,index){const names=['0%','25%','50%','100%'];return '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaV47__({action:\'allocate\',system:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(systemId)+'\',resource:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(resource)+'\',value:'+value+'})">'+names[index]+'</button>';}).join('')+'</div></div>';
      }

      function pageAugmentationsIdleV48_(j){
        const sys=systemeMetaParIdIdleV130_(j,'augmentations');
        if(!sys||!sys.state||!sys.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🦾 Augmentations','Les Augmentations renforcent uniquement le run en cours.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Bats le boss 17 pour débloquer Augmentations.</div>';
        const snap=j&&j.systemes||{},defs=Array.isArray(snap.augmentations)?snap.augmentations:[],pairs=(sys.state.data||{}).pairs||{};
        const boss=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(snap.records&&snap.records.highestBoss||0),gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0),mult=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier||1);
        window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().__augmentationsVisualV215={
          at:performance.now(),
          defs:Object.fromEntries(defs.map(function(d){return [d.id,{progress:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.progressPct),upgradeProgress:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeProgressPct),seconds:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.secondsPerLevel),upgradeSeconds:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeSecondsPerLevel)}];}))
        };
        const cap=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.resources&&snap.resources.energy&&snap.resources.energy.cap||0));
        function track(def,pair,upgrade,ok){
          const value=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(upgrade?pair.upgradeEnergy:pair.energy));
          const pct=Math.max(0,Math.min(100,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(upgrade?def.upgradeProgressPct:def.progressPct)*100));
          const level=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(upgrade?pair.upgradeLevel:pair.level);
          const label=upgrade?'Upgrade':'Augment';
          const values=[0,Math.floor(cap*.25),Math.floor(cap*.5),cap];
          return '<div style="margin-top:8px;opacity:'+(ok?'1':'.45')+'"><div style="display:flex;justify-content:space-between"><b>'+label+' · Niv. '+level+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(value)+' ⚡</span></div><div class="soreal-idle-bt-track-v120"><div data-idle-aug-bar-v215="'+def.id+':'+(upgrade?'upgrade':'main')+'" class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;will-change:transform;background:#6366f1;transition:none"></div></div><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'+values.map(function(v,i){return '<button type="button" class="soreal-idle-expand-button-v25" '+(ok?'onclick="window.__actionMetaV47__({action:\'allocateAugment\',pair:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\',upgrade:'+upgrade+',value:'+v+'})"':'disabled')+'>'+['0%','25%','50%','100%'][i]+'</button>';}).join('')+'</div></div>';
        }
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🦾 Augmentations','Chaque Augment et chaque Upgrade possède sa propre allocation Energy et progresse en parallèle. Les niveaux sont remis à zéro au Rebirth.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">Gold<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(gold)+'</b></div><div class="soreal-idle-summary-v28">Multiplicateur<b>x'+mult.toFixed(3)+'</b></div><div class="soreal-idle-summary-v28">Boss max<b>'+boss+'</b></div></div>'+
          '<div style="display:grid;gap:10px;margin-top:10px">'+defs.map(function(def){const pair=pairs[def.id]||{};const mainOk=boss>=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0);const upgradeOk=boss>=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.upgrade&&def.upgrade.unlockBoss||999999);return '<div class="soreal-idle-section-v8" style="margin:0;opacity:'+(mainOk?'1':'.55')+'"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>Boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0)+(def.upgrade?' · Upgrade '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.upgrade.unlockBoss||0):'')+'</span></div>'+track(def,pair,false,mainOk)+track(def,pair,true,upgradeOk)+'</div>';}).join('')+'</div>';
      }

      function pageTimeMachineIdleV48_(j){
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⏱️ Time Machine','La Time Machine transforme la progression du run en Gold par seconde.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Bats le boss 30 pour débloquer la Time Machine.</div>';
        const snap=j&&j.systemes||{};
        const data=s.state.data||{};
        const bonus=snap.bonuses||{};
        const magic=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const magicOk=Boolean(magic&&magic.state&&magic.state.unlocked);
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⏱️ Time Machine','Energy augmente la vitesse de la machine. À partir du boss 37, Magic augmente le multiplicateur de Gold.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">GPS net<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(bonus.timeMachineGoldPerSecond||0)+'</b></div><div class="soreal-idle-summary-v28">Vitesse<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(data.speedLevel||0)+'</b></div><div class="soreal-idle-summary-v28">Gold level<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(data.goldLevel||0)+'</b></div><div class="soreal-idle-summary-v28">Produit ce run<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(data.producedThisRun||0)+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+allocationMetaIdleV48_(j,'timeMachine','energy','Energy → vitesse')+(magicOk?allocationMetaIdleV48_(j,'timeMachine','magic','Magic → Gold'):'<div class="soreal-idle-section-v8" style="margin:0;text-align:center">🔒 Magic se débloque avec Blood Magic au boss 37.</div>')+'</div>'+
          '<div class="soreal-idle-section-v8"><div style="font-size:12px;color:#aeb5c8">Meilleur Gold du run : <b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(data.bestGoldThisRun||0)+'</b> · Boss record : <b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(data.highestBossEver||0)+'</b></div></div>';
      }

      function pageBloodMagicIdleV48_(j){
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        if(!s||!s.state||!s.state.unlocked)return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🩸 Blood Magic','Magic alimente des rituels qui produisent du Blood.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Bats le boss 37 pour débloquer Magic et Blood Magic.</div>';
        const snap=j&&j.systemes||{};
        const defs=Array.isArray(snap.bloodRituals)?snap.bloodRituals:[];
        const data=s.state.data||{};
        const rituals=data.rituals||{};
        const flags=snap.adventure&&snap.adventure.unlockFlags||{};
        const blood=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.blood||0);
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0);
        const spells=data.spells||{};
        const spellDefs=[['numberBoost','Number Boost',spells.numberBoost||1],['ironPill','Iron Pill',spells.ironPill||0],['counterfeitGold','Counterfeit Gold',spells.counterfeitGold||1],['bloodSpaghetti','Blood Spaghetti',spells.bloodSpaghetti||1]];
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🩸 Blood Magic','Choisis un rituel, alloue de la Magic et laisse-le produire du Blood. Les sorts ci-dessous consomment tout le Blood disponible.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">Blood<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(blood)+'</b></div><div class="soreal-idle-summary-v28">Gold<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(gold)+'</b></div></div>'+
          allocationMetaIdleV48_(j,'bloodMagic','magic','Magic allouée')+
          '<h3 style="margin:16px 0 8px">Rituels</h3><div style="display:grid;gap:10px">'+defs.map(function(def){const r=rituals[def.id]||{};const unlocked=!def.unlockFlag||Boolean(flags[def.unlockFlag]);const active=data.activeRitual===def.id;return '<div class="soreal-idle-section-v8" style="margin:0;opacity:'+(unlocked?'1':'.55')+'"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(r.completions||0)+' complété(s)</span></div><div style="font-size:12px;color:#aeb5c8;margin-top:5px">Coût '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.gold||0)+' Gold · +'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.blood||0)+' Blood</div><button type="button" class="soreal-idle-expand-button-v25" style="margin-top:9px" '+(unlocked?'onclick="window.__actionMetaV47__({action:\'selectRitual\',ritual:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\'})"':'disabled')+'>'+(active?'▶ Rituel actif':'Choisir ce rituel')+'</button></div>';}).join('')+'</div>'+
          '<h3 style="margin:16px 0 8px">Blood Spells</h3><div style="display:grid;gap:10px">'+spellDefs.map(function(sp){return '<div class="soreal-idle-section-v8" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(sp[1])+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(sp[2])+'</span></div><button type="button" class="soreal-idle-expand-button-v25" style="margin-top:9px" '+(blood>0?'onclick="window.__actionMetaV47__({action:\'castBloodSpell\',spell:\''+sp[0]+'\'})"':'disabled')+'>Utiliser tout le Blood</button></div>';}).join('')+'</div>';
      }

      function libelleRecompenseMetaV206_(entree){
        if(!entree)return '—';
        const morceaux=[];
        const reward=entree.reward&&typeof entree.reward==='object'?entree.reward:{};
        if(entree.boost){
          morceaux.push(
            'Boost '+String(entree.boost.type||'')+
            ' +'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(entree.boost.strength||0)
          );
        }
        if(reward.adventureStats){
          morceaux.push(
            '+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureStats)+
            ' Power/Toughness Aventure'
          );
        }
        if(reward.adventureHp){
          morceaux.push('+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureHp)+' PV max Aventure');
        }
        if(reward.adventureRegen){
          morceaux.push('+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureRegen,2)+' regen Aventure');
        }
        if(reward.ap)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.ap)+' AP');
        if(reward.experience)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.experience)+' EXP');
        if(reward.seeds)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.seeds)+' graines');
        if(reward.cubePower)morceaux.push('+'+reward.cubePower+' Cube Power');
        if(reward.cubeToughness)morceaux.push('+'+reward.cubeToughness+' Cube Toughness');
        if(reward.cubeBoth)morceaux.push('+'+reward.cubeBoth+' Cube Power et Toughness');
        if(reward.wandoosLevels)morceaux.push('+'+reward.wandoosLevels+' niveau(x) Wandoos');
        if(reward.items){
          const NOMS={energyPotionAlpha:'Potion Energy α',energyPotionBeta:'Potion Energy β',energyPotionDelta:'Potion Energy δ',magicPotionAlpha:'Potion Magic α',magicPotionBeta:'Potion Magic β',magicPotionDelta:'Potion Magic δ',luckyCharm:'Lucky Charm',superLuckyCharm:'Super Lucky Charm',energyBarBar:'Energy Bar Bar',magicBarBar:'Magic Bar Bar',littleBluePill1000:'× 1000 Little Blue Pill',poop:'crottin (sans effet)',beastButter:'Beast Butter (sans effet)',macguffinMuffin:'MacGuffin Muffin (sans effet)'};
          Object.keys(reward.items).forEach(function(id){morceaux.push(reward.items[id]+' × '+(NOMS[id]||id));});
        }
        return morceaux.length?morceaux.join(' · '):'Récompense mystérieuse';
      }


      function tierDailySpinIdleV206_(totalSpins){
        const n=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(totalSpins));
        const seuils=[0,7,14,30,60,120,180,365];
        let tier=0;
        seuils.forEach(function(seuil,index){
          if(n>=seuil)tier=index;
        });
        return tier;
      }


      function recompensesDailySpinTierIdleV206_(tier){
        const tables=[
          ['50 AP · 70 %','100 AP · 30 %'],
          ['100 AP · 53 %','200 AP · 35 %','1 000 AP · 10 %'],
          ['200 AP · 53 %','400 AP · 30 %','2 000 AP · 10 %'],
          ['300 AP · 37 %','600 AP · 25 %','3 000 AP · 10 %','20 graines · 10 %','50 000 AP · 0,5 %'],
          ['500 AP · 50 %','1 000 AP · 25 %','5 000 AP · 10 %','100 graines · 5 %','75 000 AP · 0,5 %'],
          ['800 AP · 36 %','1 600 AP · 25 %','8 000 AP · 10 %','400 graines · 10 %','100 000 AP · 0,5 %'],
          ['1 200 AP · 35 %','2 400 AP · 25 %','12 000 AP · 10 %','2 000 graines · 10 %','150 000 AP · 0,5 %'],
          ['1 500 AP · 35 %','3 000 AP · 25 %','15 000 AP · 10 %','5 000 graines · 10 %','175 000 AP · 0,5 %']
        ];
        return tables[Math.max(0,Math.min(tables.length-1,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(tier)))]||tables[0];
      }


      function historiqueMoneyPitIdleV206_(pit,roue){
        const pitData=pit&&pit.state&&pit.state.data||{};
        const roueData=roue&&roue.state&&roue.state.data||{};
        const lignes=[];

        (Array.isArray(pitData.history)?pitData.history:[]).forEach(function(x){
          lignes.push({
            at:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x.at),
            source:'🕳️ Money Pit',
            detail:'Palier '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(x.tier)+' · '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(x.cost||0)+' Or',
            prize:libelleRecompenseMetaV206_(x)
          });
        });
        (Array.isArray(roueData.history)?roueData.history:[]).forEach(function(x){
          lignes.push({
            at:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x.at),
            source:'🎡 Roue journalière',
            detail:'Tier '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(x.tier),
            prize:libelleRecompenseMetaV206_(x)
          });
        });

        lignes.sort(function(a,b){return b.at-a.at;});
        return lignes.slice(0,20);
      }


      function pageMoneyPitDailySpinIdleV206_(j){
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const pitSt=pit&&pit.state||{};
        const roueSt=roue&&roue.state||{};
        const pitData=pitSt.data||{};
        const roueData=roueSt.data||{};
        const totalSpins=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(roueData.totalSpins||roueSt.level||0);
        const tier=tierDailySpinIdleV206_(totalSpins);
        const table=recompensesDailySpinTierIdleV206_(tier);
        const historique=historiqueMoneyPitIdleV206_(pit,roue);
        const derniere=historique.length?historique[0]:null;

        return ''+
          window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
            '🕳️ Money Pit & 🎡 Roue journalière',
            'Balance tout ton Or durement gagné dedans.'
          )+
          bandeauMetaIdleV130_(j)+
          '<style>'+
            '.soreal-idle-money-scene-v206{position:relative;max-width:760px;margin:0 auto 14px;overflow:hidden;border-radius:18px;border:2px solid #26344d;background:#102e16;box-shadow:0 15px 40px rgba(0,0,0,.3)}'+
            '.soreal-idle-money-scene-v206>img{display:block;width:100%;height:auto;aspect-ratio:1/1;object-fit:cover}'+
            '.soreal-idle-money-action-v206{position:absolute;z-index:3;background:rgba(12,18,31,.92);border:2px solid rgba(255,255,255,.82);border-radius:12px;padding:8px;box-shadow:0 8px 22px rgba(0,0,0,.38);text-align:center;min-width:170px;backdrop-filter:blur(3px)}'+
            '.soreal-idle-money-pit-action-v206{left:48%;bottom:5%;transform:translateX(-50%)}'+
            '.soreal-idle-money-spin-action-v206{right:3%;top:40%;min-width:155px}'+
            '.soreal-idle-money-action-v206 .soreal-idle-expand-button-v25{width:100%;margin:4px 0 0!important}'+
            '.soreal-idle-money-action-title-v206{font-size:13px;font-weight:950;color:#fff;text-shadow:0 1px 3px #000}'+
            '.soreal-idle-money-action-note-v206{font-size:10px;color:#d5e1f5;margin-top:2px}'+
            '.soreal-idle-prize-v206{padding:12px;border-radius:12px;background:#f4c83b;color:#19160b;border:2px solid #9c7b12;text-align:center;font-weight:950;font-size:14px}'+
            '.soreal-idle-reward-table-v206{width:100%;border-collapse:collapse;font-size:11px}.soreal-idle-reward-table-v206 th,.soreal-idle-reward-table-v206 td{padding:7px;border:1px solid rgba(132,145,175,.28);text-align:left}.soreal-idle-reward-table-v206 th{background:rgba(97,112,147,.14)}'+
            '@media(max-width:620px){.soreal-idle-money-action-v206{min-width:0;width:42%;padding:6px}.soreal-idle-money-pit-action-v206{left:42%;bottom:3%}.soreal-idle-money-spin-action-v206{right:2%;top:38%;width:35%}.soreal-idle-money-action-title-v206{font-size:11px}.soreal-idle-money-action-note-v206{font-size:9px}}'+
          '</style>'+
          '<div class="soreal-idle-money-scene-v206">'+
            '<img id="sorealIdleMoneyPitImageV209" src="/api/idle/media/banner?name=Money_Pit.jpg" alt="Money Pit et Daily Spin">'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-pit-action-v206">'+
              '<div class="soreal-idle-money-action-title-v206">Balance ton argent</div>'+
              '<div class="soreal-idle-money-action-note-v206">Le puits prend tout ton Or actuel.</div>'+
              rendreBoutonMoneyPitIdleV1_(j,pitSt)+
            '</div>'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-spin-action-v206">'+
              '<div class="soreal-idle-money-action-title-v206">Daily Spin!</div>'+
              '<div class="soreal-idle-money-action-note-v206">Bon, ça ne « tourne » pas vraiment, mais c’est aléatoire !</div>'+
              rendreBoutonDailySpinIdleV203_(roueSt)+
            '</div>'+
          '</div>'+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">🎁 TON PRIX</div>'+
            '<div class="soreal-idle-prize-v206">'+
              (derniere
                ?window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(derniere.prize)
                :'Aucun prix obtenu pour l’instant.')+
            '</div>'+
          '</div>'+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">🎡 TABLE DES RÉCOMPENSES · TIER '+tier+'</div>'+
            '<div style="font-size:11px;color:#8b93ab;margin-bottom:8px">Tours effectués : <b>'+totalSpins+'</b>. Les récompenses affichées sont celles réellement disponibles dans SOREAL IDLE.</div>'+
            '<table class="soreal-idle-reward-table-v206"><tbody>'+
              table.map(function(x){return '<tr><td>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(x)+'</td></tr>';}).join('')+
            '</tbody></table>'+
          '</div>'+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">📜 RÉCOMPENSES OBTENUES</div>'+
            (historique.length
              ?'<table class="soreal-idle-reward-table-v206"><thead><tr><th>Source</th><th>Palier</th><th>Prix</th></tr></thead><tbody>'+
                historique.map(function(x){
                  return '<tr><td>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(x.source)+'</td><td>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(x.detail)+'</td><td><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(x.prize)+'</b></td></tr>';
                }).join('')+
                '</tbody></table>'
              :'<div class="soreal-idle-note-v4">Le tableau se remplira dès ton premier lancer.</div>')+
          '</div>';
      }


      /*
       * NGU (2026-09-23, audit) : les 16 vrais NGU (9 Energy + 7 Magic) avec
       * une allocation propre à chacun ; un seul palier (Normal / Evil /
       * Sadistic) reçoit de l'énergie et de la magie à la fois.
       */
      function dureeLongueNguIdleV1_(secondes){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const n=Number(secondes);
        if(!Number.isFinite(n)||n<=0)return '—';
        if(n<1)return '< 1 s';
        if(n<60)return Math.round(n)+' s';
        if(n<3600)return Math.round(n/60)+' min';
        if(n<86400)return (n/3600).toFixed(1).replace('.',',')+' h';
        if(n<86400*365)return (n/86400).toFixed(1).replace('.',',')+' j';
        return H.formatGrandNombreIdleV70_(n/86400/365,1)+' ans';
      }

      function pageNguIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('♾️ NGU','Chaque NGU a sa propre allocation et progresse en parallèle. Les niveaux persistent à travers les Rebirths ; l\'énergie et la magie allouées sont rendues au Rebirth.');
        const sys=systemeMetaParIdIdleV130_(j,'ngu');
        if(!sys||!sys.state||!sys.state.unlocked){
          return titre+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Débloqué par A Number (Gordon Ramsay Bolton).</div>';
        }
        const snap=(j&&j.systemes)||{};
        const ng=snap.ngus||{};
        const nomPalier={normal:'Normal',evil:'Evil',sadistic:'Sadistic'};
        const paliers=Array.isArray(ng.activeTiers)?ng.activeTiers:['normal'];
        const courant=ng.tier||'normal';
        const liste=(ng.tiers&&ng.tiers[courant])||[];
        const systemes=Array.isArray(snap.systems)?snap.systems:[];
        function capDe(ressource){
          return Math.max(0,H.idleNombre_(snap.resources&&snap.resources[ressource]&&snap.resources[ressource].cap||0));
        }
        function alloueAutres(ressource,exceptId){
          let total=0;
          systemes.forEach(function(x){
            if(!x||x.id==='ngu')return;
            total+=Math.max(0,H.idleNombre_(x.state&&x.state.allocation&&x.state.allocation[ressource]||0));
          });
          liste.forEach(function(n){
            if(n.resource===ressource&&n.id!==exceptId)total+=Math.max(0,H.idleNombre_(n.allocation));
          });
          return total;
        }
        const onglets=paliers.map(function(t){
          const actif=t===courant;
          return '<button type="button" class="soreal-idle-expand-button-v25" style="'+(actif?'font-weight:700;outline:2px solid #6366f1':'')+'" '+(actif?'disabled':'onclick="window.__actionMetaV47__({action:\'setNguTier\',tier:\''+t+'\'})"')+'>'+nomPalier[t]+'</button>';
        }).join('');
        const fx=ng.effects||{};
        const ratio=function(v){return 'x'+H.formatGrandNombreIdleV70_(Math.max(1,H.idleNombre_(v)),2);};
        const resume=[
          ['Attack/Defense',ratio(fx.attackDefense)],
          ['Adventure',ratio(fx.adventure)],
          ['Gold',ratio(fx.gold)],
          ['Drop',ratio(fx.dropChance)],
          ['EXP',ratio(fx.exp)],
          ['Number',ratio(fx.number)],
          ['PP',ratio(fx.pp)],
          ['Yggdrasil',ratio(fx.yggdrasil)],
          ['Time Machine',ratio(fx.timeMachine)],
          ['Augments',ratio(fx.augments)],
          ['Wandoos',ratio(fx.wandoosSpeed)],
          ['Respawn','-'+(H.idleNombre_(fx.respawnReduction)*100).toFixed(1).replace('.',',')+' %']
        ].map(function(x){return '<div class="soreal-idle-summary-v28">'+x[0]+'<b>'+x[1]+'</b></div>';}).join('');
        function ligne(n){
          const cap=capDe(n.resource);
          const dispo=Math.max(0,cap-alloueAutres(n.resource,n.id));
          const verrou=n.resource==='magic'&&!ng.magicUnlocked;
          const valeurs=[0,Math.floor(dispo*.25),Math.floor(dispo*.5),Math.floor(dispo)];
          const pct=Math.max(0,Math.min(100,H.idleNombre_(n.progress)*100));
          const symbole=n.resource==='magic'?'✨':'⚡';
          const boutons=valeurs.map(function(v,i){
            return '<button type="button" class="soreal-idle-expand-button-v25" '+(verrou?'disabled':'onclick="window.__actionMetaV47__({action:\'allocateNgu\',ngu:\''+H.idleHtml_(n.id)+'\',value:'+v+'})"')+'>'+['0%','25%','50%','100%'][i]+'</button>';
          }).join('');
          return '<div class="soreal-idle-section-v8" style="margin:0;opacity:'+(verrou?'.55':'1')+'">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+H.idleHtml_(n.name)+' · Niv. '+H.formatGrandNombreIdleV70_(n.level)+'</b><span>'+H.formatGrandNombreIdleV70_(n.allocation)+' '+symbole+'</span></div>'+
            '<div style="font-size:12px;color:#aeb5c8">'+H.idleHtml_(n.effect)+' : <b>'+(n.id==='respawn'?'-':'+')+H.formatGrandNombreIdleV70_(n.effectPct,2)+' %</b>'+
            (n.secondsPerLevel!==null&&n.secondsPerLevel!==undefined?' · prochain niveau ≈ '+dureeLongueNguIdleV1_(n.secondsPerLevel):(verrou?' · Magic verrouillée':' · aucune allocation'))+'</div>'+
            '<div class="soreal-idle-bt-track-v120"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;background:#6366f1;transition:none"></div></div>'+
            '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'+boutons+'</div></div>';
        }
        const energie=liste.filter(function(n){return n.resource==='energy';}).map(ligne).join('');
        const magie=liste.filter(function(n){return n.resource==='magic';}).map(ligne).join('');
        return titre+
          '<div class="soreal-idle-section-v8" style="margin:0 0 10px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b>Palier</b>'+onglets+'</div>'+
          '<div style="font-size:12px;color:#aeb5c8;margin-top:6px">Un seul palier reçoit de l\'énergie et de la magie à la fois ; les effets des paliers débloqués se multiplient.</div></div>'+
          '<div class="soreal-idle-summary-grid-v28">'+resume+'</div>'+
          '<h3 style="margin:16px 0 8px">NGU Energy</h3><div style="display:grid;gap:10px">'+energie+'</div>'+
          '<h3 style="margin:16px 0 8px">NGU Magic</h3><div style="display:grid;gap:10px">'+magie+'</div>';
      }

      function pageSystemeMetaIdleV130_(
        j,
        id,
        titre
      ){
        if(id==='augmentations')return pageAugmentationsIdleV48_(j);
        if(id==='ngu')return pageNguIdleV1_(j);
        if(id==='timeMachine')return pageTimeMachineIdleV48_(j);
        if(id==='bloodMagic')return pageBloodMagicIdleV48_(j);
        if(id==='yggdrasil')return pageYggdrasilIdleV47_(j);
        if(id==='diggers')return pageDiggersIdleV47_(j);
        if(id==='tower')return pageItopodIdleV1_(j);
        if(id==='perks')return pagePerksIdleV1_(j);
        if(id==='quirks')return pageQuirksIdleV1_(j);
        /* Questing : page dans modules/questing-v1.js. */
        if(id==='questing'&&window.__SOREAL_IDLE_QUESTING_V1__)return window.__SOREAL_IDLE_QUESTING_V1__.page(j);
        if(id==='challenges')return pageChallengesIdleV1_(j);

        if(id==='moneyPit')return pageMoneyPitDailySpinIdleV206_(j);

        const s=
          systemeMetaParIdIdleV130_(
            j,
            id
          );

        return ''+
          window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
            (s?s.icon:'⚙️')+' '+(titre||(s&&s.name)||'Système'),
            s&&s.desc
              ?s.desc
              :'Métaprogression SOREAL IDLE.'
          )+
          bandeauMetaIdleV130_(j)+
          rendreSystemeMetaIdleV130_(
            j,
            s,
            true
          );
      }




  window.__SOREAL_IDLE_META_V130__={
    pageSystemeMetaIdleV130_:pageSystemeMetaIdleV130_,
    actionMetaIdleV130_:actionMetaIdleV130_,
    estOccupeIdleV130_:function(){return idleMetaBusyV130;},
    systemeMetaParIdIdleV130_:systemeMetaParIdIdleV130_,
    pageSpendExpIdleV1_:pageSpendExpIdleV1_
  };
})();
