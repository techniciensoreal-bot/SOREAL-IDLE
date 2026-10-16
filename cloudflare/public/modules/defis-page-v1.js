/*
 * SOREAL IDLE — page Défis (Challenges) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_DEFIS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DEFIS_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function actionMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_.apply(null,arguments);}

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-305 */
function pageChallengesIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'challenges');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        /* Page détaillée (textes français, restrictions, récompenses par complétion) : modules/challenges-v1.js. */
        if(window.__SOREAL_IDLE_DEFIS_V1__&&typeof window.__SOREAL_IDLE_DEFIS_V1__.page==='function')return window.__SOREAL_IDLE_DEFIS_V1__.page(j);
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
              !def.implemented?'🚧 En préparation'
              :def.active?'▶️ Actif'
              :'✅ Prêt';
            const peutDemarrer=Boolean(def.unlocked)&&Boolean(def.implemented)&&!actif;
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.completion||0)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.max||0)+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+statut+
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

  window.__SOREAL_IDLE_DEFIS_PAGE_V1__={
    pageChallengesIdleV1_:pageChallengesIdleV1_
  };
})();
