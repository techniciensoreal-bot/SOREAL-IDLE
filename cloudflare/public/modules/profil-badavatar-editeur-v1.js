/*
 * SOREAL IDLE — éditeur du badavatar (Réglages > Profil, Norman, 2026-11-01). Le joueur voit SON badavatar désigné (tiré par son nom, itopod-badavatars-v1.js) ; il peut déplacer, agrandir, tourner et masquer
 * ses pièces, JAMAIS en choisir d'autres. « Enregistrer » envoie les réglages au serveur (profil-badavatar-v1.js, src/idle-profil-badavatar-v1.js) : c'est ce que tout le monde voit dans l'ITOPOD.
 * Un visage personnalisé est FACULTATIF (profil-visage-v1.js) : il se pose sur le corps comme les pièces, et les pièces restent affichables et réglables par-dessus.
 * Rendu : EXACTEMENT celui de l'ITOPOD (rendreHtml + appliquerProfil) ; pendant un glissement seul le style des images change (miseAJour : aucune image recréée).
 * Règle n°4 (redessin) : l'éditeur est un nœud PERSISTANT, rattaché dans #profilBadavEditeurV1 par monter() (appelé après chaque redessin de la page, window.__SOREAL_IDLE_APRES_REDESSIN_V1__, dans la même tâche) ;
 * son état d'édition survit aux redessins et aux changements d'onglet. Règle n°6 : le brouillon des réglages est dans localStorage (soreal_idle_profil_badavatar_brouillon_v1, sans l'image, trop lourde pour les préférences).
 */
(function () {
  "use strict";
  if (window.__SOREAL_IDLE_PROFIL_EDITEUR_V1__) return;
  var W = 480, H = 640, CLE_BROUILLON = "soreal_idle_profil_badavatar_brouillon_v1";
  var NOMS = { Cheveux: "Cheveux", Yeux: "Yeux", Oreille_Gauche: "Oreille gauche", Oreille_Droite: "Oreille droite", Nez: "Nez", Bouche: "Bouche", Barbe: "Barbe" };
  var racine = null, E = null, minuteurBrouillon = 0;

  function B() { return window.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__; }
  function PB() { return window.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function borner(v, b) { return Math.min(b[1], Math.max(b[0], v)); }
  function arr(v, n) { var p = Math.pow(10, n || 3); return Math.round(v * p) / p; }
  function parDefaut() { return { visible: true, dx: 0, dy: 0, k: 1, rot: 0 }; }

  var STYLE = ".pbe{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}.pbe-scene-col{flex:1 1 280px;max-width:380px;margin:0 auto}.pbe-ctrl{flex:1 1 280px;min-width:0}" +
    ".pbe-scene{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;background:radial-gradient(circle at 50% 35%,#27324f,#10152a);border:1px solid #3b4a7a;border-radius:12px;overflow:hidden;cursor:grab}" +
    ".pbe-cadre{position:absolute;border:2px solid #ffd45a;border-radius:6px;pointer-events:none;box-sizing:border-box;box-shadow:0 0 0 1px rgba(0,0,0,.6)}" +
    ".pbe-liste{display:flex;flex-direction:column;gap:6px;margin:0 0 10px}.pbe-ligne{display:flex;align-items:center;gap:8px;min-height:44px;padding:2px 8px;border:1px solid #2a3558;border-radius:10px;background:#141b33}" +
    ".pbe-ligne.sel{border-color:#ffd45a;background:#1d2646}.pbe-ligne label{flex:1;display:flex;align-items:center;gap:8px;font-size:15px;cursor:pointer}.pbe-ligne input[type=checkbox]{width:20px;height:20px}" +
    ".pbe-reglage{border:1px solid #2a3558;border-radius:10px;padding:10px;margin-bottom:10px;background:#101830}.pbe-curseur{display:flex;align-items:center;gap:8px;margin:6px 0}.pbe-curseur span{width:84px;font-size:13px;color:#9aa6c4}" +
    ".pbe-curseur input[type=range]{flex:1;min-width:0}.pbe-curseur button,.pbe-plein-ctrl button[data-pas]{min-width:44px;min-height:44px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;line-height:1}.pbe-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pbe-actions button,.pbe-visage button{min-height:44px}" +
    ".pbe-msg{margin-top:10px;font-size:14px;min-height:20px}.pbe-msg.ok{color:#7ee2a0}.pbe-msg.err{color:#ff8a8a}.pbe-note{font-size:13px;color:#9aa6c4;margin:6px 0}.pbe-visage{margin:10px 0}.pbe-titre{font-weight:900;font-size:15px;margin:12px 0 4px;color:#ffd45a}.pbe-verrou{display:flex;align-items:center;gap:8px;min-height:44px;font-size:14px}.pbe-verrou input{width:20px;height:20px}" +
    ".pbe-poignee{position:absolute;right:-13px;bottom:-13px;width:26px;height:26px;border-radius:50%;background:#ffd45a;border:2px solid #1b2340;box-sizing:border-box;pointer-events:auto;cursor:nwse-resize;touch-action:none}" +
    ".pbe-plein-ctrl{display:none;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}.pbe-agrandir{margin-top:8px;min-height:44px;width:100%}" +
    ".pbe-plein .pbe-scene-col{position:fixed;inset:0;z-index:99990;max-width:none;margin:0;padding:10px;box-sizing:border-box;background:rgba(5,8,18,.97);display:flex;flex-direction:column;align-items:center;justify-content:center}" +
    ".pbe-plein .pbe-scene{width:min(100%,calc((100vh - 130px) * .75));max-width:none}.pbe-plein .pbe-plein-ctrl{display:flex}.pbe-plein .pbe-agrandir{display:none}";

  function nomPiece(c) { return NOMS[c] || c; }

  /* ---------- état ---------- */
  function designBase() { var b = B(); return b && E ? b.tirerPourNom(E.base) : null; }
  function reglagesDefaut(design) { var r = {}; Object.keys(design.parts).forEach(function (c) { r[c] = parDefaut(); }); return r; }
  function pieceReglage(c) { return E.reglages[c] || (E.reglages[c] = parDefaut()); }
  function profilCourant() { return { pieces: E.reglages }; }
  function designAffiche() { return B().appliquerProfil(E.design, profilCourant()); }
  function photoAffichee() { return E.visage ? { url: E.visage.image || PB().urlVisage(E.nomCle, E.visage.v), visible: E.visage.visible !== false, x: E.visage.x, y: E.visage.y, k: E.visage.k, kx: E.visage.kx, ky: E.visage.ky, rot: E.visage.rot } : null; }
  function signature() { return JSON.stringify([E.reglages, E.visage ? [E.visage.visible, E.visage.x, E.visage.y, E.visage.k, E.visage.kx, E.visage.ky, E.visage.rot, E.visage.image ? 1 : E.visage.v] : null]); }
  function estDefaut() {
    var d = reglagesDefaut(E.design);
    return JSON.stringify(Object.keys(d).map(function (c) { var r = pieceReglage(c); return [r.visible, r.dx, r.dy, r.k, r.rot]; })) === JSON.stringify(Object.keys(d).map(function () { return [true, 0, 0, 1, 0]; })) && !E.visage;
  }

  /* ---------- géométrie de la scène (cadrage de la pile) ---------- */
  function versScene(el, ev, design) {
    var r = el.getBoundingClientRect(), cad = B().cadrage(design), s = cad.echelle;
    var sx = (ev.clientX - r.left) / r.width * W, sy = (ev.clientY - r.top) / r.height * H;
    return { x: W / 2 + (sx - W / 2) / s, y: H + (sy - H) / s - cad.decalage, echelle: s, largeurPx: r.width, hauteurPx: r.height };
  }
  function boiteDe(sel, design) {
    var b = B();
    if (sel === "visage") { var ph = photoAffichee(); if (!ph || ph.visible === false) return null; var v = b.boiteVisage(design, ph); return v ? { t: v.cy - v.ch / 2, b: v.cy + v.ch / 2, l: v.cx - v.cw / 2, r: v.cx + v.cw / 2 } : null; }
    var p = design.parts[sel], m = p && b.metaPiece(p.key);
    return p && m ? b.boitePiece(p, m) : null;
  }
  function placerCadre() {
    var cadre = racine.querySelector(".pbe-cadre"), pile = racine.querySelector(".itopod-badavatar-pile");
    if (cadre && cadre.parentNode) cadre.parentNode.removeChild(cadre);
    if (!pile || !E.sel) return;
    var bx = boiteDe(E.sel, designAffiche());
    if (!bx) return;
    var d = document.createElement("div"); d.className = "pbe-cadre";
    d.style.cssText = "left:" + arr((bx.l - 4) / W * 100) + "%;top:" + arr((bx.t - 4) / H * 100) + "%;width:" + arr((bx.r - bx.l + 8) / W * 100) + "%;height:" + arr((bx.b - bx.t + 8) / H * 100) + "%";
    if (E.sel) { var h = document.createElement("div"); h.className = "pbe-poignee"; h.setAttribute("data-poignee", "1"); h.setAttribute("aria-label", "Poignée de taille"); d.appendChild(h); }
    pile.appendChild(d);
  }

  /* ---------- rendu ---------- */
  function rendreScene() {
    var conteneur = racine.querySelector(".pbe-scene");
    if (!conteneur) return;
    conteneur.innerHTML = B().rendreHtml(designAffiche(), { photo: photoAffichee() });
    placerCadre();
  }
  function majScene() {
    var conteneur = racine.querySelector(".pbe-scene");
    if (!conteneur) return;
    var ok = B().miseAJour(conteneur.firstElementChild, designAffiche(), { photo: photoAffichee() });
    if (!ok) { rendreScene(); return; }
    placerCadre();
  }

  function ligneHtml(cle, nom, visible) {
    return '<div class="pbe-ligne' + (E.sel === cle ? " sel" : "") + '" data-ligne="' + esc(cle) + '"><label><input type="checkbox" data-visible="' + esc(cle) + '"' + (visible ? " checked" : "") + ' aria-label="Afficher : ' + esc(nom) + '"> ' + esc(nom) + '</label>' +
      '<button type="button" class="soreal-idle-expand-button-v25" data-regler="' + esc(cle) + '">Régler</button></div>';
  }
  function curseurHtml(nom, id, min, max, pas, val, unite) {
    return '<div class="pbe-curseur"><span>' + nom + '</span><button type="button" class="soreal-idle-expand-button-v25" data-pas="' + id + '" data-sens="-1" aria-label="' + nom + ' moins">−</button>' +
      '<input type="range" data-curseur="' + id + '" min="' + min + '" max="' + max + '" step="' + pas + '" value="' + val + '" aria-label="' + nom + '">' +
      '<button type="button" class="soreal-idle-expand-button-v25" data-pas="' + id + '" data-sens="1" aria-label="' + nom + ' plus">+</button></div>';
  }
  function reglageHtml() {
    if (!E.sel) return '<div class="pbe-note">Touche une pièce du badavatar (ou « Régler ») pour la déplacer en la glissant, changer sa taille ou la tourner.</div>';
    var b = B().bornes, visage = E.sel === "visage", v = visage ? E.visage : pieceReglage(E.sel);
    if (!v) return "";
    if (visage) {
      return '<div class="pbe-reglage"><b>Tête (visage personnalisé)</b>' +
        curseurHtml("Taille", "k", b.photoK[0], b.photoK[1], 0.01, v.k) + curseurHtml("Largeur", "kx", b.photoKx[0], b.photoKx[1], 0.01, v.kx) + curseurHtml("Hauteur", "ky", b.photoKy[0], b.photoKy[1], 0.01, v.ky) +
        '<label class="pbe-verrou"><input type="checkbox" data-verrou="1"' + (E.verrou ? " checked" : "") + '> Garder les proportions</label>' +
        curseurHtml("Position horizontale", "x", b.photoX[0], b.photoX[1], 0.005, v.x) + curseurHtml("Position verticale", "y", b.photoY[0], b.photoY[1], 0.005, v.y) +
        curseurHtml("Rotation", "rot", b.photoRot[0], b.photoRot[1], 0.5, v.rot) +
        '<button type="button" class="soreal-idle-expand-button-v25" data-remettre="1">Remettre à sa place</button></div>';
    }
    return '<div class="pbe-reglage"><b>' + esc(nomPiece(E.sel)) + '</b>' + curseurHtml("Taille", "k", b.k[0], b.k[1], 0.01, v.k) + curseurHtml("Rotation", "rot", b.rot[0], b.rot[1], 0.5, v.rot) +
      '<button type="button" class="soreal-idle-expand-button-v25" data-remettre="1">Remettre à sa place</button></div>';
  }
  /* Avec un visage : la tête d'abord (un élément à part entière), puis la liste des éléments à garder ou masquer. Sans visage : le bouton pour en ajouter (facultatif). */
  function visageBlocHtml() {
    return '<div class="pbe-visage pbe-visage-bloc"><div class="pbe-titre">Tête</div><div class="pbe-ligne' + (E.sel === "visage" ? " sel" : "") + '" data-ligne="visage"><label><input type="checkbox" data-visible="visage"' + (E.visage.visible !== false ? " checked" : "") + ' aria-label="Afficher : visage personnalisé"> Mon visage personnalisé</label><button type="button" class="soreal-idle-expand-button-v25" data-regler="visage">Régler</button></div>' +
      '<div class="pbe-actions"><button type="button" class="soreal-idle-expand-button-v25" data-act="visage">Changer le visage</button><button type="button" class="soreal-idle-expand-button-v25" data-act="retirer-visage">Retirer le visage</button></div>' +
      '<div class="pbe-note">Cette image sera visible par les autres joueurs.</div></div>';
  }
  function placerZone() {
    var zone = racine.querySelector(".pbe-zone");
    if (!zone) return;
    var ancre = E.visage && E.sel === "visage" ? racine.querySelector(".pbe-visage-bloc") : racine.querySelector(".pbe-liste");
    if (ancre && ancre.nextSibling !== zone) ancre.parentNode.insertBefore(zone, ancre.nextSibling);
  }
  function construire() {
    if (!E.pret) { racine.innerHTML = '<div class="pbe-note">' + esc(E.message || "Chargement…") + '</div>'; return; }
    var lignes = Object.keys(E.design.parts).map(function (c) { return ligneHtml(c, nomPiece(c), pieceReglage(c).visible !== false); }).join("");
    var avec = Boolean(E.visage);
    racine.innerHTML = '<div class="pbe"><div class="pbe-scene-col"><div class="pbe-scene" data-scene="1" aria-label="Aperçu de ton badavatar"></div>' +
      '<button type="button" class="soreal-idle-expand-button-v25 pbe-agrandir" data-act="plein">Agrandir l’aperçu</button>' +
      '<div class="pbe-plein-ctrl"><button type="button" class="soreal-idle-expand-button-v25" data-pas="k" data-sens="-1" aria-label="Taille moins">−</button><button type="button" class="soreal-idle-expand-button-v25" data-pas="k" data-sens="1" aria-label="Taille plus">+</button><button type="button" class="soreal-idle-expand-button-v25" data-act="plein">Fermer l’aperçu</button></div></div>' +
      '<div class="pbe-ctrl"><div class="pbe-note">Voici le badavatar qui t’a été désigné. Tu peux déplacer, agrandir, tourner ou masquer ses éléments ; tu ne peux pas en choisir d’autres.</div>' +
      (avec ? visageBlocHtml() + '<div class="pbe-titre">Éléments</div><div class="pbe-note">Coche les éléments que tu gardes, décoche ceux que tu masques. Tu peux aussi les placer et les redimensionner par-dessus la tête.</div>' : '') +
      '<div class="pbe-liste">' + lignes + '</div><div class="pbe-zone">' + reglageHtml() + '</div>' +
      (avec ? '' : '<div class="pbe-visage"><button type="button" class="soreal-idle-expand-button-v25" data-act="visage">Ajouter un visage (photo, personnage…)</button></div>') +
      '<input type="file" accept="image/*" data-fichier="1" style="display:none">' +
      '<div class="pbe-actions"><button type="button" class="soreal-idle-expand-button-v25" data-act="enregistrer"' + (E.occupe ? " disabled" : "") + '>Enregistrer</button>' +
      '<button type="button" class="soreal-idle-expand-button-v25" data-act="annuler">Annuler les changements</button>' +
      '<button type="button" class="soreal-idle-expand-button-v25" data-act="defaut">Revenir à mon badavatar désigné</button></div>' +
      '<div class="pbe-msg' + (E.messageType ? " " + E.messageType : "") + '" role="status" aria-live="polite">' + esc(E.message || "") + '</div></div></div>';
    placerZone();
    rendreScene();
  }
  function message(t, type) {
    E.message = t; E.messageType = type || "";
    var m = racine.querySelector(".pbe-msg");
    if (m) { m.textContent = t; m.className = "pbe-msg" + (type ? " " + type : ""); }
  }

  /* ---------- brouillon (règle n°6) ---------- */
  function sauverBrouillon() {
    clearTimeout(minuteurBrouillon);
    minuteurBrouillon = setTimeout(function () { try { localStorage.setItem(CLE_BROUILLON, JSON.stringify({ base: E.base, reglages: E.reglages })); } catch (_e) { /* pas de stockage */ } }, 400);
  }
  function effacerBrouillon() { clearTimeout(minuteurBrouillon); try { localStorage.removeItem(CLE_BROUILLON); } catch (_e) { /* pas de stockage */ } }
  function lireBrouillon() { try { var b = JSON.parse(localStorage.getItem(CLE_BROUILLON) || "null"); return b && b.base === E.base && b.reglages && typeof b.reglages === "object" ? b.reglages : null; } catch (_e) { return null; } }

  /* ---------- chargement ---------- */
  function appliquerEnregistre(rep) {
    var b = B(), p = rep && rep.profil && String(rep.profil.cat || "") === String(b.versionCatalogue) ? rep.profil : null;
    E.nom = rep.nom || ""; E.nomCle = rep.nomCle || "";
    E.base = (p && p.base) || E.nomCle || PB().cle(E.nom);
    E.design = b.tirerPourNom(E.base);
    E.reglages = reglagesDefaut(E.design);
    if (p && p.pieces) Object.keys(E.reglages).forEach(function (c) { if (p.pieces[c]) E.reglages[c] = b.reglagePiece(p, c); });
    E.visage = p && p.photo ? { v: p.photo.v, visible: p.photo.visible !== false, x: p.photo.x, y: p.photo.y, k: p.photo.k, kx: p.photo.kx == null ? 1 : p.photo.kx, ky: p.photo.ky == null ? 1 : p.photo.ky, rot: p.photo.rot } : null;
    E.verrou = !E.visage || E.visage.kx === E.visage.ky;
    E.enregistre = signature();
  }
  function charger() {
    E = { pret: false, message: "Chargement…", sel: null };
    PB().lire().then(function (rep) {
      if (!rep || rep.ok === false || !rep.nomCle) { E.message = rep && rep.message ? rep.message : "Ton badavatar n’est pas disponible pour l’instant."; construire(); return; }
      appliquerEnregistre(rep);
      var br = lireBrouillon();
      if (br) Object.keys(E.reglages).forEach(function (c) { if (br[c]) E.reglages[c] = Object.assign(parDefaut(), br[c]); });
      E.pret = true; E.message = ""; construire();
    });
    construire();
  }

  /* ---------- interactions ---------- */
  function choisir(cle) { E.sel = cle; refraichirControles(); }
  function boiteContient(bx, p, marge) { return bx && p.x >= bx.l - marge && p.x <= bx.r + marge && p.y >= bx.t - marge && p.y <= bx.b + marge; }
  function pieceSous(p, design) {
    var meilleur = null, aire = Infinity;
    Object.keys(design.parts).forEach(function (c) {
      var bx = boiteDe(c, design);
      if (!boiteContient(bx, p, 10)) return;
      var a = (bx.r - bx.l) * (bx.b - bx.t);
      if (a < aire) { aire = a; meilleur = c; }
    });
    if (!meilleur && E.visage) { var v = boiteDe("visage", design); if (boiteContient(v, p, 0)) meilleur = "visage"; }
    return meilleur;
  }
  function valeurSel() { return E.sel === "visage" ? E.visage : (E.sel ? pieceReglage(E.sel) : null); }

  var doigts = {}, pincement = null;
  function distanceDoigts() { var i = Object.keys(doigts); return i.length >= 2 ? Math.hypot(doigts[i[0]].x - doigts[i[1]].x, doigts[i[0]].y - doigts[i[1]].y) : 0; }
  /* Poignée de coin : la taille suit la distance du doigt au centre du cadre. */
  function redimensionner(ev) {
    var scene = racine.querySelector(".pbe-scene"), cadre = racine.querySelector(".pbe-cadre"), v = valeurSel();
    if (!scene || !cadre || !v) return;
    var r = cadre.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d0 = Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1, k0 = v.k;
    try { scene.setPointerCapture(ev.pointerId); } catch (_e) { /* pas de capture */ }
    ev.preventDefault();
    var libre = E.sel === "visage" && !E.verrou, dx0 = Math.max(8, Math.abs(ev.clientX - cx)), dy0 = Math.max(8, Math.abs(ev.clientY - cy)), kx0 = v.kx, ky0 = v.ky;
    function bouger(e) {
      if (libre) { v.kx = kx0 * Math.max(8, Math.abs(e.clientX - cx)) / dx0; v.ky = ky0 * Math.max(8, Math.abs(e.clientY - cy)) / dy0; normaliserVisage(v, "kx"); majScene(); majCurseurs(); sauverBrouillon(); return; }
      changerCurseur("k", k0 * Math.hypot(e.clientX - cx, e.clientY - cy) / d0); majCurseurs();
    }
    function fin(e) { scene.removeEventListener("pointermove", bouger); scene.removeEventListener("pointerup", fin); scene.removeEventListener("pointercancel", fin); try { scene.releasePointerCapture(e.pointerId); } catch (_e) { /* déjà relâché */ } }
    scene.addEventListener("pointermove", bouger); scene.addEventListener("pointerup", fin); scene.addEventListener("pointercancel", fin);
  }
  function glisser(ev) {
    var scene = racine.querySelector(".pbe-scene");
    if (!scene || (ev.button != null && ev.button > 0)) return;
    var design = designAffiche(), pt = versScene(scene.firstElementChild || scene, ev, design), c = pieceSous(pt, design);
    if (!c) return;
    if (c !== E.sel) { E.sel = c; refraichirControles(); }
    var v = valeurSel(), b = B().bornes, tete = B().corpsEntree(E.design), larg = tete ? tete[3] : 150;
    var depart = { cx: ev.clientX, cy: ev.clientY, v: Object.assign({}, v), s: pt.echelle, lp: pt.largeurPx, hp: pt.hauteurPx };
    try { scene.setPointerCapture(ev.pointerId); } catch (_e) { /* pas de capture */ }
    ev.preventDefault();
    function bouger(e) {
      if (doigts[e.pointerId]) doigts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pincement) { var cp = valeurSel(); if (cp) { changerCurseur("k", pincement.k0 * distanceDoigts() / pincement.d0); majCurseurs(); } return; }
      var dxs = (e.clientX - depart.cx) / depart.lp * W / depart.s, dys = (e.clientY - depart.cy) / depart.hp * H / depart.s, cible = valeurSel();
      if (!cible) return;
      if (E.sel === "visage") { cible.x = arr(borner(depart.v.x + dxs / larg, b.photoX), 4); cible.y = arr(borner(depart.v.y + dys / larg, b.photoY), 4); }
      else { cible.dx = arr(borner(depart.v.dx + dxs / W, b.dx), 4); cible.dy = arr(borner(depart.v.dy + dys / H, b.dy), 4); }
      majScene();
    }
    function fin(e) {
      scene.removeEventListener("pointermove", bouger); scene.removeEventListener("pointerup", fin); scene.removeEventListener("pointercancel", fin);
      try { scene.releasePointerCapture(e.pointerId); } catch (_e) { /* déjà relâché */ }
      sauverBrouillon();
    }
    scene.addEventListener("pointermove", bouger); scene.addEventListener("pointerup", fin); scene.addEventListener("pointercancel", fin);
  }

  function refraichirControles() {
    Array.prototype.forEach.call(racine.querySelectorAll("[data-ligne]"), function (l) { l.classList.toggle("sel", l.getAttribute("data-ligne") === E.sel); });
    var zone = racine.querySelector(".pbe-zone");
    if (zone) zone.innerHTML = reglageHtml();
    placerZone();
    placerCadre();
  }

  function majCurseurs() {
    var v = valeurSel();
    if (!v) return;
    Array.prototype.forEach.call(racine.querySelectorAll("[data-curseur]"), function (c) { var id = c.getAttribute("data-curseur"); if (v[id] !== undefined) c.value = v[id]; });
  }
  /* Le visage : k (taille), kx / ky (largeur et hauteur, multiplicateurs de k) ; k x kx et k x ky restent dans photoLimite (même garde-fou que le serveur). */
  function normaliserVisage(v, qui) {
    var b = B().bornes, lim = b.photoLimite;
    if (qui === "k") { var kmax = lim[1] / Math.max(v.kx, v.ky), kmin = lim[0] / Math.min(v.kx, v.ky); v.k = arr(Math.min(kmax, Math.max(kmin, v.k)), 3); }
    ["kx", "ky"].forEach(function (c) { var bb = c === "kx" ? b.photoKx : b.photoKy; v[c] = arr(Math.min(bb[1], lim[1] / v.k, Math.max(bb[0], lim[0] / v.k, v[c])), 3); });
  }
  function changerCurseur(id, valeur) {
    var v = valeurSel(), b = B().bornes;
    if (!v) return;
    var visage = E.sel === "visage";
    if (visage && (id === "kx" || id === "ky")) {
      v[id] = valeur; if (E.verrou) v[id === "kx" ? "ky" : "kx"] = valeur;
      normaliserVisage(v, id);
    } else if (id === "k") {
      v.k = arr(borner(valeur, visage ? b.photoK : b.k), 3);
      if (visage) normaliserVisage(v, "k");
    } else if (id === "x" && visage) v.x = arr(borner(valeur, b.photoX), 4);
    else if (id === "y" && visage) v.y = arr(borner(valeur, b.photoY), 4);
    else if (id === "rot") v.rot = arr(borner(valeur, visage ? b.photoRot : b.rot), 2);
    majScene(); sauverBrouillon();
  }

  function enregistrer() {
    if (E.occupe) return;
    var b = B();
    E.occupe = true; message("Enregistrement…");
    var pieces = {};
    Object.keys(E.design.parts).forEach(function (c) { var r = pieceReglage(c); pieces[c] = { visible: r.visible !== false, dx: r.dx, dy: r.dy, k: r.k, rot: r.rot }; });
    var photo = null;
    if (E.visage) photo = Object.assign({ visible: E.visage.visible !== false, x: E.visage.x, y: E.visage.y, k: E.visage.k, kx: E.visage.kx, ky: E.visage.ky, rot: E.visage.rot }, E.visage.image ? { image: E.visage.image } : { garder: true });
    var action = estDefaut() ? PB().reinitialiser() : PB().enregistrer(pieces, photo, b.versionCatalogue);
    action.then(function (r) {
      E.occupe = false;
      var bouton = racine.querySelector('[data-act="enregistrer"]'); if (bouton) bouton.disabled = false;
      if (r && r.ok) {
        PB().lire().then(function (rep) { if (rep && rep.ok) { var sel = E.sel; appliquerEnregistre(rep); E.sel = sel; E.pret = true; effacerBrouillon(); message("Enregistré : c’est ce que les autres joueurs verront.", "ok"); construire(); } });
        message("Enregistré : c’est ce que les autres joueurs verront.", "ok");
      } else message((r && r.message) || "L’enregistrement a échoué. Réessaie.", "err");
    });
  }

  function surClic(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var regler = t.closest("[data-regler]");
    if (regler) { choisir(regler.getAttribute("data-regler")); return; }
    var pas = t.closest("[data-pas]");
    if (pas) {
      var v = valeurSel(); if (!v) return;
      var id = pas.getAttribute("data-pas"), sens = Number(pas.getAttribute("data-sens"));
      changerCurseur(id, (id === "k" || id === "kx" || id === "ky") ? v[id] * (sens > 0 ? 1.08 : 1 / 1.08) : (id === "x" || id === "y") ? v[id] + sens * 0.02 : v.rot + sens * 1);
      majCurseurs();
      return;
    }
    if (t.closest("[data-remettre]")) {
      var w = valeurSel(); if (!w) return;
      if (E.sel === "visage") { w.x = 0; w.y = 0; w.k = 1; w.kx = 1; w.ky = 1; w.rot = 0; } else { w.dx = 0; w.dy = 0; w.k = 1; w.rot = 0; }
      construire(); sauverBrouillon(); return;
    }
    var act = t.closest("[data-act]");
    if (!act) return;
    var a = act.getAttribute("data-act");
    if (a === "plein") { racine.classList.toggle("pbe-plein"); placerCadre(); return; }
    if (a === "enregistrer") enregistrer();
    else if (a === "annuler") { charger(); }
    else if (a === "defaut") { E.reglages = reglagesDefaut(E.design); E.visage = null; E.sel = null; construire(); sauverBrouillon(); message("Badavatar désigné rétabli. Clique sur Enregistrer pour le garder.", ""); }
    else if (a === "visage") { var f = racine.querySelector('[data-fichier]'); if (f) { f.value = ""; f.click(); } }
    else if (a === "retirer-visage") { E.visage = null; if (E.sel === "visage") E.sel = null; construire(); message("Visage retiré. Clique sur Enregistrer pour le garder.", ""); }
  }
  function surChangement(ev) {
    var t = ev.target;
    if (t.matches && t.matches("[data-verrou]")) {
      E.verrou = t.checked;
      if (E.verrou && E.visage) { E.visage.ky = E.visage.kx; normaliserVisage(E.visage, "kx"); majScene(); majCurseurs(); sauverBrouillon(); }
    } else if (t.matches && t.matches("[data-visible]")) {
      var c = t.getAttribute("data-visible");
      if (c === "visage") { if (E.visage) E.visage.visible = t.checked; } else pieceReglage(c).visible = t.checked;
      majScene(); sauverBrouillon();
    } else if (t.matches && t.matches("[data-fichier]") && t.files && t.files[0]) {
      var visage = window.__SOREAL_IDLE_PROFIL_VISAGE_V1__;
      if (!visage) { message("Le détourage n’est pas disponible.", "err"); return; }
      visage.ouvrir(t.files[0]).then(function (r) {
        if (!r) return;
        E.visage = { image: r.image, visible: true, x: 0, y: 0, k: 1, kx: 1, ky: 1, rot: 0 }; E.verrou = true; E.sel = "visage";
        construire(); message("Visage ajouté. Règle-le puis clique sur Enregistrer.", "");
      });
    }
  }
  function surEntree(ev) {
    var t = ev.target;
    if (t.matches && t.matches("[data-curseur]")) changerCurseur(t.getAttribute("data-curseur"), Number(t.value));
  }

  function creerRacine() {
    racine = document.createElement("div");
    racine.setAttribute("data-profil-badavatar-editeur", "1");
    if (!document.getElementById("pbeStyleV1")) { var st = document.createElement("style"); st.id = "pbeStyleV1"; st.textContent = STYLE; document.head.appendChild(st); }
    racine.addEventListener("click", surClic);
    racine.addEventListener("change", surChangement);
    racine.addEventListener("input", surEntree);
    racine.addEventListener("pointerdown", function (ev) {
      if (!ev.target.closest) return;
      if (ev.target.closest("[data-poignee]")) { redimensionner(ev); return; }
      if (!ev.target.closest(".pbe-scene")) return;
      doigts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (Object.keys(doigts).length >= 2 && valeurSel()) { pincement = { d0: distanceDoigts() || 1, k0: valeurSel().k }; ev.preventDefault(); return; }
      glisser(ev);
    });
    function relacher(ev) { delete doigts[ev.pointerId]; if (Object.keys(doigts).length < 2) pincement = null; }
    racine.addEventListener("pointerup", relacher); racine.addEventListener("pointercancel", relacher);
    /* Molette sur l'aperçu : taille de la pièce sélectionnée (le visage s'il n'y en a pas). */
    racine.addEventListener("wheel", function (ev) {
      if (!ev.target.closest || !ev.target.closest(".pbe-scene") || !E || !E.pret) return;
      if (!E.sel && E.visage) { E.sel = "visage"; refraichirControles(); }
      if (!valeurSel()) return;
      ev.preventDefault(); changerCurseur("k", valeurSel().k * Math.exp(-ev.deltaY * 0.0015)); majCurseurs();
    }, { passive: false });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && racine.classList.contains("pbe-plein")) { racine.classList.remove("pbe-plein"); placerCadre(); } });
    charger();
  }

  /* Rattache l'éditeur persistant à l'emplacement de la page (Réglages > Profil). Sans emplacement : rien. */
  function monter() {
    var place = document.getElementById("profilBadavEditeurV1");
    if (!place) return;
    if (!racine) { if (!B() || !PB()) return; creerRacine(); }
    if (racine.parentNode !== place) place.appendChild(racine);
  }
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__ = window.__SOREAL_IDLE_APRES_REDESSIN_V1__ || []).push(monter);

  window.__SOREAL_IDLE_PROFIL_EDITEUR_V1__ = { monter: monter, emplacementHtml: function () { return '<div id="profilBadavEditeurV1"></div>'; }, etat: function () { return E; } };
})();
