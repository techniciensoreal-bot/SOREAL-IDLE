import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

/*
 * Norman (2026-10-04) : « j'ai ajouté idle/aventure/The_Sky/sky_safe_zone.webp pour la safe zone de The Sky mais je ne la vois pas ; il faut qu'il accepte png et webp. » Le serveur accepte webp, png, jpg, jpeg et avif ;
 * ce qui manquait : une image déposée après le chargement de la page n'était jamais redemandée.
 */
function env(cles) {
  return { SOREAL_R2: { get: async (cle) => (cles.includes(cle) ? { body: "IMG", httpEtag: '"e"', writeHttpMetadata(h) { h.set("content-type", cle.endsWith(".webp") ? "image/webp" : "image/png"); } } : null) } };
}
const demander = async (cles, zone) => { const r = await traiterRequeteIdleMedia(new Request("https://idle.test/api/idle/media/safe-zone?zone=" + zone), env(cles)); return { statut: r.status, cle: r.headers.get("x-soreal-idle-r2-key"), type: r.headers.get("content-type") }; };

// webp seul, png seul : les deux sont servis, dans le dossier de la zone (The_Sky) comme à la racine d'« aventure ».
assert.deepEqual(await demander(["idle/aventure/The_Sky/sky_safe_zone.webp"], "sky"), { statut: 200, cle: "idle/aventure/The_Sky/sky_safe_zone.webp", type: "image/webp" });
assert.deepEqual(await demander(["idle/aventure/The_Sky/sky_safe_zone.png"], "sky"), { statut: 200, cle: "idle/aventure/The_Sky/sky_safe_zone.png", type: "image/png" });
assert.equal((await demander(["idle/aventure/sky_safe_zone.webp"], "sky")).statut, 200);
assert.equal((await demander(["idle/backgrounds/adventure/sky_safe_zone.png"], "sky")).statut, 200);
// Les deux présents : une seule est servie (webp d'abord) ; aucune : 404 propre.
assert.equal((await demander(["idle/aventure/The_Sky/sky_safe_zone.webp", "idle/aventure/The_Sky/sky_safe_zone.png"], "sky")).cle, "idle/aventure/The_Sky/sky_safe_zone.webp");
assert.equal((await demander([], "sky")).statut, 404);
// Le nom vient de l'id de zone : la Safe Zone de The Sky s'appelle sky_safe_zone, jamais the_sky_safe_zone.
assert.equal((await demander(["idle/aventure/The_Sky/the_sky_safe_zone.webp"], "sky")).statut, 404);

// Client : une image introuvable est redemandée (adresse neuve), sans boucle ; plafonnée.
const scene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(scene.includes("safeImg.getAttribute('data-base')!==safeUrl"), "la comparaison porte sur l'adresse de base, pas sur celle avec « r= »");
assert.ok(scene.includes("},20000);") && scene.includes("(safeImg.__essais||0)>=15"), "relance toutes les 20 s, 15 fois au plus");
assert.ok(scene.includes("safeUrl+(safeUrl.indexOf('?')>=0?'&':'?')+'r='+Date.now()"), "adresse neuve à chaque relance (jamais servie par un cache)");
console.log("idle-safe-zone-webp-png-v1: OK");
