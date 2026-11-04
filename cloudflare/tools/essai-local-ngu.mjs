/* Banc d'essai local NGU (port 8831) : partie B avec énergie ET magie au maximum permis (1 T de plafond, pleines) et GÉNÉRÉES AU MAXIMUM (puissance 1e9 : ce qu'on retire ou place se reconstitue vite), tous les systèmes débloqués, boss 140, et une vitesse NGU énorme (metaNgu.adventure.setRewards.nguSpeedPct) pour que TOUS les NGU, énergie et magie, atteignent le cap de 50 niveaux par seconde dès qu'on y place de l'énergie ou de la magie. Jamais déployé : essai local seulement. */
process.env.PARTIE_B = "1";
process.env.PORT = process.env.PORT || "8831";
process.env.PARTIE_B_OPTIONS = process.env.PARTIE_B_OPTIONS || JSON.stringify({ boss: 140, energieCap: 1e12, energie: 1e12, energiePuissance: 1e9, magieCap: 1e12, magie: 1e12, magiePuissance: 1e9, systemes: true });
process.env.PARTIE_B_PATCH = process.env.PARTIE_B_PATCH || JSON.stringify({ metaNgu: { adventure: { setRewards: { nguSpeedPct: 1e9 } } } });
await import("./local-dev-server.mjs");
