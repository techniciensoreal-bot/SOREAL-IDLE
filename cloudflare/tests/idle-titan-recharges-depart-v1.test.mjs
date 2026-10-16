import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : « quand on active le mode manuel du combat, les CD de chacune des attaques doivent être en cours : si une a un CD de 20 s, elle ne sera disponible que 20 s après le début du combat » (combat de titan) ;
 * « la petite photo flottante à côté du menu Titans doit être un ? avec la même règle que la page Titans ». */
const ui = lireUiComplet().replace(/\r\n/g, "\n");
const titans = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8").replace(/\r\n/g, "\n");

const debut = ui.indexOf("const identite=identiteFightAdventureIdleV2_(fight);");
const bloc = ui.slice(debut, debut + 2600);
assert.ok(bloc.includes("if(fight.titanId){") && bloc.includes("IDLE_ADVENTURE_MANUAL_ATTACKS_V3.concat(IDLE_ADVENTURE_MANUAL_DEFENSE_V3,IDLE_ADVENTURE_ADVANCED_SKILLS_V4)"), "au départ d'un combat de titan, tous les raccourcis entrent en recharge");
assert.ok(bloc.includes("const fin=maintenantTick+cooldownDureeAdventureIdleV4_(def,a);") && bloc.includes("if(def.id==='move69')return;"), "durée complète de recharge (équipements compris), Move 69 exclu");
assert.ok(bloc.indexOf("if(fight.titanId){") > bloc.indexOf("idleAdventureFightIdentityV2=identite;"), "uniquement au début du combat (changement d'identité), pas à chaque tick");
{ // règle pure
  const cd = { strong: 4000, ultimate: 15000, offensiveBuff: 45000 };
  const t0 = 1_000_000, etat = {};
  for (const k of Object.keys(cd)) etat[k] = Math.max(etat[k] || 0, t0 + cd[k]);
  const restant = (k, now) => Math.max(0, etat[k] - now);
  assert.equal(restant("strong", t0 + 3000), 1000, "Forte : encore 1 s après 3 s de combat");
  assert.equal(restant("ultimate", t0 + 14_999), 1, "Ultime : pas disponible avant 15 s");
  assert.equal(restant("ultimate", t0 + 15_000), 0, "Ultime : disponible après 15 s de combat");
}
// Icône flottante du bouton Titans : même règle que la carte (un « ? » tant que le titan n'a jamais été combattu)
const icone = titans.slice(titans.indexOf("function icone(j){"), titans.indexOf("function icone(j){") + 900);
assert.ok(icone.includes("if(!titanVu(t))return") && icone.includes('<b class="ttn-point"') && icone.indexOf("if(!titanVu(t))") < icone.indexOf("urlImage(t,palier)"), "icône : « ? » avant toute image, la même règle titanVu que la carte");
assert.ok(titans.includes("(titanVu(t)\n        ?'<div class=\"ttn-portrait\"><img id=\"ttnImg_'"), "carte : image seulement pour un titan vu (même fonction)");
console.log("idle-titan-recharges-depart-v1: OK");
