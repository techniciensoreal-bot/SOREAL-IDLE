/*
 * SOREAL IDLE — le Coffre s'endort au hasard (Norman, 2026-10-12) : petits « Z » qui montent (les mêmes que ceux de la sangsue, voir .bm-zzz dans modules/sang-rituel-decor-v1.js), ronflements de temps en temps.
 * Si on le touche pendant qu'il dort, il se réveille d'un bond sur place en lâchant un pet TRÈS fort (coffreReveil, modules/audio-coffre-v1.js) et lance une réplique tirée au sort. Le clic de réveil est AVALÉ : il n'ouvre
 * ni ne ferme le Coffre.
 * Comme le reste du Coffre (modules/coffre-digestion-v1.js), tout ne compte QUE le temps où il est vu : le délai avant l'endormissement n'avance qu'à l'écran, l'onglet visible ; un Coffre endormi se réveille seul
 * (avec le même sursaut, pet et réplique) après un moment de présence à l'écran (il ne dort jamais indéfiniment dans le dos du joueur). Pendant son sommeil il ne rote ni ne pète (coffre-digestion-v1.js consulte window.__coffreDortIdleV1__).
 * Le Coffre est redessiné par le jeu (innerHTML) : l'état de sommeil est gardé ici et remis sur la nouvelle balise à chaque pas.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_COFFRE_SOMMEIL_V1__)return;
  var PAS=250,MIN=240000,MAX=540000,SOMMEIL_MAX=150000,RONFLE_MIN=4500,RONFLE_MAX=7500;
  /* Répliques du réveil en sursaut, toujours en français (comme les excuses du pet). */
  var REPLIQUES=[
    'J’ai jamais couché avec votre femme !',
    'À l’abordage !',
    'Ne me touchez pas avec vos sales pattes !',
    'C’est pas moi, c’est l’petit !',
    'Quoi ? Qui ? Où ?',
    'Je dormais pas, je réfléchissais !',
    'Cinq minutes de plus, maman…',
    'Enlevez ce doigt de ma serrure !',
    'Haut les mains !',
    'Z’avez le mandat ?',
    'C’était le chat, je le jure !',
    'Ouvrez pas, c’est plein de dettes !',
    'Ne me frappez pas, Maître !'
  ];
  /* Remarque spontanée (Norman, 2026-10-22) : de temps en temps, quand on le regarde, le Coffre (éveillé) lâche cette réplique. Le délai n'avance que le temps où il est vu, comme tout le reste du Coffre. */
  var REMARQUE='Pourquoi tu me regardes comme si j’allais chier sur tes affaires ?';
  var REGARD_MIN=150000,REGARD_MAX=420000;
  var vuEveille=0,cibleRegard=REGARD_MIN+Math.random()*(REGARD_MAX-REGARD_MIN);
  /* Le vomi de la valise n'est pas nettoyé (Norman, 2026-10-24) : le Coffre, éveillé et vu, s'en plaint de temps en temps (première plainte après 8 s, puis toutes les 25 à 45 s), sans jamais recouvrir une autre de ses bulles. */
  var PLAINTES=['Je t’en supplie, nettoie-la, elle pue.',
    'Elle a encore vomi… nettoie-la, par pitié.',
    'Ça sent le vomi ici ! Nettoie-la !',
    'Cette odeur… nettoie ta valise, s’il te plaît.',
    'Moi, je pète. Elle, elle vomit. Nettoie-la.',
    'Je ne peux plus respirer… la valise, vite !'];
  var vuPue=0,ciblePue=8000,deniere=-1;
  function valiseSale_(){try{var v=window.__SOREAL_IDLE_VALISE_ACCIDENT_V1__;return Boolean(v&&typeof v.niveau==='function'&&v.niveau()>0);}catch(_e){return false;}}
  /* Bâillement (Norman, 2026-10-23) : de temps en temps, fermé, éveillé et vu, le Coffre bâille (couvercle grand ouvert, langue sortie, corps étiré, 2,6 s) avec son propre son ; jamais avec la valise qui bâille, ni pendant une bulle. */
  var BAILLE_MIN=170000,BAILLE_MAX=450000,vuBaille=0,cibleBaille=0;   /* tirée au premier pas */
  var dort=false,vuAvantSommeil=0,cibleSommeil=MIN+Math.random()*(MAX-MIN),vuEndormi=0,vuRonfle=0,cibleRonfle=1500,derniere=-1;

  function coffre_(){return document.querySelector('.soreal-idle-coffre-v1 .bg-bagage-v1,.bg-bagage-v1');}
  function visible_(){
    var d=window.__SOREAL_IDLE_COFFRE_DIGESTION_V1__;
    return d&&typeof d.visible==='function'?d.visible():null;
  }
  function zzz_(el){
    if(el.querySelector('.bg-zzz-v1'))return;
    var z=document.createElement('span');
    z.className='bg-zzz-v1';z.setAttribute('aria-hidden','true');
    z.innerHTML='<i>Z</i><i>z</i><i>Z</i>';
    el.appendChild(z);
  }
  function appliquer_(el){
    if(!el)return;
    /* le Coffre est redessiné par le jeu : le bâillement en cours est remis sur la nouvelle balise */
    if(window.__coffreBailleIdleV1__&&!el.classList.contains('bg-baille-v1'))el.classList.add('bg-baille-v1');
    if(dort){
      if(!el.classList.contains('bg-dort-v1'))el.classList.add('bg-dort-v1');
      zzz_(el);
    }else{
      if(el.classList.contains('bg-dort-v1'))el.classList.remove('bg-dort-v1');
      var z=el.querySelector('.bg-zzz-v1');
      if(z&&z.parentNode)z.parentNode.removeChild(z);
    }
  }
  function jouerSon_(id){
    try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.play==='function')a.play(id);}catch(_e){}
  }
  function bailler_(el){
    if(!el||window.__valiseBailleIdleV1__||el.classList.contains('bg-baille-v1'))return false;
    var racine=el.closest?el.closest('.soreal-idle-coffre-v1'):null;
    if(racine&&racine.classList.contains('ouvert'))return false;
    window.__coffreBailleIdleV1__=true;
    el.classList.add('bg-baille-v1');
    try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.baille==='function')a.baille('coffre');}catch(_e){}
    setTimeout(function(){el.classList.remove('bg-baille-v1');window.__coffreBailleIdleV1__=false;},2700);
    return true;
  }
  function endormir_(){
    dort=true;window.__coffreDortIdleV1__=true;
    vuEndormi=0;vuRonfle=0;cibleRonfle=1500;
    appliquer_(coffre_());
  }
  function reveiller_(){
    dort=false;window.__coffreDortIdleV1__=false;
    vuAvantSommeil=0;cibleSommeil=MIN+Math.random()*(MAX-MIN);
    appliquer_(coffre_());
  }
  function dire_(el,texte){
    var b=document.createElement('span');
    b.className='bg-desole-v1 bg-replique-v1 bg-desole-long-v1';b.setAttribute('aria-hidden','true');
    b.textContent=texte;
    el.appendChild(b);
    setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b);},3700);
  }
  function replique_(el){
    var i=Math.floor(Math.random()*REPLIQUES.length);
    if(i===derniere)i=(i+1+Math.floor(Math.random()*(REPLIQUES.length-1)))%REPLIQUES.length;
    derniere=i;
    dire_(el,REPLIQUES[i]);
  }
  /* La remarque ne se superpose jamais à une autre bulle du Coffre (excuse d'un pet, réplique de réveil). */
  function remarque_(el){
    if(!el||el.querySelector('.bg-desole-v1,.bg-replique-v1'))return false;
    dire_(el,REMARQUE);
    return true;
  }
  /* Réveil en sursaut : bond sur place, pet très fort, nuage de fumée, réplique. */
  function sursaut_(el){
    reveiller_();
    el.classList.remove('bg-rote-v1','bg-pete-v1','bg-sursaut-v1');
    void el.getBoundingClientRect();
    el.classList.add('bg-sursaut-v1');
    setTimeout(function(){el.classList.remove('bg-sursaut-v1');},900);
    jouerSon_('coffreReveil');
    /* Le nuage du pet de réveil est le même que celui du pet ordinaire (modules/coffre-digestion-v1.js), plus fort : toujours très haut sur l'inventaire. */
    if(typeof window.__coffreNuagePetIdleV1__==='function')window.__coffreNuagePetIdleV1__(el);
    else{
      var f=document.createElement('span');
      f.className='bg-fumee-v1';f.setAttribute('aria-hidden','true');
      f.innerHTML='<i></i><i></i><i></i>';
      el.appendChild(f);
      setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f);},2300);
    }
    replique_(el);
  }
  /* Le clic est intercepté en phase de capture, avant le gestionnaire du Coffre (ouvrir / fermer / déposer). */
  document.addEventListener('click',function(e){
    if(!dort)return;
    var t=e.target,el=t&&t.closest?t.closest('.bg-bagage-v1'):null;
    if(!el)return;
    e.stopPropagation();e.preventDefault();
    sursaut_(el);
  },true);

  function pas_(){
    /* pas de lecture de mise en page pendant l'ouverture / fermeture du Coffre ou de la valise (téléphone : chaque lecture forçait un calcul de page en pleine animation) */ if((document.documentElement&&document.documentElement.classList&&document.documentElement.classList.contains&&document.documentElement.classList.contains('soreal-anim-coffre')))return;
    var el=coffre_();
    appliquer_(el);
    if(document.hidden||!visible_())return;
    if(!dort){
      vuAvantSommeil+=PAS;
      if(vuAvantSommeil>=cibleSommeil){
        /* jamais en même temps que la valise (Norman, 2026-10-23) : si elle dort, on réessaie dans 30 s */
        if(window.__valiseDortIdleV1__){vuAvantSommeil=Math.max(0,cibleSommeil-30000);return;}
        endormir_();return;
      }
      if(!cibleBaille)cibleBaille=BAILLE_MIN+Math.random()*(BAILLE_MAX-BAILLE_MIN);
      vuBaille+=PAS;
      if(vuBaille>=cibleBaille&&el&&!el.querySelector('.bg-desole-v1,.bg-replique-v1')&&!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
        if(bailler_(el)){vuBaille=0;cibleBaille=BAILLE_MIN+Math.random()*(BAILLE_MAX-BAILLE_MIN);}else vuBaille=Math.max(0,cibleBaille-20000);
      }
      vuEveille+=PAS;
      if(vuEveille>=cibleRegard&&remarque_(el)){vuEveille=0;cibleRegard=REGARD_MIN+Math.random()*(REGARD_MAX-REGARD_MIN);}
      if(valiseSale_()){
        vuPue+=PAS;
        if(vuPue>=ciblePue&&el&&!el.querySelector('.bg-desole-v1,.bg-replique-v1')){
          var k=Math.floor(Math.random()*PLAINTES.length);
          if(k===deniere)k=(k+1)%PLAINTES.length;
          deniere=k;dire_(el,PLAINTES[k]);vuPue=0;ciblePue=25000+Math.random()*20000;
        }
      }else{vuPue=0;ciblePue=8000;}
      return;
    }
    vuEndormi+=PAS;vuRonfle+=PAS;
    if(vuEndormi>=SOMMEIL_MAX){if(el)sursaut_(el);else reveiller_();return;}   /* réveil tout seul : même sursaut, pet, nuage et réplique */
    if(vuRonfle>=cibleRonfle){jouerSon_('coffreRonfle');vuRonfle=0;cibleRonfle=RONFLE_MIN+Math.random()*(RONFLE_MAX-RONFLE_MIN);}
  }
  setInterval(pas_,PAS);
  window.__coffreDortIdleV1__=false;
  window.__SOREAL_IDLE_COFFRE_SOMMEIL_V1__={endormir:endormir_,reveiller:reveiller_,sursaut:function(){var el=coffre_();if(dort&&el)sursaut_(el);},pas:pas_,dort:function(){return dort;},repliques:REPLIQUES,remarque:REMARQUE,plaintes:PLAINTES,dire:remarque_,baille:function(){return bailler_(coffre_());}};
})();
