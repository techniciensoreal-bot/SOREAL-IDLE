import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleAdventureActionV47, idleEquipementEffectifV1, idleAdventureEquipmentStatsV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-17) : « j'ai lancé le défi sans équipement mais j'ai toujours mes stats d'équipement… je veux que l'équipement ne soit plus pris en compte pendant le défi, mais qu'on puisse mettre ou enlever des pièces ;
 * les stats barrées dans le petit journal sous l'image, les pièces équipées grisées. »
 */
let adv = applyIdleAdventureActionV47(undefined, { action: "addItem", definitionId: "grb:weapon" }, { bosses: 100 }, 1000);
const id = adv.result.id || adv.result.item?.id || adv.state.inventory[0].id;
adv = applyIdleAdventureActionV47(adv.state, { action: "equip", id, slot: "weapon" }, { bosses: 100 }, 2000);
const reel = idleAdventureEquipmentStatsV47(adv.state);
assert.ok(reel.power > 0, "l'arme équipée donne de la Puissance : " + reel.power);

// 1. Hors défi : l'équipement compte. Pendant le défi : zéro partout, même avec des pièces portées.
assert.equal(idleEquipementEffectifV1({ adventure: adv.state, challenge: { active: "" } }).power, reel.power);
const bloque = idleEquipementEffectifV1({ adventure: adv.state, challenge: { active: "noEquipment" } });
assert.deepEqual([bloque.power, bloque.toughness, bloque.hp, bloque.regen, Object.keys(bloque.specials).length], [0, 0, 0, 0, 0], "le défi : aucune stat d'équipement");
assert.equal(idleEquipementEffectifV1({ adventure: adv.state, challenge: { active: "noRebirth" } }).power, reel.power, "un autre défi ne touche pas à l'équipement");

// 2. Pendant le défi on peut quand même équiper et retirer (le défi ne bloque plus le geste).
let apres = applyIdleAdventureActionV47(adv.state, { action: "unequip", id }, { bosses: 100, equipmentLocked: true }, 3000);
assert.equal(idleAdventureEquipmentStatsV47(apres.state).power, 0, "pièce retirée");
apres = applyIdleAdventureActionV47(apres.state, { action: "equip", id, slot: "weapon" }, { bosses: 100, equipmentLocked: true }, 4000);
assert.equal(idleAdventureEquipmentStatsV47(apres.state).power, reel.power, "pièce remise pendant le défi");

// 3. Branchements : le moteur passe par l'équipement effectif ; l'écran barre les stats et grise les pièces.
const lire = (p) => readFileSync("cloudflare/" + p, "utf8");
const snap = lire("src/idle-ngu-snapshot.js"), scene = lire("public/modules/adventure-scene-v79.js"), css = lire("public/soreal-idle-itopod.css"), a1 = lire("public/modules/ui-aventure-1-v1.js"), a2 = lire("public/modules/ui-aventure-2-v1.js");
assert.ok(snap.includes("const gear = defiSansEquipement ? idleEquipementEffectifV1(state) : gearReel;") && snap.includes("snap.statsEquipementBloque ="), "stats d'Aventure sans équipement + valeurs barrées envoyées");
for (const f of ["src/idle-ngu-systemes.js", "src/idle-ngu-actions.js", "src/idle-ngu-bonus.js"]) assert.ok(lire(f).includes("idleEquipementEffectifV1(state)"), f + " : équipement effectif");
assert.ok(!/idleAdventureEquipmentStatsV47\(state\.adventure\)/.test(lire("src/idle-ngu-systemes.js")) && !/idleAdventureEquipmentStatsV47\(state\.adventure\)/.test(lire("src/idle-ngu-actions.js")), "plus d'équipement brut dans ces fichiers");
assert.ok(scene.includes(".soreal-idle-v79-stat-bloque,.soreal-idle-v79-stat-cube-bloque{margin-left:0!important;text-decoration:line-through") && scene.includes(".soreal-idle-v79-stat-bloque{color:#55e188!important}") && scene.includes(".soreal-idle-v79-stat-cube-bloque{color:#a98cff!important}") && snap.includes("snap.statsCubeBloque = { power: cubeP, toughness: cubeT };") && scene.includes("statsEquipementBloque") && scene.includes("ecrireBloque_(line,key,precision)"), "stats barrées dans le petit journal");
assert.ok(css.includes("body[data-defi-sans-equip-v1] .soreal-idle-v138-paperdoll [data-occupant-id] .soreal-idle-v138-slot-icon>:not(.idle-boostpts-v1){filter:grayscale(1)") && a2.includes("toggleAttribute('data-defi-sans-equip-v1'"), "pièces équipées grisées");
assert.ok(!a1.includes("refuserEquipementDefiIdleV1_();\n          return;"), "plus de refus d'équiper côté écran");
console.log("idle-defi-sans-equipement-effectif-v1: OK");
// « Moi » : le Money Pit et les autres systèmes sont comptés dans la valeur de base (572, pas 15 (+557)) ; seuls l'équipement et le Cube restent entre parenthèses (Norman, 2026-10-17).
{
  const snapSrc = readFileSync("cloudflare/src/idle-ngu-snapshot.js", "utf8"), sceneSrc = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
  assert.ok(snapSrc.includes("snap.statsSansEquipement = {") && snapSrc.includes('idleEquipementEffectifV1({ challenge: { active: "noEquipment" } })'), "le serveur envoie les stats sans équipement ni Cube");
  assert.ok(sceneSrc.includes("var baseAff=sans>0?Math.max(base,sans):base;") && sceneSrc.includes("var bonus=Math.max(0,total-baseAff-cube);") && sceneSrc.includes("format_(baseAff,precision)"), "l'écran affiche cette valeur comme base");
  console.log("idle-defi-sans-equipement-effectif-v1 (valeur de base) : OK");
}
