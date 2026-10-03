import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-03) : (1) « les fenêtres popup s'ouvrent trop vite au passage de la souris : une demi-seconde » ; (2) « dans le coffre, on doit pouvoir taper une recherche (ex. Magic power) : le filtre ne
 * montre que les items avec du Magic Power dans leurs stats ; ça marche aussi pour les noms d'items ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// --- 1. Popup au survol : 500 ms, annulé si la souris quitte l'objet, jamais deux popups ---
assert.ok(ui.includes("const IDLE_SURVOL_DELAI_OUVERTURE_MS_V1=500;"));
assert.ok(ui.includes("},IDLE_SURVOL_DELAI_OUVERTURE_MS_V1);"), "ouverture différée");
assert.ok(ui.includes("if(id===idleSurvolEnAttenteIdV1)return;"), "même objet : le délai court déjà, pas de redémarrage à chaque mouvement");
assert.ok(ui.includes("/* La souris a quitté l'objet avant la fin du délai : rien ne s'ouvre. */\n        annulerOuvertureSurvolIdleV1_();") || ui.includes("rien ne s'ouvre. */\r\n        annulerOuvertureSurvolIdleV1_();"), "délai annulé quand la souris part");
assert.ok((ui.match(/annulerOuvertureSurvolIdleV1_\(\);/g) || []).length >= 5, "annulé aussi à la sortie de la fenêtre, au clic (glisser) et sur le popup");

// --- 2. Recherche du coffre : logique réelle extraite du jeu ---
const debut = ui.indexOf("let idleRechercheCoffreV1='';");
const fin = ui.indexOf("/* Tape dans la recherche");
const types = ui.slice(ui.indexOf("const IDLE_SPECIAL_BONUS_TYPES_V1_=["), ui.indexOf("function rendreBonusEquipementAdventureIdleV1_"));
const bac = {};
vm.runInNewContext(types + "\n" + ui.slice(debut, fin) + "\nthis.f={caseCoffreCorrespondIdleV1_,intitulesStatsCoffreIdleV1_,normaliserRechercheIdleV1_};", Object.assign(bac, {
  idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; }
}));
const { caseCoffreCorrespondIdleV1_: ok, normaliserRechercheIdleV1_: norm, intitulesStatsCoffreIdleV1_: intitules } = bac.f;
const q = (t) => norm(t);

const casque = { name: "Casque du Roi", setName: "Roi", groupeNom: "Palais", occupe: true, item: { basePower: 10, baseToughness: 8, specialsAll: [{ type: "magicPowerPct", value: 5, max: 5 }, { type: "energyCapPct", value: 3, max: 3 }] } };
const bague = { name: "Bague simple", groupeNom: "Palais", occupe: true, item: { basePower: 0, baseToughness: 0, baseSpecial: 4, specialType: "magicCapPct", special: 4 } };
const botte = { name: "Botte agile", groupeNom: "Forêt", occupe: true, item: { basePower: 6, baseToughness: 0, specialType: "energySpeedPct", baseSpecial: 2, special: 2 } };
const videCase = { name: "Épée du Roi", groupeNom: "Palais", occupe: false, item: null };

// « Magic Power » : seulement les objets qui ont ce Special (pas Magic Cap, pas Energy Power).
assert.equal(ok(casque, q("Magic power")), true);
assert.equal(ok(bague, q("Magic power")), false, "Magic Cap + Puissance ne suffisent pas : la phrase entière doit se trouver dans UN intitulé");
assert.equal(ok(botte, q("magic power")), false);
assert.equal(ok(videCase, q("magic power")), false, "une case vide n'a pas de stats");
// Casse et accents ignorés ; recherche partielle.
assert.equal(ok(casque, q("  MAGIC   POWER ")), true);
assert.equal(ok(casque, q("cap")), true, "« cap » trouve Energy Cap");
// Noms d'items (et set / zone).
assert.equal(ok(videCase, q("épée")), true);
assert.equal(ok(videCase, q("epee")), true, "sans accent");
assert.equal(ok(casque, q("palais")), true, "nom de zone / groupe");
assert.equal(ok(botte, q("palais")), false);
assert.equal(ok(casque, q("roi")), true);
// Statistiques de base (français et anglais) : Power <-> Puissance / PV Max, Toughness <-> Endurance / Regen.
assert.equal(ok(botte, q("puissance")), true);
assert.equal(ok(botte, q("toughness")), false, "pas de Toughness sur cette botte");
assert.equal(ok(casque, q("endurance")), true);
assert.equal(ok(casque, q("regen")), true);
assert.equal(JSON.stringify(intitules(bague.item)), JSON.stringify(["Magic Cap"]));
// Recherche vide : tout passe.
assert.equal(ok(videCase, ""), true);

// --- 3. Intégration : champ de recherche dans le coffre, grille seule redessinée, pagination sur la liste filtrée ---
assert.ok(ui.includes('id="sorealIdleCoffreRechercheV1"') && ui.includes('oninput="window.__rechercheCoffreV1__(this.value)"'));
assert.ok(ui.includes('<div id="sorealIdleCoffreGrilleV1">'), "seule la grille est redessinée : le champ garde le focus");
assert.ok(ui.includes("if(requete)slots=slots.filter(function(s){return caseCoffreCorrespondIdleV1_(s,requete);});") && ui.indexOf("const totalPagesCoffre=Math.max(1,Math.ceil(slots.length/IDLE_PAGINATION_TAILLE_V1));", ui.indexOf("function grilleCoffreAdventureIdleV1_")) > ui.indexOf("caseCoffreCorrespondIdleV1_(s,requete)", ui.indexOf("function grilleCoffreAdventureIdleV1_")), "la pagination porte sur la liste filtrée");
assert.ok(ui.includes("idlePageCoffreV1=1;\n        const conteneur") || ui.includes("idlePageCoffreV1=1;\r\n        const conteneur"), "retour à la page 1 à chaque frappe");
assert.ok(ui.includes("Aucun objet du coffre ne correspond à"));
assert.ok(css.includes(".soreal-idle-coffre-recherche-v1"));
// Anti-spoil : seules les cases découvertes sont filtrées et affichées.
assert.ok(ui.slice(ui.indexOf("function grilleCoffreAdventureIdleV1_"), ui.indexOf("function grilleCoffreAdventureIdleV1_") + 200).includes("s.decouvert"));
console.log("idle-coffre-recherche-et-survol-v1 OK");
