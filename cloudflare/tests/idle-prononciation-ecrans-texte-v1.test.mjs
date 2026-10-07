import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-03) : « je dois pouvoir changer la prononciation des mots pour chaque écran de texte ; par exemple Alien Vert Dégoûtant (boss 50) : il dit « Ali un » au lieu de « Alienne » ».
 * Les corrections (mot -> comment on le dit) existaient dans l'éditeur d'histoires ; elles sont maintenant aussi dans l'éditeur de textes (chroniques et noms de boss, popups, etc.).
 */
const histoires = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const textes = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");

// 1. La logique de correction partagée (extraite de l'éditeur d'histoires) : mot entier, casse et accents indifférents, sans toucher aux autres mots.
const extrait = [
  histoires.match(/var CLE_PRONONCIATIONS=[^\n]+\n/)[0],
  histoires.match(/function lirePrononciations_\(\)\{[\s\S]*?\n\}\n/)[0],
  histoires.match(/function ecrirePrononciations_\(liste\)\{[\s\S]*?\n\}\n/)[0],
  histoires.match(/function echapperRegex_\(m\)\{[^\n]+\n/)[0],
  histoires.match(/function appliquerPrononciations_\(texte,liste\)\{[\s\S]*?\n\}\n/)[0],
  "return {lire:lirePrononciations_,ecrire:ecrirePrononciations_,appliquer:appliquerPrononciations_};"
].join("\n");
const stockage = {};
const outils = new Function("localStorage", extrait)({ getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } });
assert.equal(outils.appliquer("Alien Vert Dégoûtant", [{ mot: "Alien", dit: "Alienne" }]), "Alienne Vert Dégoûtant", "Alien -> Alienne (le cas du boss 50)");
assert.equal(outils.appliquer("Un alien, des aliens.", [{ mot: "alien", dit: "alienne" }]), "Un alienne, des aliens.", "mot entier seulement, casse indifférente");
assert.equal(outils.appliquer("Salien", [{ mot: "alien", dit: "alienne" }]), "Salien", "jamais au milieu d'un autre mot");
outils.ecrire([{ mot: "Alien", dit: "Alienne" }]);
assert.equal(JSON.stringify(outils.lire()), JSON.stringify([{ mot: "Alien", dit: "Alienne" }]), "liste gardée sur ce PC");

// 2. L'éditeur d'histoires expose ces outils à l'éditeur de textes, plus un envoi « brut » (test d'une prononciation, sans seconde correction).
assert.ok(histoires.includes("lirePrononciations:lirePrononciations_,ecrirePrononciations:ecrirePrononciations_,appliquerPrononciations:appliquerPrononciations_"));
assert.ok(histoires.includes("synthetiserBrut:synthetiserBrut_"));
assert.ok(histoires.includes("return synthetiserBrut_(appliquerPrononciations_(texte,lirePrononciations_()),parleur,expr);"), "la génération applique toujours les corrections");

// 3. Chaque écran de texte (éditeur de textes) a le bloc « Prononciation » : ajouter, tester, lister, supprimer.
assert.ok(textes.includes("<div id=\"sorealIdleTextePronBlocV1\">'+prononciationsHtml_()+'</div>"), "bloc affiché dans chaque éditeur de texte");
for (const fragment of ['data-stx-act="pron-ajouter"', 'data-stx-act="pron-tester"', 'data-stx-pron="tester"', 'data-stx-pron="suppr"', "Mot (ex. Alien)", "Se prononce (ex. Alienne)"]) assert.ok(textes.includes(fragment), fragment);
assert.ok(textes.includes("if(act==='pron-ajouter'){ajouterPrononciation_();return;}") && textes.includes("supprimerPrononciation_(kPr)"), "câblé");

// 4. Les blocs concernés sont marqués « à refaire » et régénérés même si une voix existe (le hash ne change pas).
assert.ok(textes.includes("edition.aRefaire[b.hash]=true;n+=1;"), "blocs concernés marqués");
assert.ok(textes.includes("edition.voix.indexOf(b.hash)===-1||(edition.aRefaire&&edition.aRefaire[b.hash])"), "régénérés sans cocher « tout régénérer »");
assert.ok(textes.includes("if(edition.aRefaire)delete edition.aRefaire[b.hash];"), "marque levée après régénération");
assert.ok(textes.includes("aRefaire:{},lignes:{}}"), "état initialisé à chaque ouverture d'un texte");
// Le nom du boss fait partie des blocs lus (composerChronique(nom, texte)) : « Alien Vert Dégoûtant » est donc concerné par la correction.
assert.ok(textes.includes("t.composerChronique(nomLu,v.texte)"));
console.log("idle-prononciation-ecrans-texte-v1 OK");
