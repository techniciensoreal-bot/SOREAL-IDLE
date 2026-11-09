import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-09) : « supprime toutes les voix de Cthulhu dans le tuto ; je ne veux que du texte et qu'on puisse cliquer ou tapoter l'écran pour passer au texte suivant ; avec un “Touchez l'écran” qui apparaît quand la phrase est terminée ; j'aimerais un son quand il parle,
 * comme dans les vieux jeux vidéo ». Plus de voix pour les guides de Cthulhu (guide.mascotte) ; le texte s'écrit lettre après lettre avec un bip (lhu-voix-v1.js) ; un toucher n'importe où fait avancer, sans atteindre le jeu.
 */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const tuto = lire("public/modules/tutoriel-v1.js");
// 1. aucune voix pour Cthulhu : lireEtape_ sort avant toute lecture
const lecture = tuto.slice(tuto.indexOf("function lireEtape_"), tuto.indexOf("function lireEtape_") + 1200);
assert.ok(lecture.indexOf("if(s.guide&&s.guide.mascotte)return;") > 0 && lecture.indexOf("if(s.guide&&s.guide.mascotte)return;") < lecture.indexOf("tts.readText("), "les guides de Cthulhu ne lisent plus rien à voix haute");
// 2. texte lettre après lettre, « Touchez l'écran » quand c'est fini
assert.ok(tuto.includes("function demarrerDictee_(s)") && tuto.includes("B.bip(null,d.n)") && tuto.includes("finirDictee_(s,d)"), "dictée avec bip");
assert.ok(tuto.includes("Touchez l’écran") && tuto.includes("tu-toucher\" hidden"), "« Touchez l’écran » caché jusqu'à la fin de l'écriture");
assert.ok(tuto.includes("if(h)h.hidden=false;"), "il apparaît quand la phrase est terminée");
assert.ok(tuto.includes('data-sans-traduction="1"') && tuto.includes("trad.traduire(x)"), "texte traduit ici : le traducteur ne touche pas à un texte qui change à chaque lettre");
assert.ok(tuto.includes("'#'+ID+'.tu-bulle .tu-texte .tu-reste{visibility:hidden}'"), "la bulle garde sa taille finale pendant l'écriture");
// 3. un toucher avance, sans atteindre le jeu
assert.ok(tuto.includes("function toucherDialogue_(s)") && tuto.includes("if(!d.fini){finirDictee_(s,d);return;}"), "un toucher pendant l'écriture l'affiche en entier ; un toucher sur un texte fini passe au suivant");
assert.ok(/window\.addEventListener\('click',function\(ev\)\{\s*var s=dialogueTouche_\(\);[^]*ev\.cancelable\)ev\.preventDefault\(\);\s*ev\.stopPropagation\(\);ev\.stopImmediatePropagation\(\);\s*toucherDialogue_\(s\);/.test(tuto), "le clic est annulé et fait avancer le dialogue");
assert.ok(tuto.includes("['pointerdown','mousedown','touchstart','pointerup','mouseup','touchend','dblclick']"), "pression / relâchement arrêtés (pas annulés : le « clic » du toucher reste produit)");
assert.ok(/if\(!s\|\|!s\.guide\|\|!s\.guide\.mascotte\|\|s\.attenteClic\|\|s\.sceneEnCours\|\|s\.cache\|\|!s\.dict\)return null;/.test(tuto), "rien n'est intercepté sur une étape qui demande de cliquer, pendant une scène de vol, ni sans texte écrit");
assert.ok(tuto.includes("TOUCHER_MAX_MS=180000"), "garde-fou : jamais un écran verrouillé plus de 3 minutes");
assert.ok(tuto.includes("if(s.attenteClic&&s.dict&&s.dict.fini&&Date.now()-s.dict.finiA>=RANGER_APRES_MS&&!b.hidden)b.hidden=true;"), "étape à cliquer : la bulle se range après l'écriture, comme avant");
// 4. le module de bips : huit timbres, choix mémorisé, hasard déterministe, volume 0 = silence
const code = lire("public/modules/lhu-voix-v1.js");
const magasin = {};
const appels = [];
const fen = {
  localStorage: { getItem: (k) => magasin[k] ?? null, setItem: (k, v) => { magasin[k] = v; } },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 0.5 },
  AudioContext: function () {
    const noeud = () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 }, gain: { setValueAtTime(...a) { appels.push(a); }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 }, setPeriodicWave() {}, buffer: null, type: "" });
    Object.assign(this, { state: "running", currentTime: 0, sampleRate: 8000, destination: {}, createOscillator: noeud, createGain: noeud, createBiquadFilter: noeud, createBufferSource: noeud, createBuffer: () => ({ getChannelData: () => new Float32Array(400) }), createPeriodicWave: () => ({}) });
  }
};
fen.window = fen;
vm.runInNewContext(code, fen);
const B = fen.__SOREAL_IDLE_LHU_BIP_V1__;
assert.equal(B.styles.length, 8, "huit timbres à écouter");
assert.equal(B.courant(), "bulle", "timbre par défaut : celui choisi par Norman (n° 5, Bulle)");
assert.equal(B.choisir("grogne"), true);
assert.equal(B.courant(), "grogne");
assert.equal(magasin.soreal_idle_lhu_bip_v1, "grogne", "choix mémorisé dans le stockage du compte (clé soreal_idle_*)");
assert.equal(B.choisir("inconnu"), false);
assert.equal(B.parlable("a") && B.parlable("É") && B.parlable("7"), true);
assert.equal(B.parlable(" ") || B.parlable(".") || B.parlable("!"), false, "pas de bip sur un espace ni une ponctuation");
for (const s of B.styles) assert.equal(B.bip(s.id, 5), true, s.id + " : un bip part");
fen.__SOREAL_IDLE_AUDIO_VOLUME_V1__.getInterface = () => 0;
assert.equal(B.bip("carre", 1), false, "volume des sons de l'interface à 0 : silence");
// 5. la page charge le module avant le tutoriel
const index = lire("public/index.html");
assert.ok(index.indexOf("/modules/lhu-voix-v1.js") > 0 && index.indexOf("/modules/lhu-voix-v1.js") < index.indexOf("/modules/tutoriel-v1.js"), "lhu-voix-v1.js chargé avant tutoriel-v1.js");
console.log("idle-tuto-cthulhu-texte-seul-v1: OK");
