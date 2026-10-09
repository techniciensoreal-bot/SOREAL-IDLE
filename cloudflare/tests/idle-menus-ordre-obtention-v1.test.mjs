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
assert.deepEqual(ids.slice(0, 3), ["entrainement", "combat", "aventure"]);
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
assert.ok(pos("tower") < pos("challenges"));
assert.equal(pos("perks"), -1, "Atouts fusionnés dans ITOPOD : plus de menu à part");
// 4. Achievements, Classement, Chat, Settings (et Admin) viennent toujours APRÈS tous les autres menus, donc après le dernier menu débloqué (Norman, 2026-10-04) ; Collection suit son déblocage (boss 4).
assert.deepEqual(ids.slice(-5), ["shop", "chroniques", "chat", "parametres", "admin"], "Boutique → Chroniques → Chat → Réglages → Admin, toujours à la fin (Norman, 2026-10-09)");
// Un menu qui se débloque s'intercale AVANT ce groupe final, même avec un rangement enregistré.
const ordonner = new Function(ui.slice(ui.indexOf("function ordonnerMenusIdleV1_(defauts,ordre){"), ui.indexOf("function menusOrdonnesIdleV1_(j){")) + "return ordonnerMenusIdleV1_;")();
const defauts = ids.map((id) => ({ id }));
const avant = ["entrainement", "combat", "aventure", "shop", "chat", "parametres"];
const apres = ordonner(defauts, avant).map((m) => m.id);
assert.ok(apres.indexOf("renaissance") < apres.indexOf("shop") && apres.indexOf("augmentations") < apres.indexOf("shop"), "un menu débloqué après coup passe avant le groupe final");

// 5. Remise à zéro de l'ancien rangement, une seule fois, pour tout le monde (serveur) ; le cache local change de clé.
assert.ok(rt.includes("menuOrdreVersion:3,") && rt.includes("Math.floor(nombreSorealIdle_(s.menuOrdreVersion,0))>=3"), "un rangement d'avant la version 3 est oublié");
assert.ok(rt.includes("menuOrdre:Array.isArray(ordre) ? ordre : [], menuOrdreVersion: 3"), "un rangement enregistré après la remise à zéro est conservé");
assert.ok(ui.includes("'soreal_idle_menu_ordre_v3_'+generationJoueurIdleV75_(j)") && !ui.includes("'soreal_idle_menu_ordre_v2_'"), "ancien cache local abandonné");
// Admin est toujours le dernier, même avec un rangement enregistré où il est ailleurs, et un menu qui se débloque ne se place jamais après lui (Norman, 2026-10-09).
{
  const rang = ["entrainement", "combat", "admin", "aventure", "shop", "chat", "parametres", "augmentations"];
  const ids2 = ordonner(defauts, rang).map((m) => m.id);
  assert.equal(ids2[ids2.length - 1], "admin", "Admin toujours en dernier");
  assert.ok(ids2.indexOf("avance") < ids2.length - 1 && ids2.indexOf("chroniques") === ids2.indexOf("shop") + 1, "nouveaux menus avant Admin ; Chroniques juste après la Boutique");
  const tout = ordonner(defauts, ids).map((m) => m.id);
  assert.deepEqual(tout.slice(-5), ["shop", "chroniques", "chat", "parametres", "admin"], "ordre par défaut des cinq derniers");
}
console.log("idle-menus-ordre-obtention-v1: OK");
