import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_NGU_SYSTEMS, IDLE_NGU_EARLY_GAME_TIMELINE } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-04) : « réarrange les menus chez tout le monde pour qu'ils suivent l'ordre où on les obtient ; les gens pourront les réarranger par la suite. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_MENUS_V1=[")) + 2);
const ids = new Function(bloc + "return IDLE_MENUS_V1;")().map((m) => m.id);
const pos = (id) => ids.indexOf(id);
assert.equal(new Set(ids).size, ids.length, "aucun menu en double");

// 1. Départ, puis ordre des boss réels (seuils lus dans le moteur, pas recopiés de mémoire).
assert.deepEqual(ids.slice(0, 3), ["entrainement", "combat", "shop"]);
const boss = Object.fromEntries(IDLE_NGU_EARLY_GAME_TIMELINE.map((t) => [t.id, t.boss]));
const seuil = Object.fromEntries(IDLE_NGU_SYSTEMS.filter((d) => d.unlock && d.unlock.bosses).map((d) => [d.id, d.unlock.bosses]));
assert.ok(pos("aventure") < pos("augmentations") && boss.adventure < seuil.augmentations);
assert.ok(pos("augmentations") < pos("machine") && seuil.augmentations < seuil.timeMachine);
assert.ok(pos("machine") < pos("sang") && seuil.timeMachine < seuil.bloodMagic);
assert.ok(pos("sang") < pos("challenges") && seuil.bloodMagic < seuil.challenges);
assert.equal(pos("challenges") + 1, pos("titans"), "Challenges et Titans au même boss");
// 2. Les systèmes donnés par les objets des titans suivent l'ordre des titans (GRB 58 -> Grand Corrupted Tree 66 -> Jake 82 -> UUG 100 -> Walderp 116 -> Greasy Nerd 125 -> The Beast 132 -> The Godmother 166).
const ordre = ["titans", "ngu", "yggdrasil", "diggers", "beards", "macguffins", "hacks", "questing", "quirks", "wishes", "cards", "cooking"];
for (let i = 1; i < ordre.length; i += 1) assert.ok(pos(ordre[i - 1]) < pos(ordre[i]), `${ordre[i - 1]} avant ${ordre[i]}`);
assert.ok(pos("wandoos") > pos("titans") && pos("wandoos") < pos("yggdrasil"), "Wandoos : copie garantie du premier titan");
// 3. Clé du Ciel (boss 48) : ITOPOD puis Perks avant les titans (58).
assert.ok(pos("tower") < pos("challenges") && pos("perks") === pos("tower") + 1);
// 4. Achievements, Classement, Chat, Settings (et Admin) viennent toujours APRÈS tous les autres menus, donc après le dernier menu débloqué (Norman, 2026-10-04) ; Collection suit son déblocage (boss 4).
assert.deepEqual(ids.slice(-5), ["succes", "classement", "chat", "parametres", "admin"]);
assert.ok(pos("bestiaire") > pos("renaissance") && pos("bestiaire") < pos("augmentations"), "Collection : boss 4, avec Adventure et Rebirth");
// Un menu qui se débloque s'intercale AVANT ce groupe final, même avec un rangement enregistré.
const ordonner = new Function(ui.slice(ui.indexOf("function ordonnerMenusIdleV1_(defauts,ordre){"), ui.indexOf("function menusOrdonnesIdleV1_(j){")) + "return ordonnerMenusIdleV1_;")();
const defauts = ids.map((id) => ({ id }));
const avant = ["entrainement", "combat", "shop", "aventure", "succes", "classement", "chat", "parametres"];
const apres = ordonner(defauts, avant).map((m) => m.id);
assert.ok(apres.indexOf("renaissance") < apres.indexOf("succes") && apres.indexOf("augmentations") < apres.indexOf("succes"), "un menu débloqué après coup passe avant le groupe final");

// 5. Remise à zéro de l'ancien rangement, une seule fois, pour tout le monde (serveur) ; le cache local change de clé.
assert.ok(rt.includes("menuOrdreVersion:2,") && rt.includes("Math.floor(nombreSorealIdle_(s.menuOrdreVersion,0))>=2"), "un rangement d'avant la version 2 est oublié");
assert.ok(rt.includes("menuOrdre:Array.isArray(ordre) ? ordre : [], menuOrdreVersion: 2"), "un rangement enregistré après la remise à zéro est conservé");
assert.ok(ui.includes("'soreal_idle_menu_ordre_v2_'+generationJoueurIdleV75_(j)") && !ui.includes("'soreal_idle_menu_ordre_v1_'"), "ancien cache local abandonné");
console.log("idle-menus-ordre-obtention-v1: OK");
