import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Menu Admin, mode histoire (Norman, 2026-10-01) : un bouton par case pour générer la voix de cette étape seulement, et des corrections de
 * prononciation (« zinzin » lu « zinne zinne » au lieu de « zain zain »). La correction ne s'applique qu'à l'envoi au studio : le texte
 * affiché et l'empreinte du bloc ne changent pas.
 */
const source = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const document_ = { head: { appendChild() {} }, body: { appendChild() {} }, getElementById: () => null, createElement: () => ({ style: {} }), addEventListener() {} };
const window_ = { document: document_, __SOREAL_IDLE_CALL_V1__: () => Promise.resolve({ ok: true, histoires: [], boss: [] }) };
vm.runInNewContext(source, { window: window_, document: document_, setTimeout, fetch: () => Promise.reject(new Error("hors ligne")) });
const api = window_.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__;
const corriger = api.appliquerPrononciations;
assert.equal(typeof corriger, "function");

const liste = [{ mot: "zinzin", dit: "zain zain" }];
assert.equal(corriger("Il est un peu zinzin.", liste), "Il est un peu zain zain.");
assert.equal(corriger("ZINZIN ! Zinzin, zinzin.", liste), "zain zain ! zain zain, zain zain.", "sans tenir compte de la casse, plusieurs occurrences");
assert.equal(corriger("un zinzinophile", liste), "un zinzinophile", "mot entier seulement");
assert.equal(corriger("le zinzin-là", liste), "le zain zain-là", "ponctuation comme frontière");
assert.equal(corriger("Rien à corriger", liste), "Rien à corriger");
assert.equal(corriger("Texte", []), "Texte");
assert.equal(corriger("Texte", undefined), "Texte");
// Les caractères spéciaux d'une expression régulière sont traités comme du texte.
assert.equal(corriger("a (b) c", [{ mot: "(b)", dit: "bé" }]), "a bé c", "les parenthèses sont du texte, pas une expression régulière");
assert.equal(corriger("coût 3.5 €", [{ mot: "3.5", dit: "trois virgule cinq" }]), "coût trois virgule cinq €");
// Le mot le plus long l'emporte sur un mot plus court qui le contient.
assert.equal(corriger("pot de vin", [{ mot: "vin", dit: "vain" }, { mot: "pot de vin", dit: "po de vain" }]), "po de vain");
// Une accentuation fait partie du mot.
assert.equal(corriger("été et ete", [{ mot: "été", dit: "ayté" }]), "ayté et ete");

// --- Le bouton par case et l'application à l'envoi au studio ---
assert.match(source, /data-adm-e="generer" data-i="'\+i\+'"/, "un bouton « Générer la voix » par étape");
assert.match(source, /function genererEtape_\(i\)/);
assert.match(source, /blocsDeEtape_\(etape\|\|\{\}\)/, "uniquement les blocs de CETTE étape");
assert.match(source, /if\(a==='generer'\)\{genererEtape_\(i\);return;\}/);
assert.match(source, /function synthetiser_\(texte,parleur\)\{\s*texte=appliquerPrononciations_\(texte,lirePrononciations_\(\)\);/, "correction appliquée à l'envoi au studio");
// Le hash du bloc est calculé sur le texte d'origine (blocsDeTexte_) : aucune voix existante n'est invalidée par une correction.
assert.match(source, /hash:t\.hashBloc\(e\.chunk\)/);
assert.ok(!/hashBloc\(appliquerPrononciations_/.test(source), "l'empreinte ne dépend jamais de la correction");
// Interface de correction.
assert.match(source, /data-adm-g="pron-ajouter"/);
assert.match(source, /data-adm-g="pron-tester"/);
assert.match(source, /data-adm-p="suppr"/);
assert.match(source, /localStorage\.setItem\(CLE_PRONONCIATIONS/);

console.log("idle-admin-prononciation-v1: OK");
