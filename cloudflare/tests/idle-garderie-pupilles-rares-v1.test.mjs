import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Pupilles des chats de la Garderie (Norman, 2026-11-02) : mouvement RARE ; disque presque plein (fin bord de couleur) qui GRANDIT progressivement depuis la fente, quelques secondes à l'arrivée dans le menu et pendant
 * toute la vue zoom d'un bocal ; fente fine le reste du temps ; contraction plus rapide que la dilatation ; une seule pupille dont seul transform change (forme continue). */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const src = pub("modules/etagere-pupilles-v1.js");
const zoomSrc = pub("modules/garderie-zoom-v1.js");

/* faux environnement : classes de <html>, présence des pupilles pilotée à la main, minuteries capturées */
function monde() {
  const classes = new Set();
  const m = { present: false, intervals: [], timeouts: [], cleared: [] };
  const racine = { classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), toggle: (c, v) => (v ? classes.add(c) : classes.delete(c)) } };
  const document = { documentElement: racine, getElementById() { return null; }, head: { appendChild() {} }, createElement() { return {}; }, querySelector: () => (m.present ? {} : null) };
  const ctx = {
    window: {}, document, Math,
    setInterval: (f, ms) => { m.intervals.push({ f, ms }); return m.intervals.length; },
    clearInterval: (id) => { m.cleared.push(id); },
    setTimeout: (f, ms) => { const t = { f, ms, vivant: true }; m.timeouts.push(t); return t; },
    clearTimeout: (t) => { if (t && typeof t === "object") t.vivant = false; },
  };
  vm.runInNewContext(src, ctx);
  return { P: ctx.window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__, classes, m };
}
const vivants = (m) => m.timeouts.filter((t) => t.vivant);
const TOUS = ["defaut", "noeud", "dore", "chauvesouris", "pirate", "noel"];
const css = src.slice(src.indexOf("s.textContent=["));

/* 1. Cadence de repos : un battement toutes les 14 à 25 s, 1re échéance aléatoire par chat, stable d'un redessin à l'autre. */
{
  const { P, m } = monde();
  for (const id of TOUS) {
    assert.ok(P.skins[id].d >= 14 && P.skins[id].d <= 25, id + " : un battement toutes les 14 à 25 s");
    const h = P.html(id);
    assert.equal(P.html(id), h, id + " : le HTML ne change jamais d'un redessin à l'autre (règle n°4)");
    assert.ok(h.includes("et-pf") && !h.includes("style=\"--pd"), id + " : une seule pupille noire, aucun style dépendant de l'heure");
  }
  assert.ok(src.includes("Math.random()") && src.includes("phases[id]"), "phase aléatoire propre à chaque chat, mémorisée");
  assert.ok(/d\*\(0\.85\+0\.3\*Math\.random\(\)\)/.test(src), "battements suivants : un cycle de 14 à 25 s (+/- 15 %)");
  /* l'échéance du premier battement tombe entre 3 s et un cycle ; plusieurs visites donnent des échéances différentes */
  const delais = new Set();
  for (let i = 0; i < 12; i += 1) {
    const w = monde();
    w.P.html("dore"); w.m.present = true; w.m.intervals[0].f();
    const bat = vivants(w.m).slice(-1)[0];
    assert.ok(bat.ms >= 3000 && bat.ms <= 14700);
    assert.ok(bat, "premier battement armé entre 3 s et un cycle");
    delais.add(Math.round(bat.ms));
  }
  assert.ok(delais.size >= 6, "échéance aléatoire : change d'une visite à l'autre");
  /* ensuite : battement court (<= 3 s), puis un nouveau rendez-vous >= 12 s */
  const w = monde(); w.P.html("noel"); w.m.present = true; w.m.intervals[0].f();
  const t1 = vivants(w.m).slice(-1)[0];
  assert.ok(t1.ms >= 3000 && t1.ms <= 16600);
  t1.f();
  assert.ok(w.classes.has("et-pup-bat"), "battement : ellipse douce");
  const t2 = vivants(w.m).slice(-1)[0];
  assert.ok(t2.ms <= 3000, "un battement dure quelques secondes");
  t2.f();
  assert.ok(!w.classes.has("et-pup-bat"));
  const t3 = vivants(w.m).slice(-1)[0];
  assert.ok(t3.ms >= 12000 && t3.ms <= 25000 * 1.15, "rien en continu : au moins 12 s entre deux battements");
  /* menu quitté : plus de battement */
  w.m.present = false; w.m.intervals[0].f();
  assert.equal(t3.vivant, false, "plus de battement programmé quand le menu est quitté");
  assert.ok(!w.classes.has("et-pup-bat"));
}

/* 2. Arrivée dans le menu : disque ~3 s UNE fois par entrée, jamais relancé par un redessin. */
{
  const { P, classes, m } = monde();
  P.html("dore"); P.html("noel");
  assert.equal(m.intervals.length, 1, "un seul guetteur, relancé par le rendu seulement");
  const tic = m.intervals[0].f;
  tic();
  assert.ok(!classes.has("et-pup-arrivee"), "rien avant l'entrée");
  m.present = true; tic();
  assert.ok(classes.has("et-pup-arrivee"), "entrée détectée : disque");
  const arr = m.timeouts.find((t) => t.ms === 3500);
  assert.ok(arr, "quelques secondes seulement (3,5 s : dilatation 2 s, tenue, puis contraction 2 s)");
  const avant = m.timeouts.length;
  for (let i = 0; i < 6; i += 1) { P.html("dore"); tic(); }
  assert.equal(m.timeouts.length, avant, "un redessin ne relance ni l'arrondi ni les battements");
  arr.f();
  assert.ok(!classes.has("et-pup-arrivee"), "retour à la fente");
  tic(); tic();
  assert.equal(m.timeouts.length, avant, "pas de nouvel arrondi sans nouvelle entrée");
  m.present = false; tic();
  assert.equal(m.cleared.length, 1, "menu quitté : le guetteur s'arrête");
  P.html("dore"); m.present = true;
  assert.equal(m.intervals.length, 2, "nouveau rendu de la Garderie : guetteur relancé");
  m.intervals[1].f();
  assert.ok(classes.has("et-pup-arrivee"), "nouvelle entrée = nouvel arrondi");
}

/* 3. Vue zoom : disque tant qu'elle est ouverte (état stable), fente à la fermeture. */
{
  const { P, classes } = monde();
  P.zoom(true);
  assert.ok(classes.has("et-pup-zoom"));
  P.zoom(false);
  assert.ok(!classes.has("et-pup-zoom"));
  const ouvrir = zoomSrc.slice(zoomSrc.indexOf("function ouvrir(id)"), zoomSrc.indexOf("function mouvementReduit"));
  assert.ok(ouvrir.includes("pupillesZoom(true)"), "ouverture du zoom : pupilles rondes");
  const fermer = zoomSrc.slice(zoomSrc.indexOf("function fermer(silencieux)"), zoomSrc.indexOf("/* Le clic sur un bocal ouvre"));
  assert.ok(fermer.includes("pupillesZoom(false)"), "fermeture du zoom : fentes");
  assert.ok(zoomSrc.includes("P.zoom(ouvert)"));
}

/* 4. CSS : une seule pupille, cercle de base, seul transform change (transition), forme continue, disque final >= 82 % de l'iris, anneau fin. */
{
  assert.ok(!/filter\s*:|box-shadow|text-shadow|backdrop|@keyframes|animation/.test(css.replace(/\/\*[^]*?\*\//g, "")), "aucun filtre, aucune ombre, aucune animation de boucle : des transitions de transform");
  assert.ok(!css.includes(".et-pr"), "plus de second élément : pas de fondu entre deux formes");
  const pf = css.match(/'\.et-pf\{([^']*)\}'/)[1];
  const h = Number(pf.match(/height:(\d+)%/)[1]);
  assert.ok(h >= 82 && h <= 90, "le cercle de base fait 82 à 90 % de la hauteur de l'iris : disque final presque plein, anneau de couleur de 5 à 9 % de chaque côté");
  assert.ok(pf.includes("aspect-ratio:1") && pf.includes("border-radius:50%") && /left:0;right:0;top:0;bottom:0;margin:auto/.test(pf), "cercle de base, centré dans l'iris");
  assert.ok(!/transition:[^;]*(width|height|border-radius|all)/.test(pf) && /transition:transform 2s/.test(pf), "seul transform est interpolé ; dilatation et contraction sur 2 s");
  const fente = Number(pf.match(/scale\(([\d.]+),1\)/)[1]);
  assert.ok(fente >= 0.12 && fente <= 0.18, "fente fine : sx 0,12 à 0,18");
  const sx = (re) => Number(css.match(re)[1]);
  const ell = sx(/\.et-pup-bat \.et-pf\{transform:scale\(([\d.]+),1\)/), disque = sx(/\.et-pup-arrivee \.et-pf\{transform:scale\(([\d.]+),1\)/), zoomSx = sx(/\.et-pup-zoom \.et-pf\{transform:scale\(([\d.]+),1\)/);
  assert.ok(fente < ell && ell < disque && disque === 1 && zoomSx === 1, "fente < ellipse du repos < disque (arrivée et zoom) : le repos ne va pas jusqu'au disque presque plein");
  assert.ok(h * disque >= 82, "diamètre final >= 82 % de la hauteur de l'iris");
  const dilatation = Number(css.match(/\.et-pup-arrivee \.et-pf\{[^}]*transition-duration:([\d.]+)s/)[1]), contraction = Number(pf.match(/transition:transform ([\d.]+)s/)[1]);
  assert.ok(dilatation === 2 && contraction === 2, "dilatation et contraction sur 2 s (Norman, 2026-11-03)");
  assert.ok(/prefers-reduced-motion:no-preference\)\{\.et-pup-bat[^}]*\}[^}]*\.et-pup-arrivee/.test(css), "mouvement réduit : ni battement ni arrondi d'arrivée");
  assert.ok(/\.et-pup-zoom \.et-pf\{transform:scale\(1,1\)/.test(css) && /prefers-reduced-motion:reduce\)\{\.et-pf\{transition:none\}\}/.test(css), "mouvement réduit : disque fixe dans la vue zoom, aucune transition");
  assert.ok(src.includes("document.documentElement") && !src.includes("querySelectorAll("), "l'état vit sur <html> : un redessin de la page ne le retire pas (règle n°4)");
  assert.ok(css.indexOf(".et-pup-bat") < css.indexOf(".et-pup-arrivee") && css.indexOf(".et-pup-arrivee") < css.indexOf(".et-pup-zoom"), "ordre de priorité : battement < arrivée < zoom");
}
console.log("OK idle-garderie-pupilles-rares-v1");
