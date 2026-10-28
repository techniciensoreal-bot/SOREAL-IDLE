/*
 * Exporte le catalogue de production gardé par le jeu sur CET appareil, pour « node desktop/recolter.mjs --catalogue catalogue.json ».
 * Utilisation : ouvrir le jeu EN LIGNE (version qui garde le dernier export, voir moteur-local-v1.js), F12 > Console, coller ce fichier entier, Entrée : un fichier catalogue.json est téléchargé.
 * Il ne contient que les feuilles de catalogue du jeu (jamais ta partie, jamais celle des autres).
 */
(async () => {
  const g = await new Promise((ok, ko) => {
    const o = indexedDB.open("soreal_idle_moteur_local_v1", 1);
    o.onerror = () => ko(o.error);
    o.onsuccess = () => {
      const r = o.result.transaction("kv").objectStore("kv").get("export-dernier");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    };
  });
  if (!g || !g.export || !Array.isArray(g.export.feuilles)) { console.error("Aucun export gardé : ouvre le jeu avec internet (version à jour), attends le chargement complet, puis recommence."); return; }
  const blob = new Blob([JSON.stringify({ feuilles: g.export.feuilles, exporteLe: new Date(g.at).toISOString() })], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "catalogue.json"; document.body.appendChild(a); a.click(); a.remove();
  console.log("catalogue.json téléchargé : " + g.export.feuilles.length + " lignes de catalogue.");
})();
