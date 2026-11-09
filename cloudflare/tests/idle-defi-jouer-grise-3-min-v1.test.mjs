import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { minRebirthSecondsV1 } from "../src/idle-ngu-snapshot.js";

/*
 * Norman (2026-11-09) : « on peut lancer un défi même si les 3 minutes ne sont pas passées ; il fait le bruit mais ne se lance pas ; il faut que le bouton soit grisé avant 3 minutes et qu'il s'allume à 3 minutes comme la renaissance ».
 * Le moteur refusait déjà (DEFI_TROP_TOT) mais la page jouait le bruit de la machine et envoyait l'ordre. Le moteur publie le minimum (challengeMinSecondes, même valeur que son refus) ; la page grise « Jouer » jusque-là et l'allume à l'heure du serveur.
 */
{
  const etat = normalizeIdleNguState({}, { bosses: 82, bestGold: 1e15 }, 1_000_000);
  const snap = idleNguSnapshot(etat, { bosses: 82, bestGold: 1e15 }, 1_000_000);
  assert.equal(snap.challengeMinSecondes, minRebirthSecondsV1(etat), "le moteur publie le minimum de run pour lancer un défi");
  assert.equal(snap.challengeMinSecondes, 180, "180 s sans le souhait 20");
}
const src = readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8");
assert.ok(src.includes("function resteAvantDefi()") && src.includes("j.systemes.challengeMinSecondes") && src.includes("j.renaissance.runDebuteA"), "reste = minimum du moteur - temps de run à l'heure du serveur");
// les deux boutons « Jouer » (tuile et fiche) passent par la même fonction
assert.equal((src.match(/boutonJouer\(id,(true|false)\)/g) || []).length, 2, "tuile et fiche : même bouton");
assert.ok(!/class="dfi-jouer"[^>]*onclick="event\.stopPropagation\(\);window\.__demarrerDefiIdleV1__/.test(src), "plus de bouton « Jouer » toujours actif écrit à la main");
const f = src.slice(src.indexOf("function boutonJouer"), src.indexOf("function infosDefi"));
assert.ok(f.includes("dfi-attente") && f.includes('aria-disabled="true"') && f.includes('data-dfi-action="') && !/dfi-attente[^]*onclick=[^]*return '<button type="button" class="'\+cl\+'" onclick/.test("") , "grisé : aria-disabled, action gardée à part, jamais d'onclick");
const grise = f.slice(f.indexOf("if(reste>0)return"), f.indexOf("return '<button type=\"button\" class=\"'+cl+'\" onclick="));
assert.ok(!grise.includes("onclick"), "le bouton grisé n'a aucun onclick : pas de bruit, pas d'ordre envoyé");
// allumage automatique à l'heure
assert.ok(src.includes("window.__SOREAL_IDLE_DEFIS_ATTENTE_V1__") && src.includes("b.classList.remove('dfi-attente')") && src.includes("b.setAttribute('onclick'"), "le bouton s'allume tout seul à l'heure");
// style grisé lisible
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(css.includes(".dfi-jouer.dfi-attente{background:linear-gradient(180deg,#4a4650,#2c2a31);color:#f1ead2"), "bouton grisé lisible");
// le moteur refuse toujours un lancement trop tôt (garde-fou inchangé)
assert.ok(readFileSync("cloudflare/src/idle-runtime-actions.js", "utf8").includes("code:'DEFI_TROP_TOT'"), "refus du moteur conservé");
console.log("idle-defi-jouer-grise-3-min-v1: OK");
