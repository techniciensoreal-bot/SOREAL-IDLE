/*
 * SOREAL IDLE — Inventaire, Coffre et sacs (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_inventaire_v1)return;
  REG.__chargé_ui_inventaire_v1=true;

  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function planifierRenduOptimisteIdleV60_(){return REG.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
  function ajouterActionRapideIdleV60_(){return REG.ajouterActionRapideIdleV60_.apply(null,arguments);}
  function idleFastPendingV60_(){return REG.idleFastPendingV60_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function planifierEnvoiRapideIdleV60_(){return REG.planifierEnvoiRapideIdleV60_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function idleRareteClasseObjetAdventureIdleV1_(){return REG.idleRareteClasseObjetAdventureIdleV1_.apply(null,arguments);}
  function enregistrerObjetPopupIdleV1_(){return REG.enregistrerObjetPopupIdleV1_.apply(null,arguments);}
  function iconeObjetAdventureIdleV138_(){return REG.iconeObjetAdventureIdleV138_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function revisionAdventureServeurIdleV208_(){return REG.revisionAdventureServeurIdleV208_.apply(null,arguments);}
  function memoriserAdventureDiffereeIdleV208_(){return REG.memoriserAdventureDiffereeIdleV208_.apply(null,arguments);}
  function joueurAvecAdventureIdleV208_(){return REG.joueurAvecAdventureIdleV208_.apply(null,arguments);}
  function fusionnerAdventureServeurAvecInventaireLocalV208_(){return REG.fusionnerAdventureServeurAvecInventaireLocalV208_.apply(null,arguments);}
  function rendreCarteSacAdventureIdleV138_(){return REG.rendreCarteSacAdventureIdleV138_.apply(null,arguments);}
  function rendreAccessoiresAdventureIdleV138_(){return REG.rendreAccessoiresAdventureIdleV138_.apply(null,arguments);}
  function rendreSlotPaperdollAdventureIdleV138_(){return REG.rendreSlotPaperdollAdventureIdleV138_.apply(null,arguments);}
  function rendreSlotCubeInfiniAdventureIdleV1_(){return REG.rendreSlotCubeInfiniAdventureIdleV1_.apply(null,arguments);}
  function rendreCoffreAdventureIdleV1_(){return REG.rendreCoffreAdventureIdleV1_.apply(null,arguments);}
  function rendreBonusEquipementAdventureIdleV1_(){return REG.rendreBonusEquipementAdventureIdleV1_.apply(null,arguments);}
  function composerCorpsComparaisonIdleV1_(){return REG.composerCorpsComparaisonIdleV1_.apply(null,arguments);}
  function afficherDetailsObjetAdventureIdleV138_(){return REG.afficherDetailsObjetAdventureIdleV138_.apply(null,arguments);}
  function casesSacAdventureIdleV162_(){return REG.casesSacAdventureIdleV162_.apply(null,arguments);}
  function equipementBloqueParDefiIdleV1_(){return REG.equipementBloqueParDefiIdleV1_.apply(null,arguments);}
  function specialAcceptePlusDeBoostIdleV1_(){return REG.specialAcceptePlusDeBoostIdleV1_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function remplacerAdventureInventaireIdleV160_(){return REG.remplacerAdventureInventaireIdleV160_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function patchInventaireAdventureIdleV160_(){return REG.patchInventaireAdventureIdleV160_.apply(null,arguments);}
  function appliquerSynchroCombatSansReflowIdleV116_(){return REG.appliquerSynchroCombatSansReflowIdleV116_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function appliquerAdventureDiffereeIdleV208_(){return REG.appliquerAdventureDiffereeIdleV208_.apply(null,arguments);}
  function appelerProgressionIdleCloudflareV1_(){return REG.appelerProgressionIdleCloudflareV1_.apply(null,arguments);}
  function gestesAchetesIdleV1_(){return REG.gestesAchetesIdleV1_.apply(null,arguments);}
  function rendreTrashAdventureIdleV165_(){return REG.rendreTrashAdventureIdleV165_.apply(null,arguments);}
  function rendreGrilleSacAdventureIdleV1_(){return REG.rendreGrilleSacAdventureIdleV1_.apply(null,arguments);}

      function ancreSacIdleV1_(){
        const sac=document.getElementById('soreal-idle-v138-bag-section');
        if(!sac)return null;
        const r=sac.getBoundingClientRect();
        /* Seulement si le sac est (au moins en partie) à l'écran : sinon le joueur regarde ailleurs, le scrollY habituel suffit. */
        return r.bottom>0&&r.top<(window.innerHeight||0)?{haut:r.top}:null;
      }

      function restaurerAncreSacIdleV1_(ancre,xAvant,yAvant){
        if(!ancre)return;
        let dernierY=null;
        function caler(){
          const sac=document.getElementById('soreal-idle-v138-bag-section');
          if(!sac)return;
          /* Le joueur a défilé lui-même depuis notre dernier calage : on n'y touche plus. */
          if(dernierY!==null&&Math.abs((window.scrollY||0)-dernierY)>2)return;
          const ecart=sac.getBoundingClientRect().top-ancre.haut;
          if(Math.abs(ecart)>1)window.scrollTo(xAvant,(window.scrollY||0)+ecart);
          dernierY=window.scrollY||0;
        }
        caler();
        setTimeout(caler,120);
        setTimeout(caler,450);
      }

      function objetEquipeIdleV10_(
        j,
        objet
      ){
        if(
          !j ||
          !j.equipement ||
          !objet
        ){
          return false;
        }

        const equipe =
          j.equipement[
            objet.slot
          ];

        return Boolean(
          equipe &&
          String(equipe.id) ===
          String(objet.id)
        );
      }

      function forgerEquipementIdleV25_(
        slot
      ){
        if(
          !SOREAL_SESSION ||
          !REG.idleEtat ||
          !REG.idleEtat.equipement
        ){
          return;
        }

        const objet=
          REG.idleEtat.equipement[
            slot
          ];

        if(!objet){
          messageFlottantIdleV32_(
            '❌ Aucun objet équipé.'
          );
          return;
        }

        const forgeEtat=
          REG.idleEtat.forge &&
          REG.idleEtat.forge[slot]
            ?REG.idleEtat.forge[slot]
            :null;

        const cout=
          Math.max(
            1,
            idleEntier_(
              forgeEtat&&forgeEtat.cout
            )
          );

        if(
          idleEntier_(
            REG.idleEtat.materiaux
          )<cout
        ){
          messageFlottantIdleV32_(
            '❌ Pas assez de matériaux.'
          );
          return;
        }

        REG.idleEtat.materiaux=
          Math.max(
            0,
            idleEntier_(
              REG.idleEtat.materiaux
            )-
            cout
          );

        const avant=
          idleNombre_(
            objet.bonusPuissance
          );

        objet.forge=
          idleEntier_(
            objet.forge
          )+1;

        objet.bonusPuissance=
          Math.max(
            1,
            Math.round(
              avant*1.18+1
            )
          );

        if(
          Array.isArray(
            REG.idleEtat.inventaire
          )
        ){
          const indexInventaire=
            REG.idleEtat.inventaire.findIndex(
              function(item){
                return String(
                  item&&item.id||''
                )===
                String(
                  objet.id||''
                );
              }
            );

          if(indexInventaire>=0){
            REG.idleEtat.inventaire[
              indexInventaire
            ]=
              objet;
          }
        }

        const delta=
          idleNombre_(
            objet.bonusPuissance
          )-
          avant;

        REG.idleEtat.puissance=
          Math.max(
            1,
            idleNombre_(
              REG.idleEtat.puissance
            )+
            delta
          );

        REG.idleEtat.bonusEquipement=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.bonusEquipement
            )+
            delta
          );

        if(!REG.idleEtat.forge){
          REG.idleEtat.forge={};
        }

        const meta=
          REG.idleEtat.forgeMeta||{
            base:5,
            croissance:1.65
          };

        REG.idleEtat.forge[slot]={
          niveau:
            idleEntier_(
              objet.forge
            ),
          cout:
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
                  idleEntier_(
                    objet.forge
                  )
                )
              )
            )
        };

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'forge',
          slot
        );

        messageFlottantIdleV32_(
          '🔥 Forge +'+
          idleEntier_(
            objet.forge
          )
        );
      }

      let idleRecycleInflightV38=[];

      let idleRecycleTimerV38=null;

      function casesInventaireIdleV78_(j){
        const capacite=
          Math.max(
            1,
            idleEntier_(j&&j.inventaireCapacite)
          );

        const slots=
          new Array(capacite).fill(null);

        const inventaire=
          (
            Array.isArray(j&&j.inventaire)
              ?j.inventaire
              :[]
          )
          .filter(function(objet){
            return !objetEquipeIdleV10_(j,objet);
          });

        const aPlacer=[];

        inventaire.forEach(function(objet){
          const position=
            idleEntier_(objet&&objet.positionSac);

          if(
            position>=1 &&
            position<=capacite &&
            !slots[position-1]
          ){
            slots[position-1]=objet;
          }else{
            aPlacer.push(objet);
          }
        });

        aPlacer.forEach(function(objet){
          const index=
            slots.findIndex(function(valeur){
              return !valeur;
            });

          if(index<0)return;

          objet.positionSac=index+1;
          slots[index]=objet;
        });

        slots.forEach(function(objet,index){
          if(objet){
            objet.positionSac=index+1;
          }
        });

        return slots;
      }

      function objetsEncoreEnAttenteRecycleV38_(){
        return REG.idleRecycleQueueV38.concat(
          idleRecycleInflightV38
        );
      }

      function appliquerSuppressionsLocalesRecycleV38_(
        joueur
      ){
        if(
          !joueur ||
          !Array.isArray(
            joueur.inventaire
          )
        ){
          return joueur;
        }

        const ids=
          objetsEncoreEnAttenteRecycleV38_();

        if(!ids.length){
          return joueur;
        }

        joueur.inventaire=
          joueur.inventaire.filter(
            function(objet){
              return (
                ids.indexOf(
                  String(
                    objet&&objet.id||''
                  )
                )===-1
              );
            }
          );

        joueur.inventaireUtilise=
          Math.max(
            0,
            joueur.inventaire.length
          );

        return joueur;
      }

      function programmerEnvoiRecycleV38_(){
        if(
          REG.idleRecycleBatchV32 ||
          idleRecycleTimerV38 ||
          !REG.idleRecycleQueueV38.length
        ){
          return;
        }

        idleRecycleTimerV38=
          setTimeout(function(){
            idleRecycleTimerV38=null;
            envoyerRecycleQueueV38_();
          },90);
      }

      function envoyerRecycleQueueV38_(){
        if(
          REG.idleRecycleBatchV32 ||
          !REG.idleRecycleQueueV38.length ||
          !SOREAL_SESSION
        ){
          return;
        }

        if(
          REG.idleFastNetworkBusyV60
        ){
          setTimeout(
            envoyerRecycleQueueV38_,
            100
          );
          return;
        }

        REG.idleRecycleBatchV32=true;

        idleRecycleInflightV38=
          REG.idleRecycleQueueV38.splice(
            0,
            REG.idleRecycleQueueV38.length
          );

        const envoyes=
          idleRecycleInflightV38.slice();

        google.script.run
          .withSuccessHandler(function(res){
            REG.idleRecycleBatchV32=false;
            idleRecycleInflightV38=[];

            if(
              res &&
              res.ok &&
              res.joueur &&
              !idleFastPendingV60_() &&
              !REG.idleFastNetworkBusyV60
            ){
              REG.idleEtat=
                appliquerSuppressionsLocalesRecycleV38_(
                  res.joueur
                );

              rendreIdleEtat_({
                ok:true,
                joueur:REG.idleEtat
              });
            }else if(
              !idleFastPendingV60_()
            ){
              synchroniserJeuIdleV7_();
            }

            programmerEnvoiRecycleV38_();

            if(
              idleFastPendingV60_()
            ){
              planifierEnvoiRapideIdleV60_(35);
            }
          })
          .withFailureHandler(function(){
            REG.idleRecycleBatchV32=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-96 */
            REG.idleRecycleQueueV38=
              envoyes.concat(
                REG.idleRecycleQueueV38
              );

            idleRecycleInflightV38=[];

            setTimeout(
              programmerEnvoiRecycleV38_,
              300
            );
          })
          .recyclerObjetsSorealIdle(
            SOREAL_SESSION,
            envoyes
          );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-173 */
      const IDLE_COLLECTION_BOOST_RE_V1=/^boost:([a-z]+):(\d+)$/;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-174 */
      let idlePageCollectionEquipementV1=1;

      function changerPageCollectionEquipementV1_(page){
        idlePageCollectionEquipementV1=Math.max(1,idleEntier_(page)||1);
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      function rendreCollectionEquipementIdleV1_(itemList,catalog,completedSets,cube,setCatalog){
        const setsDemarres=new Set(
          Object.keys(itemList).map(function(id){
            const def=catalog[id];
            return def&&def.kind==='equipment'&&itemList[id]&&itemList[id].seen
              ?String(def.set||'')
              :'';
          }).filter(Boolean)
        );
        const idsEquipementToutes=Object.keys(catalog).filter(function(id){
          const def=catalog[id];
          if(!def)return false;
          if(def.kind==='equipment'){
            /* ANTI-SPOIL (2026-09-24) : seulement les pièces déjà obtenues, jamais les cases vides du set. */
            return Boolean(itemList[id])&&setsDemarres.has(String(def.set||''));
          }
          return Boolean(itemList[id]&&itemList[id].seen);
        });
        const idsBoosts=Object.keys(itemList).filter(function(id){
          return IDLE_COLLECTION_BOOST_RE_V1.test(id);
        });

        const totalPagesEquipement=Math.max(1,Math.ceil(idsEquipementToutes.length/REG.IDLE_PAGINATION_TAILLE_V1));
        if(idlePageCollectionEquipementV1>totalPagesEquipement)idlePageCollectionEquipementV1=totalPagesEquipement;
        const debutPageEquipement=(idlePageCollectionEquipementV1-1)*REG.IDLE_PAGINATION_TAILLE_V1;
        const idsEquipement=idsEquipementToutes.slice(debutPageEquipement,debutPageEquipement+REG.IDLE_PAGINATION_TAILLE_V1);

        const setsConnus=Object.keys(completedSets).filter(function(setId){
          const idsDuSet=Object.keys(catalog).filter(function(id){
            const def=catalog[id];
            return Boolean(def&&def.kind==='equipment'&&String(def.set||'')===String(setId));
          });
          return Boolean(
            idsDuSet.length&&
            idsDuSet.every(function(id){
              return Boolean(itemList[id]&&itemList[id].fullyMaxed);
            })
          );
        }).map(function(setId){
          const entree=Object.values(catalog).filter(function(c){
            return c&&String(c.set||'')===String(setId);
          })[0];
          return idleHtml_(entree?entree.setName:setId);
        });

        /* Sets d'objets complétés (Graine, Nombre…) : le moteur dit qu'ils sont complétés et fournit leur nom (Norman, 2026-10-30 : le set « seed » n'apparaissait nulle part). */
        const catSets=setCatalog&&typeof setCatalog==='object'?setCatalog:{};
        Object.keys(completedSets).forEach(function(setId){
          const d=catSets[setId];
          if(completedSets[setId]&&d&&d.source==='objets')setsConnus.push(idleHtml_(d.name||setId));
        });
        const setsHtml=setsConnus.length
          ?'<div class="soreal-idle-collection-sets-v1"><b>🏅 Sets complétés (100 % boostés)</b><div>'+setsConnus.join(' · ')+'</div></div>'
          :'';

        const cubeHtml=cube&&cube.unlocked
          ?'<div class="soreal-idle-collection-cube-v1">🧊 <b>Cube de l’infini</b> — Puissance '+formatGrandNombreIdleV70_(cube.power||0)+' · Endurance '+formatGrandNombreIdleV70_(cube.toughness||0)+'</div>'
          :'';

        const grilleEquipement='<div class="soreal-idle-collection-grid-v1">'+
          idsEquipement.map(function(id){
            const def=catalog[id];
            const info=itemList[id];

            if(!info)return '';

            const niveau=idleEntier_(info.maxLevel);
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-175 */
            const maxAtteint=Boolean(info.fullyMaxed);
            const nom=def.name;
            const estEquipement=def.kind==='equipment';
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-176 */
            const estStatBearing=estEquipement||def.kind==='special'||def.kind==='cube';
            const pseudoItem=estEquipement
              ?{set:def.set,slot:def.slot,name:def.name,definitionId:id,wikiItemId:def.wikiItemId||0,kind:'equipment',level:niveau}
              :(def.kind==='cube'?{set:'',slot:def.slot||'special',name:def.name,definitionId:id,wikiItemId:def.wikiItemId||0,kind:'cube',level:niveau}
                /* Objets spéciaux (accessoires comme The Tuba of Time) : leur image existe aussi (Norman, 2026-10-02 : « dans collection, des items ne montrent pas l'image »). */
                :(def.kind==='special'?{set:'',slot:def.slot||'accessory',name:def.name,definitionId:id,wikiItemId:def.wikiItemId||0,kind:'special',level:niveau}:null));
            const puissance=estStatBearing?Math.round(idleNombre_(def.basePower)*(1+niveau/100)):0;
            const solidite=estStatBearing?Math.round(idleNombre_(def.baseToughness)*(1+niveau/100)):0;
            const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(def);
            /* Fiche unifiée (Norman, 2026-10-03) : la Collection ouvre la même fiche d'objet que l'inventaire et le coffre, au niveau maximum enregistré. */
            const clePopupCollection='collection:'+String(id);
            if(estStatBearing){
              const facteurNiveau=1+niveau/100;
              enregistrerObjetPopupIdleV1_(clePopupCollection,{
                kind:def.kind,name:def.name,definitionId:id,level:niveau,fullyMaxed:maxAtteint,
                basePower:idleNombre_(def.basePower),baseToughness:idleNombre_(def.baseToughness),
                power:idleNombre_(def.basePower)*facteurNiveau,toughness:idleNombre_(def.baseToughness)*facteurNiveau,
                specialsAll:(Array.isArray(def.specials)?def.specials:[]).map(function(sp){return{type:sp[0],value:idleNombre_(sp[1])*facteurNiveau,max:idleNombre_(sp[1])*facteurNiveau};})
              },'collection');
            }

            return '<div class="soreal-idle-collection-card-v1'+(maxAtteint?' maxed':' nonmax')+(rareteClasse?' '+rareteClasse:'')+'" '+
              (estStatBearing?'data-popup-objet-v1="'+idleHtml_(clePopupCollection)+'" ':'')+
              'onclick="'+(estStatBearing?'window.__consulterObjetIdleV1__(\''+idleHtml_(clePopupCollection)+'\',this)':'window.__afficherDetailsCollectionIdleV1__(\''+idleHtml_(id)+'\')')+'">'+
              (maxAtteint?'<div class="soreal-idle-collection-check-v1" title="Niveau 100 + statistiques boostées à 100 %">✔</div>':'')+
              '<div class="soreal-idle-collection-card-icon-v1">'+
                (pseudoItem?iconeObjetAdventureIdleV138_(pseudoItem):'<span>'+(def.kind==='cube'?'🧊':'✨')+'</span>')+
              '</div>'+
              '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(nom)+'</div>'+
              (estEquipement
                ?'<div class="soreal-idle-collection-card-level-v1">Niv. '+niveau+'/100</div>'
                :'')+
              '<div class="soreal-idle-collection-card-details-v1" id="soreal-idle-collection-details-'+idleHtml_(id)+'" style="display:none">'+
                (estStatBearing
                  ?'<div>Puissance '+formatGrandNombreIdleV70_(puissance)+'</div><div>Endurance '+formatGrandNombreIdleV70_(solidite)+'</div>'
                  :'<div>Objet spécial</div>')+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>'+
        rendrePaginationIdleV1_(idlePageCollectionEquipementV1,totalPagesEquipement,'window.__changerPageCollectionEquipementV1__');

        const grilleBoosts=idsBoosts.length
          ?'<div class="soreal-idle-collection-sets-v1"><b>⚡ Boosts obtenus</b>'+
            (function(){
              const maxes=idsBoosts.filter(function(id){return itemList[id]&&idleEntier_(itemList[id].maxLevel)>=100;}).length;
              return maxes?'<div>✔ '+maxes+' boost'+(maxes>1?'s':'')+' au niveau 100 : +'+(maxes*2)+' % d’efficacité de tous les boosts</div>':'';
            })()+
          '</div>'+
            '<div class="soreal-idle-collection-grid-v1">'+
            idsBoosts.map(function(id){
              const m=IDLE_COLLECTION_BOOST_RE_V1.exec(id);
              const type=m[1],force=m[2];
              const nomBoost='Boost '+type.charAt(0).toUpperCase()+type.slice(1)+' +'+force;
              /* Boost fusionné jusqu'au niveau 100 (Norman, 2026-10-03) : le petit V vert comme sur les autres objets ; chaque boost maximisé donne +2 % d'efficacité à tous les boosts (récompense déjà versée par le serveur). */
              const boostMaxe=Boolean(itemList[id]&&idleEntier_(itemList[id].maxLevel)>=100);
              return '<div class="soreal-idle-collection-card-v1'+(boostMaxe?' maxed':' nonmax')+'">'+
                (boostMaxe?'<div class="soreal-idle-collection-check-v1" title="Niveau 100 : +2 % d’efficacité de tous les boosts">✔</div>':'')+
                '<div class="soreal-idle-collection-card-icon-v1">'+
                  iconeObjetAdventureIdleV138_({kind:'boost',boostType:type,strength:force})+
                '</div>'+
                '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(nomBoost)+'</div>'+
              '</div>';
            }).join('')+
            '</div>'
          :'';

        return setsHtml+cubeHtml+grilleEquipement+grilleBoosts;
      }

      const IDLE_ADVENTURE_COMBAT_FIELDS_V1=['fight','selectedZone','lastCombatZone','retourSafe'];

      function protegerJoueurServeurInventaireIdleV208_(joueur){
        if(!joueur)return joueur;
        const serveur=aventureMetaIdleV47_(joueur);
        if(!serveur)return joueur;

        const revision=revisionAdventureServeurIdleV208_(serveur);
        const local=REG.idleEtat?aventureMetaIdleV47_(REG.idleEtat):null;
        const mutationEnCours=Boolean(
          REG.idleInventoryBusyV160||
          REG.idleInventoryMutationQueueV160.length
        );

        if(mutationEnCours&&local){
          memoriserAdventureDiffereeIdleV208_(serveur);
          REG.idleAdventureRevisionServeurV208=Math.max(
            REG.idleAdventureRevisionServeurV208,
            revision
          );
          return joueurAvecAdventureIdleV208_(
            joueur,
            fusionnerAdventureServeurAvecInventaireLocalV208_(
              serveur,
              local
            )
          );
        }

        if(
          local&&
          revision<REG.idleAdventureRevisionServeurV208
        ){
          const fusionPerimee=fusionnerAdventureServeurAvecInventaireLocalV208_(
            serveur,
            local
          );
          /* Réponse plus ANCIENNE que celle déjà reçue : le combat et la zone viennent aussi du local. Sinon une synchro lancée juste avant « Affronter » un Titan revenait après lui, sans combat : la scène du Titan disparaissait jusqu'au rafraîchissement (Norman, 2026-10-07 : « il est apparu après un refresh »). */
          IDLE_ADVENTURE_COMBAT_FIELDS_V1.forEach(function(cle){
            if(Object.prototype.hasOwnProperty.call(local,cle)){
              fusionPerimee[cle]=cloneInventaireIdleV160_(local[cle]);
            }
          });
          return joueurAvecAdventureIdleV208_(joueur,fusionPerimee);
        }

        REG.idleAdventureRevisionServeurV208=Math.max(
          REG.idleAdventureRevisionServeurV208,
          revision
        );
        REG.idleInventoryConfirmedAdventureV160=
          cloneInventaireIdleV160_(serveur);
        return joueur;
      }

      function cloneInventaireIdleV160_(value){
        if(value==null)return value;
        if(typeof structuredClone==='function'){
          try{return structuredClone(value);}catch(_e){}
        }
        return JSON.parse(JSON.stringify(value));
      }

      function marquePerfInventaireIdleV160_(nom,id){
        try{
          if(window.performance&&typeof performance.mark==='function'){
            performance.mark('soreal-idle-inventory-v160:'+nom+':'+String(id||0));
          }
        }catch(_e){}
      }

      function mesurePerfInventaireIdleV160_(nom,debut,fin,id){
        try{
          if(!window.performance||typeof performance.measure!=='function')return 0;
          const prefix='soreal-idle-inventory-v160:';
          const mesure=prefix+nom+':'+String(id||0);
          performance.measure(
            mesure,
            prefix+debut+':'+String(id||0),
            prefix+fin+':'+String(id||0)
          );
          const entries=performance.getEntriesByName(mesure);
          return entries.length?entries[entries.length-1].duration:0;
        }catch(_e){
          return 0;
        }
      }

      function signatureObjetInventaireIdleV160_(item){
        if(!item)return '';
        return encodeURIComponent(JSON.stringify([
          item.id,item.definitionId,item.kind,item.level,item.power,
          item.toughness,item.special,item.specialType,item.strength,
          item.boostType,item.basePower,item.baseToughness,item.wikiItemId,
          item.name,item.nom,item.slot,item.set,Boolean(item.locked),item._idlePendingV160||0,
          /* Norman (2026-10-30) : « un objet niveau 100 totalement boosté garde son point ; je dois changer d'onglet et revenir ». Le dernier boost peut ne changer que les Specials secondaires : sans ces champs la case gardait sa version et n'était pas redessinée. */
          Boolean(item.fullyMaxed),
          item.boostManque?[Boolean(item.boostManque.power),Boolean(item.boostManque.toughness),Boolean(item.boostManque.special)]:0,
          Array.isArray(item.specialsAll)?item.specialsAll.map(function(sv){return sv&&sv.value;}):0
        ]));
      }

      function construirePlanSacIdleV160_(items,capacite){
        const liste=Array.isArray(items)?items:[];
        const cap=Math.max(0,Math.floor(Number(capacite)||0));
        const total=Math.max(cap,liste.length);
        const plan=[];
        for(let i=0;i<total;i+=1){
          const item=liste[i]||null;
          plan.push(
            item
              ?{
                  key:'item:'+String(item.id||''),
                  version:signatureObjetInventaireIdleV160_(item),
                  item:item,
                  index:i
                }
              :{
                  key:'empty:'+String(i),
                  version:'empty',
                  item:null,
                  index:i
                }
          );
        }
        return plan;
      }

      function noeudDepuisHtmlInventaireIdleV160_(html){
        const template=document.createElement('template');
        template.innerHTML=String(html||'').trim();
        return template.content.firstElementChild||null;
      }

      function noeudVideSacInventaireIdleV160_(index){
        const node=document.createElement('div');
        node.className='soreal-idle-v138-bag-card soreal-idle-v138-bag-card-vide';
        node.dataset.emptySlotV160=String(index);
        node.dataset.slotIndex=String(index);
        node.setAttribute('ondragover','window.__survolCibleAdventureIdleV138__(event)');
        node.setAttribute('ondragleave','window.__quitterCibleAdventureIdleV138__(event)');
        node.setAttribute('ondrop','window.__deposerSurEmplacementVideSacAdventureIdleV1__(event,'+String(index)+')');
        return node;
      }

      function patchGrilleSacInventaireIdleV160_(modele){
        const root=document.querySelector(
          '#soreal-idle-v138-bag-section .soreal-idle-v138-bag'
        );
        if(!root||!modele)return false;

        const existants=Array.from(root.children);
        const parId=new Map();
        const vides=[];
        const fillers=[];
        existants.forEach(function(node){
          const id=node&&node.dataset?String(node.dataset.itemId||''):'';
          if(id)parId.set(id,node);
          else if(node.classList&&node.classList.contains('soreal-idle-v138-bag-filler'))fillers.push(node);
          else vides.push(node);
        });

        /*
         * Le sac est en pages de 60 cases (Norman, 2026-10-08 : « je ne veux que 60 cases affichées à la fois ; quand je range avec TRIER, ça en ajoute plus de 60 »). La mise à jour en place ne redessine
         * que la page affichée : avant, elle posait TOUTES les cases du sac d'un coup (le rendu complet, lui, découpait déjà en pages). Les numéros d'emplacement restent absolus.
         */
        const planComplet=construirePlanSacIdleV160_(
          modele.sacItems,
          modele.capacite
        );
        const pagesSac=Math.max(1,Math.ceil(planComplet.length/REG.IDLE_SAC_CASES_PAR_PAGE_V1));
        if(REG.idlePageSacV1>pagesSac)REG.idlePageSacV1=pagesSac;
        REG.idlePagesSacV1=pagesSac;
        const debutSac=(REG.idlePageSacV1-1)*REG.IDLE_SAC_CASES_PAR_PAGE_V1;
        const plan=planComplet.slice(debutSac,debutSac+REG.IDLE_SAC_CASES_PAR_PAGE_V1);
        const noeudsFinaux=[];

        plan.forEach(function(desc){
          let node=null;
          if(desc.item){
            const id=String(desc.item.id||'');
            const courant=parId.get(id)||null;
            if(
              courant&&
              courant.dataset&&
              courant.dataset.itemVersion===desc.version
            ){
              node=courant;
              if(node.dataset.slotIndex!==String(desc.index))node.dataset.slotIndex=String(desc.index);
              REG.idleInventoryPerfV160.nodesReused+=1;
            }else{
              node=noeudDepuisHtmlInventaireIdleV160_(
                rendreCarteSacAdventureIdleV138_(desc.item,desc.index)
              );
              REG.idleInventoryPerfV160.nodesCreated+=1;
            }
          }else{
            node=vides.shift()||noeudVideSacInventaireIdleV160_(desc.index);
            if(node){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-180 */
              if(node.dataset.slotIndex!==String(desc.index)){
                node.dataset.emptySlotV160=String(desc.index);
                node.dataset.slotIndex=String(desc.index);
                node.setAttribute(
                  'ondrop',
                  'window.__deposerSurEmplacementVideSacAdventureIdleV1__(event,'+
                  String(desc.index)+
                  ')'
                );
              }
              REG.idleInventoryPerfV160.nodesReused+=1;
            }
          }
          if(node)noeudsFinaux.push(node);
        });
        /* Cases invisibles qui complètent la dernière page (même hauteur de cadre d'une page à l'autre : rien ne bouge sous le sac). */
        if(pagesSac>1){
          while(noeudsFinaux.length<REG.IDLE_SAC_CASES_PAR_PAGE_V1){
            let f=fillers.shift();
            if(!f){f=document.createElement('div');f.className='soreal-idle-v138-bag-card soreal-idle-v138-bag-filler';f.setAttribute('aria-hidden','true');}
            noeudsFinaux.push(f);
          }
        }

        /*
         * Clignotement de l'inventaire (Norman, 2026-10-08 : « l'inventaire clignote une fraction de seconde parfois »). « replaceChildren » retirait puis remettait TOUTES les cases, même celles
         * qui ne changeaient pas : leurs animations repartaient de zéro et le navigateur les repeignait d'un coup. On ne touche maintenant qu'à ce qui a vraiment changé : rien si la page est
         * identique, sinon seulement les cases déplacées, ajoutées ou retirées.
         */
        const actuels=Array.from(root.children);
        if(actuels.length===noeudsFinaux.length&&actuels.every(function(n,i){return n===noeudsFinaux[i];}))return true;
        noeudsFinaux.forEach(function(node,i){
          if(root.children[i]!==node)root.insertBefore(node,root.children[i]||null);
        });
        while(root.children.length>noeudsFinaux.length)root.removeChild(root.lastElementChild);
        return true;
      }

      function htmlEquipementInventaireIdleV160_(modele){
        const accessoiresRendu=rendreAccessoiresAdventureIdleV138_(
          modele.equipment,
          modele.itemById,
          modele.accessorySlotsCapacity
        );
        return '<div class="soreal-idle-window-title-v31"><i class="dsn-v1 dsn-equipement" aria-hidden="true"></i> Équipement</div>'+
          '<div class="soreal-idle-v138-paperdoll">'+
            accessoiresRendu.enGrille+
            rendreSlotPaperdollAdventureIdleV138_(
              'head','Casque',modele.itemById.get(String(modele.equipment.head))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'chest','Torse',modele.itemById.get(String(modele.equipment.chest))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'legs','Pantalon',modele.itemById.get(String(modele.equipment.legs))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'boots','Bottes',modele.itemById.get(String(modele.equipment.boots))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'weapon','Arme',modele.itemById.get(String(modele.equipment.weapon))
            )+
            (modele.secondWeaponUnlocked||modele.equipment.weapon2
              ?rendreSlotPaperdollAdventureIdleV138_('weapon2','Seconde arme',modele.itemById.get(String(modele.equipment.weapon2)))
              :'')+
            rendreSlotCubeInfiniAdventureIdleV1_(modele.cube,modele.cubeTier)+
          '</div>'+
          accessoiresRendu.debordement+
          (window.__SOREAL_IDLE_THE_END_UI_V1__?window.__SOREAL_IDLE_THE_END_UI_V1__.panelHtml({theEnd:modele.theEnd}):'');
      }

      function patchResumeInventaireIdleV160_(modele){
        if(!modele)return;
        const titreSac=document.querySelector(
          '#soreal-idle-v138-bag-section .soreal-idle-window-title-v31'
        );
        if(titreSac){
          /* Réécrit seulement quand le nombre de cases change : l'icône dessinée n'est plus recréée (clignotement) à chaque mise à jour. */
          const cleTitre=modele.utilise+'/'+modele.capacite;
          if(titreSac.dataset.sacV160!==cleTitre||!titreSac.querySelector('.dsn-sac')){
            titreSac.innerHTML='<i class="dsn-v1 dsn-sac" aria-hidden="true"></i> Sac ('+modele.utilise+' / '+modele.capacite+')';
            titreSac.dataset.sacV160=cleTitre;
          }
        }
      }

      function cleSlotEquipementInventaireIdleV160_(node){
        if(!node||!node.classList)return '';
        const classes=[
          'soreal-idle-v138-slot-acc1',
          'soreal-idle-v138-slot-acc2',
          'soreal-idle-v138-slot-head',
          'soreal-idle-v138-slot-chest',
          'soreal-idle-v138-slot-legs',
          'soreal-idle-v138-slot-boots',
          'soreal-idle-v138-slot-weapon',
          'soreal-idle-v138-slot-weapon2',
          'soreal-idle-v138-slot-cube'
        ];
        return classes.find(function(c){return node.classList.contains(c);})||'';
      }

      function slotEquipementIdentiqueIdleV160_(courant,voulu){
        if(!courant||!voulu)return false;
        const classesCourantes=Array.from(courant.classList)
          .filter(function(c){return c!=='drag-source'&&c!=='drag-over';})
          .sort()
          .join(' ');
        const classesVoulues=Array.from(voulu.classList)
          .filter(function(c){return c!=='drag-source'&&c!=='drag-over';})
          .sort()
          .join(' ');
        return (
          classesCourantes===classesVoulues&&
          String(courant.getAttribute('data-occupant-id')||'')===
            String(voulu.getAttribute('data-occupant-id')||'')&&
          courant.innerHTML===voulu.innerHTML
        );
      }

      function patchEquipementInventaireIdleV160_(modele){
        const root=document.querySelector(
          '.soreal-idle-v138-equipment-sticky'
        );
        if(!root||!modele)return false;

        const virtuel=document.createElement('div');
        virtuel.innerHTML=htmlEquipementInventaireIdleV160_(modele);

        const courantPaper=root.querySelector('.soreal-idle-v138-paperdoll');
        const vouluPaper=virtuel.querySelector('.soreal-idle-v138-paperdoll');
        if(!courantPaper||!vouluPaper)return false;

        const existants=new Map();
        Array.from(courantPaper.children).forEach(function(node){
          const key=cleSlotEquipementInventaireIdleV160_(node);
          if(key)existants.set(key,node);
        });

        const noeudsFinaux=[];
        Array.from(vouluPaper.children).forEach(function(voulu){
          const key=cleSlotEquipementInventaireIdleV160_(voulu);
          const courant=key?existants.get(key):null;
          if(courant&&slotEquipementIdentiqueIdleV160_(courant,voulu)){
            noeudsFinaux.push(courant);
            REG.idleInventoryPerfV160.nodesReused+=1;
          }else{
            noeudsFinaux.push(voulu);
            REG.idleInventoryPerfV160.nodesCreated+=1;
          }
        });
        /* Comme pour le sac : on ne touche qu'aux emplacements qui ont changé (rien si tout est identique), pour ne rien faire clignoter. */
        const actuelsPaper=Array.from(courantPaper.children);
        if(!(actuelsPaper.length===noeudsFinaux.length&&actuelsPaper.every(function(n,i){return n===noeudsFinaux[i];}))){
          noeudsFinaux.forEach(function(node,i){
            if(courantPaper.children[i]!==node)courantPaper.insertBefore(node,courantPaper.children[i]||null);
          });
          while(courantPaper.children.length>noeudsFinaux.length)courantPaper.removeChild(courantPaper.lastElementChild);
        }

        const courantOverflow=root.querySelector('.soreal-idle-v138-accessories');
        const vouluOverflow=virtuel.querySelector('.soreal-idle-v138-accessories');
        if(courantOverflow&&vouluOverflow){
          if(courantOverflow.innerHTML!==vouluOverflow.innerHTML){
            courantOverflow.replaceWith(vouluOverflow);
          }
        }else if(courantOverflow&&!vouluOverflow){
          courantOverflow.remove();
        }else if(!courantOverflow&&vouluOverflow){
          courantPaper.insertAdjacentElement('afterend',vouluOverflow);
        }

        return true;
      }

      function trouverSectionParTitreInventaireIdleV160_(texte){
        const titres=document.querySelectorAll(
          '.soreal-idle-page-root-v28 .soreal-idle-window-title-v31'
        );
        for(let i=0;i<titres.length;i+=1){
          if(String(titres[i].textContent||'').indexOf(texte)!==-1){
            return titres[i].closest('.soreal-idle-section-v8');
          }
        }
        return null;
      }

      function patchCoffreInventaireIdleV160_(modele){
        const section=document.querySelector('.soreal-idle-coffre-titre-v1');
        const root=section&&section.closest('.soreal-idle-section-v8');
        if(!root||!modele)return false;
        const nouveau=noeudDepuisHtmlInventaireIdleV160_(
          rendreCoffreAdventureIdleV1_(
            Array.isArray(modele.a.coffreSlots)?modele.a.coffreSlots:[]
          )
        );
        if(nouveau)root.replaceWith(nouveau);
        return Boolean(nouveau);
      }

      function patchBonusInventaireIdleV160_(modele){
        const root=trouverSectionParTitreInventaireIdleV160_('Equipment Bonuses');
        if(!root||!modele)return false;
        const nouveau=noeudDepuisHtmlInventaireIdleV160_(
          rendreBonusEquipementAdventureIdleV1_(modele.a)
        );
        if(nouveau)root.replaceWith(nouveau);
        return Boolean(nouveau);
      }

      function restaurerFicheInventaireIdleV160_(modele){
        /* Comparaison ouverte : les deux fiches sont recomposées si les deux objets existent encore ; sinon la fenêtre reste telle quelle (elle ne se ferme jamais toute seule). */
        const fenetre=document.getElementById('soreal-idle-v138-details');
        if(fenetre&&fenetre.classList.contains('idle-compare-v183')&&REG.idleComparaisonIdsV1.length===2){
          if(fenetre.style.display!=='none')composerCorpsComparaisonIdleV1_(document.getElementById('soreal-idle-v138-details-body'),REG.idleComparaisonIdsV1[0],REG.idleComparaisonIdsV1[1]);
          return;
        }
        const id=String(REG.idleFicheObjetOuverteIdV1||'');
        if(!id)return;
        const item=modele.items.find(function(x){return String(x&&x.id)===id;});
        if(!item){
          afficherDetailsObjetAdventureIdleV138_('');
          return;
        }
        const popup=document.getElementById('soreal-idle-v138-details');
        if(popup&&popup.style.display!=='none'){
          afficherDetailsObjetAdventureIdleV138_(id);
        }
      }

      function idsEquipesInventaireIdleV160_(a){
        const result=new Set();
        const eq=a&&a.equipment||{};
        REG.ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
          if(eq[slot])result.add(String(eq[slot]));
        });
        (Array.isArray(eq.accessories)?eq.accessories:[])
          .forEach(function(id){result.add(String(id));});
        return result;
      }

      function synchroniserCasesInventaireClientIdleV163_(a){
        if(!a)return [];
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-181 */
        const cases=casesSacAdventureIdleV162_(a);
        a.inventorySlots=cases.map(function(item){
          return item?String(item.id||''):'';
        });
        return a.inventorySlots;
      }

      function recalculerUtilisationInventaireIdleV160_(a){
        if(!a)return;
        const equipes=idsEquipesInventaireIdleV160_(a);
        const items=Array.isArray(a.inventory)?a.inventory:[];
        a.inventoryUsed=items.reduce(function(total,item){
          return total+(item&&!equipes.has(String(item.id))?1:0);
        },0);
      }

      function copieIdleV165_(value){
        if(value==null)return value;
        if(typeof structuredClone==='function'){
          try{return structuredClone(value);}catch(_e){}
        }
        return JSON.parse(JSON.stringify(value));
      }

      function appliquerMutationOptimisteInventaireIdleV160_(a,payload,txId){
        if(!a||!payload)return false;
        a.inventory=Array.isArray(a.inventory)?a.inventory:[];
        a.equipment=a.equipment||{};
        a.equipment.accessories=Array.isArray(a.equipment.accessories)
          ?a.equipment.accessories
          :[];

        synchroniserCasesInventaireClientIdleV163_(a);

        const action=String(payload.action||'');
        const id=String(payload.id||'');
        const items=a.inventory;
        const trouver=function(itemId){
          return items.find(function(x){return String(x&&x.id)===String(itemId||'');})||null;
        };

        if(action==='equip'){
          const item=trouver(id);
          const slot=String(payload.slot||'');
          if(!item||item.kind==='boost')return false;
          if(slot==='accessory'){
            if(a.equipment.accessories.map(String).indexOf(id)===-1){
              if(item.set!=='uug'){
                const generaux=a.equipment.accessories.filter(function(existingId){
                  const existing=trouver(existingId);
                  return !existing||existing.set!=='uug';
                }).length;
                if(generaux>=Math.max(0,idleEntier_(a.accessorySlotsCapacity||2))){
                  return false;
                }
              }
              a.equipment.accessories.push(id);
            }
          }else if(slot==='weapon2'){
            if(!a.secondWeaponUnlocked)return false;
            if(String(item.slot||'')!=='weapon'&&REG.ADVENTURE_SECOND_WEAPON_SLOTS_V1.indexOf(String(item.slot||''))===-1)return false;
            if(String(a.equipment.weapon||'')===id)a.equipment.weapon='';
            a.equipment.weapon2=id;
          }else if(
            REG.ADVENTURE_CORE_SLOTS_V138.indexOf(slot)!==-1&&
            String(item.slot||'')===slot
          ){
            if(String(a.equipment.weapon2||'')===id)a.equipment.weapon2='';
            a.equipment[slot]=id;
          }else{
            return false;
          }
        }else if(action==='unequip'){
          let trouve=false;
          REG.ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
            if(String(a.equipment[slot]||'')===id){
              a.equipment[slot]='';
              trouve=true;
            }
          });
          if(a.equipment.accessories.map(String).indexOf(id)!==-1){
            a.equipment.accessories=a.equipment.accessories.filter(
              function(x){return String(x)!==id;}
            );
            trouve=true;
          }
          if(!trouve)return false;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-182 */
          if(payload.targetIndex!=null){
            synchroniserCasesInventaireClientIdleV163_(a);
            const ordre=a.inventorySlots;
            const src=ordre.map(String).indexOf(id);
            const dst=idleEntier_(payload.targetIndex);
            if(src>=0&&dst>=0&&dst<ordre.length&&src!==dst){
              const tmp=ordre[dst]||'';
              ordre[dst]=id;
              ordre[src]=tmp;
            }
          }
        }else if(action==='merge'){
          const A=trouver(payload.a);
          const B=trouver(payload.b);
          if(!A||!B||A===B||A.definitionId!==B.definitionId)return false;
          if(B.locked)return false;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-183 */
          REG.ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
            if(String(a.equipment[slot]||'')===String(B.id)){
              a.equipment[slot]=A.id;
            }
          });
          if(a.equipment.accessories.map(String).indexOf(String(B.id))!==-1){
            a.equipment.accessories=a.equipment.accessories
              .map(function(x){return String(x)===String(B.id)?A.id:x;})
              .filter(function(x,index,arr){
                return arr.map(String).indexOf(String(x))===index;
              });
          }

          A.level=Math.min(
            100,
            idleEntier_(A.level)+idleEntier_(B.level)+1
          );
          A.power=Math.max(idleNombre_(A.power),idleNombre_(B.power));
          A.toughness=Math.max(idleNombre_(A.toughness),idleNombre_(B.toughness));
          A.special=Math.max(idleNombre_(A.special),idleNombre_(B.special));
          A._idlePendingV160=txId||1;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==String(B.id);
          });
        }else if(action==='boost'){
          const boost=trouver(payload.boostId);
          if(!boost||boost.kind!=='boost')return false;
          if(payload.toCube){
            a.inventory=a.inventory.filter(function(x){
              return String(x&&x.id)!==String(boost.id);
            });
            a.cube=Object.assign({},a.cube||{},{
              _idlePendingV160:txId||1
            });
          }else{
            const target=trouver(payload.targetId);
            if(!target||target.kind==='boost')return false;
            const type=String(boost.boostType||'');
            const q=1+Math.max(0,Math.min(100,idleNombre_(target.level)))/100;
            const cap=type==='power'
              ?idleNombre_(target.basePower)*q
              :type==='toughness'
                ?idleNombre_(target.baseToughness)*q
                :type==='special'
                  ?idleNombre_(target.baseSpecial)*q
                  :0;
            const actuel=type==='power'
              ?idleNombre_(target.power)
              :type==='toughness'
                ?idleNombre_(target.toughness)
                :type==='special'
                  ?idleNombre_(target.special)
                  :0;
            /* Objet sans cette statistique (plafond 0) ou statistique pleine : aucune application optimiste (2026-09-24). */
            const specialsRestants=type==='special'?specialAcceptePlusDeBoostIdleV1_(target):null;
            if(target.fullyMaxed||cap<=1e-9||(specialsRestants===null?actuel>=cap-1e-9:!specialsRestants))return false;
            target._idlePendingV160=txId||1;
            a.inventory=a.inventory.filter(function(x){
              return String(x&&x.id)!==String(boost.id);
            });
          }
        }else if(action==='cube'){
          const boost=trouver(payload.boostId||payload.id);
          if(!boost||boost.kind!=='boost')return false;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==String(boost.id);
          });
          a.cube=Object.assign({},a.cube||{},{
            _idlePendingV160:txId||1
          });
        }else if(action==='reorderInventory'){
          const capacite=Math.max(0,idleEntier_(a.inventoryCapacity||24));
          const ordre=Array.isArray(a.inventorySlots)
            ?a.inventorySlots.slice(0,capacite)
            :[];
          while(ordre.length<capacite)ordre.push('');

          const source=String(payload.sourceId||payload.id||'');
          let src=ordre.map(String).indexOf(source);
          if(src<0){
            const cases=casesSacAdventureIdleV162_(a);
            a.inventorySlots=cases.map(function(item){
              return item?String(item.id||''):'';
            });
            src=a.inventorySlots.indexOf(source);
          }
          if(src<0)return false;

          let dst=-1;
          const targetId=String(payload.targetId||'');
          if(targetId)dst=a.inventorySlots.map(String).indexOf(targetId);
          if(dst<0&&payload.targetIndex!=null){
            dst=idleEntier_(payload.targetIndex);
          }
          if(dst<0||dst>=capacite)return false;
          const temporaire=a.inventorySlots[dst]||'';
          a.inventorySlots[dst]=source;
          a.inventorySlots[src]=temporaire;
        }else if(action==='setLock'){
          const item=trouver(id);
          if(!item)return false;
          item.locked=Boolean(payload.locked);
          item._idlePendingV160=txId||1;
        }else if(action==='trashPut'){
          const item=trouver(id);
          if(!item||item.locked)return false;
          REG.ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
            if(String(a.equipment[slot]||'')===id)a.equipment[slot]='';
          });
          a.equipment.accessories=a.equipment.accessories.filter(
            function(x){return String(x)!==id;}
          );
          a.trash=copieIdleV165_(item);
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==id;
          });
        }else if(action==='trashRecover'){
          if(!a.trash)return false;
          const cap=Math.max(0,idleEntier_(a.inventoryCapacity||24));
          if(idleEntier_(a.inventoryUsed)>=cap)return false;
          a.inventory.push(copieIdleV165_(a.trash));
          a.trash=null;
        }else if(action==='discard'){
          if(idsEquipesInventaireIdleV160_(a).has(id))return false;
          const item=trouver(id);
          if(!item||item.locked)return false;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==id;
          });
        }else if(action==='coffreDeposer'){
          if(idsEquipesInventaireIdleV160_(a).has(id))return false;
          const item=trouver(id);
          if(!item)return false;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==id;
          });
          if(Array.isArray(a.coffreSlots)){
            const slot=a.coffreSlots.find(function(x){
              return x&&String(x.definitionId||'')===String(item.definitionId||'');
            });
            if(slot){
              slot.occupe=true;
              slot.item=cloneInventaireIdleV160_(item);
              jouerEffetAudioIdleV199_('coffreAvale');
            }
          }
        }else if(action==='coffreRetirer'){
          if(!Array.isArray(a.coffreSlots))return false;
          const slot=a.coffreSlots.find(function(x){
            return x&&x.item&&String(x.item.id||'')===id;
          });
          if(!slot||!slot.item)return false;
          a.inventory.push(cloneInventaireIdleV160_(slot.item));
          slot.occupe=false;
          slot.item=null;
          jouerEffetAudioIdleV199_('coffreRecrache');
        }else{
          return false;
        }

        synchroniserCasesInventaireClientIdleV163_(a);
        recalculerUtilisationInventaireIdleV160_(a);
        return true;
      }

      function reconstruireEtatOptimisteInventaireIdleV160_(options){
        if(!REG.idleInventoryConfirmedAdventureV160||!REG.idleEtat)return;
        remplacerAdventureInventaireIdleV160_(
          REG.idleInventoryConfirmedAdventureV160
        );
        pousserEtatVersRuntimePartageIdleV1_();
        patchInventaireAdventureIdleV160_(
          REG.idleEtat,
          options||{}
        );
      }

      function cueAudioMutationInventaireIdleV199_(a,payload){
        if(!a||!payload)return '';

        const action=String(payload.action||'');
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const trouver=function(id){
          return items.find(function(item){
            return String(item&&item.id)===String(id||'');
          })||null;
        };

        if(action==='merge'){
          const A=trouver(payload.a);
          const B=trouver(payload.b);
          if(
            !A||
            !B||
            A===B||
            A.definitionId!==B.definitionId||
            A.kind==='boost'||
            B.kind==='boost'
          ){
            return '';
          }

          const slot=String(A.slot||B.slot||'');
          if(slot==='weapon')return 'mergeWeapon';

          if(['head','chest','legs','boots'].indexOf(slot)!==-1){
            return 'mergeArmor';
          }

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-184 */
          return 'mergeAccessory';
        }

        if(action==='boost'&&!payload.toCube){
          const boost=trouver(payload.boostId);
          const cible=trouver(payload.targetId);

          if(!boost||boost.kind!=='boost'||!cible||cible.kind==='boost'){
            return '';
          }

          const type=String(boost.boostType||'').toLowerCase();
          if(type==='power')return 'boostPower';
          if(type==='toughness')return 'boostToughness';
          if(type==='special')return 'boostSpecial';
        }

        return '';
      }

      /*
       * Refus d'équiper / retirer une pièce qui donne du cap d'énergie ou de magie (Norman, 2026-10-25 : « quand on veut équiper une pièce mais qu'il faut libérer une ressource, aucun message ne nous l'indique »). Le serveur répond bien « Libère X d'énergie avant de retirer cette pièce »,
       * mais toastIdleV5_ reste muet (l'élément #sorealIdleToastV5 n'existe pas dans la page, voulu pour d'autres textes) : ce refus-là a donc son propre bandeau, visible 6 s.
       */
      function annoncerRefusCapEquipementIdleV1_(message){
        try{
          let t=document.getElementById('sorealIdleRefusCapV1');
          if(!t){
            t=document.createElement('div');
            t.id='sorealIdleRefusCapV1';
            t.setAttribute('role','alert');
            t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:2147483000;max-width:min(92vw,520px);text-align:center;padding:10px 18px;border:3px solid #000;border-radius:8px;background:#3a0f0f;color:#ffd0d0;font-weight:800;box-shadow:3px 3px 0 #000;';
            document.body.appendChild(t);
          }
          t.textContent='⚠️ '+String(message||'');
          clearTimeout(t.__finV1);
          t.__finV1=setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},6000);
        }catch(_e){}
      }

      function terminerMutationInventaireIdleV160_(tx,res,erreur){
        const courant=REG.idleInventoryMutationQueueV160[0];
        if(!courant||courant.id!==tx.id){
          REG.idleInventoryBusyV160=false;
          envoyerProchaineMutationInventaireIdleV160_();
          return;
        }

        marquePerfInventaireIdleV160_('network-end',tx.id);
        REG.idleInventoryPerfV160.lastNetworkMs=
          mesurePerfInventaireIdleV160_(
            'network','network-start','network-end',tx.id
          );

        const mergeTransitoireV183=
          String(tx.payload&&tx.payload.action||'')==='merge'&&
          (
            Boolean(erreur)||
            Boolean(res&&res.retryable)||
            ['SOREAL_IDLE_OCCUPE','TIMEOUT','NETWORK_ERROR'].indexOf(
              String(res&&res.code||'')
            )!==-1
          );

        if(mergeTransitoireV183&&(tx.retryCount||0)<4){
          tx.retryCount=(tx.retryCount||0)+1;
          REG.idleInventoryBusyV160=false;
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-185 */
          setTimeout(
            envoyerProchaineMutationInventaireIdleV160_,
            120*tx.retryCount
          );
          return;
        }

        REG.idleInventoryMutationQueueV160.shift();
        REG.idleInventoryBusyV160=false;

        if(!erreur&&res&&res.ok&&res.joueur){
          const restAvant=REG.idleEtat&&REG.idleEtat.adventureRestPv;
          if(!appliquerSynchroCombatSansReflowIdleV116_(res.joueur)){
            REG.idleEtat=res.joueur;
            if(restAvant!=null&&REG.idleEtat.adventureRestPv==null){
              REG.idleEtat.adventureRestPv=restAvant;
            }
          }

          const serveur=aventureMetaIdleV47_(res.joueur);
          if(serveur){
            REG.idleInventoryConfirmedAdventureV160=
              cloneInventaireIdleV160_(serveur);
            REG.idleAdventureRevisionServeurV208=Math.max(
              REG.idleAdventureRevisionServeurV208,
              revisionAdventureServeurIdleV208_(serveur)
            );
          }

          marquePerfInventaireIdleV160_('reconcile-start',tx.id);
          reconstruireEtatOptimisteInventaireIdleV160_({
            action:tx.payload.action,
            transactionId:tx.id,
            confirmed:true
          });
          marquePerfInventaireIdleV160_('reconcile-end',tx.id);
          REG.idleInventoryPerfV160.lastReconcileMs=
            mesurePerfInventaireIdleV160_(
              'reconcile','reconcile-start','reconcile-end',tx.id
            );

        }else{
          reconstruireEtatOptimisteInventaireIdleV160_({
            action:tx.payload.action,
            transactionId:tx.id,
            confirmed:true
          });
          const refusCapV1=res&&typeof res.message==='string'&&/^Libère /.test(res.message)?res.message:(erreur&&typeof erreur.message==='string'&&/^Libère /.test(erreur.message)?erreur.message:'');
          if(refusCapV1)annoncerRefusCapEquipementIdleV1_(refusCapV1);
          toastIdleV5_(
            res&&res.message
              ?res.message
              :(erreur&&erreur.message?erreur.message:'Erreur Inventory.')
          );
        }

        if(!REG.idleInventoryMutationQueueV160.length){
          appliquerAdventureDiffereeIdleV208_();
        }

        envoyerProchaineMutationInventaireIdleV160_();
      }

      function envoyerProchaineMutationInventaireIdleV160_(){
        if(
          REG.idleInventoryBusyV160||
          !SOREAL_SESSION||
          !REG.idleInventoryMutationQueueV160.length
        ){
          return;
        }

        const tx=REG.idleInventoryMutationQueueV160[0];
        REG.idleInventoryBusyV160=true;
        marquePerfInventaireIdleV160_('network-start',tx.id);

        appelerProgressionIdleCloudflareV1_(
          {action:'adventure',adventure:tx.payload},
          function(res){
            terminerMutationInventaireIdleV160_(tx,res,null);
          },
          function(e){
            terminerMutationInventaireIdleV160_(tx,null,e||new Error('Erreur Inventory.'));
          }
        );
      }

      function enfilerMutationInventaireIdleV160_(payload){
        if(!SOREAL_SESSION||!REG.idleEtat)return;
        const current=aventureMetaIdleV47_(REG.idleEtat);
        if(!current)return;

        if(
          !REG.idleInventoryMutationQueueV160.length&&
          !REG.idleInventoryBusyV160
        ){
          REG.idleInventoryConfirmedAdventureV160=
            cloneInventaireIdleV160_(current);
        }

        const txId=++REG.idleInventorySequenceV160;
        const mutationPayload=
          cloneInventaireIdleV160_(payload||{});
        if(!mutationPayload.clientMutationId){
          mutationPayload.clientMutationId=
            'inv-'+
            Date.now().toString(36)+'-'+
            String(txId)+'-'+
            Math.random().toString(36).slice(2,10);
        }

        const tx={
          id:txId,
          payload:mutationPayload,
          audioCue:cueAudioMutationInventaireIdleV199_(current,payload||{}),
          createdAt:Date.now()
        };
        REG.idleInventoryMutationQueueV160.push(tx);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-186 */
        if(tx.audioCue){
          jouerEffetAudioIdleV199_(tx.audioCue);
        }

        marquePerfInventaireIdleV160_('event',tx.id);
        appliquerMutationOptimisteInventaireIdleV160_(
          aventureMetaIdleV47_(REG.idleEtat),
          tx.payload,
          tx.id
        );
        recalculerUtilisationInventaireIdleV160_(
          aventureMetaIdleV47_(REG.idleEtat)
        );
        pousserEtatVersRuntimePartageIdleV1_();

        marquePerfInventaireIdleV160_('optimistic-start',tx.id);
        patchInventaireAdventureIdleV160_(
          REG.idleEtat,
          {
            action:tx.payload.action,
            transactionId:tx.id,
            confirmed:false
          }
        );
        marquePerfInventaireIdleV160_('optimistic-end',tx.id);
        REG.idleInventoryPerfV160.lastOptimisticMs=
          mesurePerfInventaireIdleV160_(
            'optimistic','optimistic-start','optimistic-end',tx.id
          );

        envoyerProchaineMutationInventaireIdleV160_();
      }

      function refuserEquipementDefiIdleV1_(){
        toastIdleV5_('🚫 No Equipment Challenge : impossible d’équiper quoi que ce soit pendant ce défi.');
      }

      function changerPageSacV1_(page){
        REG.idlePageSacV1=Math.max(1,idleEntier_(page)||1);
        /* Norman (2026-10-19) : « quand on passe dans la page 2 de l'inventaire, la page se redessine ». Changer de page ne touche que la grille du sac et ses deux sélecteurs : mise à jour EN PLACE (la même que celle des autres actions du sac), jamais le redessin de toute la page ; le redessin complet ne reste que s'il est impossible (menu fermé, glisser-déposer en cours). */
        try{
          if(REG.idleEtat&&typeof REG.patchInventaireAdventureIdleV160_==='function'&&REG.patchInventaireAdventureIdleV160_(REG.idleEtat,{action:'page'})!==false&&document.querySelector('.soreal-idle-bag-pager-v1')){
            const page2=REG.idlePageSacV1,pages2=REG.idlePagesSacV1||1;
            document.querySelectorAll('.soreal-idle-bag-pager-v1').forEach(function(el){
              const modele=document.createElement('template');
              modele.innerHTML=pagerSacIdleV1_(page2,pages2).trim();
              const neuf=modele.content.firstElementChild;
              if(!neuf||el.isEqualNode(neuf))return;
              /* Mise à jour EN PLACE des boutons et du texte (Norman, 2026-10-21 : « l'inventaire se redessine quand on passe d'une page à l'autre ») : les boutons ne sont plus recréés à chaque changement de page. */
              if(el.children.length===neuf.children.length&&Array.prototype.every.call(el.children,function(x,i){return x.tagName===neuf.children[i].tagName;})){
                Array.prototype.forEach.call(el.children,function(x,i){
                  const y=neuf.children[i];
                  if(x.tagName==='BUTTON'){
                    if(x.disabled!==y.disabled)x.disabled=y.disabled;
                    if(x.getAttribute('onclick')!==y.getAttribute('onclick'))x.setAttribute('onclick',y.getAttribute('onclick'));
                  }else if(x.textContent!==y.textContent)x.textContent=y.textContent;
                });
              }else el.replaceWith(neuf);
            });
            return;
          }
        }catch(_e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      function pagerSacIdleV1_(page,pages){
        if(pages<2)return '';
        return '<div class="soreal-idle-bag-pager-v1">'+
          '<button type="button" '+(page<=1?'disabled ':'')+'onclick="window.__changerPageSacV1__('+(page-1)+')" aria-label="Page précédente">‹</button>'+
          '<span>Page '+page+' / '+pages+'</span>'+
          '<button type="button" '+(page>=pages?'disabled ':'')+'onclick="window.__changerPageSacV1__('+(page+1)+')" aria-label="Page suivante">›</button>'+
        '</div>';
      }

      function rendrePaginationIdleV1_(pageActuelle,totalPages,callbackJs){
        if(totalPages<=1)return '';
        const boutons=[];
        for(let p=1;p<=totalPages;p++){
          boutons.push(
            '<button class="soreal-idle-pagination-btn-v1'+(p===pageActuelle?' active':'')+'" '+
            'onclick="'+callbackJs+'('+p+')">'+p+'</button>'
          );
        }
        return '<div class="soreal-idle-pagination-v1">'+boutons.join('')+'</div>';
      }

      function idleLabelSpecialBonusV1_(type){
        const entree=
          REG.IDLE_SPECIAL_BONUS_TYPES_V1_.find(function(e){return e[0]===type;});

        return entree?entree[1]:String(type||'Spécial');
      }

      function indiceSacZoneTutorielIdleV1_(a){
        const selectionnee=String((a&&a.selectedZone)||'safe').trim().toLowerCase();
        const zone=selectionnee==='safe'?(String((a&&a.lastCombatZone)||'tutorial').trim().toLowerCase()||'tutorial'):selectionnee;
        if(zone!=='tutorial')return '';
        const g=gestesAchetesIdleV1_();
        return '<div class="soreal-idle-v138-bag-indice-v1">'+
          '💡 Touchez un objet du sac pour voir ses détails et l’équiper, ou glissez-le sur un emplacement (clic droit sur PC : équiper ou fusionner). '+
          'Maintenez la touche A et cliquez sur une pièce pour lui appliquer vos boosts.'+
          ((g.double||g.triple)?' Double tap sur un objet : '+(g.triple?'il fusionne avec toutes les pièces identiques':'')+(g.triple&&g.double?', puis, quand il n’y en a plus, ':'')+(g.double?'il absorbe tous les boosts du sac':'')+'. Appui long sur le Cube de l’infini pour ouvrir ses détails.':'')+
          ((g.double||g.triple)?' Sur PC, clic droit sur un objet du sac ou équipé : '+(g.triple?'il fusionne avec les pièces identiques':'')+(g.triple&&g.double?', puis, quand il n’y en a plus, ':'')+(g.double?'il absorbe les boosts du sac':'')+'.':'')+
        '</div>';
      }

      function pageInventaireIdleV28_(j){
        const a=aventureMetaIdleV47_(j);
        if(!a||!j.inventaireDebloque){
          /* ANTI-SPOIL (règle n°2) : Inventory verrouillé = rien d'affiché. */
          return '';
        }

        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-278 */
        const cube=a.cube||{};

        const itemById=new Map(items.map(function(i){return [String(i.id),i];}));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-279 */
        const sacItems=casesSacAdventureIdleV162_(a);
        const capacite=idleEntier_(a.inventoryCapacity||24);
        /* Onglets Sac | Garderie (Norman, 2026-10-30) : seulement si la garderie est débloquée (règle n°2) ; l'onglet Garderie remplace le cadre du sac par l'étagère (modules/daycare-page-v1.js). */
        const G=window.__SOREAL_IDLE_DAYCARE_PAGE_V1__;
        const utilise=idleEntier_(a.inventoryUsed!=null?a.inventoryUsed:sacItems.filter(Boolean).length);

        /* 2026-09-24 (Norman : « fenêtre inutile… supprime pour gagner de la place ») : ni bandeau « Inventory », ni cadres Sac / Cube / Sets
           (le sac s'affiche dans son titre, le Cube dans son emplacement, les sets dans la Collection). */
        return ''+
          '<div class="soreal-idle-v151-inventory-columns">'+
            '<div class="soreal-idle-section-v8 soreal-idle-v138-equipment-sticky"><div class="soreal-idle-window-title-v31"><i class="dsn-v1 dsn-equipement" aria-hidden="true"></i> Équipement</div>'+
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-280 */
              (function(){
                const accessoiresRendu=rendreAccessoiresAdventureIdleV138_(equipment,itemById,idleEntier_(a.accessorySlotsCapacity||2));
                return '<div class="soreal-idle-v138-paperdoll">'+
                  accessoiresRendu.enGrille+
                  rendreSlotPaperdollAdventureIdleV138_('head','Casque',itemById.get(String(equipment.head)))+
                  rendreSlotPaperdollAdventureIdleV138_('chest','Torse',itemById.get(String(equipment.chest)))+
                  rendreSlotPaperdollAdventureIdleV138_('legs','Pantalon',itemById.get(String(equipment.legs)))+
                  rendreSlotPaperdollAdventureIdleV138_('boots','Bottes',itemById.get(String(equipment.boots)))+
                  rendreSlotPaperdollAdventureIdleV138_('weapon','Arme',itemById.get(String(equipment.weapon)))+
                  (a.secondWeaponUnlocked||equipment.weapon2?rendreSlotPaperdollAdventureIdleV138_('weapon2','Seconde arme',itemById.get(String(equipment.weapon2))):'')+
                  rendreSlotCubeInfiniAdventureIdleV1_(cube,a.cubeTier)+
                '</div>'+
                accessoiresRendu.debordement+
                (window.__SOREAL_IDLE_THE_END_UI_V1__?window.__SOREAL_IDLE_THE_END_UI_V1__.panelHtml(a):'');
              })()+
            '</div>'+
            (G&&G.vueGarderie(j)?G.etagere(j):'<div class="soreal-idle-section-v8" id="soreal-idle-v138-bag-section">'+
              (G?G.onglets(j):'')+indiceSacZoneTutorielIdleV1_(a)+
              '<div class="soreal-idle-v138-bag-heading-v165">'+
                '<div class="soreal-idle-window-title-v31" data-sac-v160="'+utilise+'/'+capacite+'"><i class="dsn-v1 dsn-sac" aria-hidden="true"></i> Sac ('+utilise+' / '+capacite+')</div>'+
                /*
                 * Norman (2026-09-29) : « J'aimerai un bouton pour trier l'inventaire [...] il ne
                 * serait pas dévérouillé de base. » Achat EXP Shop (section Débuts) : jamais affiché
                 * avant l'achat (AGENTS.md règle n°2 -- aucun cadenas ni prix ici, seulement dans le
                 * Shop lui-même, comme les autres achats de cette section).
                 */
                (j.systemes&&j.systemes.inventoryAuto&&j.systemes.inventoryAuto.unlocked&&j.systemes.inventoryAuto.unlocked.sortInventory
                  ?'<button type="button" class="soreal-idle-expand-button-v25" title="Range ton sac : bijoux, objets divers, équipement (chaque set côte à côte), puis boosts. Les objets identiques sont toujours collés pour voir tout de suite ce qui peut fusionner ; les verrouillés passent devant avec leurs doubles." onclick="window.__actionMetaV47__({action:\'inventoryAuto\',mode:\'sortInventory\'})"><span class="bouton-icone-sombre-v1">🗂️</span> Trier</button>'
                  :'')+
                rendreTrashAdventureIdleV165_(a.trash)+
              '</div>'+
              rendreGrilleSacAdventureIdleV1_(sacItems,capacite)+
            '</div>')+
          '</div>'+
          '<div class="soreal-idle-item-popup-v1" id="soreal-idle-v138-details" style="display:none">'+
            '<div class="soreal-idle-item-popup-drag-v1" id="soreal-idle-v138-details-drag"><span>⠿</span><button type="button" class="soreal-idle-item-popup-close-v1" onclick="window.__fermerDetailsObjetAdventureIdleV1__()" aria-label="Fermer" title="Fermer">✕</button></div>'+
            '<div class="soreal-idle-item-popup-body-v1" id="soreal-idle-v138-details-body"></div>'+
          '</div>'+
          rendreCoffreAdventureIdleV1_(Array.isArray(a.coffreSlots)?a.coffreSlots:[]);
      }

      function changerPageCoffreV1_(page){
        REG.idlePageCoffreV1=Math.max(1,idleEntier_(page)||1);
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      function normaliserRechercheIdleV1_(t){
        return String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
      }

      /* Intitulés (français et anglais, comme dans le jeu et sur le wiki) des statistiques d'un objet rangé au coffre. */
      function intitulesStatsCoffreIdleV1_(item){
        const noms=[];
        if(!item)return noms;
        if(idleNombre_(item.basePower)>0||idleNombre_(item.power)>0){noms.push('Puissance','Power','PV Max','Max HP','Max Health');}
        if(idleNombre_(item.baseToughness)>0||idleNombre_(item.toughness)>0){noms.push('Endurance','Toughness','Regen PV','HP Regen','Health Regen');}
        if(Array.isArray(item.specialsAll)&&item.specialsAll.length){
          item.specialsAll.forEach(function(sv){if(sv&&sv.type)noms.push(idleLabelSpecialBonusV1_(sv.type));});
        }else if(item.specialType&&(idleNombre_(item.baseSpecial)>0||idleNombre_(item.special)>0)){
          noms.push(idleLabelSpecialBonusV1_(item.specialType));
        }
        return noms;
      }

      /* Types de statistiques de la case (fournis par le serveur, aussi pour une case encore vide) : intitulés anglais ET français (« magic », « magie », « puissance »…). */
      function intitulesTypesCoffreIdleV1_(s){
        const noms=[];
        const tr=typeof window!=='undefined'?window.__SOREAL_IDLE_TRADUCTION_TEXTE_V1__:null;
        (Array.isArray(s&&s.statsTypes)?s.statsTypes:[]).forEach(function(type){
          const en=idleLabelSpecialBonusV1_(type);
          noms.push(en);
          if(typeof tr==='function')noms.push(tr(en));
        });
        if(s&&(idleNombre_(s.basePower)>0))noms.push('Power','Puissance');
        return noms;
      }

      function caseCoffreCorrespondIdleV1_(s,requete){
        if(!requete)return true;
        const champs=[s.name,s.nameEn,s.setName,s.setNameEn,s.groupeNom].concat(intitulesTypesCoffreIdleV1_(s)).concat(s.occupe?intitulesStatsCoffreIdleV1_(s.item):[]);
        return champs.some(function(c){return c&&normaliserRechercheIdleV1_(c).indexOf(requete)!==-1;});
      }

      function idleCoffreOuvertV1_(){
        try{
          const v=localStorage.getItem('soreal_idle_coffre_ouvert_v1');
          return v===null?true:v==='1';
        }catch(e){
          return true;
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-283 */
      function jouerSonOuvertureCoffreIdleV1_(){
        jouerEffetAudioIdleV199_('chestOpen');
      }

      function jouerSonFermetureCoffreIdleV197_(){
        jouerEffetAudioIdleV199_('chestClose');
      }

  Object.assign(REG,{
    ancreSacIdleV1_:ancreSacIdleV1_,
    restaurerAncreSacIdleV1_:restaurerAncreSacIdleV1_,
    forgerEquipementIdleV25_:forgerEquipementIdleV25_,
    objetsEncoreEnAttenteRecycleV38_:objetsEncoreEnAttenteRecycleV38_,
    appliquerSuppressionsLocalesRecycleV38_:appliquerSuppressionsLocalesRecycleV38_,
    programmerEnvoiRecycleV38_:programmerEnvoiRecycleV38_,
    changerPageCollectionEquipementV1_:changerPageCollectionEquipementV1_,
    rendreCollectionEquipementIdleV1_:rendreCollectionEquipementIdleV1_,
    protegerJoueurServeurInventaireIdleV208_:protegerJoueurServeurInventaireIdleV208_,
    cloneInventaireIdleV160_:cloneInventaireIdleV160_,
    marquePerfInventaireIdleV160_:marquePerfInventaireIdleV160_,
    signatureObjetInventaireIdleV160_:signatureObjetInventaireIdleV160_,
    patchGrilleSacInventaireIdleV160_:patchGrilleSacInventaireIdleV160_,
    patchResumeInventaireIdleV160_:patchResumeInventaireIdleV160_,
    patchEquipementInventaireIdleV160_:patchEquipementInventaireIdleV160_,
    patchCoffreInventaireIdleV160_:patchCoffreInventaireIdleV160_,
    patchBonusInventaireIdleV160_:patchBonusInventaireIdleV160_,
    restaurerFicheInventaireIdleV160_:restaurerFicheInventaireIdleV160_,
    recalculerUtilisationInventaireIdleV160_:recalculerUtilisationInventaireIdleV160_,
    appliquerMutationOptimisteInventaireIdleV160_:appliquerMutationOptimisteInventaireIdleV160_,
    enfilerMutationInventaireIdleV160_:enfilerMutationInventaireIdleV160_,
    refuserEquipementDefiIdleV1_:refuserEquipementDefiIdleV1_,
    changerPageSacV1_:changerPageSacV1_,
    pagerSacIdleV1_:pagerSacIdleV1_,
    rendrePaginationIdleV1_:rendrePaginationIdleV1_,
    idleLabelSpecialBonusV1_:idleLabelSpecialBonusV1_,
    pageInventaireIdleV28_:pageInventaireIdleV28_,
    changerPageCoffreV1_:changerPageCoffreV1_,
    normaliserRechercheIdleV1_:normaliserRechercheIdleV1_,
    caseCoffreCorrespondIdleV1_:caseCoffreCorrespondIdleV1_,
    idleCoffreOuvertV1_:idleCoffreOuvertV1_,
    jouerSonOuvertureCoffreIdleV1_:jouerSonOuvertureCoffreIdleV1_,
    jouerSonFermetureCoffreIdleV197_:jouerSonFermetureCoffreIdleV197_
  });
})();
