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
    fn.includes("const ancreAvant=ancreSacIdleV1_();") &&
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
    "idleEtat", "contenuMenuIdleV28_", "ancreSacIdleV1_", "restaurerAncreSacIdleV1_",
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
    function(ancre, x, y){ sandbox.dernierAncre = [ancre, x, y]; }
  );

  sandbox();
  assert.equal(rootNode.innerHTML, "<div>nouveau contenu plus court</div>", "le contenu du menu doit être remplacé");
  assert.equal(minHeightApplique, "4000px", "la hauteur du document doit être gelée pendant le remplacement, comme pour le rendu complet");
  assert.ok(typeof rafCallback === "function", "la restauration doit être différée en requestAnimationFrame");

  rafCallback();
  assert.deepEqual(scrollToAppels, [[12, 900]], "le défilement (X et Y) doit être restauré exactement à sa valeur d'avant remplacement");
}

console.log("idle-menu-refresh-no-jump-v1: OK");
