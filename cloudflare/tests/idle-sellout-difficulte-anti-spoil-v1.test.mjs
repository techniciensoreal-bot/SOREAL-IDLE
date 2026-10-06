import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

/*
 * Anti-spoil (AGENTS.md règle n°2) : trouvé en jouant sur la partie B : la boutique AP proposait « Un emplacement d'accessoire maléfique » (« bloqué tant que tu n'es pas en difficulté Maléfique ») à un joueur en Normal :
 * achat refusé (DIFFICULTE_REQUISE) et existence de la difficulté révélée. Un achat réservé à une difficulté supérieure n'apparaît pas en Normal, sauf s'il a déjà été acheté.
 */
const B = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-ngu-progression.js").href);
const ctx = { bosses: 140 };
const t0 = 1_800_000_000_000;
const vue = (s) => B.idleNguSnapshot(s, ctx, t0).selloutShop.catalog.find((x) => x.id === "extraAccessorySlotEvil");

let s = B.normalizeIdleNguState({}, ctx, t0);
assert.equal(s.difficulty || "normal", "normal");
assert.deepEqual(B.idleNguSnapshot(s, ctx, t0).selloutShop.catalog, [], "boutique pas encore ouverte : aucun catalogue envoyé");
s.selloutShop.unlockedEver = true;
assert.equal(vue(s), undefined, "Normal : l'achat maléfique n'est même pas envoyé");
assert.ok(B.idleNguSnapshot(s, ctx, t0).selloutShop.catalog.filter((x) => x.effectActive === true).length > 10, "les autres achats restent visibles");

s.selloutShop.purchases.extraAccessorySlotEvil = 1;
assert.equal(vue(s).effectActive, true, "déjà acheté : il reste visible (ce qui est acheté est conservé)");

s = B.normalizeIdleNguState({}, ctx, t0);
s.selloutShop.unlockedEver = true;
s.difficulty = "difficile";
assert.equal(vue(s).effectActive, true, "Maléfique : l'achat apparaît");
console.log("idle-sellout-difficulte-anti-spoil-v1: OK");
