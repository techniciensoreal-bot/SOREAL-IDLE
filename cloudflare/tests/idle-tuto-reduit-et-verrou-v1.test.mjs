import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « la fenêtre de tuto doit être diminuée directement : on clique sur l'enceinte flottante pour l'agrandir. On ne doit pas pouvoir cliquer sur Fight tant que la voix n'a pas fini de parler, ni ailleurs que sur Fight ;
 * et même attendre ne lance pas le tuto suivant. »
 */
const src = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
// Enceinte flottante
assert.ok(src.includes("'#'+ID+'.reduit{width:54px;height:54px;") && src.includes("'#'+ID+'.reduit::after{content:\"🔊\""), "style de l'enceinte flottante");
assert.ok(src.includes("b.classList.toggle('reduit',!garderTaille);"), "une étape qui commence s'ouvre réduite");
assert.ok(src.includes("afficherEtape_(true);return;}") && src.includes("else{s.i+=1;afficherEtape_(true);}"), "Précédent / Suivant gardent la taille choisie");
assert.ok(src.includes("b.classList.remove('reduit');"), "un clic sur l'enceinte rouvre la fenêtre");
// Verrou de la voix et des clics
assert.ok(src.includes("function voixVerrouille_(s)") && src.includes("tts.readText(t,null,function(){if(s.jetonVoix===jeton)s.voixEnCours=false;})"), "verrou levé à la fin de la lecture");
assert.ok(src.includes("function clicRefuse_(ev)") && src.includes("if(voixVerrouille_(s))return true;") && src.includes("return !cible.contains(ev.target);"), "rien d'autre que la cible ne se clique, et pas même elle tant que la voix parle");
assert.ok(src.includes("['click','pointerdown','mousedown','mouseup','pointerup','dblclick','touchstart','touchend']") && src.includes("ev.stopImmediatePropagation();"), "les clics refusés n'atteignent jamais le jeu");
assert.ok(src.includes("if(ev.target.closest('#'+ID))return false;"), "la fenêtre du tutoriel reste cliquable (enceinte, Passer)");
// Attendre ne passe pas à l'étape suivante
const suivre = src.slice(src.indexOf("function suivre_(){"), src.indexOf("function jouer_("));
assert.ok(suivre.includes("s.attenteClic&&!cible&&Date.now()-s.debutAttente>DELAI_SUIVANT_MS"), "le bouton Suivant ne revient que si la cible n'existe pas du tout");
assert.ok(!/s\.attenteClic&&Date\.now\(\)-s\.debutAttente>DELAI_SUIVANT_MS/.test(suivre), "plus de retour du bouton Suivant au bout d'un délai");
console.log("idle-tuto-reduit-et-verrou-v1: OK");
