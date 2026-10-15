import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const mus = lire("modules/musique-titan-v1.js"), amb = lire("modules/ambient-audio-v1.js"), idx = lire("index.html"), ui = lire("soreal-idle-ui.js");
/* Norman (2026-10-15) : musique de fond angoissante et nerveuse pendant le combat des Titans */
assert.ok(mus.includes("var BPM=148;") && mus.includes("var BASSES=[73.42,73.42,58.27,73.42,73.42,77.78,98.00,55.00];") && mus.includes("MESURES=8"), "phrase de 8 mesures à 148 BPM en ré phrygien");
for (const brique of ["grosseCaisse(", "caisseClaire(", "charley(", "tom(", "basse(", "corde(", "nappe(", "cuivres(", "riser("]) assert.ok(mus.includes("function " + brique), "couche : " + brique);
assert.ok(mus.includes("window.__SOREAL_IDLE_TITAN_ECRAN_V1__") && mus.includes("setInterval(surveiller,500)") && mus.includes("getMusique"), "jouée tant que l'écran de combat de Titan est actif, niveau = barre Musique");
assert.ok(mus.includes("FONDU_ENTREE=2.2") && mus.includes("FONDU_SORTIE=1.6"), "fondu à l'entrée et à la sortie");
assert.ok(mus.includes("A.suspendre(Boolean(oui))") && amb.includes("function suspendre(oui){") && amb.includes("if(actif&&!suspendu)demarrer_();"), "les sons d'ambiance se taisent pendant la musique");
assert.ok(idx.includes("/modules/musique-titan-v1.js?v=") && idx.indexOf("titans-combat-ecran-v1.js") < idx.indexOf("musique-titan-v1.js"), "module chargé");
assert.ok(ui.includes("function htmlReglagesMusiqueTitanIdleV1_(){") && ui.includes("window.__apercuMusiqueTitanIdleV1__"), "aperçu dans les Réglages de développement");
console.log("idle-musique-titan-v1: OK");
