/*
 * SOREAL IDLE — phrases du Coffre et de la valise, modifiables par l'administrateur (Norman, 2026-10-26 : « dans le menu admin, pour le coffre et la valise, la possibilité d'ajouter ou d'enlever des phrases moi-même sans passer par toi » ;
 * « une case à cocher : quand la valise a vomi, quand le Coffre a fait caca, pour les deux ; ces phrases ne sortent que quand l'accident est survenu ; si je coche les deux, c'est que les deux ont eu l'accident »).
 *
 * Stockage : une surcharge de texte GLOBALE par personnage (clés « phrases:valise » et « phrases:coffre », champ « liste », voir src/idle-textes-v1.js ; lue par tous les joueurs comme les autres textes de l'administrateur).
 * Chaque phrase de la liste est un texte, précédé au besoin d'une étiquette : « {V} » (la valise a vomi), « {C} » (le Coffre a fait caca), « {VC} » (les deux ont eu leur accident). Sans étiquette : phrase de tous les jours.
 * Étiquettes de situation (Norman, 2026-10-30) : « {R} » réveil (le joueur le réveille), « {D} » daycare (un objet est placé en garderie), « {M} » max (l'objet placé est maxé ; à défaut de {M} on prend une {D}), « {P} » plein (plus aucun emplacement de garderie libre : refus). Ces phrases ne sortent QUE dans leur situation ; elles se combinent avec {V}/{C} (ex. « {RV} »).
 * Sans surcharge, les phrases d'origine (DEFAUTS ci-dessous) s'appliquent ; « Rétablir » supprime la surcharge.
 *
 *   window.__SOREAL_IDLE_PHRASES_V1__ = { tirer(qui, mode), liste(qui), editeurHtml(), analyser(texte), conditionsRemplies(phrase) }
 *   mode : 'remarque' (toute phrase de tous les jours dont les conditions sont remplies) | 'reveil' | 'daycare' | 'daycare:max' (phrase {M}, repli {D}) | 'plein' | 'accident:V' (phrase étiquetée V : l'accident de la valise vient d'avoir lieu) | 'accident:C' (étiquetée C : celui du Coffre).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_PHRASES_V1__)return;

var CLES={valise:'phrases:valise',coffre:'phrases:coffre'};
var NOMS={valise:'La valise',coffre:'Le Coffre'};
var DEFAUTS={
  valise:[
    'Vous comptez me regarder longtemps, damoiseau ?',
    '{V}Bleurgh… j’ai trop bu.',
    '{V}Oh non… pas encore les potions…',
    '{V}Ne regardez pas, c’est gênant.',
    '{V}Je suis contente !',
    '{V}C’est beaucoup trop d’émotions pour moi.',
    '{R}Hein ? Quoi ? Un dragon ?',
    '{R}Par la barbe de Merlin !',
    '{R}Je ne dormais pas, je méditais !',
    '{R}À moi, la garde !',
    '{R}Cinq minutes de plus, maître…',
    '{R}Qui ose réveiller une valise en plein rêve de voyage ?',
    '{R}Mes fioles ! Où sont mes fioles ? Ah, elles sont là. Bonjour.'
  ],
  coffre:[
    'Pourquoi tu me regardes comme si j’allais chier sur tes affaires ?',
    '{C}Oh bordel, pas encore…',
    '{C}Ah ben voilà.. Forcément que ça allait arriver un jour.',
    '{C}Oh merde. Ne me regardez pas',
    '{V}Je t’en supplie, nettoie-la, elle pue.',
    '{V}Elle a encore vomi… nettoie-la, par pitié.',
    '{V}Ça sent le vomi ici ! Nettoie-la !',
    '{V}Cette odeur… nettoie ta valise, s’il te plaît.',
    '{V}Moi, je pète. Elle, elle vomit. Nettoie-la.',
    '{V}Je ne peux plus respirer… la valise, vite !',
    '{R}J’ai jamais couché avec votre femme !',
    '{R}À l’abordage !',
    '{R}Ne me touchez pas avec vos sales pattes !',
    '{R}C’est pas moi, c’est l’petit !',
    '{R}Quoi ? Qui ? Où ?',
    '{R}Je dormais pas, je réfléchissais !',
    '{R}Cinq minutes de plus, maman…',
    '{R}Enlevez ce doigt de ma serrure !',
    '{R}Haut les mains !',
    '{R}Z’avez le mandat ?',
    '{R}C’était le chat, je le jure !',
    '{R}Ouvrez pas, c’est plein de dettes !',
    '{R}Ne me frappez pas, Maître !'
  ]
};

function T_(){return window.__SOREAL_IDLE_TEXTES_V1__||null;}
function esc_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* « {VC}texte » -> {t:'texte',v:true,c:true} */
function analyser_(brut){
  var s=String(brut==null?'':brut),m=/^\{([VCRDMP]+)\}\s*/.exec(s),e=m?m[1]:'';
  return {t:(m?s.slice(m[0].length):s).trim(),v:e.indexOf('V')>=0,c:e.indexOf('C')>=0,r:e.indexOf('R')>=0,d:e.indexOf('D')>=0,m:e.indexOf('M')>=0,p:e.indexOf('P')>=0};
}
function assembler_(p){
  var e=(p.v?'V':'')+(p.c?'C':'')+(p.r?'R':'')+(p.d?'D':'')+(p.m?'M':'')+(p.p?'P':'');
  return (e?'{'+e+'}':'')+String(p.t||'').trim();
}
function brutes_(qui){
  var t=T_(),s=t&&typeof t.surcharge==='function'?t.surcharge(CLES[qui]):null;
  return s&&Array.isArray(s.liste)&&s.liste.length?s.liste.slice():DEFAUTS[qui].slice();
}
function liste_(qui){return brutes_(qui).map(analyser_).filter(function(p){return p.t;});}

/* Les accidents en cours : la valise a vomi (flaque de vomi présente), le Coffre a fait caca (flaque présente). */
function vomiPresent_(){try{var a=window.__SOREAL_IDLE_VALISE_ACCIDENT_V1__;return Boolean(a&&typeof a.niveau==='function'&&a.niveau()>0);}catch(_e){return false;}}
function cacaPresent_(){try{var c=window.__SOREAL_IDLE_CACA_V1__;return Boolean(c&&typeof c.flaqueNiveau==='function'&&c.flaqueNiveau()>0);}catch(_e){return false;}}
/* Une phrase étiquetée ne se dit que si TOUS les accidents cochés sont survenus ; sans étiquette, elle se dit toujours. `ignorer` : l'accident qui vient d'avoir lieu (déjà vrai). */
function conditions_(p,ignorer){
  if(p.v&&ignorer!=='V'&&!vomiPresent_())return false;
  if(p.c&&ignorer!=='C'&&!cacaPresent_())return false;
  return true;
}
function tirer_(qui,mode){
  var l=liste_(qui),m=String(mode||'remarque'),ig='',exige='';
  if(m==='accident:V'){ig='V';exige='v';}
  else if(m==='accident:C'){ig='C';exige='c';}
  /* Une phrase de situation ({R} {D} {M} {P}) ne sort QUE dans sa situation ; les autres modes ne piochent que parmi les phrases sans étiquette de situation. */
  var sit=m==='reveil'?'r':m==='daycare'?'d':m==='daycare:max'?'m':m==='plein'?'p':'';
  var choisir=function(cle){
    var ok=l.filter(function(p){
      if(cle)return p[cle]&&conditions_(p,'');
      return !(p.r||p.d||p.m||p.p)&&(!exige||p[exige])&&conditions_(p,ig);
    });
    return ok.length?ok[Math.floor(Math.random()*ok.length)].t:'';
  };
  var t=choisir(sit);
  /* Objet maxé : une phrase {M}, à défaut une phrase {D}. */
  if(!t&&m==='daycare:max')t=choisir('d');
  return t;
}

/* ---------- éditeur (page Admin > Textes) ---------- */
var brouillon={};   // qui -> [{t,v,c}] en cours d'édition
var etat={};        // qui -> message
function charge_(qui){if(!brouillon[qui])brouillon[qui]=liste_(qui).map(function(p){return {t:p.t,v:p.v,c:p.c,r:p.r,d:p.d,m:p.m,p:p.p};});return brouillon[qui];}
function case_(cle,coche,libelle,aide){
  return '<label title="'+esc_(aide)+'" style="display:flex;gap:5px;align-items:center;font:600 13px system-ui,sans-serif;color:#cfe1ff"><input type="checkbox" data-php-'+cle+(coche?' checked':'')+'> '+libelle+'</label>';
}
function ligneHtml_(qui,i,p){
  return '<div class="php-ligne" data-qui="'+qui+'" data-i="'+i+'" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0;padding:8px;border:1px solid #34425f;border-radius:10px;background:#0a0e16">'+
    '<textarea rows="2" data-php-texte style="flex:1 1 260px;min-width:0;box-sizing:border-box;padding:8px;border-radius:8px;border:1.5px solid #34425f;background:#05080f;color:#f1f4fb;font:500 15px system-ui,sans-serif">'+esc_(p.t)+'</textarea>'+
    '<label style="display:flex;gap:5px;align-items:center;font:600 13px system-ui,sans-serif;color:#cfe1ff"><input type="checkbox" data-php-v'+(p.v?' checked':'')+'> La valise a vomi</label>'+
    '<label style="display:flex;gap:5px;align-items:center;font:600 13px system-ui,sans-serif;color:#cfe1ff"><input type="checkbox" data-php-c'+(p.c?' checked':'')+'> Le Coffre a fait caca</label>'+
    case_('r',p.r,'Réveil','Phrase dite quand tu le réveilles')+
    '<button type="button" data-php-act="suppr" title="Enlever cette phrase" style="border:0;border-radius:8px;padding:6px 10px;background:#7a1f2b;color:#fff;cursor:pointer">🗑</button>'+
  '</div>';
}
function blocHtml_(qui){
  var l=charge_(qui),surcharge=Boolean(T_()&&T_().surcharge(CLES[qui]));
  return '<div class="php-bloc" data-qui="'+qui+'" style="margin:10px 0 18px">'+
    '<div style="font-weight:800;margin-bottom:4px">'+NOMS[qui]+' <span style="font-weight:500;opacity:.7">('+l.length+' phrase'+(l.length>1?'s':'')+(surcharge?' · modifiées':' · d’origine')+')</span></div>'+
    l.map(function(p,i){return ligneHtml_(qui,i,p);}).join('')+
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">'+
      '<button type="button" data-php-act="ajout" style="border:0;border-radius:8px;padding:8px 12px;background:#245a2e;color:#fff;cursor:pointer;font-weight:700">＋ Ajouter une phrase</button>'+
      '<button type="button" data-php-act="enreg" style="border:0;border-radius:8px;padding:8px 12px;background:#2b5fb3;color:#fff;cursor:pointer;font-weight:700">💾 Enregistrer</button>'+
      '<button type="button" data-php-act="retablir" style="border:0;border-radius:8px;padding:8px 12px;background:#4a4a55;color:#fff;cursor:pointer">↩ Rétablir les phrases d’origine</button>'+
    '</div>'+
    '<div class="php-etat" style="min-height:20px;margin-top:4px;font:600 13px system-ui,sans-serif;color:#9fe0a8">'+esc_(etat[qui]||'')+'</div>'+
  '</div>';
}
function editeurHtml_(){
  return '<div id="sorealIdlePhrasesAdminV1" style="margin:16px 0 4px">'+
    '<div style="font-weight:800">Phrases du Coffre et de la valise</div>'+
    '<div class="stx-aide">Une phrase par cadre. Sans case cochée, elle se dit de temps en temps. <b>La valise a vomi</b> : la phrase ne sort qu’après un vomi (ou, pour le Coffre, quand elle a vomi). <b>Le Coffre a fait caca</b> : idem pour son accident. Les deux cases : seulement quand <b>les deux</b> ont eu leur accident. <b>Réveil</b> : phrase dite quand tu le réveilles. <b>Daycare</b> : dite quand tu places un objet en garderie. <b>Max</b> : dite quand l’objet placé est maxé (à défaut, une phrase Daycare). <b>Plein</b> : le refus quand plus aucun emplacement de garderie n’est libre. Ces phrases ne sortent que dans leur situation.</div>'+
    blocHtml_('valise')+blocHtml_('coffre')+
  '</div>';
}
function rafraichir_(qui){
  var b=document.querySelector('#sorealIdlePhrasesAdminV1 .php-bloc[data-qui="'+qui+'"]');
  if(!b)return;
  var d=document.createElement('div');d.innerHTML=blocHtml_(qui);
  b.replaceWith(d.firstChild);
}
function message_(qui,txt,erreur){
  etat[qui]=txt;
  var e=document.querySelector('#sorealIdlePhrasesAdminV1 .php-bloc[data-qui="'+qui+'"] .php-etat');
  if(e){e.textContent=txt;e.style.color=erreur?'#ff9d9d':'#9fe0a8';}
}
function appel_(nom,args){
  var f=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
  return Promise.resolve(f(nom,args));
}
function majSurcharge_(cle,champs){
  /* la liste enregistrée devient tout de suite celle de cette page ; les autres joueurs la reçoivent à leur prochain chargement */
  var t=T_();
  try{if(t&&typeof t.majSimple==='function')t.majSimple(cle,champs);}catch(_e){}
}
function enregistrer_(qui){
  var l=charge_(qui).filter(function(p){return String(p.t||'').trim();});
  if(!l.length){message_(qui,'Au moins une phrase est nécessaire (ou « Rétablir » pour revenir aux phrases d’origine).',true);return;}
  if(l.length>40){message_(qui,'40 phrases au plus.',true);return;}
  var champs={liste:l.map(assembler_)};
  message_(qui,'Enregistrement…',false);
  appel_('enregistrerTexteAdminSorealIdle',[{cle:CLES[qui],champs:champs}]).then(function(res){
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Enregistrement refusé.');
    majSurcharge_(CLES[qui],res.texte&&res.texte.champs?res.texte.champs:champs);
    brouillon[qui]=null;message_(qui,'✔ Enregistré : '+l.length+' phrase'+(l.length>1?'s':'')+'.',false);rafraichir_(qui);
  }).catch(function(e){message_(qui,'Impossible d’enregistrer : '+(e&&e.message?e.message:e),true);});
}
function retablir_(qui){
  if(!window.confirm('Rétablir les phrases d’origine ? Ta liste sera supprimée.'))return;
  appel_('supprimerTexteAdminSorealIdle',[{cle:CLES[qui]}]).then(function(res){
    if(res&&res.ok===false)throw new Error(res.message||'Refusé.');
    majSurcharge_(CLES[qui],null);
    brouillon[qui]=null;message_(qui,'✔ Phrases d’origine rétablies.',false);rafraichir_(qui);
  }).catch(function(e){message_(qui,'Impossible de rétablir : '+(e&&e.message?e.message:e),true);});
}
document.addEventListener('input',function(ev){
  var el=ev.target,l=el&&el.closest?el.closest('.php-ligne'):null;
  if(!l)return;
  var p=charge_(l.getAttribute('data-qui'))[Number(l.getAttribute('data-i'))];
  if(!p)return;
  if(el.hasAttribute('data-php-texte'))p.t=el.value;
});
document.addEventListener('change',function(ev){
  var el=ev.target,l=el&&el.closest?el.closest('.php-ligne'):null;
  if(!l)return;
  var p=charge_(l.getAttribute('data-qui'))[Number(l.getAttribute('data-i'))];
  if(!p)return;
  if(el.hasAttribute('data-php-v'))p.v=Boolean(el.checked);
  if(el.hasAttribute('data-php-c'))p.c=Boolean(el.checked);
  ['r','d','m','p'].forEach(function(k){if(el.hasAttribute('data-php-'+k))p[k]=Boolean(el.checked);});
});
document.addEventListener('click',function(ev){
  var b=ev.target&&ev.target.closest?ev.target.closest('[data-php-act]'):null;
  if(!b)return;
  var bloc=b.closest('.php-bloc');if(!bloc)return;
  var qui=bloc.getAttribute('data-qui'),act=b.getAttribute('data-php-act'),l=charge_(qui);
  ev.preventDefault();ev.stopPropagation();
  if(act==='ajout'){if(l.length>=40){message_(qui,'40 phrases au plus.',true);return;}l.push({t:'',v:false,c:false,r:false,d:false,m:false,p:false});rafraichir_(qui);}
  else if(act==='suppr'){var ligne=b.closest('.php-ligne');l.splice(Number(ligne.getAttribute('data-i')),1);rafraichir_(qui);}
  else if(act==='enreg')enregistrer_(qui);
  else if(act==='retablir')retablir_(qui);
},true);

window.__SOREAL_IDLE_PHRASES_V1__={tirer:tirer_,liste:liste_,editeurHtml:editeurHtml_,analyser:analyser_,assembler:assembler_,conditionsRemplies:conditions_,defauts:DEFAUTS};
})();
