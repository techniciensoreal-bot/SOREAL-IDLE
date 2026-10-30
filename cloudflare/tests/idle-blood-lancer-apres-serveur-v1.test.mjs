import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Bouton « Lancer » de Blood Magic (Norman, 2026-10-18) : le rituel (son + orage) ne part qu'APRÈS l'acceptation du serveur ; le bouton reste inactif sous le sang minimum du sort
 * (celui que le serveur impose) ; un refus affiche « Pas assez de sang pour lancer ce sort. ».
 */
const lire = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const blood = lire("../public/modules/blood-magic-v1.js");
const meta = lire("../public/modules/meta-progression-v130.js");
const moteur = lire("../src/idle-ngu-systemes.js");

// Le clic n'appelle plus le rituel : seulement l'action au serveur.
const bouton = blood.slice(blood.indexOf("soreal-idle-blood-lancer-v1"), blood.indexOf("soreal-idle-blood-lancer-v1") + 600);
assert.ok(bouton.includes("window.__lancerSortBloodIdleV1__(") && !bouton.includes("__sonSortBloodIdleV1__") && !bouton.includes("tout mon sang"), "le bouton ouvre la confirmation (sans chiffre figé) ; ni son ni orage avant le serveur");
// Confirmation (2026-10-30) : le montant est lu au clic (valeur vivante), l'action part seulement au bouton « Lancer le sort ».
const fn = blood.slice(blood.indexOf("window.__lancerSortBloodIdleV1__=function"), blood.indexOf("window.__lancerSortBloodIdleV1__=function") + 2600);
assert.ok(fn.includes("sangAfficheV1_()") && fn.includes("lancer.onclick=function(){fermer();window.__actionMetaV47__({action:'castBloodSpell',spell:id});}") && !fn.slice(0, fn.indexOf("lancer.onclick")).includes("castBloodSpell"), "montant vivant au clic ; castBloodSpell seulement après confirmation");
assert.ok(blood.includes('bm-sang-total-v1">🩸 Sang collecté<b id="sorealIdleBloodTotalV1">'), "tuile « Sang collecté » mise en avant");
// Le rituel part dans la réponse acceptée.
assert.match(meta, /payload\.action==='castBloodSpell'\)\{\s*try\{if\(typeof window\.__sonSortBloodIdleV1__==='function'\)window\.__sonSortBloodIdleV1__\(String\(payload\.spell/, "rituel joué à la réponse acceptée");
assert.ok(meta.indexOf("window.__sonSortBloodIdleV1__(String(payload.spell") > meta.indexOf("window.__SOREAL_IDLE_META_HOST_V130__.appelerProgressionIdleCloudflareV1_("), "dans le rappel de la réponse");
// Refus : message clair.
assert.ok(meta.includes("/SANG_INSUFFISANT/.test(String(res.message||''))") && meta.includes("Pas assez de sang pour lancer ce sort."), "refus : « Pas assez de sang pour lancer ce sort. »");
// Mêmes minimums que le serveur.
const serveur = {};
for (const m of moteur.slice(moteur.indexOf("const BLOOD_SPELL_MINIMUMS_V1"), moteur.indexOf("});", moteur.indexOf("const BLOOD_SPELL_MINIMUMS_V1"))).matchAll(/^\s+(\w+): ([\d_]+)/gm)) serveur[m[1]] = Number(m[2]);
const client = Function("return (" + /const IDLE_SANG_MINI_SORTS_V1=(\{[^}]*\});/.exec(blood)[1] + ")")();
for (const id of ["numberBoost", "ironPill", "bloodSpaghetti", "counterfeitGold"]) assert.equal(client[id], serveur[id], "minimum de " + id + " identique au serveur");
assert.equal(client.leeches, 5e22, "dernier sort : 5e22 (IDLE_THE_END_LAST_SPELL_BLOOD_V1)");
assert.ok(blood.includes("const peutLancer=blood>=sangMini&&!recharge;"), "bouton inactif sous le minimum du sort");
console.log("idle-blood-lancer-apres-serveur-v1: OK");
