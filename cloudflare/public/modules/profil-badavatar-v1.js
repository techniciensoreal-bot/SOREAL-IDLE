/*
 * SOREAL IDLE — profils de badavatar des joueurs, côté page (Norman, 2026-11-01 : Réglages > Profil ; le badavatar enregistré est celui que tout le monde voit dans l'ITOPOD).
 * Ce module ne dessine rien : il lit la liste publique (/api/idle/media/profils-badavatar, nom normalisé -> réglages), construit le design à rendre (le badavatar désigné du joueur, tiré par son nom
 * dans itopod-badavatars-v1.js, + ses réglages) et parle au serveur pour SON propre profil (POST /api/v1/profil-badavatar, jeton de session). L'ITOPOD (itopod-scene-v1.js) et l'éditeur des Réglages
 * (profil-badavatar-editeur-v1.js) utilisent le MÊME rendu (rendreHtml) : aucune logique de composition n'est dupliquée.
 * Un joueur sans profil enregistré garde son badavatar désigné, inchangé. Si le catalogue des pièces a changé depuis l'enregistrement (version différente), les réglages sont ignorés (jamais un visage absurde).
 */
(function () {
  "use strict";
  if (window.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__) return;
  var profils = null, enCours = false, dernier = 0;
  var EVENEMENT = "soreal-profils-badavatar";

  function B() { return window.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__; }
  function cle(nom) { var b = B(); return b && b.nomNormalise ? b.nomNormalise(nom) : String(nom || "").toLowerCase(); }
  /* Application Android hors ligne : le Worker de l'appareil n'a pas ces données partagées, on les lit et on les écrit sur le serveur (apk-connexion-v1.js, acces()). Ailleurs : même origine. */
  function acces() { var a = window.__SOREAL_IDLE_APK_CONNEXION_V1__; try { return a && a.acces ? a.acces() : null; } catch (_e) { return null; } }
  function base() { var a = acces(); return a ? a.base : ""; }
  function urlVisage(nomCle, v) { return base() + "/api/idle/media/badavatar-photo?nom=" + encodeURIComponent(nomCle) + "&v=" + encodeURIComponent(String(v || 0)); }

  function charger(force) {
    var maintenant = Date.now();
    if (enCours || (!force && maintenant - dernier < 60000)) return;
    enCours = true; dernier = maintenant;
    fetch(base() + "/api/idle/media/profils-badavatar", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      enCours = false;
      if (j && j.ok && j.profils && typeof j.profils === "object") {
        var avant = JSON.stringify(profils);
        profils = j.profils;
        if (avant !== JSON.stringify(profils)) { try { document.dispatchEvent(new Event(EVENEMENT)); } catch (_e) { /* ancien navigateur */ } }
      }
    }).catch(function () { enCours = false; });
  }

  /* Profil brut -> { design, photo, sig } prêt pour rendreHtml, ou null (badavatar désigné par défaut). */
  function preparer(nomCle, p) {
    var b = B();
    if (!b || !b.appliquerProfil || !p || !p.base) return null;
    if (p.cat && String(p.cat) !== String(b.versionCatalogue)) return null;
    var design = b.appliquerProfil(b.tirerPourNom(p.base), p);
    var photo = p.photo ? { url: urlVisage(nomCle, p.photo.v), visible: p.photo.visible !== false, x: p.photo.x, y: p.photo.y, k: p.photo.k, kx: p.photo.kx, ky: p.photo.ky, rot: p.photo.rot } : null;
    return { design: design, photo: photo, sig: JSON.stringify([p.base, p.pieces, p.photo]) };
  }

  /* Pour un nom d'ennemi de l'ITOPOD : le profil enregistré préparé, ou null. Lance (au plus une fois par minute) la lecture de la liste. */
  function pour(nom) {
    charger(false);
    var k = cle(nom);
    return profils && profils[k] ? preparer(k, profils[k]) : null;
  }

  /* Appel authentifié sur SON profil : lire / enregistrer / reinitialiser. Résout { ok, ... } ; jamais de rejet. */
  function jeton() {
    try { var s = sessionStorage.getItem("soreal_idle_session_v1"); if (s) return String(s); } catch (_e) { /* pas de stockage */ }
    try { var g = JSON.parse(localStorage.getItem("soreal_idle_google_session_v1") || "null"); if (g && g.token) return String(g.token); } catch (_e) { /* pas de session Google */ }
    try { return String(localStorage.getItem("horsligne_soreal_jeton_v1") || ""); } catch (_e) { return ""; }
  }
  function appeler(corps) {
    var a = acces(), t = a ? a.jeton : jeton();
    if (a && !t) return Promise.resolve({ ok: false, message: "Ton compte n’est pas connecté : ferme puis rouvre l’application pour te connecter." });
    return fetch(base() + "/api/v1/profil-badavatar", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + t }, body: JSON.stringify(corps) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, message: "Réponse illisible." }; }); })
      .catch(function () { return { ok: false, message: "Pas de connexion au serveur : réessaie plus tard." }; });
  }

  window.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__ = {
    pour: pour, preparer: preparer, charger: charger, cle: cle, urlVisage: urlVisage, appeler: appeler, evenement: EVENEMENT,
    lire: function () { return appeler({ action: "lire" }); },
    enregistrer: function (pieces, photo, cat) { return appeler({ action: "enregistrer", pieces: pieces, photo: photo || null, cat: String(cat == null ? "" : cat) }).then(function (r) { if (r && r.ok) charger(true); return r; }); },
    reinitialiser: function () { return appeler({ action: "reinitialiser" }).then(function (r) { if (r && r.ok) charger(true); return r; }); }
  };
})();
