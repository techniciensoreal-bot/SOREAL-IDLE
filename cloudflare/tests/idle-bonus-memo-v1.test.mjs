import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createIdleAdventureStateV47,
  idleAdventureAddItemV1,
  idleAdventureEquipItemV1,
  idleAdventureItemAtLevelV47,
  idleAdventureEquipmentStatsV47,
  IDLE_ADVENTURE_ITEM_CATALOG_V1
} from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { idleAdventurePerfCompteursV1, idleAdventurePerfRazV1 } from "../src/idle-adventure-v47.js";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Mémo exact des bonus et des statistiques d'équipement (Norman, 2026-10-02 : « le serveur met 1 à 4 s à répondre à une synchro »). Une synchro recalculait ~207 fois
 * tous les bonus et ~460 fois les statistiques d'équipement (qui re-normalisent le sac entier). Le résultat est mémorisé avec le CONTENU de l'état comme clé :
 * jamais de résultat périmé, jamais d'objet partagé.
 */

// Une arme d'équipement du catalogue (Training Set)
const defArme = "training:weapon";
assert.ok(IDLE_ADVENTURE_ITEM_CATALOG_V1[defArme] && IDLE_ADVENTURE_ITEM_CATALOG_V1[defArme].slot === "weapon", "l'arme du Training Set existe au catalogue");

// 1. Équipement : un changement d'état change le résultat (jamais de résultat périmé), l'ancien état redonne l'ancien résultat.
{
  const a = createIdleAdventureStateV47();
  const sansArme = idleAdventureEquipmentStatsV47(a);
  assert.equal(sansArme.power, 0);
  const objet = idleAdventureAddItemV1(a, idleAdventureItemAtLevelV47(defArme, 40, "arme-test"));
  assert.ok(objet, "objet ajouté au sac");
  const encoreSansArme = idleAdventureEquipmentStatsV47(a);
  assert.equal(encoreSansArme.power, 0, "l'objet est dans le sac mais pas équipé");
  idleAdventureEquipItemV1(a, objet.id, "weapon");
  const avecArme = idleAdventureEquipmentStatsV47(a);
  assert.ok(avecArme.power > 0, "arme équipée : la puissance change aussitôt (pas de résultat périmé)");
  // Même contenu => même résultat ; autre objet du même contenu => aussi
  assert.deepEqual(idleAdventureEquipmentStatsV47(a), avecArme);
  assert.deepEqual(idleAdventureEquipmentStatsV47(JSON.parse(JSON.stringify(a))), avecArme, "un état de même contenu (autre objet) donne le même résultat");
  // Le résultat renvoyé est une copie : le modifier ne contamine pas les lectures suivantes.
  avecArme.power = -1;
  avecArme.specials.energySpeedPct = 999;
  const relu = idleAdventureEquipmentStatsV47(a);
  assert.ok(relu.power > 0 && relu.specials.energySpeedPct !== 999, "copie neuve à chaque lecture");
  // On retire l'arme (contenu modifié) : retour exact à 0
  a.equipment.weapon = "";
  assert.equal(idleAdventureEquipmentStatsV47(a).power, 0, "équipement retiré : résultat recalculé");
}

// 2. Bonus : copie neuve à chaque lecture, recalcul dès que l'état change.
{
  const ctx = { bosses: 100 };
  const etat = normalizeIdleNguState({}, ctx, 1_000_000);
  const b1 = idleNguBonuses(etat);
  b1.marqueur = "modifié par l'appelant";
  b1.expShop = { x: 1 };
  const b2 = idleNguBonuses(etat);
  assert.equal(b2.marqueur, undefined, "l'objet modifié par un appelant ne contamine pas la lecture suivante");
  assert.notDeepEqual(b2.expShop, { x: 1 });
  // Un changement d'état qui touche les bonus (un trophée ici : l'Aventure équipée) change le résultat
  const arme = idleAdventureAddItemV1(etat.adventure, idleAdventureItemAtLevelV47(defArme, 60, "arme-b"));
  idleAdventureEquipItemV1(etat.adventure, arme.id, "weapon");
  const b3 = idleNguBonuses(etat);
  assert.notDeepEqual(JSON.stringify(b3), JSON.stringify(b2), "arme équipée : les bonus ne sont pas périmés");
  const b4 = idleNguBonuses(etat);
  assert.deepEqual(b4, b3, "état inchangé : même résultat");
}

// 3. Garde-fous présents dans le code : clé = contenu complet, réutilisation limitée dans le temps, copie renvoyée, mode de vérification.
{
  const ngu = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
  const adv = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
  for (const src of [ngu, adv]) {
    assert.ok(src.includes("SOREAL_IDLE_VERIF_BONUS"), "mode de vérification (recalcul à chaque réutilisation)");
    assert.ok(src.includes("structuredClone("), "une copie est renvoyée");
  }
  assert.ok(ngu.includes("const BONUS_MEMO_MS_V1 = 5000;") && ngu.includes("cle = JSON.stringify(state)") && ngu.includes("export function idleNguMemoNouvelleRequeteV1()"));
  assert.ok(adv.includes("cle=raw&&typeof raw===\"object\"?JSON.stringify(raw):null"));
}

// 4. Non-régression de performance (compte avec un sac de 300 objets) : une synchro ne doit plus normaliser l'état d'Aventure des centaines de fois.
// Avant le mémo : ~470 normalisations et ~460 calculs d'équipement par synchro (3 s avec 450 objets). Un champ horodaté ajouté à l'état, par exemple, ferait revenir ces chiffres.
{
  const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
  const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const run = (op) => runSorealIdleOperation(sql, op, ["local"], user);
  run("obtenirEtatSorealIdle");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  const stats = JSON.parse(arr[37] || "{}");
  const mn = stats.metaNgu = stats.metaNgu || {};
  const defs = Object.keys(IDLE_ADVENTURE_ITEM_CATALOG_V1);
  const items = [];
  for (let i = 0; i < 300; i += 1) { try { items.push(idleAdventureItemAtLevelV47(defs[i % defs.length], (i * 7) % 101, "i" + (i + 1))); } catch (_e) { /* définition sans niveau */ } }
  const adv = mn.adventure && mn.adventure.version ? mn.adventure : createIdleAdventureStateV47();
  adv.inventory = items; adv.serial = items.length + 5; mn.adventure = adv;
  arr[37] = JSON.stringify(stats);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle"); run("synchroniserSorealIdle"); // échauffement
  idleAdventurePerfRazV1();
  run("synchroniserSorealIdle");
  const c = idleAdventurePerfCompteursV1();
  if (process.env.SOREAL_IDLE_VERIF_BONUS === "1") { console.log("idle-bonus-memo-v1: OK (mode vérification : compteurs ignorés, chaque réutilisation est recalculée)"); process.exit(0); }
  assert.ok(c.normalisations <= 60, "normalisations de l'état d'Aventure par synchro : " + c.normalisations + " (470 avant le mémo)");
  assert.ok(c.calculsEquipement <= 15, "calculs de statistiques d'équipement par synchro : " + c.calculsEquipement + " (460 avant le mémo)");
}
console.log("idle-bonus-memo-v1: OK");
