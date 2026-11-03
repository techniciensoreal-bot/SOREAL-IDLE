// Norman (2026-11-01) : sur PC, plus de barres de navigation en haut et en bas du livre des chroniques ; deux flèches de chaque côté (−10 puis −1 à gauche, +1 puis +10 à droite) ;
// et le livre n'est plus fermé de base : il s'ouvre sur la dernière page où le joueur s'était arrêté (compte, règle n°6), page 1 au premier accès.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/album-cartes-v1.js");
const c = lire("cloudflare/public/soreal-idle-album.css");

// --- PC : aucune barre haut/bas, les flèches sont de chaque côté
const nav = m.slice(m.indexOf("function navHtml(pos)"), m.indexOf("/* La couverture"));
assert.ok(nav.includes("if(!ouvert||double())return '';"), "PC : navHtml (barres du haut et du bas) est vide ; téléphone : inchangée");
assert.ok(nav.includes("alb-debut") && nav.includes("retourCouverture()") && nav.includes("numeroHtml()"), "téléphone : la barre complète (couverture, −10, −1, numéro, +1, +10) est conservée");
const cote = m.slice(m.indexOf("function coteHtml(cote)"), m.indexOf("function piedHtml()"));
assert.ok(cote.includes("if(!double())return '<div class=\"alb-cote alb-cote-'"), "les flèches de côté n'existent que sur PC (bloc vide sur téléphone)");
assert.equal((cote.match(/class=\\?"alb-bouton /g) || []).length, 6, "six flèches au total (trois par côté : un bout de l'album, 10 pages, 1 page), pas une de plus");
for (const [cl, lab] of [["alb-prec10", "Reculer de 10 pages"], ["alb-prec\"", "Reculer d’une page"], ["alb-suiv\"", "Avancer d’une page"], ["alb-suiv10", "Avancer de 10 pages"]]) assert.ok(cote.includes(cl) && cote.includes('aria-label="' + lab + '"'), "flèche " + cl + " avec son aria-label");
assert.ok(cote.includes("sauter(-5)") && cote.includes("sauter(-9999)") && cote.includes("sauter(9999)") && cote.includes("page(-1)") && cote.includes("page(1)") && cote.includes("sauter(5)"), "mêmes actions qu'avant (10 pages = 5 feuilles sur PC, un bout de l'album, tourne-page)");
assert.ok(cote.includes("return '<div class=\"alb-cote alb-cote-'+(g?'g':'d')+'\">'+(g?bx+b10+b1:b1+b10+bx)+'</div>';"), "ordre visuel : début −10 −1 à gauche (−1 près du livre), +1 +10 fin à droite (+1 près du livre)");
assert.ok(!cote.includes("alb-debut") && !cote.includes("fermerLivre"), "pas de flèche « couverture / fermer » sur PC ; les flèches de bout d'album (Norman, 2026-11-03) ne ferment pas le livre, elles sautent à la première ou à la dernière page");
// le rendu : cote gauche, cadre du livre, cote droit, numéro discret
const rendre = m.slice(m.indexOf("function rendre(entrees)"), m.indexOf("/*\n * Le livre s'adapte"));
assert.ok(rendre.indexOf("coteHtml('g')") > 0 && rendre.indexOf("coteHtml('g')") < rendre.indexOf("alb-cadre") && rendre.indexOf("alb-cadre") < rendre.indexOf("coteHtml('d')") && rendre.includes("piedHtml()"), "dans le même HTML que la page (règle n°4) : flèche gauche, livre, flèche droite, numéro");
assert.ok(m.includes("var racine=document.documentElement,cad0=ad.querySelector('.alb-cadre'),dispo=double()&&cad0?cad0.clientWidth:ad.clientWidth;"), "le livre s'adapte à la place entre les flèches (jamais de flèche hors de l'écran)");
assert.ok(m.includes("var cote=nav.classList.contains('alb-cote'),ok=!cote||ouvert;") && m.includes(".alb-adapt .alb-nav, .alb-adapt .alb-cote"), "majNav met à jour les flèches de côté (désactivées au début / à la fin / livre fermé)");
// numéro de page : petit, non cliquable, sans total (règle n°2)
const pied = m.slice(m.indexOf("function piedHtml()"), m.indexOf("function peutAvancer()"));
assert.ok(!/ \/ |nbPages|<button|onclick/.test(pied), "le numéro sous le livre : ni total « / N », ni bouton");
assert.ok(c.includes("pointer-events:none;") && c.includes(".alb-adapt .alb-pied{display:block;"), "numéro de page non cliquable");
// CSS : PC seulement
const pc = c.slice(c.indexOf("@media (min-width:900px){\n  .alb-adapt .alb-nav-zone{display:none}"));
assert.ok(pc.includes(".alb-adapt .alb-nav-zone{display:none}") && pc.includes(".alb-adapt .alb-corps{display:flex;align-items:center;") && pc.includes(".alb-adapt .alb-corps>.alb-cadre{flex:1 1 0;min-width:0;width:auto}"), "PC : zones haut/bas supprimées, flèches centrées verticalement de chaque côté du cadre du livre");
assert.ok(c.includes(".alb-cote,.alb-pied{display:none}"), "téléphone : rien de nouveau n'est affiché");
assert.ok(!/\.alb-(cote|corps|pied)[^{]*\{[^}]*!important/.test(c), "aucune règle forcée de plus");

// --- le livre s'ouvre sur la dernière page vue (jamais fermé de base)
assert.ok(m.includes("var CLE_PAGE='soreal_idle_album_page_v1';"), "clé liée au compte (soreal_idle_*, règle n°6)");
assert.ok(m.includes("if(!document.querySelector('.alb-classeur')){ouvert=true;arrivee=true;page=pageMemorisee();}"), "à l'arrivée : livre OUVERT sur la page mémorisée, plus de couverture ni d'animation d'ouverture");
const mem = m.slice(m.indexOf("function pageMemorisee()"), m.indexOf("/* Le classeur entier"));
assert.ok(mem.includes("var p=0;") && mem.includes("localStorage.getItem(CLE_PAGE)"), "rien de mémorisé : page 1 (la première page, ouverte)");
assert.ok(mem.includes("function noterPage(){if(!ouvert)return;") && mem.includes("localStorage.setItem(CLE_PAGE,String(page))"), "« fermé » n'est jamais mémorisé");
assert.ok(m.includes("page=norm(page);\n  setTimeout(verifierNouvelles,500);"), "une page mémorisée qui n'existe plus ramène à la dernière page existante (norm borne à pageMax)");
assert.ok(m.includes("function norm(L){L=Math.max(0,Math.min(pageMax(),Math.floor(Number(L))||0));"), "bornage de la page");
const fermer = m.slice(m.indexOf("function fermerLivre()"), m.indexOf("function cliquerGauche()"));
assert.ok(!fermer.includes("noterPage()"), "fermer le livre n'écrase pas la dernière page mémorisée");
assert.ok(m.includes("function ouvrirLivre(p)") && m.includes("function fermerLivre()") && m.includes("function cliquerGauche()"), "ouvrirLivre / fermerLivre existent toujours");
for (const [nom, motif] of [["afficher", "page=norm(p);noterPage();"], ["tourner une feuille", "page=norm(q);marquer(page);noterPage();"], ["saut de feuilles", "saut=false;page=norm(q);marquer(page);noterPage();"], ["ouverture", "noterPage();"]]) assert.ok(m.includes(motif), "la page est mémorisée : " + nom);
assert.ok(!/localStorage[^;]*\(\s*CLE_PAGE[^)]*\)[^;]*\/ ?\d/.test(m), "aucun total dans la mémorisation (règle n°2)");
// annonces : à l'arrivée, si la page mémorisée n'a rien de neuf, on va à la première page qui a des cartes à annoncer
assert.ok(m.includes("if(arrivee){arrivee=false;if(!neuvesVisibles(page).length)"), "les nouvelles cartes s'annoncent toujours à l'arrivée");

// --- fleches style jeu video fantasy (Norman, 2026-11-01) : metal dore, gemme, pointes taillees, « 10 » sur les boutons doubles
const bouton = c.slice(c.indexOf(".alb-bouton{position:relative"), c.indexOf(".alb-bouton:focus-visible"));
assert.ok(/border:3px solid transparent;[\s\S]*linear-gradient\(145deg,#fbe39a/.test(bouton), "liseré de metal dore (degrade) autour d'un fond de cuir sombre");
assert.ok(!bouton.includes(".alb-bouton::after") && !bouton.includes("#8fe3ff"), "plus de petit losange (gemme) au-dessus des fleches (Norman, 2026-11-03)");
assert.ok(bouton.includes('.alb-prec10::before,.alb-suiv10::before{content:"10"') && bouton.includes("Bangers"), "repere « 10 » en lettres Bangers sur les boutons doubles");
assert.ok(bouton.includes(".alb-bouton:hover:not(:disabled)") && bouton.includes(".alb-bouton:active:not(:disabled){transform:translateY(2px)"), "survol (lumiere qui s'intensifie) et appui (leger enfoncement)");
assert.ok(/\.alb-bouton:disabled\{[^}]*color:#6f685a/.test(bouton) && !bouton.includes(".alb-bouton:disabled::after"), "desactive : metal terni, sans losange");
assert.ok(!/filter|backdrop|blur\(|animation|@keyframes|!important/.test(bouton), "perf APK : statique, aucun filtre ni animation, aucun !important");
assert.ok(/\.alb-bouton\{position:relative;box-sizing:border-box;width:46px;height:46px/.test(bouton) && c.includes(".alb-adapt .alb-cote .alb-bouton{width:44px;height:44px}") && c.includes(".alb-bouton{width:44px;height:44px}.alb-bouton svg{width:22px;height:22px}"), "zone de toucher >= 44 px (PC et telephone)");
assert.ok(/var CHEV_G='<svg[^>]*><path d="[^"]*Z"\/><\/svg>'/.test(m) && /var CHEV_DD='<svg[^>]*><path d="[^"]*Z[^"]*Z"\/><\/svg>'/.test(m), "pointes de fleche pleines (simples et doubles), SVG original");
assert.ok(c.includes(".alb-zoom .alb-bouton::before{display:none}") && !c.includes(".alb-zoom .alb-bouton::after"), "les boutons + / − du zoom ne recoivent pas de repere, ni de losange");
for (const l of ["Reculer de 10 pages", "Reculer d’une page", "Avancer d’une page", "Avancer de 10 pages", "Fermer le classeur : revenir à la couverture", "Page précédente", "Page suivante"]) assert.ok(m.includes('aria-label="' + l + '"'), "aria-label conserve : " + l);

console.log("idle-album-fleches-cotes-v1 : OK");
