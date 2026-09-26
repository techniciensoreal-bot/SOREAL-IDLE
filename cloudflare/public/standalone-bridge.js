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

  function ticketFromHashV1(){
    try{
      const raw=String(location.hash||"").replace(/^#/,"");
      if(!raw)return "";
      return String(new URLSearchParams(raw).get("ticket")||"").trim();
    }catch(_){return "";}
  }

  function clearHashV1(){
    try{
      history.replaceState(null,"",location.pathname+location.search);
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

  async function jsonFetchV1(url, options){
    const controller=typeof AbortController==="function"?new AbortController():null;
    const timer=setTimeout(function(){try{controller&&controller.abort();}catch(_){}},TIMEOUT_MS);
    try{
      const response=await fetch(url,Object.assign({},options||{},{
        cache:"no-store",
        signal:controller?controller.signal:undefined
      }));
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

  async function callIdleV1(operation,args){
    const session=sessionV1();
    if(!session)throw new Error("SESSION_EXPIREE");

    const liste=Array.isArray(args)?args.slice():[];
    const firstArg=typeof liste[0]==="string"?String(liste[0]||"").trim():"";
    if(!firstArg)liste.unshift(session);

    try{
      return await jsonFetchV1("/api/v1/call",{
        method:"POST",
        headers:{
          accept:"application/json",
          "content-type":"application/json",
          authorization:"Bearer "+session
        },
        body:JSON.stringify({
          operation:String(operation||""),
          args:liste
        })
      });
    }catch(error){
      if(error&&error.status===401)saveSessionV1("");
      throw error;
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
    zone.innerHTML='<div style="margin-bottom:10px">Connecte-toi avec ton compte Google pour jouer.</div><div id="standaloneGoogleBouton" style="display:flex;justify-content:center;min-height:44px"></div>';
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
          statusV1("Ouvre SOREAL IDLE depuis SOREAL APP ou SOREAL TV.",true);
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
