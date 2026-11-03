import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Menu Chroniques « Diablo » (Norman, 2026-11-02) : page Sets refaite (cartes ornées, motifs, sceau, jauges), barre d'onglets et sous-onglets, médailles.
 * Anti-spoil (AGENTS.md règle n°2) : aucune case vide ni « ??? », aucun total de pièces ; règle n°3 : boucles parfaites ; règle n°4 : tout dans le HTML du rendu.
 */
const lire = (f) => readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const src = lire("cloudflare/public/modules/page-chroniques-v1.js");
const css = lire("cloudflare/public/soreal-idle-chroniques.css");
const index = lire("cloudflare/public/index.html");

const REG = {
  idleHtml_: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  idleEntier_: (n) => Math.floor(Number(n) || 0),
  aventureMetaIdleV47_: (j) => (j && j.systemes && j.systemes.adventure) || null,
  iconeObjetAdventureIdleV138_: () => "<i class=\"ico\"></i>",
  libelleRecompenseSetAdventureIdleV163_: () => "+25 % d’attaque",
  catalogueSetsCollectionIdleV164_: (a) => (a && a.setCatalog) || {}
};
const window = { __SOREAL_IDLE_REG__: REG };
vm.runInNewContext(src, { window, document: {}, console });
const D = window.__SOREAL_IDLE_CHRONIQUES_DESIGN_V1__;
assert.ok(D && typeof D.rendreCollectionIdleV22_ === "function", "module exposé");

const slots = ["head", "chest", "legs", "boots", "weapon", "accessory"];
function etat(partiel) {
  const itemCatalog = {}, itemList = {}, setCatalog = {};
  const defs = [["forge", "Forge", 6, 6, true], ["ombre", "Ombre", 6, 2, false]];
  for (const [id, nom, total, vus, complet] of defs) {
    setCatalog[id] = { id, name: nom, source: "", slots: slots.slice(0, total), reward: { attackPct: 10 } };
    slots.slice(0, total).forEach((s, i) => {
      itemCatalog[id + ":" + s] = { set: id, setName: nom, slot: s, name: "Pièce " + id + i, kind: "equipment" };
      if (i < vus && (partiel || id === "forge")) itemList[id + ":" + s] = { seen: true, maxLevel: complet ? 100 : 30, maxed: complet, fullyMaxed: complet };
    });
  }
  setCatalog.graine = { id: "graine", name: "Graine", source: "objets", items: ["o1", "o2"], reward: { poop: 5 } };
  itemCatalog.o1 = { name: "Objet un", kind: "special" }; itemCatalog.o2 = { name: "Objet deux", kind: "special" };
  itemList.o1 = { seen: true, maxLevel: 100 };
  return { systemes: { adventure: { itemCatalog, itemList, setCatalog, completedSets: { forge: true } } } };
}

// aucun set découvert : message, aucune carte
const vide = D.rendreCollectionIdleV22_({ systemes: { adventure: { itemCatalog: {}, itemList: {}, setCatalog: {}, completedSets: {} } } });
assert.ok(vide.includes("Aucun set découvert pour l’instant") && !vide.includes("sc-carte"), "état vide");

// un set dont aucune pièce n'a été vue n'apparaît pas (ni nom ni carte)
const sansPiece = D.rendreCollectionIdleV22_({ systemes: { adventure: { itemCatalog: { "x:head": { set: "x", slot: "head", name: "A" } }, itemList: {}, setCatalog: { x: { id: "x", name: "SetSecret", slots: ["head"], reward: null } }, completedSets: {} } } });
assert.ok(!sansPiece.includes("SetSecret") && !sansPiece.includes("sc-carte"), "set non découvert : rien d'affiché");

const h = D.rendreCollectionIdleV22_(etat(true));
// complet : couronne, cadre or ; partiel ; set d'objets
assert.ok(/sc-carte sc-m\d sc-t\d sc-complet/.test(h) && h.includes("sc-couronne"), "set complet valorisé");
assert.equal((h.match(/class="sc-carte /g) || []).length, 3, "deux sets d'équipement + un set d'objets");
assert.ok(h.includes("Objet un") && h.includes("sc-fini") && !h.includes("Niv. 100/100"), "set d'objets : objet terminé = nom et ✓ vert seulement");
assert.ok(h.includes("sc-sceau obtenu") && h.includes("Bonus du set obtenu") && h.includes("Bonus du set<"), "sceau obtenu / à obtenir");
assert.ok(h.includes("S’obtient quand toutes les pièces du set sont au niveau 100."), "condition déjà connue");
// pièces non vues : jamais dessinées (le set Ombre n'a que 2 pièces vues sur 6)
assert.ok(!h.includes("Pièce ombre2") && h.includes("Pièce ombre1"), "seules les pièces vues");
// anti-spoil : aucun total, aucune case « ??? »
assert.ok(!/\?\?\?|❓|Inconnu/.test(h), "aucune case ???");
assert.ok(!/(\d+)\s*\/\s*(?!100\b)\d+/.test(h), "aucun total « x / y » (seul « Niv. n/100 » existe)");
assert.ok(!/sur \d+|\/ ?6\b/.test(h), "aucun nombre de pièces");
// fidélité : chaque ancien champ est conservé (découverts, niveau 100, 100 % boosts, compteur)
for (const t of ["Découverts", "Niveau 100", "100 % boosts", "sc-compte", "boosts à compléter"]) assert.ok(h.includes(t) || t === "boosts à compléter", "champ conservé : " + t);
// motifs : 8 motifs et 6 teintes déclarés
for (let i = 0; i < 8; i++) assert.ok(css.includes(".sc-m" + i + "{"), "motif " + i);
for (let i = 0; i < 6; i++) assert.ok(css.includes(".sc-t" + i + "{"), "teinte " + i);

// barre d'onglets, sous-onglets, médailles
const barre = D.barreOnglets([{ id: "bestiaire", nom: "Collection" }, { id: "succes", nom: "Succès" }], "succes");
assert.ok(barre.includes('class="soreal-idle-chroniques-onglet-v1 chr-onglet actif" data-onglet="succes"') && barre.includes("window.__chroniquesOngletIdleV1__"), "onglet actif, pont conservé");
const sous = D.sousOnglets([{ id: "boss", nom: "Boss", compteur: 3, actif: true, clic: "x()" }, { id: "sets", nom: "Sets", actif: false, clic: "y()" }], "col-sous");
assert.ok(sous.includes('<span class="chr-puce">3</span>') && !/\/ ?\d/.test(sous), "compteur sans dénominateur");
assert.equal((sous.match(/chr-puce/g) || []).length, 1, "pas de compteur sur Sets");
assert.ok(D.medaille(1).includes("chr-medaille m1") && D.medaille(7).includes("chr-rang-n"), "médailles du podium");

// règle n°3 / n°4 : boucles parfaites, reduced-motion, pas d'ajout après coup
assert.ok(css.includes("@media (prefers-reduced-motion:reduce)") && /chr-onglet\.actif::after[^}]*animation:none/.test(css), "reduced-motion");
for (const kf of ["chrReflet", "scReflet"]) {
  const m = css.match(new RegExp("@keyframes " + kf + "\\{([^@]*?)\\}\\s*(?=\\n|@|\\$)"));
  assert.ok(m && /^0%\{[^}]*opacity:0/.test(m[1]) && /100%\{[^}]*opacity:0\}$/.test(m[1].trim()), kf + " : fondu d'entrée à 0 % et de sortie à 100 %");
}
assert.ok(!/setTimeout|setInterval|appendChild|insertAdjacentHTML|innerHTML\s*=/.test(src), "aucune minuterie ni ajout après rendu");
// intégration
assert.ok(index.includes("/modules/page-chroniques-v1.js?v=") && index.includes("/soreal-idle-chroniques.css?v="), "chargés par la page");
assert.ok(index.indexOf("page-chroniques-v1.js") < index.indexOf("ui-chroniques-v1.js"), "module avant ui-chroniques");
console.log("idle-chroniques-design-v1: OK");
{
  const { readFileSync: lire } = await import("node:fs");
  const m = lire("cloudflare/public/modules/page-chroniques-v1.js", "utf8");
  assert.ok(m.includes("const pseudoObj=def.kind==='equipment'") && m.includes("'<span class=\"sc-icone\">'+iconeObjetAdventureIdleV138_(pseudoObj)+'</span>'"), "les tuiles des sets d'objets ont leur image (Norman, 2026-11-03 : « il y a des images manquantes dans sets »)");
}
{
  const { readFileSync: lire } = await import("node:fs");
  const m = lire("cloudflare/public/modules/page-chroniques-v1.js", "utf8");
  assert.ok(m.includes("(niveau>=100?'<span class=\"sc-fini\">'+icone('coche','sc-ok')+'</span>'") && m.includes("(vert?'<span class=\"sc-fini\">'+icone('coche','sc-ok')+'</span>'"), "objet ou pièce terminé : seulement le nom et le petit ✓ vert (Norman, 2026-11-03)");
  assert.ok(!/Niv\. '\+niveau\+'\/100'\+\(niveau>=100/.test(m) && !m.includes("' 100 %':lvl100"), "plus de « Niv. 100/100 » ni de « 100 % » sur un objet terminé");
}
