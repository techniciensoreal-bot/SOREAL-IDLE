import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";
import fs from "node:fs";
import vm from "node:vm";
const lire = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const dig = lire("public/modules/coffre-digestion-v1.js"), somm = lire("public/modules/coffre-sommeil-v1.js"), css = lire("public/soreal-idle-itopod.css");
/* Coffre : un vrai nuage de six bouffées au pet ordinaire comme au pet de réveil, trajets au hasard dans le HTML */
assert.ok(dig.includes("function nuagePet_(el){") && dig.includes("window.__coffreNuagePetIdleV1__=nuagePet_") && dig.includes("Math.random()<.34") && dig.includes("--haut:"), "nuage de pet");
assert.ok(somm.includes("window.__coffreNuagePetIdleV1__(el)"), "le pet de réveil utilise le même nuage");
assert.ok(css.includes("translate(var(--dx,14px),calc(var(--haut,40px) * -1)) scale(var(--gr,1.5))") && /(^|\n)\.bg-fumee-v1\{[^}]*z-index:2000000/.test(css), "nuage animé, au-dessus de l'inventaire");
/* Yggdrasil : 09h58 */
const ui = lireUiComplet();
const m = ui.match(/function formatterHeuresIdleV47_\(heures\)\{[\s\S]*?\n      \}/);
assert.ok(m, "fonction trouvée");
const f = vm.runInNewContext("(" + m[0].replace("function formatterHeuresIdleV47_", "function") + ")");
assert.equal(f(9 + 58 / 60), "09h58"); assert.equal(f(0.85), "00h51"); assert.equal(f(0), "00h00"); assert.equal(f(12.5), "12h30"); assert.equal(f(undefined), "00h00");
/* Signalements de bug : notification « En direct » qui repasse tant que la liste n'a pas été ouverte */
const bug = lire("public/modules/bug-report-v1.js"), flux = lire("public/modules/flux-v1.js"), srv = lireSrc("idle-sqlite-runtime.js");
assert.ok(bug.includes(".lireBugsSorealIdle(s,'compter')") && bug.includes("setInterval(verifierNouveaux,DELAI_NOTIF_MS);}") && bug.includes("__SOREAL_IDLE_FLUX_V1__.annoncer"), "vérification périodique côté administrateur");
assert.ok(flux.includes("annoncer:function(e)"), "flux : message local");
assert.ok(srv.includes("function lireBugsSorealIdle(sessionToken, option)") && srv.includes("option === 'compter'") && srv.includes("INSERT OR REPLACE INTO idle_bug_vus"), "serveur : compteur de non-vus, repère posé à l'ouverture de la liste");
/* Voix du tutoriel : un bloc généré est déclaré tout de suite au lecteur */
const tx = lire("public/modules/textes-admin-v1.js");
assert.ok(tx.includes("enregistrerVoix_([b.hash]);") && tx.includes("enregistrerVoix_([hash]);"), "voix déclarée dès sa génération");
console.log("idle-coffre-nuage-ygg-heures-bug-notif-v1: OK");
