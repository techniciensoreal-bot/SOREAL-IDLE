import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-14) : « j'active un labo et rien ne se passe ». Un refus du moteur (GPS_INSUFFISANT, AUCUN_SLOT_DIGGER, DIGGER_NON_ACHETE) était muet (la page n'a pas d'élément de toast) : un message flottant visible l'explique maintenant. */
const meta = readFileSync(new URL("../public/modules/meta-progression-v130.js", import.meta.url), "utf8");
const fn = meta.match(/function messageRefusLaboV1_\(payload,brut\)\{[\s\S]*?\n      \}\n/);
assert.ok(fn, "fonction trouvée");
const messageRefusLaboV1_ = new Function(fn[0] + "; return messageRefusLaboV1_;")();
const t = (action, code) => messageRefusLaboV1_({ action }, code);
assert.match(t("toggleDigger", "GPS_INSUFFISANT"), /or par seconde/);
assert.match(t("toggleDigger", "AUCUN_SLOT_DIGGER"), /places de labo/);
assert.match(t("toggleDigger", "DIGGER_NON_ACHETE"), /niveau/);
assert.equal(t("allocate", "GPS_INSUFFISANT"), "", "seulement les actions de labo");
assert.equal(t("toggleDigger", "AUTRE"), "", "un autre code garde le comportement habituel");
const branche = meta.indexOf("messageRefusLaboV1_(payload,res&&res.message)");
assert.ok(branche > 0 && meta.indexOf("toastIdleV5_(", branche) > branche, "le message visible passe avant le toast muet");
console.log("idle-labos-refus-visible-v1 : OK");
