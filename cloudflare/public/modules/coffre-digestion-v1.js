/*
 * SOREAL IDLE — le Coffre rote et pète de temps en temps, au hasard (Norman, 2026-10-10 : « que le coffre rote et pète aléatoirement avec un son que tu vas créer »).
 * Un minuteur tire un délai entre 25 et 70 secondes ; quand il sonne, le Coffre est à l'écran et l'onglet visible, le son (6 rots, 6 pets, modules/audio-coffre-v1.js) est joué par le moteur audio
 * (donc coupé avec les effets sonores) et le Coffre se trémousse un instant. Sinon on réessaie un peu plus tard : jamais de bruit hors de vue.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_COFFRE_DIGESTION_V1__)return;
  var MIN=25000,MAX=70000;

  function coffreVisible_(){
    var el=document.querySelector('.soreal-idle-coffre-v1 .bg-bagage-v1,.bg-bagage-v1');
    if(!el||typeof el.getBoundingClientRect!=='function')return null;
    var r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight;
    return r.width>0&&r.height>0&&r.bottom>0&&r.top<h?el:null;
  }
  function tremousser_(el,type){
    var c=type==='pet'?'bg-pete-v1':'bg-rote-v1';
    el.classList.remove('bg-rote-v1','bg-pete-v1');
    void el.getBoundingClientRect();
    el.classList.add(c);
    setTimeout(function(){el.classList.remove(c);},900);
    if(type==='pet')excuses_(el);
  }
  /* Quand il pète : un petit nuage de fumée et une bulle « Désolé » (toujours en français, même en anglais : demande de Norman, 2026-10-10). */
  function excuses_(el){
    var f=document.createElement('span');
    f.className='bg-fumee-v1';f.setAttribute('aria-hidden','true');
    f.innerHTML='<i></i><i></i><i></i>';
    var b=document.createElement('span');
    /* Très rarement (1 fois sur 8), une autre réplique, plus longue : la bulle s'élargit et reste un peu plus longtemps. */
    var rare=Math.random()<.125;
    b.className='bg-desole-v1'+(rare?' bg-desole-rare-v1':'');b.setAttribute('data-sans-traduction','');b.setAttribute('aria-hidden','true');
    b.textContent=rare?'J’étais à 2 doigts de chier sur tes affaires':'Désolé';
    el.appendChild(f);el.appendChild(b);
    setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f);if(b.parentNode)b.parentNode.removeChild(b);},rare?3600:2300);
  }
  function jouer_(type){
    var el=coffreVisible_();
    if(!el||document.hidden)return false;
    try{
      var a=window.__SOREAL_IDLE_AUDIO_V199__;
      if(a&&typeof a.play==='function')a.play(type==='pet'?'coffrePet':'coffreRot');
    }catch(_e){}
    tremousser_(el,type);
    return true;
  }
  function suivant_(){
    setTimeout(function(){
      var type=Math.random()<.5?'rot':'pet';
      if(jouer_(type))suivant_();
      else setTimeout(suivant_,8000);
    },MIN+Math.random()*(MAX-MIN));
  }
  suivant_();
  window.__SOREAL_IDLE_COFFRE_DIGESTION_V1__={jouer:jouer_};
})();
