import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/*
 * Norman (2026-10-11) : (1) chaque barre qui a + − Max a aussi « 0 » : retire TOUTE l'énergie de cette barre, et d'elle seule ; (2) ITOPOD : un compte à rebours pour le prochain combat.
 * Les chaînes HTML du code source contiennent des guillemets échappés : on les compare sans antislashs.
 */
const L = (p) => readFileSync(p, "utf8");
const sansBs = (t) => t.replace(/\\/g, "");
const meta = sansBs(L("cloudflare/public/modules/meta-progression-v130.js") + lirePagesMeta());
const ui = L("cloudflare/public/soreal-idle-ui.js");
const blood = sansBs(L("cloudflare/public/modules/blood-magic-v1.js"));
const ngu = sansBs(L("cloudflare/public/modules/ngu-labo-v1.js"));
const alloc = L("cloudflare/public/modules/barre-allocation-v1.js");

// un bouton « 0 » dans chaque menu, branché sur son propre gestionnaire
assert.ok(ui.includes("__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','zero')") && ui.includes("if(action==='zero'){"), "Entraînement de base");
assert.ok(meta.includes("['zero','0']") && meta.includes(":mode==='zero'?0:current+idleAvant"), "Augmentations (Augment et Upgrade)");
assert.ok(meta.includes("__ajusterTimeMachineIdleV1__(''+ressource+'','zero')") && meta.includes(":mode==='zero'?0:Math.max(current,"), "Time Machine");
assert.ok(meta.includes("__ajusterAdvancedTrainingIdleV1__(''+idH+'','zero')") && meta.includes("mode==='zero'?0:mode==='plus'"), "Entraînement avancé");
assert.ok(blood.includes("__ajusterRituelBloodMagicIdleV1__(''+idHtml+'','zero')") && blood.includes(":mode==='zero'?0:current+idleAvant"), "Rituels de Blood Magic");
assert.ok(ngu.includes("ajuster(''+idH+'','zero')") && ngu.includes("var valeur=mode==='zero'?0:"), "NGU");
assert.ok(meta.includes("ajusterVoeu('+argsVoeu+''zero''") && alloc.includes("var valeur=mode==='zero'?0:mode==='max'"), "Souhaits");
// Entraînement de base avec Synchro : la jumelle ne bouge pas
assert.ok(ui.includes("plan={a:0,b:synchro?idleEntier_(jumelle.allocation):0};"), "« 0 » ne touche pas la jumelle (Synchro)");
// quatre colonnes pour les quatre boutons
assert.ok(L("cloudflare/public/soreal-idle-itopod.css").includes("grid-template-columns:repeat(4,minmax(0,1fr))!important"), "quatre boutons alignés");

// ITOPOD : compte à rebours du prochain combat
const scene = L("cloudflare/public/modules/itopod-scene-v1.js");
const fenetre = {};
vm.runInNewContext(scene, { window: fenetre, document: { querySelectorAll: () => [] }, setInterval() {}, fetch: () => Promise.resolve({ ok: false }), Date, Math, Number, Array, String, Object, console });
const api = fenetre.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
api.combat.actif = true; api.combat.hits = 3; api.combat.mort = false;
assert.match(api.texteProchain(), /Combat en cours/);
api.combat.mort = true; api.combat.prochain = Date.now() + 3200;
assert.match(api.texteProchain(), /Prochain combat dans <b>3,[0-3] s<\/b>/, "compte à rebours en secondes avec une virgule");
api.combat.prochain = Date.now() - 500;
assert.match(api.texteProchain(), /0,0 s/, "jamais négatif");
api.combat.actif = false;
assert.equal(api.texteProchain(), "", "tour à l'arrêt : rien");
assert.ok(scene.includes("itp-prochain") && L("cloudflare/public/soreal-idle-jeu.css").includes(".itp-prochain{"), "affiché et mis en forme");
console.log("idle-bouton-zero-et-itopod-v1: OK");
