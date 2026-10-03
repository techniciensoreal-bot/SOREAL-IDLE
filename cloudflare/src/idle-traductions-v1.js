/*
 * Choix de la langue des items et des textes (Norman, 2026-10-03) : « traduits entièrement en français ce qu'il reste. Mais j'aimerais pouvoir choisir entre Anglais et Français dans l'interface
 * pour les items et textes. Anglais, ce serait les originaux de ce qu'on a traduit. »
 *
 * Principe : le moteur ne change pas (identifiants et valeurs du wiki intacts, état enregistré intact). La traduction est faite sur la RÉPONSE, juste avant l'envoi au client, d'après la langue
 * choisie par le joueur (en-tête / champ `langue` envoyé par le pont du client : « fr » par défaut, « en » = textes d'origine).
 *   - « fr » : les textes d'origine encore anglais (atouts, manies, souhaits, boutique, succès, ennemis…) sont remplacés par leur traduction (design/traductions/fr/*.json) ;
 *   - « en » : les noms DÉJÀ traduits à la source (objets, sets, boss) retrouvent leur nom d'origine.
 * Remplacement par correspondance EXACTE d'une chaîne entière (jamais de morceau de phrase) : une valeur qui n'est pas dans les tables reste telle quelle. Copie à l'écriture : aucun objet
 * partagé (catalogues figés, mémos du moteur) n'est modifié.
 */
import ATOUTS from "../../design/traductions/fr/perks.json" with { type: "json" };
import MANIES from "../../design/traductions/fr/quirks.json" with { type: "json" };
import SOUHAITS from "../../design/traductions/fr/wishes.json" with { type: "json" };
import BOUTIQUE from "../../design/traductions/fr/sellout.json" with { type: "json" };
import SUCCES from "../../design/traductions/fr/achievements.json" with { type: "json" };
import DIVERS from "../../design/traductions/fr/misc.json" with { type: "json" };
import ENNEMIS from "../../design/traductions/fr/mobs.json" with { type: "json" };
import BOSS_NOMS from "../../design/ngu-boss-names-fr.json" with { type: "json" };
import { NOMS_PIECES_FR_V1, NOMS_SPECIALS_FR_V1, NOMS_SETS_FR_V1, NOMS_SETS_OBJETS_FR_V1 } from "./idle-noms-fr-v1.js";
import {
  SET_ITEM_NAMES_EN_V1,
  SPECIALS_EN_V1,
  NOMS_SETS_EN_V1,
  NOMS_SETS_OBJETS_EN_V1
} from "./idle-adventure-v47.js";

function versMap_(...tables) {
  const m = new Map();
  for (const t of tables) for (const [en, fr] of Object.entries(t)) if (typeof fr === "string" && fr && fr !== en) m.set(en, fr);
  return m;
}

/* Anglais -> français : tout ce qui sort encore en anglais du moteur. */
const EN_VERS_FR_V1 = versMap_(ATOUTS, MANIES, SOUHAITS, BOUTIQUE, SUCCES, DIVERS, ENNEMIS);

/* Français -> anglais : les noms déjà traduits à la source (même couple d'origine que les tables de traduction). */
const FR_VERS_EN_V1 = (() => {
  const m = new Map();
  const paire = (fr, en) => { if (fr && en && fr !== en && !m.has(fr)) m.set(fr, en); };
  for (const [cle, fr] of Object.entries(NOMS_PIECES_FR_V1)) paire(fr, SET_ITEM_NAMES_EN_V1[cle]);
  for (const [id, fr] of Object.entries(NOMS_SPECIALS_FR_V1)) paire(fr, SPECIALS_EN_V1[id] && SPECIALS_EN_V1[id].name);
  for (const [id, fr] of Object.entries(NOMS_SETS_FR_V1)) paire(fr, NOMS_SETS_EN_V1[id]);
  for (const [id, fr] of Object.entries(NOMS_SETS_OBJETS_FR_V1)) paire(fr, NOMS_SETS_OBJETS_EN_V1[id]);
  for (const b of BOSS_NOMS) paire(b.nomFr, b.nomEn);
  /* Les traductions françaises de la page « divers » (cœurs, titans…) retrouvent aussi leur original quand la source les avait déjà en français. */
  for (const [en, fr] of Object.entries(DIVERS)) paire(fr, en);
  return m;
})();

export const IDLE_LANGUES_V1 = Object.freeze(["fr", "en"]);
export const idleLangueValideV1 = (l) => (l === "en" ? "en" : "fr");

function marcher_(v, table) {
  if (typeof v === "string") {
    const t = table.get(v);
    return t === undefined ? v : t;
  }
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) {
    let copie = null;
    for (let i = 0; i < v.length; i++) {
      const x = v[i];
      const y = marcher_(x, table);
      if (y !== x) {
        if (!copie) copie = v.slice();
        copie[i] = y;
      }
    }
    return copie || v;
  }
  let copie = null;
  for (const k of Object.keys(v)) {
    /* Champs d'origine (nameEn, setNameEn) : jamais traduits (recherche du coffre dans les deux langues). */
    if (k === "nameEn" || k === "setNameEn") continue;
    const x = v[k];
    const y = marcher_(x, table);
    if (y !== x) {
      if (!copie) copie = Object.assign({}, v);
      copie[k] = y;
    }
  }
  return copie || v;
}

/* Traduit une réponse du moteur selon la langue du joueur. Renvoie la même valeur si rien ne change. */
export function traduireReponseV1(reponse, langue) {
  const table = idleLangueValideV1(langue) === "en" ? FR_VERS_EN_V1 : EN_VERS_FR_V1;
  return marcher_(reponse, table);
}

export const IDLE_TRADUCTIONS_STATS_V1 = Object.freeze({ enVersFr: EN_VERS_FR_V1.size, frVersEn: FR_VERS_EN_V1.size });
