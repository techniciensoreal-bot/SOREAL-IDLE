/*
 * Apparences (« skins ») du chat de la Garderie (2026-10-31) : l'armoire devient un chat-étagère parmi 11. Images R2 : idle/garderie-skins/<id>.webp
 * (route /api/idle/media/garderie-skin?id=<id>, idle-media-v1.js). Choix cosmétique stocké dans state.records.daycareSkin (identifiant TEXTE,
 * exclu de la coercion des records en compteurs, idle-ngu-etat.js).
 *
 * Conditions (wiki NGU Idle, pages Daycare Kitty / Item Daycare / Wishes / Fibonacci Perk / 4G's Sellout Shop, vérifiées par Norman) :
 *  - defaut : toujours possédé ;
 *  - noeud (« pretty kitty ») : choix du chaton au « Special Prize » (state.records.specialPrizeChoice === 2, y compris le rattrapage d'un
 *    Special Prize réclamé avant l'existence du choix, comme portraitEnvV1) ;
 *  - arcenciel (Nyankitty) : souhait n°44 « I wish there was more cute Daycare Kitty Art » au niveau 1 ;
 *  - fibonacci : niveau 1597 du perk Fibonacci (id 94, cap 1597) ;
 *  - matrix : achat « Daycare Kitty Art! » (4G's Sellout Shop, 250 000 AP). Le wiki parle de « plusieurs nouveaux designs » mais ne nomme que
 *    Matrix : seul Matrix est rattaché ;
 *  - dore, chauvesouris, tchernobyl, pirate, noel, nega : conditions NON publiées par le wiki (fonctionnalités SOREAL), décidées par Norman le
 *    2026-10-31 :
 *      chauvesouris : se connecter du 31 octobre 00:00 au 7 novembre 23:59 (heure de Bruxelles), chaque année (fin repoussée du 1er au 7 novembre par Norman, 2026-10-31) ;
 *      noel : se connecter du 24 décembre 00:00 au 2 janvier 23:59 (heure de Bruxelles, chevauche deux années), chaque année ;
 *      dore (« Premium ») : remplir TOUTES les cases d'un mois du calendrier de connexion (idle-login-calendar-v1.js) ;
 *      tchernobyl : vaincre le boss 296 (« Tippi la Souris du Tutoriel ») ; pirate : vaincre le boss 289 (« PirateGirl ») ;
 *      nega : commencer une partie en Evil : state.difficulty ("normal" | "difficile" = Evil | "extreme" = Sadistic) n'est plus "normal" ; Sadistic implique Evil avant, donc acquis aussi (rétroactif).
 *    Les skins « acquis » (fenêtre, calendrier) sont ENREGISTRÉS dans state.records.daycareSkinsAcquis (ids séparés par des virgules) : acquis
 *    pour toujours. Les skins de boss se dérivent de records.highestBoss (maximum, ne recule jamais ; boss N vaincu = highestBoss >= N, comme les
 *    succès « Defeat Boss N »). state.records.daycareSkinsVus : skins dont le joueur a validé l'annonce (fenêtre « Cool »).
 * Anti-spoil (règle n°2) : l'état client ne contient QUE les ids possédés, jamais de total ni de skin non possédé.
 */

import { idleLoginCalendarJoursDuMoisV1, idleLoginCalendarNormaliserV1 } from "./idle-login-calendar-v1.js";

export const IDLE_DAYCARE_SKIN_DEFAUT_V1 = "defaut";
export const IDLE_DAYCARE_FIBONACCI_PERK_ID_V1 = 94;
export const IDLE_DAYCARE_FIBONACCI_NIVEAU_V1 = 1597;
export const IDLE_DAYCARE_WISH_ART_ID_V1 = 44;

/* Fenêtre annuelle d'Halloween (heure de Bruxelles) : MÊME constante pour le chat chauve-souris et le portrait Sleepy Hollow (idle-portraits-v1.js). */
export const IDLE_FENETRE_HALLOWEEN_V1 = Object.freeze({ de: Object.freeze([10, 31]), a: Object.freeze([11, 7]) });

/* [id, condition] : condition = null → jamais possédé (non publiée). */
const TABLE_V1 = [
  ["defaut", { type: "defaut" }],
  ["noeud", { type: "specialPrize" }],
  ["arcenciel", { type: "wish", wish: IDLE_DAYCARE_WISH_ART_ID_V1 }],
  ["fibonacci", { type: "perk", perk: IDLE_DAYCARE_FIBONACCI_PERK_ID_V1, level: IDLE_DAYCARE_FIBONACCI_NIVEAU_V1 }],
  ["dore", { type: "acquis", via: "calendrier" }],
  ["matrix", { type: "achat", achat: "daycareKittyArt" }],
  ["chauvesouris", { type: "acquis", via: "fenetre", de: IDLE_FENETRE_HALLOWEEN_V1.de, a: IDLE_FENETRE_HALLOWEEN_V1.a }],
  ["tchernobyl", { type: "boss", boss: 296 }],
  ["pirate", { type: "boss", boss: 289 }],
  ["noel", { type: "acquis", via: "fenetre", de: [12, 24], a: [1, 2] }],
  /* nega : commencer le jeu en Evil (précisé par Norman, 2026-10-31). */
  ["nega", { type: "acquis", via: "difficulte" }]
];

export const IDLE_DAYCARE_SKINS_V1 = Object.freeze(TABLE_V1.map(([id, condition]) => Object.freeze({ id, condition: condition ? Object.freeze(condition) : null })));
export const IDLE_DAYCARE_SKIN_IDS_V1 = Object.freeze(IDLE_DAYCARE_SKINS_V1.map((s) => s.id));

function nombreV1(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/*
 * env : { specialPrizeChoice (0/1/2), wishLevel(id), perkLevel(id), achats(id) → quantité achetée à la Sellout Shop }.
 * Un env incomplet = condition non remplie.
 */
export function skinPossedeV1(skin, env = {}) {
  const c = skin.condition;
  if (!c) return false;
  if (c.type === "defaut") return true;
  if (c.type === "specialPrize") return nombreV1(env.specialPrizeChoice) === 2;
  if (c.type === "wish") return typeof env.wishLevel === "function" && nombreV1(env.wishLevel(c.wish)) >= 1;
  if (c.type === "perk") return typeof env.perkLevel === "function" && nombreV1(env.perkLevel(c.perk)) >= c.level;
  if (c.type === "achat") return typeof env.achats === "function" && nombreV1(env.achats(c.achat)) >= 1;
  if (c.type === "boss") return nombreV1(env.highestBoss) >= c.boss;
  if (c.type === "acquis") return Array.isArray(env.acquis) && env.acquis.includes(skin.id);
  return false;
}

/* Liste d'ids (chaîne « a,b,c ») assainie : ids connus, sans doublon (records.daycareSkinsAcquis / daycareSkinsVus). */
export function idsSkinsDeChaineV1(v) {
  const vus = new Set();
  for (const id of String(typeof v === "string" ? v : "").split(",")) if (IDLE_DAYCARE_SKIN_IDS_V1.includes(id)) vus.add(id);
  return IDLE_DAYCARE_SKIN_IDS_V1.filter((id) => vus.has(id));
}
export const chaineSkinsNormaliseeV1 = (v) => idsSkinsDeChaineV1(v).join(",");

const formateurBruxellesV1 = (() => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" });
  } catch (_e) {
    return null;
  }
})();

/* { annee, mois (1-12), jour } du jour calendaire de Bruxelles pour un instant (ms) ; l'instant vient du moteur (heure du serveur), jamais de l'horloge de l'appareil. */
export function jourBruxellesV1(ms) {
  const t = Number.isFinite(Number(ms)) ? Number(ms) : Date.now();
  if (formateurBruxellesV1) {
    const parts = formateurBruxellesV1.formatToParts(new Date(t));
    const lire = (type) => Number(parts.find((p) => p.type === type)?.value);
    const annee = lire("year");
    const mois = lire("month");
    const jour = lire("day");
    if (annee > 0 && mois > 0 && jour > 0) return { annee, mois, jour };
  }
  const d = new Date(t + 3600000);
  return { annee: d.getUTCFullYear(), mois: d.getUTCMonth() + 1, jour: d.getUTCDate() };
}

/* Le jour (mois, jour) est dans la fenêtre annuelle [de, a] (bornes incluses) ; une fenêtre qui chevauche le nouvel an (de > a) est gérée. */
export function dansFenetreAnnuelleV1(mois, jour, de, a) {
  const v = mois * 100 + jour;
  const d = de[0] * 100 + de[1];
  const f = a[0] * 100 + a[1];
  return d <= f ? v >= d && v <= f : v >= d || v <= f;
}

/* Le calendrier de connexion enregistré montre un mois COMPLET (toutes les cases du mois enregistré réclamées). */
export function calendrierMoisCompletV1(rec) {
  const c = idleLoginCalendarNormaliserV1(rec);
  const m = /^(\d{4})-(\d{2})$/.exec(c.mois);
  if (!m) return false;
  const jours = idleLoginCalendarJoursDuMoisV1(Number(m[1]), Number(m[2]));
  return c.cases.filter((d) => d >= 1 && d <= jours).length === jours;
}

/*
 * Enregistre les skins « acquis » vus à l'instant `ms` (heure du moteur) : fenêtres annuelles (heure de Bruxelles) et calendrier complet. Idempotent,
 * appelé à chaque avance de l'état (donc à chaque synchro et chaque action). Renvoie true si l'enregistrement a changé.
 */
export function acquerirSkinsV1(state, ms) {
  const records = state.records;
  const actuels = idsSkinsDeChaineV1(records.daycareSkinsAcquis);
  const nouveaux = new Set(actuels);
  const jb = jourBruxellesV1(ms);
  let complet = null;
  const enEvil = state.difficulty === "difficile" || state.difficulty === "extreme";
  for (const s of IDLE_DAYCARE_SKINS_V1) {
    const c = s.condition;
    if (!c || c.type !== "acquis" || nouveaux.has(s.id)) continue;
    if (c.via === "fenetre" && dansFenetreAnnuelleV1(jb.mois, jb.jour, c.de, c.a)) nouveaux.add(s.id);
    else if (c.via === "difficulte") {
      if (enEvil) nouveaux.add(s.id);
    } else if (c.via === "calendrier") {
      if (complet === null) complet = calendrierMoisCompletV1(records.loginCalendar);
      if (complet) nouveaux.add(s.id);
    }
  }
  if (nouveaux.size === actuels.length) return false;
  records.daycareSkinsAcquis = chaineSkinsNormaliseeV1([...nouveaux].join(","));
  return true;
}

export function skinsPossedesV1(state, env = {}) {
  void state;
  return IDLE_DAYCARE_SKINS_V1.filter((s) => skinPossedeV1(s, env)).map((s) => s.id);
}

/* Skin choisi si encore possédé, sinon « defaut ». */
export function skinActifV1(state, env = {}) {
  const choix = String(state?.records?.daycareSkin || "");
  return choix && skinsPossedesV1(state, env).includes(choix) ? choix : IDLE_DAYCARE_SKIN_DEFAUT_V1;
}

/* Action « daycareSkin » : refuse un skin inconnu ou non possédé. Renvoie l'id retenu. */
export function choisirSkinV1(state, id, env = {}) {
  const skin = String(id || "");
  if (!IDLE_DAYCARE_SKIN_IDS_V1.includes(skin)) throw new Error("SKIN_GARDERIE_INCONNU");
  if (!skinsPossedesV1(state, env).includes(skin)) throw new Error("SKIN_GARDERIE_VERROUILLE");
  state.records.daycareSkin = skin;
  return skin;
}

/* Action « daycareSkinVu » : le joueur a validé l'annonce d'un skin POSSÉDÉ (jamais d'un skin non possédé : aucune fuite). */
export function marquerSkinVuV1(state, id, env = {}) {
  const skin = String(id || "");
  if (!IDLE_DAYCARE_SKIN_IDS_V1.includes(skin)) throw new Error("SKIN_GARDERIE_INCONNU");
  if (!skinsPossedesV1(state, env).includes(skin)) throw new Error("SKIN_GARDERIE_VERROUILLE");
  const vus = new Set(idsSkinsDeChaineV1(state.records.daycareSkinsVus));
  vus.add(skin);
  state.records.daycareSkinsVus = chaineSkinsNormaliseeV1([...vus].join(","));
  return skin;
}

/* Pièce d'état client : { actif, possedes, nouveaux } (ids possédés uniquement ; nouveaux = possédés dont l'annonce n'a pas été validée, « defaut » exclu). */
export function skinsSnapshotV1(state, env = {}) {
  const possedes = skinsPossedesV1(state, env);
  const vus = idsSkinsDeChaineV1(state.records?.daycareSkinsVus);
  return { actif: skinActifV1(state, env), possedes, nouveaux: possedes.filter((id) => id !== IDLE_DAYCARE_SKIN_DEFAUT_V1 && !vus.includes(id)) };
}
