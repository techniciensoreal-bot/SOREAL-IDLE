import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Menu Admin « EXP des joueurs » (Norman, 2026-10-08 : « un bouton dans le menu admin », pas de commande à recopier dans la console).
 */
const src = readFileSync("cloudflare/public/modules/credit-exp-admin-v1.js", "utf8");
const fenetre = {};
vm.runInNewContext(src, { window: fenetre, document: {}, localStorage: { getItem() { return null; }, setItem() {} } });
const M = fenetre.__SOREAL_IDLE_CREDIT_EXP_V1__;
assert.ok(M && typeof M.ouvrir === "function" && typeof M.pageHtml === "function");
assert.ok(M.pageHtml().includes("Donner de l’EXP / journal") && M.pageHtml().includes("__SOREAL_IDLE_CREDIT_EXP_V1__.ouvrir()"));
assert.equal(M.libelle("crediterExpAdminSorealIdle:set-cave"), "🎁 Crédit de l’administrateur (set-cave)");
assert.equal(M.libelle("crediterExpAdminSorealIdle:admin-1791445841000"), "🎁 Crédit de l’administrateur (manuel)");

// Confirmation en deux temps, référence propre à chaque ouverture, appels des deux opérations d'admin
assert.ok(src.includes("bDonner.classList.contains('arme')") && src.includes("'Confirmer : +'"), "premier clic : confirmation");
assert.ok(src.includes("var reference='admin-'+Date.now();"), "une référence par ouverture : pas de double crédit");
assert.ok(src.includes("'crediterExpAdminSorealIdle'") && src.includes("'lireGainsExpAdminSorealIdle'"));

// Branchement : carte dans le menu Admin, script chargé avant lui
const admin = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
assert.ok(admin.includes("window.__SOREAL_IDLE_CREDIT_EXP_V1__.pageHtml()"));
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.indexOf("credit-exp-admin-v1.js?v=1") > 0 && index.indexOf("credit-exp-admin-v1.js") < index.indexOf("admin-histoires-v1.js"));

// Serveur : joueur désigné par prénom OU adresse, jamais sans correspondance unique
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(rt.includes("function trouverJoueurAdminSorealIdle_(") && rt.includes("JOUEUR_AMBIGU"));
console.log("idle-credit-exp-admin-ui-v1: OK");
