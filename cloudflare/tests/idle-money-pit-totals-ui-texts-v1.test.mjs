import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-26 (Norman) : Money Pit = bonus TOTAUX depuis le début ; boutons réactifs (actions mises en file) ; textes retirés / changés ;
 * popup de nouveauté : « Continuer » seulement.
 */
const H = 3600 * 1000;
function jeter(s, gold, t, alea) {
  s.currencies.gold = gold;
  const old = Math.random;
  Math.random = () => alea;
  try { return applyIdleNguAction(s, { action: "moneyPit" }, { bosses: 100 }, t).state; } finally { Math.random = old; }
}

// --- Totaux cumulés (au-delà des 20 jets de l'historique) ---
{
  let s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  assert.ok(s.systems.moneyPit.data.rewardsTotal, "totaux présents dès une sauvegarde neuve");
  assert.equal(s.systems.moneyPit.data.rewardsTotal.adventureStats, 0);
  // palier 3 (2e9 d or), tirage 0 = « adventureStats +5 »
  for (let i = 0; i < 25; i++) s = jeter(s, 2e9, 10_000_000 + i * 30 * H, 0);
  const t = s.systems.moneyPit.data.rewardsTotal;
  assert.equal(t.adventureStats, 25 * 5, "25 jets x 5 : l'historique n'en garde que 20, les totaux les gardent tous");
  assert.ok(t.ap >= 25 * 5, "AP du jet cumulés");
  assert.equal(s.systems.moneyPit.data.history.length, 20);
  // bonus uniques (1E8 cumulés) : +100 PV max
  let u = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  u.systems.moneyPit.unlocked = true;
  u = jeter(u, 6e7, 10_000_000, 0);
  u = jeter(u, 6e7, 10_000_000 + 2 * H, 0);
  assert.equal(u.systems.moneyPit.data.rewardsTotal.adventureHp, 100, "le bonus unique du seuil 1E8 est compté");
  // survit à une normalisation
  const re = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), { bosses: 100 }, 20_000_000);
  assert.equal(re.systems.moneyPit.data.rewardsTotal.adventureStats, 125);
  // sauvegarde d'avant : les totaux partent de l'historique disponible
  const ancien = JSON.parse(JSON.stringify(s));
  delete ancien.systems.moneyPit.data.rewardsTotal;
  const migre = normalizeIdleNguState(ancien, { bosses: 100 }, 20_000_000);
  assert.equal(migre.systems.moneyPit.data.rewardsTotal.adventureStats, 20 * 5);
}

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Page Money Pit : plus de bandeau « Progression permanente », seulement les totaux du puits
assert.match(meta, /'Balance tout ton Or durement gagné dedans\.'\s*\)\+\s*bandeauMoneyPitIdleV1_\(pitData\)\+/);
assert.match(meta, /Bonus obtenus grâce au Money Pit/);

// Boutons réactifs : file d'actions au lieu d'abandon ; le combat de zone reste abandonné ; doublon exact de l'action en cours ignoré
assert.match(meta, /function actionMetaNoyauIdleV130_\(payload\)\{/);
assert.match(meta, /idleMetaFileV1\.push\(payload\)/);
assert.match(meta, /\['startZoneFight','resolveZoneFight','loseZoneFight','zoneKill'\]/);
assert.match(meta, /Date\.now\(\)-idleMetaDernierEnvoiV1\.at<700/);

// Textes
assert.equal(meta.includes("Les récompenses affichées sont celles réellement disponibles"), false);
assert.equal(ui.includes("Les niveaux gagnés préparent une baisse du Cap"), false);
assert.equal(ui.includes("Appuie sur Start"), false);
assert.ok(ui.includes("Appuie sur Fight. Une victoire tue ce boss pour le run et sélectionne immédiatement le suivant."));
assert.equal(ui.includes("au toucher : touche l’objet puis le Coffre"), false);
assert.ok(ui.includes("Glisse un objet réellement maxé ici pour le ranger dans sa case</div>"));
assert.equal(ui.includes("rendreBonusEquipementAdventureIdleV1_(a);"), false, "bloc Equipment Bonuses retiré de la page Adventure");
assert.match(css, /\.soreal-idle-bt-meta-v120\{\s*font-size:13px;/);

// Popup de nouveauté : un seul bouton
assert.equal(ui.includes("window.__allerDepuisPopupNouveauteIdleV106__(\\''+"), false);
assert.match(ui, /soreal-idle-modal-actions-v63" style="grid-template-columns:1fr">/);
console.log("idle-money-pit-totals-ui-texts-v1: OK");
