// Norman (2026-10-29) : « quand on place de l'énergie ou de la magie dans la Machine temporelle, les barres bougent, les chronos ne sont pas fluides » et « quand on place et retire de l'énergie, la page bouge encore ».
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
/* 1. une synchro calculée avant le clic ne remet plus les durées et la barre périmées de la Machine temporelle */
const aug = lire("cloudflare/public/modules/augmentations-page-v1.js");
const i = aug.indexOf("function appliquerAllocationsVoulues(j)"), fin = aug.indexOf("window.__appliquerAllocationsVouluesIdleV1__", i);
const corps = aug.slice(i, fin);
const m = corps.indexOf("if(p.system==='timeMachine'){");
assert.ok(m > 0, "branche Machine temporelle dans la réapplication des allocations voulues");
const bloc = corps.slice(m, m + 900);
assert.ok(bloc.includes("precedent.systemes.timeMachineView") && bloc.includes("['Fill','Fraction','ProgressSeconds','EtaSeconds']") && bloc.includes("vj.__at=vp.__at") && bloc.includes("recalculerTimeMachineLocalIdleV1_(j,p.resource,val)"), "le visuel local de la piste est reporté puis rebasé");
assert.ok(m > corps.indexOf("if(p.action==='allocate'") && m < corps.indexOf("p.action==='allocateAdvancedTraining'"), "dans la branche allocate");
/* 2. le cadre « total placé » a toujours deux lignes sur téléphone (hauteur indépendante du texte) */
const css = lire("cloudflare/public/soreal-idle-itopod.css");
const a = css.indexOf("@media (max-width:420px){html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] .soreal-idle-bt-toolbar-v120>.soreal-idle-bt-total-v1{display:grid!important;grid-template-columns:minmax(0,1fr) auto;");
assert.ok(a > 0, "cadre total placé en grille à deux lignes sur téléphone");
assert.ok(css.slice(a, a + 900).includes(">small{grid-column:1/-1}"), "la ligne « % du plafond » est toujours sous les deux autres");
assert.ok(!css.includes(".soreal-idle-bt-total-v1{flex-wrap:wrap}}"), "plus de retour à la ligne selon le contenu");
console.log("idle-allocation-sans-saut-v1 : OK");
