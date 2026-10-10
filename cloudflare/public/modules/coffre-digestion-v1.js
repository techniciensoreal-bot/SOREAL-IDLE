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
  /* Quand il pète : un petit nuage de fumée et une bulle « Désolé » (toujours en français, même en anglais : demande de Norman, 2026-10-10). Très rarement (1 fois sur 8), il enchaîne avec « J'étais à 2 doigts de chier sur tes
     affaires », une goutte de sueur lui perle alors au front : elle apparaît en fondu en glissant un peu, puis s'efface. */
  function bulle_(el,texte,rare,delai){
    var b=document.createElement('span');
    b.className='bg-desole-v1'+(rare?' bg-desole-rare-v1':'');b.setAttribute('data-sans-traduction','');b.setAttribute('aria-hidden','true');
    b.textContent=texte;
    if(delai)b.style.animationDelay=delai+'ms';
    el.appendChild(b);
    return b;
  }
  function retirer_(n,ms){setTimeout(function(){if(n&&n.parentNode)n.parentNode.removeChild(n);},ms);}
  function excuses_(el){
    var f=document.createElement('span');
    f.className='bg-fumee-v1';f.setAttribute('aria-hidden','true');
    f.innerHTML='<i></i><i></i><i></i>';
    el.appendChild(f);retirer_(f,2300);
    var rare=Math.random()<.125;
    retirer_(bulle_(el,'Désolé',false,0),2300);
    if(rare){
      var seconde=bulle_(el,'J’étais à 2 doigts de chier sur tes affaires',true,1900);
      var g=document.createElement('span');
      g.className='bg-sueur-v1';g.setAttribute('aria-hidden','true');g.style.animationDelay='2000ms';
      g.innerHTML='<svg viewBox="0 0 12 18"><path d="M6 1 C6 1 1.2 8 1.2 11.6 A4.8 4.8 0 0 0 10.8 11.6 C10.8 8 6 1 6 1 Z" fill="#8fd6ff" stroke="#2a6f9e" stroke-width="1.2" stroke-linejoin="round"/><path d="M3.6 11.2 A2.6 2.6 0 0 0 5.6 14" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>';
      el.appendChild(g);
      retirer_(seconde,5600);retirer_(g,5000);
    }
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
