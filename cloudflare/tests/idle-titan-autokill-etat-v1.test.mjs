import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-11) : « l'auto kill est coché pour GRB mais il ne meurt pas, le bouton est grisé » : le Titan n'est vaincu qu'à sa réapparition, si les stats suffisent. La carte le dit en clair. */
const t = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
assert.ok(t.includes("function ligneAutoKill(t,enAttente,retour,maintenant)") && t.includes("statut+ligneAutoKill(t,enAttente,retour,maintenant)"), "ligne d'état sur chaque carte");
assert.ok(t.includes("il sera vaincu tout seul à sa réapparition, dans") && t.includes("data-ttn-cd=\"'+retour+'\""), "compte à rebours jusqu'à la réapparition");
assert.ok(t.includes("Auto-kill coché, mais il te manque") && t.includes("function seuilAutoKill(t)"), "stats manquantes indiquées");
assert.ok(t.includes("if(!(t.state&&t.state.autoKill===true))return '';"), "rien tant que la case n'est pas cochée");
console.log("idle-titan-autokill-etat-v1: OK");
