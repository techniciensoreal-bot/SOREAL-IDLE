import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-13) : "Les images des boss au-dessus du boss 20 ne sont
 * actuellement plus prises en compte." Cause racine réelle (pas une
 * limite codée à 20) : la résolution d'image de boss reposait entièrement
 * sur DriveFileID (feuille IDLE_BOSS) via imageBossParNomSorealIdle_ ->
 * DriveApp.getFileById — DriveApp est un STUB (idle-sqlite-runtime.js,
 * ~ligne 362) qui renvoie toujours un blob vide dans cet environnement
 * Cloudflare Workers (DriveApp n'existe que dans Google Apps Script).
 * Ce n'était donc fonctionnel pour AUCUN boss, jamais seulement "1-20 oui,
 * 21+ non". Les vraies images vivent sur R2 (idle/bosses/boss_<id>_*.webp).
 *
 * Corrigé en exposant bossId, qui construit désormais
 * /api/idle/media/boss?id=<bossId> (résolu côté SOREAL-APP par
 * bossImage_/choisirCleBossR2_) au lieu de dépendre de DriveApp.
 *
 * Correctif 2026-09-18 (Norman : "c'est toujours les mauvaises images
 * dans fight boss") : bossId lisait bossDefinitionEtat.id (colonne brute
 * IDLE_BOSS.ID), incohérente avec la position réelle du boss après le tri
 * par id de bossCatalogueSorealIdle_ — l'écran Collection résout ses
 * propres images via "numero" (= index+1 dans le catalogue trié), jamais
 * cet id brut, donc les deux écrans pouvaient résoudre 2 bosses
 * différents pour la même position. bossId doit être bossSelectionIndex+1
 * (= le même index que "numero"), jamais bossDefinitionEtat.id.
 */

const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

assert.ok(
  source.includes("const DriveApp={"),
  "Confirme la présence du stub DriveApp (documente pourquoi la résolution Drive seule ne peut jamais fonctionner ici)."
);
assert.ok(
  /getFileById\(id\)\{\s*return\s*\{[\s\S]{0,200}?getBytes\(\)\{return \[\];\}/.test(source),
  "Le stub DriveApp.getFileById doit toujours renvoyer un blob avec des octets vides — documente que le chemin Drive seul est inopérant."
);

assert.ok(
  source.includes("bossId:") &&
  /bossId:\s*Math\.max\(\s*0,\s*Math\.floor\(bossSelectionIndex\)\s*\+\s*1\s*\)/.test(source),
  "bossId doit être dérivé de bossSelectionIndex+1 (même position que \"numero\" dans bossCatalogue), jamais de bossDefinitionEtat.id (colonne brute IDLE_BOSS.ID, non fiable pour l'alignement position <-> image)."
);
assert.ok(
  !source.includes("nombreSorealIdle_(bossDefinitionEtat.id, 0)"),
  "L'ancienne dérivation par bossDefinitionEtat.id ne doit plus être utilisée pour bossId (cause du bug \"mauvaises images\")."
);

// --- bossId doit être positionné juste après bossDriveFileId, dans le même bloc de snapshot ---
const driveIdx = source.indexOf("bossDriveFileId:");
const bossIdIdx = source.indexOf("bossId:", driveIdx);
assert.ok(
  driveIdx >= 0 && bossIdIdx > driveIdx && bossIdIdx - driveIdx < 1600,
  "bossId doit être exposé dans le même objet d'état que bossDriveFileId (snapshot joueur envoyé au client)."
);

console.log("idle-boss-image-id-field: OK");
