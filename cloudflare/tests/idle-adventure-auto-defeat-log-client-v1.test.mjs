import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Parfois, je meurs en mode aventure et dans le journal de combat, ma mort n'apparaît
 * pas. » Complète idle-adventure-auto-defeat-log-v1 (le champ serveur) côté client : verifierDefaiteAutoAventureIdleV1_
 * doit pousser une ligne de journal quand une réponse serveur NOUVELLE (serveurTs inédit) signale une défaite de
 * combat automatique, et ne jamais la pousser deux fois pour le même lot (ré-rendus sans nouvelle synchro).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const debut = ui.indexOf("let idleDerniereSyncAutoDefaiteAventureV1_=0;");
const fin = ui.indexOf("\n      }\n", ui.indexOf("function verifierDefaiteAutoAventureIdleV1_(j){", debut)) + "\n      }\n".length;
assert.ok(debut > 0 && fin > debut, "bloc introuvable");
const source = ui.slice(debut, fin);

function idleNombre_(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function idleEntier_(v) {
  return Math.trunc(idleNombre_(v));
}

function fabriquer() {
  const appels = [];
  const sandbox = {
    idleNombre_,
    idleEntier_,
    ajouterLogAventureIdleV1_: (type, texte) => appels.push({ type, texte })
  };
  vm.runInNewContext(source, sandbox);
  return { verifier: sandbox.verifierDefaiteAutoAventureIdleV1_, appels };
}

// --- Aucune défaite -> jamais de ligne. ---
{
  const { verifier, appels } = fabriquer();
  verifier({ serveurTs: 1000, autoAventureHorsLigne: { combats: 3, victoires: 3, defaites: 0 } });
  verifier({ serveurTs: 1000 }); // pas de champ du tout
  verifier(null);
  assert.equal(appels.length, 0, "sans défaite, aucune ligne ajoutée au journal");
}

// --- Une défaite -> une ligne au singulier. ---
{
  const { verifier, appels } = fabriquer();
  verifier({ serveurTs: 1000, autoAventureHorsLigne: { combats: 5, victoires: 4, defaites: 1 } });
  assert.equal(appels.length, 1);
  assert.equal(appels[0].type, "enemy");
  assert.match(appels[0].texte, /Combat automatique/);
  assert.ok(!/\d+ fois/.test(appels[0].texte), "singulier : pas de compte affiché pour une seule défaite");
}

// --- Plusieurs défaites -> une ligne, au pluriel, avec le compte. ---
{
  const { verifier, appels } = fabriquer();
  verifier({ serveurTs: 2000, autoAventureHorsLigne: { combats: 10, victoires: 6, defaites: 4 } });
  assert.equal(appels.length, 1);
  assert.match(appels[0].texte, /4 fois/);
}

// --- Un même serveurTs (ré-rendu sans nouvelle synchro) ne pousse jamais deux fois la même ligne. ---
{
  const { verifier, appels } = fabriquer();
  const payload = { serveurTs: 3000, autoAventureHorsLigne: { combats: 2, victoires: 1, defaites: 1 } };
  verifier(payload);
  verifier(payload);
  verifier({ serveurTs: 3000, autoAventureHorsLigne: { combats: 2, victoires: 1, defaites: 1 } }); // même ts, nouvel objet
  assert.equal(appels.length, 1, "un seul ajout pour tout un lot de rendus sur le même serveurTs");
}

// --- Une VRAIE nouvelle synchro (serveurTs différent), même avec une nouvelle défaite, pousse une nouvelle ligne. ---
{
  const { verifier, appels } = fabriquer();
  verifier({ serveurTs: 4000, autoAventureHorsLigne: { combats: 1, victoires: 0, defaites: 1 } });
  verifier({ serveurTs: 4001, autoAventureHorsLigne: { combats: 1, victoires: 0, defaites: 1 } });
  assert.equal(appels.length, 2);
}

console.log("idle-adventure-auto-defeat-log-client-v1: OK");
