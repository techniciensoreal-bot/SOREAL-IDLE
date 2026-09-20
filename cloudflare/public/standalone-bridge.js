(function(){
  "use strict";

  const SESSION_KEY="soreal_idle_session_v1";
  const TIMEOUT_MS=15000;

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

  function sessionV1(){
    try{return String(sessionStorage.getItem(SESSION_KEY)||"").trim();}catch(_){return "";}
  }

  function saveSessionV1(value){
    const token=String(value||"").trim();
    try{
      if(token)sessionStorage.setItem(SESSION_KEY,token);
      else sessionStorage.removeItem(SESSION_KEY);
    }catch(_){}
    window.SOREAL_SESSION=token;
    return token;
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
        statusV1("Ouvre SOREAL IDLE depuis SOREAL APP ou SOREAL TV.",true);
        return;
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
    session:sessionV1
  };
})();
