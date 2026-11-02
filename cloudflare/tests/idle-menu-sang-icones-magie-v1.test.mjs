// Norman (2026-11-02) : « les icônes du menu Magie du sang ne bougeaient pas alors que de la magie est placée dedans » :
// la magie du sang est placée PAR RITUEL (systemes.systems[bloodMagic].state.data.rituals[id].magic), pas dans allocation.magic ;
// le bouton du menu doit donc « travailler » dès qu'un rituel a de la magie, et seulement dans ce cas.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const src = fs.readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8").replace(/\r\n/g, "\n");
const debut = src.indexOf("function idleMenuAlimenteV1_(id,j){");
assert.ok(debut > 0, "fonction trouvée");
const fin = src.indexOf("\n      }\n", debut);
const code = src.slice(debut, fin + "\n      }\n".length);
assert.ok(code.includes("if(id==='sang')return enSomme(donnees.rituals,['magic']);"), "branche du menu Magie du sang");

const ctx = {
  menusAnimesAchetesIdleV1_: () => true,
  IDLE_MENUS_ETATS_V1: {},
  IDLE_MENUS_ALIMENTABLES_V1: { sang: 1, ngu: 1 },
  REG: { IDLE_SYSTEME_PAR_MENU_V1: { sang: "bloodMagic", ngu: "ngu" } },
  idleNombre_: (v) => Number(v) || 0,
};
vm.createContext(ctx);
vm.runInContext(code + "\nthis.f=idleMenuAlimenteV1_;", ctx);

const etat = (rituals, allocation) => ({ systemes: { systems: [{ id: "bloodMagic", state: { allocation: allocation || {}, data: { rituals } } }] } });
assert.equal(ctx.f("sang", etat({ tack: { magic: 0 }, pins: { magic: 0 } })), false, "aucune magie placée : le menu ne travaille pas");
assert.equal(ctx.f("sang", etat({ tack: { magic: 0 }, pins: { magic: 5 } })), true, "magie placée dans un rituel : le menu travaille");
assert.equal(ctx.f("sang", etat({ tack: { magic: 1e12 } })), true, "grande quantité de magie placée : le menu travaille");
assert.equal(ctx.f("sang", etat({}, { magic: 3 })), true, "ancienne allocation commune : toujours reconnue");
assert.equal(ctx.f("sang", { systemes: { systems: [] } }), false, "système absent : pas d'animation");
console.log("idle-menu-sang-icones-magie-v1 : OK");
