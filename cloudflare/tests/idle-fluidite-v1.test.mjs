import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Fluidité (Norman, 2026-10-02) : boss suivant instantané, MAX de la Time Machine sans valeur fantôme, résumé d'absence sans ligne d'énergie vide
 * + titans vaincus + butin court, barre d'Augmentation immobile sans énergie, cadre Time Machine en français.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// 1. Serveur : bossSuivant = exactement ce que le serveur renverra une fois le boss actuel vaincu.
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
  const etat = () => runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["local"], user).joueur;
  const avant = etat();
  const s = avant.bossSuivant;
  assert.ok(s && s.bossId === avant.bossId + 1 && s.bossVaincus === avant.bossVaincus + 1 && s.bossSelection === avant.bossSelection + 1, "numéros du boss suivant");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = Number(avant.bossVaincus) + 1;
  sql.exec("update idle_catalog set row_json=? where rowid=?", JSON.stringify(arr), ligne.id);
  const apres = etat();
  assert.equal(apres.bossId, s.bossId);
  for (const cle of ["bossActuel", "bossPvMax", "attaqueBoss", "defenseBoss", "regenBoss", "bossMortVivant", "bossHistoire"]) {
    assert.equal(JSON.stringify(apres[cle]), JSON.stringify(s[cle]), "boss suivant annoncé = boss réellement obtenu : " + cle);
  }
  assert.equal(JSON.stringify(apres.bossCapacites), JSON.stringify(s.bossCapacites));
  assert.equal(apres.recompenseBossActuel.xp, s.recompenseBossActuel.xp);
}

// 2. Client : le boss suivant s'affiche tout de suite, le serveur en retard ne ramène pas l'ancien boss.
assert.ok(ui.includes("setTimeout(function(){appliquerBossSuivantLocalIdleV1_(vaincusALaVictoireV1);},250);"), "appliqué 250 ms après la victoire prédite");
assert.ok(ui.includes("function appliquerBossSuivantLocalIdleV1_(vaincusAvant){") && ui.includes("Object.assign(idleEtat,n);"), "état du boss suivant appliqué localement");
assert.ok(ui.includes("if(!confirmee&&Date.now()-idlePrevisionBossV1.debut<=15000)return true;"), "garde : un état serveur qui décrit encore l'ancien boss est ignoré");
assert.ok(ui.includes("idlePrevisionBossV1.actif&&joueurServeur"), "garde en tête de la synchro de combat");

// 3. Time Machine : MAX = tout ce qui est libre (jamais le plafond théorique), cadre en français.
assert.ok(meta.includes("Math.max(current,Math.min(current+libre,allocationMaxMetaIdleV48_(j,'timeMachine',ressource)))"));
assert.ok(meta.includes("<h1>Machine à remonter le temps cassée</h1>") && !meta.includes("<h1>Broken Time Machine</h1>"));

// 4. Résumé d'absence : pas de ligne d'énergie à 0, titans vaincus, butin court.
assert.ok(ui.includes("if(produite>0)lignes.push(ligneResumeHorsLigneIdleV64_('⚡'"), "ligne d'énergie seulement si de l'énergie a été produite");
assert.ok(ui.includes("Titan'+(total>1?'s':'')+' vaincu'") && ui.includes("const maxLignes=5;") && ui.includes("… et '+resteObjets+' autre"), "titans vaincus + butin regroupé sur 5 lignes");
assert.ok(runtime.includes("titansTues:\n      titansTuesHorsLigneV1") || /titansTues:\s*titansTuesHorsLigneV1/.test(runtime), "le serveur compte les titans tués pendant l'absence");

// 5. Augmentations : sans énergie placée, la barre ne tourne pas, même si un état serveur en retard décrit l'ancienne allocation.
assert.ok(meta.includes("seconds:(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_((pairs[d.id]||{}).energy)>0)?"));
assert.ok(meta.includes("upgradeSeconds:(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_((pairs[d.id]||{}).upgradeEnergy)>0)?"));

// 6. Serveur de développement : latence simulable (les bugs de synchronisation n'existent jamais sans latence).
assert.ok(readFileSync("cloudflare/tools/local-dev-server.mjs", "utf8").includes("LATENCE_MS"));
console.log("idle-fluidite-v1: OK");
