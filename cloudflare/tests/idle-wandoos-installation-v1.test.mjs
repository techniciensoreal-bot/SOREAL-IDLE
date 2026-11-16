import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction, idleNguSnapshot, rebirthIdleNguState } from "../src/idle-ngu-progression.js";
import * as M from "../src/idle-migrations-v1.js";
import { lireReference } from "./_migrations-formes.mjs";

/*
 * Installation de Wandoos 98 (lu dans le jeu, build 1260, 2026-11-16 : Wandoos98Controller::updateWandoos 4779, installTextUpdate 4819, Character::addOfflineProgress 2242) :
 * tant que installTime < 86 400 s (0,02 s par tick, EN LIGNE seulement), aucun niveau de Dump n'est gagné ; hors ligne l'installation n'avance pas ; elle survit au Rebirth.
 * Les parties qui utilisaient déjà Wandoos sont considérées installées (migration 55 -> 56).
 */
const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const T0 = 100_000_000;
function neuf() {
  let s = normalizeIdleNguState({}, context, T0);
  s.adventure.unlockFlags.wandoos = true;
  s = normalizeIdleNguState(s, context, T0);
  assert.equal(s.systems.wandoos.unlocked, true);
  assert.equal(s.systems.wandoos.data.installSeconds, 0, "un Wandoos tout juste obtenu n'est pas installé");
  s.runStartedAt = T0 - 3 * 3600 * 1000;   /* boot terminé */
  s.resources.energy.cap = 1e9;
  s.resources.energy.current = 1e9;
  s = applyIdleNguAction(s, { action: "allocate", system: "wandoos", resource: "energy", value: 1e6 }, context, T0).state;
  return s;
}
const niveaux = (s) => s.systems.wandoos.data.dumpEnergyLevel + s.systems.wandoos.data.dumpEnergyProgress;

/* En ligne : l'installation avance, aucun niveau. */
{
  let s = neuf();
  let t = T0;
  for (let i = 0; i < 10; i++) { t += 60_000; s = advanceIdleNguState(s, 60, context, t); }
  assert.equal(s.systems.wandoos.data.installSeconds, 600);
  assert.equal(niveaux(s), 0, "aucun niveau pendant l'installation");
  const vue = idleNguSnapshot(s, context, t).wandoosView;
  assert.deepEqual(vue.installation, { ecoule: 600, total: 86400 });
}
/* Hors ligne (5 minutes et plus) : l'installation n'avance pas et rien n'est gagné. */
{
  let s = neuf();
  s = advanceIdleNguState(s, 3600, context, T0 + 3600_000);
  assert.equal(s.systems.wandoos.data.installSeconds, 0);
  assert.equal(niveaux(s), 0);
}
/* Fin de l'installation : le temps qui reste compte pour Wandoos ; ensuite tout le temps compte. */
{
  let s = neuf();
  s.systems.wandoos.data.installSeconds = 86400 - 10;
  s = advanceIdleNguState(s, 100, context, T0 + 100_000);
  assert.equal(s.systems.wandoos.data.installSeconds, 86400);
  assert.equal(idleNguSnapshot(s, context, T0 + 100_000).wandoosView.installation, null, "installée : plus de barre d'installation");
  const reste = niveaux(s);
  assert.ok(reste > 0, "les 90 s restantes comptent");
  const deux = advanceIdleNguState(s, 100, context, T0 + 200_000);
  assert.ok(niveaux(deux) > reste * 1.5, "ensuite toute la fenêtre compte");
}
/* Le Rebirth garde l'installation (Wandoos98::reset n'y touche pas) ; les niveaux de Dump repartent à zéro. */
{
  let s = neuf();
  s.systems.wandoos.data.installSeconds = 4321;
  s.systems.wandoos.data.dumpEnergyLevel = 7;
  const r = rebirthIdleNguState(s, context, T0 + 1000);
  const etat = r.state || r;
  assert.ok(etat.systems.wandoos.data.installSeconds >= 4321 && etat.systems.wandoos.data.installSeconds < 4330, "installation conservée (la seconde écoulée comptée)");
  assert.equal(etat.systems.wandoos.data.dumpEnergyLevel, 0);
}
/* Migration 55 -> 56 : une partie qui utilisait déjà Wandoos est installée ; sans Wandoos : zéro. */
{
  const m = M.MIGRATIONS.find((x) => x.de === 55);
  assert.equal(m.vers, 56);
  const ancien = (w) => { const e = JSON.parse(JSON.stringify(lireReference(1))); e.etatVersion = 55; e.systems.wandoos = w; return e; };
  assert.equal(M.appliquerMigrationV1(m, ancien({ unlocked: true, data: { os: "98" } })).systems.wandoos.data.installSeconds, 86400);
  assert.equal(M.appliquerMigrationV1(m, ancien({ unlocked: false, data: { dumpEnergyLevel: 3 } })).systems.wandoos.data.installSeconds, 86400, "des niveaux de Dump prouvent l'usage");
  assert.equal(M.appliquerMigrationV1(m, ancien({ unlocked: false, data: {} })).systems.wandoos.data.installSeconds, 0);
  const deja = M.appliquerMigrationV1(m, ancien({ unlocked: true, data: { installSeconds: 500 } }));
  assert.equal(deja.systems.wandoos.data.installSeconds, 500, "ne touche pas une installation en cours");
  /* Par la vraie normalisation : l'ancienne sauvegarde déjà débloquée reste installée. */
  const base = JSON.parse(JSON.stringify(lireReference(1))); base.etatVersion = 55; base.systems.wandoos = { unlocked: true, data: { os: "98", dumpEnergyLevel: 12 } };
  const vieux = normalizeIdleNguState(base, context, T0);
  assert.equal(vieux.systems.wandoos.data.installSeconds, 86400);
}
/* Interface : barre d'installation seulement quand la vue l'annonce (la vue ne l'annonce que pour un Wandoos déjà possédé). */
{
  const src = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
  assert.ok(src.includes("ecranInstallation_") && src.includes("e.enInstallation") && src.includes("installVu_"));
  assert.ok(/phase==='installation'\?''/.test(src), "pas de bouton DÉMARRER pendant l'installation");
  const neufVue = idleNguSnapshot(normalizeIdleNguState({}, context, T0), context, T0).wandoosView;
  assert.equal(neufVue, null, "Wandoos non débloqué : aucune vue, donc aucune barre (anti-spoil)");
}
console.log("idle-wandoos-installation-v1 : OK");
