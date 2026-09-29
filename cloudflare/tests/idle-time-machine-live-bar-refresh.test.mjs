import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

assert.match(
  ui,
  /function patcherBarresTimeMachineIdleV1_\(j\)/,
  "le client doit avoir un patch DOM dédié aux barres Time Machine"
);

assert.ok(
  ui.includes("j.systemes.timeMachineView"),
  "le patch doit lire la vue Time Machine calculée par le serveur"
);

for (const piste of ["vitesse", "or"]) {
  assert.ok(
    ui.includes("'.soreal-idle-tm-piste-v1.'+"),
    "le patch doit cibler les pistes Time Machine sans rerendre toute la page"
  );
  assert.ok(ui.includes(piste), "piste Time Machine attendue: " + piste);
}

assert.match(
  ui,
  /patcherResumeStatsIdleV28_\([\s\S]*?idleEtat[\s\S]*?\);[\s\S]*?patcherBarresTimeMachineIdleV1_\([\s\S]*?idleEtat[\s\S]*?\);/,
  "une synchro sans changement structurel doit aussi rafraîchir les barres Time Machine"
);

assert.ok(
  ui.includes("remplissage.style.width=pct.toFixed(4)+'%'"),
  "la largeur doit refléter la progression serveur avec assez de précision pour les premiers niveaux lents"
);


assert.ok(
  ui.includes("function assurerPisteMagicTimeMachineIdleV1_()"),
  "Broken Time Machine doit détecter le déblocage live de Magic"
);
assert.ok(
  ui.includes("bloodMagic.state&&") &&
  ui.includes("bloodMagic.state.unlocked"),
  "le déblocage live s'appuie sur l'état serveur Blood Magic"
);
assert.ok(
  ui.includes("'.soreal-idle-tm-piste-v1.or .soreal-idle-tm-remplissage-v1'"),
  "la garde vérifie si la piste jaune est réellement absente du DOM"
);
assert.ok(
  ui.includes("if(!pisteMagic){") &&
  ui.includes("rafraichirMenuRacineIdleV28_();"),
  "si Magic est débloquée mais la piste absente, le menu Time Machine est reconstruit"
);

console.log("idle-time-machine-live-bar-refresh: OK");
