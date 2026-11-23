/* Démarrage d'Énigmes fiable (Norman, 2026-11-23 : « parfois le jeu ne démarre pas, il faut recharger la page ») : un échec de lecture du catalogue n'est jamais mémorisé, un moteur muet est relancé une fois. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
assert.ok(src.includes("catalogueEssaiLe"), "essai du catalogue horodaté");
assert.ok(src.includes("Date.now()-catalogueEssaiLe<5000"), "nouvel essai au plus toutes les 5 s");
assert.ok(src.includes("return r.ok?r.json():null") && src.includes("if(!d||!Array.isArray(d.jeux))return;"), "un échec (réseau, 404) ne remplit pas le catalogue : il reste « pas encore lu »");
assert.ok(!/catch\(function\(\)\{return \{jeux:\[\]\};\}\)/.test(src), "plus de catalogue vide mémorisé après une erreur");
assert.ok(src.includes("relancesMoteur<1") && src.includes("Date.now()-iframeSrcLe>90000") && src.includes("ifr.src='about:blank'"), "moteur muet depuis 90 s : une seule relance");
// reprise directe : le premier lancement exige « Jouer », ensuite le jeu reprend seul (état lié au compte), même après un clic sur une page ouverte sans geste
assert.ok(src.includes("lire()==='lance'&&activationPage()"), "reprise seule après le premier « Jouer » (état 'lance', lié au compte)");
assert.ok(src.includes("['click','keydown','touchend']"), "page ouverte sans geste : la reprise part au premier clic");
assert.ok(src.includes("ecrire('');   /* le jeu repart de zéro"), "« Recommencer la partie » redemande le clic sur « Jouer »");
assert.ok(src.includes("try{synchroniser();}catch(_e){}   /* le jeu est connu"), "reprise aussi quand le catalogue arrive après l'affichage");
// compteur d'AP « obtenus / total » (exception du 2026-11-23 à la règle n°2, voir AGENTS.md)
assert.ok(src.includes("AP obtenus :") && src.includes("' / '+esc(nombreLisible(plafond))"), "compteur d'AP obtenus / plafond");
console.log("idle-scummvm-demarrage-v1: OK");
