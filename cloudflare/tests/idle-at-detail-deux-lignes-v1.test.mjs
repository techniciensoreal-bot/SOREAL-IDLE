import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-14) : « dans Entraînement avancé, la ligne en dessous des barres (Wandoos énergie et magie…) se met parfois sur 2 lignes suivant le temps ou le % indiqué ».
 * Maintenant : colonne fixe, deux lignes TOUJOURS (bonus puis durée), centrées ; la hauteur réservée est celle de ces deux lignes.
 */
const page = readFileSync(new URL("../public/modules/augmentations-page-v1.js", import.meta.url), "utf8");
const regle = page.match(/\.soreal-idle-at-detail-v1\{[^}]*\}/);
assert.ok(regle, "règle du détail trouvée");
assert.ok(regle[0].includes("display:flex") && regle[0].includes("flex-direction:column") && regle[0].includes("align-items:center"), "deux lignes toujours : colonne centrée");
assert.ok(!regle[0].includes("flex-wrap") && !regle[0].includes("justify-content:space-between"), "plus de retour à la ligne conditionnel");
const stable = readFileSync(new URL("../public/modules/at-hauteur-stable-v1.js", import.meta.url), "utf8");
assert.ok(stable.includes("sonde.innerHTML='<span>'+b+'</span><span>'+PIRES[i]+'</span>'"), "la hauteur réservée est mesurée sur ces deux lignes");
console.log("idle-at-detail-deux-lignes-v1 : OK");
