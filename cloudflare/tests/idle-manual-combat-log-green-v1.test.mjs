import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Quand je passe en mode manuel, je ne vois pas l'indication de mes
 * attaques dans le journal de combat. Je veux une phrase en verte. "Redrum lance soin" avec
 * explications. Pareil quand je pars des dégats. Le journal de combat doit vraiment nous
 * indiquer ce qu'il se passe. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. CSS : le type 'manual' existe et est vert (distinct de 'player', réservé à l'attaque idle automatique).
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.match(css, /\.soreal-idle-adventure-log-line-v1\.manual\{color:#7ee787\}/, "le type 'manual' doit être vert");

// 2. Attaque manuelle (attaqueManuelleAdventureIdleV3_) : log de type 'manual', avec le nom du joueur.
{
  const bloc = ui.slice(ui.indexOf("function attaqueManuelleAdventureIdleV3_("), ui.indexOf("function utiliserCompetenceAdventureIdleV3_("));
  assert.match(bloc, /ajouterLogAventureIdleV1_\(\s*\n?\s*'manual',/, "l'attaque manuelle doit logger en type 'manual' (vert), pas 'player' (bleu, réservé à l'idle auto)");
  assert.match(bloc, /idleEtat&&idleEtat\.nom\|\|'Vous'\)\+' lance '/, "la ligne doit nommer le joueur (\"<Nom> lance <Compétence>\")");
}

// 3. Heal (appliquerHealAdventureIdleV4_, utilisé par les skills "heal" et "ohShit") : log de type 'manual',
//    montant réellement soigné, nom de la compétence (def.label, "Soin" par défaut).
{
  const bloc = ui.slice(ui.indexOf("function appliquerHealAdventureIdleV4_("), ui.indexOf("function appliquerParalyzeAdventureIdleV4_("));
  assert.match(bloc, /ajouterLogAventureIdleV1_\(\s*\n?\s*'manual',/, "le soin doit logger en type 'manual' (vert)");
  assert.match(bloc, /lance '\+\(def&&def\.label\?def\.label:'Soin'\)\+' : \+'\+soigne\+' PV !'/, "la ligne doit donner l'explication : nom, compétence, montant soigné");
  // Le montant loggé doit être le soin RÉEL (borné au max, jamais un 15% brut qui dépasserait le plafond).
  assert.match(bloc, /soigne=Math\.round\(fight\.playerHp-avant\)/, "le montant loggé doit venir du PV réellement gagné (après plafonnement à playerHpMax)");
}

// 4. Les deux sites d'appel du heal (skills "heal" et "ohShit") passent bien `def`, sinon le label ne sera jamais montré.
{
  const occurrences = (ui.match(/appliquerHealAdventureIdleV4_\(a,fight,def\);/g) || []).length;
  assert.equal(occurrences, 2, "les deux déclencheurs de soin (heal, ohShit) doivent passer def pour nommer la compétence");
}

console.log("idle-manual-combat-log-green-v1: OK");
