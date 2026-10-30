import { IDLE_ADVENTURE_ZONES } from "./idle-adventure-zones.js";

/*
 * « Monde » d'un boss = sa zone du mode Aventure (Norman, 2026-10-30 : « sur les cartes Magic, les zones ne correspondent pas : il met 20 boss pour la zone 1 ; il faut compter via le mode Aventure : zone Tutoriel
 * etc., et incrémenter de 1 à chaque zone d'Aventure »). Avant : 20 boss par monde, sans lien avec les zones.
 *
 * Une zone s'ouvre quand `boss` boss sont vaincus (IDLE_ADVENTURE_ZONES, unlockedZone) : le boss n° N (1 = le premier) se combat avec N - 1 boss vaincus. Son monde est donc le rang de la dernière zone ouverte à ce moment-là
 * (Zone Tutoriel = monde 1, Égouts = 2, Forêt = 3…), au moins 1. Les zones Evil et Sadistic comptent aussi, rangées avec les autres par boss requis ; deux zones qui s'ouvrent au même boss ne forment qu'un monde (un rang
 * n'est jamais sauté). L'ordre dans le monde est la place du boss depuis le premier boss de ce monde.
 */
const SEUILS_V1 = Object.freeze(
  Array.from(new Set(IDLE_ADVENTURE_ZONES.filter((z) => z.id !== "safe").map((z) => Number(z.boss) || 0)))
    .sort((a, b) => a - b)
);

export function mondeDuBossV1(numero) {
  const n = Math.max(1, Math.floor(Number(numero) || 1));
  const vaincus = n - 1;
  let rang = 0;
  while (rang < SEUILS_V1.length && SEUILS_V1[rang] <= vaincus) rang += 1;
  const monde = Math.max(1, rang);
  const premier = monde <= 1 ? 1 : SEUILS_V1[monde - 1] + 1;
  return { monde, ordre: n - premier + 1 };
}
