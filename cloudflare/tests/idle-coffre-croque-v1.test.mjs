import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : le Coffre à dents doit croquer quel que soit le mode de dépôt (glisser-déposer HTML5, doigt, souris). Chaque chemin qui envoie « coffreDeposer » pose le drapeau d'animation avant. */
const s = readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8");
const envois = [...s.matchAll(/actionAdventureIdleV47_\(\{action:'coffreDeposer'/g)].map((m) => m.index);
assert.ok(envois.length >= 2, "au moins deux chemins de dépôt");
for (const i of envois) assert.ok(s.slice(Math.max(0, i - 200), i).includes("window.__bagageAvaleIdleV1=Date.now();"), "dépôt sans animation à l'index " + i);
/* Animation complète (Norman, 2026-10-19) : la gueule s'ouvre, croque, puis la langue lèche les babines avant de se refermer (valable Coffre ouvert ou refermé). */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes("@keyframes bgCroqueCouv") && css.includes("@keyframes bgCroqueLangue"), "séquence gueule + langue");
assert.ok(css.includes(".soreal-idle-section-v8.soreal-idle-coffre-v1 .bg-bagage-v1.croque .bg-langue{animation:bgCroqueLangue 1.25s") && css.includes(".soreal-idle-section-v8.soreal-idle-coffre-v1 .bg-bagage-v1.croque .bg-couvercle{animation:bgCroqueCouv 1.25s"), "joué quel que soit l'état du Coffre");
assert.ok(css.includes('translateX(-60px) rotate(5deg)') && css.includes('translateX(60px) rotate(-5deg)') && !css.includes('rotate(-72deg)'), "la langue GLISSE le long des babines d'un côté puis de l'autre (plus de balancier à 70°)");
/* Coffre REFERMÉ (Norman, 2026-10-20) : un dépôt ne redessine pas le cadre ; l'animation est donc posée directement sur le coffre affiché, à chaque dépôt. */
for (const i of envois) assert.ok(s.slice(Math.max(0, i - 300), i).includes("jouerCroqueCoffreIdleV1_();"), "dépôt sans animation directe à l'index " + i);
assert.ok(s.includes("function jouerCroqueCoffreIdleV1_(){") && s.includes("b.classList.add('croque');") && s.includes("setTimeout(function(){b.classList.remove('croque');},1300);"), "animation posée puis retirée après 1,3 s");
console.log("idle-coffre-croque-v1: OK");
