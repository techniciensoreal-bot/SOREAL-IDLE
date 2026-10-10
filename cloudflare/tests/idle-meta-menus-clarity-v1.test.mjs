import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-29) : « retravailler les menus Augmentations, Time Machine, Blood Magic : plus clairs dans leur manière d'être
 * utilisés, savoir à quoi sert chaque chose » -- et AGENTS.md règle n°2 (anti-spoil) : ces trois écrans n'affichent que ce que le joueur
 * a déjà débloqué (ni carte « 🔒 », ni condition « bats le boss N », ni sort/rituel/piste pas encore atteint).
 */
const ctx = { bosses: 100 };
const NOW = 1000;

function etat() {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.timeMachine.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  s.resources.magic.cap = 1000;
  s.resources.magic.current = 1000;
  s.currencies.gold = 1e30;
  return s;
}
const agir = (s, p) => applyIdleNguAction(s, p, ctx, NOW).state;

// --- 1. Serveur : la liste des rituels n'envoie que les rituels débloqués (sa taille ne doit pas révéler le total). ---
{
  const s = etat();
  const avant = idleNguSnapshot(s, ctx, 0).bloodRituals;
  assert.ok(avant.length > 0 && avant.every((r) => !r.unlockFlag), "aucun rituel verrouillé dans la liste envoyée au client");
  const sDebloque = etat();
  sDebloque.challenge = sDebloque.challenge || { completions: {} };
  sDebloque.challenge.completions = Object.assign({}, sDebloque.challenge.completions, { troll: 6 });
  const apres = idleNguSnapshot(sDebloque, ctx, 0).bloodRituals;
  assert.equal(apres.length, avant.length + 1, "le rituel réservé au Troll Challenge 6 apparaît une fois débloqué, et seulement alors");
}

// --- 2. Serveur : le pic de Blood est mémorisé et survit au lancement d'un sort et à la normalisation. ---
{
  let s = etat();
  s = agir(s, { action: "allocate", system: "bloodMagic", resource: "magic", value: 1000 });
  s.resources.magic.power = 1e9;
  s = advanceIdleNguState(s, 10, ctx, NOW);
  const sang = s.currencies.blood;
  assert.ok(sang > 0, "le rituel actif produit du Blood");
  assert.equal(s.systems.bloodMagic.data.bloodPeak, sang, "pic = Blood atteint");
  s = agir(s, { action: "castBloodSpell", spell: "numberBoost" });
  assert.equal(s.currencies.blood, 0, "le sort dépense tout le Blood");
  assert.equal(s.systems.bloodMagic.data.bloodPeak, sang, "le pic reste acquis après le lancer (sort découvert = reste visible)");
  const relu = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 0);
  assert.equal(relu.systems.bloodMagic.data.bloodPeak, sang, "le pic survit à la sauvegarde / relecture");
}

// --- 3. Client : rendu réel des pages avec un faux hôte. ---
const meta = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8") + "\n" + readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") /* Blood Magic vit dans son module depuis le 2026-10-07 */;
let etatClient = null;
const hote = {
  getIdleEtat: () => etatClient,
  idleHtml_: (v) => String(v == null ? "" : v).replace(/</g, "&lt;"),
  idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
  idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
  formatGrandNombreIdleV70_: (v) => String(v),
  entetePageIdleV28_: (t, sous) => "<h1>" + t + "</h1><p>" + sous + "</p>",
  appelerProgressionIdleCloudflareV1_() {},
  rendreIdleEtat_() {},
  jouerEffetAudioIdleV199_() {}
};
const window = { __SOREAL_IDLE_META_HOST_V130__: hote, __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (x) => String(x) }, __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v) }, document: { getElementById: () => null } };
vm.runInNewContext(meta, { window, document: window.document, SOREAL_SESSION: null });
const api = window.__SOREAL_IDLE_META_V130__;
const SPOILS = [/🔒/, /Verrouillé/i, /Bats le boss/i, /\?\?\?/, /boss\s*\d+\s*pour/i];
const sansSpoil = (html, contexte) => { for (const re of SPOILS) assert.ok(!re.test(html), contexte + " : aucun indice de verrou (" + re + ")"); };

// Blood Magic : rien de plus que le sort de départ tant que les seuils ne sont pas atteints.
{
  const s = etat();
  etatClient = { systemes: idleNguSnapshot(s, ctx, 0), energie: 0 };
  const html = api.pageSystemeMetaIdleV130_(etatClient, "bloodMagic", "Blood Magic");
  assert.match(html, /À quoi ça sert/, "bloc d'aide présent");
  assert.match(html, /plus gros nombre au Rebirth/, "dit clairement à quoi sert le Blood");
  assert.match(html, /Blood NUMBER Boost/);
  for (const nom of ["Iron Pill", "Blood Spaghetti", "Counterfeit Gold"]) assert.ok(!html.includes(nom), nom + " invisible tant que son minimum n'a pas été atteint");
  assert.ok(!/Recharge de 11,5 h/.test(html), "aucune durée de recharge d'un sort non découvert");
  sansSpoil(html, "Blood Magic neuf");

  // Pic de 10 000 : Iron Pill (100) et Blood Spaghetti (10 000) découverts, pas Counterfeit Gold (1 000 000).
  s.systems.bloodMagic.data.bloodPeak = 1e4;
  etatClient = { systemes: idleNguSnapshot(s, ctx, 0), energie: 0 };
  const html2 = api.pageSystemeMetaIdleV130_(etatClient, "bloodMagic", "Blood Magic");
  assert.ok(html2.includes("Iron Pill") && html2.includes("Blood Spaghetti"), "sorts découverts visibles même avec 0 Blood en stock");
  assert.ok(!html2.includes("Counterfeit Gold"), "sort suivant toujours caché");
  assert.match(html2, /Recharge de 11,5 h/, "recharge de l'Iron Pill indiquée une fois découvert");
  sansSpoil(html2, "Blood Magic avec pic 10 000");
}

// Time Machine : sans Blood Magic, la piste Magic n'existe pas du tout (ni texte de verrou).
{
  /* Boss 30 : Time Machine débloquée, Blood Magic (boss 37) pas encore -- la synchro d'état ré-ouvre sinon tout ce que le contexte autorise. */
  const ctx30 = { bosses: 30 };
  const s = normalizeIdleNguState({}, ctx30, 0);
  s.systems.timeMachine.unlocked = true;
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  s.currencies.gold = 1e30;
  etatClient = { systemes: idleNguSnapshot(s, ctx30, 0), energie: 0 };
  const html = api.pageSystemeMetaIdleV130_(etatClient, "timeMachine", "Time Machine");
  assert.match(html, /À quoi ça sert/);
  assert.match(html, /Vitesse de la machine/);
  assert.ok(!html.includes("Multiplicateur d’or (Magic"), "l'aide ne parle pas de la piste Magic");
  assert.ok(!/soreal-idle-tm-piste-v1 or/.test(html), "pas de piste Magic");
  assert.ok(!/Magic|Magie/.test(html.replace(/Blood Magic/g, "")), "aucune mention de Magic tant que non débloquée");
  sansSpoil(html, "Time Machine sans Blood Magic");

  const sMagic = etat();
  etatClient = { systemes: idleNguSnapshot(sMagic, ctx, 0), energie: 0 };
  const htmlMagic = api.pageSystemeMetaIdleV130_(etatClient, "timeMachine", "Time Machine");
  assert.match(htmlMagic, /soreal-idle-tm-piste-v1 or/, "piste Magic présente une fois Blood Magic débloqué");
  assert.match(htmlMagic, /Multiplicateur d’or \(Magic \+ Or\)/, "et expliquée dans l'aide");
  assert.ok(!/Bonus GPS Blood Magic/.test(htmlMagic), "facteur à 100 % (sans effet) non listé");
}

// Augmentations : bloc d'aide + légende des boutons + sous-titre par piste (source, comme l'anti-spoil existant).
{
  const page = meta.slice(meta.indexOf("function pageAugmentationsIdleV48_(j)"), meta.indexOf("function pageTimeMachineIdleV48_(j)"));
  assert.ok(page.includes("carteAideMenuIdleV1_('augmentations'"), "Augmentations : bloc « À quoi ça sert ? »");
  assert.ok(page.includes("legendeAllocationIdleV1_('Energy',true)"), "Augmentations : légende Input / Cap / Idle");
  assert.ok(page.includes("aug-badge-v2 puissant") && page.includes("aug-badge-v2 normal"), "Augmentations : badge par piste (version normale / version puissante)");
  assert.match(page, /1 \+ niveau²/, "formule de l'Upgrade (wiki Augmentations) expliquée");
}

console.log("idle-meta-menus-clarity-v1: OK");
