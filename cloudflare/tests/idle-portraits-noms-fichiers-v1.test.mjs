import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_PORTRAITS_V1, idlePortraitNomFichierV1, idlePortraitPickR2KeyV1 } from "../src/idle-portraits-v1.js";

/* Norman (2026-09-26) : un nom de fichier simple par portrait, « portrait-<id>.webp » dans idle/player/ ; le jeu le trouve tout seul. */
const portraits = IDLE_PORTRAITS_V1.filter((p) => p.id !== "kitty");
const noms = portraits.map((p) => idlePortraitNomFichierV1(p.id));
assert.equal(new Set(noms).size, noms.length, "noms uniques");
assert.equal(idlePortraitNomFichierV1("training"), "portrait-training.webp");
assert.equal(idlePortraitNomFichierV1("forest-bonus-1"), "portrait-forest-bonus-1.webp");

// Chaque portrait est retrouvé par son nom simple, que le client envoie le nom du wiki ou l'identifiant, et sans confusion avec un autre.
const keys = noms.map((n) => "idle/player/" + n);
for (const p of portraits) {
  const attendu = "idle/player/" + idlePortraitNomFichierV1(p.id);
  assert.equal(idlePortraitPickR2KeyV1(keys, p.file), attendu, p.id + " (nom du wiki)");
  assert.equal(idlePortraitPickR2KeyV1(keys, p.id), attendu, p.id + " (identifiant)");
}
// Le nom simple l'emporte sur l'ancien fichier ; l'ancien nom marche toujours seul ; sans fichier : rien.
assert.equal(idlePortraitPickR2KeyV1(["idle/player/Portrait_PlayerAPportrait17.png", "idle/player/portrait-training.webp"], "PlayerAPportrait17"), "idle/player/portrait-training.webp");
assert.equal(idlePortraitPickR2KeyV1(["idle/player/Portrait_PlayerAPportrait17.png"], "PlayerAPportrait17"), "idle/player/Portrait_PlayerAPportrait17.png");
assert.equal(idlePortraitPickR2KeyV1(["idle/player/portrait-sewers.webp"], "PlayerAPportrait17"), "");

// La liste donnée à Norman couvre les 49 portraits du dossier idle/player/
const doc = readFileSync("docs/PORTRAITS-NOMS-FICHIERS.md", "utf8");
for (const n of noms) assert.ok(doc.includes("`" + n.replace(/.webp$/, "") + "."), n + " (ou son extension actuelle) dans docs/PORTRAITS-NOMS-FICHIERS.md");
console.log("idle-portraits-noms-fichiers-v1: OK");
