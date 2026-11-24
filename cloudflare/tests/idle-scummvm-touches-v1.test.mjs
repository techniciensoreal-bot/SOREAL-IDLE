/* Boutons d'Énigmes (Norman, 2026-11-23) : Pause, Menu, souris lente (téléphone), musique (téléphone). Les boutons de verbes ajoutés puis RETIRÉS à sa demande (« c'est moche ») : le jeu garde ses propres verbes. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-scummvm-v1.css", "utf8");
assert.ok(!/scvVoileV1|majVoile|Verbes du jeu|NB_VERBES|key:'o',code:'KeyO'/.test(src), "plus de voile ni de boutons de verbes");
assert.ok(src.includes("key:' ',code:'Space',kc:32") && src.includes("key:'F5',code:'F5',kc:116"), "Pause (Espace) et Menu (F5), touches mesurées dans le jeu");
assert.ok(!/Passer la scène/.test(src), "pas de bouton « Passer la scène »");
assert.ok(src.includes("htmlTouches('scv-touches')") && src.includes("scv-touches-plein"), "rangée sous le jeu + bande en plein écran");
assert.ok(src.includes("window.__scvTouche__=") && src.includes("new w.KeyboardEvent(type"), "les touches partent dans la fenêtre du jeu");
assert.ok(/\.scv-plein\.scv-avec-touches iframe\{height:calc\(/.test(css), "le jeu est raccourci de la bande en plein écran");
assert.ok(/aspect-ratio:4\/3/.test(css), "zone de jeu 4:3 (aucune bande noire sur les côtés)");
// souris lente (téléphone)
assert.ok(src.includes("FACTEUR_LENT=0.3") && src.includes("installerSouris(fenetreJeu())") && src.includes("soreal_idle_scummvm_sensibilite_v1"), "souris émulée ralentie (facteur 0,3, bouton pour alterner)");
// son léger (téléphone seulement)
assert.ok(src.includes("--opl-driver=db") && src.includes("--music-driver=null") && src.includes("appareilTactile()?"), "téléphone : OPL léger, 22 kHz, musique coupée par défaut");
assert.ok(src.includes("' --music-driver=adlib'") && !/musiqueActive()?'':/.test(src), "téléphone, musique active : pilote AdLib imposé (jamais le MIDI WebMIDI de l'appareil)");
assert.ok(src.includes("soreal_idle_scummvm_musique_v1") && src.includes("relancerMoteur()"), "bouton Musique (préférence du compte) qui relance le moteur");
assert.ok(src.includes("audio_buffer_size:'8192',output_rate:'22050'"), "tampon audio plus grand dans scummvm.ini (tactile)");
console.log("idle-scummvm-touches-v1: OK");
