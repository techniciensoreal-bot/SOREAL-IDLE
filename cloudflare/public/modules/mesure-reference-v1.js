/*
 * SOREAL IDLE — MESURE DE RÉFÉRENCE (plan design/PLAN-COMPLET-2026-11-06.md, chantier C0 ; Norman, 2026-11-06 : « commence par C0 »).
 * Un protocole FIXE et PASSIF, lancé depuis Réglages > « 📏 Mesure de référence » (administrateur) : le jeu ouvre tour à tour quelques menus, laisse chacun tourner 20 s, et note ce que l'appareil montre :
 *   - la durée de chaque image (médiane, 95e centile, pire image, part des images au-dessus de 20 / 34 / 50 ms) ;
 *   - les images longues et les fonctions qui les occupent (API « long-animation-frame », Chrome ; sinon tâches longues ; sinon rien, et le rapport le dit) ;
 *   - le temps des opérations du moteur local (attente, calcul, retour) pendant la mesure ;
 *   - l'appareil (navigateur, cœurs, mémoire, écran, mode « direct » ou « iframe » : SOREAL APP / TV) ;
 *   - le verdict contre le budget du plan : images > 20 ms au plus 1 %, > 34 ms au plus 0,1 %, aucune > 50 ms.
 * AUCUNE action de jeu n'est envoyée : seuls les boutons de menu sont cliqués (le menu de départ est rouvert à la fin) ; rien n'est envoyé au serveur ; le rapport se copie à la main. Le même protocole sur PC et sur téléphone rend les chiffres comparables.
 * Règles : n°2 (seuls les menus déjà présents sont mesurés, le rapport ne nomme rien de plus), n°4 (aucun nœud ajouté à la page de jeu : fenêtre et pastille sont posées sur <body>), n°6 (le menu ouvert est une préférence du compte : il est restauré).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MESURE_REF_V1__)return;

var VERSION_PROTOCOLE=1;
var MENUS=[['combat','Combat de boss'],['aventure','Aventure'],['machine','Machine temporelle'],['ngu','NGU']];
var DUREE_MENU_MS=20000,MISE_EN_PLACE_MS=3000;
/* DIAGNOSTIC de la Machine temporelle (Norman, 2026-11-06 : sur son téléphone elle tourne à ~40 images/s, médiane 25 ms, alors que le PC est dans le budget) : la même page mesurée quatre fois, avec des parties de l'affichage retirées pour ATTRIBUER le coût :
   normale ; animations de la machine en pause ; décor (centre et haut) masqué ; machine entière masquée (reste la page autour). Les différences entre passes disent ce qui coûte. Les variantes sont temporaires (une feuille de style et des animations mises en pause), retirées à la fin. */
var PLAN_DIAG_MACHINE=[
  {id:'machine',nom:'Machine temporelle — normale'},
  {id:'machine',nom:'Machine temporelle — animations de la machine en pause',variante:'pause'},
  {id:'machine',nom:'Machine temporelle — décor masqué (centre et haut)',variante:'decor'},
  {id:'machine',nom:'Machine temporelle — machine entière masquée',variante:'cadre'}
];
var VARIANTES_CSS={
  pause:'.tmm-machine,.tmm-machine *{animation-play-state:paused!important}',
  decor:'.tmm-centre,.tmm-haut{display:none!important}',
  cadre:'.tmm-cadre{display:none!important}'
};
var BUDGET={sup20:1,sup34:0.1,max:50};   /* % d'images au-dessus de 20 ms, % au-dessus de 34 ms, pire image en ms */

/* ---------- statistiques (pures : testées sans navigateur) ---------- */
function quantile(trie,p){return trie.length?trie[Math.min(trie.length-1,Math.floor(trie.length*p))]:0;}
function statsImages(durees){
  var d=durees.filter(function(x){return x>0&&isFinite(x);}).sort(function(a,b){return a-b;}),n=d.length;
  var plus=function(s){var c=0;for(var i=0;i<n;i++)if(d[i]>s)c+=1;return c;};
  var s20=plus(20),s34=plus(34),s50=plus(50);
  return {n:n,mediane:quantile(d,0.5),p95:quantile(d,0.95),p99:quantile(d,0.99),max:n?d[n-1]:0,sup20:s20,sup34:s34,sup50:s50,
    pct20:n?s20/n*100:0,pct34:n?s34/n*100:0,pct50:n?s50/n*100:0};
}
function verdict(s){
  if(!s||s.n<200)return {ok:null,raisons:['trop peu d\'images pour conclure ('+(s?s.n:0)+')']};
  var raisons=[];
  if(s.pct20>BUDGET.sup20)raisons.push('images > 20 ms : '+s.pct20.toFixed(2)+' % (budget '+BUDGET.sup20+' %)');
  if(s.pct34>BUDGET.sup34)raisons.push('images > 34 ms : '+s.pct34.toFixed(2)+' % (budget '+BUDGET.sup34+' %)');
  if(s.max>BUDGET.max)raisons.push('pire image : '+Math.round(s.max)+' ms (budget '+BUDGET.max+' ms)');
  return {ok:raisons.length===0,raisons:raisons};
}
function resumerOps(liste){
  var par={};
  liste.forEach(function(o){var p=par[o.op]||(par[o.op]={op:o.op,calcul:[],file:[],retour:[]});p.calcul.push(o.calcul);p.file.push(o.file);p.retour.push(o.retour);});
  return Object.keys(par).map(function(k){
    var p=par[k],c=p.calcul.slice().sort(function(a,b){return a-b;}),f=p.file.slice().sort(function(a,b){return a-b;}),r=p.retour.slice().sort(function(a,b){return a-b;});
    return {op:k,n:c.length,calculMed:quantile(c,0.5),calculMax:c[c.length-1],fileMax:f[f.length-1],retourMax:r[r.length-1]};
  }).sort(function(a,b){return b.n-a.n;}).slice(0,8);
}
function resumerLoaf(entrees){
  var agg={},total=0;
  entrees.forEach(function(e){
    total+=e.duree||0;
    (e.scripts||[]).forEach(function(s){
      var k=(s.invoker||'?')+' | '+(s.fichier||'')+(s.fonction?' | '+s.fonction:'');
      var a=agg[k]||(agg[k]={cle:k,n:0,ms:0,max:0});a.n+=1;a.ms+=s.duree||0;if((s.duree||0)>a.max)a.max=s.duree||0;
    });
  });
  return {n:entrees.length,ms:total,tops:Object.keys(agg).map(function(k){return agg[k];}).sort(function(a,b){return b.ms-a.ms;}).slice(0,3)};
}
var ent=function(x,d){return Number(x).toFixed(d===undefined?1:d);};
function texteRapport(r){
  var l=[];
  l.push('=== SOREAL NGU IDLE — '+(r.titre||'mesure de référence')+' (protocole v'+VERSION_PROTOCOLE+') ===');
  l.push('relevé : '+r.date+' · version client '+(r.versionClient||'?')+' · mode '+r.mode+(r.moteurLocal?' · jeu local actif':' · jeu serveur'));
  l.push('appareil : '+r.appareil);
  l.push('écran : '+r.ecran+' · cœurs '+(r.coeurs||'?')+' · mémoire '+(r.memoire||'?')+' Go · réseau '+(r.reseau||'?'));
  l.push('API : images longues '+(r.apiLoaf?'oui (long-animation-frame)':(r.apiLongtask?'non, tâches longues seulement':'non, aucune'))+' · menu de départ '+(r.menuDepart||'?'));
  l.push('durée par menu : '+r.dureeMenu+' s (mise en place '+r.miseEnPlace+' s) · budget : > 20 ms au plus '+BUDGET.sup20+' %, > 34 ms au plus '+BUDGET.sup34+' %, aucune > '+BUDGET.max+' ms');
  l.push('');
  r.menus.forEach(function(m){
    if(m.absent){l.push('[ '+m.nom+' ] absent (menu non disponible sur ce compte) : non mesuré');l.push('');return;}
    var s=m.stats,v=m.verdict;
    l.push('[ '+m.nom+' ] '+(m.valide?'':'INVALIDE ('+m.invalide+') ')+s.n+' images · ~'+(s.mediane?Math.round(1000/s.mediane):0)+' images/s · médiane '+ent(s.mediane)+' ms · 95 % '+ent(s.p95)+' ms · pire '+Math.round(s.max)+' ms');
    l.push('   > 20 ms : '+s.sup20+' ('+ent(s.pct20,2)+' %) · > 34 ms : '+s.sup34+' ('+ent(s.pct34,2)+' %) · > 50 ms : '+s.sup50+' ('+ent(s.pct50,2)+' %) -> '+(v.ok===null?'non concluant':(v.ok?'DANS LE BUDGET':'HORS BUDGET : '+v.raisons.join(' ; '))));
    if(m.loaf&&m.loaf.n){l.push('   images longues : '+m.loaf.n+' ('+Math.round(m.loaf.ms)+' ms au total)');m.loaf.tops.forEach(function(t){l.push('     '+t.cle+' ×'+t.n+' · '+Math.round(t.ms)+' ms (max '+Math.round(t.max)+')');});}
    l.push('');
  });
  l.push(r.ops.length?'moteur local, opérations pendant la mesure (calcul en ms ; file = attente avant le calcul ; retour = copie vers la page) :':'moteur local : aucune opération vue pendant la mesure');
  r.ops.forEach(function(o){l.push('   '+o.op+' ×'+o.n+' · calcul médian '+Math.round(o.calculMed)+' · max '+Math.round(o.calculMax)+' · file max '+Math.round(o.fileMax)+' · retour max '+Math.round(o.retourMax));});
  (r.notes||[]).forEach(function(n){l.push('NOTE : '+n);});
  l.push('=== FIN DE LA MESURE ===');
  return l.join('\n');
}

/* ---------- protocole (le navigateur est injecté : testé avec une horloge simulée) ---------- */
async function executer(env,progres,plan,titre){
  var elements=plan||MENUS.map(function(m){return {id:m[0],nom:m[1]};});
  var sortie={titre:titre||'',date:env.date(),versionClient:env.version(),mode:env.mode(),moteurLocal:env.moteurLocal(),appareil:env.appareil(),ecran:env.ecran(),coeurs:env.coeurs(),memoire:env.memoire(),reseau:env.reseau(),
    apiLoaf:env.apiLoaf(),apiLongtask:env.apiLongtask(),dureeMenu:DUREE_MENU_MS/1000,miseEnPlace:MISE_EN_PLACE_MS/1000,menus:[],ops:[],notes:[],menuDepart:env.menuActif()};
  var depart=env.menuActif(),ops=[];
  var liberer=env.accrocherMoteur(function(o){ops.push(o);});
  try{
    for(var i=0;i<elements.length;i++){
      var id=elements[i].id,nom=elements[i].nom;
      if(progres)progres('Ouverture de « '+nom+' » ('+(i+1)+'/'+elements.length+')…');
      if(!env.cliquerMenu(id)){sortie.menus.push({id:id,nom:nom,absent:true});continue;}
      if(env.variante)env.variante(elements[i].variante||null);
      await env.attendre(MISE_EN_PLACE_MS);
      var mes=await env.mesurer(DUREE_MENU_MS,function(reste){if(progres)progres('« '+nom+' » : encore '+Math.ceil(reste/1000)+' s — ne touche à rien, laisse cette page visible');});
      var s=statsImages(mes.durees),attendu=DUREE_MENU_MS/1000*30;
      var invalide=mes.bloque?'images suspendues par le navigateur (page, panneau ou application masqué) : remets la page au premier plan et relance':(mes.masque?'page masquée pendant la mesure':(s.n<attendu?'moins de 30 images par seconde en moyenne : mesure trop pauvre ('+s.n+' images)':''));
      sortie.menus.push({id:id,nom:nom,stats:s,verdict:verdict(s),loaf:resumerLoaf(mes.loaf||[]),valide:!invalide,invalide:invalide});
    }
  }finally{
    liberer();
    if(env.variante)env.variante(null);   /* les variantes du diagnostic sont toujours retirées */
    if(depart)env.cliquerMenu(depart);   /* règle n°6 : le menu ouvert est une préférence du compte, remise comme avant */
  }
  sortie.ops=resumerOps(ops);
  if(!sortie.apiLoaf&&!sortie.apiLongtask)sortie.notes.push('ce navigateur ne donne ni images longues ni tâches longues : seules les durées d\'image sont mesurées.');
  return sortie;
}

/* ---------- navigateur réel ---------- */
function envReel(){
  var D=window.__SOREAL_IDLE_DIAG_V1__;
  var nav=navigator,cn=nav.connection||{};
  var mode='direct';try{mode=window.parent!==window?'iframe':'direct';}catch(_e){mode='iframe';}
  var types=(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes)||[];
  function bouton(id){return document.querySelector('.soreal-idle-nav-button-v28[data-menu-id-v1="'+id+'"]');}
  return {
    date:function(){return new Date().toLocaleString('fr-BE');},
    version:function(){try{var n=window.__SOREAL_IDLE_RELEASE_NOTES_V1__;return n&&n.courante?String(n.courante):'?';}catch(_e){return '?';}},
    mode:function(){return mode;},
    moteurLocal:function(){try{var M=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;return Boolean(M&&M.actif&&M.actif());}catch(_e){return false;}},
    appareil:function(){return String(nav.userAgent||'?').slice(0,120);},
    ecran:function(){return (window.innerWidth||'?')+'x'+(window.innerHeight||'?')+' @'+(window.devicePixelRatio||1)+'x';},
    coeurs:function(){return nav.hardwareConcurrency;},
    memoire:function(){return nav.deviceMemory;},
    reseau:function(){return (cn.effectiveType||'?')+' · rtt '+(cn.rtt!==undefined?cn.rtt:'?')+' ms';},
    apiLoaf:function(){return types.indexOf('long-animation-frame')>=0;},
    apiLongtask:function(){return types.indexOf('longtask')>=0;},
    menuActif:function(){var b=document.querySelector('.soreal-idle-nav-button-v28.active[data-menu-id-v1]');return b?b.getAttribute('data-menu-id-v1'):'';},
    cliquerMenu:function(id){var b=bouton(id);if(!b)return false;b.click();return true;},
    attendre:function(ms){return new Promise(function(r){setTimeout(r,ms);});},
    variante:function(nom){
      var st=document.getElementById('soreal-idle-mesure-ref-variante');
      /* animations déjà mises en pause par une variante précédente : reprises */
      (envReel.__enPause||[]).forEach(function(a){try{a.play();}catch(_e){}});envReel.__enPause=[];
      if(!nom){if(st)st.remove();return;}
      if(!st){st=document.createElement('style');st.id='soreal-idle-mesure-ref-variante';document.head.appendChild(st);}
      st.textContent=VARIANTES_CSS[nom]||'';
      if(nom==='pause'){try{var m=document.querySelector('.tmm-machine');if(m&&m.getAnimations)m.getAnimations({subtree:true}).forEach(function(a){if(a.playState==='running'){a.pause();envReel.__enPause.push(a);}});}catch(_e){}}
    },
    accrocherMoteur:function(rapporter){
      if(!D||typeof D.moteurTemps!=='function')return function(){};
      var original=D.moteurTemps;
      D.moteurTemps=function(op,file,calcul,retour,spans){try{rapporter({op:String(op),file:Number(file)||0,calcul:Number(calcul)||0,retour:Number(retour)||0});}catch(_e){}return original.apply(this,arguments);};
      return function(){D.moteurTemps=original;};
    },
    mesurer:function(ms,rappel){
      return new Promise(function(resolve){
        var durees=[],loaf=[],masque=false,bloque=false,dernier=performance.now(),debut=dernier,tic=0,obs=null,fini=false,garde=0;
        try{
          if(types.indexOf('long-animation-frame')>=0){obs=new PerformanceObserver(function(l){l.getEntries().forEach(function(e){
            loaf.push({duree:e.duration,scripts:(e.scripts||[]).map(function(s){return {invoker:s.invoker||s.name,fichier:String(s.sourceURL||'').split('/').pop().split('?')[0],fonction:s.sourceFunctionName,duree:s.duration};})});});});
            obs.observe({type:'long-animation-frame',buffered:false});}
        }catch(_e){obs=null;}
        function image(t){
          if(fini)return;
          if(document.hidden)masque=true;
          durees.push(t-dernier);dernier=t;
          if(t-debut-tic>=1000){tic+=1000;if(rappel)rappel(ms-(t-debut));}
          if(t-debut>=ms){fini=true;clearTimeout(garde);if(obs)obs.disconnect();resolve({durees:durees.slice(1),loaf:loaf,masque:masque,bloque:false});return;}
          requestAnimationFrame(image);
        }
        /* Garde-fou : si le navigateur suspend les images (page ou panneau masqué, application passée en arrière-plan), la mesure se termine quand même, déclarée invalide, au lieu d'attendre indéfiniment. */
        garde=setTimeout(function(){if(fini)return;fini=true;bloque=true;if(obs)obs.disconnect();resolve({durees:durees.slice(1),loaf:loaf,masque:true,bloque:true});},ms+4000);
        requestAnimationFrame(image);
      });
    }
  };
}

/* ---------- fenêtre (modèle : journal de fluidité) ---------- */
var STYLE_BOUTON='padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;cursor:pointer';
function fermer(){var o=document.getElementById('soreal-idle-mesure-ref-v1');if(o)o.remove();}
function fenetre(titre,corps,boutons){
  fermer();
  var o=document.createElement('div');
  o.id='soreal-idle-mesure-ref-v1';o.setAttribute('data-sans-traduction','1');
  o.style.cssText='position:fixed;inset:0;z-index:100003;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  o.innerHTML='<div role="dialog" aria-modal="true" style="width:min(720px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#eef4fc;font:14px/1.45 system-ui,sans-serif">'+
    '<h3 style="margin:0 0 6px;font-size:18px">'+titre+'</h3>'+corps+'<div id="soreal-idle-mesure-ref-btns" style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap"></div></div>';
  document.body.appendChild(o);
  var zone=document.getElementById('soreal-idle-mesure-ref-btns');
  boutons.forEach(function(b){var e=document.createElement('button');e.type='button';e.style.cssText=b.fort?STYLE_BOUTON.replace('background:#22314d','background:#2f6fd0').replace('rgba(166,188,229,.3)','#5b93e6'):STYLE_BOUTON;e.textContent=b.texte;e.addEventListener('click',b.fait);zone.appendChild(e);});
  return o;
}
var enCours=false;
function pastille(texte){
  var p=document.getElementById('soreal-idle-mesure-ref-pastille');
  if(texte===null){if(p)p.remove();return;}
  if(!p){p=document.createElement('div');p.id='soreal-idle-mesure-ref-pastille';p.setAttribute('data-sans-traduction','1');
    p.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 8px);z-index:100004;background:rgba(15,23,41,.92);color:#eef4fc;border:1px solid #5b93e6;border-radius:999px;padding:7px 14px;font:13px/1.3 system-ui,sans-serif;pointer-events:none;max-width:92vw;text-align:center';
    document.body.appendChild(p);}
  if(p.textContent!==texte)p.textContent=texte;
}
function afficherRapport(texte){
  fenetre('📏 Mesure de référence — terminée','<textarea readonly id="soreal-idle-mesure-ref-texte" style="width:100%;min-height:280px;box-sizing:border-box;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#0f1729;color:#eef4fc;padding:10px;font:12px/1.4 ui-monospace,monospace"></textarea>',
    [{texte:'Copier',fort:true,fait:function(){var t=document.getElementById('soreal-idle-mesure-ref-texte');t.select();try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t.value);else document.execCommand('copy');}catch(_e){}}},{texte:'Fermer',fait:fermer}]);
  document.getElementById('soreal-idle-mesure-ref-texte').value=texte;
}
async function lancer(plan,titre){
  if(enCours)return null;
  enCours=true;fermer();
  try{
    var r=await executer(envReel(),function(t){pastille('📏 '+t);},plan,titre);
    pastille(null);
    var texte=texteRapport(r);
    afficherRapport(texte);
    return r;
  }catch(e){pastille(null);afficherRapport('Mesure interrompue : '+String(e&&e.message||e));return null;}
  finally{enCours=false;pastille(null);}
}
function ouvrir(){
  fenetre('📏 Mesure de référence','<div style="color:#b9c8e6">Mesure la fluidité de CET appareil avec un protocole fixe : '+MENUS.length+' menus, '+(DUREE_MENU_MS/1000)+' s chacun, environ '+Math.round(MENUS.length*(DUREE_MENU_MS+MISE_EN_PLACE_MS)/60000*10)/10+' minute(s). <b>Aucune action de jeu n\'est faite</b> : seuls les menus s\'ouvrent, et le menu actuel est rouvert à la fin. Pendant la mesure, <b>ne touche à rien</b> et laisse la page visible (ne change pas d\'application). Rien n\'est envoyé : le rapport se copie à la main.</div>',
    [{texte:'Lancer la mesure',fort:true,fait:function(){lancer();}},{texte:'Diagnostic Machine temporelle (1,5 min)',fait:function(){lancer(PLAN_DIAG_MACHINE,'diagnostic Machine temporelle');}},{texte:'Annuler',fait:fermer}]);
}
window.__mesureReferenceOuvrirV1__=ouvrir;
window.__SOREAL_IDLE_MESURE_REF_V1__={ouvrir:ouvrir,lancer:lancer,executer:executer,envReel:envReel,PLAN_DIAG_MACHINE:PLAN_DIAG_MACHINE,VARIANTES_CSS:VARIANTES_CSS,statsImages:statsImages,verdict:verdict,texteRapport:texteRapport,resumerOps:resumerOps,resumerLoaf:resumerLoaf,MENUS:MENUS,BUDGET:BUDGET,VERSION_PROTOCOLE:VERSION_PROTOCOLE};
})();
