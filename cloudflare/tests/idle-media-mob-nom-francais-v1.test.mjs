import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-10-05) : « dans le ciel, certains noms ne correspondent pas aux images : le boss me met bernaches du canada alors que c'est le gros poussin jaune ». Le client demande l'image avec le nom FRANÇAIS du mob
 * (la réponse du jeu est traduite) ; les fichiers R2 portent le nom d'origine. Le nom français doit retrouver le bon fichier, jamais le choix par index.
 */
const m = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-media-v1.js").href);
const ciel = [
  "idle/aventure/The_Sky/Adv_038_Kid_On_a_Cloud.png",
  "idle/aventure/The_Sky/Adv_044_Gigantic_Flock_of_Seagulls.png",
  "idle/aventure/The_Sky/Adv_045_Gigantic_Flock_of_Canada_Geese.png",
  "idle/aventure/The_Sky/Adv_046_A_Weird_Two-Headed_Guy.png",
  "idle/aventure/The_Sky/Adv_047_A_Bird_Person.png"
];
assert.equal(m.nomMobOrigineV1_("Énorme volée de bernaches du Canada"), "Gigantic Flock of Canada Geese");
assert.equal(m.nomMobOrigineV1_("Lester"), "Lester", "nom sans traduction : inchangé");
assert.equal(m.choisirCleMobR2_(ciel, true, 0, "Énorme volée de bernaches du Canada"), ciel[2], "le boss « bernaches » a l'image des bernaches, pas celle de l'homme-oiseau");
assert.equal(m.choisirCleMobR2_(ciel, true, 1, "Un homme-oiseau"), ciel[4]);
assert.equal(m.choisirCleMobR2_(ciel, false, 3, "Énorme nuée de mouettes"), ciel[1]);
assert.equal(m.choisirCleMobR2_(ciel, true, 0, "Gigantic Flock of Canada Geese"), ciel[2], "nom d'origine : toujours bon");
console.log("idle-media-mob-nom-francais-v1: OK");
