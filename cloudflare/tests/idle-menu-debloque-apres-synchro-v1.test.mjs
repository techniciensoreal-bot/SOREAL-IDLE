import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « j'ai tué le boss 30 et la Machine temporelle n'est pas apparue, j'ai dû rafraîchir la page ».
 * Cause : la synchro « sans redessin » du combat remplaçait l'état par celui du serveur (qui contenait le nouveau système débloqué) sans jamais redessiner le menu.
 * Correction : la liste des menus débloqués est comparée avant/après cette synchro, et la page est redessinée si elle a changé.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("function empreinteMenusIdleV1_(j){"), "empreinte des menus débloqués");
const i = ui.indexOf("const empreinteMenusAvantV1=empreinteMenusIdleV1_(idleEtat);");
assert.ok(i > 0, "mesure avant la synchro");
const bloc = ui.slice(i, i + 900);
assert.ok(bloc.includes("appliquerSynchroCombatSansReflowIdleV116_("), "la synchro sans redessin est bien celle qui est encadrée");
assert.ok(/synchroSansReflowV1&&idleEtat&&empreinteMenusIdleV1_\(idleEtat\)!==empreinteMenusAvantV1/.test(bloc), "comparaison après la synchro");
assert.ok(bloc.includes("rendreIdleEtat_({ok:true,joueur:idleEtat})"), "redessin quand un menu apparaît");

// L'empreinte ne bouge que si un menu apparaît (pas à chaque PV perdu) : on évalue la fonction seule.
const debut = ui.indexOf("function empreinteMenusIdleV1_(j){");
const src = ui.slice(debut, ui.indexOf("\n      }\n", debut) + 9);
const empreinte = new Function(src + "\nreturn empreinteMenusIdleV1_;")();
const base = { systemes: { systems: [{ id: "a", unlock: { unlocked: true } }, { id: "timeMachine", unlock: { unlocked: false } }] }, bossVaincus: 29 };
const apres = { systemes: { systems: [{ id: "a", unlock: { unlocked: true } }, { id: "timeMachine", unlock: { unlocked: true } }] }, bossVaincus: 30 };
assert.notEqual(empreinte(base), empreinte(apres), "un système débloqué change l'empreinte");
assert.equal(empreinte(base), empreinte({ ...base, bossVaincus: 31, pvJoueur: 3 }), "les boss vaincus et les PV ne comptent pas");
console.log("idle-menu-debloque-apres-synchro-v1: OK");
