import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : animation des images quand le combat commence (plus la vie d'un combattant baisse, plus l'effet s'intensifie), Fight grisé tant que le serveur n'a pas validé,
 * barre de l'ennemi rouge sans ligne verticale en Aventure, barres de vie de Fight Boss beaucoup plus stylées.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// Ambiance du duel : intensités 0..1 par combattant, posées seulement quand elles changent.
assert.ok(ui.includes("function actualiserAmbianceCombatIdleV1_()"));
assert.ok(ui.includes("duel.style.setProperty('--i-joueur',String(iJoueur));") && ui.includes("duel.style.setProperty('--i-boss',String(iBoss));") && ui.includes("duel.style.setProperty('--i-duel',String(iDuel));"));
assert.ok(ui.includes("duel.classList.toggle('danger-boss',iBoss>=.75);") && ui.includes("actualiserAmbianceCombatIdleV1_();"), "appelée à chaque tick");
assert.ok(ui.includes("barre.classList.toggle('bas',pct<=50&&pct>25);") && ui.includes("barre.classList.toggle('critique',pct<=25);"));
for (const nom of ["sorealSecousseV1", "sorealElanBossV1", "sorealElanJoueurV1", "sorealHaloCombatV1", "sorealBarreDefileV1", "sorealBarreAlerteV1"]) {
  assert.ok(css.includes("@keyframes " + nom), nom + " défini");
}
assert.ok(css.includes("calc(1.5s - var(--i-boss,0)*1s)") && css.includes("var(--i-joueur,0)"), "vitesse et amplitude suivent l'intensité");
assert.ok(css.includes("@media (prefers-reduced-motion:no-preference){"), "animations coupées pour qui demande moins de mouvement");

// Fight grisé tant que le serveur n'a pas validé (victoire non confirmée, ordre de combat en attente ou en vol).
assert.ok(ui.includes("function fightEnAttenteServeurIdleV1_()"));
assert.ok(ui.includes("idleCombatLotEnVolV1=lot.type==='combat';"));
assert.ok((ui.match(/fightEnAttenteServeurIdleV1_\(\)/g) || []).length >= 3, "utilisée au rendu, au rafraîchissement des commandes, et pour bloquer le clic");
assert.ok(ui.includes("if(actif&&!idleEtat.combatBossActif&&(idleCombatLotEnVolV1||idleFastPendingV60.combat!==null))return;"), "pas de nouveau Fight même au clavier");

// Aventure : barre de l'ennemi rouge, sans ligne.
const i = css.indexOf('[data-menu="aventure"] .soreal-idle-bossbar-v7{');
const bloc = css.slice(i, css.indexOf("}", i));
assert.ok(i > 0 && bloc.includes("#e02424") && !bloc.includes("repeating-linear-gradient"), "rouge, sans ligne verticale");
console.log("idle-fight-boss-style-v1 OK");
