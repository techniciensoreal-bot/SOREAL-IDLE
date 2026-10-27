import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : « je ne veux plus du tutoriel de base (Salut, qui que tu sois), je veux le nouveau que j'ai fait ; il nous fait apparaître dans Fight Boss ; la chronique de boss doit se lire et ensuite il doit s'ouvrir et se lire aussi ». */
const lire = (p) => readFileSync(new URL("../public/modules/" + p, import.meta.url), "utf8");
const pop = lire("ui-popups-v1.js"), tut = lire("ui-tutoriel-v1.js"), menus = lire("ui-menus-v1.js"), nouveau = lire("tutoriel-v1.js");

// 1. Au lancement d'une nouvelle partie : seule la première page (« Le commencement », en images) de l'ancien tutoriel, quel que soit le réglage « ancien tutoriel ».
assert.ok(/demarrerTutorielPagesIdleV1_\(\s*REG\.TUTORIEL_DEBUT_JEU_PAGES_V1\.slice\(0,1\),\s*'soreal_idle_tutoriel_debut_v1_'\+cle,\s*\{toujours:true\}\s*\)/.test(pop), "seule la page « Le commencement » est lancée");
const gerer = pop.slice(pop.indexOf("function gererPopupsProgressionIdleV75_(j)"), pop.indexOf("function gererPopupsProgressionIdleV75_(j)") + 400);
assert.ok(!gerer.includes("ancienTutorielPermisIdleV1_"), "elle ne dépend plus du réglage de l'ancien tutoriel");
assert.ok(/function demarrerTutorielPagesIdleV1_\(pages,cle,options\)\{\s*if\(!ancienTutorielPermisIdleV1_\(\)&&!\(options&&options\.toujours\)\)return;/.test(tut), "l'option « toujours » passe outre le réglage");
assert.ok(tut.includes("etat.pages[0]===REG.TUTORIEL_DEBUT_JEU_PAGES_V1[0]"), "l'introduction seule est reconnue (marquée vue à sa fermeture)");

// 2. Cliquer sur la dernière image d'une introduction à une page la ferme (avant : la page se redessinait sans fin).
assert.ok(menus.includes("if(delta>0&&etat.index>=etat.pages.length-1){tutorielPagesFermerV1_();return;}"), "avancer depuis la dernière page ferme le tutoriel de pages");

// 3. Le nouveau tutoriel : la fenêtre du guide attend la chronique du boss (fermée, lecture terminée ou interrompue, libre depuis 1,5 s).
assert.ok(nouveau.includes("function chroniqueOccupee_()") && nouveau.includes("sorealIdleBossChroniqueV206") && nouveau.includes("tts.lectureCible('sorealIdleBossChroniqueV206')"), "détection de la chronique");
assert.ok(nouveau.includes("function attendreChronique_(s,suite)") && nouveau.includes("Date.now()-libre>=1500") && nouveau.includes("Date.now()-debut>120000"), "attente : libre depuis 1,5 s, 2 minutes au plus");
const aff = nouveau.slice(nouveau.indexOf("function afficherEtape_(garderTaille)"), nouveau.indexOf("function afficherEtape_(garderTaille)") + 900);
assert.ok(aff.indexOf("window.__menuIdleV28__(e.menu)") > 0 && aff.indexOf("attendreChronique_(s,") > aff.indexOf("window.__menuIdleV28__(e.menu)"), "le jeu se rend d'abord au menu de l'étape, puis la fenêtre attend la chronique");
assert.ok(aff.includes("!s.apercu&&s.i===0&&!s.chroniqueVue"), "seulement à la première étape et jamais pour l'aperçu de l'éditeur");
console.log("idle-tutoriel-nouveau-apres-chronique-v1: OK");
