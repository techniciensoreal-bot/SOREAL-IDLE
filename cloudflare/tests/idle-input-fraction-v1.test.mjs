import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Dans les input où on peut choisir la valeur qu'on désire, je veux
 * qu'on puisse écrire 1/8 pour prendre 1/8 de notre énergie. Quand on valide ou qu'on clique
 * en dehors de la zone d'input, ça se transforme en ce que correspond 1/8 de notre énergie
 * idle. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const augMod = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// 1. Fonction pure idleParseFractionEnergieV1_ : "n/d" -> floor(energieLibre*n/d), jamais moins que 1 ; sinon null.
{
  const bloc = ui.slice(ui.indexOf("function idleParseFractionEnergieV1_("), ui.indexOf("function idleResoudreFractionInputV1_("));
  const fabrique = new Function("idleNombre_", bloc + "\nreturn idleParseFractionEnergieV1_;");
  const idleParseFractionEnergieV1_ = fabrique((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; });

  assert.equal(idleParseFractionEnergieV1_("1/8", 1000), 125);
  assert.equal(idleParseFractionEnergieV1_("1/2", 999), 499, "arrondi au sol, jamais arrondi au-dessus");
  assert.equal(idleParseFractionEnergieV1_(" 3 / 4 ", 100), 75, "espaces autour du /");
  assert.equal(idleParseFractionEnergieV1_("1/8", 1), 1, "jamais moins que 1, même si le calcul donne 0");
  assert.equal(idleParseFractionEnergieV1_("125", 1000), null, "un nombre simple n'est pas une fraction");
  assert.equal(idleParseFractionEnergieV1_("", 1000), null, "champ vide -> pas une fraction");
  assert.equal(idleParseFractionEnergieV1_("1/0", 1000), null, "division par zéro refusée");
  assert.equal(idleParseFractionEnergieV1_("abc", 1000), null, "texte quelconque -> pas une fraction");
}

// 2. Les 3 champs "Input" (Basic Training, Augmentations, Time Machine) sont bien en type="text"
//    (un input type="number" rejette le caractère "/" avant même que l'utilisateur ait fini de taper)
//    et branchés sur le résolveur de fraction via onblur.
assert.match(ui, /id="sorealIdleTrainingInputV120"[\s\S]{0,120}type="text"/, "Basic Training : input en texte, pas en nombre");
assert.match(ui, /id="sorealIdleTrainingInputV120"[\s\S]{0,600}onblur="window\.__resoudreFractionInputIdleV1__\(this\);/, "Basic Training : branché sur le résolveur de fraction");
assert.match(augMod, /id="sorealIdleAugInputV1" type="text"/, "Augmentations : input en texte, pas en nombre");
assert.match(augMod, /id="sorealIdleAugInputV1"[\s\S]{0,260}onblur="window\.__resoudreFractionInputIdleV1__\(this\)/, "Augmentations : branché sur le résolveur de fraction");
assert.match(augMod, /id="sorealIdleTmInputV1" type="text"/, "Time Machine : input en texte, pas en nombre");
assert.match(augMod, /id="sorealIdleTmInputV1"[\s\S]{0,260}onblur="window\.__resoudreFractionInputIdleV1__\(this\)/, "Time Machine : branché sur le résolveur de fraction");

// 3. Le résolveur global est bien exposé (pont pour les autres modules).
assert.match(ui, /window\.__resoudreFractionInputIdleV1__=idleResoudreFractionInputV1_;/);

/*
 * 4. Norman (2026-09-29) : « Je veux que les zones de saisies Input conservent le dernier chiffre
 * écrit. » Basic Training affichait "125" en dur dans son modèle HTML -- chaque re-rendu complet
 * de la page (la synchro périodique, entre autres) effaçait donc ce que le joueur venait de taper,
 * jamais persisté nulle part. La valeur doit désormais venir de la même source partagée et
 * persistée (localStorage) que les trois autres champs Input, et la mettre à jour dès la frappe
 * (oninput), pas seulement à la validation (onblur).
 */
assert.ok(!ui.includes('value="125"'), "plus de valeur \"125\" figée en dur dans le modèle HTML de Basic Training");
assert.match(ui, /id="sorealIdleTrainingInputV120"[\s\S]{0,260}value="\$\{idleHtml_\(String\(window\.__lireMontantAugmentIdleV1__\?window\.__lireMontantAugmentIdleV1__\(\):125\)\)\}"/, "la valeur initiale vient de la valeur partagée persistée, jamais figée en dur");
assert.match(ui, /id="sorealIdleTrainingInputV120"[\s\S]{0,600}oninput="window\.__saisirMontantAugmentIdleV1__&&window\.__saisirMontantAugmentIdleV1__\(this\.value\)"/, "Basic Training doit aussi persister dès la frappe (oninput), pas seulement à la validation");

// 5. La valeur partagée (module Augmentations/Blood Magic/Time Machine) est bien lue depuis
//    localStorage au chargement, et chaque saisie la ré-écrit -- comportement testé en exécutant
//    réellement le module dans un bac à sable avec un faux localStorage.
{
  function chargerAvecStockage(stockage) {
    const window_ = {};
    const document_ = { getElementById: () => null };
    const sandbox = {
      window: window_,
      document: document_,
      localStorage: stockage,
      SOREAL_SESSION: null,
      Math, Number, Object, Array, Boolean, String, JSON, Date, console
    };
    vm.createContext(sandbox);
    try {
      vm.runInContext(augMod, sandbox);
    } catch (_e) {
      // Le module dépend d'autres globales absentes de ce bac à sable minimal (window.__SOREAL_IDLE_META_HOST_V130__, etc.) :
      // seules les deux fonctions exposées avant tout appel réel à ces dépendances nous intéressent ici.
    }
    return window_;
  }

  // localStorage vide -> repli sur 125 (comportement historique, jamais un autre nombre inventé).
  {
    const stockage = { v: null, getItem() { return this.v; }, setItem(_k, x) { this.v = x; } };
    const w = chargerAvecStockage(stockage);
    assert.equal(w.__lireMontantAugmentIdleV1__(), 125, "rien en localStorage -> repli sur 125");
  }

  // localStorage contient une valeur déjà écrite lors d'une session précédente -> reprise telle quelle.
  {
    const stockage = { v: "777", getItem() { return this.v; }, setItem(_k, x) { this.v = x; } };
    const w = chargerAvecStockage(stockage);
    assert.equal(w.__lireMontantAugmentIdleV1__(), 777, "la valeur d'une session précédente doit être reprise au chargement");
  }

  // localStorage corrompu/non numérique -> jamais un plantage, repli sur 125.
  {
    const stockage = { v: "pas-un-nombre", getItem() { return this.v; }, setItem(_k, x) { this.v = x; } };
    const w = chargerAvecStockage(stockage);
    assert.equal(w.__lireMontantAugmentIdleV1__(), 125, "valeur corrompue en localStorage -> repli sur 125, jamais un plantage");
  }

  // Saisir une nouvelle valeur la persiste immédiatement dans localStorage (survivra donc à un rechargement).
  {
    const stockage = { v: null, getItem() { return this.v; }, setItem(_k, x) { this.v = x; } };
    const w = chargerAvecStockage(stockage);
    w.__saisirMontantAugmentIdleV1__("450");
    assert.equal(w.__lireMontantAugmentIdleV1__(), 450);
    assert.equal(stockage.v, "450", "la saisie doit être écrite dans localStorage, pas seulement gardée en mémoire");
  }

  // Une saisie invalide (vide, négative, non numérique) est ignorée : ni la valeur ni localStorage ne changent.
  {
    const stockage = { v: "300", getItem() { return this.v; }, setItem(_k, x) { this.v = x; } };
    const w = chargerAvecStockage(stockage);
    w.__saisirMontantAugmentIdleV1__("abc");
    w.__saisirMontantAugmentIdleV1__("-5");
    w.__saisirMontantAugmentIdleV1__("");
    assert.equal(w.__lireMontantAugmentIdleV1__(), 300, "saisie invalide -> valeur précédente conservée");
    assert.equal(stockage.v, "300", "saisie invalide -> localStorage jamais écrasé");
  }
}

console.log("idle-input-fraction-v1: OK");
