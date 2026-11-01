/*
 * SOREAL IDLE — « Le saviez-vous ? » du panneau LED de la borne, complété par l'administrateur (Norman, 2026-11-01 : « Il faut que dans Admin, je puisse ajouter des phrases qui suivent "Le saviez-vous ?" »).
 *
 * Stockage : une surcharge de texte GLOBALE, clé « saviez-vous:borne » (src/idle-textes-v1.js, validation stricte côté serveur : 200 phrases, 90 caractères, texte brut sur une ligne) ;
 *   champs.liste = phrases françaises, champs.listeEn = traductions anglaises (même rang, vide = pas de version anglaise), champs.remplace = "1" (remplacent les cinq phrases d'origine) ou "0" (s'y ajoutent).
 * Lecture par les joueurs : comme les autres textes de l'administrateur (window.__SOREAL_IDLE_TEXTES_V1__.surcharge), déjà synchronisés avec l'état et le moteur local : AUCUNE requête de plus.
 * Écriture : opération d'administration `enregistrerTexteAdminSorealIdle` / `supprimerTexteAdminSorealIdle` (comme les phrases du Coffre, modules/phrases-coffre-valise-v1.js).
 * Règle n°2 : ce sont des phrases GÉNÉRIQUES écrites par l'administrateur (rappel dans l'éditeur) ; le code ne filtre aucun mot et ne manipule que du texte brut (jamais de HTML).
 *
 *   window.__SOREAL_IDLE_SAVIEZ_VOUS_V1__ = { tirer(langue, derniere, originaux), liste(langue), editeurHtml(), valider(brouillon) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_SAVIEZ_VOUS_V1__)return;

var CLE='saviez-vous:borne',MAX_PHRASES=200,MAX_CAR=90;

function T_(){return window.__SOREAL_IDLE_TEXTES_V1__||null;}
function LED_(){return window.__SOREAL_IDLE_BORNE_LED_V1__||null;}
function esc_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function longueur_(s){return Array.from?Array.from(String(s)).length:String(s).length;}
function champs_(){var t=T_(),s=t&&typeof t.surcharge==='function'?t.surcharge(CLE):null;return s&&typeof s==='object'?s:null;}

/* ---------- lecture (joueurs) ---------- */
/* Phrases de l'administrateur dans la langue demandée ('en' : seulement celles qui ont une version anglaise ; sinon français). Toujours des textes bruts. */
function liste_(langue){
  var c=champs_();
  if(!c||!Array.isArray(c.liste))return [];
  var src=langue==='en'?(Array.isArray(c.listeEn)?c.listeEn:[]):c.liste;
  return src.filter(function(x){return typeof x==='string'&&x.trim();});
}
function remplace_(){var c=champs_();return Boolean(c&&(c.remplace==='1'||c.remplace===1||c.remplace===true));}
/* Tire une phrase : celles de l'administrateur + les phrases d'origine (ou elles seules s'il a coché « Remplacer »), jamais la même que `derniere`. '' = aucune phrase d'administrateur : le panneau garde ses phrases d'origine. */
function tirer_(langue,derniere,originaux){
  var adm=liste_(langue==='en'?'en':'fr');
  if(!adm.length)return '';
  var pool=remplace_()?adm:adm.concat(Array.isArray(originaux)?originaux:[]);
  if(pool.length>1)pool=pool.filter(function(x){return x!==derniere;});
  return pool.length?pool[Math.floor(Math.random()*pool.length)]:'';
}

/* ---------- validation (miroir de celle du serveur) ---------- */
function messageCode_(code){
  var m={
    TEXTE_SAVIEZ_PHRASE_TROP_LONGUE:'Une phrase dépasse '+MAX_CAR+' caractères.',
    TEXTE_SAVIEZ_HTML_REFUSE:'Les signes < et > sont interdits (texte brut seulement).',
    TEXTE_SAVIEZ_CARACTERE_INTERDIT:'Caractère de contrôle ou invisible interdit.',
    TEXTE_SAVIEZ_PHRASE_VIDE:'Une phrase française est vide.',
    TEXTE_SAVIEZ_TROP_DE_PHRASES:MAX_PHRASES+' phrases au plus.',
    TEXTE_SAVIEZ_LISTE_REQUISE:'Au moins une phrase est nécessaire (ou « Remettre les phrases d’origine »).',
    TEXTE_SAVIEZ_PHRASE_INVALIDE:'Phrase invalide.',TEXTE_SAVIEZ_LISTE_EN_INVALIDE:'Liste anglaise invalide.'
  };
  return m[code]||code;
}
function problemePhrase_(s,obligatoire){
  if(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200b-\u200f\u202a-\u202e\u2060\ufeff]/.test(s))return 'TEXTE_SAVIEZ_CARACTERE_INTERDIT';
  var t=s.trim();
  if(/[<>]/.test(t))return 'TEXTE_SAVIEZ_HTML_REFUSE';
  if(obligatoire&&!t)return 'TEXTE_SAVIEZ_PHRASE_VIDE';
  if(longueur_(t)>MAX_CAR)return 'TEXTE_SAVIEZ_PHRASE_TROP_LONGUE';
  return '';
}
/* brouillon : {items:[{fr,en}], remplace} -> {ok, champs} ou {ok:false, message} ; les lignes entièrement vides sont ignorées */
function valider_(b){
  var items=(b&&Array.isArray(b.items)?b.items:[]).filter(function(p){return String(p.fr||'').trim()||String(p.en||'').trim();});
  if(!items.length)return {ok:false,message:messageCode_('TEXTE_SAVIEZ_LISTE_REQUISE')};
  if(items.length>MAX_PHRASES)return {ok:false,message:messageCode_('TEXTE_SAVIEZ_TROP_DE_PHRASES')};
  for(var i=0;i<items.length;i++){
    var e=problemePhrase_(String(items[i].fr||''),true)||problemePhrase_(String(items[i].en||''),false);
    if(e)return {ok:false,message:'Phrase '+(i+1)+' : '+messageCode_(e)};
  }
  var net=function(s){return String(s||'').trim().replace(/ {2,}/g,' ');};
  return {ok:true,champs:{liste:items.map(function(p){return net(p.fr);}),listeEn:items.map(function(p){return net(p.en);}),remplace:b.remplace?'1':'0'}};
}

/* ---------- éditeur (page Admin > Textes et voix) ---------- */
var brouillon=null,etat='',etatErreur=false,minuterie=0;
function charge_(){
  if(brouillon)return brouillon;
  var c=champs_(),fr=c&&Array.isArray(c.liste)?c.liste:[],en=c&&Array.isArray(c.listeEn)?c.listeEn:[];
  brouillon={items:fr.map(function(t,i){return {fr:String(t),en:String(en[i]||'')};}),remplace:remplace_()};
  return brouillon;
}
function diagHtml_(s){
  var led=LED_(),d=led&&typeof led.diagnostic==='function'?led.diagnostic(s):null,out=[];
  if(!d)return '';
  if(d.remplaces.length)out.push('remplacés par la police du panneau : '+d.remplaces.map(function(x){return x[0]+' → '+x[1];}).join(' ; '));
  if(d.retires.length)out.push('retirés (la police ne les a pas) : '+d.retires.join(' '));
  return out.length?'⚠ Caractères '+esc_(out.join(' — ')):'';
}
function compteurHtml_(s){
  var n=longueur_(s),trop=n>MAX_CAR;
  return '<span class="sv-n" style="font:600 12px system-ui,sans-serif;color:'+(trop?'#ff9d9d':'#9fb3d6')+'">'+n+' / '+MAX_CAR+(/[<>]/.test(s)?' · < et > interdits':'')+'</span>';
}
function champHtml_(i,cle,valeur,etiquette){
  return '<label style="flex:1 1 260px;min-width:0;display:block"><span style="font:700 12px system-ui,sans-serif;color:#cfe1ff">'+etiquette+'</span> '+compteurHtml_(valeur)+
    '<input type="text" data-sv-champ="'+cle+'" data-i="'+i+'" value="'+esc_(valeur)+'" autocomplete="off" '+
    'style="display:block;width:100%;box-sizing:border-box;margin-top:2px;padding:8px;border-radius:8px;border:1.5px solid #34425f;background:#05080f;color:#f1f4fb;font:500 15px system-ui,sans-serif">'+
    '<span class="sv-diag" style="display:block;min-height:0;font:600 12px system-ui,sans-serif;color:#ffd27a">'+diagHtml_(valeur)+'</span></label>';
}
function ligneHtml_(i,p){
  return '<div class="sv-ligne" data-i="'+i+'" style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;margin:6px 0;padding:8px;border:1px solid #34425f;border-radius:10px;background:#0a0e16">'+
    champHtml_(i,'fr',p.fr,'Français')+champHtml_(i,'en',p.en,'English (facultatif)')+
    '<button type="button" data-sv-act="suppr" data-i="'+i+'" title="Supprimer cette phrase" style="border:0;border-radius:8px;padding:6px 10px;margin-top:18px;background:#7a1f2b;color:#fff;cursor:pointer">🗑</button></div>';
}
function originalesHtml_(){
  var led=LED_(),o=led&&typeof led.originales==='function'?led.originales('fr'):[];
  return o.length?'<div class="stx-aide">Phrases d’origine du panneau (toujours disponibles) : '+o.map(function(x){return '« '+esc_(x)+' »';}).join(' · ')+'</div>':'';
}
function blocHtml_(){
  var b=charge_(),modif=Boolean(champs_());
  return '<div class="sv-bloc" style="margin:10px 0 18px">'+
    '<div style="font-weight:800;margin-bottom:4px">Phrases ajoutées <span style="font-weight:500;opacity:.7">('+b.items.length+' phrase'+(b.items.length>1?'s':'')+(modif?' · enregistrées':' · aucune enregistrée')+')</span></div>'+
    '<div class="sv-apercu-cadre" style="margin:6px 0 8px;max-width:600px"><div class="stx-aide" style="margin:0 0 3px">Aperçu sur le panneau (la phrase sur laquelle tu écris) :</div>'+
      '<canvas class="sv-apercu" aria-hidden="true" style="display:block;width:100%;aspect-ratio:120/14;background:#050403;border-radius:8px;border:1px solid #34425f"></canvas>'+
      '<div class="sv-apercu-texte stx-aide" style="margin:3px 0 0"></div></div>'+
    '<label style="display:flex;gap:6px;align-items:center;font:600 13px system-ui,sans-serif;color:#cfe1ff;margin:4px 0"><input type="checkbox" data-sv-remplace'+(b.remplace?' checked':'')+'> Remplacer les phrases d’origine (sinon, mes phrases s’ajoutent aux cinq d’origine)</label>'+
    b.items.map(function(p,i){return ligneHtml_(i,p);}).join('')+
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">'+
      '<button type="button" data-sv-act="ajout" style="border:0;border-radius:8px;padding:8px 12px;background:#245a2e;color:#fff;cursor:pointer;font-weight:700">＋ Ajouter une phrase</button>'+
      '<button type="button" data-sv-act="enreg" style="border:0;border-radius:8px;padding:8px 12px;background:#2b5fb3;color:#fff;cursor:pointer;font-weight:700">💾 Enregistrer</button>'+
      '<button type="button" data-sv-act="retablir" style="border:0;border-radius:8px;padding:8px 12px;background:#4a4a55;color:#fff;cursor:pointer">↩ Remettre les 5 phrases d’origine</button>'+
    '</div>'+
    '<div class="sv-etat" style="min-height:20px;margin-top:4px;font:600 13px system-ui,sans-serif;color:'+(etatErreur?'#ff9d9d':'#9fe0a8')+'">'+esc_(etat)+'</div>'+
  '</div>';
}
function editeurHtml_(){
  setTimeout(function(){apercu_(premiere_());},0);
  return '<div id="sorealIdleSaviezAdminV1" style="margin:16px 0 4px">'+
    '<div style="font-weight:800">« Le saviez-vous ? » (panneau de la borne)</div>'+
    '<div class="stx-aide">Entre deux combats, le panneau de la borne affiche <b>LE SAVIEZ-VOUS ?</b> puis une phrase qui défile. Ajoute ici tes propres phrases : elles sont vues par <b>tous les joueurs</b>. '+
      '<b>Phrases génériques seulement : rien qui révèle ce que le joueur n’a pas encore découvert</b> (règle anti-spoil). '+MAX_CAR+' caractères au plus par phrase, texte brut. La version anglaise est facultative : sans elle, la phrase n’est pas montrée aux joueurs en anglais. '+
      'Le panneau n’a pas tous les accents : un avertissement t’indique les caractères remplacés (Ç devient C) ou retirés.</div>'+
    originalesHtml_()+blocHtml_()+
  '</div>';
}
function racine_(){return document.getElementById('sorealIdleSaviezAdminV1');}
function premiere_(){var b=charge_();return b.items.length?b.items[0].fr:'';}
function apercu_(texte,langueEn){
  var r=racine_();if(!r)return;
  var cv=r.querySelector('canvas.sv-apercu'),tx=r.querySelector('.sv-apercu-texte'),led=LED_();
  if(tx)tx.textContent=texte?'« '+texte+' »':'';
  if(cv&&led&&typeof led.apercu==='function'){try{led.apercu(cv,texte||'');}catch(_e){}}
}
function rafraichir_(){
  var r=racine_();if(!r)return;
  var b=r.querySelector('.sv-bloc'),d=document.createElement('div');
  d.innerHTML=blocHtml_();
  if(b)b.replaceWith(d.firstChild);
  apercu_(premiere_());
}
function message_(txt,erreur){
  etat=txt;etatErreur=Boolean(erreur);
  var r=racine_(),e=r&&r.querySelector('.sv-etat');
  if(e){e.textContent=txt;e.style.color=erreur?'#ff9d9d':'#9fe0a8';}
}
function appel_(nom,args){
  var f=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
  return Promise.resolve(f(nom,args));
}
function majSurcharge_(champs){
  /* la liste enregistrée devient tout de suite celle de cette page ; les autres joueurs la reçoivent à leur prochaine relecture des textes */
  var t=T_();
  try{if(t&&typeof t.majSimple==='function')t.majSimple(CLE,champs);}catch(_e){}
}
function enregistrer_(){
  var v=valider_(charge_());
  if(!v.ok){message_(v.message,true);return;}
  message_('Enregistrement…',false);
  appel_('enregistrerTexteAdminSorealIdle',[{cle:CLE,champs:v.champs}]).then(function(res){
    if(!res||res.ok===false)throw new Error(messageCode_((res&&(res.code||res.message))||'Enregistrement refusé.'));
    majSurcharge_(res.texte&&res.texte.champs?res.texte.champs:v.champs);
    brouillon=null;rafraichir_();message_('✔ Enregistré : '+v.champs.liste.length+' phrase'+(v.champs.liste.length>1?'s':'')+'.',false);
  }).catch(function(e){message_('Impossible d’enregistrer : '+(e&&e.message?e.message:e),true);});
}
function retablir_(){
  if(!window.confirm('Remettre les 5 phrases d’origine ? Ta liste sera supprimée.'))return;
  appel_('supprimerTexteAdminSorealIdle',[{cle:CLE}]).then(function(res){
    if(res&&res.ok===false)throw new Error(res.message||'Refusé.');
    majSurcharge_(null);
    brouillon=null;rafraichir_();message_('✔ Phrases d’origine remises.',false);
  }).catch(function(e){message_('Impossible de remettre : '+(e&&e.message?e.message:e),true);});
}

document.addEventListener('input',function(ev){
  var el=ev.target,k=el&&el.getAttribute?el.getAttribute('data-sv-champ'):null;
  if(!k)return;
  var p=charge_().items[Number(el.getAttribute('data-i'))];
  if(!p)return;
  p[k]=el.value;
  var lab=el.closest('label'),n=lab&&lab.querySelector('.sv-n'),dg=lab&&lab.querySelector('.sv-diag');
  if(n){var d=document.createElement('div');d.innerHTML=compteurHtml_(el.value);n.replaceWith(d.firstChild);}
  if(dg)dg.innerHTML=diagHtml_(el.value);
  clearTimeout(minuterie);
  minuterie=setTimeout(function(){apercu_(el.value);},120);
});
document.addEventListener('focusin',function(ev){
  var el=ev.target,k=el&&el.getAttribute?el.getAttribute('data-sv-champ'):null;
  if(k&&racine_()&&racine_().contains(el))apercu_(el.value);
});
document.addEventListener('change',function(ev){
  var el=ev.target;
  if(el&&el.hasAttribute&&el.hasAttribute('data-sv-remplace'))charge_().remplace=Boolean(el.checked);
});
document.addEventListener('click',function(ev){
  var b=ev.target&&ev.target.closest?ev.target.closest('[data-sv-act]'):null;
  if(!b||!racine_()||!racine_().contains(b))return;
  var act=b.getAttribute('data-sv-act'),l=charge_().items;
  ev.preventDefault();ev.stopPropagation();
  if(act==='ajout'){if(l.length>=MAX_PHRASES){message_(MAX_PHRASES+' phrases au plus.',true);return;}l.push({fr:'',en:''});rafraichir_();
    var champs=racine_().querySelectorAll('[data-sv-champ="fr"]'),dernier=champs[champs.length-1];if(dernier)dernier.focus();}
  else if(act==='suppr'){l.splice(Number(b.getAttribute('data-i')),1);rafraichir_();}
  else if(act==='enreg')enregistrer_();
  else if(act==='retablir')retablir_();
},true);

window.__SOREAL_IDLE_SAVIEZ_VOUS_V1__={tirer:tirer_,liste:liste_,editeurHtml:editeurHtml_,valider:valider_,cle:CLE};
})();
