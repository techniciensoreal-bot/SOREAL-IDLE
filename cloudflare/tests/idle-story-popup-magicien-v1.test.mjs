import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Popup d'histoire plein écran « Le Magicien et la Grotte » (2026-09-27) : 5 images/textes
 * synchronisés à la narration, déclenché une seule fois à la mort du boss 17 (bossSelection
 * passe à 18), jamais rejoué (mémoire profil.stats.vus, comme les autres popups « une fois »).
 */
const source = readFileSync("cloudflare/public/modules/story-popup-v1.js", "utf8");

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
      return null;
    },
    set innerHTML(_v) {
      // Le module construit img/texte/bouton via innerHTML puis les relit par querySelector : on les fabrique ici.
      this._img = fabriquerElement();
      this._texte = fabriquerElement();
      this._bouton = fabriquerElement();
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

// setTimeout/clearTimeout factices : horloge manuelle, pilotée par le test (pas d'attente réelle).
function fabriquerHorloge() {
  let id = 1;
  const taches = new Map();
  return {
    setTimeout(fn, ms) { const monId = id++; taches.set(monId, { fn, ms }); return monId; },
    clearTimeout(monId) { taches.delete(monId); },
    /* Déclenche la tâche la plus proche (délai minimal) parmi celles encore en attente. */
    avancer() {
      let meilleur = null;
      for (const [monId, t] of taches) { if (!meilleur || t.ms < meilleur.ms) meilleur = [monId, t]; }
      if (!meilleur) return false;
      taches.delete(meilleur[0]);
      meilleur[1].fn();
      return true;
    },
    enAttente() { return taches.size; }
  };
}

function charger(window, document, horloge) {
  const fabrique = new Function(
    "window", "document", "requestAnimationFrame", "setTimeout", "clearTimeout",
    source + "\nreturn window.__SOREAL_IDLE_STORY_POPUP_V1__;"
  );
  return fabrique(window, document, (fn) => fn(), horloge.setTimeout, horloge.clearTimeout);
}

// 1. dureeApprox : plancher 4 s, plafond 30 s, ~14 caractères/seconde entre les deux.
{
  const window_ = {};
  const document_ = fabriquerDocument();
  const api = charger(window_, document_, fabriquerHorloge());
  assert.equal(api.dureeApprox(""), 4000, "texte vide -> plancher");
  assert.equal(api.dureeApprox("x".repeat(10)), 4000, "texte très court -> plancher");
  assert.equal(api.dureeApprox("x".repeat(1400)), 30000, "texte très long -> plafond");
  const milieu = api.dureeApprox("x".repeat(140));
  assert.ok(milieu > 4000 && milieu < 30000, "texte de longueur moyenne -> entre plancher et plafond");
}

// 2. urlImage : id et index encodés, dans l'ordre attendu par le Worker (idle-media-v1.js).
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.urlImage(1), "/api/idle/media/story?id=MagicienEtLaGrotte&index=1");
  assert.equal(api.urlImage(5), "/api/idle/media/story?id=MagicienEtLaGrotte&index=5");
}

// 3. Les 5 étapes exposées correspondent au texte fourni par Norman (aucune troncature/altération).
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  const etapes = api.etapes();
  assert.equal(etapes.length, 5, "5 images/textes, pas plus, pas moins");
  assert.match(etapes[0].texte, /mystérieuse hutte/);
  assert.match(etapes[1].texte, /grotte brumeuse/);
  assert.match(etapes[2].texte, /M\. Jensen/);
  assert.match(etapes[3].texte, /refroidi par son avertissement/);
  assert.match(etapes[4].texte, /et c'est là que tu le vois\.$/);
}

// 4. dejaVu : lit profil.stats.vus, jamais un crash si le champ est absent/mal formé.
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.dejaVu({ profil: { stats: { vus: ["histoire:magicienEtLaGrotte"] } } }), true);
  assert.equal(api.dejaVu({ profil: { stats: { vus: [] } } }), false);
  assert.equal(api.dejaVu({}), false, "état incomplet -> jamais vu (pas de crash)");
  assert.equal(api.dejaVu(null), false);
}

// 5. considerer : ne se déclenche QUE sur bossSelection===18 et jamais vu ; idempotent (un seul montage).
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  // Pas encore au boss 18 : rien ne se passe.
  api.considerer({ bossSelection: 17, profil: { stats: { vus: [] } } });
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "boss 17 : pas de déclenchement");
  assert.equal(document_.body.children.length, 0, "aucun popup monté avant le boss 18");

  // Boss 18, jamais vu : déclenche, monte le popup, mais NE marque PAS vu tout de suite (Norman, 2026-09-27 :
  // un abandon en cours de route ne doit jamais être considéré comme vu).
  api.considerer({ bossSelection: 18, profil: { stats: { vus: [] } } });
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "pas encore marqué vu : la scène vient juste de commencer");
  assert.equal(document_.body.children.length, 1, "le popup est monté dans document.body");

  // Rappels suivants (nouveaux polls d'état pendant que le popup tourne) : jamais un second déclenchement.
  api.considerer({ bossSelection: 18, profil: { stats: { vus: [] } } });
  api.considerer({ bossSelection: 18, profil: { stats: { vus: ["histoire:magicienEtLaGrotte"] } } });
  assert.equal(document_.body.children.length, 1, "jamais un second popup monté");

  // La scène se déroule jusqu'au bout (5 étapes, sans TTS ici -> plancher de durée) : marqué vu SEULEMENT à la fin.
  while (horloge.avancer()) {}
  assert.deepEqual(window_.__soreal_idle_marquer_vu_v1__appels, ["histoire:magicienEtLaGrotte"], "marqué vu une seule fois, seulement à la fin réelle de la scène");
}

// 6. considerer : un compte où l'histoire est déjà marquée vue (rechargement après un Rebirth, un autre appareil) ne rejoue jamais rien.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const api = charger(window_, document_, fabriquerHorloge());

  api.considerer({ bossSelection: 18, profil: { stats: { vus: ["histoire:magicienEtLaGrotte"] } } });
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "déjà vu -> aucun déclenchement");
  assert.equal(document_.body.children.length, 0, "aucun popup monté");
}

// 7. Quitter en plein milieu (le jeu s'arrête, plus aucun timer n'avance jamais) : jamais marqué vu -> sera rejoué depuis le début.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  api.considerer({ bossSelection: 18, profil: { stats: { vus: [] } } });
  // Seulement les deux premières étapes jouées, puis abandon (fermeture de l'app) : aucun "vu" n'a jamais été envoyé.
  horloge.avancer();
  horloge.avancer();
  assert.equal(window_.__soreal_idle_marquer_vu_v1__appels.length, 0, "scène abandonnée en cours de route -> jamais marquée vue");
}

// 8. Cliquer sur « Passer » termine la scène (comme la voir jusqu'au bout) : marqué vu.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  api.considerer({ bossSelection: 18, profil: { stats: { vus: [] } } });
  const overlay = document_.body.children[0];
  const bouton = overlay.querySelector(".soreal-idle-histoire-passer-v1");
  bouton.listeners.click[0]();
  assert.deepEqual(window_.__soreal_idle_marquer_vu_v1__appels, ["histoire:magicienEtLaGrotte"], "Passer = fin volontaire -> marqué vu");
}

// 9. rejouer() (Norman, 2026-09-27 : « je dois vérifier que c'est bien réglé ») : force le montage de la scène
//    sans dépendre du boss courant ni du flag "vu", et sans jamais monter deux fois en même temps.
{
  const window_ = { __soreal_idle_marquer_vu_v1__appels: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.__soreal_idle_marquer_vu_v1__appels.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);

  api.rejouer();
  assert.equal(document_.body.children.length, 1, "rejouer() monte la scène même sans avoir jamais atteint le boss 18");
  api.rejouer();
  assert.equal(document_.body.children.length, 1, "un second appel pendant que la scène tourne ne monte jamais un second popup");

  while (horloge.avancer()) {}
  assert.deepEqual(window_.__soreal_idle_marquer_vu_v1__appels, ["histoire:magicienEtLaGrotte"], "rejouer() marque vu comme une vraie lecture complète");

  // Une fois terminée, rejouer() doit pouvoir remonter la scène (vérification répétée par l'administrateur).
  api.rejouer();
  assert.equal(document_.body.children.length, 2, "rejouer() peut remonter la scène une fois la précédente terminée");
}

// 10. Bouton Paramètres (administrateur seulement) pour vérifier la scène sans devoir y rejouer.
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  const debut = ui.indexOf("function pageParametresIdleV28_(j){");
  const fin = ui.indexOf("\n      }\n\n      /* Interrupteur d'accès à SOREAL IDLE", debut);
  assert.ok(debut > 0 && fin > debut, "pageParametresIdleV28_ introuvable");
  const page = ui.slice(debut, fin);
  const iBloc = page.indexOf("(estAdminSorealIdle_()");
  assert.ok(iBloc > 0, "le bloc « Outils de test » doit être gardé par estAdminSorealIdle_()");
  const bloc = page.slice(iBloc, page.indexOf("__SOREAL_IDLE_STORY_POPUP_V1__.rejouer()", iBloc) + 60);
  assert.match(bloc, /window\.__SOREAL_IDLE_STORY_POPUP_V1__&&window\.__SOREAL_IDLE_STORY_POPUP_V1__\.rejouer\(\)/, "le bouton doit appeler rejouer() sur le module d'histoire");
}

console.log("idle-story-popup-magicien-v1: OK");
