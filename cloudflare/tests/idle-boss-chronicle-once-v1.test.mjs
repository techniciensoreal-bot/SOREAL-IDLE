import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « les chroniques de boss soient lues par le narrateur 1 seule fois, à la toute
 * première rencontre. Ensuite elle ne doit plus être rejouée à moins qu'on décide de la rejouer. Après un
 * Rebirth, elle ne doit plus être jouée. Attention que la chronique du boss ne doit pas se lancer tant que
 * le tutoriel est affiché. Il ne faut pas que 2 audios soient joués en même temps. »
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 0. Pont de LECTURE server-side (symétrique au pont d'écriture __soreal_idle_marquer_vu_v1__ déjà exposé) : sans lui, tutorial-tts-v202.js
//    ne peut jamais savoir qu'un identifiant "vu" a déjà été confirmé par le serveur (donc sur un autre appareil).
assert.match(
  ui,
  /window\.__soreal_idle_vu_connu_v1__=function\(id\)\{return idleVuConnuV1_\(idleEtat,id\);\};/,
  "le pont de lecture doit exposer idleVuConnuV1_ (mémoire + profil.stats.vus serveur), jamais un second calcul"
);

// 1. Le panneau porte un identifiant stable de boss, posé côté serveur/UI (jamais le texte, qui peut se répéter).
assert.match(
  ui,
  /data-soreal-chronique-boss-id="\$\{idleEntier_\(j&&j\.bossId\|\|0\)\}"/,
  "Le panneau de chronique doit exposer l'identifiant stable du boss courant."
);

// 2. Comportement réel : exécute les fonctions pures (mémoire localStorage + priorité tutoriel) hors navigateur.
{
  const constantes = tts.slice(
    tts.indexOf("var CHRONICLE_PANEL_ID="),
    tts.indexOf("var voiceManifest=null;")
  );
  const fonctions = tts.slice(
    tts.indexOf("function chroniqueBossId_(panel){"),
    tts.indexOf("function buttonHost_(panel){")
  );
  assert.ok(constantes.includes("CHRONICLE_PANEL_ID"), "ancre de découpe des constantes valide");
  assert.ok(fonctions.includes("function activePanel_(){"), "ancre de découpe des fonctions valide");

  const storage = {};
  const fakeLocalStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); }
  };

  function fabriquerDom(nodes) {
    return {
      getElementById: (id) => nodes[id] || null,
      querySelector: () => null
    };
  }
  function panel(id, attrs) {
    return { getAttribute: (name) => (attrs && attrs[name] != null ? String(attrs[name]) : null) };
  }

  const fabrique = new Function(
    "localStorage", "document",
    constantes + "\n" + fonctions + "\nreturn {activePanel_, marquerChroniqueLue_, chroniqueDejaLue_, panneauChroniqueBoss_};"
  );

  // 2a. Boss jamais entendu : le panneau est retenu comme candidat.
  {
    const doc = fabriquerDom({ sorealIdleBossChroniqueV206: panel("sorealIdleBossChroniqueV206", { "data-soreal-chronique-boss-id": "7" }) });
    const api = fabrique(fakeLocalStorage, doc);
    assert.equal(api.activePanel_(), doc.getElementById("sorealIdleBossChroniqueV206"), "première rencontre : le panneau est un candidat de narration automatique");
  }

  // 2b. Une fois marqué lu, le même boss n'est plus jamais un candidat -- y compris dans une instance FRAÎCHE du module (simule un rechargement de page / un Rebirth, qui ne touche jamais le localStorage réel).
  {
    const doc = fabriquerDom({ sorealIdleBossChroniqueV206: panel("sorealIdleBossChroniqueV206", { "data-soreal-chronique-boss-id": "7" }) });
    let api = fabrique(fakeLocalStorage, doc);
    api.marquerChroniqueLue_("7");
    assert.equal(api.activePanel_(), null, "déjà entendu : plus de narration automatique dans la même instance");

    api = fabrique(fakeLocalStorage, doc); // nouvelle instance, même localStorage
    assert.equal(api.chroniqueDejaLue_("7"), true, "la mémoire survit au rechargement du module (donc à un Rebirth, qui ne touche jamais le localStorage)");
    assert.equal(api.activePanel_(), null, "toujours aucune narration automatique après un rechargement");
  }

  // 2c. Un AUTRE boss (jamais entendu) reste un candidat, même après qu'un boss précédent a été marqué lu.
  {
    const doc = fabriquerDom({ sorealIdleBossChroniqueV206: panel("sorealIdleBossChroniqueV206", { "data-soreal-chronique-boss-id": "8" }) });
    const api = fabrique(fakeLocalStorage, doc); // storage partagé, "7" déjà marqué par le bloc précédent
    assert.equal(api.activePanel_(), doc.getElementById("sorealIdleBossChroniqueV206"), "un nouveau boss reste candidat malgré la mémoire d'un autre boss");
  }

  // 2d. Un popup de tutoriel présent passe TOUJOURS avant la chronique de boss (jamais 2 audios en même temps).
  {
    const tuto = { id: "sorealIdleTutorielFlottantV1" };
    const doc = fabriquerDom({
      sorealIdleTutorielFlottantV1: tuto,
      sorealIdleBossChroniqueV206: panel("sorealIdleBossChroniqueV206", { "data-soreal-chronique-boss-id": "9" })
    });
    const api = fabrique(fakeLocalStorage, doc);
    assert.equal(api.activePanel_(), tuto, "le tutoriel affiché passe avant la chronique de boss, jamais entendue pour l'instant");
  }

  // 2e. Panneau sans identifiant (rendu halluciné/ancien) : jamais choisi, jamais marqué (pas de clé vide en mémoire).
  {
    const doc = fabriquerDom({ sorealIdleBossChroniqueV206: panel("sorealIdleBossChroniqueV206", {}) });
    const api = fabrique(fakeLocalStorage, doc);
    assert.equal(api.activePanel_(), null, "un panneau sans identifiant de boss n'est jamais un candidat automatique");
  }
}

// 3. Intégration avec narrate_ : l'identifiant est capturé AVANT toute attente asynchrone (le boss courant peut changer pendant une longue
//    lecture), et marqué "lu" DÈS LE DÉMARRAGE de la narration -- pas seulement si elle va au bout.
//
//    Correctif 2026-09-27 (Norman, après un Rebirth : « il me relit le texte du premier boss... jamais 2 fois ») : l'ancien
//    comportement (marqué "lu" uniquement à la fin d'une lecture réussie) faisait qu'une narration interrompue en cours de route
//    (bouton Arrêter, changement de panneau, navigation ailleurs) ne posait jamais le flag -- donc rejouait tout depuis le début à
//    la prochaine occasion, un Rebirth ramenant justement le joueur devant le boss 1. « À la première rencontre » = dès que la
//    lecture démarre, jamais seulement si elle finit.
{
  const narrate = tts.slice(tts.indexOf("function narrate_("), tts.indexOf("function readVisible_("));
  assert.match(
    narrate,
    /var chroniqueBossIdEnCours=String\(targetId\|\|''\)===CHRONICLE_PANEL_ID\?chroniqueBossId_\(target\):'';\s*\n\s*if\(chroniqueBossIdEnCours\)marquerChroniqueLue_\(chroniqueBossIdEnCours\);/,
    "l'identifiant du boss doit être capturé ET marqué lu au tout début de narrate_, avant toute étape asynchrone"
  );
  const succes = narrate.slice(narrate.indexOf("task.then(function(){"), narrate.indexOf("}).catch(function(error){"));
  assert.ok(!succes.includes("marquerChroniqueLue_("), "plus besoin de remarquer à la fin : déjà fait au démarrage");
  const echec = narrate.slice(narrate.indexOf("}).catch(function(error){"));
  assert.ok(!echec.includes("marquerChroniqueLue_("), "jamais un second marquage dans la branche d'erreur/annulation non plus");
}

/*
 * 3bis. Norman (2026-09-30) : « Quand je joue sur le PC et qu'ensuite je joue sur le téléphone, il
 * me relit certains textes de boss. Pas les premiers, mais les derniers que j'ai tué. » La mémoire
 * localStorage seule ne survit jamais à un changement d'appareil : chroniqueDejaLue_/
 * marquerChroniqueLue_ doivent aussi consulter/alimenter le pont "vu" server-side
 * (window.__soreal_idle_vu_connu_v1__/__soreal_idle_marquer_vu_v1__), préfixé "chronique:" pour
 * ne jamais entrer en collision avec les autres familles d'identifiants "vus" (menu:, tuto:...).
 */
{
  const constantes = tts.slice(
    tts.indexOf("var CHRONICLE_PANEL_ID="),
    tts.indexOf("var voiceManifest=null;")
  );
  const fonctions = tts.slice(
    tts.indexOf("function chroniqueBossId_(panel){"),
    tts.indexOf("function buttonHost_(panel){")
  );

  const storage = {};
  const fakeLocalStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); }
  };

  const fabrique = new Function(
    "localStorage", "document", "window",
    constantes + "\n" + fonctions + "\nreturn {marquerChroniqueLue_, chroniqueDejaLue_};"
  );

  // Un autre appareil (pas de localStorage partagé) mais où le serveur connaît déjà l'identifiant "chronique:12" : doit être reconnu comme déjà lu.
  {
    const connus = { "chronique:12": true };
    const window_ = { __soreal_idle_vu_connu_v1__: (id) => Boolean(connus[id]) };
    const api = fabrique(fakeLocalStorage, {}, window_);
    assert.equal(api.chroniqueDejaLue_("12"), true, "le pont serveur doit suffire, même sans mémoire locale pour cet appareil");
  }

  // Marquer une chronique lue doit appeler le pont serveur avec l'id préfixé "chronique:", pas seulement écrire en local.
  {
    const appels = [];
    const window_ = { __soreal_idle_marquer_vu_v1__: (id) => appels.push(id) };
    const api = fabrique(fakeLocalStorage, {}, window_);
    api.marquerChroniqueLue_("13");
    assert.deepEqual(appels, ["chronique:13"], "doit appeler le pont serveur avec l'id préfixé, comme les autres familles \"vus\" (menu:, tuto:...)");
  }

  // Pont serveur absent (module chargé avant soreal-idle-ui.js, ou contexte de test minimal) : jamais un plantage, repli sur le local seul.
  {
    const window_ = {};
    const api = fabrique(fakeLocalStorage, {}, window_);
    assert.equal(api.chroniqueDejaLue_("14"), false, "pont absent -> pas de plantage, juste \"pas encore lu\"");
    api.marquerChroniqueLue_("14"); // ne doit jamais lever d'exception
    assert.equal(api.chroniqueDejaLue_("14"), true, "le repli local doit quand même fonctionner sans le pont serveur");
  }
}

// 4. Le bouton manuel « Lire la chronique » reste, lui, toujours disponible : lireCible_ ne consulte jamais la mémoire "déjà lue".
{
  const lireCible = tts.slice(tts.indexOf("function lireCible_("), tts.indexOf("function scan_("));
  assert.ok(!lireCible.includes("chroniqueDejaLue_") && !lireCible.includes("panneauChroniqueBoss_"), "la lecture manuelle ne doit jamais être bloquée par la mémoire de lecture automatique");
}

console.log("idle-boss-chronicle-once-v1: OK");
