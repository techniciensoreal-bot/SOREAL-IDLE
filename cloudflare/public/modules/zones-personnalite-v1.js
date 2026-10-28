/*
 * SOREAL IDLE — la personnalité de chaque zone dans la liste déroulante d'Aventure (Norman, 2026-10-28 : « chaque ligne a sa personnalité : zone sûre un feu de camp, zone tutoriel un rat, égouts je te laisse choisir ; et la ligne complète doit avoir une couleur
 * qui s'accorde bien avec la zone, pour qu'on repère directement les zones quand on ouvre la liste » ; puis : « pas de petite languette de couleur, je les veux TEXTURÉES suivant là où ils mènent »). Une icône et une palette par zone ; la ligne prend pour texture le décor
 * de la zone elle-même (idle/backgrounds/adventure/<id>.webp, servi par /api/idle/media/adventure-zone), assombri et teinté de la couleur de la zone pour que le texte reste lisible. Aucun liseré latéral. La liste ne montre toujours que les zones DÉBLOQUÉES (règle n°2) : ce module ne fait
 * que décorer une ligne que le jeu affiche déjà. Le style est posé en ligne avec « !important » : il l'emporte sur les feuilles du thème sans ajouter de surcharge forcée aux feuilles de style.
 *   window.__SOREAL_IDLE_ZONES_STYLE_V1__ = { icone(id), style(id, active), palette(id), ids() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ZONES_STYLE_V1__)return;

/* id de zone : [icône, fond (début), fond (fin), liseré, texte] */
var ZONES={
  safe:['🔥','#7a3410','#3d1a08','#ff9a3c','#ffe2b8'],                 /* feu de camp : braise et nuit */
  tutorial:['🐀','#4a4545','#2a2727','#b8a8a0','#f1e8e2'],              /* un rat : pelage gris-brun */
  sewers:['🐊','#27493a','#132a21','#6bd49a','#d6f5e2'],                /* égouts : un alligator, eau verdâtre */
  forest:['🌲','#1f5a2c','#0f3217','#6fe08a','#dcf8e1'],
  cave:['🦇','#3a3f55','#1b1e2d','#9aa6e0','#e4e8ff'],
  sky:['☁️','#2c64a0','#183e68','#bfe3ff','#f2f9ff'],
  hsb:['🤖','#34505e','#182a33','#5ee0ff','#dff8ff'],
  clock:['⏰','#6a5416','#33290a','#ffd24a','#fff0c2'],
  '2d':['🎮','#16565e','#0a2d33','#ff5ad0','#e0fbff'],
  ancient:['⚔️','#6a4c26','#34260f','#e0b070','#fbe9cc'],
  avsp:['👁️','#5a2a78','#2a1238','#e07aff','#f6e0ff'],
  mega:['🏔️','#4a5460','#242a31','#d8e4f0','#f4f8fc'],
  beardverse:['🧔','#6a3a14','#34190a','#ffa04a','#ffe6cc'],
  badly:['✏️','#5a5a5a','#2e2e2e','#f0f0f0','#ffffff'],
  boring:['😐','#4a4a3a','#25251c','#c0c0a0','#efefdc'],
  chocolate:['🍫','#5a3118','#2a140a','#d79a5a','#ffe2c4'],
  evilverse:['😈','#6a1218','#2a0508','#ff4a55','#ffd6d9'],
  pinkprincess:['👑','#9a3a78','#4e1a3c','#ffa6e0','#fff0fa'],
  metaland:['📺','#2a3f86','#121c46','#7aa2ff','#e2ebff'],
  interdimensional:['🌀','#3a3a96','#16164a','#5ae0e0','#e6e6ff'],
  typozone:['⌨️','#3a5048','#1a2622','#8ae0b8','#e0f6ec'],
  fadlands:['🕺','#7a2a90','#3a1048','#ffea4a','#fbe6ff'],
  jrpgville:['🧙','#2a5a78','#122c3e','#7ad0ff','#e0f4ff'],
  radlands:['🛹','#a04a1a','#3a1a0a','#3ae0d0','#fff0e0'],
  backtoschool:['🎒','#5a6a22','#2a3410','#ffe04a','#f8fadc'],
  westworld:['🤠','#8a4a1a','#42240a','#ffc060','#fff0d8'],
  breadverse:['🍞','#7a5c1c','#3c2d0c','#ffd070','#fff4d8'],
  seventies:['🪩','#8c4e16','#3e2208','#ff9a3a','#fff0d0'],
  halloweenies:['🎃','#6a2a08','#25100a','#a050ff','#ffe6cc'],
  construction:['🚧','#6a5e0a','#221f03','#ffd800','#fffbd0'],
  duckduck:['🦆','#666612','#30300a','#4ae0e0','#fffbd0'],
  netherregions:['🌋','#7a1a10','#2a0a06','#ff7a2a','#ffe0d0'],
  aethereansea:['🌊','#14607a','#0a303e','#7af0ff','#dff8ff']
};
var DEFAUT=['🗺️','#33415c','#1a2236','#8fa2c8','#eaf0ff'];

function palette(id){var p=ZONES[String(id)]||DEFAUT;return {icone:p[0],debut:p[1],fin:p[2],bord:p[3],texte:p[4]};}
function icone(id){return palette(id).icone;}
/* #rrggbb -> rgba(r,g,b,a) */
function rgba(hex,a){var n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
/*
 * La ligne entière : le décor de la zone en texture, sous un voile teinté de la palette (plus dense à gauche, où l'icône et le texte sont) ; texte clair ombré ; la zone choisie est cerclée de son liseré. Pas de languette.
 * Le décor est le même fichier que le fond de la page d'Aventure : déjà chargé pour une zone qu'on a vue, partagé par le cache du navigateur sinon.
 */
function style(id,active){
  var p=palette(id),url='/api/idle/media/adventure-zone?name='+encodeURIComponent(String(id));
  return 'background:linear-gradient(90deg,'+rgba(p.debut,.88)+','+rgba(p.fin,.5)+'),url('+url+') center/cover no-repeat,'+p.fin+'!important;'+
    'color:'+p.texte+'!important;text-shadow:0 1px 3px #000,0 0 7px rgba(0,0,0,.85);border:0!important;'+
    (active?'box-shadow:inset 0 0 0 2px '+p.bord+'!important;font-weight:700;':'');
}
window.__SOREAL_IDLE_ZONES_STYLE_V1__={icone:icone,style:style,palette:palette,ids:function(){return Object.keys(ZONES);}};
})();
