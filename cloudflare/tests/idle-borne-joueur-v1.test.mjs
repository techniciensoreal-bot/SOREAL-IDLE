import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Choix du portrait du joueur sur la borne (modules/borne-joueur-v1.js, soreal-idle-borne-joueur-v1.css), maquette validée par Norman (2026-10-31).
 * Règle n°2 : bouton seulement à partir de 2 portraits, jamais de verrouillé ni de nom de set. Règle n°4 : fenêtre dans <body> avec data-morph-garder.
 */
const R = "cloudflare/public/";
const src = readFileSync(R + "modules/borne-joueur-v1.js", "utf8");

/* Faux DOM minimal : assez pour construire la fenêtre et suivre ses états. */
function classes(init) {
  return { _s: new Set(init || []), toggle(c, on) { if (on) this._s.add(c); else this._s.delete(c); }, contains(c) { return this._s.has(c); } };
}
function faux(tag) {
  return {
    tag, children: [], attrs: {}, hidden: false, className: "", _html: "", listeners: {}, parentElement: null, classList: classes(),
    setAttribute(k, v) { this.attrs[k] = v; }, hasAttribute(k) { return k in this.attrs; }, getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; },
    appendChild(c) { c.parentElement = this; this.children.push(c); return c; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    focus() {}, _q: {}, querySelector(sel) { return this._q[sel] || null; }
  };
}
const body = faux("body");
const overlay = faux("div");
const grille = faux("div"), mention = faux("div"), autoBtn = faux("button"), croix = faux("button");
let cartes = [];
Object.defineProperty(grille, "innerHTML", {
  get() { return this._html; },
  set(v) {
    this._html = v;
    cartes = [...v.matchAll(/data-id="([^"]+)"/g)].map((m) => {
      const c = faux("button");
      c.attrs["data-id"] = m[1];
      c.classList = classes(["bj-card"]);
      c.closest = () => c;
      return c;
    });
    this.children = cartes;
  }
});
Object.defineProperty(overlay, "innerHTML", { get() { return this._html; }, set(v) { this._html = v; } });
overlay._q = { ".bj-grid": grille, ".bj-set": mention, ".bj-auto": autoBtn, ".bj-x": croix };
const documentFaux = {
  body, listeners: {},
  createElement() { return overlay; },
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
  querySelector(sel) { return sel === ".bj-btn" ? { ok: 1 } : null; }
};
const envoyees = [];
const joueur = (liste, extra) => ({ systemes: { portraits: Object.assign({ list: liste, selected: liste[0] && liste[0].id }, extra || {}) } });
const P = (id, unlocked = true) => ({ id, name: id.toUpperCase(), file: "Portrait_" + id, unlocked });
const window = { __SOREAL_IDLE_META_V130__: { actionMetaIdleV130_: (p) => envoyees.push(p) }, __SOREAL_IDLE_REG__: {} };
vm.runInNewContext(src, { window, document: documentFaux, encodeURIComponent });
const API = window.__SOREAL_IDLE_BORNE_JOUEUR_V1__;
assert.ok(API, "module chargé");

/* 1. Bouton : jamais avec 0 ou 1 portrait débloqué (rien ne trahit l'existence des autres), même si un verrouillé traîne dans la liste. */
assert.equal(API.boutonHtml(joueur([])), "");
assert.equal(API.boutonHtml(joueur([P("default")])), "", "un seul portrait : pas de bouton");
assert.equal(API.boutonHtml(joueur([P("default"), P("forest", false)])), "", "un portrait verrouillé ne compte pas");
const bouton = API.boutonHtml(joueur([P("default"), P("training")]));
assert.match(bouton, /class="bj-btn"/, "2 portraits : bouton présent");
assert.match(bouton, /__borneJoueurOuvrirV1__\(\)/);
assert.match(bouton, />1P</);

/* 2. Fenêtre : ajoutée à <body>, data-morph-garder, seulement les portraits débloqués, cadre « 1P » sur le choisi. */
window.__SOREAL_IDLE_REG__.idleEtat = joueur([P("default"), P("training"), P("forest"), P("secret", false)], { selected: "training" });
window.__borneJoueurOuvrirV1__();
assert.equal(overlay.parentElement, body, "fenêtre ajoutée à <body>");
assert.ok(overlay.hasAttribute("data-morph-garder"), "survit aux redessins");
assert.equal(overlay.hidden, false, "ouverte");
assert.match(overlay._html, /CHOOSE YOUR PLAYER/);
assert.deepEqual(cartes.map((c) => c.attrs["data-id"]), ["default", "training", "forest"], "aucun portrait verrouillé dans la grille");
assert.doesNotMatch(grille._html, /secret/i);
assert.doesNotMatch(grille._html, /cadenas/i);
assert.match(grille._html, /\/api\/idle\/media\/player\?portrait=Portrait_forest/, "vignette = média du joueur, comme avant");
assert.deepEqual(cartes.filter((c) => c.classList.contains("sel")).map((c) => c.attrs["data-id"]), ["training"]);
assert.equal(grille.classList.contains("off"), false);
assert.equal(mention.hidden, true);

/* 3. Mise à jour sans reconstruire (pas de clignotement) quand la liste est la même. */
const avant = cartes;
window.__SOREAL_IDLE_REG__.idleEtat = joueur([P("default"), P("training"), P("forest")], { selected: "forest" });
API.majGrille();
assert.equal(cartes, avant, "mêmes cartes, rien n'est reconstruit");
assert.deepEqual(cartes.filter((c) => c.classList.contains("sel")).map((c) => c.attrs["data-id"]), ["forest"]);

/* 4. Un clic envoie l'action et ferme. */
window.__borneChoisirPortraitIdleV1__("default");
assert.equal(JSON.stringify(envoyees.pop()), JSON.stringify({ action: "portrait", id: "default" }));
assert.equal(overlay.hidden, true, "fermée après le choix");
window.__borneChoisirPortraitIdleV1__("secret");
assert.equal(envoyees.length, 0, "un portrait verrouillé ou inconnu n'envoie rien");

/* 5. Fermeture : croix, clic dehors, Échap. */
const ouvrir = () => { API.ouvrir(); assert.equal(overlay.hidden, false); };
ouvrir(); croix.listeners.click[0](); assert.equal(overlay.hidden, true, "croix");
ouvrir(); overlay.listeners.mousedown[0]({ target: grille }); assert.equal(overlay.hidden, false, "clic dans la fenêtre : reste ouverte");
overlay.listeners.mousedown[0]({ target: overlay }); assert.equal(overlay.hidden, true, "clic dehors");
ouvrir(); documentFaux.listeners.keydown[0]({ key: "Escape" }); assert.equal(overlay.hidden, true, "Échap");

/* 6. Set équipé (Norman, 2026-10-31) : grille TOUJOURS active ; sans choix manuel, phrase neutre sans nom de set ; avec choix manuel, bouton « Automatique ». */
const SET = { id: "training", file: "Portrait_training", name: "Nom Secret Du Set", set: "gaudy" };
window.__SOREAL_IDLE_REG__.idleEtat = joueur([P("default"), P("training")], { selected: "default", auto: SET, manuel: false });
ouvrir();
assert.equal(grille.classList.contains("off"), false, "grille jamais grisée");
assert.equal(mention.hidden, false);
assert.equal(autoBtn.hidden, true, "pas de choix manuel : pas de bouton Automatique");
assert.doesNotMatch(overlay._html + grille._html, /Nom Secret Du Set|gaudy/i, "jamais le nom du set");
assert.match(overlay._html, /Le portrait de ton set est affiché tant que tu n’en choisis pas un./);
assert.doesNotMatch(overlay._html, /Tu portes l’armure/);
assert.deepEqual(cartes.filter((c) => c.classList.contains("sel")).map((c) => c.attrs["data-id"]), ["training"], "sans choix : le portrait du set porte le 1P");
window.__borneChoisirPortraitIdleV1__("default");
assert.equal(JSON.stringify(envoyees.pop()), JSON.stringify({ action: "portrait", id: "default" }), "set équipé : le clic choisit quand même");
window.__SOREAL_IDLE_REG__.idleEtat = joueur([P("default"), P("training")], { selected: "default", auto: SET, manuel: true });
ouvrir();
assert.equal(mention.hidden, true, "choix manuel : plus de phrase");
assert.equal(autoBtn.hidden, false, "set équipé + choix manuel : bouton Automatique");
assert.deepEqual(cartes.filter((c) => c.classList.contains("sel")).map((c) => c.attrs["data-id"]), ["default"], "le choix manuel porte le 1P");
autoBtn.listeners.click[0]();
assert.equal(JSON.stringify(envoyees.pop()), JSON.stringify({ action: "portrait", id: "auto" }));
assert.equal(overlay.hidden, true);
window.__SOREAL_IDLE_REG__.idleEtat = joueur([P("default"), P("training")], { selected: "default", manuel: true });
ouvrir();
assert.equal(autoBtn.hidden, true, "aucun set équipé : pas de bouton Automatique");
window.__borneChoisirPortraitIdleV1__("auto");
assert.equal(envoyees.length, 0, "« auto » sans set équipé : rien envoyé");

/* 7. La fenêtre se ferme d'elle-même si le joueur n'a plus 2 portraits. */
window.__SOREAL_IDLE_REG__.idleEtat = joueur([P("default")]);
API.majGrille();
assert.equal(overlay.hidden, true);

/* 8. Câblage : bouton dans le pupitre, bloc retiré de Chroniques, dictionnaire anglais, pas de !important, boucles. */
const combat2 = readFileSync(R + "modules/ui-combat-2-v1.js", "utf8");
assert.match(combat2, /__SOREAL_IDLE_BORNE_JOUEUR_V1__\.boutonHtml\(j\)/, "bouton posé dans soreal-idle-boss-controls-v39");
assert.ok(combat2.indexOf("boutonHtml(j)") > combat2.indexOf('class="soreal-idle-boss-controls-v39"'));
const profil = readFileSync(R + "modules/profile-v1.js", "utf8");
assert.doesNotMatch(profil, /blocPortraits|Player Portraits —|__profilChoisirPortraitIdleV1__/);
const index = readFileSync(R + "index.html", "utf8");
assert.ok(index.indexOf("/soreal-idle-borne-joueur-v1.css") > index.indexOf("/soreal-idle-itopod.css"), "feuille chargée après celles de la borne");
assert.ok(index.indexOf("/modules/borne-joueur-v1.js") > 0 && index.indexOf("/modules/borne-joueur-v1.js") < index.indexOf("/modules/ui-combat-2-v1.js"));
assert.match(index, /soreal-idle-borne-joueur-v1\.css\?v=\d+/);
assert.match(index, /borne-joueur-v1\.js\?v=\d+/);
const css = readFileSync(R + "soreal-idle-borne-joueur-v1.css", "utf8");
assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ""), /!important/, "aucun !important : la spécificité remplace");
assert.doesNotMatch(css, /animation\s*:|@keyframes/, "aucune animation en boucle (règle n°3)");
assert.match(css, /prefers-reduced-motion/);
const dico = JSON.parse(readFileSync(R + "modules/traduction-anglais-dict-v1.json", "utf8"));
for (const t of ["Choisis le portrait de ton héros (cosmétique)", "Le portrait de ton set est affiché tant que tu n’en choisis pas un.", "Automatique", "1P = portrait actuel", "Choisir le joueur"]) {
  assert.ok(dico[t], "traduction anglaise : " + t);
}
assert.ok(!("CHOOSE YOUR PLAYER" in dico), "CHOOSE YOUR PLAYER reste tel quel");
assert.match(src, /data-sans-traduction>CHOOSE YOUR PLAYER/);

console.log("idle-borne-joueur-v1: OK");
