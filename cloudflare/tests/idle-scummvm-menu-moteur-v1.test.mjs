import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { idleNguSnapshot, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { IDLE_NGU_SYSTEMS, IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

/*
 * Menu « Énigmes » (ScummVM dans un iframe, ajout SOREAL, 2026-11-22) : système `scummvm`, ouvert après le boss IDLE_SCUMMVM_BOSS_V1 (choix SOREAL, à ajuster par Norman).
 * Anti-spoil (règle n°2) : absent de la réponse tant qu'il n'est pas débloqué (ni nom, ni icône, ni boss) ; aucun contenu de jeu ni d'AP dans son état.
 */
const t0 = 1_000_000;
assert.equal(IDLE_SCUMMVM_BOSS_V1, 30, "seuil nommé : boss 30");
const def = IDLE_NGU_SYSTEMS.find((d) => d.id === "scummvm");
assert.ok(def && def.unlock.bosses === IDLE_SCUMMVM_BOSS_V1 && def.kind === "permanent", "système déclaré, permanent, seuil = la constante");

const brut = (bosses) => { const s = syncIdleNguState({}, { bosses }, t0); return { s, snap: idleNguSnapshot(s, { bosses }, t0) }; };
const avant = brut(IDLE_SCUMMVM_BOSS_V1 - 1);
assert.ok(!avant.snap.systems.some((x) => x.id === "scummvm"), "avant le seuil : le menu n'existe pas dans la réponse");
assert.ok(!JSON.stringify(avant.snap).includes("Énigmes") && !JSON.stringify(avant.snap).includes("scummvm"), "avant le seuil : aucune trace (nom, id) dans la réponse");

const apres = brut(IDLE_SCUMMVM_BOSS_V1);
const x = apres.snap.systems.find((e) => e.id === "scummvm");
assert.ok(x, "au seuil : le menu est présent");
assert.equal(x.name, "Énigmes");
assert.equal(x.icon, "🕹️");
assert.deepEqual(x.tracks, [], "aucune piste, aucun contenu de jeu");
assert.ok(!x.state.data || !x.state.data.tracks || Object.keys(x.state.data.tracks).length === 0, "aucune donnée de jeu dans l'état");

/* permanent : reste ouvert après un Rebirth (boss du run remis à 0) */
const encore = syncIdleNguState(apres.s, { bosses: 0 }, t0 + 1000);
assert.ok(idleNguSnapshot(encore, { bosses: 0 }, t0 + 1000).systems.some((e) => e.id === "scummvm"), "toujours ouvert après un Rebirth");

/* registre des constantes SOREAL */
const reg = JSON.parse(readFileSync("cloudflare/tests/references/constantes-soreal-v1.json", "utf8"));
assert.ok(reg.entrees.some((e) => e.fichier === "idle-ngu-catalogues.js" && /IDLE_SCUMMVM_BOSS_V1/.test(e.description) && e.statut === "à valider par Norman"), "constante inscrite au registre");
console.log("idle-scummvm-menu-moteur-v1 OK");
