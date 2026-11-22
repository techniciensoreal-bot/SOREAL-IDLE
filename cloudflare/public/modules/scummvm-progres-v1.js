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
  const INTERVALLE_MS=30000;

  let jeu=null,minuteur=0,enCours=false;

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
  function lireAutosave(cible){
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

  /* Une vérification : lit l'autosave, ajoute les unités vues, envoie l'action si le nombre a augmenté. Renvoie le nombre d'unités atteintes (ou -1). */
  async function verifier(){
    const J=jeu;
    if(enCours||!J||!J.ap||!J.cible)return -1;
    const L=window.__SOREAL_IDLE_SCUMMVM_SAVE_V1__;
    const profil=L&&L.PROFILS?L.PROFILS[J.cible]:null;
    const plafond=Number(J.ap.plafond),parUnite=Number(J.ap.parUnite);
    if(!profil||!(plafond>0)||!(parUnite>0))return -1;
    enCours=true;
    try{
      const a=await lireAutosave(J.cible);
      if(!a)return -1;
      const m=lireMemoire();
      const e=m[J.id]&&typeof m[J.id]==='object'?m[J.id]:{};
      if(e.ts&&a.ts&&e.ts===a.ts)return Number(e.envoye)||0;   /* même sauvegarde que la dernière fois : rien à relire */
      const brut=await L.decompresser(a.octets);
      const lu=brut?L.lire(brut,profil):null;
      if(!lu||lu.erreur)return -1;   /* format non reconnu : aucun crédit, jamais de valeur devinée */
      const taille=(L.unitesPossibles(profil)+7)>>3;
      const vu=depuisBase64(e.vu,taille);
      L.unites(lu,profil).forEach(function(i){vu[i>>3]|=1<<(i&7);});
      const nb=compter(vu);
      const envoye=Math.max(0,Number(e.envoye)||0);
      m[J.id]={vu:versBase64(vu),envoye:Math.max(envoye,nb),ts:a.ts||0};
      if(nb>envoye){
        const f=window.__actionMetaIdleV130__;
        if(typeof f==='function')f({action:'scummvmProgres',jeu:String(J.id),unites:nb,plafond:plafond,parUnite:parUnite});
        else m[J.id].envoye=envoye;   /* pas de canal d'actions : on réessaiera */
      }
      ecrireMemoire(m);
      return nb;
    }catch(_e){return -1;}
    finally{enCours=false;}
  }

  /* Le jeu tourne : un seul minuteur pour toute la page (jamais un par jeu ni par rendu) ; une attente à la fois, replanifiée après chaque vérification (pas de setInterval : dette plafonnée par l'audit d'architecture). */
  function planifier(){
    minuteur=window.setTimeout(function(){minuteur=0;verifier().then(planifier,planifier);},INTERVALLE_MS);
  }
  function demarrer(j){
    jeu=j&&j.ap?j:null;
    if(!jeu||minuteur)return;
    planifier();
  }
  window.addEventListener('pagehide',function(){verifier();});   /* à la fermeture de la page */

  window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__={CLE:CLE,INTERVALLE_MS:INTERVALLE_MS,demarrer:demarrer,verifier:verifier,lireAutosave:lireAutosave,compter:compter,versBase64:versBase64,depuisBase64:depuisBase64};
})();
