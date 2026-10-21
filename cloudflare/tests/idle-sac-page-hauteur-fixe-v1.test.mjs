import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-21) : « quand on change de page dans l'inventaire, je veux que seule la partie dans le cadre Sac change, pas de mouvement de page » : la dernière page est complétée par des cases invisibles, le cadre garde sa hauteur. */
const rendu = readFileSync(new URL("../public/modules/ui-aventure-2-v1.js", import.meta.url), "utf8");
const patch = readFileSync(new URL("../public/modules/ui-inventaire-v1.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
assert.ok(rendu.includes("if(pages>1)for(let i=cases.length;i<REG.IDLE_SAC_CASES_PAR_PAGE_V1;i+=1)cases.push("), "rendu complet : cases invisibles qui complètent la page");
assert.ok(patch.includes("while(noeudsFinaux.length<REG.IDLE_SAC_CASES_PAR_PAGE_V1)") && patch.includes("soreal-idle-v138-bag-filler"), "mise à jour en place : mêmes cases invisibles");
assert.ok(patch.includes("else if(node.classList&&node.classList.contains('soreal-idle-v138-bag-filler'))fillers.push(node);"), "une case invisible n'est jamais reprise comme emplacement vide déposable");
assert.ok(/\.soreal-idle-v138-bag-filler\{visibility:hidden;pointer-events:none\}/.test(css), "case invisible et sans interaction");
console.log("idle-sac-page-hauteur-fixe-v1: OK");
