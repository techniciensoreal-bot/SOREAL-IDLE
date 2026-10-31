/*
 * Personnages aléatoires de l'ITOPOD à partir des « badavatars » (Norman, 2026-10-31) : un corps d'homme ou de femme, avec cheveux, yeux, oreilles, nez, bouche et, parfois, une barbe
 * (les femmes aussi). JAMAIS de Vetements ni d'Accessoires (le corps lui-même porte déjà un débardeur ou une chemisette : c'est son image).
 * FIGÉ (Norman, 2026-10-31) : le visage d'un nom d'équipe est fixe (tirerPourNom : graine = nom normalisé, minuscules sans accents) ; le tirage utilise l'INDICE dans les listes triées du catalogue.
 * Donc changer la liste des pièces (regénérer le catalogue, ajouter ou retirer une image du R2) CHANGE les visages. Le catalogue porte un champ version : ne pas le regénérer sans le dire ; si on doit ajouter
 * des pièces, les mettre à la FIN des listes (ne pas retrier) et monter la version, ou figer le design de chaque nom en base (option la plus sûre).
 * Sans dépendance. Même graine = même personnage. Le design produit est valide au sens de l'éditeur de SOREAL-TV (version 1, gender, body, parts{key,x,y,scale,rotation,order}).
 *
 * Placement : les pièces ne sont PAS alignées d'office (le joueur les pose à la main dans l'éditeur). Ici chaque pièce est ancrée sur la tête MESURÉE du corps choisi (haut du crâne, menton, largeur, axe,
 * relevés sur les pixels, voir cloudflare/tools/generer-catalogue-badavatars.mjs) et mise à l'échelle d'après la boîte MESURÉE de ses pixels non transparents. Seuls les corps dont la tête a pu être mesurée
 * de façon fiable sont tirés. Les proportions ci-dessous (LANDMARKS) sont des réglages de rendu choisis à l'œil, pas des valeurs de jeu.
 */
(function () {
  "use strict";
  var CAT = window.__SOREAL_IDLE_ITOPOD_BADAVATARS_CATALOGUE_V1__ || { bodies: { Body_Homme: [], Body_Femme: [] }, parts: {} };
  var BASE = "shared/badavatars/";
  var W = 480, H = 640;                         /* scène de l'éditeur : 3/4, les images y sont posées en « contain » */
  var TIRABLES = ["Cheveux", "Yeux", "Oreille_Gauche", "Oreille_Droite", "Nez", "Bouche", "Barbe"];
  var ORDRE = { Cheveux: 1, Yeux: 2, Oreille_Gauche: 3, Oreille_Droite: 4, Nez: 5, Bouche: 6, Barbe: 7 };
  var CHANCE_BARBE = { Body_Homme: 0.4, Body_Femme: 0.3 };
  /* Ancrage sur la tête (médianes relevées sur les personnages créés à la main par les joueurs, corps à tête mesurée fiable) : cy = position verticale du centre de la pièce (0 = haut du crâne, 1 = menton), w = largeur de la pièce en largeur de tête, h = hauteur (oreilles), dx = écart à l'axe. */
  var LANDMARKS = {
    Cheveux: { cy: 0.32, w: 1.25 },
    Yeux: { cy: 0.46, w: 0.59 },
    Nez: { cy: 0.63, w: 0.32 },
    Bouche: { cy: 0.93, w: 0.58 },
    Barbe: { cy: 1.0, w: 0.85 },
    Oreille_Gauche: { cy: 0.62, h: 0.42, dx: -0.58 },
    Oreille_Droite: { cy: 0.62, h: 0.42, dx: 0.58 }
  };

  function prng(graine) {
    var s = 0, t = String(graine);
    for (var i = 0; i < t.length; i++) s = (Math.imul(s, 31) + t.charCodeAt(i)) | 0;
    s = (s ^ 0x9e3779b9) >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function choisir(rng, liste) { return liste[Math.floor(rng() * liste.length) % liste.length]; }
  function varier(rng, a) { return (rng() * 2 - 1) * a; }
  function arrondir(v, n) { var p = Math.pow(10, n); return Math.round(v * p) / p; }

  /* Place une pièce : renvoie { x, y, scale, rotation } pour que la boîte mesurée de ses pixels vise le point d'ancrage. */
  function placer(categorie, m, tete, rng, rotMax) {
    var L = LANDMARKS[categorie];
    var iw = m[1], ih = m[2], x0 = m[3], y0 = m[4], x1 = m[5], y1 = m[6];
    var s0 = Math.min(W / iw, H / ih);
    var bw = (x1 - x0 + 1) * s0, bh = (y1 - y0 + 1) * s0;
    var ox = ((x0 + x1) / 2 - iw / 2) * s0, oy = ((y0 + y1) / 2 - ih / 2) * s0;
    var T = tete[1], hauteur = tete[2] - tete[1], largeur = tete[3], axe = tete[4];
    var scale = L.h ? (L.h * hauteur) / bh : (L.w * largeur) / bw;
    scale *= 1 + varier(rng, 0.08);
    scale = Math.min(4, Math.max(0.15, scale));
    var rot = varier(rng, rotMax);
    var tx = axe + (L.dx || 0) * largeur + varier(rng, 0.02) * largeur;
    var ty = T + (L.cy + varier(rng, 0.015)) * hauteur;
    var a = rot * Math.PI / 180;
    var x = (tx - W / 2 - scale * (ox * Math.cos(a) - oy * Math.sin(a))) / W;
    var y = (ty - H / 2 - scale * (ox * Math.sin(a) + oy * Math.cos(a))) / H;
    return { key: BASE + m[0], x: arrondir(x, 4), y: arrondir(y, 4), scale: arrondir(scale, 4), rotation: arrondir(rot, 2) };
  }

  /* Oreille gauche et droite d'un même style : le nom de l'une est celui de l'autre avec _gauche / _droite. */
  function oreillePareille(rng, gauche, droites) {
    var nom = gauche[0].split("/").pop().replace(/_gauche(\.[a-z]+)$/i, "_droite$1");
    for (var i = 0; i < droites.length; i++) if (droites[i][0].split("/").pop() === nom) return droites[i];
    return choisir(rng, droites);
  }

  function tirer(graine, options) {
    options = options || {};
    var rng = prng(graine);
    var genre = options.genre === "Body_Homme" || options.genre === "Body_Femme" ? options.genre : (rng() < 0.5 ? "Body_Homme" : "Body_Femme");
    var corps = choisir(rng, CAT.bodies[genre]);
    var avecBarbe = typeof options.barbe === "boolean" ? options.barbe : rng() < CHANCE_BARBE[genre];
    var design = { version: 1, gender: genre, body: BASE + corps[0], parts: {} };
    TIRABLES.forEach(function (c) {
      if (c === "Barbe" && !avecBarbe) return;
      if (c === "Oreille_Droite") return;
      var liste = CAT.parts[c] || [];
      if (!liste.length) return;
      var m = c === "Oreille_Droite" ? null : choisir(rng, liste);
      var rotMax = c === "Barbe" ? 1.5 : (c.indexOf("Oreille") === 0 ? 4 : 3);
      design.parts[c] = placer(c, m, corps, rng, rotMax);
      design.parts[c].order = ORDRE[c];
      if (c === "Oreille_Gauche") {
        var d = oreillePareille(rng, m, CAT.parts.Oreille_Droite);
        design.parts.Oreille_Droite = placer("Oreille_Droite", d, corps, rng, 4);
        design.parts.Oreille_Droite.order = ORDRE.Oreille_Droite;
      }
    });
    return design;
  }

  /* Les clés des designs sont celles de l'éditeur (shared/badavatars/…) ; les images sont servies depuis la copie idle/badavatars/… (hors ligne : miroir R2 de l'exe). */
  /* Un nom d'équipe = un visage : même nom (casse et accents ignorés) = même personnage, genre et barbe compris. */
  function nomNormalise(nom) { return String(nom == null ? "" : nom).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function tirerPourNom(nom) { return tirer("nom:" + nomNormalise(nom)); }

  function urlParDefaut(cle) { return "/api/idle/media/shared?key=" + encodeURIComponent("idle/badavatars/" + String(cle).slice(BASE.length)); }

  /* Pile d'images posées comme dans l'éditeur (scène 3/4, chaque image occupe toute la scène, zIndex = order, translate(x,y) en % puis rotate puis scale). */
  function rendreHtml(design, options) {
    options = options || {};
    var url = options.url || urlParDefaut;
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); };
    var base = "position:absolute;left:0;top:0;width:100%;height:100%;max-width:none;object-fit:contain;pointer-events:none;user-select:none";
    var surErreur = options.surErreurCorps ? ' onerror="' + esc(options.surErreurCorps) + '"' : "";
    var html = '<div class="itopod-badavatar" style="position:relative;width:100%;aspect-ratio:3/4;overflow:hidden">';
    html += '<img alt="" draggable="false" decoding="async" src="' + esc(url(design.body)) + '"' + surErreur + ' style="' + base + ';z-index:0">';
    Object.keys(design.parts).forEach(function (c) {
      var p = design.parts[c];
      html += '<img alt="" draggable="false" decoding="async" data-piece="' + esc(c) + '" src="' + esc(url(p.key)) + '" style="' + base + ";z-index:" + (p.order || 1) +
        ";transform:translate(" + (p.x * 100) + "%," + (p.y * 100) + "%) rotate(" + p.rotation + "deg) scale(" + (p.flip ? -p.scale : p.scale) + "," + p.scale + ')">';
    });
    return html + "</div>";
  }

  window.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__ = { tirer: tirer, tirerPourNom: tirerPourNom, nomNormalise: nomNormalise, versionCatalogue: CAT.version, rendreHtml: rendreHtml, categoriesTirables: TIRABLES.slice(), placer: placer, LANDMARKS: LANDMARKS, catalogue: CAT, prefixe: BASE };
})();
