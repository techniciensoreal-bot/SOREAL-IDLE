import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import fs from "node:fs";
const lire=(p)=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const e=lire("public/modules/titans-combat-ecran-v1.js");
const t=lire("public/modules/titans-v1.js");
const ui=lireUiComplet();
/* écran d'annonce */
assert.ok(e.includes("function annoncer(")&&e.includes("ttnAnnonceV1")&&e.includes("Un Titan approche"));
assert.ok(t.includes("ecran.annoncer(")&&t.indexOf("ecran.annoncer(")<t.indexOf("marquerVu(id);",t.indexOf("function lancerCombatTitan_")),"l'annonce capture 'vu' avant marquerVu");
assert.ok(e.includes("finirAnnonce()"));
/* plein écran : alignement à chaque passage, html verrouillé */
assert.ok(e.includes("html.tcv-actif{overflow:hidden")&&e.includes("dernierDefil"));
/* Grand Arbre corrompu qui grandit */
assert.ok(e.includes("function echelleTitan(")&&e.includes("'t2'"));
/* sortie du titan vaincu */
assert.ok(e.includes("tcvAdieu")&&e.includes("rotate(3240deg)")&&e.includes("sera de retour dans"));
assert.ok(ui.includes("soreal-titan-vaincu"));
assert.ok(t.includes("infoRetour:infoRetour"));
/* bouton Aventure depuis les Titans */
assert.ok(/nouveauMenu==='aventure'&&idleMenuActifV28==='aventure'&&idleVueAventureV1==='titans'/.test(ui));
console.log("idle-titan-arrivee-depart-v1: OK");
/* page Titans : redessinée toute seule quand un titan est vaincu (le chrono apparaît sans changer de menu) */
assert.ok(t.includes("signatureRendue")&&t.includes("__titansRafraichirPageIdleV1__")&&ui.includes("__titansEtatJoueurIdleV1__"));
/* plein écran de l'interface (menus de gauche visibles), boutons Aventure/Titans assortis, fuite annoncée dans « En direct » */
assert.ok(e.includes("function zoneInterface()")&&e.includes("--tcv-left")&&e.includes("soreal-idle-bascule-aventure-v1 .soreal-idle-expand-button-v25"));
const adv=lire("src/idle-adventure-v47.js"),flux=lire("src/idle-flux-v1.js"),fx=lire("public/modules/flux-v1.js"),mp=lire("public/modules/meta-progression-v130.js");
assert.ok(adv.includes('fluxTitanV1(s,"flees",s.fight.titanId)'));
assert.ok(flux.includes("titanFuites")&&flux.includes('"titanFuite"'));
assert.ok(fx.includes("case 'titanFuite'")&&fx.includes("pris la fuite contre"));
/* objet Wandoos : message de réussite et de refus */
assert.ok(mp.includes("consumeWandoosCopy")&&mp.includes("messageCopieWandoosV1_")&&mp.includes("Pas assez de niveaux sur cette copie"));
/* un fond par titan : dégradés CSS purs, statiques (aucune image, aucune animation) ; boutons Aventure/Titans à la couleur du titan */
assert.ok(e.includes("function fondTitan(id)")&&e.includes("function poserFond(el,id)")&&e.includes("--tcv-c"));
{
  const bloc=e.slice(e.indexOf("function fondTitan(id)"),e.indexOf("function poserFond(el,id)"));
  for(const id of ["t1","t2","t3","t4","t5","t6","t7","nerd","godmother","hungers","lobster","amalgamate","tippi","traitor"]) assert.ok(new RegExp("\n    "+id+":\{base:").test(bloc),"fond du titan "+id);
  assert.ok(!/url\(|@keyframes|animation/.test(bloc),"fonds : ni image ni animation");
}
/* Renaissance : la page remonte tout en haut (pas seulement la borne) */
assert.ok(ui.includes("const toutEnHaut=function(){const ban=document.querySelector('.soreal-idle-hero-banner-v95')") && ui.includes("setTimeout(toutEnHaut,700);") && !ui.includes("borneRenaissance.scrollIntoView"), "après une Renaissance : page scrollée au maximum en haut");
/* NGU : le redessin de la synchro ne laisse plus passer une image avec les valeurs du serveur (la boucle d'animation est rejouée dans la même tâche) */
{
  const ngu = lire("public/modules/ngu-labo-v1.js");
  assert.ok(ngu.includes("function apresRedessin_()") && ngu.includes("e.__nlTexte=null;") && ngu.includes("dernierComplet=0;\n    tick_();") && ngu.includes("apresRedessin:apresRedessin_"));
  assert.ok(ui.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__") && ngu.includes("push(apresRedessin_)"));
}
