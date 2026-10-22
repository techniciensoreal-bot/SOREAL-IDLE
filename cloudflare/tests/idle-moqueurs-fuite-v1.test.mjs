import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : à la Fuite, trois moqueurs jaillissent du bas de l'écran du duel (devant la photo du boss ET la photo du joueur), animés, nous pointent du doigt avec des « HAHA », puis repartent vers le bas.
 */
const code = readFileSync(new URL("../public/modules/moqueurs-fuite-v1.js", import.meta.url), "utf8");
function compteur() {
  const n = { fillRect: 0, clearRect: 0 };
  const ctx = new Proxy({}, { get: (c, k) => (k === "fillRect" ? () => { n.fillRect += 1; } : k === "clearRect" ? () => { n.clearRect += 1; } : (k === "fillStyle" ? "" : () => {})), set: () => true });
  return { n, ctx };
}
function monde({ reduit = false } = {}) {
  const arene = { enfants: [], getBoundingClientRect: () => ({ width: 588, height: 494 }), querySelector: (s) => (s === ".moq-fuite" ? arene.enfants.find((e) => /moq-fuite/.test(e.className)) || null : null), appendChild(e) { this.enfants.push(e); e.isConnected = true; } };
  const hote = { closest: (s) => (s === ".soreal-idle-duel-versus-row-v42" ? arene : null), getBoundingClientRect: () => ({ width: 308, height: 308 }), querySelector: () => null, appendChild() { throw new Error("pas sur l'image du boss seule"); } };
  const doc = {
    createElement: (tag) => ({ tag, className: "", style: {}, attrs: {}, children: [], isConnected: false, width: 0, height: 0, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); }, remove() { this.isConnected = false; }, getContext: () => compteur().ctx, parentNode: null }),
    getElementById: () => null, head: { appendChild(e) { doc.styles.push(e); } }, documentElement: { appendChild() {} }, styles: []
  };
  const raf = [];
  const fen = { document: doc, performance: { now: () => 0 }, requestAnimationFrame: (f) => { raf.push(f); return raf.length; }, console, matchMedia: () => ({ matches: reduit }) };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { M: fen.__SOREAL_IDLE_MOQUEURS_V1__, hote, arene, doc, raf };
}

// 1. Mise en scène : sur TOUT l'écran du duel (l'arène : photo du boss + photo du joueur), pas seulement l'image du boss ; gardé par le redessin ; forme de l'arène respectée.
{
  const m = monde();
  assert.equal(m.M.jouer(m.hote), true);
  assert.equal(m.arene.enfants.length, 1, "calque posé sur l'arène du duel");
  const calque = m.arene.enfants[0];
  assert.ok(/moq-fuite/.test(calque.className) && /soreal-idle-boss-transition-v61/.test(calque.className));
  assert.ok("data-morph-garder" in calque.attrs, "gardé par le redessin (règle n°4)");
  const cv = calque.children[0];
  assert.equal(cv.height, 160); assert.equal(cv.width, Math.round(160 * 588 / 494), "canvas à la forme de l'arène (pixels carrés)");
  assert.ok(m.doc.styles.some((s) => /z-index:30/.test(s.textContent)), "au-dessus des deux photos");
  assert.equal(m.M.jouer(m.hote), true);
  assert.equal(m.arene.enfants.filter((e) => e.isConnected).length >= 1, true);
  assert.equal(monde({ reduit: true }).M.jouer(monde({ reduit: true }).hote), false, "« réduire les animations » : rien");
  assert.equal(m.M.jouer(null), false);
}

// 2. Déroulé : rien avant l'entrée du premier, trois personnages en pleine scène, plus rien après la sortie du dernier ; ils quittent l'écran par le bas.
{
  const m = monde();
  const M = m.M;
  const dessin = (t) => { const k = compteur(); M.scene(k.ctx, t, 191, 160); return k.n.fillRect; };
  const fond = dessin(-1);                       // avant le début : seulement le voile
  assert.equal(fond, 1);
  const milieu = dessin(2.4);
  assert.ok(milieu > 150, "trois personnages dessinés, avec leurs bulles (" + milieu + " rectangles)");
  assert.ok(dessin(1.0) > fond, "ils sont entrés");
  const finDernier = M.fin + 0.36 + M.sortie;
  assert.equal(dessin(finDernier + 0.01), fond, "tous repartis : plus que le voile");
  assert.ok(dessin(M.fin + 0.05) > fond, "le premier n'est pas encore parti avant FIN");
  assert.ok(M.duree >= finDernier, "la durée couvre toute la sortie");
  assert.ok(M.sortie < 0.5, "départ vif");
}

// 3. Câblage : sur le bouton Fuite, seulement s'il y a un combat à fuir, EN PLUS des sons du jeu (wah-wah + rires) ; module chargé.
const amorce = readFileSync(new URL("../public/modules/ui-amorcage-v1.js", import.meta.url), "utf8");
const i = amorce.indexOf("window.__fuirBossIdleV1__=function(){");
const bloc = amorce.slice(i, i + 900);
assert.ok(bloc.indexOf("jouerEffetAudioIdleV199_('flee')") > 0 && bloc.indexOf("jouerEffetAudioIdleV199_('laugh')") > 0, "les sons du jeu sont conservés");
assert.ok(bloc.indexOf("moq.jouer(document.getElementById('sorealIdleBossImageHostV36'))") > bloc.indexOf("if(enCombat){"), "dans la branche « combat en cours »");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/moqueurs-fuite-v1.js?v='), "module chargé");
console.log("idle-moqueurs-fuite-v1: OK");
