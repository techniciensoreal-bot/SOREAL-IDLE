import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Mises à jour de l'application Windows (Norman, 2026-10-28) : « je propose une mise à jour que la personne voit en haut ; elle se fait dans la fenêtre et le jeu se relance, sans retélécharger d'exe ».
 * Ce test joue tout le circuit sans réseau extérieur : le VRAI Worker embarqué sert le manifeste signé et les fichiers (routes /api/v1/maj/…), l'application vérifie la signature, calcule ce qui manque, télécharge, installe en couches, valide ou revient en arrière.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (f) => import(pathToFileURL(path.join(DEPOT, "desktop", "src", f)).href);
const { creerEnvLocal } = await imp("env-local.mjs");
const M = await imp("maj.mjs");
const { ecrireZip, lireZip } = await imp("zip.mjs");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-maj-"));
const r2 = path.join(tmp, "r2");   // le « bucket »
const ecrire = (cle, contenu) => { const f = path.join(r2, ...cle.split("/")); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, contenu); };
const md5 = (b) => crypto.createHash("md5").update(b).digest("hex");
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

// --- zip : aller-retour, déterminisme, refus d'un chemin qui sort du dossier
{
  const e = [{ nom: "cloudflare/src/a.js", donnees: Buffer.from("x".repeat(3000)) }, { nom: "design/é.json", donnees: Buffer.from("{}") }];
  const z = ecrireZip(e);
  assert.deepEqual(lireZip(z).map((x) => x.nom), e.map((x) => x.nom));
  assert.ok(ecrireZip(e).equals(z), "zip déterministe");
  assert.throws(() => lireZip(ecrireZip([{ nom: "../x.js", donnees: Buffer.from("1") }])), /ZIP_NOM_REFUSE/);
  const alea = ecrireZip([{ nom: "x.bin", donnees: crypto.randomBytes(200) }]);   // incompressible : stocké tel quel
  const casse = Buffer.from(alea); casse[30 + "x.bin".length + 10] ^= 0xff;
  assert.throws(() => lireZip(casse), /ZIP_CORROMPU/, "un octet modifié est détecté (CRC)");
}

// --- le paquet de la mise à jour et ses médias
const code = ecrireZip([
  { nom: "cloudflare/src/idle-worker-entry-v1.js", donnees: Buffer.from("export default {}") },
  { nom: "cloudflare/src/index-idle-coordinator-v1.js", donnees: Buffer.from("export class C {}") },
  { nom: "cloudflare/public/index.html", donnees: Buffer.from("<html>v2</html>") }
]);
const voix1 = Buffer.from("voix-1"), voix2 = Buffer.from("voix-2-nouvelle"), image = Buffer.from("image-v2");
ecrire("idle/voix/a.m4a", voix1); ecrire("idle/voix/b.m4a", voix2); ecrire("idle/bosses/Boss_1.png", image);
ecrire("idle/_maj/jeu-test.zip", code);
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const pub = publicKey.export({ type: "spki", format: "pem" }), priv = privateKey.export({ type: "pkcs8", format: "pem" });
const manifeste = {
  v: 1, version: "2026-10-28T10:00:00Z", date: "2026-10-28T10:00:00Z", notes: "Nouvelles images",
  code: { cle: "idle/_maj/jeu-test.zip", taille: code.length, sha256: sha(code) },
  medias: [["idle/bosses/Boss_1.png", image.length, md5(image)], ["idle/voix/a.m4a", voix1.length, md5(voix1)], ["idle/voix/b.m4a", voix2.length, md5(voix2)]]
};
manifeste.signature = M.signerManifeste(manifeste, priv);
assert.equal(M.signatureValide(manifeste, pub), true);
assert.equal(M.signatureValide(Object.assign({}, manifeste, { notes: "autre" }), pub), false, "un manifeste modifié est refusé");
assert.equal(M.signatureValide(manifeste, crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" })), false, "une autre clé est refusée");
ecrire("idle/_maj/manifeste.json", JSON.stringify(manifeste));

// --- le vrai Worker embarqué sert tout cela
const env = await creerEnvLocal({
  racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossierMedias: r2, fichierBase: path.join(tmp, "base", "s.sqlite"),
  utilisateur: { email: "j@soreal-idle.local", emailConnexion: "j@soreal-idle.local", emails: ["j@soreal-idle.local"], prenom: "J" }
});
const serveur = http.createServer(async (req, res) => {
  const rep = await env.fetch(new Request("http://localhost" + req.url, { method: req.method }));
  const sortie = {}; rep.headers.forEach((v, k) => { sortie[k] = v; });
  res.writeHead(rep.status, sortie); res.end(Buffer.from(await rep.arrayBuffer()));
});
await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
const urlBase = "http://127.0.0.1:" + serveur.address().port;
const get = async (u) => fetch(urlBase + u);

// routes : sécurité de la clé demandée
assert.equal((await get("/api/v1/maj/fichier?cle=" + encodeURIComponent("../etc/passwd"))).status, 400);
assert.equal((await get("/api/v1/maj/fichier?cle=" + encodeURIComponent("app/secret.json"))).status, 400, "seulement sous idle/");
assert.equal((await get("/api/v1/maj/fichier?cle=" + encodeURIComponent("idle/a//b"))).status, 400);
assert.equal((await get("/api/v1/maj/fichier?cle=" + encodeURIComponent("idle/absent.png"))).status, 404);
assert.equal((await (await get("/api/v1/maj/fichier?cle=" + encodeURIComponent("idle/voix/a.m4a"))).arrayBuffer()).byteLength, voix1.length);

// l'appareil : installé avec a.m4a à l'identique ; code d'origine
const dossierMaj = path.join(tmp, "donnees", "maj");
const embarque = { codeSha: "ancien", index: { "idle/voix/a.m4a": [voix1.length, md5(voix1)] } };
let etat = M.lireEtat(dossierMaj, embarque);
assert.equal(etat.version, null);
let v = await M.verifierMaj({ urlBase, clePublique: pub, etat });
assert.equal(v.disponible, true);
assert.equal(v.delta.codeChange, true);
assert.deepEqual(v.delta.medias.map((m) => m[0]).sort(), ["idle/bosses/Boss_1.png", "idle/voix/b.m4a"], "a.m4a est déjà là : non retéléchargé");
assert.equal(v.delta.octets, code.length + image.length + voix2.length);
// signature refusée si la clé de l'application n'est pas celle du propriétaire
assert.equal((await M.verifierMaj({ urlBase, clePublique: crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }), etat })).code, "SIGNATURE_REFUSEE");
// pas de réseau : silencieux
assert.equal((await M.verifierMaj({ urlBase: "http://127.0.0.1:1", clePublique: pub, etat, delaiMs: 800 })).code, "HORS_LIGNE");

// installation avec progression
const vus = [];
etat = await M.installerMaj({ urlBase, manifeste: v.manifeste, delta: v.delta, dossierMaj, etat, progression: (p) => vus.push(p) });
assert.equal(vus.length, 3, "une étape par fichier téléchargé");
assert.equal(vus[vus.length - 1].fait, 3);
assert.equal(vus[vus.length - 1].octets, vus[vus.length - 1].octetsTotal);
assert.ok(!fs.readdirSync(dossierMaj).some((d) => d.endsWith(".partiel")), "aucun dossier à moitié installé");
assert.equal(etat.version, manifeste.version); assert.equal(etat.enAttente, manifeste.version); assert.ok(etat.precedent);
const couches = M.couchesActives(dossierMaj, etat);
assert.ok(couches.racineCode && fs.readFileSync(path.join(couches.racineCode, "cloudflare", "public", "index.html"), "utf8") === "<html>v2</html>", "le code de la mise à jour est la nouvelle racine");
assert.equal(couches.dossiersMedias.length, 1);
assert.equal(fs.readFileSync(path.join(couches.dossiersMedias[0], "idle", "voix", "b.m4a")).toString(), "voix-2-nouvelle");
// plus rien à proposer ; l'état est relu tel quel
etat = M.lireEtat(dossierMaj, embarque);
assert.equal((await M.verifierMaj({ urlBase, clePublique: pub, etat })).disponible, false);
// couches : la mise à jour l'emporte sur les médias de l'installateur
const installe = path.join(tmp, "installe"); fs.mkdirSync(path.join(installe, "idle", "voix"), { recursive: true });
fs.writeFileSync(path.join(installe, "idle", "voix", "b.m4a"), "ancienne"); fs.writeFileSync(path.join(installe, "idle", "voix", "c.m4a"), "seulement-installe");
const envCouches = await creerEnvLocal({
  racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossiersMedias: couches.dossiersMedias.concat([installe]), fichierBase: path.join(tmp, "base2", "s.sqlite"),
  utilisateur: { email: "j@soreal-idle.local", emailConnexion: "j@soreal-idle.local", emails: ["j@soreal-idle.local"], prenom: "J" }
});
assert.equal(await (await envCouches.env.SOREAL_R2.get("idle/voix/b.m4a")).text(), "voix-2-nouvelle", "couche récente prioritaire");
assert.equal(await (await envCouches.env.SOREAL_R2.get("idle/voix/c.m4a")).text(), "seulement-installe", "repli sur l'installateur");
envCouches.fermer();

// validation / retour en arrière : un démarrage raté revient à l'état d'avant et ne repropose pas la même version
assert.equal(etat.tentatives, 0, "une installation repart de zéro (sinon le premier démarrage de la suivante serait pris pour un échec)");
const valide = M.validerMaj(dossierMaj, Object.assign({}, etat, { tentatives: 1 }));
assert.equal(valide.enAttente, null); assert.equal(valide.tentatives, 0);
etat = M.revenirEnArriere(dossierMaj, Object.assign({}, M.lireEtat(dossierMaj, embarque), { enAttente: manifeste.version, precedent: { version: null, date: null, codeSha: "ancien", codeDossier: null, mediaDossiers: [], index: embarque.index } }));
assert.equal(etat.codeSha, "ancien"); assert.deepEqual(etat.refusees, [manifeste.version]); assert.equal(M.couchesActives(dossierMaj, etat).racineCode, null);
assert.equal((await M.verifierMaj({ urlBase, clePublique: pub, etat })).disponible, false, "la version refusée n'est plus proposée");

// un fichier corrompu en route : rien n'est installé
ecrire("idle/voix/b.m4a", Buffer.from("voix-2-CORROMPUE"));
const dossier2 = path.join(tmp, "donnees2", "maj");
const etat2 = M.lireEtat(dossier2, embarque);
const v2 = await M.verifierMaj({ urlBase, clePublique: pub, etat: etat2 });
await assert.rejects(() => M.installerMaj({ urlBase, manifeste: v2.manifeste, delta: v2.delta, dossierMaj: dossier2, etat: etat2, simultanes: 1 }), /TAILLE_INATTENDUE|EMPREINTE_INATTENDUE|TELECHARGEMENT_ECHEC/);
assert.ok(!fs.existsSync(dossier2) || !fs.readdirSync(dossier2).some((d) => d.startsWith("v")), "échec : aucun dossier de mise à jour laissé");

// le jeu : bandeau en haut seulement dans l'application, installation dans la fenêtre, relance ; jamais d'installateur
const bandeau = fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "modules", "maj-v1.js"), "utf8");
assert.ok(bandeau.includes("var D=window.sorealDesktop;") && bandeau.includes("typeof D.majInstaller!=='function'")&& bandeau.includes("return;"), "aucun effet hors de l'application");
assert.ok(bandeau.includes("data-maj=\"installer\"") && bandeau.includes("data-maj=\"plus-tard\"") && bandeau.includes("maj-barre") && bandeau.includes("Redémarrage du jeu"), "Mettre à jour / Plus tard / progression / redémarrage");
assert.ok(bandeau.includes("data-morph-garder"), "hors de la page : les redessins ne le touchent pas");
const main = fs.readFileSync(path.join(DEPOT, "desktop", "main.js"), "utf8");
assert.ok(main.includes("app.relaunch(); app.exit(0)") && main.includes("setInterval(verifierMaj, 30 * 60 * 1000)") && main.includes("revenirEnArriere"), "relance, vérification périodique, retour en arrière");
assert.ok(!/autoUpdater|electron-updater|nsis/i.test(main), "aucun téléchargement d'installateur");
const pre = fs.readFileSync(path.join(DEPOT, "desktop", "preload.js"), "utf8");
assert.ok(pre.includes('"maj:installer"') && !pre.includes("require(\"fs\")"), "pont limité");
assert.ok(fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "index.html"), "utf8").includes("/modules/maj-v1.js"), "module chargé");
assert.ok(fs.existsSync(path.join(DEPOT, "desktop", "maj-cle-publique.pem")) && !fs.readFileSync(path.join(DEPOT, "desktop", "maj-cle-publique.pem"), "utf8").includes("PRIVATE"), "clé publique dans le dépôt, jamais la privée");

serveur.close(); env.fermer();
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-desktop-maj-v1: OK");
