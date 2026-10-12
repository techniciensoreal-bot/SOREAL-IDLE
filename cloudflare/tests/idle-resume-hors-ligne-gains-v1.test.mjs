import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-12) : à la connexion, le résumé « Pendant ton absence » montre tout ce qui a été farmé (EXP, AP, PP, Or...), pas seulement les Titans tués. */
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(rt.includes("function gainsHorsLigneV1_(avant, apres)") && rt.includes('const DEVISES_HORS_LIGNE_V1 = ["experience", "ap", "pp", "qp", "gold", "blood", "seeds", "mayo"]'), "écart des monnaies avant / après");
assert.ok(rt.includes("const devisesAvantHorsLigneV1 = instantaneDevisesHorsLigneV1_(statsRessourceV55.metaNgu);") && rt.includes("gainsHorsLigneV1_(devisesAvantHorsLigneV1, instantaneDevisesHorsLigneV1_(statsCombat.metaNgu))"), "instantané avant la synchro, comparé à l'état final");
assert.ok(rt.includes("progression.gainsMeta") , "transmis au client");
assert.ok(ui.includes("gainsAutres") && ui.includes("Math.max(idleNombre_(p.xpGagnee),idleNombre_(gm.experience))") && ui.includes("['pp','🏅','PP']"), "lignes PP, Or, Blood... dans le popup");
assert.ok(ui.includes("filter(function(g){return idleNombre_(gm[g[0]])>0;})"), "anti-spoil : seules les lignes dont le gain est > 0 apparaissent");
{ // calcul : écarts positifs seulement
  const src = rt.slice(rt.indexOf("const DEVISES_HORS_LIGNE_V1"), rt.indexOf("/* Kills de chaque titan"));
  const f = new Function("nombreSorealIdle_", src + "; return { instantane: instantaneDevisesHorsLigneV1_, gains: gainsHorsLigneV1_ };")((v, d) => (Number.isFinite(Number(v)) ? Number(v) : d));
  const avant = f.instantane({ currencies: { experience: 10, ap: 5, pp: 2, gold: 100 }, resources: { magic: { current: 50 } } });
  const apres = f.instantane({ currencies: { experience: 1010, ap: 5, pp: 9, gold: 40 }, resources: { magic: { current: 80 } } });
  assert.deepEqual(JSON.parse(JSON.stringify(f.gains(avant, apres))), { experience: 1000, pp: 7, magic: 30 }, "EXP, PP et Magie gagnés ; AP inchangé et Or dépensé n'apparaissent pas");
}
console.log("idle-resume-hors-ligne-gains-v1: OK");
