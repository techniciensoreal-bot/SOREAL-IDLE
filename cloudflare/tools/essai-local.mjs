/* Banc d'essai local pour le navigateur intégré de Claude (.claude/launch.json) : lance local-dev-server.mjs avec la partie B préparée (boss 5, beaucoup d'énergie et de magie) sur le port 8830. */
process.env.PARTIE_B = "1";
process.env.PORT = process.env.PORT || "8830";
process.env.PARTIE_B_OPTIONS = process.env.PARTIE_B_OPTIONS || JSON.stringify({ boss: 5, energieCap: 1e9, energie: 1e8, magieCap: 1e9, magie: 1e8 });
await import("./local-dev-server.mjs");
