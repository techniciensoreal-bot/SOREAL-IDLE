import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « quand je mets de l'énergie dans augmentations, le cadre qui reçoit l'énergie fait un zoom avant. Je ne veux aucun mouvement, juste la somme qui s'écrit, et un bruit de tic pour les boutons en gomme, comme s'il y avait un clips derrière qui validait le clic ». */
const lire = (f) => fs.readFileSync(new URL("../public/modules/" + f, import.meta.url), "utf8");
const pop = lire("alloc-pop-v1.js"), page = lire("augmentations-page-v1.js"), audio = lire("audio-effects-v199.js");
// aucun gonflement dans la page Augmentations
assert.ok(/function gonfler\(el\)\{[\s\S]{0,400}closest\('\.soreal-idle-page-root-v28\[data-menu="augmentations"\]'\)\)return;/.test(pop), "le chiffre alloué ne gonfle plus dans Augmentations");
// le tic existe, comme les autres sons (priorités, fonction, table, interface)
assert.ok(audio.includes('augTic:{group:"clavier-app"') && audio.includes("function augTic_()") && audio.includes("augTic:augTic_,") && audio.includes('augTic:function(){return demander_("augTic");}'), "son augTic déclaré partout");
// + − Max 0 (une seule action), « tout retirer » et les raccourcis Max / 1/2 / 1/4 jouent ce tic
assert.ok(page.includes("const son='augTic';"), "+ / − / Max / 0 : tic");
assert.ok(page.includes("if(audio&&typeof audio.augTic==='function')audio.augTic();"), "Tout retirer : tic");
assert.ok(/function presetAugmentIdleV1_\(source,fraction\)\{\s*try\{const a=window\.__SOREAL_IDLE_AUDIO_V199__;if\(a&&typeof a\.augTic==='function'\)a\.augTic\(\);\}/.test(page), "raccourcis Max / 1/2 / 1/4 : tic");
console.log("idle-augment-tic-sans-zoom-v1: OK");
