import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-22) : « Le commencement » en 16 images qui défilent avec leur phrase en blanc dessous ; la dernière reste, c'est le joueur qui clique sur l'image pour continuer. */
const lire = (p) => readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const code = lire("modules/intro-diaporama-v1.js");

function monde() {
  const timers = []; let nav = 0;
  const el = (id) => ({ id, className: "", children: {}, listeners: {}, attrs: {}, classList: { toggled: {}, toggle(c, v) { this.toggled[c] = v; }, add() {}, remove() {}, contains() { return false; } }, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] || null; }, addEventListener(t, f) { this.listeners[t] = f; }, focus() {}, querySelector() { return null; }, querySelectorAll() { return []; }, innerHTML: "", isConnected: true });
  const racine = el("sorealIdleIntroDiapoV1"); const cadre = el("c"); const texte = el("t"); const imgs = [el("i0"), el("i1")];
  imgs.forEach((i) => { i.classList = { add() {}, remove() {} }; });
  const pts = Array.from({ length: 16 }, () => ({ className: "" }));
  racine.querySelector = (s) => (s === "#sorealIdleIntroCadreV1" ? cadre : s === "#sorealIdleIntroTexteV1" ? texte : null);
  racine.querySelectorAll = (s) => (s === "#sorealIdleIntroCadreV1 img" ? imgs : s === ".id-points i" ? pts : []);
  cadre.querySelectorAll = () => imgs; cadre.querySelector = () => null;
  const doc = { getElementById: (id) => (id === "sorealIdleIntroDiapoV1" ? racine : null), head: { appendChild() {} }, documentElement: { appendChild() {} }, createElement: () => ({ style: {} }) };
  const fen = { document: doc, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout: () => {}, Image: function () {}, matchMedia: () => ({ matches: false }), __tutorielPagesNaviguerV1__: (n) => { nav += n; } };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { D: fen.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__, timers, racine, cadre, texte, pts, nav: () => nav };
}

// 1. Seize images, présentes, réduites ; une phrase chacune ; le texte complet de la page est le texte d'origine découpé dans l'ordre.
{
  const { D } = monde();
  assert.equal(D.diapos.length, 16);
  for (const d of D.diapos) {
    const f = new URL("../public/intro/" + d.n + ".webp", import.meta.url);
    assert.ok(existsSync(f), "image " + d.n);
    assert.ok(statSync(f).size < 400000, "image " + d.n + " réduite (WebP)");
  }
  const ui = lire("soreal-idle-ui.js");
  const debut = ui.indexOf("const TUTORIEL_DEBUT_JEU_PAGES_V1=[");
  const bloc = ui.slice(debut, debut + 3600);
  const paragraphes = [...bloc.slice(bloc.indexOf("paragraphes:["), bloc.indexOf("]\n        },")).matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
  const norm = (s) => s.replace(/\*/g, "").replace(/[….]+/g, "").replace(/\s+/g, " ").replace(/\s*,\s*/g, ",").replace(/ ?([:«»]) ?/g, "$1").trim().toLowerCase();
  const original = norm(paragraphes.join(" ").replace(/\\'/g, "'"));
  const decoupe = norm(D.diapos.map((d) => d.t).join(" "));
  assert.equal(decoupe, original, "les 16 phrases reprennent exactement le texte de la page, dans l'ordre");
  assert.ok(/titre:'LE COMMENCEMENT',[\s\S]{0,120}diaporama:true/.test(bloc), "la page « Le commencement » est un diaporama");
}

// 2. Défilement : chaque image dure selon sa phrase ; à la dernière on s'arrête ; le clic sur l'image continue.
{
  const m = monde();
  assert.ok(m.D.duree(0) >= 3800 && m.D.duree(6) > m.D.duree(11), "durée selon la longueur de la phrase");
  m.D.demarrer();
  const longs = () => m.timers.filter((t) => t.ms >= 3800);
  assert.equal(longs().length, 1, "un seul minuteur de défilement lancé");
  for (let i = 0; i < 15; i++) { const t = longs().pop(); m.timers.splice(m.timers.indexOf(t), 1); t.f(); }
  assert.equal(longs().length, 0, "à la dernière image : plus aucun défilement");
  assert.equal(m.pts[15].className, "id-ici", "dernière image affichée");
  assert.equal(m.cadre.attrs.role, "button", "la dernière image est un bouton");
  assert.equal(m.nav(), 0);
  m.cadre.listeners.click({ preventDefault() {}, stopPropagation() {}, type: "click" });
  assert.equal(m.nav(), 1, "le clic sur l'image continue");
}

// 3. Câblage : branche du diaporama dans la fenêtre, module chargé, texte lu par la voix inchangé.
const tut = lire("modules/ui-tutoriel-v1.js");
assert.ok(tut.includes("page.long&&page.diaporama&&window.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__") && tut.includes("texteVoixTutorielIdleV1_(page,etat.pages[etat.index-1])"), "la voix lit toujours le texte de la page");
assert.ok(lire("index.html").includes('<script defer src="/modules/intro-diaporama-v1.js?v='), "module chargé");
console.log("idle-intro-diaporama-v1: OK");
