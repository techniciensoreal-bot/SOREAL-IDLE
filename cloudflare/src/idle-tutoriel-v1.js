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
 *      avanceAuClic: l'étape passe à la suivante quand le joueur CLIQUE sur la cible (le bouton « Suivant » est alors masqué 30 s, puis revient pour ne jamais bloquer ; sans cible, ignoré).
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
export const IDLE_TUTO_MAX_GUIDES_V1 = 200;
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
    return { titre: texteNettoye(etape.titre, 80), texte: texteNettoye(etape.texte, MAX_TEXTE), menu, cible, placement, surbrillance: etape.surbrillance !== false, avanceAuClic: etape.avanceAuClic === true && Boolean(cible) };
  });
  if (!etapes.some((e) => e.texte || e.titre)) throw new Error("TUTO_ETAPES_VIDES");
  const vuBrut = String(g.vuId == null ? "" : g.vuId).trim();
  const vuId = vuBrut && vuBrut.length <= 80 && /^[A-Za-z0-9_:.-]+$/.test(vuBrut) ? vuBrut : "tuto:" + id;
  const ordre = Number.isFinite(Number(g.ordre)) ? Math.max(-9999, Math.min(9999, Math.floor(Number(g.ordre)))) : 0;
  return { id, titre, declencheur, actif: g.actif !== false, ordre, vuId, etapes };
}


/*
 * Premier jet du nouveau tutoriel (2026-10-14, rédigé par Claude à partir des textes de Norman & Sébastien et des nouveautés du jeu ; Norman l'édite à sa façon dans le menu Admin → Tutoriel).
 * Inséré UNE fois (réglage seed_v1) ; tous les guides sont DÉSACTIVÉS : rien n'est joué aux joueurs tant que Norman ne les a pas relus et activés (bouton « Activer » de la liste). Supprimer un guide ne le recrée pas.
 * Les repères d'écran (selecteur) sont ceux du jeu au 2026-10-14 ; « Placer sur l'écran » les remplace en un clic si l'interface change.
 */
const e = (titre, texte, menu, selecteur, libelle, placement) => ({ titre, texte, menu: menu || "", cible: selecteur ? { selecteur, libelle: libelle || "" } : null, placement: placement || "auto", surbrillance: true });
const ATTAQUE = ".soreal-idle-bt-row-v120.attack .soreal-idle-bt-actions-v120 button";
export const IDLE_TUTORIEL_SEED_V1 = [
  {
    id: "bienvenue", titre: "Bienvenue et premiers pas", declencheur: { type: "debut" }, actif: false, ordre: 10,
    etapes: [
      e("LE COMMENCEMENT", "*BLOUM*\n\nQuand tu reprends connaissance, la première chose que tu remarques, c’est ce goût de cuivre dans ta bouche.\n\nLa seconde, c’est l’odeur d’égout à plein nez tout autour de toi.\n\nTu te relèves en soignant ta lèvre fendue et en te frottant la tête, qui a l’air d’avoir reçu tout l’amour d’un bloc de béton.", "", null, "", "centre"),
      e("LE COMMENCEMENT", "Tu essaies de te rappeler comment tu es arrivé ici... enfin, peu importe où est « ici ». Tu réalises, avec un calme étonnant, que tu as complètement oublié qui tu es. Vu l’état dans lequel tu te trouves, tu te dis qu’ils devaient être de sacrés connards. Balancé dans une fosse d’égout dégueulasse...\n\nAu moins, à court terme, tu as un objectif : trouver un moyen de sortir d’ici.", "", null, "", "centre"),
      e("LE COMMENCEMENT", "Tu essaies de te lever mais tes genoux tremblent, se dérobent, et tu retombes. C’est seulement maintenant que tu sens la faiblesse dans ton corps. Pas le genre de faiblesse normale, comme quand tu te lèves trop vite et que la tête tourne, ou quand ton bras se fait arracher dans un accident industriel. Non, tu as l’impression que *quelque chose* a aspiré la majorité de ta force.\n\nBon, il n’y a rien d’autre à faire qu’essayer de récupérer un peu de cette force et sortir d’ici.", "", null, "", "centre"),
      e("Norman & Sébastien", "Salut, qui que tu sois ! Content que tu aies décidé de jeter un œil à SOREAL IDLE. Nous sommes Norman & Sébastien, les narrateurs de cette histoire. Bref, on commence !", "", null, "", "centre"),
      e("Objectif", "Donc, ton objectif principal dans SOREAL IDLE ? Devenir super méga puissant, et vaincre tous les Boss bizarres qui se dressent sur ton chemin !\n\nEn haut, tu vois tes stats principales, dont l’Attaque et la Défense. Elles démarrent à 100, mais elles vont grimper à toute vitesse dans une seconde.", "entrainement", ".soreal-idle-summary-grid-v28", "Les stats du haut", "bas"),
      e("Énergie", "En dessous, la grosse barre verte, c’est ton énergie. Tu en génères à chaque fois que la barre se remplit, jusqu’à atteindre le plafond, qui est de 500 pour l’instant.\n\nLe chiffre au milieu, c’est l’énergie disponible : celle que tu n’as encore placée nulle part et qui traîne à rien faire comme une bonne grosse feignasse. Et l’énergie, c’est la clé pour faire grimper ton Attaque et ta Défense.", "entrainement", ".soreal-idle-energybar-wrap-v11", "Barre d’énergie", "bas"),
      e("Entraînement de base", "C’est là que les choses se passent : ce menu te permet d’augmenter ton attaque et ta défense (quelle surprise).\n\nPour t’entraîner, tu places ton énergie sur une compétence. Vas-y, clique sur le bouton « + » de l’« Attaque passive » et regarde ce qui se passe.", "entrainement", ATTAQUE + ":first-child", "Bouton + de l’Attaque passive", "auto"),
      e("Bien joué", "Si tu as bien fait, la barre se remplit et ton Attaque grimpe. Tape-toi dans le dos pour te féliciter. Pas trop bas quand même, ce serait bizarre.\n\nLe bouton « − » retire de l’énergie de cette compétence pour que tu puisses la placer ailleurs.", "entrainement", ATTAQUE + ":nth-child(2)", "Bouton − de l’Attaque passive", "auto"),
      e("Le bouton Cap", "Le bouton « Cap » place d’un coup juste ce qu’il faut d’énergie pour atteindre le plafond de la compétence : ni plus, ni moins. Pratique pour ne rien gaspiller.\n\nLe bouton « 0 » retire toute l’énergie de la ligne.", "entrainement", ATTAQUE + ":nth-child(3)", "Bouton Cap", "auto"),
      e("La saisie", "Quand tu cliques sur « + », le jeu place une quantité d’énergie égale au nombre écrit ici. Tu peux taper ton propre nombre quand tu veux : c’est ton réglage à toi.", "entrainement", "#sorealIdleTrainingInputV120", "Champ de saisie", "bas"),
      e("Les raccourcis", "Ces boutons remplissent la saisie à ta place : « Max » prend tout ton plafond d’énergie, « 1/2 » la moitié, « 1/4 » le quart.\n\nDans le cadre « Idle », ils ne comptent que l’énergie encore libre, et « Tout retirer » récupère toute l’énergie que tu as déjà placée.", "entrainement", ".soreal-idle-bt-presets-v120", "Boutons Max, 1/2, 1/4", "bas"),
      e("Défense", "Avoir la force d’un transpalette électrique mais en carton, c’est cool, mais tu voudras sûrement un peu de Défense aussi. Entraîne donc la compétence « Blocage » : clique sur son « + ».\n\nSi toute ton énergie est déjà placée sur l’Attaque passive, retires-en un peu avec « − ».", "entrainement", ".soreal-idle-bt-row-v120.defense .soreal-idle-bt-actions-v120 button:first-child", "Bouton + du Blocage", "auto"),
      e("Combat de boss", "Quand tes stats seront assez hautes, va jeter un œil au menu Combat de boss et mets ta puissance à l’épreuve. En commençant par un adversaire particulièrement vicieux... Un Petit Bout de Peluche.", "", "[data-menu-id-v1=\"combat\"]", "Menu Combat de boss", "bas"),
      e("Norman & Sébastien", "Bon, on va aller se faire un sandwich, alors continue à t’entraîner et bats le premier boss. On sera de retour après !\n\n— Norman & Sébastien", "", null, "", "centre")
    ]
  },
  {
    id: "combat", titre: "Le menu Combat de boss", declencheur: { type: "menu", menu: "combat" }, actif: false, ordre: 25,
    etapes: [
      e("Combat de boss", "Voici le bouton « Fight » : il lance le combat contre le boss actuel. Tes stats d’Attaque et de Défense font tout le travail.\n\nSi le boss est trop fort, « Fuite » te permet de t’échapper et de retourner t’entraîner.", "combat", "#sorealIdleBossStartV100", "Bouton Fight", "bas")
    ]
  },
  {
    id: "premier-boss", titre: "Premier boss vaincu", declencheur: { type: "boss", boss: 1 }, actif: false, ordre: 20,
    etapes: [
      e("Norman & Sébastien", "Oh hé, cool, tu as écrasé Un Petit Bout de Peluche. Plus important : ce sandwich est fantastique ! Jambon fromage et sauce mayonnaise volé à un ouvrier dans le frigo. Miam.", "", null, "", "centre"),
      e("Récompenses", "Donc tuer des boss apporte quelques récompenses importantes : d’abord, tu gagnes de l’EXP. L’EXP sert à acheter des pouvoirs permanents dans l’EXP Shop, qui vient aussi de se débloquer. Tu le trouves dans la barre de menus, en haut.", "", "[data-menu-id-v1=\"shop\"]", "Menu Shop", "bas"),
      e("Conseil de pro", "Il y a plein de trucs à acheter avec l’EXP, mais ne panique pas ! Notre conseil de pro : achète les offres spéciales qui augmentent la vitesse de remplissage de la barre d’Énergie. On les a faites spécifiquement pour des débutants comme toi... ne le prends pas mal.", "shop", ".soreal-idle-exp-tab-v212", "Onglets de l’EXP Shop", "bas"),
      e("Norman & Sébastien", "Bats les prochains boss et on reviendra t’embêter. Norman & Sébastien, terminé !", "", null, "", "centre")
    ]
  },
  {
    id: "aventure", titre: "Le menu Aventure", declencheur: { type: "menu", menu: "aventure" }, actif: false, ordre: 30,
    etapes: [
      e("Norman & Sébastien", "Salut salut, c’est encore Norman & Sébastien. Alors comme ça t’as vaincu Une Petite Souris ? On suppose que ça veut dire qu’il est temps d’ajouter un peu de nouveau gameplay qui déchire à ton aventure. D’abord, tu as débloqué l’AVENTURE. Pense à ça comme un « RPG pourri dans le jeu » : tu vas combattre des trucs et looter d’autres trucs. Les compétences d’entraînement que tu débloques deviennent des attaques utilisables en Aventure pour vaincre les ennemis !", "aventure", ".soreal-idle-v79-adventure-scene", "La scène d’Aventure", "bas"),
      e("Équipement", "Des ennemis vont apparaître aléatoirement toutes les quelques secondes quand tu sors de la Zone Sûre. Les combattre fait tomber de l’équipement, que tu retrouves dans ton INVENTAIRE, juste ici.\n\nTouche un objet pour voir sa fiche et l’équiper, ou glisse-le sur un emplacement. Glisser deux objets identiques l’un sur l’autre les fusionne. L’équipement booste tes stats d’Aventure ainsi que tes stats principales d’Attaque et de Défense.", "aventure", ".soreal-idle-v151-inventory-columns", "L’inventaire et l’équipement", "haut"),
      e("Zones", "Pour commencer, tu n’as débloqué que la zone d’entraînement. Vaincre des boss avec un numéro plus élevé débloquera petit à petit de nouvelles zones d’Aventure à explorer, avec du meilleur équipement à te coller sur le dos !\n\nAUSSI : les boss en Aventure ont une chance de faire tomber de l’EXP ! L’EXP, c’est bien.", "aventure", ".soreal-idle-v79-adventure-scene", "La scène d’Aventure", "bas")
    ]
  },
  {
    id: "renaissance", titre: "Le menu Renaissance", declencheur: { type: "menu", menu: "renaissance" }, actif: false, ordre: 40,
    etapes: [
      e("Rebirth", "Tu as aussi débloqué le menu Rebirth (une renaissance en français), ce qui mérite quelques explications.\n\nÀ un moment donné, tu vas arriver à un point où progresser prendra une éternité. Si tu fais un Rebirth, tu vas réinitialiser la plupart de ta progression dans chaque menu, et les boss vont être réinitialisés.", "renaissance", ".soreal-idle-rebirth-button-v14", "Bouton de Rebirth", "bas"),
      e("Le NOMBRE", "En contrepartie, ton NOMBRE va grandir. Le NOMBRE, c’est... eh bien, c’est un nombre. Ton Attaque et ta Défense sont multipliées par ce NOMBRE, et ton NOMBRE peut devenir ridiculement énorme.\n\nGenre, bêtement énorme. Genre beaucoup plus gros que la plus grosse de tes copines.", "renaissance", null, "", "centre"),
      e("Quand faire un Rebirth ?", "Dès que la progression te semble lente, c’est probablement le moment de faire un Rebirth et de réinitialiser un peu de progression pour faire grimper ton nombre ! Tu peux essayer maintenant si tu veux, mais si tu attends plus longtemps, ton NOMBRE grandira encore plus ! Le temps écoulé depuis ton dernier Rebirth est un facteur important pour la taille de ton NOMBRE, jusqu’à 60 minutes.", "renaissance", null, "", "centre"),
      e("Après le Rebirth", "Quand tu fais un Rebirth, les boss réapparaissent aussi. Avec un NOMBRE assez élevé, tu peux vaincre des boss avec un numéro plus élevé, ce qui te donnera de l’EXP à chaque fois que tu les vaincs !\n\nArrive au boss 17 et tu débloqueras encore autre chose ! À plus !\n\n— Norman & Sébastien", "renaissance", null, "", "centre")
    ]
  }
];

/* Insère le premier jet UNE fois : les supprimer ne le recrée pas. */
function insererGraineTutorielV1(sql) {
  const fait = sqlRows(sql.exec("SELECT v FROM idle_tutoriel_meta WHERE k='seed_v1'"))[0];
  if (fait) return;
  const maintenant = Date.now();
  for (const brut of IDLE_TUTORIEL_SEED_V1) {
    const g = normaliserGuideV1(brut);
    sql.exec("INSERT OR IGNORE INTO idle_tutoriel(id,json,maj) VALUES(?,?,?)", g.id, JSON.stringify(g), maintenant);
  }
  sql.exec("INSERT OR REPLACE INTO idle_tutoriel_meta(k,v) VALUES('seed_v1','1')");
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
    if (ctx.debut === true) return g.declencheur.type === "debut";
    if (ctx.menu != null) return g.declencheur.type === "menu" && g.declencheur.menu === String(ctx.menu);
    if (ctx.boss != null) return g.declencheur.type === "boss" && g.declencheur.boss === Math.floor(Number(ctx.boss));
    return false;
  });
  return bons.map((g) => ({ id: g.id, titre: g.titre, vuId: g.vuId, declencheur: g.declencheur, etapes: g.etapes }));
}
