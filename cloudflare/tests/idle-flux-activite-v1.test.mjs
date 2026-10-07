import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { enregistrerJalonsV1, lireFluxV1, instantaneJoueurV1, IDLE_FLUX_DELAI_BOSS_MS_V1, IDLE_FLUX_DELAI_VISITE_MS_V1 } from "../src/idle-flux-v1.js";
import { normaliserActiviteV1 } from "../src/idle-chat-v1.js";

/*
 * « En direct » plus vivant (Norman, 2026-10-07) : boss en cours de combat et menus visités, sans spam ; chacun ne voit que les annonces des AUTRES ;
 * anti-spoil côté lecteur ; minuteurs d'Auto Merge / Auto Boost au-dessus de l'inventaire ; plus de « Progression mise à jour ».
 */
function base() {
  const db = new DatabaseSync(":memory:");
  return { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
}
const T0 = 1_700_000_000_000;
const inst = () => instantaneJoueurV1({ stats: { metaNgu: {} } });
const battement = (sql, activite, now) => enregistrerJalonsV1(sql, { email: "a@x.fr", nom: "Mickaël", instantane: inst(), activite: normaliserActiviteV1(activite), now });
const types = (sql) => lireFluxV1(sql, {}).map((e) => e.type + ":" + JSON.stringify(e.donnees));

// 1. Activité normalisée : liste blanche des menus
assert.equal(normaliserActiviteV1({ t: "libre", menu: "spendExp" }).menu, "spendExp");
assert.equal(normaliserActiviteV1({ t: "libre", menu: "<script>" }).menu, undefined, "menu hors liste blanche : ignoré");

// 2. Boss en cours : jamais au 1er battement, puis seulement quand le boss change et après le délai
{
  const sql = base();
  battement(sql, { t: "boss", boss: 5 }, T0);
  assert.deepEqual(types(sql), [], "premier battement : rien");
  battement(sql, { t: "boss", boss: 6 }, T0 + 20_000);
  assert.deepEqual(types(sql), [], "boss changé mais trop tôt après la mémorisation : rien (anti-spam)");
  battement(sql, { t: "boss", boss: 6 }, T0 + IDLE_FLUX_DELAI_BOSS_MS_V1 + 40_000);
  assert.deepEqual(types(sql), [], "même boss que celui mémorisé : rien");
  // battements rapprochés (< 90 s) pour rester « en direct »
  let t = T0 + IDLE_FLUX_DELAI_BOSS_MS_V1 + 40_000;
  for (let i = 0; i < 12; i++) { t += 20_000; battement(sql, { t: "boss", boss: 7 }, t); }
  const b = types(sql).filter((x) => x.startsWith("bossCombat"));
  assert.equal(b.length, 1, "un seul « combat le boss 7 » malgré les battements répétés");
  assert.ok(b[0].includes('"boss":7'));
}

// 3. Menu visité : annoncé une fois, puis plus avant le délai, même en changeant de menu
{
  const sql = base();
  battement(sql, { t: "libre" }, T0);
  battement(sql, { t: "libre", menu: "spendExp" }, T0 + 20_000);
  battement(sql, { t: "libre", menu: "spendExp" }, T0 + 40_000);
  battement(sql, { t: "libre", menu: "sellout" }, T0 + 60_000);
  assert.deepEqual(types(sql), ['visite:{"menu":"spendExp"}'], "une visite, pas de rafale en changeant de menu");
  let t = T0 + 60_000;
  for (let i = 0; i < Math.ceil(IDLE_FLUX_DELAI_VISITE_MS_V1 / 20_000) + 1; i++) { t += 20_000; battement(sql, { t: "libre", menu: "moneyPit" }, t); }
  assert.equal(types(sql).filter((x) => x.startsWith("visite")).length, 2, "nouvelle visite après le délai");
}

// 4. Côté lecteur : phrases, anti-spoil, et jamais ses propres annonces
{
  const noeud = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, querySelector() { return noeud(); }, querySelectorAll() { return []; }, getBoundingClientRect() { return { width: 0 }; }, classList: { toggle() {} } });
  const sandbox = { performance: { now: () => Date.now() }, window: {}, document: { readyState: "complete", addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; }, createElement: noeud, body: { appendChild() {}, contains() { return true; }, classList: { toggle() {} } }, head: { appendChild() {} } }, localStorage: { getItem() { return null; }, setItem() {} }, requestAnimationFrame() { return 1; }, Date, Set };
  const source = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
  vm.runInNewContext(source, sandbox);
  const { phrase } = sandbox.window.__SOREAL_IDLE_FLUX_V1__;
  const debutant = { zones: [], bossMax: 0, connus: { boss: {}, titan: {}, succes: {}, menus: {} } };
  const expert = { zones: [], bossMax: 50, connus: { boss: { 12: "Gros Rat" }, titan: {}, succes: {}, menus: { spendExp: true, moneyPit: true } } };
  const p = (type, donnees, ctx) => phrase({ type, nom: "Mickaël", donnees, moi: false }, ctx);
  assert.equal(p("bossCombat", { boss: 12 }, expert).texte, "Mickaël combat Gros Rat");
  assert.equal(p("bossCombat", { boss: 12 }, debutant).texte, "Mickaël combat un boss", "boss inconnu du lecteur : générique");
  assert.equal(p("visite", { menu: "spendExp" }, expert).texte, "Mickaël visite la boutique EXP");
  assert.equal(p("visite", { menu: "spendExp" }, debutant), null, "menu non débloqué chez le lecteur : jamais mentionné");
  assert.equal(p("visite", { menu: "sang" }, expert), null);
  assert.equal(p("visite", { menu: "n'importe quoi" }, expert), null);
  assert.ok(source.includes("if(p&&!it.moi)sortie.push("), "les annonces du joueur lui-même ne sont jamais affichées");
}

// 5. Minuteurs au-dessus de l'inventaire : minutes, puis secondes dans la dernière minute ; seulement ce qui est débloqué et activé
{
  const src = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");
  const debut = src.indexOf("function dureeMin(sec){");
  const fin = src.indexOf("function snap(j){");
  const entier = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : 0; };
  const dureeMin = new Function("entier", src.slice(debut, fin) + "\nreturn dureeMin;")(entier);
  assert.equal(dureeMin(600), "10 min");
  assert.equal(dureeMin(61), "2 min");
  assert.equal(dureeMin(60), "1 min");
  assert.equal(dureeMin(59), "59 s", "dernière minute en secondes");
  assert.equal(dureeMin(0), "0 s");
  assert.ok(src.includes("if(!debloque||!actif||reste==null)return '';"), "rien si verrouillé, désactivé ou sans minuteur (anti-spoil)");
  assert.ok(src.includes("colonnes.parentNode.insertBefore(bande,colonnes)"), "bande placée au-dessus de l'inventaire");
}

// 6. Plus de popup « Progression mise à jour »
{
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(!meta.includes("✅ Progression mise à jour"), "message supprimé");
}
console.log("idle-flux-activite-v1: OK");
