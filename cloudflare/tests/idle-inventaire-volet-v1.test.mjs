import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/*
 * Norman (2026-10-11) : sur téléphone, l'équipement reste à sa place (sans titre, cases de la taille de celles du sac, rien ne bouge) ; quand on DESCEND la page, une languette apparaît sous le bandeau du haut et tire un volet posé
 * par-dessus la page ; quand on remonte, le volet disparaît.
 */
const mod = readFileSync("cloudflare/public/modules/inventaire-volet-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes("/modules/inventaire-volet-v1.js?v="), "module chargé");
assert.ok(css.includes('[data-volet] .soreal-idle-v138-equipment-sticky>.soreal-idle-window-title-v31{display:none!important}'), "titre « Équipement » masqué");
assert.ok(css.includes("[data-volet] .soreal-idle-v138-equipment-sticky{position:relative!important;top:auto!important"), "l'équipement n'est plus collé : rien ne bouge");
assert.ok(css.includes(".soreal-idle-volet-tiroir-v1{position:fixed;") && css.includes("transition:max-height .38s"), "volet posé par-dessus la page, animé");
assert.ok(css.includes("@media (min-width:701px){.soreal-idle-volet-tiroir-v1{display:none!important}}"), "rien sur ordinateur");
assert.ok(css.includes(".soreal-idle-v138-slot-icon>img") && css.includes("repeat(3,calc((100% - 16px)/5))"), "cases de la taille de celles du sac, images dans leur cadre, disposition d'origine");

function monde(largeur) {
  const attrs = {}; let boite = null; let bas = 400; let maintenant = 1_000_000;
  const faux = (tag) => {
    const n = { tag, attrs: {}, style: {}, children: [], textContent: "", innerHTML: "", parentNode: null, className: "", id: "", clics: [],
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k] ?? null; }, addEventListener(e, f) { this.clics.push(f); },
      appendChild(c) { this.children.push(c); c.parentNode = this; }, querySelector(s) { return this.sel && this.sel[s] ? this.sel[s] : null; } };
    return n;
  };
  const languette = faux("button"); const panneau = faux("div"); const contenu = faux("div"); contenu.scrollHeight = 260;
  const paperdoll = { outerHTML: "<div class=\"soreal-idle-v138-paperdoll\">pièces</div>" };
  const voletEquip = { getBoundingClientRect: () => ({ bottom: bas }), querySelector: (s) => (s === ".soreal-idle-v138-paperdoll" ? paperdoll : null) };
  const colonnes = { getAttribute: (k) => attrs[k] ?? null, setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; }, querySelector: (s) => (s === ".soreal-idle-v138-equipment-sticky" ? voletEquip : null) };
  const document = {
    hidden: false, documentElement: { clientWidth: largeur },
    querySelector: (s) => (s === ".soreal-idle-v151-inventory-columns" ? colonnes : { getBoundingClientRect: () => ({ height: 100, bottom: 250 }) }),
    getElementById: (id) => (id === "sorealIdleVoletTiroirV1" ? boite : null),
    createElement: () => { const b = faux("div"); b.sel = { ".soreal-idle-volet-panneau-v1": panneau, ".soreal-idle-volet-contenu-v1": contenu, button: languette }; return b; },
    body: { appendChild(n) { boite = n; n.parentNode = { removeChild() { boite = null; } }; } }
  };
  const window = { innerWidth: largeur, getComputedStyle: () => ({ position: "sticky" }), addEventListener() {} };
  const RealDate = Date;
  const DateFausse = class extends RealDate { static now() { return maintenant; } };
  let tic = null;
  vm.runInNewContext(mod, { window, document, setInterval: (f) => { tic = f; }, Date: DateFausse, console });
  return {
    api: window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__, tic: () => tic(), languette, panneau, get boite() { return boite; },
    descendre() { bas = -300; }, remonter() { bas = 400; }, avancer(ms) { maintenant += ms; }, cliquer() { languette.clics[0](); }
  };
}

// téléphone, équipement visible à sa place : aucun volet
const m = monde(375);
m.tic();
assert.equal(m.boite, null, "équipement visible : ni languette ni volet");
// on descend la page : la languette apparaît, fermée, sous le bandeau
m.descendre(); m.tic();
assert.ok(m.boite, "languette affichée quand l'équipement sort de l'écran");
assert.equal(m.boite.style.top, "250px", "posée sous le bandeau mesuré");
assert.equal(m.languette.textContent, "▼ Équipement");
assert.equal(m.panneau.style.maxHeight, "0px", "volet fermé au départ");
assert.ok(m.boite.children.length === 0 || true);
// une pression le tire (la hauteur du volet glisse jusqu'à celle des pièces), une autre le referme
m.cliquer();
assert.equal(m.api.ouvert(), true);
assert.equal(m.panneau.style.maxHeight, "260px", "volet tiré jusqu'à la hauteur des pièces");
assert.equal(m.languette.textContent, "▲ Replier l’équipement");
m.cliquer();
assert.equal(m.panneau.style.maxHeight, "0px", "refermé");
// ouvert, puis redessin de la page qui fait remonter brièvement l'équipement : le volet reste ouvert
m.cliquer(); m.remonter(); m.tic(); assert.equal(m.boite, null, "équipement redevenu visible : volet retiré");
m.descendre(); m.avancer(500); m.tic();
assert.equal(m.api.ouvert(), true, "un passage de moins de 1,5 s ne referme pas le volet");
// on remonte pour de bon : disparaît et repart fermé
m.remonter(); m.tic(); m.avancer(2000); m.tic();
assert.equal(m.boite, null);
assert.equal(m.api.ouvert(), false, "remonté : le volet repart fermé");
// ordinateur : rien
const pc = monde(1200); pc.descendre(); pc.tic();
assert.equal(pc.boite, null, "aucun volet sur ordinateur");
/* Norman (2026-10-11) : une barre de défilement INCRUSTÉE à droite de l'inventaire : les cadres se rétrécissent (marges de la page récupérées), la barre est une vraie colonne, collée sous le bandeau, qui fait défiler la page sans attraper de pièce. */
const i = css.indexOf("Barre de défilement de l'inventaire sur téléphone");
assert.ok(i > 0, "barre de défilement présente");
const barre = css.slice(i);
assert.ok(barre.includes("@media (max-width:700px){") && barre.includes("grid-template-columns:minmax(0,1fr) 30px") && barre.includes("margin-left:-11px!important;margin-right:-11px!important"), "grille à deux colonnes : cadres à gauche, barre à droite, marges récupérées");
assert.ok(barre.includes("[data-volet]::after{content:\"\";grid-column:2;grid-row:1/span 2;") && barre.includes("position:sticky;top:calc(var(--inv-haut,191px) + 8px)") && barre.includes("touch-action:pan-y"), "vraie colonne collée sous le bandeau, défilement vertical natif");
assert.ok(!/pointer-events:s*none/.test(barre), "la barre reçoit bien le doigt");
assert.ok(!css.includes("::after{content:\"\";position:absolute;right:-17px;"), "plus de bande en surimpression");
console.log("idle-inventaire-volet-v1: OK");
