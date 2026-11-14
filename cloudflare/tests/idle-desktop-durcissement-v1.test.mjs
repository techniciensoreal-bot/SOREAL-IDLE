import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Audit 2026-11-14 (exe) : manifeste de mise à jour sans « \ » ni « : » dans les clés de médias et daté, médias écartés jamais comptés parmi les retirés, appels IPC refusés sans adresse d'origine. */
const maj = readFileSync(new URL("../../desktop/src/maj.mjs", import.meta.url), "utf8");
const coeur = readFileSync(new URL("../../desktop/coeur.js", import.meta.url), "utf8");
assert.ok(maj.includes('!/[\\:]/.test(x[0])'), "clés sans \ ni :");
assert.ok(maj.includes('typeof m.date === "string" && Number.isFinite(Date.parse(m.date))'), "manifeste daté exigé (anti-retour)");
assert.ok(maj.includes("calculerRetirees(manifeste, etat).filter((k) => !ecartes.includes(k))") && maj.includes("simultanes = 4, ecartes = []"), "médias écartés non retirés");
assert.ok(/progression: \(p\) => envoyerPage\("maj:progression", p\), ecartes/.test(coeur), "la liste des écartés est transmise à l'installation");
assert.ok(coeur.includes('if (!u || !String(u).startsWith("app://soreal/")) return { ok: false, code: "ORIGINE_REFUSEE" };'), "IPC : origine obligatoire");
const { verifierMaj } = await import("../../desktop/src/maj.mjs");
assert.equal(typeof verifierMaj, "function");
console.log("idle-desktop-durcissement-v1 : OK");
