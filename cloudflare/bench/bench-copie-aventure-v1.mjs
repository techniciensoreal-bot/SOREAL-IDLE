import fs from "node:fs";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "../tests/_partie-reference.mjs";
const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-2.json", "utf8"));
const ligne = Array.isArray(brut.cells) ? brut.cells : Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
figerLeHasard(); reglerHorloge(Date.parse(ligne[15]) + 60_000);
const m = creerMoteur(ligne);
m.run("synchroniserSorealIdle"); avancer(4000);
const r = m.run("synchroniserSorealIdle");
const adv = r.joueur.systemes.adventure;
console.log("état d'Aventure : " + JSON.stringify(adv).length + " octets, sac : " + (adv.inventory ? adv.inventory.length : "?") + " objets");
function cout(libelle, f, tours = 200) { const t = []; for (let i = 0; i < tours; i += 1) { const a = performance.now(); f(); t.push(performance.now() - a); } t.sort((x, y) => x - y); console.log(libelle.padEnd(34) + " médiane " + t[t.length >> 1].toFixed(3).padStart(7) + " ms   p95 " + t[Math.floor(t.length * 0.95)].toFixed(3).padStart(7) + " ms"); }
cout("structuredClone(adventure)", () => structuredClone(adv));
cout("JSON.stringify(adventure)", () => JSON.stringify(adv));
const texte = JSON.stringify(adv);
cout("JSON.parse(texte)", () => JSON.parse(texte));
/* l'égalité exacte entre les deux copies (types JSON) */
const a = structuredClone(adv), b = JSON.parse(texte);
console.log("copies identiques (JSON.stringify) : " + (JSON.stringify(a) === JSON.stringify(b)));
let diff = 0; (function walk(x, y, p) { if (x === y) return; if (typeof x !== typeof y || x === null || y === null || typeof x !== "object") { diff += 1; if (diff < 5) console.log("  diff " + p + " : " + String(x) + " / " + String(y)); return; } const ks = new Set([...Object.keys(x), ...Object.keys(y)]); for (const k of ks) walk(x[k], y[k], p + "." + k); })(a, b, "adv");
console.log("différences structuredClone / JSON : " + diff);
