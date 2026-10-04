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
  index.includes('/soreal-idle-ui.js?v=412'),
  "Le standalone doit charger les assets V200 de la barre Energie et des PV Aventure."
);

const energyFn=block(
  ui,
  "function mettreAJourBarreProgressionContinueV1_(",
  "function demarrerTickerIdle_()"
);

/*
 * 2026-09-29 (Norman, revirement assumé -- remplace le rebond du 2026-09-24, voir WORKLOG.md) :
 * « Je ne veux plus qu'elle tique !!! elle doit simplement se remplir et se vider quand on place
 * de l'énergie. Aucune animation de tique par seconde. » largeurTickEnergieIdleV1_ (le rebond
 * "monte jusqu'au cap puis repart instantanément") est retiré : la largeur est désormais posée
 * directement à partir de la valeur réellement connue, la transition CSS de
 * .soreal-idle-energybar-v11 (soreal-idle-ui.css) fait tout le lissage visuel.
 */
assert.ok(
  !ui.includes("function largeurTickEnergieIdleV1_("),
  "l'ancienne fonction de rebond par tick ne doit plus être déclarée (son nom peut rester en commentaire historique)"
);

assert.match(
  energyFn,
  /largeurBarreCombatIdleV121_\(\s*element,\s*valeur\/max\*100\s*\);/,
  "la largeur doit être posée directement depuis la valeur connue, sans interpolation de tick inventée"
);

assert.ok(
  !/progressionTick|gainTick/.test(energyFn),
  "les paramètres de rebond par tick ne doivent plus exister dans la signature"
);

// Cap à 0 ou négatif : barre vide, jamais NaN.
assert.match(
  energyFn,
  /if\(max<=0\)\{\s*largeurBarreCombatIdleV121_\(element,0\);\s*return;\s*\}/,
  "cap à 0 -> barre vide, jamais NaN"
);

// La transition CSS (jamais transition:none) fait tout le lissage visuel : aucun override ne doit la couper.
const css=fs.readFileSync(new URL("../public/soreal-idle-ui.css",import.meta.url),"utf8");
assert.ok(
  !css.includes("transition:none !important;\n            background:linear-gradient(90deg,#2fd86e"),
  "aucune règle ne doit plus forcer transition:none sur la barre d'Énergie/Magie"
);
assert.match(css,/\.soreal-idle-energybar-v11\{[\s\S]{0,300}?transition:width \.12s linear;/,"la transition de base doit rester active pour lisser les mises à jour");

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
