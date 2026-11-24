import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

/* Remise à zéro de Day of the Tentacle (Norman, 2026-11-24) : « enlève-moi les 2 811 AP que j'ai eus grâce au jeu, reset ma progression sur DOTT, je veux recommencer à 0 ». */
const ctx = { bosses: IDLE_SCUMMVM_BOSS_V1 + 5 };
const t0 = Date.parse("2026-11-24T10:00:00.000Z");
const P = { jeu: "dott", plafond: 150000, reference: 400, croissance: 100 };
const agir = (e, a) => applyIdleNguAction(e, a, ctx, t0 + 1000).state;

let e = syncIdleNguState({}, ctx, t0);
e.currencies.ap = 5000;   // AP du joueur avant le jeu
e = agir(e, Object.assign({ action: "scummvmProgres", unites: 120 }, P));
const gagne = e.systems.scummvm.data.jeux.dott.apCredite;
assert.ok(gagne > 1000, "le jeu a rapporté de l'AP : " + gagne);
assert.equal(e.currencies.ap, 5000 + gagne);
// un autre jeu du compte n'est pas touché
e = agir(e, Object.assign({ action: "scummvmProgres", unites: 30 }, P, { jeu: "autre" }));
const autre = e.systems.scummvm.data.jeux.autre.apCredite;

const r = applyIdleNguAction(e, { action: "scummvmReinitialiser", jeu: "dott" }, ctx, t0 + 2000);
assert.equal(r.result.retire, gagne, "retire exactement l'AP gagné avec ce jeu");
assert.equal(r.state.currencies.ap, 5000 + autre, "l'AP du joueur revient à ce qu'il avait + l'autre jeu");
assert.equal(r.state.systems.scummvm.data.jeux.dott, undefined, "l'enregistrement du jeu est effacé");
assert.equal(r.state.systems.scummvm.data.jeux.autre.apCredite, autre, "l'autre jeu est intact");

// après la remise à zéro on recommence à 0 : une unité rapporte comme à la première partie
const apres = applyIdleNguAction(r.state, Object.assign({ action: "scummvmProgres", unites: 1 }, P), ctx, t0 + 3000).state;
assert.ok(apres.systems.scummvm.data.jeux.dott.apCredite > 0 && apres.systems.scummvm.data.jeux.dott.apCredite < 50, "on repart de zéro");

// idempotent : rien à retirer la seconde fois ; jamais sous zéro ; bonus de fin retiré aussi
const deux = applyIdleNguAction(r.state, { action: "scummvmReinitialiser", jeu: "dott" }, ctx, t0 + 4000);
assert.equal(deux.result.retire, 0);
assert.equal(deux.state.currencies.ap, r.state.currencies.ap);
let f = syncIdleNguState({}, ctx, t0);
f = agir(f, Object.assign({ action: "scummvmProgres", unites: 500, bonus: 50000 }, P));
assert.equal(f.systems.scummvm.data.jeux.dott.bonus, 50000);
f.currencies.ap = 1000;   // le joueur a dépensé presque tout : jamais d'AP négatif
const g = applyIdleNguAction(f, { action: "scummvmReinitialiser", jeu: "dott" }, ctx, t0 + 5000);
assert.equal(g.result.retire, 200000, "crédits + bonus de fin");
assert.equal(g.state.currencies.ap, 0, "jamais sous zéro");
assert.throws(() => applyIdleNguAction(f, { action: "scummvmReinitialiser", jeu: "../x" }, ctx, t0 + 6000), /PAYLOAD_INVALIDE/);

// côté page : seulement pour l'administrateur, une seule fois (repère lié au compte), avec remise à zéro du compteur
const page = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
assert.ok(page.includes("R.estAdminSorealIdle_()") && page.includes("soreal_idle_scummvm_reset_admin_v2"), "administrateur seulement, une fois");
assert.ok(page.includes("function recommencer(remiseAZero)") && page.includes("if(remiseAZero===true){") && page.includes("action:'scummvmReinitialiser'"), "la remise efface le compteur et retire l'AP");
assert.ok(/if\(remiseAZero===true\)\{\s*try\{if\(P&&P\.reinitialiser\)P\.reinitialiser\(jeu\.id\)/.test(page), "le compteur de découvertes est remis à zéro après l'effacement de la partie");
console.log("idle-scummvm-remise-a-zero-v1: OK (AP retiré : " + gagne + ")");
