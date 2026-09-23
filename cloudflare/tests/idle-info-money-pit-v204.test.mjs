import assert from "node:assert/strict";
import fs from "node:fs";

const ui=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

assert.ok(
  index.includes('/soreal-idle-ui.js?v=232'),
  "Le shell doit charger une révision UI cache-bustée."
);

/*
 * UI split V9 : le dispatcheur de la page Money Pit / Daily Spin a été
 * extrait vers modules/meta-progression-v130.js avec le reste du
 * Système Méta, sans changement fonctionnel ; d'autres tokens (nav,
 * popups) restent légitimement dans le monolithe. On vérifie donc la
 * présence dans l'une ou l'autre source plutôt que de figer où chaque
 * chaîne doit vivre.
 */
const metaModule=fs.readFileSync(
  new URL("../public/modules/meta-progression-v130.js",import.meta.url),
  "utf8"
);
const uiEtModule=ui+"\n"+metaModule;
for(const token of [
  "titre:'Money Pit & Roue journalière'",
  "cycle de 24 heures",
  "function pageMoneyPitDailySpinIdleV206_(j)",
  "sorealIdleMoneyPitImageV209",
  "soreal-idle-nav-money-green-v1",
  "soreal-idle-nav-money-yellow-v1",
  "gold>=100000",
  "imageMoneyPitAvantRenduV209",
  "/api/idle/media/banner?name=Money_Pit.jpg",
  "Balance ton argent",
  "Daily Spin!",
  "Fais-moi tourner, bébé !",
  "TABLE DES RÉCOMPENSES",
  "RÉCOMPENSES OBTENUES",
  "TON PRIX"
]){
  assert.ok(uiEtModule.includes(token),"Money Pit / Daily Spin V206 manquant: "+token);
}

for(const token of [
  "function textesNormanSebastienIdleV204_(j)",
  "TUTORIEL_DEBUT_JEU_PAGES_V1",
  "TUTORIEL_PREMIER_BOSS_PAGES_V1",
  "TUTORIEL_AVENTURE_PAGES_V1",
  "pages.forEach(function(page,index)",
  "titre:String(page.titre||'Introduction')",
  "sorealIdleInfoRecapV203_",
  "sorealIdleNarrateursV203_",
  "soreal-idle-tts-read-v203",
  "data-soreal-tts-target"
]){
  assert.ok(ui.includes(token),"Settings > Info / tutoriels narrateurs manquant: "+token);
}

{
  const queueAt=ui.indexOf("idleInventoryMutationQueueV160.push(tx);");
  const playAt=ui.indexOf("jouerEffetAudioIdleV199_(tx.audioCue);",queueAt);
  const eventAt=ui.indexOf("marquePerfInventaireIdleV160_('event',tx.id);",queueAt);
  assert.ok(
    queueAt>=0&&playAt>queueAt&&eventAt>playAt,
    "Le son fusion/boost doit partir sur le feedback optimiste local."
  );
}

assert.ok(
  ui.includes('Build <b style="color:#dce5f3">V212</b>'),
  "Settings doit afficher le jalon V212."
);

new Function(ui);

console.log(
  "SOREAL IDLE V212: OK — Money Pit/Roue expliqués, roue accessible, archives Info/TTS, audio inventaire immédiat."
);
