// Norman (2026-11-01) : « le journal de combat n'est pas calé à la dernière ligne dans Aventure » (PC) : l'événement « scroll » d'un défilement fait par le jeu arrive après l'ajout de lignes
// (plus de 24 px d'écart) et coupait le suivi automatique ; seules les flèches du journal peuvent le couper.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8").replace(/\r\n/g, "\n");
const g = s.slice(s.indexOf("function gererScrollJournalAventureIdleV1_(event)"), s.indexOf("function armerRetourJournalAventureIdleV1_()"));
assert.ok(g.includes("direct=performance.now()-(host.__interV1||0)<1500") && g.includes("if(enBas||direct){idleAdventureLogAutoScrollV1_=enBas;"), "le suivi n'est coupé que par un geste récent du joueur");
assert.ok(!/idleAdventureLogAutoScrollV1_=enBas;\s*idleAdventureLogScrollMemoV1_=host\.scrollTop;\s*\n\s*if\(enBas\)/.test(g), "plus de coupure sur un simple événement scroll");
assert.ok(!s.includes("['wheel','touchstart'"), "la molette et le doigt ne commandent pas le journal (décision du 2026-11-01) : seules les flèches comptent comme geste");
assert.ok(s.includes("M.installer(host,function(sens){host.__interV1=performance.now();"), "les flèches comptent comme un geste du joueur");
console.log("idle-journal-aventure-suivi-v1 : OK");
