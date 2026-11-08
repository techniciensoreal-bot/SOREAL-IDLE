import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-08) : « quand je mets toute mon énergie et que je la retire, la barre continue d'avancer ». Mesuré dans son exe : après « 0 », le liquide montait encore d'environ 1 à 2 % en 1 à 2 s, car l'écran fondait son retard (~1 %)
 * sur la valeur du moteur comme si la barre avançait encore. Cause : le test « la barre a-t-elle une durée ? » utilisait Number.isFinite(Number(null)), vrai (Number(null) vaut 0), donc une barre sans énergie passait pour active.
 * Garde : une barre dont la durée restante est null/absente (aucune ressource allouée) prend la valeur du moteur tout de suite (aucun __tmCorr), et la boîte noire des reculs existe.
 */
const src = fs.readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8");

assert.ok(/affichees\.push\(\[remplissage,avantPx\/100,entree\[2\]!==null&&entree\[2\]!==undefined&&Number\.isFinite\(Number\(entree\[2\]\)\)\]\)/.test(src), "l'état « barre active » écarte null et undefined (Number(null) vaut 0)");
assert.ok(/if\(!x\[2\]\)return;/.test(src), "une barre arrêtée n'a aucun fondu");
assert.ok(src.indexOf("if(!x[2])return;") < src.indexOf("b.__tmCorr={d:ecart"), "le test d'arrêt précède la création du fondu");

// Comportement : on extrait la boucle de fondu et on la rejoue avec une barre arrêtée et une barre active.
const debut = src.indexOf("affichees.forEach(function(x){");
const fin = src.indexOf("});", src.indexOf("lancerLissageBarresTmIdleV1_();", debut)) + 3;
assert.ok(debut > 0 && fin > debut, "boucle de fondu retrouvée");
const corps = src.slice(debut, fin);
function jouer(active) {
  const style = { width: "50.0000%", height: "" };
  const b = { style, __tmAnim: active ? {} : null };
  const affichees = [[b, 0.52, active]];
  const ECART_MAX_DECALAGE_TM_V1 = 0.05, DUREE_FONTE_DECALAGE_TM_V1 = 600;
  const poserTubeTmIdleV1_ = () => {}, lancerLissageBarresTmIdleV1_ = () => {};
  new Function("affichees", "ECART_MAX_DECALAGE_TM_V1", "DUREE_FONTE_DECALAGE_TM_V1", "poserTubeTmIdleV1_", "lancerLissageBarresTmIdleV1_", "maintenantFonte", corps)(affichees, ECART_MAX_DECALAGE_TM_V1, DUREE_FONTE_DECALAGE_TM_V1, poserTubeTmIdleV1_, lancerLissageBarresTmIdleV1_, 1000);
  return b;
}
assert.equal(jouer(false).__tmCorr, undefined, "barre sans énergie : aucun fondu, la valeur du moteur est prise telle quelle");
assert.ok(jouer(true).__tmCorr && jouer(true).__tmCorr.d > 0, "barre active : le fondu existe toujours (aucun saut pendant qu'elle avance)");

// Boîte noire : enregistre les reculs peints (hors passage de niveau), seulement depuis la boucle d'animation.
assert.ok(src.includes("__SOREAL_IDLE_BOITE_NOIRE_TM_V1__") && src.includes("soreal_idle_diag_v1_reculs_tm"), "boîte noire des reculs de barre");
assert.ok(/soreal_idle_diag_v1/.test(fs.readFileSync("cloudflare/public/modules/prefs-compte-v1.js", "utf8")), "clé de diagnostic exclue de la synchro de compte (propre à l'appareil)");
assert.equal((src.match(/noterReculTmIdleV1_\(/g) || []).length, 3, "définition + deux appels, tous dans le dessin de la boucle d'animation");

// Redimensionnement : les deux affectations sont DANS la boucle (avant : c[i] hors boucle = erreur à chaque resize).
const led = fs.readFileSync("cloudflare/public/modules/aug-led-barres-v1.js", "utf8");
assert.ok(led.includes("for(var i=0;i<c.length;i++){c[i].__sigLed='';c[i].__ech=0;}"), "resize : remise à zéro de chaque toile dans la boucle");
console.log("idle-tm-barre-arretee-v1: OK");
