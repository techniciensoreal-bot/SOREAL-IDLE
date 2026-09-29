import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-29) : « Je veux que Augmentation utilise exactement la même interface que Basic
 * training. La même taille de bouton, la même animation au moment d'ajouter des points, les boutons
 * Energy Cap ; Cap, 1/2, 1/4 et IDLE Cap, 1/2, 1/4. Pour Time Machine, je veux garder le visuel
 * actuel, mais je veux le son lié aux plus et moins de basic training et l'animation de l'énergie
 * allouée de basic training également. Je pense que Blood Magic nécessite des boutons Cap + et -
 * également. [...] pour chaque barre, il faut un temps pour compléter un niveau qui s'affiche. Dans
 * Blood magic, la manière dont tu l'as reproduit, ça n'est pas opérationnel. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const allocPop = readFileSync("cloudflare/public/modules/alloc-pop-v1.js", "utf8");

// --- 1. Basic Training : une durée par niveau s'affiche désormais (référence demandée par Norman, mais n'en avait aucune). ---
{
  assert.match(ui, /function texteEtaBasicTrainingIdleV1_\(niveauxParSeconde\)\{/, "helper ETA Basic Training introuvable");
  const debut = ui.indexOf("function texteEtaBasicTrainingIdleV1_(niveauxParSeconde){");
  const fin = ui.indexOf("function formaterEtaTimeMachineIdleV1_(secondes){", debut);
  const helper = ui.slice(debut, fin);
  const sandbox = { idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; } };
  vm.createContext(sandbox);
  vm.runInContext(helper + "\nfunction formaterEtaTimeMachineIdleV1_(s){const t=Math.max(0,Math.ceil(idleNombre_(s)));return t+' s';}", sandbox);
  assert.equal(sandbox.texteEtaBasicTrainingIdleV1_(0), "⏱ Aucune énergie allouée", "aucune vitesse -> pas de durée inventée");
  assert.equal(sandbox.texteEtaBasicTrainingIdleV1_(2), "⏱ 1 s par niveau", "2 niveaux/s -> 0,5s arrondi à 1s par le formateur partagé");

  assert.match(ui, /sorealIdleBtEtaV120_\$\{idleHtml_\(skill\.id\)\}/, "l'élément ETA doit exister dans la ligne d'une compétence");
  assert.match(ui, /texteEtaBasicTrainingIdleV1_\(\s*vitesseInitiale\s*\)/, "rendu initial de la ligne");
  const debutRafraichir = ui.indexOf("function rafraichirBasicTrainingIdleV120_(){");
  const finRafraichir = ui.indexOf("function fusionnerBasicTrainingPlusAvanceIdleV166_(", debutRafraichir);
  const rafraichir = ui.slice(debutRafraichir, finRafraichir);
  assert.match(rafraichir, /sorealIdleBtEtaV120_/, "l'ETA doit être rafraîchi à chaque tick, comme la vitesse et le cap");
  assert.match(rafraichir, /texteEtaBasicTrainingIdleV1_\(\s*vitesse\s*\)/);
}

// --- 2. Augmentation : mêmes boutons de préréglage que Basic Training (Energy Cap: Cap/1/2/1/4, Idle: 1/2/1/4). ---
{
  assert.match(meta, /function presetAugmentIdleV1_\(source,fraction\)\{/, "presetAugmentIdleV1_ introuvable");
  const debut = meta.indexOf("function presetAugmentIdleV1_(source,fraction){");
  const fin = meta.indexOf("window.__presetAugmentIdleV1__=presetAugmentIdleV1_;", debut);
  const helper = meta.slice(debut, fin);
  assert.match(helper, /j&&j\.energieMax/, "\"cap\" doit partir du plafond total d'énergie, comme Basic Training");
  assert.match(helper, /j&&j\.energie\)/, "\"idle\" doit partir de l'énergie idle libre, comme Basic Training");

  assert.ok(
    meta.includes("Energy Cap</span><button type=\"button\" onclick=\"window.__presetAugmentIdleV1__(\\'cap\\',1)\">Cap</button><button type=\"button\" onclick=\"window.__presetAugmentIdleV1__(\\'cap\\',.5)\">1/2</button><button type=\"button\" onclick=\"window.__presetAugmentIdleV1__(\\'cap\\',.25)\">1/4</button>"),
    "rangée Energy Cap: Cap/1/2/1/4"
  );
  assert.ok(
    meta.includes("Idle</span><button type=\"button\" onclick=\"window.__presetAugmentIdleV1__(\\'idle\\',.5)\">1/2</button><button type=\"button\" onclick=\"window.__presetAugmentIdleV1__(\\'idle\\',.25)\">1/4</button>"),
    "rangée Idle: 1/2/1/4"
  );

  // Même classe de bouton que Basic Training (taille identique, pas une redéfinition parallèle).
  assert.match(meta, /class="soreal-idle-bt-actions-v120 compact-v1"[^>]*>'\+\[\['plus','\+'\],\['moins','−'\],\['max','Max'\]\]/, "les boutons +/−/Max d'Augmentation utilisent la même famille de style que Basic Training, en taille compacte (Norman, 2026-09-29 : boutons énormes)");

  // Le chiffre d'énergie allouée gonfle désormais (alloc-pop-v1.js), comme Basic Training.
  assert.match(meta, /<span id="sorealIdleAugAllocV1_'\+window\.__SOREAL_IDLE_META_HOST_V130__\.idleHtml_\(def\.id\)\+'_'\+\(upgrade\?'upgrade':'main'\)\+'" class="soreal-idle-bt-allocation-v120">/, "le chiffre d'énergie allouée doit porter la classe d'animation de Basic Training");
}

// --- 3. Time Machine : garde son visuel .soreal-idle-tm-*, mais devient optimiste + gonflement, comme demandé. ---
{
  assert.match(meta, /function ajusterTimeMachineIdleV1_\(ressource,mode\)\{/);
  const debut = meta.indexOf("function ajusterTimeMachineIdleV1_(ressource,mode){");
  const fin = meta.indexOf("window.__ajusterTimeMachineIdleV1__=ajusterTimeMachineIdleV1_;", debut);
  const handler = meta.slice(debut, fin);
  assert.match(handler, /H\.jouerEffetAudioIdleV199_\(/, "un son doit toujours être joué au clic (2026-09-29 : tmPlus/tmMinus/tmCap, un thème horloge propre, plus les sons Basic Training)");
  assert.match(handler, /s\.state\.allocation\[ressource\]=value/, "mise à jour locale IMMÉDIATE de l'allocation (optimiste), comme ajusterAugmentIdleV1_");
  /*
   * 2026-09-29 (suite, Norman : « j'ai l'impression que la réactivité n'est pas aussi bonne que dans
   * basic training ») : un rendreIdleEtat_ complet à chaque clic a été remplacé par un patch DOM
   * ciblé (le chiffre alloué de la piste + la barre d'Énergie/Magie principale), le même correctif
   * de fond qu'Augmentation/Blood Magic ci-dessous.
   */
  assert.ok(!handler.includes("H.rendreIdleEtat_({ok:true,joueur:j})"), "plus de rendu complet à chaque clic");
  assert.match(handler, /const allocSpan=document\.getElementById\('sorealIdleTmAllocV1_'\+cleAlloc\);/, "patch ciblé du chiffre alloué de CETTE piste");
  assert.match(handler, /if\(typeof H\.rafraichirEnergieEtBoutonsIdleV9_==='function'\)H\.rafraichirEnergieEtBoutonsIdleV9_\(\);/, "la barre d'Énergie/Magie principale est rafraîchie via le même helper que Basic Training");
  // Le visuel .soreal-idle-tm-* n'est pas touché : toujours ses propres classes, jamais celles de Basic Training.
  assert.ok(meta.includes("soreal-idle-tm-piste-v1"), "le visuel Time Machine reste inchangé");

  assert.match(meta, /<b id="sorealIdleTmAllocV1_'\+cle\+'" data-idle-alloc-pop-v1>/, "le chiffre de ressource allouée doit porter le crochet d'animation, sans changer sa classe CSS visuelle");
}

// --- 4. alloc-pop-v1.js : étendu pour couvrir Time Machine sans toucher au style d'aucun écran existant. ---
{
  assert.match(allocPop, /querySelectorAll\('\.soreal-idle-bt-allocation-v120,\[data-idle-alloc-pop-v1\]'\)/, "doit désormais surveiller aussi le crochet neutre [data-idle-alloc-pop-v1]");
  assert.match(allocPop, /soreal-idle-tm-boutons-v1 button/, "les clics sur les boutons Time Machine doivent aussi armer la fenêtre de gonflement");
  // Documenté : le crochet est un attribut, jamais une classe CSS, pour ne porter AUCUNE règle visuelle.
  assert.ok(!/\[data-idle-alloc-pop-v1\]\s*\{/.test(readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8")), "le nouveau crochet ne doit porter aucune règle CSS visuelle propre");
}

// --- 5. Blood Magic : l'ancien sélecteur 0/25/50/100% (non opérationnel) est parti, remplacé par le schéma Input + Cap/1/2/1/4 + Idle. ---
{
  assert.ok(!meta.includes("allocationMetaIdleV48_(j,'bloodMagic'"), "l'ancien helper générique ne doit plus être appelé pour Blood Magic");
  assert.ok(!/function allocationMetaIdleV48_/.test(meta), "l'ancien helper, devenu mort, doit être retiré plutôt que laissé inerte");

  assert.match(meta, /function ajusterBloodMagicIdleV1_\(mode\)\{/);
  assert.match(meta, /function viderBloodMagicIdleV1_\(\)\{/);
  assert.match(meta, /function presetBloodMagicIdleV1_\(source,fraction\)\{/);
  assert.match(meta, /function ajusterRituelBloodMagicIdleV1_\(ritualId,mode\)\{/, "boutons Cap/+/- par rituel (demande explicite de Norman)");

  assert.ok(
    meta.includes("Magic Cap</span><button type=\"button\" onclick=\"window.__presetBloodMagicIdleV1__(\\'cap\\',1)\">Cap</button>"),
    "rangée Magic Cap: Cap/1/2/1/4"
  );
  assert.ok(
    meta.includes("<span>Idle</span><button type=\"button\" onclick=\"window.__presetBloodMagicIdleV1__(\\'idle\\',.5)\">1/2</button><button type=\"button\" onclick=\"window.__presetBloodMagicIdleV1__(\\'idle\\',.25)\">1/4</button><button type=\"button\" class=\"clear\" onclick=\"window.__viderBloodMagicIdleV1__()\">Tout retirer</button>"),
    "rangée Idle: 1/2/1/4/Tout retirer"
  );
  assert.ok(
    meta.includes("ajusterRituelBloodMagicIdleV1__(\\''+idHtml+'\\',\\'plus\\')"),
    "chaque rituel doit avoir son propre bouton +"
  );
}

// --- 6. Blood Magic : câblage optimiste réel (mutation locale + patch DOM ciblé AVANT le réseau), comme les autres écrans corrigés. ---
{
  const debut = meta.indexOf("function ajusterBloodMagicIdleV1_(mode){");
  const fin = meta.indexOf("window.__ajusterBloodMagicIdleV1__=ajusterBloodMagicIdleV1_;", debut);
  const handler = meta.slice(debut, fin);
  assert.match(handler, /s\.state\.allocation\.magic=value/);
  assert.match(handler, /ressourceMagie\.current=Math\.max\(0,idleAvant-delta\)/, "la Magic libre doit être décrémentée localement, comme l'énergie de Basic Training");
  // 2026-09-29 (suite) : même correctif de réactivité qu'Augmentation/Time Machine -- patch ciblé, plus de rendu complet.
  assert.ok(!handler.includes("H.rendreIdleEtat_({ok:true,joueur:j})"), "plus de rendu complet à chaque clic");
  assert.match(handler, /rafraichirAllocationBloodMagicIdleV1_\(value\);/, "patch ciblé du chiffre alloué + de la barre principale");
  assert.match(handler, /window\.__actionMetaV47__\(\{action:'allocate',system:'bloodMagic',resource:'magic',value:value\}\)/);

  const debutPatch = meta.indexOf("function rafraichirAllocationBloodMagicIdleV1_(value){");
  const finPatch = meta.indexOf("function ajusterBloodMagicIdleV1_(mode){", debutPatch);
  const patch = meta.slice(debutPatch, finPatch);
  assert.match(patch, /document\.getElementById\('sorealIdleBloodAllocV1'\)/);
  assert.match(patch, /if\(typeof H\.rafraichirEnergieEtBoutonsIdleV9_==='function'\)H\.rafraichirEnergieEtBoutonsIdleV9_\(\);/);
}

// --- 7. Blood Magic : le rituel actif a désormais une vraie durée avant complétion (côté serveur, formule d'advanceBloodMagic). ---
{
  const ctx = { bosses: 40 };
  let s = normalizeIdleNguState({}, ctx, 1000);
  s.systems.bloodMagic.unlocked = true;
  s.resources.magic.cap = 100000;
  s.resources.magic.current = 50000;

  // Aucune Magic allouée -> pas d'ETA inventée.
  let snap = idleNguSnapshot(s, ctx, 1000);
  assert.equal(snap.bloodMagicView.activeRitual, "tack", "premier rituel par défaut");
  assert.equal(snap.bloodMagicView.etaSeconds, null, "aucune Magic allouée -> aucune ETA");

  // 1000 Magic, 1 Magic Power -> exactement la référence du wiki pour le rituel 1 (2 000 s).
  s = applyIdleNguAction(s, { action: "allocate", system: "bloodMagic", resource: "magic", value: 1000 }, ctx, 2000).state;
  snap = idleNguSnapshot(s, ctx, 2000);
  assert.equal(snap.bloodMagicView.secondsPerCompletion, 2000, "wiki : « 1000 magic, 1 magic power » -> 2 000 s pour Poke Yourself with a Tack");
  assert.equal(snap.bloodMagicView.etaSeconds, 2000, "aucune progression accumulée -> ETA = durée complète");

  // Verrouillé (Magic non débloquée) -> pas de vue (anti-spoil, même principe que timeMachineView).
  const verrou = normalizeIdleNguState({}, { bosses: 0 }, 0);
  assert.equal(idleNguSnapshot(verrou, { bosses: 0 }, 0).bloodMagicView, null);
}

console.log("idle-meta-progression-basic-training-parity-v1: OK");
