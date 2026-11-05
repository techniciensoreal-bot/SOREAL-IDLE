/*
 * SOREAL IDLE — popup de VALIDATION quand le joueur utilise un objet qui a un effet (Norman, 2026-11-01 : « quand on stack des boosts jusqu'à 100 pour atteindre l'augmentation de % des boosts, on doit
 * avoir une validation… pareil quand on utilise l'item Wandoos… tous les items qu'on peut utiliser et qui ont un effet doivent nous l'indiquer avec un popup »).
 *
 * Même présentation que la compétence débloquée (competence-debloquee-v1.js) : icône, titre, nom de l'objet, ce qui s'est passé (une phrase) et le détail en lignes, un bouton.
 * Branché sur le retour de chaque action volontaire (meta-progression-v130.js, ui-inventaire-v1.js) : `apres(payload, reponse)`. L'Auto Merge / l'Auto Boost ne passent jamais par là.
 * Tous les chiffres viennent de la RÉPONSE du moteur (rien n'est écrit à la main, règle n°1) ; un champ absent = la ligne n'est pas affichée.
 *   usePotion (potions, porte-bonheur) · consumeWandoosCopy · consumeGiantSeed · useUnlockItem / consumeUnlock · useYggFruit avec Poop · sellShopBuy d'un objet à effet immédiat · palier de boosts (boostPalier).
 * File d'attente : plusieurs popups = l'un après l'autre ; le même objet utilisé plusieurs fois de suite (ou une Poop pour chaque fruit de « Manger tous ») = UN popup avec « Utilisations ×N ».
 * Anti-spoil (règle n°2) : un popup ne parle que de l'objet qui vient d'être utilisé ; aucun total ni objet non découvert.
 * Traduction : chaque morceau de texte fixe est dans son propre élément, donc au dictionnaire anglais ; les chiffres sont dans des <b>.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_POPUP_EFFET_V1__)return;

var ID='popup-effet-objet-v1';
var file=[];
var courant=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(v){var n=Number(v);return isFinite(n)?n:0;}
/* 1 234,5 : espaces fines pour les milliers, virgule décimale, au plus d décimales. */
function fmt(v,d){
  var n=num(v);var dec=d==null?2:d;
  var s=n.toFixed(dec);
  if(s.indexOf('.')!==-1)s=s.replace(/0+$/,'').replace(/\.$/,'');
  var p=s.split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  return p.join(',');
}
/* durée : « 1 h », « 24 h », « 30 min », « 1 h 30 min », « 45 s » (unités identiques en anglais). */
function duree(sec){
  var s=Math.max(0,Math.round(num(sec)));
  var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),r=s%60;
  var o=[];
  if(h)o.push(h+' h');
  if(m)o.push(m+' min');
  if(r&&!h)o.push(r+' s');
  return o.length?o.join(' '):'0 s';
}

/* Libellés des effets à durée (mêmes mots que la valise, valise-v1.js). */
var STATS={
  energyPower:'Puissance d’Énergie',magicPower:'Puissance de Magie',r3Power:'Puissance de Ressource 3',
  luck:'Chance de drop',energyBars:'Barres d’Énergie',magicBars:'Barres de Magie',
  mayoInfuser:'Génération de la mayo',macguffinMuffin:'Muffin MacGuffin'
};
var NOMS_SYSTEMES={ngu:'NGU',yggdrasil:'Yggdrasil',diggers:'Diggers',beards:'Beards',tower:'La Tour',wandoos:'Wandoos'};

function nomPotion(id){
  var V=window.__SOREAL_IDLE_VALISE_V1__;
  var l=(V&&V.potions)||[];
  for(var i=0;i<l.length;i++)if(l[i].id===id)return {nom:l[i].nom,img:l[i].img};
  return null;
}
function imageReserve(id){
  var V=window.__SOREAL_IDLE_VALISE_V1__;
  var l=(V&&V.reserves)||[];
  for(var i=0;i<l.length;i++)if(l[i].id===id&&l[i].img)return l[i].img;
  return '';
}

/* Lignes communes d'un effet (potion, Bar Bar, minuteur) d'après res.effet. */
function lignesEffet(e){
  var phrase=[],rows=[];
  var stat=STATS[e.cle]||'';
  if(stat&&e.facteur!=null&&num(e.facteur)>0){
    phrase.push([stat,'t'],['×'+fmt(e.facteur),'v']);
    if(e.beta)phrase.push(['jusqu’au prochain Rebirth','t']);
    else if(e.restant!=null)phrase.push(['pendant','t'],[duree(e.restant),'v']);
  }else if(stat){
    phrase.push([stat,'t']);
    if(e.restant!=null)phrase.push(['pendant','t'],[duree(e.restant),'v']);
  }
  if(e.sec!=null&&num(e.sec)>0)rows.push(['Temps ajouté','+'+duree(e.sec)]);
  if(e.restant!=null&&!e.beta&&num(e.sec)>0)rows.push(['Temps restant',duree(e.restant)]);
  return {phrase:phrase,rows:rows};
}

/* Construit le popup d'après l'action et la réponse ; null = rien à annoncer. */
function construire(payload,res){
  var r=res&&res.resultat;
  if(!payload||!r||typeof r!=='object')return null;
  var a=String(payload.action||'');
  var adv=a==='adventure'&&payload.adventure&&typeof payload.adventure==='object'?String(payload.adventure.action||''):'';
  var effets=[];
  var spec=null;

  if(a==='usePotion'&&r.effet&&typeof r.effet==='object'){
    var p=nomPotion(String(r.itemId||payload.itemId||''));
    var l=lignesEffet(r.effet);
    spec={cle:'potion:'+String(r.itemId||payload.itemId||''),icone:'🧪',img:p&&p.img?'/shop/'+p.img+'.png':'',titre:'Objet utilisé !',nom:p?p.nom:'',phrase:l.phrase,rows:l.rows};
    if(num(r.reste)>0)spec.rows.push(['Il en reste',fmt(r.reste,0)]);
  }else if(a==='consumeWandoosCopy'){
    if(r.unlocked==='xl'){
      spec={cle:'wandoos',icone:'💾',img:'',titre:'Wandoos XL débloqué !',nom:'',phrase:[['Wandoos XL est installé.','t']],rows:[]};
    }else if(r.osLevel!=null){
      var xl=r.source==='consumedXl';
      spec={cle:'wandoos',icone:'💾',img:'',titre:'Wandoos mis à jour !',nom:xl?'Copie de Wandoos XL':'Copie de Wandoos 98',
        phrase:[['Niveau d’OS de Wandoos','t'],[(r.osAvant!=null?fmt(r.osAvant,0)+' → ':'')+fmt(r.osLevel,0),'v']],rows:[]};
      spec.rows.push(['Niveaux consommés sur la copie',fmt(r.osLevel,0)]);
      if(r.remainingItemLevel!=null)spec.rows.push(['Niveau restant sur la copie',fmt(r.remainingItemLevel,0)]);
    }
  }else if(a==='consumeGiantSeed'&&r.seeds!=null){
    spec={cle:'giantSeed',icone:'🌱',img:'',titre:'Graine géante utilisée !',nom:'',phrase:[['Graines gagnées','t'],['+'+fmt(r.seeds,0),'v']],rows:[]};
    if(r.level!=null)spec.rows.push(['Niveau de la graine',fmt(r.level,0)]);
  }else if((adv==='useUnlockItem'||adv==='consumeUnlock')&&r.flag){
    var nom=NOMS_SYSTEMES[String(r.flag)]||'';
    if(nom)spec={cle:'deblocage:'+String(r.flag),icone:'🔓',img:'',titre:'Nouveau système débloqué !',nom:nom,phrase:[['Système débloqué','t']],rows:[]};
  }else if(a==='useYggFruit'&&r.poop&&typeof r.poop==='object'){
    spec={cle:'poop',icone:'💩',img:imageReserve('poop')?'/shop/'+imageReserve('poop')+'.png':'',titre:'Poop utilisée !',nom:'',
      phrase:r.poop.factor!=null?[['Fruit d’Yggdrasil','t'],['×'+fmt(r.poop.factor),'v']]:[['Fruit d’Yggdrasil renforcé','t']],rows:[]};
    if(r.poop.remaining!=null)spec.rows.push(['Poop restantes',fmt(r.poop.remaining,0)]);
    if(r.poop.free)spec.rows.push(['Cette Poop n’a rien coûté','Oui']);
  }else if(a==='sellShopBuy'&&r.effet&&typeof r.effet==='object'){
    var e=r.effet;
    spec={cle:'achat:'+String(r.itemId||payload.itemId||''),icone:'✨',img:'',titre:'Objet activé !',nom:String(r.nom||''),phrase:[],rows:[]};
    var le=lignesEffet(e);
    spec.phrase=le.phrase;spec.rows=le.rows;
    if(e.pills){spec.phrase=[['Gains de PP de l’ITOPOD ×2 pour','t'],[fmt(e.pills,0),'v'],['kills','t']];spec.rows.push(['Pilules en réserve',fmt(e.reserve,0)]);}
    if(e.butters){spec.phrase=[['Récompense de QP de ta prochaine quête ×2','t']];spec.rows.push(['Beast Butter en réserve',fmt(e.reserve,0)]);}
    if(e.blackPens){spec.phrase=[['Prochaines cartes : +2 tiers','t']];spec.rows.push(['Stylos en réserve',fmt(e.reserve,0)]);}
    if(e.poop){spec.phrase=e.facteurPoop!=null?[['Prochains fruits d’Yggdrasil','t'],['×'+fmt(e.facteurPoop),'v']]:[['Poop ajoutée','t']];spec.rows.push(['Poop en réserve',fmt(e.reserve,0)]);}
    if(e.arme&&!spec.phrase.length)spec.phrase=[['Effet actif','t']];
    if(!spec.phrase.length)spec.phrase=[['Effet actif','t']];
  }

  /* Palier de boosts : peut s'ajouter à n'importe quelle action volontaire (fusion, boost, A + clic, Garderie…). */
  var b=r.boostPalier;
  if(b&&typeof b==='object'&&num(b.niveaux)>0){
    effets.push({cle:'palier-boosts',icone:'⚡',img:'',titre:'Boost au niveau 100 !',nom:'',
      phrase:num(b.gainPct)>0?[['Efficacité de tous les boosts','t'],['+'+fmt(b.gainPct)+' %','v']]:[['Efficacité des boosts déjà au maximum','t']],
      rows:[['Efficacité totale des boosts','+'+fmt(b.totalPct)+' %']]});
  }
  if(spec)effets.unshift(spec);
  return effets.length?effets:null;
}

function styles(){
  if(document.getElementById('popup-effet-objet-style-v1'))return;
  var s=document.createElement('style');s.id='popup-effet-objet-style-v1';
  s.textContent='.pe-fond-v1{position:fixed;inset:0;z-index:99997;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,18,.74);backdrop-filter:blur(3px)}'+
    '.pe-carte-v1{width:min(400px,100%);padding:22px 20px 18px;border-radius:18px;text-align:center;color:#eef3ff;font-family:"Russo One","Arial Black",Impact,sans-serif;background:linear-gradient(180deg,#26324f,#141b2e);border:3px solid #000;box-shadow:0 6px 0 #000,0 0 0 2px #5fd0ff inset}'+
    '.pe-icone-v1{position:relative;width:96px;height:96px;margin:0 auto 6px;display:grid;place-items:center;font-size:62px;line-height:1}'+
    '.pe-icone-v1::before{content:"";position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(110,214,255,.5),transparent 68%);animation:peLueur-v1 1.8s ease-in-out infinite}'+
    '.pe-icone-v1 span,.pe-icone-v1 img{position:relative;animation:peMue-v1 .9s cubic-bezier(.2,1.4,.4,1) both}'+
    '.pe-icone-v1 img{width:80px;height:80px;object-fit:contain}'+
    '.pe-titre-v1{margin:6px 0 4px;font:400 28px/1.05 "Bangers","Russo One",Impact,sans-serif;letter-spacing:.05em;color:#7fdcff;text-shadow:0 3px 0 #0b3550}'+
    '.pe-nom-v1{display:inline-block;margin:8px 0 4px;padding:6px 16px;border-radius:999px;font-size:17px;color:#06222f;background:linear-gradient(180deg,#bff0ff,#7fdcff 45%,#2aa7e0);box-shadow:0 3px 0 #0b4f73}'+
    '.pe-phrase-v1{margin:10px 0 6px;font-size:16px;line-height:1.45;color:#eef3ff}'+
    '.pe-phrase-v1 b{color:#ffd24a}'+
    '.pe-lignes-v1{margin:8px 0 2px;display:grid;gap:4px}'+
    '.pe-ligne-v1{display:flex;justify-content:space-between;gap:12px;padding:5px 10px;border-radius:8px;font-size:14px;color:#c7d3f2;background:rgba(255,255,255,.06)}'+
    '.pe-ligne-v1 b{color:#ffd24a;font-weight:400}'+
    '.pe-bouton-v1{min-width:160px;margin-top:12px;padding:12px 18px;border:0;border-radius:14px;font:400 17px "Russo One",sans-serif;color:#06222f;background:linear-gradient(180deg,#bff0ff,#7fdcff 45%,#2aa7e0);box-shadow:0 5px 0 #0b4f73;cursor:pointer}'+
    '.pe-bouton-v1:active{transform:translateY(3px);box-shadow:0 2px 0 #0b4f73}'+
    '@keyframes peLueur-v1{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}'+
    '@keyframes peMue-v1{0%{transform:scale(.4) rotate(-25deg);opacity:0}60%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}'+
    '@media (prefers-reduced-motion:reduce){.pe-icone-v1::before,.pe-icone-v1 span,.pe-icone-v1 img{animation:none}}';
  document.head.appendChild(s);
}

function html(c){
  var phrase=(c.phrase||[]).map(function(p){return p[1]==='v'?'<b>'+esc(p[0])+'</b>':'<span>'+esc(p[0])+'</span>';}).join(' ');
  var rows=(c.rows||[]).slice();
  if(c.n>1)rows.unshift(['Utilisations','×'+fmt(c.n,0)]);
  var lignes=rows.map(function(x){return '<div class="pe-ligne-v1"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>';}).join('');
  var icone=c.img?'<img src="'+esc(c.img)+'" alt="" onerror="this.outerHTML=\'<span>'+esc(c.icone)+'</span>\'">':'<span>'+esc(c.icone)+'</span>';
  return '<div class="pe-carte-v1"><div class="pe-icone-v1">'+icone+'</div>'+
    '<div class="pe-titre-v1">'+esc(c.titre)+'</div>'+
    (c.nom?'<div class="pe-nom-v1">'+esc(c.nom)+'</div>':'')+
    (phrase?'<div class="pe-phrase-v1">'+phrase+'</div>':'')+
    (lignes?'<div class="pe-lignes-v1">'+lignes+'</div>':'')+
    '<button type="button" class="pe-bouton-v1">OK</button></div>';
}

function fermer(){
  var b=document.getElementById(ID);
  if(b&&b.parentNode)b.parentNode.removeChild(b);
  courant=null;
  if(file.length)afficher(file.shift());
}

function afficher(c){
  styles();
  courant=c;
  var box=document.createElement('div');box.id=ID;box.className='pe-fond-v1';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('data-morph-garder','1');
  box.innerHTML=html(c);
  box.addEventListener('click',function(e){if(e.target===box||(e.target.classList&&e.target.classList.contains('pe-bouton-v1')))fermer();});
  document.body.appendChild(box);
  try{if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.play==='function')window.__SOREAL_IDLE_AUDIO_V199__.play(c.son||'achievement');}catch(_e){}
}

function annoncer(spec){
  if(!spec)return false;
  spec.n=spec.n||1;
  if(courant&&courant.cle===spec.cle){
    var n=courant.n+1;
    Object.keys(spec).forEach(function(k){courant[k]=spec[k];});
    courant.n=n;
    var box=document.getElementById(ID);
    if(box)box.innerHTML=html(courant);
    return true;
  }
  for(var i=0;i<file.length;i++){
    if(file[i].cle===spec.cle){var m=file[i].n+1;file[i]=spec;spec.n=m;return true;}
  }
  if(courant)file.push(spec);else afficher(spec);
  return true;
}

/* Appelé au retour d'une action (réponse du moteur). Renvoie vrai si un popup a été annoncé. */
function apres(payload,res){
  var l=construire(payload,res);
  if(!l)return false;
  l.forEach(function(s){annoncer(s);});
  return true;
}

/* Achat d'une activation auto Yggdrasil refusé : le cap d'Énergie ou de Magie n'est pas atteint (Norman, 2026-11-05). */
function refusCap(info){
  if(!info)return false;
  return annoncer({cle:'cap-auto-ygg',icone:'🌱',son:'purchaseRefused',titre:'Achat impossible',phrase:[['Il te faut d’abord un cap total de','t'],[info.texte+' '+info.nom,'v'],['pour acheter cette activation auto.','t']],rows:[['Cap requis',info.texte+' '+info.nom]]});
}

window.__SOREAL_IDLE_POPUP_EFFET_V1__={refusCap:refusCap,apres:apres,construire:construire,annoncer:annoncer,fermer:fermer,html:html,duree:duree,fmt:fmt,etat:function(){return {courant:courant,file:file.slice()};}};
})();
