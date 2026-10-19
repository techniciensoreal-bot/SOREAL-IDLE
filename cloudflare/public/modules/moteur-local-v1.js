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
    lancerSortSorealIdle:1,marquerVusSorealIdle:1,definirOrdreMenusSorealIdle:1,recyclerObjetSorealIdle:1,recyclerObjetsSorealIdle:1,renaitreSorealIdle:1,
    sauvegarderDispositionInventaireSorealIdle:1,selectionnerBossSorealIdle:1,enregistrerClicsSorealIdle:1,definirClassementVisibleSorealIdle:1,nukerBossSorealIdle:1
  };
  /* Opérations qui restent au serveur mais MODIFIENT la ligne du joueur (administration, partie d'essai) : avant, on envoie ce que la page a de neuf ; après, on recharge la page pour repartir de l'état du serveur. */
  const MODIFIENT_LE_JOUEUR={annulerVictoireTitanAdminSorealIdle:1,crediterExpAdminSorealIdle:1,reinitialiserCompteCompletSorealIdle:1,preparerPartieTestSorealIdle:1,copierPartieASurBSorealIdle:1,definirPartieDevSorealIdle:1};
  const INTERVALLE_ENVOI_MS=10000;

  let actifCache=null;
  function actif(){
    if(actifCache!==null)return actifCache;
    let v="";
    try{
      const q=new URLSearchParams(location.search||"").get("local");
      if(q==="1")localStorage.setItem(CLE,"1");
      else if(q==="0")localStorage.removeItem(CLE);
      v=String(localStorage.getItem(CLE)||"");
    }catch(_){}
    actifCache=v==="1";
    return actifCache;
  }

  /* Sauvegarde sur l'appareil (IndexedDB) : la dernière ligne du joueur et les événements pas encore reçus par le serveur. Au démarrage, si elle est plus récente
     que celle du serveur (page fermée avant l'envoi), c'est elle qui est reprise et renvoyée : aucune progression perdue. */
  function bd(){
    return new Promise(function(ok,ko){
      try{
        const r=indexedDB.open("soreal_idle_moteur_local_v1",1);
        r.onupgradeneeded=function(){r.result.createObjectStore("kv");};
        r.onsuccess=function(){ok(r.result);};
        r.onerror=function(){ko(r.error);};
      }catch(e){ko(e);}
    });
  }
  async function kv(mode,cle,valeur){
    try{
      const db=await bd();
      return await new Promise(function(ok){
        const tx=db.transaction("kv",mode==="lire"?"readonly":"readwrite"),st=tx.objectStore("kv");
        const r=mode==="lire"?st.get(cle):mode==="ecrire"?st.put(valeur,cle):st.delete(cle);
        tx.oncomplete=function(){db.close();ok(mode==="lire"?r.result:true);};
        tx.onerror=tx.onabort=function(){db.close();ok(null);};
      });
    }catch(_){return null;}
  }
  function enMs(v){const n=Number(v);return(Number.isFinite(n)&&String(v).trim()!=="")?n:Date.parse(String(v));}
  let cleSauve="",minuterieSauve=0;
  function programmerSauvegarde(){
    if(minuterieSauve||!worker||!cleSauve)return;
    minuterieSauve=setTimeout(async function(){
      minuterieSauve=0;
      try{
        const s=await parler({type:"sortant",vider:false});
        if(s&&s.cells)await kv("ecrire",cleSauve,{cells:s.cells,flux:s.flux,gains:s.gains,at:Date.now()});
      }catch(_){}
    },1000);
  }

  const appareil="a"+Math.random().toString(36).slice(2)+Date.now().toString(36);
  let depuis=0,conflit=false;
  let worker=null,demarrage=null,vivant=false,sale=false,passif=false,dernierEnvoi=0,enVol=false,session="",numero=0,echec=false;
  const attentes=new Map();

  function parler(msg){
    return new Promise(function(ok,ko){
      const id=++numero;
      attentes.set(id,{ok:ok,ko:ko});
      worker.postMessage(Object.assign({id:id},msg));
    });
  }

  async function demarrer(jeton){
    session=jeton;
    const rep=await fetch("/api/v1/local/export?appareil="+encodeURIComponent(appareil),{headers:{accept:"application/json",authorization:"Bearer "+jeton}});
    const exp=await rep.json();
    depuis=Number(exp&&exp.serveurAt)||Date.now();
    if(!rep.ok||!exp||!exp.ok)throw new Error((exp&&exp.error)||"EXPORT_LOCAL_REFUSE");
    cleSauve="etat:"+String((exp.user&&(exp.joueurs&&exp.joueurs.index!=null?exp.joueurs.index:"")))+":"+String(exp.user&&(exp.user.email||""));
    const rec=await kv("lire",cleSauve);
    if(rec&&Array.isArray(rec.cells)){
      let srv=[];try{srv=JSON.parse(exp.joueurs.ligne);}catch(_){}
      if(enMs(rec.cells[15])>enMs(srv[15])){
        const fusion=rec.cells.slice();
        [0,1,17,18,19].forEach(function(c){fusion[c]=srv[c];});
        exp.joueurs.ligne=JSON.stringify(fusion);
        exp.reprise={flux:rec.flux||[],gains:rec.gains||[]};
        sale=true;
      }else{await kv("effacer",cleSauve);}
    }
    worker=new Worker("/moteur-local-worker-v1.js?v=800ca9c986");
    worker.onmessage=function(ev){
      const m=ev.data||{},a=attentes.get(m.id);
      if(!a)return;
      attentes.delete(m.id);
      if(m.ok)a.ok(m.resultat);else a.ko(Object.assign(new Error(m.erreur||"MOTEUR_LOCAL"),{code:m.erreur}));
    };
    worker.onerror=function(){
      echec=true;vivant=false;
      attentes.forEach(function(a){a.ko(new Error("MOTEUR_LOCAL_ARRETE"));});attentes.clear();
    };
    await parler({type:"init",export:exp,wasmUrl:new URL("/sql-wasm-v1.wasm?v=f3aaaa47b7",location.href).href});
    vivant=true;
    window.addEventListener("pagehide",function(){envoyer(true);});
    document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")envoyer(true);});
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
    try{
      const sortant=await parler({type:"sortant",vider:true});
      sortant.appareil=appareil;sortant.depuis=depuis;
      sale=false;
      const rep=await fetch("/api/v1/local/push",{method:"POST",keepalive:Boolean(fin)&&JSON.stringify(sortant).length<60000,headers:{"content-type":"application/json",authorization:"Bearer "+session},body:JSON.stringify(sortant)});
      const reponse=await rep.json().catch(function(){return null;});
      if(reponse&&reponse.conflit){conflit=true;sale=false;afficherConflit();}
      else if(!reponse||!reponse.ok)sale=true;
      else if(!sale)await kv("effacer",cleSauve);
    }catch(_){sale=true;}
    finally{enVol=false;}
    return !sale && !conflit;
  }

  async function appeler(operation,args,catalogHashes,langue,jeton){
    if(!demarrage)demarrage=demarrer(jeton);
    try{await demarrage;}catch(e){echec=true;return null;}   // le moteur local n'a pas démarré : l'appelant retombe sur le serveur
    const r=await parler({type:"appel",operation:operation,args:args,catalogHashes:catalogHashes,langue:langue});
    if(operation==="synchroniserSorealIdle")passif=true;
    else if(operation!=="obtenirEtatSorealIdle"&&operation!=="obtenirEtatBoutiqueSorealIdle")sale=true;
    if(sale)programmerSauvegarde();
    return r;
  }

  window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__={
    actif:function(){return actif()&&!echec;},
    prend:function(operation){return Boolean(LOCALES[operation]);},
    modifieLeJoueur:function(operation){return Boolean(MODIFIENT_LE_JOUEUR[operation]);},
    avantServeur:async function(){if(!vivant)return;for(let i=0;i<50&&enVol;i+=1)await new Promise(function(r){setTimeout(r,100);});await envoyer(false,true);},
    apresServeur:function(){setTimeout(function(){location.reload();},400);},
    appeler:appeler,
    envoyerMaintenant:async function(){for(let i=0;i<50&&enVol;i+=1)await new Promise(function(r){setTimeout(r,100);});return envoyer(false,true);}
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
