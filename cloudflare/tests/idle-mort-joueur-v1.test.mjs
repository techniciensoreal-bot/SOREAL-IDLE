import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-22) : à la défaite, l'image du joueur éclate en pixels (comme un boss qui meurt) puis réapparaît à sa place en fondu (3 s). */
const code = readFileSync(new URL("../public/modules/mort-joueur-v1.js", import.meta.url), "utf8");
const boucle = readFileSync(new URL("../public/modules/ui-boucle-v1.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

function ctxEnregistreur(log) {
  return new Proxy({}, { get(_t, k) { if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(180) }); return (...a) => { log.push([k, ...a]); }; }, set() { return true; } });
}
function monde({ reduit = false } = {}) {
  const enfants = [];
  const canvas = () => { const log = []; const c = { log, width: 0, height: 0, getContext: () => c.ctx || (c.ctx = ctxEnregistreur(log)), style: {} }; return c; };
  const hote = {
    img: { complete: true, naturalWidth: 512, naturalHeight: 512 },
    querySelector(s) { return s === "img" ? this.img : null; },
    getBoundingClientRect: () => ({ width: 238, height: 238 }),
    appendChild(e) { enfants.push(e); e.isConnected = true; }
  };
  const doc = { getElementById: () => null, head: { appendChild() {} }, documentElement: { appendChild() {} },
    createElement: (t) => t === "canvas" ? canvas() : { style: {}, attrs: {}, className: "", isConnected: false, setAttribute(k, v) { this.attrs[k] = v; }, appendChild() {}, removeChild() {} } };
  const fen = { document: doc, performance: { now: () => 0 }, requestAnimationFrame: () => 1, setTimeout: () => 0, matchMedia: () => ({ matches: reduit }), Math, console };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { M: fen.__SOREAL_IDLE_MORT_JOUEUR_V1__, hote, enfants, canvas };
}

// 1. Un calque opaque gardé par le redessin est posé sur le portrait ; rien en « réduire les animations » ni sans image.
{
  const m = monde();
  assert.equal(m.M.jouer(m.hote), true);
  assert.equal(m.enfants.length, 1);
  assert.ok("data-morph-garder" in m.enfants[0].attrs, "règle n°4");
  assert.match(m.enfants[0].className, /mort-joueur/);
  assert.equal(m.M.jouer(m.hote), false, "pas deux effets à la fois");
  assert.equal(monde({ reduit: true }).M.jouer(monde({ reduit: true }).hote), false);
  const v = monde(); v.hote.img = null;
  assert.equal(v.M.jouer(v.hote), false);
}

// 2. Le film : l'image éclate (les pixels bougent), puis plus aucun pixel : l'image revient en fondu de 3 s sous le calque.
{
  const m = monde();
  const pk = m.M.pixelsDe(m.hote.img, 238, 238);
  assert.ok(pk && pk.px.length > 500, "gros pixels de l'image");
  const rects = (t) => { const c = m.canvas(); const cx = c.getContext(); m.M.dessiner(cx, t, pk.px, 238, 238); return c.log.filter((l) => l[0] === "fillRect"); };
  const pos = (t) => rects(t).slice(1, 8).map((l) => l[1] + "," + l[2]).join(";");
  assert.notEqual(pos(0.01), pos(0.7), "les pixels ont bougé pendant l'explosion");
  assert.equal(rects(1.3).length, 1, "après l'explosion : seulement le fond, plus un pixel (l'image revient en fondu)");
  assert.ok(m.M.duree > 4 && m.M.duree < 5, "environ 1,25 s d'explosion + 3 s de fondu");
}

// 2 bis. Le fondu : le calque passe à opacité 0 en 3 s une fois l'explosion finie.
assert.ok(code.includes("T_FONDU=3") && code.includes("'opacity '+T_FONDU+'s ease-in-out'"), "fondu en ouverture de 3 secondes");

// 3. Câblage : à la défaite (après le son), sur le portrait du joueur ; module chargé.
assert.ok(boucle.includes("jouerEffetAudioIdleV199_('defeat');") && /MORT_JOUEUR_V1__[\s\S]{0,200}sorealIdlePlayerImageHostV43/.test(boucle), "l'effet se joue à la défaite sur le portrait du joueur");
assert.ok(index.includes('<script defer src="/modules/mort-joueur-v1.js?v='), "module chargé");
console.log("idle-mort-joueur-v1: OK");
