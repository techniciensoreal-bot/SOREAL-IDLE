import assert from "node:assert/strict";
import fs from "node:fs";
import {
  idleDaycareFactorsV1, normalizeIdleDaycareDataV1, advanceIdleDaycareV1, idleDaycareSnapshotV1
} from "../src/idle-daycare-v1.js";

/*
 * C6 du plan (2026-11-07) : Garderie. La page rejoue localement la barre de chaque bocal à partir de ce que le moteur publie (progression, niveau, heures effectives par niveau) : `reperePour` + `etatA`
 * (daycare-page-v1.js). Preuve que ce modèle d'écran est IDENTIQUE au moteur : pour plusieurs objets (taux différents), plusieurs vitesses (sans bonus, vœu, vente) et plusieurs durées, la progression et le niveau
 * projetés par l'écran égalent ceux du moteur après le même temps. Et la page ne contient aucune table de taux : le seul nombre de jeu qu'elle lit est `effectiveHoursPerLevel`.
 */
const src = fs.readFileSync("cloudflare/public/modules/daycare-page-v1.js", "utf8");
const a = src.indexOf("function reperePour("), b = src.indexOf("function decalageLiquide(");
assert.ok(a > 0 && b > a, "fonctions de projection trouvées");
const { reperePour, etatA } = new Function("reperes", src.slice(a, b) + "\nreturn { reperePour, etatA };")({});

const OBJETS = [[119, "redHeart"], [248, "trash"], [77, "cube"], [76, "pendant"]];
const FACTEURS = [idleDaycareFactorsV1({}), idleDaycareFactorsV1({ wishLevel: 10 }), idleDaycareFactorsV1({ selloutSpeedBoost: true }), idleDaycareFactorsV1({ blindNormal: 3 })];
let comparaisons = 0;
for (const [wiki, def] of OBJETS) {
  for (const f of FACTEURS) {
    for (const depart of [0, 0.37, 5.9]) {   /* heures déjà passées en garderie */
      const data = normalizeIdleDaycareDataV1({ slots: [{ item: { id: "x", definitionId: def, wikiItemId: wiki, level: 0 }, levelAtEntry: 0, hours: 0 }] });
      advanceIdleDaycareV1(data, depart * 3600, f);
      const snap = idleDaycareSnapshotV1(data, {}, f).items[0];
      const rep = reperePour(snap, 1_000_000);
      for (const s of [0, 1, 30, 600, 3600, 86400, 400000]) {
        const proj = etatA(rep, 1_000_000 + s * 1000);
        const d2 = JSON.parse(JSON.stringify(data));
        advanceIdleDaycareV1(d2, s, f);
        const reel = idleDaycareSnapshotV1(d2, {}, f).items[0];
        assert.ok(Math.abs(proj.p - reel.progress) < 1e-6, `${def} +${s} s : progression écran ${proj.p} / moteur ${reel.progress}`);
        assert.equal(proj.niveau, reel.item.level, `${def} +${s} s : niveau écran / moteur`);
        comparaisons += 1;
      }
    }
  }
}
assert.ok(comparaisons >= 300, "assez de comparaisons : " + comparaisons);
/* aucune table de taux dans la page : elle ne lit que ce que le moteur publie */
assert.ok(!/baseHours\s*[:=]\s*\d|HEURES_DE_BASE|\bhoursByWiki/i.test(src), "la page ne contient pas de table de taux");
console.log("idle-garderie-projection-moteur-v1: OK (" + comparaisons + " comparaisons écran / moteur)");
