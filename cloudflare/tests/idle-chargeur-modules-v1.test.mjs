/*
 * Chargeur de modules à la demande (modules/chargeur-v1.js ; vague 1 de l'audit 2026-11-09, front 5).
 * Garde : une seule requête par fichier, promesse partagée, échec géré (rien de faux mémorisé, essais espacés), adresse avec son ?v=N ;
 * la table de index.html couvre les modules retirés des <script>, chaque fichier existe, est suivi par maj-pins, est précharge par le service worker, et part dans les paquets exe/APK
 * (qui embarquent tout cloudflare/public). Seul l'administrateur déclenche le chargement du groupe « admin ».
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const lire = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const index = lire("public/index.html");
const chargeurSrc = lire("public/modules/chargeur-v1.js");

/* ---------- 1. La table de la page ---------- */
const bloc = index.match(/<script type="application\/json" id="soreal-modules-differes-v1">([\s\S]*?)<\/script>/);
assert.ok(bloc, "table des modules à la demande dans index.html");
const table = JSON.parse(bloc[1]);
const ADMIN = ["studio-pilote-v1", "credit-exp-admin-v1", "admin-histoires-v1", "admin-tutoriel-v1", "mesure-reference-v1"];
assert.deepEqual(table.admin.map((u) => u.replace(/^\/modules\/|\.js\?v=\d+$/g, "")), ADMIN, "groupe admin : mêmes modules, même ordre qu'avant");
for (const u of table.admin) {
  assert.match(u, /^\/modules\/[a-z0-9-]+\.js\?v=\d+$/, "adresse avec son ?v=N : " + u);
  const chemin = u.split("?")[0];
  assert.ok(existsSync(new URL("../public" + chemin, import.meta.url)), "fichier présent : " + chemin);
  assert.ok(!index.includes('<script defer src="' + chemin), chemin + " n'est plus un <script defer> (sinon double chargement)");
}
/* le chargeur est le premier script de la page, avant tout module qui pourrait l'appeler */
const premier = index.match(/<script defer src="([^"]+)"/);
assert.ok(premier && premier[1].startsWith("/modules/chargeur-v1.js?v="), "chargeur chargé en tout premier");
assert.ok(index.indexOf("soreal-modules-differes-v1") < index.indexOf("/modules/chargeur-v1.js"), "table avant le chargeur");

/* ---------- 2. Numéros ?v=N suivis par maj-pins, et SW qui précharge ---------- */
const manifeste = JSON.parse(lire("tools/pins-assets.json"));
for (const u of table.admin) {
  const [chemin, pin] = u.split("?v=");
  assert.ok(manifeste[chemin], "suivi par pins-assets.json : " + chemin);
  assert.equal(manifeste[chemin].pin, Number(pin), "numéro du manifeste = numéro de la table : " + chemin);
}
assert.ok(/soreal-modules-differes-v1/.test(lire("tools/maj-pins.mjs")), "maj-pins lit la table");
const sw = lire("public/sw-idle-v1.js");
assert.ok(sw.includes("soreal-modules-differes-v1"), "le service worker précharge aussi les modules de la table (hors ligne)");
/* même extraction que le service worker, rejouée sur la vraie page */
{
  const fonction = sw.match(/function adressesDe_\(texte\) \{[\s\S]*?\n\}/)[0];
  const ctx = {};
  vm.runInNewContext(fonction + ";this.adressesDe_=adressesDe_;", ctx);
  const urls = ctx.adressesDe_(index);
  for (const u of table.admin) assert.ok(urls.includes(u), "préchargé hors ligne : " + u);
  assert.ok(urls.some((u) => u.startsWith("/modules/chargeur-v1.js")), "chargeur préchargé");
}

/* ---------- 3. Exe et APK : paquets de tout cloudflare/public ---------- */
assert.ok(/\["cloudflare", "public"\]/.test(lire("../desktop/src/paquet.mjs")), "paquet exe : tout cloudflare/public");
assert.ok(/cloudflare", "public"/.test(lire("../android/code-apk.mjs")) && /lister\(PUBLIC/.test(lire("../android/code-apk.mjs")), "paquet APK : tout cloudflare/public");

/* ---------- 4. Comportement du chargeur (faux navigateur) ---------- */
function monde({ echecs = 0 } = {}) {
  const requetes = [];
  let aEchouer = echecs;
  const tete = { enfants: [], appendChild(s) {
    this.enfants.push(s); s.parentNode = this;
    requetes.push(s.src);
    queueMicrotask(() => { if (aEchouer > 0) { aEchouer -= 1; s.onerror(); } else s.onload(); });
  }, removeChild(s) { this.enfants = this.enfants.filter((e) => e !== s); s.parentNode = null; } };
  const document = {
    head: tete,
    getElementById: (id) => (id === "soreal-modules-differes-v1" ? { textContent: JSON.stringify({ admin: ["/modules/a.js?v=3", "/modules/b.js?v=7"], autre: ["/modules/a.js?v=3"] }) } : null),
    createElement: () => ({})
  };
  const fenetre = { document, Promise, Date, JSON, Array, Error, console };
  fenetre.window = fenetre;
  vm.runInNewContext(chargeurSrc, fenetre);
  return { C: fenetre.__SOREAL_IDLE_CHARGEUR_V1__, requetes, tete };
}

{
  const { C, requetes } = monde();
  assert.ok(C && typeof C.charger === "function" && C.table && Array.isArray(C.table.admin), "API : charger, table");
  assert.equal(C.etat("admin"), "absent");
  assert.equal(C.etat("inexistant"), "inconnu");
  const p1 = C.charger("admin"), p2 = C.charger("admin");
  assert.strictEqual(p1, p2, "appels simultanés : même promesse");
  assert.equal(C.etat("admin"), "en-cours");
  await p1;
  assert.deepEqual(requetes, ["/modules/a.js?v=3", "/modules/b.js?v=7"], "URL avec le pin de la table, ordre de la table");
  assert.equal(C.etat("admin"), "charge");
  await C.charger("admin");
  await C.charger("autre");   /* a.js déjà chargé : jamais redemandé par un autre groupe */
  assert.equal(requetes.length, 2, "une seule requête par fichier, tous groupes confondus");
  await assert.rejects(C.charger("inexistant"), /inconnu/);
}

{
  /* échec : rejeté, rien de faux mémorisé, élément retiré de la page, nouvel essai espacé puis accepté */
  const { C, requetes, tete } = monde({ echecs: 1 });
  await assert.rejects(C.charger("admin"), /impossible/);
  assert.equal(C.etat("admin"), "echec");
  await assert.rejects(C.charger("admin"), /trop proche/, "pas de nouvelle requête tout de suite");
  assert.equal(requetes.length, 2, "a.js (échec) et b.js (déjà parti) : aucune requête de plus");
  assert.ok(!tete.enfants.some((e) => e.src === "/modules/a.js?v=3"), "élément en échec retiré de la page");
  /* le délai passé, le fichier raté est redemandé et celui qui avait réussi ne l'est pas */
  const reel = Date.now; Date.now = () => reel() + C.DELAI_REESSAI_MS + 1;
  try { await C.charger("admin"); } finally { Date.now = reel; }
  assert.deepEqual(requetes, ["/modules/a.js?v=3", "/modules/b.js?v=7", "/modules/a.js?v=3"], "seul le fichier raté est redemandé");
  assert.equal(C.etat("admin"), "charge");
}

/* ---------- 5. Seul l'administrateur charge le groupe « admin » ---------- */
const uiAdmin = lire("public/modules/ui-admin-v1.js");
assert.ok(/function estAdminSorealIdle_\(\)\{\s*const admin=lireEstAdminSorealIdle_\(\);\s*if\(admin===true\)chargerModulesAdminV1_\(\);\s*return admin;/.test(uiAdmin), "le chargement ne part que pour un compte reconnu administrateur");
assert.ok(/C\.charger\('admin'\)/.test(uiAdmin) && /messageFlottantIdleV32_\('Outils d’administration indisponibles/.test(uiAdmin), "échec annoncé au joueur administrateur, jamais muet");
assert.ok(!/chargeur|charger\('admin'\)/.test(lire("public/modules/ui-navigation-v1.js")), "aucun autre point de chargement");

console.log("idle-chargeur-modules-v1 : ok");
