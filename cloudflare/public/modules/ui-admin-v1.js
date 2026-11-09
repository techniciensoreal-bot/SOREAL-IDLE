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

      /* Modules réservés à l'administrateur (éditeurs d'histoires, de tutoriel, EXP des joueurs, pilote du studio, mesure de référence) : plus des <script> de la page, chargés à la demande
         (modules/chargeur-v1.js, groupe « admin ») dès que le compte est reconnu administrateur ; un autre joueur ne les télécharge jamais. Aucune erreur muette : un échec affiche un message et
         le chargement est redemandé au prochain contrôle (le chargeur espace les essais). La page Admin est redessinée quand les modules arrivent. */
      let adminModulesDemandesV1=false;
      function chargerModulesAdminV1_(){
        const C=window.__SOREAL_IDLE_CHARGEUR_V1__;
        if(!C||adminModulesDemandesV1)return;
        adminModulesDemandesV1=true;
        C.charger('admin').then(function(){
          if(REG.idleEtat&&REG.idleMenuActifV28==='admin')rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
        },function(e){
          adminModulesDemandesV1=false;   /* le prochain contrôle d'administrateur réessaie (au plus un essai toutes les 4 s) */
          if(!C.echecAnnonce||Date.now()-C.echecAnnonce>30000){
            C.echecAnnonce=Date.now();
            try{console.error('Outils d’administration : chargement impossible',e);}catch(_e){}
            try{if(typeof REG.messageFlottantIdleV32_==='function')REG.messageFlottantIdleV32_('Outils d’administration indisponibles : nouvel essai en cours…');}catch(_e){}
          }
        });
      }

      function estAdminSorealIdle_(){
        const admin=lireEstAdminSorealIdle_();
        if(admin===true)chargerModulesAdminV1_();
        return admin;
      }

      function lireEstAdminSorealIdle_(){
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

      /* Application Android hors ligne (2026-11-01) : le moteur local joue sur un compte local factice, `reglages` y vaut toujours null. L'administrateur y est PROUVÉ par le serveur de production avec le jeton réel (apk-connexion-v1.js, verifierAdmin) ;
         tant qu'il n'a pas répondu (ni cache valide) on ne mémorise RIEN de faux : l'état reste « inconnu » (null). Un autre compte donne toujours faux. */
      let apkAdminEcouteV1=false;
      function apkConnexionV1_(){
        const A=window.__SOREAL_IDLE_APK_CONNEXION_V1__;
        return A&&typeof A.estApk==='function'&&A.estApk()&&typeof A.verifierAdmin==='function'?A:null;
      }
      function appliquerPreuveApkV1_(p){
        if(p===true&&idleEstAdminV1!==true){
          idleEstAdminV1=true;
          if(REG.idleEtat){
            rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
            if(REG.idleTutorielPagesEnCoursV1)rendreTutorielPagesIdleV1_();
          }
        }else if(p===false&&idleEstAdminV1!==false){
          const etait=idleEstAdminV1===true;
          idleEstAdminV1=false;
          if(etait&&REG.idleEtat)rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
        }
      }
      function verifierAdminApkV1_(A){
        if(!apkAdminEcouteV1&&typeof A.surPreuveAdmin==='function'){
          apkAdminEcouteV1=true;
          A.surPreuveAdmin(function(p){appliquerPreuveApkV1_(p);});
        }
        const connue=A.preuveAdmin();
        if(connue!==null)appliquerPreuveApkV1_(connue);   /* mémoire ou cache valide : le menu est là tout de suite, même hors ligne */
        A.verifierAdmin().then(function(res){if(res&&typeof res.admin==='boolean')appliquerPreuveApkV1_(res.admin);}).catch(function(){});
      }

      function rafraichirEstAdminSorealIdle_(){
        if(idleEstAdminV1!==null||!SOREAL_SESSION)return;
        const apk=apkConnexionV1_();
        /* L'état contient déjà la réponse (`reglages` n'est donné qu'à l'administrateur) : aucun appel à part (audit des appels, 2026-10-04). */
        if(REG.idleEtat&&REG.idleEtat.reglages!==undefined&&(!apk||REG.idleEtat.reglages)){
          idleEstAdminV1=Boolean(REG.idleEtat.reglages);
          if(idleEstAdminV1){
            rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
            if(REG.idleTutorielPagesEnCoursV1)rendreTutorielPagesIdleV1_();
          }
          return;
        }
        if(apk){verifierAdminApkV1_(apk);return;}
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
