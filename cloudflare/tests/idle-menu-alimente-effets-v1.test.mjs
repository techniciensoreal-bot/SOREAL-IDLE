import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : un menu alimenté (énergie placée) reçoit un effet, propre à ce que fait le menu (lumière qui tourne, coups, engrenage, gouttes, scanner…). */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

const debut = ui.indexOf("const IDLE_MENUS_ETATS_V1=");
const fin = ui.indexOf("function actualiserNavAlimenteIdleV1_");
assert.ok(debut > 0 && fin > debut);
const idleNombre_ = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const IDLE_SYSTEME_PAR_MENU_V1 = { augmentations: "augmentations", avance: "advancedTraining", machine: "timeMachine", sang: "bloodMagic", wandoos: "wandoos", ngu: "ngu", yggdrasil: "yggdrasil", diggers: "diggers", beards: "beards", hacks: "hacks", wishes: "wishes" };
const alimenteBrut = new Function("idleNombre_", "IDLE_SYSTEME_PAR_MENU_V1", ui.slice(debut, fin) + "\nreturn idleMenuAlimenteV1_;")(idleNombre_, IDLE_SYSTEME_PAR_MENU_V1);
/* Depuis 2026-10-04 les animations n'existent qu'avec l'achat « Menus animés » (j.menusAnimes) : les cas ci-dessous le supposent acheté. */
const alimente = (menu, j) => alimenteBrut(menu, Object.assign({ menusAnimes: true }, j));
assert.equal(alimenteBrut("machine", { systemes: { systems: [{ id: "timeMachine", state: { allocation: { energy: 5, magic: 0, r3: 0 }, data: {} } }] } }), false, "sans l'achat : aucune animation");

const sys = (id, allocation, data) => ({ id, state: { allocation: Object.assign({ energy: 0, magic: 0, r3: 0 }, allocation), data: data || {} } });
const joueur = (systems, skills) => ({ systemes: { systems }, basicTraining: { skills: skills || [] } });

// Rien de placé : aucun effet.
assert.equal(alimente("machine", joueur([sys("timeMachine", {})])), false);
// Énergie placée : effet. Magie placée dans Blood Magic : effet aussi.
assert.equal(alimente("machine", joueur([sys("timeMachine", { energy: 5 })])), true);
assert.equal(alimente("sang", joueur([sys("bloodMagic", { magic: 3 })])), true);
// Augmentations et Advanced Training : énergie par piste.
assert.equal(alimente("augmentations", joueur([sys("augmentations", {}, { pairs: { scissors: { energy: 4 } } })])), true);
assert.equal(alimente("augmentations", joueur([sys("augmentations", {}, { pairs: { scissors: { energy: 0, upgradeEnergy: 0 } } })])), false);
assert.equal(alimente("avance", joueur([sys("advancedTraining", {}, { tracks: { power: { energy: 10 } } })])), true);
// Basic Training : une compétence avec de l'énergie.
assert.equal(alimente("entrainement", joueur([], [{ id: "a", allocation: 0 }, { id: "b", allocation: 12 }])), true);
assert.equal(alimente("entrainement", joueur([], [{ id: "a", allocation: 0 }])), false);
// Un menu qui ne consomme rien n'a jamais d'effet.
assert.equal(alimente("perks", joueur([sys("perks", { energy: 9 })])), false);

// Chaque menu alimentable a SON effet (aucun partagé, hors le tour de lumière des Augmentations) et le bouton le déclare.
for (const menu of ["entrainement", "avance", "machine", "sang", "wandoos", "ngu", "yggdrasil", "diggers", "beards", "hacks", "wishes"]) {
  assert.ok(css.includes(`[data-effet-v1="${menu}"]`), `effet de ${menu}`);
}
assert.ok(css.includes(".soreal-idle-nav-button-v28.alimente-v1::before") && css.includes("conic-gradient(from var(--soreal-ang-v1)"), "lumière qui tourne autour du bouton (Augmentations)");
assert.ok(ui.includes('data-effet-v1="${m.id}"') && ui.includes("idleMenuAlimenteV1_(m.id,j)?' alimente-v1':''"));
assert.ok(ui.includes("setInterval(actualiserNavAlimenteIdleV1_,500)"), "mise à jour en direct quand on place ou retire de l'énergie");
assert.ok(css.includes("prefers-reduced-motion:reduce") && css.includes(".alimente-v1::after{animation:none!important}"), "respect de la préférence de mouvement réduit");
console.log("idle-menu-alimente-effets-v1: OK");
