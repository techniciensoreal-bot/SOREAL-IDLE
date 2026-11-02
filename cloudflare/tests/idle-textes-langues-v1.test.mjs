import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { textesPourMoteurLocalV1, exporterPourMoteurLocalV1 } from "../src/idle-local-sync-v1.js";
import {
  normaliserTexteV1,
  enregistrerTexteV1,
  supprimerTexteV1,
  texteBossSurchargeV1,
  texteBossParleV1,
  nomBossSurchargeV1,
  nomBossParleV1,
  invaliderCacheTextesBossV1,
  surchargesPourJoueurV1,
  estCleEnV1,
  cleAvecLangueV1,
  cleSansLangueV1
} from "../src/idle-textes-v1.js";
import { traduireReponseV1, histoireBossEnOriginaleV1, nomBossEnOriginalV1 } from "../src/idle-traductions-v1.js";

/*
 * Norman (2026-11-02) : « Quand je mets le jeu en anglais, j'édite les voix ANGLAISES avec le menu Admin et les cartes sous la borne. Et quand je mets en FR, j'édite uniquement le FR. »
 * Garde : une surcharge anglaise vit sous la clé « <clé>:en », jamais mélangée à la française (stockage, envoi aux joueurs, export du moteur local) ; le moteur l'applique APRÈS la traduction
 * (texte affiché, texte parlé, nom) ; le studio de voix sait parler anglais ; l'éditeur de l'Admin suit la langue du jeu ; les trolls sont déclarés à l'éditeur.
 */
const norm = (t) => t.split(String.fromCharCode(13)).join("");
const lire = (f) => norm(fs.readFileSync(f, "utf8"));

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

// 1. Clés : « :en » accepté pour les popups et les boss, validé comme la clé d'origine.
assert.equal(normaliserTexteV1({ cle: "boss:12:en", champs: { texte: "x" } }).cle, "boss:12:en");
assert.equal(normaliserTexteV1({ cle: "tuto:debut:2:en", champs: { titre: "T" } }).cle, "tuto:debut:2:en");
assert.equal(normaliserTexteV1({ cle: "troll:gold:en", champs: { message: "M", effet: "E" } }).cle, "troll:gold:en");
assert.throws(() => normaliserTexteV1({ cle: "boss:0:en", champs: { texte: "x" } }), /TEXTE_BOSS_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "boss:1000:en", champs: { texte: "x" } }), /TEXTE_BOSS_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "boss:12:fr", champs: { texte: "x" } }), /TEXTE_BOSS_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "boss:12:en", champs: { autre: "x" } }), /TEXTE_BOSS_CHAMP_TEXTE_REQUIS/);
assert.equal(estCleEnV1("boss:3:en"), true);
assert.equal(estCleEnV1("boss:3"), false);
assert.equal(cleAvecLangueV1("boss:3", "en"), "boss:3:en");
assert.equal(cleAvecLangueV1("boss:3:en", "en"), "boss:3:en");
assert.equal(cleAvecLangueV1("boss:3:en", "fr"), "boss:3");
assert.equal(cleSansLangueV1("troll:gold:en"), "troll:gold");

// 2. Stockage séparé : la chronique française et l'anglaise du même boss ne se voient jamais.
const sql = baseVide();
enregistrerTexteV1(sql, { cle: "boss:5", champs: { texte: "Récit FRANÇAIS du boss 5.", nom: "Nom FR" }, parle: { texte: "Dit en français.", nom: "Nom parlé FR" }, voix: ["aaaaaaaaaaaaaa"] }, 1);
enregistrerTexteV1(sql, { cle: "boss:5:en", champs: { texte: "ENGLISH story of boss 5.", nom: "EN name" }, parle: { texte: "Said in English.", nom: "Spoken EN name" }, voix: ["bbbbbbbbbbbbbb"] }, 2);
enregistrerTexteV1(sql, { cle: "boss:6:en", champs: { texte: "Only English for 6." } }, 3);
enregistrerTexteV1(sql, { cle: "boss:7", champs: { texte: "Seulement français pour 7." } }, 4);
invaliderCacheTextesBossV1();
assert.equal(texteBossSurchargeV1(sql, 5), "Récit FRANÇAIS du boss 5.");
assert.equal(texteBossSurchargeV1(sql, 5, "fr"), "Récit FRANÇAIS du boss 5.");
assert.equal(texteBossSurchargeV1(sql, 5, "en"), "ENGLISH story of boss 5.");
assert.equal(nomBossSurchargeV1(sql, 5), "Nom FR");
assert.equal(nomBossSurchargeV1(sql, 5, "en"), "EN name");
assert.equal(texteBossParleV1(sql, 5), "Dit en français.");
assert.equal(texteBossParleV1(sql, 5, "en"), "Said in English.");
assert.equal(nomBossParleV1(sql, 5, "en"), "Spoken EN name");
assert.equal(texteBossSurchargeV1(sql, 6), null, "boss 6 : rien en français");
assert.equal(texteBossSurchargeV1(sql, 6, "en"), "Only English for 6.");
assert.equal(texteBossSurchargeV1(sql, 7, "en"), null, "boss 7 : rien en anglais");
assert.equal(texteBossSurchargeV1(sql, 7), "Seulement français pour 7.");

// 3. Envoi aux joueurs : chaque langue reçoit SEULEMENT la sienne (anti-fuite), les chroniques de boss n'y sont jamais.
enregistrerTexteV1(sql, { cle: "nouveaute:rebirth", champs: { titre: "Titre FR" }, voix: ["cccccccccccccc"] }, 5);
enregistrerTexteV1(sql, { cle: "nouveaute:rebirth:en", champs: { titre: "English title" }, voix: ["dddddddddddddd"] }, 6);
const pourFr = surchargesPourJoueurV1(sql);
const pourFr2 = surchargesPourJoueurV1(sql, "fr");
const pourEn = surchargesPourJoueurV1(sql, "en");
assert.deepEqual(pourFr, pourFr2, "français par défaut");
assert.deepEqual(Object.keys(pourFr.popups), ["nouveaute:rebirth"]);
assert.equal(pourFr.popups["nouveaute:rebirth"].champs.titre, "Titre FR");
assert.deepEqual(Object.keys(pourEn.popups), ["nouveaute:rebirth"], "en anglais la clé est renvoyée SANS le suffixe : le jeu ne change pas");
assert.equal(pourEn.popups["nouveaute:rebirth"].champs.titre, "English title");
const jsonFr = JSON.stringify(pourFr), jsonEn = JSON.stringify(pourEn);
assert.ok(!jsonFr.includes("English") && !jsonFr.includes("ENGLISH") && !jsonFr.includes("dddddddddddddd") && !jsonFr.includes("bbbbbbbbbbbbbb"), "aucun anglais envoyé en français");
assert.ok(!jsonEn.includes("Titre FR") && !jsonEn.includes("FRANÇAIS") && !jsonEn.includes("cccccccccccccc") && !jsonEn.includes("aaaaaaaaaaaaaa"), "aucun français envoyé en anglais");
assert.ok(!jsonFr.includes("Récit") && !jsonEn.includes("ENGLISH story"), "jamais le texte d'une chronique de boss dans cette liste (règle n°2)");
assert.deepEqual(pourEn.voix.sort(), ["bbbbbbbbbbbbbb", "dddddddddddddd"], "empreintes de voix de la langue seulement");
assert.deepEqual(pourFr.voix.sort(), ["aaaaaaaaaaaaaa", "cccccccccccccc"]);
supprimerTexteV1(sql, "boss:5:en");
invaliderCacheTextesBossV1();
assert.equal(texteBossSurchargeV1(sql, 5, "en"), null, "supprimer la version anglaise ne touche pas la française");
assert.equal(texteBossSurchargeV1(sql, 5), "Récit FRANÇAIS du boss 5.");
// Rétablissement : la chronique anglaise redevient l'original du wiki.
assert.equal(traduireReponseV1({ numero: 5, histoire: "Récit FRANÇAIS du boss 5.", conseil: "" }, "en", sql).histoire, histoireBossEnOriginaleV1(5));

// 4. Application EN APRÈS la traduction : texte affiché, texte parlé, nom (catalogue, collection, boss sélectionné).
const sql2 = baseVide();
enregistrerTexteV1(sql2, { cle: "boss:5", champs: { texte: "Récit FRANÇAIS.", nom: "Nom FR" }, parle: { texte: "Dit FR." } }, 1);
enregistrerTexteV1(sql2, { cle: "boss:5:en", champs: { texte: "ENGLISH story.", nom: "EN name" }, parle: { texte: "(femme) Said in English.", nom: "Spoken EN" } }, 2);
invaliderCacheTextesBossV1();
const rep = {
  bossCatalogue: [{ numero: 5, nom: "Nom FR", histoire: "Récit FRANÇAIS.", conseil: "", histoireParlee: "Dit FR.", nomParle: "" }, { numero: 6, nom: "Un autre", histoire: "Texte 6", conseil: "" }],
  liste: [{ numero: 5, type: "boss_principal", decouvert: true, nom: "Nom FR", description: "Récit FRANÇAIS.", histoireParlee: "Dit FR.", nomParle: "" }, { numero: 5, type: "boss_principal", decouvert: false, nom: "???????", description: "" }],
  bossSelection: 5, bossActuel: "Nom FR", bossHistoire: "Récit FRANÇAIS.", bossHistoireParlee: "Dit FR.", bossNomParle: ""
};
const copieRep = JSON.stringify(rep);
const en = traduireReponseV1(rep, "en", sql2);
assert.equal(JSON.stringify(rep), copieRep, "la réponse d'origine n'est pas modifiée");
assert.equal(en.bossCatalogue[0].histoire, "ENGLISH story.", "texte affiché de la carte sous la borne");
assert.equal(en.bossCatalogue[0].nom, "EN name");
assert.equal(en.bossCatalogue[0].histoireParlee, "(femme) Said in English.", "texte parlé anglais (pas le français, pas vide)");
assert.equal(en.bossCatalogue[0].nomParle, "Spoken EN");
assert.equal(en.bossCatalogue[1].histoire, histoireBossEnOriginaleV1(6), "boss sans surcharge anglaise : original du wiki");
assert.equal(en.liste[0].description, "ENGLISH story.", "fiche / collection");
assert.equal(en.liste[0].nom, "EN name");
assert.equal(en.liste[1].description, "", "anti-spoil : boss non découvert intact");
assert.equal(en.liste[1].nom, "???????");
assert.equal(en.bossHistoire, "ENGLISH story.", "boss sélectionné");
assert.equal(en.bossActuel, "EN name");
assert.equal(en.bossHistoireParlee, "(femme) Said in English.");
assert.equal(en.bossNomParle, "Spoken EN");
assert.ok(!JSON.stringify(en).includes("FRANÇAIS") && !JSON.stringify(en).includes("Dit FR"), "aucun français dans la réponse anglaise");
// Sans base (ancien appelant) ou en français : comportement d'avant.
assert.equal(traduireReponseV1(rep, "en").bossCatalogue[0].histoire, histoireBossEnOriginaleV1(5));
assert.equal(traduireReponseV1(rep, "en").bossCatalogue[0].histoireParlee, "", "parlés français retirés sans base");
assert.equal(traduireReponseV1(rep, "fr", sql2).bossCatalogue[0].histoire, "Récit FRANÇAIS.", "le français n'applique jamais la version anglaise");
// Sans surcharge anglaise du tout : rien de plus à parcourir.
const sql3 = baseVide();
enregistrerTexteV1(sql3, { cle: "boss:5", champs: { texte: "FR seulement." } }, 1);
invaliderCacheTextesBossV1();
assert.equal(traduireReponseV1(rep, "en", sql3).bossCatalogue[0].histoire, histoireBossEnOriginaleV1(5));
invaliderCacheTextesBossV1();
assert.ok(nomBossEnOriginalV1(1).length > 0 && histoireBossEnOriginaleV1(1).length > 0, "originaux anglais pour l'éditeur");
assert.equal(histoireBossEnOriginaleV1(280), "", "boss sans chronique sur le wiki");

// 5. De bout en bout par le coordinateur : la langue du pont décide ce que reçoit le joueur ; le moteur local ne reçoit que sa langue.
const db = new DatabaseSync(":memory:");
const sqlC = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql: sqlC } }, {});
for (let i = 0; i < 15; i += 1) sqlC.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const srcDev = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
const HEADERS_ = new Function(srcDev.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
sqlC.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS_), Date.now());
const boutique = [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]];
boutique.forEach((l, i) => sqlC.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });
enregistrerTexteV1(coord.sqlMoteur, { cle: "tuto:debut:0", champs: { titre: "Titre français" }, voix: ["aaaaaaaaaaaaaa"] });
enregistrerTexteV1(coord.sqlMoteur, { cle: "tuto:debut:0:en", champs: { titre: "English title" }, voix: ["bbbbbbbbbbbbbb"] });
enregistrerTexteV1(coord.sqlMoteur, { cle: "boss:9", champs: { texte: "Chronique française du 9" } });
enregistrerTexteV1(coord.sqlMoteur, { cle: "boss:9:en", champs: { texte: "English chronicle of 9" } });
invaliderCacheTextesBossV1();
const appel = (langue, op = "obtenirTextesSurchargesSorealIdle") => coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: op, args: [T], langue });
const recuFr = appel("fr"), recuEn = appel("en"), recuDefaut = appel(undefined);
assert.equal(recuFr.popups["tuto:debut:0"].champs.titre, "Titre français");
assert.equal(recuEn.popups["tuto:debut:0"].champs.titre, "English title");
assert.equal(recuDefaut.popups["tuto:debut:0"].champs.titre, "Titre français", "sans langue : français");
assert.ok(!JSON.stringify(recuEn).includes("français") && !JSON.stringify(recuEn).includes("aaaaaaaaaaaaaa"), "aucune fuite du français vers un joueur anglais");
assert.ok(!JSON.stringify(recuFr).includes("English") && !JSON.stringify(recuFr).includes("bbbbbbbbbbbbbb"), "aucune fuite de l'anglais vers un joueur français");
// Export du moteur local : même séparation.
const clesFr = textesPourMoteurLocalV1(coord, "fr").map((t) => t[0]).sort();
const clesEn = textesPourMoteurLocalV1(coord, "en").map((t) => t[0]).sort();
assert.deepEqual(clesFr, ["boss:9", "tuto:debut:0"]);
assert.deepEqual(clesEn, ["boss:9:en", "tuto:debut:0:en"]);
assert.deepEqual(textesPourMoteurLocalV1(coord).map((t) => t[0]).sort(), clesFr, "sans langue : français");
assert.deepEqual(exporterPourMoteurLocalV1(coord, T, "", false, "en").textes.map((t) => t[0]).sort(), clesEn);
assert.deepEqual(exporterPourMoteurLocalV1(coord, T).textes.map((t) => t[0]).sort(), clesFr);
// Administrateur : la liste contient les originaux anglais et les versions anglaises.
const adm = coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "listerTextesAdminSorealIdle", args: [T], langue: "fr" });
assert.equal(adm.ok, true);
const b9 = adm.boss.find((b) => b.numero === 9);
assert.equal(b9.surcharge.champs.texte, "Chronique française du 9");
assert.equal(b9.surchargeEn.champs.texte, "English chronicle of 9");
assert.equal(b9.originalEn, histoireBossEnOriginaleV1(9));
assert.equal(b9.nomEnOriginal, nomBossEnOriginalV1(9));
assert.ok(adm.popups.some((p) => p.cle === "tuto:debut:0:en"), "les fiches anglaises des fenêtres sont listées pour l'éditeur");

// 6. Studio de voix : paramètre langue (texte source, le studio ne se lance pas ici).
const studio = lire("cloudflare/tools/voice-studio/serveur.py");
assert.ok(studio.includes('langue = "en" if donnees.get("langue") == "en" else "fr"'), "POST /synthese lit « langue »");
assert.ok(studio.includes('"language_id": "en" if langue == "en" else "fr"'), "language_id anglais");
assert.ok(studio.includes('reference = None if langue == "en" else reference_voix(voix)'), "pas d'extrait de référence en anglais");
assert.ok(studio.includes('reglage = {"exaggeration": 0.45, "cfg": 0.5}'), "mêmes réglages que voix-en-jeu-v1.py");
assert.ok(studio.includes("TEMPO_ANGLAIS = 0.92") && studio.includes('"atempo=%s" % tempo'), "ralentissement atempo 0,92");
assert.ok(studio.includes('vers_m4a(wav, sr, TEMPO_ANGLAIS if langue == "en" else None)'));
assert.ok(studio.includes("if langue != \"en\":") && studio.includes("normaliser_texte(texte, langue)"), "prononciations françaises coupées en anglais");
const enJeu = lire("cloudflare/tools/voix-en-jeu-v1.py");
assert.ok(enJeu.includes("(0.45, 0.5)") && enJeu.includes('"--tempo", type=float, default=0.92'), "références du générateur de voix anglaises");
const adminHist = lire("cloudflare/public/modules/admin-histoires-v1.js");
assert.ok(adminHist.includes("soreal_idle_langue_v1')==='en')corps.langue='en'"), "l'éditeur envoie langue:'en' au studio quand le jeu est en anglais");

// 7. Éditeur de l'Admin : suit la langue du jeu.
const ed = lire("cloudflare/public/modules/textes-admin-v1.js");
assert.ok(ed.includes("function cleL_(cle)") && ed.includes("cle+':en'"), "clé anglaise");
assert.ok(ed.includes("ouvrir_(cleE,def,base,originauxL_(def.original()))"), "popups : clé et original de la langue");
assert.ok(ed.includes("ouvrir_(cleL_('boss:'+numero)"), "chroniques : clé de la langue");
assert.ok(ed.includes("b.originalEn") && ed.includes("surchargeEn"), "chronique d'origine anglaise (wiki)");
assert.ok(ed.includes("if(!enAnglais_()&&typeof edition.def.apresEnregistrer==='function')"), "jamais d'écriture du français à la source depuis l'éditeur anglais");
assert.ok(ed.includes("surcharges.popups[cleJeu]"), "le jeu lit sous la clé de base");
const local = lire("cloudflare/public/modules/moteur-local-v1.js");
assert.ok(local.includes('"&langue="+langueTextes()') && local.includes('"/api/v1/local/textes?langue="+langueTextes()'), "le moteur local demande les textes de sa langue");
const worker = lire("cloudflare/src/idle-worker-entry-v1.js");
assert.ok(worker.includes('chemin === "local-export" || chemin === "local-textes"'));

// 8. Trolls : déclarés à l'éditeur, texte et voix modifiables, voix lue.
const code = lire("cloudflare/public/modules/challenges-v1.js");
const declarations = [];
const lus = [];
let surcharges = {}, parles = {}, enAnglais = false, auto = true;
const stockage = { getItem: (k) => (k === "soreal_idle_langue_v1" && enAnglais ? "en" : null), setItem() {}, removeItem() {} };
const fenetre = {
  localStorage: stockage,
  __SOREAL_IDLE_TEXTES_V1__: {
    declarer: (cle, def) => declarations.push([cle, def]),
    surcharge: (cle) => surcharges[cle] || null,
    parle: (cle, champ) => (parles[cle] || {})[champ],
    sansBalises: (t) => String(t).replace(/\([a-z]+\)\s*/g, "")
  },
  __SOREAL_IDLE_TUTORIAL_TTS_V209__: { enabled: () => auto, readText: (t) => { lus.push(t); return true; }, retirerParentheses: (t) => t.replace(/\(pause (\d+)ms\)/g, "[p$1]") },
  __SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__: { traduire: (t) => "EN:" + t },
  __sorealFadeNoticeV1__: (titre, lignes) => { fenetre.__derniere = { titre, lignes }; }
};
fenetre.window = fenetre;
const sandbox = { window: fenetre, document: { getElementById() { return null; }, head: { appendChild() {} }, hidden: true }, requestAnimationFrame() {}, setInterval() {}, setTimeout() {}, localStorage: stockage };
vm.runInNewContext(code, sandbox);
const D = fenetre.__SOREAL_IDLE_DEFIS_V1__;
const trolls = Object.keys(D.textes.TROLLS);
assert.equal(trolls.length, 15, "15 trolls");
assert.equal(declarations.length, 15, "les 15 trolls sont déclarés à l'éditeur");
const [cle0, def0] = declarations.find(([c]) => c === "troll:gold");
assert.equal(cle0, "troll:gold");
assert.equal(def0.groupe, "Trolls du Troll Challenge");
assert.equal(JSON.stringify(def0.champs.map((c) => c.id)), JSON.stringify(["message", "effet"]));
assert.ok(!def0.champsDepuisSource, "le texte affiché est bien celui de la surcharge");
assert.equal(def0.original().message, D.textes.TROLLS.gold.msg);
assert.equal(def0.original().effet, D.textes.TROLLS.gold.effet);
assert.equal(def0.texteLu({ message: "A", effet: "B" }), "A (pause 450ms) B");
// Sans surcharge : l'original, la voix lit l'original (traduit en anglais).
let tx = D.textesTroll("gold", {});
assert.equal(tx.message.affiche, D.textes.TROLLS.gold.msg);
assert.equal(tx.message.dit, D.textes.TROLLS.gold.msg);
enAnglais = true;
tx = D.textesTroll("gold", {});
assert.equal(tx.message.affiche, D.textes.TROLLS.gold.msg, "le texte affiché reste traduit par le traducteur du DOM");
assert.equal(tx.message.dit, "EN:" + D.textes.TROLLS.gold.msg, "la voix anglaise lit la traduction anglaise de la phrase");
enAnglais = false;
// Surcharge : affichée sans balises, dite avec le texte « parlé ».
surcharges["troll:gold"] = { message: "(femme) Texte modifié", effet: "Effet modifié" };
parles["troll:gold"] = { message: "(femme) Dit autrement" };
tx = D.textesTroll("gold", {});
assert.equal(tx.message.affiche, "Texte modifié");
assert.equal(tx.message.dit, "(femme) Dit autrement");
assert.equal(tx.effet.affiche, "Effet modifié");
assert.equal(tx.effet.dit, "Effet modifié");
// Le multiplicateur de boss garde son nombre dans les deux textes.
const defsTroll = { systemes: { challengeDefinitions: [{ id: "troll", completion: 3 }] } };
surcharges["troll:bossDivider"] = { message: "Divisé par X ! Voilà.", effet: "E" };
tx = D.textesTroll("bossDivider", defsTroll);
assert.equal(tx.message.affiche, "Divisé par 5 ! Voilà.");
assert.ok(D.textesTroll("bossDivider", defsTroll).message.dit.includes("5"));
delete surcharges["troll:bossDivider"];
assert.ok(D.textesTroll("bossDivider", defsTroll).message.affiche.includes("par 5") && !/\bX\b/.test(D.textesTroll("bossDivider", defsTroll).message.affiche));
// Liste pour la génération de toutes les voix.
assert.equal(D.textesVoix().length, 15);
assert.ok(D.textesVoix()[0].includes("[p450]"));
// Le popup est affiché avec la version de l'administrateur et la voix la lit (si la lecture automatique est active).
assert.ok(code.includes("lireTroll(tx);") && code.includes("var tx=textesTroll(troll.id,j);"));
const amorce = lire("cloudflare/public/modules/ui-amorcage-v1.js");
assert.ok(amorce.includes("D.textesVoix().forEach"), "les voix des trolls se génèrent avec les autres textes statiques");

console.log("idle-textes-langues-v1 OK");
