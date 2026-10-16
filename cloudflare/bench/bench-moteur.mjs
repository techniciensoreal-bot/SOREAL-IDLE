/*
 * Banc d'essai du moteur (audit d'architecture, 2026-10-16) : temps de réponse des opérations les plus fréquentes sur une base SQLite en mémoire.
 * Usage : node cloudflare/bench/bench-moteur.mjs [tours]   (profil : node --cpu-prof cloudflare/bench/bench-moteur.mjs)
 * Mesure, pour un joueur au début de partie puis après une longue progression : « obtenirEtat », « battement », « agirProgression » et « synchro ».
 */
import { creerJoueurExterneV1 } from "../tests/helpers/joueur-externe-v1.mjs";
import { runSorealIdleOperation, idleReinitialiserTempsActifV1 } from "../src/idle-sqlite-runtime.js";

const tours = Number(process.argv[2] || 40);
idleReinitialiserTempsActifV1();
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate {
  constructor(...a) { if (a.length === 0) super(horloge); else super(...a); }
  static now() { return horloge; }
};
const email = "bench@example.com";
const g = creerJoueurExterneV1(email);
const u = { email, emailConnexion: email, emails: [email], prenom: "Bench", role: "externe", externe: true };
const op = (nom, ...args) => runSorealIdleOperation(g.sql, nom, ["x", ...args], u);

function mesurer(nom, f, n) {
  const t = []; for (let i = 0; i < n; i += 1) { horloge += 4000; const a = performance.now(); f(i); t.push(performance.now() - a); }
  t.sort((x, y) => x - y);
  const moy = t.reduce((s, x) => s + x, 0) / t.length;
  return `${nom.padEnd(34)} moyenne ${moy.toFixed(2).padStart(7)} ms   médiane ${t[t.length >> 1].toFixed(2).padStart(7)} ms   p95 ${t[Math.floor(t.length * 0.95)].toFixed(2).padStart(7)} ms`;
}
op("obtenirEtatSorealIdle");
op("definirPseudoSorealIdle", "Bench");
const rapports = [];
rapports.push(mesurer("obtenirEtatSorealIdle", () => op("obtenirEtatSorealIdle"), tours));
rapports.push(mesurer("battementSorealIdle", () => op("battementSorealIdle", { actif: true, connecte: true }), tours));
rapports.push(mesurer("agirProgression (zone sûre)", () => op("agirProgressionSorealIdle", { action: "adventure", adventure: { action: "selectZone", zone: "safe" } }), tours));
rapports.push(mesurer("enregistrerClics", (i) => op("enregistrerClicsSorealIdle", 5 + i), tours));
// longue absence : 6 h de rattrapage
horloge += 6 * 3600 * 1000;
rapports.push(mesurer("obtenirEtat après 6 h d'absence", () => op("obtenirEtatSorealIdle"), 1));
console.log(rapports.join("\n"));
globalThis.Date = VraiDate;
