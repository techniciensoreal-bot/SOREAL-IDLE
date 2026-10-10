import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Habillage « ITOPOD » de toute l'application (Norman, 2026-10-06) : une feuille chargée EN DERNIER, une palette par menu, panneaux de pierre, boutons biseautés,
 * onglets, jauges, torches et losanges. Ce test garde la structure (palettes, ordre de chargement, aucune ressource externe).
 */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

const liens = [...index.matchAll(/<link rel="stylesheet" href="\/([a-z-]+\.css)\?v=\d+">/g)].map((m) => m[1]);
assert.equal(liens[liens.length - 1], "soreal-idle-itopod.css", "feuille ITOPOD chargée en dernier : " + liens.join(", "));
assert.ok(liens.indexOf("soreal-idle-itopod.css") > liens.indexOf("soreal-idle-themes.css") && liens.indexOf("soreal-idle-itopod.css") > liens.indexOf("soreal-idle-jeu.css"));

const menus = ["entrainement", "combat", "aventure", "bestiaire", "moneyPit", "augmentations", "machine", "sang", "challenges", "titans", "ngu", "wandoos", "yggdrasil", "diggers", "beards", "shop", "succes", "classement", "chat", "parametres", "admin"];
for (const m of menus) {
  const bloc = new RegExp('\\[data-menu="' + m + '"\]\{[^}]*--i-a:[^;}]+;[^}]*--i-b:[^;}]+;[^}]*--i-c:[^;}]+;[^}]*--i-bg1:[^;}]+;[^}]*--i-bg2:[^;}]+;[^}]*--i-glow:[^;}]+;');
  assert.ok(bloc.test(css), "palette complète pour le menu " + m);
}
assert.ok(/\.soreal-idle-page-root-v28\[data-menu\]\{--i-a:/.test(css), "palette par défaut (ITOPOD, violet et or)");
for (const fragment of ["border:3px solid #000", "5px 5px 0 #000", "itpTorche", "var(--i-glow)"]) assert.ok(css.includes(fragment), "langage de l'ITOPOD : " + fragment);
assert.ok(!/@import|url\(\s*["']?https?:/i.test(css), "aucune ressource externe");
// Écritures « BD » : Bangers (titres, boutons) et Comic Neue (textes), chargées par index.html ; seul l'écran rétro garde sa police.
assert.ok(index.includes("fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue"), "polices BD chargées par la page");
assert.ok(css.includes('--f-titre:"Bangers"') && css.includes('--f-texte:"Comic Neue"'), "deux familles : titres et textes");
assert.ok(css.includes(":not(.wd-ecran)") && css.includes(":not(.wd-touche)"), "l'ordinateur rétro garde sa police d'écran");
assert.ok(css.includes("-webkit-text-stroke:1px #000"), "contour noir des titres (lettres de BD)");
// Montée en puissance : six rangs, chacun avec un fond de plus en plus foncé ; le dernier est la couleur de base, très foncée ; titres de Basic Training en bandeaux de combat.
for (let n = 0; n <= 5; n++) {
  assert.ok(css.includes('[data-rang-v1="' + n + '"]{border:3px solid #000!important;'), "rang " + n + " : cadre");
  assert.ok(css.includes('[data-rang-v1="' + n + '"] .soreal-idle-bt-fill-v120{'), "rang " + n + " : matière de la barre");
}
const bloc = (n) => { const d = css.indexOf('[data-rang-v1="' + n + '"]{border:3px solid #000!important;'); return css.slice(d, css.indexOf('}', d)); };
const part = (n) => Number(bloc(n).split('linear-gradient(145deg,color-mix(in srgb,var(--rg-c1) ')[1].split('%')[0]);
assert.equal(part(0), 50, 'rang 0 : fond le plus clair');
assert.ok(bloc(5).includes('color-mix(in srgb,var(--rg-dark) 78%,#000)'), 'rang 5 : couleur de base, très foncée');
const mixes = [0, 1, 2, 3, 4].map(part);
assert.deepEqual(mixes, mixes.slice().sort((a, b) => b - a), "le fond s'assombrit à chaque rang : " + mixes.join(' > '));
for (const fragment of ["rgSheenV1", "rgBatV1", "rgFeuV1", "repeating-linear-gradient(135deg,rgba(0,0,0,.30)", "clip-path:polygon(0 0,16px 8px"]) assert.ok(css.includes(fragment), "effet de montée en puissance : " + fragment);
assert.ok(css.includes(".soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120::before") && css.includes("viewBox='0 0 64 64'"), "emblèmes d'épées et de bouclier dans les titres");
// Combat de boss : UNE borne d'arcade de face, les deux combattants sur le même grand écran (Norman, 2026-10-06).
const arene = css.slice(css.indexOf("COMBAT DE BOSS : l'ARÈNE D'ARCADE"), css.indexOf("Money Pit v2 (Norman"));
assert.ok(arene.length > 6000, "bloc de l'arène d'arcade présent");
for (const fragment of [
  "arcadeFightV1", "arcadeVsV1", "arcadeBalayageV1", "arcadeMarqueeV1",             /* FIGHT qui pulse, VS qui brille, balayage cathodique, marquee qui respire */
  "perspective(260px) rotateX(62deg)",                                               /* sol quadrillé en perspective */
  "transform:skewX(-12deg)",                                                         /* barres de vie inclinées face à face */
  ".soreal-idle-bossbar-wrap-v7{transform:scaleX(-1);}",                             /* la barre du boss se vide vers le centre */
  ".soreal-idle-boss-respawn-v100:empty{display:none!important;}",
  "@media (max-width:520px)", "@media (max-width:700px)", "prefers-reduced-motion"
]) assert.ok(arene.includes(fragment), "arène : " + fragment);
assert.ok(!arene.includes("Bangers") && !arene.includes("areneBraisesV1"), "plus de style BD dans l'arène");
for (const cible of ["soreal-idle-duel-nameplate-v65", "soreal-idle-duel-portrait-v41", "soreal-idle-duel-hp-v41", "soreal-idle-vs-v41", "soreal-idle-boss-controls-v39", "soreal-idle-boss-respawn-v100", "soreal-idle-reward-v8"]) assert.ok(arene.includes(cible), "l'arène habille " + cible);
assert.ok(!/ \{[^}]*display:none[^}]*soreal-idle-duel-portrait/.test(arene), "les portraits ne sont jamais cachés");
// Une seule borne : le bloc duel est le corps, la rangée est l'écran, plus de rotation de chaque combattant.
assert.ok(arene.includes(".soreal-idle-duel-v41::before") && arene.includes("★  SOREAL IDLE  ★") && arene.includes("rotateX(48deg)"), "une borne : marquee et tableau isométrique");
assert.ok(!arene.includes("rotateY("), "plus de deux bornes tournées : une seule borne de face");
assert.equal(arene.split("radial-gradient(ellipse 5.31px 2.70px at calc(50% - 4px)").length - 1, 3, "trois vrais boutons seulement sur la borne (rouge, bleu, jaune), sur une seule rangée");
assert.ok(arene.includes("#eef1fb 75%,#8a90a8 88%,#2a2f4a 98%") && arene.includes("ellipse 17.70px 9.00px at 50%"), "anneau de métal plus haut que le dessus et socle creux");
assert.ok(arene.includes(".soreal-idle-boss-controls-v39::before{") && arene.includes(".soreal-idle-boss-controls-v39::after{") && arene.includes("circle at 34% 28%,#fff"), "un seul joystick en volume : boule sphérique éclairée, collerette et ombre, hors de la dalle (non coupé)");
assert.ok(arene.includes("border:10px solid #05060a") && arene.includes("minmax(0,1fr) auto minmax(0,1fr)"), "grand écran cathodique à deux combattants");
// Téléphone (Norman, 2026-10-06) : « grand espace vide avant les barres, application non centrée, coupée à droite ».
assert.ok(css.includes(".soreal-idle-page-root-v28>*{box-sizing:border-box;max-width:100%;}"), "page et blocs de premier niveau en border-box : plus de dépassement à droite");
assert.ok(css.includes("Entraînement va droit aux barres") && css.includes("white-space:nowrap") && css.includes(".soreal-idle-bt-presets-v120 button{min-height:34px!important"), "Entraînement compact sur téléphone : titre sur une ligne, outils resserrés");
// Téléphone : allègement du dessin (zones de page qui disparaissent par moments sur Chrome mobile).
const allege = css.slice(css.indexOf("allègement du dessin"));
assert.ok(allege.includes("@media (max-width:700px)") && allege.includes("animation:none!important;box-shadow:none!important;") && allege.includes("filter:none!important;") && allege.includes("linear-gradient(180deg,var(--i-bg1),var(--i-bg2) 70%,#0b0814)"), "mobile : torches fixes, bandeaux sans filtre, fond de page sans rayures ni halo flou");
// Combat de boss sur téléphone : barres de vie pleine largeur l'une sous l'autre (chiffres lisibles), écran de la borne pleine largeur.
const tel = css.slice(css.indexOf("Combat de boss sur téléphone (Norman"));
assert.ok(tel.includes(".soreal-idle-duel-fighter-v42{display:contents!important;}") && tel.includes("grid-column:1/-1!important") && tel.includes("grid-row:1;") && tel.includes("grid-row:2;"), "phone : les deux barres de vie sur toute la largeur, l'une sous l'autre");
assert.ok(tel.includes("grid-row:3;") && tel.includes("grid-row:4;"), "phone : noms puis portraits côte à côte sous les barres");
// Objet verrouillé : cadre rouge toujours visible avec le style ITOPOD.
assert.ok(css.includes(".soreal-idle-v138-slot).idle-item-locked-v165{") && css.includes("border-color:#ff4d4d!important;"), "cadre rouge des objets verrouillés conservé");
// ITOPOD sur PC : la scène est plafonnée en hauteur (elle faisait ~1000 × 800 px) et centrée.
assert.ok(css.includes(".itp-cadre{width:100%;box-sizing:border-box;max-width:calc(min(64vh,560px) * 4 / 3 + 30px);margin-left:auto;margin-right:auto;}"), "scène ITOPOD plafonnée sur PC");
// Objet sélectionné (échange/fusion) : cadre doré toujours visible avec le style ITOPOD.
assert.ok(css.includes(".soreal-idle-v138-slot).selected{") && css.includes("box-shadow:0 0 0 3px #ffd24a") && css.includes(".idle-merge-slot-v1{"), "cadre de sélection des objets conservé");
// Joystick sur téléphone (Norman, 2026-10-07) : boule plus haute et tige qui ne dépasse plus au-dessus de la boule.
assert.ok(css.includes(".soreal-idle-boss-controls-v39::before{width:20px;height:20px;top:-78px;") && css.includes("linear-gradient(90deg,#141828,#6a7098 45%,#141828) 50% 14px/6px 17px no-repeat"), "téléphone : boule relevée, tige cachée derrière la boule");
// Barres de vie du Fight Boss (Norman, 2026-10-07) : chiffres bien plus visibles, barre plus belle (rail creux, verre, graduations fines).
assert.ok(css.includes("font-size:1.28em!important;font-weight:900!important") && !css.includes("font-size:.82em!important;}"), "chiffres de vie agrandis");
assert.ok(css.includes("-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000") && css.includes("height:32px!important;border-radius:4px!important"), "chiffres cernés de noir, barre plus haute");
assert.ok(css.includes("repeating-linear-gradient(90deg,transparent 0 calc(5% - 1px),rgba(0,0,0,.55) calc(5% - 1px) 5%)"), "graduations fines et reflet de verre");
// Borne (Norman, 2026-10-07) : Fight rouge, Fuite bleu, Nuke jaune ; le bouton de la borne s'enfonce avec la commande ; « Boss actuel » retiré ; régénération sur sa ligne.
assert.ok(arene.includes("var(--bp,0px)") && arene.includes(".soreal-idle-dome-v1.dome-nuke"), "chaque bouton de la borne peut s'enfoncer");
assert.ok(arene.includes('[data-presse-v1="start"] .soreal-idle-dome-v1.dome-start') && arene.includes(".soreal-idle-boss-control-v39.nuke:active:not(:disabled)"), "appuyer sur une commande enfonce son bouton");
assert.ok(readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8").includes("window.__clicDomeBorneIdleV1__=function(nom){") && arene.includes(".soreal-idle-dome-v1{position:absolute"), "les boutons de la borne sont de vrais boutons cliquables");
assert.ok(arene.includes("grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)") && /\.start\{\s*order:1;/.test(arene) && /\.stop\{order:2;/.test(arene), "ordre Fight, Fuite, Nuke");
assert.ok(arene.includes(".soreal-idle-boss-current-v35>.soreal-idle-label-v4{display:none!important;}"), "« Boss actuel » retiré");
assert.ok(arene.includes("flex:0 0 100%;display:block!important;text-align:center"), "la régénération a sa propre ligne et ne chevauche plus les PV");
// Sélecteur de zone (Norman, 2026-10-07) : menu sombre à liseré doré, lignes à texte clair, ligne choisie en or (plus de lignes vertes au texte gris).
assert.ok(css.includes("SÉLECTEUR DE ZONE (Aventure)") && css.includes("button.team-sort-option.team-sort-option{") && css.includes("color:#fff3d6!important;font-size:16px;font-weight:900") && css.includes("button.team-sort-option.team-sort-option.active{"), "menu de zone lisible et soigné");
// Boutique : onglet choisi lisible (Norman, 2026-10-07) ; popups en fondu ; interrupteurs ; boutons de la borne centrés sur la planche.
assert.ok(css.includes("color:#2b1400!important;-webkit-text-fill-color:#2b1400!important;-webkit-text-stroke:0!important"), "onglet de boutique choisi : texte net sans contour");
assert.ok(css.includes("animation:popupFonduV1 2.5s ease-in-out forwards") && css.includes("#soreal-idle-fade-notice-v1{"), "popups en fondu");
assert.ok(css.includes("top:-96px;") && css.includes(".soreal-idle-dome-v1{position:absolute") && css.includes("width:36px;height:36px;top:-81px;"), "socle du joystick et boutons de la borne centrés sur la planche, boutons carrés donc ronds");
// Fluidité sur téléphone (Norman, 2026-10-07) : animations du menu et des boutons « disponible » sans repeindre (transform/opacity), pistes de rang élevé figées sur petit écran.
assert.ok(css.includes("@keyframes sorealNavAnneauV1{0%,100%{opacity:.9;transform:scale(1)}50%{opacity:0;transform:scale(1.1)}}") && css.includes("@keyframes sorealNavDispoEchelleV1") && css.includes("@keyframes sorealBoutonDispoEchelleV1"), "animations du menu et des boutons disponibles : transform/opacity seulement");
for (const nom of ["sorealNavAnneauV1", "sorealNavDispoEchelleV1", "sorealBoutonDispoEchelleV1"]) { const m = css.match(new RegExp("@keyframes " + nom + "\{((?:[^{}]|\{[^{}]*\})*)\}")); assert.ok(m && !/box-shadow|filter/.test(m[1]), "aucune ombre ni filtre animés : " + nom); }
assert.ok(/@media \(max-width:700px\)\{\s*html body\.soreal-idle-active-v47 \.soreal-idle-page-root-v28\[data-menu\] :is\(\[data-rang-v1\]/.test(css), "pistes de rang élevé sans animation continue sur téléphone");
console.log("idle-itopod-style-v1: OK");
