/*
 * SOREAL IDLE (Unity WebGL) : couche audio autonome.
 *
 * Le client Unity tourne dans la même page que ce script. Plutôt que de réécrire les sons en C#, on CHARGE les modules audio du jeu web
 * (servis par le Worker sous /modules/…, mêmes versions ?v= que cloudflare/public/index.html) : on obtient exactement les mêmes sons
 * (synthèse Web Audio), les mêmes musiques, les mêmes voix pré-générées, les mêmes volumes. Unity les pilote par SorealAudio.jslib
 * (C# : Assets/Scripts/Soreal/Audio/Sons.cs, Voix.cs, PrefsCompte.cs du cadre).
 *
 * Ce que ces modules supposent du jeu web, et comment on le fournit ici :
 *  - audio-effects / audio-volume / audio-coffre / audio-borne / ambient-audio / musique-titan / yggdrasil-sons : aucun DOM de jeu ;
 *    audio-effects écoute les clics du jeu web (barre de menus) : inutile ici, c'est Sons.Menu(...) qui joue le son de menu.
 *  - shop-music : lit le menu ouvert dans .soreal-idle-page-root-v28[data-menu] -> un élément caché que SorealAudio.menu() met à jour.
 *  - musique-titan : lit window.__SOREAL_IDLE_TITAN_ECRAN_V1__.actif() -> fourni, piloté par SorealAudio.titan().
 *  - tutorial-tts (narration) : readText / stop / pause ne touchent pas au DOM ; elle utilise des adresses RELATIVES (voice/…, api/…) :
 *    un petit shim de fetch les ramène à la racine du Worker (la page Unity vit dans un sous-dossier).
 *  - Piper (voix neuronale de repli, ~60 Mo) : chargé seulement au premier bloc qui n'a pas de voix pré-générée (importmap dans index.html).
 *  - préférences du compte : PAS de prefs-compte-v1.js ici. C'est PrefsCompte (C#, Pages/Renaissance) qui est la source : il pousse dans le localStorage de cette page les clés dont les modules ont besoin
 *    (volumes, cases, rangs de rotation…) et récupère, par prefsSorties(), celles que les modules écrivent eux-mêmes (rangs de rotation, gains d'ambiance).
 * Non repris (DOM/visuel du jeu web, voir Audio/SONS.md) : orage-v1 (éclairs), bt-lumieres-v1 (néons), story-engine / lecteur-chroniques /
 * admin (fenêtres HTML) : Unity dessine lui-même ces interfaces et n'a besoin que de la voix (Voix.Lire / Voix.Chronique).
 */
(function () {
  'use strict';
  if (window.SorealAudio) return;

  var ORIGINE = location.origin;
  /* Même ordre et mêmes ?v= que cloudflare/public/index.html (à remonter quand le jeu web monte un de ces modules : voir Audio/SONS.md). */
  var MODULES = [
    '/modules/audio-volume-v1.js?v=5',
    '/modules/audio-coffre-v1.js?v=9',
    '/modules/audio-borne-v1.js?v=2',
    '/modules/audio-effects-v199.js?v=254',
    '/modules/yggdrasil-sons-v1.js?v=11',
    '/modules/musique-titan-v1.js?v=1',
    '/modules/ambient-audio-v1.js?v=11',
    '/modules/shop-music-v1.js?v=5',
    '/modules/voix-expressions-v1.js?v=1',
    '/modules/voix-nommees-v1.js?v=2',
    '/modules/tutorial-tts-v202.js?v=249'
  ];
  var PIPER_MODULE = '/modules/local-neural-piper-v1.js?v=14';
  var PIPER_PHONEMIZE = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js';
  var PIPER_PHONEMIZE_SRI = 'sha384-PMufGRTCTqKC0tPjOTp2UFXycN+yWWjDareOeoy106zJZAHPijaeHDAX/4Pi0I5S';

  var diag = {
    modulesCharges: 0, modulesEchoues: [], joues: 0, refus: 0, dernierSon: '', dernierRefus: '',
    musiqueMenu: '', titan: false, ambiance: false, voixLectures: 0, voixDernierTexte: '', voixFin: 0,
    piper: 'non charge', pret: false, journal: []
  };
  function noter(s) { diag.journal.push(s); if (diag.journal.length > 40) diag.journal.shift(); }

  // ---- adresses relatives du module de narration (voice/manifest.json, api/idle/media/voice?h=) -> racine du Worker
  var fetchNatif = window.fetch.bind(window);
  window.fetch = function (u, o) {
    if (typeof u === 'string' && /^(voice\/|api\/)/.test(u)) u = '/' + u;
    return fetchNatif(u, o);
  };

  // ---- suivi des contextes audio créés par les modules (diagnostic : état de chacun)
  var contextes = [];
  (function () {
    var Natif = window.AudioContext || window.webkitAudioContext;
    if (!Natif) return;
    var Suivi = function () { var c = Reflect.construct(Natif, arguments); contextes.push(c); return c; };
    Suivi.prototype = Natif.prototype;
    window.AudioContext = Suivi; window.webkitAudioContext = Suivi;
  })();

  // ---- décor minimal attendu par les modules
  var racineMenu = document.createElement('div');
  racineMenu.className = 'soreal-idle-page-root-v28';
  racineMenu.setAttribute('data-menu', '');
  racineMenu.style.display = 'none';
  (document.body || document.documentElement).appendChild(racineMenu);
  var titanActif = false;
  window.__SOREAL_IDLE_TITAN_ECRAN_V1__ = { actif: function () { return titanActif; } };

  // ---- chargement des modules, dans l'ordre
  function charger(src) {
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = function () { diag.modulesCharges++; res(true); };
      s.onerror = function () { diag.modulesEchoues.push(src); res(false); };
      document.head.appendChild(s);
    });
  }
  var pret = MODULES.reduce(function (p, src) { return p.then(function () { return charger(src); }); }, Promise.resolve())
    .then(function () { diag.pret = true; noter('modules charges'); });

  // ---- stockage : les écritures « soreal_idle_* » faites par les modules sont mises de côté pour PrefsCompte (C#), qui les envoie au compte
  var sorties = {}, nbSorties = 0;
  var natifSet = Storage.prototype.setItem, natifRem = Storage.prototype.removeItem;
  function suivie(k) { return typeof k === 'string' && /^(soreal_idle_|sorealIdle)/.test(k); }
  Storage.prototype.setItem = function (k, v) {
    natifSet.call(this, k, v);
    if (this === window.localStorage && suivie(String(k))) { if (!(k in sorties)) nbSorties++; sorties[k] = String(v); }
  };
  Storage.prototype.removeItem = function (k) {
    natifRem.call(this, k);
    if (this === window.localStorage && suivie(String(k))) { if (!(k in sorties)) nbSorties++; sorties[k] = null; }
  };

  // ---- Piper chargé à la demande : un bloc sans voix pré-générée est le seul cas qui en a besoin
  var piperPromesse = null, piperStub = null;
  function chargerPiper() {
    if (piperPromesse) return piperPromesse;
    diag.piper = 'chargement'; noter('piper: chargement');
    piperPromesse = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = PIPER_PHONEMIZE; s.async = true; s.integrity = PIPER_PHONEMIZE_SRI; s.crossOrigin = 'anonymous';
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error('PIPER_PHONEMIZE_INTROUVABLE')); };
      document.head.appendChild(s);
    }).then(function () { return import(ORIGINE + PIPER_MODULE); })
      .then(function () {
        var reel = window.__SOREAL_IDLE_LOCAL_NEURAL_V1__;
        if (!reel || reel === piperStub) throw new Error('PIPER_MODULE_ABSENT');
        diag.piper = 'pret'; noter('piper: pret');
        return reel;
      })
      .catch(function (e) { diag.piper = 'echec: ' + (e && e.message); piperPromesse = null; throw e; });
    return piperPromesse;
  }
  piperStub = {
    synthesize: function (texte) { return chargerPiper().then(function (reel) { return reel.synthesize(texte); }); },
    preload: function () { return chargerPiper().then(function (reel) { return reel.preload ? reel.preload() : null; }); },
    subscribe: function (fn) {
      var h = function (ev) { try { fn(ev.detail); } catch (e) {} };
      window.addEventListener('soreal-idle-local-neural-state', h);
      return function () { window.removeEventListener('soreal-idle-local-neural-state', h); };
    }
  };
  window.__SOREAL_IDLE_LOCAL_NEURAL_V1__ = piperStub;

  // ---- utilitaires
  function A() { return window.__SOREAL_IDLE_AUDIO_V199__ || null; }
  function V() { return window.__SOREAL_IDLE_AUDIO_VOLUME_V1__ || null; }
  function T() { return window.__SOREAL_IDLE_TUTORIAL_TTS_V209__ || null; }
  function versUnity(methode, message) {
    /* Toujours plus tard (jamais pendant l'appel venu d'Unity : pas de rappel réentrant). */
    setTimeout(function () { try { window.unityInstance.SendMessage('SorealAudio', methode, message); } catch (e) {} }, 0);
  }
  function brut(id) { var a = A(); if (!a) return false; try { return Boolean(a.play(String(id))); } catch (e) { return false; } }

  var api = {
    pret: pret,
    diag: diag,

    /* Sons : mêmes identifiants que le jeu web (fight, victory, purchase, skill_regular, menu_ngu, sortBlood_leeches…). 1 = accepté. */
    jouer: function (id) {
      var ok = brut(id);
      if (ok) { diag.joues++; diag.dernierSon = String(id); noter('son ' + id); } else { diag.refus++; diag.dernierRefus = String(id); }
      return ok ? 1 : 0;
    },
    /* Son de menu : « menu_<id> » si le jeu en a un, sinon la clochette de navigation ; la boutique a sa porte. Met aussi à jour le menu ouvert (musiques Shop / Blood Magic). */
    menu: function (id, avecSon) {
      id = String(id || '');
      racineMenu.setAttribute('data-menu', id);
      if (!avecSon) return 1;
      var ok = id === 'shop' ? brut('shopDoor') : (brut('menu_' + id) || brut('menuNav'));
      if (ok) { diag.joues++; diag.dernierSon = 'menu:' + id; }
      return ok ? 1 : 0;
    },
    /* Sons de la page Yggdrasil (yggdrasil-sons-v1.js : volume = barre « Sons de l interface », rien ne se crée si la case est décochée) */
    ygg: function (nom, option) { var Y = window.__SOREAL_IDLE_YGG_SONS_V1__; var ok = false; if (Y) try { ok = Y.jouer(String(nom), option && String(option) ? String(option) : undefined); } catch (e) {} if (ok) { diag.joues++; diag.dernierSon = "ygg:" + nom; } else diag.refus++; return ok ? 1 : 0; },
    roue: function (angle, dureeMs) { var a = A(); if (a && a.roueTourne) { try { a.roueTourne(Number(angle) || 0, Number(dureeMs) || 0); diag.joues++; diag.dernierSon = 'roueTourne'; return 1; } catch (e) {} } return 0; },
    debloquer: function () { var a = A(); if (a && a.unlock) try { a.unlock(); } catch (e) {} },

    /* Musiques et ambiances */
    titan: function (oui) {
      titanActif = Boolean(oui); diag.titan = titanActif;
      var M = window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__;
      if (M) { try { if (titanActif) M.demarrer(); else M.arreter(); } catch (e) {} }
    },
    ambiance: function (debloquee) {
      diag.ambiance = Boolean(debloquee);
      var M = window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__;
      if (M) try { M.verifier(Boolean(debloquee)); } catch (e) {}
    },
    suspendreAmbiance: function (oui) { var M = window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__; if (M) try { M.suspendre(Boolean(oui)); } catch (e) {} },
    forcerOrage: function () { var M = window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__; if (M) try { M.forcerOrage(); } catch (e) {} },

    /* Volumes (liés au compte : PrefsCompte les écrit, prefPousser les dépose ici) : type = voix | ambiance | musique | interface */
    volume: function (type) { var v = V(); return v ? Number(v.getReglage(String(type))) : 0.75; },
    volumeEffectif: function (type) {
      var v = V(); if (!v) return 0.75;
      var t = String(type);
      return t === 'voix' ? v.getVoix() : t === 'ambiance' ? v.getAmbiance() : t === 'musique' ? v.getMusique() : v.getInterface();
    },
    fixerVolume: function (type, valeur) { var v = V(); if (v) v.setReglage(String(type), Number(valeur)); },
    actif: function (type) { var v = V(); return v ? (v.getActif(String(type)) ? 1 : 0) : 1; },
    fixerActif: function (type, oui) { var v = V(); if (v) v.setActif(String(type), Boolean(oui)); },

    /* Préférences : C# (PrefsCompte) dépose une valeur du compte dans le stockage de la page, sans la renvoyer au compte (écriture native) */
    prefPousser: function (cle, valeur) { try { if (valeur === null) natifRem.call(localStorage, String(cle)); else natifSet.call(localStorage, String(cle), String(valeur)); } catch (e) {} },
    /* Écritures faites par les modules depuis le dernier appel (JSON {clé: valeur|null}), ou '' s'il n'y en a pas. */
    prefsSorties: function () {
      if (!nbSorties) return '';
      var r = JSON.stringify(sorties); sorties = {}; nbSorties = 0; return r;
    },

    /* Voix. cb : identifiant renvoyé à Unity (SorealAudio.SurVoixFinie) à la fin de la lecture ; ok = 1 si lue jusqu'au bout. */
    voixLire: function (texte, audioSrc, cb) {
      var fin = function (ok) { diag.voixFin++; if (cb) versUnity('SurVoixFinie', cb + '|' + (ok ? 1 : 0)); };
      var t = T(), v = V();
      diag.voixLectures++; diag.voixDernierTexte = String(texte || '').slice(0, 60);
      /* Voix coupée (case décochée ou curseur à 0) : rien n'est généré ni lu ; l'appelant retombe sur son minuteur de lecture. */
      if (!t || (v && !(v.getVoix() > 0))) { fin(false); return 0; }
      var ok = false;
      try { ok = Boolean(t.readText(String(texte || ''), audioSrc || '', function (b) { fin(b === true); })); } catch (e) { fin(false); }
      return ok ? 1 : 0;
    },
    voixChronique: function (nom, histoire, cb) {
      var t = T();
      if (!t) { if (cb) versUnity('SurVoixFinie', cb + '|0'); return 0; }
      var texte = '';
      try { texte = t.composerChronique(String(nom || ''), String(histoire || '')); } catch (e) {}
      return api.voixLire(texte, '', cb);
    },
    voixStop: function () { var t = T(); if (t) try { t.stop(); } catch (e) {} },
    voixPause: function () { var t = T(); return t ? (t.pause() ? 1 : 0) : 0; },
    voixReprendre: function () { var t = T(); return t ? (t.resume() ? 1 : 0) : 0; },
    voixEnCours: function () { var t = T(); return t && t.isSpeaking() ? 1 : 0; },
    voixEnPause: function () { var t = T(); return t && t.isPaused() ? 1 : 0; },
    voixAuto: function () { var t = T(); return t ? (t.enabled() ? 1 : 0) : 0; },
    voixFixerAuto: function (oui) { var t = T(); if (t) try { t.setEnabled(Boolean(oui)); } catch (e) {} },
    voixPrechauffer: function (texte) { var t = T(); if (t) try { t.prechauffer(String(texte || '')); } catch (e) {} },
    voixDynamiques: function (listeJson) { var t = T(); if (t) try { t.enregistrerVoixDynamiques(JSON.parse(listeJson)); } catch (e) {} },
    voixHash: function (texte) { var t = T(); return t ? t.hashBloc(String(texte || '')) : ''; },
    voixPlan: function (texte) { var t = T(); return t ? JSON.stringify(t.planNarration(String(texte || ''))) : '[]'; },

    diagnostic: function () {
      var a = A(), t = T(), v = V();
      var etat = a && a.debugState ? a.debugState() : {};
      return JSON.stringify({
        pret: diag.pret, modulesCharges: diag.modulesCharges, modulesEchoues: diag.modulesEchoues,
        contextes: contextes.map(function (c) { return c.state; }),
        voixEtat: t ? t.audioState() : 'absent', voixStats: t ? t.voiceStats() : null, voixErreur: t ? t.lastError() : '',
        volumes: v ? { voix: v.getReglage('voix'), ambiance: v.getReglage('ambiance'), musique: v.getReglage('musique'), interface: v.getReglage('interface'),
          actifs: { voix: v.getActif('voix'), ambiance: v.getActif('ambiance'), musique: v.getActif('musique'), interface: v.getActif('interface') } } : null,
        file: etat, joues: diag.joues, refus: diag.refus, dernierSon: diag.dernierSon, dernierRefus: diag.dernierRefus,
        menu: racineMenu.getAttribute('data-menu'), titan: diag.titan, ambiance: diag.ambiance,
        voixLectures: diag.voixLectures, voixFin: diag.voixFin, voixDernierTexte: diag.voixDernierTexte,
        piper: diag.piper, journal: diag.journal.slice(-15)
      });
    }
  };
  window.SorealAudio = api;
})();
