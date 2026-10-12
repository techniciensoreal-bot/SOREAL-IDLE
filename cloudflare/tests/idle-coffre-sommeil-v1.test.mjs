import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-12) : le Coffre s'endort au hasard (Z de la sangsue), ronfle ; touché pendant son sommeil il bondit en lâchant un pet très fort et lance une réplique. */
const mod = readFileSync("cloudflare/public/modules/coffre-sommeil-v1.js", "utf8");
const dig = readFileSync("cloudflare/public/modules/coffre-digestion-v1.js", "utf8");
const son = readFileSync("cloudflare/public/modules/audio-coffre-v1.js", "utf8");
const effets = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");

assert.ok(html.includes("/modules/coffre-sommeil-v1.js"), "module chargé");
for (const phrase of ["J’ai jamais couché avec votre femme !", "À l’abordage !", "Ne me touchez pas !"]) assert.ok(mod.includes(phrase), "réplique : " + phrase);
assert.ok((mod.match(/^    '.+',?$/gm) || []).length >= 8, "plusieurs répliques possibles");
assert.ok(mod.includes("data-sans-traduction"), "répliques toujours en français");
assert.ok(son.includes("jouerReveil") && son.includes("jouerRonflement") && effets.includes("coffreReveil") && effets.includes("coffreRonfle"), "sons branchés sur le moteur audio");
assert.ok(dig.includes("window.__coffreDortIdleV1__"), "pas de rot ni de pet pendant son sommeil");
assert.ok(css.includes("@keyframes bgZzz{0%{opacity:0;") && /@keyframes bgZzz\{[^]*?100%\{opacity:0;/.test(css), "Z : fondu d'entrée et de sortie, un seul sens");
assert.ok(css.includes("@keyframes bgSursaut") && css.includes(".bg-bagage-v1.bg-dort-v1") && css.includes(".bg-zzz-v1"), "styles du sommeil et du sursaut");
assert.equal(css.split("@keyframes bgRespire").length - 1, 1, "bgRespire (corps du Coffre) n'est défini qu'une fois");
assert.ok(css.includes("@keyframes bgRonfle{0%,100%{transform:none}"), "respiration : boucle sans à-coup, sans écraser bgRespire du corps");

{
  const classes = new Set(), enfants = [];
  let visible = true, cache = false, joues = [], tic = null, clic = null, propage = true;
  const el = {
    classList: { add: (c) => classes.add(c), remove: (...cs) => cs.forEach((c) => classes.delete(c)), contains: (c) => classes.has(c) },
    getBoundingClientRect() { return { top: 100, bottom: 300, left: 0, right: 200, width: 200, height: 200 }; },
    appendChild: (n) => enfants.push(n),
    querySelector: (s) => enfants.find((n) => n.className && s.includes(n.className.split(" ")[0])) || null,
    closest: () => el
  };
  const fabrique = () => ({ setAttribute() {}, style: {}, classList: { add() {} }, className: "", parentNode: null });
  const document = {
    querySelector: () => el, createElement: fabrique, hidden: false,
    addEventListener: (t, f) => { if (t === "click") clic = f; },
    documentElement: { clientHeight: 800, clientWidth: 1200 }
  };
  Object.defineProperty(document, "hidden", { get: () => cache });
  const window = {
    innerHeight: 800, innerWidth: 1200,
    __SOREAL_IDLE_AUDIO_V199__: { play: (id) => joues.push(id) },
    __SOREAL_IDLE_COFFRE_DIGESTION_V1__: { visible: () => (visible ? el : null) }
  };
  const ctx = { window, document, setInterval: (f) => { tic = f; return 1; }, setTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => 0 }), console };
  vm.runInNewContext(mod, ctx);
  const api = window.__SOREAL_IDLE_COFFRE_SOMMEIL_V1__;
  // hors de vue ou onglet caché : il ne s'endort jamais
  visible = false;
  for (let i = 0; i < 600; i += 1) tic();
  assert.equal(api.dort(), false, "hors de l'écran : il ne s'endort pas");
  visible = true; cache = true;
  for (let i = 0; i < 600; i += 1) tic();
  assert.equal(api.dort(), false, "onglet caché : il ne s'endort pas");
  cache = false;
  // 70 s minimum de présence à l'écran (random = 0)
  for (let i = 0; i < 279; i += 1) tic();
  assert.equal(api.dort(), false, "pas avant son délai");
  tic();
  assert.equal(api.dort(), true, "après son délai à l'écran, il s'endort");
  assert.equal(window.__coffreDortIdleV1__, true, "drapeau lu par la digestion");
  assert.ok(classes.has("bg-dort-v1") && enfants.some((n) => n.className === "bg-zzz-v1"), "classe de sommeil et Z");
  // il ronfle de temps en temps
  for (let i = 0; i < 40; i += 1) tic();
  assert.ok(joues.includes("coffreRonfle"), "ronflement");
  // le jeu redessine le Coffre : la classe est remise
  classes.clear(); enfants.length = 0;
  tic();
  assert.ok(classes.has("bg-dort-v1") && enfants.some((n) => n.className === "bg-zzz-v1"), "sommeil remis après un redessin");
  // clic : sursaut, pet très fort, réplique, clic avalé
  let stoppe = false, empeche = false;
  clic({ target: el, stopPropagation: () => { stoppe = true; }, preventDefault: () => { empeche = true; } });
  assert.ok(stoppe && empeche, "le clic de réveil est avalé (n'ouvre pas le Coffre)");
  assert.ok(joues.includes("coffreReveil"), "pet de réveil");
  assert.equal(api.dort(), false, "réveillé");
  assert.equal(window.__coffreDortIdleV1__, false);
  assert.ok(classes.has("bg-sursaut-v1") && !classes.has("bg-dort-v1"), "bond sur place");
  const bulle = enfants.find((n) => n.className && n.className.includes("bg-replique-v1"));
  assert.ok(bulle && api.repliques.includes(bulle.textContent), "réplique tirée au sort");
  // éveillé : un clic n'est plus intercepté
  stoppe = false;
  clic({ target: el, stopPropagation: () => { stoppe = true; }, preventDefault() {} });
  assert.equal(stoppe, false, "éveillé : le clic passe normalement");
  // au bout de 150 s de présence, il se réveille tout seul
  api.endormir();
  for (let i = 0; i < 600; i += 1) tic();
  assert.equal(api.dort(), false, "il ne dort pas indéfiniment");
  assert.equal(joues.filter((x) => x === "coffreReveil").length, 2, "réveil tout seul : il pète aussi");
}
console.log("idle-coffre-sommeil-v1: OK");
