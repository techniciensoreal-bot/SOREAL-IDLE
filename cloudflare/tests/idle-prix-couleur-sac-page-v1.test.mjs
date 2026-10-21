import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mp = readFileSync(new URL("../public/modules/money-pit-page-v1.js", import.meta.url), "utf8");
/* Norman (2026-10-21) : « les cadres ne changent plus de couleur (Money Pit, roue), ça reste rouge » */
assert.ok(mp.includes("const rangCouleurMemoIdleV1={}") && mp.includes("rangCouleurMemoIdleV1[stockage]"), "compteur de couleur aussi gardé en mémoire de page");
assert.ok(mp.includes("rangCouleurPrix_(derniereRoue,'soreal_idle_prix_couleur_roue_v1',totalSpins)") && mp.includes("if(total!=null&&total>0)return ((Math.floor(total)%6)+6)%6;"), "roue : couleur = nombre total de tours");

const inv = readFileSync(new URL("../public/modules/ui-inventaire-v1.js", import.meta.url), "utf8");
const av = readFileSync(new URL("../public/modules/ui-aventure-1-v1.js", import.meta.url), "utf8");
/* Norman (2026-10-21) : « l'inventaire se redessine quand on passe d'une page à l'autre » */
assert.ok(inv.includes('data-sac-v160="\'+utilise+\'/\'+capacite+\'"'), "titre du sac rendu avec sa clé : l'icône n'est pas recréée au premier changement de page");
assert.ok(inv.includes("x.setAttribute('onclick',y.getAttribute('onclick'))"), "sélecteur de page mis à jour en place");
assert.ok(av.includes("if(trashActuelV165&&action!=='page'){"), "la corbeille n'est pas recréée au changement de page");
console.log("idle-prix-couleur-sac-page-v1: OK");
