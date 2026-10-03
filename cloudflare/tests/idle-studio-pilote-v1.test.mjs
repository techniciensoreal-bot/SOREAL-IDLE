import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-03) : « dans l'interface de modification des voix, un bouton pour lancer Lancer.bat et un autre pour l'arrêter (ne fonctionne que sur mon PC) ».
 * Une page web ne démarre pas un programme : les boutons parlent au PILOTE local (tools/voice-studio/pilote.py).
 */
const module_ = readFileSync("cloudflare/public/modules/studio-pilote-v1.js", "utf8");
const histoires = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const textes = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
const pilote = readFileSync("cloudflare/tools/voice-studio/pilote.py", "utf8");

// 1. Les deux éditeurs de voix ont les deux boutons, câblés sur le module partagé, chargé avant eux.
for (const [nom, src, attr] of [["histoires", histoires, "data-adm-g"], ["textes", textes, "data-stx-act"]]) {
  assert.ok(src.includes(attr + '="studio-lancer"') && src.includes(attr + '="studio-arreter"'), nom + " : boutons Lancer / Arrêter le studio");
  assert.ok(src.includes("__SOREAL_IDLE_STUDIO_PILOTE_V1__"), nom + " : passent par le pilote");
}
assert.ok(index.indexOf("/modules/studio-pilote-v1.js") > 0 && index.indexOf("/modules/studio-pilote-v1.js") < index.indexOf("/modules/admin-histoires-v1.js") && index.indexOf("/modules/studio-pilote-v1.js") < index.indexOf("/modules/textes-admin-v1.js"));

// 2. Le pilote local : mêmes garde-fous que le studio (127.0.0.1, origine du jeu, Private Network), deux actions seulement, aucun texte de la page exécuté.
assert.ok(pilote.includes('ThreadingHTTPServer(("127.0.0.1", PORT)') && pilote.includes('if chemin not in ("/demarrer", "/arreter")'));
assert.ok(pilote.includes('Access-Control-Allow-Private-Network') && pilote.includes("origine refusée"));
assert.ok(pilote.includes("https://soreal-idle.technicien-soreal.workers.dev"));
assert.ok(!/self\.rfile|json\.loads/.test(pilote), "le pilote ne lit jamais le corps d'une requête : rien de la page n'est exécuté");
for (const f of ["pilote.bat", "installer_pilote.bat", "desinstaller_pilote.bat"]) assert.ok(existsSync("cloudflare/tools/voice-studio/" + f), f);
assert.ok(readFileSync("cloudflare/tools/voice-studio/installer_pilote.bat", "utf8").includes("Startup"), "démarrage avec Windows");

// 3. Comportement du module : lancer -> demarrer puis attente du studio ; pilote éteint -> message clair ; arrêter -> arreter puis revérification.
function monde(reponses) {
  const appels = [];
  const fenetre = {};
  const f = (url, opt) => {
    const methode = (opt && opt.method) || "GET";
    appels.push(methode + " " + url);
    const r = reponses(methode, url);
    if (r instanceof Error) return Promise.reject(r);
    return Promise.resolve({ json: () => Promise.resolve(r) });
  };
  vm.runInNewContext(module_, { window: fenetre, fetch: f, setTimeout: (g) => { g(); return 0; } });
  return { api: fenetre.__SOREAL_IDLE_STUDIO_PILOTE_V1__, appels };
}
{
  let studioPret = 0;
  const m = monde((methode, url) => {
    if (url.endsWith("/demarrer")) return { ok: true, demarre: true };
    if (url.endsWith("/ping")) { studioPret += 1; return studioPret >= 3 ? { ok: true } : new Error("pas prêt"); }
    return { ok: true };
  });
  const textes_ = [];
  let verifie = 0;
  await m.api.lancer((t, e) => textes_.push([t, e]), () => { verifie += 1; });
  assert.ok(m.appels.includes("POST http://127.0.0.1:8766/demarrer"));
  assert.equal(studioPret, 3, "attend que le studio réponde (le modèle se charge)");
  assert.ok(textes_.some(([t, e]) => /Studio démarré/.test(t) && !e));
  assert.equal(verifie, 1);
}
{
  const m = monde(() => new Error("Failed to fetch"));
  const textes_ = [];
  await m.api.lancer((t, e) => textes_.push([t, e]));
  assert.ok(textes_.some(([t, e]) => e && /pilote\.bat/.test(t) && /installer_pilote\.bat/.test(t)), "pilote éteint : on dit quoi faire");
  const t2 = [];
  await m.api.arreter((t, e) => t2.push([t, e]));
  assert.ok(t2.some(([t, e]) => e && /pilote/.test(t)));
}
{
  const m = monde((methode, url) => (url.endsWith("/arreter") ? { ok: true, arrete: true } : { ok: true }));
  const t = [];
  let verifie = 0;
  await m.api.arreter((x, e) => t.push([x, e]), () => { verifie += 1; });
  assert.ok(m.appels.includes("POST http://127.0.0.1:8766/arreter"));
  assert.ok(t.some(([x]) => /Studio arrêté/.test(x)));
  assert.equal(verifie, 1);
}
console.log("idle-studio-pilote-v1 OK");
