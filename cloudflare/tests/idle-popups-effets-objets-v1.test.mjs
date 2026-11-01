import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleAdventureBoostV1, idleAdventureAddItemV1 } from "../src/idle-adventure-v47.js";

/* Norman (2026-11-01) : un popup de validation pour chaque usage d'objet à effet (potions, Wandoos, graine géante, Poop, déblocage, achat actif, palier de boosts) ; jamais pour l'auto. */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const src = lire("public/modules/popup-effet-objet-v1.js");
const dico = JSON.parse(lire("public/modules/traduction-anglais-dict-v1.json"));

const ajoutes = [];
const el = () => ({ className: "", id: "", innerHTML: "", attrs: {}, classList: { contains: () => false }, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {}, parentNode: null });
const doc = { createElement: () => el(), getElementById: (id) => ajoutes.find((x) => x.id === id) || null, head: { appendChild: (x) => ajoutes.push(x) },
  body: { appendChild: (x) => { x.parentNode = { removeChild: (y) => { const i = ajoutes.indexOf(y); if (i >= 0) ajoutes.splice(i, 1); } }; ajoutes.push(x); } } };
const fen = { document: doc, String, Number, Math, Object, isFinite, __SOREAL_IDLE_VALISE_V1__: { potions: [{ id: "energyPotionAlpha", nom: "Potion d’énergie α", img: "energy-potion-alpha" }, { id: "luckyCharm", nom: "Porte-bonheur", img: "lucky-charm" }] } };
fen.window = fen;
vm.runInNewContext(src, fen);
const P = fen.__SOREAL_IDLE_POPUP_EFFET_V1__;
const html = () => (ajoutes.find((x) => x.id === "popup-effet-objet-v1") || {}).innerHTML || "";
const vider = () => { while (P.etat().courant) P.fermer(); };

const ctx = { bosses: 100 };
let s = normalizeIdleNguState({}, ctx, 0);
s.currencies.ap = 1e9;
const agir = (payload) => applyIdleNguAction(s, payload, ctx, 1);

// Potion réelle : achat (rangée, pas de popup) puis usage.
let r = agir({ action: "sellShopBuy", itemId: "energyPotionAlpha" }); s = r.state;
assert.equal(P.construire({ action: "sellShopBuy" }, { resultat: r.result }), null, "potion rangée : pas d'effet immédiat");
r = agir({ action: "usePotion", itemId: "energyPotionAlpha" }); s = r.state;
assert.equal(r.result.effet.sec, 3600); assert.equal(r.result.effet.restant, 3600); assert.ok(r.result.effet.facteur >= 2);
assert.equal(P.apres({ action: "usePotion", itemId: "energyPotionAlpha" }, { resultat: r.result }), true);
let h = html();
assert.ok(h.includes("Potion d’énergie α") && h.includes("×2") && h.includes("1 h") && h.includes("OK"), h);
vider();
// Même objet deux fois = un seul popup.
P.apres({ action: "usePotion" }, { resultat: r.result }); P.apres({ action: "usePotion" }, { resultat: r.result });
assert.ok(html().includes("×2") && html().includes("Utilisations") && P.etat().file.length === 0); vider();

// Achat à effet immédiat : Beast Butter.
r = agir({ action: "sellShopBuy", itemId: "beastButter1" }); s = r.state;
assert.equal(r.result.effet.butters, 1); assert.ok(r.result.nom);
P.apres({ action: "sellShopBuy" }, { resultat: r.result });
assert.ok(html().includes("Beast Butter en réserve") && html().includes("Objet activé")); vider();

// Wandoos (réponse réelle) et graine géante.
s.adventure.unlockFlags.wandoos = true; s = normalizeIdleNguState(s, ctx, 1);
s = agir({ action: "adventure", adventure: { action: "addItem", definitionId: "wandoos98", level: 5 } }).state;
const copie = s.adventure.inventory.find((x) => x.definitionId === "wandoos98");
r = agir({ action: "consumeWandoosCopy", itemId: copie.id }); s = r.state;
assert.equal(r.result.osAvant, 0); assert.equal(r.result.osLevel, 1);
P.apres({ action: "consumeWandoosCopy" }, { resultat: r.result });
h = html(); assert.ok(h.includes("0 → 1") && h.includes("Wandoos 98") && h.includes("Niveau restant sur la copie")); vider();
s.systems.yggdrasil.unlocked = true;
s = agir({ action: "adventure", adventure: { action: "addItem", definitionId: "giantSeed", level: 50 } }).state;
r = agir({ action: "consumeGiantSeed", itemId: s.adventure.inventory.find((x) => x.definitionId === "giantSeed").id });
P.apres({ action: "consumeGiantSeed" }, { resultat: r.result });
assert.ok(html().includes("+75") && html().includes("Graine géante utilisée")); vider();

// Palier de boosts réel : fusion volontaire à 100 -> boostPalier ; sans palier rien.
{
  let t = normalizeIdleNguState({}, ctx, 0);
  const a = idleAdventureBoostV1("power", 1), b = idleAdventureBoostV1("power", 1);
  a.level = 49; b.level = 50;
  idleAdventureAddItemV1(t.adventure, a); idleAdventureAddItemV1(t.adventure, b);
  const m = applyIdleNguAction(t, { action: "adventure", adventure: { action: "merge", a: a.id, b: b.id } }, ctx, 1);
  assert.deepEqual(m.result.boostPalier, { niveaux: 1, gainPct: 2, totalPct: 2 });
  P.apres({ action: "adventure", adventure: { action: "merge" } }, { resultat: m.result });
  h = html(); assert.ok(h.includes("Boost au niveau 100") && h.includes("+2 %"), h); vider();
  const n = applyIdleNguAction(m.state, { action: "adventure", adventure: { action: "selectZone", zone: "safe" } }, ctx, 2);
  assert.equal(n.result.boostPalier, undefined, "pas de palier sans nouveau boost maxé");
}
// Rien à annoncer : actions sans effet, auto, objet inconnu.
for (const p of [{ action: "sync" }, { action: "inventoryAuto", mode: "settings" }, { action: "usePotion" }]) assert.equal(P.apres(p, { resultat: { autoMerge: true } }), false);
// Anti-spoil : aucun total x / y ni nom d'autre objet.
assert.ok(!/\d+\s*\/\s*\d+/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "pas de total x / y");
// Poop : factor renvoyé et popup.
assert.ok(lire("src/idle-ngu-systemes.js").includes("factor:poop.factor"));
P.apres({ action: "useYggFruit" }, { resultat: { poop: { consumed: true, free: false, remaining: 4, factor: 1.5 } } });
assert.ok(html().includes("×1,5") && html().includes("Poop restantes")); vider();
// Déblocage.
P.apres({ action: "adventure", adventure: { action: "useUnlockItem" } }, { resultat: { flag: "ngu" } });
assert.ok(html().includes("NGU") && html().includes("Nouveau système débloqué")); vider();
// Textes fixes traduits.
const fixes = [...src.matchAll(/\['([^'\]]+)','t'\]|titre:'([^']+)'|rows\.push\(\['([^']+)'|nom:xl\?'([^']+)':'([^']+)'/g)].flatMap((m) => m.slice(1).filter(Boolean));
assert.ok(fixes.length > 25);
for (const t of fixes) assert.ok(dico[t] !== undefined || !/[À-ÿ]|\s[a-z]{3,}/.test(t), "dictionnaire anglais : " + t);
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes("/modules/popup-effet-objet-v1.js?v="));
assert.ok(lire("public/modules/meta-progression-v130.js").includes("__SOREAL_IDLE_POPUP_EFFET_V1__") && lire("public/modules/ui-inventaire-v1.js").includes("__SOREAL_IDLE_POPUP_EFFET_V1__"));
console.log("idle-popups-effets-objets-v1: OK");
