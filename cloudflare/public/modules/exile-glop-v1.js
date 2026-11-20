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
/* The Death Note (288, InventoryController::itemTooltipText) : sous la description, les quatre noms visibles (grisés et en italique une fois rayés), le « trou » de la liste (le nom vide), puis le message de fin selon les noms rayés : liste complète = retour au Consigliere ; les quatre
   noms visibles seulement = le blanc donne la chair de poule. Les drapeaux viennent de la réponse (unlockFlags) ; les phrases du jeu sont envoyées par le serveur dans la langue du joueur (itemCatalog.deathNote.textes). */
var LISTE_DEATH_NOTE=[['skeletonWhacked','Skeleton'],['icarusWhacked','Icarus Proudbottom'],['kingCircleWhacked','King Circle'],['robBossWhacked','Rob Boss']];
function blocDeathNote(a,entree){
  var f=a&&a.unlockFlags&&typeof a.unlockFlags==='object'?a.unlockFlags:{};
  var t=entree&&entree.textes&&typeof entree.textes==='object'?entree.textes:{};
  var h='<div class="idle-death-note-v1" style="margin-top:.6em">';
  var visibles=true;
  LISTE_DEATH_NOTE.forEach(function(x){
    var raye=Boolean(f[x[0]]);if(!raye)visibles=false;
    h+=raye?'<div style="color:#555;font-style:italic">'+esc(x[1])+'</div>':'<div><b>'+esc(x[1])+'</b></div>';
  });
  if(t.trou)h+='<div style="margin-top:.6em">'+esc(t.trou)+'</div>';
  if(visibles){
    if(f.emptyNameWhacked)h+=t.retour?'<div style="margin-top:.6em"><b>'+esc(t.retour)+'</b></div>':'';
    else h+=t.incomplete?'<div style="margin-top:.6em"><b>'+esc(t.incomplete)+'</b></div>':'';
  }
  return h+'</div>';
}

function descriptionFiche(a,item){
  var cat=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
  var d=item&&cat[item.definitionId]&&cat[item.definitionId].desc;
  if(!d)return '';
  return '<div class="idle-fiche-desc-v1">'+descriptionHtml(d)+(item.definitionId==='deathNote'?blocDeathNote(a,cat.deathNote):'')+'</div>';
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
