import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

/*
 * Norman (2026-10-30) : « je veux que les anciennes voix soient supprimées définitivement ». Garde du script desktop/purger-voix-obsoletes.mjs :
 * simulation par défaut, suppression locale seulement avec --appliquer, R2 seulement avec --r2, jamais d'autre dossier que idle/voix/.
 */
const chemin = "desktop/purger-voix-obsoletes.mjs";
assert.ok(existsSync(chemin), "script présent");
const src = readFileSync(chemin, "utf8");

assert.match(src, /const APPLIQUER = args\.includes\("--appliquer"\);/);
assert.match(src, /const R2 = args\.includes\("--r2"\);/);
assert.match(src, /if \(!APPLIQUER && !R2\) \{[\s\S]*?process\.exit\(0\);\s*\}/, "sans option : simulation puis sortie, avant toute suppression");

// Toute suppression est derrière son option, et rien n'est supprimé avant le bloc de simulation.
const iSimulation = src.indexOf("if (!APPLIQUER && !R2) {");
const iSimulationFin = src.indexOf("process.exit(0);", iSimulation);
assert.ok(iSimulation > 0 && iSimulationFin > iSimulation);
assert.ok(!src.slice(0, iSimulationFin).includes("unlinkSync"), "aucune suppression avant la sortie de simulation");
assert.ok(!src.slice(0, iSimulationFin).includes("spawnSync("), "aucun appel wrangler avant la sortie de simulation");
assert.equal((src.match(/unlinkSync\(/g) || []).length, 1, "une seule suppression locale");
assert.match(src, /if \(APPLIQUER\) \{[\s\S]*?unlinkSync\(path\.join\(DOSSIER_VOIX, o\.f\)\)/, "suppression locale sous --appliquer");
assert.equal((src.match(/spawnSync\(/g) || []).length, 1, "un seul appel wrangler");
assert.match(src, /if \(R2\) \{[\s\S]*?spawnSync\(cmd, \["--yes", "wrangler", "r2", "object", "delete"/, "R2 seulement sous --r2");
assert.ok(!/"object", "(put|get)"/.test(src), "jamais d'écriture dans R2");

// Périmètre : uniquement idle/voix/, supprimables = obsolètes seulement (jamais douteuses ni référencées).
assert.match(src, /const PREFIXE = "idle\/voix\/";/);
assert.match(src, /if \(classe === "obsolete"\) obsoletesLocales\.push/);
assert.match(src, /if \(classe === "obsolete"\) obsoletesR2\.push/);
assert.match(src, /if \(!FORME\.test\(hash\)\) return "douteuse";/, "nom inattendu = douteuse");
assert.match(src, /if \(manifeste\.has\(hash\)\) return "douteuse";/, "voix du seul manifeste = douteuse");
assert.match(src, /> 0\.4 \* /, "garde-fou des 40 %");
assert.ok(!/rmSync|rmdirSync|recursive: true/.test(src), "aucune suppression de dossier");

console.log("idle-purge-voix-obsoletes-v1 OK");
