/*
 * SOREAL IDLE — AP par PROGRÈS dans le jeu ScummVM du menu « Énigmes » (Norman, 2026-11-22). Côté client : lit la sauvegarde automatique du jeu,
 * compte les unités de progrès atteintes (jamais redescendantes) et envoie l'action `scummvmProgres` quand ce nombre augmente.
 * Expose window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__ = { demarrer(jeu), verifier(), ... }. Le lecteur de sauvegarde est modules/scummvm-sauvegarde-v1.js (chargé avant).
 *
 * ScummVM écrit un autosave (créneau 0) dans IndexedDB `/home/web_user`, table FILE_DATA, clé `/home/web_user/saves/<cible>.s00` : même origine que la page, donc lisible ici.
 * Règle n°4 (redessin invisible) : un seul minuteur (30 s), aucune écriture dans la page, rien n'est lu dans le DOM ; l'action part par le canal ordinaire des actions.
 * Règle n°6 (compte) : mémoire « déjà vu » dans localStorage `soreal_idle_scummvm_progres_v1`, une entrée par jeu { vu: ensemble d'unités (bitset base64), envoye: nombre déjà envoyé, ts: dernière sauvegarde lue }.
 * Règle n°2 : rien n'est affiché ici ; la page montre seulement les AP déjà gagnés (jamais le plafond ni le nombre d'unités possibles).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__)return;

  const CLE='soreal_idle_scummvm_progres_v1';
  const BASE_IDB='/home/web_user';
  const TABLE_IDB='FILE_DATA';
  /* Gain d'AP COUPÉ (Norman, 2026-11-23 : « je ne veux pas le gain avant qu'on ait terminé de calculer ») : le suivi lit les sauvegardes mais n'envoie aucun crédit et ne note aucun trophée comme envoyé (ils partiront tous quand l'interrupteur passera à vrai, avec celui du moteur : idle-scummvm-progres-v1.js). */
  let AP_ACTIF=true;
  const INTERVALLE_MS=300;   /* 10 s (Norman, 2026-11-22 : un objet ramassé puis utilisé dans la minute n'était pas vu avec 30 s) ; l'autosave de ScummVM se règle par autosave_period dans scummvm.ini (la page l'écrit avant le lancement) */

  let jeu=null,minuteur=0,enCours=false,dossierJeu="";
  const CLE_JOURNAL='soreal_idle_scummvm_journal_v1';   /* journal d'étalonnage (diagnostic, jamais affiché ; exclu de la synchro du compte : prefs-compte-v1.js) */
  const JOURNAL_MAX=3000;
  /* fichiers protégés par jeton de compte (scummvm-page-v1.js expose la base courante /api/idle/scummvm/<jeton>/) */
  function baseJeux(){const f=window.__SOREAL_IDLE_SCUMMVM_BASE_V1__;return (typeof f==='function'?f():'/api/idle/scummvm/')+'jeux/';}
  const tropheesDe={};      /* id du jeu -> liste validée, null (absente ou invalide) ; undefined = pas encore essayé */
  const chargements={};     /* id du jeu -> promesse en cours */
  const profilsDe={};       /* id du jeu -> profil de lecture (pour annoter le journal) */

  function lireMemoire(){try{const v=JSON.parse(window.localStorage.getItem(CLE)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_e){return {};}}
  function ecrireMemoire(m){try{window.localStorage.setItem(CLE,JSON.stringify(m));}catch(_e){}}

  /* ensemble d'unités <-> bitset en base64 (une unité = un bit) */
  function versBase64(octets){let s='';for(let i=0;i<octets.length;i++)s+=String.fromCharCode(octets[i]);return window.btoa(s);}
  function depuisBase64(t,taille){
    const o=new Uint8Array(taille);
    try{const s=window.atob(String(t||''));for(let i=0;i<s.length&&i<taille;i++)o[i]=s.charCodeAt(i);}catch(_e){}
    return o;
  }
  function compter(octets){let n=0;for(let i=0;i<octets.length;i++){let b=octets[i];while(b){n+=b&1;b>>=1;}}return n;}

  /* Lit le fichier d'autosave dans IndexedDB ; renvoie { octets, ts } ou null (pas de base, pas de fichier). Ne crée jamais la base. */
  /* Lecture DIRECTE en mémoire du moteur (Norman, 2026-11-24 : « je veux que ce soit instantané ») : le fichier écrit par ScummVM existe dans le système de fichiers de l'iframe (même origine) dès la fin de l'autosave, bien avant son recopie dans IndexedDB. Repli : IndexedDB. */
  function lireMemoireMoteur(cible){
    try{
      const g=window.__SOREAL_IDLE_SCUMMVM_FENETRE_V1__,w=typeof g==='function'?g():null,FS=w&&w.Module&&w.Module.FS;
      if(!FS||typeof FS.readFile!=='function')return null;
      const chemin=BASE_IDB+'/saves/'+cible+'.s00';
      const st=FS.stat(chemin);
      const octets=FS.readFile(chemin);
      if(!octets||!octets.length)return null;
      return {octets:new Uint8Array(octets),ts:st&&st.mtime?+new Date(st.mtime):0};
    }catch(_e){return null;}
  }
  function lireAutosave(cible){
    const m=lireMemoireMoteur(cible);
    if(m)return Promise.resolve(m);
    return new Promise(function(resolve){
      let fini=false;
      const fin=function(v){if(!fini){fini=true;resolve(v);}};
      try{
        if(!window.indexedDB)return fin(null);
        const req=window.indexedDB.open(BASE_IDB);
        req.onupgradeneeded=function(){try{req.transaction.abort();}catch(_e){}};   /* la base n'existe pas : ne pas la créer */
        req.onerror=function(){fin(null);};
        req.onsuccess=function(){
          const db=req.result;
          try{
            if(!db.objectStoreNames.contains(TABLE_IDB)){db.close();return fin(null);}
            const q=db.transaction(TABLE_IDB,'readonly').objectStore(TABLE_IDB).get(BASE_IDB+'/saves/'+cible+'.s00');
            q.onsuccess=function(){
              const v=q.result;db.close();
              if(!v||!v.contents)return fin(null);
              fin({octets:v.contents instanceof Uint8Array?v.contents:new Uint8Array(v.contents),ts:v.timestamp?+new Date(v.timestamp):0});
            };
            q.onerror=function(){try{db.close();}catch(_e){}fin(null);};
          }catch(_e){try{db.close();}catch(_e2){}fin(null);}
        };
      }catch(_e){fin(null);}
    });
  }

  /* ---------- TROPHÉES (Norman, 2026-11-22) : liste propre à chaque jeu, `soreal-trophees.json` dans le dossier du jeu sur R2 ----------
     Format { version:1, trophees:[{ id, nom:{fr,en}, ap, objets:[…], bits:[…] }] } ; un trophée est obtenu dès qu'UN de ses objets est possédé par un acteur OU qu'UN de ses bits est à 1
     (mêmes unités que le lecteur de sauvegarde, départ de partie exclu). Fichier absent ou invalide : aucune liste (null), repli sur le comportement par unités, jamais d'erreur visible. */
  function entierPositif(v){return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>0;}
  function entierIndice(v){return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>=0;}
  function validerTrophees(d){
    try{
      if(!d||typeof d!=='object'||d.version!==1||!Array.isArray(d.trophees)||!d.trophees.length||d.trophees.length>500)return null;
      const ids={};const liste=[];
      for(let i=0;i<d.trophees.length;i++){
        const t=d.trophees[i];
        if(!t||typeof t!=='object'||typeof t.id!=='string'||!/^[a-z0-9-]{1,60}$/.test(t.id)||ids[t.id])return null;
        if(!entierPositif(t.ap)||!t.nom||typeof t.nom!=='object')return null;
        const fr=typeof t.nom.fr==='string'?t.nom.fr.trim():'',en=typeof t.nom.en==='string'?t.nom.en.trim():'';
        if(!fr||!en||fr.length>120||en.length>120)return null;
        const objets=t.objets===undefined?[]:t.objets,bits=t.bits===undefined?[]:t.bits;
        if(!Array.isArray(objets)||!Array.isArray(bits)||!objets.every(entierIndice)||!bits.every(entierIndice)||objets.length+bits.length>200)return null;
        /* nbObjets (optionnel) : trophée de COLLECTION, obtenu quand le joueur a possédé au moins N objets différents (« prendre 15 choses ») ; il peut remplacer les objets et les indicateurs */
        const nb=t.nbObjets===undefined?0:t.nbObjets;
        if(nb!==0&&!(Number.isInteger(nb)&&nb>=1&&nb<=800))return null;
        if(objets.length+bits.length===0&&nb===0)return null;
        ids[t.id]=1;
        const e={id:t.id,nom:{fr:fr,en:en},ap:t.ap,objets:objets.slice(),bits:bits.slice()};if(nb>0)e.nbObjets=nb;liste.push(e);
      }
      return liste;
    }catch(_e){return null;}
  }
  /* Trophées dont la condition est remplie par l'ensemble d'unités `vu` (bitset : objet i = unité i, bit n = unité objetsGlobaux + n), dans l'ordre de la liste. */
  function tropheesRemplis(liste,vu,profil){
    const a=function(i){return i>=0&&(i>>3)<vu.length&&(vu[i>>3]&(1<<(i&7)))!==0;};
    let nbObjetsVus=0;
    for(let i=0;i<profil.objetsGlobaux;i++)if(a(i))nbObjetsVus++;
    return (liste||[]).filter(function(t){
      return (t.nbObjets>0&&nbObjetsVus>=t.nbObjets)||t.objets.some(function(o){return o<profil.objetsGlobaux&&a(o);})||t.bits.some(function(n){return n<profil.bits&&a(profil.objetsGlobaux+n);});
    });
  }
  /* Charge la liste du jeu (une fois par jeu) : dossier de la langue d'abord, puis le dossier du catalogue. Résout toujours (liste ou null). */
  function chargerTrophees(j,dossier){
    if(!j||!j.id)return Promise.resolve(null);
    if(tropheesDe[j.id]!==undefined)return Promise.resolve(tropheesDe[j.id]);
    if(chargements[j.id])return chargements[j.id];
    const dossiers=[dossier,j.dossier].filter(function(d,i,t){return d&&t.indexOf(d)===i;}).map(function(d){return String(d).replace(/[^A-Za-z0-9._+()-]/g,'');});
    const essayer=function(k){
      if(typeof window.fetch!=='function'||k>=dossiers.length)return Promise.resolve(null);
      return window.fetch(baseJeux()+dossiers[k]+'/soreal-trophees.json').then(function(r){return r&&r.ok?r.json():null;}).catch(function(){return null;}).then(function(d){
        const l=validerTrophees(d);
        return l||essayer(k+1);
      });
    };
    chargements[j.id]=essayer(0).then(function(l){tropheesDe[j.id]=l;delete chargements[j.id];return l;});
    return chargements[j.id];
  }

  /* Journal d'étalonnage : { jeu: [{u,t}] }, une entrée par unité NOUVELLE vue par le suivi (u = numéro d'unité, t = instant en ms), plafonné à JOURNAL_MAX entrées par jeu. */
  function lireJournal(){try{const v=JSON.parse(window.localStorage.getItem(CLE_JOURNAL)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_e){return {};}}
  function noterJournal(id,nouvelles,t){
    if(!nouvelles.length)return;
    try{
      const jr=lireJournal();
      const l=Array.isArray(jr[id])?jr[id]:[];
      nouvelles.forEach(function(u){l.push({u:u,t:t});});
      jr[id]=l.length>JOURNAL_MAX?l.slice(l.length-JOURNAL_MAX):l;
      window.localStorage.setItem(CLE_JOURNAL,JSON.stringify(jr));
    }catch(_e){}
  }
  /* « Recommencer la partie » (Norman, 2026-11-23) : retire l'entrée du jeu de la mémoire « déjà vu » / trophées envoyés et du journal ; les autres jeux ne bougent pas ; un objet devenu vide retire la clé.
     Écriture seulement par localStorage.setItem / removeItem (règle n°6). La liste des trophées du jeu (donnée du catalogue, pas une progression) reste en mémoire. */
  function retirerEntree(journalOui,id){
    const cle=journalOui?CLE_JOURNAL:CLE;
    try{
      const brut=window.localStorage.getItem(cle);
      if(brut===null||brut===undefined)return;
      let v=null;try{v=JSON.parse(brut);}catch(_e){v=null;}
      if(!v||typeof v!=='object'||Array.isArray(v)||!Object.prototype.hasOwnProperty.call(v,id))return;
      delete v[id];
      const texte=JSON.stringify(v),vide=!Object.keys(v).length;
      if(journalOui){if(vide)window.localStorage.removeItem(CLE_JOURNAL);else window.localStorage.setItem(CLE_JOURNAL,texte);}
      else if(vide)window.localStorage.removeItem(CLE);else window.localStorage.setItem(CLE,texte);
    }catch(_e){}
  }
  function reinitialiser(jeuId){
    const id=String(jeuId==null?'':jeuId);
    if(!id)return;
    retirerEntree(false,id);
    retirerEntree(true,id);
  }
  /* Lecture du journal (console du navigateur) : chaque entrée est annotée { type:'objet', id } ou { type:'bit', id } quand le profil du jeu est connu ; les NOMS des objets ne sont pas dans le client. */
  function journal(){
    const jr=lireJournal(),sortie={};
    Object.keys(jr).forEach(function(id){
      const p=profilsDe[id]||(window.__SOREAL_IDLE_SCUMMVM_SAVE_V1__&&window.__SOREAL_IDLE_SCUMMVM_SAVE_V1__.PROFILS||{})[id==='dott'?'tentacle':id];
      sortie[id]=(Array.isArray(jr[id])?jr[id]:[]).map(function(e){
        const o={u:e.u,t:e.t};
        if(p){if(e.u<p.objetsGlobaux){o.type='objet';o.id=e.u;}else{o.type='bit';o.id=e.u-p.objetsGlobaux;}}
        return o;
      });
    });
    return sortie;
  }
  window.__SOREAL_IDLE_SCUMMVM_JOURNAL_V1__=journal;

  /* Trophées déjà crédités par le serveur pour ce jeu (état du joueur), pour ne jamais renvoyer un trophée connu. */
  function tropheesServeur(id){
    try{
      const j=(window.__SOREAL_IDLE_REG__||{}).idleEtat;
      const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
      const s=l.find(function(x){return x&&x.id==='scummvm';});
      const d=s&&((s.state&&s.state.data)||s.data);
      const e=d&&d.jeux&&d.jeux[id];
      return e&&e.trophees&&typeof e.trophees==='object'?e.trophees:{};
    }catch(_e){return {};}
  }

  /* Une vérification : lit l'autosave, ajoute les unités vues, puis (jeu avec liste de trophées) envoie les trophées NOUVEAUX, ou (sinon) l'action par unités si leur nombre a augmenté.
     Renvoie le nombre d'unités atteintes (ou -1). */
  async function verifier(){
    const J=jeu;
    if(enCours||!J||!J.ap||!J.cible)return -1;
    const L=window.__SOREAL_IDLE_SCUMMVM_SAVE_V1__;
    const profil=L&&L.PROFILS?L.PROFILS[J.cible]:null;
    const plafond=Number(J.ap.plafond),parUnite=Number(J.ap.parUnite),reference=Number(J.ap.unitesReference),croissance=Number(J.ap.croissance);
    if(!profil||!(plafond>0))return -1;
    enCours=true;
    try{
      const liste=await chargerTrophees(J,dossierJeu);
      if(!liste&&!(parUnite>0)&&!(reference>=2&&croissance>1))return -1;
      profilsDe[J.id]=profil;
      const a=await lireAutosave(J.cible);
      if(!a){etat={ok:false,raison:'aucune sauvegarde lue',le:Date.now()};return -1;}
      const m=lireMemoire();
      const e=m[J.id]&&typeof m[J.id]==='object'?m[J.id]:{};
      const taille=(L.unitesPossibles(profil)+7)>>3;
      const vu=depuisBase64(e.vu,taille);
      let ts=e.ts||0;
      if(!(e.ts&&a.ts&&e.ts===a.ts)){   /* même sauvegarde que la dernière fois : rien à relire (les trophées sont tout de même évalués sur l'ensemble déjà vu) */
        const brut=await L.decompresser(a.octets);
        const lu=brut?L.lire(brut,profil):null;
        if(!brut){etat={ok:false,raison:'décompression impossible sur cet appareil',le:Date.now()};return -1;}
        if(!lu||lu.erreur){etat={ok:false,raison:'format de sauvegarde non reconnu',le:Date.now()};return -1;}   /* format non reconnu : aucun crédit, jamais de valeur devinée */
        const avant=vu.slice();
        L.unites(lu,profil).forEach(function(i){vu[i>>3]|=1<<(i&7);});
        const nouvelles=[];
        for(let i=0;i<taille*8;i++)if((vu[i>>3]&(1<<(i&7)))&&!(avant[i>>3]&(1<<(i&7))))nouvelles.push(i);
        noterJournal(J.id,nouvelles,Date.now());
        ts=a.ts||0;
      }
      etat={ok:true,raison:'',le:Date.now()};
      const nb=compter(vu);
      const envoye=Math.max(0,Number(e.envoye)||0);
      const f=window.__actionMetaIdleV130__;
      const nouveau={vu:versBase64(vu),envoye:Math.max(envoye,nb),ts:ts};
      if(liste){
        /* mode trophées : plus d'action par unités (pas de double crédit) ; les trophées déjà envoyés ou connus du serveur ne repartent jamais */
        const dejaEnvoyes=Array.isArray(e.troph)?e.troph.slice(0,500):[];
        const connus=tropheesServeur(J.id);
        const aEnvoyer=tropheesRemplis(liste,vu,profil).filter(function(t){return dejaEnvoyes.indexOf(t.id)<0&&!Object.prototype.hasOwnProperty.call(connus,t.id);});
        nouveau.envoye=envoye;nouveau.troph=dejaEnvoyes;
        if(AP_ACTIF&&aEnvoyer.length&&typeof f==='function'){
          f({action:'scummvmTrophees',jeu:String(J.id),plafond:plafond,trophees:aEnvoyer.map(function(t){return {id:t.id,ap:t.ap};})});
          aEnvoyer.forEach(function(t){nouveau.troph.push(t.id);});
        }
      }else if(nb>envoye){
        if(AP_ACTIF&&typeof f==='function'){const msg={action:'scummvmProgres',jeu:String(J.id),unites:nb,plafond:plafond};if(parUnite>0)msg.parUnite=parUnite;if(reference>=2&&croissance>1){msg.reference=reference;msg.croissance=croissance;}if(Number(J.ap.bonusComplet)>0)msg.bonus=Number(J.ap.bonusComplet);f(msg);}
        else nouveau.envoye=envoye;   /* pas de canal d'actions : on réessaiera */
      }
      m[J.id]=nouveau;
      ecrireMemoire(m);
      return nb;
    }catch(_e){return -1;}
    finally{enCours=false;}
  }

  /* Le jeu tourne : un seul minuteur pour toute la page (jamais un par jeu ni par rendu) ; une attente à la fois, replanifiée après chaque vérification (pas de setInterval : dette plafonnée par l'audit d'architecture). */
  function planifier(){
    minuteur=window.setTimeout(function(){minuteur=0;verifier().then(planifier,planifier);},INTERVALLE_MS);
  }
  /* Dernier état du suivi (affiché par la page quand il échoue : « Suivi des AP indisponible : … »). */
  let etat={ok:true,raison:'',le:0};
  function demarrer(j,dossier){
    dossierJeu=String(dossier||"");
    jeu=j&&j.ap?j:null;
    if(!jeu||minuteur)return;
    planifier();
  }
  window.addEventListener('pagehide',function(){verifier();});   /* à la fermeture de la page */

  window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__={etat:function(){return etat;},CLE:CLE,CLE_JOURNAL:CLE_JOURNAL,JOURNAL_MAX:JOURNAL_MAX,definirApActif:function(v){AP_ACTIF=Boolean(v);},validerTrophees:validerTrophees,tropheesRemplis:tropheesRemplis,chargerTrophees:chargerTrophees,tropheesDe:function(id){return tropheesDe[id];},journal:journal,reinitialiser:reinitialiser,INTERVALLE_MS:INTERVALLE_MS,demarrer:demarrer,verifier:verifier,lireAutosave:lireAutosave,compter:compter,versBase64:versBase64,depuisBase64:depuisBase64};
})();
