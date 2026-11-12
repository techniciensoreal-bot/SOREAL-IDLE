import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";
import { applyIdleInventoryAutoActionV1, idleInventoryAutoSnapshotV1, normalizeIdleInventoryAutoV1 } from "../src/idle-inventory-auto-v1.js";

/*
 * Norman (2026-11-12) : les configurations d'équipement sont dans la zone du sac, chacune avec un DESSIN au choix sur son bouton (une pièce d'or pour un set Or, puissance magique, puissance énergie, plafond magie,
 * plafond énergie...) : on doit reconnaître ce que fait le set juste avec l'image. Le serveur ne garde que l'identifiant du dessin ; le catalogue (modules/inventory-configs-v1.js) couvre les 29 types d’effets du jeu.
 */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const adv = () => { const s = createIdleAdventureStateV47(); s.inventoryAuto = normalizeIdleInventoryAutoV1(null); return s; };
const addItem = (s, definitionId, level = 0) => { const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {}); Object.assign(s, r.state); return s.inventory.find((x) => x.id === r.result.id); };
const equip = (s, id, slot) => Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id, slot }, {}).state);
const env = { loadoutSlots: 3 };

// 1. Serveur : le dessin est un identifiant court, jamais du texte libre ; il suit la configuration (réenregistrer, décaler).
{
  const s = adv();
  equip(s, addItem(s, "sewers:weapon").id, "weapon");
  const st = { adventure: s };
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
  assert.equal(applyIdleInventoryAutoActionV1(st, { mode: "loadoutIcon", index: 0, icon: "Magie-Puissance" }, env).icon, "magie-puissance", "identifiant en minuscules");
  assert.equal(applyIdleInventoryAutoActionV1(st, { mode: "loadoutIcon", index: 0, icon: "<img src=x onerror=1>" }, env).icon, "", "du texte libre est refusé");
  assert.equal(applyIdleInventoryAutoActionV1(st, { mode: "loadoutIcon", index: 0, icon: "x".repeat(40) }, env).icon, "", "au plus 32 caractères");
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutIcon", index: 0, icon: "or" }, env);
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
  assert.equal(normalizeIdleInventoryAutoV1(st.adventure.inventoryAuto).loadouts[0].icon, "or", "réenregistrer garde le dessin");
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutMove", index: 0, direction: 1 }, env);
  const snap = idleInventoryAutoSnapshotV1(st.adventure, env);
  assert.equal(snap.loadouts[1].icon, "or", "le dessin suit la configuration quand on la décale");
  assert.ok(!snap.loadouts[0] || !snap.loadouts[0].icon, "l'emplacement laissé n'a plus de dessin");
  assert.throws(() => applyIdleInventoryAutoActionV1(st, { mode: "loadoutIcon", index: 3, icon: "or" }, env), /LOADOUT_VERROUILLE/, "emplacement non débloqué : refusé");
  // un dessin sur une configuration VIDE ne la rend pas équipable
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutIcon", index: 2, icon: "exp" }, env);
  assert.throws(() => applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 2 }, env), /LOADOUT_VIDE/);
}

// 2. Client : le vrai module sur un faux navigateur.
const window = {};
vm.runInNewContext(lire("public/modules/inventory-configs-v1.js"), { window, document: { addEventListener() {}, getElementById: () => null }, setTimeout: () => 0 });
const C = window.__SOREAL_IDLE_INV_CONFIGS_V1__;
assert.ok(C && typeof C.bande === "function" && typeof C.catalogue === "function", "module chargé");
const jeu = (systems, extra = {}) => ({ systemes: Object.assign({ systems: systems.map((id) => ({ id })), ressourcesDecouvertes: { energy: true, magic: true }, adventure: { equipment: {} }, inventoryAuto: { loadoutSlots: 0, loadouts: [] } }, extra) });
const ids = (j, choisi) => C.catalogue(j, choisi).map((d) => d.id);

// 2a. Anti-spoil (règle n°2) : seuls les dessins des effets déjà découverts sont proposés.
{
  const debut = ids(jeu([]));
  for (const id of ["puissance", "endurance", "pv", "energie-puissance", "energie-plafond", "magie-puissance", "magie-plafond", "or", "butin", "exp", "ap"]) assert.ok(debut.includes(id), "toujours proposé : " + id);
  for (const id of ["wandoos-vitesse", "hack-vitesse", "voeu-vitesse", "ngu-vitesse", "barbe-vitesse", "graine", "arbre", "augment-vitesse", "cuisine", "garderie", "quetes", "entrainement", "r3-puissance"]) assert.ok(!debut.includes(id), "pas encore découvert : " + id);
  assert.ok(ids(jeu(["wandoos"])).includes("wandoos-vitesse"), "Wandoos débloqué : son dessin apparaît");
  assert.ok(!ids(jeu(["wandoos"])).includes("hack-vitesse"), "seulement celui-là");
  assert.ok(ids(jeu(["hacks", "wishes", "ngu", "beards", "yggdrasil", "augmentations", "cooking"])).includes("graine"), "Yggdrasil : graines");
  assert.ok(ids(jeu([]), "hack-vitesse").includes("hack-vitesse"), "un dessin déjà choisi n'est jamais retiré");
  assert.ok(!ids(jeu([], { ressourcesDecouvertes: { energy: true } })).includes("magie-puissance"), "Magie non découverte : pas de dessin de Magie");
  assert.ok(ids(jeu([], { r3NomDisponible: true })).includes("r3-plafond"), "Ressource 3 découverte : ses dessins apparaissent");
}

// 2b. La bande n'existe que si au moins un emplacement est débloqué ; aucun total (« x / y »), aucun cadenas.
{
  assert.equal(C.bande(jeu([])), "", "aucun emplacement : rien");
  const j = jeu([], { inventoryAuto: { loadoutSlots: 3, loadouts: [{ name: "Or", icon: "or", vide: false, items: [{ id: "a", name: "A" }], total: { power: 12 } }, null, null] } });
  const html = C.bande(j);
  assert.equal((html.match(/class="ic-cfg/g) || []).length, 3, "un bouton par emplacement débloqué, pas un de plus");
  assert.ok(html.includes("Équiper : Or") && html.includes("Modifier la configuration 1"), "boutons accessibles");
  assert.ok(!/\d+\s*\/\s*\d+|🔒|verrouill/i.test(html), "aucun total révélateur ni cadenas");
  assert.ok(html.includes("<svg"), "le dessin est affiché sur le bouton");
}

// 2b'. Bloc FERMÉ (Norman, 2026-11-12) : une ligne fine, une petite icône par configuration, UN seul « + », rien d'autre (ni nom, ni crayon, ni numéro).
{
  const j = jeu([], { inventoryAuto: { loadoutSlots: 5, loadouts: [{ name: "Or", icon: "or", vide: false, items: [{ id: "a", name: "A" }], total: null }, { name: "Magie", icon: "magie-puissance", vide: false, items: [{ id: "b", name: "B" }], total: null }, null, null, null] } });
  const m = C.mini(j);
  assert.equal((m.match(/ic-mini-bt/g) || []).length, 3, "deux icônes + un seul « + » (même avec trois emplacements libres)");
  assert.equal((m.match(/>\+</g) || []).length, 1, "un seul « + »");
  assert.ok(!/ic-crayon|ic-num|ic-nom/.test(m), "ni crayon, ni numéro, ni nom sur la ligne fine");
  assert.equal(C.mini(jeu([])), "", "aucun emplacement : rien");
  const auto = lire("public/modules/inventory-auto-v1.js");
  assert.ok(auto.includes("soreal_idle_inv_zone_ouverte_v1") && /function zoneOuverte_\(\)\{try\{return localStorage\.getItem\(CLE_ZONE\)==='1'/.test(auto), "préférence de compte (clé soreal_idle_), FERMÉ par défaut");
  assert.ok(auto.includes("if(compact)return contenu;"), "mode compact : cases seules, ni minuteur ni aide");
}

// 2c. Tout texte venu du joueur est échappé (nom de la configuration, noms de pièces).
{
  const j = jeu([], { inventoryAuto: { loadoutSlots: 1, loadouts: [{ name: "<b>x</b>\"", icon: "or", vide: false, items: [{ id: "a", name: "<i>y</i>" }], total: null }] } });
  const html = C.bande(j);
  assert.ok(!html.includes("<b>x</b>") && !html.includes("<i>y</i>"), "pas de HTML injecté");
}

// 2d. Les 29 types d’effets du jeu (IDLE_SPECIAL_BONUS_TYPES_V1_) ont chacun un dessin reconnaissable.
{
  const ui = lire("public/soreal-idle-ui.js");
  const bloc = ui.slice(ui.indexOf("const IDLE_SPECIAL_BONUS_TYPES_V1_=["), ui.indexOf("];", ui.indexOf("const IDLE_SPECIAL_BONUS_TYPES_V1_=[")));
  const effets = [...bloc.matchAll(/\["(\w+Pct)","/g)].map((m) => m[1]);
  assert.equal(effets.length, 29, "29 types d’effets d’objets");
  const dessin = {
    energySpeedPct: "energie-vitesse", energyPowerPct: "energie-puissance", energyCapPct: "energie-plafond", energyBarsPct: "energie-barres",
    magicSpeedPct: "magie-vitesse", magicPowerPct: "magie-puissance", magicCapPct: "magie-plafond", magicBarsPct: "magie-barres",
    dropChancePct: "butin", goldDropsPct: "or", beardSpeedPct: "barbe-vitesse", nguSpeedPct: "ngu-vitesse", seedGainPct: "graine",
    r3PowerPct: "r3-puissance", r3CapPct: "r3-plafond", r3BarsPct: "r3-barres", wishSpeedPct: "voeu-vitesse", hackSpeedPct: "hack-vitesse",
    wandoosSpeedPct: "wandoos-vitesse", respawnReductionPct: "repousse", yggdrasilYieldPct: "arbre", augmentSpeedPct: "augment-vitesse",
    cookingPct: "cuisine", questDropsPct: "quetes", moveCooldownPct: "recharge", advancedTrainingPct: "entrainement", daycareSpeedPct: "garderie",
    expPct: "exp", apPct: "ap"
  };
  const connus = new Set(C.CATALOGUE.map((d) => d[0]));
  for (const e of effets) { assert.ok(dessin[e], "effet sans dessin prévu : " + e); assert.ok(connus.has(dessin[e]), "dessin absent du catalogue : " + dessin[e]); }
  // identifiants uniques, chaque dessin se fabrique, deux dessins ne sont jamais identiques
  assert.equal(connus.size, C.CATALOGUE.length, "identifiants uniques");
  const vus = new Set();
  for (const d of C.CATALOGUE) { const s = C.svg(d[0]); assert.ok(s.startsWith("<svg") && s.includes("</svg>"), d[0]); assert.ok(!vus.has(s), "deux dessins identiques : " + d[0]); vus.add(s); }
}

// 3. Les explications d'Auto Merge sont consultables dans la Boutique EXP (bouton « i ») et ne sont plus dans le panneau.
{
  const w = {};
  vm.runInNewContext(lire("public/modules/boutique-info-i-v1.js"), { window: w });
  const T = w.__SOREAL_IDLE_BOUTIQUE_INFO_I_V1__.TEXTES;
  assert.ok(/équipés passent d’abord/.test(T.autoMerge) && /protégés/.test(T.autoMerge), "priorité et objets protégés expliqués dans la boutique");
  assert.ok(!/Auto Boost/.test(T.autoMerge), "l'info d'Auto Merge ne parle pas d'Auto Boost (anti-spoil : il se débloque ailleurs)");
  assert.ok(/contour bleu/.test(T.inventoryMergeSlot), "cases d'automerge expliquées dans la boutique");
  const auto = lire("public/modules/inventory-auto-v1.js");
  const panneau = auto.slice(auto.indexOf("  function panneau(j){"), auto.indexOf("  function style(){"));
  assert.ok(!/passent d’abord|Les premières cases du sac|Désactivé : un boost recyclé/.test(panneau), "plus d'explication de ces achats dans le panneau");
}
console.log("idle-inventory-configs-dessins-v1 : OK");
