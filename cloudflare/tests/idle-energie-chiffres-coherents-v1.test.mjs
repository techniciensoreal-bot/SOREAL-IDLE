import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « le serveur n'avait que 45 472 d'énergie (l'écran en montrait 65 476) ; je ne veux pas ça, je veux que les chiffres soient justes ». Basic Training et les autres systèmes envoient leurs répartitions
 * par deux canaux différés ; une réponse de l'un écrasait l'énergie libre sans tenir compte de ce que l'écran venait de placer ou retirer par l'autre.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const a = ui.indexOf("      function sommeAllocBasicTrainingJoueurIdleV1_(joueur){");
const b = ui.lastIndexOf("      if(typeof window!=='undefined'){", ui.indexOf("        window.__energieLibreCoherenteIdleV1__=energieLibreCoherenteIdleV1_;"));
assert.ok(a > 0 && b > a);
const idleEntier_ = (v) => Math.max(0, Math.floor(Number(v) || 0));
const idleNombre_ = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function monde(localBT, localMeta) {
  return new Function("idleEntier_", "idleNombre_", "totalAllocationBasicTrainingIdleV120_", "allocationMetaEnergieIdleV1_", ui.slice(a, b) + "\nreturn energieLibreCoherenteIdleV1_;")(idleEntier_, idleNombre_, () => localBT, () => localMeta);
}
const joueur = (libre, bt, meta) => ({ energie: libre, basicTraining: { skills: [{ unlocked: true, allocation: bt }, { unlocked: false, allocation: 999 }] }, systemes: { systems: [{ state: { allocation: { energy: meta } } }] } });

// Tout est d'accord : l'énergie libre du serveur.
assert.equal(monde(5000, 12000)(joueur(30000, 5000, 12000)), 30000);
// Le serveur a encore 20 000 de plus placés dans Basic Training que l'écran (retrait pas encore arrivé) : l'écran garde SA répartition, donc l'énergie libre qui va avec (la même énergie totale partout).
assert.equal(monde(33000, 12000)(joueur(45472, 53000, 12000)), 65472);
// L'écran a placé 10 000 de plus dans un autre système que le serveur ne sait pas encore : l'énergie libre les déduit.
assert.equal(monde(5000, 22000)(joueur(30000, 5000, 12000)), 20000);
// Jamais négative, jamais décimale ; une compétence verrouillée ne compte pas (même règle que l'écran).
assert.equal(monde(0, 90000)(joueur(1000, 0, 0)), 0);
assert.equal(monde(0, 0)(joueur(1000.9, 0, 0)), 1000);

// Câblage : la réponse de Basic Training et la réponse des autres systèmes utilisent cette énergie ; plus de message d'erreur au joueur.
assert.ok(ui.includes("const energieCoherente=energieLibreCoherenteIdleV1_(joueur);") && ui.includes("cle==='energie'?energieCoherente:joueur[cle]"), "réponse de Basic Training");
assert.ok(meta.includes("if(typeof window.__energieLibreCoherenteIdleV1__==='function')j.energie=window.__energieLibreCoherenteIdleV1__(srv);") && meta.includes("srv.energie=libre;"), "réponse des autres systèmes (confirmation et divergence)");
assert.ok(!meta.includes("Le serveur n’avait que") && meta.includes("console.warn('[IDLE] répartition d’énergie ajustée par le serveur'"), "trace en console seulement");
assert.ok(meta.includes("srv.basicTraining=j.basicTraining;"), "une répartition de Basic Training en route n'est pas écrasée");

// Ordre d'envoi : le canal qui a modifié en premier part en premier ; une attente périmée (4 s) est ignorée.
assert.ok(ui.includes("const idleAllocOrdreV1={n:0,bt:0,btAt:0,meta:0,metaAt:0};"));
assert.ok(ui.includes("if(idleAllocOrdreV1.meta&&idleAllocOrdreV1.meta<idleAllocOrdreV1.bt&&Date.now()-idleAllocOrdreV1.metaAt<4000){\n          programmerEnvoiBasicTrainingIdleV120_(40);"), "Basic Training attend une répartition plus ancienne des autres systèmes");
assert.ok(meta.includes("if(O&&O.bt&&O.bt<O.meta&&Date.now()-O.btAt<4000){planifierAllocRapideV1_(40);return;}"), "les autres systèmes attendent une répartition plus ancienne de Basic Training");
assert.ok(ui.includes("if(!idleBasicTrainingDirtyV120)idleAllocOrdreV1.bt=0;") && meta.includes("else if(O2()&&!R.timer)O2().meta=0;"), "chaque canal libère son rang quand il a tout envoyé");
console.log("idle-energie-chiffres-coherents-v1: OK");
