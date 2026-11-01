/*
 * SOREAL IDLE — visage personnalisé du badavatar (Norman, 2026-11-01). FACULTATIF : un joueur qui veut un autre visage que celui qui lui a été désigné (une photo, un personnage...) choisit une image, la cadre,
 * et elle est DÉTOURÉE automatiquement SUR L'APPAREIL, hors ligne : modèle de segmentation de personne MediaPipe « Selfie Segmenter » (Apache-2.0, 250 Ko) et son exécuteur WebAssembly (MediaPipe Tasks Vision 1.2.0,
 * Apache-2.0, 14,5 Mo), embarqués dans modules/mediapipe-1.2.0/ (servis par le Worker, l'exe et le paquet de l'APK comme sql-wasm-v1.wasm). Ils ne se chargent QU'À LA DEMANDE, au premier détourage
 * (jamais au démarrage du jeu). Si le modèle ne peut pas se charger (navigateur sans WebAssembly SIMD, mémoire), repli : découpe ovale douce, avec un message clair.
 * Vie privée : l'image d'origine n'est jamais envoyée ni gardée (elle ne sort pas de cette page) ; seul le visage détouré, réduit (384 px, webp ou png, 100 000 caractères au plus), est proposé à l'enregistrement.
 * Cadrage : le joueur place lui-même un cercle sur le visage (pas de détection de visage : aucun second modèle embarqué).
 * Géométrie : le cercle = la tête ; la découpe est un carré de 1,5 fois le diamètre autour du cercle (même convention que boiteVisage dans itopod-badavatars-v1.js : côté = 1,5 largeur de tête).
 */
(function () {
  "use strict";
  if (window.__SOREAL_IDLE_PROFIL_VISAGE_V1__) return;
  var DOSSIER = "/modules/mediapipe-1.2.0/";
  var TAILLE = 384, MAX_CARACTERES = 100000, COTE_MAX = 1600;
  var seg = null, chargement = null, echecModele = false;

  function chargerModele() {
    if (seg) return Promise.resolve(seg);
    if (echecModele) return Promise.resolve(null);
    if (chargement) return chargement;
    chargement = import(DOSSIER + "vision_bundle.mjs").then(function (m) {
      return m.FilesetResolver.forVisionTasks(DOSSIER + "wasm").then(function (fs) {
        return m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: DOSSIER + "selfie_segmenter.tflite", delegate: "CPU" }, runningMode: "IMAGE", outputConfidenceMasks: true, outputCategoryMask: false });
      });
    }).then(function (s) { seg = s; return s; }).catch(function () { echecModele = true; return null; });
    return chargement;
  }

  /* Masque de personne (tableau de TAILLE x TAILLE, 0..1) pour un canvas carré ; null si le modèle manque. */
  function masquePersonne(canvas) {
    return chargerModele().then(function (s) {
      if (!s) return null;
      try {
        var res = s.segment(canvas), liste = res.confidenceMasks || [];
        /* Sélecteur : un seul masque = la personne ; deux = [fond, personne]. */
        var m = liste[liste.length - 1], d = m ? m.getAsFloat32Array() : null, w = m ? m.width : 0, h = m ? m.height : 0;
        var out = null;
        if (d && w && h) {
          out = new Float32Array(TAILLE * TAILLE);
          for (var y = 0; y < TAILLE; y++) for (var x = 0; x < TAILLE; x++) out[y * TAILLE + x] = d[Math.min(h - 1, Math.floor(y * h / TAILLE)) * w + Math.min(w - 1, Math.floor(x * w / TAILLE))];
        }
        if (res.close) res.close();
        return out;
      } catch (_e) { return null; }
    });
  }

  function lisser(v, a, b) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
  /* Ellipse douce autour de la tête : garde le visage et les cheveux, coupe le cou et les épaules. */
  function ovale(x, y) {
    var dx = (x + 0.5) / TAILLE - 0.5, dy = (y + 0.5) / TAILLE - 0.5;
    var r = Math.sqrt((dx / 0.36) * (dx / 0.36) + (dy / 0.40) * (dy / 0.40));
    return 1 - lisser(r, 0.88, 1);
  }

  /* Découpe carrée (côté = 1,5 x diamètre du cercle) -> canvas TAILLE x TAILLE avec fond transparent. Renvoie { canvas, modele }. */
  function detourer(image, cercle) {
    var cote = cercle.d * 1.5, c = document.createElement("canvas");
    c.width = TAILLE; c.height = TAILLE;
    var g = c.getContext("2d", { willReadFrequently: true });
    g.fillStyle = "#808080"; g.fillRect(0, 0, TAILLE, TAILLE);
    g.drawImage(image, cercle.x - cote / 2, cercle.y - cote / 2, cote, cote, 0, 0, TAILLE, TAILLE);
    return masquePersonne(c).then(function (masque) {
      var px = g.getImageData(0, 0, TAILLE, TAILLE), d = px.data;
      for (var y = 0; y < TAILLE; y++) for (var x = 0; x < TAILLE; x++) {
        var i = y * TAILLE + x, a = ovale(x, y);
        if (masque) a *= lisser(masque[i], 0.3, 0.7);
        d[i * 4 + 3] = Math.round(255 * a);
      }
      g.putImageData(px, 0, 0);
      return { canvas: c, modele: Boolean(masque) };
    });
  }

  /* Encode en webp (sinon png) en descendant la qualité puis la taille jusqu'à tenir dans MAX_CARACTERES. */
  function encoder(canvas) {
    var essais = [[TAILLE, 0.85], [TAILLE, 0.7], [TAILLE, 0.55], [320, 0.7], [256, 0.7], [192, 0.7], [128, 0.7]];
    for (var i = 0; i < essais.length; i++) {
      var t = essais[i][0], c = canvas;
      if (t !== TAILLE) { c = document.createElement("canvas"); c.width = t; c.height = t; c.getContext("2d").drawImage(canvas, 0, 0, t, t); }
      var url = c.toDataURL("image/webp", essais[i][1]);
      if (url.indexOf("data:image/webp") !== 0) url = c.toDataURL("image/png");
      if (url.length <= MAX_CARACTERES) return url;
    }
    return "";
  }

  function lireImage(fichier) {
    if (window.createImageBitmap) return createImageBitmap(fichier, { imageOrientation: "from-image" }).catch(function () { return viaImg(fichier); });
    return viaImg(fichier);
  }
  function viaImg(fichier) {
    return new Promise(function (ok, ko) { var u = URL.createObjectURL(fichier), im = new Image(); im.onload = function () { URL.revokeObjectURL(u); ok(im); }; im.onerror = function () { URL.revokeObjectURL(u); ko(new Error("image")); }; im.src = u; });
  }
  /* Réduit l'original (en mémoire seulement) : l'original n'est jamais gardé ni envoyé. */
  function reduire(src) {
    var w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, k = Math.min(1, COTE_MAX / Math.max(w, h));
    var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  var STYLE = ".pvz-fond{position:fixed;inset:0;z-index:100000;background:rgba(5,8,18,.82);display:flex;align-items:center;justify-content:center;padding:12px}" +
    ".pvz-boite{background:#12182b;border:1px solid #3b4a7a;border-radius:14px;max-width:420px;width:100%;max-height:100%;overflow:auto;padding:14px;color:#dce5f3;font-size:14px;box-sizing:border-box}" +
    ".pvz-boite h3{margin:0 0 6px;font-size:17px}.pvz-note{color:#9aa6c4;font-size:13px;margin:6px 0}" +
    ".pvz-zone{position:relative;width:100%;touch-action:none;background:#0a0e1c;border-radius:10px;overflow:hidden}.pvz-zone canvas{display:block;width:100%;height:auto;touch-action:none}" +
    ".pvz-damier{background:conic-gradient(#8a8a8a 25%,#b5b5b5 0 50%,#8a8a8a 0 75%,#b5b5b5 0) 0 0/16px 16px;border-radius:10px;display:flex;justify-content:center}.pvz-damier img{width:70%;max-width:256px;display:block}" +
    ".pvz-rangee{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}.pvz-rangee input[type=range]{flex:1;min-width:120px}.pvz-bouton{min-height:44px}";

  /* Fenêtre : choisir -> cadrer -> résultat. Résout { image: dataUrl } ou null (annulé). */
  function ouvrir(fichier) {
    return new Promise(function (resoudre) {
      if (!document.getElementById("pvzStyleV1")) { var st = document.createElement("style"); st.id = "pvzStyleV1"; st.textContent = STYLE; document.head.appendChild(st); }
      var fond = document.createElement("div"); fond.className = "pvz-fond"; fond.setAttribute("role", "dialog"); fond.setAttribute("aria-modal", "true");
      var boite = document.createElement("div"); boite.className = "pvz-boite"; fond.appendChild(boite); document.body.appendChild(fond);
      function fermer(v) { if (fond.parentNode) fond.parentNode.removeChild(fond); resoudre(v); }
      boite.innerHTML = '<h3>Ajouter un visage</h3><div class="pvz-note">Chargement de l’image…</div>';
      lireImage(fichier).then(function (src) {
        var img = reduire(src), cercle = { x: img.width / 2, y: img.height * 0.4, d: Math.min(img.width, img.height) * 0.45 };
        /* Vue : zoom z (1 = image entière) centré sur (vx, vy) en pixels de l'image ; le cercle est en pixels de l'image. */
        var vue = { z: 1, vx: img.width / 2, vy: img.height / 2 }, ZMAX = 8;
        boite.innerHTML = '<h3>Ajouter un visage</h3><div class="pvz-note">Place le cercle sur le visage (glisse-le), règle sa taille et zoome sur l’image si besoin (curseur, molette ou deux doigts ; glisse en dehors du cercle pour déplacer l’image). L’image est détourée sur cet appareil : l’original n’est jamais envoyé.</div>' +
          '<div class="pvz-zone"><canvas data-pvz="cadre"></canvas></div>' +
          '<div class="pvz-rangee"><label for="pvzTaille">Taille</label><input type="range" id="pvzTaille" min="5" max="100" value="45" aria-label="Taille du cercle"></div>' +
          '<div class="pvz-rangee"><label for="pvzZoom">Zoom</label><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="zoom-" aria-label="Zoom moins">−</button><input type="range" id="pvzZoom" min="1" max="' + ZMAX + '" step="0.01" value="1" aria-label="Zoom"><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="zoom+" aria-label="Zoom plus">+</button></div>' +
          '<div class="pvz-rangee"><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="annuler">Annuler</button><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="detourer">Détourer</button></div>';
        var cv = boite.querySelector('[data-pvz="cadre"]'), echelle = Math.min(1, 380 / img.width), curZoom = boite.querySelector("#pvzZoom");
        cv.width = Math.round(img.width * echelle); cv.height = Math.round(img.height * echelle);
        function echV() { return cv.width / img.width * vue.z; }              /* pixels d'écran (canvas) par pixel d'image */
        function coin() { var k = echV(); return { x: vue.vx - cv.width / 2 / k, y: vue.vy - cv.height / 2 / k, k: k }; }
        function caler() {
          var k = echV(), demiL = cv.width / 2 / k, demiH = cv.height / 2 / k;
          vue.vx = demiL >= img.width / 2 ? img.width / 2 : Math.min(img.width - demiL, Math.max(demiL, vue.vx));
          vue.vy = demiH >= img.height / 2 ? img.height / 2 : Math.min(img.height - demiH, Math.max(demiH, vue.vy));
        }
        function dessiner() {
          caler();
          var g = cv.getContext("2d"), c = coin();
          g.clearRect(0, 0, cv.width, cv.height);
          g.drawImage(img, Math.max(0, c.x), Math.max(0, c.y), Math.min(img.width, cv.width / c.k), Math.min(img.height, cv.height / c.k), Math.max(0, -c.x) * c.k, Math.max(0, -c.y) * c.k, Math.min(img.width, cv.width / c.k) * c.k, Math.min(img.height, cv.height / c.k) * c.k);
          var sx = (cercle.x - c.x) * c.k, sy = (cercle.y - c.y) * c.k, sr = cercle.d / 2 * c.k;
          g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.arc(sx, sy, sr, 0, Math.PI * 2, true); g.fill("evenodd");
          g.strokeStyle = "#ffd45a"; g.lineWidth = 2; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.stroke();
        }
        function zoomer(z, ancre) {                                            /* ancre : point de l'image qui reste sous le doigt (pixels d'image) */
          var avant = vue.z; vue.z = Math.min(ZMAX, Math.max(1, z));
          if (ancre && avant !== vue.z) { var r = avant / vue.z; vue.vx = ancre.x - (ancre.x - vue.vx) * r; vue.vy = ancre.y - (ancre.y - vue.vy) * r; }
          curZoom.value = vue.z; dessiner();
        }
        dessiner();
        var pts = {}, geste = null;
        function sousPoint(e) { var r = cv.getBoundingClientRect(), c = coin(), f = cv.width / r.width; return { x: c.x + (e.clientX - r.left) * f / c.k, y: c.y + (e.clientY - r.top) * f / c.k }; }
        cv.addEventListener("pointerdown", function (e) {
          pts[e.pointerId] = { x: e.clientX, y: e.clientY };
          try { cv.setPointerCapture(e.pointerId); } catch (_e) { /* pas de capture */ }
          var ids = Object.keys(pts);
          if (ids.length >= 2) { var a = pts[ids[0]], b = pts[ids[1]]; geste = { type: "pince", d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: vue.z }; }
          else { var p = sousPoint(e), dedans = Math.hypot(p.x - cercle.x, p.y - cercle.y) <= cercle.d / 2; geste = { type: dedans ? "cercle" : "vue", x: e.clientX, y: e.clientY, cx: cercle.x, cy: cercle.y, vx: vue.vx, vy: vue.vy }; }
          e.preventDefault();
        });
        cv.addEventListener("pointermove", function (e) {
          if (!pts[e.pointerId] || !geste) return;
          pts[e.pointerId] = { x: e.clientX, y: e.clientY };
          var ids = Object.keys(pts);
          if (geste.type === "pince" && ids.length >= 2) { var a = pts[ids[0]], b = pts[ids[1]]; zoomer(geste.z0 * Math.hypot(a.x - b.x, a.y - b.y) / geste.d0, { x: vue.vx, y: vue.vy }); return; }
          var r = cv.getBoundingClientRect(), k = (cv.width / r.width) / echV();
          if (geste.type === "cercle") { cercle.x = Math.min(img.width, Math.max(0, geste.cx + (e.clientX - geste.x) * k)); cercle.y = Math.min(img.height, Math.max(0, geste.cy + (e.clientY - geste.y) * k)); }
          else if (geste.type === "vue") { vue.vx = geste.vx - (e.clientX - geste.x) * k; vue.vy = geste.vy - (e.clientY - geste.y) * k; }
          dessiner();
        });
        function fin(e) { delete pts[e.pointerId]; if (!Object.keys(pts).length) geste = null; else if (geste && geste.type === "pince") geste = null; }
        cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
        cv.addEventListener("wheel", function (e) { e.preventDefault(); zoomer(vue.z * Math.exp(-e.deltaY * 0.0015), sousPoint(e)); }, { passive: false });
        curZoom.addEventListener("input", function () { zoomer(Number(curZoom.value), { x: vue.vx, y: vue.vy }); });
        boite.querySelector('[data-pvz="zoom-"]').onclick = function () { zoomer(vue.z / 1.25, { x: vue.vx, y: vue.vy }); };
        boite.querySelector('[data-pvz="zoom+"]').onclick = function () { zoomer(vue.z * 1.25, { x: vue.vx, y: vue.vy }); };
        boite.querySelector("#pvzTaille").addEventListener("input", function (e) { cercle.d = Math.max(16, Math.min(img.width, img.height) * Number(e.target.value) / 100); dessiner(); });
        boite.querySelector('[data-pvz="annuler"]').onclick = function () { fermer(null); };
        boite.querySelector('[data-pvz="detourer"]').onclick = function () {
          boite.innerHTML = '<h3>Ajouter un visage</h3><div class="pvz-note">Détourage en cours… (le premier détourage charge le modèle, quelques secondes)</div>';
          detourer(img, cercle).then(function (r) {
            var url = encoder(r.canvas);
            if (!url) { boite.innerHTML = '<h3>Ajouter un visage</h3><div class="pvz-note">Impossible de réduire cette image assez. Essaie une autre image.</div><div class="pvz-rangee"><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="annuler">Fermer</button></div>'; boite.querySelector('[data-pvz="annuler"]').onclick = function () { fermer(null); }; return; }
            boite.innerHTML = '<h3>Ajouter un visage</h3><div class="pvz-damier"><img alt="Visage détouré" src="' + url + '"></div>' +
              '<div class="pvz-note">' + (r.modele ? 'Détourage terminé.' : 'Le modèle de détourage n’a pas pu se charger sur cet appareil : le visage est seulement découpé en ovale.') + '</div>' +
              '<div class="pvz-note">Cette image sera visible par les autres joueurs.</div>' +
              '<div class="pvz-rangee"><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="annuler">Annuler</button><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="utiliser">Utiliser ce visage</button></div>';
            boite.querySelector('[data-pvz="annuler"]').onclick = function () { fermer(null); };
            boite.querySelector('[data-pvz="utiliser"]').onclick = function () { fermer({ image: url, modele: r.modele }); };
          });
        };
      }).catch(function () {
        boite.innerHTML = '<h3>Ajouter un visage</h3><div class="pvz-note">Cette image n’a pas pu être lue.</div><div class="pvz-rangee"><button type="button" class="soreal-idle-expand-button-v25 pvz-bouton" data-pvz="annuler">Fermer</button></div>';
        boite.querySelector('[data-pvz="annuler"]').onclick = function () { fermer(null); };
      });
    });
  }

  window.__SOREAL_IDLE_PROFIL_VISAGE_V1__ = { ouvrir: ouvrir, detourer: detourer, encoder: encoder, chargerModele: chargerModele, taille: TAILLE, maxCaracteres: MAX_CARACTERES, dossier: DOSSIER };
})();
