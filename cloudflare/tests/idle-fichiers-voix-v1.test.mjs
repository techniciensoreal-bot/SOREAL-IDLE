import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-04) : « je dois avoir la possibilité de télécharger le fichier de voix, le modifier et le réuploader via le menu d'édition des voix ; l'upload doit remplacer l'ancien fichier ; sinon les voix
 * doivent être nettoyées une fois le bouton de nettoyage des voix pressé. »
 */
const source = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const textes = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
const worker = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");

// Faux navigateur : fetch enregistré, ancres de téléchargement, lecteur de fichier.
const appelsFetch = [];
const telechargements = [];
let reponseFetch = () => Promise.resolve({ ok: true, status: 200, blob: () => Promise.resolve(new Blob([new Uint8Array(40)])), json: () => Promise.resolve({ ok: true }) });
const document_ = {
  head: { appendChild() {} }, body: { appendChild() {} }, getElementById: () => null, addEventListener() {},
  createElement: (tag) => (tag === "a" ? { style: {}, click() { telechargements.push({ nom: this.download, href: this.href }); }, remove() {} } : { style: {}, addEventListener() {}, click() {}, remove() {} })
};
class FauxFileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((ab) => { this.result = ab; this.onload(); }); }
}
const window_ = {
  document: document_,
  __SOREAL_IDLE_STANDALONE_V1__: { session: () => "jeton-admin" },
  __SOREAL_IDLE_CALL_V1__: () => Promise.resolve({ ok: true, histoires: [], boss: [] })
};
const contexte = {
  window: window_, document: document_, setTimeout, clearTimeout, URL, Blob, Uint8Array, String, Promise, Date, FileReader: FauxFileReader, Audio: function () { this.play = () => Promise.resolve(); },
  fetch: (url, options) => { appelsFetch.push({ url, options }); return reponseFetch(url, options); }
};
vm.runInNewContext(source, contexte);
const o = window_.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__.outilsVoix;
for (const nom of ["fichiersVoixHtml", "clicFichierVoix", "telechargerVoix", "remplacerVoix", "verifierFichierVoix", "urlVoix"]) assert.equal(typeof o[nom], "function", nom);

const m4a = (taille = 40) => { const b = new Uint8Array(taille); b.set([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]); return new Blob([b]); };

// 1. La liste : une ligne par bloc, trois boutons ; télécharger et écouter seulement quand le fichier existe.
{
  const html = o.fichiersVoixHtml([{ texte: "Premier bloc.", hash: "aaaaaaaaaaaaaa", parleur: "narrateur" }, { texte: "Second bloc, plus long ".repeat(10), hash: "bbbbbbbbbbbbbb", parleur: "femme" }], ["aaaaaaaaaaaaaa"]);
  assert.equal((html.match(/class="fv-ligne"/g) || []).length, 2);
  assert.ok(html.includes('data-fv-hash="aaaaaaaaaaaaaa"') && html.includes('data-fv-hash="bbbbbbbbbbbbbb"'));
  assert.equal((html.match(/data-fv="remplacer"/g) || []).length, 2, "remplacer toujours possible (crée le fichier s'il manque)");
  assert.equal((html.match(/data-fv="telecharger"[^>]*disabled/g) || []).length, 1, "pas de téléchargement sans fichier");
  assert.ok(html.includes("fichier prêt") && html.includes("pas de fichier"));
  assert.equal(o.fichiersVoixHtml([], []), "");
}

// 2. Seul un vrai m4a passe : jamais un wav, un fichier vide, ou trop gros.
{
  await o.verifierFichierVoix(m4a());
  await assert.rejects(o.verifierFichierVoix(new Blob([new TextEncoder().encode("RIFF....WAVEfmt  ")])), /Format attendu : m4a/);
  await assert.rejects(o.verifierFichierVoix(new Blob([new Uint8Array(4)])), /vide ou illisible/);
  await assert.rejects(o.verifierFichierVoix({ size: 13 * 1024 * 1024 }), /trop gros/);
  await assert.rejects(o.verifierFichierVoix(null), /Aucun fichier/);
}

// 3. Remplacer : le téléversement vise l'empreinte du bloc (même clé R2 = l'ancien fichier est écrasé), avec le jeton de l'admin ; un fichier refusé n'envoie rien.
{
  appelsFetch.length = 0;
  await o.remplacerVoix("0123456789abcd", m4a());
  assert.equal(appelsFetch.length, 1);
  assert.equal(appelsFetch[0].url, "/api/v1/voice-upload?h=0123456789abcd", "même empreinte = même fichier");
  assert.equal(appelsFetch[0].options.method, "POST");
  assert.equal(appelsFetch[0].options.headers.authorization, "Bearer jeton-admin");
  await o.remplacerVoix("0123456789abcd", m4a());
  assert.equal(appelsFetch[1].url, appelsFetch[0].url, "un second remplacement écrase le premier : jamais de doublon");
  appelsFetch.length = 0;
  await assert.rejects(o.remplacerVoix("0123456789abcd", new Blob([new TextEncoder().encode("RIFF....WAVEfmt  ")])));
  assert.equal(appelsFetch.length, 0, "fichier refusé : rien n'est envoyé");
}

// 4. Télécharger : le fichier du serveur, sans cache, nommé avec l'empreinte ; un bloc sans fichier donne un message clair.
{
  appelsFetch.length = 0; telechargements.length = 0;
  await o.telechargerVoix("0123456789abcd", "boss-12-bloc1-0123456789abcd");
  assert.ok(appelsFetch[0].url.startsWith("/api/idle/media/voice?h=0123456789abcd&t="), "cache contourné");
  assert.equal(appelsFetch[0].options.cache, "no-store");
  assert.equal(telechargements[0].nom, "boss-12-bloc1-0123456789abcd.m4a");
  reponseFetch = () => Promise.resolve({ ok: false, status: 404 });
  await assert.rejects(o.telechargerVoix("0123456789abcd"), /Pas encore de fichier/);
}

// 5. Câblage : les deux éditeurs (histoires, textes de boss et popups) ont la liste et les clics ; un fichier remplacé est déclaré dans le texte (le nettoyage le garde) ; les empreintes périmées sont retirées
//    à l'enregistrement (le nettoyage supprime leurs fichiers).
assert.ok(source.includes("fichiersVoixHtml_(blocs,voix)") && source.includes("clicFichierVoix_(fv,{"), "éditeur d'histoires");
assert.ok(textes.includes("fichiersVoixEditeurHtml_()") && textes.includes("o.clicFichierVoix(fv,{"), "éditeur des textes");
assert.ok(textes.includes("if(edition.voix.indexOf(hash)===-1)edition.voix.push(hash);") && textes.includes("return enregistrer_();"), "le fichier remplacé est déclaré dans le texte");
assert.ok(textes.includes("edition.voix=edition.voix.filter(function(h){return actuelles[h];});"), "empreintes périmées retirées à l'enregistrement");
assert.ok(source.includes("edition.voix=(edition.voix||[]).filter(function(h){return actuelles[h];});"), "idem pour les histoires");
assert.ok(worker.includes("if (utiles.has(hash)) gardees += 1;") && worker.includes("else { aSupprimer.push(o.key);"), "le nettoyage supprime tout fichier dont l'empreinte n'est plus déclarée");
console.log("idle-fichiers-voix-v1: OK");
