import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";
import { normaliserTexteV1, enregistrerTexteV1, lireTextesV1, surchargesPourJoueurV1 } from "../src/idle-textes-v1.js";

/*
 * Norman (2026-11-02) : « Je dois pouvoir supprimer un texte des tutos, des troll challenge etc quand j'édite les voix. Si à la base c'était en 3 textes jaunes, je peux le mettre en 1 ou 5. »
 * Garde : les textes d'une liste (cadres jaunes) s'ajoutent et se retirent dans l'éditeur ; le serveur n'enregistre jamais un bloc vide (français ET anglais) ; le popup du Troll Challenge et l'étape d'un
 * guide montrent et lisent exactement les blocs enregistrés.
 */
const lire = (f) => fs.readFileSync(f, "utf8").split(String.fromCharCode(13)).join("");
function baseVide() {
  const db = new DatabaseSync(":memory:");
  return {
    exec(query, ...bindings) {
      const statement = db.prepare(query);
      if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
      statement.run(...bindings);
      return [];
    }
  };
}

const eq = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
// 1. Serveur : de 3 à 1, à 5 ; jamais de bloc vide ; le texte dit garde le même alignement.
let t = normaliserTexteV1({ cle: "troll:gold", champs: { message: ["A", "B", "C"], effet: ["E"] }, parle: { message: ["(femme) a", "b", "c"] } });
assert.deepEqual(t.champs.message, ["A", "B", "C"]);
t = normaliserTexteV1({ cle: "troll:gold", champs: { message: ["A", "  ", "C"], effet: [] }, parle: { message: ["a", "x", "c"] } });
assert.deepEqual(t.champs.message, ["A", "C"], "un bloc vide est retiré");
assert.deepEqual(t.parle.message, ["a", "c"], "le texte dit perd le même rang");
assert.deepEqual(t.champs.effet, [], "tous les blocs supprimés : liste vide acceptée");
t = normaliserTexteV1({ cle: "troll:gold", champs: { message: ["Seul"] } });
assert.deepEqual(t.champs.message, ["Seul"], "3 -> 1");
t = normaliserTexteV1({ cle: "troll:gold", champs: { message: ["1", "2", "3", "4", "5"] } });
assert.equal(t.champs.message.length, 5, "3 -> 5");
t = normaliserTexteV1({ cle: "tuto:debut:2", champs: { titre: "T", paragraphes: ["p1", "", "p3"] }, parle: { paragraphes: ["d1", "d2"] } });
assert.deepEqual(t.champs.paragraphes, ["p1", "p3"]);
assert.deepEqual(t.parle.paragraphes, ["d1", "d2"], "longueurs différentes : le texte dit n'est pas désaligné au hasard");
// Anglais : mêmes règles sous la clé « :en », jamais mélangé au français.
const sql = baseVide();
enregistrerTexteV1(sql, { cle: "guide:debut:0", champs: { texte: ["FR 1", "FR 2", "FR 3"] } }, 1);
enregistrerTexteV1(sql, { cle: "guide:debut:0:en", champs: { texte: ["EN only", ""] } }, 2);
const fr = surchargesPourJoueurV1(sql, "fr").popups["guide:debut:0"];
const en = surchargesPourJoueurV1(sql, "en").popups["guide:debut:0"];
assert.deepEqual(fr.champs.texte, ["FR 1", "FR 2", "FR 3"]);
assert.deepEqual(en.champs.texte, ["EN only"], "anglais : un seul bloc, sans bloc vide");
assert.equal(lireTextesV1(sql).length, 2);

// 2. Client : le popup du Troll Challenge montre et lit exactement les blocs enregistrés.
const code = lire("cloudflare/public/modules/challenges-v1.js");
const declarations = [];
const lus = [];
let surcharges = {}, parles = {};
const stockage = { getItem: () => null, setItem() {}, removeItem() {} };
const fenetre = {
  localStorage: stockage,
  __SOREAL_IDLE_TEXTES_V1__: {
    declarer: (cle, def) => declarations.push([cle, def]),
    surcharge: (cle) => surcharges[cle] || null,
    parle: (cle, champ) => (parles[cle] || {})[champ],
    sansBalises: (x) => String(x).replace(/\([a-z]+\)\s*/g, "")
  },
  __SOREAL_IDLE_TUTORIAL_TTS_V209__: { enabled: () => true, readText: (x) => { lus.push(x); return true; }, retirerParentheses: (x) => x.replace(/\(pause (\d+)ms\)/g, "[p$1]") },
  __SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__: { traduire: (x) => "EN:" + x },
  __sorealFadeNoticeV1__() {}
};
fenetre.window = fenetre;
vm.runInNewContext(code, { window: fenetre, document: { getElementById() { return null; }, head: { appendChild() {} }, hidden: true }, requestAnimationFrame() {}, setInterval() {}, setTimeout() {}, localStorage: stockage });
const D = fenetre.__SOREAL_IDLE_DEFIS_V1__;
const def = declarations.find(([c]) => c === "troll:gold")[1];
eq(def.champs.map((c) => c.type), ["liste", "liste"], "message et effet sont des listes de textes ajoutables / retirables");
assert.equal(def.texteLu({ message: ["A", "B", "C"], effet: ["E"] }), "A (pause 450ms) B (pause 450ms) C (pause 450ms) E");
assert.equal(def.texteLu({ message: ["A", "B"], effet: [] }), "A (pause 450ms) B", "un bloc supprimé n'est plus lu");
assert.equal(def.texteLu({ message: "A", effet: "B" }), "A (pause 450ms) B", "anciens textes : inchangé");
surcharges["troll:gold"] = { message: ["Un", "Deux", "Trois"], effet: ["Effet"] };
let tx = D.textesTroll("gold", {});
eq(tx.message.blocs, ["Un", "Deux", "Trois"]);
eq(tx.effet.blocs, ["Effet"]);
surcharges["troll:gold"] = { message: ["Seul"], effet: [] };
parles["troll:gold"] = { message: ["(femme) Dit seul"] };
tx = D.textesTroll("gold", {});
eq(tx.message.blocs.concat(tx.effet.blocs), ["Seul"], "le popup n'affiche que le bloc restant, aucun bloc vide");
eq(tx.message.blocsDits, ["(femme) Dit seul"]);
surcharges["troll:gold"] = { message: ["M1", "M2"], effet: ["E1", "E2", "E3"] };
parles = {};
tx = D.textesTroll("gold", {});
assert.equal(tx.message.blocs.concat(tx.effet.blocs).length, 5, "5 blocs");
// Sans modification : l'original, exactement comme avant.
surcharges = {};
tx = D.textesTroll("gold", {});
eq(tx.message.blocs, [D.textes.TROLLS.gold.msg]);
eq(tx.effet.blocs, [D.textes.TROLLS.gold.effet]);
assert.ok(code.includes("tx.message.blocs.concat(tx.effet.blocs)"), "le popup passe tous les blocs");

// 3. Étape d'un guide : un cadre jaune par ligne ; le texte enregistré (affiché ET dit) suit les blocs restants.
const tuto = lire("cloudflare/public/modules/tutoriel-v1.js");
const blocs = new Function(tuto.slice(tuto.indexOf("function blocsEtape_(v)"), tuto.indexOf("function cleVoix_(guide,i)")) + "; return blocsEtape_;")();
assert.equal(blocs("a\n\nb\n  \nc"), "a\nb\nc");
assert.equal(blocs(["a", "", "c"]), "a\nc");
assert.equal(blocs([]), "");
assert.ok(tuto.includes("type:'liste'") && tuto.includes("blocsEtape_(e.texte).split('\\n').filter(Boolean)"), "l'étape est déclarée comme une liste de textes");
assert.ok(tuto.includes("A.majTexteEtape(guide.id,i,blocsEtape_(o&&o.champs&&o.champs.texte))"), "le guide reçoit exactement les blocs restants");
const f = tuto.slice(tuto.indexOf("function texteParle_(guide,i)"), tuto.indexOf("function lireEtape_(s,force)"));
assert.ok(f.includes("Array.isArray(dit)") && f.includes("Array.isArray(sur.texte)"), "la voix lit les blocs restants seulement");

// 4. Éditeur : ajout / retrait d'un texte sur toute liste ; ancien texte d'un seul bloc relu comme une liste.
const ed = lire("cloudflare/public/modules/textes-admin-v1.js");
assert.ok(ed.includes('data-stx-act="unite-"') && ed.includes('data-stx-act="unite+"') && ed.includes("＋ Ajouter un texte") && ed.includes("🗑 Retirer ce texte"));
assert.ok(ed.includes("if(typeof brutAff==='string'){brutAff=blocsDepuisChaine_(brutAff)") && ed.includes("function blocsDepuisChaine_(t)"));
assert.ok(ed.includes("o.champs[c.id]=gA;o.parle[c.id]=gD;"), "l'enregistrement ne garde que les textes non vides, alignés avec les textes dits");

console.log("idle-textes-blocs-supprimables-v1 OK");
