// Norman (2026-11-02) : « les chroniques clignotent quand on tourne la page sur téléphone ». Cause mesurée dans le navigateur (téléphone émulé) : chaque tour de page recréait 17 à 36 <img>
// (page d'arrivée + COPIE de la page qui part) et, faute de référence gardée, le navigateur les redemandait à son cache puis les décodait de façon asynchrone : au premier instant du tour,
// jusqu'à 9 images visibles (art ou dos de carte) n'étaient pas peintes. Garde : les images des pages voisines sont tenues (objets Image décodés), un tour ou un saut attend les images de la page
// d'arrivée AVANT de tourner (650 ms au plus), et la feuille qui part emporte les nœuds de la page affichée au lieu d'en recréer une copie (téléphone, vers l'avant).
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const a = lire("cloudflare/public/modules/album-cartes-v1.js");

// 1. les images d'une page sont lues dans son HTML (gabarit inerte : rien n'est chargé par la lecture), tenues et décodées
assert.ok(a.includes("var gardees={},pretesUrl={},lotUrls={},passePrepa=null;"), "état des images tenues");
assert.ok(a.includes("var t=document.createElement('template');t.innerHTML=h;"), "lecture des <img> d'une page dans un gabarit inerte (aucune requête)");
assert.ok(a.includes("im=new Image();gardees[u]=im;") && a.includes("im.decode()"), "image tenue par une référence ET décodée");
assert.ok(a.includes("function pretes(L)") && a.includes("function preparer(L)") && a.includes("attendre(650)"), "attente bornée à 650 ms : jamais bloquant");
assert.ok(/function majNav\(\)\{\s*precharger\(\);retenir\(\);/.test(a), "les pages voisines sont retenues à chaque changement de page");
assert.ok(a.includes("Object.keys(gardees).forEach(function(u){if(!garde[u]){delete gardees[u];delete pretesUrl[u];}})"), "mémoire bornée : seules les pages voisines (et la cible d'un tour) restent tenues");
assert.ok(a.includes("if(cibleTour>=0)ls.push(cibleTour);"), "la page d'arrivée d'un tour en préparation n'est jamais élaguée");

// 2. un tour (PAGE) et un saut attendent les images de la page d'arrivée AVANT de tourner, sans boucle (drapeau passePrepa)
const tour = a.slice(a.indexOf("function tournerUne("), a.indexOf("function page_("));
assert.ok(tour.includes("if(passePrepa===q)passePrepa=null;") && tour.includes("else if(!reduit()&&!pretes(q)){tourne=true;preparer(q).then("), "tournerUne attend les images (une seule fois)");
assert.ok(tour.indexOf("!pretes(q)") < tour.indexOf("tourne=true;\n    /* une feuille"), "l'attente a lieu AVANT la création de la feuille");
const saut = a.slice(a.indexOf("function sauterInterne("), a.indexOf("function sauter(n)"));
assert.ok(saut.includes("if(passePrepa===q)passePrepa=null;") && saut.includes("else if(!pretes(q)){tourne=true;preparer(q).then("), "sauterInterne attend les images (une seule fois)");
assert.ok(saut.indexOf("!pretes(q)") < saut.indexOf("livre.classList.add('alb-saut')"), "l'attente a lieu AVANT de lever les feuilles");
assert.ok(tour.includes("tourne=false;passePrepa=q;tournerUne(") && saut.includes("tourne=false;passePrepa=q;sauterInterne("), "reprise du tour une fois les images prêtes");

// 3. téléphone, vers l'avant : la feuille qui part emporte les nœuds de la page affichée (mêmes <img> déjà peintes), pas de copie recréée
assert.ok(tour.includes("var emporte=!deux&&sens>0;") && tour.includes("avant=emporte?'':contenuPage(sens>0?p:q)"), "tournerUne : pas de copie HTML de la page qui part (téléphone, avant)");
assert.ok(tour.includes("if(emporte){var cibleAv=facesAV.querySelector('.alb-feuille');while(fd.firstChild)cibleAv.appendChild(fd.firstChild);}"), "tournerUne : les nœuds de la page affichée passent sur la feuille");
assert.ok(tour.indexOf("if(emporte){var cibleAv") < tour.indexOf("fd.innerHTML=contenuPage(q)"), "les nœuds sont emportés AVANT que la page d'arrivée soit écrite dessous");
assert.ok(saut.includes("var emporte=!deux&&sens>0,vieux=null;") && saut.includes("vieux.appendChild(fd.firstChild)") && saut.includes("appendChild(vieux)"), "sauterInterne : même principe pour la première feuille");
assert.ok(saut.indexOf("vieux.appendChild(fd.firstChild)") < saut.indexOf("if(sens>0)fd.innerHTML=contenuPage(q)"), "sauterInterne : nœuds emportés avant d'écrire la page visée");

// 4. rien d'autre ne change : PC (deux pages) garde sa copie, mouvement réduit garde l'affichage direct
assert.ok(a.includes("if(reduit()||typeof pd.animate!=='function'){afficher(q);if(!silencieux)setTimeout(verifierPage,450);ok(true);return;}"), "mouvement réduit : affichage direct inchangé");
assert.ok(a.includes("arriere=deux?contenuPage(sens>0?p+1:q+1,true):''"), "PC : face arrière inchangée");

console.log("idle-album-tour-images-pretes-v1 : OK");
