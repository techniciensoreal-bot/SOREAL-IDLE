import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  instantaneJoueurV1,
  evenementsV1,
  enregistrerJalonsV1,
  lireFluxV1,
  dernierIdFluxV1,
  IDLE_FLUX_MAX_LIGNES_V1,
  IDLE_FLUX_MAX_PAR_BATTEMENT_V1,
  IDLE_FLUX_DELAI_FARM_MS_V1
} from "../src/idle-flux-v1.js";

/*
 * Fil d'actualité (Norman, 2026-10-01) : événements déduits de l'état du joueur, jamais de rafale au premier battement, respect du
 * classement masqué, et phrases côté lecteur sans spoil (AGENTS.md règle n°2).
 */
function baseVide() {
  const db = new DatabaseSync(":memory:");
  return {
    exec(query, ...bindings) {
      const statement = db.prepare(query);
      if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
      statement.run(...bindings);
      return [];
    }
  };
}
const T0 = 1_700_000_000_000;
const stats = (o = {}) => ({
  metaNgu: {
    systems: { achievements: { data: { unlocked: o.succes || {} } } },
    adventure: { titans: o.titans || {} },
    challenge: { completions: o.defis || {}, completionsTier: {} },
    records: { totalRebirths: o.rebirths || 0 }
  },
  classementVisible: o.visible
});

// 1. Instantané.
{
  const i = instantaneJoueurV1({ bossVaincus: 12, stats: stats({ succes: { a: 1, b: 2 }, titans: { t1: { kills: 2 }, t2: { kills: 0 } }, defis: { troll: 3 }, rebirths: 4 }) });
  assert.equal(i.boss, 12);
  assert.deepEqual(i.succes, ["a", "b"]);
  assert.deepEqual(i.titans, { t1: 2 });
  assert.deepEqual(i.defis, { "normal:troll": 3 });
  assert.equal(i.rebirths, 4);
}

// 2. Premier battement : rien ; ensuite seulement les différences.
{
  const sql = baseVide();
  const base = { email: "a@x.fr", nom: "Alice" };
  const i0 = instantaneJoueurV1({ bossVaincus: 5, stats: stats({ succes: { a: 1 } }) });
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: i0, now: T0 }), 0, "le premier battement ne publie rien");
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: i0, now: T0 + 20000 }), 0, "aucun changement : rien");
  const i1 = instantaneJoueurV1({ bossVaincus: 6, stats: stats({ succes: { a: 1, b: 2 }, titans: { t1: { kills: 1 } } }) });
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: i1, now: T0 + 40000 }), 3);
  const flux = lireFluxV1(sql, { email: "a@x.fr" });
  assert.deepEqual(flux.map((f) => f.type), ["boss", "succes", "titan"]);
  assert.ok(flux.every((f) => f.moi === true && f.nom === "Alice" && !("email" in f)), "jamais d'adresse e-mail, drapeau « moi » seulement");
  assert.equal(lireFluxV1(sql, { email: "b@x.fr" })[0].moi, false);
  assert.equal(lireFluxV1(sql, { apresId: flux[1].id }).length, 1, "apresId ne renvoie que la suite");
  assert.equal(dernierIdFluxV1(sql), flux[2].id);
}

// 3. Retrait du classement : rien n'est publié, et pas de rattrapage au retour.
{
  const sql = baseVide();
  const base = { email: "a@x.fr", nom: "Alice" };
  enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ bossVaincus: 1, stats: stats() }), now: T0 });
  assert.equal(enregistrerJalonsV1(sql, { ...base, visible: false, instantane: instantaneJoueurV1({ bossVaincus: 9, stats: stats() }), now: T0 + 1 }), 0);
  assert.equal(enregistrerJalonsV1(sql, { ...base, visible: true, instantane: instantaneJoueurV1({ bossVaincus: 9, stats: stats() }), now: T0 + 2 }), 0, "pas de rattrapage");
  assert.equal(dernierIdFluxV1(sql), 0);
}

// 4. Plafonds : succès ≤ 3, ≤ 6 événements, farm limité dans le temps, rétention.
{
  const succes = {};
  for (let k = 0; k < 10; k++) succes["s" + k] = 1;
  const ev = evenementsV1(instantaneJoueurV1({ stats: stats() }), instantaneJoueurV1({ bossVaincus: 3, stats: stats({ succes, rebirths: 1, titans: { t1: { kills: 1 }, t2: { kills: 1 }, t3: { kills: 1 }, t4: { kills: 1 } } }) }));
  assert.ok(ev.filter((e) => e.type === "succes").length <= 3);
  assert.ok(ev.length <= IDLE_FLUX_MAX_PAR_BATTEMENT_V1);

  const sql = baseVide();
  const base = { email: "a@x.fr", nom: "Alice", instantane: instantaneJoueurV1({ stats: stats() }) };
  enregistrerJalonsV1(sql, { ...base, now: T0 });
  assert.equal(enregistrerJalonsV1(sql, { ...base, activite: { t: "farm", zoneId: 3, zoneNom: "Égouts" }, now: T0 + IDLE_FLUX_DELAI_FARM_MS_V1 }), 1);
  assert.equal(enregistrerJalonsV1(sql, { ...base, activite: { t: "farm", zoneId: 3, zoneNom: "Égouts" }, now: T0 + IDLE_FLUX_DELAI_FARM_MS_V1 * 3 }), 0, "même zone : pas de répétition");
  assert.equal(enregistrerJalonsV1(sql, { ...base, activite: { t: "farm", zoneId: 4, zoneNom: "Forêt" }, now: T0 + IDLE_FLUX_DELAI_FARM_MS_V1 + 1000 }), 0, "changement trop rapproché : pas annoncé");
  assert.equal(enregistrerJalonsV1(sql, { ...base, activite: { t: "farm", zoneId: 4, zoneNom: "Forêt" }, now: T0 + IDLE_FLUX_DELAI_FARM_MS_V1 * 3 }), 1);

  const s2 = baseVide();
  enregistrerJalonsV1(s2, { email: "z@x.fr", nom: "Z", instantane: instantaneJoueurV1({ bossVaincus: 0, stats: stats() }), now: T0 });
  for (let n = 1; n <= IDLE_FLUX_MAX_LIGNES_V1 + 20; n++) {
    enregistrerJalonsV1(s2, { email: "z@x.fr", nom: "Z", instantane: instantaneJoueurV1({ bossVaincus: n, stats: stats() }), now: T0 + n });
  }
  assert.ok(s2.exec("SELECT COUNT(*) AS n FROM idle_flux")[0].n <= IDLE_FLUX_MAX_LIGNES_V1, "le fil est borné");
}

// 5. Phrases côté lecteur : aucun spoil.
{
  const noeud = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, querySelector() { return noeud(); }, querySelectorAll() { return []; }, getBoundingClientRect() { return { width: 0 }; }, classList: { toggle() {} } });
  const sandbox = { window: {}, document: { readyState: "complete", addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; }, createElement: noeud, body: { appendChild() {}, contains() { return true; }, classList: { toggle() {} } }, head: { appendChild() {} } }, localStorage: { getItem() { return null; }, setItem() {} }, requestAnimationFrame() { return 1; }, Date, Set };
  vm.runInNewContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), sandbox);
  const { phrase } = sandbox.window.__SOREAL_IDLE_FLUX_V1__;
  const debutant = { zones: [], bossMax: 0, connus: { boss: {}, titan: {}, succes: {}, menus: {} } };
  const expert = {
    zones: [{ id: 3, nom: "Égouts" }], bossMax: 50,
    connus: { boss: { 12: "Gros Rat" }, titan: { t1: "GRB" }, succes: { a: "Premier sang" }, menus: { titans: true, challenges: true, renaissance: true } }
  };
  const p = (type, donnees, ctx, moi = false) => phrase({ type, nom: "Mickaël", donnees, moi }, ctx);

  assert.equal(p("boss", { boss: 12 }, expert).texte, "Mickaël vient de vaincre Gros Rat");
  assert.equal(p("boss", { boss: 12 }, debutant).texte, "Mickaël vient de vaincre un boss", "boss inconnu : générique");
  assert.equal(p("boss", { boss: 99 }, expert).texte, "Mickaël vient de vaincre un boss", "boss au-delà du lecteur : générique");
  assert.equal(p("succes", { id: "a" }, expert).texte, "Mickaël a débloqué le trophée Premier sang");
  assert.equal(p("succes", { id: "a" }, debutant).texte, "Mickaël a débloqué un trophée");
  assert.equal(p("titan", { id: "t1" }, debutant), null, "Titans verrouillés chez le lecteur : jamais mentionnés");
  assert.equal(p("titan", { id: "t1" }, expert).texte, "Mickaël vient de terrasser un Titan : GRB");
  assert.equal(p("defi", {}, debutant), null);
  assert.equal(p("rebirth", {}, debutant), null);
  assert.equal(p("defi", {}, expert).texte, "Mickaël a réussi un Challenge");
  assert.equal(p("farm", { zoneId: 3, zoneNom: "Égouts" }, expert).texte, "Mickaël farme dans Égouts");
  assert.equal(p("farm", { zoneId: 3, zoneNom: "Égouts" }, debutant).texte, "Mickaël farme en Aventure", "zone inconnue : générique");
  assert.equal(p("boss", { boss: 12 }, expert, true).texte, "Tu viens de vaincre Gros Rat");

  // Messages du chat dans le bandeau : récents seulement au chargement, texte coupé.
  const f = sandbox.window.__SOREAL_IDLE_FLUX_V1__;
  const now = Date.now();
  f.recevoirChat([{ id: 1, at: now - 3_600_000, nom: "Vieux", message: "ancien" }, { id: 2, at: now - 1000, nom: "Léa", message: "salut ".repeat(40), moi: false }], true);
  const vus = f.visibles();
  assert.equal(vus.length, 1, "un message vieux de plus de 10 min n'est pas rejoué au chargement");
  assert.ok(vus[0].chat && vus[0].texte.startsWith("Léa : salut") && vus[0].texte.length <= 100);
}

// 6. Câblage : contrat, index, battement, page Chat.
{
  const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
  assert.ok(contrat.operations.includes("lireFluxSorealIdle"));
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  assert.ok(index.includes("/modules/flux-v1.js"));
  assert.ok(index.indexOf("/modules/flux-v1.js") < index.indexOf("/modules/chat-v1.js"));
  const chat = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
  assert.ok(chat.includes("recevoirChat"));
  assert.ok(chat.includes("apresFlux") && chat.includes("__SOREAL_IDLE_FLUX_V1__") && chat.includes("data-flux-panneau-v1"));
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  assert.ok(rt.includes("enregistrerJalonsV1") && rt.includes("lireFluxSorealIdle,"));
}

console.log("idle-flux-v1 OK");
