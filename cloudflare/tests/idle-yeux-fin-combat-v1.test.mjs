import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-07) : « les yeux qui regardent la barre de vie ne s'arrêtent pas toujours à la fin d'un combat ». La scène des yeux de combat (yeuxcb, durée illimitée) est une scène de combat : la borne voit donc la fin du combat sans victoire ni défaite (fuite, pause) et les yeux s'arrêtent. */
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8");
const m = /var EN_COMBAT=\{([^}]*)\};/.exec(led);
assert.ok(m, "liste EN_COMBAT");
assert.ok(/(^|,)yeuxcb:1(,|$)/.test(m[1]), "yeuxcb est une scène de combat : " + m[1]);
assert.ok(/function enCombat\(s\)\{return Boolean\(s&&\(EN_COMBAT\[s\.id\]/.test(led), "enCombat lit la liste");
assert.ok(/else if\(!S\.combat&&enCombat\(cur\)\)\{/.test(led), "fin de combat sans scène de victoire ni de défaite : la scène longue quitte l'écran après la grâce");
console.log("idle-yeux-fin-combat-v1: OK");
