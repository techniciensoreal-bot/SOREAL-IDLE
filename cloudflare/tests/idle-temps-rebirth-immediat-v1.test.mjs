// Norman (2026-11-02) : la case « Temps » du bandeau du haut doit apparaître DÈS que le menu Renaissance apparaît, pas environ trois minutes plus tard.
// Cause : le bandeau n'était redessiné que quand la case AP apparaissait ; la case Temps attendait le dessin complet suivant.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const norm = (t) => t.split(String.fromCharCode(13)).join("");
const popups = norm(readFileSync("cloudflare/public/modules/ui-popups-v1.js", "utf8"));
const debut = popups.indexOf("function patcherResumeStatsIdleV28_(j){");
assert.ok(debut > 0, "fonction trouvée");
const corps = popups.slice(debut, popups.indexOf("ecrire('sorealIdleSummaryAttackV50'", debut));

// la même condition que celle qui dessine la case (resumeStatsIdleV28_) : menu Renaissance disponible + module de durée chargé
const aventure = norm(readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8"));
assert.ok(aventure.includes("REG.menuDisponibleIdleV28_('renaissance',j)") && aventure.includes("api.runSecondes==='function'"), "la case Temps est dessinée quand le menu Renaissance est disponible");
assert.ok(corps.includes("REG.menuDisponibleIdleV28_('renaissance',j)") && corps.includes("typeof apiTemps.runSecondes==='function'"), "le patch du bandeau utilise la même condition");

// la case absente déclenche le redessin de la grille (comme la case AP), au lieu d'attendre le dessin complet suivant
assert.ok(corps.includes("document.getElementById('sorealIdleSummaryRebirthTempsV1')"), "le patch cherche la case Temps");
assert.ok(corps.includes("if((apVisible&&!apExistant)||(tempsVoulu&&!tempsExistant)){"), "case voulue et absente : la grille est redessinée");
assert.ok(corps.includes("grille.outerHTML=resumeStatsIdleV28_(j);"), "redessin par la fonction qui construit la grille");

// le patch tourne à chaque tick de la boucle (jamais sur une minuterie de plusieurs minutes)
const boucle = norm(readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8"));
assert.ok(boucle.includes("if(maintOr-REG.idleOrLocalPatchV1>500){REG.idleOrLocalPatchV1=maintOr;patcherResumeStatsIdleV28_("), "patch toutes les 500 ms au plus");

console.log("idle-temps-rebirth-immediat-v1 : OK");
