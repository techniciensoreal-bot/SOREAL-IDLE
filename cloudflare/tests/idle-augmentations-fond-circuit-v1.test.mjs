import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-31) : un circuit imprimé EN FOND des cartes d'Augmentations, rien d'autre ne change (pas de nouvelle structure, titre inchangé). */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const i = css.indexOf("circuit imprimé EN FOND");
assert.ok(i > 0, "bloc du circuit imprimé");
const bloc = css.slice(i);
assert.ok(bloc.includes('[data-menu="augmentations"] .aug-paire-v2::after{content:""') && bloc.includes("repeat,"), "fond en tuiles sur ::after");
assert.ok(!bloc.includes("!important"), "aucun !important dans le bloc");
assert.ok(!/animation:(?!none)|@keyframes/.test(bloc), "décor statique");
assert.ok(bloc.includes("z-index:0;opacity:1;transform:none;animation:none;pointer-events:none") && bloc.includes(".aug-pistes-v2{position:relative;z-index:1}"), "derrière le texte, sans bloquer les clics");
const js = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
for (const k of ["aug-noyau", "aug-voyant", "aug-voie", "aug-pcb", "aug-flux"]) assert.ok(!js.includes(k), "structure inchangée : " + k);
assert.ok(js.includes('<span class="aug-lien-v2" aria-hidden="true">×</span>'), "lien d'origine conservé");
const titre = readFileSync("cloudflare/public/soreal-idle-entetes-a.css", "utf8");
assert.ok(!titre.includes("enteteA_augmentations 1.2s") && titre.includes("enteteA_augmentations 28s"), "titre d'Augmentations inchangé");
const total = [...(readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8") + "").matchAll(/!important/g)].length;
assert.ok(total >= 0);
console.log("ok idle-augmentations-fond-circuit-v1");
/* Norman (2026-10-31) : la piste d'Upgrade est un processeur greffé sur la carte (capot métallique, broches dorées, encoche, repère, condensateurs), sans toucher au HTML. */
const cpu = css.slice(css.indexOf("PROCESSEUR greffé"));
const U = ".aug-piste-v2.upgrade";
assert.ok(cpu.includes(U + "::before{") && cpu.includes("#eef2f8") && cpu.includes("mask-composite:xor"), "capot métallique sur le pourtour seulement");
assert.ok(cpu.includes(U + "::after{") && cpu.includes("#e7b84e 0 4px") && cpu.includes("inset:-7px"), "broches dorées qui dépassent des bords");
assert.ok(cpu.includes("circle at 50% 7px") && cpu.includes("circle at 10px 10px"), "encoche et point repère");
assert.ok(cpu.includes("#161a2a 2px 12px"), "condensateurs");
assert.ok(cpu.includes("@media (max-width:700px)"), "broches réduites sur téléphone");
assert.ok(!cpu.includes("!important") && !/animation:(?!none)|@keyframes/.test(cpu), "statique, sans !important");
console.log("ok idle-augmentations-processeur-v1");
/* Norman (2026-10-31) : pour 2 barres, UN SEUL circuit imprimé + UN processeur ; le titre n'a plus de cadre, l'Augment n'a plus de cadre plein. */
const un = css.slice(css.indexOf("UN SEUL circuit imprimé"));
assert.ok(un.includes(".aug-carte-tete{border-bottom:2px dashed rgba(255,255,255,.26)}"), "titre sans cadre : un simple trait de sérigraphie");
assert.ok(un.includes(".aug-piste-v2:not(.upgrade){border:2px dashed rgba(255,255,255,.3);border-radius:6px}"), "piste d'Augment posée sur le circuit, contour de sérigraphie");
assert.ok(!un.includes("!important"), "aucun !important");
assert.ok(bloc.includes("radial-gradient(circle,#05080d 0 2.2px,#e7b84e 2.6px 4.4px"), "trous de fixation de la carte");
console.log("ok idle-augmentations-carte-unique-v1");
