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
assert.ok(/S\.morts>0\?\['base','morts','score','base'\]:\['base','score','base'\]/.test(led), "dans la rotation seulement si > 0");
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
// Norman (2026-11-02) : UNE SEULE animation par combat, du début à la fin : soit la mascotte qui court (calée sur la vie, château et feux d'artifice à la victoire), soit Leatherface (tronçonneuse, danse finale à la victoire)
{
  const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
  assert.ok(led.includes("animChoisie=Math.random()<0.5?'mascot':'sweep'"), "l'animation du combat est tirée au début du combat");
  assert.ok(led.includes("demarrer(mk(combatAnim,now,{long:true}))") && led.includes("if(p.long)d=1e9;"), "elle reste à l'écran tout le combat");
  assert.ok(!led.includes("interN%3===1?'bars':interN%3===2&&S.pv?'sweep':'mascot'"), "plus de rotation d'animations pendant un combat");
  assert.ok(led.includes("if(id==='win')p.anim=combatAnim;") && led.includes("(an==='sweep'?sSweep:sMascot)(t)"), "la victoire joue la fin de l'animation du combat");
  assert.ok(!led.includes("var HEROS_GRAND="), "plus de héros « mascotte à la tronçonneuse » : c'est Leatherface");
  assert.ok(!led.includes("pousser('hit',now,") && !led.includes("objetDu(now)){var oi=objetSuivant(now,true)") && !led.includes("demarrer(mk('bars',now))"), "aucun interlude pendant un combat : ni POW ! / BAM !, ni annonce d'objet, ni barre de vie du joueur (Norman, 2026-11-02 : l'animation se voit du début à la fin)");
  assert.ok(led.includes("dessinerPose(DANSE_POSES[3],sx,sy,es)"), "Leatherface scie du début à la fin, sur la piste de vie");
  assert.ok(led.includes("put(D,16,9,'SS');put(D,16,13,'SS')"), "tronçonneuse tenue à deux mains");
  const m = led.slice(led.indexOf("function sMascot(t){"), led.indexOf("/* 5 bis."));
  assert.ok(m.includes("r.split('').reverse().join('')") && m.includes("hx-6+sp*phi-k*per"), "la mascotte court vers la gauche (sprite et piques inversés)");
  assert.ok(m.includes("hx=Math.min(x0+n,W-10)") && m.includes("hx=x0-Math.round(sp*(t-pp.te))"), "calée sur le bout de la barre, sort par la gauche quand elle est vide");
  assert.ok(m.includes("CHATEAU") && m.includes("burst(fx+"), "château et feux d'artifice en fin de niveau");
  assert.ok(m.includes("arrive=chat&&vie<=0.06") && m.includes("tg=pp.tArr") && m.includes("Math.floor(tg*sp)") && m.includes("R(i,3)*W+tg*7"), "château arrivé : le sol et les étoiles se figent, seul le bonhomme continue de marcher (Norman, 2026-11-02)");
  assert.ok(led.includes("var DANSE_POSES=posesDanse();") && led.includes("ph=cycle<0.8?0:cycle<1.2?2:cycle<2.0?1:4"), "la danse enchaîne face, coup à gauche, dos, coup à droite (poses des photos du film)");
  console.log("idle-borne-duel-leds-v1 (une animation par combat : mascotte ou Leatherface) : OK");
}
// Norman (2026-11-02) : animations seulement pour un combat d'au moins 6 s ; FIGHT ! une seconde avant elle ; le nom du boss s'écrit dès qu'il apparaît ; Leatherface s'adapte à un écran moins haut
{
  const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
  assert.ok(led.includes("if(now-fightT0<1000)return;") && led.includes("if(total>=6){animDecision=1;combatAnim=animChoisie;"), "animation décidée après 1 s de FIGHT !, seulement si la durée estimée atteint 6 s");
  assert.ok(led.includes("var total=el+S.pv.pct/(chute/el);") && led.includes("else if(el>=4)animDecision=-1;"), "durée estimée = écoulé + vie restante / vitesse de baisse ; sans baisse après 4 s, pas d'animation");
  assert.ok(!led.includes("now-fightT0>2200"), "plus de FIGHT ! de 2,2 s");
  assert.ok(led.includes("combatAnim='';animDecision=0;") && led.includes("if(id==='win')p.anim=combatAnim;"), "combat court : la victoire n'utilise pas d'animation");
  assert.ok(led.includes("function sNom(t)") && led.includes("nom:{fn:sNom") && led.includes("demarrer(mk('nom',now));return;"), "le nom du nouveau boss s'écrit d'abord");
  assert.ok(led.includes("cur.id==='nom'&&S.combat){fightT0=now;demarrer(mk('fight',now));}"), "puis FIGHT !");
  assert.ok(led.includes("function echelleDanse()") && led.includes("if(H>=15&&W>=30){") && !led.includes("if(H>=26&&W>=40){"), "Leatherface tient dans un écran moins haut (réduit au plus proche voisin)");
  console.log("idle-borne-duel-leds-v1 (6 s, nom, FIGHT 1 s, Leatherface adapté) : OK");
}
// Norman (2026-11-02) : « supprime "Le saviez-vous ?" de la borne, toute trace de son existence, du menu admin aussi »
{
  const racine = "cloudflare/";
  const led = fs.readFileSync(racine + "public/modules/borne-led-v1.js", "utf8");
  const txt = fs.readFileSync(racine + "public/modules/textes-admin-v1.js", "utf8");
  const idx = fs.readFileSync(racine + "public/index.html", "utf8");
  const srv = fs.readFileSync(racine + "src/idle-textes-v1.js", "utf8");
  assert.ok(!/saviez|jokes|sJokes|phraseAdmin|apercu/i.test(led), "plus rien dans le panneau LED");
  assert.ok(!/SAVIEZ_VOUS|saviez/i.test(txt) && !/saviez/i.test(idx), "plus rien dans le menu Admin ni dans la page");
  assert.ok(!fs.existsSync(racine + "public/modules/admin-saviez-vous-v1.js"), "module d'éditeur supprimé");
  assert.ok(!/IDLE_SAVIEZ|normaliserSaviezVous|phraseSaviez/.test(srv) && srv.includes("DELETE FROM idle_textes WHERE cle LIKE 'saviez-vous:%'"), "serveur : validation supprimée, ancienne ligne effacée");
  console.log("idle-borne-duel-leds-v1 (« Le saviez-vous ? » supprimé) : OK");
}
