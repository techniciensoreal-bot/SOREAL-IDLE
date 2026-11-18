import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-18) : « les sons que font les effets en aventure (poison, explosions, etc.) ne doivent s'entendre que si on est sur la page aventure. »
 * Le combat d'Aventure tourne aussi en fond sur les autres menus : il reste silencieux. Filtre central dans le moteur audio (groupe « adventure-skill » : poison, explosion, paralysie, capacités).
 */
const src = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
assert.ok(src.includes('DEFINITIONS["skill_"+son.id]={group:"adventure-skill"'), "les sons d'effets d'Aventure sont dans le groupe adventure-skill");
const d = src.indexOf("function demander_(name){");
const corps = src.slice(d, src.indexOf("var cue={", d));
assert.ok(corps.includes('def.group==="adventure-skill"&&!surPageAventure_()'), "demander_ refuse un son d'Aventure hors de la page Aventure");
assert.ok(corps.indexOf("surPageAventure_()") < src.indexOf("var cue={", d), "le filtre passe avant la mise en file");

/* Comportement réel de la fonction de page, évaluée avec un faux window. */
const a = src.indexOf("function surPageAventure_(){");
const fn = src.slice(a, src.indexOf("function demander_(name){"));
const sur = (menu, reg = true) => new Function("window", fn + "return surPageAventure_();")({ __SOREAL_IDLE_REG__: reg ? { idleMenuActifV28: menu } : undefined });
assert.equal(sur("aventure"), true, "page Aventure : sons entendus");
assert.equal(sur("titans"), true, "page Titans (même page) : sons entendus");
for (const m of ["ngu", "entrainement", "combat", "augmentations", "yggdrasil", "tower", "parametres", "chat"]) assert.equal(sur(m), false, "menu " + m + " : silence");
assert.equal(sur(undefined, false), true, "pas de registre (page isolée) : comportement d'avant");
console.log("OK idle-sons-aventure-page-v1");
