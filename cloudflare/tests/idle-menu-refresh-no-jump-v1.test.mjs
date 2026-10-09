import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Quand on ouvre et ferme le coffre, il y a un effet de clignotement. Il y en a plusieurs
 * dans le jeu. Quand on fait un achat parfois, quand on coche un filtre. Part à la traque de ces sauts d'images et
 * neutralise-les. La page ne doit jamais faire de saut ou se déplacer sauf pendant les tutoriaux ou si c'est
 * explicitement demandé. »
 *
 * Cause (coffre, onglets Collection/Shop/Classement, notes de mise à jour, encart Infos, pseudo, interrupteurs
 * admin) : chacun de ces basculements remplaçait .soreal-idle-page-root-v28 en entier
 * (root.innerHTML=contenuMenuIdleV28_(idleEtat)) SANS AUCUNE protection de défilement -- contrairement au rendu
 * complet (rendreIdleEtat_) qui gèle déjà la hauteur du document pendant le remplacement et restaure le défilement
 * après coup. Une page qui se raccourcit (ex. fermer le Coffre) faisait alors redescendre le défilement du
 * navigateur avant que rien ne le rétablisse : le saut/clignotement décrit.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
/* Le moteur de rendu sur place vit dans son module depuis le 2026-10-07 (lot 2a du chantier de nettoyage). */
const morphSrc = readFileSync("cloudflare/public/modules/morph-v1.js", "utf8");

// 1. Le seul remplacement brut de .soreal-idle-page-root-v28 restant est celui, protégé, de la fonction partagée.
{
  const occurrences = ui.split("root.innerHTML=contenuMenuIdleV28_(idleEtat);").length - 1;
  assert.equal(occurrences, 1, "un seul remplacement brut doit rester : celui, protégé, de rafraichirMenuRacineIdleV28_");
}

// 2. La fonction partagée applique la même protection que le rendu complet (gel de hauteur + ancre de défilement).
{
  const start = ui.indexOf("function rafraichirMenuRacineIdleV28_(){");
  const end = ui.indexOf("\n      }", ui.indexOf("root.innerHTML=contenuMenuIdleV28_(idleEtat);", start));
  const fn = ui.slice(start, end);
  assert.ok(start >= 0, "rafraichirMenuRacineIdleV28_ doit exister");
  assert.ok(
    fn.includes("const xAvant=window.scrollX||0;") &&
    fn.includes("const yAvant=window.scrollY||0;") &&
    fn.includes("ancreSacIdleV1_()") && fn.includes("ancreClicIdleV1_()") &&
    fn.includes("document.body.style.minHeight=hauteurAvant+'px';") &&
    fn.includes("requestAnimationFrame(function(){") &&
    fn.includes("window.scrollTo(xAvant,yAvant);") &&
    fn.includes("restaurerAncreSacIdleV1_(ancreAvant,xAvant,yAvant);"),
    "la protection anti-saut (gel de hauteur, ancre du sac, restauration en rAF) doit être complète"
  );
}

// 3. Tous les basculements de panneau connus (dont le Coffre, explicitement nommé par Norman) utilisent la fonction
//    partagée protégée, plus jamais un remplacement brut.
for (const fonction of [
  "changerOngletCollectionIdleV1_",
  "changerPageCollectionEquipementV1_",
  "changerPageCoffreV1_",
  "toggleCoffreOuvertAdventureIdleV1_",
  "changerOngletShopIdleV1_",
  "changerOngletClassementIdleV1_",
  "basculerNotesMajIdleV1_",
  "toggleInfoOuvertIdleV1_"
]) {
  const start = ui.indexOf("function " + fonction + "(");
  assert.ok(start >= 0, "fonction manquante: " + fonction);
  const end = ui.indexOf("\n      }", start);
  const corps = ui.slice(start, end);
  assert.ok(corps.includes("rafraichirMenuRacineIdleV28_();"), fonction + " doit utiliser la fonction partagée protégée");
  assert.ok(!corps.includes(".innerHTML=contenuMenuIdleV28_"), fonction + " ne doit plus remplacer le contenu brut sans protection");
}

// 4. Comportement réel de la protection anti-saut (exécuté hors navigateur, sans vrai DOM).
{
  const start = ui.indexOf("function rafraichirMenuRacineIdleV28_(){");
  const end = ui.indexOf("\n      }", ui.indexOf("root.innerHTML=contenuMenuIdleV28_(idleEtat);", start)) + "\n      }".length;
  const fnSrc = ui.slice(start, end);

  let scrollToAppels = [];
  let minHeightApplique = "";
  let rafCallback = null;
  const rootNode = { innerHTML: "" };
  const bodyNode = { style: {} };
  Object.defineProperty(bodyNode.style, "minHeight", {
    get(){ return minHeightApplique; },
    set(v){ minHeightApplique = v; }
  });
  const fakeDocument = {
    body: bodyNode,
    documentElement: { scrollHeight: 4000 },
    querySelector(sel){ return sel === ".soreal-idle-page-root-v28" ? rootNode : null; }
  };
  const fakeWindow = {
    scrollX: 12,
    scrollY: 900,
    scrollTo(x, y){ scrollToAppels.push([x, y]); }
  };
  const sandbox = new Function(
    "document", "window", "requestAnimationFrame", "clearTimeout", "setTimeout",
    "idleEtat", "contenuMenuIdleV28_", "ancreSacIdleV1_", "restaurerAncreSacIdleV1_", "ancreClicIdleV1_", "restaurerAncreClicIdleV1_", "installerMorphIdleV1_",
    fnSrc + "\nreturn rafraichirMenuRacineIdleV28_;"
  )(
    fakeDocument,
    fakeWindow,
    function(cb){ rafCallback = cb; },
    function(){},
    function(){},
    { id: "joueur" },
    function(){ return "<div>nouveau contenu plus court</div>"; },
    function(){ return { haut: 42 }; },
    function(ancre, x, y){ sandbox.dernierAncre = [ancre, x, y]; },
    function(){ return null; },
    function(){ return false; },
    function(){}
  );

  sandbox();
  assert.equal(rootNode.innerHTML, "<div>nouveau contenu plus court</div>", "le contenu du menu doit être remplacé");
  assert.equal(minHeightApplique, "4000px", "la hauteur du document doit être gelée pendant le remplacement, comme pour le rendu complet");
  assert.ok(typeof rafCallback === "function", "la restauration doit être différée en requestAnimationFrame");

  rafCallback();
  assert.deepEqual(scrollToAppels, [[12, 900]], "le défilement (X et Y) doit être restauré exactement à sa valeur d'avant remplacement");
}

// 5. Aucun saut de page au clic (Norman, 2026-10-07) : rendu sur place, blocs des autres modules gardés, ancre sur l'élément cliqué, épingle de clic.
{
  assert.ok(morphSrc.includes("function morpherHtmlIdleV1_(element,html){") && morphSrc.includes("function installerMorphIdleV1_(element){") && ui.includes("function installerMorphIdleV1_(element){"), "rendu sur place (morph) présent");
  assert.ok(ui.includes("installerMorphIdleV1_(root);\n        root.innerHTML=contenuMenuIdleV28_(idleEtat);") && ui.includes("installerMorphIdleV1_(document.getElementById('app'));"), "page entière et contenu de menu rendus sur place");
  assert.ok(morphSrc.includes('hasAttribute("data-morph-garder")'), "les blocs posés par d'autres modules sont gardés");
  assert.ok(readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8").includes('block.setAttribute("data-morph-garder","1");') && readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8").includes("bloc.setAttribute('data-morph-garder','1');"), "scène d'aventure et bloc d'inventaire gardés");
  assert.ok(ui.includes("function demarrerPinClicIdleV1_(el){") && ui.includes("if(Math.abs(dy)>1){window.scrollBy(0,dy);pin.stables=0;}") && ui.includes("['wheel','touchstart','touchmove','keydown']"), "épingle de clic, arrêtée par un défilement du joueur");
}

// 6. Automatisation de l'inventaire en interrupteurs à bascule (Norman, 2026-10-07) ; « Action au clic » retiré.
{
  const auto = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");
  assert.ok(auto.includes('class="sw-v1') && auto.includes('class="sw-boitier"') && auto.includes('class="sw-led"') && auto.includes(".sw-v1 .sw-in:checked~.sw-led{"), "interrupteur à bascule avec lumière verte");
  assert.ok(!auto.includes("👆 Action au clic") && !auto.includes("Tous les boosts dans le Cube"), "plus de menu « Action au clic » ; plus de bouton du Cube (supprimé le 2026-10-09, le clic droit suffit)");
  assert.ok(!auto.includes('<input type="checkbox" \'+(coche'), "plus de case à cocher brute");
}

// 7. Réponse du serveur en retard après un clic (Norman, 2026-10-07 : 10K, 2 s, 10K : la barre saute en arrière) : le visuel local est reporté sur l'état qui arrive.
{
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(meta.includes("const reporterVisuels=function(){") && meta.includes("j.__augmentationsVisualV215.src=j.systemes&&j.systemes.augmentations;"), "le visuel local des Augments est reporté sur l'état en retard");
  assert.ok(meta.includes("reporterVisuels();\n            try{recalculerAugmentLocalIdleV1_(j,p.pair,Boolean(p.upgrade),val);}catch(_e){}"), "et recalculé avec la valeur voulue");
  assert.ok(meta.includes("payload.action==='allocateRitual'||payload.action==='allocateNgu')R.voulu.set(cle,payload)") && meta.includes("}else if(p.action==='allocateRitual'){"), "la Magic de rituel voulue est réappliquée aussi");
}

// 8. Victoire de boss : les allocations des autres menus partent avant la demande de confirmation (Norman, 2026-10-07 : boss suivant qui ne se charge pas).
{
  assert.ok(ui.includes("const apresAllocationsMeta=function(suite){") && ui.includes("apresAllocationsMeta(function(){"), "la victoire attend les allocations rapides en attente");
  assert.ok(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8").includes("window.__allocRapideEnAttenteIdleV1__=function(){"), "la file d'allocations rapides est lisible");
}

// 9. Les blocs posés par les modules ne suivent pas dans une autre page, et gardent leur ordre (Norman, 2026-10-07 : scène d'Aventure sous Entraînement avancé, inventaire au-dessus du combat).
{
  assert.ok(morphSrc.includes("(a.getAttribute('data-menu')||'')!==(b.getAttribute('data-menu')||'')") && morphSrc.includes("querySelectorAll('[data-morph-garder]')"), "changement de menu : les blocs gardés sont retirés");
  assert.ok(morphSrc.includes('g.getAttribute("data-morph-avant")') && readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8").includes('data-morph-avant'), "la scène reste juste avant le panneau du joueur");
}

console.log("idle-menu-refresh-no-jump-v1: OK");
