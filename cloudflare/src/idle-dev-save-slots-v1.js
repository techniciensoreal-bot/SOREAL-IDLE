/*
 * SOREAL IDLE — deux parties pendant la période de développement (2026-09-24).
 *
 * Demande de Norman : « la possibilité, uniquement pendant la période de développement, de pouvoir switcher entre 2 parties.
 * 1 que je jouerai vraiment sans jamais reset et l'autre que je vais reset régulièrement pour comparer à NGU IDLE. »
 *
 * Principe : la partie « B » est une seconde ligne JOUEURS, retrouvée par une adresse alias (`nom+partieb@domaine`) au lieu de
 * l'adresse réelle. Toute la progression (Basic Training, NGU, Aventure, inventaire, etc.) vit dans la ligne du joueur : les deux
 * parties sont donc totalement indépendantes, et « Réinitialiser » ne touche que la partie active. La partie « A » est celle
 * qui a toujours existé (adresse réelle) : elle n'est jamais modifiée par ce mécanisme.
 *
 * Réservé au compte administrateur (Norman) et retirable d'un seul geste : passer `enabled` à false désactive le sélecteur ET force
 * toutes les sessions sur la partie A côté serveur (rien à nettoyer ailleurs), au lancement public.
 */
export const IDLE_DEV_SAVE_SLOTS_V1 = Object.freeze({
  enabled: true,
  adminEmail: "technicien.soreal@gmail.com",
  aliasTag: "partieb",
  labelB: " (B)"
});

function emailsOfUserV1(user) {
  if (!user || typeof user !== "object") return [];
  return [...new Set([user.email, user.emailConnexion]
    .concat(Array.isArray(user.emails) ? user.emails : [])
    .map(value => String(value || "").trim().toLowerCase())
    .filter(Boolean))];
}

/* Vrai si le sélecteur de parties existe pour cet utilisateur (fonction active ET compte administrateur). */
export function idleDevSlotsAvailableV1(user) {
  return IDLE_DEV_SAVE_SLOTS_V1.enabled === true && emailsOfUserV1(user).includes(IDLE_DEV_SAVE_SLOTS_V1.adminEmail);
}

export function idleDevNormalizeSlotV1(value) {
  return String(value == null ? "" : value).trim().toLowerCase() === "b" ? "b" : "a";
}

/* Partie effectivement jouée : "b" seulement si le sélecteur est disponible ET que la session a choisi B. */
export function idleDevSlotForUserV1(user) {
  return idleDevSlotsAvailableV1(user) ? idleDevNormalizeSlotV1(user && user.slot) : "a";
}

/* Adresse sous laquelle la ligne de la partie B est stockée / retrouvée (la partie A garde l'adresse réelle). */
export function idleDevAliasEmailV1(email, slot) {
  const value = String(email || "").trim().toLowerCase();
  if (idleDevNormalizeSlotV1(slot) !== "b" || !value) return value;
  const at = value.lastIndexOf("@");
  if (at <= 0) return value;
  return value.slice(0, at) + "+" + IDLE_DEV_SAVE_SLOTS_V1.aliasTag + value.slice(at);
}

/* Identité de la partie B dérivée de l'identité réelle : mêmes droits, autre ligne JOUEURS. */
export function idleDevUserForSlotV1(user, slot) {
  if (idleDevNormalizeSlotV1(slot) !== "b" || !user) return user;
  const alias = value => idleDevAliasEmailV1(value, "b");
  return Object.assign({}, user, {
    email: alias(user.email),
    emailConnexion: alias(user.emailConnexion || user.email),
    emails: emailsOfUserV1(user).map(alias),
    prenom: String(user.prenom || "Norman").trim() + IDLE_DEV_SAVE_SLOTS_V1.labelB
  });
}
