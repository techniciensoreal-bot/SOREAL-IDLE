/*
 * SOREAL IDLE — petit « i » des articles de déblocage de la Boutique EXP (Norman, 2026-11-01 : « pour le magasin, il faut toujours un petit i pour
 * les objets du genre Garderie. Car les gens l'achètent sans savoir ce que ça fait. Un petit i qui explique brièvement ce que ça fera, sans calcul
 * ni rien d'autre »).
 *
 * - Le bouton « i » est dans l'en-tête de la carte, avant ET après l'achat ; toucher / cliquer déplie une phrase sous l'en-tête (pas de survol requis).
 * - Anti-spoil (règle n°2) : ce module ne décide jamais de la visibilité d'un article. La page ne l'appelle que pour les cartes qu'elle dessine,
 *   c'est-à-dire les achats déjà visibles. Les phrases ne contiennent ni chiffre, ni total, ni nom de boss ou de menu verrouillé.
 * - Règle n°4 (redessin) : l'état « ouvert » vit ici (ensemble d'identifiants). Le rendu le relit à chaque dessin, le gestionnaire met le DOM dans
 *   le même état : un redessin de la page ne ferme rien et ne fait rien clignoter.
 * - Expose window.__SOREAL_IDLE_BOUTIQUE_INFO_I_V1__ = { texte, bouton, bloc, TEXTES, TEXTE_FRUIT }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BOUTIQUE_INFO_I_V1__)return;

  /* Une phrase par article de déblocage (identifiants de IDLE_NGU_EXP_SHOP_V1, src/idle-ngu-actions.js). Aucun chiffre : ni prix, ni gain, ni maximum. */
  const TEXTES={
    daycareSlot1:'Ouvre un premier emplacement dans la Garderie : l’objet qui y est placé gagne des niveaux avec le temps, même hors ligne.',
    daycareSlot2:'Ajoute un emplacement à la Garderie : un objet de plus peut y gagner des niveaux avec le temps.',
    daycareSlot3:'Ajoute encore un emplacement à la Garderie : un objet de plus peut y gagner des niveaux avec le temps.',
    diggerSlot:'Ajoute un emplacement pour un Digger de plus : tu peux en faire travailler un de plus en même temps.',
    beardSlot:'Ajoute un emplacement pour une barbe de plus dans le menu Beards.',
    macguffinSlot1:'Ajoute un emplacement de MacGuffin : tu peux en porter un de plus.',
    macguffinSlot2:'Ajoute encore un emplacement de MacGuffin : tu peux en porter un de plus.',
    accessorySlot1:'Ajoute un emplacement d’accessoire sur ton personnage : tu peux porter un accessoire de plus.',
    accessorySlot2:'Ajoute encore un emplacement d’accessoire sur ton personnage : tu peux porter un accessoire de plus.',
    inventorySpace:'Agrandit ton sac : tu peux ranger plus d’objets.',
    basicLootFilter:'Te laisse choisir les types d’objets que tu ne veux plus ramasser.',
    autoMerge:'Fusionne tout seul les doublons de ton équipement.',
    sortInventory:'Ajoute un bouton pour ranger ton sac par catégorie.',
    doubleTap:'Un double appui sur un objet lui fait absorber tous les boosts de ton sac.',
    tripleTap:'Un double appui sur un objet le fusionne avec ses pièces identiques.',
    boostRecycling:'Donne une chance de récupérer un boost déjà utilisé, avec un palier de moins.',
    loadoutSlots:'Débloque des emplacements de configuration : enregistre ton équipement actuel pour le remettre en un clic.',
    loadoutSlot3:'Ajoute un emplacement de configuration de plus pour ton équipement.',
    inventoryMergeSlot:'Ajoute un emplacement d’automerge dans ton sac : la fusion automatique s’en occupe en priorité.',
    trainingAutoAdvance:'Basic Training passe tout seul à la compétence suivante.',
    syncBasicTraining:'Ajoute une case qui place ton énergie dans deux compétences jumelles en même temps.',
    syncWandoos:'Ajoute un interrupteur qui fait agir les touches de l’énergie aussi sur la magie.',
    menuAnimations:'Fait s’animer les boutons du menu du haut quand leur menu est actif.',
    customInput1:'Ajoute un bouton à côté du champ Input qui y place le nombre que tu choisis.',
    customInput2:'Ajoute un deuxième bouton à côté du champ Input qui y place le nombre que tu choisis.',
    customInput3:'Ajoute un troisième bouton à côté du champ Input qui y place le nombre que tu choisis.',
    customInput4:'Ajoute un quatrième bouton à côté du champ Input qui y place le nombre que tu choisis.'
  };
  /* Les fruits d'Yggdrasil (Auto-Activate) partagent une seule phrase. */
  const TEXTE_FRUIT='Ce fruit démarre tout seul dès qu’il est prêt, sans payer son activation, tant que ton plafond est assez haut.';
  const LIBELLE='Ce que fait cet achat';

  const ouverts=Object.create(null);

  function texte(it){
    if(!it||!it.id)return '';
    if(it.yggFruit)return TEXTE_FRUIT;
    return Object.prototype.hasOwnProperty.call(TEXTES,it.id)?TEXTES[it.id]:'';
  }
  function cle(it){return it&&it.yggFruit?'ygg:'+it.id:String(it&&it.id||'');}
  function echapper(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

  /* Bouton rond « i », à mettre dans l'en-tête de la carte. '' pour un article sans phrase. */
  function bouton(it){
    if(!texte(it))return '';
    const k=cle(it);
    return '<button type="button" class="boutique-i-v1'+(ouverts[k]?' ouvert':'')+'" data-i-cle="'+echapper(k)+'" aria-expanded="'+(ouverts[k]?'true':'false')+'" title="'+LIBELLE+'" aria-label="'+LIBELLE+'" onclick="window.__boutiqueInfoIV1__(this)">i</button>';
  }
  /* Phrase dépliée, à mettre juste sous l'en-tête de la carte (état relu à chaque dessin). */
  function bloc(it){
    const t=texte(it);
    if(!t)return '';
    const k=cle(it);
    return '<div class="boutique-i-bulle-v1'+(ouverts[k]?' ouvert':'')+'" data-i-cle="'+echapper(k)+'" role="note">'+echapper(t)+'</div>';
  }

  window.__boutiqueInfoIV1__=function(bouton_){
    if(!bouton_||!bouton_.getAttribute)return;
    const k=bouton_.getAttribute('data-i-cle');
    if(!k)return;
    if(ouverts[k])delete ouverts[k];else ouverts[k]=true;
    const ouvert=Boolean(ouverts[k]);
    bouton_.classList.toggle('ouvert',ouvert);
    bouton_.setAttribute('aria-expanded',ouvert?'true':'false');
    const carte=bouton_.closest?bouton_.closest('.soreal-idle-exp-stat-v210'):null;
    const bulle=carte?carte.querySelector('.boutique-i-bulle-v1'):null;
    if(bulle)bulle.classList.toggle('ouvert',ouvert);
  };

  const CSS='.boutique-i-v1{appearance:none;flex:0 0 auto;width:26px;height:26px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.3);color:#fff;font:italic 900 15px/1 Georgia,"Times New Roman",serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation}'+
    '.boutique-i-v1:hover,.boutique-i-v1.ouvert{background:#f5c451;border-color:#fff;color:#3a2a00}'+
    '.soreal-idle-exp-stat-v210>.boutique-i-bulle-v1{display:none;margin-top:8px;margin-bottom:2px;padding:9px 12px;border-radius:10px;background:rgba(245,196,81,.14);border:1px solid rgba(245,196,81,.5);color:#f7e6b0;font-size:13px;line-height:1.5;font-weight:750}'+
    '.soreal-idle-exp-stat-v210>.boutique-i-bulle-v1.ouvert{display:block}';
  try{
    if(typeof document!=='undefined'&&document.head&&document.createElement&&!(document.getElementById&&document.getElementById('boutique-info-i-style-v1'))){
      const s=document.createElement('style');
      s.id='boutique-info-i-style-v1';
      s.textContent=CSS;
      document.head.appendChild(s);
    }
  }catch(_e){}

  window.__SOREAL_IDLE_BOUTIQUE_INFO_I_V1__={texte:texte,bouton:bouton,bloc:bloc,TEXTES:TEXTES,TEXTE_FRUIT:TEXTE_FRUIT,LIBELLE:LIBELLE,CSS:CSS};
})();
