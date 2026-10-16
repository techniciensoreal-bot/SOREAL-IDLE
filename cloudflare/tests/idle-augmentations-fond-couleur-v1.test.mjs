import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-11) : dans Augmentations, le fond des pistes (normale et amélioration) suit la couleur de l'Augment pour TOUS les Augments, pas seulement les deux premiers : les règles de rang du thème (rang 2 et plus) ne doivent plus l'écraser. */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes('.aug-piste-v2.upgrade[data-rang-v1]{background:radial-gradient(110% 80% at 100% 0,color-mix(in srgb,var(--pc) 22%,transparent),transparent 60%),linear-gradient(170deg,color-mix(in srgb,var(--ac) 14%,#14172c),#0b0d1c)!important'), "fond de l'amélioration teinté par --ac pour tous les rangs");
assert.ok(css.includes('.aug-piste-v2[data-rang-v1]{border-left-width:2px!important;') && css.includes('box-shadow:none!important;animation:none!important}'), "les règles de rang (bord épais, lueur, battement) ne s'appliquent plus aux pistes");
const js = (readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta());
assert.ok(js.includes('data-rang-v1="\'+rangAugment(def)+\'"') && js.includes("--ac:'+COULEURS_RANG_AUGMENTS_V1[rangAugment(def)]"), "chaque piste porte son rang et la couleur de l'Augment (--ac)");
console.log("idle-augmentations-fond-couleur-v1: OK");
