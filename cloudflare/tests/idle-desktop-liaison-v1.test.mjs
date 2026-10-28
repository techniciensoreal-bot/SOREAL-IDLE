import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Liaison de l'application Windows à un compte Google (Norman, 2026-10-28) : « la plus avancée gagne ; connexion Google ; la partie part au serveur comme si l'application avait toujours eu internet ».
 * Jouée ici avec le VRAI Worker et le vrai coordinateur dans le rôle du serveur de production (session Google du compte, ligne du joueur, import, sauvegardes), sans aucun réseau extérieur.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (f) => import(pathToFileURL(path.join(DEPOT, "desktop", "src", f)).href);
const { creerEnvLocal } = await imp("env-local.mjs");
const L = await imp("liaison.mjs");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-liaison-"));
const prod = await creerEnvLocal({
  racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: path.join(tmp, "m"), fichierBase: path.join(tmp, "prod", "s.sqlite"),
  utilisateur: { email: "autre@example.com", emailConnexion: "autre@example.com", emails: ["autre@example.com"], prenom: "Autre" }
});
const serveur = http.createServer(async (req, res) => {
  const morceaux = []; for await (const c of req) morceaux.push(c);
  const corps = morceaux.length ? Buffer.concat(morceaux) : undefined;
  const entetes = new Headers(); for (const [k, v] of Object.entries(req.headers)) if (v != null) entetes.set(k, Array.isArray(v) ? v.join(", ") : v);
  const rep = await prod.fetch(new Request("http://localhost" + req.url, { method: req.method, headers: entetes, body: req.method === "GET" || req.method === "HEAD" ? undefined : corps }));
  const sortie = {}; rep.headers.forEach((v, k) => { sortie[k] = v; });
  res.writeHead(rep.status, sortie); res.end(Buffer.from(await rep.arrayBuffer()));
});
await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
const urlBase = "http://127.0.0.1:" + serveur.address().port;
const nouveauCompte = (email) => prod.coord.createGoogleSessionV1({ email, nom: "Compte" }).sessionToken;
const appel = async (jeton, operation, args = []) => (await fetch(urlBase + "/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + jeton }, body: JSON.stringify({ operation, args: [jeton, ...args] }) })).json();
const ligneDuServeur = (email) => { for (const l of prod.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1")) { const c = JSON.parse(l.row_json); if (String(c[18]).toLowerCase() === email) return c; } return null; };

// --- comparaison : renaissances d'abord, puis boss vaincus ; l'égalité garde le serveur
{
  const c = (renaissances, boss) => { const a = new Array(38).fill(""); a[24] = renaissances; a[14] = boss; return a; };
  assert.equal(L.comparer(c(2, 5), c(1, 90)), 1, "plus de renaissances : plus avancée");
  assert.equal(L.comparer(c(1, 40), c(1, 12)), 1);
  assert.equal(L.comparer(c(0, 3), c(0, 3)), 0, "égalité : le serveur est gardé, rien n'est écrasé");
  assert.equal(L.comparer(c(0, 3), c(1, 0)), -1);
}

// --- serveur de retour : seul le bon code et un vrai jeton sont acceptés, et uniquement depuis cet ordinateur
{
  const r = await L.demarrerRetour({ delaiMs: 5000 });
  assert.ok(r.port > 0 && r.etat.length >= 32);
  const jetonOk = "ils_" + "a1".repeat(32);
  assert.equal((await fetch("http://127.0.0.1:" + r.port + "/liaison?etat=mauvais&jeton=" + jetonOk)).status, 400, "mauvais code refusé");
  assert.equal((await fetch("http://127.0.0.1:" + r.port + "/liaison?etat=" + r.etat + "&jeton=pas-un-jeton")).status, 400, "jeton mal formé refusé");
  assert.equal((await fetch("http://127.0.0.1:" + r.port + "/autre")).status, 404);
  const ok = await fetch("http://127.0.0.1:" + r.port + "/liaison?etat=" + r.etat + "&jeton=" + jetonOk + "&expire=1800000000000");
  assert.equal(ok.status, 200);
  assert.deepEqual(await r.attente, { jeton: jetonOk, expire: 1800000000000 });
  r.fermer();
  const delai = await L.demarrerRetour({ delaiMs: 150 });
  await assert.rejects(() => delai.attente, /LIAISON_DELAI/);
}

// --- réconciliation : la partie de cet ordinateur est plus avancée -> elle remplace celle du serveur (qui est mise de côté et sauvegardée)
{
  const jeton = nouveauCompte("compte1@example.com");
  assert.equal((await appel(jeton, "obtenirEtatSorealIdle")).ok, true);   // le compte existe sur le serveur : ligne créée
  const serv = ligneDuServeur("compte1@example.com");
  assert.ok(serv, "ligne du compte sur le serveur");
  const locale = serv.slice(); locale[24] = 3; locale[14] = 25; locale[1] = "Nom local"; locale[18] = "joueur@soreal-idle.local";
  const dossier = path.join(tmp, "de-cote1"), signaux = [];
  const r = await L.reconcilier({ urlBase, jeton, appareil: "exe-test", locale: { cells: locale, pseudo: "Zedpseudo" }, dossierMiseDeCote: dossier, progression: (p) => signaux.push(p.etape) });
  assert.equal(r.decision, "locale"); assert.equal(r.email, "compte1@example.com");
  assert.deepEqual(signaux, ["verification", "comparaison", "envoi"]);
  const apres = ligneDuServeur("compte1@example.com");
  assert.equal(Number(apres[24]), 3, "la partie de cet ordinateur est maintenant sur le serveur"); assert.equal(Number(apres[14]), 25);
  assert.equal(apres[18], "compte1@example.com", "l'identité reste celle du serveur (adresse)"); assert.equal(apres[1], serv[1], "et son nom");
  const fichiers = fs.readdirSync(dossier); assert.equal(fichiers.length, 1); assert.ok(fichiers[0].startsWith("partie-du-serveur-"));
  const aside = JSON.parse(fs.readFileSync(path.join(dossier, fichiers[0]), "utf8"));
  assert.equal(aside.format, "soreal-idle-partie-v1"); assert.equal(aside.cells.length, 38); assert.equal(Number(aside.cells[24]), Number(serv[24]), "la partie du serveur est gardée, au format « Exporter ma partie »");
  const copies = prod.sql.exec("SELECT motif FROM idle_sauvegardes_locales WHERE email='compte1@example.com'").map((x) => x.motif);
  assert.ok(copies.includes("avant-import"), "le serveur garde aussi sa copie avant l'import : " + copies.join(","));
  const pseudo = prod.sql.exec("SELECT pseudo FROM idle_profiles WHERE email='compte1@example.com'")[0];
  assert.equal(pseudo && pseudo.pseudo, "Zedpseudo", "le pseudo choisi sur l'ordinateur est repris");
}

// --- la partie du serveur est plus avancée -> celle de cet ordinateur est mise de côté, le serveur n'est pas touché
{
  const jeton = nouveauCompte("compte2@example.com");
  await appel(jeton, "obtenirEtatSorealIdle");
  const serv = ligneDuServeur("compte2@example.com"); serv[24] = 5; serv[14] = 60;
  prod.sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND json_extract(row_json,'$[18]')='compte2@example.com'", JSON.stringify(serv));
  const locale = serv.slice(); locale[24] = 1; locale[14] = 8; locale[1] = "Joueur local";
  const dossier = path.join(tmp, "de-cote2");
  const r = await L.reconcilier({ urlBase, jeton, appareil: "exe-test2", locale: { cells: locale, pseudo: "" }, dossierMiseDeCote: dossier });
  assert.equal(r.decision, "serveur");
  assert.equal(Number(ligneDuServeur("compte2@example.com")[24]), 5, "le serveur n'a pas bougé");
  const f = fs.readdirSync(dossier); assert.ok(f.length === 1 && f[0].startsWith("partie-de-cet-ordinateur-"), "la partie locale est mise de côté (rechargeable avec « Charger une partie »)");
  assert.equal(Number(JSON.parse(fs.readFileSync(path.join(dossier, f[0]), "utf8")).cells[24]), 1);
}
// --- égalité : le serveur gagne ; échecs : rien n'est écrasé
{
  const jeton = nouveauCompte("compte3@example.com");
  await appel(jeton, "obtenirEtatSorealIdle");
  const serv = ligneDuServeur("compte3@example.com");
  const r = await L.reconcilier({ urlBase, jeton, appareil: "e3", locale: { cells: serv.slice(), pseudo: "" }, dossierMiseDeCote: path.join(tmp, "de-cote3") });
  assert.equal(r.decision, "serveur", "égalité : le serveur est gardé");
  await assert.rejects(() => L.reconcilier({ urlBase, jeton: "ils_" + "0".repeat(40), appareil: "e", locale: { cells: serv.slice(), pseudo: "" }, dossierMiseDeCote: path.join(tmp, "x") }), /SESSION_REFUSEE/);
  await assert.rejects(() => L.reconcilier({ urlBase: "http://127.0.0.1:1", jeton, appareil: "e", locale: { cells: serv.slice(), pseudo: "" }, dossierMiseDeCote: path.join(tmp, "y") }), /SERVEUR_INDISPONIBLE/);
  await assert.rejects(() => L.reconcilier({ urlBase, jeton, appareil: "e", locale: { cells: [1, 2, 3], pseudo: "" }, dossierMiseDeCote: path.join(tmp, "z") }), /PARTIE_LOCALE_ABSENTE/);
}

// --- transmission : l'application reliée parle au serveur avec le jeton du compte
{
  const jeton = nouveauCompte("compte4@example.com");
  const ok = await L.transmettre({ urlBase, jeton: "ils_ignore", methode: "POST", chemin: "/api/v1/call", entetes: { "content-type": "application/json" }, corps: Buffer.from(JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [jeton] })), fetchFn: (u, o) => fetch(u, Object.assign({}, o, { headers: Object.assign({}, o.headers, { authorization: "Bearer " + jeton }) })) });
  assert.ok(ok && ok.reponse && ok.reponse.status === 200 && (await ok.reponse.json()).ok === true);
  assert.equal(ok.reponse.headers.get("content-encoding"), null, "jamais un en-tête de compression sur un corps déjà décompressé");
  assert.deepEqual(await L.transmettre({ urlBase, jeton: "ils_" + "0".repeat(40), methode: "POST", chemin: "/api/v1/call", entetes: { "content-type": "application/json" }, corps: Buffer.from(JSON.stringify({ operation: "obtenirEtatSorealIdle", args: ["ils_" + "0".repeat(40)] })) }), { expiree: true }, "jeton refusé : à relier de nouveau");
  assert.equal(await L.transmettre({ urlBase: "http://127.0.0.1:1", jeton, methode: "GET", chemin: "/api/v1/local/export", delaiMs: 800 }), null, "sans réseau : null (la page voit une erreur réseau)");
  assert.ok(L.transmissible("/api/v1/call") && L.transmissible("/api/v1/local/push") && !L.transmissible("/api/idle/media/boss") && !L.transmissible("/modules/a.js") && L.transmissible("/api/v1/voice-upload") && L.transmissible("/api/v1/story-upload") && L.transmissible("/api/v1/voice-purge"), "seuls les appels du jeu partent au serveur ; les images restent locales");
}

// --- jeton gardé chiffré
{
  const fausse = { chiffrer: (t) => Buffer.from([...t].reverse().join("")).toString("base64"), dechiffrer: (b) => [...Buffer.from(b, "base64").toString()].reverse().join("") };
  const dossier = path.join(tmp, "donnees"), jeton = "ils_" + "ab".repeat(30);
  L.ecrireLiaison(dossier, { jeton, email: "a@b.c", expire: 123, decision: "locale" }, fausse);
  const brut = fs.readFileSync(path.join(dossier, "liaison.json"), "utf8");
  assert.ok(!brut.includes(jeton), "le jeton n'est jamais écrit en clair");
  assert.deepEqual(L.lireLiaison(dossier, fausse), Object.assign({ lie: true, jeton, email: "a@b.c", expire: 123, decision: "locale" }, { date: JSON.parse(brut).date }));
  assert.deepEqual(L.lireLiaison(path.join(tmp, "absent"), fausse), { lie: false });
}

// --- câblage : page du serveur (mode liaison), application, interface
const pont = fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "standalone-bridge.js"), "utf8");
assert.ok(pont.includes("function liaisonParamsV1()") && pont.includes('"http://127.0.0.1:"+l.port+"/liaison?etat="') && pont.includes("if(liaison){await modeLiaisonV1(liaison);return;}"), "page : mode liaison, retour vers 127.0.0.1, sans lancer le jeu");
assert.ok(pont.includes("port>=1024&&port<=65535"), "port borné");
const main = fs.readFileSync(path.join(DEPOT, "desktop", "coeur.js"), "utf8");
assert.ok(main.includes("/api/idle/media/voice") && main.includes("distante.ok"), "une voix absente de l installateur est lue sur le serveur (administrateur : écoute immédiate après génération)");
assert.ok(main.includes("liaisonModule.transmissible(url.pathname)") && main.includes("return Response.error();") && main.includes('ipcMain.handle("liaison:demarrer"') && main.includes("env.definirSessionExterne"), "application : transmission, erreur réseau hors ligne, session du compte");
assert.ok(main.includes("shell.openExternal(adresseLiaison)") && main.includes("safeStorage"), "navigateur du PC, jeton chiffré");
const ui = fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "modules", "liaison-v1.js"), "utf8");
assert.ok(ui.includes("if(!pont())return '';") && ui.includes("window.sorealDesktop"), "aucune section hors de l'application");
assert.ok(!/classement|chat|en direct/i.test(ui.replace(/Compte relié[^']*/g, "")), "aucun spoil dans les textes");
assert.ok(fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "modules", "ui-reglages-v1.js"), "utf8").includes("window.__SOREAL_IDLE_LIAISON_V1__.sectionHtml()"), "section dans les Réglages");
assert.ok(fs.readFileSync(path.join(DEPOT, "desktop", "preload.js"), "utf8").includes('"liaison:demarrer"'), "pont limité aux appels de liaison");

serveur.close(); prod.fermer(); fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-desktop-liaison-v1: OK");
