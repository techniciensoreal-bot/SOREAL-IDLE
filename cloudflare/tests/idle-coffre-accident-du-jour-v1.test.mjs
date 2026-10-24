import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-16) : « le coffre doit avoir son accident même s'il n'est pas à l'écran. Je n'en ai toujours pas eu, ni mon collègue. Pour quelqu'un qui joue beaucoup, une fois par jour ce serait bien. »
 * L'accident ne dépend plus d'un pet vu à l'écran : un instant « prochain accident » (gardé dans le stockage donc lié au compte) est tiré 0,65 à 1,35 jour après le précédent (en moyenne un par jour) ; à cet
 * instant il a lieu, à l'écran ou non. Hors de vue : le sac est déjà sale, la flaque est là au retour et les répliques sortent quand le Coffre est entièrement visible.
 */
const dig = readFileSync("cloudflare/public/modules/coffre-digestion-v1.js", "utf8");
const JOUR = 24 * 3600 * 1000;
function monde({ coffre = true, visible = false } = {}) {
  let maintenant = 1_800_000_000_000;
  const stock = new Map(); const appels = []; const timers = [];
  const el = { getBoundingClientRect: () => (visible ? { top: 10, left: 10, bottom: 100, right: 100, width: 90, height: 90 } : { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }), appendChild() {}, classList: { add() {}, remove() {} } };
  const fen = {
    document: { hidden: false, querySelector: () => (visible ? el : null), createElement: () => ({ className: "", style: {}, setAttribute() {}, appendChild() {}, set innerHTML(v) {} }), body: { appendChild() {} }, documentElement: { clientHeight: 800, clientWidth: 1200 } },
    localStorage: { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)) },
    setInterval: (f, d) => { timers.push({ f, d }); return timers.length; }, setTimeout: () => 0, clearInterval() {},
    innerHeight: 800, innerWidth: 1200, pageXOffset: 0, pageYOffset: 0, Math, Number, Boolean, Array, Object, String,
    Date: class extends Date { static now() { return maintenant; } },
    __SOREAL_IDLE_LIRE_ETAT_V1__: () => ({ systemes: { adventure: { coffreSlots: coffre ? [{}, {}] : [] } } }),
    __SOREAL_IDLE_CACA_V1__: { horsEcran() { appels.push("horsEcran"); }, flaque() { appels.push("flaque"); }, souiller() { appels.push("souiller"); } }
  };
  fen.window = fen;
  vm.runInNewContext(dig, fen, { filename: "coffre-digestion-v1.js" });
  return { fen, stock, appels, avancer: (ms) => { maintenant += ms; }, maintenant: () => maintenant, verifier: () => fen.__coffreVerifierAccidentIdleV1__() };
}
const CLE = "soreal_idle_coffre_prochain_accident_v1";

// 1. Sans Coffre (menu pas encore découvert) : rien du tout.
{ const m = monde({ coffre: false }); m.verifier(); assert.equal(m.stock.size, 0, "pas de Coffre : aucun tirage"); assert.deepEqual(m.appels, []); }
// 2. Premier passage : un instant est tiré dans les 2,4 à 24 h ; pas d'accident tout de suite.
{
  const m = monde(); m.verifier();
  const t = Number(m.stock.get(CLE)); const dt = t - m.maintenant();
  assert.ok(dt >= JOUR * 0.1 - 1 && dt <= JOUR + 1, "premier tirage entre 2,4 h et 24 h : " + dt / 3600000 + " h");
  assert.deepEqual(m.appels, [], "pas d'accident avant l'heure");
  // contrôlé au plus une fois par minute
  m.avancer(30_000); m.stock.set(CLE, String(m.maintenant() - 1)); m.verifier();
  assert.deepEqual(m.appels, [], "moins d'une minute depuis le dernier contrôle : rien");
}
// 3. À l'heure, HORS DE VUE : l'accident a lieu (sac sale), le prochain est tiré 0,65 à 1,35 jour plus tard ; une seule fois.
{
  const m = monde(); m.verifier();
  m.avancer(61_000); m.stock.set(CLE, String(m.maintenant() - 1000)); m.verifier();
  assert.deepEqual(m.appels, ["horsEcran"], "accident sans que le Coffre soit à l'écran");
  const dt = Number(m.stock.get(CLE)) - m.maintenant();
  assert.ok(dt >= JOUR * 0.65 - 1 && dt <= JOUR * 1.35 + 1, "prochain accident dans 0,65 à 1,35 jour");
  m.avancer(61_000); m.verifier();
  assert.deepEqual(m.appels, ["horsEcran"], "pas de second accident");
}
// 4. Cadence : en moyenne un accident par jour (écarts entre 0,65 et 1,35 jour).
{
  const m = monde(); m.verifier(); const ecarts = [];
  for (let i = 0; i < 600; i += 1) { m.avancer(61_000); m.stock.set(CLE, String(m.maintenant() - 1)); m.verifier(); ecarts.push(Number(m.stock.get(CLE)) - m.maintenant()); }
  const moy = ecarts.reduce((a, b) => a + b, 0) / ecarts.length / JOUR;
  assert.ok(moy > 0.93 && moy < 1.07, "moyenne d'environ un jour : " + moy.toFixed(3));
  assert.ok(Math.min(...ecarts) >= JOUR * 0.65 - 1 && Math.max(...ecarts) <= JOUR * 1.35 + 1, "bornes respectées");
}
// 5. Branchements : le contrôle part de la boucle existante (aucune minuterie de plus), la probabilité par pet a disparu, les répliques de l'accident hors de vue attendent le Coffre.
assert.ok(!dig.includes("P_ACCIDENT") && !dig.includes("accidentPermis_"), "plus d'accident au hasard à chaque pet");
assert.equal((dig.match(/setInterval\(/g) || []).length, 2, "deux minuteries seulement : la boucle du Coffre et l'attente de visibilité (aucune de plus)");
assert.ok(/function pas_\(\)\{[^]{0,400}?verifierAccident_\(\);/.test(dig), "contrôlé par la boucle existante");
assert.ok(dig.includes("if(repliquesEnAttente&&!document.hidden&&entierementVisible_()){repliquesEnAttente=false;repliques_();}"), "répliques dites quand le Coffre est entièrement visible");
assert.ok(readFileSync("cloudflare/public/modules/coffre-accident-v1.js", "utf8").includes("horsEcran:horsEcran_"), "la flaque et le sac se salissent hors de vue");
console.log("idle-coffre-accident-du-jour-v1: OK");
