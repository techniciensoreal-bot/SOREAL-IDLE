(function(){
  "use strict";

  const SESSION_KEY="soreal_idle_session_v1";
  /* Session d'un joueur connecté par Google (hors APP / TV) : conservée sur l'appareil pour ne pas se reconnecter à chaque visite. */
  const GOOGLE_SESSION_KEY="soreal_idle_google_session_v1";
  const TIMEOUT_MS=45000;

  /*
   * Le frontend IDLE autonome ne charge plus Soreal_JS_01_Coeur.html.
   * Soreal_Idle_UI utilisait historiquement ces helpers globaux fournis
   * par APP. Ils appartiennent désormais au shell autonome.
   */
  function escapeHtmlV1(value){
    return String(value==null?"":value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function escapeAttrV1(value){
    return escapeHtmlV1(value).replace(/`/g,"&#096;");
  }

  if(typeof window.escapeHtml!=="function"){
    window.escapeHtml=escapeHtmlV1;
  }
  if(typeof window.escapeAttr!=="function"){
    window.escapeAttr=escapeAttrV1;
  }

  function statusV1(message, error){
    const el=document.getElementById("standaloneStatus");
    if(!el)return;
    el.textContent=String(message||"");
    el.classList.toggle("error",Boolean(error));
  }

  /*
   * Ticket de lancement : « #ticket=… » (fenêtre intégrée de SOREAL APP / TV) OU « ?ticket=… » (lancement par l'application Android du jeu depuis SOREAL APP : une adresse d'ouverture d'application ne peut pas porter de « # »,
   * Norman 2026-10-08). Même ticket à usage unique, consommé par le serveur ; l'adresse est nettoyée aussitôt.
   */
  function ticketFromHashV1(){
    try{
      const raw=String(location.hash||"").replace(/^#/,"");
      const depuisHash=raw?String(new URLSearchParams(raw).get("ticket")||"").trim():"";
      if(depuisHash)return depuisHash;
      return String(new URLSearchParams(location.search||"").get("ticket")||"").trim();
    }catch(_){return "";}
  }

  function clearHashV1(){
    try{
      const q=new URLSearchParams(location.search||"");
      q.delete("ticket");
      const reste=q.toString();
      history.replaceState(null,"",location.pathname+(reste?"?"+reste:""));
    }catch(_){}
  }

  function googleSessionStockeeV1(){
    try{
      const brut=JSON.parse(String(localStorage.getItem(GOOGLE_SESSION_KEY)||"null"));
      if(brut&&brut.token&&Number(brut.expiresAt)>Date.now())return String(brut.token);
      if(brut)localStorage.removeItem(GOOGLE_SESSION_KEY);
    }catch(_){}
    return "";
  }

  /* Langue des items et des textes : choix du joueur dans les Réglages (localStorage), « fr » par défaut. */
  function langueIdleV1(){
    try{return localStorage.getItem("soreal_idle_langue_v1")==="en"?"en":"fr";}catch(_e){return "fr";}
  }
  window.__SOREAL_IDLE_LANGUE_V1__=langueIdleV1;

  function sessionV1(){
    let token="";
    try{token=String(sessionStorage.getItem(SESSION_KEY)||"").trim();}catch(_){}
    return token||googleSessionStockeeV1();
  }

  function saveSessionV1(value){
    const token=String(value||"").trim();
    try{
      if(token)sessionStorage.setItem(SESSION_KEY,token);
      else{
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(GOOGLE_SESSION_KEY);
      }
    }catch(_){}
    window.SOREAL_SESSION=token;
    return token;
  }

  function saveGoogleSessionV1(token,expiresAt){
    try{localStorage.setItem(GOOGLE_SESSION_KEY,JSON.stringify({token:String(token),expiresAt:Number(expiresAt)||0}));}catch(_){}
    return saveSessionV1(token);
  }

  /*
   * Heure du serveur (Norman, 2026-10-03 : « tous les compteurs doivent être très précis »). Les échéances (Money Pit, Daily Spin, cooldowns, début de run…) sont des
   * dates du SERVEUR : comparées à l'horloge du téléphone, elles sont décalées d'autant. Chaque réponse porte l'en-tête x-soreal-now ; l'écart est estimé au milieu de
   * l'aller-retour, en gardant la mesure au plus court aller-retour (la plus fiable), renouvelée si elle date de plus de 2 minutes.
   */
  const heureServeurV1={ecart:0,rtt:Infinity,quand:0,connu:false};
  function noterHeureServeurV1(entete,debut,fin){
    const serveur=Number(entete);
    if(!isFinite(serveur)||serveur<=0)return;
    const rtt=Math.max(0,fin-debut);
    const vieux=fin-heureServeurV1.quand>120000;
    if(!heureServeurV1.connu||vieux||rtt<=heureServeurV1.rtt*1.25){
      heureServeurV1.ecart=serveur-(debut+rtt/2);
      heureServeurV1.rtt=rtt;
      heureServeurV1.quand=fin;
      heureServeurV1.connu=true;
    }
  }
  window.__SOREAL_IDLE_HEURE_V1__=function(){return Date.now()+heureServeurV1.ecart;};
  window.__SOREAL_IDLE_RTT_V1__=function(){return heureServeurV1.connu?heureServeurV1.rtt:0;};
  /*
   * Âge réel de l'état reçu (Norman, 2026-10-07 : « les barres d'Augmentations recalculent encore à chaque montée — en ligne »). Les chronos partaient de « réception moins un demi aller-retour », avec l'aller-retour le plus court jamais
   * mesuré (≈ 45 ms) : or une synchro prend 1 à 2 s de calcul côté serveur, pendant lesquelles les barres, niveaux et Or du serveur sont ceux du DÉBUT du calcul. Chaque synchro posait donc les barres 1 à 2 s en retard, puis le
   * recalage de phase les faisait sauter. Le serveur donne maintenant l'instant où il a commencé (__serveurAtV1) ; converti en horloge locale avec l'écart d'horloge connu, il donne l'âge exact de l'état. La valeur rendue est
   * celle que la lecture habituelle (« __recuPerfV1 moins un demi aller-retour ») ramène à cet instant. Sans repère fiable (pas d'écart connu, âge négatif ou > 30 s), on garde l'ancien calcul.
   */
  function calerRecuPerfV1_(joueur,perfMaintenant,dateMaintenant){
    const serveurAt=Number(joueur&&joueur.__serveurAtV1);
    if(!heureServeurV1.connu||!(serveurAt>0))return perfMaintenant;
    const age=dateMaintenant-(serveurAt-heureServeurV1.ecart);
    if(!(age>=0)||age>30000)return perfMaintenant;
    return perfMaintenant-age+heureServeurV1.rtt/2;
  }
  window.__SOREAL_IDLE_CALER_RECU_V1__=calerRecuPerfV1_;
  window.__SOREAL_IDLE_ETAT_HEURE_V1__=heureServeurV1;

  async function jsonFetchV1(url, options, timeoutMs){
    const controller=typeof AbortController==="function"?new AbortController():null;
    const timer=setTimeout(function(){try{controller&&controller.abort();}catch(_){}},timeoutMs||TIMEOUT_MS);
    try{
      const debutFetch=Date.now();
      const response=await fetch(url,Object.assign({},options||{},{
        cache:"no-store",
        signal:controller?controller.signal:undefined
      }));
      try{noterHeureServeurV1(response.headers.get("x-soreal-now"),debutFetch,Date.now());}catch(_){}
      const data=await response.json().catch(function(){return null;});
      if(!response.ok||!data||data.ok===false){
        const error=new Error(
          data&&(data.error||data.message)
            ?String(data.error||data.message)
            :"SOREAL IDLE indisponible"
        );
        error.status=response.status;
        throw error;
      }
      return data;
    }catch(error){
      if(error&&error.name==="AbortError")throw new Error("SOREAL IDLE trop lent à répondre.");
      throw error;
    }finally{
      clearTimeout(timer);
    }
  }

  async function consumeLaunchTicketV1(ticket){
    const data=await jsonFetchV1("/api/v1/session",{
      method:"POST",
      headers:{accept:"application/json","content-type":"application/json"},
      body:JSON.stringify({ticket:String(ticket||"")})
    });
    if(!data.sessionToken)throw new Error("Session SOREAL IDLE invalide.");
    saveSessionV1(data.sessionToken);
    return data;
  }

  /*
   * Réponses plus légères (Norman, 2026-10-02 : « le jeu est très lent par moment »). Le serveur n'envoie plus les catalogues (objets, sets, perks…) que le
   * client possède déjà (src/idle-catalogues-v1.js) : le pont garde la dernière version reçue de chaque pièce, dit au serveur son empreinte, et remet les
   * pièces omises dans la réponse AVANT de la rendre au jeu -- le reste du client voit toujours la réponse complète. Deux versions par pièce sont gardées :
   * une réponse arrivée en retard peut encore avoir été allégée par rapport à la précédente.
   */
  /*
   * Jamais de retour en arrière (Norman, 2026-10-08 : « on traite ça pour que jamais le jeu ne subisse un rollback »). Les requêtes se chevauchent et une réponse calculée plus tôt peut ARRIVER plus tard
   * (le serveur rend une synchro 1 à 2 s après avoir calculé) : elle remettait l'ancien boss, des barres en arrière, un titan absent. Chaque état porte l'instant où le serveur a commencé à le calculer
   * (__serveurAtV1, croissant car le serveur traite un joueur à la fois) : un état plus ANCIEN que le dernier reçu est remplacé par ce dernier avant d'atteindre le jeu. Les messages de résultat de l'action
   * sont conservés ; seul l'état périmé disparaît (celui reçu après contient déjà ses effets, le serveur ayant traité les requêtes dans l'ordre).
   */
  const gardeRetourArriereBaseV1={cle:"",at:0,joueur:null,ignorees:0};
  /*
   * Détecteur de retours en arrière (diagnostic, Norman, 2026-10-08) : un état reçu, PLUS RÉCENT que le précédent, dont une valeur qui ne peut que croître a reculé est noté dans le journal de diagnostic
   * (Réglages > Diagnostic) : boss vaincus et Renaissances (le boss vaincu ne revient qu'avec une Renaissance), révision d'Aventure. Aucun effet sur le jeu : il sert à voir, chez un vrai joueur, ce que la garde
   * ci-dessus ne peut pas empêcher (désaccord réel entre le client et le serveur).
   */
  function valeurV1_(o,chemin){try{return chemin.split(".").reduce(function(x,k){return x==null?undefined:x[k];},o);}catch(_){return undefined;}}
  function detecterRecul_(avant,apres,ecartMs){
    try{
      const renAv=Number(valeurV1_(avant,"renaissance.renaissances")),renAp=Number(valeurV1_(apres,"renaissance.renaissances"));
      const champs=[["renaissance.renaissances",true],["bossVaincus",renAv===renAp],["systemes.adventure.revision",renAv===renAp]];
      champs.forEach(function(c){
        if(!c[1])return;
        const x=Number(valeurV1_(avant,c[0])),y=Number(valeurV1_(apres,c[0]));
        if(isFinite(x)&&isFinite(y)&&y<x)window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler("rollback_detecte",c[0]+" : "+x+" -> "+y+" (état plus récent de "+Math.round(ecartMs)+" ms)");
      });
    }catch(_){}
  }
  function gardeRetourArriereV1_(session,joueur){
    const at=Number(joueur&&joueur.__serveurAtV1);
    if(!(at>0))return {perimee:false};
    if(gardeRetourArriereBaseV1.cle!==session){gardeRetourArriereBaseV1.cle=session;gardeRetourArriereBaseV1.at=0;gardeRetourArriereBaseV1.joueur=null;}
    const g=gardeRetourArriereBaseV1;
    if(g.joueur&&g.joueur!==joueur&&at<g.at){
      g.ignorees+=1;
      return {perimee:true,joueur:g.joueur,retardMs:Math.round(g.at-at)};
    }
    if(g.joueur&&g.joueur!==joueur)detecterRecul_(g.joueur,joueur,at-g.at);
    g.at=Math.max(g.at,at);
    g.joueur=joueur;
    return {perimee:false};
  }
  window.__SOREAL_IDLE_GARDE_RETOUR_V1__=function(){return {ignorees:gardeRetourArriereBaseV1.ignorees,dernierAt:gardeRetourArriereBaseV1.at};};
  window.__SOREAL_IDLE_DERNIER_ETAT_SERVEUR_V1__=function(){return gardeRetourArriereBaseV1.joueur;};

  /* lignes : tableaux omis ligne par ligne (voir idle-catalogues-v1.js) -- { chemin: { hashes:[…], textes:{ empreinte: texte JSON de la ligne } } }. */
  const cataloguesV1={dernier:{},valeurs:{},lignes:{}};

  function lireCheminV1(objet,chemin){
    let courant=objet;
    const parties=chemin.split(".");
    for(let i=0;i<parties.length;i+=1){
      if(!courant||typeof courant!=="object")return undefined;
      courant=courant[parties[i]];
    }
    return courant;
  }

  function poserCheminV1(objet,chemin,valeur){
    const parties=chemin.split(".");
    const feuille=parties.pop();
    let courant=objet;
    for(let i=0;i<parties.length;i+=1){
      if(!courant||typeof courant!=="object")return false;
      courant=courant[parties[i]];
    }
    if(!courant||typeof courant!=="object")return false;
    courant[feuille]=valeur;
    return true;
  }

  /* Empreintes envoyées au serveur : la dernière version connue de chaque pièce. */
  function hashesCataloguesV1(){
    const h=Object.assign({},cataloguesV1.dernier);
    Object.keys(cataloguesV1.lignes).forEach(function(chemin){h[chemin+"[]"]=cataloguesV1.lignes[chemin].hashes.join(",");});
    return h;
  }

  /* Remet en place les pièces omises ; renvoie false si une pièce annoncée comme déjà connue manque (le pont redemande alors une réponse complète). */
  function restaurerCataloguesV1(data){
    if(!data||typeof data!=="object"||!data.joueur||typeof data.joueur!=="object")return true;
    const hashes=data.cataloguesHashes;
    if(!hashes||typeof hashes!=="object")return true;
    const omis=Array.isArray(data.cataloguesOmis)?data.cataloguesOmis:[];
    /* Pièces d'état : copie TEXTE gardée, copie neuve rendue (le jeu les modifie sur place ; voir idle-catalogues-v1.js). */
    const vifs=Array.isArray(data.cataloguesVifs)?data.cataloguesVifs:[];
    let complet=true;
    const gardes=data.tableauxGardes&&typeof data.tableauxGardes==="object"?data.tableauxGardes:{};
    Object.keys(hashes).forEach(function(chemin){
      const h=hashes[chemin];
      /* Tableau ligne par ligne : « <chemin>[] » = empreintes des lignes ; les lignes absentes de `tableauxGardes` viennent de la mémoire du pont. */
      if(chemin.slice(-2)==="[]"){
        const base=chemin.slice(0,-2);
        const tableau=lireCheminV1(data.joueur,base);
        const empreintes=String(h).split(",");
        if(!Array.isArray(tableau))return;
        const memoire=cataloguesV1.lignes[base]||{hashes:[],textes:{},precedents:{}};
        const envoyees=Array.isArray(gardes[base])?new Set(gardes[base]):null;
        const textes={};
        let ok=true;
        for(let i=0;i<tableau.length;i+=1){
          const e=empreintes[i];
          if(envoyees&&!envoyees.has(i)){
            /* Deux générations gardées : une réponse calculée sur d'anciennes empreintes (appels simultanés) retrouve ses lignes. */
            const texte=Object.prototype.hasOwnProperty.call(memoire.textes,e)?memoire.textes[e]:(memoire.precedents&&Object.prototype.hasOwnProperty.call(memoire.precedents,e)?memoire.precedents[e]:undefined);
            if(texte===undefined){ok=false;break;}
            tableau[i]=JSON.parse(texte);
            textes[e]=texte;
          }else{
            textes[e]=JSON.stringify(tableau[i]);
          }
        }
        if(!ok){complet=false;delete cataloguesV1.lignes[base];return;}
        cataloguesV1.lignes[base]={hashes:empreintes,textes:textes,precedents:memoire.textes};
        return;
      }
      const vif=vifs.indexOf(chemin)!==-1;
      const versions=cataloguesV1.valeurs[chemin]||(cataloguesV1.valeurs[chemin]={});
      if(omis.indexOf(chemin)!==-1){
        if(Object.prototype.hasOwnProperty.call(versions,h)&&poserCheminV1(data.joueur,chemin,vif?JSON.parse(versions[h]):versions[h]))return;
        complet=false;
        delete cataloguesV1.dernier[chemin];
        return;
      }
      const valeur=lireCheminV1(data.joueur,chemin);
      if(valeur===undefined)return;
      versions[h]=vif?JSON.stringify(valeur):valeur;
      cataloguesV1.dernier[chemin]=h;
      const cles=Object.keys(versions);
      if(cles.length>2)delete versions[cles[0]];
    });
    return complet;
  }

  async function callIdleV1(operation,args,sansAllegement){
    const session=sessionV1();
    if(!session)throw new Error("SESSION_EXPIREE");

    const liste=Array.isArray(args)?args.slice():[];
    const firstArg=typeof liste[0]==="string"?String(liste[0]||"").trim():"";
    if(!firstArg)liste.unshift(session);

    try{
      const data=await jsonFetchRepriseV1("/api/v1/call",{
        method:"POST",
        headers:{
          accept:"application/json",
          "content-type":"application/json",
          authorization:"Bearer "+session
        },
        body:JSON.stringify({
          operation:String(operation||""),
          args:liste,
          catalogHashes:sansAllegement?undefined:hashesCataloguesV1(),
          /* Langue des items et des textes (Réglages) : « fr » par défaut, « en » = originaux. */
          langue:langueIdleV1()
        })
      },Boolean(OPERATIONS_LECTURE_V1[String(operation||"")]));
      if(!restaurerCataloguesV1(data)&&!sansAllegement){
        /* Pièce annoncée comme déjà connue mais perdue (cas rarissime : réponse très en retard) : on la reprend dans un état complet, JAMAIS en rejouant l'action. */
        try{
          const complet=await callIdleV1("obtenirEtatSorealIdle",[],true);
          (Array.isArray(data.cataloguesOmis)?data.cataloguesOmis:[]).forEach(function(chemin){
            const v=lireCheminV1(complet&&complet.joueur,chemin);
            if(v!==undefined)poserCheminV1(data.joueur,chemin,v);
          });
        }catch(_){}
      }
      /* Instant de réception (horloge locale) : les chronos partent de là, moins un demi aller-retour (voir meta-progression : ancreSnapshotIdleV1_). */
      if(data&&data.joueur&&typeof data.joueur==="object"){
        const garde=gardeRetourArriereV1_(session,data.joueur);
        if(garde.perimee){
          /* Réponse calculée AVANT un état déjà reçu : on rend au jeu le dernier état connu, jamais l'ancien. */
          try{window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler("reponse_perimee_ignoree",String(operation)+" de "+garde.retardMs+" ms de retard");}catch(_){}
          data.joueur=garde.joueur;
        }else{
          data.joueur.__recuPerfV1=calerRecuPerfV1_(data.joueur,performance.now(),Date.now());
        }
      }
      return data;
    }catch(error){
      if(error&&error.status===401)saveSessionV1("");
      throw error;
    }
  }

  /*
   * Lectures (état, synchro, battement) : délai court (15 s) et UNE reprise après 0,4 s (Norman, 2026-10-03 : audit réactivité). Avant : une requête pendante bloquait toutes les synchros
   * jusqu'à 45 s, et un « serveur occupé » (retryable) était une erreur définitive. Jamais pour une action de jeu : la rejouer pourrait l'appliquer deux fois.
   */
  const OPERATIONS_LECTURE_V1={obtenirEtatSorealIdle:1,synchroniserSorealIdle:1,battementSorealIdle:1};
  async function jsonFetchRepriseV1(url,options,lecture){
    if(!lecture)return jsonFetchV1(url,options);
    try{
      return await jsonFetchV1(url,options,15000);
    }catch(erreur){
      if(erreur&&(erreur.status===400||erreur.status===401||erreur.status===403))throw erreur;
      await new Promise(function(r){setTimeout(r,400);});
      return jsonFetchV1(url,options,15000);
    }
  }

  function createRunnerV1(){
    let success=null;
    let failure=null;
    const runner=new Proxy({},{
      get(_target,prop){
        if(prop==="withSuccessHandler"){
          return function(fn){success=typeof fn==="function"?fn:null;return runner;};
        }
        if(prop==="withFailureHandler"){
          return function(fn){failure=typeof fn==="function"?fn:null;return runner;};
        }
        if(prop==="then")return undefined;
        return function(...args){
          Promise.resolve()
            .then(function(){return callIdleV1(String(prop),args);})
            .then(function(value){if(success)success(value);})
            .catch(function(error){
              if(failure){failure(error);return;}
              console.error(error);
            });
          return runner;
        };
      }
    });
    return runner;
  }

  if(!window.google)window.google={};
  window.google.script=window.google.script||{};
  Object.defineProperty(window.google.script,"run",{
    configurable:true,
    enumerable:true,
    get:createRunnerV1
  });

  window.__SOREAL_IDLE_CALL_V1__=callIdleV1;

  /*
   * Connexion par Google (2026-09-26, Norman : « la personne doit se connecter avec son gmail »). Le bouton Google (Google Identity Services) renvoie un jeton
   * d'identité que le serveur vérifie (/api/v1/google-login) ; il n'est jamais cru sur parole. L'identifiant client vient de /api/v1/bootstrap : vide = pas de
   * bouton (le jeu reste alors ouvert uniquement depuis APP / TV).
   */
  function carteV1(){return document.querySelector(".soreal-idle-loading-card");}

  function masquerProgressionV1(){
    ["standaloneProgress","standalonePercent"].forEach(function(id){
      const el=document.getElementById(id);
      if(!el)return;
      el.style.display="none";
      if(el.parentNode&&el.parentNode.classList&&el.parentNode.classList.contains("soreal-idle-loading-track"))el.parentNode.style.display="none";
    });
  }

  function zoneConnexionV1(){
    let zone=document.getElementById("standaloneLogin");
    if(!zone){
      zone=document.createElement("div");
      zone.id="standaloneLogin";
      zone.style.cssText="margin:14px 8px 4px;text-align:center;font-size:13px;color:#cfe0ff";
      const carte=carteV1();
      if(carte)carte.appendChild(zone);
    }
    return zone;
  }

  function chargerGoogleV1(){
    return new Promise(function(resolve,reject){
      if(window.google&&window.google.accounts&&window.google.accounts.id){resolve();return;}
      const script=document.createElement("script");
      script.src="https://accounts.google.com/gsi/client";
      script.async=true;
      script.onload=function(){resolve();};
      script.onerror=function(){reject(new Error("Impossible de charger la connexion Google."));};
      document.head.appendChild(script);
    });
  }

  async function connexionGoogleV1(credential){
    statusV1("Connexion…",false);
    const data=await jsonFetchV1("/api/v1/google-login",{
      method:"POST",
      headers:{accept:"application/json","content-type":"application/json"},
      body:JSON.stringify({credential:String(credential||"")})
    });
    if(!data.sessionToken)throw new Error("Session SOREAL IDLE invalide.");
    saveGoogleSessionV1(data.sessionToken,data.expiresAt);
    return data;
  }

  async function deconnexionV1(){
    const session=sessionV1();
    try{
      if(session)await fetch("/api/v1/logout",{method:"POST",headers:{authorization:"Bearer "+session}});
    }catch(_){}
    saveSessionV1("");
    try{if(window.google&&window.google.accounts&&window.google.accounts.id)window.google.accounts.id.disableAutoSelect();}catch(_){}
    location.reload();
  }

  async function afficherConnexionGoogleV1(clientId,message){
    masquerProgressionV1();
    statusV1(message||"",Boolean(message&&/pas encore|impossible|refus/i.test(message)));
    const zone=zoneConnexionV1();
    zone.innerHTML='<div style="margin-bottom:10px">Connecte-toi avec ton compte Google pour jouer.</div><div id="standaloneGoogleBouton" style="display:flex;justify-content:center;min-height:44px"></div><div style="margin-top:12px;font-size:11px"><a href="/confidentialite" target="_blank" rel="noopener" style="color:#7fb2ff">Politique de confidentialité</a></div>';
    /* Google Identity Services complète window.google ; le pont Apps Script (google.script.run) doit y rester. */
    const pontScript=Object.getOwnPropertyDescriptor(window.google.script,"run");
    const espace=window.google;
    try{
      await chargerGoogleV1();
    }catch(error){
      statusV1(error.message,true);
      return;
    }
    if(window.google!==espace){
      try{window.google.script=espace.script;}catch(_){}
    }
    if(!Object.getOwnPropertyDescriptor(window.google.script||{},"run")&&pontScript){
      Object.defineProperty(window.google.script,"run",pontScript);
    }
    window.google.accounts.id.initialize({
      client_id:clientId,
      callback:function(reponse){
        connexionGoogleV1(reponse&&reponse.credential).then(function(){
          startV1();
        }).catch(function(error){
          statusV1(error&&error.message?error.message:"Connexion Google impossible.",true);
        });
      },
      auto_select:false,
      cancel_on_tap_outside:true
    });
    window.google.accounts.id.renderButton(document.getElementById("standaloneGoogleBouton"),{theme:"filled_blue",size:"large",text:"signin_with",shape:"pill",locale:"fr"});
  }

  async function clientIdGoogleV1(){
    try{
      const data=await jsonFetchV1("/api/v1/bootstrap",{method:"GET",headers:{accept:"application/json"}});
      return String(data&&data.googleClientId||"").trim();
    }catch(_){return "";}
  }

  /* Un joueur connecté par Google n'a accès au jeu que si l'administrateur a ouvert l'accès public : sinon message clair + changer de compte. */
  async function verifierAccesGoogleV1(){
    let acces=null;
    try{acces=await callIdleV1("obtenirAccesSorealIdle",[]);}catch(_){acces=null;}
    if(acces&&acces.autorise!==false)return true;
    /* Session expirée ou révoquée : retour à l'écran de connexion. */
    if(!sessionV1()){startV1();return false;}
    masquerProgressionV1();
    statusV1("SOREAL IDLE n'est pas encore ouvert au public. Reviens bientôt !",true);
    const zone=zoneConnexionV1();
    zone.innerHTML='<button type="button" id="standaloneChangerCompte" style="padding:9px 16px;border-radius:999px;border:1px solid rgba(129,176,255,.5);background:#12213f;color:#dbe8ff;font-weight:800;cursor:pointer">Changer de compte</button>';
    const bouton=document.getElementById("standaloneChangerCompte");
    if(bouton)bouton.addEventListener("click",deconnexionV1);
    return false;
  }

  async function startV1(){
    statusV1("Connexion à SOREAL IDLE…",false);
    try{
      const ticket=ticketFromHashV1();
      if(ticket){
        await consumeLaunchTicketV1(ticket);
        clearHashV1();
      }else{
        saveSessionV1(sessionV1());
      }

      if(!sessionV1()){
        const clientId=await clientIdGoogleV1();
        if(clientId){
          await afficherConnexionGoogleV1(clientId,"");
        }else{
          /* Pas de connexion Google configurée : plus de fausse barre de chargement bloquée à 94 %, un message clair. */
          masquerProgressionV1();
          statusV1("La connexion directe n’est pas encore ouverte. Ouvre SOREAL IDLE depuis SOREAL APP ou SOREAL TV.",true);
        }
        return;
      }

      /* Session Google conservée (ni ticket APP / TV) : vérifier tout de suite que le jeu est ouvert à cette personne. */
      if(!ticket&&googleSessionStockeeV1()&&sessionV1()===googleSessionStockeeV1()){
        if(!(await verifierAccesGoogleV1()))return;
      }

      window.PAGE_ACTIVE="idle";
      if(!window.SOREAL_USER)window.SOREAL_USER={};

      if(typeof window.__ouvrirSorealIdleModuleV1__!=="function"){
        throw new Error("Interface SOREAL IDLE non chargée.");
      }

      window.__ouvrirSorealIdleModuleV1__();
    }catch(error){
      statusV1(error&&error.message?error.message:String(error||"Erreur SOREAL IDLE"),true);
    }
  }

  window.__SOREAL_IDLE_STANDALONE_V1__={
    start:startV1,
    call:callIdleV1,
    session:sessionV1,
    logout:deconnexionV1,
    estSessionGoogle:function(){return Boolean(googleSessionStockeeV1())&&sessionV1()===googleSessionStockeeV1();}
  };
})();
