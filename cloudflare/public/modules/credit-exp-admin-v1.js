/*
 * SOREAL IDLE — « EXP des joueurs » (administrateur, menu Admin) : donner de l'EXP à un joueur et lire le journal des variations d'EXP (Norman, 2026-10-08 : les 300 EXP du set de la Grotte jamais versés à Sébastien).
 * Le joueur se désigne par son prénom ou son adresse e-mail ; le serveur refuse une correspondance ambiguë. Chaque ouverture du formulaire a sa propre référence : un double clic ne crédite jamais deux fois.
 * Fenêtre à part (hors de #app) : le rendu complet du jeu remplace #app en continu et effacerait la saisie.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CREDIT_EXP_V1__)return;

var ID='soreal-idle-credit-exp-v1';
var CLE_JOUEUR='soreal_idle_credit_exp_joueur_v1';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nombre(v){return Math.round(Number(v)||0).toLocaleString('fr-FR');}
function appel(nom,args){
  var f=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
  return Promise.resolve(f(nom,args));
}
function lire(){try{return localStorage.getItem(CLE_JOUEUR)||'';}catch(e){return '';}}
function ecrire(v){try{localStorage.setItem(CLE_JOUEUR,v);}catch(e){}}

function style(){
  if(document.getElementById(ID+'-style'))return;
  var st=document.createElement('style');
  st.id=ID+'-style';
  st.textContent=
    '#'+ID+'{position:fixed;inset:0;z-index:100002;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}'+
    '#'+ID+' .boite{width:min(520px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#eef4fc;font:15px/1.4 system-ui,sans-serif}'+
    '#'+ID+' h3{margin:0 0 6px;font-size:18px}'+
    '#'+ID+' .aide{font-size:14px;color:#8fa3c9;margin-bottom:10px}'+
    '#'+ID+' label{display:block;font-size:13px;color:#8fa3c9;margin:8px 0 3px}'+
    '#'+ID+' input{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#0e1626;color:#eef4fc;padding:10px;font:16px system-ui,sans-serif}'+
    '#'+ID+' .retour{min-height:20px;margin-top:10px;font-size:15px}'+
    '#'+ID+' .retour.erreur{color:#ffb4b4}#'+ID+' .retour.ok{color:#9ee6b3}'+
    '#'+ID+' .actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}'+
    '#'+ID+' button{padding:10px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;font:600 14px system-ui,sans-serif;cursor:pointer}'+
    '#'+ID+' button.donner{background:#2f6fd0;border-color:#5b93e6}'+
    '#'+ID+' button.arme{background:#b8741a;border-color:#e8a23c}'+
    '#'+ID+' button:disabled{opacity:.4;cursor:not-allowed}'+
    '#'+ID+' .ligne{border-top:1px solid rgba(166,188,229,.14);padding:6px 0;font-size:14px}'+
    '#'+ID+' .ligne small{display:block;color:#8fa3c9}'+
    '#'+ID+' .plus{color:#9ee6b3;font-weight:700}#'+ID+' .moins{color:#ffb4b4;font-weight:700}';
  document.head.appendChild(st);
}

function fermer(){var o=document.getElementById(ID);if(o)o.remove();}

/* Phrase lisible pour l'opération d'une ligne du journal. */
function libelle(op){
  op=String(op||'');
  if(op.indexOf('crediterExpAdminSorealIdle')===0)return '🎁 Crédit de l’administrateur'+(op.indexOf(':')>0?' ('+op.slice(op.indexOf(':')+1).replace(/^admin-\d+$/,'manuel')+')':'');
  var noms={agirProgressionSorealIdle:'Action du jeu',obtenirEtatSorealIdle:'Synchronisation',battementSorealIdle:'Présence',combattreBossSorealIdle:'Combat de boss'};
  return noms[op]||op;
}

function ouvrir(){
  if(document.getElementById(ID))return;
  style();
  var reference='admin-'+Date.now();
  var o=document.createElement('div');
  o.id=ID;
  o.innerHTML='<div class="boite" role="dialog" aria-modal="true" aria-label="EXP des joueurs">'+
    '<h3>💰 EXP des joueurs</h3>'+
    '<div class="aide">Donne de l’EXP à un joueur, ou lis le journal de ses variations d’EXP (60 jours, depuis la mise en place du journal).</div>'+
    '<label for="'+ID+'-joueur">Joueur (prénom ou adresse e-mail)</label>'+
    '<input id="'+ID+'-joueur" type="text" autocomplete="off" spellcheck="false" placeholder="Sébastien" value="'+esc(lire())+'">'+
    '<label for="'+ID+'-montant">EXP à donner</label>'+
    '<input id="'+ID+'-montant" type="number" min="1" step="1" inputmode="numeric" value="300">'+
    '<div class="retour" id="'+ID+'-retour" aria-live="polite"></div>'+
    '<div class="actions">'+
      '<button type="button" id="'+ID+'-fermer">Fermer</button>'+
      '<button type="button" id="'+ID+'-journal">📜 Journal</button>'+
      '<button type="button" class="donner" id="'+ID+'-donner">Donner l’EXP</button>'+
    '</div>'+
    '<div id="'+ID+'-liste"></div>'+
  '</div>';
  document.body.appendChild(o);
  var champJoueur=document.getElementById(ID+'-joueur');
  var champMontant=document.getElementById(ID+'-montant');
  var retour=document.getElementById(ID+'-retour');
  var bDonner=document.getElementById(ID+'-donner');
  var bJournal=document.getElementById(ID+'-journal');
  var liste=document.getElementById(ID+'-liste');
  function msg(texte,classe){retour.className='retour'+(classe?' '+classe:'');retour.textContent=texte;}
  function desarmer(){bDonner.classList.remove('arme');bDonner.textContent='Donner l’EXP';}
  champJoueur.addEventListener('input',desarmer);
  champMontant.addEventListener('input',desarmer);
  document.getElementById(ID+'-fermer').addEventListener('click',fermer);
  o.addEventListener('mousedown',function(e){if(e.target===o)fermer();});

  bDonner.addEventListener('click',function(){
    var joueur=champJoueur.value.trim();
    var montant=Math.floor(Number(champMontant.value));
    if(!joueur){msg('Écris le prénom ou l’adresse du joueur.','erreur');return;}
    if(!(montant>=1)){msg('Écris un nombre d’EXP (1 ou plus).','erreur');return;}
    /* Deux temps : le premier clic demande confirmation, le second envoie. */
    if(!bDonner.classList.contains('arme')){
      bDonner.classList.add('arme');
      bDonner.textContent='Confirmer : +'+nombre(montant)+' EXP à '+joueur+' ?';
      msg('','');
      return;
    }
    bDonner.disabled=true;
    msg('Envoi…','');
    ecrire(joueur);
    appel('crediterExpAdminSorealIdle',[{joueur:joueur,montant:montant,reference:reference}]).then(function(res){
      bDonner.disabled=false;desarmer();
      if(res&&res.ok){
        msg('✅ '+res.email+' : '+nombre(res.avant)+' → '+nombre(res.apres)+' EXP (+'+nombre(res.montant)+').','ok');
        /* Après un succès, un nouveau clic ne repasse pas : la référence de cette fenêtre est déjà utilisée. */
        bDonner.disabled=true;
      }else{
        msg((res&&res.message)||'Crédit impossible.','erreur');
      }
    }).catch(function(e){bDonner.disabled=false;desarmer();msg((e&&e.message)||'Crédit impossible.','erreur');});
  });

  bJournal.addEventListener('click',function(){
    var joueur=champJoueur.value.trim();
    msg('Lecture du journal…','');
    liste.innerHTML='';
    appel('lireGainsExpAdminSorealIdle',[{joueur:joueur,limite:30}]).then(function(res){
      if(!(res&&res.ok)){msg((res&&res.message)||'Lecture impossible.','erreur');return;}
      var l=Array.isArray(res.lignes)?res.lignes:[];
      msg(l.length?(joueur?'Journal de '+joueur+' :':'Journal de tous les joueurs :'):'Le journal est vide pour l’instant (il se remplit à partir de la mise en place).','');
      liste.innerHTML=l.map(function(x){
        var d=Number(x.delta)||0;
        return '<div class="ligne"><small>'+esc(new Date(Number(x.at)||0).toLocaleString('fr-BE'))+(joueur?'':' · '+esc(x.nom||x.email))+' · '+esc(libelle(x.operation))+'</small>'+
          '<span class="'+(d>=0?'plus':'moins')+'">'+(d>=0?'+':'−')+nombre(Math.abs(d))+' EXP</span> · '+nombre(x.avant)+' → '+nombre(x.apres)+'</div>';
      }).join('');
    }).catch(function(e){msg((e&&e.message)||'Lecture impossible.','erreur');});
  });
  champJoueur.focus();
}

/* Carte du menu Admin. */
function pageHtml(){
  return '<div class="soreal-idle-section-v8">'+
    '<div class="soreal-idle-window-title-v31">💰 EXP des joueurs</div>'+
    '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Donner de l’EXP à un joueur (réparer un oubli) et lire le journal de ses variations d’EXP.</div>'+
    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__SOREAL_IDLE_CREDIT_EXP_V1__.ouvrir()">💰 Donner de l’EXP / journal</button>'+
  '</div>';
}

window.__SOREAL_IDLE_CREDIT_EXP_V1__={ouvrir:ouvrir,pageHtml:pageHtml,libelle:libelle};
})();
