import assert from "node:assert/strict";
import test from "node:test";
import { lireUiComplet as lireUi } from "./_ui-sources.mjs";

/*
 * Audit ia-ennemis-titans (2026-11-16), lu dans le jeu (build 1260) :
 * - EnemyAI::reflectDamage = PlayerController::takeDamage(degats / 50) ; takeDamage : blocage, Beast Mode x3, division par les facteurs de defense, UN SEUL Mathf.Floor ; la Robustesse n'y entre pas ;
 * - PlayerController::timeDilation(dt) : aura 4 => dt / 2, genou brise => dt / 3 ; chaque compteur de capacite avance de dt / x.
 */
const combat = lireUi();

test("reflexion de The Beast : un seul arrondi, blocage puis Beast Mode puis facteurs de defense", () => {
  const debut = combat.indexOf("Dégâts FIXES (réflexion de The Beast");
  assert.ok(debut > 0, "le commentaire de la reflexion exacte doit exister");
  const bloc = combat.slice(debut, debut + 1200);
  const iBlocage = bloc.indexOf("blockUntil>maintenant");
  const iBeast = bloc.indexOf("brut*=3");
  const iFloor = bloc.indexOf("Math.floor(brut/Math.max(1e-9,buff))");
  assert.ok(iBlocage > 0 && iBeast > iBlocage && iFloor > iBeast, "ordre : blocage, Beast Mode x3, division par buff avec un seul floor");
  assert.ok(!/Math\.round\(brut/.test(bloc), "aucun arrondi intermediaire");
});

test("ralentissement des cooldowns : dt / x (et non plus une rallonge de ecoule*(x-1))", () => {
  assert.ok(!combat.includes("+=ecoule*(dilatation-1)"), "l'ancienne rallonge qui figeait le compteur a x = 2 est retiree");
  assert.ok(combat.includes("restant*dilatation<=ecoule?precTick+restant*dilatation:maintenantTick+restant-ecoule/dilatation"), "formule exacte du temps restant sous dilatation");
});

test("formule du temps restant : la moitie du temps passe pour x = 2", () => {
  const apres = (fin, prec, maintenant, x) => {
    const restant = fin - prec, ecoule = maintenant - prec;
    return restant * x <= ecoule ? prec + restant * x : maintenant + restant - ecoule / x;
  };
  /* 10 s de cooldown restant, 1 s ecoulee a x = 2 : il reste 9,5 s a l'instant 1 s => fin a 10,5 s */
  assert.equal(apres(10000, 0, 1000, 2), 10500);
  /* x = 3 : il reste 10 - 1/3 s */
  assert.ok(Math.abs(apres(10000, 0, 1000, 3) - (1000 + 10000 - 1000 / 3)) < 1e-9);
  /* un cooldown de 0,4 s sous x = 2 dure 0,8 s : fini dans la seconde ecoulee */
  assert.equal(apres(400, 0, 1000, 2), 800);
});
