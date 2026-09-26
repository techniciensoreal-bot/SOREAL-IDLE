import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-26) : « T3-tom-lent est bien » (voix de Tom plus stable et un peu plus lente, encodée à 96 kbit/s : à 32 kbit/s, effet « quelque chose dans la gorge ») ;
 * « il prononce mal le nom du jeu : c'est Soréalle Ailledeulle » ; « après le popup du sandwich, une voix en arrière-plan, puis une voix de femme : J'ADORE SOREAL IDLE… ».
 */
const piper = readFileSync("cloudflare/public/modules/local-neural-piper-v1.js", "utf8");
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const generateur = readFileSync("cloudflare/tools/voice-generate.mjs", "utf8");

// --- prononciation du nom du jeu ---
const src = piper.slice(piper.indexOf("var PRONONCIATIONS_=["), piper.indexOf("/*\n * Astérisques"));
const { normaliser, reglages } = new Function(src + "\nreturn {normaliser:normalizePronunciation_,reglages:REGLAGES_VOIX_};")();
assert.equal(normaliser("Bienvenue dans SOREAL IDLE !"), "Bienvenue dans Soréalle Ailledeulle !");
assert.equal(normaliser("Soreal Idle"), "Soréalle Ailledeulle", "sans casse");
assert.equal(normaliser("J’ADORE SOREAL IDLE. CROYEZ TOUT CE QU’IL VOUS DIT."), "J’ADORE Soréalle Ailledeulle. CROYEZ TOUT CE QU’IL VOUS DIT.");
assert.equal(normaliser("Sorealement et Idleness"), "Sorealement et Idleness", "seuls les mots entiers sont remplacés");
assert.equal(normaliser("Norman & Sébastien : Fight Boss"), "Normanne & Sébastien : Faïte Bosse", "les règles précédentes restent");

// --- réglage de Tom (T3), sans toucher aux autres voix ---
assert.deepEqual(JSON.parse(JSON.stringify(reglages)), { tom: { noise_scale: 0.55, length_scale: 1.07, noise_w: 0.7 } });
assert.ok(piper.includes('const inference=Object.assign({},config.inference||{},REGLAGES_VOIX_[String(config.dataset||"")]||{});'), "appliqué d'après le jeu de données du modèle (« tom ») ; la dame garde sa configuration");

// --- nouvelle marque de voix : toutes les empreintes changent, rien de l'ancienne voix ne peut être mélangé ---
assert.ok(tts.includes("var VOICE_TAG='tom2';"));
assert.ok(generateur.includes('voice: "tom2"'));
assert.ok(generateur.includes('const DEBIT = String(arg("bitrate", "96k"));'), "96 kbit/s par défaut");
const manifeste = JSON.parse(readFileSync("cloudflare/public/voice/manifest.json", "utf8"));
assert.equal(manifeste.voice, "tom2", "fichiers du jeu = voix v2");

// --- la dame ---
const debut = tts.indexOf("var TEXTES_VOIX_FEMME=");
const fin = tts.indexOf("}", tts.indexOf("function estVoixFemme_(chunk){", debut)) + 1;
const estVoixFemme = new Function(tts.slice(debut, fin) + "\nreturn estVoixFemme_;")();
assert.equal(estVoixFemme("J’ADORE SOREAL IDLE. CROYEZ TOUT CE QU’IL VOUS DIT."), true);
assert.equal(estVoixFemme("  J’ADORE SOREAL IDLE. CROYEZ TOUT CE QU’IL VOUS DIT.  "), true);
assert.equal(estVoixFemme("Oui, je sais…"), false, "Tom lit tout le reste");
assert.ok(generateur.includes("MODELE_FEMME") && generateur.includes("REGLAGES_FEMME") && generateur.includes("ouvrirPage(navigateur, true)"), "le générateur synthétise la dame avec son modèle");
assert.ok(generateur.includes("femme: Boolean(tts.estVoixFemme && tts.estVoixFemme(texte))"));

// --- le passage après le popup du sandwich ---
assert.ok(ui.includes("const VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1="));
const passage = ui.slice(ui.indexOf("const VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1="), ui.indexOf("function lancerVoixArrierePlanSandwichIdleV1_(){"));
for (const morceau of ["Oui, je sais…", "dessins d’enfants", "cette dame qui a un mot à nous dire", "À vous, madame :", "J’ADORE SOREAL IDLE. CROYEZ TOUT CE QU’IL VOUS DIT."]) {
  assert.ok(passage.includes(morceau), "texte : " + morceau);
}
assert.ok(passage.indexOf("pauseVoixIdleV1_(900)") > passage.indexOf("À vous, madame :") && passage.indexOf("pauseVoixIdleV1_(900)") < passage.indexOf("J’ADORE"), "une pause avant la dame");
const lancer = ui.slice(ui.indexOf("function lancerVoixArrierePlanSandwichIdleV1_(){"), ui.indexOf("function tutorielPagesFermerV1_(){"));
assert.ok(lancer.includes("!tts.enabled()"), "respecte la voix IA automatique du joueur");
assert.ok(lancer.includes("tts.readText(VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1)"));
const fermer = ui.slice(ui.indexOf("function tutorielPagesFermerV1_(){"), ui.indexOf("window.__tutorielPagesNaviguerV1__="));
assert.ok(fermer.includes("etat.pages===TUTORIEL_DEBUT_JEU_PAGES_V1&&etat.index>=etat.pages.length-1"), "seulement après le tutoriel de début, dernière page atteinte (le sandwich)");
assert.ok(ui.includes("textes.push(VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1);"), "le passage est pré-généré comme les autres textes");

console.log("idle-voice-tom-tuned-and-femme-v1: OK");
