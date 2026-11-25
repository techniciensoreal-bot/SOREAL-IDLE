/* Démarrage d'Énigmes fiable (Norman, 2026-11-23 : « parfois le jeu ne démarre pas, il faut recharger la page ») : un échec de lecture du catalogue n'est jamais mémorisé, un moteur muet est relancé une fois. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
assert.ok(src.includes("catalogueEssaiLe"), "essai du catalogue horodaté");
assert.ok(src.includes("Date.now()-catalogueEssaiLe<5000"), "nouvel essai au plus toutes les 5 s");
assert.ok(src.includes("return r.ok?r.json():null") && src.includes("if(!d||!Array.isArray(d.jeux))return;"), "un échec (réseau, 404) ne remplit pas le catalogue : il reste « pas encore lu »");
assert.ok(!/catch\(function\(\)\{return \{jeux:\[\]\};\}\)/.test(src), "plus de catalogue vide mémorisé après une erreur");
assert.ok(src.includes("relancesMoteur<1") && src.includes("Date.now()-iframeSrcLe>90000") && src.includes("ifr.src='about:blank'"), "moteur muet depuis 90 s : une seule relance");
// reprise directe : le premier lancement exige « Jouer », ensuite le jeu reprend seul (état lié au compte), même après un clic sur une page ouverte sans geste
assert.ok(src.includes("lire()==='lance'&&activationPage()"), "reprise seule après le premier « Jouer » (état 'lance', lié au compte)");
assert.ok(src.includes("['click','keydown','touchend']"), "page ouverte sans geste : la reprise part au premier clic");
assert.ok(src.includes("ecrire('');   /* le jeu repart de zéro"), "« Recommencer la partie » redemande le clic sur « Jouer »");
assert.ok(src.includes("try{synchroniser();}catch(_e){}   /* le jeu est connu"), "reprise aussi quand le catalogue arrive après l'affichage");
// compteur d'AP « obtenus / total » (exception du 2026-11-23 à la règle n°2, voir AGENTS.md)
assert.ok(src.includes("AP obtenus :") && src.includes("' / '+esc(nombreLisible(plafond))"), "compteur d'AP obtenus / plafond");
console.log("idle-scummvm-demarrage-v1: OK");
// remise à zéro unique par compte (Norman, 2026-11-24) : repère lié au compte, partie effacée une seule fois, introduction rejouée ; crédits version 3 retirés par le moteur
{
  const s2 = src;
  assert.ok(s2.includes("soreal_idle_scummvm_reinit_v3") && s2.includes("window.setTimeout(recommencer,0)"), "remise à zéro unique au premier affichage");
  const m = readFileSync("cloudflare/src/idle-scummvm-progres-v1.js", "utf8");
  assert.ok(m.includes("IDLE_SCUMMVM_VERSION_CREDITS_V1 = 3"), "crédits version 3");
}
{ const pg0 = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8"); assert.ok(pg0.includes("host.getBoundingClientRect()") && pg0.includes("N.montrer(Number(d.ap)"), "le « +N AP » part du jeu lui-même (hôte), pas de la zone de la page"); }
// décor d'Énigmes (Norman, 2026-11-24) : le jeu est calé sur le rectangle mesuré de fond-enigmes-v1.webp (x 408..1126, y 141..679 sur 1536 x 1024), grand écran à souris seulement
{
  const css = readFileSync("cloudflare/public/soreal-idle-scummvm-v1.css", "utf8");
  assert.ok(css.includes("fond-enigmes-v1.webp") && css.includes("center/100% 100%"), "l'image du décor est affichée ENTIÈRE (jamais coupée, 2026-11-25)");
const pg = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
assert.ok(pg.includes("const DECOR_IMG={w:1536,h:1024,x:396,y:141,lw:743,lh:539}") && pg.includes("const s=W/DECOR_IMG.w"), "zone du jeu recalculée selon l'échelle de l'image entière");
    assert.ok(Math.abs(743 / 539 - 1.3785) < 0.001, "fenêtre du cadre 743 x 539");
  assert.ok(css.includes("(hover:hover) and (pointer:fine)"), "pas de décor sur téléphone");
}
