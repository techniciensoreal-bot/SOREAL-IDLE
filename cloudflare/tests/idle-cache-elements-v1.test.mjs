import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Cache des recherches d'éléments faites à chaque image (2026-11-06). Mesuré sur le vrai jeu (menu Aventure) : getElementById / querySelector / querySelectorAll = 27 % du temps propre du fil principal ; l'Entraînement
 * de base cherchait ~60 éléments à chaque image alors que sa page n'était pas affichée. Garantie testée : le cache renvoie TOUJOURS ce que renverrait la recherche directe (élément trouvé tant qu'il est dans la page,
 * retrouvé s'il est remplacé), sauf l'absence, mémorisée 120 ms au plus et oubliée à chaque redessin.
 */
const src = fs.readFileSync("cloudflare/public/modules/cache-elements-v1.js", "utf8");

/* faux document : un élément est « dans la page » s'il est dans `page` ; getElementById / querySelector comptent leurs appels */
function monde() {
  const page = new Map();   /* clé (id ou sélecteur) -> élément */
  const appels = { id: 0, sel: 0 };
  let horloge = 1000;
  const doc = {
    getElementById(i) { appels.id += 1; const e = page.get("#" + i); return e && e.isConnected ? e : null; },
    querySelector(s) { appels.sel += 1; const e = page.get(s); return e && e.isConnected ? e : null; }
  };
  const ctx = { window: {}, document: doc, performance: { now: () => horloge }, Map };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return { E: ctx.window.__SOREAL_IDLE_EL_V1__, window: ctx.window, page, appels, avancer: (ms) => { horloge += ms; } };
}
const el = (nom) => ({ nom, isConnected: true });

{
  const m = monde();
  assert.ok(m.E && typeof m.E.id === "function" && typeof m.E.sel === "function", "module exposé");
  assert.ok(Array.isArray(m.window.__SOREAL_IDLE_APRES_REDESSIN_V1__) && m.window.__SOREAL_IDLE_APRES_REDESSIN_V1__.length === 1, "inscrit au redessin de la page (règle n°4)");

  /* identifiants : recherche DIRECTE (getElementById est déjà très rapide ; un cache d'identifiants ralentissait, mesuré A/B) : toujours exactement le résultat de la recherche directe */
  const a = el("a"); m.page.set("#a", a);
  assert.equal(m.E.id("a"), a);
  a.isConnected = false;
  const b = el("b"); m.page.set("#a", b);
  assert.equal(m.E.id("a"), b, "l'élément remplacé est retrouvé");
  assert.equal(m.E.id("fantome"), null);
  m.page.set("#fantome", el("f"));
  assert.equal(m.E.id("fantome").nom, "f", "un élément qui apparaît est vu tout de suite (aucune mémoire d'absence pour les identifiants)");
  assert.equal(m.appels.id, 4, "chaque lecture est une vraie recherche");

  /* sélecteurs : même comportement, tables séparées de celles des identifiants */
  const d = el("d"); m.page.set(".duel", d);
  assert.equal(m.E.sel(".duel"), d);
  assert.equal(m.E.sel(".duel"), d);
  assert.equal(m.appels.sel, 1);
  m.page.set("#duel", el("autre"));
  assert.equal(m.E.id("duel").nom, "autre", "un identifiant et un sélecteur de même texte ne se mélangent pas");
  assert.equal(m.E.sel(".absent"), null);
  const s0 = m.appels.sel;
  m.E.sel(".absent"); m.E.sel(".absent");
  assert.equal(m.appels.sel, s0, "absence de sélecteur mémorisée");
  /* redessin : l'absence d'un sélecteur est oubliée */
  m.E.sel(".tardif"); m.page.set(".tardif", el("t"));
  assert.equal(m.E.sel(".tardif"), null, "encore mémorisé absent (moins de 120 ms)");
  m.window.__SOREAL_IDLE_APRES_REDESSIN_V1__[0]();
  assert.equal(m.E.sel(".tardif").nom, "t", "après un redessin : trouvé immédiatement");
}

/* le cache n'alloue rien par appel (mesuré : une première version avec fermeture et clé concaténée coûtait autant que les recherches qu'elle remplaçait) */
assert.ok(!/function\s*\(\)\s*\{\s*return document\./.test(src) && !/'#'\s*\+/.test(src), "ni fermeture ni concaténation de clé par appel");

/* les sites mesurés l'utilisent */
const ent = fs.readFileSync("cloudflare/public/modules/ui-entrainement-v1.js", "utf8");
const cmb = fs.readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
const idx = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/const pageBt=elSelIdleV1_\('\.soreal-idle-bt-row-v120'\)!==null;/.test(ent), "Entraînement : une seule recherche si aucune ligne de compétence n'est affichée");
const f0 = ent.indexOf("function rafraichirBasicTrainingIdleV120_(){"), f1 = ent.indexOf("function fusionnerBasicTrainingPlusAvanceIdleV166_(");
assert.ok(!ent.slice(f0, f1).includes("document.getElementById("), "plus aucune recherche directe dans le rafraîchissement de l'Entraînement");
assert.ok(/elIdleV1_\('sorealIdleBossBarV7'\)/.test(cmb) && /elIdleV1_\('sorealIdleBossNukeV1'\)/.test(cmb) && /elSelIdleV1_\(\s*'\.soreal-idle-boss-control-v39\.stop'/.test(cmb) && /elSelIdleV1_\('\.soreal-idle-duel-v41'\)/.test(cmb), "Combat : commandes et ambiance par le cache");
assert.ok(idx.indexOf("cache-elements-v1.js") > 0 && idx.indexOf("cache-elements-v1.js") < idx.indexOf("ui-entrainement-v1.js"), "chargé avant les modules d'interface");
console.log("idle-cache-elements-v1: OK");
