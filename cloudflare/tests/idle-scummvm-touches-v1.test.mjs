/* Boutons de touches d'Énigmes (Norman, 2026-11-23) : les touches de Day of the Tentacle (français) ont été MESURÉES dans le vrai jeu ; aucun bouton en anglais (lettres non mesurées) ; bande en plein écran. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-scummvm-v1.css", "utf8");
const attendu = { Ouvrir: "o", Regarder: "l", Donner: "g", Fermer: "c", Utiliser: "u", Prendre: "p", Parler: "t", Pousser: "s", Tirer: "y" };
for (const [nom, k] of Object.entries(attendu)) {
  assert.ok(new RegExp("\{n:'" + nom + "',key:'" + k + "',code:'Key" + k.toUpperCase() + "'").test(src), "touche de " + nom + " = " + k);
}
assert.ok(!/Passer la scène/.test(src), "pas de bouton « Passer la scène » (demande de Norman)");
assert.ok(/scvVoileV1/.test(src) && src.includes("jh*0.762") && /special:'verbes'/.test(src), "voile sur les verbes du jeu + bouton pour les réafficher");
assert.ok(/NB_VERBES=9/.test(src) && src.includes("w.parent.__scvTouche__(i)"), "nos 9 boutons de verbes posés à la place de ceux du jeu");
assert.ok(src.includes("FACTEUR_LENT=0.3") && src.includes("installerSouris(fenetreJeu())") && src.includes("soreal_idle_scummvm_sensibilite_v1"), "souris émulée ralentie (facteur 0,3, bouton pour alterner)");
assert.ok(/key:' ',code:'Space',kc:32/.test(src) && /key:'F5',code:'F5',kc:116/.test(src), "Espace, F5");
assert.ok(/langueJeu\(\)==='en'\)return null/.test(src) && /cible!=='tentacle'/.test(src), "aucun bouton en anglais ni pour un autre jeu");
assert.ok(/htmlTouches\('scv-touches'\)/.test(src) && /scv-touches-plein/.test(src), "rangée sous le jeu + bande en plein écran");
assert.ok(/window\.__scvTouche__=/.test(src) && /new w\.KeyboardEvent\(type/.test(src), "les touches partent dans la fenêtre du jeu");
assert.ok(/\.scv-plein\.scv-avec-touches iframe\{height:calc\(/.test(css), "le jeu est raccourci de la bande en plein écran");
assert.ok(!/(Ouvrir|Regarder)[^;\n]*(caché|verrouill)/i.test(src), "aucun texte de spoil");
console.log("idle-scummvm-touches-v1: OK");
