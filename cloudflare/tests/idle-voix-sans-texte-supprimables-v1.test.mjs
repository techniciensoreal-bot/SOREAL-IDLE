import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { normaliserTexteV1, enregistrerTexteV1, supprimerTexteV1, lireTextesV1, surchargesPourJoueurV1 } from "../src/idle-textes-v1.js";
import { planPurgeVoixStrictV1 } from "../src/idle-voix-purge-v1.js";

/*
 * Norman (2026-11-03) : « dans admin, je dois pouvoir supprimer complètement les choses dans Voix sans texte à l'écran. »
 * Garde : suppression / rétablissement côté serveur (FR et EN, entrée inconnue refusée), voix plus déclarées (purge stricte), lecteurs qui sautent l'entrée, éditeur avec confirmation en deux temps.
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

// 1. Serveur
const sql = baseVide();
enregistrerTexteV1(sql, { cle: "systeme:sandwich", champs: { texte: "Version modifiée" }, voix: ["0123456789abcd"] }, 1);
enregistrerTexteV1(sql, { cle: "systeme:sandwich:en", champs: { texte: "English" }, voix: ["fedcba9876543210".slice(0, 14)] }, 2);
const sup = enregistrerTexteV1(sql, { cle: "systeme:sandwich", supprime: true }, 3);
assert.equal(sup.supprime, true);
assert.deepEqual(sup.voix, [], "ses voix ne sont plus déclarées");
assert.deepEqual(sup.champs, {}, "plus de texte");
const fr = surchargesPourJoueurV1(sql, "fr");
assert.deepEqual(fr.popups["systeme:sandwich"], { champs: {}, parle: {}, voix: [], supprime: true }, "le joueur ne reçoit que le marqueur");
assert.deepEqual(fr.voix, [], "aucune voix déclarée en français");
const en = surchargesPourJoueurV1(sql, "en");
assert.equal(en.popups["systeme:sandwich"].champs.texte, "English", "l'anglais n'est pas touché par la suppression du français");
enregistrerTexteV1(sql, { cle: "systeme:chroniques-intro:en", supprime: true }, 4);
assert.equal(surchargesPourJoueurV1(sql, "en").popups["systeme:chroniques-intro"].supprime, true, "anglais : clé renvoyée sans suffixe");
assert.equal(surchargesPourJoueurV1(sql, "fr").popups["systeme:chroniques-intro"], undefined, "le français n'est pas touché");
assert.equal(lireTextesV1(sql).find((t) => t.cle === "systeme:sandwich").supprime, true, "relu depuis la base");
assert.throws(() => normaliserTexteV1({ cle: "tuto:debut:2", supprime: true }), /TEXTE_SUPPRESSION_INCONNUE/, "entrée inconnue refusée");
assert.throws(() => normaliserTexteV1({ cle: "boss:12", supprime: true }), /TEXTE_SUPPRESSION_INCONNUE/, "un boss ne se supprime pas");
assert.equal("supprime" in normaliserTexteV1({ cle: "systeme:sandwich", champs: { texte: "x" } }), false, "une entrée normale n'a pas le marqueur");
supprimerTexteV1(sql, "systeme:sandwich");   // Rétablir
assert.equal(surchargesPourJoueurV1(sql, "fr").popups["systeme:sandwich"], undefined, "rétabli : retour au texte d'origine");

// 2. Purge stricte : les voix d'une entrée supprimée ne sont plus utiles, rien n'est supprimé par ce code
const fichiers = [{ cle: "idle/voix/aaaaaaaaaaaaaa.m4a", taille: 10 }, { cle: "idle/voix/bbbbbbbbbbbbbb.m4a", taille: 20 }];
const declarees = new Set(surchargesPourJoueurV1(sql, "fr").voix);
const plan = planPurgeVoixStrictV1({ fichiers, declarees, manifeste: ["aaaaaaaaaaaaaa"], liees: ["aaaaaaaaaaaaaa"] });
assert.deepEqual(plan.aSupprimer.map((x) => x.cle).sort(), fichiers.map((x) => x.cle).sort(), "voix de l'entrée supprimée = à supprimer (proposition, jamais automatique)");
const avant = planPurgeVoixStrictV1({ fichiers, declarees: ["aaaaaaaaaaaaaa"], manifeste: [], liees: [] });
assert.equal(avant.gardees.length, 1, "une voix déclarée est toujours gardée");

// 3. Lecteurs : l'entrée supprimée n'est pas lue
const combat = lire("cloudflare/public/modules/ui-combat-2-v1.js");
const fn = combat.slice(combat.indexOf("function texteVoixSansTexteIdleV1_(cle,origine){"), combat.indexOf("function lancerVoixArrierePlanSandwichIdleV1_(){"));
const texteVoix = new Function("window", fn + "\nreturn texteVoixSansTexteIdleV1_;");
const supprimees = new Set(["systeme:sandwich"]);
const fenetre = { __SOREAL_IDLE_TEXTES_V1__: { supprimee: (c) => supprimees.has(c), surcharge: () => null } };
assert.equal(texteVoix(fenetre)("systeme:sandwich", "ORIGINE"), "", "supprimée : aucun texte, pas même l'origine");
assert.equal(texteVoix(fenetre)("systeme:chroniques-intro", "ORIGINE"), "ORIGINE", "autre entrée : inchangée");
assert.ok(/if\(texte\)tts\.readText\(texte\)/.test(combat), "le sandwich ne lit rien si le texte est vide");
assert.ok(/\(introChroniques\?introChroniques\+M\(1500\):''\)/.test(combat) && /introChroniques&&typeof tts\.declarerTexteLibre/.test(combat), "l'intro supprimée n'ajoute ni voix libre ni pause morte");
const lecteur = lire("cloudflare/public/modules/lecteur-chroniques-v1.js");
assert.ok(lecteur.includes("if(etat.index===0&&etat.intro)"), "le lecteur de chroniques saute une introduction vide");

// 4. Éditeur
const ed = lire("cloudflare/public/modules/textes-admin-v1.js");
for (const m of ["data-stx-suppr-cle", "data-stx-retablir-cle", "Supprimer complètement", "Confirmer : supprimer complètement", "supprime:true", "supprimee:supprimee_"]) assert.ok(ed.includes(m), "éditeur : " + m);
assert.ok(ed.includes("if(cleASupprimer===cle){") && ed.includes("setTimeout(function(){cleASupprimer=''"), "deux temps : un premier clic ne supprime rien");
assert.ok(ed.includes("cache(g)?'<button"), "bouton réservé au groupe « Voix sans texte à l'écran »");
const dict = JSON.parse(fs.readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
for (const k of ["🗑 Supprimer complètement", "⚠ Confirmer : supprimer complètement", "🗑 supprimée", "↩ Rétablir"]) assert.ok(dict[k], "traduit : " + k);
// Moteur local : la suppression part aussi dans l'export
assert.ok(lire("cloudflare/src/idle-local-sync-v1.js").includes("t.supprime ? { supprime: true"), "moteur local");
console.log("idle-voix-sans-texte-supprimables-v1: OK");
