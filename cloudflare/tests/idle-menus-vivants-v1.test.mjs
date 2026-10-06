import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : « tout doit se passer en direct ». Constat en ligne (partie B) : sur la page NGU, le niveau restait à 0 pendant que le serveur en comptait 98 (page jamais redessinée tant qu'on
 * n'en sort pas). Les menus à l'ancienne se synchronisent maintenant toutes les 4 s et se redessinent à l'arrivée, sans toucher au défilement ni pendant une saisie.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const IDLE_MENUS_VIVANTS_V1={ngu:1,wandoos:1,yggdrasil:1,diggers:1,beards:1,wishes:1,hacks:1,daycare:1};"));
assert.ok(ui.includes("(IDLE_MENUS_VIVANTS_V1[idleMenuActifV28]||idleMenuActifV28==='tower')&&PAGE_ACTIVE==='idle'&&Date.now()-idleMenuViveSyncV1>4000&&!champSaisieActifIdleV1_()"), "synchro toutes les 4 s tant que le menu est ouvert");
assert.ok(ui.includes("if(IDLE_MENUS_VIVANTS_V1[idleMenuActifV28]&&idleEtat&&!champSaisieActifIdleV1_()){\n              try{rafraichirMenuRacineIdleV28_();}"), "redessin à l'arrivée de la réponse");
// Les menus avec champs de saisie (ITOPOD : étages) ne sont pas redessinés tant qu'un champ est en cours de saisie ou modifié sans être validé.
assert.ok(ui.includes("c.value!==c.defaultValue")&&ui.includes("c.checked!==c.defaultChecked"), "champ modifié non validé = pas de redessin");
// ITOPOD : chiffres mis à jour sur place (jamais de redessin : scène animée, champs d'étage).
assert.ok(ui.includes("window.__rafraichirItopodIdleV1__(idleEtat)"));
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("window.__rafraichirItopodIdleV1__=rafraichirItopodIdleV1_;") && meta.includes("copier(vivant,neuf,'.itp-tuile b');"));
// Doigt ou souris enfoncé : pas de redessin entre l'appui et le relâchement (le clic serait perdu).
assert.ok(ui.includes("if(idlePointeurEnfonceV1&&Date.now()-idlePointeurEnfonceV1<3000)return true;"));
console.log("idle-menus-vivants-v1: OK");

// ITOPOD : le calcul des chiffres ne touche jamais à la scène (son HTML réinitialise le combat de l'écran : les ennemis ne défilaient plus).
{
  const m = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  const i = m.indexOf("function rafraichirItopodIdleV1_(j){");
  const bloc = m.slice(i, i + 1400);
  assert.ok(bloc.includes("window.__SOREAL_IDLE_ITOPOD_SCENE_V1__=null;") && bloc.includes("finally{window.__SOREAL_IDLE_ITOPOD_SCENE_V1__=scene;}"));
  console.log("idle-menus-vivants-v1 (scène ITOPOD intacte): OK");
}
