import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : l'inventaire reprend le look du Money Pit v2 ; le Coffre est un coffre à pattes, dents et langue (clin d'œil Discworld) qui croque les objets déposés. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const dict = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
const rendu = ui.slice(ui.indexOf("function rendreCadreCoffreAdventureIdleV1_("), ui.indexOf("function idleCoffreOuvertV1_()"));

// La gueule du Bagage est la zone de dépôt (mêmes attributs de glisser-déposer qu'avant).
for (const t of ["data-idle-coffre-drop-v180", "ondrop=\"window.__deposerSurCoffreAdventureIdleV1__(event)\"", "onclick=\"window.__clicCoffreAdventureIdleV1__()\"", "bg-bagage-v1", "BAGAGE_SVG_IDLE_V1", "Il mange les objets pour les ranger."]) assert.ok(rendu.includes(t), t);
assert.ok(ui.includes("<svg viewBox=\"0 0 320 260\"") && ui.includes("bg-langue") && ui.includes("bg-patte") && ui.includes("bg-couvercle"), "coffre à pattes, dents et langue");
// Le drapeau « vient d'avaler » survit au redessin de la page.
assert.equal((ui.match(/window\.__bagageAvaleIdleV1=Date\.now\(\)/g) || []).length, 2, "dépôt par glisser et par clic");
assert.ok(rendu.includes("window.__bagageAvaleIdleV1||0)<1300?' croque'"), "la gueule croque aussi après le redessin");
// Look : polices de jeu, panneaux dorés, animations coupées en mouvement réduit, boucles sans à-coup (règle n°3).
const v2 = css.slice(css.indexOf("Inventaire v2 (Norman"));
assert.ok(v2.includes('"Bangers"') && v2.includes('"Russo One"') && !/Georgia/.test(v2), "polices de jeu");
assert.ok(/prefers-reduced-motion:reduce\)\{\.bg-bagage-v1 \.bg-couvercle/.test(v2), "mouvement réduit");
for (const k of ["bgBaille", "bgLeche", "bgTrotte", "bgRespire"]) assert.ok(new RegExp("@keyframes " + k + "\{0%,100%\{").test(v2), k + " : départ et arrivée identiques");
// Anglais : le texte du Bagage existe en anglais.
for (const fr of ["Il mange les objets pour les ranger."]) assert.ok(dict[fr], "version anglaise : " + fr);
// Un seul cadre, sans pointillés ; sons avalé / recraché branchés sur le dépôt et la reprise.
assert.ok(css.includes("coffre-v1 [data-idle-coffre-drop-v180]{border:0!important"), "plus de cadre pointillé autour de la gueule");
assert.ok(css.includes(".ouvert>div:last-child{margin:4px 14px 16px!important;padding:12px 0 0!important;border:0!important"), "plus de second cadre autour de la recherche et des cases");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
assert.ok(ui.includes("jouerEffetAudioIdleV199_('coffreAvale')") && ui.includes("jouerEffetAudioIdleV199_('coffreRecrache')"), "sons au dépôt et à la reprise");
assert.ok(audio.includes("coffreAvale:{group:\"chest\"") && audio.includes("jouerAleatoire"), "sons du Coffre dans le moteur audio");
const sons = readFileSync("cloudflare/public/modules/audio-coffre-v1.js", "utf8");
assert.equal((sons.split('var ROTS=')[0].match(/{id:'/g) || []).length, 20, "10 sons pour avaler, 10 pour recracher");
const cadre = css.slice(css.indexOf("Cadre propre au Coffre"));
assert.ok(cadre.includes(".soreal-idle-section-v8.soreal-idle-coffre-v1{") && cadre.includes("#6b4a33") && cadre.includes("--cuivre"), "cadre du Coffre : bois et cuivre, plus le vert du thème");
console.log("idle-inventaire-v2-bagage-v1: OK");
