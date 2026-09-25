import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-25), capture de « Broken Time Machine » dans NGU : deux pistes (Machine Speed vert / Gold Multiplier jaune) avec barre,
 * boutons + et −, champ « Target » (niveau cible, 0 = aucun), ressource allouée, niveau, et panneau des facteurs du GPS.
 * Choix confirmé par Norman : « Target » = niveau cible (l'allocation est retirée automatiquement une fois atteint).
 */
const ctx = { bosses: 100 };
const NOW = 1000;
function etatTm() {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.timeMachine.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  s.resources.magic.cap = 1000;
  s.resources.magic.current = 1000;
  s.currencies.gold = 1e30;
  s.systems.timeMachine.data.highestBossEver = 40;
  s.systems.timeMachine.data.bestGoldThisRun = 100;
  return s;
}
const agir = (s, p) => applyIdleNguAction(s, p, ctx, NOW).state;

// 1. Défaut : aucune cible, champs présents dans la vue
{
  const s = etatTm();
  assert.equal(s.systems.timeMachine.data.speedTarget, 0);
  assert.equal(s.systems.timeMachine.data.goldTarget, 0);
  const vue = idleNguSnapshot(s, ctx, 0).timeMachineView;
  assert.ok(vue, "vue exposée quand la Time Machine est débloquée");
  assert.equal(vue.speedTarget, 0);
  assert.equal(vue.goldTarget, 0);
  assert.equal(vue.goldPerBarFill, 100);
  assert.equal(vue.highestBossMultiplier, 73, "meilleur boss 100 - 27");
  assert.equal(vue.barFillsPerSecond, 1, "niveau 0 : 1 remplissage par seconde");
  assert.equal(vue.goldMultiplier, 1);
  assert.equal(vue.machineSpeedMultiplier, 1);
  // Les facteurs affichés multiplient exactement le GPS brut (une seule formule)
  const fills = vue.barFillsPerSecond * vue.machineSpeedMultiplier;
  const produit = vue.goldPerBarFill * vue.highestBossMultiplier * fills * vue.goldMultiplier * vue.bloodMagicMultiplier * vue.beardMultiplier * vue.challengeMultiplier * vue.nguMultiplier;
  assert.ok(Math.abs(produit - vue.grossGps) <= Math.abs(vue.grossGps) * 1e-9, "brut = produit des facteurs affichés (" + produit + " vs " + vue.grossGps + ")");
  assert.ok(vue.netGps <= vue.grossGps);
}

// 2. Vue verrouillée : aucune donnée (anti-spoil)
{
  const debut = { bosses: 0 };
  const s = normalizeIdleNguState({}, debut, 0);
  assert.equal(idleNguSnapshot(s, debut, 0).timeMachineView, null);
}

// 3. Niveaux Machine Speed >= 50 : facteurs du tableau du wiki (bar speed 50x, multiplicateur = niveau - 48)
{
  const s = etatTm();
  s.systems.timeMachine.data.speedLevel = 97;
  s.systems.timeMachine.data.goldLevel = 81;
  const vue = idleNguSnapshot(s, ctx, 0).timeMachineView;
  assert.equal(vue.barFillsPerSecond, 50);
  assert.equal(vue.machineSpeedMultiplier, 49, "capture du jeu : niveau 97 -> x49");
  assert.equal(vue.goldMultiplier, 82, "capture du jeu : niveau 81 -> x82");
}

// 4. Action « Target » : valeur enregistrée, bornée, pistes connues seulement
{
  let s = etatTm();
  s = agir(s, { action: "setTimeMachineTarget", track: "speed", value: 5 });
  assert.equal(s.systems.timeMachine.data.speedTarget, 5);
  s = agir(s, { action: "setTimeMachineTarget", track: "gold", value: 7.9 });
  assert.equal(s.systems.timeMachine.data.goldTarget, 7);
  s = agir(s, { action: "setTimeMachineTarget", track: "gold", value: -3 });
  assert.equal(s.systems.timeMachine.data.goldTarget, 0);
  assert.throws(() => agir(s, { action: "setTimeMachineTarget", track: "autre", value: 1 }), /PISTE_INCONNUE/);
  const verrou = normalizeIdleNguState({}, { bosses: 0 }, 0);
  assert.throws(() => applyIdleNguAction(verrou, { action: "setTimeMachineTarget", track: "speed", value: 1 }, { bosses: 0 }, NOW),
    /SYSTEME_VERROUILLE/);
  // La cible survit à la normalisation (sauvegarde / rechargement)
  const rechargee = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 0);
  assert.equal(rechargee.systems.timeMachine.data.speedTarget, 5);
}

// 5. Cible déjà atteinte au réglage : l'allocation est rendue tout de suite
{
  let s = etatTm();
  s = agir(s, { action: "allocate", system: "timeMachine", resource: "energy", value: 400 });
  assert.equal(s.systems.timeMachine.allocation.energy, 400);
  const energieLibre = s.resources.energy.current;
  s.systems.timeMachine.data.speedLevel = 10;
  s = agir(s, { action: "setTimeMachineTarget", track: "speed", value: 10 });
  assert.equal(s.systems.timeMachine.allocation.energy, 0, "niveau 10 >= cible 10 : énergie retirée");
  assert.equal(s.resources.energy.current, energieLibre + 400, "et rendue à la réserve");
}

// 6. Progression : la piste s'arrête à la cible et retire l'allocation ; sans cible elle continue
{
  const monter = (cible) => {
    let s = etatTm();
    s = agir(s, { action: "allocate", system: "timeMachine", resource: "energy", value: 1000 });
    s.resources.energy.power = 1e6; /* 1000 alloués x 1e6 de power : le niveau N dure N secondes */
    s.systems.timeMachine.data.speedTarget = cible;
    return advanceIdleNguState(s, 100, ctx, NOW).systems.timeMachine;
  };
  const avecCible = monter(2);
  assert.equal(avecCible.data.speedLevel, 2, "s'arrête exactement au niveau cible");
  assert.equal(avecCible.allocation.energy, 0, "allocation retirée à l'atteinte");
  const sansCible = monter(0);
  assert.ok(sansCible.data.speedLevel > 2 && sansCible.allocation.energy === 1000, "sans cible : la progression continue, allocation gardée");
}

// 7. Client : écran fidèle à la capture, actions branchées
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = meta.slice(meta.indexOf("function pageTimeMachineIdleV48_(j){"), meta.indexOf("function pageBloodMagicIdleV48_(j){"));
for (const attendu of ["Broken Time Machine", "Vitesse de la machine", "Multiplicateur d’or", "Cible", "Niveau", "GPS brut", "GPS net", "Or par remplissage de barre", "Remplissages de barre par seconde", "Bonus GPS Blood Magic", "Multiplicateur GPS NGU", "Multiplicateur des défis", "Multiplicateur du meilleur boss", "Multiplicateur GPS de la vitesse", "Multiplicateur GPS de la Barbe"]) {
  assert.ok(page.includes(attendu), "libellé « " + attendu + " » présent");
}
assert.ok(page.includes("__ajusterTimeMachineIdleV1__") && page.includes("__cibleTimeMachineIdleV1__"));
assert.match(meta, /action:'setTimeMachineTarget'/);
assert.ok(!/allocationMetaIdleV48_\(j,'timeMachine'/.test(page), "les presets 0/25/50/100 % n'y sont plus");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
for (const couleur of [".soreal-idle-tm-piste-v1.vitesse{ background:#a5dfb4; }", ".soreal-idle-tm-piste-v1.or{ background:#ebe89b; }", "background:#5f86ab;", "background:#c1c1c1;"]) {
  assert.ok(css.includes(couleur), "couleur de la capture : " + couleur);
}

// Rendu réel de la page avec un faux hôte
const actions = [];
const hote = {
  getIdleEtat: () => etat,
  idleHtml_: (v) => String(v == null ? "" : v).replace(/</g, "&lt;"),
  idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
  idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
  formatGrandNombreIdleV70_: (v) => String(v),
  entetePageIdleV28_: (t) => "<h1>" + t + "</h1>",
  appelerProgressionIdleCloudflareV1_() {}
};
const window = { __SOREAL_IDLE_META_HOST_V130__: hote, __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (x) => String(x) }, __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v) }, document: { getElementById: () => null } };
const sandbox = { window, document: window.document, SOREAL_SESSION: null };
vm.runInNewContext(meta, sandbox);
const api = window.__SOREAL_IDLE_META_V130__;
let etat = null;
{
  const s = etatTm();
  s.systems.timeMachine.data.speedLevel = 97;
  s.systems.timeMachine.data.goldLevel = 81;
  s.systems.timeMachine.data.speedTarget = 120;
  const snap = idleNguSnapshot(s, ctx, 0);
  etat = { systemes: snap };
  const html = api.pageSystemeMetaIdleV130_(etat, "timeMachine", "Machine temporelle");
  assert.match(html, /Broken Time Machine/);
  assert.match(html, /value="120"/, "cible de la vitesse affichée");
  assert.match(html, /Niveau<\/span><b>97</);
  assert.match(html, /Niveau<\/span><b>81</);
  assert.match(html, /soreal-idle-tm-piste-v1 vitesse/);
  assert.match(html, /soreal-idle-tm-piste-v1 or/);
  assert.match(html, /__ajusterTimeMachineIdleV1__\('energy','plus'\)/);
  assert.match(html, /__ajusterTimeMachineIdleV1__\('magic','moins'\)/);
  assert.match(html, /__cibleTimeMachineIdleV1__\('speed',this\.value\)/);
  // + / − envoient l'allocation actuelle ± Input
  window.__SOREAL_IDLE_META_HOST_V130__ = Object.assign({}, hote);
  window.__actionMetaV47__ = (p) => actions.push(p);
  window.document.getElementById = (id) => (id === "sorealIdleTmInputV1" ? { value: "250" } : null);
  s.systems.timeMachine.allocation.energy = 1000;
  etat = { systemes: idleNguSnapshot(s, ctx, 0) };
  window.__ajusterTimeMachineIdleV1__("energy", "plus");
  assert.deepEqual(JSON.parse(JSON.stringify(actions.pop())), { action: "allocate", system: "timeMachine", resource: "energy", value: 1250 });
  window.__ajusterTimeMachineIdleV1__("energy", "moins");
  assert.deepEqual(JSON.parse(JSON.stringify(actions.pop())), { action: "allocate", system: "timeMachine", resource: "energy", value: 750 });
  window.__cibleTimeMachineIdleV1__("gold", "33");
  assert.deepEqual(JSON.parse(JSON.stringify(actions.pop())), { action: "setTimeMachineTarget", track: "gold", value: 33 });
}

console.log("idle-time-machine-screen-target-v1: OK");
