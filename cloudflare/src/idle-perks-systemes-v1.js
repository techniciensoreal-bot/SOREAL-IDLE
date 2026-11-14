/*
 * Atouts (perks) et manies (quirks) liés à un SYSTÈME encore verrouillé (Norman, 2026-11-14 : « dans les atouts, on voit des récompenses pour des systèmes qu'on n'a pas encore débloqués, les barbes par exemple »). AGENTS.md règle n°2 : le joueur ne voit que ce qu'il a débloqué.
 * Un atout dont l'effet concerne un système (barbes, mineurs, cartes, NGU, souhaits, hacks, Wandoos, Yggdrasil, Machine temporelle, quêtes, Daycare, MacGuffins, Titans, Magie du sang, Cube, Augmentations, Entraînement avancé, ressource 3, cuisine…) n'est envoyé qu'une fois CE système découvert.
 * Le système est repéré par la clé de bonus (beardBankPct, diggerSlotBonus…) ou, à défaut, par le texte de l'effet. Un atout déjà possédé reste visible (décidé par l'appelant). Un atout lié à plusieurs systèmes exige qu'ils soient TOUS découverts.
 */
const REGLES_V1 = [
  ["beards", /^beard/, /beard/i],
  ["diggers", /^digger/, /digger/i],
  ["ngu", /^ngu/, /\bngu\b/i],
  ["wandoos", /^wandoos/, /wandoos/i],
  ["hacks", /^hack/, /\bhacks?\b/i],
  ["wishes", /^wish/, /\bwish/i],
  ["yggdrasil", /^(seed|firstHarvest|fruit)/, /yggdrasil|\bfruit|\bseed|harvest/i],
  ["macguffins", /^macguffin/, /macguffin/i],
  ["cards", /^(card|mayo)/, /\bcard|\bmayo|chonk/i],
  ["daycare", /^daycare/, /daycare/i],
  ["questing", /^(quest|qp)/, /\bquest|\bqp\b/i],
  ["bloodMagic", /^blood/, /blood/i],
  ["titans", /^titan/, /titan/i],
  ["timeMachine", /^tm/, /time machine|\btm\b|\bgps\b/i],
  ["augmentations", /^augment/, /augment/i],
  ["advancedTraining", /^advancedTraining/, /advanced training/i],
  ["infinityCube", /^cube/, /\bcube\b|infinity cube/i],
  ["moneyPit", /^moneyPit/, /money pit/i],
  ["challenges", /^challenge/, /\bchallenge/i],
  ["cooking", /^cook/, /\bcook/i],
  ["r3", /^r3/, /\br3\b|resource 3/i]
];

/* Systèmes (identifiants de IDLE_NGU_SYSTEMS, plus « r3 » pour la ressource 3) dont dépend l'atout ou la manie. */
export function systemesRequisPerkV1(def) {
  const trouves = new Set();
  const cles = Object.keys((def && def.bonus) || {});
  const texte = String((def && def.name) || "") + " " + String((def && def.effect) || "");
  for (const [systeme, reCle, reTexte] of REGLES_V1) {
    if (cles.some((c) => reCle.test(c)) || reTexte.test(texte)) trouves.add(systeme);
  }
  return [...trouves];
}

/* Vrai si tous les systèmes de l'atout sont découverts. `ouvert(systeme)` est fourni par l'appelant (état du joueur). */
export function systemesPerkOuvertsV1(def, ouvert) {
  return systemesRequisPerkV1(def).every((s) => ouvert(s));
}
