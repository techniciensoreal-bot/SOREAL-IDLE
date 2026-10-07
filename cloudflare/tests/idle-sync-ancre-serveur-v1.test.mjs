// Norman (2026-10-07) : « les barres d'Augmentations recalculent encore à chaque montée — en ligne ». Une synchro prend 1 à 2 s de calcul serveur : l'état est celui du DÉBUT du calcul.
// Le serveur donne cet instant (__serveurAtV1) ; le client en déduit l'âge exact de l'état au lieu de supposer « reçu à l'instant, moins un demi aller-retour de 45 ms ».
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const coordinateur = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
assert.ok(coordinateur.includes("const debutCalculMsV1 = Date.now();") && coordinateur.includes("result.joueur.__serveurAtV1 = debutCalculMsV1"), "le serveur date le début du calcul dans la réponse (pas dans l'état du moteur)");
assert.ok(coordinateur.indexOf("const debutCalculMsV1") < coordinateur.indexOf("this.runStandaloneSessionOperationV1(p)"), "l'instant est pris AVANT le calcul");

const pont = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
assert.ok(pont.includes("data.joueur.__recuPerfV1=calerRecuPerfV1_(data.joueur,performance.now(),Date.now())"), "la réception passe par le calage");
const debut = pont.indexOf("  function calerRecuPerfV1_(joueur,perfMaintenant,dateMaintenant){");
const fonction = pont.slice(debut, pont.indexOf("  window.__SOREAL_IDLE_CALER_RECU_V1__"));
const fabrique = (etat) => new Function("heureServeurV1", fonction + "; return calerRecuPerfV1_;")(etat);

// Horloge du serveur en avance de 5 000 ms sur celle du client ; aller-retour le plus court : 40 ms.
const etat = { connu: true, ecart: 5000, rtt: 40 };
const caler = fabrique(etat);
// Le serveur a commencé à calculer à l'instant serveur 105 000 (= local 100 000) ; la réponse arrive à local 101 800 (1,8 s plus tard).
const joueur = { __serveurAtV1: 105000 };
const recu = caler(joueur, 20000, 101800);
// Ancre lue par le client : recu - rtt/2 = instant perf correspondant au début du calcul = 20000 - 1800.
assert.equal(recu - etat.rtt / 2, 20000 - 1800, "l'état est daté de 1,8 s avant la réception, pas de la réception");

// Sans repère fiable : ancien comportement (réception).
assert.equal(fabrique({ connu: false, ecart: 0, rtt: Infinity })(joueur, 20000, 101800), 20000, "écart d'horloge inconnu : réception");
assert.equal(caler({}, 20000, 101800), 20000, "pas d'horodatage serveur : réception");
assert.equal(caler({ __serveurAtV1: 105000 }, 20000, 99000), 20000, "âge négatif : réception");
assert.equal(caler({ __serveurAtV1: 105000 }, 20000, 140000), 20000, "âge > 30 s : réception");
console.log("idle-sync-ancre-serveur-v1: OK");
