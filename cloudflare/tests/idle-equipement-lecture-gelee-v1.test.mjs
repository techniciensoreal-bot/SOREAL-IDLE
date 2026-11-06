import assert from "node:assert/strict";
import fs from "node:fs";
import { idleAdventureEquipmentStatsV47, idleAdventureEquipmentStatsLectureV47, idleEquipementEffectifV1, idleEquipementEffectifLectureV1, idleAdventureMemoNouvelleRequeteV1 } from "../src/idle-adventure-v47.js";

/*
 * Plan design/ARCHITECTURE-CIBLE.md, étape 1 (2026-11-06) : la variante LECTURE de l'équipement renvoie un objet PARTAGÉ et GELÉ (aucune copie profonde) ; les mêmes valeurs que la variante habituelle ; une modification lève une erreur franche ;
 * les copies des autres appelants restent modifiables sans jamais abîmer le mémo.
 */
const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-2.json", "utf8"));
const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
const adv = JSON.parse(ligne[37]).metaNgu.adventure;
const profondGele = (o) => !o || typeof o !== "object" || (Object.isFrozen(o) && Object.values(o).every(profondGele));
idleAdventureMemoNouvelleRequeteV1();
const copie = idleAdventureEquipmentStatsV47(adv), lecture = idleAdventureEquipmentStatsLectureV47(adv);
assert.equal(JSON.stringify(lecture), JSON.stringify(copie), "mêmes valeurs");
assert.ok(profondGele(lecture), "résultat gelé en profondeur");
assert.ok(!Object.isFrozen(copie), "la variante habituelle reste une copie modifiable");
assert.throws(() => { "use strict"; lecture.power = 1; }, TypeError, "modifier le résultat partagé lève une erreur");
assert.throws(() => { "use strict"; lecture.specials.nouveau = 1; }, TypeError, "modifier un sous-objet aussi");
assert.equal(idleAdventureEquipmentStatsLectureV47(adv), lecture, "résultat partagé (même objet), sans copie profonde");
const p = copie.power; copie.power = 123456789; copie.specials.x = 1;
assert.equal(idleAdventureEquipmentStatsLectureV47(adv).power, p, "modifier une copie n'abîme pas le mémo partagé");
assert.equal(idleAdventureEquipmentStatsV47(adv).power, p, "ni les copies suivantes");
/* l'équipement effectif : même règle du défi sans équipement */
const etat = { adventure: adv, challenge: { active: "" } };
assert.equal(JSON.stringify(idleEquipementEffectifLectureV1(etat)), JSON.stringify(idleEquipementEffectifV1(etat)));
const sans = { adventure: adv, challenge: { active: "noEquipment" } };
assert.equal(JSON.stringify(idleEquipementEffectifLectureV1(sans)), JSON.stringify(idleEquipementEffectifV1(sans)), "défi sans équipement : tout à zéro, comme avant");
assert.equal(idleEquipementEffectifLectureV1(sans).power, 0);
console.log("idle-equipement-lecture-gelee-v1: OK");
