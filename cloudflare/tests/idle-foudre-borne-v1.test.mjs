import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-22) : la foudre parasite aussi l'écran de la borne d'arcade (comme Wandoos). */
const code = readFileSync(new URL("../public/modules/foudre-borne-v1.js", import.meta.url), "utf8");
const orage = readFileSync(new URL("../public/modules/orage-v1.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

function monde({ reduit = false, ecran = true } = {}) {
  const anims = []; const ecouteurs = {}; const enfants = [];
  const el = { isConnected: true, animate: (k, o) => { anims.push({ k, o }); }, getBoundingClientRect: () => ({ width: 500, height: 400, top: 100, bottom: 500 }), appendChild(e) { enfants.push(e); e.parentNode = el; }, removeChild(e) { enfants.splice(enfants.indexOf(e), 1); } };
  const doc = { querySelector: (s) => (ecran && s === ".soreal-idle-duel-v41" ? el : null), getElementById: () => null, head: { appendChild() {} }, documentElement: { appendChild() {} },
    createElement: () => ({ style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, animate(k, o) { anims.push({ k, o, nuage: true }); } }) };
  const fen = { document: doc, innerHeight: 800, matchMedia: () => ({ matches: reduit }), setTimeout: () => 0, addEventListener: (n, f) => { ecouteurs[n] = f; } };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { F: fen.__SOREAL_IDLE_FOUDRE_BORNE_V1__, anims, ecouteurs, enfants, el };
}

// 1. Un éclair frappe l'écran de la borne : l'écran et le calque de barres s'animent ; le calque est gardé par le redessin.
{
  const m = monde();
  assert.ok(m.ecouteurs["soreal-eclair-v1"], "écoute l'éclair de l'orage");
  m.ecouteurs["soreal-eclair-v1"]();
  assert.equal(m.anims.length, 2, "l'écran et les barres s'animent");
  assert.ok(m.anims[0].k.length >= 6 && m.anims[0].o.duration > 400 && m.anims[0].o.duration < 900, "interférence brève");
  assert.equal(m.enfants.length, 1);
  assert.ok("data-morph-garder" in m.enfants[0].attrs, "règle n°4");
}
// 2. Rien sans écran de borne affiché, ni avec « réduire les animations ».
{
  const a = monde({ ecran: false }); a.ecouteurs["soreal-eclair-v1"]();
  assert.equal(a.anims.length, 0);
  const b = monde({ reduit: true }); b.ecouteurs["soreal-eclair-v1"]();
  assert.equal(b.anims.length, 0);
}
// 3. L'orage envoie l'événement ; module chargé.
assert.ok(orage.includes("new CustomEvent('soreal-eclair-v1')"), "l'orage annonce chaque éclair");
assert.ok(index.includes('<script defer src="/modules/foudre-borne-v1.js?v='), "module chargé");
console.log("idle-foudre-borne-v1: OK");
