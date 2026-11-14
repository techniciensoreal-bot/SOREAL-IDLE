import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { IDLE_ACHIEVEMENTS_V1, idleAchievementsEvaluateV1 } from "../src/idle-achievements-v1.js";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { achievementMetricsV1 } from "../src/idle-ngu-bonus.js";

/*
 * Norman (2026-11-14) : « il y a un succès qui demande de résister à un ennemi qui explose. Je veux que tu fasses un audit complet pour voir si tous les succès sont obtenables. Il faut vraiment que tout y soit. »
 * Six succès secrets n'étaient pas suivis, donc jamais débloqués : « Survive an attack from an exploder enemy » et les cinq « Defeat <titan> before they can attack even once ».
 * Ils sont maintenant mesurés : le client annonce la survie à l'explosion (ennemi réellement explosif) et la victoire sans coup du titan ; le serveur pose un drapeau permanent.
 */
const ctx = { bosses: 300, stats: { power: 1e24, toughness: 1e24, hp: 5000 } };
const agir = (s, p, t, c = ctx) => applyIdleAdventureActionV47(s, p, c, t);
const nom = (id) => IDLE_ACHIEVEMENTS_V1.find((a) => a.id === id);

// 0. Tous les succès du catalogue sont maintenant suivis.
assert.equal(IDLE_ACHIEVEMENTS_V1.length, 153, "153 succès, comme l'annonce le wiki");
assert.deepEqual(IDLE_ACHIEVEMENTS_V1.filter((a) => !a.tracked).map((a) => a.id), [], "aucun succès non suivi : tous sont obtenables");

// 1. Titans : victoire sans coup du titan.
function combatTitan(id, avant) {
  let s = avant || normalizeIdleAdventureStateV47({});
  Object.assign(s.unlockFlags, { ngu: true, yggdrasil: true, diggers: true, ringOfApathyMaxed: true });   // déblocages exigés par les titans 2, 3 et 4
  s.titans = Object.assign({ t1: { kills: 24, nextAt: 0 }, t2: { kills: 24, nextAt: 0 }, t3: { kills: 28, nextAt: 0 } }, s.titans || {});   // progression exigée (kills du titan précédent)
  const r = agir(s, { action: "startTitanFight", titan: id }, 10_000);
  s = r.state;
  return { s, identite: { titanId: s.fight.titanId, titanStartedAt: s.fight.titanStartedAt } };
}
for (const id of ["t1", "t2", "t3", "t4"]) {
  // victoire ordinaire (30 s après, sans annonce) : pas de drapeau
  let { s, identite } = combatTitan(id);
  s = agir(s, Object.assign({ action: "resolveZoneFight" }, identite), 40_000).state;
  assert.ok(!s.unlockFlags["noHit_" + id], id + " : victoire ordinaire, pas « sans coup »");
  // victoire annoncée « sans coup » mais trop rapide (200 ms) : refusée
  ({ s, identite } = combatTitan(id));
  assert.throws(() => agir(s, Object.assign({ action: "resolveZoneFight", titanSansCoup: true }, identite), 10_200), /COMBAT_TITAN_TROP_COURT/, id + " : moins de 300 ms refusé");
  // victoire annoncée « sans coup » à 800 ms : le drapeau permanent est posé
  const r = agir(s, Object.assign({ action: "resolveZoneFight", titanSansCoup: true }, identite), 10_800);
  assert.equal(r.state.unlockFlags["noHit_" + id], true, id + " : drapeau « sans coup »");
}
// sans annonce, une victoire rapide reste refusée comme avant (garde de 2 s)
{ const { s, identite } = combatTitan("t1"); assert.throws(() => agir(s, Object.assign({ action: "resolveZoneFight" }, identite), 10_800), /COMBAT_TITAN_TROP_COURT/); }

// 2. Walderp : seule la FORME FINALE compte.
{
  let s = normalizeIdleAdventureStateV47({});
  let t = 10_000;
  for (let forme = 1; forme <= 5; forme += 1) {
    if (s.titans.t5) { s.titans.t5.nextAt = 0; if (s.titans.t5.hiddenPanel) s = agir(s, { action: "titanFound", titan: "t5" }, t).state; if (s.titans.t5) s.titans.t5.nextAt = 0; }   // Walderp se cache après chaque forme : on le retrouve
    const dep = agir(s, { action: "startTitanFight", titan: "t5" }, t);
    s = dep.state;
    const identite = { titanId: s.fight.titanId, titanStartedAt: s.fight.titanStartedAt };
    s = agir(s, Object.assign({ action: "resolveZoneFight", titanSansCoup: true }, identite), t + 800).state;
    if (forme < 5) assert.ok(!s.unlockFlags.noHit_t5, "forme " + forme + " : pas encore le succès");
    if (s.titans.t5) s.titans.t5.nextAt = 0;   // le délai entre deux formes n'est pas ce que le test vérifie
    t += 5_000;
  }
  assert.equal(s.unlockFlags.noHit_t5, true, "forme finale vaincue sans coup : drapeau posé");
}

// 3. Ennemi explosif : la survie n'est acceptée que contre un VRAI explosif.
function combatZone(type) {
  let s = normalizeIdleAdventureStateV47({});
  s = agir(s, { action: "selectZone", zone: "forest" }, 10_000).state;
  s = agir(s, { action: "startZoneFight" }, 10_100).state;
  assert.ok(s.fight.active, "combat de zone lancé");
  s.fight.mobType = type;
  return s;
}
{
  let s = combatZone("exploder");
  s = agir(s, { action: "resolveZoneFight", exploderSurvived: true }, 20_000).state;
  assert.equal(s.unlockFlags.exploderSurvived, true, "explosion survécue : drapeau posé");
  let n = combatZone("poison");
  n = agir(n, { action: "resolveZoneFight", exploderSurvived: true }, 20_000).state;
  assert.ok(!n.unlockFlags.exploderSurvived, "annonce contre un ennemi non explosif : ignorée");
  let c = combatZone("exploder");
  c = agir(c, { action: "resolveZoneFight" }, 20_000).state;
  assert.ok(!c.unlockFlags.exploderSurvived, "sans annonce de survie : pas de drapeau");
}

// 4. Les mesures et les succès : chaque drapeau débloque son trophée.
{
  const etat = normalizeIdleNguState({}, {}, 1_000_000);
  etat.adventure = normalizeIdleAdventureStateV47({});
  for (const k of ["exploderSurvived", "noHit_t1", "noHit_t2", "noHit_t3", "noHit_t4", "noHit_t5"]) etat.adventure.unlockFlags[k] = true;
  const nouveaux = idleAchievementsEvaluateV1(etat, achievementMetricsV1(etat), 1);
  for (const id of ["secretExploder", "secretNoHitGrb", "secretNoHitGct", "secretNoHitJake", "secretNoHitUug", "secretNoHitWalderp"]) {
    assert.ok(nouveaux.includes(id), "trophée débloqué : " + id);
    assert.equal(nom(id).tracked, true);
  }
}
// 5. Le client annonce bien ces deux faits avec la victoire (sources) : compteur d'attaques du titan, survie à l'explosion, charge utile de la résolution.
import { readFileSync } from "node:fs";
{
  const aventure = readFileSync(new URL("../public/modules/ui-aventure-1-v1.js", import.meta.url), "utf8");
  const combat = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
  assert.ok(combat.includes("REG.idleTitanAttaquesV1=0;REG.idleExploderSurvivedV1=false;") && combat.includes("if(fight.titanId)REG.idleTitanAttaquesV1=(REG.idleTitanAttaquesV1||0)+1;"), "compteur d'attaques du titan remis à zéro à chaque combat et incrémenté à chaque attaque");
  assert.ok(aventure.includes("sansCoup:Boolean(fight.titanId)&&!(REG.idleTitanAttaquesV1>0)") && aventure.includes("exploderSurvived:Boolean(REG.idleExploderSurvivedV1)"), "victoire : sans coup et explosion survécue notés");
  assert.ok(aventure.includes("titanSansCoup:idleAdventureResolutionIdentiteV2.sansCoup===true,exploderSurvived:idleAdventureResolutionIdentiteV2.exploderSurvived===true"), "annoncés au serveur avec la résolution");
}
console.log("idle-succes-secrets-obtenables-v1 : OK");
