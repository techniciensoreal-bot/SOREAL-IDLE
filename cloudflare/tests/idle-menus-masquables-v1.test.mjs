import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « la possibilité de masquer un menu. Quand on passe en mode édition, on doit toujours les voir, mais foncés. Et on peut réactiver si on le désire ». */
const lire = (f) => fs.readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const menus = lire("modules/ui-menus-v1.js"), nav = lire("modules/ui-navigation-v1.js"), css = lire("soreal-idle-ui.css");
const dict = JSON.parse(lire("modules/traduction-anglais-dict-v1.json"));
// stockage lié au compte (règle n°6) : clé soreal_idle_*, jamais le menu Réglages
assert.ok(/CLE_MENUS_MASQUES_V1='soreal_idle_menus_masques_v1'/.test(menus), "clé liée au compte");
assert.ok(/function menuMasqueIdleV1_\(id\)\{return id!=='parametres'&&/.test(menus) && /if\(!id\|\|id==='parametres'\)return false;/.test(menus), "le menu Réglages ne se masque jamais");
// la navigation par balayage ignore les menus masqués
assert.ok(/m\.id!=='chat'&&!menuMasqueIdleV1_\(m\.id\)&&menuDisponibleIdleV28_/.test(menus), "balayage : menus masqués ignorés");
// le bouton masqué reste dans la barre (classe), avec son œil (sauf Réglages)
assert.ok(/\$\{menuMasqueIdleV1_\(m\.id\)\?' masque-v1':''\}/.test(nav) && /data-nav-oeil-v1/.test(nav) && /m\.id==='parametres'\?''/.test(nav), "classe masque-v1 et œil sur chaque bouton sauf Réglages");
// l'œil agit en rangement seulement, sans glissement ni ouverture du menu
assert.ok(/REG\.idleMenuEditionV1&&ev\.target&&ev\.target\.closest\?ev\.target\.closest\('\[data-nav-oeil-v1\]'\)/.test(menus) && /basculerMenuMasqueIdleV1_\(oeil\.getAttribute/.test(menus), "l'œil bascule en mode rangement");
assert.ok(/if\(ev\.target&&ev\.target\.closest&&ev\.target\.closest\('\[data-nav-oeil-v1\]'\)\)return;/.test(menus), "l'œil ne lance pas de glissement");
// CSS : masqué = caché hors rangement, foncé en rangement, œil visible seulement en rangement, aucun !important ajouté
const bloc = css.slice(css.indexOf("/* Menus masqués (Norman, 2026-11-03)"));
assert.ok(/\.soreal-idle-nav-oeil-v1\{display:none\}/.test(bloc), "œil caché hors rangement");
assert.ok(bloc.includes(".soreal-idle-nav-v28:not(.edition) .soreal-idle-nav-button-v28.masque-v1:not(#_):not(#_){display:none}"), "menu masqué caché hors rangement (spécificité suffisante face aux règles du bouton)");
assert.ok(/\.edition \.soreal-idle-nav-button-v28\.masque-v1\{filter:brightness\(\.38\)/.test(bloc), "menu masqué foncé en rangement");
assert.ok(!/!\s*important/.test(bloc), "aucun !important ajouté");
// traduction
assert.equal(dict["l’œil masque ou réaffiche un menu"], "the eye hides or shows a menu", "texte du bandeau traduit");
console.log("idle-menus-masquables-v1: OK");
