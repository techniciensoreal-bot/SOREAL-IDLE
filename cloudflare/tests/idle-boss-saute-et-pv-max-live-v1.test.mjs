import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « J'ai tué le boss 45 et je suis passé au 47 (au refresh : bien le 46) » et « quand je prends des niveaux dans Augmentations, ma barre de vie ne se met pas à jour
 * tant que je n'ai pas fait Fight ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// Boss sauté : le « boss suivant » prédit n'est appliqué que si l'état est encore celui de la victoire et que ce boss est le suivant immédiat.
assert.ok(ui.includes("const vaincusALaVictoireV1=idleEntier_(idleEtat.bossVaincus);"));
assert.ok(ui.includes("idleEntier_(n.bossVaincus)!==idleEntier_(vaincusAvant)+1"), "boss suivant = vaincus + 1 exactement");
assert.ok(ui.includes("idleEntier_(idleEtat.bossVaincus)>idleEntier_(vaincusAvant)"), "serveur déjà à jour : rien à prédire");

// PV max : RETIRÉ le 2026-10-03 (régression) -- combatPrincipal.pvMax ne vaut PAS la vie max réellement utilisée en combat (1,7e47 au lieu de ~8e15 chez Norman) : la barre ne montait plus.
// Le serveur renvoie de nouveau la valeur enregistrée ; une mise à jour « en direct » devra reprendre la formule exacte du combat (entrainementV41.pvMax).
assert.ok(!runtime.includes("pvJoueurMaxEtatV1"), "la vie max n'est plus dérivée de combatPrincipal");

// Augmentations : une seule jauge d'Or (celle du haut de page) ; la ponction d'un niveau y est visible aussitôt.
{
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(!meta.includes("🪙 Gold<b>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(gold)"), "plus de second compteur d'Or dans la page Augmentations");
  assert.ok(ui.includes("debites+=1;debiteCeTick=true;") && ui.includes("if(debiteCeTick)patcherResumeStatsIdleV28_(idleEtat);"), "ponction d'Or locale, une fois par cycle terminé, compteur du haut mis à jour");
}
console.log("idle-augmentations-or-instantane OK");
