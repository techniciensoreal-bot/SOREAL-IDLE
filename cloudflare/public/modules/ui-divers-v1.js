/*
 * SOREAL IDLE — Fonctions diverses du jeu (utilitaires, popups, survol, pseudo) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_divers_v1)return;
  REG.__chargé_ui_divers_v1=true;



      /*
       * Champs de quantité (Input, Target/Cible…) : un clic ou le focus sélectionne tout le contenu, pour que taper remplace le nombre au lieu
       * de devoir l'effacer (Norman, 2026-10-02). Seuls les champs numériques / de montant des menus de jeu : pas les champs de texte libres (pseudo, admin).
       */
      function champQuantiteIdleV1_(el){
        return !!(el&&el.tagName==='INPUT'&&(el.type==='number'||el.type==='text')&&!el.placeholder&&el.maxLength<0&&el.closest&&el.closest('.soreal-idle-page-root-v28'));
      }

      function toutSelectionnerIdleV1_(e){
        const el=e.target;
        if(!champQuantiteIdleV1_(el))return;
        try{el.select();}catch(err){}
      }

      function idleClicsEnvoyerV1_(){
        if(REG.idleClicsEnvoiEnCoursV1||REG.idleClicsEnAttenteV1<=0||!SOREAL_SESSION)return;
        const lot=REG.idleClicsEnAttenteV1;
        REG.idleClicsEnAttenteV1=0;
        REG.idleClicsEnvoiEnCoursV1=true;
        try{
          google.script.run
            .withSuccessHandler(function(){
              REG.idleClicsEnvoiEnCoursV1=false;
              if(REG.idleClicsEnAttenteV1>0)idleClicsEnvoyerV1_();
            })
            .withFailureHandler(function(){
              REG.idleClicsEnvoiEnCoursV1=false;
              REG.idleClicsEnAttenteV1+=lot;
            })
            .enregistrerClicsSorealIdle(SOREAL_SESSION,lot);
        }catch(e){
          REG.idleClicsEnvoiEnCoursV1=false;
          REG.idleClicsEnAttenteV1+=lot;
        }
      }

      function idleClicMarquerV1_(){
        REG.idleClicsEnAttenteV1+=1;
        if(!REG.idleClicsEnvoiMinuterieV1){
          /* Audit de l'entraînement de base (2026-10-05) : en jouant sans arrêt, ce lot partait toutes les 4 s ; toutes les 15 s suffisent (compteur de classement), et il part aussi dès que l'onglet est quitté. */
          REG.idleClicsEnvoiMinuterieV1=setTimeout(function(){
            REG.idleClicsEnvoiMinuterieV1=null;
            idleClicsEnvoyerV1_();
          },15000);
        }
      }

      function baliseursPausesIdleV1_(texte){
        return String(texte||'').replace(/\s*\uE000(\d+)\uE001\s*/g,function(tout,ms){return ' (pause '+ms+'ms) ';}).replace(/\s+/g,' ').trim();
      }

      function declarerVoixSansTexteIdleV1_(){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        if(!T||typeof T.declarer!=='function')return;
        T.declarer(REG.CLE_VOIX_SANDWICH_IDLE_V1,{
          groupe:'Voix sans texte à l’écran',
          libelle:'Voix de fond après le sandwich (fin du tutoriel)',
          champs:REG.CHAMPS_VOIX_SIMPLE_IDLE_V1,
          original:function(){return {texte:REG.TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1};},
          texteLu:function(v){return String(v&&v.texte||'');}
        });
        T.declarer(REG.CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,{
          groupe:'Voix sans texte à l’écran',
          libelle:'Introduction de la lecture des chroniques de boss',
          champs:REG.CHAMPS_VOIX_SIMPLE_IDLE_V1,
          original:function(){return {texte:REG.TEXTE_CHRONIQUES_INTRO_IDLE_V1};},
          texteLu:function(v){return String(v&&v.texte||'');}
        });
      }

      /* Durées de Yggdrasil en heures et minutes, « 09h58 » (Norman, 2026-10-15 : « le format d'heure est en 0.85 h, je veux 09h58 »). */
      function formatterHeuresIdleV47_(heures){
        const n=Number(heures);
        const minutesTotales=Math.floor((Number.isFinite(n)&&n>0?n:0)*60+1e-6);
        const h=Math.floor(minutesTotales/60),m=minutesTotales%60;
        return (h<10?'0':'')+h+'h'+(m<10?'0':'')+m;
      }

      function annulerOuvertureSurvolIdleV1_(){
        clearTimeout(REG.idleSurvolTimerOuvrirV1);
        REG.idleSurvolTimerOuvrirV1=0;
        REG.idleSurvolEnAttenteIdV1='';
      }

      function survolPossibleIdleV1_(event){
        if(!event||event.pointerType==='touch'||event.pointerType==='pen')return false;
        if(window.matchMedia&&!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return false;
        return true;
      }

      function deconnexionGoogleIdleV1_(){
        const pont=window.__SOREAL_IDLE_STANDALONE_V1__;
        if(pont&&typeof pont.logout==='function')pont.logout();
      }

  Object.assign(REG,{
    champQuantiteIdleV1_:champQuantiteIdleV1_,
    toutSelectionnerIdleV1_:toutSelectionnerIdleV1_,
    idleClicsEnvoyerV1_:idleClicsEnvoyerV1_,
    idleClicMarquerV1_:idleClicMarquerV1_,
    baliseursPausesIdleV1_:baliseursPausesIdleV1_,
    declarerVoixSansTexteIdleV1_:declarerVoixSansTexteIdleV1_,
    formatterHeuresIdleV47_:formatterHeuresIdleV47_,
    annulerOuvertureSurvolIdleV1_:annulerOuvertureSurvolIdleV1_,
    survolPossibleIdleV1_:survolPossibleIdleV1_,
    deconnexionGoogleIdleV1_:deconnexionGoogleIdleV1_
  });
})();
