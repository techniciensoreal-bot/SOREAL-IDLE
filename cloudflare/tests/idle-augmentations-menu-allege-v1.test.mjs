import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : menus clairs et pas encombrés. Augmentations : « Niv. 21 » seul, plus de sous-titre redondant, coût annoncé « Coût du prochain niveau 💰 … Or ». */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(!meta.includes("💪 Augment'"), "plus d'intitulé « 💪 Augment · »");
assert.ok(!meta.includes("Bonus d’Attack et de Defense · coûte de l’Or"), "sous-titre redondant supprimé");
assert.ok(!meta.includes("coûte de l’Or et de l’Energy':"), "sous-titre de l'Upgrade supprimé aussi");
assert.ok(meta.includes("Coût du prochain niveau 💰 '"), "libellé du coût");
assert.ok(meta.includes("(label?label+' · ':'')+'Niv. '+level"), "Niv. N seul pour l'Augment");
console.log("idle-augmentations-menu-allege-v1: OK");
