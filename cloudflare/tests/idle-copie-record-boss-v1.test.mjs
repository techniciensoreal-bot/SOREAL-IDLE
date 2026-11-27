import assert from "node:assert/strict";
import fs from "node:fs";

/* Audit Fight Boss (2026-11-27, S1) : une copie d'appareil dont le record de boss est plus bas que celui du serveur ne remplace jamais la partie, meme avec une date plus recente. */
const src = fs.readFileSync("cloudflare/public/modules/moteur-local-v1.js", "utf8");
assert.ok(src.includes("const copieEnRetard=statsIllisible||Number(rec.cells[24])<Number(srv[24])||recordBossPlusBas(rec.cells[37],srv[37]);"), "la garde du record de boss est dans le demarrage");
const m = src.match(/function recordBossPlusBas\(copie,serveur\)\{[^\n]*\}\n/);
assert.ok(m, "fonction presente");
const recordBossPlusBas = new Function(m[0] + "return recordBossPlusBas;")();
const stats = (n) => JSON.stringify({ metaNgu: { records: { highestBoss: n } } });
assert.equal(recordBossPlusBas(stats(52), stats(60)), true, "52 < 60 : vieille copie");
assert.equal(recordBossPlusBas(stats(60), stats(60)), false, "egal : copie valable");
assert.equal(recordBossPlusBas(stats(70), stats(60)), false, "plus avance : copie valable");
assert.equal(recordBossPlusBas("", stats(60)), false, "copie illisible : deja geree par statsIllisible, pas par cette garde");
assert.equal(recordBossPlusBas(stats(5), "illisible{"), false, "serveur illisible : on ne tranche pas");
console.log("idle-copie-record-boss-v1: OK");
