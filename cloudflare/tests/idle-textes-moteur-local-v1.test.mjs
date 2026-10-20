import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, textesPourMoteurLocalV1 } from "../src/idle-local-sync-v1.js";
import { enregistrerTexteV1, texteBossSurchargeV1, texteBossParleV1, nomBossSurchargeV1, assurerTextesV1, invaliderCacheTextesBossV1 } from "../src/idle-textes-v1.js";

/*
 * Norman (2026-10-20) : « j'ai créé une voix pour le boss 99 et c'est toujours l'ancienne qui est lue ; ces voix doivent être instantanément remplacées par les dernières et le texte aussi ».
 * Cause : le moteur local (une base SQLite dans la page) n'avait pas la table `idle_textes` du serveur : il lisait le texte d'origine du catalogue, donc l'empreinte de l'ancienne voix.
 * Garde : l'export fournit les textes modifiés (sans les champs réservés à l'administrateur), le Worker remplace sa table, la page relit après chaque enregistrement d'administrateur et chaque minute,
 * la voix n'est plus gardée en cache sans revalidation.
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS_), Date.now());
const boutique = [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]];
boutique.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });

// Sans texte modifié : liste vide.
assert.deepEqual(textesPourMoteurLocalV1(coord), []);
assert.deepEqual(exporterPourMoteurLocalV1(coord, T).textes, []);

// Une chronique modifiée (avec texte parlé et champs réservés à l'administrateur) : exportée, sans voixTextes ni voixFaites.
enregistrerTexteV1(coord.sqlMoteur, { cle: "boss:99", champs: { texte: "Nouveau récit du boss 99.", nom: "Nom neuf" }, parle: { texte: "Nouveau récit dit autrement." }, voix: ["0123456789abcd"], voixTextes: { "0123456789abcd": "secret de prononciation" }, voixFaites: { "0123456789abcd": "secret" } });
const exp = exporterPourMoteurLocalV1(coord, T);
assert.equal(exp.ok, true);
assert.equal(exp.textes.length, 1);
assert.equal(exp.textes[0][0], "boss:99");
const json = JSON.parse(exp.textes[0][1]);
assert.equal(json.champs.texte, "Nouveau récit du boss 99.");
assert.deepEqual(json.voix, ["0123456789abcd"]);
assert.ok(!("voixTextes" in json) && !("voixFaites" in json), "champs réservés à l'administrateur : jamais envoyés");
assert.ok(!exp.textes[0][1].includes("secret"));

// Le moteur local (autre base) applique la table reçue exactement comme le Worker (remplacement complet) : le texte, le nom et le texte parlé du boss changent.
const local = new DatabaseSync(":memory:");
const sqlLocal = { exec(q, ...b) { const st = local.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
function remplacer(textes) { assurerTextesV1(sqlLocal); sqlLocal.exec("DELETE FROM idle_textes"); for (const t of textes) sqlLocal.exec("INSERT OR REPLACE INTO idle_textes(cle,json,maj) VALUES(?,?,?)", String(t[0]), String(t[1]), Number(t[2]) || 0); invaliderCacheTextesBossV1(); }
remplacer(exp.textes);
assert.equal(texteBossSurchargeV1(sqlLocal, 99), "Nouveau récit du boss 99.");
assert.equal(nomBossSurchargeV1(sqlLocal, 99), "Nom neuf");
assert.equal(texteBossParleV1(sqlLocal, 99), "Nouveau récit dit autrement.");
// Un texte rétabli (supprimé du serveur) disparaît aussi du moteur local à la relecture suivante.
sql.exec("DELETE FROM idle_textes WHERE cle=?", "boss:99");
remplacer(textesPourMoteurLocalV1(coord));
assert.equal(texteBossSurchargeV1(sqlLocal, 99), null);

// Câblage : worker, page, pont, routes, cache de la voix.
const lire = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const worker = lire("../local/moteur-local-worker.js");
assert.ok(worker.includes("remplacerTextes(exp.textes)") && worker.includes('m.type === "textes"') && worker.includes("invaliderCacheTextesBossV1();"), "le Worker remplace sa table des textes au démarrage et à la demande");
const page = lire("../public/modules/moteur-local-v1.js");
assert.ok(page.includes('fetch("/api/v1/local/textes"') && page.includes('parler({type:"textes"') && page.includes("},60000);"), "la page relit les textes chaque minute");
assert.ok(page.includes("rafraichirTextes:rafraichirTextes"), "exposé au pont");
const pont = lire("../public/standalone-bridge.js");
assert.ok(pont.includes('operation==="enregistrerTexteAdminSorealIdle"||operation==="supprimerTexteAdminSorealIdle"') && pont.includes("await ML.rafraichirTextes(true)"), "relecture IMMÉDIATE après un enregistrement d'administrateur, avant la réponse");
assert.ok(lire("../src/idle-worker-entry-v1.js").includes('"/api/v1/local/textes"'), "route publique");
assert.ok(lire("../src/index-idle-coordinator-v1.js").includes("local-textes"), "route du coordinateur");
assert.ok(lire("../tools/local-dev-server.mjs").includes("/api/v1/local/textes"), "serveur d'essai");
const media = fs.readFileSync(new URL("../src/idle-media-v1.js", import.meta.url), "latin1");
assert.ok(/mediaHeaders_\(headers,0\)\}\);\s*\}\s*async function objetsBossR2_/.test(media), "voix : cache-control max-age=0 + revalidation (etag)");
assert.ok(media.includes('request.headers.get("if-none-match")===full.httpEtag'), "voix : 304 si inchangée");
console.log("idle-textes-moteur-local-v1: OK");
