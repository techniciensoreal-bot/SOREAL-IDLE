import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-05) : « dans Blood Magic, un compteur avec la magie allouée à chaque rituel, avec l'animation sur le chiffre comme dans les autres menus quand on ajoute ou retire de la magie ». */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = meta.slice(meta.indexOf("      function pageBloodMagicIdleV48_(j){"), meta.indexOf("        const sortsHtml="));
assert.ok(page.includes(`id="sorealIdleBloodRitualAllocV1_'+idHtml+'" data-idle-alloc-pop-v1="1">'+H.formatGrandNombreIdleV70_(active?allocMagicActuelle:0)`), "un compteur par rituel : le rituel actif porte l'allocation, les autres 0");
// Mise à jour sur place pour le rituel actif (aucun redessin) ; l'animation vient du crochet d'alloc-pop-v1.
const maj = meta.slice(meta.indexOf("      function rafraichirAllocationBloodMagicIdleV1_(value){"), meta.indexOf("      function recalculerBloodLocalIdleV1_"));
assert.ok(maj.includes("sorealIdleBloodRitualAllocV1_'+actif") && maj.includes("if(compteur&&compteur.textContent!==texte)"));
const pop = readFileSync("cloudflare/public/modules/alloc-pop-v1.js", "utf8");
assert.ok(pop.includes("[data-idle-alloc-pop-v1]") && pop.includes(".soreal-idle-bt-actions-v120 button"), "le crochet et les boutons des rituels déclenchent l'animation");
assert.ok(readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8").includes(".soreal-idle-blood-alloc-ligne-v1"));
console.log("idle-blood-magic-compteur-rituel-v1: OK");

// Norman (2026-10-05) : « si j'enlève toute la magie, la barre continue de monter » : la barre est figée (animation annulée) dès qu'il n'y a plus de Magic, à sa progression du moment, et un redessin la garde là.
{
  const rec = meta.slice(meta.indexOf("      function recalculerBloodLocalIdleV1_(j,alloc){"), meta.indexOf("      function ajusterBloodMagicIdleV1_(mode){"));
  assert.ok(rec.includes("window.__bloodFigeV1={ritual:vue.activeRitual,pct:pct};") && rec.includes("barreRituel.__idleAugAnimationV217.cancel()") && rec.includes("barreRituel.style.transform='scaleX('+pct+')';"), "barre figée quand la Magic tombe à 0");
  assert.ok(rec.includes("window.__bloodFigeV1=null;"), "repart quand on remet de la Magic");
  assert.ok(page.includes("figee&&figee.ritual===def.id?figee.pct:0"), "un redessin garde la barre au point figé");
}
// Norman (2026-10-06) : « quand je retire toute l'énergie d'une barre de Blood Magic, même si la barre est entamée, elle ne doit plus saigner » : sans Magic la barre se fige ET ne saigne plus ; elle saigne de nouveau avec de la Magic.
{
  const i = meta.indexOf("      function saignerPisteIdleV1_(barre,oui){");
  const fn = meta.slice(i, meta.indexOf("      function ajusterBloodMagicIdleV1_(mode){"));
  const gouttesHtml = meta.slice(meta.indexOf("const SANG_GOUTTES_HTML_V1='") + 28, meta.indexOf("';", meta.indexOf("const SANG_GOUTTES_HTML_V1='")));
  assert.equal(gouttesHtml.split("sang-g-v1").length - 1, 6, "six gouttes");
  const saigner = new Function("SANG_GOUTTES_HTML_V1", fn + "; return saignerPisteIdleV1_;");
  const classes = new Set(["soreal-idle-bt-track-v120", "saigne-v1"]);
  let gouttes = [{ parentNode: null }, { parentNode: null }];
  const piste = { classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) }, querySelectorAll: () => gouttes, removeChild: (g) => { gouttes = gouttes.filter((x) => x !== g); } };
  gouttes.forEach((g) => { g.parentNode = piste; });
  const barre = { parentNode: piste, insertAdjacentHTML: (_pos, html) => { gouttes = new Array(html.split("sang-g-v1").length - 1).fill(0).map(() => ({ parentNode: piste })); } };
  const f = saigner(gouttesHtml);
  f(barre, false);
  assert.ok(!classes.has("saigne-v1") && gouttes.length === 0, "plus de Magic : la piste ne saigne plus (classe et gouttes retirées)");
  f(barre, true);
  assert.ok(classes.has("saigne-v1") && gouttes.length === 6, "Magic remise : la piste saigne de nouveau (classe et six gouttes)");
  assert.ok(rec_ok(meta), "la bascule est branchée dans le recalcul local");
  function rec_ok(m) { const r = m.slice(m.indexOf("      function recalculerBloodLocalIdleV1_(j,alloc){"), m.indexOf("      function saignerPisteIdleV1_")); return r.includes("saignerPisteIdleV1_(barreRituel,true)") && r.includes("saignerPisteIdleV1_(barreRituel,false)"); }
}
console.log("idle-blood-magic-barre-figee-v1: OK");

// Magie libre (Norman, 2026-10-05) : le compteur se met à jour au clic, comme la Magie allouée.
{
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(meta.includes('<b id="sorealIdleBloodLibreV1">') && meta.includes("document.getElementById('sorealIdleBloodLibreV1')"), "Magie libre mise à jour sur place");
}
