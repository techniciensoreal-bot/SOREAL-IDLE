import assert from "node:assert/strict";
import fs from "node:fs";
import { compare } from "../../design/compare-catalogs-to-wiki.mjs";

/*
 * Audit de seconde passe (2026-09-24) : les catalogues Perks / Quirks / Souhaits sont comparés au miroir wiki local
 * (design/compare-catalogs-to-wiki.mjs) : coût, cap, niveaux et diviseur de vitesse (valeur exacte entre parenthèses)
 * doivent être identiques pour les 232 perks, 186 quirks et 231 souhaits du tableau. Le test est ignoré si le miroir
 * (C:\Users\n0rma\Documents\NGU-Wiki, hors dépôt) n'est pas présent.
 */
const MIROIR = process.env.NGU_WIKI_MIRROR || "C:/Users/n0rma/Documents/NGU-Wiki";
if (!fs.existsSync(`${MIROIR}/pages/Perk Points.json`)) {
  console.log("idle-catalogs-vs-wiki-mirror ignoré (miroir wiki absent)");
} else {
  process.argv[2] = MIROIR;
  const r = await compare();
  const numeriques = (l) => / (coût|cap|niveaux|diviseur) :/.test(l);
  for (const k of ["perks", "quirks", "wishes"]) {
    assert.deepEqual(r[k].filter(numeriques), [], `${k} : écarts chiffrés avec le wiki`);
  }
  /* Écarts de texte connus et acceptés : la perk 56 (MacGuffin Daycare, non implémentée) et trois libellés. */
  const acceptes = [
    "wiki 56 \"Macguffin Daycare!\" absent du catalogue",
    "148 nom : wiki \"Bigger Deck II<s>I</s>\" / code \"Bigger Deck III\"",
    "202 nom : wiki \"I wish I was a sneak preview of 4G's next Idle game\" / code \"I wish I was a sneak preview of Norman & Sébastien's next Idle game\""
  ];
  for (const k of ["perks", "quirks", "wishes"]) {
    const inattendus = r[k].filter((l) => !numeriques(l) && !acceptes.includes(l) && !/ effet : /.test(l));
    assert.deepEqual(inattendus, [], `${k} : écarts de nom ou d'entrée inattendus`);
  }
  console.log("idle-catalogs-vs-wiki-mirror ok");
}
