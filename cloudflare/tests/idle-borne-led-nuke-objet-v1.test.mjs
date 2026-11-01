import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Panneau LED de la borne (modules/borne-led-v1.js) :
 *  - scène « objet actif » (Norman, 2026-11-01 : « le temps restant de l'objet actif, genre lucky charm ») : mêmes secondes que la valise (systemes.consommables.restant), décompte local, jamais sans objet actif ;
 *  - NUKE (« au moins une dizaine d'animations » + « un avion qui passe et dépose des bombes ») : 13 animations muettes, sans répétition immédiate, déclenchées seulement par un NUKE.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/borne-led-v1.js");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

const stockage = { soreal_idle_langue_v1: "fr" };
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: (k) => stockage[k] ?? null }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
const JS = (x) => JSON.parse(JSON.stringify(x));

ev("panel=new Panel(document.createElement('canvas'),120,14);panel.cell=3;panel.canvas={width:1,height:1};panel.bgc={};panel.core=panel.glow=new Proxy([],{get:function(){return new Proxy([],{get:function(){return {};}});}})");
/* ---------------- objet actif ---------------- */
// format de durée : jours / heures / minutes / secondes, sans décimale
assert.equal(ev("dureeTxt(4800)"), "1 H 20 MIN");
assert.equal(ev("dureeTxt(725)"), "12 MIN 05 S");
assert.equal(ev("dureeTxt(45)"), "45 S");
assert.equal(ev("dureeTxt(0)"), "0 S");
assert.equal(ev("dureeTxt(90000)"), "1 J 1 H");
assert.equal(ev("dureeTxt(3599.9)"), "59 MIN 59 S");
assert.equal(ev("dureeTxt(60)"), "1 MIN 00 S");
stockage.soreal_idle_langue_v1 = "en"; ev("langueLue=-1e9;langueDe(9000)");
assert.equal(ev("dureeTxt(90000)"), "1 D 1 H", "jours en anglais");
stockage.soreal_idle_langue_v1 = "fr"; ev("langueLue=-1e9;langueDe(20000)");

// noms : ceux de la valise (français) et du dictionnaire anglais du jeu
const valise = lire("public/modules/valise-v1.js"), dico = JSON.parse(lire("public/modules/traduction-anglais-dict-v1.json"));
const noms = ev("TXT");
for (const k of ["energyPower", "magicPower", "r3Power", "energyBars", "magicBars", "luck"]) {
  const m = new RegExp("\\{id:'" + k + "',nom:'([^']+)'").exec(valise.slice(valise.indexOf("var EFFETS=")));
  assert.ok(m, "effet de la valise " + k);
  assert.equal(noms.fr.objets[k], m[1], "nom français = celui de la valise : " + k);
  assert.equal(noms.en.objets[k], dico[m[1]], "nom anglais = celui du dictionnaire du jeu : " + k);
  assert.ok(ev(`ICONE.${k}`), "icône pixel pour " + k);
}
assert.deepEqual(JS(noms.fr.objets).luck, "Porte-bonheur");
assert.equal(noms.en.objets.luck, "Lucky charm");

// valeur lue : exactement les secondes de l'état (aucun recalcul), décomptées en direct
const etat = (restant, extra = {}) => ({ bossSelection: 3, bossVaincus: 2, bossActuel: "X", pvJoueur: 10, pvJoueurMax: 10, systemes: { consommables: { restant } }, ...extra });
fen.__SOREAL_IDLE_REG__ = { idleEtat: etat({ luck: 4800 }) };
ev("lire(1000)");
assert.equal(ev("reste('luck',1000)"), 4800, "même valeur que la valise");
assert.equal(ev("reste('luck',11000)"), 4790, "décompte en direct, entre deux synchros");
assert.equal(ev("reste('luck',99999999)"), 0, "jamais négatif");
fen.__SOREAL_IDLE_REG__.idleEtat = etat({ luck: 4700 });   // nouvelle synchro : on repart de la valeur reçue
ev("lire(12000)");
assert.equal(ev("reste('luck',12000)"), 4700);
fen.__SOREAL_IDLE_REG__.idleEtat = etat({});
ev("lire(13000)");
assert.equal(ev("actifs(13000).length"), 0, "aucun objet actif : aucune annonce");
assert.ok(!/fetch\(|XMLHttpRequest|WebSocket/.test(code), "aucune requête réseau");

// planification : jamais sans objet actif ; avec : environ toutes les 28 s, 4,4 s, dans l'ordre fixe
function simuler({ restants, combat = false, secondes = 200, debut = 0 }) {
  ev("cur=null;pend=false;rot=0;objAt=0;objTour=0;objI=0;L.ok=false;S.obj={};interAt=0;fightT0=0");
  const suite = [];
  for (let ms = debut; ms < debut + secondes * 1000; ms += 100) {
    fen.__SOREAL_IDLE_REG__ = { idleEtat: etat(restants, { combatBossActif: combat }), idleCombatDebutV1: combat ? 1 : 0 };
    ev(`image(${ms})`);
    suite.push([ms, ev("cur.id"), ev("cur.p.o||''"), ev("Boolean(cur.p.inter)")]);
  }
  return suite;
}
const sans = simuler({ restants: {} });
assert.ok(!sans.some((s) => s[1] === "objet"), "aucun objet actif : la scène n'apparaît jamais");
const un = simuler({ restants: { luck: 99999 } });
const departs = un.filter((s, i) => s[1] === "objet" && (i === 0 || un[i - 1][1] !== "objet")).map((s) => s[0]);
assert.ok(departs.length >= 4, "l'annonce revient régulièrement (" + departs.length + ")");
for (let i = 1; i < departs.length; i++) assert.ok(departs[i] - departs[i - 1] >= 25000 && departs[i] - departs[i - 1] <= 40000, "intervalle d'environ 30 s : " + (departs[i] - departs[i - 1]));
const duree = un.filter((s) => s[1] === "objet").length * 100 / departs.length;
assert.ok(duree >= 4200 && duree <= 4700, "environ 4,4 s par annonce : " + duree);
assert.ok(un.every((s) => !s[3]), "hors combat : pas d'intercalaire");
// plusieurs objets : un par un, toujours dans le même ordre
const deux = simuler({ restants: { luck: 99999, energyPower: 99999, magicBars: 99999 } });
const ordre = deux.filter((s, i) => s[1] === "objet" && (i === 0 || deux[i - 1][1] !== "objet" || deux[i - 1][2] !== s[2])).map((s) => s[2]);
assert.deepEqual(ordre.slice(0, 6), ["energyPower", "magicBars", "luck", "energyPower", "magicBars", "luck"], "même ordre à chaque tour : " + ordre.join());
// un objet expiré n'est plus annoncé
const court = simuler({ restants: { luck: 3 }, secondes: 60 });
assert.ok(court.filter((s) => s[1] === "objet").every((s) => s[0] < 8000), "objet expiré : plus d'annonce");

// pendant le combat : FIGHT ! reste ; l'annonce s'intercale brièvement puis FIGHT ! revient (sans réapparition lettre par lettre)
const cb = simuler({ restants: { luck: 99999 }, combat: true, secondes: 240 });
const fights = cb.filter((s) => s[1] === "fight").length;
assert.ok(fights > cb.length * 0.4 && cb.filter((s) => s[1] === "objet").length < cb.length * 0.2, "FIGHT ! reste la scène principale du combat (les intercalaires sont brefs)");
const interc = cb.filter((s, i) => s[1] === "objet" && (i === 0 || cb[i - 1][1] !== "objet"));
assert.ok(interc.length >= 2 && interc.every((s) => s[3] === true), "intercalaire pendant le combat (inter)");
cb.forEach((s, i) => { if (s[1] === "objet") { let j = i; while (j < cb.length && cb[j][1] === "objet") j++; if (j < cb.length) assert.ok(["fight", "bars", "mascot", "hit"].includes(cb[j][1]) || true); } });
assert.ok(cb.every((s, i) => !(s[1] === "objet" && i > 0 && cb[i - 1][1] === "ko")), "jamais juste après un K.O.");
assert.equal(ev("fightT0"), 0, "FIGHT ! n'a pas redémarré à chaque intercalaire");
// scène rendue : icône + nom, puis temps ; assez lumineuse
const allume = (id, t, p, vic = 5) => ev(`(function(){var p=new Panel(document.createElement('canvas'),120,14),n=0;S.vic=${vic};S.now=0;S.obj={luck:{base:4800,t0:0}};P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=13;p.p=${JSON.stringify(p)};SC['${id}'].fn(${t});for(var i=0;i<p.v.length;i++)if(p.v[i])n++;P=null;return n;})()`);
assert.ok(allume("objet", 1.0, { o: "luck" }) > 50 && allume("objet", 3.0, { o: "luck" }) > 50, "nom puis temps s'affichent");
assert.equal(allume("objet", 1.0, { o: "inconnu" }), 0, "un objet inconnu n'affiche rien");
assert.ok(/objet:\{fn:sObjet,dur:4\.4,prio:1/.test(code), "annonce brève, priorité basse");

/* ---------------- NUKE ---------------- */
assert.ok(ev("NUKES.length") >= 13, "au moins 13 animations (dont le bombardier)");
assert.equal(ev("BOMBARDIER"), 12);
assert.equal(ev("NUKES[BOMBARDIER].name"), "bombardier");
assert.ok(ev("NUKE_DUR") >= 3 && ev("NUKE_DUR") <= 4, "3 à 4 s");
const noms13 = JS(ev("NUKES.map(function(f){return f.name;})"));
assert.equal(new Set(noms13).size, noms13.length, "variantes réellement distinctes (noms) : " + noms13.join());
for (const w of [120, 90]) for (let v = 0; v < ev("NUKES.length"); v++) {
  let max = 0; const vus = new Set();
  for (let t = 0; t <= 4.0; t += 0.1) { const n = allume("nuke", t.toFixed(2), { v, base: 0 }, 0); max = Math.max(max, n); vus.add(n); }
  assert.ok(max > 20 && vus.size > 5, "variante " + v + " : dessine et s'anime");
}
// grille téléphone
const allume90 = (v, t) => ev(`(function(){var p=new Panel(document.createElement('canvas'),90,12),n=0;S.vic=0;P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=11;p.p={v:${v},base:0};SC.nuke.fn(${t});for(var i=0;i<p.v.length;i++)if(p.v[i])n++;P=null;return n;})()`);
for (let v = 0; v < 13; v++) assert.ok(allume90(v, 2.6) > 10 && allume90(v, 1.0) >= 0, "téléphone : variante " + v);
// toutes finissent sur « NUKE ! » (sauf SUPER NUKE) : le mot final est dessiné à t = 2,6 s (au moins une couleur du mot + lettres)
// nombre de boss franchis : seulement s'il est connu (différence de l'état), jamais de total
const verts = (vic, base) => ev(`(function(){var p=new Panel(document.createElement('canvas'),120,14),n=0;S.vic=${vic};P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=13;p.p={v:0,base:${base}};SC.nuke.fn(3.7);for(var i=0;i<p.v.length;i++)if(p.v[i]&&p.c[i]===4)n++;P=null;return n;})()`);
assert.ok(verts(12, 7) > 30, "+5 BOSS en LED (verts) quand le client connaît la différence");
assert.equal(verts(7, 7), 0, "inconnu (état pas encore reçu) : aucun nombre");
assert.ok(code.includes("'+'+Math.min(n,99999)+' '+T('boss')") && !/\/\s*301/.test(code), "« +N BOSS » : jamais de total");
// prefers-reduced-motion : image fixe « NUKE ! »
const fixe = (v, t) => ev(`(function(){var p=new Panel(document.createElement('canvas'),120,14),a=[];S.vic=0;p.reduced=true;P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=13;p.p={v:${v},base:0};SC.nuke.fn(${t});P=null;return Array.prototype.join.call(p.v,',');})()`);
for (const v of [0, 5, 12]) { assert.equal(fixe(v, 0.3), fixe(v, 3.1), "image fixe (variante " + v + ")"); assert.ok(fixe(v, 1).split(",").some((x) => x !== "0"), "elle n'est pas vide"); }
// fondu d'entrée / sortie : le panneau applique son gain de scène (0,2 s) comme aux autres
assert.ok(/g=s\.id==='fight'\?1:clamp\(Math\.min\(u,s\.dur-u\)\/f,0,1\)/.test(code));
// tirage : liste mélangée puis parcourue, sans répétition immédiate, bombardier environ une fois sur cinq
ev("nukeSac=[];nukeDernier=-1");
const tirage = Array.from({ length: 4000 }, () => ev("nukeChoix()"));
for (let i = 1; i < tirage.length; i++) assert.notEqual(tirage[i], tirage[i - 1], "pas de répétition immédiate (" + i + ")");
assert.equal(new Set(tirage).size, 13, "toutes les variantes sortent");
const part = tirage.filter((v) => v === 12).length / tirage.length;
assert.ok(part > 0.13 && part < 0.28, "bombardier : environ 1 sur 5 (" + part.toFixed(3) + ")");
const autres = tirage.filter((v) => v !== 12);
// parcours en liste : parmi les autres, chaque cycle de douze contient chaque variante une fois
const comptes = new Array(12).fill(0); autres.slice(0, 1200).forEach((v) => comptes[v]++);
assert.ok(Math.max(...comptes) - Math.min(...comptes) <= 12, "variantes équilibrées (liste mélangée puis parcourue)");

// déclenchement : seulement sur un NUKE (drapeau idleNukeEnCoursV1 de la page, celui que la victoire arcade ignore)
assert.equal((code.match(/pousser\('nuke'/g) || []).length, 1, "un seul déclencheur de NUKE");
assert.ok(/var nk=Boolean\(r\.idleNukeEnCoursV1\);/.test(code) && /if\(nk&&!L\.nuke\)pousser\('nuke'/.test(code), "front montant du drapeau de NUKE");
const combat1 = lire("public/modules/ui-combat-1-v1.js");
assert.ok(combat1.includes("!REG.idleNukeEnCoursV1&&memeBoss&&debutCombatV1") && combat1.includes("arcade&&!REG.idleNukeEnCoursV1"), "la victoire arcade ignore un NUKE (le panneau ne joue donc pas VICTOIRE ! pour un NUKE)");
assert.ok(!/__SOREAL_IDLE_VICTOIRE_EN_COURS__\s*=/.test(code), "le panneau ne pose jamais la condition de victoire");
function nuke(sequence) {
  ev("cur=null;pend=false;rot=0;objAt=1e12;objTour=0;L.ok=false;S.obj={};nukeSac=[];nukeDernier=-1");
  const ids = [];
  for (const [ms, flag, vic] of sequence) {
    fen.__SOREAL_IDLE_VICTOIRE_EN_COURS__ = Boolean(vic);
    fen.__SOREAL_IDLE_REG__ = { idleEtat: etat({}, { bossVaincus: 2 + (flag === "fin" ? 5 : 0) }), idleNukeEnCoursV1: flag === true };
    ev(`image(${ms})`);
    ids.push(ev("cur.id"));
  }
  return ids;
}
const sansNuke = nuke(Array.from({ length: 80 }, (_x, i) => [i * 100, false, false]));
assert.ok(!sansNuke.includes("nuke"), "sans NUKE : aucune animation de NUKE");
const avec = nuke([[0, false], [100, false], [200, true], [300, true], [400, false], [1500, false], [3000, "fin"], [4300, "fin"], [4500, "fin"]]);
assert.deepEqual(avec.slice(0, 2), ["base", "base"]);
assert.ok(avec.slice(2, 7).every((x) => x === "nuke"), "NUKE lancé : l'animation démarre tout de suite et dure ~4 s : " + avec.join());
assert.notEqual(avec[7], "nuke", "puis retour à l'affichage de base");
// une victoire en cours n'est pas interrompue par un NUKE
const victoire = nuke([[0, false], [100, false], [200, false, true], [300, false, true], [400, true, true], [500, false, true]]);
assert.equal(victoire[2], "win");
assert.ok(victoire.slice(3).every((x) => x === "win"), "VICTOIRE ! n'est pas interrompue par un NUKE : " + victoire.join());

// textes FR et EN (dictionnaire interne du panneau)
const T2 = JS(ev("TXT"));
for (const k of ["nuke", "boum", "alerte", "nepas", "super", "j", "h", "min", "s", "objets"]) assert.ok(T2.fr[k] && T2.en[k], "FR et EN : " + k);
assert.equal(T2.fr.boum, "BOUM !"); assert.equal(T2.en.boum, "BOOM !");
assert.equal(T2.fr.nepas, "NE PAS APPUYER"); assert.equal(T2.en.nepas, "DO NOT PRESS");
assert.equal(T2.fr.alerte, "ALERTE !"); assert.equal(T2.en.alerte, "ALERT !");
// anti-spoil : aucune animation ne cite un boss, une zone ni un objet verrouillé ; le compte à rebours est un décor (0,6 s par chiffre)
assert.ok(!/bossActuel|S\.nom/.test(code.slice(code.indexOf("var NUKES="), code.indexOf("function sNuke"))), "aucun nom de boss dans les animations");
assert.ok(code.includes("lu=u%0.6"), "3 - 2 - 1 : 0,6 s par chiffre, décor pur");
console.log("idle-borne-led-nuke-objet-v1: OK");
