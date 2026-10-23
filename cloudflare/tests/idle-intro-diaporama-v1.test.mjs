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

// 2b. Taper sur l'image passe à la suivante (Norman, 2026-10-23) et relance le minuteur ; un appui hors de l'image ne fait rien.
{
  const m = monde();
  m.D.demarrer();
  const tap = (sur) => m.racine.listeners.click({ target: { closest: (s) => (sur && s === "#sorealIdleIntroCadreV1" ? m.cadre : null) } });
  tap(false);
  assert.equal(m.pts[0].className, "id-ici", "un appui hors de l'image ne change rien");
  tap(true);
  assert.equal(m.pts[1].className, "id-ici", "taper sur l'image passe à la suivante");
  tap(true); tap(true);
  assert.equal(m.pts[3].className, "id-ici", "chaque appui avance d'une image");
  assert.ok(m.timers.filter((t) => t.ms >= 3800).length >= 4, "le minuteur est replanifié après chaque appui");
}

// 2c. Son bloqué par le navigateur : la scène attend UN premier appui avant de défiler (la voix, débloquée par cet appui, repart avec les images).
assert.ok(code.includes("sonBloque()") && code.includes("attenteSon") && code.includes("Touche l’écran pour lancer la voix"), "invite « Touche l'écran » quand le son est bloqué");
assert.ok(code.includes("addEventListener('click',toucher)"), "appui sur la scène géré");

// 3. Câblage : branche du diaporama dans la fenêtre, module chargé, texte lu par la voix inchangé.
const tut = lire("modules/ui-tutoriel-v1.js");
assert.ok(tut.includes("page.long&&page.diaporama&&window.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__") && tut.includes("texteVoixTutorielIdleV1_(page,etat.pages[etat.index-1])"), "la voix lit toujours le texte de la page");
assert.ok(lire("index.html").includes('<script defer src="/modules/intro-diaporama-v1.js?v='), "module chargé");
console.log("idle-intro-diaporama-v1: OK");

// 4. Images au rythme de la voix (Norman, 2026-10-23 : « chaque image ne dure que le temps de la phrase écrite en dessous ») : le lecteur annonce chaque bloc (texte + durée) et l'image suit la part du bloc qui lui revient.
{
  const tts = lire("modules/tutorial-tts-v202.js");
  assert.ok(tts.includes("new CustomEvent('soreal-voix-bloc',{detail:{texte:String(chunkTexte||''),duree:buffer.duration||0}})") && tts.includes("playBlobWebAudioPromise_(blob,targetId,myGeneration,etape.chunk)"), "le lecteur annonce chaque bloc de voix");
  assert.ok(code.includes("/[^\\p{L}\\p{N}]/gu") && code.includes("addEventListener('soreal-voix-bloc',surBlocVoix)") && code.includes("kk>indice"), "l'introduction suit la voix, sans jamais reculer");
}
console.log("idle-intro-diaporama-v1 (voix): OK");

// 5. La chronique du premier boss s'enchaîne sur l'introduction (Norman, 2026-10-23) : image du boss, texte dessous, même fond noir ; le guide attend la fermeture.
{
  assert.ok(code.includes("function ouvrirChronique(r,d)") && code.includes("d&&d.id==='1'&&d.say&&d.affiche") && code.includes("if(chronique){terminer();return;}"), "chronique du boss 1 à la suite des images");
  assert.ok(code.includes("t.marquerChroniqueLue(d.id)") && code.includes("r.setAttribute('data-soreal-tts-say',d.say)"), "marquée lue, lue par la voix de la scène");
  assert.ok(lire("modules/tutorial-tts-v202.js").includes("marquerChroniqueLue:marquerChroniqueLue_"), "exposée par le lecteur");
  assert.ok(lire("modules/ui-combat-1-v1.js").includes("window.__SOREAL_IDLE_CHRONIQUE_BOSS_V1__=bossIdCine"), "la page de combat fournit les données");
  assert.ok(/function chroniqueOccupee_\(\)\{[\s\S]{0,300}sorealIdleTutorielPagesModalV1'\)\)return true;/.test(lire("modules/tutoriel-v1.js")), "le guide attend la fermeture de la cinématique");
}
console.log("idle-intro-diaporama-v1 (chronique): OK");
