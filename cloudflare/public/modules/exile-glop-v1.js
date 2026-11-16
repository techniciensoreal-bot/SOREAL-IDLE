/*
 * SOREAL IDLE — fiche d'objet : pièces de l'Exilé, ingrédients de la GLOP et textes de description du jeu (Norman, 2026-11-16 : « tout objet du jeu doit exister dans SOREAL »).
 *   - bouton « Utiliser » des pièces d'indice (336 à 341 : action `assembleExile`, ItemController::consumeItem) et des cinq ingrédients de la GLOP (367 à 371 : action `makeGlop`,
 *     InventoryController::attemptToMakeGlop) ; la fiche de l'objet n'existe que pour un objet DÉJÀ obtenu (règle n°2) ; aucun bouton sur un objet verrouillé (le jeu exige un objet retirable) ;
 *   - texte de description du jeu (`itemCatalog[definitionId].desc`, envoyé par le serveur dans la langue du joueur : même texte que l'infobulle du jeu), jamais écrit à la main ici.
 * Le moteur décide de tout (le bouton ne fait qu'appeler l'action) ; le résultat (message du jeu) est annoncé par popup-effet-objet-v1.js.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_EXILE_GLOP_V1__)return;

var PIECES_EXILE=['faceExile','exileClueTentacle','exileClueAntlers','exileClueBuster','exileClueAntennae','sackExile'];
var INGREDIENTS_GLOP=['wellDoneSteak','pickleIceCream','canSurstromming','jarOfMarmite','pizzaPineapple'];

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function reg(){return window.__SOREAL_IDLE_REG__||{};}

/* Texte du jeu : échappé, seules les balises <b> du jeu (recette de la GLOP) sont gardées ; les sauts de ligne viennent du CSS (white-space:pre-line). */
function descriptionHtml(texte){
  return esc(texte).replace(/&lt;b&gt;/g,'<b>').replace(/&lt;\/b&gt;/g,'</b>');
}

/* Description d'un objet d'après le catalogue des objets connus de la réponse. */
function descriptionFiche(a,item){
  var cat=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
  var d=item&&cat[item.definitionId]&&cat[item.definitionId].desc;
  if(!d)return '';
  return '<div class="idle-fiche-desc-v1">'+descriptionHtml(d)+'</div>';
}

function boutonsFiche(item){
  if(!item||item.locked)return '';
  var id=String(item.id||'');
  if(PIECES_EXILE.indexOf(item.definitionId)>=0)
    return '<button type="button" class="idle-fiche-bouton-v1" onclick="window.__utiliserPieceExileIdleV1__(\''+esc(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🧩 Utiliser</button>';
  if(INGREDIENTS_GLOP.indexOf(item.definitionId)>=0)
    return '<button type="button" class="idle-fiche-bouton-v1" onclick="window.__fabriquerGlopIdleV1__(\''+esc(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🥣 Utiliser</button>';
  return '';
}

window.__utiliserPieceExileIdleV1__=function(id){
  var R=reg();
  if(typeof R.actionAdventureIdleV47_==='function')R.actionAdventureIdleV47_({action:'assembleExile',itemId:String(id||'')});
};
window.__fabriquerGlopIdleV1__=function(id){
  var R=reg();
  if(typeof R.actionAdventureIdleV47_==='function')R.actionAdventureIdleV47_({action:'makeGlop',itemId:String(id||'')});
};

window.__SOREAL_IDLE_EXILE_GLOP_V1__={descriptionFiche:descriptionFiche,boutonsFiche:boutonsFiche,descriptionHtml:descriptionHtml,PIECES_EXILE:PIECES_EXILE,INGREDIENTS_GLOP:INGREDIENTS_GLOP};
})();
