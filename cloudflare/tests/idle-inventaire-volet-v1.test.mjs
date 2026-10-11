import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/* Norman (2026-10-11) : sur téléphone, le volet Équipement n'a plus de titre, reste entièrement sous le bandeau du haut, et un bouton fixe en bas l'ouvre / le ferme. */
const mod = readFileSync("cloudflare/public/modules/inventaire-volet-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes("/modules/inventaire-volet-v1.js?v="), "module chargé");
assert.ok(css.includes('[data-volet] .soreal-idle-v138-equipment-sticky>.soreal-idle-window-title-v31{display:none!important}'), "titre « Équipement » masqué");
assert.ok(css.includes('[data-volet="ferme"] .soreal-idle-v138-equipment-sticky{display:none!important}'), "volet fermé : rien d'affiché");
assert.ok(css.includes("top:var(--inv-haut,191px)!important"), "collé sous le bandeau mesuré");
assert.ok(css.includes("@media (min-width:701px){.soreal-idle-volet-equip-bouton-v1{display:none!important}}"), "rien sur ordinateur");
assert.ok(css.includes(".soreal-idle-v138-slot-icon>img") && css.includes("repeat(3,calc((100% - 16px)/5))"), "cases de la taille de celles du sac, images dans leur cadre, disposition d'origine (3 colonnes)");

// comportement : bouton créé sur téléphone, bascule et mémorisation, retiré hors de la page
function monde(largeur) {
  const stock = {};
  const corps = []; const attrs = {}; const propres = {};
  const colonnes = { getAttribute: (k) => attrs[k] ?? null, setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; }, style: { getPropertyValue: (k) => propres[k] || "", setProperty: (k, v) => { propres[k] = v; }, removeProperty: (k) => { delete propres[k]; } } };
  let present = true; let bouton = null;
  const document = {
    hidden: false, documentElement: { clientWidth: largeur },
    querySelector: (s) => (s === ".soreal-idle-v151-inventory-columns" ? (present ? colonnes : null) : (s === ".soreal-idle-nav-v28" ? { getBoundingClientRect: () => ({ height: 100, bottom: 100 }) } : { getBoundingClientRect: () => ({ height: 90, bottom: 190 }) })),
    getElementById: (id) => (id === "sorealIdleVoletEquipementV1" ? bouton : null),
    createElement: () => { const n = { attrs: {}, textContent: "", setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(e, f) { this.clic = f; }, parentNode: { removeChild() { bouton = null; } } }; return n; },
    body: { appendChild(n) { bouton = n; corps.push(n); } }
  };
  const window = { innerWidth: largeur, getComputedStyle: () => ({ position: "sticky" }), addEventListener() {} };
  window.document = document;
  let tic = null;
  vm.runInNewContext(mod, { window, document, localStorage: { getItem: (k) => stock[k] ?? null, setItem: (k, v) => { stock[k] = v; } }, setInterval: (f) => { tic = f; }, console });
  return { window, attrs, propres, stock, get bouton() { return bouton; }, quitter() { present = false; }, tic: () => tic() };
}
const m = monde(375);
m.tic();
assert.ok(m.bouton, "bouton créé sur téléphone");
assert.equal(m.attrs["data-volet"], "ouvert");
assert.equal(m.propres["--inv-haut"], "190px", "hauteur du bandeau mesurée");
assert.match(m.bouton.textContent, /Masquer l’équipement/);
m.bouton.clic();
assert.equal(m.attrs["data-volet"], "ferme", "fermé au clic");
assert.equal(m.stock.soreal_idle_volet_equipement_v1, "ferme", "choix mémorisé");
assert.match(m.bouton.textContent, /Afficher l’équipement/);
m.quitter(); m.tic();
assert.equal(m.bouton, null, "bouton retiré quand l'inventaire n'est plus affiché");
const pc = monde(1200); pc.tic();
assert.equal(pc.bouton, null, "aucun bouton sur ordinateur");
console.log("idle-inventaire-volet-v1: OK");
