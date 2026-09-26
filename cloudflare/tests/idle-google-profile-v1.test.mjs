import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { normaliserPseudoIdleV1, idlePseudoCleV1, libelleJoueurIdleV1 } from "../src/idle-profile-v1.js";
import { verifierJetonGoogleIdleV1, reinitialiserCacheClesGoogleIdleV1 } from "../src/idle-google-auth-v1.js";

/*
 * Norman (2026-09-26) : SOREAL IDLE jouable sans APP / TV, en se connectant avec son compte Google ; un pseudo choisi dans Paramètres est le nom vu des autres
 * (les ouvriers : « Pseudo (Prénom) »). L'administrateur voit l'adresse et le nom Google.
 */
const ADMIN = "technicien.soreal@gmail.com";

// ---------------------------------------------------------------- pseudos
{
  assert.equal(normaliserPseudoIdleV1("  Le  Roi_du-Boss ").pseudo, "Le Roi_du-Boss", "espaces nettoyés");
  assert.equal(normaliserPseudoIdleV1("Zoé").ok, true);
  for (const [brut, code] of [["", "PSEUDO_VIDE"], ["ab", "PSEUDO_TROP_COURT"], ["a".repeat(21), "PSEUDO_TROP_LONG"], ["_abc", "PSEUDO_CARACTERES"], ["abc_", "PSEUDO_CARACTERES"], ["a<b>c", "PSEUDO_CARACTERES"],
    ["12345", "PSEUDO_LETTRES"], ["www.truc", "PSEUDO_LIEN"], ["Admin", "PSEUDO_RESERVE"], ["ADMINISTRATEUR", "PSEUDO_RESERVE"], ["Sorèal", "PSEUDO_RESERVE"], ["voir http", "PSEUDO_LIEN"]]) {
    const r = normaliserPseudoIdleV1(brut);
    assert.equal(r.ok, false, brut);
    assert.equal(r.code, code, brut);
    assert.ok(r.message);
  }
  assert.equal(idlePseudoCleV1("Zoé la Reine!"), "zoelareine");
  assert.equal(libelleJoueurIdleV1({ pseudo: "Zozo", externe: true }, "Joueur"), "Zozo", "un externe : le pseudo seul");
  assert.equal(libelleJoueurIdleV1({ pseudo: "Zozo", externe: false }, "Zoé"), "Zozo (Zoé)", "un ouvrier : pseudo (prénom)");
  assert.equal(libelleJoueurIdleV1({ pseudo: "zoé", externe: false }, "Zoé"), "zoé", "pseudo identique au prénom : pas de doublon");
  assert.equal(libelleJoueurIdleV1({ pseudo: "", externe: false }, "Zoé"), "Zoé", "sans pseudo : le prénom");
  assert.equal(libelleJoueurIdleV1(null, "Joueur"), "Joueur");
}

// ---------------------------------------------------------------- jeton Google
const CLIENT = "123-abc.apps.googleusercontent.com";
const paire = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const autre = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwk = await crypto.subtle.exportKey("jwk", paire.publicKey);
const b64u = (octets) => Buffer.from(octets).toString("base64url");
const jsonB64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
async function jeton(charge, { cle = paire.privateKey, kid = "k1", alg = "RS256" } = {}) {
  const t = jsonB64u({ alg, kid, typ: "JWT" }) + "." + jsonB64u(charge);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cle, new TextEncoder().encode(t));
  return t + "." + b64u(new Uint8Array(signature));
}
let appelsCles = 0;
const fetchGoogle = async () => { appelsCles += 1; return new Response(JSON.stringify({ keys: [{ kid: "k1", kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", use: "sig" }] }), { status: 200 }); };
const NOW = 1_800_000_000;
const base = { iss: "https://accounts.google.com", aud: CLIENT, sub: "1122", email: "Zoe.Joueuse@Gmail.com", email_verified: true, name: "Zoé Dupont", given_name: "Zoé", iat: NOW - 10, exp: NOW + 3000 };
const verifier = (j, extra = {}) => verifierJetonGoogleIdleV1(j, { clientId: CLIENT, fetchImpl: fetchGoogle, maintenantS: NOW, ...extra });
reinitialiserCacheClesGoogleIdleV1();
{
  const ok = await verifier(await jeton(base));
  assert.deepEqual({ ...ok }, { ok: true, email: "zoe.joueuse@gmail.com", sub: "1122", nom: "Zoé Dupont", prenom: "Zoé" }, "jeton valide : adresse en minuscules");
  await verifier(await jeton(base));
  assert.equal(appelsCles, 1, "clés Google mises en cache");
  assert.equal((await verifier(await jeton({ ...base, iss: "accounts.google.com" }))).ok, true, "les deux formes d'émetteur");
  assert.equal((await verifier(await jeton({ ...base, aud: ["autre", CLIENT] }))).ok, true);
  const refus = async (charge, code, opts) => assert.equal((await verifier(await jeton(charge, opts))).code, code, code);
  await refus({ ...base, aud: "autre-client" }, "GOOGLE_DESTINATAIRE_INVALIDE");
  await refus({ ...base, iss: "https://evil.example" }, "GOOGLE_EMETTEUR_INVALIDE");
  await refus({ ...base, exp: NOW - 500 }, "GOOGLE_JETON_EXPIRE");
  await refus({ ...base, email_verified: false }, "GOOGLE_EMAIL_NON_VERIFIE");
  await refus({ ...base, email: "" }, "GOOGLE_EMAIL_NON_VERIFIE");
  await refus({ ...base, sub: "" }, "GOOGLE_JETON_INVALIDE");
  await refus(base, "GOOGLE_SIGNATURE_INVALIDE", { cle: autre.privateKey });
  await refus(base, "GOOGLE_JETON_INVALIDE", { kid: "inconnue" });
  assert.equal((await verifier("pas.un.jeton")).ok, false);
  assert.equal((await verifier("")).code, "GOOGLE_JETON_INVALIDE");
  assert.equal((await verifier(await jeton(base), { clientId: "" })).code, "GOOGLE_NON_CONFIGURE", "sans identifiant client : désactivé");
  const falsifie = (await jeton(base)).split(".");
  falsifie[1] = jsonB64u({ ...base, email: ADMIN });
  assert.equal((await verifier(falsifie.join("."))).code, "GOOGLE_SIGNATURE_INVALIDE", "charge modifiée après signature : refusée (usurpation de l'administrateur)");
  const tordu = jsonB64u({ alg: "none", kid: "k1" }) + "." + jsonB64u(base) + ".";
  assert.equal((await verifier(tordu)).ok, false, "alg none refusé");
  assert.equal((await verifier(await jeton(base), { fetchImpl: async () => new Response("", { status: 500 }) })).ok, true, "clés déjà en cache : Google indisponible n'empêche pas");
  reinitialiserCacheClesGoogleIdleV1();
  assert.equal((await verifier(await jeton(base), { fetchImpl: async () => new Response("", { status: 500 }) })).code, "GOOGLE_CLES_INDISPONIBLES");
  reinitialiserCacheClesGoogleIdleV1();
}

// ---------------------------------------------------------------- bout en bout (SQLite en mémoire)
const db = new DatabaseSync(":memory:");
const sql = {
  exec(query, ...bindings) {
    const statement = db.prepare(query);
    if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
    statement.run(...bindings);
    return [];
  }
};
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coordinator = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('JOUEURS',1,?,?)", JSON.stringify(HEADERS), Date.now());

function sessionApp(email, prenom, extra = {}) {
  const ticket = coordinator.createLaunchTicketV1({ source: "tv", user: { email, emailConnexion: email, emails: [email], prenom, ...extra } });
  assert.equal(ticket.ok, true);
  return coordinator.consumeLaunchTicketV1(ticket.ticket).sessionToken;
}
function sessionGoogle(email, nom) {
  const r = coordinator.createGoogleSessionV1({ email, nom, sub: "s-" + email });
  assert.equal(r.ok, true);
  return r.sessionToken;
}
function appeler(token, operation, args = []) {
  return coordinator.runStandaloneSessionOperationV1({ sessionToken: token, operation, args: [token, ...args] });
}
const erreur = (fn) => { try { fn(); } catch (e) { return String(e.code || e.message); } return ""; };

const admin = sessionApp(ADMIN, "Norman");
const zoe = sessionGoogle("zoe.joueuse@gmail.com", "Zoé Dupont");

// accès public fermé par défaut : la connexion Google ouvre une session, mais pas le jeu
assert.equal(appeler(zoe, "obtenirAccesSorealIdle").autorise, false, "accès public fermé : refusé");
assert.equal(erreur(() => appeler(zoe, "definirAutoBossSuivantSorealIdle", [true])), "SOREAL_IDLE_ACCES_REFUSE");

// seul l'administrateur ouvre l'accès public
assert.equal(erreur(() => appeler(zoe, "definirAccesPublicSorealIdle", [true])), "SOREAL_IDLE_ACCES_REFUSE", "un externe ne peut pas ouvrir l'accès");
assert.deepEqual({ ...appeler(admin, "definirAccesPublicSorealIdle", [true]) }, { ok: true, accesPublic: true });

// externe autorisé, sous sa propre adresse, avec sa propre partie
const acces = appeler(zoe, "obtenirAccesSorealIdle");
assert.equal(acces.autorise, true);
assert.equal(acces.externe, true);
assert.equal(acces.utilisateur.email, "zoe.joueuse@gmail.com");
appeler(zoe, "definirAutoBossSuivantSorealIdle", [true]);
const idZoe = appeler(zoe, "obtenirIdentiteSorealIdle");
assert.equal(idZoe.externe, true);
assert.equal(idZoe.pseudo, "");
assert.equal(idZoe.nomAffiche, "Joueur");
assert.equal(idZoe.email, "zoe.joueuse@gmail.com", "il voit son propre compte Google");
assert.equal(erreur(() => appeler(zoe, "definirAccesPublicSorealIdle", [false])), "SOREAL_IDLE_ADMIN_REQUIS");
assert.equal(erreur(() => appeler(zoe, "listerJoueursExternesSorealIdle")), "SOREAL_IDLE_ADMIN_REQUIS");
assert.equal(erreur(() => appeler(zoe, "definirAccesOuvertSorealIdle", [true])), "SOREAL_IDLE_ADMIN_REQUIS");

// pseudo
assert.equal(appeler(zoe, "definirPseudoSorealIdle", ["ab"]).code, "PSEUDO_TROP_COURT");
const nomme = appeler(zoe, "definirPseudoSorealIdle", ["Zozo la Reine"]);
assert.equal(nomme.ok, true);
assert.equal(nomme.nomAffiche, "Zozo la Reine", "un externe : le pseudo seul, sans son nom Google");
assert.equal(appeler(zoe, "obtenirIdentiteSorealIdle").pseudo, "Zozo la Reine");

// un autre externe ne peut pas prendre le même pseudo (sans accents ni majuscules)
const max = sessionGoogle("max.dupont@gmail.com", "Max Dupont");
assert.equal(appeler(max, "obtenirAccesSorealIdle").autorise, true);
assert.equal(appeler(max, "definirPseudoSorealIdle", ["ZOZO LA REINE"]).code, "PSEUDO_PRIS");
assert.equal(appeler(max, "definirPseudoSorealIdle", ["Maxou"]).ok, true);
assert.equal(appeler(zoe, "definirPseudoSorealIdle", ["Zozo la Reine"]).ok, true, "garder son propre pseudo est permis");

// un ouvrier (arrivé par APP / TV) : « Pseudo (Prénom) »
assert.equal(coordinator.createLaunchTicketV1({ source: "tv", user: { email: "alice@example.com", prenom: "Alice", idleTrophee: true } }).ok, false, "un ouvrier n'entre pas tant que l'accès aux détenteurs du trophée est fermé (l'accès public ne concerne que Google)");
appeler(admin, "definirAccesOuvertSorealIdle", [true]);
const alice = sessionApp("alice@example.com", "Alice", { idleTrophee: true });
assert.equal(appeler(alice, "obtenirAccesSorealIdle").autorise, true);
assert.equal(appeler(alice, "obtenirAccesSorealIdle").externe, false);
assert.equal(appeler(alice, "definirPseudoSorealIdle", ["Al Capone"]).nomAffiche, "Al Capone (Alice)");
assert.equal(appeler(alice, "obtenirIdentiteSorealIdle").externe, false);
assert.equal(appeler(alice, "obtenirIdentiteSorealIdle").email, "", "l'adresse d'un ouvrier n'est pas exposée");
assert.equal(appeler(alice, "definirPseudoSorealIdle", ["Zozo la Reine"]).code, "PSEUDO_PRIS", "l'unicité vaut aussi pour les ouvriers");

// l'administrateur voit adresse + nom Google + pseudo des externes
{
  const liste = appeler(admin, "listerJoueursExternesSorealIdle").joueurs;
  assert.deepEqual(liste.map((j) => [j.email, j.nomGoogle, j.pseudo]).sort(), [["max.dupont@gmail.com", "Max Dupont", "Maxou"], ["zoe.joueuse@gmail.com", "Zoé Dupont", "Zozo la Reine"]]);
}

// le drapeau « externe » ne s'obtient jamais par un ticket APP / TV (il est retiré) : la session reste celle d'un ouvrier
{
  const faux = sessionApp("intrus@example.com", "Intrus", { externe: true, idleTrophee: true });
  assert.equal(appeler(faux, "obtenirAccesSorealIdle").externe, false);
  assert.equal(appeler(faux, "obtenirIdentiteSorealIdle").externe, false);
  assert.equal(coordinator.standaloneSessionV1(faux).user.externe, undefined);
}

// fermer l'accès public : les externes sont refusés à l'appel suivant, sans effacer leur partie
appeler(admin, "definirAccesPublicSorealIdle", [false]);
assert.equal(appeler(zoe, "obtenirAccesSorealIdle").autorise, false);
appeler(admin, "definirAccesPublicSorealIdle", [true]);
assert.equal(appeler(zoe, "obtenirIdentiteSorealIdle").pseudo, "Zozo la Reine", "pseudo conservé");

// un externe n'adopte jamais une ligne d'après son nom : une ligne « Joueur » sans adresse reste intacte
{
  const nb = () => sql.exec("SELECT COUNT(*) AS n FROM idle_players")[0].n;
  const avant = nb();
  const nina = sessionGoogle("nina@gmail.com", "Nina");
  appeler(nina, "definirAutoBossSuivantSorealIdle", [true]);
  assert.equal(nb(), avant + 1, "une nouvelle partie pour chaque compte Google");
}

// déconnexion : la session est révoquée
{
  const s = sessionGoogle("bye@gmail.com", "Bye");
  assert.equal(coordinator.standaloneSessionV1(s).ok, true);
  assert.equal(coordinator.revokeSessionV1(s).ok, true);
  assert.equal(coordinator.standaloneSessionV1(s).ok, false);
  assert.equal(coordinator.createGoogleSessionV1({ email: "pas-un-mail" }).ok, false);
}

// ---------------------------------------------------------------- état du joueur (source) : identité + interrupteur réservé à l'administrateur
{
  const runtime = readFileSync(new URL("../src/idle-sqlite-runtime.js", import.meta.url), "utf8");
  assert.ok(runtime.includes("? { accesOuvert: accesOuvertSorealIdle_(), accesPublic: accesPublicSorealIdle_() }"), "interrupteur d'accès public exposé seulement au compte administrateur");
  assert.ok(runtime.includes("identite: identiteJoueurSorealIdle_("), "l'état contient l'identité (pseudo, nom affiché)");
  assert.ok(runtime.includes("nomAffiche(cle, nomBrut)"), "le classement montre les pseudos");
  assert.ok(runtime.includes("setValues([[entree.cle, entree.nomBrut, Date.now()]])"), "le registre garde le nom brut (jamais un nom affiché)");
}

// ---------------------------------------------------------------- Worker
{
  const worker = readFileSync(new URL("../src/idle-worker-entry-v1.js", import.meta.url), "utf8");
  assert.ok(worker.includes('url.pathname === "/api/v1/google-login"') && worker.includes("verifierJetonGoogleIdleV1(body?.credential, { clientId: env?.GOOGLE_CLIENT_ID })"));
  assert.ok(worker.includes('url.pathname === "/api/v1/logout"'));
  assert.ok(worker.includes("googleClientId: String(env?.GOOGLE_CLIENT_ID || \"\").trim()"), "le client sait s'il faut proposer le bouton");
  const wrangler = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
  assert.ok(wrangler.includes('"GOOGLE_CLIENT_ID"'));
  const coord = readFileSync(new URL("../src/index-idle-coordinator-v1.js", import.meta.url), "utf8");
  assert.ok(coord.includes('path === "/__soreal-idle-v1/google-session-create"'));
  assert.ok(!/externe/.test(coord.slice(coord.indexOf("function normalizeIdleLaunchUserV1"), coord.indexOf("class SorealIdleCoordinatorV1"))), "normalizeIdleLaunchUserV1 ne transmet jamais le drapeau externe");
}

console.log("idle-google-profile-v1: OK");
