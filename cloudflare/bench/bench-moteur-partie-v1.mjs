/*
 * Banc du moteur sur une PARTIE DE RÉFÉRENCE (plan design/ARCHITECTURE-CIBLE.md, étape 1 « noyau résident ») : coût d'une synchro et d'une action sur un compte avancé, à l'horloge gelée et au hasard à graine.
 * Usage : node cloudflare/bench/bench-moteur-partie-v1.mjs [partie-reference-2] [tours]    (profil : node --cpu-prof cloudflare/bench/bench-moteur-partie-v1.mjs)
 */
import fs from "node:fs";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "../tests/_partie-reference.mjs";
const nom = process.argv[2] || "partie-reference-2", tours = Number(process.argv[3] || 40);
const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8"));
const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
figerLeHasard(); reglerHorloge(Date.parse(ligne[15]) + 60_000);
const m = creerMoteur(ligne);
const sync = () => m.run("synchroniserSorealIdle");
const agir = (p) => m.run("agirProgressionSorealIdle", p);
sync(); sync();
function mesurer(libelle, f) {
  const t = [];
  for (let i = 0; i < tours; i += 1) { avancer(4000); const a = performance.now(); f(i); t.push(performance.now() - a); }
  t.sort((x, y) => x - y);
  const moy = t.reduce((s, x) => s + x, 0) / t.length;
  console.log(libelle.padEnd(26) + " moyenne " + moy.toFixed(1).padStart(6) + " ms   médiane " + t[t.length >> 1].toFixed(1).padStart(6) + " ms   p95 " + t[Math.floor(t.length * 0.95)].toFixed(1).padStart(6) + " ms");
}
mesurer("synchro (4 s d'écart)", () => sync());
mesurer("action : allocation", (i) => agir({ action: "allocate", system: "timeMachine", resource: "energy", value: 1e6 + i }));
mesurer("action : Aventure (départ)", (i) => { try { agir({ action: "adventure", adventure: { action: "startZoneFight", restHp: sync().joueur.pvJoueur } }); avancer(1200); agir({ action: "adventure", adventure: { action: "resolveZoneFight", titanId: "", titanStarted: false } }); } catch (_) {} });
