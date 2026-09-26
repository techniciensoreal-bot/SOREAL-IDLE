/*
 * SOREAL IDLE — « Signaler un bug » (Norman, 2026-09-26) : bouton dans Settings ; un mail « Soreal IDLE Bug signalé » part vers Norman avec le message de
 * la personne (voir integrations/idle-bug-mail/README.md). Impossible d'envoyer sans message. La saisie vit dans une fenêtre hors de #app : le rendu
 * complet du jeu remplace #app en continu et effacerait le texte en cours d'écriture.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_BUG_REPORT_V1__)return;

var MAX=2000;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

function style(){
  if(document.getElementById('soreal-idle-bug-style-v1'))return;
  var st=document.createElement('style');
  st.id='soreal-idle-bug-style-v1';
  st.textContent=
    '#soreal-idle-bug-v1{position:fixed;inset:0;z-index:100002;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}'+
    '#soreal-idle-bug-v1 .boite{width:min(560px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#dce5f3;box-shadow:0 18px 50px rgba(0,0,0,.6)}'+
    '#soreal-idle-bug-v1 h3{margin:0 0 6px;font-size:18px}'+
    '#soreal-idle-bug-v1 .aide{font-size:12px;color:#8fa3c9;margin-bottom:10px}'+
    '#soreal-idle-bug-v1 textarea{width:100%;min-height:150px;box-sizing:border-box;resize:vertical;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#0f1729;color:#eef4fc;padding:10px;font:14px/1.4 system-ui,sans-serif}'+
    '#soreal-idle-bug-v1 .compteur{font-size:11px;color:#8fa3c9;text-align:right;margin-top:3px}'+
    '#soreal-idle-bug-v1 .retour{min-height:18px;margin-top:8px;font-size:13px}'+
    '#soreal-idle-bug-v1 .retour.erreur{color:#ffb4b4}#soreal-idle-bug-v1 .retour.ok{color:#9ee6b3}'+
    '#soreal-idle-bug-v1 .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}'+
    '#soreal-idle-bug-v1 button{padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;font:600 14px system-ui,sans-serif;cursor:pointer}'+
    '#soreal-idle-bug-v1 button.envoyer{background:#2f6fd0;border-color:#5b93e6}'+
    '#soreal-idle-bug-v1 button:disabled{opacity:.4;cursor:not-allowed}'+
    '#soreal-idle-bug-v1 .rapport{border:1px solid rgba(166,188,229,.18);border-radius:10px;padding:8px 10px;margin-top:8px;font-size:13px;white-space:pre-wrap}'+
    '#soreal-idle-bug-v1 .rapport small{display:block;color:#8fa3c9;margin-bottom:3px}';
  document.head.appendChild(st);
}

function contexte(){
  var actif=document.querySelector('.soreal-idle-nav-v28 [data-menu-id-v1].active,.soreal-idle-nav-v28 [data-menu-id-v1][aria-current="page"]');
  var notes=window.__SOREAL_IDLE_RELEASE_NOTES_V1__;
  return {
    version:notes&&notes.courante?notes.courante:'?',
    menu:actif?actif.getAttribute('data-menu-id-v1'):'',
    appareil:String(navigator.userAgent||'').slice(0,160),
    ecran:window.innerWidth+'x'+window.innerHeight,
    heure:new Date().toString().slice(0,60)
  };
}

function fermer(){var o=document.getElementById('soreal-idle-bug-v1');if(o)o.remove();}

function ouvrir(){
  if(document.getElementById('soreal-idle-bug-v1'))return;
  style();
  var o=document.createElement('div');
  o.id='soreal-idle-bug-v1';
  o.innerHTML='<div class="boite" role="dialog" aria-modal="true" aria-label="Signaler un bug">'+
    '<h3>🐞 Signaler un bug</h3>'+
    '<div class="aide">Explique ce qui s’est passé et ce que tu faisais. Ton message est envoyé à Norman.</div>'+
    '<textarea id="soreal-idle-bug-texte-v1" maxlength="'+MAX+'" placeholder="Décris le problème…"></textarea>'+
    '<div class="compteur"><span id="soreal-idle-bug-compte-v1">0</span> / '+MAX+'</div>'+
    '<div class="retour" id="soreal-idle-bug-retour-v1" aria-live="polite"></div>'+
    '<div class="actions"><button type="button" id="soreal-idle-bug-annuler-v1">Annuler</button><button type="button" class="envoyer" id="soreal-idle-bug-envoyer-v1" disabled>Envoyer</button></div>'+
  '</div>';
  document.body.appendChild(o);
  var ta=document.getElementById('soreal-idle-bug-texte-v1');
  var bt=document.getElementById('soreal-idle-bug-envoyer-v1');
  var retour=document.getElementById('soreal-idle-bug-retour-v1');
  function maj(){
    document.getElementById('soreal-idle-bug-compte-v1').textContent=String(ta.value.length);
    bt.disabled=!ta.value.trim();
  }
  ta.addEventListener('input',maj);
  document.getElementById('soreal-idle-bug-annuler-v1').addEventListener('click',fermer);
  o.addEventListener('mousedown',function(e){if(e.target===o)fermer();});
  bt.addEventListener('click',function(){
    var msg=ta.value.trim();
    if(!msg)return;
    bt.disabled=true;ta.disabled=true;
    retour.className='retour';retour.textContent='Envoi…';
    function echec(m){ta.disabled=false;maj();retour.className='retour erreur';retour.textContent=m||'Envoi impossible. Réessaie dans un instant.';}
    try{
      google.script.run
        .withSuccessHandler(function(res){
          if(res&&res.ok){
            retour.className='retour ok';
            retour.textContent=res.mailEnvoye===true?'Signalement envoyé. Merci !':'Signalement enregistré. Merci !';
            setTimeout(fermer,1800);
          }else{echec(res&&res.message);}
        })
        .withFailureHandler(function(e){echec(e&&e.message);})
        .signalerBugSorealIdle(window.SOREAL_SESSION||(typeof SOREAL_SESSION!=='undefined'?SOREAL_SESSION:''),msg,contexte());
    }catch(e){echec();}
  });
  ta.focus();
}

/* Administrateur : derniers signalements. */
function voirRapports(){
  style();
  var ancien=document.getElementById('soreal-idle-bug-v1');if(ancien)ancien.remove();
  var o=document.createElement('div');
  o.id='soreal-idle-bug-v1';
  o.innerHTML='<div class="boite"><h3>📥 Signalements reçus</h3><div id="soreal-idle-bug-liste-v1" class="aide">Chargement…</div><div class="actions"><button type="button" id="soreal-idle-bug-fermer-v1">Fermer</button></div></div>';
  document.body.appendChild(o);
  document.getElementById('soreal-idle-bug-fermer-v1').addEventListener('click',fermer);
  o.addEventListener('mousedown',function(e){if(e.target===o)fermer();});
  var zone=document.getElementById('soreal-idle-bug-liste-v1');
  try{
    google.script.run
      .withSuccessHandler(function(res){
        var l=res&&res.ok&&Array.isArray(res.bugs)?res.bugs:[];
        zone.className='';
        zone.innerHTML=l.length?l.map(function(b){
          var c=b.contexte||{};
          return '<div class="rapport"><small>#'+esc(b.id)+' · '+esc(new Date(Number(b.at)||0).toLocaleString('fr-BE'))+' · '+esc(b.prenom||'?')+(c.version?' · Beta '+esc(c.version):'')+(c.menu?' · '+esc(c.menu):'')+' · mail : '+esc(b.mail||'—')+'</small>'+esc(b.message)+'</div>';
        }).join(''):'<div class="aide">Aucun signalement pour l’instant.</div>';
      })
      .withFailureHandler(function(e){zone.textContent=(e&&e.message)||'Lecture impossible.';})
      .lireBugsSorealIdle(window.SOREAL_SESSION||(typeof SOREAL_SESSION!=='undefined'?SOREAL_SESSION:''));
  }catch(e){zone.textContent='Lecture impossible.';}
}

/* Bloc de la page Settings. */
function html(estAdmin){
  return '<div class="soreal-idle-section-v8">'+
    '<div class="soreal-idle-window-title-v31">🐞 Signaler un bug</div>'+
    '<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Quelque chose ne fonctionne pas comme prévu ? Écris-le nous : ton message est envoyé à Norman.</div>'+
    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__bugReportOuvrirV1__()">🐞 Signaler un bug</button>'+
    (estAdmin?' <button type="button" class="soreal-idle-expand-button-v25" onclick="window.__bugReportVoirV1__()">📥 Signalements reçus</button>':'')+
  '</div>';
}

window.__bugReportOuvrirV1__=ouvrir;
window.__bugReportVoirV1__=voirRapports;
window.__SOREAL_IDLE_BUG_REPORT_V1__={html:html,ouvrir:ouvrir,voirRapports:voirRapports};
})();
