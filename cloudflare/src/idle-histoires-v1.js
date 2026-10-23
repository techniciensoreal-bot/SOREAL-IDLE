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
 * dès que le boss 17 est mort). Les deux premières histoires sont insérées UNE fois (drapeau seed_v1) : les supprimer ne les recrée pas.
 */
import { sqlRows, safeJson } from "./core/sqlite-core.js";

export const IDLE_HISTOIRE_ID_RE_V1 = /^[A-Za-z0-9_-]{1,60}$/;
export const IDLE_HISTOIRE_IMAGE_RE_V1 = /^(legacy:\d{1,2}|[A-Za-z0-9_.-]{1,90})$/;
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
 },
 {
  "id": "MagicienEtLeGrotte2",
  "vuId": "histoire:magicienEtLaGrotte2",
  "titre": "Le Magicien et la Grotte 2",
  "boss": null,
  "actif": true,
  "voix": [],
  "etapes": [
  {
    "texte": "Les taupes, amochées et couvertes de bleus, te laissent passer en grommelant « T'es vraiment un connard, Chad... » et tu aperçois enfin ton objectif : un épais gaz bleu qui stagne tout au fond de cette grotte.",
    "image": "legacy:1"
   },
  {
    "texte": "Tu brandis la petite cartouche de métal que le sorcier t'a donnée et, dans un « WHOUMPF », la majeure partie du gaz y est aspirée.",
    "image": "legacy:2"
   },
  {
    "texte": "Sur le chemin du retour vers la cabane du sorcier, tu bricoles la machine à remonter le temps, te regardant tuer la Gorgone encore et encore et ramasser tout ce butin. Ah, les souvenirs... Peut-être que tu t'achèteras ce village quand tout sera fini.",
    "image": "legacy:3"
   },
  {
    "texte": "Peu après, tu te hisses à la surface, enfin capable d'avoir un instant de lucidité. Le sorcier frappe dans ses mains et glousse de joie en te voyant revenir. « Parfait, PARFAIT, j'étais presque à court de cette came ! » Stupéfait, tu le regardes vider la cartouche dans son chaudron et lui donner une petite tape, un peu de gaz bleu s'infiltrant dans le mélange. Il remue une fois, deux fois, trois fois dans le sens des aiguilles d'une montre, puis une fois dans l'autre sens, et te fait signe d'approcher.",
    "image": "legacy:4"
   },
  {
    "texte": "« Bon, je ne peux pas régler tes problèmes de mémoire, mais je crois savoir qui le pourrait. Mais d'abord, tiens, bois une gorgée.",
    "image": "legacy:5"
   },
  {
    "texte": "Je ne sais pas ce qui est arrivé à tes pouvoirs magiques, mais ça devrait au moins leur donner un coup de fouet ! » Ça a le goût d'un mélange de sirop contre la toux, de rhum et de tonte de pelouse, mais tu parviens à l'avaler. À peine s'est-il installé dans ton estomac que tu ressens une sensation... une sensation magique. Pourtant, elle ne te semble pas si étrangère. « Voilà, mon gars, tu devrais pouvoir refaire quelques-uns de tes tours de magie ! Je suis sûr que le reste reviendra avec le temps. Maintenant, pour la personne qui peut t'aider... la dernière fois que j'en ai entendu parler, elle filait vers cette fête interdimensionnelle. Tu sais, celle qui traverse l'espace et le temps sans jamais s'arrêter... avec de l'alcool gratuit ! Tu devrais pouvoir la rattraper si tu te dépêches ! Elle doit encore voler quelque part dans le ciel ! »",
    "image": "legacy:6"
   },
  {
    "texte": "Tu sors et lèves les yeux au ciel, avant de te rappeler... que tu ne sais pas voler ! Le sorcier ricane en te voyant sauter en l'air pour rien. « T'as la MAGIE, maintenant, tu te rappelles ?",
    "image": "legacy:7"
   },
  {
    "texte": "Pfff, les jeunes d'aujourd'hui, toujours à avoir la mémoire en vrac et... » Le sorcier marmonne des mots incompréhensibles en rentrant chez lui. Un peu honteux, tu te concentres de toutes tes forces, tu prends ton élan, tu sautes... et tu trébuches. Mais tu ne touches pas le sol : tu parviens à t'élever dans les airs et tu décolles !",
    "image": "legacy:8"
   },
  {
    "texte": "Ouais, carrément ! Maintenant que tu es en l'air, ça te paraît presque naturel : tu piques, tu fais des loopings... et tu percutes tête la première un flou jaune.",
    "image": "legacy:9"
   },
  {
    "texte": "Tu te ressaisis juste à temps pour voir un drôle de gamin avec une queue passer en trombe devant toi, l'air aussi fier de lui que possible. Il est temps de lui donner une leçon.",
    "image": "legacy:10"
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
   * Restauration (Norman, 2026-10-23 : « Un Gamin sur un Nuage. Son histoire a disparu. Celle qui commence par "Les taupes, amochées et couvertes de bleus…" ») : une seule fois, l'histoire « Le Magicien et la Grotte 2 » est
   * remise (recréée si elle avait été supprimée) et rattachée à la mort du boss 37 (la 5e taupe géante : c'est quand le boss suivant, « Un Gamin sur un Nuage », est sélectionné qu'elle se joue) si elle n'avait AUCUN boss ;
   * une histoire déjà rattachée à un boss, des voix déjà générées ou un texte modifié ne sont jamais touchés ; aucun autre boss n'est pris si l'histoire de la mort du 37 existe déjà.
   */
  const v2 = sqlRows(sql.exec("SELECT v FROM idle_histoires_meta WHERE k='seed_v2'"))[0];
  if (!v2) {
    const ligne = sqlRows(sql.exec("SELECT json FROM idle_histoires WHERE id='MagicienEtLeGrotte2'"))[0];
    const toutes = sqlRows(sql.exec("SELECT id,json FROM idle_histoires")).map((r) => ({ id: r.id, h: safeJson(r.json, null) })).filter((x) => x.h);
    const occupe = toutes.some((x) => x.id !== "MagicienEtLeGrotte2" && x.h.actif !== false && Number(x.h.boss) === 37);
    if (!ligne) {
      const seed = IDLE_HISTOIRES_SEED_V1.find((h) => h.id === "MagicienEtLeGrotte2");
      if (seed) sql.exec("INSERT OR IGNORE INTO idle_histoires(id,json,maj) VALUES(?,?,?)", seed.id, JSON.stringify(Object.assign({}, seed, { boss: occupe ? null : 37, actif: true })), maintenant);
    } else {
      const h = safeJson(ligne.json, null);
      if (h && typeof h === "object" && (h.boss === null || h.boss === undefined || h.boss === "") && !occupe) {
        sql.exec("UPDATE idle_histoires SET json=?, maj=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(Object.assign({}, h, { boss: 37, actif: true })), maintenant);
      }
    }
    sql.exec("INSERT OR REPLACE INTO idle_histoires_meta(k,v) VALUES('seed_v2','1')");
  }
  /*
   * Retraduction (Norman, 2026-10-23 : « retraduis juste celui-là, le long texte où il découvre qu'il peut voler ») : une seule fois, si les dix étapes de l'histoire 2 portent encore l'ancienne traduction (la première
   * étape contient « un gaz bleu épais »), leur texte est remplacé par la nouvelle (images et personnages gardés, voix à refaire : liste vidée). Un texte déjà modifié par l'administrateur n'est jamais touché.
   */
  const v3 = sqlRows(sql.exec("SELECT v FROM idle_histoires_meta WHERE k='seed_v3'"))[0];
  if (!v3) {
    const ligne = sqlRows(sql.exec("SELECT json FROM idle_histoires WHERE id='MagicienEtLeGrotte2'"))[0];
    const seed = IDLE_HISTOIRES_SEED_V1.find((h) => h.id === "MagicienEtLeGrotte2");
    const h = ligne ? safeJson(ligne.json, null) : null;
    if (seed && h && Array.isArray(h.etapes) && h.etapes.length === seed.etapes.length && /un gaz bleu épais/.test(String((h.etapes[0] && h.etapes[0].texte) || ""))) {
      const etapes = h.etapes.map((e, i) => { const n = Object.assign({}, e, { texte: seed.etapes[i].texte }); delete n.affiche; return n; });
      sql.exec("UPDATE idle_histoires SET json=?, maj=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(Object.assign({}, h, { etapes, voix: [] })), maintenant);
    }
    sql.exec("INSERT OR REPLACE INTO idle_histoires_meta(k,v) VALUES('seed_v3','1')");
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
  sql.exec("DELETE FROM idle_histoires WHERE id=?", String(id || ""));
}

/* URL de l'image d'une étape (relative au Worker). */
export function urlImageEtapeV1(histoireId, image) {
  const img = String(image || "");
  const legacy = /^legacy:(\d{1,2})$/.exec(img);
  if (legacy) return "/api/idle/media/story?id=" + encodeURIComponent(histoireId) + "&index=" + legacy[1];
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
