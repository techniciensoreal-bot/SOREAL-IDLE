import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import "../src/idle-ngu-progression.js"; // ordre d'import : évite le cycle idle-adventure-v47 <-> butin
import { IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2 } from "../src/idle-adventure-butin.js";
import { DIFFERENCES_JEU_V1, IDLE_INFOBULLES_ZONES_V1, idleInfobullesZonesV1 } from "../src/idle-infobulles-aventure-v1.js";
import { idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Infobulle de zone (jeu : AdventureController::zoneDescriptions) : « Boost Drop Chance », « Normal Mob Drop Chance », « Boss Drop Chance », valeur = base x facteur de butin x 100 (racine cubique à partir de
 * Chocolate World), remplacée par le plafond en vert. Zones fermées : rien (règle n°2). « Zone Kill Counter » (globalKillCounter) : compteur de session de l'AdventureController, jamais remis à zéro et jamais
 * par zone ; le moteur n'a aucune donnée équivalente (il compte par zone) : non affiché.
 */
const zone = (id, unlocked = true) => ({ id, unlocked });
const lire = (id, facteur = 1, unlocked = true) => idleInfobullesZonesV1([zone(id, unlocked)], facteur)[id];
const p = (l) => l.map((x) => x.k + ":" + Number(x.pct.toPrecision(6)) + (x.plafond ? "!" : "")).join(" ");

// Exemples du jeu (IL, facteur 1) : 2D boosts 7 % (plafond 15), Spoopy (Champ de bataille antique) 6 % (20), Chocolate 0,055 / 0,018 / 0,055, Pink Princess 0,01 / 0,003 / 0,01.
assert.equal(p(lire("2d")), "boost:7");
assert.equal(p(lire("ancient")), "boost:6");
assert.equal(p(lire("beardverse")), "boost:0.35 boss:1");
assert.equal(p(lire("chocolate")), "boost:0.055 mob:0.018 boss:0.055");
assert.equal(p(lire("pinkprincess")), "boost:0.01 mob:0.003 boss:0.01");
assert.equal(p(lire("aethereansea")), "boost:0.000001 mob:4e-7 boss:0.0000012");
// Zones sans ligne dans le jeu : rien.
for (const id of ["safe", "tutorial", "sewers", "forest", "cave", "sky", "hsb", "clock"]) assert.equal(lire(id), undefined, id + " : aucune ligne");

// Plafond : 2D x3 = 21 % > 15 % -> 15 en vert ; Chocolate est en racine cubique (x1000 -> x10).
assert.equal(p(lire("2d", 3)), "boost:15!");
assert.equal(p(lire("chocolate", 1000)), "boost:0.55 mob:0.18 boss:0.55", "Chocolate : racine cubique");
assert.equal(p(lire("chocolate", 1e12)), "boost:10! mob:8! boss:12!", "Chocolate au plafond : 10 / 8 / 12");
assert.equal(p(lire("mega", 100)), "boost:15!", "plafond 15 % des Mégaterres");

// Anti-spoil : zone fermée = aucune ligne ; la pièce ne contient que les zones ouvertes.
assert.equal(lire("chocolate", 1, false), undefined);
assert.deepEqual(idleInfobullesZonesV1([zone("2d", true), zone("chocolate", false), zone("aethereansea", false)], 1), { "2d": [{ k: "boost", pct: 7 }] });
const neuf = idleNguSnapshot(normalizeIdleNguState({}, { bosses: 20 }, 1_000_000), { bosses: 20 }, 1_000_000).adventure;
assert.deepEqual(neuf.infobulles.zones, {}, "joueur neuf : aucune zone ouverte avec des lignes");
const loin = idleNguSnapshot(normalizeIdleNguState({}, { bosses: 140 }, 1_000_000), { bosses: 140 }, 1_000_000).adventure;
const ouvertes = new Set(loin.zones.filter((z) => z.unlocked).map((z) => z.id));
for (const id of Object.keys(loin.infobulles.zones)) assert.ok(ouvertes.has(id), "ligne pour une zone fermée : " + id);
assert.ok(!("aethereansea" in loin.infobulles.zones) && !("netherregions" in loin.infobulles.zones), "zones Sadistic fermées : rien");

// Contrôle contre le jeu (IL, build 1260) : [boost, mob, boss] = [base, plafond %] ; null = ligne absente. Une seule différence connue (DIFFERENCES_JEU_V1).
const JEU = {
  "2d": [[0.07, 15]], ancient: [[0.06, 20]], avsp: [[0.03, 25]], mega: [[0.011, 15]], beardverse: [[0.0035, 25], null, [0.01, 100]],
  badly: [[0.001, 20], [0.00006, 5], [0.00018, 15]], boring: [[0.00012, 20], [0.00003, 4], [0.00009, 10]],
  chocolate: [[0.00055, 10], [0.00018, 8], [0.00055, 12]], evilverse: [[0.00012, 10], [0.00007, 8], [0.00021, 12]], pinkprincess: [[0.0001, 8], [0.00003, 8], [0.0001, 12]],
  metaland: [[0.00005, 7], [0.000015, 4], [0.00005, 12]], interdimensional: [[0.00003, 8], [0.000011, 4], [0.000035, 12]],
  typozone: [[0.000022, 8], [0.000009, 4], [0.000025, 12]], fadlands: [[0.000018, 8], [0.000007, 4], [0.000021, 12]], jrpgville: [[0.0000015, 8], [0.0000055, 4], [0.000018, 12]],
  radlands: [[6e-7, 15], [2e-7, 5], [6e-7, 15]], backtoschool: [[4e-7, 10], [1.5e-7, 5], [4.5e-7, 15]], westworld: [[2.5e-7, 15], [1e-7, 5], [3e-7, 15]],
  breadverse: [[1e-7, 15], [4e-8, 4], [1.2e-7, 15]], seventies: [[6e-8, 15], [2.5e-8, 4], [8e-8, 15]], halloweenies: [[4e-8, 15], [1.6e-8, 4], [5e-8, 15]],
  construction: [[2.5e-8, 16], [1e-8, 4], [3e-8, 15]], duckduck: [[2e-8, 17], [8e-9, 5], [2.4e-8, 15]], netherregions: [[1.6e-8, 17], [6e-9, 5], [1.8e-8, 15]],
  aethereansea: [[1e-8, 17], [4e-9, 5], [1.2e-8, 15]]
};
assert.deepEqual(Object.keys(JEU).sort(), Object.keys(IDLE_INFOBULLES_ZONES_V1).sort(), "les zones du tableau sont exactement celles du jeu qui affichent des chances");
const cles = ["boost", "mob", "boss"];
for (const [id, lignes] of Object.entries(JEU)) {
  const attendu = IDLE_INFOBULLES_ZONES_V1[id];
  assert.deepEqual(attendu, lignes.length === 1 ? ["boost"] : lignes.map((l, i) => l && cles[i]).filter(Boolean), id + " : lignes affichées");
  const prof = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2[id];
  const moteur = { boost: prof.normal.boosts[0], mob: (prof.normal.equipment || [])[0], boss: (prof.boss.equipment || [])[0] };
  lignes.forEach((l, i) => {
    if (!l) return;
    const m = moteur[cles[i]];
    const capMoteur = m.cap == null ? 100 : m.cap * 100;
    const diff = DIFFERENCES_JEU_V1[id + ":" + cles[i]];
    if (diff) {
      assert.equal(m.chance, diff.moteur.base, id + " : écart connu (moteur)");
      assert.ok(Math.abs(l[0] - diff.jeu.base) < 1e-15 && Math.abs(l[1] - diff.jeu.cap * 100) < 1e-9, id + " : écart connu (jeu)");
      return;
    }
    assert.ok(Math.abs(m.chance - l[0]) <= l[0] * 1e-6, id + " " + cles[i] + " : base moteur " + m.chance + " <> jeu " + l[0]);
    assert.ok(Math.abs(capMoteur - l[1]) < 1e-9, id + " " + cles[i] + " : plafond moteur " + capMoteur + " <> jeu " + l[1]);
  });
}
assert.deepEqual(Object.keys(DIFFERENCES_JEU_V1), [], "plus aucun écart avec le jeu (JRPGVille aligné, 2026-11-22)");

// Client : texte ajouté à l'infobulle (title) de la zone, vide si rien ; branché dans les deux rendus de la liste de zones.
const ctx = { window: {}, document: {} };
ctx.window.__SOREAL_IDLE_LANGUE_V1__ = () => "fr";
const etat = { systemes: { adventure: { infobulles: { zones: { chocolate: [{ k: "boost", pct: 0.055 }, { k: "mob", pct: 8, plafond: true }, { k: "boss", pct: 0.055 }] }, titans: {} } } } };
ctx.window.__SOREAL_IDLE_LIRE_ETAT_V1__ = () => etat;
vm.runInNewContext(readFileSync("cloudflare/public/modules/infobulles-aventure-v1.js", "utf8"), ctx);
const IB = ctx.window.__SOREAL_IDLE_INFOBULLES_AVENTURE_V1__;
assert.equal(IB.zoneTexte("chocolate"), "\nChance de butin des boosts : 0,06 %\nChance de butin des ennemis normaux : 8 %\nChance de butin du boss : 0,06 %");
assert.equal(IB.zoneTexte("2d"), "", "zone sans ligne : rien");
ctx.window.__SOREAL_IDLE_LANGUE_V1__ = () => "en";
assert.equal(IB.zoneTexte("chocolate"), "\nBoost Drop Chance : 0.06%\nNormal Mob Drop Chance : 8%\nBoss Drop Chance : 0.06%");
assert.ok(readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8").includes("__SOREAL_IDLE_INFOBULLES_AVENTURE_V1__.zoneTexte(z.id,a)"), "liste de zones (rendu HTML)");
assert.ok(readFileSync("cloudflare/public/modules/aventure-vdom-v1.js", "utf8").includes("__SOREAL_IDLE_INFOBULLES_AVENTURE_V1__.zoneTexte(z.id)"), "liste de zones (rendu Preact)");
console.log("idle-infobulles-zones-v1: OK");
