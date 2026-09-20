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
  index.includes('/soreal-idle-ui.js?v=206'),
  "Le shell doit charger l'UI V206."
);

for(const token of [
  "titre:'Money Pit & Roue journalière'",
  "Jeter TOUT l’Or",
  "cycle de 24 heures",
  "rendreBoutonDailySpinIdleV203_",
  "🎡 Faire tourner la roue",
  "rendreSystemeMetaIdleV130_(j,pit,true)+",
  "rendreSystemeMetaIdleV130_(j,roue,true)"
]){
  assert.ok(ui.includes(token),"Money Pit / Daily Spin V206 manquant: "+token);
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
  ui.includes('Build <b style="color:#dce5f3">V206</b>'),
  "Settings doit afficher le jalon V204."
);

new Function(ui);

console.log(
  "SOREAL IDLE V206: OK — Money Pit/Roue expliqués, roue accessible, archives Info/TTS, audio inventaire immédiat."
);
