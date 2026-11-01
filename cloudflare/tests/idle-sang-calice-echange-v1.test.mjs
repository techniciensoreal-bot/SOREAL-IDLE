import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/*
 * Norman (2026-11-01) : « bol de fil barbelé (4e rituel) : 2 calices en même temps ; le premier ne part pas pour laisser la place au 2e ; le 2e a déjà du sang alors qu'il n'a reçu aucun jet. »
 * Causes : (1) un redessin de la page pendant l'échange (ou juste après) remplaçait le calice qui sort par un calice dessiné d'après le compte du SERVEUR (en retard sur ce que la scène montre) : calice vide, calice
 * qui entre retiré, suivant en trop ; (2) le calice suivant / le calice qui entre portait la couche de fond (« tâché ») alors qu'il n'a reçu aucune goutte.
 * Règles gardées : un seul calice courant par scène ; le calice qui sort quitte la scène à la fin de l'échange même si l'animation est interrompue ; le calice qui entre est VIDE ; règle n°4 d'AGENTS.md (aucune minuterie
 * entre redessin et remise en état : protection par data-morph-garder, pas par attente).
 */
const src = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");

// ---- lecture du code ----
assert.ok(/function filmFond\([^)]*\)\{[\s\S]*?if\(f<=0&&SOURCES\[id\]==='fil'\)return 0;/.test(src), "quatrième rituel : un calice sans goutte reçue est vide (pas de couche de fond)");
assert.ok(/function protegerVases\(/.test(src) && /setAttribute\('data-morph-garder',''\)/.test(src), "les calices de l'échange sont protégés du redessin (data-morph-garder)");
assert.ok(/echangeProtege\(opts\.id\)\?'':'<div class="bm-vase">'/.test(src), "scene() n'écrit plus de calice pendant un échange (le morph ne doit ni le remplacer ni en ajouter un)");
assert.ok(/var dejaAff=affiches\[opts\.id\];[\s\S]{0,200}compte=dejaAff/.test(src), "scene() du 4e rituel ne repart jamais d'un compte du serveur plus bas que celui déjà montré");
assert.ok(/function finEchange\(sc,b\)\{[\s\S]*?l\[i\]!==b[\s\S]*?removeChild/.test(src), "fin d'échange : tout calice autre que celui qui entre est retiré");
assert.ok(/function normaliserVases\(/.test(src) && /data-source'\)==='fil'\)normaliserVases\(/.test(src), "un seul calice courant par scène, vérifié à chaque mise à jour");
assert.ok(/maintenant-sc\.__swapT0>3000/.test(src), "un échange qui dépasse 3 s est terminé de force (ne dépend pas d'animationend ni d'un seul minuteur)");
assert.ok(!/animationend/.test(src.slice(src.indexOf("function finEchange"), src.indexOf("var DEPART_GOUTTE"))), "la sortie ne dépend pas de animationend");
assert.ok(!/setTimeout\([^)]*protegerVases/.test(src), "aucune attente entre un redessin et la protection");

// ---- rendu pur : le calice du 4e rituel qui n'a rien reçu est vide, les autres rituels gardent leur couche de fond ----
const fenetre = { __nomJoueurIdleV1__: () => "Norman" };
vm.runInNewContext(src.replace("window.__SOREAL_IDLE_SANG_DECOR_V1__={", "window.__T__={finEchange:finEchange,normaliserVases:normaliserVases,protegerVases:protegerVases,echangeProtege:echangeProtege};window.__SOREAL_IDLE_SANG_DECOR_V1__={"), { window: fenetre, setInterval: () => 0, document: {}, performance: { now: () => 0 }, console });
const d = fenetre.__SOREAL_IDLE_SANG_DECOR_V1__, T = fenetre.__T__;
const niveaux = (html) => [...html.matchAll(/class="bm-liq"[^>]*translateY\(([-0-9.]+)px\)/g)].map((m) => Number(m[1]));
const sc = (id, compte) => d.scene({ id, sang: 60000, compte, barre: "", saigne: true, rang: 3 });
{
  const pile = niveaux(sc("barbedWire", 200));            // 200 = un calice plein sorti, le suivant (courant) n'a rien reçu
  assert.equal(pile.length, 1, "un seul calice dessiné");
  assert.equal(pile[0], 78, "calice courant sans goutte : niveau 0 (sous le bol), aucune couche de sang");
  const attente = niveaux(sc("barbedWire", 199));         // presque plein : le suivant attend, VIDE
  assert.equal(attente.length, 2, "le suivant attend à 90 %");
  assert.equal(attente[1], 78, "le suivant qui attend est vide");
  assert.ok(niveaux(sc("barbedWire", 201))[0] < 70, "la première goutte reçue fait apparaître la couche de fond");
  const vide0 = niveaux(sc("hickey", 0))[0];
  assert.ok(niveaux(sc("hickey", 5000))[0] < vide0 - 2 && niveaux(sc("hickey", 4999))[1] < vide0 - 2, "les autres rituels gardent leur couche de fond (non touchés)");
}

// ---- mini DOM : l'échange se termine toujours avec un seul calice courant ----
function noeud(classes, parent) {
  const n = {
    attrs: new Set(), parentNode: null, enfants: [],
    classList: { _s: new Set(classes), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, contains(c) { return this._s.has(c); } },
    hasAttribute(a) { return this.attrs.has(a); }, setAttribute(a) { this.attrs.add(a); }, removeAttribute(a) { this.attrs.delete(a); },
    removeChild(c) { this.enfants = this.enfants.filter((x) => x !== c); c.parentNode = null; },
    insertBefore(c, ref) { c.parentNode = this; const i = ref ? this.enfants.indexOf(ref) : -1; if (i < 0) this.enfants.push(c); else this.enfants.splice(i, 0, c); return c; },
    querySelectorAll(sel) { return sel === ".bm-vase" ? this.enfants.filter((e) => e.classList.contains("bm-vase")) : []; },
  };
  if (parent) parent.insertBefore(n, null);
  return n;
}
const classes = (n) => [...n.classList._s].join(" ");
const scene = () => { const s = noeud(["bm-scene"]); s.__swap = false; return s; };
{
  // fin d'échange normale : le calice qui sort disparaît, celui qui entre devient le seul calice courant, protections levées
  const s = scene(), a = noeud(["bm-vase", "bm-sort"], s), b = noeud(["bm-vase", "bm-suivant", "bm-avance"], s);
  T.protegerVases(s, true); s.__swap = true;
  assert.ok(a.hasAttribute("data-morph-garder") && b.hasAttribute("data-morph-garder"));
  T.finEchange(s, b);
  assert.deepEqual(s.enfants, [b], "un seul calice à la fin de l'échange");
  assert.equal(classes(b), "bm-vase", "le calice qui entre n'a plus aucune classe d'échange");
  assert.ok(!b.hasAttribute("data-morph-garder") && s.__swap === false, "protection levée, échange terminé");
}
{
  // nettoyage garanti : calice resté en sortie (animation annulée, minuteur perdu) ou calices en double, hors échange
  const s = scene(), a = noeud(["bm-vase", "bm-sort"], s), c1 = noeud(["bm-vase"], s), c2 = noeud(["bm-vase"], s), n1 = noeud(["bm-vase", "bm-suivant"], s), n2 = noeud(["bm-vase", "bm-suivant"], s);
  c2.setAttribute("data-morph-garder");
  T.normaliserVases(s, "barbedWire", "calice", 0);
  assert.ok(!s.enfants.includes(a), "le calice en sortie oublié disparaît");
  assert.deepEqual(s.enfants.filter((e) => !e.classList.contains("bm-suivant")), [c2], "un seul calice courant");
  assert.equal(s.enfants.filter((e) => e.classList.contains("bm-suivant")).length, 1, "au plus un suivant");
  assert.ok(!c2.hasAttribute("data-morph-garder"), "hors échange, aucune protection ne reste");
}
{
  // échange bloqué plus de 3 s : terminé de force
  const s = scene(), a = noeud(["bm-vase", "bm-sort"], s), b = noeud(["bm-vase", "bm-suivant", "bm-avance"], s);
  s.__swap = true; s.__swapT0 = -5000; s.__fin = () => T.finEchange(s, b);
  T.normaliserVases(s, "barbedWire", "calice", 0);
  assert.deepEqual(s.enfants, [b], "l'échange bloqué est terminé et il ne reste que le calice qui entrait");
  assert.equal(s.__swap, false);
}
console.log("idle-sang-calice-echange-v1: ok");
