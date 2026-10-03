import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, normalizeIdleNguState, idleNguEffectiveResourceStat } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-24) : « Augmentation ne fonctionne pas comme dans NGU IDLE. Il me semble qu'il y avait des + pour pouvoir y placer
 * de l'énergie comme pour Basic Training. Là, si je clique sur 50 %, ça me retire l'énergie de Basic Training… »
 * Wiki, page Augmentations : « the leveling up speed depends on the amount of allocated energy » (énergie ALLOUÉE par piste).
 * Les anciens boutons 0/25/50/100 % visaient un montant absolu (fraction du Cap) et prenaient d'un coup toute l'énergie libre.
 */
const CTX = { bosses: 40 };
const T0 = 1e12;
function etat(libre, basicTraining = 0) {
  const s = normalizeIdleNguState({}, {}, T0);
  s.systems.augmentations.unlocked = true;
  s.resources.energy.current = libre;
  return { s, ctx: { ...CTX, basicTrainingEnergyAllocation: basicTraining } };
}
const alloue = (s, pair = "scissors", upgrade = false) => s.systems.augmentations.data.pairs[pair][upgrade ? "upgradeEnergy" : "energy"];

// --- « + » : place exactement le montant demandé, sans toucher à ce que Basic Training a déjà pris ---
{
  const { s, ctx } = etat(250, 200); // Cap 500 : 200 chez Basic Training, 250 libres
  const cap = idleNguEffectiveResourceStat(s, "energy", "cap");
  assert.equal(cap, 500);
  let r = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 0 + 125 }, ctx, T0);
  assert.equal(alloue(r.state), 125, "+125 (Input par défaut)");
  assert.equal(r.state.resources.energy.current, 125, "il reste 125 d'énergie libre");
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 125 + 125 }, ctx, T0);
  assert.equal(alloue(r.state), 250);
  assert.equal(r.state.resources.energy.current, 0);
  // au-delà de l'énergie libre : borné, jamais de l'énergie prise à Basic Training
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 250 + 125 }, ctx, T0);
  assert.equal(alloue(r.state), 250, "plus d'énergie libre : rien de plus n'est placé");
  // « − » rend l'énergie
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 250 - 125 }, ctx, T0);
  assert.equal(alloue(r.state), 125);
  assert.equal(r.state.resources.energy.current, 125);
}

// --- « Max » : toute l'énergie libre (le client envoie le Cap, le serveur borne) ---
{
  const { s, ctx } = etat(60, 400);
  const r = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 500 }, ctx, T0);
  assert.equal(alloue(r.state), 60);
  assert.equal(r.state.resources.energy.current, 0);
}

// --- « Tout retirer » : rend l'énergie de tous les Augments et Upgrades ---
{
  const { s, ctx } = etat(300, 0);
  let r = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 100 }, ctx, T0);
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: true, value: 50 }, ctx, T0);
  assert.equal(r.state.resources.energy.current, 150);
  r = applyIdleNguAction(r.state, { action: "clearAugmentAllocations" }, ctx, T0);
  assert.equal(alloue(r.state), 0);
  assert.equal(alloue(r.state, "scissors", true), 0);
  assert.equal(r.state.resources.energy.current, 300);
  assert.equal(r.state.systems.augmentations.allocation.energy, 0);
}

// --- Client : − / + / Max par piste, Input, énergie libre, Tout retirer ; plus de 0/25/50/100 % ---
const module_ = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = module_.slice(module_.indexOf("function pageAugmentationsIdleV48_(j)"), module_.indexOf("function pageTimeMachineIdleV48_(j)"));
assert.ok(page.includes("[['plus','+'],['moins','−'],['max','Max']]"), "+ avant − avant Max, comme Basic Training et Time Machine (2026-09-27)");
/*
 * Norman (2026-09-29, répété) : « J'ai demandé des boutons de la même taille que ceux de Basic
 * training... Ils sont toujours énormes dans Augmentations et Blood magic. » La variante réduite
 * .compact-v1 (introduite le même jour, jamais demandée par Norman) est retirée : même classe EXACTE
 * que Basic Training, sans modificateur de taille.
 */
assert.ok(page.includes('class="soreal-idle-bt-actions-v120"'), "réutilise le style +vert/−rouge/Maxbleu de Basic Training, pas le bouton générique bleu");
assert.ok(!page.includes("compact-v1"), "plus de variante de taille réduite : taille strictement identique à Basic Training");
assert.ok(page.includes("window.__ajusterAugmentIdleV1__("));
assert.ok(!page.includes("['0%','25%','50%','100%']"), "les pourcentages du Cap ont disparu des Augmentations");
assert.match(page, /id="sorealIdleAugInputV1"/);
assert.match(page, /Énergie libre :/);
assert.match(page, /__viderAugmentsIdleV1__/, "« Tout retirer » : d'abord en local (chantier réactivité), puis envoi groupé");
assert.match(module_, /envoyerAllocRapideV1_\(\{action:'clearAugmentAllocations'\}\)/);
assert.match(module_, /const cible=mode==='plus'\s*\?current\+Math\.min\(pas,idleAvant\)\s*:mode==='moins'\s*\?Math\.max\(0,current-pas\)\s*:current\+idleAvant;/);
// Norman (2026-09-27) : « je veux le même son et la même animation ... que dans basic training, mais dans augmentation » -- même mise à
// jour optimiste locale (avant la réponse serveur) et même famille de sons (btPlus/btMinus/btCap) que ajusterBasicTrainingIdleV120_.
assert.match(module_, /const son=mode==='plus'\?'btPlus':mode==='moins'\?'btMinus':'btCap';/);
assert.match(module_, /if\(audio&&typeof audio\[son\]==='function'\)audio\[son\]\(\);/);
/*
 * 2026-09-29 (Norman : « j'ai l'impression que la réactivité n'est pas aussi bonne que dans basic
 * training. Le jeu m'a l'air plus lent. ») : un rendreIdleEtat_ complet à chaque clic régénère TOUT
 * le menu affiché -- remplacé par un patch DOM ciblé (rafraichirAllocationAugmentIdleV1_), comme
 * Basic Training le fait déjà depuis le début. La confirmation serveur (actionMetaNoyauIdleV130_)
 * continue de redessiner tout dès la réponse, donc aucune perte de cohérence.
 */
assert.match(module_, /function rafraichirAllocationAugmentIdleV1_\(pairId,upgrade,value\)\{/);
assert.match(module_, /rafraichirAllocationAugmentIdleV1_\(pairId,upgrade,value\);/);
assert.ok(!module_.includes("H.rendreIdleEtat_({ok:true,joueur:j});"), "plus de rendu complet à chaque clic +/-/Cap");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/meta-progression-v130.js?v=202610031"));

console.log("idle-augmentation-allocation-ui-v1: OK");

// --- Rendu réel de la page et clics simulés (module chargé dans un bac à sable, hôte simulé) ---
{
  const vm = await import("node:vm");
  const sent = [];
  const rendus = [];
  const patchsBarre = [];
  const sons = [];
  let etat = null;
  const els = {
    sorealIdleAugAllocV1_scissors_main: { textContent: "" },
    sorealIdleAugEnergieLibreV1: { textContent: "" }
  };
  const H = {
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.floor(Number(v) || 0),
    idleHtml_: (v) => String(v),
    formatGrandNombreIdleV70_: (v) => String(v),
    entetePageIdleV28_: (t) => "<h1>" + t + "</h1>",
    getIdleEtat: () => etat,
    /* Chantier réactivité (2026-09-30) : l'allocation part en différé par l'envoi groupé -> l'hôte reçoit la charge utile. */
    appelerProgressionIdleCloudflareV1_: (p, ok) => { sent.push(p); if (typeof ok === "function") ok({ ok: false }); },
    rendreIdleEtat_: (r) => rendus.push(r),
    /* 2026-09-29 : remplace rendreIdleEtat_ pour le patch ciblé -- voir rafraichirAllocationAugmentIdleV1_. */
    rafraichirEnergieEtBoutonsIdleV9_: () => patchsBarre.push(true)
  };
  const audio = {
    btPlus: () => sons.push("btPlus"),
    btMinus: () => sons.push("btMinus"),
    btCap: () => sons.push("btCap")
  };
  const window = { __SOREAL_IDLE_META_HOST_V130__: H, __SOREAL_IDLE_AUDIO_V199__: audio, __actionMetaV47__: (p) => sent.push(p) };
  const document = { getElementById: (id) => els[id] || null };
  const attendreEnvoi = () => new Promise((r) => setTimeout(r, 130));
  vm.runInNewContext(module_, { window, document, SOREAL_SESSION: "jeton", performance: { now: () => 0 }, console, Math, Number, Object, Array, Boolean, String, JSON, Date, setTimeout, clearTimeout });
  const fabriquerEtat = () => ({
    energie: 250,
    systemes: {
      systems: [{ id: "augmentations", state: { unlocked: true, allocation: { energy: 100 }, data: { pairs: { scissors: { level: 3, energy: 100, upgradeLevel: 0, upgradeEnergy: 0 } } } } }],
      augmentations: [{ id: "scissors", name: "Safety Scissors", unlockBoss: 17, progressPct: 0.5, upgradeProgressPct: 0, upgrade: { unlockBoss: 37 } }],
      resources: { energy: { cap: 500 } },
      records: { highestBoss: 40 }, currencies: { gold: 1000 }, bonuses: { augmentationMultiplier: 1.5 }
    }
  });
  etat = fabriquerEtat();
  const html = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_(etat, "augmentations", "Augmentations");
  assert.match(html, /Énergie libre : <b id="sorealIdleAugEnergieLibreV1">250<\/b>/);
  assert.equal((html.match(/__ajusterAugmentIdleV1__/g) || []).length, 6, "3 boutons pour l'Augment et 3 pour l'Upgrade");
  assert.ok(!html.includes("25%") && !html.includes("50%"));

  // « + » (Input = 40) : mise à jour optimiste locale IMMÉDIATE (avant même l'envoi réseau), même son que Basic Training.
  els.sorealIdleAugInputV1 = { value: "40" };
  window.__ajusterAugmentIdleV1__("scissors", false, "plus");
  await attendreEnvoi();
  assert.deepEqual(sent.map((p) => [p.action, p.pair, p.upgrade, p.value]), [["allocateAugment", "scissors", false, 140]]);
  assert.equal(etat.systemes.systems[0].state.data.pairs.scissors.energy, 140, "la piste est mise à jour localement, sans attendre le serveur");
  assert.equal(etat.energie, 210, "l'énergie idle restante baisse immédiatement (250 − 40)");
  assert.deepEqual(sons, ["btPlus"], "même son que le + de Basic Training");
  assert.equal(rendus.length, 0, "plus de rendu complet du tout sur ce chemin (2026-09-29, réactivité)");
  assert.equal(els.sorealIdleAugAllocV1_scissors_main.textContent, "140 ⚡", "le chiffre alloué est patché directement, sans rendu complet");
  assert.equal(els.sorealIdleAugEnergieLibreV1.textContent, "210", "l'énergie libre affichée est patchée directement aussi");
  assert.equal(patchsBarre.length, 1, "la barre d'Énergie principale est rafraîchie via le même patch ciblé que Basic Training");

  // « − » : même chose, son btMinus, part de la valeur déjà mise à jour localement (140).
  window.__ajusterAugmentIdleV1__("scissors", false, "moins");
  await attendreEnvoi();
  assert.equal(sent.at(-1).value, 100, "140 − 40");
  assert.equal(etat.systemes.systems[0].state.data.pairs.scissors.energy, 100);
  assert.equal(etat.energie, 250, "l'énergie rendue est restituée immédiatement");
  assert.deepEqual(sons, ["btPlus", "btMinus"]);
  assert.equal(els.sorealIdleAugAllocV1_scissors_main.textContent, "100 ⚡");
  assert.equal(els.sorealIdleAugEnergieLibreV1.textContent, "250");
  assert.equal(patchsBarre.length, 2);

  // « Max » : place toute l'énergie idle actuellement connue du client dans la piste (le serveur reste l'arbitre final).
  window.__ajusterAugmentIdleV1__("scissors", false, "max");
  await attendreEnvoi();
  assert.equal(sent.at(-1).value, 350, "100 + 250 (toute l'énergie idle libre)");
  assert.equal(etat.energie, 0);
  assert.deepEqual(sons, ["btPlus", "btMinus", "btCap"], "Max joue le même son que le Cap de Basic Training");
  assert.equal(els.sorealIdleAugAllocV1_scissors_main.textContent, "350 ⚡");
  assert.equal(rendus.length, 0, "toujours aucun rendu complet, même pour Cap/Max");

  // Aucune énergie idle restante : un « + » sur l'Upgrade ne change rien, donc aucun son ni patch supplémentaire (mais l'action part quand même).
  const patchsAvant = patchsBarre.length;
  window.__ajusterAugmentIdleV1__("scissors", true, "plus");
  await attendreEnvoi();
  assert.equal(sent.at(-1).value, 0, "plus d'énergie idle libre à placer");
  assert.equal(patchsBarre.length, patchsAvant, "aucun patch optimiste quand rien ne change réellement");
  assert.deepEqual(sons, ["btPlus", "btMinus", "btCap"], "aucun son supplémentaire quand rien ne change réellement");

  // Input invalide : on garde le dernier montant valide.
  etat = fabriquerEtat();
  els.sorealIdleAugInputV1 = { value: "" };
  window.__ajusterAugmentIdleV1__("scissors", false, "plus");
  await attendreEnvoi();
  assert.equal(sent.at(-1).value, 140, "Input invalide : on garde le dernier montant valide (40)");
}
console.log("idle-augmentation-allocation-ui-v1 (rendu): OK");
