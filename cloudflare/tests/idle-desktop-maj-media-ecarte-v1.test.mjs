// Norman (2026-10-29) : « La mise à jour n'a pas pu être installée » en boucle : une voix régénérée après la publication ne correspondait plus au manifeste et faisait échouer toute l'installation. Le média fautif est écarté, le reste s'installe.
import fs from "node:fs";
import assert from "node:assert/strict";
const c = fs.readFileSync("desktop/coeur.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(c.includes("TAILLE_INATTENDUE|EMPREINTE_INATTENDUE") && c.includes("manifeste.medias.filter((x) => x[0] !== cle)") && c.includes("delta.medias.filter((x) => x[0] !== cle)"), "le média fautif est retiré du manifeste et du delta puis l'installation reprend");
assert.ok(c.includes("essai >= 20") && c.includes("throw e;"), "toute autre erreur (paquet corrompu, réseau) échoue toujours");
const m = fs.readFileSync("desktop/src/maj.mjs", "utf8");
assert.ok(m.includes('throw new Error("TAILLE_INATTENDUE:" + cle)') && m.includes('throw new Error("PAQUET_CORROMPU")'), "l'installateur reste strict (il ne change pas)");
console.log("idle-desktop-maj-media-ecarte-v1 : OK");
