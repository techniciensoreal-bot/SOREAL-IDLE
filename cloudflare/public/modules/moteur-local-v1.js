/*
 * Jeu local (Norman, 2026-10-19 : « je veux que le jeu soit totalement local et qu'il envoie seulement des infos au serveur »).
 * Les actions de jeu sont calculées DANS la page par le même moteur que le serveur (Web Worker moteur-local-worker-v1.js, SQLite en mémoire) :
 * plus d'attente de confirmation, plus de recalage. Le serveur garde le chat, les classements, « En direct », les comptes et la sauvegarde ;
 * il reçoit la progression toutes les 10 s (si quelque chose a changé) et à la fermeture de la page (modules/../src/idle-local-sync-v1.js).
 * Interrupteur d'essai : ?local=1 dans l'adresse l'active sur cet appareil, ?local=0 le coupe. Si le moteur local ne démarre pas, le jeu reste en mode serveur.
 */
(function(){
  "use strict";
  const CLE="soreal_idle_moteur_local_v1";
  const LOCALES={
    obtenirEtatSorealIdle:1,synchroniserSorealIdle:1,obtenirEtatBoutiqueSorealIdle:1,agirProgressionSorealIdle:1,definirAllocationsEntrainementSorealIdle:1,
    acheterAmeliorationSorealIdle:1,acheterAmeliorationsSorealIdle:1,acheterEntrainementSorealIdle:1,acheterEntrainementsSorealIdle:1,acheterSortSorealIdle:1,acheterSortsSorealIdle:1,
    agrandirInventairePlusieursSorealIdle:1,agrandirInventaireSorealIdle:1,ameliorerEquipementForgeSorealIdle:1,ameliorerEquipementsForgeSorealIdle:1,combattreAventureSorealIdle:1,
    definirAutoBossSuivantSorealIdle:1,definirCombatAutoAventureSorealIdle:1,definirCombatBossSorealIdle:1,equiperObjetsSorealIdle:1,fusionnerObjetSorealIdle:1,fusionnerObjetsSorealIdle:1,
    lancerSortSorealIdle:1,marquerVusSorealIdle:1,demarrerPartieSorealIdle:1,definirOrdreMenusSorealIdle:1,recyclerObjetSorealIdle:1,recyclerObjetsSorealIdle:1,renaitreSorealIdle:1,
    sauvegarderDispositionInventaireSorealIdle:1,selectionnerBossSorealIdle:1,enregistrerClicsSorealIdle:1,definirClassementVisibleSorealIdle:1,nukerBossSorealIdle:1
  };
  /* Opérations qui restent au serveur mais MODIFIENT la ligne du joueur (administration, partie d'essai, changement de pseudo : le profil copié dans la page doit être rechargé) : avant, on envoie ce que la page a de neuf ; après, on recharge la page pour repartir de l'état du serveur. */
  const MODIFIENT_LE_JOUEUR={annulerVictoireTitanAdminSorealIdle:1,crediterExpAdminSorealIdle:1,retirerRecordCombatLongAdminSorealIdle:1,reinitialiserCompteCompletSorealIdle:1,preparerPartieTestSorealIdle:1,copierPartieASurBSorealIdle:1,definirPartieDevSorealIdle:1,definirPseudoSorealIdle:1};
  const INTERVALLE_ENVOI_MS=10000;
  const DELAI_ENVOI_MS=20000;
  let delaiEnvoi=0;

  /*
   * ACTIF PAR DÉFAUT pour tous les joueurs (Norman, 2026-10-19). Coupé seulement : (1) par un choix explicite de l'appareil (?local=0, enregistré), (2) si le navigateur ne sait pas faire
   * tourner le moteur (pas de Worker, de WebAssembly ni d'IndexedDB), (3) par l'interrupteur général du serveur (l'export répond alors « IDLE_LOCAL_DESACTIVE » : la page retombe sur le
   * mode serveur) ou si le moteur ne démarre pas. Dans tous ces cas le jeu continue en mode serveur, comme avant.
   */
  let actifCache=null;
  function capable(){
    try{return typeof Worker==="function"&&typeof WebAssembly==="object"&&typeof indexedDB==="object"&&indexedDB!==null;}catch(_){return false;}
  }
  function actif(){
    if(actifCache!==null)return actifCache;
    let v="";
    try{
      const q=new URLSearchParams(location.search||"").get("local");
      /* `?local=0` ne vaut que pour CETTE page : il n'est plus enregistré. Les préférences `soreal_idle_*` sont liées au compte (règle n°6) : un « 0 » enregistré une fois sur un appareil de test coupait le jeu local
         sur TOUS les appareils du joueur sans qu'il le sache. Un « 0 » déjà enregistré est effacé. */
      if(localStorage.getItem(CLE)==="0")localStorage.removeItem(CLE);
      v=q==="0"?"0":"";
    }catch(_){}
    actifCache=v!=="0"&&capable();
    return actifCache;
  }

  /* Sauvegarde sur l'appareil (IndexedDB) : la dernière ligne du joueur et les événements pas encore reçus par le serveur. Au démarrage, si elle est plus récente
     que celle du serveur (page fermée avant l'envoi), c'est elle qui est reprise et renvoyée : aucune progression perdue. */
  /*
   * Délais (Norman, 2026-10-21 : « quand je lance SOREAL IDLE depuis l'exe, ça charge « Connexion à SOREAL IDLE » mais rien ne s'affiche ; dans Chrome ça fonctionne directement ») : dans une fenêtre intégrée (l'application de bureau de SOREAL TV), une base de l'appareil
   * ou un Worker peut ne JAMAIS répondre (stockage bloqué dans un cadre d'un autre site) : le jeu attendait sans fin la fin du démarrage du moteur. Chaque attente est maintenant bornée ; passé le délai, le moteur local est abandonné
   * et le jeu continue en mode serveur, comme avant.
   */
  function avecDelai(promesse,ms,code){
    return new Promise(function(ok,ko){
      const t=setTimeout(function(){ko(new Error(code));},ms);
      promesse.then(function(v){clearTimeout(t);ok(v);},function(e){clearTimeout(t);ko(e);});
    });
  }
  function bd(){
    return avecDelai(new Promise(function(ok,ko){
      try{
        const r=indexedDB.open("soreal_idle_moteur_local_v1",1);
        r.onupgradeneeded=function(){r.result.createObjectStore("kv");};
        r.onsuccess=function(){ok(r.result);};
        r.onerror=function(){ko(r.error);};
        r.onblocked=function(){ko(new Error("IDB_BLOQUEE"));};
      }catch(e){ko(e);}
    }),4000,"IDB_LENTE");
  }
  async function kv(mode,cle,valeur){
    try{
      const db=await bd();
      return await avecDelai(new Promise(function(ok){
        const tx=db.transaction("kv",mode==="lire"?"readonly":"readwrite"),st=tx.objectStore("kv");
        const r=mode==="lire"?st.get(cle):mode==="ecrire"?st.put(valeur,cle):st.delete(cle);
        tx.oncomplete=function(){db.close();ok(mode==="lire"?r.result:true);};
        tx.onerror=tx.onabort=function(){db.close();ok(null);};
      }),4000,"IDB_LENTE");
    }catch(_){return null;}
  }
  /* Copies écartées : les 3 dernières sont gardées (« :ecartee » la plus récente, puis « -1 », « -2 ») ; un nouvel écartement décale les précédentes au lieu de les détruire (audit anti-rollback R3, 2026-10-21). */
  async function ecarter(rec){
    const base=cleSauve+":ecartee";
    const p1=await kv("lire",base+"-1"),p0=await kv("lire",base);
    if(p1===null||p0===null)return false;   /* lecture en échec : rien n'est décalé, on ne risque pas d'écraser une copie déjà écartée */
    if(p1&&!(await kv("ecrire",base+"-2",p1)))return false;
    if(p0&&!(await kv("ecrire",base+"-1",p0)))return false;
    return Boolean(await kv("ecrire",base,rec));
  }
  /* Copie de l'appareil pas encore lue ou pas encore mise à l'abri (base lente, bloquée, pleine) : tant que c'est le cas, on n'écrit ni n'efface rien dans la clé de la partie (audit anti-rollback S1 et S5, 2026-10-21). */
  let copieEnAttente=false;
  async function resoudreCopie(){
    const rec=await kv("lire",cleSauve);
    if(rec===null)return false;
    if(rec&&Array.isArray(rec.cells)){
      if(!(await ecarter(rec)))return false;
      if(!(await kv("effacer",cleSauve)))return false;
    }
    copieEnAttente=false;
    return true;
  }
  async function copiesEcartees(){
    const out=[];
    for(const suffixe of ["",  "-1","-2"]){const c=await kv("lire",cleSauve+":ecartee"+suffixe);if(c&&Array.isArray(c.cells))out.push(c);}
    return out;
  }
  function enMs(v){const n=Number(v);return(Number.isFinite(n)&&String(v).trim()!=="")?n:Date.parse(String(v));}
  let cleSauve="",minuterieSauve=0;
  /* Écrit MAINTENANT la partie sur l'appareil (IndexedDB). Appelé par la minuterie, et sans attendre par le passage en arrière-plan / la fermeture de la page : un grand envoi réseau peut être coupé par le navigateur, cette copie est alors le seul filet (reprise au démarrage suivant). */
  async function sauverCopie(){
    if(!worker||!cleSauve||!vivant)return false;
    try{
      if(copieEnAttente&&!(await resoudreCopie()))return false;
      const s=await parler({type:"sortant",vider:false});
      if(s&&s.cells)return Boolean(await kv("ecrire",cleSauve,{cells:s.cells,flux:s.flux,gains:s.gains,at:Date.now()}));
    }catch(_){}
    return false;
  }
  function programmerSauvegarde(){
    if(minuterieSauve||!worker||!cleSauve)return;
    minuterieSauve=setTimeout(function(){minuterieSauve=0;sauverCopie();},400);
  }

  const appareil="a"+Math.random().toString(36).slice(2)+Date.now().toString(36);
  let depuis=0,conflit=false;
  let ecartInitial=0;
  function ecartServeur(){
    const f=window.__SOREAL_IDLE_ECART_V1__;
    const e=typeof f==="function"?f():null;
    return Number.isFinite(e)?e:ecartInitial;
  }
  let importPartieEnCours=false;
  let worker=null,demarrage=null,vivant=false,sale=false,passif=false,dernierEnvoi=0,enVol=false,session="",numero=0,echec=false,raison="";
  /* Révision de la progression de CETTE page : +1 à chaque action qui modifie la partie. Un envoi porte la révision qu'il contient ; son accusé ne concerne que celle-là (audit anti-rollback, Norman, 2026-10-21). refus = envois que le serveur a reçus mais PAS écrits. */
  let rev=0,refus=0,revAcquittee=0;
  const attentes=new Map();

  function parler(msg){
    return new Promise(function(ok,ko){
      const id=++numero;
      attentes.set(id,{ok:ok,ko:ko,op:msg.operation||msg.type,envoi:performance.timeOrigin+performance.now()});
      worker.postMessage(Object.assign({id:id},msg));
    });
  }

  /* Où va le temps d'un appel ? file = attente avant le début du calcul (le Worker traite un appel à la fois), calcul = le moteur, retour = copie du résultat vers la page. Lu par le journal de fluidité ; la durée des synchros règle aussi leur cadence. */
  let emaSyncMs=0;
  function noterMesure(a,mes){
    try{
      const recu=performance.timeOrigin+performance.now();
      const file=Math.max(0,mes.debut-a.envoi),retour=Math.max(0,recu-mes.fin);
      if(a.op==="synchroniserSorealIdle")emaSyncMs=emaSyncMs?emaSyncMs*0.8+mes.calcul*0.2:mes.calcul;
      const D=window.__SOREAL_IDLE_DIAG_V1__;
      if(D&&typeof D.moteurTemps==="function")D.moteurTemps(a.op,file,mes.calcul,retour,mes.spans);
    }catch(_){}
  }

  async function demarrer(jeton){
    session=jeton;
    const t0=Date.now();
    const rep=await avecDelai(fetch("/api/v1/local/export?appareil="+encodeURIComponent(appareil),{headers:{accept:"application/json",authorization:"Bearer "+jeton}}),25000,"EXPORT_LOCAL_LENT");
    const exp=await avecDelai(rep.json(),25000,"EXPORT_LOCAL_LENT");
    depuis=Number(exp&&exp.serveurAt)||Date.now();
    /* Écart avec l'horloge du serveur, estimé au milieu de l'aller-retour du téléchargement ; affiné ensuite par les réponses du pont (voir ecartServeur). */
    if(exp&&Number(exp.serveurAt)>0)ecartInitial=Number(exp.serveurAt)-(t0+(Date.now()-t0)/2);
    if(!rep.ok||!exp||!exp.ok)throw new Error((exp&&exp.error)||"EXPORT_LOCAL_REFUSE");
    try{empreinteTextes=(exp.textes||[]).map(function(t){return t[0]+"@"+t[2];}).join("|");}catch(_){}
    /* Préférences du compte appliquées AVANT de démarrer le moteur : si un autre appareil en a changé, la page se recharge tout de suite (la 1re réception ne vient qu'après le démarrage complet, qui était alors perdu). */
    try{const P=window.__SOREAL_IDLE_PREFS_V1__;if(P&&exp.uiPrefsCompte&&typeof P.appliquer==="function")P.appliquer({nom:exp.uiPrefsCompte.nom,systemes:{uiPrefs:exp.uiPrefsCompte.prefs}});}catch(_){}
    cleSauve="etat:"+String((exp.user&&(exp.joueurs&&exp.joueurs.index!=null?exp.joueurs.index:"")))+":"+String(exp.user&&(exp.user.email||""));
    const rec=await kv("lire",cleSauve);
    if(rec===null)copieEnAttente=true;   /* lecture en échec : on ne sait pas s'il y a une copie, on n'y touche pas */
    else if(rec&&Array.isArray(rec.cells)){
      let srv=[];try{srv=JSON.parse(exp.joueurs.ligne);}catch(_){}
      if(enMs(rec.cells[15])>enMs(srv[15])){
        const fusion=rec.cells.slice();
        [0,1,17,18,19].forEach(function(c){fusion[c]=srv[c];});
        exp.joueurs.ligne=JSON.stringify(fusion);
        exp.reprise={flux:rec.flux||[],gains:rec.gains||[]};
        sale=true;rev+=1;
      }else{
        /* Le serveur est plus récent (autre appareil passé depuis) : il fait foi, mais la copie de cet appareil n'est jamais détruite en silence : elle est mise de côté (un seul emplacement) avant d'être retirée de la reprise. */
        if(await ecarter(rec)){if(!(await kv("effacer",cleSauve)))copieEnAttente=true;}
        else copieEnAttente=true;   /* mise de côté non confirmée : la copie d'origine reste en place */
      }
    }
    worker=new Worker("/moteur-local-worker-v1.js?v=55c1016d47");
    worker.onmessage=function(ev){
      const m=ev.data||{},a=attentes.get(m.id);
      if(!a)return;
      attentes.delete(m.id);
      if(m.ok&&m.mesure)noterMesure(a,m.mesure);
      if(m.ok)a.ok(m.resultat);else a.ko(Object.assign(new Error(m.erreur||"MOTEUR_LOCAL"),{code:m.erreur}));
    };
    worker.onerror=function(){
      echec=true;vivant=false;
      attentes.forEach(function(a){a.ko(new Error("MOTEUR_LOCAL_ARRETE"));});attentes.clear();
    };
    try{if(window.__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__)window.__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__(65);}catch(_e){}
    try{
      await avecDelai(parler({type:"init",ecart:ecartServeur(),export:exp,wasmUrl:new URL("/sql-wasm-v1.wasm?v=f3aaaa47b7",location.href).href}),20000,"MOTEUR_LOCAL_DEMARRAGE_LENT");
    }catch(e){
      try{worker.terminate();}catch(_){}
      worker=null;
      throw e;
    }
    vivant=true;
    try{if(window.__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__)window.__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__(80);}catch(_e){}
    /* Chronométrage par phase du moteur : demandé seulement à l'administrateur (journal de fluidité). Réessayé quelques fois : le statut d'administrateur n'est connu qu'après les premières réponses. */
    (function demanderSpans(essais){
      try{
        const admin=typeof window.__SOREAL_IDLE_EST_ADMIN_V1__==="function"&&window.__SOREAL_IDLE_EST_ADMIN_V1__()===true;
        if(admin){parler({type:"spans",actif:true}).catch(function(){});return;}
      }catch(_){}
      if(essais>0)setTimeout(function(){demanderSpans(essais-1);},3000);
    })(20);
    window.addEventListener("pagehide",function(){sauverCopie();envoyer(true);});
    document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden"){sauverCopie();envoyer(true);}});
    setInterval(function(){envoyer(false);},INTERVALLE_ENVOI_MS);
  }

  /* Autre appareil (ou autre onglet) arrivé après nous : on arrête d'envoyer et on propose de recharger pour reprendre la partie là où elle en est. */
  function afficherConflit(){
    if(document.getElementById("sorealIdleConflitLocalV1"))return;
    const d=document.createElement("div");
    d.id="sorealIdleConflitLocalV1";
    d.style.cssText="position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(5,8,18,.88);padding:20px;font-family:inherit";
    d.innerHTML='<div style="max-width:420px;background:#12182b;border:1px solid #3b4670;border-radius:14px;padding:22px;color:#e8ecfa;text-align:center"><div style="font-size:20px;font-weight:700;margin-bottom:10px">Partie reprise sur un autre appareil</div><div style="font-size:15px;color:#aab3d1;margin-bottom:16px">Cette partie vient d’être ouverte ailleurs. Recharge la page pour la reprendre là où elle en est.</div><button type="button" style="font-size:16px;padding:10px 18px;border-radius:10px;border:0;background:#4f7cff;color:#fff;cursor:pointer" onclick="location.reload()">Recharger</button></div>';
    document.body.appendChild(d);
  }
  async function envoyer(fin,forcer){
    /* Une synchro sans action (le joueur laisse tourner) fait avancer la ligne : envoyée au plus une fois par minute, pour les classements. */
    const passifDu=passif&&Date.now()-dernierEnvoi>60000;
    if(conflit||!vivant||!(sale||passifDu||forcer)||enVol&&!fin)return false;
    enVol=true;
    passif=false;dernierEnvoi=Date.now();
    /* Révision contenue dans cet envoi : lue AVANT l'extraction (une action terminée entre-temps est dans l'état extrait mais pas comptée ici : on croit alors la copie de l'appareil plus récente que le serveur, jamais l'inverse). */
    const revEnvoyee=rev;
    try{
      /* Les événements (flux, gains d'EXP) RESTENT dans la file du Worker jusqu'à l'accusé du serveur (message « acquitter ») : un échec réseau ou une réponse perdue ne les perd plus ; le serveur ignore ceux qu'il a déjà. */
      const sortant=await parler({type:"sortant",vider:false});
      /* Dernier numéro d'événement contenu dans CET envoi : l'accusé retire jusque-là, pas « N événements » (réponses dans le désordre). */
      const dernierN=function(l){let m=0;(l||[]).forEach(function(e){if(e&&e.n>m)m=e.n;});return m;};
      const envoyes={flux:sortant.flux||[],gains:sortant.gains||[]};
      sortant.appareil=appareil;sortant.depuis=depuis;sortant.rev=revEnvoyee;
      if(importPartieEnCours)sortant.importPartie=true;
      sale=false;
      /* Délai : un envoi qui ne répond jamais bloquait tous les suivants (enVol restait vrai) ; abandonné, la progression repart à l'envoi suivant (audit anti-rollback S7, 2026-10-21). */
      const ctl=typeof AbortController==="function"?new AbortController():null;
      delaiEnvoi=ctl?setTimeout(function(){try{ctl.abort();}catch(_){}},DELAI_ENVOI_MS):0;
      const rep=await fetch("/api/v1/local/push",{signal:ctl?ctl.signal:undefined,method:"POST",keepalive:Boolean(fin)&&JSON.stringify(sortant).length<60000,headers:{"content-type":"application/json",authorization:"Bearer "+session},body:JSON.stringify(sortant)});
      const reponse=await rep.json().catch(function(){return null;});
      /* Reçus par le serveur (même si la LIGNE est refusée) : les événements quittent la file du Worker. */
      if(reponse&&reponse.ok&&!reponse.conflit){try{await parler({type:"acquitter",fluxJusqua:dernierN(envoyes.flux.slice(0,Number.isFinite(reponse.fluxTraites)?reponse.fluxTraites:undefined)),gainsJusqua:dernierN(envoyes.gains.slice(0,Number.isFinite(reponse.gainsTraites)?reponse.gainsTraites:undefined))});}catch(_){}}
      if(reponse&&reponse.conflit){conflit=true;sale=false;afficherConflit();}
      else if(!reponse||!reponse.ok)sale=true;
      else if(reponse.ecrit===false){
        /* Le serveur a REÇU l'état mais l'a REFUSÉ (il en détient un plus récent) : ce n'est pas une sauvegarde. La copie de l'appareil reste, l'envoi sera retenté, le refus est signalé. */
        /* Réponses INVERSÉES : si une révision plus récente a déjà été écrite, le refus d'un envoi plus ancien (arrivé après) ne concerne plus la partie actuelle. */
        if(revEnvoyee>=revAcquittee){
          sale=true;refus+=1;
          try{window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler("sauvegarde_refusee","révision "+revEnvoyee+" refusée par le serveur ("+refus+")");}catch(_){}
          programmerSauvegarde();
        }
      }
      else{
        revAcquittee=Math.max(revAcquittee,revEnvoyee);
        if(!sale&&rev===revEnvoyee&&!copieEnAttente)await kv("effacer",cleSauve);
      }   /* écriture confirmée ET aucune action depuis : la copie de l'appareil n'a plus d'utilité */
    }catch(_){sale=true;}
    finally{enVol=false;clearTimeout(delaiEnvoi);}
    return !sale && !conflit;
  }

  /*
   * File des appels au moteur (Norman, 2026-10-20 : « temps de réponse ») : le Worker traite UN appel à la fois ; un clic arrivant pendant une synchro (200 ms sur un gros compte) ou derrière plusieurs synchros en attente
   * devait toutes les attendre. Maintenant : (1) un seul appel à la fois est envoyé, (2) les ACTIONS passent avant les opérations « légères » (synchro, battement, lecture de l'état), (3) des opérations légères identiques
   * encore en attente sont FUSIONNÉES (un seul calcul, tous les appelants reçoivent le résultat). L'ordre entre actions est conservé.
   */
  const OPS_LEGERES={synchroniserSorealIdle:1,battementSorealIdle:1,obtenirEtatSorealIdle:1,obtenirEtatBoutiqueSorealIdle:1};
  const filePriorite=[];let appelEnCours=false;
  function jsonSur(v){try{return JSON.stringify(v);}catch(_){return String(Math.random());}}
  function executerAppel(msg){
    return new Promise(function(ok,ko){
      const lourd=!OPS_LEGERES[msg.operation];
      const cle=lourd?"":msg.operation+"|"+jsonSur(msg.args)+"|"+jsonSur(msg.catalogHashes)+"|"+(msg.langue||"");
      if(!lourd){const ex=filePriorite.find(function(e){return e.cle===cle;});if(ex){ex.suites.push({ok:ok,ko:ko});return;}}
      filePriorite.push({msg:msg,lourd:lourd,cle:cle,suites:[{ok:ok,ko:ko}]});
      pomper();
    });
  }
  function pomper(){
    if(appelEnCours||!filePriorite.length)return;
    let i=filePriorite.findIndex(function(e){return e.lourd;});if(i<0)i=0;
    const e=filePriorite.splice(i,1)[0];
    appelEnCours=true;
    e.msg.ecart=ecartServeur();
    parler(e.msg).then(function(r){appelEnCours=false;e.suites.forEach(function(x){x.ok(r);});pomper();},function(err){appelEnCours=false;e.suites.forEach(function(x){x.ko(err);});pomper();});
  }

  async function appeler(operation,args,catalogHashes,langue,jeton){
    if(!demarrage)demarrage=demarrer(jeton);
    try{await demarrage;}catch(e){echec=true;raison=String(e&&e.message||e).slice(0,120);return null;}   // le moteur local n'a pas démarré : l'appelant retombe sur le serveur
    const r=await executerAppel({type:"appel",ecart:ecartServeur(),operation:operation,args:args,catalogHashes:catalogHashes,langue:langue});
    if(operation==="synchroniserSorealIdle")passif=true;
    else if(operation!=="obtenirEtatSorealIdle"&&operation!=="obtenirEtatBoutiqueSorealIdle"){sale=true;rev+=1;}
    if(sale)programmerSauvegarde();
    return r;
  }

  /* Cadence des synchros (Norman, 2026-10-19 : « les menus doivent se mettre à jour beaucoup plus vite, plus juste »). Le moteur est dans la page : une synchro coûte ~50 ms dans un Worker, sans réseau. Les limiteurs prévus pour un serveur (4 s en menu vivant, 3 s pour une augmentation, 2 s pour la machine) sont divisés par 10 (150 ms au minimum) en jeu local. */
  window.__SOREAL_IDLE_DELAI_SYNC_V1__=function(ms){
    const ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
    /* Jamais plus d'une synchro toutes les 4 fois sa durée : le Worker traite un appel à la fois, des synchros trop rapprochées (172 ms chacune sur un gros compte) faisaient attendre les clics derrière elles. */
    return(ML&&ML.actif&&ML.actif())?Math.min(ms,Math.max(150,Math.round(ms/10),Math.round(emaSyncMs*4))):ms;
  };

  /*
   * Textes modifiés par l'administrateur (chroniques et noms de boss, popups) : le moteur local n'a pas la table du serveur, il la reçoit au démarrage (export) et la relit ici (Norman, 2026-10-20 : « j'ai créé une voix pour le boss 99 et c'est toujours l'ancienne qui est lue ;
   * ces voix doivent être instantanément remplacées par les dernières, et le texte aussi »). Appelé tout de suite après chaque enregistrement ou suppression d'un texte par l'administrateur (standalone-bridge.js), puis toutes les minutes pour les autres joueurs.
   * Rien n'est renvoyé au moteur si la liste n'a pas changé (empreinte de la liste : clés + dates de modification).
   */
  let empreinteTextes="";
  async function rafraichirTextes(force){
    if(!vivant)return false;
    const jeton=session;
    if(!jeton)return false;
    const rep=await fetch("/api/v1/local/textes",{headers:{accept:"application/json",authorization:"Bearer "+jeton}});
    const d=await rep.json();
    if(!rep.ok||!d||!d.ok||!Array.isArray(d.textes))return false;
    const empreinte=d.textes.map(function(t){return t[0]+"@"+t[2];}).join("|");
    if(!force&&empreinte===empreinteTextes)return false;
    await parler({type:"textes",textes:d.textes});
    empreinteTextes=empreinte;
    return true;
  }
  setInterval(function(){
    if(!vivant||document.hidden)return;
    rafraichirTextes(false).then(function(change){
      if(!change)return;
      /* Les chroniques arrivent avec l'état : une synchro tout de suite pour les montrer, sans attendre la suivante. */
      try{if(typeof window.__SOREAL_IDLE_CALL_V1__==="function")window.__SOREAL_IDLE_CALL_V1__("synchroniserSorealIdle",[]).catch(function(){});}catch(_){}
    }).catch(function(){});
  },60000);

  window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__={
    rafraichirTextes:rafraichirTextes,
    copiesEcartees:copiesEcartees,
    /* Lu par le journal de diagnostic : dit POURQUOI la page joue en mode serveur (aller-retours de 0,5 à 1 s) au lieu du jeu local. */
    /* Diagnostic (administrateur) : la ligne du joueur telle que le moteur la détient, pour reproduire hors de la page un calcul lent sur un compte avancé. */
    exporterLigne:async function(){if(!vivant)return null;const s=await parler({type:"sortant",vider:false});return s&&s.cells?s.cells:null;},
    etatDiag:function(){return {actif:actif(),capable:capable(),demarre:vivant,echec:echec,raison:raison,conflit:conflit,refus:refus,rev:rev};},
    actif:function(){return actif()&&!echec;},
    prend:function(operation){return Boolean(LOCALES[operation]);},
    modifieLeJoueur:function(operation){return Boolean(MODIFIENT_LE_JOUEUR[operation]);},
    avantServeur:async function(){if(!vivant)return;for(let i=0;i<50&&enVol;i+=1)await new Promise(function(r){setTimeout(r,100);});await envoyer(false,true);},
    apresServeur:function(){setTimeout(function(){location.reload();},400);},
    appeler:appeler,
    envoyerMaintenant:async function(){for(let i=0;i<50&&enVol;i+=1)await new Promise(function(r){setTimeout(r,100);});return envoyer(false,true);}
  };
  /*
   * Réglages : sauvegarder la partie dans un FICHIER et la recharger (tout le monde). Le chargement remplace la partie du compte (copie de sécurité côté serveur), garde l'identité du compte et reprend EXACTEMENT
   * au moment de la sauvegarde : aucun temps hors ligne n'est compté (idle-partie-fichier-v1.js).
   */
  function etatPartieFichier(html,erreur){const e=document.getElementById("sorealIdlePartieFichierEtatV1");if(e){e.innerHTML=html;e.style.color=erreur?"#ff9d9d":"#8b93ab";}}
  function echapper(t){return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  window.__exporterPartieIdleV1__=async function(bouton){
    if(bouton)bouton.disabled=true;
    try{
      if(!vivant){etatPartieFichier("⚠️ Le jeu local n’est pas démarré : impossible d’exporter pour l’instant.",true);return;}
      etatPartieFichier("Préparation du fichier…",false);
      try{await executerAppel({type:"appel",ecart:ecartServeur(),operation:"synchroniserSorealIdle",args:[session],catalogHashes:undefined,langue:"fr"});}catch(_){}
      const s=await parler({type:"sortant",vider:false});
      if(!s||!s.cells){etatPartieFichier("⚠️ Export impossible : partie introuvable.",true);return;}
      const d=new Date(Number(s.instant)||Date.now());
      const pad=function(n){return String(n).padStart(2,"0");};
      const fichier={format:"soreal-idle-partie-v1",version:1,exporteLe:d.toISOString(),serveurAt:Number(s.instant)||Date.now(),nom:String(s.cells[1]||""),cells:s.cells};
      const blob=new Blob([JSON.stringify(fichier)],{type:"application/json"});
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      a.download="soreal-idle-partie-"+d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"-"+pad(d.getHours())+pad(d.getMinutes())+".json";
      document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
      etatPartieFichier("✅ Partie enregistrée dans le fichier « "+echapper(a.download)+" ». Garde-le précieusement.",false);
    }catch(e){etatPartieFichier("⚠️ Export impossible : "+echapper(e&&e.message||e),true);}
    finally{if(bouton)bouton.disabled=false;}
  };
  let fichierEnAttente=null;
  window.__choisirPartieIdleV1__=function(){const i=document.getElementById("sorealIdlePartieFichierChoixV1");if(i){i.value="";i.click();}};
  window.__lirePartieIdleV1__=function(input){
    const f=input&&input.files&&input.files[0];
    if(!f)return;
    if(f.size>6*1024*1024){etatPartieFichier("⚠️ Ce fichier est trop gros pour être une partie SOREAL IDLE.",true);return;}
    const lecteur=new FileReader();
    lecteur.onerror=function(){etatPartieFichier("⚠️ Impossible de lire ce fichier.",true);};
    lecteur.onload=function(){
      let o=null;
      try{o=JSON.parse(String(lecteur.result||""));}catch(_){o=null;}
      const ok=o&&o.format==="soreal-idle-partie-v1"&&Array.isArray(o.cells)&&o.cells.length===38&&typeof o.cells[37]==="string";
      if(!ok){fichierEnAttente=null;etatPartieFichier("⚠️ Ce fichier n’est pas une partie SOREAL IDLE valide.",true);return;}
      fichierEnAttente=o;
      const quand=new Date(Number(o.serveurAt)||0);
      etatPartieFichier("Partie du <b>"+echapper(quand.toLocaleString("fr-FR"))+"</b>"+(o.nom?" (joueur « "+echapper(o.nom)+" »)":"")+". Elle <b>remplacera ta partie actuelle</b>, sur cet appareil et sur ton compte (une copie de sécurité de ta partie actuelle est gardée). Elle reprendra exactement là où elle a été sauvegardée, sans temps écoulé. "+
        '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__chargerPartieIdleV1__(this)">✅ Charger cette partie</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__annulerChargementPartieIdleV1__()">Annuler</button></div>',false);
    };
    lecteur.readAsText(f);
  };
  window.__annulerChargementPartieIdleV1__=function(){fichierEnAttente=null;etatPartieFichier("Chargement annulé. Ta partie actuelle n’a pas changé.",false);};
  window.__chargerPartieIdleV1__=async function(bouton){
    if(!fichierEnAttente)return;
    if(bouton)bouton.disabled=true;
    try{
      if(!vivant){etatPartieFichier("⚠️ Le jeu local n’est pas démarré : impossible de charger pour l’instant.",true);return;}
      etatPartieFichier("Chargement de la partie…",false);
      for(let i=0;i<50&&(enVol||appelEnCours);i+=1)await new Promise(function(r){setTimeout(r,100);});
      const r=await parler({type:"importer",fichier:fichierEnAttente});
      if(!r||!r.ok){etatPartieFichier("⚠️ Cette partie n’a pas pu être chargée ("+echapper(r&&r.erreur||"erreur")+"). Ta partie actuelle n’a pas changé.",true);return;}
      importPartieEnCours=true;sale=true;rev+=1;
      /* La partie importée est écrite sur l'appareil AVANT l'envoi et avant tout rechargement (audit anti-rollback, 2026-10-21) : si le serveur est injoignable, c'est la reprise au démarrage qui l'enverra ; avant, la page se rechargeait 0,9 s plus tard même si rien n'était encore sauvegardé. */
      const copieOk=await sauverCopie();
      let envoye=false;
      try{envoye=Boolean(await envoyer(false,true));}catch(_){envoye=false;}
      importPartieEnCours=false;
      if(!envoye&&!copieOk){
        etatPartieFichier("⚠️ La partie est chargée dans le jeu mais n’a pu être sauvegardée ni sur cet appareil ni sur le serveur : ne ferme pas la page, vérifie ta connexion puis utilise « Envoyer ma partie vers le serveur ».",true);
        return;
      }
      fichierEnAttente=null;
      etatPartieFichier(envoye?"✅ Partie chargée. Le jeu se recharge…":"✅ Partie chargée sur cet appareil (l’envoi au serveur se fera tout seul). Le jeu se recharge…",false);
      setTimeout(function(){location.reload();},900);
    }catch(e){importPartieEnCours=false;etatPartieFichier("⚠️ Chargement impossible : "+echapper(e&&e.message||e),true);}
    finally{if(bouton)bouton.disabled=false;}
  };

  /* Réglages : « Envoyer ma partie vers le serveur » (avant de changer d'appareil). */
  window.__envoyerPartieServeurIdleV1__=async function(bouton){
    const etat=document.getElementById("sorealIdlePartieServeurEtatV1");
    const ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
    if(bouton)bouton.disabled=true;
    if(etat)etat.textContent="Envoi en cours…";
    let ok=false;
    try{ok=Boolean(await ML.envoyerMaintenant());}catch(_){ok=false;}
    if(etat)etat.textContent=ok?"✅ Ta partie est sur le serveur. Tu peux ouvrir le jeu sur l’autre appareil.":"⚠️ L’envoi a échoué. Vérifie ta connexion et réessaie.";
    if(bouton)bouton.disabled=false;
  };
})();
