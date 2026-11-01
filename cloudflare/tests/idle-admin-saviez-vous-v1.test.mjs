import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";
import { normaliserTexteV1, enregistrerTexteV1, lireTextesV1, surchargesPourJoueurV1, supprimerTexteV1, IDLE_TEXTE_CLE_SAVIEZ_V1 } from "../src/idle-textes-v1.js";

/*
 * Norman (2026-11-01) : « Il faut que dans Admin, je puisse ajouter des phrases qui suivent "Le saviez-vous ?" » (panneau LED de la borne).
 * Stockage : surcharge de texte GLOBALE `saviez-vous:borne` (champs.liste FR, listeEn EN, remplace) ; mêmes opérations d'administration que les autres textes ; lue par les joueurs avec les textes déjà synchronisés.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const CLE = IDLE_TEXTE_CLE_SAVIEZ_V1;
assert.equal(CLE, "saviez-vous:borne");

// ---------- 1. validation SERVEUR ----------
const ok = normaliserTexteV1({ cle: CLE, champs: { liste: ["  Les boss  aiment les câlins ", "Deuxième"], listeEn: ["Bosses love hugs"], remplace: "1" } });
assert.deepEqual(ok.champs, { liste: ["Les boss aiment les câlins", "Deuxième"], listeEn: ["Bosses love hugs", ""], remplace: "1" }, "normalisé : espaces, anglais aligné, remplace");
assert.equal(normaliserTexteV1({ cle: CLE, champs: { liste: ["a"] } }).champs.remplace, "0", "défaut : les phrases s'ajoutent");
assert.equal(normaliserTexteV1({ cle: CLE, champs: { liste: ["a"], remplace: true } }).champs.remplace, "1");
const refus = (champs, code) => assert.throws(() => normaliserTexteV1({ cle: CLE, champs }), (e) => e.message === code, code + " pour " + JSON.stringify(champs).slice(0, 80));
refus({ liste: ["x".repeat(91)] }, "TEXTE_SAVIEZ_PHRASE_TROP_LONGUE");
assert.equal(normaliserTexteV1({ cle: CLE, champs: { liste: ["x".repeat(90)] } }).champs.liste[0].length, 90, "90 caractères : accepté");
assert.equal(normaliserTexteV1({ cle: CLE, champs: { liste: ["é".repeat(90)] } }).champs.liste[0].length, 90);
refus({ liste: ["ok"], listeEn: ["y".repeat(91)] }, "TEXTE_SAVIEZ_PHRASE_TROP_LONGUE");
refus({ liste: ["<b>gras</b>"] }, "TEXTE_SAVIEZ_HTML_REFUSE");
refus({ liste: ["ok"], listeEn: ["<img src=x onerror=1>"] }, "TEXTE_SAVIEZ_HTML_REFUSE");
refus({ liste: ["a > b"] }, "TEXTE_SAVIEZ_HTML_REFUSE");
refus({ liste: ["ligne1\nligne2"] }, "TEXTE_SAVIEZ_CARACTERE_INTERDIT");
refus({ liste: ["tab\tici"] }, "TEXTE_SAVIEZ_CARACTERE_INTERDIT");
refus({ liste: ["nul\u0000"] }, "TEXTE_SAVIEZ_CARACTERE_INTERDIT");
refus({ liste: ["sép arateur"] }, "TEXTE_SAVIEZ_CARACTERE_INTERDIT");
refus({ liste: ["invisible​zéro"] }, "TEXTE_SAVIEZ_CARACTERE_INTERDIT");
refus({ liste: ["   "] }, "TEXTE_SAVIEZ_PHRASE_VIDE");
refus({ liste: [] }, "TEXTE_SAVIEZ_LISTE_REQUISE");
refus({}, "TEXTE_SAVIEZ_LISTE_REQUISE");
refus({ liste: "une seule chaîne" }, "TEXTE_SAVIEZ_LISTE_REQUISE");
refus({ liste: [42] }, "TEXTE_SAVIEZ_PHRASE_INVALIDE");
refus({ liste: [{ a: 1 }] }, "TEXTE_SAVIEZ_PHRASE_INVALIDE");
refus({ liste: ["a"], listeEn: ["a", "b"] }, "TEXTE_SAVIEZ_LISTE_EN_INVALIDE");
refus({ liste: ["a"], autre: "x" }, "TEXTE_CHAMP_INVALIDE");
// nombre maximal : 200 acceptées, 201 refusées (le plafond général de 40 des autres listes ne s'applique pas ici)
assert.equal(normaliserTexteV1({ cle: CLE, champs: { liste: Array.from({ length: 200 }, (_x, i) => "Phrase " + i) } }).champs.liste.length, 200);
refus({ liste: Array.from({ length: 201 }, (_x, i) => "Phrase " + i) }, "TEXTE_SAVIEZ_TROP_DE_PHRASES");
// les champs de voix des autres textes sont ignorés pour cette clé : jamais de texte parlé ni de voix
const sansVoix = normaliserTexteV1({ cle: CLE, champs: { liste: ["a"] }, parle: { liste: ["voix"] }, voix: ["0123456789abcd"], voixTextes: { "0123456789abcd": "x" } });
assert.deepEqual([sansVoix.parle, sansVoix.voix, sansVoix.voixTextes], [{}, [], {}]);

// ---------- 2. stockage, lecture par un joueur, suppression ----------
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
enregistrerTexteV1(sql, { cle: CLE, champs: { liste: ["Première phrase", "Seconde phrase"], listeEn: ["First sentence"], remplace: "0" } });
assert.equal(lireTextesV1(sql).length, 1);
const joueur = surchargesPourJoueurV1(sql);
assert.deepEqual(joueur.popups[CLE].champs, { liste: ["Première phrase", "Seconde phrase"], listeEn: ["First sentence", ""], remplace: "0" }, "un joueur reçoit la liste avec les autres textes");
supprimerTexteV1(sql, CLE);
assert.equal(surchargesPourJoueurV1(sql).popups[CLE], undefined, "« Remettre les 5 phrases d'origine » = suppression de la surcharge");
// une ligne stockée invalide (modifiée à la main) est ignorée à la lecture au lieu de casser les textes
sql.exec("INSERT OR REPLACE INTO idle_textes(cle,json,maj) VALUES(?,?,?)", CLE, JSON.stringify({ champs: { liste: ["<script>x</script>"] } }), 1);
assert.equal(lireTextesV1(sql).length, 0, "une liste invalide n'est jamais servie");

// ---------- 3. écriture réservée à l'administrateur (mêmes opérations que les autres textes) ----------
const admin = lire("src/idle-runtime-admin.js");
const ecrire = admin.slice(admin.indexOf("export function enregistrerTexteAdminSorealIdle"), admin.indexOf("export function supprimerTexteAdminSorealIdle"));
assert.ok(ecrire.startsWith("export function enregistrerTexteAdminSorealIdle(sessionToken, texte) {\n  exigerAdminHistoiresSorealIdle_(sessionToken);"), "enregistrer : contrôle administrateur en première ligne");
assert.ok(/export function supprimerTexteAdminSorealIdle\(sessionToken, cle\) \{\n  exigerAdminHistoiresSorealIdle_\(sessionToken\);/.test(admin), "supprimer : contrôle administrateur en première ligne");
assert.ok(admin.includes("export function obtenirTextesSurchargesSorealIdle(sessionToken) {\n  exigerAccesSorealIdle_(sessionToken);"), "lecture : tout joueur ayant accès, aucune requête de plus (textes déjà synchronisés)");
// la liste voyage avec les textes déjà exportés au moteur local (jeu local, règle n°7) : aucune opération ni liste à déclarer de plus
const sync = lire("src/idle-local-sync-v1.js");
assert.ok(sync.includes("textesPourMoteurLocalV1") && !sync.includes("saviez"), "export générique des textes : rien de propre à cette clé");

// ---------- 4. côté page : lecture, tirage, éditeur ----------
function monde({ champs = null, led = null } = {}) {
  const w = { __SOREAL_IDLE_TEXTES_V1__: { surcharge: (cle) => (cle === CLE ? champs : null) }, __SOREAL_IDLE_BORNE_LED_V1__: led };
  const d = { addEventListener() {}, getElementById() { return null; }, createElement() { return { innerHTML: "" }; } };
  vm.runInNewContext(lire("public/modules/admin-saviez-vous-v1.js"), { window: w, document: d, Math, Array, String, setTimeout() {}, clearTimeout() {} });
  return w.__SOREAL_IDLE_SAVIEZ_VOUS_V1__;
}
const ORIGINE = ["O1", "O2", "O3", "O4", "O5"];
const tires = (M, langue, n = 600) => { const s = new Set(); let der = ""; for (let i = 0; i < n; i++) { const t = M.tirer(langue, der, ORIGINE); s.add(t); if (t) der = t; } return s; };
// aucune phrase d'administrateur : '' (le panneau garde ses cinq phrases)
assert.equal(monde().tirer("fr", "", ORIGINE), "");
assert.equal(monde({ champs: { liste: [], listeEn: [], remplace: "0" } }).tirer("fr", "", ORIGINE), "");
// par défaut : les phrases de l'administrateur S'AJOUTENT aux cinq d'origine
const Ma = monde({ champs: { liste: ["Adm FR 1", "Adm FR 2"], listeEn: ["Adm EN 1", ""], remplace: "0" } });
const fr = tires(Ma, "fr");
assert.deepEqual([...fr].sort(), [...ORIGINE, "Adm FR 1", "Adm FR 2"].sort(), "ajout : origine + administrateur, français");
// anglais : seulement les phrases qui ont une version anglaise (jamais du français dans un jeu en anglais)
assert.deepEqual([...tires(Ma, "en")].sort(), [...ORIGINE, "Adm EN 1"].sort());
// « Remplacer les phrases d'origine »
const Mr = monde({ champs: { liste: ["Adm FR 1", "Adm FR 2"], listeEn: ["Adm EN 1", ""], remplace: "1" } });
assert.deepEqual([...tires(Mr, "fr")].sort(), ["Adm FR 1", "Adm FR 2"]);
assert.deepEqual([...tires(Mr, "en")], ["Adm EN 1"]);
// remplacement mais aucune phrase anglaise : '' -> le panneau garde ses phrases d'origine (jamais un panneau vide)
assert.equal(monde({ champs: { liste: ["Seulement FR"], listeEn: [""], remplace: "1" } }).tirer("en", "", ORIGINE), "");
// jamais la même phrase deux fois de suite
{
  const M = monde({ champs: { liste: ["A", "B"], listeEn: [], remplace: "1" } });
  let der = "";
  for (let i = 0; i < 400; i++) { const t = M.tirer("fr", der, ORIGINE); assert.notEqual(t, der, "pas de répétition immédiate"); der = t; }
  assert.equal(monde({ champs: { liste: ["Seule"], listeEn: [], remplace: "1" } }).tirer("fr", "Seule", ORIGINE), "Seule", "une seule phrase : elle revient plutôt que rien");
}
// validation du brouillon (miroir du serveur)
const V = monde().valider;
assert.equal(V({ items: [{ fr: "x".repeat(91), en: "" }] }).ok, false);
assert.equal(V({ items: [{ fr: "<i>x</i>", en: "" }] }).ok, false);
assert.equal(V({ items: [{ fr: "ok", en: "a\nb" }] }).ok, false);
assert.equal(V({ items: [{ fr: "", en: "" }] }).ok, false, "au moins une phrase");
assert.equal(V({ items: [{ fr: "", en: "orpheline" }] }).ok, false, "phrase anglaise sans française");
assert.equal(V({ items: Array.from({ length: 201 }, () => ({ fr: "a", en: "" })) }).ok, false);
const v = V({ items: [{ fr: " Salut  toi ", en: "" }, { fr: "", en: "" }, { fr: "b", en: "B" }], remplace: true });
assert.deepEqual(JSON.parse(JSON.stringify(v.champs)), { liste: ["Salut toi", "b"], listeEn: ["", "B"], remplace: "1" }, "lignes vides ignorées, espaces nettoyés");
// le client et le serveur acceptent exactement la même chose
assert.ok(normaliserTexteV1({ cle: CLE, champs: v.champs }).champs.liste.length === 2);

// éditeur : interface Admin
const edSrc = lire("public/modules/admin-saviez-vous-v1.js");
const html = monde({ champs: { liste: ["Ma phrase \"citée\" & <test>"], listeEn: ["My sentence"], remplace: "1" } }).editeurHtml();
assert.ok(html.includes("Le saviez-vous ?") && html.includes("panneau de la borne"), "section « Le saviez-vous ? (panneau de la borne) »");
assert.ok(html.includes("rien qui révèle ce que le joueur n’a pas encore découvert") && html.includes("anti-spoil"), "rappel anti-spoil");
for (const k of ["data-sv-act=\"ajout\"", "data-sv-act=\"enreg\"", "data-sv-act=\"retablir\"", "data-sv-act=\"suppr\"", "data-sv-remplace", "canvas class=\"sv-apercu\"", "/ 90"]) assert.ok(html.includes(k), "éditeur : " + k);
assert.ok(html.includes("Remettre les 5 phrases d’origine") && html.includes("Remplacer les phrases d’origine") && html.includes("Aperçu sur le panneau"));
assert.ok(!html.includes("<test>") && html.includes("&lt;test&gt;") && html.includes("&quot;citée&quot;"), "le texte saisi est toujours échappé (jamais de HTML)");
assert.ok(/data-sv-remplace checked/.test(html), "case cochée quand la liste remplace");
assert.ok(!/innerHTML\s*=\s*[^;]*\.(fr|en)\b/.test(edSrc), "aucune phrase n'est injectée sans échappement");
assert.ok(edSrc.includes("enregistrerTexteAdminSorealIdle") && edSrc.includes("supprimerTexteAdminSorealIdle") && edSrc.includes("majSimple"), "mêmes opérations que les textes d'administrateur");
assert.ok(!/fetch\(|XMLHttpRequest|setInterval/.test(edSrc), "aucune requête ni minuterie permanente");
assert.ok(lire("public/modules/textes-admin-v1.js").includes("__SOREAL_IDLE_SAVIEZ_VOUS_V1__.editeurHtml()"), "section posée dans la page Admin > Textes et voix");
assert.match(lire("public/index.html"), /modules\/admin-saviez-vous-v1\.js\?v=\d+/);

// ---------- 5. panneau LED : lit la liste (mélange admin + origine), langue, aucun HTML ----------
const led = lire("public/modules/borne-led-v1.js");
assert.ok(led.includes("__SOREAL_IDLE_SAVIEZ_VOUS_V1__") && led.includes("m.tirer(langue,phraseDerniere,TXT[langue].jokes)"), "le panneau demande une phrase au module (langue du jeu, dernière phrase, phrases d'origine)");
assert.ok(led.includes("localStorage.getItem('soreal_idle_langue_v1')==='en'?'en':'fr'"), "EN si présent, sinon FR");
{
  const stockage = { soreal_idle_langue_v1: "fr" };
  const ctx = { requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 } };
  const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
  const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: (k) => stockage[k] ?? null }, matchMedia: () => ({ matches: false }), document: { hidden: false, createElement: toile, querySelector: () => null, addEventListener() {}, getElementById: () => null }, ...ctx };
  fen.window = fen;
  const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, String, Number, Array, Object, Boolean, parseInt, isFinite, setTimeout, clearTimeout });
  const idx = led.lastIndexOf("})();");
  vm.runInContext(led.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + led.slice(idx), c);
  const ev = (e) => fen.__EV__(e);
  // pas de module admin : cinq phrases d'origine
  assert.equal(ev("phraseAdmin()"), "");
  // avec un module (liste de l'administrateur) : la phrase choisie est celle du module, sans répétition immédiate côté panneau
  fen.__SOREAL_IDLE_SAVIEZ_VOUS_V1__ = { tirer: (l, d, o) => (l === "en" ? "EN: " : "FR: ") + (d ? "bis" : "un") + o.length };
  assert.equal(ev("phraseAdmin()"), "FR: un5");
  assert.equal(ev("phraseAdmin()"), "FR: bis5", "la dernière phrase est transmise au tirage");
  stockage.soreal_idle_langue_v1 = "en";
  ev("langueLue=-1e9;langueDe(5000)");
  assert.equal(ev("phraseAdmin()").slice(0, 3), "EN:", "langue anglaise");
  // la scène « Le saviez-vous ? » affiche la phrase tirée (texte brut : la police ne dessine que des points)
  ev("S.vic=0");
  const lumine = (txt) => ev(`(function(){var p=new Panel(document.createElement('canvas'),120,14),n=0;P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=13;p.p={txt:${JSON.stringify(txt)}};sJokes(2.6);for(var i=0;i<p.v.length;i++)if(p.v[i])n++;P=null;return n;})()`);
  assert.ok(lumine("Une phrase ajoutée par l'équipe") > 0, "la phrase de l'administrateur défile sur le panneau");
  assert.equal(ev(`jokeDuree({txt:${JSON.stringify("x".repeat(40))}},120)`) > ev(`jokeDuree({txt:"x"},120)`), true, "durée proportionnelle à la longueur de la phrase");
  // diagnostic des caractères que la police du panneau ne sait pas dessiner (avertissement dans l'éditeur)
  const dg = fen.__SOREAL_IDLE_BORNE_LED_V1__.diagnostic("Ça va, é à ñ ☺ 日");
  assert.ok(dg.remplaces.some((x) => x[0] === "Ç" || x[0] === "ç"), "Ç -> C annoncé");
  assert.ok(dg.retires.includes("☺") && dg.retires.includes("日"), "caractères sans équivalent annoncés comme retirés");
  assert.equal(fen.__SOREAL_IDLE_BORNE_LED_V1__.diagnostic("Les accents é è ê à â ô î ù ë suffisent").remplaces.length + fen.__SOREAL_IDLE_BORNE_LED_V1__.diagnostic("Les accents é è ê à â ô î ù ë suffisent").retires.length, 0, "les accents de la police ne déclenchent aucun avertissement");
  assert.equal(typeof fen.__SOREAL_IDLE_BORNE_LED_V1__.apercu, "function", "aperçu LED exposé (même moteur que le panneau)");
  assert.equal(fen.__SOREAL_IDLE_BORNE_LED_V1__.originales("fr").length, 5);
}
console.log("idle-admin-saviez-vous-v1: OK");
