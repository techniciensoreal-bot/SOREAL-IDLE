import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « j'ai refait toutes les voix de l'intro et il lit toujours les anciennes ; à chaque changement d'image il recommence la narration au début ».
 * Cause : la scène posée avant la réponse du serveur gardait data-soreal-tts-say (voix de la page, texte entier) ; chaque lancerEtape coupait le lecteur (empreinte remise à zéro) et la page était relue depuis le début.
 */
const js = fs.readFileSync("cloudflare/public/modules/intro-diaporama-v1.js", "utf8");
assert.ok(js.includes("function retirerVoixPage_(r)") && js.includes("r.removeAttribute('data-soreal-tts-say');r.setAttribute('data-soreal-tts-ignore','')"), "la voix de la page se retire pour de bon");
const ap = js.slice(js.indexOf("function appliquerServeur(h)"), js.indexOf("function retirerVoixPage_"));
assert.ok(ap.includes("modeEtape&&!etaitEtape&&!langueEn()&&!chronique") && ap.includes("retirerVoixPage_(r)") && ap.includes("lancerEtape(indice)"), "quand les voix par image arrivent, la page ne lit plus et l'image courante repart avec sa voix");
const af = js.slice(js.indexOf("function afficher(i)"), js.indexOf("function arreterAudioEn"));
assert.ok(af.indexOf("retirerVoixPage_(r)") !== -1 && af.indexOf("retirerVoixPage_(r)") < af.indexOf("lancerEtape(i)"), "chaque image retire la voix de la page avant sa propre voix");
console.log("idle-intro-voix-par-image-sans-page-v1: OK");
