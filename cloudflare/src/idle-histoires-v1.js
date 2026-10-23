/*
 * Histoires plein écran éditables (Norman, 2026-09-30 : « un menu Admin… choisir à la mort de quel boss une scène doit se
 * déclencher, ajouter des images, coller un texte, générer les voix »). Stockage dans la base SQLite du Durable Object
 * (table idle_histoires), jamais dans le code : l'administrateur les modifie depuis le menu Admin sans redéploiement.
 *
 * Une histoire = { id, titre, boss (numéro d'un boss de Fight Boss, ou null = jamais déclenchée), actif, voix[], etapes[] }.
 * Une étape = { texte, image }. « image » vaut soit « legacy:N » (image N historique des deux premières histoires, servie par
 * /api/idle/media/story?id=…&index=N), soit un nom de fichier téléversé (servi par /api/idle/media/story-image?id=…&f=…).
 * « voix » liste les empreintes de blocs dont une voix a été générée depuis le menu Admin (fichiers R2 idle/voix/<empreinte>.m4a).
 *
 * Déclenchement : à la mort du boss N, c'est-à-dire quand le prochain boss sélectionné est N+1 (comme la première histoire, jouée
 * dès que le boss 17 est mort). La première histoire est insérée UNE fois (drapeau seed_v1) : la supprimer ne la recrée pas.
 */
import { sqlRows, safeJson } from "./core/sqlite-core.js";

export const IDLE_HISTOIRE_ID_RE_V1 = /^[A-Za-z0-9_-]{1,60}$/;
export const IDLE_HISTOIRE_IMAGE_RE_V1 = /^(legacy:\d{1,2}|intro:\d{2}|[A-Za-z0-9_.-]{1,90})$/;
/* L'intro (« Le commencement », 16 images) est une scène à part entière dans le menu Admin (Norman, 2026-10-23) : identifiant réservé, jamais déclenchée par un boss, jamais supprimée, images fixes (/intro/NN.webp). */
export const IDLE_HISTOIRE_INTRO_ID_V1 = "Intro";
export const IDLE_HISTOIRE_INTRO_TITRE_V1 = "Intro — Le commencement";
const IDLE_INTRO_PHRASES_V1 = [
  "*BLOUM*",
  "Quand tu reprends connaissance,",
  "la première chose que tu remarques, c’est ce goût de cuivre dans ta bouche.",
  "La seconde, c’est l’odeur d’égout à plein nez tout autour de toi.",
  "Tu te relèves en soignant ta lèvre fendue et en te frottant la tête,",
  "qui a l’air d’avoir reçu tout l’amour d’un bloc de béton.",
  "Tu essaies de te rappeler comment tu es arrivé ici... enfin, peu importe où est « ici ». Tu réalises, avec un calme étonnant, que tu as complètement oublié qui tu es.",
  "Vu l’état dans lequel tu te trouves, tu te dis qu’ils devaient être de sacrés connards.",
  "Balancé dans une fosse d’égout dégueulasse...",
  "Au moins, à court terme, tu as un objectif : trouver un moyen de sortir d’ici. Ça a l’air d’être la bonne chose à faire. Tu essaies de te lever",
  "mais tes genoux tremblent, se dérobent,",
  "et tu retombes.",
  "C’est seulement maintenant que tu sens la faiblesse dans ton corps. Pas le genre de faiblesse normale, comme quand tu te lèves trop vite et que la tête tourne, ou quand ton bras se fait arracher dans un accident industriel.",
  "Non, tu as l’impression que *quelque chose* a aspiré la majorité de ta force.",
  "Bon, il n’y a rien d’autre à faire qu’essayer de récupérer un peu de cette force et sortir d’ici.",
  "Peut-être qu’appuyer sur un gros bouton blanc marqué « JOUER » te permettra de faire quelque chose d’amusant."
];
export const IDLE_INTRO_SEED_V1 = {
  id: IDLE_HISTOIRE_INTRO_ID_V1,
  vuId: "",
  titre: IDLE_HISTOIRE_INTRO_TITRE_V1,
  boss: null,
  actif: true,
  voix: [],
  etapes: IDLE_INTRO_PHRASES_V1.map((t, i) => ({ texte: t, image: "intro:" + String(i + 1).padStart(2, "0") }))
};
export const IDLE_HISTOIRE_HASH_RE_V1 = /^[0-9a-f]{14}$/;
export const IDLE_HISTOIRE_MAX_ETAPES_V1 = 80;
export const IDLE_HISTOIRE_VOIX_ID_RE_V1 = /^[a-z0-9-]{1,32}$/;
const IDLE_HISTOIRE_MAX_TEXTE_V1 = 4000;
export const IDLE_HISTOIRE_BOSS_MAX_V1 = 999;

/* Textes d'origine des deux premières histoires (rédaction SOREAL, fournis par Norman). */
export const IDLE_HISTOIRES_SEED_V1 = [
 {
  "id": "MagicienEtLaGrotte",
  "vuId": "histoire:magicienEtLaGrotte",
  "titre": "Le Magicien et la Grotte",
  "boss": 17,
  "actif": true,
  "voix": [],
  "etapes": [
   {
    "texte": "Épuisé, couvert de bleus, et légèrement sourd à cause de l'explosion, tu titubes jusqu'à cette mystérieuse hutte. Et, en effet, il semble bien que ce soit la demeure de ce fameux 'sorcier', qui qu'il soit.",
    "image": "legacy:1"
   },
   {
    "texte": "Tu vois le chaudron bouillonnant tout ce qu'il y a de plus stéréotypé, divers ingrédients magiques dégoûtants, et étrangement, des dizaines de bombes d'air comprimé vides éparpillées sur le sol. Cependant, c'est le sorcier aux yeux globuleux qui capte ton attention, alors qu'il pousse des cris de joie hystériques, te saluant comme un vieil ami. Vu ta perte de mémoire, tu le crois sur parole quand il dit que vous vous connaissiez déjà. Il prétend pouvoir t'aider si tu passes par ce qu'il appelle la 'grotte brumeuse' juste derrière chez lui pour récolter 'un peu de cette bonne came', peu importe ce que c'est.",
    "image": "legacy:2"
   },
   {
    "texte": "Te sentant étrangement magnanime, tu acceptes de l'aider, et tu pars vers la grotte. 'Attends-toi à tout dans cette grotte, l'ami ! Les gaz bizarres là-dedans te rendent un peu zinzin ! Et si t'as besoin d'un petit coup de pouce pour devenir plus fort, va voir M. Jensen, quelques maisons plus loin, il te filera un peu de ce qu'il appelle des 'augmentations'. C'est un truc de science-fiction bizarroïde, mais j'peux pas nier que ça marche !'",
    "image": "legacy:3"
   },
   {
    "texte": "Tu es un peu refroidi par son avertissement étrange, et par son attitude générale, mais tu décides quand même de continuer.",
    "image": "legacy:4"
   },
   {
    "texte": "Dès ta première inspiration à l'intérieur, tu *sais* immédiatement ce que le sorcier voulait dire. L'air semble... léger, très léger. Tu sens ton cerveau faire des sauts périlleux et des roues... et c'est là que tu le vois.",
    "image": "legacy:5"
   }
  ]
 }
];

function texteNettoyeV1(valeur, max) {
  return String(valeur == null ? "" : valeur).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/* Valide et normalise une histoire envoyée par l'administrateur. Lève une Error au message lisible. */
export function normaliserHistoireV1(brut) {
  const h = brut && typeof brut === "object" ? brut : {};
  const id = String(h.id == null ? "" : h.id).trim();
  if (!IDLE_HISTOIRE_ID_RE_V1.test(id)) throw new Error("HISTOIRE_ID_INVALIDE");
  const titre = texteNettoyeV1(h.titre, 80);
  if (!titre) throw new Error("HISTOIRE_TITRE_REQUIS");
  let boss = null;
  if (h.boss !== null && h.boss !== undefined && h.boss !== "") {
    boss = Math.floor(Number(h.boss));
    if (!Number.isFinite(boss) || boss < 1 || boss > IDLE_HISTOIRE_BOSS_MAX_V1) throw new Error("HISTOIRE_BOSS_INVALIDE");
  }
  const etapesBrutes = Array.isArray(h.etapes) ? h.etapes : [];
  if (!etapesBrutes.length) throw new Error("HISTOIRE_ETAPES_REQUISES");
  if (etapesBrutes.length > IDLE_HISTOIRE_MAX_ETAPES_V1) throw new Error("HISTOIRE_TROP_D_ETAPES");
  const etapes = etapesBrutes.map((e) => {
    const image = String(e && e.image != null ? e.image : "").trim();
    if (image && !IDLE_HISTOIRE_IMAGE_RE_V1.test(image)) throw new Error("HISTOIRE_IMAGE_INVALIDE");
    /* Qui parle : le narrateur (défaut) ou une voix de femme (Norman, 2026-09-30 : « faire intervenir une femme de temps en temps »). */
    /* Voix nommées (Norman, 2026-10-01) : l'identifiant d'une voix du registre modules/voix-nommees-v1.js (lettres minuscules, chiffres, tirets). */
    const parleurBrut = e && typeof e.parleur === "string" ? e.parleur.trim() : "";
    const parleur = parleurBrut === "femme" ? "femme" : parleurBrut !== "narrateur" && IDLE_HISTOIRE_VOIX_ID_RE_V1.test(parleurBrut) ? parleurBrut : "narrateur";
    /* Texte AFFICHÉ au joueur (cadre jaune de l'éditeur, 2026-10-23), distinct du texte DIT (balises de voix) ; absent = le texte dit sans ses balises. */
    const affiche = texteNettoyeV1(e && e.affiche, IDLE_HISTOIRE_MAX_TEXTE_V1);
    return affiche ? { texte: texteNettoyeV1(e && e.texte, IDLE_HISTOIRE_MAX_TEXTE_V1), affiche, image, parleur } : { texte: texteNettoyeV1(e && e.texte, IDLE_HISTOIRE_MAX_TEXTE_V1), image, parleur };
  });
  const voix = Array.from(new Set((Array.isArray(h.voix) ? h.voix : []).map((x) => String(x || "").trim()).filter((x) => IDLE_HISTOIRE_HASH_RE_V1.test(x)))).slice(0, 400);
  /* Identifiant « vu » (profil.stats.vus) : conservé tel quel pour les deux premières histoires, déjà mémorisé chez les joueurs. */
  const vuBrut = String(h.vuId == null ? "" : h.vuId).trim();
  const vuId = vuBrut && vuBrut.length <= 80 && /^[A-Za-z0-9_:.-]+$/.test(vuBrut) ? vuBrut : "";
  if (id === IDLE_HISTOIRE_INTRO_ID_V1) return { id, titre: IDLE_HISTOIRE_INTRO_TITRE_V1, boss: null, actif: true, voix, etapes, vuId: "" };
  return { id, titre, boss, actif: h.actif !== false, voix, etapes, vuId };
}

/* Crée la table et insère les deux premières histoires, une seule fois. */
export function assurerHistoiresV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_histoires(id TEXT PRIMARY KEY, json TEXT NOT NULL, maj INTEGER NOT NULL)");
  sql.exec("CREATE TABLE IF NOT EXISTS idle_histoires_meta(k TEXT PRIMARY KEY, v TEXT)");
  const fait = sqlRows(sql.exec("SELECT v FROM idle_histoires_meta WHERE k='seed_v1'"))[0];
  const maintenant = Date.now();
  if (!fait) {
    for (const h of IDLE_HISTOIRES_SEED_V1) {
      sql.exec("INSERT OR IGNORE INTO idle_histoires(id,json,maj) VALUES(?,?,?)", h.id, JSON.stringify(h), maintenant);
    }
    sql.exec("INSERT OR REPLACE INTO idle_histoires_meta(k,v) VALUES('seed_v1','1')");
  }
  /*
   * Suppression définitive (Norman, 2026-10-23 : « supprime l'histoire numéro 2, je ne la veux plus ») : une seule fois, « Le Magicien et la Grotte 2 » est retirée de la base ; elle n'est plus dans le seed, donc jamais recréée. La chronique du boss « Un Gamin
   * sur un Nuage » (design/ngu-boss-stories-fr.json) n'est pas concernée.
   */
  const v5 = sqlRows(sql.exec("SELECT v FROM idle_histoires_meta WHERE k='seed_v5'"))[0];
  if (!v5) {
    sql.exec("DELETE FROM idle_histoires WHERE id='MagicienEtLeGrotte2'");
    sql.exec("INSERT OR REPLACE INTO idle_histoires_meta(k,v) VALUES('seed_v5','1')");
  }
  /* L'intro devient visible et modifiable dans le menu Admin (Norman, 2026-10-23) : insérée si elle manque (jamais écrasée) ; elle ne peut pas être supprimée (voir supprimerHistoireV1). */
  const v6 = sqlRows(sql.exec("SELECT v FROM idle_histoires_meta WHERE k='seed_v6'"))[0];
  if (!v6) {
    sql.exec("INSERT OR IGNORE INTO idle_histoires(id,json,maj) VALUES(?,?,?)", IDLE_INTRO_SEED_V1.id, JSON.stringify(IDLE_INTRO_SEED_V1), maintenant);
    sql.exec("INSERT OR REPLACE INTO idle_histoires_meta(k,v) VALUES('seed_v6','1')");
  }
}

export function lireHistoiresV1(sql) {
  assurerHistoiresV1(sql);
  return sqlRows(sql.exec("SELECT id,json,maj FROM idle_histoires ORDER BY id"))
    .map((r) => {
      const h = safeJson(r.json, null);
      if (!h || typeof h !== "object") return null;
      try { return Object.assign(normaliserHistoireV1(h), { maj: Number(r.maj) || 0 }); } catch (_e) { return null; }
    })
    .filter(Boolean);
}

/* Enregistre (crée ou remplace). Refuse qu'un boss ait deux histoires actives. */
export function enregistrerHistoireV1(sql, brut, maintenant = Date.now()) {
  const h = normaliserHistoireV1(brut);
  if (h.id === IDLE_HISTOIRE_INTRO_ID_V1) {
    /* images et nombre d'étapes fixes : seuls les textes (affiché, dit, personnages) et les voix changent */
    if (h.etapes.length !== IDLE_INTRO_SEED_V1.etapes.length) throw new Error("HISTOIRE_INTRO_16_ETAPES");
    h.etapes = h.etapes.map((e, i) => Object.assign({}, e, { image: IDLE_INTRO_SEED_V1.etapes[i].image }));
  }
  const existantes = lireHistoiresV1(sql);
  const ancienne = existantes.find((x) => x.id === h.id);
  if (ancienne && ancienne.vuId && !h.vuId) h.vuId = ancienne.vuId;
  const autres = existantes.filter((x) => x.id !== h.id);
  if (h.actif && h.boss != null) {
    const conflit = autres.find((x) => x.actif && x.boss === h.boss);
    if (conflit) {
      const e = new Error("HISTOIRE_BOSS_DEJA_UTILISE");
      e.autre = conflit.titre;
      throw e;
    }
  }
  sql.exec("INSERT OR REPLACE INTO idle_histoires(id,json,maj) VALUES(?,?,?)", h.id, JSON.stringify(h), maintenant);
  return Object.assign(h, { maj: maintenant });
}

export function supprimerHistoireV1(sql, id) {
  assurerHistoiresV1(sql);
  if (String(id || "") === IDLE_HISTOIRE_INTRO_ID_V1) return;   /* l'intro ne se supprime pas */
  sql.exec("DELETE FROM idle_histoires WHERE id=?", String(id || ""));
}

/* URL de l'image d'une étape (relative au Worker). */
export function urlImageEtapeV1(histoireId, image) {
  const img = String(image || "");
  const legacy = /^legacy:(\d{1,2})$/.exec(img);
  if (legacy) return "/api/idle/media/story?id=" + encodeURIComponent(histoireId) + "&index=" + legacy[1];
  const intro = /^intro:(\d{2})$/.exec(img);
  if (intro) return "/intro/" + intro[1] + ".webp?v=1";
  if (!img) return "";
  return "/api/idle/media/story-image?id=" + encodeURIComponent(histoireId) + "&f=" + encodeURIComponent(img);
}

/*
 * Histoire à jouer pour le boss N (joueur) : jamais les autres. Ne contient que ce dont le popup a besoin -- les textes des autres
 * histoires ne quittent jamais le serveur (anti-spoil, AGENTS.md règle n°2).
 */
export function histoireDuBossV1(sql, boss) {
  const n = Math.floor(Number(boss) || 0);
  if (n < 1) return null;
  const h = lireHistoiresV1(sql).find((x) => x.actif && x.boss === n);
  if (!h) return null;
  return {
    id: h.id,
    titre: h.titre,
    vuId: h.vuId || "histoire:" + h.id,
    voix: h.voix,
    etapes: h.etapes.map((e) => (e.affiche ? { texte: e.texte, affiche: e.affiche, imageUrl: urlImageEtapeV1(h.id, e.image), parleur: e.parleur } : { texte: e.texte, imageUrl: urlImageEtapeV1(h.id, e.image), parleur: e.parleur }))
  };
}

/* L'intro telle que la joue le diaporama (tous les joueurs : c'est le premier écran, aucun spoil) : mêmes champs qu'une histoire de boss. */
export function histoireIntroV1(sql) {
  const h = lireHistoiresV1(sql).find((x) => x.id === IDLE_HISTOIRE_INTRO_ID_V1);
  if (!h) return null;
  return {
    id: h.id,
    titre: h.titre,
    vuId: "",
    voix: h.voix,
    etapes: h.etapes.map((e) => (e.affiche ? { texte: e.texte, affiche: e.affiche, imageUrl: urlImageEtapeV1(h.id, e.image), parleur: e.parleur } : { texte: e.texte, imageUrl: urlImageEtapeV1(h.id, e.image), parleur: e.parleur }))
  };
}
