import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/* Norman (2026-11-09) : « deux images n'apparaissent plus en Aventure (téléphone, Chrome) ; tu ne peux pas fixer ça pour l'entièreté du projet ? » : toute image du jeu qui échoue est redemandée trois fois, puis l'échec est noté avec la vraie réponse du serveur. */
const src = fs.readFileSync("cloudflare/public/modules/images-retentes-v1.js", "utf8");
const html = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.match(html, /modules\/images-retentes-v1\.js\?v=\d+/, "chargé par index.html");
const adv = fs.readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(!adv.includes("img.addEventListener('error'"), "plus de reprise propre à l'Aventure (une seule, globale)");
assert.ok(adv.includes("if(img&&img.__urlV1!==url){img.__urlV1=url;img.__essaisV1=0;img.setAttribute('src',url);}"), "l'Aventure ne relance le chargement que si l'adresse change");

/* le vrai module dans un faux navigateur */
const ecouteurs = {}, minuteries = [], stock = {}, notes = [];
const faux = {
  console, URL, JSON, String, Array, Date, Promise, Math,
  setTimeout: (f, d) => { minuteries.push([f, d]); return minuteries.length; },
  navigator: { userAgent: "test" },
  location: { href: "https://jeu.test/", origin: "https://jeu.test" },
  fetch: (u) => { notes.push(u); return Promise.resolve({ status: 404, headers: { get: (k) => (k === "content-type" ? "text/plain" : null) } }); },
  document: { addEventListener: (t, f, c) => { ecouteurs[t] = { f, c }; } },
  window: { localStorage: { getItem: (k) => stock[k] || null, setItem: (k, v) => { stock[k] = v; } } }
};
vm.runInNewContext(src, faux);
assert.ok(ecouteurs.error && ecouteurs.error.c === true, "écouteur d'erreur en phase de capture (error ne remonte pas)");
const img = (u) => { const a = { src: u }; return { tagName: "IMG", __a: a, getAttribute: () => a.src, setAttribute: (n, v) => { a.src = v; } }; };

const e = img("/api/idle/media/mob?zone=avsp&boss=0&seed=3&name=A%20Metal%20Slime");
const erreur = () => ecouteurs.error.f({ target: e });
erreur();
assert.deepEqual(minuteries.map((m) => m[1]), [1500], "première reprise après 1,5 s");
minuteries.shift()[0]();
assert.ok(/&r=1$/.test(e.__a.src), "adresse différente à la reprise (cache) : " + e.__a.src);
erreur(); minuteries.shift()[0]();
assert.ok(/&r=2$/.test(e.__a.src) && !/r=1/.test(e.__a.src), "deuxième reprise : r=2 remplace r=1");
erreur(); minuteries.shift()[0]();
assert.ok(/&r=3$/.test(e.__a.src), "troisième reprise");
erreur();
assert.equal(minuteries.length, 0, "jamais plus de trois reprises");
await new Promise((r) => setImmediate(r));
assert.equal(notes.length, 1, "après le troisième échec, l'adresse est demandée pour noter la vraie réponse");
assert.ok(!/r=\d/.test(notes[0]), "adresse propre (sans r=)");
const fiche = JSON.parse(stock.soreal_idle_diag_v1_images);
assert.equal(fiche.length, 1);
assert.equal(fiche[0].statut, 404);
assert.ok(fiche[0].u.includes("A%20Metal%20Slime"), "l'adresse en échec est notée");
// le jeu change l'image entre deux tentatives : rien à refaire
const e2 = img("/img/a.webp"); ecouteurs.error.f({ target: e2 }); e2.__a.src = "/img/b.webp"; minuteries.shift()[0]();
assert.equal(e2.__a.src, "/img/b.webp", "une image changée par le jeu n'est pas écrasée");
// adresses qui ne sont pas du jeu : jamais retentées
for (const u of ["data:image/png;base64,AAAA", "blob:https://jeu.test/x", "https://autre-site.test/i.png"]) { const x = img(u); ecouteurs.error.f({ target: x }); }
assert.equal(minuteries.length, 0, "data:, blob: et autre site ne sont jamais retentés");
// l'attribut des images SVG (<image href>)
const svg = { tagName: "image", a: { href: "/img/mineurs/labos/etabli.webp" }, getAttribute(n) { return n === "href" ? this.a.href : null; }, setAttribute(n, v) { if (n === "href") this.a.href = v; } };
ecouteurs.error.f({ target: svg }); minuteries.shift()[0]();
assert.ok(/etabli\.webp\?r=1$/.test(svg.a.href), "les images SVG sont retentées aussi");
// un chargement réussi remet le compteur à zéro
ecouteurs.load.f({ target: e });
assert.equal(e.__imgEssaisV1, 0);
// et ce fichier est exclu de la synchro des préférences du compte
const prefs = fs.readFileSync("cloudflare/public/modules/prefs-compte-v1.js", "utf8");
const m = /var EXCLUES=(\/.*\/);/.exec(prefs);
assert.ok(new RegExp(m[1].slice(1, -1)).test("soreal_idle_diag_v1_images"), "le journal des échecs est propre à l'appareil (exclu de la synchro)");
console.log("idle-images-retentes-v1: OK");

/* Le journal des échecs est joint au signalement de bug (Norman, 2026-11-09). */
{
  const bug = fs.readFileSync("cloudflare/public/modules/bug-report-v1.js", "utf8");
  assert.ok(bug.includes("function diagImages(){") && bug.includes("window.__SOREAL_IDLE_IMAGES_ECHECS_V1__"), "le signalement lit le journal des images en échec");
  assert.ok(bug.includes("(msg+diagImages()).slice(0,MAX)"), "le journal est joint au message envoyé (2000 caractères au plus)");
  const f = bug.slice(bug.indexOf("function diagImages(){"), bug.indexOf("function fermer()"));
  const ctx = { window: { __SOREAL_IDLE_IMAGES_ECHECS_V1__: [{ u: "https://x.test/api/idle/media/mob?zone=avsp&name=A", statut: 404, type: "text/plain", cle: "" }] }, Array, String };
  const out = vm.runInNewContext(f + "\ndiagImages()", ctx);
  assert.ok(out.includes("[images en échec]") && out.includes("mob?zone=avsp&name=A => 404 text/plain"), "texte joint lisible : " + out);
  assert.equal(vm.runInNewContext(f + "\ndiagImages()", { window: {}, Array, String }), "", "rien à joindre : message inchangé");
}
console.log("idle-images-retentes-v1 (journal joint au signalement): OK");
