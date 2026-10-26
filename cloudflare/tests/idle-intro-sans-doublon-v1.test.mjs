import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-10-26) : « la chronique du premier boss ne doit pas être lue automatiquement au lancement du jeu : elle est lue dans l'intro, ça fait doublon » ; « ce n'est plus le bon tuto, il faut le supprimer : c'est celui
 * que j'ai fait moi-même qu'il faut ». La chronique du boss 1 n'est jamais lue toute seule ; l'ancien tutoriel (Norman & Sébastien) n'est plus jamais joué, seuls l'introduction et les guides de l'Admin restent.
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const panneau = tts.slice(tts.indexOf("function panneauChroniqueBoss_(){"), tts.indexOf("function activePanel_(){"));
assert.ok(panneau.includes("if(String(id)==='1')return null;"), "chronique du premier boss : jamais lue automatiquement");
assert.ok(tts.includes("document.querySelector('#sorealIdleTutorielPagesModalV1 .id-scene')"), "l'intro garde la priorité de lecture");

const ui = readFileSync("cloudflare/public/modules/ui-tutoriel-v1.js", "utf8");
const permis = ui.slice(ui.indexOf("function ancienTutorielPermisIdleV1_(){"), ui.indexOf("function demarrerTutorielPagesIdleV1_"));
assert.ok(permis.includes("return false;") && !permis.includes("ancienPermis()"), "l'ancien tutoriel n'est plus jamais permis");
const tuto = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(tuto.includes("ancienPermis:function(){return false;}"), "moteur des guides : ancien tutoriel jamais permis");
const admin = readFileSync("cloudflare/public/modules/admin-tutoriel-v1.js", "utf8");
assert.ok(!admin.includes('data-at="ancien" '), "plus de case « jouer l'ancien tutoriel » dans l'Admin");

const m = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-tutoriel-v1.js").href);
const db = new (await import("node:sqlite")).DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
assert.equal(m.ancienTutorielActifV1(sql), false, "serveur : ancien tutoriel supprimé");
m.reglerAncienTutorielV1(sql, true);
assert.equal(m.ancienTutorielActifV1(sql), false, "serveur : même réactivé, jamais joué");

console.log("idle-intro-sans-doublon-v1: OK");
