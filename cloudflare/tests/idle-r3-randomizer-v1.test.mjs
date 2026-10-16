import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import { IDLE_NGU_META_VERSION, IDLE_NGU_SAVE_SCHEMA, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_R3_NOMS_V1, IDLE_R3_NOMS_EXCLUS_V1 } from "../src/idle-r3-names-v1.js";
import { idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Resource 3 Name Randomizer (Boutique AP, 100 000 AP ; wiki NGU Idle, page « Resource 3 Name Randomizer » : « a pool of over 200 names ») : réglage à cocher, nouveau nom à chaque Rebirth (nouveau run), noms de la liste du wiki
 * sans les noms trop crus (Norman, 2026-10-12).
 */
assert.equal(idleSelloutShopEffectActiveV1("resource3NameRandomizer"), true, "achetable");
assert.ok(IDLE_R3_NOMS_V1.length > 200, "plus de 200 noms (" + IDLE_R3_NOMS_V1.length + ")");
assert.equal(new Set(IDLE_R3_NOMS_V1).size, IDLE_R3_NOMS_V1.length, "sans doublon");
for (const exclu of IDLE_R3_NOMS_EXCLUS_V1) assert.ok(!IDLE_R3_NOMS_V1.includes(exclu), "écarté : " + exclu);
for (const gentil of ["Banana", "Doge", "Resource Three", "Wizard", "Steamed Hams", "Kitty"]) assert.ok(IDLE_R3_NOMS_V1.includes(gentil), "nom du wiki conservé : " + gentil);
const idx = (nom) => IDLE_R3_NOMS_V1.indexOf(nom);
assert.equal(idx("Orgy"), -1);
assert.equal(idx("Butt"), -1);

const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
const base = (achete, run) => ({
  version: IDLE_NGU_META_VERSION,
  saveSchema: IDLE_NGU_SAVE_SCHEMA,
  systems: { tower: { unlocked: false, active: false, data: {} } },
  currencies: { pp: 0, ap: 0 },
  runStartedAt: run,
  selloutShop: { purchases: achete ? { resource3NameRandomizer: 1 } : {}, unlockedEver: true }
});
// sans l'achat : réglage refusé, aucun nom
assert.throws(() => applyIdleNguAction(base(false, 1000), { action: "setR3NomAleatoire", enabled: true }, ctx, 2000), /ACHAT_REQUIS/);
// avec l'achat : cocher tire un nom du pool
let st = applyIdleNguAction(base(true, 1000), { action: "setR3NomAleatoire", enabled: true }, ctx, 2000).state;
const nom1 = st.r3Nom.nom;
assert.ok(IDLE_R3_NOMS_V1.includes(nom1) && st.r3Nom.actif, "nom tiré : " + nom1);
// même run : le nom ne change pas
st = advanceIdleNguState(st, 5, ctx, 3000);
assert.equal(st.r3Nom.nom, nom1, "même run, même nom");
// nouveau run (Rebirth) : un autre nom
let different = false;
for (let i = 0; i < 5 && !different; i++) {
  st.runStartedAt = 5000 + i * 1000;
  st = advanceIdleNguState(st, 5, ctx, 9000 + i * 1000);
  different = st.r3Nom.nom !== nom1;
}
assert.ok(different && IDLE_R3_NOMS_V1.includes(st.r3Nom.nom), "nouveau Rebirth, nouveau nom : " + st.r3Nom.nom);
// décocher efface le nom
st = applyIdleNguAction(st, { action: "setR3NomAleatoire", enabled: false }, ctx, 20000).state;
assert.equal(st.r3Nom.actif, false);
assert.equal(st.r3Nom.nom, "");
// l'état envoyé au joueur : nom seulement si coché
const srv = lireSrc("idle-ngu-progression.js");
assert.ok(srv.includes("r3NomDisponible: Boolean(state.selloutShop?.purchases?.resource3NameRandomizer)") && srv.includes("r3Nom: state.r3Nom?.actif && state.selloutShop?.purchases?.resource3NameRandomizer"), "état envoyé");
const ui = lireUiComplet();
assert.ok(ui.includes("window.__SOREAL_IDLE_PERSO_PCT_V1__.blocReglageR3()") && ui.includes("nomR3()"), "réglage dans Settings, nom dans le bandeau");
const alloc = readFileSync("cloudflare/public/modules/barre-allocation-v1.js", "utf8");
assert.ok(alloc.includes("function titre_(res)") && alloc.includes("var t=titre_(res);"), "titres des cadres d'allocation");
console.log("idle-r3-randomizer-v1: OK");
