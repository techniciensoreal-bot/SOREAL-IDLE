/*
 * SOREAL IDLE — page Achievements (succès, bonus d'AP) et Player Portraits.
 * Moteurs : cloudflare/src/idle-achievements-v1.js et idle-portraits-v1.js ; le serveur publie
 * j.systemes.achievements et j.systemes.portraits. Branché par une seule ligne dans
 * pageSystemeMetaIdleV130_ (meta-progression-v130.js) ; les actions passent par
 * window.__SOREAL_IDLE_META_V130__.actionMetaIdleV130_.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PROFILE_V1__)return;

  function hote(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html(v){const h=hote();return h&&h.idleHtml_?h.idleHtml_(v):String(v==null?'':v);}
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function pct(v){return nombre(v).toFixed(2).replace('.',',')+' %';}
  function entete(titre,sous){const h=hote();return h&&h.entetePageIdleV28_?h.entetePageIdleV28_(titre,sous):'<h1>'+titre+'</h1><p>'+sous+'</p>';}

  function action(payload){
    const meta=window.__SOREAL_IDLE_META_V130__;
    if(meta&&typeof meta.actionMetaIdleV130_==='function')meta.actionMetaIdleV130_(payload);
  }
  window.__profilChoisirPortraitIdleV1__=function(id){action({action:'portrait',id:String(id)});};

  /*
   * Catégories de succès (Norman, 2026-09-26 : « accorde plus d'importance au visuel des Achievements : des emoji, de la couleur, pour appuyer les catégories »).
   * Chaque catégorie a son emoji et sa couleur ; la même table sert à l'annonce en fondu d'un succès débloqué (achievement-notice-v1.js).
   */
  const GROUPES_STYLE={
    energyPower:{nom:'Puissance d’énergie',emoji:'⚡',couleur:'#f2a900'},
    magicPower:{nom:'Puissance de magie',emoji:'🔮',couleur:'#9b5cf6'},
    energyCap:{nom:'Plafond d’énergie',emoji:'🔋',couleur:'#f97316'},
    magicCap:{nom:'Plafond de magie',emoji:'🧪',couleur:'#4f6bff'},
    energyBars:{nom:'Barres d’énergie',emoji:'📊',couleur:'#14b8a6'},
    magicBars:{nom:'Barres de magie',emoji:'📈',couleur:'#ec4899'},
    boss:{nom:'Boss vaincus',emoji:'👹',couleur:'#ef4444'},
    rebirth:{nom:'Renaissances',emoji:'♻️',couleur:'#22c55e'},
    secret:{nom:'Secrets',emoji:'🕵️',couleur:'#d4a017'}
  };
  window.__SOREAL_IDLE_SUCCES_GROUPES_V1__=GROUPES_STYLE;

  /*
   * Page des succès refaite (Norman, 2026-10-10) : TOUS les trophées sont des cases ; les obtenus sont en couleur, médaille bronze / argent / or / platine / diamant selon leur valeur en BP, les autres sont grisés. L'objectif est écrit
   * « ????? » tant que ce à quoi il se rapporte n'est pas débloqué (le serveur ne l'envoie même pas) et la case dit toujours quel boss tuer pour voir les infos. Exception voulue à la règle n°2 d'AGENTS.md.
   */
  const PALIERS=[
    {id:'bronze',nom:'Bronze',max:10,c1:'#f0b27a',c2:'#b87333',c3:'#6b3f16'},
    {id:'argent',nom:'Argent',max:25,c1:'#ffffff',c2:'#b7c0cf',c3:'#6a7486'},
    {id:'or',nom:'Or',max:40,c1:'#fff1a6',c2:'#f0b81c',c3:'#8f6100'},
    {id:'platine',nom:'Platine',max:55,c1:'#e6fffd',c2:'#6fd1cf',c3:'#23807e'},
    {id:'diamant',nom:'Diamant',max:Infinity,c1:'#ffffff',c2:'#7de8ff',c3:'#8a5cff'}
  ];
  function palierDe(bp){const b=nombre(bp);return PALIERS.find(function(p){return b<=p.max;})||PALIERS[PALIERS.length-1];}
  function nb(v){const h=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;return h&&h.entierLisible?h.entierLisible(v):String(nombre(v));}
  const SECRETS_FR={
    secretExploder:'Survivre à l’attaque d’un ennemi explosif',
    secretLevel69:'Porter un set complet (casque, plastron, jambières, bottes, arme), tout au niveau 69',
    secretNguMenu:'Débloquer le menu NGU',
    secretYggdrasilMenu:'Débloquer le menu Yggdrasil',
    secretBeardsMenu:'Débloquer le menu Barbes',
    secretNoHitGrb:'Vaincre Gordon Ramsay Bolton avant qu’il ait pu attaquer une seule fois',
    secretNoHitGct:'Vaincre Grand Corrupted Tree avant qu’il ait pu attaquer une seule fois',
    secretNoHitJake:'Vaincre Jake From Accounting avant qu’il ait pu attaquer une seule fois',
    secretNoHitUug:'Vaincre UUG, l’Innommable, avant qu’il ait pu attaquer une seule fois',
    secretAtCorner:'Cliquer sur le coin en bas à droite du menu Entraînement avancé',
    secretWalderpFinal:'Vaincre la forme finale de WALDERP',
    secretNoHitWalderp:'Vaincre la forme finale de WALDERP avant qu’elle ait pu attaquer une seule fois',
    secretSpeedrun:'Enchaîner 3 Renaissances de moins de 30 minutes chacune, avec le boss 37 vaincu',
    secretBeastV1:'Vaincre LA BÊTE V1',secretBeastV2:'Vaincre LA BÊTE V2',secretBeastV3:'Vaincre LA BÊTE V3',secretBeastV4:'Vaincre LA BÊTE V4',
    secretEvil:'Entrer pour la première fois en difficulté Maléfique'
  };
  /* Objectif d'un succès, en français ; vide si le serveur ne l'a pas envoyé (pas encore visible). */
  function objectif(x){
    if(x.name===undefined&&x.threshold===undefined)return '';
    const t=nombre(x.threshold);
    switch(x.group){
      case 'energyPower':return 'Atteindre '+nb(t)+' de Puissance d’énergie';
      case 'magicPower':return 'Atteindre '+nb(t)+' de Puissance de magie';
      case 'energyCap':return 'Avoir '+nb(t)+' de plafond d’énergie au total';
      case 'magicCap':return 'Avoir '+nb(t)+' de plafond de magie au total';
      case 'energyBars':return 'Avoir '+nb(t)+' barres d’énergie au total';
      case 'magicBars':return 'Avoir '+nb(t)+' barres de magie au total';
      case 'boss':return 'Vaincre le boss '+nb(t);
      case 'rebirth':return t===1?'Renaître une fois':'Renaître '+nb(t)+' fois';
      default:return SECRETS_FR[x.id]||String(x.name||'');
    }
  }
  window.__SOREAL_IDLE_SUCCES_OBJECTIF_V1__=objectif;

  function styleSucces(){
    if(typeof document.createElement!=='function'||!document.head||document.getElementById('soreal-idle-succes-style-v2'))return;
    const anc=document.getElementById('soreal-idle-succes-style-v1');
    if(anc&&anc.parentNode)anc.parentNode.removeChild(anc);
    const st=document.createElement('style');
    st.id='soreal-idle-succes-style-v2';
    st.textContent=
      '.idle-succes-resume-v1{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}'+
      '.idle-succes-tuile-v1{padding:12px 10px;border-radius:14px;text-align:center;color:#fff;font-size:13px;font-weight:850;box-shadow:0 4px 14px rgba(20,30,60,.16)}'+
      '.idle-succes-tuile-v1 .ic{display:block;font-size:22px;line-height:1.1;margin-bottom:3px}'+
      '.idle-succes-tuile-v1 b{display:block;margin-top:2px;font-size:17px;font-weight:950}'+
      '.sc-legende{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:center;margin:4px 0 12px;font-size:12.5px;font-weight:850;color:#dfe6ff}'+
      '.sc-legende span{display:inline-flex;align-items:center;gap:6px}'+
      '.sc-groupe{margin:0 0 14px;border-radius:16px;border:1px solid color-mix(in srgb,var(--acc) 55%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 14%,#0b1020),#0b1020 70%);overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.3)}'+
      '.sc-groupe>header{display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(100deg,color-mix(in srgb,var(--acc) 70%,#0b1020),color-mix(in srgb,var(--acc) 38%,#0b1020));color:#fff;font-weight:950;font-size:15px;text-shadow:0 1px 2px rgba(0,0,0,.5)}'+
      '.sc-groupe>header .em{font-size:23px}'+
      '.sc-groupe>header .nb{margin-left:auto;padding:2px 12px;border-radius:999px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.35);font-size:13.5px}'+
      '.sc-cases{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:12px}'+
      '.sc-case{--c1:#fff;--c2:#aaa;--c3:#555;position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 8px 10px;border-radius:14px;text-align:center;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,#171f38,#0f1527);min-height:176px}'+
      '.sc-case.fait{border-color:var(--c2);box-shadow:0 0 0 1px color-mix(in srgb,var(--c2) 40%,transparent),0 6px 18px color-mix(in srgb,var(--c2) 35%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--c2) 24%,#171f38),#0f1527 80%)}'+
      '.sc-med{position:relative;width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:27px;line-height:1;'+
        'background:radial-gradient(circle at 32% 26%,var(--c1),var(--c2) 52%,var(--c3) 100%);box-shadow:inset 0 -4px 8px rgba(0,0,0,.35),inset 0 3px 5px rgba(255,255,255,.55),0 3px 8px rgba(0,0,0,.5);border:3px solid color-mix(in srgb,var(--c3) 70%,#000)}'+
      '.sc-med::before{content:"";position:absolute;inset:6px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--c1) 70%,transparent)}'+
      '.sc-med i{position:relative;font-style:normal;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))}'+
      '.sc-case.visible .sc-med,.sc-case.cache .sc-med{filter:grayscale(1) brightness(.5)}'+
      '.sc-case.cache .sc-med i{font-weight:1000;color:#fff;font-size:24px}'+
      '.sc-nom{font-size:13px;font-weight:850;line-height:1.3;color:#eef2ff;min-height:34px;display:flex;align-items:center;justify-content:center}'+
      '.sc-case.visible .sc-nom,.sc-case.cache .sc-nom{color:#8e98b8}'+
      '.sc-case.cache .sc-nom{letter-spacing:.25em;font-weight:1000}'+
      '.sc-bp{margin-top:auto;padding:2px 10px;border-radius:999px;font-size:12.5px;font-weight:950;color:#fff;background:color-mix(in srgb,var(--c3) 75%,#0b1020);border:1px solid color-mix(in srgb,var(--c2) 60%,transparent)}'+
      '.sc-case:not(.fait) .sc-bp{opacity:.55}'+
      '.sc-boss{font-size:11.5px;font-weight:800;color:#f5c451;line-height:1.3}'+
      '.sc-etat{font-size:11.5px;font-weight:800;color:#6fe0a0}'+
      '.sc-case.visible .sc-etat{color:#8e98b8}'+
      '@media (max-width:520px){.sc-cases{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:9px}.sc-case{min-height:166px}}';
    document.head.appendChild(st);
  }

  function caseSucces(x){
    const p=palierDe(x.bp);
    const g=GROUPES_STYLE[x.group]||{emoji:'🏆'};
    const style='--c1:'+p.c1+';--c2:'+p.c2+';--c3:'+p.c3;
    const etat=x.unlocked?'fait':(x.voirApresBoss>0?'cache':'visible');
    const nom=etat==='cache'?'?????':html(objectif(x));
    const icone=etat==='cache'?'?':g.emoji;
    const bas=etat==='fait'?'<span class="sc-etat">✔ Débloqué</span>'
      :(etat==='cache'?'<span class="sc-boss">🔒 Tue le boss '+nb(x.voirApresBoss)+' pour voir les infos</span>':'<span class="sc-etat">Pas encore débloqué</span>');
    return '<div class="sc-case '+etat+'" style="'+style+'" title="'+p.nom+' · '+nombre(x.bp)+' BP"><span class="sc-med"><i>'+icone+'</i></span>'+
      '<span class="sc-nom">'+nom+'</span>'+bas+'<span class="sc-bp">'+nombre(x.bp)+' BP</span></div>';
  }

  function blocSucces(a){
    styleSucces();
    const liste=Array.isArray(a.list)?a.list:[];
    const faits=liste.filter(function(x){return x.unlocked;}).length;
    const groupes=Object.keys(GROUPES_STYLE).map(function(g){
      const items=liste.filter(function(x){return x.group===g;});
      if(!items.length)return '';
      const st=GROUPES_STYLE[g];
      const fait=items.filter(function(x){return x.unlocked;}).length;
      return '<section class="sc-groupe" style="--acc:'+st.couleur+'"><header><span class="em">'+st.emoji+'</span><span>'+html(st.nom)+'</span><span class="nb">'+fait+' / '+items.length+'</span></header>'+
        '<div class="sc-cases">'+items.map(caseSucces).join('')+'</div></section>';
    }).join('');
    const tuile=function(icone,libelle,valeur,fond){
      return '<div class="idle-succes-tuile-v1" style="background:'+fond+'"><span class="ic">'+icone+'</span>'+libelle+'<b>'+valeur+'</b></div>';
    };
    const legende='<div class="sc-legende">'+PALIERS.map(function(p,i){
      const avant=i?PALIERS[i-1].max+1:5;
      const plage=p.max===Infinity?avant+' BP et plus':(i?avant+' à '+p.max+' BP':'jusqu’à '+p.max+' BP');
      return '<span><span class="sc-med" style="--c1:'+p.c1+';--c2:'+p.c2+';--c3:'+p.c3+';width:22px;height:22px;font-size:0;border-width:2px"></span>'+p.nom+' · '+plage+'</span>';
    }).join('')+'</div>';
    return '<div class="idle-succes-resume-v1">'+
        tuile('🏅','Succès',faits,'linear-gradient(135deg,#f2a900,#f97316)')+
        tuile('💎','Bonus Points',nombre(a.bp)+' BP','linear-gradient(135deg,#4f6bff,#9b5cf6)')+
        tuile('💠','Bonus d’AP','+'+pct((nombre(a.apMultiplier)-1)*100),'linear-gradient(135deg,#14b8a6,#22c55e)')+
      '</div>'+
      '<div class="soreal-idle-note-v4" style="margin:6px 0">+1 % d’AP par tranche de 100 BP. Un objectif reste caché tant que le boss indiqué n’est pas vaincu.</div>'+
      legende+groupes;
  }

  function blocPortraits(p){
    if(!p)return '';
    const liste=Array.isArray(p.list)?p.list:[];
    /* ANTI-SPOIL (2026-09-24) : uniquement les portraits déjà débloqués (pas de bouton verrouillé ni de condition). */
    const boutons=liste.filter(function(x){return x.unlocked;}).map(function(x){
      const choisi=x.id===p.selected;
      /* Vignette = l'image R2 du portrait ; sans image : silhouette en grand, centrée. */
      const vignette='<span class="idle-portrait-thumb-v1">'+
        '<img src="/api/idle/media/player?portrait='+encodeURIComponent(x.file)+'" alt="" loading="lazy" draggable="false" '+
          'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
        '<span class="idle-emoji-fallback-v1" data-n="1" style="display:none">🧑</span></span>';
      return '<button type="button" class="soreal-idle-expand-button-v25 idle-portrait-btn-v1"'+
        (choisi?' disabled':' onclick="window.__profilChoisirPortraitIdleV1__(\''+html(x.id)+'\')"')+'>'+
        vignette+'<span>'+(choisi?'✅ ':'')+html(x.name)+'</span></button>';
    }).join('');
    const auto=p.auto?'<div class="soreal-idle-note-v4" style="margin-top:8px">🛡️ Les 4 pièces du set <b>'+html(p.auto.name)+'</b> sont équipées : ton héros en porte l’armure. Retire une pièce pour retrouver ton portrait choisi.</div>':'';
    return '<div class="soreal-idle-section-v8">'+
        '<div class="soreal-idle-window-title-v31">🖼️ Player Portraits — '+nombre(p.unlockedCount)+'</div>'+
        '<div class="soreal-idle-note-v4">Portrait du héros en combat (cosmétique). Chaque portrait se débloque en jouant ; seuls ceux que tu as obtenus apparaissent.</div>'+
        auto+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+boutons+'</div>'+
      '</div>';
  }

  function page(j){
    const s=(j&&j.systemes)||{};
    return entete('🎖️ Achievements','Succès, Bonus Points et portraits du héros.')+
      (s.achievements?blocSucces(s.achievements):'')+
      blocPortraits(s.portraits);
  }

  window.__SOREAL_IDLE_PROFILE_V1__={page:page};
})();
