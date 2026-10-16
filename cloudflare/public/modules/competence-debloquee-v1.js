/*
 * SOREAL IDLE — une compétence du combat manuel d'Aventure vient d'être débloquée (Norman, 2026-10-16 : « j'ai eu Mysterious Red Liquid, je l'ai utilisé et aucun popup ne m'a dit ce que j'avais eu »).
 * Les trois liquides mystérieux (rouge, violet, gris) sont consommés d'un clic et débloquent chacun une compétence avancée ; le serveur répond avec l'objet bu (resultat.definitionId).
 * Ce petit popup dit laquelle, avec ce qu'elle fait : uniquement ce que le joueur vient d'obtenir (règle n°2 : rien des autres liquides). Même présentation que le popup du Cube de l'infini.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_COMPETENCE_V1__)return;

/* objet bu -> compétence débloquée (noms et descriptions : les mêmes que le journal des attaques, journal-attaques-v1.js). */
var COMPETENCES={
  mysteriousRedLiquid:{nom:'Hyper Regen',icone:'💚',texte:'Applique tout de suite ta régénération accumulée puis la renforce pendant 5 s. Disponible dans le mode manuel du combat d’Aventure.'},
  mysteriousPurpleLiquid:{nom:'Beast Mode',icone:'🐲',texte:'Active ou coupe le mode Bête : ta Puissance × 1,4. Disponible dans le mode manuel du combat d’Aventure.'},
  mysteriousGreyLiquid:{nom:'Move 69',icone:'🎲',texte:'Un mouvement spécial, utilisable une fois par heure. Disponible dans le mode manuel du combat d’Aventure.'}
};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

function styles(){
  if(document.getElementById('competence-debloquee-style-v1'))return;
  var s=document.createElement('style');s.id='competence-debloquee-style-v1';
  s.textContent='.cd-fond-v1{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,18,.74);backdrop-filter:blur(3px)}'+
    '.cd-carte-v1{width:min(400px,100%);padding:22px 20px 18px;border-radius:18px;text-align:center;color:#eef3ff;font-family:"Russo One","Arial Black",Impact,sans-serif;background:linear-gradient(180deg,#26324f,#141b2e);border:3px solid #000;box-shadow:0 6px 0 #000,0 0 0 2px #ffd24a inset}'+
    '.cd-icone-v1{position:relative;width:96px;height:96px;margin:0 auto 6px;display:grid;place-items:center;font-size:62px;line-height:1}'+
    '.cd-icone-v1::before{content:"";position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(255,226,120,.55),transparent 68%);animation:cdLueur-v1 1.8s ease-in-out infinite}'+
    '.cd-icone-v1 span{position:relative;animation:cdMue-v1 1.1s cubic-bezier(.2,1.4,.4,1) both}'+
    '.cd-titre-v1{margin:6px 0 4px;font:400 28px/1.05 "Bangers","Russo One",Impact,sans-serif;letter-spacing:.05em;color:#ffd24a;text-shadow:0 3px 0 #6a3d00}'+
    '.cd-nom-v1{display:inline-block;margin:8px 0 4px;padding:6px 16px;border-radius:999px;font-size:18px;color:#2a1700;background:linear-gradient(180deg,#ffe58a,#ffd24a 45%,#ff9f1c);box-shadow:0 3px 0 #8a4b00}'+
    '.cd-texte-v1{margin:8px 0;font-size:15px;line-height:1.4;color:#d6def5}'+
    '.cd-bouton-v1{min-width:160px;margin-top:8px;padding:12px 18px;border:0;border-radius:14px;font:400 17px "Russo One",sans-serif;color:#2a1700;background:linear-gradient(180deg,#ffe58a,#ffd24a 45%,#ff9f1c);box-shadow:0 5px 0 #8a4b00;cursor:pointer}'+
    '.cd-bouton-v1:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4b00}'+
    '@keyframes cdLueur-v1{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}'+
    '@keyframes cdMue-v1{0%{transform:scale(.4) rotate(-25deg);opacity:0}60%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}'+
    '@media (prefers-reduced-motion:reduce){.cd-icone-v1::before,.cd-icone-v1 span{animation:none}}';
  document.head.appendChild(s);
}

function fermer(){var b=document.getElementById('competence-debloquee-v1');if(b&&b.parentNode)b.parentNode.removeChild(b);}

function annoncer(definitionId){
  var c=COMPETENCES[String(definitionId||'')];
  if(!c)return false;
  styles();
  fermer();
  var box=document.createElement('div');box.id='competence-debloquee-v1';box.className='cd-fond-v1';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  box.innerHTML='<div class="cd-carte-v1"><div class="cd-icone-v1"><span>'+esc(c.icone)+'</span></div>'+
    '<div class="cd-titre-v1">Nouvelle compétence débloquée !</div>'+
    '<div class="cd-nom-v1">'+esc(c.nom)+'</div>'+
    '<div class="cd-texte-v1">'+esc(c.texte)+'</div>'+
    '<button type="button" class="cd-bouton-v1">Super !</button></div>';
  box.addEventListener('click',function(e){if(e.target===box||(e.target.classList&&e.target.classList.contains('cd-bouton-v1')))fermer();});
  document.body.appendChild(box);
  try{if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.play==='function')window.__SOREAL_IDLE_AUDIO_V199__.play('achievement');}catch(_e){}
  return true;
}

window.__SOREAL_IDLE_COMPETENCE_V1__={annoncer:annoncer,fermer:fermer};
})();
