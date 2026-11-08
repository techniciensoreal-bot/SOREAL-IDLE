import assert from "node:assert/strict";
import fs from "node:fs";
/* Norman (2026-11-08) : le sang monte d'un coup à chaque rituel accompli (jamais prolongé entre deux rituels) ; « Sang collecté » sous chaque rituel = valeur du moteur (somme = sang disponible). */
const b = fs.readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8");
const i = b.indexOf("function sangAfficheV1_(){"), j = b.indexOf("window.__sangAfficheV1__=sangAfficheV1_;");
const corps = b.slice(i, j);
assert.ok(corps.includes("__sangPendantV1__") && !/taux/.test(corps) && !/Math\.min\(8/.test(corps), "plus aucune extrapolation par le rythme dans le sang affiché");
assert.ok(b.includes("window.__sangRituelAfficheV1__=function(id,nAffiche)") && b.includes("r.bloodCollected") && b.includes("r.bloodGain"), "compteur de rituel = bloodCollected du moteur + complétions rejouées x bloodGain");
assert.ok(b.includes("sangTotal:(typeof window.__sangRituelAfficheV1__"), "rendu de la page : montant du moteur");
const d = fs.readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
assert.ok(d.includes("window.__sangRituelAfficheV1__(id,n)") && (d.match(/opts\.sangTotal!=null/g) || []).length === 2, "décor : le montant sous le rituel vient du moteur, à l'affichage et à chaque image");
// simulation du calcul (même formule que le module)
const pend = (srvN, nAff, gain) => Math.max(0, nAff - srvN) * gain;
assert.equal(pend(5, 5, 60000), 0, "entre deux rituels : rien ne bouge");
assert.equal(pend(5, 6, 60000), 60000, "un rituel rejoué : +60 000 d'un coup");
assert.equal(pend(6, 6, 60000), 0, "le moteur valide : la part en attente retombe, aucun double compte (le sang du moteur monte du même bloc)");
console.log("idle-sang-d-un-coup-client-v1: OK");
