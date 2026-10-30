import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { appliquerGraineContenuV1, graineValideV1, empreinteGraineV1, IDLE_GRAINE_META_V1 } from "../src/idle-graine-contenu-v1.js";

/*
 * Norman (2026-10-30) : « dans l'APK hors ligne ce ne sont pas les bonnes voix du narrateur et des histoires, ce sont les anciennes ». Les applications hors ligne gardent leur base : catalogue semé à la première ouverture seulement, et textes
 * (idle_textes : chroniques, popups, empreintes de voix) et histoires (idle_histoires) jamais copiés. La graine est maintenant re-appliquée à chaque démarrage où son empreinte diffère, sans jamais toucher la partie du joueur.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lire = (...p) => fs.readFileSync(path.join(DEPOT, ...p), "utf8").replace(/\r\n/g, "\n");

// ---------- la graine embarquée : valide, à jour, sans adresse e-mail ni partie de joueur
/* desktop/graine/catalogue.json est un fichier LOCAL (récolte de la production, jamais versionné) : absent d'un dépôt vierge (CI), on prend une graine d'essai de même forme */
const FICHIER_GRAINE = path.join(DEPOT, "desktop", "graine", "catalogue.json");
const graine = fs.existsSync(FICHIER_GRAINE)
  ? JSON.parse(lire("desktop", "graine", "catalogue.json"))
  : { feuilles: [["CONFIG", 1, '["x"]'], ["IDLE_BOSS", 1, '["boss"]']], textes: [["boss:1", '{"champs":{"nom":"N"}}']], histoires: [{ id: "Intro", titre: "Intro", boss: null, actif: true, voix: ["aaaaaaaa"], etapes: [], maj: 1 }] };
assert.equal(graineValideV1(graine), true, "la graine rangée est valide");
assert.ok(Array.isArray(graine.textes) && graine.textes.length > 0, "la graine porte les textes modifiés (empreintes de voix comprises)");
assert.ok(Array.isArray(graine.histoires) && graine.histoires.length > 0, "la graine porte les histoires de la production");
assert.ok(!graine.feuilles.some((f) => f[0] === "JOUEURS" || f[0] === "CLASSEMENT"), "jamais JOUEURS ni CLASSEMENT dans la graine");
assert.ok(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}/.test(JSON.stringify(graine)), "aucune adresse e-mail dans la graine");

// ---------- garde-fous de validation
assert.equal(graineValideV1(null), false);
assert.equal(graineValideV1({}), false);
assert.equal(graineValideV1({ feuilles: [] }), false);
assert.equal(graineValideV1({ feuilles: [["CONFIG", 1, "[]"]] }), false, "il faut aussi la feuille des boss");
assert.equal(graineValideV1({ feuilles: [["CONFIG", 1, "[]"], ["IDLE_BOSS", 1, "[]"]], textes: "x" }), false, "textes mal formés");
assert.equal(graineValideV1({ feuilles: [["CONFIG", 1, "[]"], ["IDLE_BOSS", 1, 5]] }), false, "ligne mal formée");
assert.equal(graineValideV1({ feuilles: [["CONFIG", 1, "[]"], ["IDLE_BOSS", 1, "[]"]] }), true);
assert.equal(empreinteGraineV1(graine), empreinteGraineV1(JSON.parse(JSON.stringify(graine))), "empreinte stable");
assert.notEqual(empreinteGraineV1(graine), empreinteGraineV1(Object.assign({}, graine, { textes: [] })), "l'empreinte suit le contenu");

// ---------- base SQLite en mémoire : ancien contenu, partie du joueur, puis nouvelle graine
function base() {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  sql.exec("CREATE TABLE idle_catalog(sheet_name TEXT NOT NULL, row_index INTEGER NOT NULL, row_json TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(sheet_name,row_index))");
  sql.exec("CREATE TABLE idle_meta(meta_key TEXT PRIMARY KEY, meta_value TEXT)");
  return sql;
}
const ancienne = { feuilles: [["CONFIG", 1, '["ancien"]'], ["IDLE_BOSS", 1, '["ancien boss"]'], ["IDLE_BOSS", 2, '["ancien boss 2"]']], textes: [["boss:1", '{"champs":{"nom":"Ancien"},"parle":true,"voix":["aaaaaaaa"]}', 1]], histoires: [{ id: "Intro", titre: "Ancienne intro", boss: null, actif: true, voix: [], etapes: [], maj: 5 }] };
const nouvelle = { feuilles: [["CONFIG", 1, '["nouveau"]'], ["IDLE_BOSS", 1, '["nouveau boss"]'], ["IDLE_ZONES", 1, '["zone"]']], textes: [["boss:1", '{"champs":{"nom":"Nouveau"},"parle":true,"voix":["bbbbbbbb"]}', 9], ["boss:2", '{"champs":{"nom":"Deux"},"parle":false,"voix":[]}', 9]], histoires: [{ id: "Intro", titre: "Nouvelle intro", boss: null, actif: true, voix: ["cccccccc"], etapes: [], maj: 7 }, { id: "Autre", titre: "Autre", boss: 3, actif: true, voix: [], etapes: [], maj: 8 }] };
{
  const sql = base();
  const LIGNE_JOUEUR = '["joueur","Norman",12,"lignée intacte"]';
  assert.equal(appliquerGraineContenuV1(sql, ancienne, 100).raison, "APPLIQUEE", "première application");
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('JOUEURS',1,'[\"entete\"]',1)");
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('JOUEURS',2,?,1)", LIGNE_JOUEUR);
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('CLASSEMENT',1,'[\"reg\"]',1)");
  assert.equal(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='IDLE_BOSS' AND row_index=2")[0].row_json, '["ancien boss 2"]');
  assert.deepEqual(appliquerGraineContenuV1(sql, ancienne, 101), { applique: false, raison: "A_JOUR", empreinte: empreinteGraineV1(ancienne) }, "même graine : rien à refaire");

  // une graine invalide n'écrase rien
  const avant = JSON.stringify(sql.exec("SELECT * FROM idle_catalog ORDER BY sheet_name,row_index"));
  assert.equal(appliquerGraineContenuV1(sql, { feuilles: [] }, 102).applique, false);
  assert.equal(appliquerGraineContenuV1(sql, null, 102).applique, false);
  assert.equal(JSON.stringify(sql.exec("SELECT * FROM idle_catalog ORDER BY sheet_name,row_index")), avant, "graine invalide : base inchangée");

  // la nouvelle graine
  const r = appliquerGraineContenuV1(sql, nouvelle, 200);
  assert.equal(r.applique, true, r.raison);
  assert.equal(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='CONFIG'")[0].row_json, '["nouveau"]');
  assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name='IDLE_BOSS'")[0].n, 1, "la feuille des boss est remplacée, pas complétée (plus de ligne périmée)");
  assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name='IDLE_ZONES'")[0].n, 1, "nouvelle feuille ajoutée");
  assert.deepEqual(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' ORDER BY row_index").map((x) => x.row_json), ['["entete"]', LIGNE_JOUEUR], "la partie du joueur n'est jamais touchée");
  assert.equal(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='CLASSEMENT'")[0].row_json, '["reg"]', "CLASSEMENT jamais touché");
  assert.deepEqual(sql.exec("SELECT cle,maj FROM idle_textes ORDER BY cle").map((x) => [x.cle, x.maj]), [["boss:1", 9], ["boss:2", 9]], "textes remplacés par ceux de la production");
  assert.ok(sql.exec("SELECT json FROM idle_textes WHERE cle='boss:1'")[0].json.includes("bbbbbbbb"), "empreinte de voix à jour");
  assert.deepEqual(sql.exec("SELECT id,maj FROM idle_histoires ORDER BY id").map((x) => [x.id, x.maj]), [["Autre", 8], ["Intro", 7]], "histoires remplacées");
  assert.ok(JSON.parse(sql.exec("SELECT json FROM idle_histoires WHERE id='Intro'")[0].json).voix[0] === "cccccccc" && !("maj" in JSON.parse(sql.exec("SELECT json FROM idle_histoires WHERE id='Intro'")[0].json)));
  assert.equal(sql.exec("SELECT meta_value AS v FROM idle_meta WHERE meta_key=?", IDLE_GRAINE_META_V1)[0].v, empreinteGraineV1(nouvelle));
  assert.equal(appliquerGraineContenuV1(sql, nouvelle, 300).raison, "A_JOUR");

  // échec en cours de route : tout est défait (SAVEPOINT), la graine précédente reste en place
  const cassee = JSON.parse(JSON.stringify(nouvelle)); cassee.feuilles[0][2] = '["troisieme"]'; cassee.histoires[0].titre = "troisième";
  const sqlCasse = { exec(q, ...b) { if (/^INSERT OR REPLACE INTO idle_histoires/.test(q)) throw new Error("disque plein"); return sql.exec(q, ...b); } };
  const rc = appliquerGraineContenuV1(sqlCasse, cassee, 400);
  assert.equal(rc.applique, false); assert.ok(rc.raison.startsWith("ECHEC:"), rc.raison);
  assert.equal(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='CONFIG'")[0].row_json, '["nouveau"]', "échec : catalogue inchangé");
  assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_textes")[0].n, 2, "échec : textes inchangés");
  assert.equal(sql.exec("SELECT meta_value AS v FROM idle_meta WHERE meta_key=?", IDLE_GRAINE_META_V1)[0].v, empreinteGraineV1(nouvelle), "échec : l'empreinte appliquée ne change pas (nouvel essai au prochain démarrage)");
}

// ---------- essai avec le VRAI moteur de l'exe : base déjà semée avec l'ancien catalogue, partie en cours, puis démarrage avec la nouvelle graine
/* Cette partie a besoin de la VRAIE graine (récolte de la production, fichier local jamais versionné) : ignorée sur un dépôt vierge (CI). */
if (fs.existsSync(FICHIER_GRAINE)) {
{
  const { creerEnvLocal } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-graine-"));
  const fichierBase = path.join(tmp, "base", "s.sqlite");
  const opt = (g) => ({ racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: path.join(tmp, "m"), fichierBase, graine: g, utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" } });
  const get = (env, chemin, init) => env.fetch(new Request("http://soreal-idle.local" + chemin, init));
  // « ancienne » graine = la vraie, avec un texte d'histoire et une empreinte de voix d'avant
  const vieille = JSON.parse(JSON.stringify(graine));
  vieille.textes = []; vieille.histoires = [];
  let ligneAvant;
  {
    const env = await creerEnvLocal(opt(vieille));
    const page = await (await get(env, "/")).text();
    const session = JSON.parse(JSON.parse('"' + page.match(/localStorage\.setItem\("soreal_idle_google_session_v1","(.*?)"\);/)[1] + '"'));
    const etat = await (await get(env, "/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + session.token }, body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [session.token] }) })).json();
    assert.equal(etat.ok, true);
    const intro = await (await get(env, "/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + session.token }, body: JSON.stringify({ operation: "obtenirIntroSorealIdle", args: [session.token] }) })).json();
    assert.notEqual(JSON.stringify(intro.histoire), JSON.stringify(graine.histoires.find((h) => h.id === "Intro")), "avant : l'intro n'est pas celle de la production");
    env.fermer();
  }
  const lireJoueurs = () => { const db = new DatabaseSync(fichierBase); const r = db.prepare("SELECT row_index,row_json FROM idle_catalog WHERE sheet_name='JOUEURS' ORDER BY row_index").all(); const n = db.prepare("SELECT COUNT(*) AS n FROM idle_textes").get().n; db.close(); return { r, n }; };
  const avant = lireJoueurs();
  assert.equal(avant.n, 0, "avant : aucun texte de production dans la base");
  ligneAvant = JSON.stringify(avant.r);
  {
    const env = await creerEnvLocal(opt(graine));   // l'application est mise à jour : nouvelle graine
    assert.equal(env.premiere, false);
    // AVANT tout appel du jeu (une synchro met à jour l'horodatage de la partie, c'est son rôle) : la re-semence seule ne touche pas la ligne du joueur
    const apresDemarrage = lireJoueurs();
    assert.equal(JSON.stringify(apresDemarrage.r), ligneAvant, "la feuille JOUEURS (partie du joueur) est identique octet pour octet après la re-semence");
    assert.equal(apresDemarrage.n, graine.textes.length, "les textes de production sont en base dès le démarrage");
    const page = await (await get(env, "/")).text();
    const session = JSON.parse(JSON.parse('"' + page.match(/localStorage\.setItem\("soreal_idle_google_session_v1","(.*?)"\);/)[1] + '"'));
    const intro = await (await get(env, "/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + session.token }, body: JSON.stringify({ operation: "obtenirIntroSorealIdle", args: [session.token] }) })).json();
    const attendue = graine.histoires.find((h) => h.id === "Intro");
    assert.equal(intro.histoire.etapes[0].texte, attendue.etapes[0].texte, "après : l'intro est celle de la production (texte à jour)");
    assert.deepEqual(intro.histoire.voix, attendue.voix, "après : empreintes de voix de l'histoire à jour");
    const exp = await (await get(env, "/api/v1/local/export?appareil=t&lecture=1", { headers: { authorization: "Bearer " + session.token } })).json();
    assert.equal(exp.textes.length, graine.textes.length, "après : tous les textes de production (chroniques, empreintes de voix) sont servis au moteur de la page");
    env.fermer();
  }
  assert.equal(lireJoueurs().n, graine.textes.length);
  fs.rmSync(tmp, { recursive: true, force: true });
}

}   /* fin de la partie « vrai moteur » (graine locale requise) */
// ---------- câblage : le contenu voyage dans les mises à jour et les deux moteurs le réappliquent
const sw = lire("cloudflare", "local", "sw-android.js"), coeur = lire("desktop", "coeur.js"), envLocal = lire("desktop", "src", "env-local.mjs"), codeApk = lire("android", "code-apk.mjs"), paquet = lire("desktop", "src", "paquet.mjs");
assert.ok(sw.includes("appliquerGraineContenuV1(sql, graine)") && sw.includes('"/graine-contenu-v1.json", "/__graine.json"'), "APK : la graine de la mise à jour d'abord, celle de l'APK ensuite, appliquée à chaque démarrage");
assert.ok(sw.includes("premiere || contenu.applique || !octets"), "APK : base sauvegardée après une nouvelle graine");
assert.ok(codeApk.includes('nom: "public/graine-contenu-v1.json"'), "APK : la graine voyage dans le paquet de code des mises à jour");
assert.ok(!fs.existsSync(path.join(DEPOT, "cloudflare", "public", "graine-contenu-v1.json")), "jamais de graine dans le site public (spoils)");
assert.ok(paquet.includes('"desktop/graine/catalogue.json"'), "exe : la graine voyage dans la mise à jour");
assert.ok(coeur.includes('path.join(__dirname, "graine", "catalogue.json"), path.join(APP, "graine", "catalogue.json")') && coeur.includes("exporteLe"), "exe : la graine la plus récente (mise à jour ou installateur) est choisie");
assert.ok(envLocal.includes("appliquerGraineContenuV1(sql, opt.graine)"), "exe : la graine est réappliquée à chaque démarrage");
console.log("idle-graine-contenu-v1: OK");
