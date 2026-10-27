import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « ce tuto (Introduction 1/4, le gros bouton rouge Fight) arrive sur l'écran du pseudo alors qu'il ne doit arriver qu'après l'intro ; la partie ne doit réellement commencer qu'à la fermeture du texte du premier boss : on
 * arrive sur la borne avec 250 d'énergie, qui regénère jusqu'à 500 ; elle ne doit pas commencer dès qu'on reset ». Côté moteur : idle-demarrage-partie-v1.
 */
const intro = readFileSync("cloudflare/public/modules/intro-diaporama-v1.js", "utf8");
const debutTerminer = intro.indexOf("function terminer(){");
const fin = intro.slice(debutTerminer, debutTerminer + 1800);
assert.ok(fin.includes("appel('demarrerPartieSorealIdle',[])") && fin.includes("appel('synchroniserSorealIdle',[])"), "la fermeture de l'intro démarre la partie puis synchronise");
assert.ok(fin.includes("setTimeout(suite,4000)"), "jamais bloqué si le moteur ne répond pas");
assert.ok(fin.indexOf("demarrerPartieSorealIdle") < fin.indexOf("__tutorielPagesNaviguerV1__(1)") || fin.includes("function suite()"), "le départ précède la fermeture de la fenêtre");
/* Norman (2026-10-26) : « la chronique se lit après qu'on l'a fermée » : pendant l'attente du moteur, la scène restait à l'écran avec son texte et la lecture automatique la relisait. */
assert.ok(fin.includes("rr.removeAttribute('data-soreal-tts-say')") && fin.includes("mm.style.display='none'"), "la scène est masquée et sans texte à lire dès la fermeture : la chronique n'est jamais relue");
assert.ok(fin.indexOf("mm.style.display='none'") < fin.indexOf("setTimeout(suite,4000)"), "masquée AVANT l'attente du moteur");
const continuer = intro.slice(intro.indexOf("var continuer=function(ev){"), intro.indexOf("cadre.addEventListener('click',continuer);"));
assert.ok(continuer.includes("if(d){ouvrirChronique(r,d);return;}") && continuer.includes("terminer();"), "le bouton blanc ouvre d'abord le texte du premier boss ; sa fermeture termine l'intro (donc démarre la partie)");

const guide = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(guide.includes("function bienvenueFaite_()") && guide.includes("nouveauJoueur&&bienvenueFaite_())demander_('debut'"), "le guide de départ n'arrive qu'après l'intro (« bienvenue » marqué à sa fermeture)");
assert.ok(guide.includes("document.getElementById('sorealIdleAccueilV1'))return true;"), "jamais sur l'écran du pseudo");

const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
assert.ok(contrat.operations.includes("demarrerPartieSorealIdle"), "opération déclarée au contrat");
assert.ok(readFileSync("cloudflare/public/modules/moteur-local-v1.js", "utf8").includes("demarrerPartieSorealIdle:1"), "jouée par le moteur local");
assert.ok(readFileSync("cloudflare/src/idle-local-sync-v1.js", "utf8").includes('"demarrerPartieSorealIdle"'), "reconnue comme action de jeu par la sauvegarde locale");

console.log("idle-depart-guide-apres-intro-v1: OK");
