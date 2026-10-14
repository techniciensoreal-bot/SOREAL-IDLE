import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { choisirDossierZoneR2_ } from "../src/idle-media-v1.js";

/* Norman (2026-10-14) : « Détection automatique : le serveur cherche, dans idle/aventure/, le dossier dont le nom correspond à chaque zone. » */
const dossiers = ["Tutorial_Zone", "Sewers", "Chocolate_World", "The_Evilverse", "Pretty_Pink_Princess_Land", "Meta_Land", "Interdimensional_Party", "Typo_Zone", "The_Fad-lands", "JRPGVille", "Rad-Lands", "Back_To_School",
  "The_West_World", "The_Breadverse", "That_70s_Zone", "The_Halloweenies", "Construction_Zone", "DUCK_DUCK_ZONE", "Nether_Regions", "Aethereal_Sea", "Mega_Lands"];
const attendu = {
  evilverse: "The_Evilverse", pinkprincess: "Pretty_Pink_Princess_Land", metaland: "Meta_Land", interdimensional: "Interdimensional_Party", typozone: "Typo_Zone", fadlands: "The_Fad-lands",
  jrpgville: "JRPGVille", radlands: "Rad-Lands", backtoschool: "Back_To_School", westworld: "The_West_World", breadverse: "The_Breadverse", seventies: "That_70s_Zone", halloweenies: "The_Halloweenies",
  construction: "Construction_Zone", duckduck: "DUCK_DUCK_ZONE", netherregions: "Nether_Regions", aethereansea: "Aethereal_Sea"
};
for (const [zone, dossier] of Object.entries(attendu)) assert.equal(choisirDossierZoneR2_(dossiers, zone), dossier, "zone " + zone);
// avec des préfixes terminés par « / » (réponse brute de R2) et un nom de dossier avec « The_ » en plus
assert.equal(choisirDossierZoneR2_(["The_Nether_Regions/", "Rad-Lands/"], "netherregions"), "The_Nether_Regions");
// rien à trouver : vide, jamais une zone au hasard
assert.equal(choisirDossierZoneR2_(["Sewers", "Tutorial_Zone"], "evilverse"), "");
assert.equal(choisirDossierZoneR2_(dossiers, "safe"), "");
assert.equal(choisirDossierZoneR2_(dossiers, ""), "");
assert.equal(choisirDossierZoneR2_([], "evilverse"), "");
// « mega » ne doit pas prendre « Meta_Land » : une zone absente de la liste reste vide
assert.equal(choisirDossierZoneR2_(["Meta_Land"], "mega"), "");

// câblage : la table fixe reste prioritaire, la détection sert aux zones absentes, pour les monstres ET la zone sûre
const src = readFileSync(new URL("../src/idle-media-v1.js", import.meta.url)).toString("latin1");
assert.ok(src.includes("async function dossierZoneAventureR2_(env,zone){\n  const fixe=IDLE_ADVENTURE_MOB_FOLDERS[zone];\n  if(fixe)return fixe;") || src.includes("async function dossierZoneAventureR2_(env,zone){\r\n  const fixe=IDLE_ADVENTURE_MOB_FOLDERS[zone];\r\n  if(fixe)return fixe;"), "table fixe prioritaire");
assert.equal((src.match(/await dossierZoneAventureR2_\(env,zone\)/g) || []).length, 2, "monstres et zone sûre passent par la détection");
console.log("Dossier de zone détecté automatiquement: OK");
