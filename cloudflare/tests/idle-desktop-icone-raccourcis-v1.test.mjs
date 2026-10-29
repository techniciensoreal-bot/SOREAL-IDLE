// Norman (2026-10-29) : « l'icône de l'exe n'a pas changé » : l'icône de l'exécutable installé ne change pas par mise à jour ; la fenêtre et les raccourcis (Bureau, Démarrer, barre des tâches) prennent la nouvelle icône.
import fs from "node:fs";
import assert from "node:assert/strict";
const c = fs.readFileSync("desktop/coeur.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(c.includes('path.join(__dirname, "art", "steam", "icone.ico")') && c.includes("icon: fichierIcone_() ||"), "fenêtre : nouvelle icône");
assert.ok(c.includes('shell.writeShortcutLink(f, "update", { icon: icone, iconIndex: 0 })') && c.includes("corrigerRaccourcis_();"), "raccourcis repointés au démarrage");
assert.ok(/\^SOREAL\( NGU\)\? IDLE\\.lnk\$/.test(c), "seuls les raccourcis du jeu");
console.log("idle-desktop-icone-raccourcis-v1 : OK");
