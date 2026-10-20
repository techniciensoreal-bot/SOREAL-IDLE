/*
 * SOREAL IDLE — journal de fluidité (Norman, 2026-10-05 : « plus jamais de barre qui fait marche arrière ni de temps d'arrêt pour valider un niveau pendant que le calcul de l'Or se fait » ; étape 1 : MESURER).
 *
 * Observe ce que le joueur VOIT dans le menu Augmentations (niveau affiché, remplissage de chaque barre, Or) cinq fois par seconde et note, sur l'appareil seulement (rien n'est envoyé nulle part) :
 *   - niveau_recule   : un niveau affiché baisse ;
 *   - barre_recule    : une barre perd plus de 12 % et son niveau ne monte pas dans la seconde et demie qui suit (un niveau qui monte tout de suite après est normal) ;
 *   - validation_tardive : la barre repart de zéro, mais le numéro de niveau ne change que 0,4 s ou plus après : l'écran « hésite » le temps que le jeu valide le niveau ;
 *   - pause_validation: une barre reste pleine plus de 2,5 s alors que rien ne manque (pas de message « il manque de l'Or ») : le jeu attend le serveur ;
 *   - or_remonte      : l'Or remonte (au moins le quart de la dépense) moins de 8 s après une dépense locale : la réponse du serveur « rend » l'Or.
 *   - rituel_ecart    : (Norman, 2026-10-17 : sangsue, « 10 minutes, puis le temps diminue fortement quand je change d'onglet ») à chaque réponse du serveur, le compte à rebours AFFICHÉ d'un rituel de sang diffère
 *                       d'au moins 10 % (et 5 s) de celui que le serveur donne : on note les deux durées, la magie, la durée d'un niveau (spc) et K (durée à 1 de magie) de l'écran et du serveur.
 *   - combat_lance   : (Norman, 2026-10-17 : « quand on lance un combat contre un boss, ça saute ») à la première réponse du serveur après un clic sur Fight : délai depuis le clic, PV du joueur et du boss
 *                       affichés (avant) et donnés par le serveur (après), en % de leur maximum.
 *   - combat_saut    : pendant un combat de boss, une réponse du serveur déplace la vie du joueur ou celle du boss d'au moins 8 points de pourcentage par rapport à l'écran.
 *   - tache_longue   : (Norman, 2026-10-17 : « petites lenteurs ») une tâche de plus de 80 ms qui bloque le navigateur : durée, menu ouvert, combat actif, et la réponse du serveur reçue juste avant (opération + délai).
 *   - reponse_lente  : une réponse du serveur qui a mis plus de 3 s à revenir (opération, durée).
 *   - combat_ordre   : (journal du 17/10 : le serveur répond « combat non actif » 2 à 24 s après le clic sur Fight) la vie de l'ordre de combat : file_ms = du clic à l'envoi, aller_retour_ms = de l'envoi à la réponse,
 *                       avant = les autres actions rapides (achats, forge, équipement…) envoyées entre le clic et l'ordre : elles passent devant et le retardent.
 *   - lot_lent       : une action rapide (achat, forge, équipement, combat…) dont l'aller-retour dépasse 2 s.
 *   - vie_saut       : (Norman : « ça saute ») une barre de vie du duel (joueur ou boss) change de plus de 12 points d'un échantillon (0,2 s) à l'autre, ou la barre du boss REMONTE de plus de 2 points ; la ligne dit de combien,
 *                       d'où à où, et s'il y a eu une réponse du serveur ou une action rapide juste avant (apres=…, ms).
 *   - signalement    : (Norman, 2026-10-17 : « je ne peux pas te dire l'heure ») le bouton 🐞 (administrateur, en bas à gauche) : un appui quand tu VOIS un défaut note l'instant exact, le menu, le combat, la vie du joueur et du boss
 *                       seconde par seconde sur les 20 s qui précèdent, et les dernières réponses du serveur (opération@âge/durée de l'appel). Appuie dès que tu as vu le défaut, même une ou deux secondes après.
 * CHAQUE ligne porte aussi le menu ouvert (menu=) et l'état du combat (combat=1/0), et le texte copié commence par un en-tête (appareil, version, connexion, menu) et finit par FIN DU JOURNAL : coller le texte seul suffit.
 * Le journal (160 lignes au plus) se lit dans Réglages > « 🩺 Journal de fluidité » (administrateur) ou avec window.__SOREAL_IDLE_DIAG_V1__.journal().
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DIAG_V1__)return;

  var CLE='soreal_idle_diag_v1';
  var MAX=160;
  var PERIODE_MS=200;
  var journal=[];
  try{var brut=localStorage.getItem(CLE);if(brut){var l=JSON.parse(brut);if(Array.isArray(l))journal=l.slice(-MAX);}}catch(_e){}

  function sauver_(){try{localStorage.setItem(CLE,JSON.stringify(journal.slice(-MAX)));}catch(_e){}}

  /* Contexte ajouté à chaque ligne : menu ouvert et combat de boss actif (lecture seule, jamais d'erreur). */
  function contexte_(){
    var c={};
    try{var r=document.querySelector('.soreal-idle-page-root-v28');var m=r&&r.getAttribute('data-menu');if(m)c.menu=m;}catch(_e){}
    try{var e=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;if(e)c.combat=e.combatBossActif?1:0;}catch(_e){}
    return c;
  }
  var dernierParCle={};
  function noter_(type,cle,details){
    var maintenant=Date.now();
    var k=type+'|'+cle;
    if(dernierParCle[k]&&maintenant-dernierParCle[k]<5000)return;
    dernierParCle[k]=maintenant;
    var ligne={t:maintenant,type:type,cle:cle};
    var ctx=contexte_();for(var q in ctx)ligne[q]=ctx[q];
    for(var a in details)if(Object.prototype.hasOwnProperty.call(details,a))ligne[a]=details[a];
    journal.push(ligne);
    if(journal.length>MAX)journal=journal.slice(-MAX);
    sauver_();
  }

  /*
   * Écart entre l'écran et le serveur pour les rituels de sang (appelé à chaque réponse du serveur, AVANT que le nouvel état remplace l'ancien). ecran = ce que l'ancien état affichait (repère visuel
   * du rituel, moins le temps écoulé) ; serveur = etaSeconds du nouvel état. Un rituel sans repère visuel ou déjà plein n'est pas comparé. Sur l'appareil seulement, rien n'est envoyé.
   */
  function ecartRituels_(ancien,nouveau){
    try{
      var vues=ancien&&ancien.__bloodMagicVisualV1;
      var vue=nouveau&&nouveau.systemes&&nouveau.systemes.bloodMagicView;
      if(!vues||typeof vues!=='object'||!vue||!Array.isArray(vue.rituals))return 0;
      var n=0,P=window.performance,maintenant=(P&&P.now)?P.now():0;
      vue.rituals.forEach(function(r){
        if(!r||!(Number(r.magic)>0))return;
        var v=vues[r.id];
        if(!v||!(Number(v.secondsPerCompletion)>0))return;
        var ecran=Number(v.etaSeconds)-Math.max(0,(maintenant-(v.at||maintenant))/1000);
        var serveur=Number(r.etaSeconds);
        if(!(ecran>0.5)||!(serveur>=0))return;
        var ecart=Math.abs(ecran-serveur);
        if(ecart<5||ecart<0.1*Math.max(ecran,serveur))return;
        var k=v.src&&Number(v.src.secondsK);
        noter_('rituel_ecart',String(r.id),{
          ecran_s:Math.round(ecran),serveur_s:Math.round(serveur),
          magie_ecran:Math.round(Number(v.src&&v.src.magic)||0),magie_serveur:Math.round(Number(r.magic)||0),
          spc_ecran:Math.round(Number(v.secondsPerCompletion)),spc_serveur:Math.round(Number(r.secondsPerCompletion)||0),
          K_ecran:Math.round(k||0),K_serveur:Math.round(Number(r.secondsK)||0),
          fraction_serveur:Math.round(1000*(Number(r.progressFraction)||0))/1000
        });
        n+=1;
      });
      return n;
    }catch(_e){return 0;}
  }

  /*
   * Combat de boss : ce que l'écran montrait (ancien état) contre ce que le serveur donne (nouveau), en % du maximum. Appelé à chaque réponse du serveur, comme ecartRituels_. combatLance_() note l'instant du clic sur Fight ;
   * la première réponse qui suit est toujours notée (combat_lance), les suivantes seulement si l'écart dépasse 8 points (combat_saut). Sur l'appareil seulement, rien n'est envoyé.
   */
  var clicFight=0;
  /* Vie de l'ordre de combat : clic -> envoi -> réponse (les actions rapides partent une par une, voir ui-actions-rapides-v1.js). */
  var clicOrdre=0,envoiOrdre=0,lotsAvant=[],lotEnCours=null;
  function combatLance_(){clicFight=Date.now();clicOrdre=clicFight;envoiOrdre=0;lotsAvant=[];}
  function lotEnvoye_(type){
    try{
      lotEnCours={type:String(type),t:Date.now()};
      if(type==='combat'){envoiOrdre=lotEnCours.t;return;}
      if(clicOrdre>0&&lotsAvant.length<8)lotsAvant.push(String(type));
    }catch(_e){}
  }
  function lotTermine_(type,ok){
    try{
      var maintenant=Date.now(),ms=lotEnCours&&lotEnCours.type===String(type)?maintenant-lotEnCours.t:0;
      lotEnCours=null;
      if(ms>2000)noter_('lot_lent',String(type),{ms:ms,ok:ok?1:0});
      if(type==='combat'&&envoiOrdre>0){
        noter_('combat_ordre','boss',{file_ms:clicOrdre>0?envoiOrdre-clicOrdre:-1,aller_retour_ms:maintenant-envoiOrdre,ok:ok?1:0,avant:lotsAvant.join('>')||'-'});
        clicOrdre=0;envoiOrdre=0;lotsAvant=[];
      }
    }catch(_e){}
  }
  function pct_(v,m){v=Number(v);m=Number(m);return m>0&&isFinite(v)?Math.round(1000*v/m)/10:null;}
  function ecartCombat_(ancien,nouveau){
    try{
      if(!ancien||!nouveau)return 0;
      var lance=clicFight>0&&Date.now()-clicFight<30000;
      if(!lance&&!(ancien.combatBossActif&&nouveau.combatBossActif))return 0;
      var j0=pct_(ancien.pvJoueur,ancien.pvJoueurMax),j1=pct_(nouveau.pvJoueur,nouveau.pvJoueurMax);
      var b0=pct_(ancien.bossPv,ancien.bossPvMax),b1=pct_(nouveau.bossPv,nouveau.bossPvMax);
      var dj=j0!==null&&j1!==null?Math.abs(j1-j0):0,db=b0!==null&&b1!==null?Math.abs(b1-b0):0;
      var d={joueur_ecran:j0,joueur_serveur:j1,boss_ecran:b0,boss_serveur:b1,boss:String(nouveau.bossActuel||ancien.bossActuel||'').slice(0,30),actif_serveur:nouveau.combatBossActif?1:0};
      if(lance){d.delai_ms=Date.now()-clicFight;clicFight=0;noter_('combat_lance','boss',d);return 1;}
      if(dj>=8||db>=8){noter_('combat_saut','boss',d);return 1;}
      return 0;
    }catch(_e){return 0;}
  }

  /* Réponses du serveur récentes (opération, instant de réception, durée de l'appel) : une tâche longue qui démarre juste après l'une d'elles lui est attribuée. */
  var recentes=[];
  function reponseRecue_(op,ms){
    try{
      var P=window.performance;
      recentes.push({op:String(op||'?'),t:(P&&P.now)?P.now():0,ms:Math.round(Number(ms)||0)});
      if(recentes.length>12)recentes.shift();
      if(Number(ms)>3000)noter_('reponse_lente',String(op||'?'),{ms:Math.round(Number(ms))});
    }catch(_e){}
  }
  /* Qui a bloqué le navigateur ? (administrateur seulement) : les fonctions passées à requestAnimationFrame / setTimeout / setInterval sont chronométrées ; celles qui dépassent 30 ms sont gardées avec leur nom,
     et une tâche longue cite les plus lourdes qui la recouvrent (« suspects »). Installé au premier relevé d'un administrateur : aucun coût pour les autres joueurs. */
  var suspects=[],suspectsPoses=false;
  function nomFonction_(f){try{return String(f.name||String(f).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').slice(0,90));}catch(_e){return '?';}}
  function envelopper_(fn,origine){
    if(typeof fn!=='function')return fn;
    if(fn.__diagEnvV1)return fn.__diagEnvV1;
    var w=function(){
      var t0=performance.now();
      try{return fn.apply(this,arguments);}
      finally{var d=performance.now()-t0;if(d>=30){suspects.push({t:t0,ms:Math.round(d),qui:origine+':'+nomFonction_(fn)});if(suspects.length>60)suspects.shift();}}
    };
    try{fn.__diagEnvV1=w;}catch(_e){}
    return w;
  }
  function poserSuspects_(){
    if(suspectsPoses)return;
    suspectsPoses=true;
    try{
      var raf=window.requestAnimationFrame,st=window.setTimeout,si=window.setInterval;
      window.requestAnimationFrame=function(fn){return raf.call(window,envelopper_(fn,'raf'));};
      window.setTimeout=function(fn){var a=Array.prototype.slice.call(arguments);a[0]=envelopper_(fn,'timeout');return st.apply(window,a);};
      window.setInterval=function(fn){var a=Array.prototype.slice.call(arguments);a[0]=envelopper_(fn,'interval');return si.apply(window,a);};
      /* Suite des promesses (réponses du moteur local : `await` / `.then`) et écouteurs d'événements : c'est là que s'exécutent l'adoption d'un état reçu et les clics. */
      var thenOrig=Promise.prototype.then;
      Promise.prototype.then=function(ok,ko){return thenOrig.call(this,envelopper_(ok,'then'),envelopper_(ko,'then'));};
      var ajout=EventTarget.prototype.addEventListener,retrait=EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener=function(type,fn,opt){return ajout.call(this,type,typeof fn==='function'?envelopper_(fn,'evt-'+type):fn,opt);};
      EventTarget.prototype.removeEventListener=function(type,fn,opt){return retrait.call(this,type,(typeof fn==='function'&&fn.__diagEnvV1)||fn,opt);};
      var desc=Object.getOwnPropertyDescriptor(Worker.prototype,'onmessage')||Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Worker.prototype),'onmessage');
      if(desc&&desc.set)Object.defineProperty(Worker.prototype,'onmessage',{configurable:true,enumerable:desc.enumerable,get:desc.get,set:function(fn){desc.set.call(this,envelopper_(fn,'worker-message'));}});
    }catch(_e){}
  }
  function suspectsDe_(debut,duree){
    var l=suspects.filter(function(x){return x.t+x.ms>=debut-50&&x.t<=debut+duree+50;}).sort(function(a,b){return b.ms-a.ms;}).slice(0,3);
    return l.map(function(x){return x.qui+' '+x.ms+'ms';}).join(' ; ')||'-';
  }
  function tacheLongue_(debut,duree){
    try{
      if(!(duree>=80))return;
      var rep=null;
      for(var i=recentes.length-1;i>=0;i--){if(recentes[i].t>=debut-120&&recentes[i].t<=debut+duree){rep=recentes[i];break;}}
      var ctx=contexte_();
      noter_('tache_longue',String(ctx.menu||'?')+'@'+Math.floor(debut/2000),{ms:Math.round(duree),apres:rep?rep.op:'-',appel_ms:rep?rep.ms:0,delai_ms:rep?Math.round(debut-rep.t):0,suspects:suspectsDe_(debut,duree)});
    }catch(_e){}
  }

  /* Remplissage visible d'une barre : transform scaleX de l'élément (la barre est animée par le navigateur). */
  function fraction_(el){
    try{
      var tr=window.getComputedStyle(el).transform;
      if(!tr||tr==='none')return 1;
      var m=/^matrix\(([^,]+),/.exec(tr);
      var v=m?parseFloat(m[1]):NaN;
      return isFinite(v)?v:NaN;
    }catch(_e){return NaN;}
  }

  var prec={};
  var orPrec=null;
  var dernierDepense=null;
  var gainMoyen=0;/* revenu d'Or habituel entre deux échantillons : une hausse ne compte que si elle le dépasse nettement */
  var pleineDepuis={};

  /* Barres de vie du duel : valeur POSÉE par le jeu (data-idle-pct-v121, avant la transition CSS), échantillonnée à chaque passage du minuteur. */
  var vieBarres={};
  var anneau=[];/* 0,2 s par case, 100 cases = 20 s : {t, j, b} (vie du joueur et du boss posée par le jeu, null si la barre n'est pas à l'écran) */
  function echantillonVie_(){
    try{var P0=window.performance;anneau.push({t:(P0&&P0.now)?P0.now():0,j:null,b:null});if(anneau.length>100)anneau.shift();}catch(_e){}
    /* Vie du joueur : la barre du bandeau du haut (toujours à l'écran, largeur posée par majHudPvIdleV2_) ; celle de la scène de combat n'existe pas dans tous les menus. */
    var defs=[['joueur','sorealIdleHudPvBarV2'],['boss','sorealIdleBossBarV7']];
    for(var i=0;i<defs.length;i++){
      var el=document.getElementById(defs[i][1]);
      if(!el||(defs[i][0]==='boss'&&!el.dataset)){delete vieBarres[defs[i][0]];continue;}
      var v=defs[i][0]==='joueur'?parseFloat(el.style&&el.style.width):parseFloat(el.dataset.idlePctV121);
      if(!isFinite(v))continue;
      if(anneau.length)anneau[anneau.length-1][defs[i][0]==='joueur'?'j':'b']=v;
      var avant=vieBarres[defs[i][0]];
      vieBarres[defs[i][0]]=v;
      if(avant===undefined)continue;
      var d=v-avant;
      if(Math.abs(d)>12||(defs[i][0]==='boss'&&d>2))vieSaut_(defs[i][0],avant,v);
    }
  }
  function vieSaut_(qui,de,a){
    try{
      var P=window.performance,now=(P&&P.now)?P.now():0,rep=null;
      for(var k=recentes.length-1;k>=0;k--){if(now-recentes[k].t<600){rep=recentes[k];break;}}
      noter_('vie_saut',qui,{de:Math.round(de*10)/10,a:Math.round(a*10)/10,apres:rep?rep.op:'-',depuis_ms:rep?Math.round(now-rep.t):-1,lot:lotEnCours?lotEnCours.type:'-'});
    }catch(_e){}
  }
  /* Signalement du joueur : un appui note tout ce qu'il faut pour retrouver le défaut qu'il vient de voir. */
  function serieVie_(cle){
    var sortie=[];
    for(var i=anneau.length-1;i>=0&&sortie.length<20;i-=5){var v=anneau[i][cle];sortie.unshift(v===null||v===undefined?'-':String(Math.round(v)));}
    return sortie.join('/');
  }
  var nSignalements=0;
  function signalement_(){
    try{
      var P=window.performance,now=(P&&P.now)?P.now():0;
      var reps=recentes.slice(-6).map(function(r){return String(r.op).replace('SorealIdle','')+'@-'+((now-r.t)/1000).toFixed(1)+'s/'+r.ms+'ms';}).join(';')||'-';
      noter_('signalement','bouton@'+Date.now()+'-'+(++nSignalements),{vie_joueur_par_s:serieVie_('j')||'-',vie_boss_par_s:serieVie_('b')||'-',reponses:reps,lot:lotEnCours?lotEnCours.type:'-'});
      return true;
    }catch(_e){return false;}
  }
  function assurerBouton_(){
    try{
      var existant=document.getElementById('soreal-idle-diag-signaler-v1');
      if(!estAdmin_()){if(existant&&existant.parentNode)existant.parentNode.removeChild(existant);return;}
      if(existant||!document.body)return;
      var b=document.createElement('button');
      b.id='soreal-idle-diag-signaler-v1';b.type='button';b.textContent='🐞';
      b.setAttribute('data-sans-traduction','1');b.setAttribute('aria-label','Signaler un défaut');b.title='J\u2019ai vu un défaut : noter l\u2019instant dans le journal';
      b.style.cssText='position:fixed;left:8px;bottom:8px;z-index:100002;width:38px;height:38px;border-radius:50%;border:1px solid rgba(166,188,229,.35);background:rgba(15,23,41,.82);color:#eef4fc;font-size:18px;line-height:1;cursor:pointer;opacity:.55;padding:0';
      b.addEventListener('click',function(){
        var ok=signalement_();
        b.textContent=ok?'✔':'✖';
        setTimeout(function(){b.textContent='🐞';},1200);
      });
      document.body.appendChild(b);
    }catch(_e){}
  }
  function echantillon_(){
    /* Norman (2026-10-13, audit) : la sonde est réservée à l'administrateur ; plus aucun travail à 5 Hz pour les autres joueurs */
    if(document.hidden||!estAdmin_())return;
    poserSuspects_();
    echantillonVie_();
    var racine=document.querySelector('.soreal-idle-page-root-v28[data-menu="augmentations"]');
    if(!racine){prec={};pleineDepuis={};return;}
    var maintenant=Date.now();
    var etat=null;
    try{etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){}
    var or=etat&&etat.systemes&&etat.systemes.currencies?Number(etat.systemes.currencies.gold):NaN;

    /* Or : une dépense locale, puis une remontée proche de son montant. */
    if(isFinite(or)&&orPrec!==null){
      var d=or-orPrec;
      if(d<0){dernierDepense={montant:-d,t:maintenant};}
      else if(d>0&&dernierDepense&&maintenant-dernierDepense.t<8000&&d>=0.25*dernierDepense.montant&&d>5*gainMoyen){
        noter_('or_remonte','or',{hausse:Math.round(d),depense:Math.round(dernierDepense.montant),apres_ms:maintenant-dernierDepense.t});
        dernierDepense=null;
      }else if(d>0){gainMoyen=gainMoyen*0.9+d*0.1;}
    }
    if(isFinite(or))orPrec=or;

    var barres=racine.querySelectorAll('[data-idle-aug-bar-v215]');
    for(var i=0;i<barres.length;i++){
      var el=barres[i];
      var id=el.getAttribute('data-idle-aug-bar-v215');
      var nivEl=racine.querySelector('[data-idle-aug-niv-v1="'+id+'"]');
      var niv=nivEl?parseInt(nivEl.textContent,10):NaN;
      var f=fraction_(el);
      if(!isFinite(niv)||!isFinite(f))continue;
      var p=prec[id];
      if(p){
        if(niv<p.niv){noter_('niveau_recule',id,{de:p.niv,a:niv,or:isFinite(or)?Math.round(or):null});p.suspect=null;}
        else if(niv>p.niv){
          /* Le niveau monte : si la barre avait déjà redémarré, on mesure l'écart entre les deux. */
          if(p.suspect){
            var ecart=maintenant-p.suspect.t;
            if(ecart>=400)noter_('validation_tardive',id,{ms:ecart,niv:niv,or:isFinite(or)?Math.round(or):null});
            p.suspect=null;
          }
        }else if(!p.suspect&&p.f-f>0.12){
          p.suspect={t:maintenant,de:Math.round(p.f*100),a:Math.round(f*100)};
        }else if(p.suspect&&maintenant-p.suspect.t>1500){
          noter_('barre_recule',id,{de:p.suspect.de,a:p.suspect.a,niv:niv,attente_ms:maintenant-p.suspect.t});
          p.suspect=null;
        }
      }
      /* Barre pleine qui n'avance pas, alors que rien ne manque. */
      if(f>=0.995){
        if(!pleineDepuis[id])pleineDepuis[id]={t:maintenant,niv:niv};
        var sejour=maintenant-pleineDepuis[id].t;
        if(sejour>2500&&pleineDepuis[id].niv===niv){
          var etaEl=racine.querySelector('[data-idle-aug-eta-v1="'+id+'"]');
          var eta=etaEl?etaEl.textContent:'';
          if(!/il manque|missing|Or pour|Gold for|défi en cours|Challenge in progress|Place|énergie|energy/i.test(eta))noter_('pause_validation',id,{ms:sejour,niv:niv,eta:String(eta).slice(0,60)});
        }
      }else delete pleineDepuis[id];
      prec[id]={niv:niv,f:f,suspect:p&&p.suspect&&niv===p.niv?p.suspect:null};
    }
  }

  function resume_(){
    var r={};
    for(var i=0;i<journal.length;i++)r[journal[i].type]=(r[journal[i].type]||0)+1;
    return r;
  }
  function texte_(){
    var r=resume_();
    var tete='Journal de fluidité — '+journal.length+' ligne(s) : '+(Object.keys(r).map(function(k){return k+' ×'+r[k];}).join(', ')||'rien noté');
    var lignes=journal.slice(-MAX).map(function(e){
      var h=new Date(e.t).toLocaleTimeString('fr-BE');
      var det=[];
      for(var a in e)if(a!=='t'&&a!=='type'&&a!=='cle')det.push(a+'='+e[a]);
      return h+'  '+e.type+'  '+e.cle+'  '+det.join(' ');
    });
    return entete_()+textePerf_()+tete+'\n'+lignes.join('\n')+'\n— FIN DU JOURNAL ('+journal.length+' ligne(s)) —';
  }

  function moteurTexte_(){
    try{
      var ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
      if(!ML||typeof ML.etatDiag!=='function')return 'jeu local indisponible (module absent)';
      var e=ML.etatDiag();
      if(e.demarre&&!e.echec)return 'JEU LOCAL actif (calcul dans la page)'+(e.conflit?' · conflit : partie reprise sur un autre appareil':'');
      return 'MODE SERVEUR (jeu local inactif) · '+(!e.capable?'navigateur incapable (Worker/WebAssembly/IndexedDB) · ':'')+(!e.actif?'coupé par ?local=0 · ':'')+(e.echec?'démarrage échoué : '+(e.raison||'?')+' · ':'')+(e.actif&&e.capable&&!e.echec&&!e.demarre?'pas encore démarré ou interrupteur général coupé · ':'');
    }catch(_e){return '?';}
  }

  /* En-tête du texte copié : tout ce qu'il faut pour comprendre le journal sans poser de question. */
  function entete_(){
    try{
      var nav=window.navigator||{},cn=nav.connection||{},ctx=contexte_(),v='?';
      try{var sc=document.querySelector('script[src*="soreal-idle-ui.js"]');var mm=sc&&/[?&]v=([^&]+)/.exec(sc.getAttribute('src')||'');if(mm)v=mm[1];}catch(_e){}
      return '=== SOREAL IDLE — journal de diagnostic ==='+'\n'+
        'relevé : '+new Date().toLocaleString('fr-BE')+' · mode '+modeJeu+' · version client ?v='+v+'\n'+
        'appareil : '+String(nav.userAgent||'?').slice(0,110)+' · '+(nav.hardwareConcurrency||'?')+' coeurs · mémoire '+(nav.deviceMemory||'?')+' Go · écran '+(window.innerWidth||'?')+'x'+(window.innerHeight||'?')+' ×'+(window.devicePixelRatio||'?')+'\n'+
        'réseau : '+(cn.effectiveType||'?')+' · aller-retour '+(cn.rtt!==undefined?cn.rtt:'?')+' ms · débit '+(cn.downlink!==undefined?cn.downlink:'?')+' Mb/s (estimations du navigateur : « 4g » est son maximum, même en fibre)'+'\n'+
        'moteur : '+moteurTexte_()+'\n'+
        'au moment de la copie : menu '+(ctx.menu||'?')+' · combat '+(ctx.combat===undefined?'?':ctx.combat)+'\n\n';
    }catch(_e){return '';}
  }

  function fermer_(){var o=document.getElementById('soreal-idle-diag-v1');if(o)o.remove();}
  function ouvrir_(){
    fermer_();
    var o=document.createElement('div');
    o.id='soreal-idle-diag-v1';
    o.setAttribute('data-sans-traduction','1');
    o.style.cssText='position:fixed;inset:0;z-index:100003;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
    o.innerHTML='<div role="dialog" aria-modal="true" style="width:min(720px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#dce5f3;font:14px system-ui,sans-serif">'+
      '<h3 style="margin:0 0 6px;font-size:18px">🩺 Journal de fluidité</h3>'+
      '<div style="color:#8fa3c9;margin-bottom:8px">Reculs de barres, pauses de validation et Or « rendu » observés dans le menu Augmentations, sur cet appareil. Rien n’est envoyé : copie le texte pour me le transmettre.</div>'+
      '<textarea id="soreal-idle-diag-texte-v1" readonly style="width:100%;min-height:240px;box-sizing:border-box;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#0f1729;color:#eef4fc;padding:10px;font:12px ui-monospace,monospace"></textarea>'+
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">'+
        '<button type="button" id="soreal-idle-diag-vider-v1" style="padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;cursor:pointer">Vider</button>'+
        '<button type="button" id="soreal-idle-diag-copier-v1" style="padding:9px 16px;border-radius:10px;border:1px solid #5b93e6;background:#2f6fd0;color:#eef4fc;cursor:pointer">Copier</button>'+
        '<button type="button" id="soreal-idle-diag-fermer-v1" style="padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;cursor:pointer">Fermer</button>'+
      '</div></div>';
    document.body.appendChild(o);
    var ta=document.getElementById('soreal-idle-diag-texte-v1');
    ta.value=texte_();
    document.getElementById('soreal-idle-diag-fermer-v1').addEventListener('click',fermer_);
    document.getElementById('soreal-idle-diag-vider-v1').addEventListener('click',function(){journal=[];dernierParCle={};sauver_();ta.value=texte_();});
    document.getElementById('soreal-idle-diag-copier-v1').addEventListener('click',function(){
      ta.select();
      try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value);else document.execCommand('copy');}catch(_e){}
    });
    o.addEventListener('mousedown',function(e){if(e.target===o)fermer_();});
  }

  setInterval(function(){try{echantillon_();}catch(_e){}},PERIODE_MS);
  setInterval(assurerBouton_,3000);

  /*
   * Sonde de fluidité du téléphone (Norman, 2026-10-08 : « lancé depuis SOREAL APP, le jeu rame ; depuis Chrome ou son APK, non »). Administrateur seulement, rien n'est envoyé. Toutes les 10 s elle relève :
   *   - mode : « iframe » (jeu intégré dans une autre page, ex. SOREAL APP) ou « direct » ;
   *   - fps / pire_ms / lentes : cadence des images (requestAnimationFrame), pire image, nombre d'images de plus de 50 ms ;
   *   - taches / taches_ms / tache_max_ms : tâches « longues » (plus de 50 ms) qui ont bloqué le fil d'exécution (PerformanceObserver longtask).
   * Lecture : des tâches longues = le fil est occupé par du code (le jeu ou la page qui l'héberge) ; peu de tâches longues mais peu d'images = le dessin est lent (composition de la fenêtre intégrée).
   * Les 4 derniers relevés de chaque mode sont gardés (soreal_idle_perf_v1) et listés en tête du journal : on compare « iframe » et « direct » sans rien écrire.
   */
  var CLE_PERF='soreal_idle_perf_v1';
  var modeJeu='direct';
  try{modeJeu=window.parent!==window?'iframe':'direct';}catch(_e){modeJeu='iframe';}
  var perf={};
  try{var bp=localStorage.getItem(CLE_PERF);if(bp){var op=JSON.parse(bp);if(op&&typeof op==='object')perf=op;}}catch(_e){}
  var sonde={actif:false,images:0,somme:0,pire:0,lentes:0,dernier:0,taches:0,tachesMs:0,tacheMax:0};
  function estAdmin_(){try{return typeof window.__SOREAL_IDLE_EST_ADMIN_V1__==='function'&&window.__SOREAL_IDLE_EST_ADMIN_V1__()===true;}catch(_e){return false;}}
  function raz_(){sonde.dernier=0;sonde.images=0;sonde.somme=0;sonde.pire=0;sonde.lentes=0;sonde.taches=0;sonde.tachesMs=0;sonde.tacheMax=0;}
  function image_(t){
    if(sonde.dernier){
      var d=t-sonde.dernier;
      /* Un onglet resté caché puis revenu donne une image « géante » qui n'est pas une lenteur : ignorée au-delà de 1 s. */
      if(d<1000){sonde.images+=1;sonde.somme+=d;if(d>sonde.pire)sonde.pire=d;if(d>50)sonde.lentes+=1;}
    }
    sonde.dernier=t;
    if(sonde.actif)requestAnimationFrame(image_);
  }
  function demarrerSonde_(){
    if(sonde.actif)return;
    sonde.actif=true;
    try{
      if(typeof PerformanceObserver==='function'){
        var po=new PerformanceObserver(function(liste){
          liste.getEntries().forEach(function(e){sonde.taches+=1;sonde.tachesMs+=e.duration;if(e.duration>sonde.tacheMax)sonde.tacheMax=e.duration;tacheLongue_(e.startTime,e.duration);});
        });
        po.observe({type:'longtask',buffered:false});
      }
    }catch(_e){}
    requestAnimationFrame(image_);
  }
  function relever_(){
    if(!estAdmin_())return;
    if(!sonde.actif){demarrerSonde_();return;}
    if(document.hidden){raz_();return;}
    if(sonde.images<20)return;
    var releve={t:Date.now(),fps:Math.round(1000/(sonde.somme/sonde.images)),pire_ms:Math.round(sonde.pire),lentes:sonde.lentes,taches:sonde.taches,taches_ms:Math.round(sonde.tachesMs),tache_max_ms:Math.round(sonde.tacheMax)};
    raz_();
    sonde.dernier=0;
    var liste=Array.isArray(perf[modeJeu])?perf[modeJeu]:[];
    liste.push(releve);
    perf[modeJeu]=liste.slice(-4);
    try{localStorage.setItem(CLE_PERF,JSON.stringify(perf));}catch(_e){}
  }
  setInterval(function(){try{relever_();}catch(_e){}},10000);
  function textePerf_(){
    var lignes=[];
    ['iframe','direct'].forEach(function(m){
      (Array.isArray(perf[m])?perf[m]:[]).forEach(function(r){
        lignes.push(new Date(r.t).toLocaleTimeString('fr-BE')+'  mode='+m+'  '+r.fps+' images/s · pire image '+r.pire_ms+' ms · '+r.lentes+' lentes · '+r.taches+' tâche(s) longue(s) ('+r.taches_ms+' ms au total, max '+r.tache_max_ms+' ms)');
      });
    });
    return lignes.length?'Fluidité mesurée (4 derniers relevés de 10 s par mode) :\n'+lignes.join('\n')+'\n\n':'';
  }

  window.__SOREAL_IDLE_DIAG_V1__={
    journal:function(){return journal.slice();},
    resume:resume_,
    texte:texte_,
    ouvrir:ouvrir_,
    vider:function(){journal=[];dernierParCle={};sauver_();},
    /* Une erreur avalée par un try/catch de la logique de jeu : notée sans bruit pour le joueur (une ligne par clé toutes les 5 s). */
    signaler:function(cle,e){try{noter_('erreur_avalee',String(cle||'?'),{msg:String(e&&e.message||e).slice(0,120)});}catch(_e){}},
    /* Pour les tests : entre dans l'échantillonnage sans minuteur. */
    echantillon:echantillon_,
    ecartRituels:ecartRituels_,
    ecartCombat:ecartCombat_,
    reponseRecue:reponseRecue_,
    tacheLongue:tacheLongue_,
    combatLance:combatLance_,
    lotEnvoye:lotEnvoye_,
    echantillonVie:echantillonVie_,
    signalement:signalement_,
    lotTermine:lotTermine_,
    perf:function(){return JSON.parse(JSON.stringify(perf));},
    mode:modeJeu,
    /* Pour les tests : un relevé sans attendre 10 s ni images réelles. */
    releverPour:function(mode,releve){perf[mode]=(Array.isArray(perf[mode])?perf[mode]:[]).concat([releve]).slice(-4);}
  };
  window.__diagFluiditeOuvrirV1__=ouvrir_;

  /*
   * AUDIT DU REDESSIN (Norman, 2026-10-15 : « la page se redessine à intervalle régulier ; fais en sorte que ça ne s'installe plus jamais », AGENTS.md règle n°4). La page de plusieurs menus est redessinée en direct toutes les 4 s
   * (modules/morph-v1.js compare le HTML neuf à la page). Tout ce qu'un module AJOUTE après le rendu (attributs, couches de particules, boutons) doit survivre à ce redessin ; sinon cela disparaît puis revient quelques
   * dizaines de millisecondes plus tard, à intervalle régulier. Dans la console, menu ouvert :
   *     await window.__auditerRedessinIdleV1__()      // ou ('ngu')
   * -> { menu, remplaces: {élément: nombre}, attributsPerdus: {nom: nombre} }. Les spans « nb-suf » (couleur des nombres) et les textes sont recréés dans la même image : normal.
   * Tout le reste doit être VIDE ; sinon : data-morph-garder sur le bloc ajouté, ou le nom de l'attribut dans window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__.
   */
  window.__auditerRedessinIdleV1__=function(menu){
    return new Promise(function(fin){
      if(menu&&typeof window.__menuIdleV28__==='function')try{window.__menuIdleV28__(menu);}catch(_e){}
      setTimeout(function(){
        var racine=document.querySelector('.soreal-idle-page-root-v28');
        if(!racine||typeof window.__rafraichirPageIdleV1__!=='function')return fin({erreur:'page ou outil indisponible'});
        var noms=function(e){return Array.prototype.map.call(e.attributes,function(a){return a.name;});};
        var els=Array.prototype.slice.call(racine.querySelectorAll('*')),avant=els.map(noms);
        window.__rafraichirPageIdleV1__();
        var remplaces={},perdus={};
        els.forEach(function(e,i){
          if(!document.contains(e)){var k=e.tagName+'.'+String(e.className||'').slice(0,26);remplaces[k]=(remplaces[k]||0)+1;return;}
          var maintenant=noms(e);
          avant[i].forEach(function(n){if(maintenant.indexOf(n)===-1)perdus[n]=(perdus[n]||0)+1;});
        });
        fin({menu:racine.getAttribute('data-menu'),remplaces:remplaces,attributsPerdus:perdus});
      },menu?1800:0);
    });
  };
})();
