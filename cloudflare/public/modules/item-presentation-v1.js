/* SOREAL IDLE — item presentation helpers extracted from the UI monolith. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ITEM_PRESENTATION_V1__)return;
  function emojiObjet(objet){
    const slot=String(objet&&objet.slot||'');
    const nom=String(objet&&(objet.nomBase||objet.nom||'')||'').toLowerCase();
    const principal={tete:'🪖',torse:'👕',bottes:'🥾',arme:'🗡️',bijou1:'💍',bijou2:'💎'}[slot]||'📦';
    let detail='📦';
    if(/cutter|couteau|lame/.test(nom))detail='✂️';
    else if(/pain|baguette/.test(nom))detail='🥖';
    else if(/palette|bois/.test(nom))detail='🪵';
    else if(/froid|freezer|glace|thermo/.test(nom))detail='❄️';
    else if(/maxity|camion|vehicule|véhicule/.test(nom))detail='🚚';
    else if(/casquette|bonnet/.test(nom))detail='🧢';
    else if(/t-shirt|tshirt|gilet|veste/.test(nom))detail='🦺';
    else if(/chaussure|botte|sécurité|securite/.test(nom))detail='⚠️';
    else if(/clé|cle|porte-cl/.test(nom))detail='🔑';
    else if(/badge|carte/.test(nom))detail='🪪';
    else if(/scanner/.test(nom))detail='📟';
    else if(/stock/.test(nom))detail='📦';
    return principal+' '+detail;
  }
  window.__SOREAL_IDLE_ITEM_PRESENTATION_V1__={emojiObjet};
})();
