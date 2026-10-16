/*
 * SOREAL IDLE — Outils d'administration (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_admin_v1)return;
  REG.__chargé_ui_admin_v1=true;

  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function rendreTutorielPagesIdleV1_(){return REG.rendreTutorielPagesIdleV1_.apply(null,arguments);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-4 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-5 */
      let idleEstAdminV1=null;

      function estAdminSorealIdle_(){
        if(idleEstAdminV1===true)return true;
        if(idleEstAdminV1===false)return false;
        try{
          return Boolean(
            typeof SOREAL_USER!=='undefined'&&
            SOREAL_USER&&
            String(SOREAL_USER.email||'').trim().toLowerCase()==='technicien.soreal@gmail.com'
          );
        }catch(e){
          return false;
        }
      }

      function rafraichirEstAdminSorealIdle_(){
        if(idleEstAdminV1!==null||!SOREAL_SESSION)return;
        /* L'état contient déjà la réponse (`reglages` n'est donné qu'à l'administrateur) : aucun appel à part (audit des appels, 2026-10-04). */
        if(REG.idleEtat&&REG.idleEtat.reglages!==undefined){
          idleEstAdminV1=Boolean(REG.idleEtat.reglages);
          if(idleEstAdminV1){
            rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
            if(REG.idleTutorielPagesEnCoursV1)rendreTutorielPagesIdleV1_();
          }
          return;
        }
        google.script.run
          .withSuccessHandler(function(res){
            const estAdminAvant=idleEstAdminV1===true;
            idleEstAdminV1=Boolean(res&&res.ok&&res.isAdmin);
            if(idleEstAdminV1&&!estAdminAvant&&REG.idleEtat){
              rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
              /* Un popup déjà ouvert (tutoriel de début) reçoit son bouton « Modifier le texte » dès que le statut d'administrateur est connu. */
              if(REG.idleTutorielPagesEnCoursV1)rendreTutorielPagesIdleV1_();
            }
          })
          .withFailureHandler(function(){
            idleEstAdminV1=false;
          })
          .estAdminSorealIdle(SOREAL_SESSION);
      }

  Object.assign(REG,{
    estAdminSorealIdle_:estAdminSorealIdle_,
    rafraichirEstAdminSorealIdle_:rafraichirEstAdminSorealIdle_
  });
})();
