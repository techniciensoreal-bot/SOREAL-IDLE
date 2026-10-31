import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-31) : un bouton « Vérifier les mises à jour » dans les Réglages de l'application Windows. */
const lire = (f) => readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const preload = lire("../../desktop/preload.js"), coeur = lire("../../desktop/coeur.js"), maj = lire("../public/modules/maj-v1.js"), reg = lire("../public/modules/ui-reglages-v1.js");
assert.ok(preload.includes('majVerifier: () => ipcRenderer.invoke("maj:verifier")'), "pont du bouton");
assert.ok(coeur.includes('ipcMain.handle("maj:verifier", async () => verifierMaj())') && coeur.includes("return { ok: Boolean(r.ok), disponible: Boolean(majProposee), code: r.code || \"\" };"), "le cœur renvoie le résultat");
assert.ok(maj.includes("window.__verifierMajIdleV1__=function") && maj.includes("etat.cachee='';") && maj.includes("Ton application est à jour."), "module : vérification, bandeau réaffiché, message à jour");
assert.ok(reg.includes("window.__SOREAL_IDLE_MAJ_V1__.peutVerifier()") && reg.includes("window.__verifierMajIdleV1__(this)"), "bouton montré seulement dans l'application Windows à jour");
const iBloc = reg.indexOf("window.__verifierMajIdleV1__(this)");
assert.ok(iBloc > reg.indexOf("actif==='partie'"), "dans l'onglet Ma partie");
console.log("idle-maj-verifier-bouton-v1: OK");
