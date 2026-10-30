/*
 * SOREAL IDLE — le titre de chaque menu (Norman, 2026-10-30 : « pour chacun des menus, un titre qui donne juste le nom du menu avec une mini phrase explicative ; ce cadre doit faire exactement la taille de 4 barres (vie + énergie + magie + ressource 3) ; il y a déjà un espace vide au-dessus, il faut le conserver :
 * espace vide + taille du cadre = la taille des 4 barres. Comme ça, même quand les 4 sont affichées, elles ne cachent que le titre et jamais un bouton »).
 * Le bandeau du haut est posé PAR-DESSUS la page (modules/hud-haut-v2.js) : les barres d'énergie, de magie et de 3e ressource recouvrent le début du menu. Le premier cadre de titre de la page (« soreal-idle-page-head-v28 », posé par entetePageIdleV28_ : le nom et sa mini phrase)
 * reçoit donc la hauteur « 4 barres - espace vide » (feuille soreal-idle-itopod.css, en fin de fichier) : le premier bouton commence toujours sous les barres. Un menu dont la page n'a pas son propre cadre en reçoit un du même modèle (nom du bouton du menu + mini phrase).
 *   --hud-4barres-v1  : de combien les 4 barres (vie, énergie, magie, ressource 3), TOUTES affichées, recouvrent le haut de la page. La page réserve déjà la hauteur de base du bandeau (chiffres + barre de vie) plus 10 px de marge : seules les trois autres barres recouvrent le contenu.
 *                       Recouvrement = 3 pas de barre (hauteur + écart, mesurés sur la barre de vie : même zoom, téléphone comme PC) - 10 px de marge ; ne dépend pas des barres affichées à cet instant (elles s'ouvrent et se ferment en douceur).
 *   --vide-haut-v1    : l'espace vide déjà présent au-dessus du contenu (marge haute de la page)
 * Règle n°4 (redessin) : l'attribut data-entete-menu et le cadre généré sont posés APRÈS le rendu, remis dans la même tâche à chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__), sans attente ; le morph les laisse en place (data-morph-garder, liste des attributs gardés).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ENTETE_MENU_V1__)return;
var dernier={h4:null,vide:null};
var PHRASES={
  combat:'Affronte les boss de la borne d’arcade.',
  aventure:'Pars en zone, combats des ennemis et ramène du butin.',
  machine:'Accélère et multiplie la production d’énergie et de magie.',
  ngu:'Eh, c’est le nom du jeu original !',
  yggdrasil:'Fais pousser des fruits, récolte-les ou mange-les pour des bonus.'
};
function zoom_(e){try{var z=parseFloat(getComputedStyle(e).zoom);return z>0?z:1;}catch(_e){return 1;}}
function poser_(nom,valeur,cle){
  if(dernier[cle]===valeur)return;
  dernier[cle]=valeur;
  document.documentElement.style.setProperty(nom,valeur+'px');
}
function mesurer(premier){
  try{
    var pv=document.getElementById('sorealIdleHudGPvV2'),panneau=pv&&pv.closest?pv.closest('.soreal-idle-energy-panel-v34'):null;
    if(panneau){
      /* le zoom est celui du bandeau lui-même (le zoom calculé d'une barre vaut 1 : seul l'élément zoomé le porte) */
      var z=zoom_(document.getElementById('sorealIdleHudV2')||panneau),h=panneau.getBoundingClientRect().height/z,ecart=parseFloat(getComputedStyle(panneau).marginBottom)||0;
      var recouvre=3*(h+ecart)-10;   /* 10 px : marge basse du bandeau (feuille posée par hud-haut-v2.js) */
      if(h>0&&recouvre>0)poser_('--hud-4barres-v1',Math.round(recouvre*100)/100,'h4');
    }
    /* l'espace vide déjà présent : du haut de la page au haut du cadre (marges et espaces compris) */
    var racine=document.querySelector('.soreal-idle-page-root-v28');
    if(racine&&premier){var vide=Math.round((premier.getBoundingClientRect().top-racine.getBoundingClientRect().top)/zoom_(racine)*100)/100;if(vide>=0)poser_('--vide-haut-v1',vide,'vide');}
  }catch(_e){}
}
function nomDuMenu(){
  var b=document.querySelector('.soreal-idle-nav-v28 .soreal-idle-nav-button-v28.active b');
  return b?String(b.textContent||'').trim():'';
}
function creerEntete(racine,menu,nom){
  var e=document.createElement('div');
  e.className='soreal-idle-page-head-v28';e.setAttribute('data-morph-garder','');e.setAttribute('data-entete-genere',menu);
  var t=document.createElement('div');t.className='soreal-idle-page-title-v28';t.textContent=nom;
  var s=document.createElement('div');s.className='soreal-idle-page-sub-v28';s.textContent=PHRASES[menu];
  e.appendChild(t);e.appendChild(s);
  racine.insertBefore(e,racine.firstChild);
  return e;
}
function marquer(){
  try{
    var racine=document.querySelector('.soreal-idle-page-root-v28');
    if(!racine)return;
    var menu=racine.getAttribute('data-menu')||'',natif=null,i;
    var tous=racine.querySelectorAll('.soreal-idle-page-head-v28');
    for(i=0;i<tous.length;i++)if(!tous[i].hasAttribute('data-entete-genere')){natif=tous[i];break;}
    if(!natif&&menu==='sang')natif=racine.querySelector('.bm-entete');   /* la Magie du sang a son propre titre (bougies, nom et mini phrase) : c'est lui le cadre */
    var genere=racine.querySelector('[data-entete-genere]'),premier=natif;
    if(natif){
      if(genere&&genere.parentNode)genere.parentNode.removeChild(genere);   /* la page a son propre cadre */
    }else{
      if(genere&&genere.getAttribute('data-entete-genere')!==menu){genere.parentNode.removeChild(genere);genere=null;}   /* la page a changé */
      var nom=nomDuMenu();
      if(!genere&&PHRASES[menu]&&nom)genere=creerEntete(racine,menu,nom);
      if(genere){
        var tt=genere.querySelector('.soreal-idle-page-title-v28');
        if(nom&&tt&&tt.textContent!==nom)tt.textContent=nom;
        if(racine.firstChild!==genere)racine.insertBefore(genere,racine.firstChild);
      }
      premier=genere;
    }
    var marques=racine.querySelectorAll('[data-entete-menu]');
    for(i=0;i<marques.length;i++)if(marques[i]!==premier)marques[i].removeAttribute('data-entete-menu');
    if(premier&&!premier.hasAttribute('data-entete-menu'))premier.setAttribute('data-entete-menu','1');
    mesurer(premier);
  }catch(_e){}
}
(window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]).push('data-entete-menu');
(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(marquer);
try{var rt=window.__SOREAL_IDLE_RUNTIME_V1__;if(rt&&typeof rt.onRender==='function')rt.onRender(marquer);}catch(_e){}
window.addEventListener('resize',function(){dernier.h4=null;dernier.vide=null;marquer();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',marquer,{once:true});else marquer();
setInterval(function(){if(!document.hidden)marquer();},1000);   /* filet : une page rendue sans redessin (premier affichage, changement de menu) */
window.__SOREAL_IDLE_ENTETE_MENU_V1__={marquer:marquer,mesurer:mesurer,phrases:PHRASES};
})();
