import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-11-03) : « pourquoi ta regen de magie et d'énergie fait des rollback en local ? » puis « si un nombre recule, c'est une erreur de calcul ou une latence : supprime-le à la racine ».
 * Cause MESURÉE (jeu local, énergie et magie à +1/s, synchro toutes les 1,5 s) : un recul de 1 exactement toutes les 3,0 s sur les deux barres. Le moteur crédite par REMPLISSAGES (bars points, fillProgress = part du
 * remplissage en cours) ; la page comptait ses propres ticks sur son horloge locale, sans jamais connaître la phase du moteur (energieTick.resteMs valait toujours 0) : avec deux réseaux de ticks sans lien, la page
 * franchissait l'entier suivant avant le moteur, et la réponse suivante (valeur du moteur à son instant) était plus basse d'une unité.
 * Correction : à chaque réponse la page se cale sur la phase RÉELLE du moteur, avancée de l'âge de la réponse (modules/regen-ressources-v1.js, ancrerRegenerationIdleV1_ dans ui-boucle-v1.js). Ce test fait tourner
 * le VRAI moteur (états à des instants quelconques), le VRAI code de calage et le VRAI code du tick de la page (extrait de ui-boucle-v1.js) avec des phases, des âges et des intervalles de synchro variés ;
 * aucune valeur affichée ne doit reculer au remplacement de l'état. Le même scénario SANS calage (ancienne page) doit, lui, reculer : c'est ce qui prouve que le test voit la panne.
 */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

function joueurMoteur(barresE, barresM, plafond) {
  const g = creerJoueurExterneV1("regen" + Math.random().toString(36).slice(2) + "@example.com");
  const run = (op, ...a) => g.op(op, "x", ...a);
  run("obtenirEtatSorealIdle"); run("definirPseudoSorealIdle", "Regen");
  const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
  const stats = JSON.parse(arr[i]);
  stats.metaNgu.systems.bloodMagic.unlocked = true;
  for (const [r, b, v] of [["energy", barresE, 1.37], ["magic", barresM, 0.83]]) {
    const x = stats.metaNgu.resources[r];
    x.cap = plafond; x.capNaturel = plafond; x.current = 100; x.bars = b; x.speed = v;
  }
  arr[i] = JSON.stringify(stats);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}

/* ---- le VRAI code de la page : calage + tick (ui-boucle-v1.js), dans un faux navigateur ---- */
const src = readFileSync(new URL("../public/modules/ui-boucle-v1.js", import.meta.url), "utf8");
const srcEnergie = readFileSync(new URL("../public/modules/ui-magie-energie-v1.js", import.meta.url), "utf8");
const regenSrc = readFileSync(new URL("../public/modules/regen-ressources-v1.js", import.meta.url), "utf8");
const fonction = (code, nom) => { const a = code.indexOf("function " + nom + "("); assert.ok(a >= 0, nom); const b = code.indexOf("\n      }\n", a); return code.slice(a, b + 8); };
const debutSegment = src.indexOf("        const metaTickEnergie=\n          metaTickEnergieIdleV114_();");
const finSegment = src.indexOf("mettreAJourJeuIdleLocalV7__p2(ecouleTickMs);", debutSegment) + "mettreAJourJeuIdleLocalV7__p2(ecouleTickMs);".length;
assert.ok(debutSegment > 0 && finSegment > debutSegment, "segment du tick d'énergie et de magie retrouvé");
const segmentTick = src.slice(debutSegment, finSegment);

function page(avecCalage) {
  const REG = { idleNombre_: (v) => (Number.isFinite(Number(v)) ? Number(v) : 0), totalAllocationBasicTrainingIdleV120_: () => 0, allocationMetaEnergieIdleV1_: () => 0, allocationMetaMagieIdleV1_: () => 0, idleResteTickEnergieMsV114: 0 };
  const temps = { perf: 0, date: 0 };
  const win = { __SOREAL_IDLE_REG__: REG };
  win.window = win;
  const ctx = { window: win, document: { getElementById: () => null }, performance: { now: () => temps.perf }, Date: { now: () => temps.date }, console, setTimeout, clearTimeout, requestAnimationFrame() {}, navigator: {} };
  vm.createContext(ctx);
  vm.runInContext(regenSrc, ctx);
  const hook = "REG.__essai=function(maintenantTick,ecouleTickMs,max){\n" + segmentTick + "\n};\n  Object.assign(REG,{__p2:1,consommerAncreRegenIdleV1_:consommerAncreRegenIdleV1_,";
  vm.runInContext(src.replace("Object.assign(REG,{", hook), ctx);
  /* les deux calculs de tick de la page (vrai code de ui-magie-energie-v1.js) */
  const metas = new vm.Script("(function(REG,idleNombre_){" + fonction(srcEnergie, "metaTickEnergieIdleV114_") + fonction(srcEnergie, "metaTickMagieIdleV1_") + "REG.metaTickEnergieIdleV114_=metaTickEnergieIdleV114_;REG.metaTickMagieIdleV1_=metaTickMagieIdleV1_;})");
  metas.runInContext(ctx)(REG, REG.idleNombre_);
  return { REG, temps };
}

/* Scénario : les réponses du moteur arrivent à des instants variés (âge variable), les images de la page tombent à des instants quelconques. Renvoie le tableau des remplacements. */
function simuler({ avecCalage, barresE, barresM, plafond, graine, dureeMs, intervalleMin, intervalleMax }) {
  let s = graine >>> 0;
  const alea = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const run = joueurMoteur(barresE, barresM, plafond);
  const t0 = horloge;
  const { REG, temps } = page(avecCalage);
  /* réponses du moteur : instant de calcul T0, âge A, réception R = T0 + A (ordre conservé) */
  const reponses = [];
  let T = 400 + alea() * 900, derniereR = 0;
  while (T < dureeMs) {
    const A = alea() * 450;
    const R = Math.max(T + A, derniereR + 1);
    derniereR = R;
    reponses.push({ T, A, R });
    T += intervalleMin + alea() * (intervalleMax - intervalleMin);
  }
  /* états du moteur aux instants T (calcul dans l'ordre) */
  for (const r of reponses) { horloge = t0 + Math.round(r.T); r.etat = JSON.parse(JSON.stringify(run("synchroniserSorealIdle").joueur)); r.T = Math.round(r.T); r.R = Math.max(r.T, Math.round(r.R)); r.A = r.R - r.T; }
  /* état initial de la page = premier état, sans âge */
  const premier = reponses[0];
  const evenements = reponses.map((r) => ({ t: r.R, reponse: r }));
  const lignes = [];
  let dernierImage = premier.R, maintenant = premier.R, indice = 0;
  const etat = { cible: null };
  const appliquer = (r, t) => {
    const v = JSON.parse(JSON.stringify(r.etat));
    v.__recuPerfV1 = t - r.A;
    const avantE = etat.cible ? etat.cible.energie : null, avantM = etat.cible ? etat.cible.systemes.resources.magic.current : null;
    REG.idleEtat = v;
    temps.perf = t; temps.date = t;
    if (avecCalage) REG.ancrerRegenerationIdleV1_(v, v);
    if (etat.cible) lignes.push({ t, age: r.A, phaseE: r.etat.systemes.resources.energy.fillProgress, avantE, apresE: v.energie, avantM, apresM: v.systemes.resources.magic.current });
    etat.cible = v;
  };
  appliquer(premier, premier.R); indice = 1;
  const image = (t) => {
    temps.perf = t; temps.date = t;
    const ecoule = Math.max(0, Math.min(1000, t - dernierImage));
    dernierImage = t;
    const max = Math.max(0, Math.floor(etat.cible.energieMax));
    REG.__essai(t, ecoule, max);
  };
  while (maintenant < dureeMs) {
    const suivante = maintenant + 8 + alea() * 24;       /* images irrégulières (8 à 32 ms) */
    if (indice < evenements.length && evenements[indice].t <= suivante) { maintenant = evenements[indice].t; appliquer(evenements[indice].reponse, maintenant); indice += 1; image(maintenant); continue; }
    maintenant = suivante; image(maintenant);
  }
  return lignes;
}

const recules = (lignes) => lignes.filter((l) => l.apresE < l.avantE || l.apresM < l.avantM);
const scenarios = [
  { nom: "1 point par remplissage, plafond haut", barresE: 1, barresM: 1, plafond: 1e9 },
  { nom: "3 et 2 points par remplissage (compte-gouttes)", barresE: 3, barresM: 2, plafond: 1e9 },
  { nom: "5 points, synchros plus rares", barresE: 5, barresM: 4, plafond: 1e9, intervalleMin: 2000, intervalleMax: 3200 }
];
let total = 0, reculsAncien = 0;
const tableau = [];
for (const sc of scenarios) {
  for (let graine = 1; graine <= 6; graine += 1) {
    const base = Object.assign({ graine: graine * 7919, dureeMs: 60_000, intervalleMin: 900, intervalleMax: 1700 }, sc);
    const neuf = simuler(Object.assign({ avecCalage: true }, base));
    const ancien = simuler(Object.assign({ avecCalage: false }, base));
    total += neuf.length; reculsAncien += recules(ancien).length;
    assert.deepEqual(recules(neuf).map((l) => ({ t: l.t, age: l.age, avantE: l.avantE, apresE: l.apresE, avantM: l.avantM, apresM: l.apresM })), [], sc.nom + " (graine " + graine + ") : aucune valeur affichée ne recule au remplacement de l'état");
    if (graine === 1) tableau.push(sc.nom + " : " + neuf.length + " remplacements, " + recules(neuf).length + " recul (ancienne page : " + recules(ancien).length + ")");
  }
}
assert.ok(reculsAncien >= 10, "le même scénario SANS calage recule (" + reculsAncien + " reculs) : le test voit bien la panne");
assert.ok(total > 300, "assez de remplacements simulés : " + total);

/* ---- au plafond : ni dépassement ni recul ---- */
{
  const neuf = simuler({ avecCalage: true, barresE: 1, barresM: 1, plafond: 180, graine: 42, dureeMs: 60_000, intervalleMin: 900, intervalleMax: 1700 });
  assert.deepEqual(recules(neuf), [], "au plafond : aucun recul");
  assert.ok(neuf.every((l) => l.apresE <= 180 && l.apresM <= 180), "au plafond : jamais au-dessus du plafond");
}

/* ---- la projection pure ---- */
{
  const R = (() => { const w = {}; w.window = w; vm.runInNewContext(regenSrc, w); return w.__SOREAL_IDLE_REGEN_V1__; })();
  const J = (x) => JSON.parse(JSON.stringify(x));
  const base = { base: 100, bars: 1, perSecond: 1, gain: 1, dureeMs: 1000, max: Infinity };
  assert.deepEqual(J(R.projeter(Object.assign({ fp: 0.7, ageMs: 0 }, base))), { valeur: 100, resteMs: 700 }, "à l'instant du moteur : sa valeur, sa phase");
  assert.deepEqual(J(R.projeter(Object.assign({ fp: 0.7, ageMs: 300 }, base))), { valeur: 101, resteMs: 0 }, "300 ms plus tard le remplissage se termine");
  assert.deepEqual(R.projeter(Object.assign({ fp: 0.97, ageMs: 100 }, base)).valeur, 101, "phase 0,97 + 100 ms : un point de plus, exactement");
  assert.equal(R.projeter(Object.assign({ fp: 0.5, ageMs: 0 }, base, { bars: 5, perSecond: 5, gain: 1, dureeMs: 200 })).valeur, 102, "5 points par remplissage : le compte-gouttes a déjà crédité 2 points à mi-remplissage");
  assert.deepEqual(J(R.projeter(Object.assign({ fp: 0, ageMs: 5000 }, base, { max: 103 }))), { valeur: 103, resteMs: 0 }, "plafond");
  assert.equal(R.projeter(Object.assign({}, base, { fp: 0.2, ageMs: 0, perSecond: 0 })), null, "sans vitesse : rien n'est inventé");
}

/* ---- câblage : tous les chemins de remplacement de l'état passent par le calage ---- */
const ui = readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
assert.ok(ui.includes("UI_PARTAGE_V1.ancrerRegenerationIdleV1_(v,v)"), "le remplacement de l'état cale l'énergie et la magie");
assert.ok(ui.indexOf("ancrerRegenerationIdleV1_(v,v)") < ui.indexOf("M.garder(ancienEtatV1,v,"), "le calage précède la garde générale (qui ne reçoit que des valeurs ramenées à maintenant)");
const ent = readFileSync(new URL("../public/modules/ui-entrainement-v1.js", import.meta.url), "utf8");
assert.equal(ent.split("REG.ancrerRegenerationIdleV1_(REG.idleEtat,joueur,true)").length - 1, 3, "les trois réponses de Basic Training qui recopient l'énergie calent aussi l'horloge");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/regen-ressources-v1.js?v='), "module chargé");
assert.ok(src.includes("const resteCaleMagieV1=consommerAncreRegenIdleV1_('magie',Date.now());") && src.includes("const resteCaleEnergieV1=consommerAncreRegenIdleV1_('energie',maintenantTick);"), "le tick repart de la phase du moteur");

console.log("idle-regen-sans-recul-v1: OK (" + total + " remplacements simulés, ancienne page : " + reculsAncien + " reculs)\n  " + tableau.join("\n  "));
