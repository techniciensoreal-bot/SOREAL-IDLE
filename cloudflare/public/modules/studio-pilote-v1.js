/*
 * Boutons « Lancer le studio » / « Arrêter le studio » du menu Admin (Norman, 2026-10-03 : « dans l'interface de modification des voix, un bouton pour lancer Lancer.bat et un autre pour
 * l'arrêter ; ça ne fonctionnerait que sur mon PC »). Une page web ne peut pas démarrer un programme : elle parle au PILOTE (tools/voice-studio/pilote.py), un petit serveur local toujours allumé
 * sur ce PC (pilote.bat, ou installer_pilote.bat pour qu'il démarre avec Windows), qui lance ou arrête lancer.bat. Partagé par l'éditeur d'histoires et l'éditeur de textes.
 */
(function(){
  'use strict';
  var PILOTE_URL='http://127.0.0.1:8766';
  var STUDIO_URL='http://127.0.0.1:8765';
  var ABSENT='🔴 Le pilote n’est pas allumé sur ce PC : double-clique « pilote.bat » (ou « installer_pilote.bat » une seule fois, pour qu’il démarre avec Windows) dans cloudflare/tools/voice-studio. Sur iPhone/Safari, c’est impossible.';

  function appel(chemin,methode){
    return fetch(PILOTE_URL+chemin,{method:methode||'GET',cache:'no-store'}).then(function(r){return r.json();});
  }

  /* Attend que le studio réponde (le modèle met jusqu'à 1 à 2 minutes à se charger) puis appelle fini(vrai|faux). */
  function attendreStudio(fini,essais){
    var restant=typeof essais==='number'?essais:60;
    fetch(STUDIO_URL+'/ping',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
      if(d&&d.ok){fini(true);return;}
      throw new Error('pas prêt');
    }).catch(function(){
      if(restant<=0){fini(false);return;}
      setTimeout(function(){attendreStudio(fini,restant-1);},3000);
    });
  }

  /*
   * lancer(etat) / arreter(etat) : etat(texte,erreur) affiche l'avancement ; renvoient une promesse qui se termine quand c'est fait.
   * Le studio met du temps à devenir disponible : le texte l'explique, puis la page revérifie le studio (verifierStudio_) quand c'est prêt.
   */
  function lancer(etat,verifier){
    etat('Lancement du studio… (le modèle se charge : compte 1 à 2 minutes)',false);
    return appel('/demarrer','POST').then(function(r){
      if(!r||r.ok===false)throw new Error(r&&r.error?r.error:'refusé');
      if(r.dejaLance){etat('Le studio tourne déjà.',false);if(verifier)verifier();return;}
      return new Promise(function(resolve){
        attendreStudio(function(ok){
          etat(ok?'✔ Studio démarré.':'Le studio ne répond pas encore : regarde sa fenêtre noire (un message d’erreur s’y affiche peut-être).',!ok);
          if(verifier)verifier();
          resolve();
        });
      });
    }).catch(function(e){
      etat(e&&e.message&&e.message!=='Failed to fetch'?'Lancement impossible : '+e.message:ABSENT,true);
    });
  }

  function arreter(etat,verifier){
    etat('Arrêt du studio…',false);
    return appel('/arreter','POST').then(function(r){
      if(!r||r.ok===false)throw new Error(r&&r.error?r.error:'refusé');
      etat(r.arrete?'⏹ Studio arrêté.':'Le studio n’était pas lancé.',false);
      setTimeout(function(){if(verifier)verifier();},1200);
    }).catch(function(e){
      etat(e&&e.message&&e.message!=='Failed to fetch'?'Arrêt impossible : '+e.message:ABSENT,true);
    });
  }

  window.__SOREAL_IDLE_STUDIO_PILOTE_V1__={lancer:lancer,arreter:arreter,message_absent:ABSENT,pilote_url:PILOTE_URL};
})();
