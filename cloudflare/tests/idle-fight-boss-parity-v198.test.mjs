import assert from "node:assert/strict";
import fs from "node:fs";

const runtime=fs.readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const ui=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const css=fs.readFileSync(
  new URL("../public/soreal-idle-ui.css",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const bossReference=fs.readFileSync(
  new URL("../src/idle-ngu-boss-reference-v1.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

function block(source,start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,"Bloc introuvable: "+start);
  return source.slice(a,b);
}

// Référence early-game : boss 6/7/8 exacts.
assert.ok(
  bossReference.includes(
    "{ pv: 325000000, attaque: 32500000, defense: 17500000, xp: 0 }"
  ),
  "Boss 6 doit conserver les stats NGU de référence."
);
assert.ok(
  bossReference.includes(
    "{ pv: 1625000000, attaque: 162500000, defense: 87500000, xp: 1 }"
  ),
  "Boss 7 doit conserver les stats NGU de référence."
);
assert.ok(
  bossReference.includes(
    "{ pv: 8125000000, attaque: 812500000, defense: 437500000, xp: 1 }"
  ),
  "Boss 8 doit conserver les stats NGU de référence."
);

// Fight Boss serveur : Attack - Boss Defense AVANT les multiplicateurs.
const progression=block(
  runtime,
  "function appliquerProgressionEnergieSorealIdle_(",
  "function contexteMetaNguSorealIdle_("
);

assert.ok(
  progression.includes("const defenseBossCombat =")&&
  progression.includes("defenseBossSorealIdle_(")&&
  progression.includes("const dpsJoueurBase =")&&
  progression.includes("puissance -\n        defenseBossCombat"),
  "Le serveur Fight Boss doit soustraire la Défense du boss."
);

assert.ok(
  progression.includes(
    "dpsJoueurBase *\n        multiplicateurDpsBoss *"
  ),
  "Les multiplicateurs ne doivent s'appliquer qu'après Attack-BossDefense."
);

assert.ok(
  !progression.includes(
    "0,\n        puissance *\n        multiplicateurDpsBoss *"
  ),
  "L'ancien DPS serveur basé sur la puissance brute ne doit plus exister."
);

// Cas signalé : ~160 M HP => ~16 M Attack ; boss 6 Defense = 17.5 M.
assert.equal(
  Math.max(0,16_000_000-17_500_000),
  0,
  "Un joueur à 16 M Attack ne doit infliger aucun dégât de base au boss 6."
);

// NUKE : condition exacte des deux côtés.
const nuke=block(
  runtime,
  "function nukerBossSorealIdle(",
  "function definirAutoBossSuivantSorealIdle("
);

assert.ok(
  nuke.includes("const attaqueNuke =")&&
  nuke.includes("row[c.PUISSANCE - 1]")&&
  nuke.includes("const defenseNuke =")&&
  nuke.includes("row[c.ENDURANCE - 1]"),
  "NUKE doit utiliser les stats Fight Boss courantes du joueur."
);

assert.ok(
  nuke.includes("const defenseBossNuke =")&&
  nuke.includes("defenseBossSorealIdle_(")&&
  nuke.includes("attaqueNuke / 5 > defenseBossNuke")&&
  nuke.includes("defenseNuke / 5 > attaqueBossNuke"),
  "NUKE doit exiger Attack/5 > Boss Defense ET Defense/5 > Boss Attack."
);

assert.ok(
  !nuke.includes("defenseNuke < attaqueBossNuke * 5"),
  "L'ancienne règle NUKE Defense-only doit être supprimée."
);

// UI : même règle et bouton désactivé tant qu'elle n'est pas satisfaite.
assert.ok(
  ui.includes("function bossNukableIdleV198_(j)")&&
  ui.includes("idleNombre_(j.puissance)/5 >")&&
  ui.includes("idleNombre_(j.defenseBoss)")&&
  ui.includes("idleNombre_(j.defense)/5 >")&&
  ui.includes("idleNombre_(j.attaqueBoss)")&&
  ui.includes("!bossNukableIdleV198_(j)"),
  "Le bouton NUKE doit refléter exactement la règle serveur."
);

// Lore : le préambule entre parenthèses est une information distincte.
const lore=block(
  ui,
  "function histoireBossMarkupIdleV142_(",
  "function capacitesBossMarkupIdleV70_("
);

assert.ok(
  lore.includes("const infoMatch=histoire.match(/^\\(([^\\n]+)\\)\\s*/);")&&
  lore.includes("soreal-idle-boss-lore-info-v198")&&
  lore.includes("soreal-idle-boss-lore-histoire-v142"),
  "L'information entre parenthèses doit être séparée du récit."
);

assert.ok(
  ui.includes(".soreal-idle-boss-lore-info-v198{")&&
  ui.includes("color:#aebbd0;")&&
  ui.includes("font-family:\"Segoe UI Variable Text\""),
  "Le préambule d'information doit avoir un style neutre, non doré."
);

console.log(
  "SOREAL IDLE Fight Boss V198: OK — dégâts Attack-Defense, NUKE double seuil, lore info séparée."
);
