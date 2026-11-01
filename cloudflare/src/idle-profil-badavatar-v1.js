/*
 * SOREAL IDLE — profil de badavatar d'un joueur (Norman, 2026-11-01 : « dans Réglages, on a Profil : on voit le badavatar qui nous a été désigné, on peut modifier
 * l'emplacement et la taille des éléments mais pas en choisir d'autres, on clique sur Enregistrer et c'est celui que tout le monde verra »).
 *
 * DONNÉE PARTAGÉE (visible des autres joueurs dans l'ITOPOD) : elle vit côté serveur, dans une table à part, comme le chat et les profils (idle-profile-v1.js), et NON dans l'état du jeu :
 * le jeu local (règle n°7) ne la voit jamais, aucune opération de jeu n'est ajoutée (IDLE_OPERATIONS et le contrat du protocole ne changent pas). Routes : voir idle-worker-entry-v1.js.
 *
 * Le badavatar « désigné » est celui que tire le client pour le nom du joueur (itopod-badavatars-v1.js, tirerPourNom) : le corps est donc IMPOSÉ, jamais stocké comme un choix. Le profil ne
 * porte que des RÉGLAGES RELATIFS à ce badavatar : par pièce { visible, dx, dy, k, rot } (décalage en fraction de la scène, multiplicateur de taille, rotation en degrés) et, en option, un visage
 * personnalisé (image détournée réduite, placée par rapport à la tête). Le serveur ne connaît pas le catalogue : il refuse toute pièce hors de la liste fixe ci-dessous et borne chaque nombre.
 * `base` = nom d'après lequel le badavatar a été tiré au premier enregistrement (fixé par le SERVEUR, jamais par le client) : un changement de pseudo ne change pas le visage du joueur.
 */
import { sqlRows } from "./core/sqlite-core.js";

export const IDLE_BADAVATAR_PIECES_V1 = Object.freeze(["Cheveux", "Yeux", "Oreille_Gauche", "Oreille_Droite", "Nez", "Bouche", "Barbe"]);
/* Bornes (fractions de la scène 480 x 640 ; la tête fait environ 0,3 de large) : une pièce reste dans les environs de la tête. */
export const IDLE_BADAVATAR_BORNES_V1 = Object.freeze({
  /* position : toute la scène (Norman, 2026-11-01) ; le rendu garde le centre de la pièce dans la zone visible */
  dx: [-0.5, 0.5],
  dy: [-0.5, 0.5],
  k: [0.3, 4],
  /* rotation complète (Norman, 2026-11-01) : valeur affichée de −180 à +180 degrés */
  rot: [-180, 180],
  /* ordre d'empilement relatif à l'ordre d'origine du badavatar désigné (0 = inchangé), entier */
  z: [-20, 20],
  /* visage : décalage par rapport au centre de la tête, en largeurs de tête */
  photoX: [-4, 4],
  photoY: [-4, 6],
  photoK: [0.3, 4],
  /* étirement séparé en largeur (kx) et en hauteur (ky) : multiplicateurs de k ; k x kx et k x ky restent dans photoLimite (taille réelle de chaque côté) */
  photoKx: [0.4, 2.5],
  photoKy: [0.4, 2.5],
  photoLimite: [0.3, 4],
  photoRot: [-180, 180]
});
/* Visage personnalisé : au plus 100 000 caractères d'image en base 64 (environ 75 Ko, 384 px de côté), webp ou png. */
export const IDLE_BADAVATAR_PHOTO_MAX_V1 = 100000;
export const IDLE_BADAVATAR_CORPS_MAX_V1 = 120000;

const nombre = (v, [min, max], defaut) => {
  const n = typeof v === "number" ? v : Number.NaN;
  if (!Number.isFinite(n)) return defaut;
  return Math.round(Math.min(max, Math.max(min, n)) * 10000) / 10000;
};
const horsBornes = (v, [min, max]) => typeof v !== "number" || !Number.isFinite(v) || v < min || v > max;
/* z : absent = 0 (anciens profils) ; sinon un entier dans les bornes (refusé sinon, jamais corrigé en silence). */
const zHorsBornes = (v) => v !== undefined && (!Number.isInteger(v) || v < IDLE_BADAVATAR_BORNES_V1.z[0] || v > IDLE_BADAVATAR_BORNES_V1.z[1]);

/* Même normalisation que itopod-badavatars-v1.js (nomNormalise) : minuscules, sans accents, espaces simples. */
export function idleBadavatarCleNomV1(nom) {
  return String(nom == null ? "" : nom).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
}

/* Réglages de pièces envoyés par le client -> { ok, pieces } ou { ok:false, code }. Une valeur hors bornes est REFUSÉE (pas corrigée en silence) : le client borne lui-même. */
export function idleBadavatarValiderPiecesV1(brut) {
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return { ok: false, code: "BADAVATAR_PIECES" };
  const pieces = {};
  for (const cle of Object.keys(brut)) {
    if (!IDLE_BADAVATAR_PIECES_V1.includes(cle)) return { ok: false, code: "BADAVATAR_PIECE_INCONNUE" };
    const p = brut[cle];
    if (!p || typeof p !== "object" || Array.isArray(p)) return { ok: false, code: "BADAVATAR_PIECE" };
    if (typeof p.visible !== "boolean") return { ok: false, code: "BADAVATAR_VISIBLE" };
    if (horsBornes(p.dx, IDLE_BADAVATAR_BORNES_V1.dx) || horsBornes(p.dy, IDLE_BADAVATAR_BORNES_V1.dy) || horsBornes(p.k, IDLE_BADAVATAR_BORNES_V1.k) || horsBornes(p.rot, IDLE_BADAVATAR_BORNES_V1.rot)) {
      return { ok: false, code: "BADAVATAR_BORNES" };
    }
    if (zHorsBornes(p.z)) return { ok: false, code: "BADAVATAR_BORNES" };
    pieces[cle] = { visible: p.visible, z: p.z === undefined ? 0 : p.z, dx: nombre(p.dx, IDLE_BADAVATAR_BORNES_V1.dx, 0), dy: nombre(p.dy, IDLE_BADAVATAR_BORNES_V1.dy, 0), k: nombre(p.k, IDLE_BADAVATAR_BORNES_V1.k, 1), rot: nombre(p.rot, IDLE_BADAVATAR_BORNES_V1.rot, 0) };
  }
  return { ok: true, pieces };
}

/* « data:image/webp;base64,... » ou « data:image/png;base64,... » : forme, taille et signature du fichier (jamais de HTML, jamais de SVG). */
export function idleBadavatarValiderImageV1(texte) {
  const t = String(texte == null ? "" : texte);
  if (t.length > IDLE_BADAVATAR_PHOTO_MAX_V1) return { ok: false, code: "BADAVATAR_PHOTO_GROSSE" };
  const m = /^data:image\/(webp|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(t);
  if (!m || m[2].length < 64 || m[2].length % 4 !== 0) return { ok: false, code: "BADAVATAR_PHOTO_TYPE" };
  let tete = "";
  try { tete = atob(m[2].slice(0, 24)); } catch (_e) { return { ok: false, code: "BADAVATAR_PHOTO_TYPE" }; }
  const png = tete.startsWith("\x89PNG\r\n\x1a\n");
  const webp = tete.startsWith("RIFF") && tete.slice(8, 12) === "WEBP";
  if ((m[1] === "png" && !png) || (m[1] === "webp" && !webp)) return { ok: false, code: "BADAVATAR_PHOTO_TYPE" };
  return { ok: true, type: m[1], image: t };
}

/* Placement du visage : { visible, x, y, k, rot } et, en option, kx / ky (1 par défaut : anciens profils inchangés). */
export function idleBadavatarValiderPlacementPhotoV1(p) {
  if (!p || typeof p !== "object" || Array.isArray(p) || typeof p.visible !== "boolean") return { ok: false, code: "BADAVATAR_PHOTO_PLACEMENT" };
  const B = IDLE_BADAVATAR_BORNES_V1;
  if (horsBornes(p.x, B.photoX) || horsBornes(p.y, B.photoY) || horsBornes(p.k, B.photoK) || horsBornes(p.rot, B.photoRot)) return { ok: false, code: "BADAVATAR_BORNES" };
  const kx = p.kx === undefined ? 1 : p.kx, ky = p.ky === undefined ? 1 : p.ky;
  if (horsBornes(kx, B.photoKx) || horsBornes(ky, B.photoKy) || zHorsBornes(p.z)) return { ok: false, code: "BADAVATAR_BORNES" };
  /* garde-fou : la taille réelle de chaque côté (k x kx, k x ky) reste dans la plage, sinon la tête sortirait de la scène ou disparaîtrait */
  if (horsBornes(p.k * kx, B.photoLimite) || horsBornes(p.k * ky, B.photoLimite)) return { ok: false, code: "BADAVATAR_BORNES" };
  return { ok: true, placement: { visible: p.visible, x: nombre(p.x, B.photoX, 0), y: nombre(p.y, B.photoY, 0), k: nombre(p.k, B.photoK, 1), kx: nombre(kx, B.photoKx, 1), ky: nombre(ky, B.photoKy, 1), rot: nombre(p.rot, B.photoRot, 0), z: p.z === undefined ? 0 : p.z } };
}

const TABLES_PRETES_V1 = new WeakSet();
export function idleBadavatarAssurerTableV1(sql) {
  if (sql && typeof sql === "object" && TABLES_PRETES_V1.has(sql)) return;
  sql.exec("CREATE TABLE IF NOT EXISTS idle_badavatar_profils(email TEXT PRIMARY KEY, nom_cle TEXT NOT NULL, base TEXT NOT NULL, cat TEXT NOT NULL DEFAULT '', pieces TEXT NOT NULL DEFAULT '{}', photo TEXT NOT NULL DEFAULT '', photo_placement TEXT NOT NULL DEFAULT '', maj INTEGER NOT NULL)");
  sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_badavatar_nom ON idle_badavatar_profils(nom_cle)");
  if (sql && typeof sql === "object") TABLES_PRETES_V1.add(sql);
}

const json = (t, defaut) => { try { const v = JSON.parse(t); return v && typeof v === "object" ? v : defaut; } catch (_e) { return defaut; } };

function ligneVersProfil(l, avecImage) {
  const placement = json(l.photo_placement, null);
  const aPhoto = Boolean(l.photo) && placement;
  return {
    base: String(l.base), cat: String(l.cat || ""), nomCle: String(l.nom_cle), pieces: json(l.pieces, {}),
    photo: aPhoto ? Object.assign({ v: Number(l.maj) || 0 }, placement, avecImage ? { image: String(l.photo) } : {}) : null,
    maj: Number(l.maj) || 0
  };
}

export function idleBadavatarLireV1(sql, email) {
  idleBadavatarAssurerTableV1(sql);
  const l = sqlRows(sql.exec("SELECT email,nom_cle,base,cat,pieces,photo,photo_placement,maj FROM idle_badavatar_profils WHERE email=?", String(email || "").toLowerCase()))[0];
  return l ? ligneVersProfil(l, false) : null;
}

/*
 * Enregistre le profil d'un joueur. `entree` = { pieces, photo, cat } ; `photo` : absent/null = pas de visage personnalisé ; { garder:true, …placement } = garder l'image déjà enregistrée ;
 * { image, …placement } = nouvelle image. `nomCle` = nom actuel du joueur pour le roster (calculé par le serveur) : `base` n'est fixé qu'au premier enregistrement.
 */
export function idleBadavatarEnregistrerV1(sql, email, nomCle, entree, maintenant = Date.now()) {
  const cle = String(email || "").trim().toLowerCase();
  if (!cle || !nomCle) return { ok: false, code: "BADAVATAR_COMPTE", message: "Compte introuvable." };
  if (!entree || typeof entree !== "object") return { ok: false, code: "BADAVATAR_CORPS", message: "Profil invalide." };
  const pieces = idleBadavatarValiderPiecesV1(entree.pieces);
  if (!pieces.ok) return { ok: false, code: pieces.code, message: "Profil refusé : une valeur est hors des limites." };
  const cat = String(entree.cat == null ? "" : entree.cat).slice(0, 16);
  if (!/^[0-9A-Za-z._-]{0,16}$/.test(cat)) return { ok: false, code: "BADAVATAR_CAT", message: "Profil invalide." };
  idleBadavatarAssurerTableV1(sql);
  const ancien = sqlRows(sql.exec("SELECT base,photo FROM idle_badavatar_profils WHERE email=?", cle))[0];
  let image = "";
  let placement = "";
  if (entree.photo) {
    const pl = idleBadavatarValiderPlacementPhotoV1(entree.photo);
    if (!pl.ok) return { ok: false, code: pl.code, message: "Le visage est hors des limites." };
    if (entree.photo.garder === true) {
      if (!ancien || !ancien.photo) return { ok: false, code: "BADAVATAR_PHOTO_ABSENTE", message: "Aucune image enregistrée à garder." };
      image = String(ancien.photo);
    } else {
      const im = idleBadavatarValiderImageV1(entree.photo.image);
      if (!im.ok) return { ok: false, code: im.code, message: im.code === "BADAVATAR_PHOTO_GROSSE" ? "L’image est trop lourde." : "L’image doit être au format webp ou png." };
      image = im.image;
    }
    placement = JSON.stringify(pl.placement);
  }
  const base = ancien && ancien.base ? String(ancien.base) : nomCle;
  sql.exec("INSERT INTO idle_badavatar_profils(email,nom_cle,base,cat,pieces,photo,photo_placement,maj) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET nom_cle=excluded.nom_cle,base=excluded.base,cat=excluded.cat,pieces=excluded.pieces,photo=excluded.photo,photo_placement=excluded.photo_placement,maj=excluded.maj",
    cle, nomCle, base, cat, JSON.stringify(pieces.pieces), image, placement, maintenant);
  return { ok: true, profil: idleBadavatarLireV1(sql, cle) };
}

/*
 * Migration (Norman, 2026-11-01, « le badavatar du Profil n'est pas celui de l'ITOPOD ») : `base` fixée à partir d'un nom qui n'était pas celui du roster. Tant que le joueur n'a rien personnalisé (aucune pièce
 * déplacée, masquée ou redimensionnée, aucun visage), `base` suit le nom du roster ; sinon sa base est gardée. La clé publique (nom_cle) suit TOUJOURS le nom du roster : c'est elle que l'ITOPOD cherche.
 * Renvoie true si une ligne a changé.
 */
export function idleBadavatarProfilParDefautV1(l) {
  if (l.photo || (l.photo_placement && String(l.photo_placement) !== "")) return false;
  const pieces = json(l.pieces, {});
  return Object.keys(pieces).every((c) => {
    const p = pieces[c] || {};
    return p.visible !== false && !(Number(p.dx) || 0) && !(Number(p.dy) || 0) && !(Number(p.z) || 0) && (p.k == null || Number(p.k) === 1) && !(Number(p.rot) || 0);
  });
}
export function idleBadavatarMigrerNomV1(sql, email, nomCle) {
  const cle = String(email || "").trim().toLowerCase();
  if (!cle || !nomCle) return false;
  idleBadavatarAssurerTableV1(sql);
  const l = sqlRows(sql.exec("SELECT nom_cle,base,pieces,photo,photo_placement FROM idle_badavatar_profils WHERE email=?", cle))[0];
  if (!l) return false;
  const base = idleBadavatarProfilParDefautV1(l) ? nomCle : String(l.base);
  if (base === String(l.base) && nomCle === String(l.nom_cle)) return false;
  sql.exec("UPDATE idle_badavatar_profils SET nom_cle=?,base=? WHERE email=?", nomCle, base, cle);
  return true;
}

/* Retour au badavatar désigné (le joueur) ; l'administrateur peut aussi le faire pour un nom (idleBadavatarReinitialiserParNomV1). */
export function idleBadavatarReinitialiserV1(sql, email) {
  idleBadavatarAssurerTableV1(sql);
  sql.exec("DELETE FROM idle_badavatar_profils WHERE email=?", String(email || "").trim().toLowerCase());
  return { ok: true };
}
export function idleBadavatarReinitialiserParNomV1(sql, nom) {
  idleBadavatarAssurerTableV1(sql);
  const cle = idleBadavatarCleNomV1(nom);
  if (!cle) return { ok: false, code: "BADAVATAR_NOM", message: "Nom manquant." };
  const avant = sqlRows(sql.exec("SELECT COUNT(*) AS n FROM idle_badavatar_profils WHERE nom_cle=?", cle))[0];
  sql.exec("DELETE FROM idle_badavatar_profils WHERE nom_cle=?", cle);
  return { ok: true, supprimes: Number(avant && avant.n) || 0 };
}

/* Liste PUBLIQUE pour l'affichage chez les autres : { nomCle: { base, cat, pieces, photo:{v,visible,x,y,k,rot}|null } }, sans image ni adresse e-mail. */
export function idleBadavatarListePubliqueV1(sql) {
  idleBadavatarAssurerTableV1(sql);
  const sortie = {};
  for (const l of sqlRows(sql.exec("SELECT email,nom_cle,base,cat,pieces,photo,photo_placement,maj FROM idle_badavatar_profils ORDER BY nom_cle"))) {
    const p = ligneVersProfil(l, false);
    sortie[p.nomCle] = { base: p.base, cat: p.cat, pieces: p.pieces, photo: p.photo };
  }
  return sortie;
}

/* Image du visage d'un nom (octets), ou null. */
export function idleBadavatarPhotoV1(sql, nomCle) {
  idleBadavatarAssurerTableV1(sql);
  const l = sqlRows(sql.exec("SELECT photo FROM idle_badavatar_profils WHERE nom_cle=? AND photo<>'' LIMIT 1", idleBadavatarCleNomV1(nomCle)))[0];
  if (!l) return null;
  const m = /^data:image\/(webp|png);base64,(.+)$/.exec(String(l.photo));
  if (!m) return null;
  const bin = atob(m[2]);
  const octets = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) octets[i] = bin.charCodeAt(i);
  return { type: "image/" + m[1], octets };
}
