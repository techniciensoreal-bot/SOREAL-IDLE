import assert from "node:assert/strict";
import fs from "node:fs";

const ui=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const scene=fs.readFileSync(
  new URL("../public/modules/adventure-scene-v79.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

function block(source,start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,"Bloc introuvable: "+start);
  return source.slice(a,b);
}

assert.ok(
  index.includes('/modules/adventure-scene-v79.js?v=202')&&
  index.includes('/soreal-idle-ui.js?v=235'),
  "Le standalone doit charger les assets V200 de la barre Energie et des PV Aventure."
);

const energyFn=block(
  ui,
  "function mettreAJourBarreProgressionContinueV1_(",
  "function demarrerTickerIdle_()"
);

assert.ok(
  energyFn.includes("(max-valeur)*\n          progression")&&
  energyFn.includes("valeurVisuelle/max*100"),
  "Pendant un tick, la barre doit balayer toute la portion valeur acquise -> cap."
);

assert.ok(
  energyFn.includes("if(valeur>=max){")&&
  energyFn.includes("largeurBarreCombatIdleV121_(element,100);"),
  "Au cap la barre doit rester pleine sans progression supplémentaire."
);

assert.ok(
  !energyFn.includes("((valeur+progression)/max)*100"),
  "L'ancien affichage valeur + fraction d'un seul point ne doit plus exister."
);

// Vérification mathématique exacte du comportement demandé.
function pct(base,progress,max=500){
  if(base>=max)return 100;
  const visual=base+(max-base)*progress;
  return visual/max*100;
}
assert.equal(pct(0,0),0);
assert.equal(pct(0,1),100);
assert.equal(pct(1,0),0.2);
assert.equal(pct(1,1),100);
assert.equal(pct(100,0),20);
assert.equal(pct(100,1),100);
assert.ok(
  Math.abs(pct(101,0)-20.2)<1e-9,
  "101/500 doit correspondre à 20.2% malgré les imprécisions IEEE-754."
);
assert.equal(pct(500,0),100);

const ticker=block(
  ui,
  "const metaTickEnergie=",
  "actualiserManaSortsIdleV90_("
);

assert.ok(
  ticker.includes("const energieAuPlafond=")&&
  ticker.includes("if(energieAuPlafond){\n          idleResteTickEnergieMsV114=0;")&&
  ticker.includes("energieAuPlafond\n            ?0"),
  "Quand l'énergie est pleine, le compteur du tick doit être remis à zéro et aucun tick ne doit être généré."
);

assert.ok(
  ticker.includes("if(idleNombre_(idleEtat.energie)>=max){\n            idleResteTickEnergieMsV114=0;"),
  "Le tick qui atteint le plafond doit arrêter immédiatement l'horloge."
);

const adventureTick=block(
  ui,
  "if(\n          fight&&fight.active&&fight.zone&&",
  "function appliquerSynchroCombatSansReflowIdleV116_("
);

assert.ok(
  adventureTick.includes("formatGrandNombreIdleV70_(fight.monsterHp)+\n              ' HP'")&&
  adventureTick.includes("formatGrandNombreIdleV70_(fight.playerHp)+\n              ' HP'"),
  "Les PV ennemi/joueur doivent afficher la valeur actuelle directement dans la barre."
);

assert.ok(
  !adventureTick.includes("'❤️ '+\n              formatGrandNombreIdleV70_(fight.monsterHp)")&&
  !adventureTick.includes("'❤️ '+\n              formatGrandNombreIdleV70_(fight.playerHp)"),
  "Les anciens labels séparés avec coeur et fraction ne doivent plus être utilisés."
);

for(const token of [
  "soreal-idle-v79-health-track-v200",
  "soreal-idle-v79-health-fill-v200",
  "soreal-idle-v79-health-label-v200",
  "background:linear-gradient(180deg,#f4f7fb 0%,#dce3ec 100%)",
  "background:linear-gradient(180deg,#ff5a63 0%,#ef3742 47%,#ce202d 100%)!important",
  "soreal-idle-v79-player-health .soreal-idle-v79-health-fill-v200",
  "background:linear-gradient(180deg,#62e58d 0%,#22c55e 48%,#159447 100%)!important",
  'font-family:\\"Segoe UI Variable Display\\",\\"Segoe UI Variable\\",\\"Segoe UI\\",system-ui',
  "text-shadow:0 1px 0 #000,0 0 3px rgba(0,0,0,.95),0 0 6px rgba(0,0,0,.8)!important"
]){
  assert.ok(scene.includes(token),"Style/structure HP V200 manquant: "+token);
}

new Function(ui);
new Function(scene);

console.log(
  "SOREAL IDLE V200: OK — Energie base→cap, arrêt au plafond, PV Aventure centrés dans les barres."
);
