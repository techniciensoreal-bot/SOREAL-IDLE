/*
 * SOREAL IDLE — page NGU, « la nuit des tuyaux » (Norman, 2026-10-08) : plus de fioles. Chaque NGU est un TUYAU de verre horizontal qui se remplit d'un liquide lumineux, aux couleurs de l'écran NGU de NGU Idle ; les tuyaux
 * brillent dans une nuit étoilée (le fond « cosmos » du cadre de chat des niveaux 30 de SOREAL APP : nuit violette, étoiles à quatre branches qui scintillent) et sont branchés sur un tronc lumineux qui reprend toutes leurs couleurs.
 *
 * Couleurs : celles de la capture (échantillonnées sur l'image) pour les 9 NGU d'énergie. Les 7 NGU de magie ne figuraient pas sur la capture : leurs couleurs sont un choix de SOREAL, dans le même esprit.
 * Contrôles, comme dans le jeu d'origine : + / − (la quantité est celle de la case « Input » partagée avec les autres menus), « Target » (niveau à atteindre) et « Advance Energy » (voir src/idle-ngu-progression.js).
 *
 * Vivant : le remplissage est la progression vers le niveau suivant, rejouée en direct à partir du dernier état du serveur (progression + secondes par niveau), uniquement en transform et opacité (compositeur : aucune repeinte lourde) ;
 * un reflet lumineux parcourt les tuyaux qui reçoivent de l'énergie.
 *
 *   window.__SOREAL_IDLE_NGU_LABO_V1__ = { page(j), couleurs, aide(), ajuster(id,mode), cible(id,valeur), avance(ressource,coche), onglet(ressource), vider(ressource), preset(source,fraction) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_NGU_LABO_V1__)return;

/* [couleur du liquide et du nom, couleur du texte du nom] */
var COULEURS={
  augments:['#868686','#0c0c0c'],
  wandoos:['#7a96f5','#030c29'],
  respawn:['#a6deb9','#061509'],
  gold:['#ffffa9','#0e1100'],
  adventureAlpha:['#f2bb6a','#120b00'],
  powerAlpha:['#ed3e3e','#220300'],
  dropChance:['#daf11a','#101300'],
  magicNgu:['#9e19f1','#ffffff'],
  pp:['#cfca15','#131100'],
  yggdrasil:['#58c46a','#04170a'],
  exp:['#62c0ff','#02131f'],
  powerBeta:['#ff7a59','#240800'],
  number:['#ffd34d','#1f1600'],
  timeMachine:['#b79bff','#12062e'],
  energyNgu:['#7ef0e0','#021a17'],
  adventureBeta:['#ff9de1','#2a0420']
};
/* Étoiles à quatre branches (comme le cadre « cosmos » du chat de SOREAL APP) : positions fixes, pseudo-aléatoires, qui scintillent en opacité / échelle seulement. Durée du cycle propre à chaque étoile, entre 3,2 et 8,1 s (Norman, 2026-10-10 : « les étoiles ne scintillent pas » : elle grandissait avec le rang de l'étoile, jusqu'à plus de 200 s, donc presque aucune ne bougeait). */
function etoilesHtml_(){
  var a=7,sortie='';
  function suite(){a=(a*9301+49297)%233280;return a/233280;}
  /*
   * Performance (Norman, 2026-10-10 : « les étoiles font ramer la page »). Avant : 240 étoiles = 480 éléments (une lueur en dégradé + une étoile découpée chacune) recréés à CHAQUE redessin de la page
   * (toutes les quelques secondes), dont 60 animés. Maintenant : les étoiles FIXES (la grande majorité) sont UNE seule image (SVG en fond d'une tuile, dessinée une fois puis réutilisée) ; seules 40 étoiles
   * sont de vrais éléments, animés en opacité / échelle uniquement (compositeur), dans un conteneur isolé (contain) qui n'oblige jamais la page à se remettre en page ni à se repeindre.
   */
  /*
   * Apparition en fondu et scintillement (Norman, 2026-10-29 : « les étoiles doivent apparaître en fondu quand on met de la magie, et elles doivent scintiller ») : chaque niveau de lumière est une couche (<u class="nl-niv nK">) dont l'opacité passe de 0 à 1 en douceur quand le niveau est atteint
   * (au lieu d'apparaître d'un coup) ; elle porte trois groupes de la tuile fixe (<i>), chacun avec son propre scintillement (durée et décalage propres), et les étoiles individuelles de son niveau (8, 8, 12 et 12). Tout reste en opacité / échelle (compositeur).
   */
  var bornes=[[0,8],[8,16],[16,28],[28,40]],etoiles=[];
  for(var i=0;i<40;i+=1){
    var x=suite()*100,y=suite()*100,t=7+Math.round(suite()*9);
    etoiles.push('<b style="--i:'+i+';--d:'+(3.2+((i*37)%50)/10).toFixed(1)+'s;--x:'+x.toFixed(1)+'%;--y:'+y.toFixed(1)+'%;--s:'+t+'px"></b>');
  }
  for(var k=0;k<4;k+=1){
    var groupes='';
    for(var g=0;g<3;g+=1){
      var n=k*3+g;
      groupes+='<i class="g'+g+'" style="--d:'+(3.1+((n*53)%37)/10).toFixed(1)+'s;animation-delay:-'+(((n*29)%47)/10).toFixed(1)+'s"></i>';
    }
    sortie+='<u class="nl-niv n'+(k+1)+'">'+groupes+etoiles.slice(bornes[k][0],bornes[k][1]).join('')+'</u>';
  }
  return '<span class="nl-etoiles" aria-hidden="true">'+sortie+'</span>';
}
var ETOILES=etoilesHtml_();
/* Jour et nuit (Norman, 2026-10-25 : « le NGU côté Énergie représente le jour, avec des nuages et le soleil ; le NGU Magie la nuit, avec une lune comme celle d'Halloween ; sans énergie (ou sans magie), le soleil (la lune) ne brille pas ») : l'astre (soleil ou lune) et sa couche (nuages le jour, chauves-souris la nuit). */
/*
 * Ciel du jour (Norman, 2026-11-03) : « toute la page a des nuages gris ; ils ne se dégagent que sur la ligne où l'on a mis une ressource, pas coupé droit, comme si une force poussait les nuages à cet endroit ; et beaucoup plus lentement ».
 * Onglet Énergie : UNE couche grise (.nl-gris) couvre toute la page, TOUJOURS présente dans le HTML (jamais retirée ni recréée : c'est ce qui faisait « clignoter » avant, le redessin du morph la supprimait d'un coup et posait soleil et nuages blancs sans fondu).
 * La brèche de chaque ligne est le pseudo-élément ::after de la barre (.nl-barre.actif, classe posée par le HTML) : zéro nœud en plus ; transition de 16 s (opacité + échelle) qui survit au redessin (même nœud, seul l'attribut class change).
 * Onglet Magie (nuit) : lune et chauves-souris comme avant ; les étoiles sont par ligne (voir plus bas).
 */
function veutAstres_(onglet,niv){return onglet==='magic';}
function veutGris_(onglet,niv){return onglet!=='magic';}
var HTML_ASTRE='<span class="nl-astre" aria-hidden="true"></span><span class="nl-nuages" aria-hidden="true"></span>';
/*
 * Nuages DESSINÉS (Norman, 2026-11-03 : « il y a encore des lignes droites ; ce ne sont pas des nuages, ce sont des bulles ; le ciel doit avoir le même bleu partout »). Plus aucun masque flou : le gris est un BANC DE CUMULUS en SVG (union de cercles de rayons très différents, en quatre rangées ombrées du gris clair en haut au gris sombre en bas), généré ici
 * par une suite déterministe ; le ciel derrière est UN SEUL bleu uni (--nl-ciel) et quelques petits cumulus blancs FIXES. Chaque ligne d'énergie porte son banc (pseudo-élément ::after, zéro nœud) ; quand elle est alimentée, SEULE l'opacité du banc passe de 1 à 0 en 16 s (formes fixes, aucune échelle), le ciel uni apparaît derrière.
 * Le banc d'une ligne déborde de 130 px au-dessus et au-dessous : ses festons (bord haut et bord bas, jamais rectilignes) chevauchent ceux des lignes voisines. Tuile de 960 x 420 px (46 cercles au plus avec les doublons de raccord), répétée en largeur, deux tuiles (graines) et cinq décalages : deux lignes voisines ne se ressemblent pas.
 */
function suiteNuage_(graine){var a=graine*7919+13;return function(){a=(a*9301+49297)%233280;return a/233280;};}
function cerclesBanc_(graine){
  var r=suiteNuage_(graine),W=960,H=420,sortie=[];
  var rangees=[{y:318,min:50,max:94,pas:104,g:3},{y:240,min:70,max:104,pas:118,g:2},{y:168,min:70,max:104,pas:118,g:1},{y:96,min:52,max:96,pas:104,g:0}];
  rangees.forEach(function(rg){
    var n=Math.ceil(W/rg.pas);
    for(var i=0;i<n;i+=1){
      var R=Math.round(rg.min+r()*r()*(rg.max-rg.min)*.6+r()*(rg.max-rg.min)*.4);
      var cx=Math.round((i+.5)*rg.pas+(r()-.5)*rg.pas*.5),cy=Math.round(rg.y+(r()-.5)*26);
      if(rg.g===0)cy=Math.max(cy,R+4);
      if(rg.g===3)cy=Math.min(cy,H-R-4);
      sortie.push({x:cx,y:cy,r:R,g:rg.g});
      if(cx-R<0)sortie.push({x:cx+W,y:cy,r:R,g:rg.g});
      if(cx+R>W)sortie.push({x:cx-W,y:cy,r:R,g:rg.g});
    }
  });
  return sortie;
}
function bancUri_(graine){
  var ds=[['#a5abb9','#7d8495'],['#8f96a6','#686f81'],['#7a8192','#565d6f'],['#656c7e','#434959']];
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420"><defs>'+ds.map(function(d,i){return '<linearGradient id="g'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+d[0]+'"/><stop offset="1" stop-color="'+d[1]+'"/></linearGradient>';}).join('')+'</defs>'+
    cerclesBanc_(graine).map(function(c){return '<circle cx="'+c.x+'" cy="'+c.y+'" r="'+c.r+'" fill="url(#g'+c.g+')"/>';}).join('')+'</svg>';
  return 'data:image/svg+xml,'+encodeURIComponent(svg);
}
/* Petits cumulus BLANCS fixes du ciel (tuile 1100 x 640 px, sept cumulus de sept à huit cercles chacun, base plate), visibles seulement là où le gris s'est effacé. */
function blancsUri_(graine){
  var r=suiteNuage_(graine),svg='<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="640"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e5f4"/></linearGradient></defs>';
  for(var k=0;k<7;k+=1){
    var cx=70+((k*157+Math.round(r()*60))%960),cy=60+((k*97+Math.round(r()*40))%520),l=70+Math.round(r()*70),n=7;
    svg+='<rect x="'+(cx-l/2)+'" y="'+(cy+6)+'" width="'+l+'" height="'+Math.round(10+r()*6)+'" rx="8" fill="url(#b)"/>';
    for(var i=0;i<n;i+=1){var t=i/(n-1),R=Math.round(10+Math.sin(t*Math.PI)*(14+r()*10));svg+='<circle cx="'+Math.round(cx-l/2+t*l)+'" cy="'+Math.round(cy+8-Math.sin(t*Math.PI)*(8+r()*10))+'" r="'+R+'" fill="url(#b)"/>';}
  }
  return 'data:image/svg+xml,'+encodeURIComponent(svg+'</svg>');
}
var BANC_A=bancUri_(3),BANC_B=bancUri_(2),BLANCS=blancsUri_(5);
var HTML_GRIS='<span class="nl-gris" data-morph-vivant aria-hidden="true"></span>';
/* Un SEUL soleil pour toute la page Énergie : un nœud posé une fois, jamais un par ligne ; derrière le banc du haut, il se révèle quand ce banc s'efface. Éclat --nl-sol (0 ; 0,7 pour une ligne ; jusqu'à 1 pour quatre lignes ou plus), lissé par @property sur 16 s. */
var HTML_SOLEIL='<span class="nl-soleil" aria-hidden="true"></span>';
/* Hauteur du banc du haut = du haut de la page (débord de 100 px) à 130 px sous le haut de la première ligne (son banc recouvre le bas de celui-ci). Mesurée par un ResizeObserver (taille de la page) et quand le banc vient d'être posé ; jamais par une minuterie. */
function mesurerHaut_(racine){
  var s=racine.querySelector(':scope>.nl-gris'),b=racine.querySelector('.nl-section[data-nl-section="energy"] .nl-barre');
  if(!s||!b)return;
  var h=Math.round(b.getBoundingClientRect().top-racine.getBoundingClientRect().top)+230;
  if(h>0&&s.__nlH!==h){s.__nlH=h;s.style.height=h+'px';}
}
function attacherMesure_(racine){
  if(racine.__nlRO||typeof ResizeObserver==='undefined')return;
  racine.__nlRO=new ResizeObserver(function(){mesurerHaut_(racine);});
  racine.__nlRO.observe(racine);
  mesurerHaut_(racine);
}
function solDe_(nbOuvertes){return nbOuvertes>0?Math.round((0.7+0.3*Math.min(1,(nbOuvertes-1)/3))*100)/100:0;}
function astresHtml_(onglet,niv){return '<span class="nl-arc" aria-hidden="true"></span>'+(veutAstres_(onglet,niv)?HTML_ASTRE:'')+(veutGris_(onglet,niv)?HTML_SOLEIL+HTML_GRIS:'');}
/* Lune pleine du thème Halloween de SOREAL APP / TV (sphère jaune pâle éclairée en haut à gauche, ombre en bas à droite, trois cratères), dessinée en SVG statique ; version grise pour le niveau 0. */
function luneUri_(p){
  var svg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs>"+
    "<radialGradient id='a' cx='.3' cy='.28' r='1.004'><stop offset='0' stop-color='"+p[0]+"'/><stop offset='.38' stop-color='"+p[1]+"'/><stop offset='.72' stop-color='"+p[2]+"'/><stop offset='1' stop-color='"+p[3]+"'/></radialGradient>"+
    "<radialGradient id='s' cx='.4' cy='.38' r='.75'><stop offset='.6' stop-color='"+p[4]+"' stop-opacity='0'/><stop offset='1' stop-color='"+p[4]+"' stop-opacity='.38'/></radialGradient>"+
    "<radialGradient id='c'><stop offset='0' stop-color='"+p[5]+"' stop-opacity='.38'/><stop offset='.7' stop-color='"+p[5]+"' stop-opacity='0'/></radialGradient></defs>"+
    "<circle cx='50' cy='50' r='50' fill='url(#a)'/><circle cx='50' cy='50' r='50' fill='url(#s)'/>"+
    "<circle cx='62' cy='30' r='10.2' fill='url(#c)'/><circle cx='34' cy='62' r='14.8' fill='url(#c)' opacity='.8'/><circle cx='72' cy='68' r='6.8' fill='url(#c)' opacity='.9'/></svg>";
  return 'data:image/svg+xml,'+svg.replace(/#/g,'%23').replace(/</g,'%3C').replace(/>/g,'%3E');
}
var LUNE_URI=luneUri_(['#fffdf0','#fbeeb4','#e9cf86','#c9a95c','#966e28','#96733a']);
var LUNE_GRISE_URI=luneUri_(['#eef0f5','#c4c9d4','#9097a8','#5d6376','#2a2e3c','#3a3f50']);
/* Synchronise le ciel avec l'onglet (changement d'onglet sans redessin) : énergie = couche grise, magie = lune et chauves-souris. Idempotent, aucun fondu ici (les brèches se font en CSS, par ligne). */
function cielSync_(racine,anime){
  if(!racine)return;
  var onglet=racine.getAttribute('data-nl-onglet'),niv=racine.getAttribute('data-nl-niv');
  var arc=racine.querySelector(':scope>.nl-arc');
  var gris=racine.querySelector(':scope>.nl-gris');
  var astre=racine.querySelector(':scope>.nl-astre');
  if(veutAstres_(onglet,niv)){
    if(!astre&&arc)arc.insertAdjacentHTML('afterend',HTML_ASTRE);
  }else if(astre){
    Array.prototype.forEach.call(racine.querySelectorAll(':scope>.nl-astre,:scope>.nl-nuages'),function(e){e.remove();});
  }
  if(veutGris_(onglet,niv)){
    if(!gris&&arc)arc.insertAdjacentHTML('afterend',HTML_SOLEIL+HTML_GRIS);
  }else{
    if(gris)gris.remove();
    var sol=racine.querySelector(':scope>.nl-soleil');if(sol)sol.remove();
  }
}
/*
 * Aurores boréales (Norman, 2026-10-25 : « fais mieux les aurores boréales, elles sont toutes identiques ») : deux couches SVG différentes (graine, couleurs, vagues, vitesse et sens de dérive) ; chaque couche est faite de plusieurs rubans, chacun un peloton de rayons verticaux
 * de largeur, de hauteur et d'éclat irréguliers (bord haut ondulé, dégradé vers le bas). Les vagues ont un nombre ENTIER de cycles sur 1200 px : la tuile se répète sans raccord et la dérive boucle exactement.
 */
function auroreUri_(graine, rubans) {
  /*
   * Rideaux (Norman, 2026-10-29 : « les aurores boréales doivent ressembler à ça ; elles sont trop rectilignes ») : plus de bandes verticales droites. Chaque couche est faite de rayons COURBES (courbe de Bézier en S, qui dérive latéralement selon une onde lente), larges et flous (le rideau),
   * avec par-dessus quelques fils lumineux fins ; une enveloppe d'un nombre entier de cycles dessine de vrais rideaux séparés par des vides ; vif en bas (la couleur de pied), bleu-violet en haut qui s'efface. La tuile (1200 px) se répète sans raccord : les rayons de bord sont dessinés aussi de l'autre côté.
   */
  var a = graine;
  function suite() { a = (a * 9301 + 49297) % 233280; return a / 233280; }
  var TAU = 2 * Math.PI, defs = '<filter id="fl" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6.5"/></filter><filter id="fm"><feGaussianBlur stdDeviation="1.6"/></filter>', doux = '', net = '';
  rubans.forEach(function (rb, k) {
    var y0 = Math.max(0, rb.base - rb.amp * 1.4), y1 = Math.min(300, rb.base + rb.hauteur);
    defs += '<linearGradient id="g' + k + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + y0.toFixed(0) + '" x2="0" y2="' + y1.toFixed(0) + '"><stop offset="0" stop-color="' + rb.c2 + '" stop-opacity="0"/><stop offset=".3" stop-color="' + rb.c2 + '" stop-opacity="' + (rb.o * 0.5).toFixed(2) + '"/><stop offset=".72" stop-color="' + rb.c + '" stop-opacity="' + rb.o + '"/><stop offset="1" stop-color="' + rb.c + '" stop-opacity="0"/></linearGradient>';
    var kk = Math.max(1, rb.k), phi = rb.ph, x = 0;
    while (x < 1200) {
      var l = 12 + suite() * 26;
      var env = Math.max(0, Math.sin(TAU * kk * (x / 1200) + phi)), env2 = Math.max(0, Math.sin(TAU * (kk + 1) * (x / 1200) + phi * 1.7 + 1));
      var force = Math.pow(Math.max(env, env2 * 0.7), 1.2);
      if (force > 0.04) {
        var onde = Math.sin(TAU * kk * (x / 1200) + phi) * rb.amp + Math.sin(TAU * (kk + 2) * (x / 1200) + phi * 2) * rb.amp * 0.45;
        var ytop = Math.max(2, rb.base + onde - suite() * rb.dispersion * 0.5);
        var long = rb.hauteur * (0.75 + suite() * 0.7) * (0.6 + force * 0.5) * 1.2;
        var yb = Math.min(300, ytop + long), h = yb - ytop;
        var sway = Math.sin(TAU * (kk + 1) * (x / 1200) + phi * 1.3) * 60 + (suite() - 0.5) * 30;
        var c1 = sway * (-0.25 + suite() * 0.5), c2 = sway * (0.8 + suite() * 0.5), fin = sway * (0.3 + suite() * 0.6);
        var d = 'M' + x.toFixed(1) + ' ' + ytop.toFixed(1) + 'C' + (x + c1).toFixed(1) + ' ' + (ytop + h * 0.3).toFixed(1) + ' ' + (x + c2).toFixed(1) + ' ' + (ytop + h * 0.68).toFixed(1) + ' ' + (x + fin).toFixed(1) + ' ' + yb.toFixed(1);
        var op = (force * (0.4 + suite() * 0.6)).toFixed(2);
        var chemin = function (dx, larg, opa) { return '<path d="' + d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, function (m, px, py) { return (Number(px) + dx).toFixed(1) + ' ' + py; }) + '" stroke="url(#g' + k + ')" stroke-width="' + larg.toFixed(1) + '" opacity="' + opa + '"/>'; };
        var copies = chemin(0, l, op);
        if (x < 120) copies += chemin(1200, l, op);
        if (x > 1060) copies += chemin(-1200, l, op);
        doux += copies;
        if (suite() < 0.16) { var lg = 2.2 + suite() * 3.4, oo = Math.min(1, Number(op) * 1.7).toFixed(2); net += chemin(0, lg, oo) + (x < 120 ? chemin(1200, lg, oo) : '') + (x > 1060 ? chemin(-1200, lg, oo) : ''); }
      }
      x += l * (0.35 + suite() * 0.6);
    }
  });
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300"><defs>' + defs + '</defs><g fill="none" stroke-linecap="round"><g filter="url(#fl)">' + doux + '</g><g filter="url(#fm)">' + net + '</g></g></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
var AURORE_A = auroreUri_(11, [
  { c: '#3dffa8', c2: '#1fb8d8', o: 0.85, k: 2, ph: 0.4, amp: 22, base: 58, dispersion: 26, hauteur: 190 },
  { c: '#a76bff', c2: '#5a3ad8', o: 0.6, k: 3, ph: 2.1, amp: 16, base: 96, dispersion: 40, hauteur: 160 },
  { c: '#6bffd4', c2: '#2aa8e0', o: 0.55, k: 5, ph: 4.0, amp: 12, base: 44, dispersion: 18, hauteur: 150 }
]);
var AURORE_B = auroreUri_(77, [
  { c: '#35d8e8', c2: '#3a66e8', o: 0.7, k: 3, ph: 1.3, amp: 26, base: 70, dispersion: 32, hauteur: 180 },
  { c: '#ff6bd5', c2: '#9a4ad8', o: 0.45, k: 4, ph: 3.2, amp: 18, base: 112, dispersion: 34, hauteur: 130 },
  { c: '#8dff6b', c2: '#2fd8a0', o: 0.5, k: 2, ph: 5.2, amp: 20, base: 40, dispersion: 22, hauteur: 140 }
]);
var CHAUVES_URI=(function(){
  var chauve='M0 0C-10-14-28-16-40-6C-34-6-28-2-26 6C-20 0-12 0-8 8C-4 2 4 2 8 8C12 0 20 0 26 6C28-2 34-6 40-6C28-16 10-14 0 0Z';
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="240" viewBox="0 0 900 240"><g fill="#07030f">'+
    '<path transform="translate(150 70) scale(1)" d="'+chauve+'"/><path transform="translate(330 150) scale(.7)" d="'+chauve+'"/>'+
    '<path transform="translate(560 50) scale(.85)" d="'+chauve+'"/><path transform="translate(740 130) scale(1.15)" d="'+chauve+'"/>'+
    '<path transform="translate(850 200) scale(.55)" d="'+chauve+'"/></g></svg>';
  return 'data:image/svg+xml,'+encodeURIComponent(svg);
})();
/*
 * Étoiles fixes (Norman, 2026-10-10 : « pas d'étoile tant qu'on n'a pas activé la machine ; plus on met de machines en route, plus les étoiles brillent ; le maximum quand toute l'énergie ET la magie sont cap »).
 * Quatre tuiles SVG de 1000 px (50 étoiles chacune) : le ciel en montre 0, 1, 2, 3 ou 4 selon le niveau de lumière (data-nl-niv), et son opacité suit --nl-lueur (0 à 1).
 */
function tuileEtoilesUri_(graine,groupe){
  var a=graine,svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">';
  function suite(){a=(a*9301+49297)%233280;return a/233280;}
  for(var i=0;i<50;i+=1){
    var x=suite()*1000,y=suite()*1000,u=suite(),r=0.6+u*u*u*5.4,o=(0.35+suite()*0.6).toFixed(2);
    if(i%3!==groupe)continue;   /* chaque groupe (un tiers des étoiles de la tuile) scintille à son rythme */
    if(r<1.6)svg+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+r.toFixed(1)+'" fill="#fff" fill-opacity="'+o+'"/>';
    else{
      var g=r*1.8,c=function(dx,dy){return (x+dx*g).toFixed(1)+','+(y+dy*g).toFixed(1);};
      svg+='<polygon points="'+c(0,-1)+' '+c(.2,-.2)+' '+c(1,0)+' '+c(.2,.2)+' '+c(0,1)+' '+c(-.2,.2)+' '+c(-1,0)+' '+c(-.2,-.2)+'" fill="#fff" fill-opacity="'+o+'"/>';
    }
  }
  return 'data:image/svg+xml,'+encodeURIComponent(svg+'</svg>');
}
var TUILES_ETOILES=[31,97,173,251].map(function(graine){return [0,1,2].map(function(g){return tuileEtoilesUri_(graine,g);});});
/* Tuile d'étoiles d'UNE ligne de magie (900 x 300 px, une seule image par couche) : points, étoiles à quatre branches de 3 à 9 px et halos doux, positions pseudo-aléatoires fixes (graine). */
function tuileLigneUri_(graine,nb){
  var a=graine,svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300">';
  function suite(){a=(a*9301+49297)%233280;return a/233280;}
  for(var i=0;i<nb;i+=1){
    var x=suite()*900,y=suite()*300,u=suite(),o=(0.55+suite()*0.45).toFixed(2);
    if(u<0.55){svg+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+(1+suite()*1.2).toFixed(1)+'" fill="#fff" fill-opacity="'+o+'"/>';suite();}
    else{
      var g=3+suite()*6,c=function(dx,dy){return (x+dx*g).toFixed(1)+','+(y+dy*g).toFixed(1);};
      svg+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+(g*1.7).toFixed(1)+'" fill="#cfe0ff" fill-opacity="0.13"/>'+
        '<polygon points="'+c(0,-1)+' '+c(.2,-.2)+' '+c(1,0)+' '+c(.2,.2)+' '+c(0,1)+' '+c(-.2,.2)+' '+c(-1,0)+' '+c(-.2,-.2)+'" fill="#fff" fill-opacity="'+o+'"/>';
    }
  }
  return 'data:image/svg+xml,'+encodeURIComponent(svg+'</svg>');
}
var TUILE_LIGNE_A=tuileLigneUri_(11,26),TUILE_LIGNE_B=tuileLigneUri_(23,52);
function fondGroupe_(niveau,groupe){return 'url("'+TUILES_ETOILES[niveau-1][groupe]+'") 0 0/1000px 1000px repeat';}
/* Niveau de lumière du ciel : chaque machine (NGU) compte 0 si rien n'y est placé, 1/2 si elle tourne, 1 si elle est CAP (50 niveaux par seconde) ; on fait la moyenne de toutes les machines affichées. */
function lueurDe_(parts){
  if(!parts.length)return 0;
  var t=0;for(var i=0;i<parts.length;i+=1)t+=parts[i];
  return Math.max(0,Math.min(1,t/parts.length));
}
function nivDe_(lueur){return lueur>0?Math.max(1,Math.min(4,Math.ceil(lueur*4-1e-9))):0;}
function partDe_(n){
  var alloc=Math.max(0,Math.floor(nombre_(n.allocation)));
  if(!(alloc>0))return 0;
  var spl=n.secondsPerLevel!=null&&isFinite(Number(n.secondsPerLevel))&&Number(n.secondsPerLevel)>0?Number(n.secondsPerLevel):0;
  return spl>0&&spl<0.04?1:.5;
}

/*
 * Éclat des étoiles d'une ligne de magie (Norman, 2026-11-03 : « plus la vitesse de remplissage d'une ligne est rapide, plus fort les étoiles brilleront »).
 * Entrée : n.secondsPerLevel = secondes pour gagner un niveau avec la magie placée (src/idle-ngu-snapshot.js : perLevel / rate, null si rien ne tourne), donc de l'ÉTAT du moteur, jamais du DOM.
 * Formule : e = 0 si rien n'est placé ; sinon e = 0,4 + 0,6 * clamp( ln(1e10/spl) / ln(1e10/0,04), 0, 1 ).  Échelle logarithmique entre 1e10 s par niveau (ordre de grandeur des lignes les plus lentes mesurées dans le moteur : plancher visible 0,4) et 0,04 s par niveau (le plafond CAP du moteur : 50 niveaux/s, e = 1).
 * Monotone (plus rapide = plus brillant), bornée [0,4 ; 1], continue (aucun seuil) ; arrondie à 0,01 pour que le HTML reste stable. Le lissage dans le temps est fait par le CSS (transition de --nl-e sur 16 s).
 */
function eclatLigne_(n){
  var alloc=Math.max(0,Math.floor(nombre_(n.allocation)));
  if(!(alloc>0))return 0;
  var spl=n.secondsPerLevel!=null&&isFinite(Number(n.secondsPerLevel))&&Number(n.secondsPerLevel)>0?Number(n.secondsPerLevel):0;
  if(!(spl>0))return 0.4;
  var lent=1e10,rapide=0.04;
  var x=Math.log(lent/Math.max(rapide,spl))/Math.log(lent/rapide);
  x=Math.max(0,Math.min(1,x));
  return Math.round((0.4+0.6*x)*100)/100;
}

var onglet='energy';        // 'energy' | 'magic'
var timer=0;

function H_(){return window.__SOREAL_IDLE_META_HOST_V130__||null;}
function esc_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function nombre_(v){var n=Number(v);return isFinite(n)?n:0;}
function format_(v,d){var H=H_();return H&&H.formatGrandNombreIdleV70_?H.formatGrandNombreIdleV70_(nombre_(v),d):String(Math.floor(nombre_(v)));}
function envoyer_(payload){
  var f=window.__envoyerAllocRapideIdleV1__;
  if(typeof f==='function')f(payload);
}

/* ---------- données ---------- */
function systemeNgu_(j){
  var l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
  for(var i=0;i<l.length;i+=1)if(l[i]&&l[i].id==='ngu')return l[i];
  return null;
}
function ngus_(j){return (j&&j.systemes&&j.systemes.ngus)||{};}
function listeCourante_(j){
  var ng=ngus_(j);
  return (ng.tiers&&ng.tiers[ng.tier||'normal'])||[];
}
function nguDe_(j,id){
  var l=listeCourante_(j);
  for(var i=0;i<l.length;i+=1)if(l[i].id===id)return l[i];
  return null;
}
function ressourceMagie_(j){return (j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic)||null;}
function libre_(j,res){
  if(res==='magic'){var m=ressourceMagie_(j);return Math.max(0,nombre_(m&&m.current));}
  return Math.max(0,nombre_(j&&j.energie));
}
function plafond_(j,res){
  if(res==='magic'){var m=ressourceMagie_(j);return Math.max(0,nombre_(m&&m.cap));}
  return Math.max(0,nombre_(j&&j.energieMax));
}
/* Quantité des boutons + et − : la case « Input » partagée (Basic Training, Augmentations, Time Machine, Entraînement avancé…). */
function pas_(){
  var el=document.getElementById('sorealIdleAugInputV1');
  var an=window.__analyserMontantSaisieIdleV1__;
  var n=typeof an==='function'?an(el&&el.value):Math.floor(Number(el&&el.value));
  if(isFinite(n)&&n>=1)return n;
  var m=typeof window.__lireMontantAugmentIdleV1__==='function'?window.__lireMontantAugmentIdleV1__():125;
  return Math.max(1,Math.floor(Number(m))||125);
}

/* ---------- minuteur : fin du niveau en cours ---------- */
function dureeTexte_(s){
  s=Math.max(0,Math.ceil(s));
  if(s<60)return s+' s';
  var m=Math.floor(s/60),r=s%60;
  if(m<60)return m+' min'+(r?' '+r+' s':'');
  var h=Math.floor(m/60);m=m%60;
  if(h<24)return h+' h'+(m?' '+m+' min':'');
  var j=Math.floor(h/24);h=h%24;
  return j+' j'+(h?' '+h+' h':'');
}
/* « Niveau suivant dans … » = durée d'un niveau × ce qu'il reste à remplir ; rien à dire sans énergie ni quand la cible est atteinte. */
function etaTexte_(spl,fraction,cibleAtteinte){
  if(cibleAtteinte)return 'Cible atteinte';
  if(!(spl>0))return 'Place de l’énergie pour avancer';
  if(spl<0.04)return 'Niveaux instantanés';
  return '⏱️ Niveau suivant dans <b>'+dureeTexte_(spl*Math.max(0,1-fraction))+'</b>';
}

/* ---------- un tuyau ---------- */
/* HTML stable (Norman, 2026-11-02, redessin NGU) : l'instant de départ (data-nl-t0) n'est écrit que pour un tuyau qui progresse (spl > 0 : seul cas où le tick le lit) ; un tuyau à l'arrêt porte toujours 0, donc deux rendus d'un même état sans progression sont identiques et le morph peut ignorer le redessin. */
function barreHtml_(n,ancre){
  var c=COULEURS[n.id]||['#9aa5bb','#111111'];
  var niveau=Math.max(0,Math.floor(nombre_(n.level)));
  var alloc=Math.max(0,Math.floor(nombre_(n.allocation)));
  var p=Math.max(0,Math.min(0.999999,nombre_(n.progress)));
  var spl=n.secondsPerLevel!=null&&isFinite(Number(n.secondsPerLevel))&&Number(n.secondsPerLevel)>0?Number(n.secondsPerLevel):0;
  var cible=Math.max(0,Math.floor(nombre_(n.target)));
  var pleine=spl>0&&spl<0.04;
  var effet=(n.id==='respawn'?'-':'+')+format_(n.effectPct,2)+' %';
  var idH=esc_(n.id);
  var rempli=pleine?1:Math.round(p*1000)/1000;
  return '<div class="nl-barre'+(alloc>0?' actif':'')+(pleine?' pleine':'')+'" data-nl-ngu="'+idH+'" data-nl-res="'+esc_(n.resource)+'" data-nl-p="'+p+'" data-nl-spl="'+spl+'" data-nl-n="'+niveau+'" data-nl-cible="'+cible+'" data-nl-t0="'+(spl>0?ancre:0)+'" style="--nl-c:'+c[0]+';--nl-t:'+c[1]+';--nl-e:'+eclatLigne_(n)+'">'+
    '<div class="nl-tete"><div class="nl-nom">NGU '+esc_(String(n.name||n.id).toUpperCase())+'</div><div class="nl-niveau">Niveau <b data-nl-niv>'+format_(niveau)+'</b></div></div>'+
    '<div class="nl-tuyau">'+
      '<i class="nl-bride g"></i>'+
      '<div class="nl-tube"><i class="nl-liq-in" data-nl-fill style="transform:scaleX('+rempli+')"></i><span class="nl-pct" data-nl-pct>'+Math.round(rempli*100)+' %</span></div>'+
      '<i class="nl-bride d"></i>'+
    '</div>'+
    '<div class="nl-eta" data-nl-eta>'+etaTexte_(spl,rempli,cible>0&&niveau>=cible)+'</div>'+
    '<div class="nl-infos"><span>'+(n.resource==='magic'?'Magie':'Énergie')+' placée <b data-nl-alloc>'+format_(alloc)+'</b></span>'+
      '<span class="nl-effet" title="'+esc_(n.effect)+'">'+esc_(n.effect)+' <b>'+effet+'</b></span></div>'+
    '<div class="nl-actions">'+
      '<label class="nl-cible"><span>Cible</span><input type="number" inputmode="numeric" min="0" step="1" value="'+cible+'" title="Niveau cible : l’énergie est retirée dès qu’il est atteint (0 = aucun objectif)" onchange="window.__SOREAL_IDLE_NGU_LABO_V1__.cible(\''+idH+'\',this.value)"></label>'+
      '<div class="nl-boutons">'+
        '<button type="button" title="Placer la valeur de Input" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'plus\')">+</button>'+
        '<button type="button" title="Retirer la valeur de Input" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'moins\')">−</button>'+
        '<button type="button" class="max" title="Placer toute l’énergie ou la magie libre" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'max\')">Max</button>'+
        '<button type="button" title="Retirer toute l’énergie de cette barre" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'zero\')">0</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* ---------- page ---------- */
var CSS=
  '.nl-v1{--nl-ciel:#58a6ee;position:relative;isolation:isolate;box-sizing:border-box;margin:0 0 12px;padding:16px 14px 22px;color:#eaf0ff;border-radius:20px;border:2px solid rgba(170,110,255,.6);overflow:hidden;font-family:"Segoe UI",system-ui,sans-serif;'+
    'background-color:#0a0620;background-image:linear-gradient(160deg,#1b0f45 0%,#120a33 45%,#0a0620 100%);'+
    'box-shadow:0 0 34px rgba(120,70,255,.4),inset 0 0 50px rgba(90,34,216,.28)}'+
  '.nl-v1 *{box-sizing:border-box}'+
  '.nl-eta{margin:2px 0 4px;font-size:12.5px;font-weight:800;color:#cdbcff;letter-spacing:.02em}.nl-eta b{color:#fff}'+
  '.nl-v1>*:not(.nl-etoiles){position:relative;z-index:1}'+
  /* étoiles à quatre branches : lueur (b) + étoile (i), scintillement en opacité / échelle */
  '.nl-etoiles{position:absolute;inset:0;pointer-events:none;z-index:0;contain:strict;display:block;opacity:calc(.3 + var(--nl-lueur,0)*.7);transition:opacity 1.6s ease}'+
  '.nl-etoiles u{position:absolute;inset:0;opacity:0;transition:opacity 2s ease;text-decoration:none}'+
  '.nl-v1[data-nl-niv="1"] .nl-etoiles .n1,.nl-v1[data-nl-niv="2"] .nl-etoiles :is(.n1,.n2),.nl-v1[data-nl-niv="3"] .nl-etoiles :is(.n1,.n2,.n3),.nl-v1[data-nl-niv="4"] .nl-etoiles u{opacity:1}'+
  '.nl-etoiles u i{position:absolute;inset:0}'+
  '.nl-etoiles .n1 i.g0{background:'+fondGroupe_(1,0)+'}'+
  '.nl-etoiles .n1 i.g1{background:'+fondGroupe_(1,1)+'}'+
  '.nl-etoiles .n1 i.g2{background:'+fondGroupe_(1,2)+'}'+
  '.nl-etoiles .n2 i.g0{background:'+fondGroupe_(2,0)+'}'+
  '.nl-etoiles .n2 i.g1{background:'+fondGroupe_(2,1)+'}'+
  '.nl-etoiles .n2 i.g2{background:'+fondGroupe_(2,2)+'}'+
  '.nl-etoiles .n3 i.g0{background:'+fondGroupe_(3,0)+'}'+
  '.nl-etoiles .n3 i.g1{background:'+fondGroupe_(3,1)+'}'+
  '.nl-etoiles .n3 i.g2{background:'+fondGroupe_(3,2)+'}'+
  '.nl-etoiles .n4 i.g0{background:'+fondGroupe_(4,0)+'}'+
  '.nl-etoiles .n4 i.g1{background:'+fondGroupe_(4,1)+'}'+
  '.nl-etoiles .n4 i.g2{background:'+fondGroupe_(4,2)+'}'+
  /* étoiles à quatre branches qui scintillent : de plus en plus nombreuses et lumineuses avec le niveau */
  '.nl-etoiles b{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);margin:calc(var(--s)/-2) 0 0 calc(var(--s)/-2);background:#fff;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);opacity:.3;will-change:opacity,transform}'+
  '.nl-etoiles b:nth-child(3n+1){--pic:.5}.nl-etoiles b:nth-child(3n+2){--pic:.75}.nl-etoiles b:nth-child(3n){--pic:.95}'+
  '@media(prefers-reduced-motion:no-preference){.nl-v1 .nl-etoiles b{animation:nlEtoile var(--d,5s) ease-in-out infinite;animation-delay:calc(var(--i)*-2.3s)}.nl-etoiles u i{animation:nlScint var(--d,4s) ease-in-out infinite;will-change:opacity}'+
    '@keyframes nlEtoile{0%,60%,100%{opacity:.25;transform:scale(.6)}74%{opacity:var(--pic,.9);transform:scale(1.05)}86%{opacity:.4;transform:scale(.75)}}@keyframes nlScint{0%,100%{opacity:1}22%{opacity:.4}41%{opacity:.95}58%{opacity:.28}76%{opacity:.85}}}'+
  /* ---- Jour (NGU d'énergie) : ciel, nuages qui dérivent, soleil ; nuit (NGU de magie) : lune d'Halloween et chauves-souris. Le niveau de lumière (--nl-lueur) règle l'éclat ; à 0 l'astre est éteint. ---- */
  '.nl-v1>.nl-astre,.nl-v1>.nl-nuages{position:absolute;pointer-events:none;z-index:0;display:none}'+
  '.nl-astre{top:14px;right:6%;width:96px;height:96px}'+
  '.nl-astre::before,.nl-astre::after{content:"";position:absolute;border-radius:50%}'+
  '.nl-astre::after{inset:0}'+
  '.nl-nuages{left:0;right:0;top:0;height:300px;background-repeat:repeat-x;-webkit-mask:linear-gradient(180deg,#000 60%,transparent);mask:linear-gradient(180deg,#000 60%,transparent)}'+
  /* jour */
  /* Ciel de l'onglet Énergie : UN SEUL bleu uni (--nl-ciel) + petits cumulus blancs fixes ; les bancs de cumulus gris (SVG) se posent par-dessus et s'effacent par fondu d'opacité (16 s, formes fixes). */
  '.nl-v1[data-nl-onglet="energy"]{background-image:url("'+BLANCS+'");background-size:1100px 640px;background-repeat:repeat;background-color:var(--nl-ciel)}'+
  '.nl-v1[data-nl-onglet="magic"]>.nl-gris{display:none}'+
  /* Banc du haut de la page (nœud .nl-gris) : s'efface dès qu'au moins une ligne d'énergie est active (data-nl-ouvert, posé par le HTML). Débord de 100 px au-dessus du cadre : ses festons du haut sortent de la page, aucune coupure droite. */
  '.nl-v1>.nl-gris{position:absolute;pointer-events:none;z-index:0;left:0;right:0;top:-100px;height:370px;opacity:1;transition:opacity 16s ease-in-out;background-image:url("'+BANC_A+'");background-repeat:repeat-x;background-size:auto 100%;background-position:30% 0}'+
  '.nl-v1[data-nl-ouvert="1"]>.nl-gris{opacity:0}'+
  /* Soleil unique */
  '@property --nl-sol{syntax:"<number>";inherits:true;initial-value:0}'+
  '.nl-v1[data-nl-onglet="energy"]{transition:--nl-sol 16s ease-in-out}'+
  '.nl-v1>.nl-soleil{position:absolute;pointer-events:none;z-index:0;left:calc(50% - 38px);top:22px;width:76px;height:76px;border-radius:50%;opacity:var(--nl-sol);background:radial-gradient(circle at 38% 34%,#fffbd0 0,#ffe066 45%,#ffb81f 100%);box-shadow:0 0 26px 8px rgba(255,214,80,.75)}'+
  '.nl-v1[data-nl-onglet="magic"]>.nl-soleil{display:none}'+
  /* TOUS les nuages sous TOUT le contenu (Norman, 2026-11-03 : « ses nuages sont au-dessus des cadres au-dessus ») : la section des lignes et le résumé ne forment plus un contexte d'empilement (z-index:auto au lieu de 1) ; les bancs de ligne et du bas (z-index:-1) se peignent ainsi dans le contexte unique de la page (isolation:isolate), sous les cadres du haut (barre d'outils, en-têtes, z-index:1), sous les lignes et sous le résumé, et jamais par-dessus. */
  '.nl-v1>.nl-section,.nl-v1>.nl-resume{z-index:auto}'+
  /* Banc d'une ligne : ::after de la barre (zéro nœud), débordant de 70 px en haut et en bas, sous le contenu ; cinq décalages et deux tuiles selon le rang (deux lignes voisines ne se ressemblent pas). Alimentée (classe actif, posée par le HTML) : opacité 1 -> 0. */
  '.nl-barre[data-nl-res="energy"]::after{content:"";position:absolute;z-index:-1;pointer-events:none;left:-100%;right:-100%;top:-130px;bottom:-130px;opacity:1;transition:opacity 16s ease-in-out;background-image:var(--nl-banc,url("'+BANC_A+'"));background-repeat:repeat-x;background-size:auto 100%;background-position:calc(50% + var(--nl-dec,0px)) 0}'+
  '.nl-barre[data-nl-res="energy"].actif::after{opacity:0}'+
  '.nl-section .nl-barre[data-nl-res="energy"]:nth-child(2n){--nl-banc:url("'+BANC_B+'")}'+
  [0,1,2,3,4].map(function(k){return '.nl-section .nl-barre[data-nl-res="energy"]:nth-child(5n+'+k+'){--nl-dec:'+[0,190,410,660,830][k]+'px}';}).join('')+
  /* Banc du bas (résumé « Effets de tous tes NGU ») : s'efface quand TOUTES les lignes d'énergie sont alimentées (data-nl-tout) : plus aucun gris nulle part. */
  '.nl-v1[data-nl-onglet="energy"] .nl-resume{position:relative}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-resume::before{content:"";position:absolute;z-index:-1;pointer-events:none;left:-30px;right:-30px;top:-130px;bottom:-110px;opacity:1;transition:opacity 16s ease-in-out;background-image:url("'+BANC_B+'");background-repeat:repeat-x;background-size:auto 100%;background-position:60% 0}'+
  '.nl-v1[data-nl-tout="1"] .nl-resume::before{opacity:0}'+
  '@media(prefers-reduced-motion:reduce){.nl-v1>.nl-gris,.nl-barre[data-nl-res="energy"]::after,.nl-v1[data-nl-onglet="energy"] .nl-resume::before{transition:opacity .4s linear}.nl-v1[data-nl-onglet="energy"]{transition:--nl-sol .4s linear}}'+
  '.nl-v1[data-nl-onglet="energy"]{border-color:rgba(255,226,140,.75);box-shadow:0 0 34px rgba(255,214,90,.35),inset 0 0 50px rgba(255,255,255,.12)}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-etoiles{display:none}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-astre,.nl-v1[data-nl-onglet="energy"] .nl-nuages{display:block}'+
  '.nl-v1>.nl-astre{}.nl-v1[data-nl-onglet="energy"]>.nl-astre{right:auto;left:calc(50% - 29px);top:3px;width:58px;height:58px}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-astre::after{background:radial-gradient(circle at 38% 34%,#fffbd0 0,#ffe066 45%,#ffb81f 100%);box-shadow:0 0 calc(14px + var(--nl-lueur,0)*56px) calc(var(--nl-lueur,0)*12px) rgba(255,214,80,calc(.15 + var(--nl-lueur,0)*.7))}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-astre::before{inset:-66px;background:repeating-conic-gradient(rgba(255,232,140,.6) 0 5deg,transparent 5deg 22.5deg);-webkit-mask:radial-gradient(circle,#000 26%,transparent 66%);mask:radial-gradient(circle,#000 26%,transparent 66%);opacity:calc(var(--nl-lueur,0)*.95)}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-nuages{background-size:640px 100%;opacity:calc(.7 + var(--nl-lueur,0)*.3);background-image:'+
    'radial-gradient(ellipse 84px 24px at 90px 70px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 54px 22px at 62px 82px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 60px 26px at 128px 80px,#fff 0 58%,transparent 74%),'+
    'radial-gradient(ellipse 84px 24px at 330px 150px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 54px 22px at 302px 162px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 60px 26px at 368px 160px,#fff 0 58%,transparent 74%),'+
    'radial-gradient(ellipse 84px 24px at 540px 40px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 54px 22px at 512px 52px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 60px 26px at 578px 50px,#fff 0 58%,transparent 74%),'+
    'radial-gradient(ellipse 92px 18px at 90px 84px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 60px 16px at 64px 94px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 66px 18px at 128px 92px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 92px 18px at 330px 164px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 60px 16px at 304px 174px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 66px 18px at 368px 172px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 92px 18px at 540px 54px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 60px 16px at 514px 64px,rgba(120,170,225,.7) 0 58%,transparent 76%),radial-gradient(ellipse 66px 18px at 578px 62px,rgba(120,170,225,.7) 0 58%,transparent 76%)}'+
    'radial-gradient(ellipse 84px 24px at 90px 70px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 54px 22px at 62px 82px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 60px 26px at 128px 80px,#fff 0 58%,transparent 74%),'+
    'radial-gradient(ellipse 96px 26px at 330px 150px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 58px 24px at 292px 162px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 66px 28px at 376px 160px,#fff 0 58%,transparent 74%),'+
    'radial-gradient(ellipse 78px 22px at 540px 40px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 50px 20px at 512px 52px,#fff 0 58%,transparent 74%),radial-gradient(ellipse 56px 24px at 584px 50px,#fff 0 58%,transparent 74%)}'+
  /* Les nuages dérivent par TRANSFORM (carte graphique), plus par background-position (Norman, 2026-10-26, audit 60 fps : NGU du jour à 20 images/s ; 24 dégradés d'une bande de 300 px repeints à chaque image). L'élément déborde de 640 px à gauche (le cadre coupe : overflow:hidden) et glisse d'exactement une période du motif : même rendu, boucle sans à-coup. */
  '.nl-v1[data-nl-onglet="energy"] .nl-nuages{left:-640px}'+
  '@media(prefers-reduced-motion:no-preference){.nl-v1[data-nl-onglet="energy"] .nl-nuages{animation:nlNuages 150s linear infinite;will-change:transform}.nl-v1[data-nl-onglet="energy"] .nl-astre::before{animation:nlRayons 90s linear infinite}'+
    '@keyframes nlNuages{from{transform:translate3d(0,0,0)}to{transform:translate3d(640px,0,0)}}@keyframes nlRayons{from{transform:rotate(0)}to{transform:rotate(360deg)}}}'+
  /* Arc-en-ciel le jour, aurores boréales la nuit (Norman, 2026-10-25). Éclat selon --nl-lueur ; éteints quand rien n'est placé. */
  '.nl-v1>.nl-arc{position:absolute;pointer-events:none;z-index:0;display:none}'+
  '.nl-v1[data-nl-onglet="energy"]>.nl-arc{display:none;left:7%;width:86%;top:46px;height:210px;filter:blur(.6px);opacity:calc(.3 + var(--nl-lueur,0)*.5);-webkit-mask:linear-gradient(180deg,#000 58%,transparent);mask:linear-gradient(180deg,#000 58%,transparent);background:radial-gradient(ellipse 50% 100% at 50% 100%,transparent 0 64%,rgba(255,70,70,.9) 65% 69%,rgba(255,150,40,.9) 69% 73%,rgba(255,226,70,.9) 73% 77%,rgba(90,205,100,.9) 77% 81%,rgba(70,160,255,.9) 81% 85%,rgba(90,80,225,.9) 85% 89%,rgba(165,90,225,.9) 89% 93%,transparent 94%)}'+
  '.nl-v1[data-nl-onglet="energy"][data-nl-niv="0"]>.nl-arc{display:none}'+
  '.nl-v1[data-nl-onglet="magic"]>.nl-arc{display:block;left:0;right:0;top:0;height:300px;opacity:calc(.25 + var(--nl-lueur,0)*.75);filter:blur(1.6px) saturate(1.25);background:url("'+AURORE_A+'") 0 0/1200px 300px repeat-x;-webkit-mask:linear-gradient(180deg,#000 70%,transparent);mask:linear-gradient(180deg,#000 70%,transparent)}'+
  '.nl-v1[data-nl-onglet="magic"]>.nl-arc{transform-origin:50% 0}.nl-v1[data-nl-onglet="magic"]>.nl-arc::after{content:"";position:absolute;inset:0;transform-origin:50% 0;background:url("'+AURORE_B+'") 300px 0/1200px 300px repeat-x;mix-blend-mode:screen;opacity:.9}'+
  '.nl-v1[data-nl-onglet="magic"][data-nl-niv="0"]>.nl-arc{opacity:0}'+
  '@media(prefers-reduced-motion:no-preference){.nl-v1[data-nl-onglet="magic"]>.nl-arc{animation:nlAuroreA 140s linear infinite,nlAuroreRespire 9s ease-in-out infinite}.nl-v1[data-nl-onglet="magic"]>.nl-arc::after{animation:nlAuroreB 210s linear infinite reverse,nlAuroreRespire 13s ease-in-out -4s infinite}'+
    '@keyframes nlAuroreA{from{background-position:0 0}to{background-position:1200px 0}}@keyframes nlAuroreB{from{background-position:300px 0}to{background-position:1500px 0}}@keyframes nlAuroreRespire{0%,100%{transform:scale(1,.9)}50%{transform:scale(1,1.1)}}}'+
  /* nuit : pleine lune réaliste, la même que le thème Halloween de SOREAL APP / TV (Norman, 2026-11-02) : sphère éclairée, cratères, halo doux ; le halo suit --nl-lueur, grise et sans halo au niveau 0 */
  '.nl-v1[data-nl-onglet="magic"]>.nl-astre{display:block;right:auto;left:calc(50% - 29px);top:3px;width:58px;height:58px}'+
  '.nl-v1[data-nl-onglet="magic"] .nl-astre::after{background:url("'+LUNE_URI+'") 0 0/100% 100% no-repeat;box-shadow:0 0 calc(8px + var(--nl-lueur,0)*14px) calc(var(--nl-lueur,0)*4px) rgba(255,214,120,calc(.08 + var(--nl-lueur,0)*.34)),0 0 calc(20px + var(--nl-lueur,0)*40px) calc(var(--nl-lueur,0)*16px) rgba(255,170,60,calc(var(--nl-lueur,0)*.16))}'+
  '.nl-v1[data-nl-onglet="magic"] .nl-astre::before{inset:-42px;background:radial-gradient(circle,rgba(255,226,150,.55) 0,rgba(255,190,90,.22) 36%,transparent 66%);opacity:calc(var(--nl-lueur,0)*.95)}'+
  '.nl-v1[data-nl-onglet="magic"][data-nl-niv="0"] .nl-astre::after{background:url("'+LUNE_GRISE_URI+'") 0 0/100% 100% no-repeat;box-shadow:none}'+
  '.nl-v1[data-nl-onglet="magic"][data-nl-niv="0"] .nl-astre::before{opacity:0}'+
  '.nl-v1[data-nl-onglet="magic"] .nl-nuages{display:block;height:240px;background-size:900px 240px;background-image:url("'+CHAUVES_URI+'");opacity:calc(var(--nl-lueur,0)*.8)}'+
  '@media(prefers-reduced-motion:no-preference){.nl-v1[data-nl-onglet="magic"] .nl-nuages{animation:nlChauves 80s linear infinite}@keyframes nlChauves{from{background-position:0 0}to{background-position:-900px 0}}}'+
  /* Ciel de la nuit (Norman, 2026-11-03) : plus de ciel étoilé global ni d'aurore de bandeau ; les ÉTOILES (et une lueur d'aurore) n'existent que sur la ligne où de la magie est placée, brèche organique (mêmes ellipses floues que le jour).
     --nl-e (0 à 1, posé sur la barre par le HTML : eclatLigne_) = éclat selon la vitesse de remplissage ; @property permet à la transition de 16 s de le lisser (aucun saut si la vitesse change, ouverture et extinction lentes). ::after = étoiles clairsemées (opacité = e), .nl-tuyau::before = étoiles denses (opacité = e au cube : elles n'apparaissent que pour une ligne rapide).
     Le scintillement est une respiration d'opacité sur une boucle PARFAITE (mêmes valeurs à 0 % et 100 %), durées différentes pour les deux couches ; coupé si prefers-reduced-motion. */
  '@property --nl-e{syntax:"<number>";inherits:true;initial-value:0}'+
  '.nl-v1[data-nl-onglet="magic"]>.nl-arc,.nl-v1[data-nl-onglet="magic"] .nl-etoiles{display:none}'+
  '.nl-barre[data-nl-res="magic"]{transition:--nl-e 16s ease-in-out}'+
  '.nl-barre[data-nl-res="magic"]::after,.nl-barre[data-nl-res="magic"] .nl-tuyau::before{content:"";position:absolute;z-index:-1;pointer-events:none;left:-12%;right:-12%;top:-52px;bottom:-48px;width:auto;height:auto;border-radius:0;box-shadow:none;'+
    '-webkit-mask-image:radial-gradient(ellipse 46% 60% at 50% 50%,#000 46%,transparent 100%),radial-gradient(ellipse 26% 50% at 18% 54%,#000 40%,transparent 100%),radial-gradient(ellipse 28% 46% at 82% 48%,#000 40%,transparent 100%),radial-gradient(ellipse 22% 40% at 34% 12%,#000 30%,transparent 100%),radial-gradient(ellipse 24% 40% at 68% 92%,#000 30%,transparent 100%);'+
    'mask-image:radial-gradient(ellipse 46% 60% at 50% 50%,#000 46%,transparent 100%),radial-gradient(ellipse 26% 50% at 18% 54%,#000 40%,transparent 100%),radial-gradient(ellipse 28% 46% at 82% 48%,#000 40%,transparent 100%),radial-gradient(ellipse 22% 40% at 34% 12%,#000 30%,transparent 100%),radial-gradient(ellipse 24% 40% at 68% 92%,#000 30%,transparent 100%)}'+
  '.nl-barre[data-nl-res="magic"]::after{opacity:var(--nl-e);background-image:radial-gradient(ellipse 40% 50% at 50% 55%,rgba(120,255,190,.16),transparent 70%),radial-gradient(ellipse 34% 46% at 70% 40%,rgba(150,110,255,.2),transparent 70%),url("'+TUILE_LIGNE_A+'");background-size:100% 100%,100% 100%,900px 300px;background-position:0 0,0 0,0 0;background-repeat:no-repeat,no-repeat,repeat}'+
  '.nl-barre[data-nl-res="magic"] .nl-tuyau::before{opacity:calc(var(--nl-e)*var(--nl-e)*var(--nl-e));background-image:url("'+TUILE_LIGNE_B+'");background-size:900px 300px;background-position:310px 120px;background-repeat:repeat}'+
  '@media(prefers-reduced-motion:no-preference){.nl-barre[data-nl-res="magic"]::after{animation:nlLigneScintA 9s ease-in-out infinite}.nl-barre[data-nl-res="magic"] .nl-tuyau::before{animation:nlLigneScintB 6.5s ease-in-out infinite}'+
    '@keyframes nlLigneScintA{0%,100%{opacity:var(--nl-e)}35%{opacity:calc(var(--nl-e)*.6)}68%{opacity:calc(var(--nl-e)*.92)}}'+
    '@keyframes nlLigneScintB{0%,100%{opacity:calc(var(--nl-e)*var(--nl-e)*var(--nl-e))}30%{opacity:calc(var(--nl-e)*var(--nl-e)*var(--nl-e)*.55)}62%{opacity:calc(var(--nl-e)*var(--nl-e)*var(--nl-e)*.9)}}}'+
  '@media(prefers-reduced-motion:reduce){.nl-barre[data-nl-res="magic"]{transition:--nl-e .4s linear}}'+
  '.nl-haut{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}'+
  '.nl-btn{min-height:44px;padding:6px 14px;background:rgba(255,255,255,.08);color:#fff;border:1.5px solid rgba(190,160,255,.75);border-radius:12px;box-shadow:0 0 12px rgba(150,100,255,.35);font:800 13px/1.15 "Segoe UI",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;cursor:pointer}'+
  '.nl-btn:active{transform:translateY(1px)}.nl-btn.actif{background:rgba(190,160,255,.35)}'+
  '.nl-aide{margin:8px 0;padding:10px 12px;background:rgba(10,6,32,.7);border:1px solid rgba(150,120,255,.4);border-radius:12px;font:500 14px/1.5 "Segoe UI",system-ui,sans-serif;color:#dfe5ff}'+
  '.nl-aide[hidden]{display:none}.nl-aide p{margin:0 0 6px}.nl-aide ol{margin:0;padding-left:20px;display:grid;gap:4px}'+
  '.nl-paliers{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0;font:800 13px/1 "Segoe UI",system-ui,sans-serif;text-transform:uppercase;color:#c9d2f7}'+
  /* Barre d'outils en petits cadres (Norman, 2026-10-15 : « harmoniser tous ces boutons, plafond d'énergie etc., dans des petits cadres propres ; des MAX dépassent sur téléphone »). Un cadre par ligne : son titre en haut,
     puis des boutons de même largeur dans une grille qui s'adapte à l'écran ; rien ne peut dépasser (texte coupé par des points de suspension, boutons larges sur toute la ligne). */
  '.nl-barre-outils{display:grid;gap:8px;margin:8px 0;padding:10px;background:rgba(10,6,32,.65);border:1px solid rgba(150,120,255,.4);border-radius:12px;font:700 13px/1.3 "Segoe UI",system-ui,sans-serif;color:#dfe5ff;min-width:0}'+
  '.nl-barre-outils .nl-ligne{display:grid;grid-template-columns:repeat(auto-fit,minmax(62px,1fr));gap:6px;align-items:center;min-width:0;padding:8px;border:1px solid rgba(150,120,255,.32);border-radius:10px;background:rgba(24,14,64,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}'+
  '.nl-barre-outils .nl-ligne>span:first-child{grid-column:1/-1;font:800 12px/1.2 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#c9d2f7}'+
  '.nl-barre-outils .nl-ligne-input{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}'+
  '.nl-barre-outils .nl-ligne-input label{font:800 13px/1 "Segoe UI",system-ui,sans-serif;color:#c9d2f7}'+
  '.nl-barre-outils .nl-ligne-input>span{flex:1 1 140px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
  '.nl-barre-outils .nl-totaux{grid-template-columns:repeat(auto-fit,minmax(130px,1fr));background:none;border:0;box-shadow:none;padding:0}'+
  '.nl-barre-outils input[type=text]{width:130px;max-width:100%;box-sizing:border-box;padding:6px 8px;background:#0b0724;border:1.5px solid rgba(170,130,255,.7);border-radius:8px;font:800 15px "Segoe UI",system-ui,sans-serif;color:#fff}'+
  '.nl-barre-outils button{min-height:38px;min-width:0;padding:0 6px;box-sizing:border-box;background:rgba(255,255,255,.08);color:#fff;border:1.5px solid rgba(170,130,255,.6);border-radius:8px;font:800 13px "Segoe UI",system-ui,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.nl-barre-outils .nl-large{grid-column:span 2}'+
  '.nl-barre-outils [data-perso-ngu-v1]{grid-column:1/-1}'+
  /* rangée « Mes nombres » (modules/perso-boutons-v1.js) : même cadre que les autres lignes */
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] .nl-barre-outils [data-perso-input-rangee]{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;--bt-btn-h:30px;--bt-btn-fs:15px;gap:4px 6px!important;align-items:center;margin:0!important;min-width:0;padding:8px!important;border:1px solid rgba(150,120,255,.32)!important;border-radius:10px!important;background:rgba(24,14,64,.55)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] .nl-barre-outils [data-perso-input-rangee]>span:first-child{grid-column:1/-1;font:800 12px/1.2 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#c9d2f7}'+
  '.nl-avance{display:inline-flex;align-items:center;gap:8px;margin:4px 0;font:800 16px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer;color:#fff}'+
  '.nl-avance input{width:24px;height:24px;accent-color:#b58aff}'+
  /* réseau : un tronc lumineux aux couleurs de tous les tuyaux, une branche par tuyau */
  '.nl-section[hidden]{display:none}'+
  '.nl-grille{position:relative;display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin:10px auto 0;padding-left:24px;max-width:920px}'+
  '.nl-grille::before{content:"";position:absolute;left:5px;top:10px;bottom:10px;width:8px;border-radius:8px;background:linear-gradient(180deg,#ed3e3e,#f2bb6a,#ffffa9,#daf11a,#a6deb9,#7a96f5,#9e19f1,#ff9de1,#62c0ff,#7ef0e0);box-shadow:0 0 10px 1px rgba(200,160,255,.75),0 0 28px rgba(120,80,255,.5)}'+
  '.nl-barre{position:relative;min-width:0}'+
  '.nl-barre::before{content:"";position:absolute;left:-22px;top:62px;width:24px;height:7px;border-radius:4px;background:var(--nl-c);box-shadow:0 0 10px var(--nl-c)}'+
  '.nl-tete{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 8px;margin:0 2px 6px}'+
  '.nl-nom{font:900 14px/1.15 "Segoe UI",system-ui,sans-serif;letter-spacing:.07em;color:color-mix(in srgb,var(--nl-c) 55%,#fff);text-shadow:0 0 9px var(--nl-c),0 0 2px #000}'+
  '.nl-niveau{font:700 12px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#b9c2ee;white-space:nowrap}'+
  '.nl-niveau b{font:900 20px/1 "Segoe UI",system-ui,sans-serif;color:#fff;font-variant-numeric:tabular-nums;text-shadow:0 0 8px var(--nl-c)}'+
  /* tuyau : brides métalliques, verre, liquide lumineux, halo derrière */
  '.nl-tuyau{position:relative;display:flex;align-items:center}'+
  /* plus de halo flou autour du tuyau : toute la lueur reste DANS la barre (Norman, 2026-10-12) */
  '.nl-tuyau::before{content:none}'+
  /* Cadre lumineux d'une barre qui porte de l'énergie : FIXE, posé par la classe « actif » (présente dès le dessin de la page) et non par le balayage de barres-actives (qui le retirait un instant à chaque redessin) ; le halo du tuyau ne pulse plus (Norman, 2026-10-11 : « le cadre lumineux clignote »). */
  /* Aura NGU (Norman, 2026-10-12 : « enlève l'aura identique à celle d'Augmentations, crée-en une nouvelle, dans la barre ») : l'AURORE. Aucun liseré ni halo autour de la carte ; une lueur intérieure aux couleurs du tuyau, et des bandes de lumière qui coulent dans le liquide. */
  '.nl-barre.actif{box-shadow:none!important}'+
  '.nl-barre.actif .nl-tube{box-shadow:inset 0 0 16px 2px color-mix(in srgb,var(--nl-c) 85%,transparent),inset 0 0 12px rgba(0,0,0,.45)}'+
  '.nl-liq-in::after{content:"";position:absolute;inset:0;opacity:0;pointer-events:none;background:repeating-linear-gradient(105deg,transparent 0 14px,color-mix(in srgb,var(--nl-c) 55%,transparent) 46px,transparent 78px);background-size:92px 100%}'+
  '.nl-bride{position:relative;z-index:2;flex:0 0 auto;width:15px;height:52px;border-radius:5px;border:1px solid #0b0b1c;background:linear-gradient(90deg,#222744,#b4bae0 45%,#222744);box-shadow:0 0 6px rgba(0,0,0,.65)}'+
  '.nl-bride::before{content:"";position:absolute;left:50%;top:5px;bottom:5px;width:4px;margin-left:-2px;background:radial-gradient(circle,#10122a 0 1.5px,transparent 2.2px) 0 0/4px 12px repeat-y}'+
  '.nl-tube{position:relative;z-index:1;flex:1 1 auto;min-width:0;height:38px;margin:0 -4px;border-radius:10px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.5));border:2px solid color-mix(in srgb,var(--nl-c) 75%,#fff);box-shadow:inset 0 0 12px rgba(0,0,0,.7)}'+
  '.nl-liq-in{position:absolute;inset:0;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(180deg,color-mix(in srgb,var(--nl-c) 52%,#fff) 0,var(--nl-c) 40%,color-mix(in srgb,var(--nl-c) 68%,#000) 100%);will-change:transform}'+
  '.nl-tube::after{content:"";position:absolute;left:3px;right:3px;top:3px;height:34%;border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.04));pointer-events:none;z-index:2}'+
  '@media(prefers-reduced-motion:no-preference){.nl-barre.actif .nl-liq-in::after{opacity:1;animation:nlAurore 3.2s linear infinite}@keyframes nlAurore{from{background-position:0 0}to{background-position:92px 0}}}'+
  '.nl-pct{position:absolute;right:10px;top:50%;transform:translateY(-50%);z-index:3;font:900 13px/1 "Segoe UI",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 1px 3px #000,0 0 6px #000}'+
  '.nl-infos{display:flex;flex-wrap:wrap;align-items:baseline;gap:3px 14px;margin:7px 2px 0;font:600 12px/1.3 "Segoe UI",system-ui,sans-serif;color:#c7d0f2}'+
  '.nl-infos b{color:#fff;font-variant-numeric:tabular-nums}'+
  '.nl-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 2px 0}'+
  '.nl-cible{display:flex;align-items:center;gap:6px;margin-right:auto;font:800 11px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#aab4dc}'+
  '.nl-cible input{width:86px;padding:7px 6px;background:#0b0724;color:#fff;border:1.5px solid color-mix(in srgb,var(--nl-c) 70%,#fff);border-radius:8px;font:800 15px "Segoe UI",system-ui,sans-serif;text-align:center}'+
  '.nl-boutons{display:flex;gap:8px}'+
  '.nl-boutons button{width:52px;min-height:44px;background:rgba(255,255,255,.07);color:#fff;border:1.5px solid var(--nl-c);border-radius:12px;box-shadow:0 0 10px color-mix(in srgb,var(--nl-c) 60%,transparent);font:900 24px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer}'+
  '.nl-boutons button:active{transform:translateY(1px)}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-barre-outils button:not(#_):not(#_),html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-boutons button:not(#_):not(#_),html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-haut .nl-btn:not(#_):not(#_){background:linear-gradient(180deg,#8087ff 0%,#4a46d6 55%,#312ea8 100%);border:2px solid #d9dcff;color:#fff;-webkit-text-stroke:0;paint-order:normal;text-shadow:0 2px 0 rgba(10,8,60,.9),0 0 6px rgba(10,8,60,.6);letter-spacing:.06em;box-shadow:0 3px 0 #1b1862,0 0 10px rgba(130,125,255,.45)}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-barre-outils button:not(#_):not(#_),html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-haut .nl-btn:not(#_):not(#_){font-size:17px;font-weight:400}'+
  /* Thème Jour (Norman, 2026-10-25) : les petits cadres (Input, Plafond, Idle) et leurs boutons, avec le bouton « Vers les NGU d'énergie », prennent la couleur du jour : verre bleu clair, boutons soleil. */
  '.nl-v1[data-nl-onglet="energy"] .nl-barre-outils .nl-ligne{background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(130,190,255,.18));border-color:rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 4px 14px -8px rgba(5,30,80,.7)}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-barre-outils .nl-totaux{background:none;border:0;box-shadow:none}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-barre-outils{background:linear-gradient(180deg,rgba(40,110,190,.55),rgba(14,50,110,.6));border-color:rgba(255,255,255,.45);color:#eaf6ff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-v1[data-nl-onglet="energy"] .nl-barre-outils .nl-totaux>*:not(#_):not(#_){background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(130,190,255,.16));border:1px solid rgba(255,255,255,.5);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}'+
  '.nl-v1[data-nl-onglet="energy"] .nl-barre-outils .nl-ligne>span:first-child,.nl-v1[data-nl-onglet="energy"] .nl-barre-outils .nl-ligne-input label{color:#fff;text-shadow:0 1px 2px rgba(5,30,80,.8)}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-v1[data-nl-onglet="energy"] .nl-barre-outils button:not(#_):not(#_),html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-v1[data-nl-onglet="energy"] .nl-haut .nl-btn:not([data-nl-onglet-btn]):not(#_):not(#_),html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-v1[data-nl-onglet="magic"] .nl-haut .nl-btn[data-nl-onglet-btn]:not(#_):not(#_){background:linear-gradient(180deg,#c9e9ff 0%,#74baf7 50%,#3d86dc 100%);border:2px solid #eaf6ff;color:#fff;text-shadow:0 1px 0 #1a4a8f,0 0 6px rgba(20,70,150,.7);box-shadow:0 3px 0 #1d4f95,0 0 12px rgba(150,210,255,.6)}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-v1[data-nl-onglet="magic"] .nl-haut .nl-btn[data-nl-onglet-btn]:not(#_):not(#_){background:radial-gradient(circle at 25px 50%,#fffbd0 0,#ffe066 6px,#ffb21a 11px,rgba(255,200,60,.4) 14px,transparent 18px),linear-gradient(180deg,#c9e9ff 0%,#74baf7 50%,#3d86dc 100%);padding-left:48px}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-boutons button:not(#_):not(#_){font-size:24px;font-weight:400}'+
  /* « Max » est un mot de trois lettres dans un bouton de 52 px : à 24 px il dépassait du cadre sur téléphone (Norman, 2026-10-27). Taille réduite, sans espacement de lettres, et rien ne sort du bouton. */
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-boutons button.max:not(#_):not(#_):not(#_){font-size:16px;letter-spacing:0;padding:0;overflow:hidden;white-space:nowrap}'+
  'html body.soreal-idle-active-v47.soreal-idle-active-v47 .nl-haut [data-nl-onglet-btn]:not(#_):not(#_){position:relative;isolation:isolate;overflow:visible;border:2px solid rgba(255,255,255,.2);border-radius:14px;color:#fff;font-size:18px;letter-spacing:.08em;background:radial-gradient(circle at 12% 30%,#fff 0 1px,transparent 2px),radial-gradient(circle at 78% 22%,#fff 0 1px,transparent 2px),radial-gradient(circle at 55% 78%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 90% 70%,#cfe9ff 0 1px,transparent 2px),radial-gradient(circle at 30% 85%,#ffd6fb 0 1px,transparent 2px),radial-gradient(circle at 66% 40%,#fff 0 1px,transparent 2px),linear-gradient(135deg,#4a22c8,#150a45 58%,#34107a);box-shadow:0 0 18px 4px rgba(195,125,255,.95),0 0 46px 8px rgba(120,70,255,.6);text-shadow:0 0 8px #fff,0 2px 0 rgba(10,4,50,.9)}'+
  '.nl-haut [data-nl-onglet-btn]::before{content:"";position:absolute;inset:-6px;z-index:-1;border-radius:19px;padding:5px;background:conic-gradient(from var(--soreal-ang-v1,0deg),#ff9ee8,#5a22d8,#21d4fd,#5a22d8,#ff9ee8);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);pointer-events:none}'+
  '.nl-haut [data-nl-onglet-btn]::after{content:"✦ ✧ ✦";position:absolute;right:-4px;top:-16px;font-size:19px;line-height:1;letter-spacing:.3em;color:#fff;text-shadow:0 0 6px #c9a6ff,0 0 12px #8f5bff;pointer-events:none}'+
  '@media (prefers-reduced-motion:no-preference){'+
  '.nl-haut [data-nl-onglet-btn]::before{animation:sorealAlTourneV1 3.4s linear infinite}'+
  '.nl-haut [data-nl-onglet-btn]::after{animation:nlEtoilesV1 2.4s ease-in-out infinite}'+
  '@keyframes nlEtoilesV1{0%{opacity:0;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(.7)}}'+
  '}'+
  '.nl-resume{margin-top:14px;font:600 13px/1.4 "Segoe UI",system-ui,sans-serif;color:#dfe5ff}'+
  '.nl-resume>summary{cursor:pointer;font-weight:800;text-transform:uppercase;letter-spacing:.04em}'+
  '.nl-resume-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;margin-top:6px}'+
  '.nl-resume-grille div{display:flex;justify-content:space-between;gap:6px;padding:5px 9px;background:rgba(10,6,32,.65);border:1px solid rgba(150,120,255,.35);border-radius:8px}'+
  '@media(max-width:700px){.nl-v1{padding:12px 8px 16px;border-radius:16px}.nl-grille{padding-left:22px;gap:14px}.nl-nom{font-size:13px}.nl-barre::before{left:-20px;width:22px;top:60px}}';

/* Totaux placés dans les NGU (Norman, 2026-10-09) : un cadre pour l'énergie, un second pour la magie quand elle est débloquée. */
function totauxHtml_(j){
  var AL=window.__SOREAL_IDLE_ALLOC_V1__;
  if(!AL||typeof AL.compteur!=='function')return '';
  var ng=ngus_(j);
  return '<div class="nl-ligne nl-totaux">'+AL.compteur('energy','ngu')+(ng&&ng.magicUnlocked?AL.compteur('magic','ngu'):'')+'</div>';
}

function barreOutilsHtml_(j){
  var el=document.getElementById('sorealIdleAugInputV1');
  /* Le texte déjà dans le champ n'est repris que s'il appartient à CETTE page (redessin des NGU) : arrivant d'un autre menu, le champ encore présent est celui de l'autre page, et son nombre prenait la place de celui des NGU (Norman, 2026-11-01). */
  var valeur=el&&el.value&&el.closest&&el.closest('.nl-v1')?el.value:String(typeof window.__lireMontantAugmentIdleV1__==='function'?window.__lireMontantAugmentIdleV1__():125);
  var lib=libre_(j,onglet);
  return '<div class="nl-barre-outils">'+
    '<div class="soreal-idle-bt-entree-v1 nl-ligne"><div class="nl-ligne-input"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" inputmode="decimal" value="'+esc_(valeur)+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l’énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__&amp;&amp;window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)">'+
      '<span data-nl-libre-label>'+(onglet==='magic'?'Magie libre':'Énergie libre')+' : <b id="sorealIdleNguLibreV1">'+format_(lib)+'</b> '+(onglet==='magic'?'✨':'⚡')+'</span></div></div>'+
    '<div class="soreal-idle-bt-groupe-v1" data-bt-groupe-v1="'+(onglet==='magic'?'magic':'energy')+'">'+
    '<div class="nl-ligne" data-nl-plafond="1"><span>'+(onglet==='magic'?'🔮 Plafond de magie':'⚡ Plafond d’énergie')+'</span>'+
      '<button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',1)">Max</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',.5)">1/2</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',.25)">1/4</button></div>'+
    '<div class="nl-ligne">'+
      '<span>💤 Idle</span><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'idle\',.5)">1/2</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'idle\',.25)">1/4</button>'+
      '<button type="button" class="nl-large" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.vider(window.__SOREAL_IDLE_NGU_LABO_V1__.ongletCourant())">Tout retirer</button></div>'+
    '</div>'+
    totauxHtml_(j)+
  '</div>';
}

function page(j){
  var H=H_();
  var sys=systemeNgu_(j);
  if(!sys||!sys.state||!sys.state.unlocked){
    return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
  }
  var ng=ngus_(j);
  var magieOk=Boolean(ng.magicUnlocked);
  if(!magieOk&&onglet==='magic')onglet='energy';
  var liste=listeCourante_(j);
  var ancre=typeof j.__recuPerfV1==='number'?j.__recuPerfV1:(typeof performance!=='undefined'?performance.now():0);
  var nomPalier={normal:'Normal',evil:'Evil',sadistic:'Sadistic'};
  var paliers=Array.isArray(ng.activeTiers)?ng.activeTiers:['normal'];
  var courant=ng.tier||'normal';
  var chips=paliers.length>1?'<div class="nl-paliers"><span>Palier</span>'+paliers.map(function(t){
    var actif=t===courant;
    return '<button type="button" class="nl-btn'+(actif?' actif':'')+'" '+(actif?'disabled':'onclick="window.__actionMetaV47__({action:\'setNguTier\',tier:\''+esc_(t)+'\'})"')+'>'+esc_(nomPalier[t]||t)+'</button>';
  }).join('')+'</div>':'<div class="nl-paliers"><span>Palier : '+esc_(nomPalier[courant]||courant)+'</span></div>';
  var fx=ng.effects||{};
  var ratio=function(v){return 'x'+format_(Math.max(1,nombre_(v)),2);};
  /* Anti-spoil : les effets des NGU de magie (EXP, Number, Yggdrasil, Time Machine) n'apparaissent qu'une fois la magie découverte. */
  var resume=[
    ['⚔️ Attack/Defense',ratio(fx.attackDefense)],['🗺️ Adventure',ratio(fx.adventure)],['🪙 Gold',ratio(fx.gold)],['🎲 Drop',ratio(fx.dropChance)],
    ['⭐ PP',ratio(fx.pp)],['🦾 Augments',ratio(fx.augments)],['💻 Wandoos',ratio(fx.wandoosSpeed)],
    ['⏳ Respawn','-'+(nombre_(fx.respawnReduction)*100).toFixed(1).replace('.',',')+' %']
  ].concat(magieOk?[['✨ EXP',ratio(fx.exp)],['🔢 Nombre',ratio(fx.number)],['🌱 Yggdrasil',ratio(fx.yggdrasil)],['⏱️ Time Machine',ratio(fx.timeMachine)]]:[])
  .map(function(x){return '<div>'+x[0]+'<b>'+x[1]+'</b></div>';}).join('');
  var avance=ng.advance||{};
  /* Le ciel d'un onglet ne s'éclaire que par SES machines (Norman, 2026-11-03 : « j'ai retiré toute la magie du NGU magie et pourtant les aurores boréales continuent ainsi que les étoiles ») : onglet Magie = les NGU de magie seulement ; onglet Énergie = ceux d'énergie. */
  var lueurPage_=lueurDe_((ng.tiers&&ng.tiers[ng.tier||'normal']||[]).filter(function(n){return n.resource===onglet&&(n.resource!=='magic'||magieOk);}).map(partDe_));
  function section(res){
    var tuyaux=liste.filter(function(n){return n.resource===res;}).map(function(n){return barreHtml_(n,ancre);}).join('');
    return '<div class="nl-section" data-nl-section="'+res+'"'+(onglet===res?'':' hidden')+'>'+
      '<label class="nl-avance"><input type="checkbox" '+(avance[res]?'checked ':'')+'onchange="window.__SOREAL_IDLE_NGU_LABO_V1__.avance(\''+res+'\',this.checked)"> Faire suivre '+(res==='magic'?'la magie':'l’énergie')+'</label>'+
      '<div class="nl-grille">'+tuyaux+'</div>'+
    '</div>';
  }
  var nbOuvertes_=liste.filter(function(n){return n.resource==='energy'&&nombre_(n.allocation)>0;}).length;
  var nbEnergie_=liste.filter(function(n){return n.resource==='energy';}).length;
  var html=
    '<style>'+CSS+'</style>'+
    '<div class="nl-v1" data-nl-racine data-nl-onglet="'+onglet+'" data-nl-actif="'+(liste.some(function(n){return nombre_(n.allocation)>0;})?'1':'0')+'" data-nl-niv="'+nivDe_(lueurPage_)+'" data-nl-ouvert="'+(nbOuvertes_>0?'1':'0')+'" data-nl-tout="'+(nbOuvertes_>0&&nbOuvertes_===nbEnergie_?'1':'0')+'" style="--nl-lueur:'+lueurPage_.toFixed(3)+';--nl-sol:'+solDe_(nbOuvertes_)+'">'+astresHtml_(onglet,nivDe_(lueurPage_))+
      '<div class="nl-haut">'+
        '<button type="button" class="nl-btn" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.aide()">Je fais quoi ?</button>'+
        (magieOk?'<button type="button" class="nl-btn" data-nl-onglet-btn onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.onglet(window.__SOREAL_IDLE_NGU_LABO_V1__.ongletCourant()===\'magic\'?\'energy\':\'magic\')">'+(onglet==='magic'?'Vers les NGU d’énergie':'Vers les NGU de magie')+'</button>':'')+
      '</div>'+
      '<div class="nl-aide" id="sorealIdleNguAideV1"'+(aideOuverte?'':' hidden')+'>'+
        '<p><b>C’est quoi ?</b> Les NGU sont des entraîneurs : tu leur confies de l’énergie (et de la magie), ils font le sport pour toi. Chaque tuyau se remplit de lumière : quand il est plein, le NGU gagne un niveau et son bonus augmente.</p>'+
        '<ol>'+
          '<li><b>Place de l’énergie.</b> Dans un tuyau, avec +. La quantité est celle de la case Input (Max, 1/2 et 1/4 la remplissent), et − la retire.</li>'+
          '<li><b>Chacun son énergie.</b> Les NGU avancent en même temps, chacun avec sa propre énergie : plus tu en donnes, plus son tuyau se remplit vite.</li>'+
          '<li><b>Cible.</b> Le niveau à atteindre. Dès qu’il est atteint, l’énergie du NGU te revient (0 = aucun objectif).</li>'+
          '<li><b>Faire suivre l’énergie.</b> Quand un NGU atteint sa cible, son énergie passe automatiquement au NGU suivant, comme un relais.</li>'+
          '<li><b>Renaissance.</b> Les niveaux persistent à travers les Renaissances ; l’énergie et la magie placées te sont rendues à la Renaissance.</li>'+
          (paliers.length>1?'<li><b>Paliers.</b> Un seul palier reçoit de l’énergie et de la magie à la fois ; les effets des paliers débloqués se multiplient.</li>':'')+
        '</ol>'+
      '</div>'+
      chips+
      barreOutilsHtml_(j)+
      section('energy')+
      (magieOk?section('magic'):'')+
      '<details class="nl-resume"'+(resumeOuvert?' open':'')+' ontoggle="window.__SOREAL_IDLE_NGU_LABO_V1__.resume(this.open)"><summary>Effets de tous tes NGU</summary><div class="nl-resume-grille">'+resume+'</div></details>'+
    '</div>';
  demarrer_();
  return html;
}

/* ---------- vie des tuyaux : progression rejouée en direct ---------- */
function tick_(){
  var racine=document.querySelector('[data-nl-racine]');
  if(!racine){arreter_();return;}
  var maintenant=typeof performance!=='undefined'?performance.now():0;
  attacherMesure_(racine);
  var solMesure=racine.querySelector(':scope>.nl-soleil');if(solMesure&&!solMesure.__nlH)mesurerHaut_(racine);
  /* Textes et ciel : toutes les 100 ms suffisent ; le liquide, lui, est mis à jour à chaque image. */
  var complet=maintenant-dernierComplet>=100;
  if(complet){
  dernierComplet=maintenant;
  /* Les étoiles du fond scintillent dès qu'un tuyau reçoit de l'énergie ou de la magie. */
  var actif=Array.prototype.some.call(racine.querySelectorAll('.nl-section[data-nl-section="'+(racine.getAttribute('data-nl-onglet')||'energy')+'"] [data-nl-ngu]'),function(f){return Number(f.dataset.nlSpl)>0;})?'1':'0';
  if(racine.getAttribute('data-nl-actif')!==actif)racine.setAttribute('data-nl-actif',actif);
  /* Niveau de lumière du ciel : 0 rien, 1/2 la machine tourne, 1 elle est CAP ; moyenne de toutes les machines affichées (énergie et magie). */
  var ongletCiel=racine.getAttribute('data-nl-onglet')||'energy';
  var parts=Array.prototype.map.call(racine.querySelectorAll('.nl-section[data-nl-section="'+ongletCiel+'"] [data-nl-ngu]'),function(f){return f.classList.contains('pleine')?1:(Number(f.dataset.nlSpl)>0?.5:0);});
  var lueur=lueurDe_(parts),niv=String(nivDe_(lueur));
  if(racine.getAttribute('data-nl-niv')!==niv){racine.setAttribute('data-nl-niv',niv);cielSync_(racine,true);}
  var lv=lueur.toFixed(3);
  if(racine.style.getPropertyValue('--nl-lueur')!==lv)racine.style.setProperty('--nl-lueur',lv);
  }
  var H=H_();
  Array.prototype.forEach.call(racine.querySelectorAll('[data-nl-ngu]'),function(f){
    var d=f.dataset;
    var spl=Number(d.nlSpl);
    if(!(spl>0)||f.closest('[hidden]'))return;
    var n0=Number(d.nlN),cible=Number(d.nlCible);
    if(cible>0&&n0>=cible)return;
    var ecoule=Math.max(0,(maintenant-Number(d.nlT0))/1000);
    var total=Number(d.nlP)+ecoule/spl;
    var gagnes=Math.floor(total);
    var frac=total-gagnes;
    if(spl<0.04){frac=1;gagnes=Math.floor(ecoule*Math.min(50,1/spl));}
    var niveau=n0+gagnes;
    if(cible>0&&niveau>cible)niveau=cible;
    var liq=f.querySelector('[data-nl-fill]');
    if(liq){
      /* La barre touche le bout avant de repartir (Norman, 2026-11-01) : sur un cycle court, la dernière image peinte avant le retour à 0 montrait 90 % ; les derniers ~40 ms du cycle restent pleins. */
      var v=Math.round(Math.min(1,frac/(1-Math.min(.15,Math.max(.004,.04/spl))))*500)/500;
      if(String(v)!==liq.getAttribute('data-nl-v')){
        liq.setAttribute('data-nl-v',String(v));
        liq.style.transform='scaleX('+v+')';
        var pct=f.querySelector('[data-nl-pct]');
        if(pct)pct.textContent=Math.round(v*100)+' %';
      }
    }
    if(!complet)return;
    var eta=f.querySelector('[data-nl-eta]');
    if(eta){
      var texteEta=etaTexte_(spl,frac,cible>0&&niveau>=cible);
      if(eta.__nlTexte!==texteEta){eta.__nlTexte=texteEta;eta.innerHTML=texteEta;}
    }
    var t=f.querySelector('[data-nl-niv]');
    if(t&&niveau!==Number(t.getAttribute('data-nl-v')||n0)){
      t.setAttribute('data-nl-v',String(niveau));
      t.textContent=format_(niveau);
    }
  });
}
/* Le fond d'étoiles défile avec les tuyaux (Norman, 2026-10-08 : plus de décalage de profondeur, trop gourmand en ressources). */
/* Le volet « Effets de tous tes NGU » garde son état d'ouverture : la page se redessine toutes les quelques secondes et le refermait aussitôt. */
var resumeOuvert=false;
/* « Je fais quoi ? » reste ouvert tant qu'on ne le ferme pas : la page se redessine toutes les quelques secondes et le refermait avant la fin de la lecture. */
var aideOuverte=false;
/*
 * Les tuyaux avancent à chaque image (Norman, 2026-10-10 : « dans NGU ça n'est pas fluide ») : une horloge à 10 images par seconde (setInterval 100 ms) faisait sauter le liquide par à-coups. La boucle suit maintenant
 * l'écran (requestAnimationFrame, en pause quand la page est cachée) ; seuls le liquide se met à jour à chaque image, le reste (textes, niveau de lumière du ciel) toutes les 100 ms.
 */
var rafId=0,dernierComplet=0;
function boucle_(){
  rafId=0;
  if(!document.querySelector('[data-nl-racine]')){timer=0;return;}
  tick_();
  rafId=requestAnimationFrame(boucle_);
}
function demarrer_(){
  if(timer)return;
  if(typeof requestAnimationFrame==='function'){timer=1;rafId=requestAnimationFrame(boucle_);}
  else timer=setInterval(function(){dernierComplet=0;tick_();},100);
}
function arreter_(){
  if(rafId){cancelAnimationFrame(rafId);rafId=0;}
  else if(timer&&timer!==1)clearInterval(timer);
  timer=0;
}

/* ---------- actions ---------- */
function systemeAlloc_(j,res,delta){
  var s=systemeNgu_(j);
  if(s&&s.state&&s.state.allocation)s.state.allocation[res]=Math.max(0,nombre_(s.state.allocation[res])+delta);
}
/* Repart la progression d'un tuyau du moment présent (après un changement d'énergie : nouvelle vitesse, même niveau de liquide). */
function reancrer_(f,splNouveau){
  var d=f.dataset;
  var spl=Number(d.nlSpl);
  var maintenant=typeof performance!=='undefined'?performance.now():0;
  if(spl>0){
    var ecoule=Math.max(0,(maintenant-Number(d.nlT0))/1000);
    var total=Number(d.nlP)+ecoule/spl;
    d.nlN=String(Number(d.nlN)+Math.floor(total));
    d.nlP=String(Math.max(0,Math.min(0.999999,total-Math.floor(total))));
  }
  d.nlT0=String(maintenant);
  d.nlSpl=String(splNouveau>0?splNouveau:0);
}
function ajuster(id,mode){
  var H=H_();
  var j=H&&H.getIdleEtat?H.getIdleEtat():null;
  var n=nguDe_(j,id);
  if(!n)return;
  var res=n.resource;
  var courant=Math.max(0,Math.floor(nombre_(n.allocation)));
  var lib=libre_(j,res);
  var valeur=mode==='zero'?0:mode==='max'?courant+Math.floor(lib):(mode==='plus'?courant+Math.min(pas_(),Math.floor(lib)):Math.max(0,courant-pas_()));
  var delta=valeur-courant;
  if(delta===0)return;
  if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_((mode==='moins'||mode==='zero')?'btMinus':'btPlus');
  /* Vitesse proportionnelle à l'énergie : sans allocation avant, on attend la réponse du serveur pour la durée d'un niveau. */
  var f=document.querySelector('[data-nl-ngu="'+id+'"]');
  var spl=Number(n.secondsPerLevel)||0;
  var splNouveau=courant>0&&valeur>0&&spl>0?spl*courant/valeur:0;
  n.allocation=valeur;
  if(spl>0&&valeur>0&&courant>0)n.secondsPerLevel=splNouveau;
  else if(valeur<=0)n.secondsPerLevel=null;
  systemeAlloc_(j,res,delta);
  if(res==='magic'){var m=ressourceMagie_(j);if(m)m.current=Math.max(0,nombre_(m.current)-delta);}
  else j.energie=Math.max(0,nombre_(j.energie)-delta);
  if(f){
    reancrer_(f,splNouveau);
    f.classList.toggle('actif',valeur>0);
    var a=f.querySelector('[data-nl-alloc]');
    if(a)a.textContent=format_(valeur);
  }
  majLibre_(j);
  if(H.rafraichirEnergieEtBoutonsIdleV9_)H.rafraichirEnergieEtBoutonsIdleV9_();
  envoyer_({action:'allocateNgu',ngu:id,value:valeur});
}
function majLibre_(j){
  var el=document.getElementById('sorealIdleNguLibreV1');
  if(el)el.textContent=format_(libre_(j,onglet));
}
function vider(res){
  var H=H_();
  var j=H&&H.getIdleEtat?H.getIdleEtat():null;
  listeCourante_(j).forEach(function(n){
    if(n.resource!==res)return;
    var courant=Math.max(0,Math.floor(nombre_(n.allocation)));
    if(courant<=0)return;
    n.allocation=0;n.secondsPerLevel=null;
    systemeAlloc_(j,res,-courant);
    if(res==='magic'){var m=ressourceMagie_(j);if(m)m.current=nombre_(m.current)+courant;}
    else j.energie=nombre_(j.energie)+courant;
    var f=document.querySelector('[data-nl-ngu="'+n.id+'"]');
    if(f){reancrer_(f,0);f.classList.remove('actif');var a=f.querySelector('[data-nl-alloc]');if(a)a.textContent=format_(0);}
    envoyer_({action:'allocateNgu',ngu:n.id,value:0});
  });
  majLibre_(j);
  if(H&&H.rafraichirEnergieEtBoutonsIdleV9_)H.rafraichirEnergieEtBoutonsIdleV9_();
}
function cible(id,valeur){
  var n=Math.max(0,Math.floor(Number(valeur)||0));
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var d=nguDe_(j,id);
  if(d)d.target=n;
  var f=document.querySelector('[data-nl-ngu="'+id+'"]');
  if(f)f.dataset.nlCible=String(n);
  envoyer_({action:'setNguTarget',ngu:id,value:n});
}
function avance(res,coche){
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var ng=ngus_(j);
  if(ng){ng.advance=Object.assign({},ng.advance,{[res]:Boolean(coche)});}
  envoyer_({action:'setNguAdvance',resource:res,enabled:Boolean(coche)});
}
function changerOnglet(res){
  onglet=res==='magic'?'magic':'energy';
  var racine=document.querySelector('[data-nl-racine]');
  if(!racine)return;
  racine.setAttribute('data-nl-onglet',onglet);
  cielSync_(racine,false);
  Array.prototype.forEach.call(racine.querySelectorAll('[data-nl-section]'),function(s){s.hidden=s.getAttribute('data-nl-section')!==onglet;});
  var b=racine.querySelector('[data-nl-onglet-btn]');
  if(b)b.textContent=onglet==='magic'?'Vers les NGU d’énergie':'Vers les NGU de magie';
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var lab=racine.querySelector('[data-nl-libre-label]');
  if(lab)lab.innerHTML=(onglet==='magic'?'Magie libre':'Énergie libre')+' : <b id="sorealIdleNguLibreV1">'+format_(libre_(j,onglet))+'</b> '+(onglet==='magic'?'✨':'⚡');
  var presets=racine.querySelector('.nl-barre-outils [data-nl-plafond]>span');
  if(presets)presets.textContent=onglet==='magic'?'🔮 Plafond de magie':'⚡ Plafond d’énergie';
}
function preset(source,fraction){
  var H=H_();
  var j=H&&H.getIdleEtat?H.getIdleEtat():null;
  var input=document.getElementById('sorealIdleAugInputV1');
  if(!input)return;
  var base=source==='idle'?libre_(j,onglet):plafond_(j,onglet);
  var valeur=Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0)));
  input.value=String(valeur);
  if(typeof window.__saisirMontantAugmentIdleV1__==='function')window.__saisirMontantAugmentIdleV1__(valeur);
}

/*
 * Après chaque redessin de la page par la synchro (toutes les 4 s) : le redessin remet un instant le liquide, les pourcentages, les niveaux et les durées aux valeurs du serveur, puis la boucle d'animation les corrige à l'image
 * suivante — un petit saut de tous les tuyaux à intervalle régulier (Norman, 2026-10-15 : « la page ngu se redessine à intervalle régulier »). On rejoue donc tout de suite la boucle, dans la même tâche : aucune image n'est
 * peinte entre le redessin et la correction.
 */
function apresRedessin_(){
  try{
    var racine=document.querySelector('[data-nl-racine]');
    if(!racine)return;
    Array.prototype.forEach.call(racine.querySelectorAll('[data-nl-eta]'),function(e){e.__nlTexte=null;});
    dernierComplet=0;
    tick_();
  }catch(_e){}
}
/* Inscription à la règle « aucun redessin visible » (voir soreal-idle-ui.js, rafraichirMenuRacineIdleV28_ et AGENTS.md règle n°4). */
(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(apresRedessin_);
window.__SOREAL_IDLE_NGU_LABO_V1__={
  apresRedessin:apresRedessin_,
  resume:function(o){resumeOuvert=Boolean(o);},
  page:page,
  couleurs:COULEURS,
  aide:function(){var el=document.getElementById('sorealIdleNguAideV1');if(el){el.hidden=!el.hidden;aideOuverte=!el.hidden;}},
  ajuster:ajuster,cible:cible,avance:avance,onglet:changerOnglet,vider:vider,preset:preset,
  ongletCourant:function(){return onglet;},
  /* Pour les tests : la progression d'un tuyau à un instant donné (mêmes formules que tick_). */
  progression:function(p,spl,n0,ecouleSecondes){
    var total=p+ecouleSecondes/spl,gagnes=Math.floor(total);
    return spl<0.04?{fraction:1,niveau:n0+Math.floor(ecouleSecondes*Math.min(50,1/spl))}:{fraction:total-gagnes,niveau:n0+gagnes};
  }
};
})();
