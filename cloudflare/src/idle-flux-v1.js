/*
 * Fil d'actualité de SOREAL IDLE (Norman, 2026-10-01) : « une manière de voir ce que les gens font dans leur jeu : Mickaël vient de tuer
 * <boss>, Sébastien a débloqué le trophée <trophée>, Sylvain farme dans les égouts, Maxence a terrassé <titan>… pour rendre le jeu plus
 * vivant, et pouvoir voir ces informations dans tous les menus (texte défilant). »
 *
 * Les événements sont DÉDUITS de l'état du joueur à chacun de ses battements (toutes les ~20 s, voir battementSorealIdle) : on compare un
 * instantané (boss, trophées, titans, défis, Rebirths) avec le précédent. Aucune opération du jeu n'est modifiée, et seuls les joueurs
 * dont le jeu est ouvert produisent des événements. Le premier battement d'un joueur ne fait que mémoriser son état (jamais de rafale).
 *
 * Confidentialité : le nom affiché est le même qu'au classement/chat (jamais l'adresse e-mail) ; un joueur qui s'est retiré du classement
 * (stats.classementVisible === false) n'apparaît pas non plus dans le fil.
 * Anti-spoil (AGENTS.md règle n°2) : le serveur stocke le détail brut (n° de boss, nom du titan…) ; c'est le CLIENT qui ne l'affiche que si
 * le lecteur l'a déjà découvert (sinon « a vaincu un boss », « a débloqué un trophée »…), comme pour le chat.
 */
import { sqlRows } from "./core/sqlite-core.js";
import { idleDevEstEmailPartieTestV1 } from "./idle-dev-save-slots-v1.js";

export const IDLE_FLUX_MAX_LIGNES_V1 = 400;
export const IDLE_FLUX_DUREE_MAX_MS_V1 = 48 * 3600 * 1000;
export const IDLE_FLUX_LIMITE_LECTURE_V1 = 40;
/* Un joueur qui change de zone de farm n'est annoncé qu'une fois toutes les 3 minutes au plus. */
export const IDLE_FLUX_DELAI_FARM_MS_V1 = 3 * 60 * 1000;
/* Jamais plus de ce nombre d'événements par battement et par joueur (un gros rattrapage ne doit pas inonder le fil). */
export const IDLE_FLUX_MAX_PAR_BATTEMENT_V1 = 6;
/*
 * « En direct » = ce qui se passe maintenant (Norman, 2026-10-02 : « je joue, Dylan J. joue aussi… aucun message de rattrapage »). Un événement n'est
 * publié que si le joueur était déjà en jeu au battement précédent (moins de 90 s, comme la présence « en ligne ») : au retour d'une absence
 * (onglet fermé, jeu en arrière-plan, téléphone verrouillé), ce qu'il a accompli entre-temps est mémorisé SANS être annoncé. Et un lecteur ne reçoit
 * que des événements de moins de 90 s : jamais ceux qui ont eu lieu avant son arrivée ou pendant son absence.
 */
export const IDLE_FLUX_FRAICHEUR_MS_V1 = 90 * 1000;
/* Un joueur n'est annoncé « connecté » qu'une fois toutes les 5 minutes au plus (un onglet qui se reconnecte en boucle ne doit pas inonder le bandeau). */
export const IDLE_FLUX_DELAI_CONNEXION_MS_V1 = 5 * 60 * 1000;

export function assurerFluxV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_flux(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, email TEXT NOT NULL, nom TEXT NOT NULL, type TEXT NOT NULL, donnees TEXT NOT NULL DEFAULT '{}')");
  sql.exec("CREATE TABLE IF NOT EXISTS idle_flux_etat(email TEXT PRIMARY KEY, etat TEXT NOT NULL, maj INTEGER NOT NULL)");
}

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/*
 * Instantané des jalons d'un joueur, lu dans sa ligne (record de boss + stats.metaNgu). Tout est réduit à des identifiants et des compteurs.
 */
export function instantaneJoueurV1({ bossVaincus = 0, stats = null } = {}) {
  const m = stats && typeof stats === "object" && stats.metaNgu && typeof stats.metaNgu === "object" ? stats.metaNgu : {};
  const succes = Object.keys((m.systems && m.systems.achievements && m.systems.achievements.data && m.systems.achievements.data.unlocked) || {}).sort();
  const titans = {};
  const brutsTitans = (m.adventure && m.adventure.titans) || {};
  for (const [id, t] of Object.entries(brutsTitans)) {
    const k = Math.max(0, Math.floor(N(t && t.kills, 0)));
    if (k > 0) titans[id] = k;
  }
  const defis = {};
  const ch = m.challenge || {};
  for (const [id, n] of Object.entries(ch.completions || {})) if (N(n) > 0) defis["normal:" + id] = Math.floor(N(n));
  for (const tier of ["difficile", "extreme"]) {
    for (const [id, n] of Object.entries((ch.completionsTier && ch.completionsTier[tier]) || {})) if (N(n) > 0) defis[tier + ":" + id] = Math.floor(N(n));
  }
  /* Défi en cours (Norman, 2026-10-02 : « annoncer quand quelqu'un lance un défi ») et sets d'équipement complétés (« quand il complète un set »). */
  const defiActif = String((m.challenge && m.challenge.active) || "");
  const sets = Object.keys((m.adventure && m.adventure.completedSets) || {}).filter((id) => m.adventure.completedSets[id]).sort();
  /* Achats en boutique (Norman, 2026-10-02 : « voir quand quelqu'un effectue un achat dans 1 des boutiques ») : un compteur par boutique (EXP Shop, Boutique AP), jamais le détail. */
  const somme = (o) => Object.values(o && typeof o === "object" ? o : {}).reduce((t, v) => t + Math.max(0, Math.floor(N(v, 0))), 0);
  /* Un compteur PAR ARTICLE (id -> nombre acheté) : l'événement dit ce qui a été acheté (Norman, 2026-10-03 : « on voit l'achat des autres joueurs, oublie le sans spoil »). */
  const parArticle = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).map(([id, v]) => [id, Math.max(0, Math.floor(N(v, 0)))]).filter(([, v]) => v > 0));
  const achats = { exp: parArticle(m.bonuses && m.bonuses.expShop), sellout: parArticle(m.selloutShop && m.selloutShop.purchases) };
  /* Récompense de connexion (Norman, 2026-10-03 : « quand quelqu'un récupère sa récompense journalière, ça doit apparaître dans En Direct »). Seuls les clics de récupération comptent (l'octroi de lancement n'incrémente pas totalReclames). */
  const cal = (m.records && m.records.loginCalendar) || {};
  const calendrier = { reclames: Math.max(0, Math.floor(N(cal.totalReclames, 0))), ap: Math.max(0, Math.floor(N(cal.totalAp, 0))), serie: Math.max(0, Math.floor(N(cal.serie, 0))) };
  /* Fuites et défaites contre un boss (Norman, 2026-10-04 : « écrire quand un joueur prend la fuite ou qu'il perd contre un boss ») : compteurs tenus par le moteur de combat, jamais le détail. */
  const bossFuites = Math.max(0, Math.floor(N(stats && stats.fluxBossFuites, 0)));
  const bossDefaites = Math.max(0, Math.floor(N(stats && stats.fluxBossDefaites, 0)));
  const bossDernier = Math.max(0, Math.floor(N(stats && stats.fluxBossDernier, 0)));
  /* Sorts de Blood Magic lancés (records.bloodSpellsCast / bloodSpellLast) et cinématiques vues (stats.fluxHistoires, tenu par marquerVusSorealIdle) : compteurs seuls. */
  const sorts = Math.max(0, Math.floor(N(m.records && m.records.bloodSpellsCast, 0)));
  const sortDernier = Math.max(0, Math.floor(N(m.records && m.records.bloodSpellLast, 0)));
  const histoires = Math.max(0, Math.floor(N(stats && stats.fluxHistoires, 0)));
  const tf = (m.adventure && m.adventure.titanFlux) || {};
  const titanCombats = Math.max(0, Math.floor(N(tf.starts, 0)));
  const titanPertes = Math.max(0, Math.floor(N(tf.losses, 0)));
  const titanDernier = String(tf.last || "");
  /*
   * Puits sans fond et roue quotidienne (Norman, 2026-10-04 : « quand on balance son or dans le puits, ça doit être inscrit dans En direct, ainsi que la récompense ; pareil pour la roue »). Le dernier jet est lu dans
   * l'historique du système (le plus récent d'abord) ; un jet nouveau = l'heure du dernier lancer a avancé (puits) ou le compteur de tours a augmenté (roue).
   */
  const puits = (m.systems && m.systems.moneyPit && m.systems.moneyPit.data) || {};
  const roue = (m.systems && m.systems.dailySpin && m.systems.dailySpin.data) || {};
  const recompenseSure = (r) => {
    const o = {};
    if (!r || typeof r !== "object") return o;
    for (const [k, v] of Object.entries(r)) {
      if (/^[A-Za-z0-9_]{1,30}$/.test(k) && Number.isFinite(+v)) o[k] = +v;
      else if (k === "items" && v && typeof v === "object") o.items = Math.max(0, Math.floor(Object.values(v).reduce((t, x) => t + (Number.isFinite(+x) ? +x : 0), 0)));
    }
    return o;
  };
  const dernierPuits = Array.isArray(puits.history) && puits.history[0] ? puits.history[0] : null;
  const dernierRoue = Array.isArray(roue.history) && roue.history[0] ? roue.history[0] : null;
  const puitsAt = Math.max(0, Math.floor(N(puits.lastTossAt, 0)));
  const puitsJet = dernierPuits ? { cout: Math.max(0, N(dernierPuits.cost, 0)), recompense: recompenseSure(dernierPuits.reward), boost: Boolean(dernierPuits.boost) } : null;
  const roueN = Math.max(0, Math.floor(N(roue.totalSpins, 0)));
  const roueJet = dernierRoue ? { recompense: recompenseSure(dernierRoue.reward) } : null;
  return {
    puitsAt,
    puitsJet,
    roueN,
    roueJet,
    titanCombats,
    titanPertes,
    titanDernier,
    sorts,
    sortDernier,
    histoires,
    bossFuites,
    bossDefaites,
    bossDernier,
    achats,
    calendrier,
    defiActif,
    /* Dernier défi terminé et le temps qu'il a fallu (Norman, 2026-10-05 : « dis après combien de temps le défi a été complété ») : durée mesurée par le moteur, en secondes. */
    defiDernier: (ch.lastCompletion && ch.lastCompletion.completed) ? { id: String(ch.lastCompletion.completed), tier: String(ch.lastCompletion.tier || "normal"), s: Math.max(0, Math.round(N(ch.lastCompletion.elapsedMs, 0) / 1000)) } : null,
    sets,
    /* Record permanent (jamais remis à 0 par un Rebirth) : seul un boss JAMAIS vaincu auparavant est annoncé, pas les boss refaits à chaque run. */
    bossMax: Math.max(0, Math.floor(N(m.records && m.records.highestBoss, 0))),
    succes,
    titans,
    defis,
    rebirths: Math.max(0, Math.floor(N(m.records && m.records.totalRebirths, 0))),
    /* Durée du dernier run, fixée par le Rebirth lui-même (0 après un Rebirth qui change de difficulté ou lance un défi : alors rien n'est annoncé). */
    dureeRun: Math.max(0, Math.round(N(m.rebirth && m.rebirth.lastRunSeconds, 0)))
  };
}

/*
 * Événements entre deux instantanés. noms = { boss(n), succes(id), titan(id) } renvoient les noms d'origine. Retourne au plus
 * IDLE_FLUX_MAX_PAR_BATTEMENT_V1 événements { type, donnees }.
 */
export function evenementsV1(avant, apres, noms = {}) {
  if (!avant || !apres) return [];
  const nom = (f, x) => { try { return String((typeof f === "function" ? (Array.isArray(x) ? f(...x) : f(x)) : "") || "").slice(0, 80); } catch (_e) { return ""; } };
  const ev = [];
  /* Ancien instantané sans record (compteur de run) : pas de comparaison cette fois-ci, pour ne rien annoncer à tort. */
  if (Number.isFinite(avant.bossMax) && apres.bossMax > avant.bossMax) ev.push({ type: "boss", donnees: { boss: apres.bossMax, nom: nom(noms.boss, apres.bossMax) } });
  const connus = new Set(avant.succes || []);
  let nbSucces = 0;
  for (const id of apres.succes || []) {
    if (connus.has(id) || nbSucces >= 3) continue;
    nbSucces += 1;
    ev.push({ type: "succes", donnees: { id, nom: nom(noms.succes, id) } });
  }
  for (const [id, kills] of Object.entries(apres.titans || {})) {
    if (kills > N((avant.titans || {})[id], 0)) ev.push({ type: "titan", donnees: { id, nom: nom(noms.titan, id) } });
  }
  for (const [cle, n] of Object.entries(apres.defis || {})) {
    if (n > N((avant.defis || {})[cle], 0)) {
      const [tier, id] = cle.split(":");
      const dd = apres.defiDernier;
      ev.push({ type: "defi", donnees: Object.assign({ id, tier, completion: n }, dd && dd.id === id && dd.tier === tier && dd.s > 0 ? { duree: dd.s } : {}) });
    }
  }
  /* Défi lancé : aucun défi actif au battement précédent (instantané d'avant ce jalon : pas de comparaison, rien annoncé à tort). */
  if (typeof avant.defiActif === "string" && avant.defiActif === "" && apres.defiActif) ev.push({ type: "defiLance", donnees: { id: apres.defiActif } });
  /* Set complété : jamais un set déjà complété avant (instantané d'avant ce jalon : pas de comparaison). */
  if (Array.isArray(avant.sets)) {
    const dejaFaits = new Set(avant.sets);
    for (const id of (apres.sets || []).filter((x) => !dejaFaits.has(x)).slice(0, 2)) ev.push({ type: "set", donnees: { id, nom: nom(noms.set, id) } });
  }
  /* Achat en boutique : un événement par boutique dont le compteur d'achats a augmenté (instantané d'avant ce jalon : pas de comparaison, rien annoncé à tort). */
  if (avant.achats && typeof avant.achats === "object" && apres.achats) {
    for (const boutique of ["exp", "sellout"]) {
      const a = avant.achats[boutique];
      const b = apres.achats[boutique];
      if (!a || typeof a !== "object" || !b || typeof b !== "object") continue; /* ancien instantané (compteur seul) : pas de comparaison */
      for (const [id, n] of Object.entries(b)) {
        if (n > N(a[id], 0)) ev.push({ type: "achat", donnees: { boutique, id, n: n - N(a[id], 0), nom: nom(noms.achat, [boutique, id]) } });
      }
    }
  }
  /* Récompense de connexion récupérée : jamais d'annonce depuis un instantané d'avant ce jalon (pas de comparaison possible). */
  if (avant.calendrier && typeof avant.calendrier === "object" && apres.calendrier && apres.calendrier.reclames > N(avant.calendrier.reclames, 0)) {
    ev.push({ type: "calendrier", donnees: { jour: apres.calendrier.serie, ap: Math.max(0, apres.calendrier.ap - N(avant.calendrier.ap, 0)) } });
  }
  /* Fuite / défaite contre un boss : jamais depuis un instantané d'avant ce jalon (pas de comparaison, rien annoncé à tort). Le boss est celui du dernier combat arrêté. */
  if (Number.isFinite(avant.bossFuites) && apres.bossFuites > avant.bossFuites) ev.push({ type: "fuite", donnees: { boss: apres.bossDernier, nom: nom(noms.boss, apres.bossDernier) } });
  if (Number.isFinite(avant.bossDefaites) && apres.bossDefaites > avant.bossDefaites) ev.push({ type: "defaite", donnees: { boss: apres.bossDernier, nom: nom(noms.boss, apres.bossDernier) } });
  /* Sort de sang lancé / cinématique regardée : jamais depuis un instantané d'avant ce jalon (pas de comparaison). Le sort est identifié par son rang (1 à 5), l'affichage dépend du lecteur. */
  if (Number.isFinite(avant.titanCombats) && apres.titanCombats > avant.titanCombats) ev.push({ type: "titanCombat", donnees: { id: apres.titanDernier, nom: nom(noms.titan, apres.titanDernier) } });
  if (Number.isFinite(avant.titanPertes) && apres.titanPertes > avant.titanPertes) ev.push({ type: "titanPerdu", donnees: { id: apres.titanDernier, nom: nom(noms.titan, apres.titanDernier) } });
  /* Puits / roue : jamais depuis un instantané d'avant ce jalon (pas de comparaison, rien annoncé à tort). */
  if (Number.isFinite(avant.puitsAt) && apres.puitsAt > avant.puitsAt && apres.puitsJet) ev.push({ type: "puits", donnees: apres.puitsJet });
  if (Number.isFinite(avant.roueN) && apres.roueN > avant.roueN && apres.roueJet) ev.push({ type: "roue", donnees: apres.roueJet });
  if (Number.isFinite(avant.sorts) && apres.sorts > avant.sorts) ev.push({ type: "sort", donnees: { sort: apres.sortDernier } });
  if (Number.isFinite(avant.histoires) && apres.histoires > avant.histoires) ev.push({ type: "histoire", donnees: {} });
  if (apres.rebirths > avant.rebirths) ev.push({ type: "rebirth", donnees: apres.dureeRun > 0 ? { n: apres.rebirths, duree: apres.dureeRun } : { n: apres.rebirths } });
  return ev.slice(0, IDLE_FLUX_MAX_PAR_BATTEMENT_V1);
}

function lireEtatV1(sql, email) {
  const r = sqlRows(sql.exec("SELECT etat,maj FROM idle_flux_etat WHERE email=?", email))[0];
  if (!r) return null;
  try { return Object.assign(JSON.parse(r.etat), { __maj: Number(r.maj) || 0 }); } catch (_e) { return null; }
}

/*
 * Compare l'instantané du joueur au précédent, enregistre les événements et mémorise le nouvel état. visible=false : rien n'est publié (l'état
 * est tout de même mémorisé, pour ne pas rattraper d'un coup au retour dans le classement). activite = activité normalisée du battement.
 */
export function enregistrerJalonsV1(sql, { email, nom, visible = true, instantane, activite = null, noms = {}, now = Date.now() }) {
  assurerFluxV1(sql);
  const cle = String(email || "").trim().toLowerCase();
  if (!cle || !instantane) return 0;
  /* Partie d'essai (partie B) : rien n'est jamais annoncé, et ce qui l'aurait été avant est effacé. */
  if (idleDevEstEmailPartieTestV1(cle)) { sql.exec("DELETE FROM idle_flux WHERE email LIKE '%+partieb@%'"); return 0; }
  const precedent = lireEtatV1(sql, cle);
  const etat = Object.assign({}, instantane, { farmZone: precedent ? N(precedent.farmZone, 0) : 0, farmAt: precedent ? N(precedent.farmAt, 0) : 0 });
  let ajoutes = 0;
  /* Absence : le dernier battement date de plus de 90 s -> pas d'annonce de rattrapage, seulement la mémorisation du nouvel état. */
  const enDirect = Boolean(precedent) && now - N(precedent.__maj, 0) <= IDLE_FLUX_FRAICHEUR_MS_V1;
  if (precedent && visible && enDirect) {
    const evenements = evenementsV1(precedent, instantane, noms);
    /* Farm : annoncé seulement quand la zone change, au plus toutes les 10 minutes. */
    if (activite && activite.t === "farm" && N(activite.zoneId) > 0 && N(activite.zoneId) !== N(precedent.farmZone, 0) && now - N(precedent.farmAt, 0) >= IDLE_FLUX_DELAI_FARM_MS_V1) {
      evenements.push({ type: "farm", donnees: { zoneId: N(activite.zoneId), zoneNom: String(activite.zoneNom || "").slice(0, 60) } });
      etat.farmZone = N(activite.zoneId);
      etat.farmAt = now;
    }
    for (const e of evenements.slice(0, IDLE_FLUX_MAX_PAR_BATTEMENT_V1)) {
      sql.exec("INSERT INTO idle_flux(at,email,nom,type,donnees) VALUES(?,?,?,?,?)", now, cle, String(nom || "Joueur").slice(0, 80), e.type, JSON.stringify(e.donnees));
      ajoutes += 1;
    }
  } else if (activite && activite.t === "farm" && N(activite.zoneId) > 0) {
    etat.farmZone = N(activite.zoneId);
    etat.farmAt = now;
  }
  sql.exec("INSERT OR REPLACE INTO idle_flux_etat(email,etat,maj) VALUES(?,?,?)", cle, JSON.stringify(etat), now);
  if (ajoutes) {
    sql.exec("DELETE FROM idle_flux WHERE at < ?", now - IDLE_FLUX_DUREE_MAX_MS_V1);
    const dernier = Number(sqlRows(sql.exec("SELECT MAX(id) AS id FROM idle_flux"))[0].id) || 0;
    sql.exec("DELETE FROM idle_flux WHERE id <= ?", dernier - IDLE_FLUX_MAX_LIGNES_V1);
  }
  return ajoutes;
}

/*
 * Connexion d'un joueur (Norman, 2026-10-02 : « quand quelqu'un se connecte, on doit le voir passer »). Appelée au premier battement d'une présence (voir
 * battementV1 : nouvelle présence ou absence de plus de 90 s). Publie « connexion » sauf si ce joueur a déjà été annoncé il y a moins de 5 minutes.
 */
export function enregistrerConnexionFluxV1(sql, { email, nom, visible = true, now = Date.now() }) {
  assurerFluxV1(sql);
  const cle = String(email || "").trim().toLowerCase();
  if (!cle || !visible) return 0;
  if (idleDevEstEmailPartieTestV1(cle)) { sql.exec("DELETE FROM idle_flux WHERE email LIKE '%+partieb@%'"); return 0; }
  const derniere = sqlRows(sql.exec("SELECT MAX(at) AS at FROM idle_flux WHERE email=? AND type='connexion'", cle))[0];
  if (derniere && derniere.at != null && now - Number(derniere.at) < IDLE_FLUX_DELAI_CONNEXION_MS_V1) return 0;
  sql.exec("INSERT INTO idle_flux(at,email,nom,type,donnees) VALUES(?,?,?,?,?)", now, cle, String(nom || "Joueur").slice(0, 80), "connexion", "{}");
  return 1;
}

export function lireFluxV1(sql, { apresId = 0, limite = IDLE_FLUX_LIMITE_LECTURE_V1, email = "", seulementFrais = false, now = Date.now() } = {}) {
  assurerFluxV1(sql);
  const moi = String(email || "").trim().toLowerCase();
  const after = Math.max(0, Math.floor(Number(apresId) || 0));
  const max = Math.max(1, Math.min(IDLE_FLUX_LIMITE_LECTURE_V1, Math.floor(Number(limite) || IDLE_FLUX_LIMITE_LECTURE_V1)));
  /* seulementFrais (lecture « en direct » du bandeau) : jamais d'historique, seulement ce qui date de moins de IDLE_FLUX_FRAICHEUR_MS_V1. */
  const rows = seulementFrais
    ? sqlRows(sql.exec("SELECT id,at,email,nom,type,donnees FROM idle_flux WHERE id > ? AND at >= ? AND email NOT LIKE '%+partieb@%' ORDER BY id LIMIT ?", after, now - IDLE_FLUX_FRAICHEUR_MS_V1, max))
    : after > 0
    ? sqlRows(sql.exec("SELECT id,at,email,nom,type,donnees FROM idle_flux WHERE id > ? AND email NOT LIKE '%+partieb@%' ORDER BY id LIMIT ?", after, max))
    : sqlRows(sql.exec("SELECT id,at,email,nom,type,donnees FROM (SELECT id,at,email,nom,type,donnees FROM idle_flux WHERE email NOT LIKE '%+partieb@%' ORDER BY id DESC LIMIT ?) ORDER BY id", max));
  return rows.map((r) => {
    let donnees = {};
    try { donnees = JSON.parse(r.donnees); } catch (_e) { /* détail illisible : événement sans détail */ }
    return { id: Number(r.id), at: Number(r.at), nom: r.nom, type: r.type, donnees, moi: r.email === moi };
  });
}

export function dernierIdFluxV1(sql) {
  assurerFluxV1(sql);
  const r = sqlRows(sql.exec("SELECT MAX(id) AS id FROM idle_flux"))[0];
  return Number(r && r.id) || 0;
}
