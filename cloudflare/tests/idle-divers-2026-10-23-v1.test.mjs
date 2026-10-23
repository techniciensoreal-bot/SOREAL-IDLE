import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lire = (f) => readFileSync(f, "utf8");
const mobs = JSON.parse(lire("design/traductions/fr/mobs.json"));
/* « Sundae » garde son nom d'origine partout (jeu de mots avec Sunday) */
assert.ok(!("Sundae" in mobs), "aucune traduction française de Sundae");
assert.ok(!lire("design/ngu-boss-names-fr.json").includes("Coupe glacée"));
/* sangsue : jamais de jet parasite au changement de cadence */
const sang = lire("cloudflare/public/modules/sang-rituel-decor-v1.js");
assert.ok(sang.includes("if(sc.__cleAt&&maintenant-sc.__cleAt<350)return;") && sang.includes("sc.__cleAt=performance.now();"), "garde de 350 ms après un changement de cadence");
assert.ok(sang.includes("paq[i].onanimationiteration=null;paq[i].style.animation='none';"), "nouvelle Animation à chaque changement de cadence");
assert.ok(sang.includes("sc.__flux=(m===1)") && sang.includes("if(sc.__flux)return;") && sang.includes("}else if(!attente&&m>1){"), "mode continu : ni jets distincts ni recalage");
/* machine à remonter le temps : nom au-dessus, « Meilleur butin d'or » + Or dessous ; cases de taille fixe */
const md = lire("cloudflare/public/modules/machine-dessin-v1.js");
assert.ok(md.includes('id="tmmNomMob" x="130" y="296"') && md.includes("function tailleNom(nom)"));
assert.ok(lire("cloudflare/public/soreal-idle-machine.css").includes(".tmm-machine .tmm-case .tmm-case-val.soreal-idle-alloc-pop-v1{display:block"), "le gonflement du chiffre ne change plus la taille des cases");
/* fond du Coffre : le dernier ouvert persiste (velours / tapis vert) */
const v = lire("cloudflare/public/modules/valise-v1.js");
assert.ok(v.includes("soreal_idle_dernier_ouvert_v1") && v.includes("noterDernier('valise')") && v.includes("noterDernier('coffre')") && v.includes(".vl-tapis .vl-velours-fond"));
assert.ok(lire("cloudflare/public/modules/ui-aventure-2-v1.js").includes("fondCoffre==='coffre'?' vl-tapis'"));
console.log("idle-divers-2026-10-23-v1 OK");
