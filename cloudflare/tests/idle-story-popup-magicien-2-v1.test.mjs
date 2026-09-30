import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Popup d'histoire plein écran « Le Magicien et la Grotte 2 » (2026-09-29) : 10 images/textes
 * synchronisés à la narration, déclenchés une seule fois à la mort du boss de zone Aventure
 * « A Fifth Giant Mole » (zone Cave), jamais rejoués (mémoire profil.stats.vus, comme la première
 * histoire). Contrairement à la première histoire (bossSelection, un état persistant sondé à
 * chaque rendu), ce déclencheur est un évènement éphémère de combat Aventure : considerer() prend
 * ici (mobName, estBoss, j) au lieu de (j), voir soreal-idle-ui.js/terminerCombatAdventureLocalV2_.
 */
const source = readFileSync("cloudflare/public/modules/story-popup-2-v1.js", "utf8");

function fabriquerElement() {
  const el = {
    style: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    children: [],
    listeners: {},
    appendChild(child) { this.children.push(child); return child; },
    addEventListener(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); },
    querySelector(sel) {
      if (sel === "img") return this._img;
      if (sel === ".soreal-idle-histoire-texte-v1") return this._texte;
      if (sel === ".soreal-idle-histoire-passer-v1") return this._bouton;
      if (sel === ".soreal-idle-histoire-chargement-v1") return this._chargement;
      return null;
    },
    set innerHTML(_v) {
      this._img = fabriquerElement();
      this._texte = fabriquerElement();
      this._bouton = fabriquerElement();
      this._chargement = fabriquerElement();
    },
    set src(v) { this._src = v; this._srcHistorique = this._srcHistorique || []; this._srcHistorique.push(v); if (typeof this.onload === "function") this.onload(); },
    get src() { return this._src; },
    set textContent(v) { this._texte_content = v; }
  };
  return el;
}

function fabriquerDocument() {
  const head = fabriquerElement();
  const body = fabriquerElement();
  const parIdV = {};
  return {
    head, body,
    getElementById(id) { return parIdV[id] || null; },
    createElement() {
      const el = fabriquerElement();
      return el;
    },
    _enregistrer(id, el) { parIdV[id] = el; }
  };
}

function fabriquerHorloge() {
  let id = 1;
  const taches = new Map();
  return {
    setTimeout(fn, ms) { const monId = id++; taches.set(monId, { fn, ms }); return monId; },
    clearTimeout(monId) { taches.delete(monId); },
    avancer() {
      let meilleur = null;
      for (const [monId, t] of taches) { if (!meilleur || t.ms < meilleur.ms) meilleur = [monId, t]; }
      if (!meilleur) return false;
      taches.delete(meilleur[0]);
      meilleur[1].fn();
      return true;
    },
    enAttente() { return taches.size; },
    delaisEnAttente() { return [...taches.values()].map((t) => t.ms); }
  };
}

function charger(window, document, horloge) {
  const fabrique = new Function(
    "window", "document", "requestAnimationFrame", "setTimeout", "clearTimeout",
    source + "\nreturn window.__SOREAL_IDLE_STORY_POPUP_2_V1__;"
  );
  return fabrique(window, document, (fn) => fn(), horloge.setTimeout, horloge.clearTimeout);
}

const MOB = "A Fifth Giant Mole";

// 1. dureeApprox : plancher 4 s, plafond 30 s, ~14 caractères/seconde entre les deux (même rythme que la première histoire).
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.dureeApprox(""), 4000, "texte vide -> plancher");
  assert.equal(api.dureeApprox("x".repeat(10)), 4000, "texte très court -> plancher");
  assert.equal(api.dureeApprox("x".repeat(1400)), 30000, "texte très long -> plafond");
  const milieu = api.dureeApprox("x".repeat(140));
  assert.ok(milieu > 4000 && milieu < 30000, "texte de longueur moyenne -> entre plancher et plafond");
}

// 2. urlImage : id et index encodés, dans l'ordre attendu par le Worker (idle-media-v1.js).
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.urlImage(1), "/api/idle/media/story?id=MagicienEtLeGrotte2&index=1");
  assert.equal(api.urlImage(10), "/api/idle/media/story?id=MagicienEtLeGrotte2&index=10");
}

// 3. Les 10 étapes exposées correspondent au texte fourni par Norman (aucune troncature/altération, image 5 non dupliquée).
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  const etapes = api.etapes();
  assert.equal(etapes.length, 10, "10 images/textes, pas plus, pas moins");
  assert.match(etapes[0].texte, /grommelant/);
  assert.match(etapes[1].texte, /WHOUMPF/);
  assert.match(etapes[2].texte, /Gorgone/);
  /* Norman (2026-09-30) : « ça passe trop vite à l'image 5 » -- le passage du chaudron (Stupéfait… te fait signe d'approcher) reste affiché pendant l'image 4 (le sorcier verse la cannette) ; l'image 5 (la gorgée) ne commence qu'à « Bon, je peux pas résoudre… ». */
  assert.match(etapes[3].texte, /à court de cette came\. Stupéfait, tu le vois verser la cannette dans son chaudron/, "image 4 : le sorcier applaudit PUIS verse la cannette");
  assert.match(etapes[3].texte, /puis te fait signe d'approcher\.$/, "image 4 se termine au signe d'approcher");
  assert.ok(!etapes[4].texte.includes("Stupéfait") && !etapes[4].texte.includes("chaudron"), "image 5 ne répète pas le passage du chaudron");
  assert.match(etapes[4].texte, /^« Bon, je peux pas résoudre tes problèmes de mémoire/, "image 5 commence à la réplique du sorcier");
  assert.match(etapes[4].texte, /prends une gorgée\.$/);
  assert.match(etapes[5].texte, /sirop contre la toux/);
  assert.match(etapes[6].texte, /tu ne sais pas voler/);
  assert.match(etapes[7].texte, /mémoire en vrac/);
  assert.match(etapes[8].texte, /flou jaune\.$/);
  assert.match(etapes[9].texte, /une queue filer devant toi/);
}

// 4. dejaVu : lit profil.stats.vus, jamais un crash si le champ est absent/mal formé.
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.dejaVu({ profil: { stats: { vus: ["histoire:magicienEtLaGrotte2"] } } }), true);
  assert.equal(api.dejaVu({ profil: { stats: { vus: [] } } }), false);
  assert.equal(api.dejaVu({}), false, "état incomplet -> jamais vu (pas de crash)");
  assert.equal(api.dejaVu(null), false);
}

// 5. mobDeclencheur : nom exact du mob NGU qui déclenche la scène (bestiaire zone Cave, idle-adventure-v47.js).
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.mobDeclencheur(), MOB);
}

// 6. considerer : ne se déclenche QUE sur le bon mob ET un boss de zone ET jamais vu ; idempotent (un seul montage).
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  // Mauvais mob : rien ne se passe, même si c'est un boss de zone.
  api.considerer("Mega-Rat", true, { profil: { stats: { vus: [] } } });
  assert.equal(document_.body.children.length, 0, "mauvais mob : pas de déclenchement");

  // Bon mob mais pas un boss (mob normal de la zone) : rien ne se passe.
  api.considerer(MOB, false, { profil: { stats: { vus: [] } } });
  assert.equal(document_.body.children.length, 0, "bon nom mais pas un boss de zone : pas de déclenchement");

  // Bon mob, boss de zone, jamais vu : déclenche, monte le popup, mais NE marque PAS vu tout de suite.
  api.considerer(MOB, true, { profil: { stats: { vus: [] } } });
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "pas encore marqué vu : la scène vient juste de commencer");
  assert.equal(document_.body.children.length, 1, "le popup est monté dans document.body");

  // Rappels suivants (nouveaux combats gagnés pendant que le popup tourne) : jamais un second déclenchement.
  api.considerer(MOB, true, { profil: { stats: { vus: [] } } });
  api.considerer(MOB, true, { profil: { stats: { vus: ["histoire:magicienEtLaGrotte2"] } } });
  assert.equal(document_.body.children.length, 1, "jamais un second popup monté");

  // La scène se déroule jusqu'au bout (10 étapes, sans TTS ici -> plancher de durée) : marqué vu SEULEMENT à la fin.
  while (horloge.avancer()) {}
  assert.deepEqual(window_.__soreal_idle_marquer_vu_v1__appels, ["histoire:magicienEtLaGrotte2"], "marqué vu une seule fois, seulement à la fin réelle de la scène");
}

// 7. considerer : un compte où l'histoire est déjà marquée vue ne rejoue jamais rien, même en battant à nouveau le même boss de zone.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const api = charger(window_, document_, fabriquerHorloge());

  api.considerer(MOB, true, { profil: { stats: { vus: ["histoire:magicienEtLaGrotte2"] } } });
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "déjà vu -> aucun déclenchement");
  assert.equal(document_.body.children.length, 0, "aucun popup monté");
}

// 8. Quitter en plein milieu : jamais marqué vu -> sera rejoué depuis le début au prochain combat gagné contre ce boss.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  api.considerer(MOB, true, { profil: { stats: { vus: [] } } });
  horloge.avancer();
  horloge.avancer();
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "scène abandonnée en cours de route -> jamais marquée vue");
}

// 9. Cliquer sur « Passer » termine la scène (comme la voir jusqu'au bout) : marqué vu.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  api.considerer(MOB, true, { profil: { stats: { vus: [] } } });
  const overlay = document_.body.children[0];
  const bouton = overlay.querySelector(".soreal-idle-histoire-passer-v1");
  bouton.listeners.click[0]();
  assert.deepEqual(window_.__soreal_idle_marquer_vu_v1__appels, ["histoire:magicienEtLaGrotte2"], "Passer = fin volontaire -> marqué vu");
}

// 10. rejouer() : force le montage de la scène sans dépendre d'un combat en cours ni du flag "vu", jamais deux fois en même temps.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  api.rejouer();
  assert.equal(document_.body.children.length, 1, "rejouer() monte la scène même sans jamais avoir battu le boss de zone");
  api.rejouer();
  assert.equal(document_.body.children.length, 1, "un second appel pendant que la scène tourne ne monte jamais un second popup");

  while (horloge.avancer()) {}
  assert.deepEqual(window_.__soreal_idle_marquer_vu_v1__appels, ["histoire:magicienEtLaGrotte2"], "rejouer() marque vu comme une vraie lecture complète");

  api.rejouer();
  assert.equal(document_.body.children.length, 2, "rejouer() peut remonter la scène une fois la précédente terminée");
}

// 11. Bouton Paramètres (administrateur seulement) pour vérifier la scène sans devoir y rejouer.
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  const debut = ui.indexOf("function pageParametresIdleV28_(j){");
  const fin = ui.indexOf("\n      }\n\n      /* Interrupteur d'accès à SOREAL IDLE", debut);
  assert.ok(debut > 0 && fin > debut, "pageParametresIdleV28_ introuvable");
  const page = ui.slice(debut, fin);
  const iBloc = page.indexOf("(estAdminSorealIdle_()");
  assert.ok(iBloc > 0, "le bloc « Outils de test » doit être gardé par estAdminSorealIdle_()");
  const bloc = page.slice(iBloc, page.indexOf("__SOREAL_IDLE_STORY_POPUP_2_V1__.rejouer()", iBloc) + 60);
  assert.match(bloc, /window\.__SOREAL_IDLE_STORY_POPUP_2_V1__&&window\.__SOREAL_IDLE_STORY_POPUP_2_V1__\.rejouer\(\)/, "le bouton doit appeler rejouer() sur le module de la deuxième histoire");
}

// 12. Déclenchement câblé depuis terminerCombatAdventureLocalV2_ (victoire contre un boss de zone), jamais un sondage à chaque rendu.
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  const debut = ui.indexOf("function terminerCombatAdventureLocalV2_(fight,victoire){");
  const fin = ui.indexOf("function progresserZoneFightLocalIdleV1_(", debut);
  assert.ok(debut > 0 && fin > debut, "terminerCombatAdventureLocalV2_ introuvable");
  const fonction = ui.slice(debut, fin);
  assert.match(
    fonction,
    /if\(window\.__SOREAL_IDLE_STORY_POPUP_2_V1__&&typeof window\.__SOREAL_IDLE_STORY_POPUP_2_V1__\.considerer==='function'\)\{\s*window\.__SOREAL_IDLE_STORY_POPUP_2_V1__\.considerer\(fight\.mobName,Boolean\(fight\.boss\),idleEtat\);\s*\}/,
    "la victoire d'un combat Aventure doit tenter le déclenchement de la deuxième histoire avec le mob et le statut boss réels"
  );
  // Doit se trouver dans la branche victoire, avant la remise à false de fight.active (les champs doivent encore être valides).
  const iVictoire = fonction.indexOf("if(victoire){");
  const iAppel = fonction.indexOf("__SOREAL_IDLE_STORY_POPUP_2_V1__.considerer(");
  const iActiveFalse = fonction.indexOf("fight.active=false;");
  assert.ok(iVictoire >= 0 && iAppel > iVictoire && iAppel < iActiveFalse, "l'appel doit lire fight.mobName/fight.boss avant qu'ils ne soient remis à zéro");
}

// 13. Chargé dans index.html, après story-popup-v1.js (même ordre que le reste de la chaîne), avant le jeu.
{
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  assert.match(index, /<script defer src="\/modules\/story-popup-2-v1\.js\?v=\d+"><\/script>/);
  assert.ok(index.indexOf("story-popup-2-v1.js") < index.indexOf("/soreal-idle-ui.js?v="), "chargé avant le jeu (qui appelle __SOREAL_IDLE_STORY_POPUP_2_V1__ à chaque victoire de combat Aventure)");
}

// 14. Préchargement de l'étape suivante pendant la lecture (même mécanisme anti-lenteur que la première histoire).
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const prechauffeAppels = [];
  window_.__SOREAL_IDLE_TUTORIAL_TTS_V209__ = {
    prechauffer(texte) { prechauffeAppels.push(texte); return true; },
    readText(texte, _audioSrc, onDone) {
      dateNowFictif += 3000;
      onDone();
      return true;
    }
  };
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  let dateNowFictif = Date.now();
  const dateNowOriginal = Date.now;
  Date.now = () => dateNowFictif;
  try {
    api.considerer(MOB, true, { profil: { stats: { vus: [] } } });
    const etapes = api.etapes();
    assert.deepEqual(prechauffeAppels, [etapes[0].texte, etapes[1].texte, etapes[1].texte], "étapes 0 et 1 préchargées au démarrage, étape 1 repréchargée (sans effet, déjà en cache) dès le début de l'étape 0");

    const delais = horloge.delaisEnAttente();
    assert.ok(delais.length > 0 && delais.every((ms) => ms <= 600), "attente courte après une lecture réellement terminée, jamais le plancher complet : " + JSON.stringify(delais));

    while (horloge.avancer()) {}
    for (let i = 2; i < etapes.length; i++) {
      assert.ok(prechauffeAppels.includes(etapes[i].texte), "étape " + i + " doit avoir été préchargée en cours de route");
    }
  } finally {
    Date.now = dateNowOriginal;
  }
}

// 15. Indicateur de chargement pendant l'attente de l'image.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  charger(window_, document_, horloge).considerer(MOB, true, { profil: { stats: { vus: [] } } });
  const overlay = document_.body.children[0];
  const chargement = overlay.querySelector(".soreal-idle-histoire-chargement-v1");
  assert.ok(chargement, "l'indicateur de chargement doit exister dans le popup");
  assert.ok(chargement.classList.contains("soreal-idle-histoire-chargement-visible-v1"), "affiché tant que l'image n'est pas arrivée");
  horloge.avancer();
  assert.ok(!chargement.classList.contains("soreal-idle-histoire-chargement-visible-v1"), "masqué dès que l'image a fini de charger");
}

console.log("idle-story-popup-magicien-2-v1: OK");
