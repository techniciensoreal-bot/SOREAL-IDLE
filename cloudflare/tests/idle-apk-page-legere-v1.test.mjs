import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-01) : l'APK hors ligne est moins fluide que l'ancien. Côté page : dans l'APK le « serveur » est le service worker du téléphone ; chaque requête /api/ le réveille (démarrage de sql.js, lecture de tout le classeur, export de la base).
 * Garde : battement du chat espacé (60 s, jamais caché), plus de relecture de /index.html (nouvelle-version), envoi du moteur local à 30 s, essais de liaison espacés hors ligne, effets du menu / des cadres légers PAR DÉFAUT dans l'APK seulement
 * (un choix posé l'emporte, règle n°6). Ailleurs (web, exe) : rien ne change.
 */
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");

const chat = lire("modules/chat-v1.js");
assert.match(chat, /BATTEMENT_MS=EST_APK\?60000:20000/);
assert.match(chat, /if\(EST_APK&&document\.hidden\)return;battement\(\)/);
assert.match(lire("modules/nouvelle-version-v1.js"), /function verifier\(\)\{\s*if\(EST_APK\)return;/);
assert.match(lire("modules/moteur-local-v1.js"), /INTERVALLE_ENVOI_MS=EST_APK_ENVOI\?30000:10000/);
const synchro = lire("modules/apk-synchro-v1.js");
assert.match(synchro, /if\(res==='hors-ligne'\)prochainEssai=Date\.now\(\)\+30000/);
assert.match(synchro, /addEventListener\('online',function\(\)\{lancer\(true\)/);
assert.match(lire("modules/ui-reglages-v1.js"), /defautPour/);

/* Le vrai module effets-legers sur un faux navigateur. */
function lancer(apk, stock) {
  const classes = new Set();
  const win = { addEventListener() {}, localStorage: { getItem: (k) => (k in stock ? stock[k] : null) } };
  if (apk) win.AndroidSoreal = {};
  const doc = {
    hidden: false, getElementById: () => null, createElement: () => ({}), head: { appendChild() {} },
    documentElement: { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } }
  };
  const ctx = vm.createContext({ window: win, document: doc, localStorage: win.localStorage, setInterval() { return 1; } });
  vm.runInContext(lire("modules/effets-legers-v1.js"), ctx);
  return { classes, api: win.__SOREAL_IDLE_EFFETS_LEGERS_V1__ };
}
let r = lancer(false, {});
assert.deepEqual([...r.classes], [], "web : effets complets par défaut");
r = lancer(true, {});
assert.deepEqual([...r.classes].sort(), ["soreal-decor-calme", "soreal-nav-calme"], "APK : légers par défaut");
r = lancer(true, { soreal_idle_effet_nav_v1: "1", soreal_idle_effet_decor_v1: "1" });
assert.deepEqual([...r.classes], [], "APK : le choix du joueur (activé) l'emporte");
r = lancer(false, { soreal_idle_effet_nav_v1: "0" });
assert.deepEqual([...r.classes], ["soreal-nav-calme"], "web : le choix « décoché » reste respecté");
assert.equal(r.api.defautPour(), true);
console.log("idle-apk-page-legere-v1: OK");
