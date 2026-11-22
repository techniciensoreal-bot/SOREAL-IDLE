/*
 * SOREAL IDLE — synchronisation des SAUVEGARDES de ScummVM (menu « Énigmes ») entre les appareils du compte (Norman, 2026-11-22 : « je vais jouer sur mon téléphone et avancer dans le jeu ;
 * je dois pouvoir reprendre au même endroit sur le PC plus tard ou au boulot »).
 * Expose window.__SOREAL_IDLE_SCUMMVM_SYNC_V1__ = { reprendre(jeu), suivre(jeu), forcer(), ... }. Le serveur : src/idle-scummvm-sauvegardes-v1.js, route POST /api/v1/scummvm-sauvegardes (jeton de session).
 *
 * Les sauvegardes de ScummVM vivent dans IndexedDB '/home/web_user' (IDBFS d'emscripten : table FILE_DATA, clés '/home/web_user/saves/<cible>.s00'…, valeur { timestamp: Date, mode, contents: Uint8Array }).
 *
 * HORLOGE : chaque fichier a un `maj` en millisecondes à l'HEURE DU SERVEUR. Un fichier local a pour `maj` son timestamp d'IDBFS (heure de l'appareil) + l'écart mesuré
 * (window.__SOREAL_IDLE_ECART_V1__, standalone-bridge.js : serveur - appareil ; 0 s'il n'est pas connu). Un fichier repris est écrit avec le timestamp (maj - écart) : la comparaison revient au même
 * chiffre. Deux dates à moins de 1 s l'une de l'autre sont égales (l'écart se remesure).
 *
 * CRÉATION DE LA BASE (décision documentée) : si la base '/home/web_user' n'existe pas (appareil neuf : le cas « jouer sur le téléphone puis reprendre sur le PC »), elle est CRÉÉE comme IDBFS le fait
 * (version 21 = IDBFS.DB_VERSION de scummvm.js, une table FILE_DATA sans clé interne, index 'timestamp' non unique) et seulement s'il y a une sauvegarde distante à y mettre ; avec le dossier 'saves'
 * (mode 16877) car IDBFS ne crée pas les dossiers parents d'un fichier. Au lancement, IDBFS ouvre la même version : aucune mise à niveau, il relit ces entrées (syncfs populate). Si la base existe, elle n'est jamais recréée.
 *
 * RÈGLES : jamais d'erreur visible ni de blocage (3 s d'attente au plus avant le lancement) ; la progression LOCALE n'est jamais écrasée par une plus ancienne ; un seul minuteur (setTimeout replanifié, 20 s) ;
 * un envoi à la fois, seulement les fichiers changés ; si le serveur a une version que cet appareil n'a pas vue (un autre appareil a joué), RIEN n'est envoyé et un message le dit ; « Reprendre ici » force l'envoi.
 * Aucun contenu de sauvegarde n'est journalisé. Règle n°6 : rien de plus à garder dans le navigateur (les données voyagent par le serveur).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SCUMMVM_SYNC_V1__)return;

  const BASE_IDB='/home/web_user',TABLE='FILE_DATA',VERSION_IDB=21,DOSSIER=BASE_IDB+'/saves/';
  const ROUTE='/api/v1/scummvm-sauvegardes';
  const ATTENTE_REPRISE_MS=3000,PERIODE_MS=20000,TOLERANCE_MS=1000;
  const MODE_FICHIER=33206,MODE_DOSSIER=16877;
  const TEXTE_CONFLIT='Partie reprise sur un autre appareil : recharge pour la retrouver.';
  const TEXTE_BOUTON='Reprendre ici';

  const etat={jeu:null,cible:'',connu:{},dernierTs:{},lu:false,conflit:false,force:false,enCours:false,minuteur:0,msg:null};

  /* --- accès au serveur (comme modules/profil-badavatar-v1.js) --- */
  function acces(){var a=window.__SOREAL_IDLE_APK_CONNEXION_V1__;try{return a&&a.acces?a.acces():null;}catch(_e){return null;}}
  function jetonLocal(){
    try{const s=window.sessionStorage.getItem('soreal_idle_session_v1');if(s)return String(s);}catch(_e){}
    try{const g=JSON.parse(window.localStorage.getItem('soreal_idle_google_session_v1')||'null');if(g&&g.token)return String(g.token);}catch(_e){}
    try{return String(window.localStorage.getItem('horsligne_soreal_jeton_v1')||'');}catch(_e){return '';}
  }
  function appeler(corps,keepalive){
    const a=acces(),t=a?a.jeton:jetonLocal();
    if(!t)return Promise.resolve({ok:false});
    const opts={method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+t},body:JSON.stringify(corps)};
    if(keepalive)opts.keepalive=true;
    return window.fetch((a?a.base:'')+ROUTE,opts).then(function(r){return r.json().catch(function(){return {ok:false};});}).catch(function(){return {ok:false};});
  }
  function ecart(){
    try{const f=window.__SOREAL_IDLE_ECART_V1__;const v=typeof f==='function'?Number(f()):0;return Number.isFinite(v)?v:0;}catch(_e){return 0;}
  }

  /* --- noms de fichiers du jeu --- */
  function nomValide(nom,cible){
    if(nom==='timestamps')return true;
    return typeof nom==='string'&&nom.length===cible.length+4&&nom.slice(0,cible.length+2)===cible+'.s'&&/^[0-9]{2}$/.test(nom.slice(cible.length+2));
  }

  /* --- IndexedDB : lecture (jamais de création), écriture (création conforme à IDBFS si besoin) --- */
  function ouvrir(creer){
    return new Promise(function(resolve){
      let fini=false;
      const fin=function(v){if(!fini){fini=true;resolve(v);}};
      try{
        if(!window.indexedDB)return fin(null);
        const req=creer?window.indexedDB.open(BASE_IDB,VERSION_IDB):window.indexedDB.open(BASE_IDB);
        req.onupgradeneeded=function(){
          if(!creer){try{req.transaction.abort();}catch(_e){}return;}   /* lecture : la base n'existe pas, ne pas la créer */
          try{
            const db=req.result;
            const s=db.objectStoreNames.contains(TABLE)?req.transaction.objectStore(TABLE):db.createObjectStore(TABLE);
            if(!s.indexNames.contains('timestamp'))s.createIndex('timestamp','timestamp',{unique:false});
          }catch(_e){}
        };
        req.onerror=function(){fin(null);};
        req.onblocked=function(){fin(null);};
        req.onsuccess=function(){
          const db=req.result;
          if(!db.objectStoreNames.contains(TABLE)){try{db.close();}catch(_e){}return fin(null);}
          fin(db);
        };
      }catch(_e){fin(null);}
    });
  }
  /* Map nom -> { ts, octets, mode } des fichiers de saves/ du jeu ; vide si pas de base. */
  function lireLocaux(cible){
    return ouvrir(false).then(function(db){
      const sortie=new Map();
      if(!db)return sortie;
      return new Promise(function(resolve){
        const clore=function(){try{db.close();}catch(_e){}resolve(sortie);};
        try{
          const cur=db.transaction(TABLE,'readonly').objectStore(TABLE).openCursor(window.IDBKeyRange.bound(DOSSIER,DOSSIER+'￿'));
          cur.onerror=clore;
          cur.onsuccess=function(){
            const c=cur.result;
            if(!c)return clore();
            const nom=String(c.key).slice(DOSSIER.length);
            const v=c.value;
            if(nomValide(nom,cible)&&v&&v.contents)sortie.set(nom,{ts:v.timestamp?+new Date(v.timestamp):0,octets:v.contents instanceof Uint8Array?v.contents:new Uint8Array(v.contents),mode:v.mode||MODE_FICHIER});
            c.continue();
          };
        }catch(_e){clore();}
      });
    });
  }
  /* Écrit les fichiers [{nom, ts, octets}] ; crée la base si elle n'existe pas. Résout true si tout est écrit. */
  function ecrireLocaux(liste){
    return ouvrir(false).then(function(db){return db||ouvrir(true);}).then(function(db){
      if(!db)return false;
      return new Promise(function(resolve){
        let ok=false;
        const clore=function(){try{db.close();}catch(_e){}resolve(ok);};
        try{
          const tx=db.transaction(TABLE,'readwrite');
          const st=tx.objectStore(TABLE);
          tx.oncomplete=function(){ok=true;clore();};
          tx.onerror=tx.onabort=clore;
          const dos=st.get(DOSSIER.slice(0,-1));
          dos.onsuccess=function(){
            if(!dos.result)st.put({timestamp:new Date(),mode:MODE_DOSSIER},DOSSIER.slice(0,-1));
            liste.forEach(function(f){
              const ex=st.get(DOSSIER+f.nom);   /* le mode d'une entrée existante est gardé */
              ex.onsuccess=function(){st.put({timestamp:new Date(f.ts),mode:(ex.result&&ex.result.mode)||MODE_FICHIER,contents:f.octets},DOSSIER+f.nom);};
            });
          };
        }catch(_e){clore();}
      });
    });
  }

  function versBase64(octets){
    let s='';
    for(let i=0;i<octets.length;i+=8192)s+=String.fromCharCode.apply(null,octets.subarray(i,i+8192));
    return window.btoa(s);
  }
  function depuisBase64(t){
    const s=window.atob(String(t||''));
    const o=new Uint8Array(s.length);
    for(let i=0;i<s.length;i++)o[i]=s.charCodeAt(i);
    return o;
  }
  function majLocal(f){return Math.round(f.ts+ecart());}

  /* --- reprise avant le lancement --- */
  function reprendreVraiment(jeu,essai){
    const cible=String(jeu.cible||''),id=String(jeu.id||'');
    return appeler({action:'lire',jeu:id}).then(function(r){
      if(essai.abandon||!r||r.ok!==true||!Array.isArray(r.fichiers))return false;
      const distants=r.fichiers.filter(function(f){return f&&nomValide(f.nom,cible)&&Number.isInteger(f.maj)&&typeof f.donnees==='string';});
      return lireLocaux(cible).then(function(locaux){
        if(essai.abandon)return false;
        const aEcrire=[];
        distants.forEach(function(d){
          const l=locaux.get(d.nom);
          const lm=l?majLocal(l):0;
          etat.connu[d.nom]=d.maj;
          if(d.maj>lm+TOLERANCE_MS){
            let octets=null;try{octets=depuisBase64(d.donnees);}catch(_e){octets=null;}
            if(octets&&octets.length)aEcrire.push({nom:d.nom,ts:d.maj-ecart(),octets:octets});
          }else if(l&&Math.abs(d.maj-lm)<=TOLERANCE_MS)etat.dernierTs[d.nom]=l.ts;   /* déjà identique : rien à renvoyer */
          /* sinon : le local est plus récent, il est conservé et sera envoyé (dernierTs non renseigné) */
        });
        if(!aEcrire.length)return true;
        if(essai.abandon)return false;
        return ecrireLocaux(aEcrire).then(function(ok){
          if(essai.abandon)return false;
          if(ok)aEcrire.forEach(function(f){etat.dernierTs[f.nom]=f.ts;});
          else aEcrire.forEach(function(f){delete etat.connu[f.nom];});
          return true;
        });
      });
    }).then(function(lu){if(!essai.abandon)etat.lu=Boolean(lu);return lu;});
  }
  /* Promesse qui se résout toujours : à la reprise ou après 3 s au plus. */
  function reprendre(jeu){
    return new Promise(function(resolve){
      let fini=false;
      const fin=function(){if(!fini){fini=true;resolve();}};
      try{
        if(!jeu||!jeu.id||!jeu.cible)return fin();
        etat.jeu=jeu;etat.cible=String(jeu.cible);etat.connu={};etat.dernierTs={};etat.lu=false;
        const essai={abandon:false};
        /* après 3 s le jeu démarre : plus aucune écriture dans la base (elle ne serait pas vue par le moteur) ; le suivi relira le serveur et signalera un conflit s'il a mieux */
        window.setTimeout(function(){if(!fini){essai.abandon=true;etat.connu={};etat.dernierTs={};etat.lu=false;}fin();},ATTENTE_REPRISE_MS);
        reprendreVraiment(jeu,essai).then(fin,fin);
      }catch(_e){fin();}
    });
  }

  /* --- suivi : un envoi des fichiers changés toutes les 20 s, un dernier à la fermeture --- */
  function planifier(){
    if(etat.minuteur)window.clearTimeout(etat.minuteur);
    etat.minuteur=window.setTimeout(function(){etat.minuteur=0;tour();},PERIODE_MS);
  }
  function messageConflit(oui){
    try{
      if(!oui){if(etat.msg&&etat.msg.parentNode)etat.msg.parentNode.removeChild(etat.msg);etat.msg=null;return;}
      if(etat.msg)return;
      const d=document.createElement('div');
      d.className='scv-sync-msg';d.setAttribute('role','status');d.setAttribute('data-morph-garder','');
      d.style.cssText='position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483000;max-width:92vw;padding:8px 12px;border-radius:8px;background:#1b2330;color:#fff;font:600 13px/1.3 system-ui,sans-serif;display:flex;gap:10px;align-items:center;box-shadow:0 2px 10px rgba(0,0,0,.5)';
      const t=document.createElement('span');t.textContent=TEXTE_CONFLIT;
      const b=document.createElement('button');b.type='button';b.textContent=TEXTE_BOUTON;
      b.style.cssText='font:inherit;padding:4px 10px;border-radius:6px;border:0;cursor:pointer';
      b.addEventListener('click',function(){forcer();});
      d.appendChild(t);d.appendChild(b);document.body.appendChild(d);etat.msg=d;
    }catch(_e){}
  }
  function signalerConflit(){etat.conflit=true;if(etat.minuteur){window.clearTimeout(etat.minuteur);etat.minuteur=0;}messageConflit(true);}

  function verifierDistant(locaux){
    return appeler({action:'lire',jeu:String(etat.jeu.id)}).then(function(r){
      if(!r||r.ok!==true||!Array.isArray(r.fichiers))return false;
      r.fichiers.forEach(function(d){
        if(!d||!nomValide(d.nom,etat.cible)||!Number.isInteger(d.maj))return;
        const l=locaux.get(d.nom);
        if(!l||d.maj>majLocal(l)+TOLERANCE_MS){signalerConflit();return;}
        etat.connu[d.nom]=d.maj;
        if(Math.abs(d.maj-majLocal(l))<=TOLERANCE_MS)etat.dernierTs[d.nom]=l.ts;
      });
      etat.lu=true;
      return true;
    });
  }
  function aEnvoyer(locaux,seulement){
    const l=[];
    locaux.forEach(function(f,nom){
      if(seulement&&nom!==seulement)return;
      if(etat.dernierTs[nom]===f.ts)return;
      l.push({nom:nom,f:f});
    });
    return l;
  }
  function corpsEnvoi(liste,force){
    return {action:'ecrire',jeu:String(etat.jeu.id),force:force?true:undefined,fichiers:liste.map(function(x){
      const e={nom:x.nom,maj:majLocal(x.f),donnees:versBase64(x.f.octets)};
      if(!force)e.base=Number.isInteger(etat.connu[x.nom])?etat.connu[x.nom]:0;
      return e;
    })};
  }
  function appliquerReponse(liste,r){
    if(!r||r.ok!==true)return false;
    if(Array.isArray(r.conflits)&&r.conflits.length){signalerConflit();return true;}
    const serveur={};
    (Array.isArray(r.fichiers)?r.fichiers:[]).forEach(function(f){if(f&&f.nom)serveur[f.nom]=f.maj;});
    liste.forEach(function(x){
      etat.dernierTs[x.nom]=x.f.ts;
      etat.connu[x.nom]=Number.isInteger(serveur[x.nom])?serveur[x.nom]:majLocal(x.f);
    });
    return true;
  }
  function tour(){
    if(!etat.jeu||etat.enCours)return;
    if(etat.conflit&&!etat.force)return;   /* rien n'est envoyé tant que l'appareil n'a pas repris ou forcé ; le minuteur s'arrête */
    etat.enCours=true;
    const fini=function(){etat.enCours=false;planifier();};
    try{
      lireLocaux(etat.cible).then(function(locaux){
        const avant=etat.lu?Promise.resolve(true):(locaux.size?verifierDistant(locaux):Promise.resolve(false));
        return avant.then(function(ok){
          if(!ok||(etat.conflit&&!etat.force))return;
          const liste=aEnvoyer(locaux);
          if(!liste.length)return;
          const force=etat.force;
          return appeler(corpsEnvoi(liste,force)).then(function(r){
            if(appliquerReponse(liste,r)&&force&&!etat.conflit)etat.force=false;
          });
        });
      }).then(function(){
        etat.enCours=false;
        if(!(etat.conflit&&!etat.force))planifier();
      },fini);
    }catch(_e){fini();}
  }
  /* « Reprendre ici » : cet appareil devient la référence ; tous ses fichiers sont envoyés en remplacement. */
  function forcer(){
    if(!etat.jeu)return;
    etat.force=true;etat.conflit=false;etat.lu=true;etat.dernierTs={};
    messageConflit(false);
    if(etat.minuteur)window.clearTimeout(etat.minuteur);
    etat.minuteur=0;
    tour();
  }
  /* Fermeture de la page : seulement l'autosave, requête keepalive (la page ne l'attend pas). */
  function envoiFinal(){
    try{
      if(!etat.jeu||!etat.lu||(etat.conflit&&!etat.force))return;
      lireLocaux(etat.cible).then(function(locaux){
        const liste=aEnvoyer(locaux,etat.cible+'.s00');
        if(!liste.length)return;
        const body=corpsEnvoi(liste,etat.force);
        appeler(body,true).then(function(r){appliquerReponse(liste,r);});
      });
    }catch(_e){}
  }
  window.addEventListener('pagehide',envoiFinal);
  document.addEventListener('visibilitychange',function(){try{if(document.visibilityState==='hidden')envoiFinal();}catch(_e){}});

  function suivre(jeu){
    try{
      if(!jeu||!jeu.id||!jeu.cible)return;
      if(!etat.jeu||etat.jeu.id!==jeu.id){etat.jeu=jeu;etat.cible=String(jeu.cible);}
      planifier();
    }catch(_e){}
  }
  window.__SOREAL_IDLE_SCUMMVM_SYNC_V1__={reprendre:reprendre,suivre:suivre,forcer:forcer,tour:tour,etat:etat,nomValide:nomValide,TEXTE_CONFLIT:TEXTE_CONFLIT,TEXTE_BOUTON:TEXTE_BOUTON};
})();
