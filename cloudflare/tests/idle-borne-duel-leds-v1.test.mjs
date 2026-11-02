/* Duel de la borne (Norman, 2026-11-01) : plus de ligne rouge ni de cadre autour des deux images ; le nom du joueur est sur un petit écran LED ; le nombre de fois que le boss courant a été tué passe dans la rotation du grand panneau LED (jamais sous l'image du boss). */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const lire = (p) => fs.readFileSync(path.join(racine, p), "utf8");
const css = lire("soreal-idle-itopod.css");
const led = lire("modules/borne-led-v1.js");
const combat = lire("modules/ui-combat-2-v1.js");
const cssLed = lire("soreal-idle-borne-led-v1.css");

/* 1. aucune ligne néon sous les plaques, aucun cadre de couleur sur les portraits du duel */
assert.ok(!/duel-nameplate-v65\{[^}]*border-bottom:3px solid/.test(css), "plus de ligne sous les plaques de nom");
assert.ok(!/duel-fighter-v42:last-child \.soreal-idle-duel-nameplate-v65\{[^}]*border-bottom:3px/.test(css), "plus de ligne rouge sous le panneau du boss");
const portrait = css.match(/\.soreal-idle-duel-portrait-v41\{\s*position:relative;[^}]*\}/);
assert.ok(portrait && /border:0!important/.test(portrait[0]) && /box-shadow:none!important/.test(portrait[0]), "portraits sans cadre ni halo");

/* 2. le nom du joueur est sur un écran LED ambre, police 5x7 échelle 1 (le texte reste masqué pour la traduction et les lecteurs d'écran) */
assert.ok(/class="bn-led-mini bn-led-joueur"[^>]*data-morph-vivant/.test(combat), "hôte LED du joueur, règle n°4");
assert.ok(/duel-name-text-v65 bn-sr-only/.test(combat), "le nom reste dans la page, masqué");
assert.ok(/\[S\.nomJ,AMB\]/.test(led) && /rich\(p\.segs,x,bt,1,255\)/.test(led), "nom du joueur en ambre, échelle 1");

/* 3. le nombre de morts : PAS sous l'image du boss, mais dans la rotation du grand panneau ; boss courant seulement, jamais de total, rien à 0 */
assert.ok(!/bn-led-morts|bn-avec-morts/.test(combat + css + cssLed + led), "aucun écran de morts sous l'image du boss");
assert.ok(/morts:\{fn:sMorts/.test(led), "scène « morts » du panneau");
assert.ok(/S\.morts>0\?\['base','morts','score','base','jokes'\]:\['base','score','base','jokes'\]/.test(led), "dans la rotation seulement si > 0");
assert.ok(/x\.source==='boss'&&x\.decouvert&&Math\.floor\(nombre\(x\.numero\)\)===sel/.test(led), "source = bestiaire.entrees (boss sélectionné)");
const m = led.slice(led.indexOf("function sMorts"), led.indexOf("/* 2. FIGHT"));
assert.ok(!/'\s*\/\s*'/.test(m) && !/S\.vic|bossCatalogue|\.length/.test(m.replace(/cands\.length/g, "")), "aucun total (pas de « x / y »)");
assert.ok(/tue:'TUÉ',fois:'FOIS'/.test(led) && /tue:'KILLED',fois:'TIMES'/.test(led), "textes français et anglais");
assert.ok(!/wiki/i.test(led), "aucun mot interdit");

/* 4. règle n°4 : canvas ajouté par le module, gardé par le morph ; rendu net, sans !important */
assert.ok(/cv\.setAttribute\('data-morph-garder',''\);cv\.setAttribute\('data-morph-vivant',''\)/.test(led.slice(led.indexOf("function syncMinis"))), "canvas gardé");
assert.ok(/CELL_PC/.test(led.slice(led.indexOf("function tailleMini"))), "taille de point entière");
assert.ok(/\.bn-led-mini\{[^}]*background:#020202/.test(cssLed) && !/!important/.test(cssLed), "boîtier noir, sans !important");

/* 5. la barre de vie LED est PLEINE : ni trait qui la coupe, ni rangées atténuées */
assert.ok(/seam=1;/.test(led), "barre de vie pleine, sans coupure");
console.log("idle-borne-duel-leds-v1: OK");
// Norman (2026-11-01) : lettres d'unité (K, M, AB…) en couleur sur l'écran LED, régénération en petite police 3x5
{
  const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
  assert.ok(led.includes("function fnUnites(s)") && led.includes("nb-suf") && led.includes("fnUnites(txt)"), "unités des PV en couleur (couleurs lues dans la feuille de style du jeu)");
  assert.ok(led.includes("var MINI={"), "petite police 3x5 pour la vie");
  console.log("idle-borne-duel-leds-v1 (unités + mini) : OK");
}
// Norman (2026-11-01) : chiffres de la vie du boss SOUS la jauge, à gauche, sur la ligne de la régénération (petite police)
{
  const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
  const b = led.slice(led.indexOf("function barre(t){"), led.indexOf("var cbId=-1;"));
  assert.ok(b.includes("miniText(txt,Math.max(1,Math.floor((W-miniWidth(txt))/2)),lr,BLA,255,fnUnites(txt))") && !b.includes("text(txt,tx,ty"), "chiffres sous la jauge à gauche, régénération à droite, même ligne, plus de texte dans la jauge");
  console.log("idle-borne-duel-leds-v1 (vie sous la jauge) : OK");
}
// Norman (2026-11-02, corrigé) : la vie du boss est TOUJOURS affichée ; « 5 / 10 » seulement hors combat quand il régénère, sinon la vie seule (qui descend pendant le combat)
{
  const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
  const b = led.slice(led.indexOf("function barre(t){"), led.indexOf("var cbId=-1;"));
  assert.ok(!b.includes("if(S.combat||pv.pct>=1||!pv.regen)return;"), "la vie n'est jamais masquée");
  assert.ok(!b.includes("pv.regen"), "plus de régénération affichée (inutile, Norman 2026-11-02)");
  assert.ok(b.includes("txt=pv.cur+' / '+pv.max;"), "format cur / max toujours");
  assert.ok(led.includes("(S.combat?'c':'')"), "le changement combat / hors combat redessine la jauge");
  console.log("idle-borne-duel-leds-v1 (vie centrée, toujours cur / max, sans régénération) : OK");
}
// Norman (2026-11-02) : héros à la tronçonneuse (grand, dessiné à la main, deux mains, yeux noirs) qui suit la fin de la piste de vie ; mascotte qui court vers la gauche calée sur la barre, château et feux d'artifice quand elle est vide
{
  const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/
/g, "
");
  assert.ok(led.includes("var HEROS_GRAND=") && led.includes("sweep:{fn:sSweep"), "interlude du héros à la tronçonneuse");
  assert.ok(led.includes("[3,15,'W..W..W']") && !led.includes("WAWAW..'"), "yeux noirs (trous), plus de yeux ambre sur le grand héros");
  assert.ok(led.includes("[14,9,'W'],[14,10,'WWW']") && led.includes("[14,13,'W']"), "deux mains sur la tronçonneuse");
  const m = led.slice(led.indexOf("function sMascot(t){"), led.indexOf("/* 5 bis."));
  assert.ok(m.includes("r.split('').reverse().join('')") && m.includes("hx-6+sp*phi-k*per"), "la mascotte court vers la gauche (sprite et piques inversés)");
  assert.ok(m.includes("hx=Math.min(x0+n,W-10)") && m.includes("hx=x0-Math.round(sp*(t-pp.te))"), "calée sur le bout de la barre, sort par la gauche quand elle est vide");
  assert.ok(m.includes("CHATEAU") && m.includes("burst(fx+"), "château et feux d'artifice en fin de niveau");
  assert.ok(led.includes("function danseFinale(") && led.includes("danseFinale(t,fl,") && led.includes("pc<=0.002"), "danse finale (tour sur lui-même, tronçonneuse qui tournoie, soleil levant) quand la barre est vide");
  console.log("idle-borne-duel-leds-v1 (héros tronçonneuse, mascotte vers la gauche, château) : OK");
}
