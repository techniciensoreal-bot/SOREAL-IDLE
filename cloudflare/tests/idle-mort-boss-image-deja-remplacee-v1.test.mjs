import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-29) : « il arrive encore souvent qu'aucune animation de mort ne soit utilisée pour la mort du boss ; quand ça arrive, on voit l'image du suivant une demi-seconde, puis noir, puis le boss apparaît en fondu, sans son ».
 * Quand l'état du boss suivant arrive avant la fin de la barre de vie, l'image de l'hôte est déjà celle du suivant : le boss tué est celui du COMBAT (numéro + adresse d'image gardés au début du combat).
 */
const src = readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
assert.ok(src.includes("REG.idleCombatImageV1=imC.getAttribute('src')||''"), "l'adresse de l'image du boss combattu est gardée au début du combat");
assert.ok(src.includes("const dejaRemplaceV1=bossCombattuV1>0&&idHoteV1>0&&idHoteV1!==bossCombattuV1;"), "image de l'hôte déjà remplacée détectée par le numéro du combat");
assert.ok(src.includes("copie.src=adresseMortV1") && src.includes("naturalWidth>0"), "la mort se joue sur une copie de l'image du boss tué");
assert.ok(src.includes("if(imageHote&&!dejaRemplaceV1){\n          imageHote.classList.add(") || src.includes("if(imageHote&&!dejaRemplaceV1){\r\n          imageHote.classList.add("), "la classe de mort ne touche jamais l'image du boss suivant (noir)");
assert.ok(src.includes("idMortV1=bossCombattuV1>0?bossCombattuV1:idHoteV1;"), "le boss tué est celui du combat : l'apparition part tout de suite sur le suivant (pas d'attente de 6 s)");
assert.ok(src.includes("(dejaRemplaceV1||idleEntier_(REG.idleEtat&&REG.idleEtat.bossSelection||0)===bossCombattuV1)"), "le boss suivant déjà sélectionné n'empêche plus la mort");
assert.ok(!src.includes("idMortV1=appId&&appId.idDe&&image?appId.idDe(image):0"), "plus de numéro lu sur l'image (celle du suivant)");
console.log("idle-mort-boss-image-deja-remplacee-v1: OK");
