import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Copie « confirmée » de l'Aventure (plan C4, 2026-11-06) : une copie profonde de 158 Ko était refaite à CHAQUE réponse du moteur (~10 ms de fil principal sur PC, ~25 ms sur téléphone) pour une copie lue dans de
 * rares cas (retour arrière d'une mutation d'inventaire, état différé). L'instantané est désormais un TEXTE relu en objet à la première lecture. Même contenu, même comportement pour les lecteurs.
 */
const ui = fs.readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const inv = fs.readFileSync("cloudflare/public/modules/ui-inventaire-v1.js", "utf8");
const av = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");

/* 1. aucune écriture directe par copie profonde ne reste (elles passent toutes par l'instantané) */
assert.equal((inv + av).match(/REG\.idleInventoryConfirmedAdventureV160=\s*cloneInventaireIdleV160_/g).length, 1, "une seule copie profonde reste : le repli de memoriserConfirmeeAdventureIdleV160_ (texte impossible)");
assert.ok(/catch\(_e\)\{REG\.idleInventoryConfirmedAdventureV160=cloneInventaireIdleV160_\(valeur\);\}/.test(inv), "le repli est bien dans le catch");
assert.equal((inv.match(/memoriserConfirmeeAdventureIdleV160_\(/g) || []).length >= 4, true, "trois sites d'ui-inventaire + la définition");
assert.ok(/memoriserConfirmeeAdventureIdleV160_\(differee\)/.test(av), "état différé : instantané");
assert.ok(/memoriserConfirmeeAdventureIdleV160_:memoriserConfirmeeAdventureIdleV160_/.test(inv), "exposée aux autres modules");

/* 2. comportement de l'accesseur : on exécute la vraie définition dans un contexte isolé */
const debut = ui.indexOf("Object.defineProperty(UI_PARTAGE_V1,'idleInventoryConfirmedAdventureV160'");
const fin = ui.indexOf("Object.defineProperty(UI_PARTAGE_V1,'idleInventoryDeferredPatchV160'");
assert.ok(debut > 0 && fin > debut, "définition trouvée");
const bloc = ui.slice(debut, fin);
const ctx = { UI_PARTAGE_V1: {}, Object, JSON };
vm.createContext(ctx);
vm.runInContext("let idleInventoryConfirmedAdventureV160=null;let idleInventoryConfirmedTexteV160=null;" + bloc + ";this.P=UI_PARTAGE_V1;", ctx);
const P = ctx.P;
assert.equal(P.idleInventoryConfirmedAdventureV160, null, "au départ : rien");
const etat = { revision: 7, inventory: [{ id: "a", niveau: 3, stats: { x: 1.5 } }], fight: { active: false }, vide: null };
P.idleInventoryConfirmedTexteV160 = JSON.stringify(etat);
const lu = P.idleInventoryConfirmedAdventureV160;
assert.deepEqual(JSON.parse(JSON.stringify(lu)), etat, "relue à l'identique");
assert.notEqual(lu, etat, "c'est une copie : la modifier ne touche pas l'original");
lu.inventory.push({ id: "b" });
assert.equal(etat.inventory.length, 1);
assert.equal(P.idleInventoryConfirmedAdventureV160, lu, "relue une seule fois : le même objet ensuite");
/* une écriture directe annule l'instantané en attente */
P.idleInventoryConfirmedTexteV160 = JSON.stringify({ revision: 1 });
P.idleInventoryConfirmedAdventureV160 = { revision: 2 };
assert.equal(P.idleInventoryConfirmedAdventureV160.revision, 2, "un objet écrit directement l'emporte");
/* un instantané en attente remplace l'objet précédent */
P.idleInventoryConfirmedTexteV160 = JSON.stringify({ revision: 3 });
assert.equal(P.idleInventoryConfirmedAdventureV160.revision, 3, "le dernier instantané l'emporte");
P.idleInventoryConfirmedAdventureV160 = null;
assert.equal(P.idleInventoryConfirmedAdventureV160, null, "remise à zéro");
console.log("idle-copie-confirmee-paresseuse-v1: OK");
