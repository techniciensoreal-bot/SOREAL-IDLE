import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, readdirSync } from "node:fs";
import { nettoyerUiPrefsV1 } from "../src/idle-ui-prefs-v1.js";

/*
 * Norman (2026-11-01, déjà signalé le 2026-10-29 et le 2026-10-31) : « Les chiffres dans INPUT ne se sauvegardent pas. » Causes trouvées et gardées ici :
 *  1. un champ Input encore actif quand on change de menu (navigation sans clic) était validé APRÈS le changement : son nombre partait dans le NOUVEAU menu (repro : 777 tapé dans Augmentations,
 *     500 tapé dans NGU, retour = 500 à la place de 777) ;
 *  2. le menu NGU reprenait le texte du champ de la page précédente au lieu du nombre de SON menu ;
 *  3. « 1 000 », « 2,5k », « 5M » étaient refusés en silence (Number() donnait NaN) : affichés, jamais gardés, puis remplacés par l'ancien nombre ; un champ vidé ou à 0 restait affiché sans être gardé ;
 *  4. Départ / Fin d'ITOPOD et « Quantité personnalisée » de la Boutique EXP n'étaient gardés nulle part tant qu'on n'avait pas appliqué / acheté ;
 *  5. tout champ qui garde un nombre doit passer par localStorage avec une clé « soreal_idle_… » (règle n°6 : copiée sur le compte).
 */
const lire = (f) => readFileSync(new URL("../public/modules/" + f, import.meta.url), "utf8");
const aug = lire("augmentations-page-v1.js");
const ngu = lire("ngu-labo-v1.js");
const itopod = lire("itopod-perks-page-v1.js");
const boutique = lire("boutique-exp-page-v1.js");
const magie = lire("ui-magie-energie-v1.js");
const prefsCode = lire("prefs-compte-v1.js");

class Stock { constructor() { this.d = new Map(); } setItem(k, v) { this.d.set(String(k), String(v)); } getItem(k) { return this.d.has(String(k)) ? this.d.get(String(k)) : null; } removeItem(k) { this.d.delete(String(k)); } key(i) { return [...this.d.keys()][i] ?? null; } get length() { return this.d.size; } }

// 1. Lecteur de nombres tapés.
const analyser = (() => {
  const deb = aug.indexOf("window.__analyserMontantSaisieIdleV1__=function(texte){");
  const fin = aug.indexOf("window.__saisirMontantAugmentIdleV1__=function(v){");
  assert.ok(deb > 0 && fin > deb, "lecteur présent");
  const w = {};
  new Function("window", aug.slice(deb, fin))(w);
  return w.__analyserMontantSaisieIdleV1__;
})();
assert.equal(analyser("777"), 777);
assert.equal(analyser("1 000"), 1000, "espaces");
assert.equal(analyser("1\u00a0000\u00a0000"), 1000000, "espaces insécables (nombres affichés par le jeu)");
assert.equal(analyser("2,5k"), 2500, "virgule + suffixe");
assert.equal(analyser("5M"), 5e6);
assert.equal(analyser("3b"), 3e9);
assert.equal(analyser("1e9"), 1e9);
assert.equal(analyser("12.9"), 12, "arrondi au sol");
assert.equal(analyser(""), 0);
assert.equal(analyser("0"), 0);
assert.equal(analyser("abc"), 0);
assert.equal(analyser("-5"), 0);
assert.equal(analyser("1/8"), 0, "une fraction est résolue ailleurs");

// La saisie utilise ce lecteur, et les menus qui relisent le champ aussi.
assert.match(aug, /window\.__saisirMontantAugmentIdleV1__=function\(v\)\{\s*const n=window\.__analyserMontantSaisieIdleV1__\(v\);/);
assert.match(aug, /function montantAugmentLireIdleV1_\(\)\{[\s\S]{0,200}__analyserMontantSaisieIdleV1__/);
assert.match(ngu, /__analyserMontantSaisieIdleV1__/);
// Le résolveur de blur : fraction, sinon nombre lisible réécrit, sinon retour au nombre GARDÉ.
{
  const deb = magie.indexOf("function idleResoudreFractionInputV1_(input){");
  const fin = magie.indexOf("function formatEnergieIdleV50_(");
  const bloc = magie.slice(deb, fin);
  const w = { __analyserMontantSaisieIdleV1__: analyser, __lireMontantAugmentIdleV1__: () => 125 };
  const f = new Function("window", "REG", "idleParseFractionEnergieV1_", bloc + "\nreturn idleResoudreFractionInputV1_;")(w, { idleEtat: { energie: 800 } }, (v, e) => (/^1\/8$/.test(v) ? Math.floor(e / 8) : null));
  const champ = (v) => ({ value: v });
  let c = champ("1/8"); f(c); assert.equal(c.value, "100", "fraction");
  c = champ("2,5k"); f(c); assert.equal(c.value, "2500", "nombre lisible réécrit en entier");
  c = champ("1 000"); f(c); assert.equal(c.value, "1000");
  c = champ(""); f(c); assert.equal(c.value, "125", "champ vidé : le nombre gardé revient");
  c = champ("0"); f(c); assert.equal(c.value, "125", "zéro refusé : le nombre gardé revient");
  c = champ("abc"); f(c); assert.equal(c.value, "125");
}

// 2. Changement de menu : le champ actif est validé AVANT, dans le menu quitté.
{
  const deb = aug.indexOf("const CLE_MONTANTS_MENU_IDLE_V1=");
  const fin = aug.indexOf("function montantAugmentLireIdleV1_(){");
  const mem = new Stock();
  const fenetre = { __menuActifIdleV28__: () => "ngu" };
  let actif = null;
  const document = { get activeElement() { return actif; } };
  const fab = new Function("localStorage", "window", "document", "montantAugmentIdleV1", `
    let montantAugmentIdleV1_ = montantAugmentIdleV1;
    ${aug.slice(deb, fin).replace(/montantAugmentIdleV1\b/g, "montantAugmentIdleV1_")}
    window.__saisirMontantAugmentIdleV1__ = function(v){ const n = Math.floor(Number(v)); if (n >= 1) { montantAugmentIdleV1_ = n; localStorage.setItem('soreal_idle_montant_input_v1', String(n)); memoriserMontantMenuIdleV1_(); } };
    return { lire: () => montantAugmentIdleV1_ };
  `);
  const m = fab(mem, fenetre, document, 125);
  const API = fenetre.__SOREAL_IDLE_INPUT_MENU_V1__;
  API.init("augmentations");
  fenetre.__saisirMontantAugmentIdleV1__(777);
  API.changer("ngu");
  fenetre.__saisirMontantAugmentIdleV1__(500);
  // Navigation sans clic pendant que le champ est actif : le « blur » arrive pendant le changement, jamais après.
  actif = { tagName: "INPUT", id: "sorealIdleAugInputV1", blur() { actif = null; fenetre.__saisirMontantAugmentIdleV1__(500); } };
  API.changer("augmentations");
  assert.equal(m.lire(), 777, "Augmentations retrouve 777");
  assert.deepEqual(JSON.parse(mem.getItem("soreal_idle_montants_menu_v1")), { augmentations: 777, ngu: 500 }, "chaque menu garde SON nombre");
  // Simule l'ancien défaut : un blur tardif (menu déjà changé) écrase le nouveau menu : montre que la garde est bien dans « changer ».
  assert.match(aug, /actif\.blur\(\)/);
}

// 3. NGU : ne reprend le texte du champ que s'il est dans la page des NGU.
assert.match(ngu, /var valeur=el&&el\.value&&el\.closest&&el\.closest\('\.nl-v1'\)\?el\.value:/);

// 4a. ITOPOD : brouillon Départ / Fin.
{
  const deb = itopod.indexOf("const CLE_BROUILLON_ITOPOD_V1=");
  const fin = itopod.indexOf("function itopodEtagesIdleV1_(){");
  assert.ok(deb > 0 && fin > deb);
  const stock = new Stock();
  const champs = { itopodDebutV1: { value: "12" }, itopodFinV1: { value: "40" } };
  const document = { getElementById: (id) => champs[id] || null };
  const api = new Function("localStorage", "document", "window", itopod.slice(deb, fin) + "\nreturn { lire: lireBrouillonItopodIdleV1_, ecrire: ecrireBrouillonItopodIdleV1_, effacer: effacerBrouillonItopodIdleV1_, cle: CLE_BROUILLON_ITOPOD_V1 };")(stock, document, {});
  assert.equal(api.lire(), null);
  api.ecrire();
  assert.deepEqual(api.lire(), { d: 12, f: 40 }, "le nombre tapé survit (redessin, menu, rechargement)");
  champs.itopodDebutV1.value = "";          // champ vidé en cours de frappe : l'ancien brouillon reste
  api.ecrire();
  assert.deepEqual(api.lire(), { d: 12, f: 40 });
  api.effacer();
  assert.equal(api.lire(), null, "Appliquer / Auto effacent le brouillon");
  assert.match(api.cle, /^soreal_idle_/, "clé liée au compte");
}
assert.match(itopod, /oninput="window\.__itopodBrouillonIdleV1__\(\)"/, "chaque frappe est gardée");
assert.match(itopod, /function itopodPasIdleV1_[\s\S]{0,300}ecrireBrouillonItopodIdleV1_\(\)/, "− et + aussi");
assert.match(itopod, /function itopodEtagesIdleV1_\(\)\{[\s\S]{0,200}effacerBrouillonItopodIdleV1_\(\)/);
assert.match(itopod, /function itopodAutoIdleV1_\(\)\{\s*effacerBrouillonItopodIdleV1_\(\)/);
assert.match(itopod, /'Départ '\+debut\+' → fin '\+fin/, "le texte « Départ → fin » reste celui du serveur");

// 4b. Boutique EXP : quantité personnalisée gardée par champ.
{
  const deb = boutique.indexOf("const CLE_LOTS_EXP_IDLE_V1=");
  const fin = boutique.indexOf("function idleExpQuantiteChampIdleV1_(");
  assert.ok(deb > 0 && fin > deb);
  const stock = new Stock();
  const api = new Function("localStorage", boutique.slice(deb, fin) + "\nreturn { lire: idleExpLotGardeIdleV1_, ecrire: idleExpLotMemoriserIdleV1_, cle: CLE_LOTS_EXP_IDLE_V1 };")(stock);
  assert.equal(api.lire("idle-exp-qty-energy-cap"), 0);
  api.ecrire("idle-exp-qty-energy-cap", 37);
  assert.equal(api.lire("idle-exp-qty-energy-cap"), 37);
  api.ecrire("idle-exp-qty-energy-cap", 0);
  assert.equal(api.lire("idle-exp-qty-energy-cap"), 37, "une quantité invalide n'efface pas la gardée");
  for (let i = 0; i < 80; i += 1) api.ecrire("idle-exp-qty-x-" + i, 2);
  assert.ok(Object.keys(JSON.parse(stock.getItem(api.cle))).length <= 61, "borné");
  assert.match(api.cle, /^soreal_idle_/);
}
assert.match(boutique, /idleExpLotMemoriserIdleV1_\(input\.id,qty\);/, "chaque frappe, −, + et Max passent par l'aperçu qui garde la quantité");
assert.match(boutique, /value="'\+valeurChamp\+'"/, "le champ est redessiné avec la quantité gardée");

// 5. Les clés des champs sont suivies par le compte, jamais exclues, jamais refusées par le serveur ; vrai module sur faux navigateur.
const CLES_CHAMPS = ["soreal_idle_montant_input_v1", "soreal_idle_montants_menu_v1", "soreal_idle_input_perso_v1", "soreal_idle_pct_perso_v1", "soreal_idle_wandoos_saisie_v1", "soreal_idle_itopod_etages_v1", "soreal_idle_exp_lots_v1"];
{
  const local = new Stock(), session = new Stock();
  const minuteries = [];
  let serveur = {};
  const fen = {
    Storage: Stock, localStorage: local, sessionStorage: session, Object, Array, Promise, Date, String, Number, Boolean, JSON,
    document: { hidden: false, addEventListener() {} }, addEventListener() {},
    setTimeout: (f) => { minuteries.push({ f }); return minuteries.length; }, clearTimeout() {}, location: { reload() {} },
    __SOREAL_IDLE_CALL_V1__: async (op, args) => { for (const [k, v] of Object.entries(args[0].prefs)) { if (v === null) delete serveur[k]; else serveur[k] = v; } return { ok: true }; }
  };
  fen.window = fen;
  vm.runInNewContext(prefsCode, fen, { filename: "prefs-compte-v1.js" });
  const P = fen.__SOREAL_IDLE_PREFS_V1__;
  for (const c of CLES_CHAMPS) assert.equal(P.suivie(c), true, c + " est suivie par le compte");
  Stock.prototype.setItem.call(local, "x", "y");
  // Le module remplace Storage.prototype.setItem du faux navigateur : on écrit via le prototype modifié.
  for (const c of CLES_CHAMPS) local.setItem(c, "42");
  for (let i = 0; i < 6; i += 1) { const m = minuteries.splice(0); for (const x of m) x.f(); await new Promise((r) => setImmediate(r)); }
  for (const c of CLES_CHAMPS) assert.equal(serveur[c], "42", c + " arrive sur le compte");
  assert.deepEqual(Object.keys(nettoyerUiPrefsV1(serveur)).sort(), [...CLES_CHAMPS].sort(), "le coffre du serveur les garde");
}

// 6. Garde-fou d'inventaire : tout champ <input type=text|number> du jeu est classé. Un nouveau champ doit être ajouté ici (avec où sa valeur est gardée) ou le test échoue.
{
  const CLASSES = {
    // valeur de jeu dans l'état du serveur (actions setNguTarget, setAugmentTarget, towerFloors…) ou saisie d'un seul coup
    "augmentations-page-v1.js": 8, "ngu-labo-v1.js": 3, "itopod-perks-page-v1.js": 1, "boutique-exp-page-v1.js": 1,
    // Input partagé / par menu : soreal_idle_montant_input_v1 + soreal_idle_montants_menu_v1
    "barre-allocation-v1.js": 1, "blood-magic-v1.js": 1, "ui-entrainement-v1.js": 1,
    // fenêtre de saisie ponctuelle (valeur gardée par définirInput / définir : soreal_idle_input_perso_v1, soreal_idle_pct_perso_v1)
    "perso-boutons-v1.js": 1,
    // pseudo : identité du compte (serveur)
    "ui-chroniques-v1.js": 1, "ui-popups-v1.js": 1,
    // administrateur uniquement
    "admin-histoires-v1.js": 3, "admin-tutoriel-v1.js": 4, "textes-admin-v1.js": 5, "credit-exp-admin-v1.js": 2, "admin-saviez-vous-v1.js": 1,
    // angle d'une pièce du badavatar : enregistré dans le profil du compte (serveur, bouton Enregistrer), pas dans les préférences
    "profil-badavatar-editeur-v1.js": 1,
    // sans nombre à garder
    "ui-renaissance-v1.js": 1
  };
  const dossier = new URL("../public/modules/", import.meta.url);
  const trouves = {};
  for (const f of readdirSync(dossier)) {
    if (!f.endsWith(".js")) continue;
    const t = readFileSync(new URL(f, dossier), "utf8");
    const n = (t.match(/<input[^>]*type=\\?["'](?:text|number)["']/g) || []).length;
    if (n) trouves[f] = n;
  }
  for (const [f, n] of Object.entries(trouves)) assert.ok(f in CLASSES, "champ de saisie non classé dans " + f + " : indique où sa valeur est gardée (règle n°6) puis ajoute-le à CLASSES");
  for (const [f, n] of Object.entries(trouves)) assert.ok(n <= CLASSES[f], "nouveau champ de saisie dans " + f + " (" + n + " > " + CLASSES[f] + ") : classe-le");
}

console.log("OK idle-saisies-input-conservees-v1");
