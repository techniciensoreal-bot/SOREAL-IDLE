import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : le Coffre à dents doit croquer quel que soit le mode de dépôt (glisser-déposer HTML5, doigt, souris). Chaque chemin qui envoie « coffreDeposer » pose le drapeau d'animation avant. */
const s = readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8");
const envois = [...s.matchAll(/actionAdventureIdleV47_\(\{action:'coffreDeposer'/g)].map((m) => m.index);
assert.ok(envois.length >= 2, "au moins deux chemins de dépôt");
for (const i of envois) assert.ok(s.slice(Math.max(0, i - 200), i).includes("window.__bagageAvaleIdleV1=Date.now();"), "dépôt sans animation à l'index " + i);
console.log("idle-coffre-croque-v1: OK");
