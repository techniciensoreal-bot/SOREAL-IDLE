import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Norman (2026-11-01) : « ces entêtes sont beaucoup trop grandes : INPUT dans son petit cadre, à droite un cadre PLAFOND D'ÉNERGIE + IDLE (chacun dans son petit cadre), puis le même cadre pour la MAGIE, sur la même ligne ».
 * Rangée unique en PC large ; empilé sur téléphone ; aucun !important ajouté (plafond de l'audit d'architecture).
 */
const lire = (p) => readFileSync("cloudflare/public/" + p, "utf8");
const css = lire("soreal-idle-entetes-compactes-v1.css");
const alloc = lire("modules/barre-allocation-v1.js");
const aug = lire("modules/augmentations-page-v1.js");
const blood = lire("modules/blood-magic-v1.js");
const entr = lire("modules/ui-entrainement-v1.js");
const ngu = lire("modules/ngu-labo-v1.js");
const meta = lire("modules/meta-progression-v130.js") + lirePagesMeta();
const html = lire("index.html");

/* 1. Le gabarit commun : cadre Input, cadre de ressource (Plafond + Idle + total). */
assert.ok(alloc.includes('class="soreal-idle-bt-groupe-v1" data-bt-groupe-v1="'), "cadres() range une ressource dans un cadre groupe");
assert.ok(alloc.includes('data-alloc-cadre-v1="cap-') && alloc.includes('data-alloc-cadre-v1="idle-'), "les deux petits cadres Plafond et Idle restent distincts");
assert.ok(alloc.includes('class="soreal-idle-bt-entree-v1"><div class="soreal-idle-bt-input-box-v120"'), "entree() range le champ Input dans son petit cadre");
for (const [nom, src] of [["augmentations", aug], ["magie du sang", blood], ["entraînement", entr]]) {
  assert.ok(src.includes('soreal-idle-bt-entree-v1') && src.includes('soreal-idle-bt-groupe-v1'), nom + " : cadre Input + cadre de ressource");
}
assert.equal((aug.match(/class="soreal-idle-bt-groupe-v1" data-bt-groupe-v1="energy"/g) || []).length, 2, "Augmentations et Entraînement avancé : un groupe énergie chacun");
assert.ok(ngu.includes("soreal-idle-bt-groupe-v1") && ngu.includes("soreal-idle-bt-entree-v1 nl-ligne"), "NGU : Input + groupe");
assert.ok(meta.includes("A.entree(") && meta.includes("A.cadres("), "pages génériques : entree() puis cadres() par ressource");

/* 2. « Mes nombres » se pose juste après la boîte Input, donc DANS le cadre Input (perso-boutons-v1 insère après boite.nextSibling). */
const perso = lire("modules/perso-boutons-v1.js");
assert.ok(perso.includes("boite.parentNode.insertBefore(r,boite.nextSibling)") && perso.includes("data-morph-garder"), "Mes nombres suit la boîte Input et garde data-morph-garder");

/* 3. CSS : une rangée en PC large (Input + une colonne par ressource), pile sur téléphone, groupes à deux petits cadres. */
assert.ok(/@media \(min-width:1360px\)\{[^@]*--bt-cols:minmax\(0,\.8fr\) repeat\(var\(--bt-n,1\),minmax\(0,1\.2fr\)\)/.test(css), "rangée unique : Input puis une colonne par ressource");
assert.ok(css.includes("--bt-n:2") && css.includes("--bt-n:3"), "nombre de ressources déduit des groupes");
assert.ok(/\.soreal-idle-bt-groupe-v1\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(css), "un groupe = deux petits cadres côte à côte");
assert.ok(/@media \(max-width:700px\)\{[\s\S]*\.soreal-idle-bt-groupe-v1(?:,[^{]*)?\{grid-template-columns:minmax\(0,1fr\)[;}]/.test(css), "téléphone : groupes empilés");
assert.ok(css.includes(".soreal-idle-bt-groupe-v1>.soreal-idle-bt-total-v1{grid-column:1/-1}"), "le total placé reste, fin, sous les deux petits cadres");
assert.ok(css.includes("--bt-btn-h:28px"), "boutons plus petits");
assert.ok(!/!important/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun !important dans la nouvelle feuille");

/* 4. Les anciennes règles à !important lisent les variables (sinon la feuille compacte n'aurait aucun effet) ; les règles « enfant direct » sont devenues « descendant » (les cadres sont maintenant dans un groupe). */
const barres = lire("soreal-idle-barre-outils.css");
const itopod = lire("soreal-idle-itopod.css");
assert.ok(barres.includes("min-height:var(--bt-btn-h,44px)!important") && barres.includes("font-size:var(--bt-btn-fs,16px)!important"), "hauteur et police des boutons pilotées par variables");
assert.ok(barres.includes("minmax(var(--bt-col-min,64px),1fr)"), "colonnes minimales pilotées par variable");
assert.ok(itopod.includes("grid-template-columns:var(--bt-cols,repeat(2,minmax(0,1fr)))!important") && itopod.includes("grid-column:var(--bt-gc,1/-1)"), "grille de la barre d'outils pilotée par variables");
assert.ok(!/soreal-idle-bt-toolbar-v120>\.soreal-idle-bt-(presets|input-box|total)/.test(itopod + barres), "plus de règle « enfant direct » sur les cadres, désormais dans un groupe");

/* 5. Feuille chargée, pas de nouveau texte joueur. */
assert.ok(/soreal-idle-entetes-compactes-v1\.css\?v=\d+/.test(html), "feuille chargée par index.html");
assert.ok(html.indexOf("soreal-idle-entetes-compactes-v1.css") > html.indexOf("soreal-idle-barre-outils.css"), "chargée après barre-outils.css");
assert.ok(!/wiki/i.test(css), "aucun texte joueur");

console.log("idle-entetes-allocation-compactes-v1: OK");
