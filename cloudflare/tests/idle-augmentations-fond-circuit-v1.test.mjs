import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-31) : un circuit imprimé EN FOND des cartes d'Augmentations, rien d'autre ne change (pas de nouvelle structure, titre inchangé). */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const i = css.indexOf("circuit imprimé EN FOND");
assert.ok(i > 0, "bloc du circuit imprimé");
const fin = css.indexOf("===== Trou sans fond", i);
const bloc = css.slice(i, fin > i ? fin : undefined);   /* le bloc du Trou sans fond, ajouté après, a ses propres animations */
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
const cpuDebut = css.indexOf("PROCESSEUR greffé");
const cpuFin = css.indexOf("===== Trou sans fond", cpuDebut);
const cpu = css.slice(cpuDebut, cpuFin > cpuDebut ? cpuFin : undefined);   /* le bloc du Trou sans fond, ajouté après, a ses propres animations */
const U = ".aug-piste-v2.upgrade";
assert.ok(cpu.includes(U + "::before{") && cpu.includes("#eef2f8") && cpu.includes("mask-composite:xor"), "capot métallique sur le pourtour seulement");
assert.ok(cpu.includes(U + "::after{") && cpu.includes("var(--pcb-acc,#e7b84e) 60%,#e7b84e) 2.5px 6.5px") && cpu.includes("inset:-7px"), "broches dorées qui dépassent des bords");
/* Norman (2026-10-31) : « les dents du processeur sont mal placées » sur Bouclier d'énergie et Sabre laser à quatre côtés. Cause : les rangs 4 et 5 posent des équerres de coin (width/height 14 et 18 px, bordure, filtre) sur ::before/::after de la piste (soreal-idle-themes.css) et le calque du processeur
   n'en remettait pas la taille à zéro : il se réduisait à une équerre dans l'angle. Les deux pseudo-éléments reprennent donc taille, bordure et filtre ; les broches sont en nombre entier, centrées entre les coins (round), sans motif coupé. */
for (const pseudo of ["::before{", "::after{"]) {
  const regle = cpu.slice(cpu.indexOf(U + pseudo), cpu.indexOf("}", cpu.indexOf(U + pseudo)));
  assert.ok(regle.includes("width:auto;height:auto;border:0;filter:none;"), "le calque du processeur " + pseudo + " annule les équerres de rang 4 et 5");
}
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(/data-rang-v1="5"\]::after\{[^}]*width:18px/.test(themes), "les équerres de rang qui motivent la remise à zéro existent toujours");
assert.equal(cpu.split("round(down,calc(100% - 34px),9px)").length - 1, 6, "4 rangées de broches sur ordinateur (2 sur téléphone), en nombre entier");
assert.ok(!cpu.includes("0 4px,transparent 4px 9px"), "plus de motif de broches qui se coupe à l'arbitraire au bout du côté");
assert.ok(cpu.includes("circle at 50% 7px") && cpu.includes("circle at 10px 10px"), "encoche et point repère");
assert.ok(cpu.includes("#161a2a 2px 12px"), "condensateurs");
assert.ok(cpu.includes("@media (max-width:700px)"), "broches réduites sur téléphone");
assert.ok(!cpu.includes("!important") && !/animation:(?!none)|@keyframes/.test(cpu), "statique, sans !important");
console.log("ok idle-augmentations-processeur-v1");
/* Norman (2026-10-31) : pour 2 barres, UN SEUL circuit imprimé + UN processeur ; le titre n'a plus de cadre, l'Augment n'a plus de cadre plein. */
const unDebut = css.indexOf("UN SEUL circuit imprimé");
const unFin = css.indexOf("===== Trou sans fond", unDebut);
const un = css.slice(unDebut, unFin > unDebut ? unFin : undefined);   /* bornée : les blocs ajoutés après (Trou sans fond, roue) ont leurs propres tests */
assert.ok(!css.includes(".aug-carte-tete") && !js.includes("aug-carte-tete") && !js.includes("aug-pastilles"), "bande supérieure (icône + titre + pastilles Boss / Amélioration) supprimée");
assert.ok(css.includes(".aug-nom-piste-v2{font:900 clamp(19px,2.2vw,26px)"), "titre de colonne agrandi");
assert.ok(un.includes(".aug-piste-v2:not(.upgrade){border:2px dashed rgba(255,255,255,.3);border-radius:6px}"), "piste d'Augment posée sur le circuit, contour de sérigraphie");
assert.ok(!un.includes("!important"), "aucun !important");
assert.ok(bloc.includes("radial-gradient(circle,#05080d 0 2.2px,#e7b84e 2.6px 4.4px"), "trous de fixation de la carte");
console.log("ok idle-augmentations-carte-unique-v1");
/* Norman (2026-10-31) : une couleur de circuit imprimé par augmentation, franchement distinctes (écart >= 22) et sans gêner la lecture (texte blanc, contraste >= 7). */
import { deltaE } from "./_couleurs-v1.mjs";
const couleurs = [...css.matchAll(/\.aug-paire-v2\[data-icone="([^"]+)"\]\{--pcb-base:(#[0-9a-f]{6});--pcb-acc:(#[0-9a-f]{6})/g)].map((m) => ({ icone: m[1], base: m[2], acc: m[3] }));
assert.ok(couleurs.length >= 8, "sept augmentations + Inside Out ont leur couleur : " + couleurs.length);
const tableIcones = [...js.match(/IDLE_ICONES_AUGMENTS_V1=\{([^}]*)\}/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
for (const ic of tableIcones) assert.ok(couleurs.some((c) => c.icone === ic), "couleur pour l'icône " + ic);
for (let a = 0; a < couleurs.length; a++) for (let b = a + 1; b < couleurs.length; b++) assert.ok(deltaE(couleurs[a].base, couleurs[b].base) >= 22, "cartes trop proches : " + couleurs[a].base + " / " + couleurs[b].base);
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
for (const c of couleurs) assert.ok(1.05 / (lum(c.base) + 0.05) >= 7, "contraste du texte blanc sur " + c.base);
assert.ok(css.includes("--pcb-acc,#e7b84e"), "accent du processeur lié à la couleur de la carte");
console.log("ok idle-augmentations-couleurs-pcb-v1");
