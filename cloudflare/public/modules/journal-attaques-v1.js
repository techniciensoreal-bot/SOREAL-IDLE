/*
 * JOURNAL DES ATTAQUES (Norman, 2026-10-13) : « un petit journal consultable qui explique ce que font nos attaques (parade, ultime…) » ; « accessible même hors combat et en mode Aventure » ; « un petit bouton discret sur la même
 * ligne que Mode Idle ON ou OFF » ; « plus joli, avec des couleurs et des emojis » ; « ne pas parler des sets qui permettent d'améliorer : ça doit rester secret » ; « ne jamais mentionner le wiki ».
 *
 * Une fenêtre autonome ouverte par le petit bouton 📖 posé à côté d'« Idle Mode » (rendreCommandesAdventureIdleV3_, soreal-idle-ui.js : donc sur la page Aventure et dans l'écran de combat de titan).
 * Ce que fait chaque raccourci est lu dans le code du jeu (IDLE_ADVENTURE_MANUAL_ATTACKS_V3, ..._DEFENSE_V3, ..._ADVANCED_SKILLS_V4, multiplicateurPowerManuelAdventureIdleV3_, appliquerHealAdventureIdleV4_…) : aucune valeur inventée.
 * SECRET : aucune mention des sets ni des équipements qui améliorent une attaque (ces bonus restent à découvrir) ; aucune mention de la source des chiffres.
 * Anti-spoil (Norman, 2026-10-13 : « le journal ne doit pas mentionner les attaques non débloquées ») : seuls les raccourcis débloqués sont expliqués (window.__competencesJournalIdleV1__), jamais une attaque encore verrouillée.
 *
 *   window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__ = { ouvrir, fermer, html }
 */
(function(){
'use strict';

var ID='ttnJournalV1';
var CATEGORIES=[
  {id:'attaque',t:'Attaques',i:'⚔️',c:'#ff6b5a',d:'Tes coups : plus ils sont lents à revenir, plus ils frappent fort.'},
  {id:'defense',t:'Défense et soutien',i:'🛡️',c:'#5ab8ff',d:'Pour tenir plus longtemps et frapper plus fort.'},
  {id:'avancee',t:'Compétences avancées',i:'✨',c:'#c58bff',d:'Des capacités plus rares, réservées aux plus entraînés.'}
];
var JOURNAL=[
  {id:'regular',k:'attaque',t:'Attaque',i:'⚔️',cd:'1 s',d:'Ton coup de base : <b>Puissance × 1,5</b>, réduits par l’Endurance de l’ennemi.'},
  {id:'strong',k:'attaque',t:'Forte',i:'💥',cd:'4 s',d:'Un gros coup : <b>Puissance × 2</b>.'},
  {id:'parry',k:'attaque',t:'Parade',i:'🛡️',cd:'15 s',d:'À lancer <b>avant</b> le coup de l’ennemi : elle bloque sa prochaine attaque (<b>−50 % de dégâts</b>) puis <b>riposte</b> toute seule (Puissance × 1).'},
  {id:'piercing',k:'attaque',t:'Perçante',i:'🗡️',cd:'8 s',d:'<b>Puissance × 2</b>, et elle ignore <b>33 %</b> de l’Endurance de l’ennemi.'},
  {id:'ultimate',k:'attaque',t:'Ultime',i:'☄️',cd:'15 s',d:'Ta plus grosse frappe : <b>Puissance × (2 + 0,01 par boss vaincu au record)</b>.'},
  {id:'block',k:'defense',t:'Blocage',i:'🛡️',cd:'10 s',d:'Pendant <b>3 s</b>, tu encaisses beaucoup moins. La réduction vaut <b>(niveau + 50) / (niveau + 100)</b> de ton Block en Entraînement avancé.'},
  {id:'defensiveBuff',k:'defense',t:'Défense',i:'🔷',cd:'45 s',d:'Ton Endurance <b>× 1,2</b> pendant 15 s.'},
  {id:'heal',k:'defense',t:'Soin',i:'❤️',cd:'15 s',d:'Te rend <b>15 %</b> de tes PV max d’un coup.'},
  {id:'offensiveBuff',k:'defense',t:'Puissance',i:'🔶',cd:'45 s',d:'Ta Puissance <b>× 1,2</b> pendant 15 s.'},
  {id:'charge',k:'defense',t:'Charge',i:'⚡',cd:'30 s',d:'Ta prochaine attaque ou défense est <b>doublée</b>.'},
  {id:'ultimateBuff',k:'defense',t:'Bonus ultime',i:'🌠',cd:'45 s',d:'Puissance <b>× 1,3</b> ET Endurance <b>× 1,3</b> pendant 15 s.'},
  {id:'paralyze',k:'avancee',t:'Paralyze',i:'⏸️',cd:'15 s',d:'Paralyse l’ennemi pendant <b>3 s</b>.'},
  {id:'hyperRegen',k:'avancee',t:'Hyper Regen',i:'💚',cd:'35 s',d:'Applique tout de suite ta régénération accumulée puis la renforce pendant <b>5 s</b>.'},
  {id:'beastMode',k:'avancee',t:'Beast Mode',i:'🐲',cd:'15 s',d:'Active ou coupe le mode Bête : ta Puissance <b>× 1,4</b>.'},
  {id:'megaBuff',k:'avancee',t:'Mega Buff',i:'🌟',cd:'50 s',d:'Active d’un coup les trois bonus de puissance et de défense, avec un bonus de <b>× 1,2</b> de plus sur la Puissance et l’Endurance, pendant 15 s. Ces trois bonus passent en recharge.'},
  {id:'ohShit',k:'avancee',t:'Oh Shit',i:'🚨',cd:'35 s',d:'Le bouton de panique : <b>te soigne, paralyse l’ennemi et accélère ta régénération</b> d’un coup (ces trois capacités passent en recharge).'},
  {id:'move69',k:'avancee',t:'Move 69',i:'🎲',cd:'1 h',d:'Un mouvement spécial, utilisable <b>une fois par heure</b>.'}
];
var GENERAL=[
  {i:'🤖',d:'<b>Idle Mode ON</b> : ton personnage frappe tout seul environ une fois par seconde (les raccourcis sont alors grisés). <b>OFF</b> : c’est toi qui lances les attaques.'},
  {i:'⏳',d:'Chaque action que tu lances impose un court délai (environ 1 s) avant la suivante.'}
];

function h(x){var H=window.__SOREAL_IDLE_META_HOST_V130__,f=H&&H.idleHtml_;return typeof f==='function'?f(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* Les raccourcis à expliquer : uniquement ceux déjà débloqués (anti-spoil : jamais une attaque encore verrouillée). Si l'état est illisible, rien n'est expliqué. */
function visibles(){
  var ids=[];
  try{if(typeof window.__competencesJournalIdleV1__==='function')ids=window.__competencesJournalIdleV1__();}catch(_e){}
  return ids;
}
/* Les textes <b> ci-dessus sont écrits ici même (jamais saisis par le joueur) : seul le nom est échappé. */
function html(){
  var ids=visibles(),out='';
  CATEGORIES.forEach(function(cat){
    var liste=JOURNAL.filter(function(e){return e.k===cat.id&&ids.indexOf(e.id)!==-1;});
    if(!liste.length)return;
    out+='<section class="jat-cat" style="--jat-k:'+cat.c+'"><div class="jat-cat-t"><span>'+cat.i+'</span><div><b>'+h(cat.t)+'</b><small>'+h(cat.d)+'</small></div></div>'+
      liste.map(function(e){
        return '<div class="jat-l"><span class="jat-i">'+h(e.i)+'</span><div class="jat-tx"><div class="jat-nom"><b>'+h(e.t)+'</b><em>⏱ '+h(e.cd)+'</em></div><p>'+e.d+'</p></div></div>';
      }).join('')+'</section>';
  });
  out+='<section class="jat-cat jat-gen" style="--jat-k:#ffd166"><div class="jat-cat-t"><span>💡</span><div><b>À savoir</b></div></div>'+
    GENERAL.map(function(g){return '<div class="jat-l"><span class="jat-i">'+g.i+'</span><div class="jat-tx"><p>'+g.d+'</p></div></div>';}).join('')+'</section>';
  return out;
}

function css(){
  if(document.getElementById('ttnJournalStyleV1'))return;
  var st=document.createElement('style');
  st.id='ttnJournalStyleV1';
  st.textContent=[
    '#'+ID+'{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(4,2,10,.78)}',
    '#'+ID+' .jat-carte{display:flex;flex-direction:column;width:min(580px,100%);max-height:min(88vh,760px);border:3px solid #000;border-radius:18px;background:linear-gradient(170deg,#241636,#0c0814 70%);box-shadow:0 0 0 2px var(--jat-c,#ffd166),0 0 44px rgba(150,90,255,.35),6px 6px 0 #000;overflow:hidden;color:#f0e6ff;font-family:var(--f-texte,"Russo One",sans-serif)}',
    '#'+ID+' .jat-tete{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;font-size:19px;background:linear-gradient(90deg,#5a2d9c,#b4417a 55%,#e8913a);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.55);border-bottom:3px solid #000}',
    '#'+ID+' .jat-tete button{border:2px solid #000;border-radius:9px;background:#3a1230;color:#fff;font:inherit;font-weight:900;padding:3px 12px;cursor:pointer}',
    '#'+ID+' .jat-corps{flex:1 1 auto;min-height:0;overflow-y:auto;padding:10px 12px 16px;display:flex;flex-direction:column;gap:12px;-webkit-overflow-scrolling:touch}',
    '#'+ID+' .jat-cat{flex:0 0 auto;border:2px solid #000;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px var(--jat-k),3px 3px 0 #000;overflow:hidden}',
    '#'+ID+' .jat-cat-t{display:flex;align-items:center;gap:10px;padding:8px 12px;background:linear-gradient(90deg,var(--jat-k),transparent);border-bottom:2px solid #000}',
    '#'+ID+' .jat-cat-t>span{font-size:26px;filter:drop-shadow(0 2px 0 #000)}',
    '#'+ID+' .jat-cat-t b{display:block;font-size:16px;color:#fff;text-shadow:0 2px 0 #000}',
    '#'+ID+' .jat-cat-t small{display:block;font-size:11.5px;font-weight:700;color:#fff;opacity:.9;text-shadow:0 1px 0 #000}',
    '#'+ID+' .jat-l{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-top:1px solid rgba(255,255,255,.08)}',
    '#'+ID+' .jat-l:first-of-type{border-top:0}',
    '#'+ID+' .jat-i{flex:0 0 38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:21px;border:2px solid #000;border-radius:11px;background:linear-gradient(180deg,var(--jat-k),rgba(0,0,0,.4));box-shadow:2px 2px 0 #000}',
    '#'+ID+' .jat-tx{min-width:0;flex:1}',
    '#'+ID+' .jat-nom{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '#'+ID+' .jat-nom b{font-size:15px;color:var(--jat-k);text-shadow:0 1px 0 #000}',
    '#'+ID+' .jat-nom em{flex:0 0 auto;font-style:normal;font-size:11.5px;font-weight:900;padding:2px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.45);color:#ffe9a8}',
    '#'+ID+' .jat-l p{margin:3px 0 0;font-size:13px;line-height:1.4;font-weight:700;color:#e9ddf7}',
    '#'+ID+' .jat-l p b{color:#fff;background:rgba(255,255,255,.1);padding:0 4px;border-radius:5px}',
    /* petit bouton discret à côté d'Idle Mode */
    '.soreal-idle-adventure-idle-ligne-v1{display:flex;align-items:stretch;gap:6px}',
    '.soreal-idle-adventure-idle-ligne-v1>.soreal-idle-adventure-idle-toggle-v3{flex:1 1 auto;min-width:0}',
    '.soreal-idle-journal-mini-v1{flex:0 0 38px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid rgba(166,188,229,.28);border-radius:10px;background:rgba(20,28,48,.7);color:#cfd8ee;font-size:17px;line-height:1;cursor:pointer;opacity:.8;transition:opacity .15s,transform .1s}',
    '.soreal-idle-journal-mini-v1:hover{opacity:1}.soreal-idle-journal-mini-v1:active{transform:scale(.93)}'
  ].join('\n');
  document.head.appendChild(st);
}

function fermer(){var m=document.getElementById(ID);if(m&&m.parentNode)m.parentNode.removeChild(m);document.removeEventListener('keydown',clavier,true);}
function clavier(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();fermer();}}
function ouvrir(){
  css();
  fermer();
  var m=document.createElement('div');
  m.id=ID;
  /* couleur du titan en cours si l'écran de combat est ouvert, sinon or */
  var ecran=document.getElementById('ttnCombatV1');
  var c=ecran&&ecran.style.getPropertyValue('--tcv-c');
  if(c)m.style.setProperty('--jat-c',c);
  m.innerHTML='<div class="jat-carte" role="dialog" aria-modal="true" aria-label="Journal des attaques"><div class="jat-tete"><b>📖 Journal des attaques</b><button type="button" aria-label="Fermer">✕</button></div><div class="jat-corps">'+html()+'</div></div>';
  m.addEventListener('click',function(e){if(e.target===m)fermer();});
  m.querySelector('.jat-tete button').addEventListener('click',fermer);
  document.addEventListener('keydown',clavier,true);
  document.body.appendChild(m);
}

/* le style du bouton posé à côté d'Idle Mode est prêt dès le chargement */
css();
window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__={ouvrir:ouvrir,fermer:fermer,html:html};
})();
