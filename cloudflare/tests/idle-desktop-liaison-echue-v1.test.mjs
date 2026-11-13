import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-11-13) : liaison échue = plus de session = « La connexion directe n'est pas encore ouverte » à chaque lancement de l'exe. Une liaison échue ne remplace jamais la session locale. */
const s = readFileSync(new URL("../../desktop/coeur.js", import.meta.url), "utf8");
assert.ok(s.includes("const liaisonPerimee = Boolean(liaison.lie && Number(liaison.expire) > 0 && Number(liaison.expire) <= Date.now());"), "liaison échue détectée");
assert.ok(s.includes("if (liaison.lie && !liaisonPerimee) env.definirSessionExterne(") && s.includes("else if (liaisonPerimee) liaison = { lie: false };"), "échue : session locale gardée, à relier de nouveau");
console.log("idle-desktop-liaison-echue-v1 : OK");
