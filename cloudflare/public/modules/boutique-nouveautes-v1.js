/*
 * Nouveautés des boutiques (Norman, 2026-10-04) : « il faut un point rouge sur les nouveaux achats disponibles ainsi que sur les rayons où ils se trouvent ; le point rouge disparaît une fois que l'achat a été vu. »
 * Même patron que le point rouge des trophées : la liste des achats déjà vus est gardée sur l'appareil ; la première fois (rien de mémorisé pour cette boutique), tout ce qui est déjà en vente est considéré
 * comme vu, pour ne pas inonder un joueur existant ; ensuite, tout achat qui apparaît (ajouté au catalogue, ou devenu disponible grâce à la progression) porte un point rouge, ainsi que son rayon et le bouton de
 * la boutique. Ouvrir un rayon marque ses achats comme vus ; les points des cartes restent le temps de la visite (le joueur voit ce qui est nouveau) puis disparaissent.
 * Anti-spoil (règle n°2) : seuls les achats DÉJÀ visibles par le joueur sont comptés ; jamais un achat encore caché.
 *
 *   window.__SOREAL_IDLE_BOUTIQUE_V1__ = { nonVus(boutique,parRayon), rayonNonVu(boutique,parRayon,rayon), marquerRayon(boutique,parRayon,rayon), estNouveau(boutique,id), boutiqueNonVue(boutique,parRayon),
 *                                         reinitialiserVisite() }
 *   boutique = 'exp' | 'ap' ; parRayon = { rayon: [id, ...] } (uniquement les achats visibles).
 */
(function(){
  'use strict';
  var CLE='soreal_idle_boutique_vus_v1';
  /* Achats nouveaux vus pendant la visite en cours : gardés jusqu'à ce que le joueur quitte la boutique. */
  var nouveauxVisite={exp:{},ap:{}};

  function lire(){
    try{
      var brut=localStorage.getItem(CLE);
      var o=brut===null?null:JSON.parse(brut);
      return o&&typeof o==='object'?o:{};
    }catch(e){return {};}
  }
  function ecrire(o){
    try{localStorage.setItem(CLE,JSON.stringify(o));}catch(e){}
  }
  function aplatir(parRayon){
    var ids=[];
    Object.keys(parRayon||{}).forEach(function(r){(parRayon[r]||[]).forEach(function(id){ids.push(String(id));});});
    return ids;
  }

  /* Première visite d'une boutique : tout ce qui est déjà en vente est considéré comme vu. Renvoie la liste des achats vus. */
  function vus(boutique,parRayon){
    var o=lire();
    if(!Array.isArray(o[boutique])){
      o[boutique]=aplatir(parRayon);
      ecrire(o);
    }
    return o[boutique];
  }

  function nonVus(boutique,parRayon){
    var deja=vus(boutique,parRayon);
    var resultat={};
    Object.keys(parRayon||{}).forEach(function(r){
      var neufs=(parRayon[r]||[]).filter(function(id){return deja.indexOf(String(id))===-1;});
      if(neufs.length)resultat[r]=neufs;
    });
    return resultat;
  }

  function rayonNonVu(boutique,parRayon,rayon){
    return Boolean(nonVus(boutique,parRayon)[rayon]);
  }

  function boutiqueNonVue(boutique,parRayon){
    return Object.keys(nonVus(boutique,parRayon)).length>0;
  }

  /* Le joueur ouvre un rayon : ses achats nouveaux gardent leur point rouge pendant la visite, mais ne comptent plus comme non vus. */
  function marquerRayon(boutique,parRayon,rayon){
    var neufs=nonVus(boutique,parRayon)[rayon];
    if(!neufs||!neufs.length)return;
    var o=lire();
    var deja=Array.isArray(o[boutique])?o[boutique]:[];
    neufs.forEach(function(id){
      nouveauxVisite[boutique][id]=true;
      if(deja.indexOf(id)===-1)deja.push(id);
    });
    o[boutique]=deja;
    ecrire(o);
  }

  function estNouveau(boutique,id){
    return Boolean(nouveauxVisite[boutique]&&nouveauxVisite[boutique][String(id)]===true);
  }

  function reinitialiserVisite(){
    nouveauxVisite={exp:{},ap:{}};
  }

  window.__SOREAL_IDLE_BOUTIQUE_V1__={
    nonVus:nonVus,
    rayonNonVu:rayonNonVu,
    boutiqueNonVue:boutiqueNonVue,
    marquerRayon:marquerRayon,
    estNouveau:estNouveau,
    reinitialiserVisite:reinitialiserVisite,
    /* Pastille réutilisée par les cartes, les rayons, les boutiques et le bouton du menu. */
    point:function(titre){return '<span class="soreal-idle-point-rouge-v1" title="'+(titre||'Nouveau')+'" aria-label="'+(titre||'Nouveau')+'"></span>';}
  };
})();
