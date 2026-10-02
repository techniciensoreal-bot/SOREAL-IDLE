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
  IDLE_FLUX_DELAI_FARM_MS_V1,
  IDLE_FLUX_FRAICHEUR_MS_V1,
  IDLE_FLUX_DELAI_CONNEXION_MS_V1,
  enregistrerConnexionFluxV1
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
    records: { totalRebirths: o.rebirths || 0, highestBoss: o.boss || 0 }
  },
  classementVisible: o.visible
});

// 1. Instantané.
{
  const i = instantaneJoueurV1({ stats: stats({ boss: 12, succes: { a: 1, b: 2 }, titans: { t1: { kills: 2 }, t2: { kills: 0 } }, defis: { troll: 3 }, rebirths: 4 }) });
  assert.equal(i.bossMax, 12);
  assert.deepEqual(i.succes, ["a", "b"]);
  assert.deepEqual(i.titans, { t1: 2 });
  assert.deepEqual(i.defis, { "normal:troll": 3 });
  assert.equal(i.rebirths, 4);
}

// 2. Premier battement : rien ; ensuite seulement les différences.
{
  const sql = baseVide();
  const base = { email: "a@x.fr", nom: "Alice" };
  const i0 = instantaneJoueurV1({ stats: stats({ boss: 5, succes: { a: 1 } }) });
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: i0, now: T0 }), 0, "le premier battement ne publie rien");
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: i0, now: T0 + 20000 }), 0, "aucun changement : rien");
  const i1 = instantaneJoueurV1({ stats: stats({ boss: 6, succes: { a: 1, b: 2 }, titans: { t1: { kills: 1 } } }) });
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: i1, now: T0 + 40000 }), 3);
  const flux = lireFluxV1(sql, { email: "a@x.fr" });
  assert.deepEqual(flux.map((f) => f.type), ["boss", "succes", "titan"]);
  assert.ok(flux.every((f) => f.moi === true && f.nom === "Alice" && !("email" in f)), "jamais d'adresse e-mail, drapeau « moi » seulement");
  assert.equal(lireFluxV1(sql, { email: "b@x.fr" })[0].moi, false);
  assert.equal(lireFluxV1(sql, { apresId: flux[1].id }).length, 1, "apresId ne renvoie que la suite");
  assert.equal(dernierIdFluxV1(sql), flux[2].id);
}

// 2b. Seuls les boss JAMAIS vaincus sont annoncés : refaire les boss 1..N après un Rebirth n'annonce rien.
{
  const sql = baseVide();
  const base = { email: "r@x.fr", nom: "Rémi" };
  const snap = (boss, rebirths) => instantaneJoueurV1({ bossVaincus: 0, stats: stats({ boss, rebirths }) });
  enregistrerJalonsV1(sql, { ...base, instantane: snap(30, 1), now: T0 });
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: snap(30, 1), now: T0 + 1 }), 0);
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: snap(30, 2), now: T0 + 2 }), 1, "le Rebirth est annoncé, pas les boss refaits");
  assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "boss").length, 0);
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: snap(31, 2), now: T0 + 3 }), 1, "boss 31 jamais vaincu : annoncé");
  assert.deepEqual(lireFluxV1(sql, {}).filter((e) => e.type === "boss").map((e) => e.donnees.boss), [31]);
  /* Ancien instantané sans record : aucune annonce à tort. */
  assert.equal(evenementsV1({ boss: 80, succes: [], titans: {}, defis: {}, rebirths: 0 }, snap(31, 0)).length, 0);
}

// 3. Retrait du classement : rien n'est publié, et pas de rattrapage au retour.
{
  const sql = baseVide();
  const base = { email: "a@x.fr", nom: "Alice" };
  enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ stats: stats({ boss: 1 }) }), now: T0 });
  assert.equal(enregistrerJalonsV1(sql, { ...base, visible: false, instantane: instantaneJoueurV1({ stats: stats({ boss: 9 }) }), now: T0 + 1 }), 0);
  assert.equal(enregistrerJalonsV1(sql, { ...base, visible: true, instantane: instantaneJoueurV1({ stats: stats({ boss: 9 }) }), now: T0 + 2 }), 0, "pas de rattrapage");
  assert.equal(dernierIdFluxV1(sql), 0);
}

// 4. Plafonds : succès ≤ 3, ≤ 6 événements, farm limité dans le temps, rétention.
{
  const succes = {};
  for (let k = 0; k < 10; k++) succes["s" + k] = 1;
  const ev = evenementsV1(instantaneJoueurV1({ stats: stats() }), instantaneJoueurV1({ stats: stats({ boss: 3, succes, rebirths: 1, titans: { t1: { kills: 1 }, t2: { kills: 1 }, t3: { kills: 1 }, t4: { kills: 1 } } }) }));
  assert.ok(ev.filter((e) => e.type === "succes").length <= 3);
  assert.ok(ev.length <= IDLE_FLUX_MAX_PAR_BATTEMENT_V1);

  const sql = baseVide();
  const base = { email: "a@x.fr", nom: "Alice", instantane: instantaneJoueurV1({ stats: stats() }) };
  /* Battements réguliers (toutes les 30 s : « en direct »), l'activité donnée à chacun ; renvoie le nombre d'événements publiés. */
  const battre = (activite, de, a) => { let n = 0; for (let t = de; t <= a; t += 30000) n += enregistrerJalonsV1(sql, { ...base, activite, now: t }); return n; };
  const zone3 = { t: "farm", zoneId: 3, zoneNom: "Égouts" };
  const zone4 = { t: "farm", zoneId: 4, zoneNom: "Forêt" };
  enregistrerJalonsV1(sql, { ...base, now: T0 });
  const D = IDLE_FLUX_DELAI_FARM_MS_V1;
  assert.equal(battre(zone3, T0 + 30000, T0 + D / 2), 1, "la zone de farm est annoncée une seule fois");
  assert.equal(battre(zone3, T0 + D / 2 + 30000, T0 + D - 30000), 0, "même zone : pas de répétition");
  assert.equal(battre(zone4, T0 + D - 30000 + 30000, T0 + D - 30000 + 30000), 0, "changement trop rapproché de la dernière annonce : pas annoncé");
  assert.equal(battre(zone4, T0 + D + 30000, T0 + D + 60000), 1, "changement de zone assez espacé : annoncé");
  assert.equal(battre(zone4, T0 + D + 90000, T0 + D * 3), 0, "puis plus de répétition");

  const s2 = baseVide();
  enregistrerJalonsV1(s2, { email: "z@x.fr", nom: "Z", instantane: instantaneJoueurV1({ stats: stats({ boss: 0 }) }), now: T0 });
  for (let n = 1; n <= IDLE_FLUX_MAX_LIGNES_V1 + 20; n++) {
    enregistrerJalonsV1(s2, { email: "z@x.fr", nom: "Z", instantane: instantaneJoueurV1({ stats: stats({ boss: n }) }), now: T0 + n });
  }
  assert.ok(s2.exec("SELECT COUNT(*) AS n FROM idle_flux")[0].n <= IDLE_FLUX_MAX_LIGNES_V1, "le fil est borné");
}

// 6. En direct, jamais de rattrapage (Norman, 2026-10-02) : après une absence, ce qui a été accompli n'est PAS annoncé ; la lecture ne rend que du frais.
{
  const sql = baseVide();
  const base = { email: "d@x.fr", nom: "Dylan" };
  enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ stats: stats({ boss: 5 }) }), now: T0 });
  /* Absence de 10 minutes (onglet fermé, téléphone verrouillé…) : l'état est mémorisé, rien n'est publié. */
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ stats: stats({ boss: 9, succes: { a: 1 } }) }), now: T0 + 10 * 60000 }), 0, "retour d'absence : pas de message de rattrapage");
  /* Il rejoue : un nouveau boss, battement suivant à 20 s -> annoncé en direct. */
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ stats: stats({ boss: 10, succes: { a: 1 } }) }), now: T0 + 10 * 60000 + 20000 }), 1, "en jeu : annoncé");
  /* Juste sous / juste au-dessus du seuil de fraîcheur entre deux battements. */
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ stats: stats({ boss: 11, succes: { a: 1 } }) }), now: T0 + 10 * 60000 + 20000 + IDLE_FLUX_FRAICHEUR_MS_V1 }), 1);
  assert.equal(enregistrerJalonsV1(sql, { ...base, instantane: instantaneJoueurV1({ stats: stats({ boss: 12, succes: { a: 1 } }) }), now: T0 + 10 * 60000 + 20000 + IDLE_FLUX_FRAICHEUR_MS_V1 * 2 + 1 }), 0, "écart > 90 s : rattrapage, rien");

  /* Lecture en direct : jamais d'historique, seulement les événements de moins de 90 s. */
  const lecteur = baseVide();
  const b2 = { email: "p@x.fr", nom: "Paul" };
  enregistrerJalonsV1(lecteur, { ...b2, instantane: instantaneJoueurV1({ stats: stats({ boss: 1 }) }), now: T0 });
  enregistrerJalonsV1(lecteur, { ...b2, instantane: instantaneJoueurV1({ stats: stats({ boss: 2 }) }), now: T0 + 10000 });   // ancien
  enregistrerJalonsV1(lecteur, { ...b2, instantane: instantaneJoueurV1({ stats: stats({ boss: 3 }) }), now: T0 + 100000 });  // frais
  const maintenant = T0 + 100000 + 10000;
  const frais = lireFluxV1(lecteur, { seulementFrais: true, now: maintenant, email: "x@x.fr" });
  assert.deepEqual(frais.map((e) => e.donnees.boss), [3], "l'événement de plus de 90 s n'est pas renvoyé");
  assert.deepEqual(lireFluxV1(lecteur, { seulementFrais: true, apresId: frais[0].id, now: maintenant }), [], "rien de nouveau après le dernier");
  assert.equal(lireFluxV1(lecteur, { email: "x@x.fr" }).length, 2, "la lecture ordinaire (historique) reste disponible");

  /* Premier battement de la page : le serveur ne renvoie rien (amorceFlux), seulement le repère dernierFluxId. */
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  assert.ok(rt.includes("i.amorceFlux === true") && rt.includes("seulementFrais: true") && rt.includes("maintenant: Date.now()"));
}

// 7. Un fil plus vivant (Norman, 2026-10-02) : défi lancé, set complété, connexion d'un joueur.
{
  const avant = instantaneJoueurV1({ stats: { metaNgu: { challenge: { active: "" }, adventure: { completedSets: { training: true } } } } });
  assert.equal(avant.defiActif, "");
  assert.deepEqual(avant.sets, ["training"]);
  const apres = instantaneJoueurV1({ stats: { metaNgu: { challenge: { active: "basic" }, adventure: { completedSets: { training: true, sewers: true } } } } });
  const ev = evenementsV1(avant, apres);
  assert.deepEqual(ev.map((e) => e.type).sort(), ["defiLance", "set"], "défi lancé + set complété (et pas le set déjà complété)");
  assert.equal(ev.find((e) => e.type === "set").donnees.id, "sewers");
  assert.deepEqual(evenementsV1(apres, apres), [], "rien de neuf : rien d'annoncé");
  // Ancien instantané sans ces champs : jamais d'annonce à tort.
  assert.deepEqual(evenementsV1({ bossMax: 0, succes: [], titans: {}, defis: {}, rebirths: 0 }, apres).filter((e) => e.type === "defiLance" || e.type === "set"), []);
  // Défi déjà en cours : pas de nouvelle annonce.
  assert.equal(evenementsV1(apres, Object.assign({}, apres, { defiActif: "troll" })).filter((e) => e.type === "defiLance").length, 0);

  // Connexion : annoncée, au plus une fois toutes les 5 minutes par joueur, jamais pour un joueur masqué du classement.
  const sql = baseVide();
  assert.equal(enregistrerConnexionFluxV1(sql, { email: "a@x.fr", nom: "Alice", now: T0 }), 1);
  assert.equal(enregistrerConnexionFluxV1(sql, { email: "a@x.fr", nom: "Alice", now: T0 + 60000 }), 0, "déjà annoncée il y a une minute");
  assert.equal(enregistrerConnexionFluxV1(sql, { email: "a@x.fr", nom: "Alice", now: T0 + IDLE_FLUX_DELAI_CONNEXION_MS_V1 + 1 }), 1);
  assert.equal(enregistrerConnexionFluxV1(sql, { email: "b@x.fr", nom: "Bob", visible: false, now: T0 }), 0, "retiré du classement : jamais annoncé");
  const fil = lireFluxV1(sql, { seulementFrais: true, now: T0 + IDLE_FLUX_DELAI_CONNEXION_MS_V1 + 2, email: "z@x.fr" });
  assert.deepEqual(fil.map((e) => e.type), ["connexion"]);
  assert.equal(fil[0].nom, "Alice");

  // Présence : un battement après une absence (ou le tout premier) est une connexion ; les battements rapprochés non.
  const { battementV1 } = await import("../src/idle-chat-v1.js");
  const p = baseVide();
  assert.equal(battementV1(p, { email: "c@x.fr", nom: "Cat", now: T0 }).connexion, true, "première présence");
  assert.equal(battementV1(p, { email: "c@x.fr", nom: "Cat", now: T0 + 20000 }).connexion, false, "battement normal");
  assert.equal(battementV1(p, { email: "c@x.fr", nom: "Cat", now: T0 + 20000 + 120000 }).connexion, true, "retour après plus de 90 s");
}

// 5. Phrases côté lecteur : aucun spoil.
{
  const noeud = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, querySelector() { return noeud(); }, querySelectorAll() { return []; }, getBoundingClientRect() { return { width: 0 }; }, classList: { toggle() {} } });
  const sandbox = { performance: { now: () => Date.now() }, window: {}, document: { readyState: "complete", addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; }, createElement: noeud, body: { appendChild() {}, contains() { return true; }, classList: { toggle() {} } }, head: { appendChild() {} } }, localStorage: { getItem() { return null; }, setItem() {} }, requestAnimationFrame() { return 1; }, Date, Set };
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
  // Nouveaux événements : connexion (jamais la sienne), défi lancé (menu Challenges requis), set (nom seulement si le lecteur l'a complété).
  assert.equal(p("connexion", {}, debutant).texte, "Mickaël vient de se connecter");
  assert.equal(p("connexion", {}, debutant, true), null);
  assert.equal(p("defiLance", {}, debutant), null, "menu Challenges non débloqué : jamais mentionné");
  assert.equal(p("defiLance", {}, expert).texte, "Mickaël a lancé un Challenge");
  assert.equal(p("set", { id: "training" }, debutant).texte, "Mickaël a complété un set d’équipement");
  assert.equal(p("set", { id: "training" }, Object.assign({}, expert, { connus: Object.assign({}, expert.connus, { sets: { training: "Training Set" } }) })).texte, "Mickaël a complété le set Training Set");

  // Achats en boutique (Norman, 2026-10-02) : annoncés seulement si le lecteur a débloqué cette boutique, sans détail de l'achat.
  const boutiques = Object.assign({}, expert, { connus: Object.assign({}, expert.connus, { menus: { spendExp: true, sellout: false } }) });
  assert.equal(p("achat", { boutique: "exp" }, boutiques).texte, "Mickaël a fait un achat dans la boutique EXP");
  assert.equal(p("achat", { boutique: "sellout" }, boutiques), null, "Boutique AP verrouillée chez le lecteur : jamais mentionnée");
  assert.equal(p("achat", { boutique: "exp" }, debutant), null);
  assert.equal(p("achat", { boutique: "sellout" }, Object.assign({}, expert, { connus: Object.assign({}, expert.connus, { menus: { sellout: true } }) }), true).texte, "Tu as fait un achat dans la Boutique AP");

  // Bandeau : chaque information n'est mise en file qu'UNE fois ; l'historique chargé au démarrage n'est pas rejoué.
  const f = sandbox.window.__SOREAL_IDLE_FLUX_V1__;
  const now = Date.now();
  f.recevoir([{ id: 1, at: now - 5000, nom: "Vieux", type: "boss", donnees: { boss: 1 } }]);
  f.recevoirChat([{ id: 1, at: now - 3_600_000, nom: "Vieux", message: "ancien" }], true);
  assert.equal(f.enAttente(), 0, "l'historique du chargement n'est pas rejoué");
  f.recevoir([{ id: 2, at: now, nom: "Léa", type: "boss", donnees: { boss: 2 } }]);
  f.recevoirChat([{ id: 2, at: now, nom: "Léa", message: "salut ".repeat(40), moi: false }], false);
  assert.equal(f.enAttente(), 2, "les nouveautés sont mises en file");
  f.recevoir([{ id: 2, at: now, nom: "Léa", type: "boss", donnees: { boss: 2 } }]);
  f.recevoirChat([{ id: 2, at: now, nom: "Léa", message: "salut ".repeat(40) }], false);
  assert.equal(f.enAttente(), 2, "une information déjà vue ne repasse jamais");
  const chat = f.visibles().find((v) => v.chat && v.id === "c2");
  assert.ok(chat.texte.startsWith("Léa : salut") && chat.texte.length <= 100, "message coupé");

  // En direct (Norman, 2026-10-02) : rien n'est rattrapé -- ni après une absence, ni à la connexion.
  const avant = f.enAttente();
  f.recevoir([{ id: 3, at: now - 5 * 60000, nom: "Dylan", type: "boss", donnees: { boss: 3 } }], now);
  f.recevoirChat([{ id: 3, at: now - 5 * 60000, nom: "Dylan", message: "message arrivé pendant mon absence" }], false, now);
  assert.equal(f.enAttente(), avant, "un événement / message de plus de 90 s (serveur) n'est jamais mis en file");
  assert.ok(!f.visibles().some((v) => /absence/.test(v.texte)) && !f.items().some((e) => e.id === 3), "ni dans le bandeau ni dans le panneau");
  assert.ok(f.dernier() >= 3, "mais le repère avance : il n'est pas redemandé");
  f.recevoir([{ id: 4, at: now - 20000, nom: "Dylan", type: "boss", donnees: { boss: 4 } }], now);
  assert.equal(f.enAttente(), avant + 1, "20 s : en direct");
  // Petit bruit quand un AUTRE joueur se connecte (une fois par lot, jamais pour soi).
  let carillons = 0;
  sandbox.window.__SOREAL_IDLE_AUDIO_V199__ = { joueurConnecte() { carillons += 1; } };
  f.recevoir([{ id: 40, at: now, nom: "Zed", type: "connexion", donnees: {} }, { id: 41, at: now, nom: "Yan", type: "connexion", donnees: {} }], now);
  assert.equal(carillons, 1, "un carillon pour le lot");
  f.recevoir([{ id: 42, at: now, nom: "Moi", type: "connexion", donnees: {}, moi: true }], now);
  assert.equal(carillons, 1, "pas de carillon pour sa propre connexion");
  f.amorcer(50);
  assert.equal(f.dernier(), 50, "repère du premier battement : tout ce qui précède l'arrivée du joueur est ignoré");
  assert.equal(f.amorce(), true);
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
  assert.ok(chat.includes("amorceFlux:amorce") && chat.includes("F.amorcer(res.dernierFluxId)") && chat.includes("F.recevoir(res.flux,res.maintenant)") && chat.includes("recevoirChat(recus,premier,data&&data.maintenant)"), "premier battement = repère seulement ; fraîcheur jugée sur l'heure du serveur");
  assert.ok(chat.includes("apresFlux") && chat.includes("__SOREAL_IDLE_FLUX_V1__") && chat.includes("data-flux-panneau-v1"));
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  assert.ok(rt.includes("enregistrerJalonsV1") && rt.includes("lireFluxSorealIdle,"));
}

// 8. Achats en boutique : un événement par boutique dont le compteur a augmenté, jamais à tort.
{
  const stats = (exp, sellout) => ({ metaNgu: { bonuses: { expShop: exp }, selloutShop: { purchases: sellout } } });
  const a0 = instantaneJoueurV1({ stats: stats({ autoMerge: 1 }, { extraBeardSlot: 1 }) });
  assert.deepEqual(a0.achats, { exp: 1, sellout: 1 });
  const a1 = instantaneJoueurV1({ stats: stats({ autoMerge: 1, inventorySpace: 3 }, { extraBeardSlot: 1 }) });
  assert.deepEqual(evenementsV1(a0, a1).map((e) => [e.type, e.donnees.boutique]), [["achat", "exp"]]);
  const a2 = instantaneJoueurV1({ stats: stats({ autoMerge: 1, inventorySpace: 3 }, { extraBeardSlot: 2 }) });
  assert.deepEqual(evenementsV1(a1, a2).map((e) => [e.type, e.donnees.boutique]), [["achat", "sellout"]]);
  assert.deepEqual(evenementsV1(a2, a2), [], "aucun achat : rien d'annoncé");
  assert.deepEqual(evenementsV1(a2, a0), [], "un compteur qui baisse (Rebirth…) n'annonce rien");
  assert.deepEqual(evenementsV1({ bossMax: 0, succes: [], titans: {}, defis: {}, rebirths: 0 }, a1).filter((e) => e.type === "achat"), [], "ancien instantané sans achats : jamais d'annonce à tort");
}

// 9. Bandeau « En direct » (Norman, 2026-10-02) : défilement continu, chaque information entre à l'instant de son arrivée et ne passe qu'une fois.
{
  const m = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
  assert.ok(m.includes("function ajouterAuBandeau(e){") && m.includes("while(file.length){"), "tout ce qui arrive est ajouté tout de suite, sans attendre la fin d'un lot");
  assert.ok(m.includes("piste.removeChild(premier);") && m.includes("x+=w;"), "une information sortie à gauche est retirée (jamais rejouée) sans faire sauter la piste");
  assert.ok(!m.includes("passes>=PASSAGES") && !m.includes("PASSAGES"), "plus de boucle qui rejoue un lot");
  assert.ok(m.includes("DOUBLON_MS=120000") && m.includes("derniereVue.get(e.texte)"), "une phrase identique passée il y a moins de 2 minutes n'est pas rejouée");
  assert.ok(m.includes("if(derniereImage&&now-derniereImage>5000&&piste.firstChild)viderBandeau();"), "retour d'onglet : la piste périmée est vidée");
}

console.log("idle-flux-v1 OK");
