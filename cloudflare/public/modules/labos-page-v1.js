/*
 * SOREAL IDLE — page « Labos » (Norman, 2026-11-08 : « remplace les mineurs par les labos dans le jeu ; change le menu Mineurs par Labos ; refais toute la page »).
 * Les anciens mineurs d'or sont devenus des LABOS : chacun est une pièce de donjon (une image de décor propre, voir modules/labos-savants-v1.js) où un savant fou brasse une potion
 * qui améliore quelque chose. Au travail, le savant marche derrière l'établi et verse sa potion dans le flacon, les tubes et le bécher ; au repos, la pièce est dans la pénombre et
 * le savant garde les bras baissés. Le moteur est inchangé : ce sont toujours les « Diggers » (diggerView, idle-ngu-systemes.js) ; aucune formule n'est refaite ici.
 *
 * Anti-spoil (AGENTS.md règle n°2) : un labo n'apparaît que quand l'étage précédent a au moins un labo ouvert ; jamais un prix ni un nom de ce qui n'est pas encore atteint, jamais
 * l'ensemble des décors (chaque carte ne montre que SA pièce). Dépendances (lues à l'exécution) : window.__SOREAL_IDLE_META_HOST_V130__, window.__SOREAL_IDLE_META_PARTAGE_V130__ et
 * window.__SOREAL_IDLE_LABOS_SAVANTS_V1__ (le dessin des savants). Expose window.__SOREAL_IDLE_LABOS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_LABOS_PAGE_V1__)return;

  function H(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function S(){return window.__SOREAL_IDLE_LABOS_SAVANTS_V1__;}
  function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}

  /* Les étages, du plus proche de l'entrée au plus profond (mêmes paliers de coût que le moteur). */
  var ETAGES=[
    {cls:'g1',titre:'Le rez-de-chaussée',ids:['drop','wandoos','stats','adventure']},
    {cls:'g2',titre:'Le premier étage',ids:['energyNgu','magicNgu']},
    {cls:'g3',titre:'Le deuxième étage',ids:['energyBeard','magicBeard']},
    {cls:'g4',titre:'Les sous-sols',ids:['pp','daycare']},
    {cls:'g5',titre:'Les caves profondes',ids:['blood','experience']}
  ];
  /* Ce que chaque labo améliore (les noms et les potions viennent du module des savants). */
  var EFFETS={
    drop:'chance de drop',wandoos:'rendement de Wandoos',stats:'tes statistiques',adventure:'stats d’Aventure',
    energyNgu:'vitesse des NGU d’énergie',magicNgu:'vitesse des NGU de magie',energyBeard:'vitesse des barbes d’énergie',magicBeard:'vitesse des barbes de magie',
    pp:'gain de PP',daycare:'vitesse de la garderie',blood:'gain de sang',experience:'gain d’EXP'
  };
  var DOSSIER='/img/mineurs/labos/';
  function images_(){
    var o={decor:{},etabli:DOSSIER+'etabli.webp',flacon:DOSSIER+'flacon.webp',tubes:DOSSIER+'tubes.webp',becher:DOSSIER+'becher.webp'};
    var c=S().cellules;for(var id in c)o.decor[id]=DOSSIER+c[id];
    return o;
  }
  var ORDRE=[];ETAGES.forEach(function(g){g.ids.forEach(function(id){ORDRE.push(id);});});
  /* La scène d'un labo (SVG 316 x 268). Le départ de chaque savant est décalé (un douzième de cycle par labo) : ils ne bougent pas tous ensemble. */
  function scene(id,travaille){
    var i=ORDRE.indexOf(id);
    return S().scene(id,images_(),Boolean(travaille),(i<0?0:i)/ORDRE.length);
  }

  /* ---------- le style (injecté une fois ; le dessin et les animations des savants viennent de labos-savants-v1.js) ---------- */
  var STYLE_ID='soreal-idle-labos-style-v1';
  var P='html body.soreal-idle-active-v47.soreal-idle-active-v47 ';
  function style_(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=[
      '.lp-page{display:grid;gap:12px;font-family:"Russo One",system-ui,sans-serif}',
      '.lp-haut{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '@media (max-width:560px){.lp-haut{grid-template-columns:1fr}}',
      '.lp-pan{background:linear-gradient(180deg,#3b2a57,#221832);border:3px solid #000;border-radius:12px;padding:10px;box-shadow:inset 0 2px 0 rgba(255,255,255,.12);color:#f1e8ff}',
      '.lp-pan h3{font:400 21px Bangers,cursive;margin:0 0 6px;color:#ffcf4a;letter-spacing:.05em;text-shadow:0 2px 0 #000}',
      '.lp-jauge{height:20px;border:3px solid #000;border-radius:8px;background:#150d20;overflow:hidden;position:relative}',
      '.lp-jauge i{position:absolute;inset:0;transform-origin:0 50%;background:linear-gradient(180deg,#b9ff9a,#33b45a)}',
      '.lp-jauge i.fort{background:linear-gradient(180deg,#ff8a6a,#b3261e)}',
      '.lp-petit{font-size:12px;opacity:.92;margin-top:5px;line-height:1.35}',
      '.lp-petit b{color:#ffd06a}.lp-petit .ok{color:#8cf5a4}',
      '.lp-fioles{display:flex;gap:8px;flex-wrap:wrap}',
      '.lp-fiole{width:28px;height:38px}',
      '.lp-donjon{border:4px solid #000;border-radius:14px;overflow:hidden;background:#150f1d}',
      '.lp-etage{padding:8px 8px 2px}',
      '.lp-nometage{font:400 19px Bangers,cursive;letter-spacing:.06em;margin:0 0 6px 4px;color:#fff;text-shadow:0 2px 0 #000}',
      '.g1{background:linear-gradient(180deg,#5b4326,#3f2c18)}.g2{background:linear-gradient(180deg,#2e4a52,#223540)}.g3{background:linear-gradient(180deg,#3a3f5a,#2a2d46)}.g4{background:linear-gradient(180deg,#4a2a55,#34193e)}.g5{background:linear-gradient(180deg,#5a1f22,#3b1114)}',
      /* la carte d'un labo EST la scène : l'image remplit le cadre, le nom et l'effet sont posés en haut, les boutons en bas, par-dessus le décor */
      /* Grille (Norman, 2026-11-08 : « sur PC, les images doivent être plus grandes pour que les 4 images prennent toute une ligne ») : la largeur de la page décide (requête de conteneur), pas celle de la fenêtre ; 4 colonnes quand la place le permet (le premier étage a 4 labos : ils remplissent la ligne), 2 en largeur moyenne, 1 sur téléphone. Les étages de 2 labos gardent la même taille de carte. */
      '.lp-donjon{container-type:inline-size}',
      '.lp-liste{display:grid;grid-template-columns:1fr;gap:10px;margin:0 0 8px}',
      '@container (min-width:600px){.lp-liste{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '@container (min-width:1000px){.lp-liste{grid-template-columns:repeat(4,minmax(0,1fr))}}',
      '.lp-labo{position:relative;aspect-ratio:316/268;overflow:hidden;border:3px solid #000;border-radius:12px;color:#f3e7cf;background:#140e12;box-shadow:0 3px 0 rgba(0,0,0,.5)}',
      '.lp-poste{position:absolute;inset:0}',
      '.lp-poste svg.lb{position:absolute;inset:0;width:100%;height:100%;display:block}',
      '.lp-hautb,.lp-basb{position:absolute;left:0;right:0;z-index:2;padding:6px 8px}',
      '.lp-hautb{top:0;background:linear-gradient(180deg,rgba(8,4,14,.84),rgba(8,4,14,.55) 70%,transparent)}',
      '.lp-basb{bottom:0;display:grid;gap:5px;padding-top:14px;background:linear-gradient(0deg,rgba(8,4,14,.9),rgba(8,4,14,.62) 72%,transparent)}',
      '.lp-titre{display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
      '.lp-titre b{font:400 19px Bangers,cursive;letter-spacing:.05em;color:#fff;text-shadow:0 2px 0 #000;line-height:1.05}',
      '.lp-niv{font-size:11px;opacity:.92;text-align:right;line-height:1.2}',
      '.lp-potion{font-size:11px;color:#d7c3ff;margin-top:1px;line-height:1.2}',
      '.lp-effet{font-size:12px;color:#ffe9a8;margin-top:2px;line-height:1.25}.lp-effet em{font-style:normal;color:#8cf5a4}',
      '.lp-ligne{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}',
      '.lp-ligne .lp-btn{flex:1 1 auto;min-width:0;padding:3px 6px;font-size:14px;min-height:34px}',
      '.lp-ligne .lp-btn.carre{flex:0 0 34px}',
      '.lp-btn{appearance:none;-webkit-appearance:none;border:3px solid #000;border-radius:6px;font:400 15px Bangers,cursive;letter-spacing:.05em;padding:4px 10px;min-height:36px;color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),2px 2px 0 #000;cursor:pointer;touch-action:manipulation}',
      '.lp-btn.vert{color:#f4edc9;background:linear-gradient(180deg,#4ea866,#256b3c)}',
      '.lp-btn.carre{min-width:36px;padding:4px 0}',
      /* Bouton grisé LISIBLE (Norman, 2026-11-08) : fond sombre neutre mais texte clair (contraste d'au moins 7 : 1) et bord net ; seul l'aspect plat dit « indisponible » */
      '.lp-btn:disabled,.lp-btn.lp-manque{cursor:default;color:#f1ead2;background:linear-gradient(180deg,#4a4650,#2c2a31);text-shadow:0 1px 0 #000;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),2px 2px 0 #000}',
      '.lp-btn:disabled small,.lp-btn.lp-manque small{opacity:1;color:#ffd978}',
      '.lp-btn small{font:400 11px "Russo One",sans-serif;opacity:.85;margin-left:4px}',
      '.lp-nivactif{min-width:56px;text-align:center;font-size:14px}',
      '.lp-labo.neuf .lp-poste{filter:saturate(.45) brightness(.8)}',
      /* polices du jeu (Norman : titres et boutons en Bangers, textes en Russo One) : la règle générale de la page impose Comic Neue en !important, il faut la même spécificité */
      P+'.lp-page{font-family:"Russo One",system-ui,sans-serif!important;font-weight:400!important}',
      P+'.lp-pan h3,'+P+'.lp-nometage,'+P+'.lp-titre b,'+P+'.lp-btn{font-family:Bangers,"Russo One",Impact,sans-serif!important;font-weight:400!important;letter-spacing:.05em!important}',
      P+'.lp-page :is(.lp-effet,.lp-niv,.lp-petit,.lp-nivactif,.lp-potion){font-family:"Russo One",system-ui,sans-serif!important;font-weight:400!important}',
      P+'.lp-btn small{font-family:"Russo One",sans-serif!important;font-size:11px!important}',
      P+'.lp-btn.carre{font-family:"Russo One",system-ui,sans-serif!important;font-size:19px!important;line-height:1!important}'
    ].join('\n')+'\n'+(S()?S().css():'');
    (document.head||document.documentElement).appendChild(s);
  }

  /* ---------- la page ---------- */
  function fioles_(places,actifs){
    var h='';
    for(var i=0;i<places;i++){
      var p=i<actifs;
      h+='<svg class="lp-fiole" viewBox="0 0 28 38" aria-hidden="true"><path d="M10 3h8v9l7 16a4 4 0 0 1-3.6 5.6H6.6A4 4 0 0 1 3 28l7-16z" fill="'+(p?'#3a2a5a':'#2a2a2a')+'" stroke="#000" stroke-width="2"/>'+(p?'<path d="M7 25h14l3 3.4a2 2 0 0 1-1.8 3H5.8a2 2 0 0 1-1.8-3z" fill="#9bff7a"/><circle cx="12" cy="22" r="1.6" fill="#d8ffc8"/><circle cx="17" cy="19" r="1.1" fill="#d8ffc8"/>':'')+'<rect x="9" y="1" width="10" height="4" rx="1.5" fill="'+(p?'#e0a21a':'#555')+'" stroke="#000" stroke-width="1.5"/></svg>';
    }
    return h;
  }
  function nombre_(x){return H().formatGrandNombreIdleV70_(Number(x)||0);}
  function mult_(x){
    x=Number(x)||1;
    if(x>=1000)return '×'+nombre_(x);
    return '×'+x.toLocaleString('fr-FR',{maximumFractionDigits:2});
  }
  function labo_(def,d,vue,or){
    var id=def.id,lab=(S()&&S().labos[id])||{nom:def.name||id,potion:''},effetNom=EFFETS[id]||'';
    var run=H().idleEntier_(d.runLevel||0),max=H().idleEntier_(d.maxLevel||0),on=Boolean(d.active)&&run>0;
    var v=(vue&&vue.items&&vue.items[id])||{};
    var etat=on?'on':(max>0?'repos':'neuf');
    var idH=H().idleHtml_(id);
    var coutTexte=v.nextCost!=null?nombre_(v.nextCost)+' Or':'au maximum';
    var abordable=v.nextCost!=null&&or>=v.nextCost;
    var effet=on
      ?'Maintenant : <em>'+mult_(v.multiplier)+' '+effetNom+'</em>'
      :(max>0?'S’il brassait au niveau '+run+' : <em>'+mult_(v.multiplier)+' '+effetNom+'</em>':'Il améliorera : <em>'+effetNom+'</em>');
    var drain=nombre_(run>0?v.drain:v.nextDrain);
    var h='<div class="lp-labo '+etat+'" data-labo="'+idH+'"><div class="lp-poste">'+scene(id,on)+'</div>'+
      '<div class="lp-hautb"><div class="lp-titre"><b>'+H().idleHtml_(lab.nom)+'</b><span class="lp-niv">'+(max>0?'niveau '+run+' sur '+max:'pas encore ouvert')+'<br>'+drain+' d’or/s</span></div>'+
      (max>0&&lab.potion?'<div class="lp-potion">'+H().idleHtml_(lab.potion)+'</div>':'')+
      '<div class="lp-effet">'+effet+'</div></div><div class="lp-basb">';
    if(max>0){
      h+='<div class="lp-ligne">'+
        /* Boutons indisponibles : aria-disabled + classe lp-manque + AUCUN onclick, jamais l'attribut « disabled » (la règle globale « body… button:disabled{color:#758198!important} » rendait leur texte gris sur gris) */
        '<button type="button" class="lp-btn carre'+(run<=0?' lp-manque':'')+'" '+(run<=0?'aria-disabled="true" ':'onclick="window.__setDiggerIdleV47__(\''+idH+'\','+Math.max(0,run-1)+')" ')+'aria-label="Baisser le niveau actif">−</button>'+
        '<span class="lp-nivactif">'+run+'</span>'+
        '<button type="button" class="lp-btn carre'+(run>=max?' lp-manque':'')+'" '+(run>=max?'aria-disabled="true" ':'onclick="window.__setDiggerIdleV47__(\''+idH+'\','+Math.min(max,run+1)+')" ')+'aria-label="Monter le niveau actif">+</button>'+
        '<button type="button" class="lp-btn'+(run>=max?' lp-manque':'')+'" '+(run>=max?'aria-disabled="true"':'onclick="window.__setDiggerIdleV47__(\''+idH+'\','+max+',true)"')+'>Au maximum</button></div>';
    }
    h+='<div class="lp-ligne">'+
      (max>0
        ?'<button type="button" class="lp-btn'+(on?'':' vert')+'" onclick="window.__toggleDiggerIdleV47__(\''+idH+'\','+(!on)+')">'+(on?'Mettre au repos':'Mettre au travail')+'</button>'
        :'')+
      /* Or manquant : grisé mais CLIQUABLE (le moteur répond). `or` vient de la dernière synchro (jusqu'à ~4 s) et l'Or arrive en continu : un bouton `disabled` resterait bloqué à tort jusqu'au redessin suivant. Seul « au maximum » (plus de prochain coût) est réellement désactivé. */
      '<button type="button" class="lp-btn'+(max>0?'':' vert')+(v.nextCost==null||!abordable?' lp-manque':'')+'" '+(v.nextCost==null?'aria-disabled="true" ':'onclick="window.__actionMetaV47__({action:\'upgradeDigger\',digger:\''+idH+'\'})"')+'>'+(max>0?'Améliorer le labo':'Ouvrir le labo')+'<small>'+H().idleHtml_(coutTexte)+'</small></button></div>'+
      '</div></div>';
    return h;
  }
  function page(j){
    style_();
    var s=systemeMetaParIdIdleV130_(j,'diggers');
    if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
    var data=s.state.data||{};
    var diggers=data.diggers||{};
    var m=(j&&j.systemes)||{};
    var vue=m.diggerView||{};
    var or=Number(m.currencies&&m.currencies.gold)||0;
    var daycareOk=Boolean(systemeMetaParIdIdleV130_(j,'daycare')&&systemeMetaParIdIdleV130_(j,'daycare').state&&systemeMetaParIdIdleV130_(j,'daycare').state.unlocked);
    var defs={};(Array.isArray(m.diggerDefinitions)?m.diggerDefinitions:[]).forEach(function(def){defs[def.id]=def;});
    var places=Math.max(1,H().idleEntier_(vue.slots||data.slots||1)),actifs=H().idleEntier_(vue.active||0);
    var brut=Number(vue.grossGps)||0,drain=Number(vue.drain)||0;
    var part=brut>0?Math.max(0,Math.min(1,drain/brut)):(drain>0?1:0);
    var etages='';
    var precedentOuvert=true;
    ETAGES.forEach(function(g){
      if(!precedentOuvert)return;
      var liste=g.ids.filter(function(id){return defs[id]&&(id!=='daycare'||daycareOk);});
      if(!liste.length)return;
      etages+='<div class="lp-etage '+g.cls+'"><div class="lp-nometage">'+g.titre+'</div><div class="lp-liste">'+liste.map(function(id){return labo_(defs[id],diggers[id]||{},vue,or);}).join('')+'</div></div>';
      precedentOuvert=liste.some(function(id){return H().idleEntier_((diggers[id]||{}).maxLevel||0)>0;});
    });
    var haut='<div class="lp-haut">'+
      '<div class="lp-pan"><h3>Or par seconde</h3><div class="lp-jauge"><i class="'+(part>.85?'fort':'')+'" style="transform:scaleX('+part.toFixed(3)+')"></i></div>'+
        '<div class="lp-petit">Tes labos consomment <b>'+nombre_(drain)+'</b> sur <b>'+nombre_(brut)+'</b> produits par seconde.</div>'+
        '<div class="lp-petit">Il te reste <b class="ok">'+nombre_(Math.max(0,brut-drain))+'</b> par seconde.</div></div>'+
      '<div class="lp-pan"><h3>Emplacements</h3><div class="lp-fioles">'+fioles_(places,actifs)+'</div>'+
        '<div class="lp-petit">'+actifs+' labo'+(actifs>1?'s':'')+' au travail sur '+places+' place'+(places>1?'s':'')+'.</div>'+
        '<div class="lp-petit">Bonus de tous leurs niveaux : <b class="ok">+'+(Number(vue.globalPct)||0).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %</b> sur chaque effet.</div></div>'+
    '</div>';
    return H().entetePageIdleV28_('Labos','Des savants fous brassent des potions avec l’or par seconde de ta machine temporelle : chaque labo au travail améliore quelque chose. Monte leur niveau maximum, puis choisis à quel niveau ils travaillent.')+
      '<div class="lp-page">'+haut+'<div class="lp-donjon">'+etages+'</div></div>';
  }

  window.__SOREAL_IDLE_LABOS_PAGE_V1__={page:page,scene:scene,etages:ETAGES,effets:EFFETS};
})();
