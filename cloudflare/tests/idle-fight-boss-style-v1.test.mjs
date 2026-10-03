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
assert.ok(ui.includes("duel.style.setProperty('--i-joueur',String(iJoueur));") && ui.includes("duel.style.setProperty('--i-boss',String(iBoss));")); assert.ok(!ui.includes("--i-duel"), "plus de valeur commune aux deux combattants");
assert.ok(ui.includes("duel.classList.toggle('danger-boss',iBoss>=.75);") && ui.includes("actualiserAmbianceCombatIdleV1_();"), "appelée à chaque tick");
assert.ok(ui.includes("barre.classList.toggle('bas',pct<=50&&pct>25);") && ui.includes("barre.classList.toggle('critique',pct<=25);"));
for (const nom of ["sorealSecousseBossV1", "sorealSecousseJoueurV1", "sorealElanBossV1", "sorealElanJoueurV1", "sorealHaloBossV1", "sorealHaloJoueurV1", "sorealBarreDefileV1", "sorealBarreAlerteV1"]) {
  assert.ok(css.includes("@keyframes " + nom), nom + " défini");
}
assert.ok(css.includes("calc(1.8s - var(--i-boss,0)*1.1s)") && css.includes("var(--i-joueur,0)"), "vitesse et amplitude suivent l'intensité");
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

// Norman (2026-10-03) : « les mouvements de cadre doivent être différents pour le boss et le joueur ; presque full vie et mon portrait bougeait comme celui du boss ».
// Chaque combattant n'obéit qu'à SA vie : aucune variable commune, secousses / élans / halos distincts.
{
  const bloc = (nom) => { const i = css.indexOf("@keyframes " + nom); const fin = css.indexOf(String.fromCharCode(10) + "@keyframes", i + 10); return css.slice(i, fin < 0 ? css.length : fin); };
  assert.ok(!css.includes("--i-duel"), "plus aucune valeur commune aux deux combattants");
  for (const nom of ["sorealSecousseBossV1", "sorealElanBossV1", "sorealHaloBossV1"]) assert.ok(!bloc(nom).includes("--i-joueur"), nom + " ne dépend que de la vie du boss");
  for (const nom of ["sorealSecousseJoueurV1", "sorealElanJoueurV1", "sorealHaloJoueurV1"]) assert.ok(!bloc(nom).includes("--i-boss"), nom + " ne dépend que de la vie du joueur");
  assert.notEqual(bloc("sorealSecousseBossV1").replace(/Boss|boss/g, "X"), bloc("sorealSecousseJoueurV1").replace(/Joueur|joueur/g, "X"), "mouvements de secousse différents");
  // Les règles d'animation : le portrait du joueur n'utilise jamais les animations du boss (y compris à l'approche de la mort).
  const regles = css.slice(css.indexOf("@media (prefers-reduced-motion:no-preference){", css.indexOf("Les deux images vivent")));
  const regleJoueur = [...regles.matchAll(/\.soreal-idle-player-portrait-v41 > :not\([^)]*\)\{([^}]*)\}/g)].map((m) => m[1]).join(" ");
  assert.ok(regleJoueur.includes("sorealSecousseJoueurV1") && regleJoueur.includes("sorealElanJoueurV1") && !/Boss/.test(regleJoueur), "le portrait du joueur n'anime que SES mouvements");
  const regleBoss = [...regles.matchAll(/:not\(\.soreal-idle-player-portrait-v41\) > :not\([^)]*\)\{([^}]*)\}/g)].map((m) => m[1]).join(" ");
  assert.ok(regleBoss.includes("sorealSecousseBossV1") && !/Joueur/.test(regleBoss), "le portrait du boss n anime que SES mouvements");
}
console.log("idle-fight-boss-style-v1 OK");
