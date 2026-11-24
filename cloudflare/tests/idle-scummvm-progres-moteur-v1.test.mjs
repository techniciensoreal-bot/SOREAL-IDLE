import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { apBonusMultiplierV1 } from "../src/idle-ngu-bonus.js";
import { idleScummvmDefinirApActifV1, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1, idleScummvmProgresV1 } from "../src/idle-scummvm-progres-v1.js";
import { IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

/*
 * Action `scummvmProgres` (AP par progrès dans le jeu ScummVM du menu Énigmes, Norman, 2026-11-22) : AP BRUT (jamais le multiplicateur d'AP), plafond par jeu,
 * monotone, ignorée tant que le menu est verrouillé, borne absolue du moteur, jeux indépendants. Aucune nouvelle opération du protocole.
 */
idleScummvmDefinirApActifV1(true);   /* le gain d'AP est coupé en production (2026-11-23) : ces tests de crédit l'activent */
const t0 = 1_000_000;
const ctx = { bosses: IDLE_SCUMMVM_BOSS_V1 };
const ouvert = () => syncIdleNguState({}, ctx, t0);
const agir = (etat, p, t = t0 + 1000) => applyIdleNguAction(etat, Object.assign({ action: "scummvmProgres" }, p), ctx, t);
const DOTT = { jeu: "dott", plafond: 150000, parUnite: 53 };

/* 0. aucune nouvelle opération : le contrat du protocole est inchangé, l'action passe par l'opération générique */
{
  const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
  const ops = JSON.stringify(contrat);
  assert.ok(!/scummvmProgres/i.test(ops), "scummvmProgres n'est pas une opération du protocole");
  assert.ok(ops.includes("agirProgressionSorealIdle"), "l'opération générique d'actions existe");
}

/* 1. crédit : unités x parUnite, AP brut, état léger sans horodatage */
{
  let r = agir(ouvert(), Object.assign({ unites: 3 }, DOTT));
  assert.equal(r.result.ap, 159);
  assert.equal(r.state.currencies.ap, 159, "3 x 53 AP dans la monnaie AP");
  assert.deepEqual(r.state.systems.scummvm.data.jeux.dott, { unites: 3, apCredite: 159, v: 3 });
  /* 2 unités de plus : seules les nouvelles comptent */
  r = agir(r.state, Object.assign({ unites: 5 }, DOTT), t0 + 2000);
  assert.equal(r.result.ap, 106);
  assert.equal(r.state.currencies.ap, 265);
  assert.deepEqual(r.state.systems.scummvm.data.jeux.dott, { unites: 5, apCredite: 265, v: 3 });
  /* même valeur ou valeur plus basse : rien, jamais de retrait */
  for (const u of [5, 4, 0]) {
    const s = agir(r.state, Object.assign({ unites: u }, DOTT), t0 + 3000);
    assert.equal(s.result.ap, 0, "valeur " + u + " : aucun crédit");
    assert.equal(s.state.currencies.ap, 265, "AP intacts");
    assert.deepEqual(s.state.systems.scummvm.data.jeux.dott, { unites: 5, apCredite: 265, v: 3 }, "le nombre d'unités ne redescend pas");
  }
  /* jamais de champ horodaté ni aléatoire dans l'état du jeu (le mémo du moteur est indexé sur son contenu) */
  assert.ok(!/At|Ms|time|date|random/i.test(Object.keys(r.state.systems.scummvm.data.jeux.dott).join(",")), "état sans horodatage");
}

/* 2. AP BRUT : un joueur avec un multiplicateur d'AP reçoit exactement unités x parUnite */
{
  const base = ouvert();
  base.systems.perks.data.levels = { 89: 20 };
  const mult = apBonusMultiplierV1(base);
  assert.ok(mult > 1, "le joueur a bien un multiplicateur d'AP (" + mult + ")");
  const r = agir(base, Object.assign({ unites: 10 }, DOTT));
  assert.ok(apBonusMultiplierV1(r.state) > 1, "multiplicateur toujours actif après l'action");
  assert.equal(r.result.ap, 530, "10 x 53, sans multiplicateur");
  assert.equal(r.state.currencies.ap, 530, "AP brut");
}

/* 3. plafond par jeu : 150 000 au total, le dernier crédit est tronqué, plus rien ensuite */
{
  let r = agir(ouvert(), Object.assign({ unites: 2800 }, DOTT));   /* 2 800 x 53 = 148 400 */
  assert.equal(r.state.currencies.ap, 148400);
  r = agir(r.state, Object.assign({ unites: 2848 }, DOTT), t0 + 2000);   /* 48 x 53 = 2 544 > 1 600 restants */
  assert.equal(r.result.ap, 1600, "borné à plafond - déjà crédité");
  assert.equal(r.state.currencies.ap, 150000, "jamais plus de 150 000");
  assert.equal(r.state.systems.scummvm.data.jeux.dott.apCredite, 150000);
  r = agir(r.state, Object.assign({ unites: 5000 }, DOTT), t0 + 3000);
  assert.equal(r.result.ap, 0, "plafond atteint : plus rien");
  assert.equal(r.state.currencies.ap, 150000);
}

/* 4. deux jeux indépendants : chacun son plafond et ses crédits */
{
  let r = agir(ouvert(), { jeu: "dott", unites: 4, plafond: 200, parUnite: 100 });
  assert.equal(r.state.currencies.ap, 200, "dott plafonné à 200");
  r = agir(r.state, { jeu: "autre", unites: 3, plafond: 1000, parUnite: 10 }, t0 + 2000);
  assert.equal(r.state.currencies.ap, 230, "l'autre jeu rouvre de nouveaux points");
  r = agir(r.state, { jeu: "dott", unites: 9, plafond: 200, parUnite: 100 }, t0 + 3000);
  assert.equal(r.state.currencies.ap, 230, "dott reste plafonné");
  assert.deepEqual(r.state.systems.scummvm.data.jeux, { dott: { unites: 9, apCredite: 200, v: 3 }, autre: { unites: 3, apCredite: 30, v: 3 } });
}

/* 5. menu verrouillé : action refusée, aucun AP (règle n°2) */
{
  const ferme = syncIdleNguState({}, { bosses: IDLE_SCUMMVM_BOSS_V1 - 1 }, t0);
  assert.throws(() => applyIdleNguAction(ferme, { action: "scummvmProgres", unites: 5, ...DOTT }, { bosses: IDLE_SCUMMVM_BOSS_V1 - 1 }, t0 + 1000), /SYSTEME_VERROUILLE/);
  assert.throws(() => idleScummvmProgresV1(ferme, { unites: 5, ...DOTT }), /SYSTEME_VERROUILLE/);
  assert.equal(ferme.currencies.ap, 0);
}

/* 6. borne absolue du moteur : catalogue mal saisi (plafond ou AP par unité démesurés) */
{
  assert.equal(IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1, 1_000_000);
  let r = agir(ouvert(), { jeu: "dott", unites: 50, plafond: 1e12, parUnite: 1e12 });
  assert.equal(r.state.currencies.ap, 1_000_000, "jamais plus de 1 000 000 AP pour un jeu, même avec un plafond de 10^12");
  r = agir(r.state, { jeu: "dott", unites: 60, plafond: 1e12, parUnite: 1e12 }, t0 + 2000);
  assert.equal(r.state.currencies.ap, 1_000_000);
}

/* 7. formes invalides refusées sans effet */
{
  for (const p of [{ jeu: "", unites: 1 }, { jeu: "a b", unites: 1 }, { jeu: "dott", unites: -1 }, { jeu: "dott", unites: "x" }, { jeu: "dott", unites: 1, plafond: 0 }, { jeu: "dott", unites: 1, parUnite: 0 }, { jeu: "dott", unites: 1e9 }]) {
    const e = ouvert();
    assert.throws(() => agir(e, Object.assign({ plafond: 100, parUnite: 1 }, p)), /PAYLOAD_INVALIDE/, JSON.stringify(p));
  }
}

/* 8. la constante SOREAL est signalée et inscrite au registre (« à valider par Norman ») */
{
  const reg = JSON.parse(readFileSync("cloudflare/tests/references/constantes-soreal-v1.json", "utf8"));
  assert.ok(reg.entrees.some((e) => e.fichier === "idle-scummvm-progres-v1.js" && /IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1/.test(e.description) && e.statut === "à valider par Norman" && e.date === "2026-11-22"));
  const src = readFileSync("cloudflare/src/idle-scummvm-progres-v1.js", "utf8");
  assert.ok(/choix SOREAL/.test(src) && src.includes("2026-11-22"), "commentaire « choix SOREAL » daté");
  assert.ok(!/apWithBonusV1|apBonusMultiplierV1/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "le code n'utilise pas le multiplicateur d'AP");
}

console.log("idle-scummvm-progres-moteur-v1 OK");
