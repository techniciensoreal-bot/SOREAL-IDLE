/*
 * Panneau LED de la borne d'arcade (modules/borne-led-v1.js, soreal-idle-borne-led-v1.css), validé par Norman le 2026-11-01 :
 * il REMPLACE la plaque « BOSS #n + nom du boss », juste au-dessus de la barre de vie du boss ; le fronton « NGU IDLE » est inchangé ; la barre de vie du boss reste telle quelle.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const R = new URL("../public/", import.meta.url);
const lire = (f) => readFileSync(new URL(f, R), "utf8");
const src = lire("modules/borne-led-v1.js");
const css = lire("soreal-idle-borne-led-v1.css");
const index = lire("index.html");
const combat2 = lire("modules/ui-combat-2-v1.js");

/* module : une IIFE, un seul canvas, pas de bibliothèque */
assert.match(src, /^\/\*[\s\S]*?\*\/\s*\(function\(\)\{\s*'use strict';/, "module = une IIFE");
assert.ok(src.includes("window.__SOREAL_IDLE_BORNE_LED_V1__"), "expose window.__SOREAL_IDLE_BORNE_LED_V1__");
assert.equal((src.match(/createElement\('canvas'\)/g) || []).length >= 1, true);
assert.ok(!/\bimport\b|require\(|https?:\/\//.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune bibliothèque ni réseau");

/* règle n°4 : le canvas est posé par le module avec data-morph-garder et data-morph-vivant ; le panneau se rattache après chaque redessin */
assert.ok(src.includes("setAttribute('data-morph-garder','')") && src.includes("setAttribute('data-morph-vivant','')"), "canvas data-morph-garder + data-morph-vivant");
assert.ok(src.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "rattachement après redessin");
assert.ok(/class="bn-led"[^>]*data-morph-vivant/.test(combat2), "l'hôte du panneau porte data-morph-vivant");

/* arrêt hors écran / onglet masqué / reduced-motion / 30 images par seconde sur téléphone */
assert.ok(src.includes("visibilitychange") && src.includes("document.hidden"), "arrêt quand l'onglet est masqué");
assert.ok(src.includes("IntersectionObserver") && src.includes("onScreen"), "arrêt quand la borne n'est pas à l'écran");
assert.ok(src.includes("prefers-reduced-motion: reduce") && src.includes("P.reduced"), "images fixes avec prefers-reduced-motion");
assert.ok(/ts-lastTs>=32/.test(src) && src.includes("mobile()"), "30 images/s au plus sur téléphone");
assert.ok(src.includes("function actif()") && /host\.isConnected/.test(src), "arrêt quand la borne n'existe plus");

/* pas de barre de vie du boss sur le panneau, pas de « critique », pas de compte à rebours, pas de caméra de stade */
/* Norman (2026-11-01) : « en ÉCRAN DE JEU » : la vie du boss est DESSINÉE sur le panneau (cœur, jauge, PV / PV max, régénération), lue dans les mêmes champs que l'ancienne barre */
assert.ok(["e.bossPv)", "e.bossPvMax)", "e.regenBoss)", "formaterPvFixeIdleV1_"].every((m) => src.includes(m)), "vie du boss : mêmes champs (bossPv, bossPvMax, regenBoss) et même formatage que l'ancienne barre");
assert.ok(src.includes("SPR.coeurP")&&src.includes("BARRE")&&src.includes("styleCouleurBarreBossIdleV1_"), "cœur, jauge, couleur du boss");
assert.ok(!/CRITIQUE/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun « CRITIQUE »");
assert.ok(!/3-2-1|compte à rebours|countdown/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun compte à rebours dans le code");
assert.ok(!/sKiss|OOOH|REC\b/.test(src), "caméra de stade non branchée");

/* règle n°2 : aucune donnée verrouillée, aucun dénominateur ; le nom ne vient que du boss sélectionné */
assert.ok(!/\/\s*301|\?\?\?|verrouill|cadenas/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "rien de verrouillé");
assert.ok(src.includes("bossSelection") && src.includes("bossActuel") && src.includes("bossVaincus"), "numéro, nom et victoires déjà connus du client");
assert.ok(src.includes("SOREAL IDLE") && src.includes("S.boss?"), "sans boss connu : seulement « SOREAL IDLE »");

/* événements branchés : tous existent déjà côté client */
for (const e of ["idleCombatDebutV1", "idleCombatLogDernierResumeV70", "__SOREAL_IDLE_VICTOIRE_EN_COURS__", "idleCombatEnPauseApresDefaiteV1", "combatBossActif", "pvJoueur", "pvJoueurMax"]) assert.ok(src.includes(e), "événement " + e);

/* ---------- exécution réelle des scènes sur un faux navigateur : textes, polices, grilles ---------- */
const stockage = { soreal_idle_langue_v1: "fr" };
const fausseToile = () => {
  const ctx = new Proxy({}, { get: (_t, k) => (k === "createRadialGradient" || k === "createLinearGradient" ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
  return { width: 0, height: 0, style: {}, getContext: () => ctx, setAttribute() {}, className: "" };
};
const documentFaux = { hidden: false, createElement: () => fausseToile(), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null };
const fenetre = {
  innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, document: documentFaux, performance: { now: () => 0 },
  matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  localStorage: { getItem: (k) => stockage[k] ?? null },
};
fenetre.window = fenetre;
const ctxVm = vm.createContext({ ...fenetre, window: fenetre, document: documentFaux, localStorage: fenetre.localStorage, performance: fenetre.performance, setTimeout, clearTimeout, Math, Uint8Array, String, Number, Array, Object, Boolean, parseInt, isFinite });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), ctxVm);
const ev = (e) => fenetre.__EV__(e);
const api = fenetre.__SOREAL_IDLE_BORNE_LED_V1__;
assert.ok(api && typeof api.ensure === "function", "API exposée");
assert.equal(api.ensure(), false, "sans hôte `.bn-led` : rien ne se passe");

/* textes : le Ç devient C, les accents de la police existent, les caractères absents sont retirés proprement */
const c = ev("({canon:canon,GL:GL,twidth:function(s){return twidth(s,1);}})");
assert.equal(c.canon("Façade"), "FACADE");
assert.equal(c.canon("Œuf"), "OEUF");
for (const ch of "ÉÈÊÀÂÔÎÙË") assert.ok(c.GL[ch] || ev(`glyphDe(${JSON.stringify(ch)})`), "accent " + ch);
assert.equal(c.canon("Ça va ?"), "CA VA ?");
assert.equal(c.canon("日本"), "", "caractères absents retirés");
assert.equal(c.canon("Une Femme à Barbe"), "UNE FEMME À BARBE");
assert.ok(c.twidth("FIGHT !") > 0);

/* dictionnaire FR / EN : mêmes clés, aucun Ç, pas de « 3-2-1 » */
const dico = ev("TXT");
assert.deepEqual(Object.keys(dico.fr).sort().join(), Object.keys(dico.en).sort().join(), "mêmes clés français / anglais");
assert.equal(dico.fr.jokes.length, 0, "Norman (2026-11-01) : aucune phrase d'origine, seulement celles de l'administrateur");
assert.equal(dico.en.jokes.length, 0);
assert.equal(dico.en.win, "VICTORY !");
assert.ok(!JSON.stringify(dico).includes("Ç"), "aucun Ç dans les textes du panneau");

/* rendu pur : chaque scène, sur les deux grilles, dessine sans erreur et reste dans la matrice */
const rendu = ev(`(function(){
  var out={};
  [[120,14],[90,12]].forEach(function(g){
    var p=new Panel(document.createElement('canvas'),g[0],g[1]);
    p.cell=3;p.canvas={width:1,height:1};p.core=[];p.glow=[];p.bgc={};
    S.num=7;S.nom='Une Femme à Barbe Très Longue Pour Défiler';S.vic=42;S.boss=true;S.bar={v:.6,g:.8,gv:.5};S.obj={luck:{base:4800,t0:0}};S.now=0;
    Object.keys(SC).forEach(function(id){
      var allumes=0;
      for(var t=0;t<8;t+=.37){
        P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=p.H-1;p.p={mot:'POW !',k:2,n:3,o:'luck',v:4};
        SC[id].fn(t);
        for(var i=0;i<p.v.length;i++)if(p.v[i])allumes++;
        P=null;
      }
      out[g[0]+':'+id]=allumes;
    });
  });
  return out;})()`);
for (const [k, n] of Object.entries(rendu)) assert.ok(n > 0, "la scène " + k + " allume des points");

/* le panneau ne montre « SOREAL IDLE » que sans boss connu, et jamais de nom sinon vide */
const base = ev(`(function(){var p=new Panel(document.createElement('canvas'),120,14);S.boss=false;S.nom='';var n=0;P=p;p.c.fill(0);p.v.fill(0);sBase(1);for(var i=0;i<p.v.length;i++)if(p.v[i])n++;P=null;return n;})()`);
assert.ok(base > 20, "« SOREAL IDLE » s'affiche sans boss connu");

/* FIGHT ! reste affiché tout le combat : durée infinie, priorité la plus basse, boucle parfaite de 2 s (même image à t et t + 2 s une fois l'apparition passée) */
assert.ok(/fight:\{fn:sFight,dur:Infinity,prio:0/.test(src), "FIGHT ! dure tant que dure le combat");
const identique = ev(`(function(){
  var p=new Panel(document.createElement('canvas'),120,14);S.boss=true;S.nom='X';
  function img(t){P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=p.H-1;p.p={};sFight(t);P=null;return Array.prototype.join.call(p.v,',')+'|'+Array.prototype.join.call(p.c,',');}
  return [img(3.3)===img(5.3),img(7.77)===img(9.77),img(3.3)!==img(3.8)];})()`);
assert.deepEqual(Array.from(identique), [true, true, true], "FIGHT ! : boucle parfaite de 2 s, animée");

/* priorités : un coup, une victoire, un K.O. passent devant ; FIGHT ! enchaîné (boss suivant) ne se relance pas */
assert.ok(src.includes("if(enCombat(cur)&&S.num===combatNum)return;"), "FIGHT ! déjà affiché pour le MÊME boss : pas de redémarrage ; un nouveau boss repart par l'écriture de son nom (Norman, 2026-11-02)");
assert.ok(/win:\{fn:sWin,dur:function\(p\)\{return p\.anim\?8\.6:7\.2;\},prio:5/.test(src) && /ko:\{fn:sKO,dur:6\.4,prio:5/.test(src) && /hit:\{fn:sHits,dur:1\.5,prio:3/.test(src));

/* ---------- branchement dans le jeu ---------- */
/* le panneau REMPLACE la plaque du boss : plus de « 👹 BOSS #n » ni de nom visible, un nom masqué (sr-only) et l'aria-label du panneau */
const plaque = combat2.slice(combat2.indexOf('id="sorealIdleBossNomV61"'), combat2.indexOf('id="sorealIdleBossImageHostV36"'));
assert.ok(plaque.includes('class="bn-led" role="img"') && /aria-label="Panneau d'affichage de la borne : #\$\{idleEntier_\(j\.bossSelection\|\|1\)\} \$\{idleHtml_\(j\.bossActuel\|\|'Boss'\)\}"/.test(plaque), "aria-label : numéro et nom du boss");
assert.ok(!plaque.includes("soreal-idle-duel-role-v65") && !plaque.includes("👹"), "plus de plaque « BOSS #n » visible");
assert.ok(/id="sorealIdleBossNomTexteV65" class="soreal-idle-duel-name-text-v65 bn-sr-only"/.test(plaque), "nom gardé en texte masqué (traduction, lecteurs d'écran)");
assert.ok(/\.bn-sr-only\{[^}]*clip:rect\(0 0 0 0\)/.test(css), "sr-only");
/* le panneau est juste au-dessus de la barre de vie du boss (même colonne, avant .soreal-idle-duel-hp-v41) */
assert.ok(combat2.indexOf('class="bn-led"') < combat2.indexOf('id="sorealIdleBossImageHostV36"'), "panneau avant le portrait du boss");
assert.ok(combat2.indexOf('class="bn-led"') < combat2.indexOf("soreal-idle-bossbar-v7"), "panneau avant la barre de vie d'origine (maintenant masquée, mêmes ids)");
/* la barre de vie du boss n'a aucune règle dans la feuille du panneau */
assert.ok(!/bossbar/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")) && /bn-pv-source\{[^}]*clip:rect\(0 0 0 0\)/.test(css), "l'ancienne barre est gardée masquée (sr-only), jamais restylée");
/* le fronton « NGU IDLE » est celui d'origine */
assert.ok(combat2.includes(">NGU IDLE</text>") && combat2.includes("class='bn-autocollant'") && !combat2.includes("bn-fronton-wrap"), "fronton NGU IDLE inchangé");
/* grilles : 120 x 14 sur PC, 90 x 12 sur téléphone, mêmes rapports que le CSS */
assert.ok(/aspect-ratio:120\/40/.test(css) && /aspect-ratio:90\/36/.test(css) && src.includes("var BARH=19") && src.includes("var CELL_PC=4,CELL_TEL=3,W_MAX=240,W_MIN=60,ROWS_MAX=72"), "taille de point fixe, grille calculée depuis l'hôte (plus grand = plus de LED)");
assert.ok(!/!important/.test(css), "aucun !important");
/* chargement */
assert.match(index, /soreal-idle-borne-led-v1\.css\?v=\d+/);
assert.match(index, /modules\/borne-led-v1\.js\?v=\d+/);
assert.ok(index.indexOf("/soreal-idle-borne-led-v1.css") > index.indexOf("/soreal-idle-itopod.css"), "feuille après celles de la borne");
/* l'orage frappe toujours l'écran de la borne */
assert.ok(lire("modules/foudre-borne-v1.js").includes(".soreal-idle-duel-v41"), "la foudre vise toujours l'écran du duel");

console.log("idle-borne-led-v1: OK");
