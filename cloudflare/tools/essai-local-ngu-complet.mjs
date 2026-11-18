/* Banc d'essai local « tout débloqué » (port 8841) : comme essai-local-ngu.mjs, plus Hacks, Wishes, Questing, Quirks, Cartes, Cuisine et ITOPOD ouverts dans l'état NGU, des pilules, du beurre et des objets de quête. Jamais déployé : essai local seulement. */
process.env.PARTIE_B = "1";
process.env.PORT = process.env.PORT || "8841";
process.env.PARTIE_B_OPTIONS = process.env.PARTIE_B_OPTIONS || JSON.stringify({ boss: 140, energieCap: 1e12, energie: 1e12, energiePuissance: 1e9, magieCap: 1e12, magie: 1e12, magiePuissance: 1e9, systemes: true });
const ouvert = { unlocked: true };
process.env.PARTIE_B_PATCH = process.env.PARTIE_B_PATCH || JSON.stringify({ metaNgu: { adventure: { setRewards: { nguSpeedPct: 1e9 } }, systems: { hacks: ouvert, wishes: ouvert, questing: ouvert, quirks: ouvert, cards: ouvert, cooking: ouvert, tower: ouvert, bloodMagic: ouvert }, selloutEffects: { bluePills: 500 } } });
await import("./local-dev-server.mjs");
