import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Éditeur de voix (Norman, 2026-10-08) : « le texte de base tout en haut, que je peux ou non éditer ; en dessous, la partie voix où j'écris tout et n'importe quoi pour que ça prononce correctement, sans éditer le texte du boss ».
 * Éditeur pensé pour 1920 x 1080 (il n'édite les voix que sur PC).
 */
const src = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");

// Éditeur repensé (Norman, 2026-10-11) : cadre DORÉ (texte des joueurs, jamais générateur de voix) AU-DESSUS des cartes de personnages (texte dit, voix, génération).
const unite = src.slice(src.indexOf("function uniteHtml_("), src.indexOf("function cadresChampHtml_("));
assert.ok(unite.indexOf("Texte tel que les joueurs le lisent") < unite.indexOf('class="stx-persos"'), "le cadre doré est AU-DESSUS des personnages");
assert.ok(unite.includes('class="stx-or"') && unite.includes("data-stx-affiche=") && !unite.includes("data-stx-l=\"generer\""), "le cadre doré s'édite et s'enregistre mais ne génère aucune voix");
const carte = src.slice(src.indexOf("function cadreHtml_("), src.indexOf("/* Un texte = cadre doré"));
assert.ok(carte.includes("data-stx-ltexte=") && carte.includes("data-stx-l=\"generer\"") && carte.includes("data-stx-sel="), "chaque personnage : son texte dit, sa génération, sa case de sélection");
assert.ok(src.includes("o.synthetiser(texteVoixDe_(b),b.parleur,b.expr)"), "la génération envoie le texte dit");
assert.ok(src.includes("parle:{}") && src.includes("o.parle[c.id]=") && src.includes("function valeurParleeChamp_(c){"), "texte dit enregistré à côté du texte affiché");

// Le texte de voix remplace seulement ce qui est ENVOYÉ AU STUDIO ; l'empreinte (donc le fichier) reste celle du texte affiché
assert.ok(src.includes("o.synthetiser(texteVoixDe_(b),b.parleur,b.expr)"), "la génération envoie le texte de voix");
assert.ok(src.includes("var t=String(v==null?'':v).replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim();\n  return t||b.texte;") || src.includes("return t||b.texte;"), "sans texte de voix : le texte affiché tel quel");
assert.ok(src.includes("var hash=t.hashBloc(e.chunk);"), "l'empreinte vient du texte affiché (chunk), pas de la voix");
// Enregistrement : seulement les blocs existants ; jamais envoyé aux joueurs (voir idle-textes-v1.test.mjs)
assert.ok(src.includes("o.voixTextes[h]=edition.voixTextes[h]") && src.includes("voixTextes:{},voixFaites:{}"), "textes de voix enregistrés avec le texte");
// Test direct avec le studio et copie du texte affiché
// Fiche administrateur des popups (textes de voix) gardée pour rouvrir sans les perdre
assert.ok(src.includes("admin.popups.push(Object.assign({cle:cle},surcharge));") && src.includes("base.voixTextes=adm.voixTextes||{};"), "popups : textes de voix retrouvés à la réouverture");

// Mise en page 1920 x 1080
assert.ok(src.includes("max-width:1780px"), "grande carte");
assert.ok(/stx-cadres\{grid-template-columns:repeat\(auto-fit,minmax\(820px,1fr\)\)/.test(src), "deux bulles côte à côte sur un écran de 1920");
assert.ok(src.includes(".stx-v2 textarea,#'+EDITEUR_ID+' .stx-v2 input[type=text]{font-size:17px"), "texte plus gros");

// Studio : respirations / silences rognés
const studio = readFileSync("cloudflare/tools/voice-studio/serveur.py", "utf8");
assert.ok(studio.includes("def couper_bords(wav, sr, question=False):") && studio.includes("wav = couper_bords(wav, m.sr, est_question(segment))"), "souffle / silence de début et de fin rognés sur chaque segment");
assert.ok(studio.includes("RACCORD_S = 0.22") && studio.includes("def avec_silence_final(wav, sr):"), "raccords en vrais silences + silence final propre");
console.log("idle-voix-texte-editeur-v1: OK");
