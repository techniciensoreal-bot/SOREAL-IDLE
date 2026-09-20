import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const runtime=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);
const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const scene=readFileSync(
  new URL("../public/modules/adventure-scene-v79.js",import.meta.url),
  "utf8"
);

// Rebirth -> Safe Zone, no Adventure fight/auto state survives.
const rebirthStart=runtime.indexOf("function renaitreSorealIdle(");
const rebirthEnd=runtime.indexOf("\nfunction recyclerObjetSorealIdle",rebirthStart);
const rebirth=runtime.slice(rebirthStart,rebirthEnd);

assert.match(rebirth,/stats\.metaNgu\.adventure\.selectedZone='safe'/);
assert.match(rebirth,/stats\.metaNgu\.adventure\.fight=\{[\s\S]{0,180}active:false/);
assert.match(rebirth,/stats\.autoAventure=false/);
assert.match(rebirth,/stats\.autoAventureZone=0/);

// Local timers/localStorage must also be killed on Rebirth success.
const successAnchor=ui.indexOf("const adventureApresRebirthV186=");
assert.ok(successAnchor>=0,"Rebirth client Safe Zone reset missing.");
const successBlock=ui.slice(Math.max(0,successAnchor-900),successAnchor+900);
assert.match(successBlock,/idleAutoAventureV30=false/);
assert.match(successBlock,/idleAutoZoneV30=0/);
assert.match(successBlock,/annulerTimerCombatAutoIdleV30_\(\)/);
assert.match(successBlock,/sauverCombatAutoIdleV30_\(\)/);
assert.match(successBlock,/idleAdventureRespawnAtV1=0/);
assert.match(successBlock,/selectedZone='safe'/);
assert.match(successBlock,/fight\.active=false/);

// Launcher shortcut must not use generic visual-state classes.
const shortcutStart=ui.indexOf("function marquerBoutonIdleActif_");
const shortcutEnd=ui.indexOf("\n      function styleIdle_",shortcutStart);
const shortcut=ui.slice(shortcutStart,shortcutEnd);
assert.match(shortcut,/data-idle-open-v186/);
assert.doesNotMatch(shortcut,/classList\.add\('idle-open'\)/);
assert.doesNotMatch(shortcut,/classList\.add\('active'\)/);

// Legacy SOREAL boss advice/tips must never be emitted to the UI.
assert.match(runtime,/bossConseil:\s*''/);
assert.match(
  runtime,
  /bossCatalogue:[\s\S]{0,6500}conseil:\s*''/,
  "Collection boss catalogue must expose no old Conseil text."
);
const loreStart=ui.indexOf("function histoireBossMarkupIdleV142_");
const loreEnd=ui.indexOf("\n      function capacitesBossMarkupIdleV70_",loreStart);
const lore=ui.slice(loreStart,loreEnd);
assert.match(lore,/bossHistoire/);
assert.doesNotMatch(lore,/bossConseil|conseilBrut|soreal-idle-boss-lore-conseil-v142/);
assert.doesNotMatch(
  ui,
  /b\.conseil\s*\?/,
  "Collection must no longer render IDLE_BOSS.Conseil."
);

// Adventure stat cards: one row, label left, complete value on right.
assert.match(
  scene,
  /data-player-stat="power"><span class="soreal-idle-v79-stat-label">Power<\/span><span class="soreal-idle-v79-stat-value">/
);
assert.match(
  scene,
  /data-player-stat="toughness"><span class="soreal-idle-v79-stat-label">Toughness<\/span><span class="soreal-idle-v79-stat-value">/
);
assert.match(scene,/justify-content:space-between/);
assert.match(scene,/\.soreal-idle-v79-stat-value\{[^}]*justify-content:flex-end[^}]*white-space:nowrap[^}]*text-align:right/);
assert.match(
  scene,
  /soreal-idle-v79-stat-value"><b class="soreal-idle-v79-stat-base"><\/b><b class="soreal-idle-v79-stat-bonus"><\/b>/,
  "Base and (+bonus) must stay together in the right-aligned value."
);

console.log("Rebirth Safe Zone + Adventure layout + legacy tips V186: OK");
