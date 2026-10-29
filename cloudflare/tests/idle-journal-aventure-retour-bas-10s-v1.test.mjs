// Norman (2026-10-29) : « le journal de combat doit revenir tout en bas après 10 secondes sans qu'on y touche » : retour automatique en bas après 10 s ; la molette, un appui ou un défilement repoussent l'échéance.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("const IDLE_ADVENTURE_LOG_RESUME_MS_V1=10000;"), "10 secondes");
const i = s.indexOf("function gererScrollJournalAventureIdleV1_(event)");
const g = s.slice(i, i + 900);
assert.ok(g.includes("clearTimeout(idleAdventureLogResumeTimerV1_)") && g.includes("if(!enBas){") && g.includes("IDLE_ADVENTURE_LOG_RESUME_MS_V1") && g.includes("hostActuel.scrollTop=hostActuel.scrollHeight"), "minuterie remise à zéro à chaque geste, retour en bas à l'échéance");
const a = s.indexOf("function attacherEcouteurScrollJournalAventureIdleV1_(host)");
const att = s.slice(a, a + 700);
assert.ok(att.includes("['wheel','pointerdown','touchstart']") && att.includes("if(!idleAdventureLogAutoScrollV1_)gererScrollJournalAventureIdleV1_({currentTarget:host})"), "molette et appui repoussent l'échéance quand le journal n'est pas en bas");
console.log("idle-journal-aventure-retour-bas-10s-v1 : OK");
