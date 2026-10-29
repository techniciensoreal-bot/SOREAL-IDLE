import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-23) : à la mort dans Fight Boss, plusieurs animations : le fondu d'ouverture, et les pixels qui se reconstituent avec un rembobinage VHS et le son de défaite à l'envers. */
const lire = (p) => readFileSync(new URL("../public/modules/" + p, import.meta.url), "utf8");
const code = lire("mort-joueur-v1.js");
const audio = lire("audio-effects-v199.js");

function charger() {
  const fen = { document: { getElementById: () => null, head: { appendChild() {} }, documentElement: { appendChild() {} }, createElement: () => ({ style: {}, getContext: () => null }) }, performance: { now: () => 0 }, requestAnimationFrame: () => 1, setTimeout: () => 0, matchMedia: () => ({ matches: false }), Math, console };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return fen.__SOREAL_IDLE_MORT_JOUEUR_V1__;
}
function ctx() {
  const log = [];
  const c = new Proxy({}, {
    get(_t, k) {
      if (k === "log") return log;
      if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(120) });
      if (k === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      return (...a) => { log.push([k, ...a]); };
    },
    set() { return true; }
  });
  return c;
}
const M = charger();
const px = Array.from({ length: 60 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10), c: "rgb(200,100,50)" }));

assert.deepEqual(Array.from(M.variantes), ["fondu", "rewind", "clignote"], "trois animations");
// Explosion normale d'abord : aucun effet VHS.
{ const c = ctx(); M.dessinerRewind(c, 0.5, px, 220, 220); assert.ok(!c.log.some((l) => l[0] === "putImageData"), "pas de VHS pendant l'explosion"); }
// Coup de neige, puis les pixels reviennent sous l'effet VHS (image réécrite ligne par ligne).
{ const c = ctx(); M.dessinerRewind(c, 1.05, px, 220, 220); assert.ok(c.log.some((l) => l[0] === "fillRect"), "coup de neige"); }
{ const c = ctx(); M.dessinerRewind(c, 1.66, px, 220, 220); assert.ok(c.log.some((l) => l[0] === "putImageData") && c.log.some((l) => l[0] === "fillText" && l[1] === "◀◀ RW"), "rembobinage : décalage de lignes et indication ◀◀ RW"); }
// Les pixels reviennent À LEUR PLACE : à la fin du rembobinage chaque gros pixel est à sa position d'origine (explosion à l'envers).
{
  const c = ctx(); M.dessinerRewind(c, 1.0 + 0.16 + 1.2, px, 220, 220);
  const e = 220 / 40;
  const rects = c.log.filter((l) => l[0] === "fillRect" && l[3] === Math.ceil(e) && l[4] === Math.ceil(e));
  const attendus = new Set(px.map((p) => Math.round(p.x * e) + "," + Math.round(p.y * e)));
  assert.ok(rects.length >= px.length && px.every((p) => rects.some((r) => r[1] === Math.round(p.x * e) && r[2] === Math.round(p.y * e))), "chaque pixel est revenu à sa place");
  assert.ok(attendus.size === px.length);
}
// Fin : l'effet s'apaise (plus de VHS pendant la tenue finale tardive), puis l'image du joueur revient.
{ const c = ctx(); M.dessinerRewind(c, 1.0 + 0.16 + 1.2 + 0.4 + 0.05, px, 220, 220); assert.ok(!c.log.some((l) => l[0] === "putImageData"), "plus d'effet à la fin"); }
assert.ok(M.dureeRewind > 3 && M.dureeRewind < 4, "durée du rembobinage");

// Câblage : variante tirée au hasard (jamais la même deux fois de suite le plus souvent), son à l'envers déclenché une fois, fondu final.
assert.ok(code.includes("var CHOIX=['fondu','rewind','clignote']") && code.includes("variante=suivante_(CHOIX)") && !code.includes("Math.random()*CHOIX.length"), "mort suivante de la file, plus de tirage au hasard (Norman, 2026-10-29)");
assert.ok(code.includes("a.defeatReverse()") && code.includes("t>=T_A+T_BRUIT*.5&&!son"), "le son de défaite, à l'envers, au moment du rembobinage");
assert.ok(code.includes("calque.style.transition='opacity '+T_FONDU2+'s ease-out'"), "l'image reconstituée laisse place à l'image du joueur");
// Le son : rendu hors ligne, retourné, joué tout de suite.
assert.ok(audio.includes("function defaiteInverse_()") && audio.includes("new OfflineAudioContext(1,") && audio.includes("buf.getChannelData(0).reverse()") && audio.includes("defeatReverse:function(){return defaiteInverse_();}"), "son de défaite à l'envers");
assert.ok(audio.includes("var ancien=master;master=null;") && audio.includes("master=ancien"), "construit hors ligne sans toucher au master du jeu");
// Troisième réapparition : l'image clignote trois fois, avec trois bips identiques calés sur chaque apparition (Norman, 2026-10-23).
assert.ok(code.includes("N_CLIGNOTEMENTS=3") && code.includes("variante==='clignote'") && code.includes("var allume=k>=N_CLIGNOTEMENTS-1?true:(p-k*T_CLIGNOTE)<T_ALLUME;"), "apparue, disparue, apparue, disparue, apparue : trois apparitions");
assert.ok(code.includes("a.reapparitionBip()") && code.includes("if(allume&&bips<N_CLIGNOTEMENTS&&bips<=Math.min(k,N_CLIGNOTEMENTS-1))"), "un bip identique à chaque apparition, une seule fois chacune");
assert.ok(audio.includes("function reapparitionBip_()") && audio.includes("reapparitionBip:function(){return reapparitionBip_();}"), "bip de réapparition");
assert.ok(M.dureeClignote > 1.9 && M.dureeClignote < 3, "durée du clignotement");
console.log("idle-mort-joueur-rewind-v1: OK");
