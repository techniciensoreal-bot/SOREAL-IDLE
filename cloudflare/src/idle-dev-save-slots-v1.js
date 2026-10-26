/*
 * SOREAL IDLE — deux parties pendant la période de développement (2026-09-24, restauré 2026-09-27).
 *
 * Demande de Norman : « la possibilité, uniquement pendant la période de développement, de pouvoir switcher entre 2 parties.
 * 1 que je jouerai vraiment sans jamais reset et l'autre que je vais reset régulièrement pour comparer à NGU IDLE. »
 * Retiré le 2026-09-26 (nettoyage général, en même temps que « Réinitialiser TOUS les joueurs »), puis redemandé le 2026-09-27 :
 * « J'aimerai avoir une partie B dans paramètres. Mais cette partie B ne serait pas reprise dans le classement. ça me permettra
 * de tester des choses. » Restauré à l'identique (le mécanisme d'exclusion du classement, lui, n'avait jamais été retiré --
 * voir joueurExclusClassementSorealIdle_, idle-sqlite-runtime.js).
 *
 * Principe : la partie « B » est une seconde ligne JOUEURS, retrouvée par une adresse alias (`nom+partieb@domaine`) au lieu de
 * l'adresse réelle. Toute la progression (Basic Training, NGU, Aventure, inventaire, etc.) vit dans la ligne du joueur : les deux
 * parties sont donc totalement indépendantes, et « Réinitialiser » ne touche que la partie active. La partie « A » est celle
 * qui a toujours existé (adresse réelle) : elle n'est jamais modifiée par ce mécanisme.
 *
 * Réservé au compte administrateur (Norman) et retirable d'un seul geste : passer `enabled` à false désactive le sélecteur ET force
 * toutes les sessions sur la partie A côté serveur (rien à nettoyer ailleurs), au lancement public.
 */
/*
 * 2026-10-26 (Norman : « je veux que pour tout le monde on ait la possibilité d'avoir partie A, B et C, avec le même principe, on passe de l'une à l'autre en cliquant dessus ») : le sélecteur n'est plus réservé à l'administrateur.
 * Chaque joueur a trois parties indépendantes : A (la sienne, adresse réelle), B et C (lignes JOUEURS alias « nom+partieb@… » / « nom+partiec@… »). B et C restent des parties d'ESSAI : jamais au classement, jamais dans « En direct »,
 * ni dans la liste des joueurs en ligne, ni au chat. Les outils d'essai de l'administrateur (valeurs de départ, copie de la partie A) restent réservés à l'administrateur.
 */
export const IDLE_DEV_SAVE_SLOTS_V1 = Object.freeze({
  enabled: true,
  adminEmail: "technicien.soreal@gmail.com",
  aliasTag: "partieb",
  aliasTags: Object.freeze({ b: "partieb", c: "partiec" }),
  labels: Object.freeze({ b: " (B)", c: " (C)" }),
  labelB: " (B)"
});

function emailsOfUserV1(user) {
  if (!user || typeof user !== "object") return [];
  return [...new Set([user.email, user.emailConnexion]
    .concat(Array.isArray(user.emails) ? user.emails : [])
    .map(value => String(value || "").trim().toLowerCase())
    .filter(Boolean))];
}

/* Vrai si le sélecteur de parties existe pour cet utilisateur : tout joueur identifié (fonction active). */
export function idleDevSlotsAvailableV1(user) {
  return IDLE_DEV_SAVE_SLOTS_V1.enabled === true && emailsOfUserV1(user).length > 0;
}

/* Vrai pour le compte administrateur : seul lui a les outils d'essai (valeurs de départ, copie de la partie A). */
export function idleDevEstAdminV1(user) {
  return IDLE_DEV_SAVE_SLOTS_V1.enabled === true && emailsOfUserV1(user).includes(IDLE_DEV_SAVE_SLOTS_V1.adminEmail);
}

export function idleDevNormalizeSlotV1(value) {
  const v = String(value == null ? "" : value).trim().toLowerCase();
  return v === "b" || v === "c" ? v : "a";
}

/* Partie effectivement jouée : "b" ou "c" seulement si la session l'a choisie. */
export function idleDevSlotForUserV1(user) {
  return idleDevSlotsAvailableV1(user) ? idleDevNormalizeSlotV1(user && user.slot) : "a";
}

/*
 * Les parties B et C sont des parties d'ESSAI (Norman, 2026-10-05 : « les joueurs ne doivent pas voir ce que tu fais ») : elles n'apparaissent jamais dans « En direct », ni dans la liste des joueurs en ligne, ni au classement.
 * Vrai pour une adresse alias « nom+partieb@… » ou « nom+partiec@… ».
 */
export function idleDevEstEmailPartieTestV1(email) {
  const v = String(email || "").toLowerCase();
  return v.indexOf("+partieb@") !== -1 || v.indexOf("+partiec@") !== -1;
}

/* Adresse sous laquelle la ligne de la partie B ou C est stockée / retrouvée (la partie A garde l'adresse réelle). */
export function idleDevAliasEmailV1(email, slot) {
  const value = String(email || "").trim().toLowerCase();
  const cible = idleDevNormalizeSlotV1(slot);
  if (cible === "a" || !value) return value;
  const at = value.lastIndexOf("@");
  if (at <= 0) return value;
  return value.slice(0, at) + "+" + IDLE_DEV_SAVE_SLOTS_V1.aliasTags[cible] + value.slice(at);
}

/* Identité de la partie B ou C dérivée de l'identité réelle : mêmes droits, autre ligne JOUEURS. */
export function idleDevUserForSlotV1(user, slot) {
  const cible = idleDevNormalizeSlotV1(slot);
  if (cible === "a" || !user) return user;
  const alias = value => idleDevAliasEmailV1(value, cible);
  return Object.assign({}, user, {
    email: alias(user.email),
    emailConnexion: alias(user.emailConnexion || user.email),
    emails: emailsOfUserV1(user).map(alias),
    prenom: String(user.prenom || "Joueur").trim() + IDLE_DEV_SAVE_SLOTS_V1.labels[cible]
  });
}
