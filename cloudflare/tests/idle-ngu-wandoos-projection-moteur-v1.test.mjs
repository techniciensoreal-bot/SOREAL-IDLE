import assert from "node:assert/strict";
import fs from "node:fs";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "./_partie-reference.mjs";

/*
 * Norman (2026-11-05, plan design/PLAN-MOTEUR-UNIQUE.md) : MÊME preuve que pour la Machine temporelle et les Augmentations, pour les NGU (ngu-labo-v1.js) et Wandoos (wandoos-retro-v1.js) : la position d'une barre calculée par l'écran entre deux
 * réponses du moteur (niveau + fraction) doit être celle que donne le vrai moteur à l'instant visé. Moteur : advanceNgusV1 (idle-ngu-bonus.js) et advanceWandoos (idle-ngu-etat.js). Partie réelle anonymisée : references/partie-reference-1.json
 * (NGU Augments niveau 73, Wandoos 98 en cours de démarrage), horloge GELÉE et hasard à graine (_partie-reference.mjs).
 *
 * ÉCRAN WANDOOS : fractionBarre_ (wandoos-retro-v1.js) est extraite du fichier telle quelle (pure, horloge injectée).
 * ÉCRAN NGU : le calcul est en ligne dans tick_ (ngu-labo-v1.js, pas de fonction à extraire) ; il est recopié ici ligne pour ligne (ecranNgu) et un garde vérifie que le source de l'écran contient toujours ces lignes.
 *
 * DIVERGENCES (constatées, NON corrigées ; le test reste vert pour ce qui est identique et les compte à la fin, détail avec SOREAL_IDLE_DETAIL_DIVERGENCES=1) :
 *  D1 (NGU) l'écran fait avancer les niveaux à durée CONSTANTE (spl du niveau de départ) alors que le moteur facture le niveau N+1 à (N+1) x le coût de base (nguLevelsFromWorkV1, coût triangulaire) : dès que la barre passe plusieurs niveaux, l'écran en gagne trop.
 *  D2 (NGU) au cap (1/spl >= 49,99) l'écran donne floor(ecoule x 50) niveaux, le moteur jusqu'à ceil(50 x dt) : écart d'un niveau possible.
 *  D3 (NGU) à la cible, le moteur perd le travail restant (rest = 0), l'écran garde la fraction (non testé : aucune cible posée).
 *  D4 (Wandoos) au-dessus de 4 niveaux/s l'écran ne dessine pas la fraction du moteur : phase calée sur l'horloge (temps x v modulo 1) ; à 49,99+ la barre est pleine (f = 1). Choix d'affichage, mais ce n'est pas la fraction du moteur.
 *  D5 (Wandoos) en dessous de 4 niveaux/s la fraction AFFICHÉE est étirée (f / (1 - 0,04 v)) ; la fraction brute (reste) coïncide.
 *  D6 (Wandoos) l'écran suppose la vitesse constante entre deux synchros ; le moteur la fait monter avec le boot (rampe 0 -> 100 % en 3 600 s) : écart tant que l'OS charge.
 */
const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-1.json", "utf8"));
const LIGNE = Object.keys(brut).sort((x, y) => x - y).map((k) => brut[k]);
const T0 = Date.parse(LIGNE[15]) + 60_000;
function nouvelle(energie) {
  figerLeHasard(); reglerHorloge(T0);
  let ligne = LIGNE;
  if (energie) {   /* beaucoup d'énergie libre : pour atteindre le plafond de 50 niveaux/s (CAP) */
    ligne = LIGNE.slice();
    const st = JSON.parse(ligne[37]);
    st.metaNgu.resources.energy = Object.assign(st.metaNgu.resources.energy || {}, { current: energie, cap: energie * 10, capNaturel: energie * 10 });
    ligne[37] = JSON.stringify(st);
  }
  const m = creerMoteur(ligne);
  m.run("synchroniserSorealIdle");
  return m;
}
const sync = (m) => m.run("synchroniserSorealIdle");
const agir = (m, p) => m.run("agirProgressionSorealIdle", p);

const src = fs.readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
const srcW = fs.readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");

/* --- écran NGU : recopie de tick_ (ngu-labo-v1.js) --- */
/* CORRIGÉ le 2026-11-05 : l'écran utilise maintenant le coût triangulaire du moteur (niveauxDepuisTravail_, copie exacte de nguLevelsFromWorkV1) au lieu d'une durée de niveau constante : D1 devient un ÉCHEC. La fonction de l'écran est EXTRAITE du fichier (plus de recopie). */
const aN = src.indexOf("function niveauxDepuisTravail_(niveau,travail){"), bN = src.indexOf("function tick_(){", aN);
assert.ok(aN > 0 && bN > aN, "niveauxDepuisTravail_ trouvée");
const niveauxDepuisTravail = new Function(src.slice(aN, bN) + "\nreturn niveauxDepuisTravail_;")();
assert.ok(src.includes("var travail=(Number(d.nlP)+ecoule/spl)*(n0+1);") && src.includes("var frac=Math.min(.999999999,rj.work/(n0+gagnes+1));") && src.includes("if((1/spl)>=49.99){frac=1;gagnes=Math.floor(ecoule*Math.min(50,1/spl));splMaintenant=spl;}"),
  "le calcul de tick_ (ngu-labo-v1.js) est toujours celui que ce test recopie");
function ecranNgu(n0, p0, spl, ecoule) {
  const travail = (Number(p0) + ecoule / spl) * (n0 + 1);
  const rj = niveauxDepuisTravail(n0, travail);
  let gagnes = rj.gained, frac = Math.min(0.999999999, rj.work / (n0 + gagnes + 1));
  if ((1 / spl) >= 49.99) { frac = 1; gagnes = Math.floor(ecoule * Math.min(50, 1 / spl)); }
  return { niveau: n0 + gagnes, frac };
}

/* --- écran Wandoos : fractionBarre_ extraite telle quelle --- */
const a0 = srcW.indexOf("function fractionBarre_(p0,v,at){");
const b0 = srcW.indexOf("function vivre_(){", a0);
assert.ok(a0 > 0 && b0 > a0, "fractionBarre_ trouvée");
let tEcran = 0;
const fractionBarre = new Function("maintenant_", srcW.slice(a0, b0) + "\nreturn fractionBarre_;")(() => tEcran);

/* --- lecture du moteur --- */
const lireNgu = (r, id) => { const l = r.joueur.systemes.ngus; const n = l.tiers[l.tier || "normal"].find((x) => x.id === id); return { niveau: n.level, fraction: n.progress, spl: n.secondsPerLevel }; };
const lireWd = (r, res) => {
  const j = r.joueur, w = j.systemes.systems.find((x) => x.id === "wandoos").state.data, v = j.systemes.wandoosView;
  return res === "energy"
    ? { niveau: w.dumpEnergyLevel, fraction: w.dumpEnergyProgress, v: v.vitesseEnergie, boot: v.bootFraction }
    : { niveau: w.dumpMagicLevel, fraction: w.dumpMagicProgress, v: v.vitesseMagie, boot: v.bootFraction };
};
const D = { D1: [], D2: [], D4: [], D5: [], D6: [], autre: [] };
let niveauxMax = 0, nguCmp = 0, wdCmp = 0, nguCap = 0, wdCap = 0, nguPasseNiveaux = 0, wdLent = 0;

/* ============ NGU : plusieurs NGU d'énergie, de l'allocation lente au cap, plusieurs durées ============ */
for (const ngu of ["augments", "wandoos", "respawn"]) {
  for (const part of [1e-4, 1e-2, 0.2, 1]) {          /* part de l'énergie libre placée */
    for (const dt of [0.5, 3, 25, 200, 3000]) {
      const m = nouvelle();
      const libre = sync(m).joueur.energie;
      agir(m, { action: "allocateNgu", ngu, value: Math.floor(libre * part) });
      avancer(2000); sync(m);
      const a = lireNgu(sync(m), ngu);
      if (!(a.spl > 0)) { D.autre.push(["NGU", ngu, part, dt, "pas de barre"]); continue; }
      const e = ecranNgu(a.niveau, a.fraction, a.spl, dt);
      /* le moteur avance par pas d'au plus 30 s (synchro en ligne) ; au-delà, c'est le pas grossier hors ligne */
      let restant = dt, b;
      while (restant > 1e-9) { const pas = Math.min(dt > 60 ? restant : 30, restant); avancer(pas * 1000); restant -= pas; b = lireNgu(sync(m), ngu); }
      nguCmp += 1;
      const cap = 1 / a.spl >= 49.99;
      if (cap) nguCap += 1;
      niveauxMax = Math.max(niveauxMax, b.niveau - a.niveau);
      if (b.niveau - a.niveau > 0) nguPasseNiveaux += 1;
      /* RÈGLE DU WIKI (moteur) : au plus 50 niveaux par seconde. */
      assert.ok(b.niveau - a.niveau <= Math.ceil(50 * dt) + 1, "NGU " + ngu + " : plus de 50 niveaux/s : " + (b.niveau - a.niveau) + " en " + dt + " s");
      if (e.niveau !== b.niveau) D[cap ? "D2" : "D1"].push({ ngu, part, dt, niveau0: a.niveau, fraction0: +a.fraction.toFixed(4), spl: +a.spl.toFixed(5), moteur: b.niveau, ecran: e.niveau });
      else if (!cap && Math.abs(e.frac - b.fraction) > 2e-3) D.autre.push({ nguFraction: true, ngu, part, dt, moteur: +b.fraction.toFixed(4), ecran: +e.frac.toFixed(4) });
      /* IDENTIQUE exigé : barre qui ne passe aucun niveau (cas courant d'une barre lente) -> niveau et fraction égaux. */
      if (!cap && b.niveau === a.niveau) {
        assert.equal(e.niveau, b.niveau, "NGU " + ngu + " : niveau (aucun niveau passé) part " + part + " dt " + dt);
        assert.ok(Math.abs(e.frac - b.fraction) < 2e-3, "NGU " + ngu + " : fraction part " + part + " dt " + dt + " : moteur " + b.fraction + " / écran " + e.frac);
      }
    }
  }
}

/* ============ Wandoos : boot fini (avancer d'une heure) puis allocations lentes -> cap ; et boot en cours ============ */
function wandoos(bootFini, res) {
  for (const part of [1e-4, 1e-3, 1e-2, 0.2, 1]) {
    for (const dt of [0.5, 3, 25, 200]) {
      const m = nouvelle();
      if (bootFini) { avancer(3700 * 1000); sync(m); }
      const r0 = sync(m);
      const libre = res === "energy" ? r0.joueur.energie : r0.joueur.systemes.resources.magic.current;
      agir(m, { action: "allocate", system: "wandoos", resource: res, value: Math.floor(libre * part) });
      avancer(2000); sync(m);
      const a = lireWd(sync(m), res);
      if (!(a.v > 0)) { D.autre.push(["WD", res, part, dt, "vitesse nulle"]); continue; }
      tEcran = 1e6;
      const at = tEcran; tEcran = at + dt * 1000;
      const e = fractionBarre(a.fraction, a.v, at);
      let restant = dt, b;
      while (restant > 1e-9) { const pas = Math.min(30, restant); avancer(pas * 1000); restant -= pas; b = lireWd(sync(m), res); }
      wdCmp += 1;
      if (a.v >= 49.99) wdCap += 1; else if (a.v < 4) wdLent += 1;
      niveauxMax = Math.max(niveauxMax, b.niveau - a.niveau);
      assert.ok(a.v <= 50 + 1e-9, "Wandoos : vitesse <= 50 niveaux/s : " + a.v);                                                          /* règle du wiki : Dump 50 niveaux/s au plus */
      assert.ok(b.niveau - a.niveau <= Math.ceil(50 * dt) + 1, "Wandoos : plus de 50 niveaux/s : " + (b.niveau - a.niveau) + " en " + dt + " s");
      const niveauEcran = a.niveau + e.gain;
      const info = { res, part, dt, v: +a.v.toFixed(4), boot: +a.boot.toFixed(3), niveau0: a.niveau, moteur: b.niveau, ecran: niveauEcran };
      if (!bootFini) { if (niveauEcran !== b.niveau) D.D6.push(info); continue; }
      if (niveauEcran !== b.niveau) D.autre.push(Object.assign({ wdNiveau: true }, info));
      if (a.v >= 4) { D.D4.push(Object.assign(info, { moteurFraction: +b.fraction.toFixed(4), ecranF: +e.f.toFixed(4) })); continue; }
      const fBrute = 1 - e.reste * a.v;                                      /* `reste` = (1 - f) / v avec f = fraction brute */
      assert.equal(niveauEcran, b.niveau, "Wandoos " + res + " : niveau part " + part + " dt " + dt + " : moteur " + b.niveau + " / écran " + niveauEcran);
      assert.ok(Math.abs(fBrute - b.fraction) < 2e-3, "Wandoos " + res + " : fraction part " + part + " dt " + dt + " : moteur " + b.fraction + " / écran " + fBrute);
      if (Math.abs(e.f - b.fraction) > 2e-3) D.D5.push(Object.assign(info, { moteurFraction: +b.fraction.toFixed(4), ecranAffichee: +e.f.toFixed(4) }));
    }
  }
}
wandoos(true, "energy");
wandoos(true, "magic");
wandoos(false, "energy");   /* OS en cours de démarrage (25 % dans la partie de référence) : D6 */

/* ============ NGU rapides mais sous le cap (plusieurs niveaux par seconde) : D1 attendue ============ */
for (const energie of [1e9, 1e11, 1e13]) {
  for (const dt of [1, 5, 30]) {
    const m = nouvelle(energie);
    agir(m, { action: "allocateNgu", ngu: "augments", value: energie });
    avancer(2000); sync(m);
    const a = lireNgu(sync(m), "augments");
    if (!(a.spl > 0.0201)) { D.autre.push(["NGU rapide : cap", energie, dt]); continue; }
    nguCmp += 1;
    const e = ecranNgu(a.niveau, a.fraction, a.spl, dt);
    let restant = dt, b;
    while (restant > 1e-9) { const pas = Math.min(30, restant); avancer(pas * 1000); restant -= pas; b = lireNgu(sync(m), "augments"); }
    niveauxMax = Math.max(niveauxMax, b.niveau - a.niveau);
    if (b.niveau - a.niveau > 0) nguPasseNiveaux += 1;
    assert.ok(b.niveau - a.niveau <= Math.ceil(50 * dt) + 1, "NGU rapide : plus de 50 niveaux/s");
    if (e.niveau !== b.niveau) D.D1.push({ energie, dt, niveau0: a.niveau, spl: +a.spl.toFixed(5), moteur: b.niveau, ecran: e.niveau });
  }
}

/* ============ Barres AU CAP (50 niveaux/s) : beaucoup d'énergie libre ============ */
for (const dt of [0.1, 0.5, 1, 3, 25]) {
  for (const ngu of ["augments", "powerAlpha"]) {
    const m = nouvelle(1e20);
    agir(m, { action: "allocateNgu", ngu, value: 1e20 });
    avancer(2000); sync(m);
    const a = lireNgu(sync(m), ngu);
    if (!(a.spl > 0 && 1 / a.spl >= 49.99)) { D.autre.push(["NGU cap non atteint", ngu, a.spl]); continue; }
    nguCap += 1; nguCmp += 1;
    const e = ecranNgu(a.niveau, a.fraction, a.spl, dt);
    avancer(dt * 1000);
    const b = lireNgu(sync(m), ngu);
    assert.ok(b.niveau - a.niveau <= Math.ceil(50 * dt) + 1, "NGU cap : plus de 50 niveaux/s : " + (b.niveau - a.niveau) + " en " + dt + " s");
    assert.ok(b.niveau - a.niveau >= Math.floor(50 * dt) - 1, "NGU cap : au moins ~50 niveaux/s : " + (b.niveau - a.niveau) + " en " + dt + " s");
    if (e.niveau !== b.niveau) D.D2.push({ ngu, dt, niveau0: a.niveau, spl: a.spl, moteur: b.niveau, ecran: e.niveau });
  }
  const m = nouvelle(1e20);
  agir(m, { action: "allocate", system: "wandoos", resource: "energy", value: 1e20 });
  avancer(3700 * 1000); sync(m);
  const a = lireWd(sync(m), "energy");
  if (!(a.v >= 49.99)) { D.autre.push(["WD cap non atteint", a.v]); continue; }
  wdCap += 1; wdCmp += 1;
  tEcran = 1e6; const at = tEcran; tEcran = at + dt * 1000;
  const e = fractionBarre(a.fraction, a.v, at);
  avancer(dt * 1000);
  const b = lireWd(sync(m), "energy");
  assert.ok(b.niveau - a.niveau <= Math.ceil(50 * dt) + 1, "Wandoos cap : plus de 50 niveaux/s : " + (b.niveau - a.niveau) + " en " + dt + " s");
  assert.equal(a.niveau + e.gain, b.niveau, "Wandoos cap : niveau après " + dt + " s");
  assert.equal(e.f, 1, "Wandoos cap : barre pleine");
}

assert.ok(nguCmp >= 40 && wdCmp >= 40, "le test compare vraiment des barres : NGU " + nguCmp + ", Wandoos " + wdCmp);
assert.ok(nguPasseNiveaux >= 5 && niveauxMax >= 20, "le test passe vraiment des niveaux : " + nguPasseNiveaux + " cas, " + niveauxMax + " niveaux au mieux");
if (process.env.SOREAL_IDLE_DETAIL_DIVERGENCES) console.log(JSON.stringify(D, null, 1));
assert.equal(D.D1.length, 0, "NGU : l'écran et le moteur donnent les mêmes niveaux (coût triangulaire) : " + JSON.stringify(D.D1.slice(0, 3)));
console.log("idle-ngu-wandoos-projection-moteur-v1: OK (NGU " + nguCmp + " cas dont " + nguCap + " au cap, Wandoos " + wdCmp + " cas dont " + wdCap + " au cap et " + wdLent + " lents ; divergences constatées : D1=" + D.D1.length + " D2=" + D.D2.length + " D4=" + D.D4.length + " D5=" + D.D5.length + " D6=" + D.D6.length + " autres=" + D.autre.length + ")");
