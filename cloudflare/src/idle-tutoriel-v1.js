/*
 * Tutoriel éditable (Norman, 2026-10-14 : « recommencer complètement le tutoriel, changer les textes et les popups qui se déplacent, sans avoir besoin de toi »).
 * Même principe que les histoires plein écran (idle-histoires-v1.js) : stockage dans la base SQLite du Durable Object (table idle_tutoriel), jamais dans le code ;
 * l'administrateur crée et modifie les guides depuis le menu Admin (modules/admin-tutoriel-v1.js), sans redéploiement.
 *
 * Un GUIDE = { id, titre, declencheur, actif, ordre, vuId, etapes[] }.
 *  - declencheur : { type:"debut" }                  jouée à l'arrivée d'un NOUVEAU joueur ;
 *                  { type:"menu", menu:"<id>" }      jouée à la première ouverture de ce menu ;
 *                  { type:"boss", boss:N }           jouée quand le boss N vient d'être vaincu (comme les histoires).
 *  - etape : { titre, texte, menu, cible, placement, surbrillance }
 *      menu        : menu où l'étape se déroule (le jeu s'y rend tout seul), "" = là où se trouve le joueur ;
 *      cible       : null (fenêtre centrée) ou { selecteur, libelle } : l'élément de l'écran montré, choisi dans le jeu par « Placer sur l'écran » ;
 *      placement   : auto | haut | bas | gauche | droite | centre ;
 *      surbrillance: un cadre lumineux entoure la cible ;
 *      attendreVoix: vrai (défaut) = sur une étape qui demande un clic, la cible reste bloquée tant que la voix parle ; faux = on peut cliquer dès l'affichage de l'étape (Norman, 2026-10-27) ;
 *      avanceAuClic: l'étape passe à la suivante quand le joueur CLIQUE sur la cible (le bouton « Suivant » est alors masqué 30 s, puis revient pour ne jamais bloquer ; sans cible, ignoré).
 * afficher (guide) : faux = RIEN à l'écran (ni fenêtre, ni enceinte réduite, ni texte) : seule la voix parle, le cadre lumineux de la cible reste (case « cadre lumineux » de l'étape), et l'étape avance au clic sur la cible (avanceAuClic) ou, sans clic demandé, quand la voix a fini (Norman, 2026-10-27).
 * mascotte (guide) : vrai = la mascotte CTHULHU présente le guide à côté de la fenêtre (Norman, 2026-11-04) ; faux par défaut : elle n'apparaît nulle part tant que l'administrateur n'a pas créé et activé une apparition ;
 * humeur (étape) : normal | content | pense | coucou | surpris | vole | dos | arrive | grand | repart.
 * Mémoire « vu » : profil.stats.vus (marquerVusSorealIdle), identifiant propre à chaque guide (vuId) ; réglage « ancien tutoriel » (meta) : tant qu'il est actif,
 * les anciennes fenêtres de Norman & Sébastien et les popups de première ouverture de menu restent jouées ; le désactiver les remplace par ces guides.
 */
import { sqlRows, safeJson } from "./core/sqlite-core.js";

export const IDLE_TUTO_ID_RE_V1 = /^[A-Za-z0-9_-]{1,60}$/;
export const IDLE_TUTO_MENU_RE_V1 = /^[A-Za-z0-9_-]{1,40}$/;
/* Un sélecteur CSS ordinaire : lettres, chiffres, # . : > + ~ , = " ' [ ] ( ) - _ * ^ $ | @ et espaces. Jamais de balise, de script ni de barre oblique inverse. */
export const IDLE_TUTO_SELECTEUR_RE_V1 = /^[A-Za-z0-9 _#.:>+~,="'\[\]()*^$|@-]{1,400}$/;
export const IDLE_TUTO_PLACEMENTS_V1 = Object.freeze(["auto", "haut", "bas", "gauche", "droite", "centre"]);
export const IDLE_TUTO_MAX_ETAPES_V1 = 40;
/* Humeurs de la mascotte Cthulhu (modules/cthulhu-v1.js) : une étape peut en choisir une ; vide = « normal ». */
export const IDLE_TUTO_HUMEURS_V1 = Object.freeze(["normal", "content", "pense", "coucou", "surpris", "vole", "dos", "arrive", "grand", "repart"]);
export const IDLE_TUTO_MAX_GUIDES_V1 = 200;
/* Scènes de vol de Cthulhu (modules/cthulhu-scene-v1.js) : une étape peut en choisir une ; « mascotteSur » = sélecteur CSS de sa place finale (vide = le bouton Nuke, sinon Fight). */
export const IDLE_TUTO_SCENES_V1 = Object.freeze(["", "arrivee", "retourne", "pose", "place"]);
function scenePlace(v) {
  const t = String(v == null ? "" : v).trim();
  return t && IDLE_TUTO_SELECTEUR_RE_V1.test(t) ? t : "";
}
const MAX_TEXTE = 1500;
const BOSS_MAX = 999;

function texteNettoye(valeur, max) {
  return String(valeur == null ? "" : valeur).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

export function normaliserGuideV1(brut) {
  const g = brut && typeof brut === "object" ? brut : {};
  const id = String(g.id == null ? "" : g.id).trim();
  if (!IDLE_TUTO_ID_RE_V1.test(id)) throw new Error("TUTO_ID_INVALIDE");
  const titre = texteNettoye(g.titre, 80);
  if (!titre) throw new Error("TUTO_TITRE_REQUIS");
  const d = g.declencheur && typeof g.declencheur === "object" ? g.declencheur : {};
  const type = String(d.type || "");
  let declencheur;
  if (type === "debut") declencheur = { type: "debut" };
  else if (type === "menu") {
    const menu = String(d.menu || "").trim();
    if (!IDLE_TUTO_MENU_RE_V1.test(menu)) throw new Error("TUTO_MENU_INVALIDE");
    declencheur = { type: "menu", menu };
  } else if (type === "boss") {
    const boss = Math.floor(Number(d.boss));
    if (!Number.isFinite(boss) || boss < 1 || boss > BOSS_MAX) throw new Error("TUTO_BOSS_INVALIDE");
    declencheur = { type: "boss", boss };
  } else throw new Error("TUTO_DECLENCHEUR_INVALIDE");
  const brutes = Array.isArray(g.etapes) ? g.etapes : [];
  if (!brutes.length) throw new Error("TUTO_ETAPES_REQUISES");
  if (brutes.length > IDLE_TUTO_MAX_ETAPES_V1) throw new Error("TUTO_TROP_D_ETAPES");
  const etapes = brutes.map((e) => {
    const etape = e && typeof e === "object" ? e : {};
    const menu = String(etape.menu == null ? "" : etape.menu).trim();
    if (menu && !IDLE_TUTO_MENU_RE_V1.test(menu)) throw new Error("TUTO_MENU_INVALIDE");
    let cible = null;
    if (etape.cible && typeof etape.cible === "object") {
      const selecteur = String(etape.cible.selecteur == null ? "" : etape.cible.selecteur).trim();
      if (selecteur) {
        if (!IDLE_TUTO_SELECTEUR_RE_V1.test(selecteur)) throw new Error("TUTO_SELECTEUR_INVALIDE");
        cible = { selecteur, libelle: texteNettoye(etape.cible.libelle, 120) };
      }
    }
    const placement = IDLE_TUTO_PLACEMENTS_V1.includes(String(etape.placement)) ? String(etape.placement) : "auto";
    return { humeur: IDLE_TUTO_HUMEURS_V1.includes(String(etape.humeur)) ? String(etape.humeur) : "", titre: texteNettoye(etape.titre, 80), texte: texteNettoye(etape.texte, MAX_TEXTE), menu, cible, placement, surbrillance: etape.surbrillance !== false, avanceAuClic: etape.avanceAuClic === true && Boolean(cible), attendreVoix: etape.attendreVoix !== false, scene: IDLE_TUTO_SCENES_V1.includes(String(etape.scene)) ? String(etape.scene) : "", mascotteSur: scenePlace(etape.mascotteSur), clignote: etape.clignote === true && Boolean(cible), clignoteAussi: scenePlace(etape.clignoteAussi), attendreVictoire: etape.attendreVictoire === true };
  });
  if (!etapes.some((e) => e.texte || e.titre)) throw new Error("TUTO_ETAPES_VIDES");
  const vuBrut = String(g.vuId == null ? "" : g.vuId).trim();
  const vuId = vuBrut && vuBrut.length <= 80 && /^[A-Za-z0-9_:.-]+$/.test(vuBrut) ? vuBrut : "tuto:" + id;
  const ordre = Number.isFinite(Number(g.ordre)) ? Math.max(-9999, Math.min(9999, Math.floor(Number(g.ordre)))) : 0;
  return { id, titre, declencheur, actif: g.actif !== false, afficher: g.afficher !== false, mascotte: g.mascotte === true, ordre, vuId, etapes };
}


/* Guides d'amorçage SUPPRIMÉS (Norman, 2026-11-04) : plus aucun guide n'est créé d'office (l'ancien tutoriel de Norman & Sébastien et le nouveau, court, n'existent plus). */
export const IDLE_TUTORIEL_SEED_V1 = [];

/*
 * Guide de départ de Lhu (Norman, 2026-11-07), créé UNE fois (clé seed_lhu_v1) : modifiable ensuite dans l'Admin (textes, voix, scènes), le supprimer ne le recrée pas.
 * Étape 1 : arrivée en vol, « ??? », zoom, présentation. Étape 2 : demi-tour, vol de dos, posé sur le bouton Nuke ; la partie ne continue qu'au clic sur Fight.
 */
export const IDLE_TUTORIEL_LHU_V1 = Object.freeze({
  id: "lhu-debut", titre: "Lhu : le premier combat", declencheur: { type: "debut" }, actif: true, afficher: true, mascotte: true, ordre: -100,
  etapes: [
    { humeur: "normal", titre: "Lhu", scene: "arrivee", menu: "combat", placement: "auto", attendreVoix: false, texte: "Oh... un nouvel arrivant. Salut, moi c'est Lhu, pour faire court." },
    { humeur: "normal", titre: "Lhu", placement: "auto", attendreVoix: false, texte: "Mon vrai nom te demanderait de te mâcher la langue avant de l'avaler pour pouvoir le prononcer." },
    { humeur: "normal", titre: "Lhu", placement: "auto", attendreVoix: false, texte: "Je vais t'apprendre à te battre." },
    { humeur: "normal", titre: "Lhu", scene: "retourne", placement: "auto", attendreVoix: false, texte: "Tu vois ce petit bout de peluche ? Pète-lui la gueule !" },
    { humeur: "normal", titre: "Lhu", menu: "combat", scene: "pose", placement: "auto", surbrillance: false, avanceAuClic: true,
      cible: { selecteur: "#sorealIdleBossStartV100", libelle: "Le bouton Fight" },
      texte: "Appuie sur le gros bouton rouge." },
    { humeur: "normal", titre: "Lhu", menu: "combat", placement: "auto", attendreVoix: false, texte: "Ah oui... tu es plus nul que ce que j'imaginais." },
    { humeur: "normal", titre: "Lhu", menu: "combat", placement: "auto", attendreVoix: false, texte: "Mais c'est pas grave. Tu es tombé sur le meilleur entraîneur des macro-univers." },
    { humeur: "normal", titre: "Lhu", scene: "place", mascotteSur: "button[onclick*=\"'entrainement'\"]", placement: "auto", attendreVoix: false, texte: "En haut tu as des menus (à gauche sur PC)." },
    { humeur: "normal", titre: "Lhu", placement: "auto", attendreVoix: false, texte: "Pour vaincre les boss qui t'attendent, il va falloir devenir plus fort." },
    { humeur: "normal", titre: "Lhu", placement: "auto", attendreVoix: false, texte: "Et pour ça, il faut s'entraîner." },
    { humeur: "normal", titre: "Lhu", placement: "auto", surbrillance: false, clignote: true, avanceAuClic: true,
      cible: { selecteur: "button[onclick*=\"'entrainement'\"]", libelle: "Le menu Entraînement de base" },
      texte: "Clique sur le menu « Entraînement de base » qui clignote." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "La barre verte en haut représente ton énergie." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Vu l'état dans lequel tu es arrivé, tu récupères tout doucement ton énergie jusqu'à son maximum, qui est de 500." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Il faut placer l'énergie verte pour qu'elle travaille plutôt que de rester là, à ne rien faire." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Tu peux écrire un chiffre dans la zone input pour choisir quelle portion d'énergie tu veux placer." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", scene: "place", mascotteSur: "button[onclick*=\"'idle',.5\"]", placement: "auto", surbrillance: false, clignote: true, avanceAuClic: true,
      cible: { selecteur: "button[onclick*=\"'idle',.5\"]", libelle: "Le bouton 1/2 de IDLE" },
      texte: "Mais comme je sens que ça devient compliqué pour toi, clique juste sur le bouton 1/2 de IDLE." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Voilà, si tu regardes dans input, ça a automatiquement pris la moitié de ton énergie disponible." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Dans ton cas c'est {input}." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", surbrillance: false, clignote: true, clignoteAussi: "#sorealIdleHudPvBarV2", avanceAuClic: true,
      cible: { selecteur: "button[onclick*=\"'attaque_passive','plus'\"]", libelle: "Le bouton + de Attaque passive" },
      texte: "Assigne cette énergie en cliquant sur le bouton + de ATTAQUE PASSIVE, et jette un œil sur ta barre de vie en haut." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "T'as vu ça ? Comment tes PV grimpent ?" },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Après, savoir donner des coups, c'est bien. Mais savoir en encaisser, c'est mieux." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "J'ai entendu ça un jour dans un film de Kung-Fu." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", surbrillance: false, clignote: true, avanceAuClic: true,
      cible: { selecteur: "button[onclick*=\"'blocage','plus'\"]", libelle: "Le bouton + de Blocage" },
      texte: "Donc maintenant, tu vas placer l'autre moitié dans le blocage en cliquant sur le +." },
    { humeur: "normal", titre: "Lhu", menu: "entrainement", placement: "auto", attendreVoix: false, texte: "Voilà, maintenant, je pense qu'on est bon." },
    { humeur: "normal", titre: "Lhu", scene: "place", mascotteSur: "button[onclick*=\"'combat'\"]", placement: "auto", attendreVoix: false, texte: "On va rendre une petite visite à notre ami le Petit bout de peluche." },
    { humeur: "normal", titre: "Lhu", placement: "auto", surbrillance: false, clignote: true, avanceAuClic: true,
      cible: { selecteur: "button[onclick*=\"'combat'\"]", libelle: "Le menu Combat de boss" },
      texte: "Retourne dans le menu Combat de Boss." },
    { humeur: "normal", titre: "Lhu", menu: "combat", scene: "place", mascotteSur: "#sorealIdleBossNukeV1", placement: "auto", surbrillance: false, attendreVictoire: true, avanceAuClic: true,
      cible: { selecteur: "#sorealIdleBossStartV100", libelle: "Le bouton Fight" },
      texte: "Allez, appuie encore sur le gros bouton rouge." },
    { humeur: "normal", titre: "Lhu", menu: "combat", placement: "auto", attendreVoix: false, texte: "Bravo ! Tu l'as défoncé cette fois." },
    { humeur: "normal", titre: "Lhu", menu: "combat", placement: "auto", attendreVoix: false, texte: "Plus le temps va passer et plus tu vas devenir fort. Même si tu fermes le jeu." },
    { humeur: "normal", titre: "Lhu", menu: "combat", placement: "auto", attendreVoix: false, texte: "Je te laisse un peu, je dois chier. Mais vas-y, t'es prêt à tuer les prochains boss." },
  ],
});

/* Insère le premier jet UNE fois : les supprimer ne le recrée pas. */
function insererGraineTutorielV1(sql) {
  const maintenant = Date.now();
  const fait = sqlRows(sql.exec("SELECT v FROM idle_tutoriel_meta WHERE k='seed_v1'"))[0];
  if (!fait) {
    for (const brut of IDLE_TUTORIEL_SEED_V1) {
      const g = normaliserGuideV1(brut);
      sql.exec("INSERT OR IGNORE INTO idle_tutoriel(id,json,maj) VALUES(?,?,?)", g.id, JSON.stringify(g), maintenant);
    }
    sql.exec("INSERT OR REPLACE INTO idle_tutoriel_meta(k,v) VALUES('seed_v1','1')");
  }
  const lhu = sqlRows(sql.exec("SELECT v FROM idle_tutoriel_meta WHERE k='seed_lhu_v1'"))[0];
  if (!lhu) {
    const g = normaliserGuideV1(IDLE_TUTORIEL_LHU_V1);
    sql.exec("INSERT OR IGNORE INTO idle_tutoriel(id,json,maj) VALUES(?,?,?)", g.id, JSON.stringify(g), maintenant);
    sql.exec("INSERT OR REPLACE INTO idle_tutoriel_meta(k,v) VALUES('seed_lhu_v1','1')");
  }
}

export function assurerTutorielV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_tutoriel(id TEXT PRIMARY KEY, json TEXT NOT NULL, maj INTEGER NOT NULL)");
  sql.exec("CREATE TABLE IF NOT EXISTS idle_tutoriel_meta(k TEXT PRIMARY KEY, v TEXT)");
  insererGraineTutorielV1(sql);
}

export function lireGuidesV1(sql) {
  assurerTutorielV1(sql);
  return sqlRows(sql.exec("SELECT id,json,maj FROM idle_tutoriel ORDER BY id"))
    .map((r) => {
      const g = safeJson(r.json, null);
      if (!g || typeof g !== "object") return null;
      try { return Object.assign(normaliserGuideV1(g), { maj: Number(r.maj) || 0 }); } catch (_e) { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => a.ordre - b.ordre || a.id.localeCompare(b.id));
}

export function enregistrerGuideV1(sql, brut, maintenant = Date.now()) {
  const g = normaliserGuideV1(brut);
  const existants = lireGuidesV1(sql);
  const ancien = existants.find((x) => x.id === g.id);
  if (!ancien && existants.length >= IDLE_TUTO_MAX_GUIDES_V1) throw new Error("TUTO_TROP_DE_GUIDES");
  /* Le « vu » d'un guide déjà publié ne change jamais : le renommer ne le rejouerait pas chez ceux qui l'ont vu. */
  if (ancien && ancien.vuId) g.vuId = ancien.vuId;
  sql.exec("INSERT OR REPLACE INTO idle_tutoriel(id,json,maj) VALUES(?,?,?)", g.id, JSON.stringify(g), maintenant);
  return Object.assign(g, { maj: maintenant });
}

export function supprimerGuideV1(sql, id) {
  assurerTutorielV1(sql);
  sql.exec("DELETE FROM idle_tutoriel WHERE id=?", String(id || ""));
}

/* Réglage « l'ancien tutoriel est encore joué » : vrai par défaut (rien ne change tant que l'administrateur ne l'a pas décidé). */
/*
 * SUPPRIMÉ le 2026-10-26 (Norman : « ce n'est plus le bon tuto, il faut le supprimer ; c'est celui que j'ai fait moi-même qu'il faut ») : l'ancien tutoriel (fenêtres de Norman & Sébastien : début du jeu, premier boss, Aventure, Renaissance) n'est
 * plus jamais joué, quel que soit le réglage enregistré. Seuls les guides écrits dans le menu Admin (et l'introduction en images) restent.
 */
export function ancienTutorielActifV1(sql) {
  assurerTutorielV1(sql);
  return false;
}

export function reglerAncienTutorielV1(sql, actif) {
  assurerTutorielV1(sql);
  sql.exec("INSERT OR REPLACE INTO idle_tutoriel_meta(k,v) VALUES('ancien_actif',?)", actif ? "1" : "0");
  return Boolean(actif);
}

/*
 * Deuxième réglage : les anciennes FENÊTRES D'EXPLICATION de chaque menu (popup de première ouverture : une trentaine de textes écrits dans le code et dans les données du jeu). Séparé du tutoriel de départ pour pouvoir
 * remplacer d'abord le début du jeu, puis les menus un par un à ton rythme. Vrai par défaut.
 */
export function ancienMenusActifV1(sql) {
  assurerTutorielV1(sql);
  const r = sqlRows(sql.exec("SELECT v FROM idle_tutoriel_meta WHERE k='ancien_menus_actif'"))[0];
  return !r || String(r.v) !== "0";
}

export function reglerAncienMenusV1(sql, actif) {
  assurerTutorielV1(sql);
  sql.exec("INSERT OR REPLACE INTO idle_tutoriel_meta(k,v) VALUES('ancien_menus_actif',?)", actif ? "1" : "0");
  return Boolean(actif);
}

/*
 * Ce que le JOUEUR reçoit : uniquement les guides actifs du déclencheur demandé (jamais la liste complète : anti-spoil, AGENTS.md règle n°2), avec ce dont la fenêtre a besoin.
 * contexte : { debut:true } | { menu:"<id>" } | { boss:N } ; { } = seulement le réglage de l'ancien tutoriel.
 */
export function guidesPourJoueurV1(sql, contexte) {
  const ctx = contexte && typeof contexte === "object" ? contexte : {};
  const bons = lireGuidesV1(sql).filter((g) => {
    if (!g.actif) return false;
    /* Norman (2026-11-04) : l'ancien tutoriel (Norman & Sébastien) et le nouveau, court, sont supprimés ; SEULS les guides de la mascotte Cthulhu sont encore joués aux joueurs (les autres guides, s'il en reste en base, sont inertes : ils se suppriment depuis l'Admin). */
    if (g.mascotte !== true) return false;
    if (ctx.debut === true) return g.declencheur.type === "debut";
    if (ctx.menu != null) return g.declencheur.type === "menu" && g.declencheur.menu === String(ctx.menu);
    if (ctx.boss != null) return g.declencheur.type === "boss" && g.declencheur.boss === Math.floor(Number(ctx.boss));
    return false;
  });
  return bons.map((g) => ({ id: g.id, titre: g.titre, vuId: g.vuId, declencheur: g.declencheur, afficher: g.afficher !== false, mascotte: g.mascotte === true, etapes: g.etapes }));
}
