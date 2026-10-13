/*
 * Boutons « Lancer le studio » / « Arrêter le studio » du menu Admin (Norman, 2026-10-03 : « dans l'interface de modification des voix, un bouton pour lancer Lancer.bat et un autre pour
 * l'arrêter ; ça ne fonctionnerait que sur mon PC »). Une page web ne peut pas démarrer un programme : elle parle au PILOTE (tools/voice-studio/pilote.py), un petit serveur local toujours allumé
 * sur ce PC (pilote.bat, ou installer_pilote.bat pour qu'il démarre avec Windows), qui lance ou arrête lancer.bat. Partagé par l'éditeur d'histoires et l'éditeur de textes.
 *
 * Fiabilité (Norman, 2026-10-13 : « quand je clique sur Lancer le studio il ne se passe rien, c'est tous les jours la même chose ») :
 *  - le clic affiche TOUT DE SUITE un message (avant, rien ne s'affichait tant que la première requête n'avait pas répondu) ;
 *  - chaque requête vers le PC a un délai maximal (avant, une requête bloquée par le navigateur ou par un pilote éteint pouvait rester en attente sans fin, donc « rien ne se passe ») ;
 *  - si le pilote ne répond pas, le studio est lancé par le LIEN « soreal-studio:// » (tools/voice-studio/installer_lien_studio.bat, à lancer une seule fois : Windows sait alors démarrer
 *    lancer.bat à l'ouverture du lien, sans qu'aucun programme ne doive tourner en permanence) ; la page attend ensuite que le studio réponde.
 */
(function(){
  'use strict';
  var PILOTE_URL='http://127.0.0.1:8766';
  var STUDIO_URL='http://127.0.0.1:8765';
  var LIEN='soreal-studio://demarrer';
  var DELAI_PILOTE_MS=4000,DELAI_PING_MS=1500;   /* ping court : le lien externe doit être ouvert tant que le clic est « récent » (Chrome refuse sinon, sans rien dire) */
  var ABSENT='🔴 Le pilote n’est pas allumé sur ce PC : double-clique « pilote.bat » (ou « installer_pilote.bat » une seule fois, pour qu’il démarre avec Windows) dans cloudflare/tools/voice-studio. Pour ne plus jamais dépendre du pilote : double-clique une fois « installer_lien_studio.bat » au même endroit. Sur iPhone/Safari, c’est impossible.';
  var ABSENT_LIEN='🔴 Le studio ne répond toujours pas. Une seule fois pour toutes : double-clique « installer_lien_studio.bat » (ou « installer_pilote.bat ») dans cloudflare/tools/voice-studio, ou lance « pilote.bat » / « lancer.bat » à la main. Regarde aussi la fenêtre noire du studio : un message d’erreur s’y affiche peut-être.';

  /* Une requête vers le PC ne reste jamais en attente : au-delà du délai elle échoue (message clair au lieu de « rien »). */
  function avecDelai(promesse,ms){
    return new Promise(function(resolve,reject){
      var fini=false;
      var t=setTimeout(function(){if(!fini){fini=true;reject(new Error('delai'));}},ms);
      promesse.then(function(v){if(!fini){fini=true;if(typeof clearTimeout==='function')clearTimeout(t);resolve(v);}},function(e){if(!fini){fini=true;if(typeof clearTimeout==='function')clearTimeout(t);reject(e);}});
    });
  }
  function appel(chemin,methode){
    return avecDelai(fetch(PILOTE_URL+chemin,{method:methode||'GET',cache:'no-store'}).then(function(r){return r.json();}),DELAI_PILOTE_MS);
  }
  function pingStudio(){
    return avecDelai(fetch(STUDIO_URL+'/ping',{cache:'no-store'}).then(function(r){return r.json();}),DELAI_PING_MS);
  }

  /* Attend que le studio réponde (le modèle met jusqu'à 1 à 2 minutes à se charger) puis appelle fini(vrai|faux). */
  function attendreStudio(fini,essais){
    var restant=typeof essais==='number'?essais:60;
    pingStudio().then(function(d){
      if(d&&d.ok){fini(true);return;}
      throw new Error('pas prêt');
    }).catch(function(){
      if(restant<=0){fini(false);return;}
      setTimeout(function(){attendreStudio(fini,restant-1);},3000);
    });
  }

  /* Ouvre le lien « soreal-studio:// » : Windows démarre alors lancer.bat (voir installer_lien_studio.bat). Faux si ce n'est pas possible depuis cette page. */
  function lancerParLien(){
    if(typeof document==='undefined'||!document.body)return false;
    try{
      var a=document.createElement('a');
      a.href=LIEN;a.style.display='none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){if(a.parentNode)a.parentNode.removeChild(a);},1500);
      return true;
    }catch(_e){return false;}
  }

  function pilote_absent_(e){
    var m=e&&e.message;
    return !m||m==='Failed to fetch'||m==='delai'||m==='NetworkError when attempting to fetch resource.'||m==='Load failed';
  }

  /*
   * lancer(etat) / arreter(etat) : etat(texte,erreur) affiche l'avancement ; renvoient une promesse qui se termine quand c'est fait.
   * Le studio met du temps à devenir disponible : le texte l'explique, puis la page revérifie le studio (verifierStudio_) quand c'est prêt.
   */
  function lancer(etat,verifier){
    etat('Vérification du studio…',false);   /* message immédiat : le clic ne reste jamais sans réponse visible */
    /* Le studio répond déjà (lancé à la main avec lancer.bat) : inutile de passer par le pilote, qui n'a donc pas besoin d'être allumé (Norman, 2026-10-04 : « Lancer le studio ne fonctionne pas »). */
    return pingStudio().then(function(d){return Boolean(d&&d.ok);}).catch(function(){return false;}).then(function(dejaLa){
    if(dejaLa){etat('Le studio tourne déjà.',false);if(verifier)verifier();return;}
    /*
     * Le lien « soreal-studio:// » est ouvert TOUT DE SUITE, tant que le clic est récent : Chrome n'ouvre un programme externe que pendant quelques secondes après un geste de l'utilisateur, et refuse
     * sinon sans afficher de demande (c'était la cause du « le site ne m'a rien demandé »). Si le lien n'est pas installé, rien ne se passe de mal : le pilote prend le relais plus bas.
     */
    var parLien=lancerParLien();
    etat(parLien
      ?'Lancement du studio… Si le navigateur demande d’ouvrir « soreal-studio », accepte (et coche « toujours »). Le modèle se charge : compte 1 à 2 minutes.'
      :'Lancement du studio… (le modèle se charge : compte 1 à 2 minutes)',false);
    var pilotePropose=false;
    function essayerPilote(){
      if(pilotePropose)return Promise.resolve();
      pilotePropose=true;
      return appel('/demarrer','POST').then(function(r){
        if(!r||r.ok===false)throw new Error(r&&r.error?r.error:'refusé');
      }).catch(function(e){
        if(!pilote_absent_(e))etat('Lancement impossible : '+e.message,true);
      });
    }
    /* Sans lien possible depuis cette page, ou si le studio n'est toujours pas là après ~15 s, le pilote local est essayé à son tour. */
    var debut=parLien?Promise.resolve():essayerPilote();
    return debut.then(function(){
      return new Promise(function(resolve){
        var essais=0;
        (function boucle(){
          pingStudio().then(function(d){
            if(d&&d.ok){etat('✔ Studio démarré.',false);if(verifier)verifier();resolve();return;}
            throw new Error('pas prêt');
          }).catch(function(){
            essais+=1;
            if(essais===5)essayerPilote();
            if(essais>=45){etat(parLien?ABSENT_LIEN:ABSENT,true);if(verifier)verifier();resolve();return;}
            setTimeout(boucle,3000);
          });
        })();
      });
    });
    });
  }

  function arreter(etat,verifier){
    etat('Arrêt du studio…',false);
    return appel('/arreter','POST').then(function(r){
      if(!r||r.ok===false)throw new Error(r&&r.error?r.error:'refusé');
      etat(r.arrete?'⏹ Studio arrêté.':'Le studio n’était pas lancé.',false);
      setTimeout(function(){if(verifier)verifier();},1200);
    }).catch(function(e){
      etat(!pilote_absent_(e)?'Arrêt impossible : '+e.message:ABSENT,true);
    });
  }

  window.__SOREAL_IDLE_STUDIO_PILOTE_V1__={lancer:lancer,arreter:arreter,message_absent:ABSENT,pilote_url:PILOTE_URL,lien:LIEN};
})();
