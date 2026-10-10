import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : « dans chacun des menus où on peut placer une ressource, un bouton + − MAX à chaque ligne ; en haut, toujours un cadre Plafond d'énergie MAX 1/2 1/4 et un 2e cadre IDLE 1/2 1/4
 * TOUT RETIRER ». Un module commun (modules/barre-allocation-v1.js) fournit les deux cadres aux menus qui n'en avaient pas ; les autres gardent les leurs, avec les mêmes intitulés.
 */
const lire = (p) => readFileSync(p, "utf8");
const mod = lire("cloudflare/public/modules/barre-allocation-v1.js");
const meta = lire("cloudflare/public/modules/meta-progression-v130.js");
const ui = lire("cloudflare/public/soreal-idle-ui.js");
const ngu = lire("cloudflare/public/modules/ngu-labo-v1.js");
const sang = lire("cloudflare/public/modules/blood-magic-v1.js");
const wd = lire("cloudflare/public/modules/wandoos-retro-v1.js");
const html = lire("cloudflare/public/index.html");

assert.match(html, /modules\/barre-allocation-v1\.js\?v=\d+/, "module chargé");
assert.ok(html.indexOf("barre-allocation-v1.js") < html.indexOf("meta-progression-v130.js"), "chargé avant les menus");

// 1. Même gabarit : Plafond MAX 1/2 1/4 puis IDLE 1/2 1/4 Tout retirer, pour chaque ressource.
assert.ok(mod.includes("⚡ Plafond d’énergie") && mod.includes("🔮 Plafond de magie") && mod.includes("🧪 Plafond de 3e ressource"));
const m = new Function("window", "document", mod + "\nreturn window.__SOREAL_IDLE_ALLOC_V1__;")({}, {});
const c = m.cadres("energy", "timeMachine");
assert.match(c, /Plafond d’énergie<\/span><button[^>]*>Max<\/button><button[^>]*>1\/2<\/button><button[^>]*>1\/4<\/button>/, "premier cadre : Plafond MAX 1/2 1/4");
assert.match(c, /💤 Idle<\/span><button[^>]*>1\/2<\/button><button[^>]*>1\/4<\/button><button[^>]*class="clear"[^>]*>Tout retirer<\/button>/, "deuxième cadre : IDLE 1/2 1/4 Tout retirer");
// 2. Les menus qui avaient déjà leurs cadres utilisent les mêmes intitulés.
assert.ok(ui.includes("<span>⚡ Plafond d’énergie</span>"), "Basic Training");
assert.equal(meta.split("<span>⚡ Plafond d’énergie</span>").length - 1, 2, "Augmentations et Advanced Training");
assert.ok(sang.includes("<span>🔮 Plafond de magie</span>"), "Blood Magic");
assert.ok(ngu.includes("'🔮 Plafond de magie':'⚡ Plafond d’énergie'"), "NGU");
assert.ok(!/<span>⚡ Energy Cap<\/span>|<span>Magic Cap<\/span>|✨ Magic Cap|⚡ Energy Cap'/.test(ui + sang + ngu + meta), "plus d'ancien intitulé de cadre");
// NGU : deux cadres distincts
assert.match(ngu, /Plafond de magie':'⚡ Plafond d’énergie'\)\+'<\/span>'\+[\s\S]*?<\/div>'\+\s*'<div class="nl-ligne">'\+\s*'<span>💤 Idle<\/span>/, "NGU : deux cadres");
// 3. Time Machine, Wandoos, Wishes et systèmes génériques (Barbes, Hacks…) reçoivent les cadres.
assert.ok(meta.includes("cadres('energy','timeMachine')") && meta.includes("cadres('magic','timeMachine')"), "Time Machine");
assert.ok(meta.includes("cadres(r,s.id)"), "systèmes génériques (Barbes, Hacks)");
assert.ok(meta.includes("cadres(r,'wishes')"), "Wishes");
assert.ok(!wd.includes("AL.cadres(") && wd.includes("saisir:majSaisie_"), "Wandoos : plus de barre d'outils d'allocation (Norman, 2026-10-10), saisie au clavier rétro conservée");
// 4. + − MAX sur chaque ligne : systèmes génériques, Wishes, tuyaux NGU.
for (const mode of ["moins", "plus", "max"]) {
  assert.ok(meta.includes("ALLOC_V1__.ajuster(\\'\'+sid+\'\\',\\'\'+rid+\'\\',") && meta.includes("ajusterVoeu(\'+argsVoeu+\'\\'" + mode + "\\'\'"), "ligne " + mode);
  assert.ok(ngu.includes("ajuster(\\'\'+idH+\'\\',\\'" + mode + "\\')"), "tuyau NGU " + mode);
}
assert.ok(!meta.includes("−10 %</button>"), "plus de boutons ±10 % bornés à 100");

// 5. Logique : valeurs absolues, bornées par le serveur.
const envois = [];
const etat = { energie: 400, energieMax: 1000, systemes: { resources: { magic: { cap: 800, current: 200 } }, systems: [{ id: "beards", state: { allocation: { energy: 50 } } }], wishSlots: { slots: [{ index: 0 }, { index: 1 }] } } };
const champ = { value: "30" };
const w2 = { __actionMetaIdleV130__: (p) => envois.push(p), __lireMontantAugmentIdleV1__: () => 125, __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => etat } };
const doc = { getElementById: (id) => (id === "sorealIdleGenInputV1" ? champ : null), querySelector: () => null };
const m2 = new Function("window", "document", mod + "\nreturn window.__SOREAL_IDLE_ALLOC_V1__;")(w2, doc);
m2.ajuster("beards", "energy", "plus");  assert.deepEqual(envois.pop(), { action: "allocate", system: "beards", resource: "energy", value: 80 });
m2.ajuster("beards", "energy", "moins"); assert.deepEqual(envois.pop(), { action: "allocate", system: "beards", resource: "energy", value: 20 });
m2.ajuster("beards", "energy", "max");   assert.deepEqual(envois.pop(), { action: "allocate", system: "beards", resource: "energy", value: 450 });
m2.vider("energy", "beards");            assert.deepEqual(envois.pop(), { action: "allocate", system: "beards", resource: "energy", value: 0 });
m2.vider("magic", "wishes"); assert.equal(envois.length, 2, "Tout retirer rend chaque emplacement de Wishes");
envois.length = 0;
m2.ajusterVoeu(1, "energy", "max", 10, 90);  assert.deepEqual(envois.pop(), { action: "allocateWishSlot", slot: 1, resource: "energy", value: 90 });
m2.ajusterVoeu(1, "energy", "plus", 10, 90); assert.deepEqual(envois.pop(), { action: "allocateWishSlot", slot: 1, resource: "energy", value: 135 > 90 ? 90 : 135 });
// Cadres « total placé » (Norman, 2026-10-09) : un cadre par ressource que le menu accepte, aux couleurs du cadre de la page.
const jt = { basicTraining: { energy: { allocated: 777 } }, energieMax: 1000, energie: 0, systemes: { systems: [{ id: "ngu", state: { allocation: { energy: 40, magic: 5 } } }], wishSlots: { slots: [{ allocation: { energy: 3, magic: 2 } }, { allocation: { energy: 4 } }] }, resources: { magic: { cap: 100, current: 0 } } } };
assert.equal(m.total(jt, "energy", "basicTraining"), 777);
assert.equal(m.total(jt, "magic", "basicTraining"), 0);
assert.equal(m.total(jt, "energy", "ngu"), 40);
assert.equal(m.total(jt, "magic", "ngu"), 5);
assert.equal(m.total(jt, "energy", "wishes"), 7);
assert.equal(m.total(jt, "r3", "ngu"), 0);
assert.ok(c.includes("soreal-idle-bt-total-v1") && c.includes("Énergie placée"), "cadres() ajoute le total placé");
assert.ok(mod.includes("compteur('energy','basicTraining')") === false && ui.includes("compteur('energy','basicTraining')"), "Basic Training");
assert.ok(meta.includes("compteur('energy','augmentations')") && meta.includes("compteur('energy','advancedTraining')"), "Augmentations et Advanced Training");
assert.ok(sang.includes("compteur('magic','bloodMagic')") && ngu.includes("compteur('energy','ngu')") && ngu.includes("compteur('magic','ngu')"), "Blood Magic et NGU");
console.log("idle-barre-allocation-commune-v1: OK");
