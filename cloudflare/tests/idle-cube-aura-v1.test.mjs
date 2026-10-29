// Norman (2026-10-29) : le Cube de l'infini a toujours une petite aura qui correspond à son aspect (couleur dominante de l'image du palier).
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/cube-aura-v1.js"), i = lire("cloudflare/public/index.html");
assert.ok(m.includes("window.__SOREAL_IDLE_CUBE_AURA_V1__={couleurDe:couleurDe,appliquer:appliquer}") && m.includes(".soreal-idle-v138-slot-cube img"), "module : l'aura du cube de l'inventaire");
assert.ok(m.includes("function dominante(img)") && m.includes("memoire[src]=dominante(img)"), "couleur dominante de l'image, calculée une fois par image");
assert.ok(m.includes("drop-shadow(0 0 3px rgba(var(--cube-aura),.85)) drop-shadow(0 0 9px rgba(var(--cube-aura),.5))") && !/animation|@keyframes|\.animate\(/.test(m.replace(/\/\*[\s\S]*?\*\//g, "")), "toujours allumée, douce, sans animation");
assert.ok(m.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__") && m.includes("Object.prototype.hasOwnProperty.call(memoire,src)){poser(img,memoire[src]);return;}"), "remise dans la même tâche à chaque redessin (règle n°4)");
assert.ok(/cube-aura-v1\.js\?v=\d+/.test(i), "module chargé");
console.log("idle-cube-aura-v1 : OK");
