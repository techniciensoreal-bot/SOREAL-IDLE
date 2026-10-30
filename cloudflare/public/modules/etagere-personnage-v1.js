/*
 * SOREAL IDLE — mamie l'armoire de la garderie est un PERSONNAGE (Norman, 2026-10-30 : « une étagère avec des yeux et une bouche », « ça doit avoir l'air d'une vieille dame », « il faut qu'elle ait l'air folle,
 * avec des yeux qui regardent à l'extérieur, mais pas qui bougent vite »). Le décor est son IMAGE (public/garderie/armoire-v1.webp) ; ce module lui ajoute par-dessus :
 *   - deux yeux animés dans les ovales blancs vides de ses lunettes : pupilles qui regardent vers l'EXTÉRIEUR, dérive très lente et indépendante, paupières qui DESCENDENT sur l'œil (clignements rares et lents) ;
 *   - un nez qui oscille doucement (une copie découpée de l'image, qui bouge) ;
 *   - un sommeil (yeux fermés, petits Z, respiration), un réveil, des remarques et des réactions (contente quand on lui confie un objet, agacée quand elle est pleine), avec une bulle de dialogue.
 * Même logique que le Coffre (modules/coffre-sommeil-v1.js) : le délai n'avance que le temps où elle est vue à l'écran ; un clic sur une armoire endormie la réveille, le clic est avalé.
 * Phrases modifiables par l'administrateur (« phrases:etagere », modules/phrases-coffre-valise-v1.js). Les bocaux sont dans modules/daycare-page-v1.js.
 * Règle n°4 : tout est dessiné par le rendu de la page (data-humeur et classes lus depuis l'état de ce module) ET remis juste après chaque redessin ; la bulle porte data-morph-garder.
 * Règle n°3 : clignement, dérive du regard, oscillation du nez et respiration reviennent exactement à leur état de départ (boucles parfaites) ; prefers-reduced-motion les coupe.
 * Anti-spoil (règle n°2) : rien n'existe tant que la garderie n'est pas débloquée (seul l'onglet Garderie dessine l'armoire).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ETAGERE_V1__)return;
  var PAS=250,MIN=240000,MAX=540000,SOMMEIL_MAX=150000,REGARD_MIN=150000,REGARD_MAX=420000;
  var dort=false,vuAvant=0,cibleSommeil=MIN+Math.random()*(MAX-MIN),vuEndormi=0,vuEveille=0,cibleRegard=REGARD_MIN+Math.random()*(REGARD_MAX-REGARD_MIN);
  var humeurTemp='',humeurJusqua=0,parleJusqua=0;

  function humeur_(){
    if(dort)return 'dort';
    return humeurTemp&&Date.now()<humeurJusqua?humeurTemp:'eveillee';
  }
  function parle_(){return Date.now()<parleJusqua;}
  function classes_(){return parle_()?' parle':'';}

  /* Les yeux (dans les ovales blancs de l'image : 12,8 % x 7,3 % de l'image), le nez (copie découpée de l'image), les Z. Positions en % de l'image 768 x 1152. */
  function oeil_(cls,gauche){
    return '<i class="et-oeil '+cls+'" style="left:'+gauche+'%;top:17.6%;width:12.8%;height:7.3%"><b class="et-regard"><u class="et-iris"></u></b><s class="et-paup"></s></i>';
  }
  function yeuxHtml(){
    css();
    return oeil_('et-og',29.7)+oeil_('et-od',57.8)+
      '<div class="et-nez" aria-hidden="true"></div><span class="et-zzz" aria-hidden="true"><i>Z</i><i>z</i><i>Z</i></span>';
  }

  /* Remet l'état sur l'armoire affichée (appelé à chaque pas, à chaque réaction et juste après un redessin). */
  function appliquer(){
    var h=humeur_(),p=parle_();
    var l=document.querySelectorAll('.gd-armoire');
    for(var i=0;i<l.length;i+=1){
      if(l[i].getAttribute('data-humeur')!==h)l[i].setAttribute('data-humeur',h);
      if(l[i].classList.contains('parle')!==p)l[i].classList.toggle('parle',p);
    }
  }

  function bulle_(texte){
    var f=document.querySelector('.gd-armoire');
    if(!f||!texte||f.querySelector('.et-bulle'))return false;
    var b=document.createElement('span');
    b.className='et-bulle';b.setAttribute('aria-hidden','true');b.setAttribute('data-morph-garder','1');
    b.textContent=texte;
    f.appendChild(b);
    parleJusqua=Date.now()+Math.min(2600,900+texte.length*45);
    appliquer();
    setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b);},3700);
    setTimeout(appliquer,Math.max(0,parleJusqua-Date.now())+30);
    return true;
  }
  function phrase_(mode){
    var P=window.__SOREAL_IDLE_PHRASES_V1__;
    return P&&typeof P.tirer==='function'?P.tirer('etagere',mode):'';
  }
  function reveiller_(){dort=false;vuAvant=0;cibleSommeil=MIN+Math.random()*(MAX-MIN);appliquer();}

  /* Réaction à un geste du jeu : mode = 'daycare' (contente) | 'daycare:max' (clin d'œil) | 'plein' (agacée). */
  function reagir(mode){
    if(dort)reveiller_();
    humeurTemp=mode==='plein'?'agacee':(mode==='daycare:max'?'clin':'contente');
    humeurJusqua=Date.now()+(mode==='plein'?3600:3200);
    appliquer();
    var t=phrase_(mode);
    /* L'onglet Garderie n'est pas à l'écran (geste fait depuis le sac ou le Coffre) : c'est quand même l'armoire qui parle, sa réplique sort alors dans la bulle du Coffre. */
    if(document.querySelector('.gd-armoire'))bulle_(t);
    else{var S=window.__SOREAL_IDLE_COFFRE_SOMMEIL_V1__;if(t&&S&&typeof S.parler==='function')S.parler(t);}
    setTimeout(appliquer,(mode==='plein'?3600:3200)+60);
  }

  /* Le clic sur une armoire endormie la réveille (d'un sursaut) et est avalé : il ne dépose ni ne reprend rien. */
  document.addEventListener('click',function(e){
    if(!dort)return;
    var t=e.target,el=t&&t.closest?t.closest('.gd-armoire'):null;
    if(!el)return;
    e.stopPropagation();e.preventDefault();
    reveiller_();
    var fig=el.querySelector('.gd-fig');
    if(fig){fig.classList.remove('et-sursaut');void fig.offsetWidth;fig.classList.add('et-sursaut');setTimeout(function(){fig.classList.remove('et-sursaut');},700);}
    var q=phrase_('reveil');
    if(q)bulle_(q);
  },true);

  function vue_(){
    var el=document.querySelector('.gd-armoire');
    if(!el||document.hidden)return false;
    var r=el.getBoundingClientRect();
    return r.bottom>0&&r.top<(window.innerHeight||0);
  }
  /* Le temps n'avance que quand elle est vue : elle s'endort au bout de 4 à 9 minutes de présence à l'écran, se réveille seule après 2 min 30 de sommeil vu, et lâche une remarque de temps en temps. */
  function pas_(){
    appliquer();
    if(!vue_())return;
    if(!dort){
      vuAvant+=PAS;
      if(vuAvant>=cibleSommeil){dort=true;vuEndormi=0;appliquer();return;}
      vuEveille+=PAS;
      if(vuEveille>=cibleRegard){
        var t=phrase_('remarque');
        if(t&&bulle_(t)){vuEveille=0;cibleRegard=REGARD_MIN+Math.random()*(REGARD_MAX-REGARD_MIN);}
      }
      return;
    }
    vuEndormi+=PAS;
    if(vuEndormi>=SOMMEIL_MAX){reveiller_();var q=phrase_('reveil');if(q)bulle_(q);}
  }
  setInterval(pas_,PAS);
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{appliquer();}catch(_e){}});

  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('et-style-v1'))return;
    var s=document.createElement('style');
    s.id='et-style-v1';
    s.textContent=[
      /* yeux : globe blanc ombré, iris et petite pupille tournés vers l'extérieur, paupière qui descend */
      '.et-oeil{position:absolute;z-index:6;display:block;border-radius:50%;overflow:hidden;background:radial-gradient(ellipse at 38% 30%,#fff 0,#f7f1e5 52%,#ddd2bd 100%);box-shadow:inset 0 2px 4px rgba(60,30,8,.5),inset 0 -1px 3px rgba(60,30,8,.25)}',
      '.et-regard{position:absolute;inset:0;display:block}',
      '.et-iris{position:absolute;top:50%;height:26%;aspect-ratio:1;margin-top:-13%;display:block;border-radius:50%;background:radial-gradient(circle at 50% 50%,#0b0603 0 30%,#4a7388 33%,#2c4c5f 70%,#14262f 100%);box-shadow:0 0 0 1.5px #16262e}',
      '.et-og .et-iris{left:5%}.et-od .et-iris{right:5%}',
      '.et-iris::after{content:"";position:absolute;left:24%;top:16%;width:20%;height:20%;border-radius:50%;background:#fff;opacity:.92}',
      '.et-paup{position:absolute;left:-4%;right:-4%;top:-3%;height:106%;display:block;transform-origin:50% 0;transform:scaleY(0);background:linear-gradient(180deg,#b06a33,#cf8a4f 78%,#8d5527);border-bottom:2px solid #3a2008;box-shadow:0 2px 3px rgba(0,0,0,.4);animation:etClin 13s ease-in-out infinite}',
      '.et-paup::after{content:"";position:absolute;left:12%;right:12%;bottom:-3px;height:3px;background:repeating-linear-gradient(90deg,#3a2008 0,#3a2008 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 5px)}',
      '.et-og .et-regard{animation:etRegG 17s ease-in-out infinite}.et-od .et-regard{animation:etRegD 21s ease-in-out infinite}',
      '.gd-armoire[data-humeur="dort"] .et-regard{animation:none}',
      '.gd-armoire[data-humeur="dort"] .et-paup{animation:none;transform:scaleY(1)}',
      '.gd-armoire[data-humeur="agacee"] .et-paup{animation:none;transform:scaleY(.42)}',
      '.gd-armoire[data-humeur="contente"] .et-paup{animation:none;transform:scaleY(.3)}',
      '.gd-armoire[data-humeur="clin"] .et-od .et-paup{animation:none;transform:scaleY(1)}',
      /* nez : copie découpée de l'image (rect 285,232 -> 445,394 de 768 x 1152) qui oscille doucement */
      '.et-nez{position:absolute;z-index:5;left:37.1%;top:20.1%;width:20.8%;height:14.1%;background-image:url(/garderie/armoire-v1.webp?v=2);background-size:480% 711%;background-position:46.9% 23.4%;background-repeat:no-repeat;clip-path:ellipse(49% 47% at 50% 56%);transform-origin:50% 12%;animation:etNez 9s ease-in-out infinite;pointer-events:none}',
      '.et-zzz{position:absolute;z-index:7;left:66%;top:5%;width:40px;height:46px;display:none;pointer-events:none}',
      '.gd-armoire[data-humeur="dort"] .et-zzz{display:block}',
      '.et-zzz i{position:absolute;left:0;bottom:0;font:400 18px/1 "Bangers","Russo One",Impact,sans-serif;font-style:normal;color:#dff1ff;-webkit-text-stroke:.6px #1b3a5a;text-shadow:0 1px 0 #1b3a5a;opacity:0;animation:bgZzz 3.6s ease-in-out infinite}',
      '.et-zzz i:nth-child(2){animation-delay:1.2s;font-size:22px}.et-zzz i:nth-child(3){animation-delay:2.4s;font-size:27px}',
      '.et-bulle{position:absolute;left:50%;top:1%;padding:4px 12px;border-radius:12px;background:#fff;color:#3a2208;border:2px solid #3a2208;font:400 15px/1.1 "Bangers","Russo One",Impact,sans-serif;letter-spacing:.05em;max-width:90%;width:max-content;text-align:center;white-space:normal;pointer-events:none;z-index:9;opacity:0;transform:translateX(-50%);animation:etBulle 3.2s ease-in-out 1 both}',
      '.et-bulle::after{content:"";position:absolute;left:50%;bottom:-8px;margin-left:-6px;border:6px solid transparent;border-top-color:#3a2208;border-bottom:0}',
      '.et-sursaut{animation:etSursaut .6s ease-out 1}',
      '@keyframes etClin{0%,90%,100%{transform:scaleY(0)}94%{transform:scaleY(1.03)}}',
      '@keyframes etRegG{0%,100%{transform:translate(0,0)}35%{transform:translate(-1.8px,.8px)}70%{transform:translate(1.2px,-1px)}}',
      '@keyframes etRegD{0%,100%{transform:translate(0,0)}40%{transform:translate(1.8px,-.8px)}75%{transform:translate(-1.2px,1px)}}',
      '@keyframes etNez{0%,100%{transform:rotate(0) scale(1)}30%{transform:rotate(1.5deg) scale(1.012,1.02)}65%{transform:rotate(-1.3deg) scale(1.01,1.025)}}',
      '@keyframes etRespire{0%,100%{transform:scale(1)}50%{transform:scale(1.006,1.012)}}',
      '@keyframes etGrince{0%,88%,100%{transform:rotate(0)}91%{transform:rotate(.22deg)}94%{transform:rotate(-.16deg)}97%{transform:rotate(.08deg)}}',
      '@keyframes etBulle{0%{opacity:0;transform:translate(-50%,6px)}12%{opacity:1;transform:translate(-50%,0)}86%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-4px)}}',
      '@keyframes etSursaut{0%{transform:translateY(0)}30%{transform:translateY(-8px)}60%{transform:translateY(0)}78%{transform:translateY(-3px)}100%{transform:translateY(0)}}',
      '@media (prefers-reduced-motion:reduce){.et-paup,.et-regard,.et-nez,.et-zzz i,.et-sursaut{animation:none}.et-zzz i{opacity:.8}.et-bulle{animation:none;opacity:1}}',
      '@media (max-width:520px){.et-bulle{font-size:13px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  window.__SOREAL_IDLE_ETAGERE_V1__={yeuxHtml:yeuxHtml,classes:classes_,humeur:humeur_,reagir:reagir,
    etat:function(){return {dort:dort,humeur:humeur_(),parle:parle_()};}};
})();
