/* Fluidité téléphone (Norman, 2026-11-17 : « le jeu est devenu injouable sur téléphone ») : une animation CSS infinie ne doit animer que transform / opacity / scale / rotate / translate
   (compositeur), jamais box-shadow, filter, background-position... (repeinture à chaque image). Garde les fichiers traités ; le balayage complet est `node cloudflare/tools/balayage-animations-lourdes.mjs`. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { balayer } from "../tools/balayage-animations-lourdes.mjs";

const lire = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const FICHIERS = ["soreal-idle-itopod.css", "soreal-idle-jeu.css", "soreal-idle-menus-boutons-v1.css", "soreal-idle-renaissance.css", "soreal-idle-barre-outils.css", "soreal-idle-entetes-a.css", "soreal-idle-entetes-miniature-v1.css"];
for (const f of FICHIERS) assert.deepEqual(balayer(lire(f)), [], f + " : animation infinie lourde (box-shadow, filter, background-position...) : " + JSON.stringify(balayer(lire(f))));

/* En-têtes de page (lot A) : le calque qui défile est un ::before déplacé par transform, d'EXACTEMENT une période de sa tuile (règle n°3 : boucle parfaite). */
const a = lire("soreal-idle-entetes-a.css");
const attendu = { avance: ["80px", "80px 22px", "translateX"], machine: ["14px", "14px 8px", "translateX"], hacks: ["140px", "140px 140px", "translateY"], wishes: ["170px", "170px 110px", "translateX"] };
for (const [menu, [periode, tuile, axe]] of Object.entries(attendu)) {
  const kf = a.match(new RegExp("@keyframes enteteB_" + menu + "\\{from\\{transform:" + axe + "\\(0\\)\\}to\\{transform:" + axe + "\\(" + periode + "\\)\\}\\}"));
  assert.ok(kf, menu + " : glissement d'une période exacte par transform");
  const regle = a.match(new RegExp('\\[data-menu="' + menu + '"\\] \\.soreal-idle-page-head-v28\\[data-entete-menu\\]::before\\{[^}]*\\}'));
  assert.ok(regle && regle[0].includes("/" + tuile), menu + " : tuile " + tuile);
  assert.ok(regle[0].includes("animation:enteteB_" + menu) && regle[0].includes("will-change:transform") && !regle[0].includes("background-position"), menu + " : calque animé par transform seulement");
  assert.ok(!new RegExp("enteteA_" + menu + "\\b").test(a), menu + " : plus d'animation de background-position");
}
/* le reste du fond (couches statiques) est sur le cadre lui-même, sans animation */
assert.ok(!/\[data-menu="(avance|machine|hacks|wishes)"\] \.soreal-idle-page-head-v28\[data-entete-menu\]\{[^}]*animation/.test(a), "fond statique du cadre sans animation");
/* mouvement réduit : le calque s'arrête */
assert.ok(a.includes('[data-menu="hacks"] .soreal-idle-page-head-v28[data-entete-menu]::before{animation:none}'), "mouvement réduit coupe le calque");

/* Haltères (Entraînement) : le gant glisse par transform ; l'haltère est fixe (milieu de son va-et-vient) */
const m = lire("soreal-idle-entetes-miniature-v1.css");
assert.ok(/@keyframes nbEntHalteres\{0%\{transform:translateX\(calc\(var\(--ent-h\) \* 0\.1250\)\)\}/.test(m) && !/nbEntHalteres\{[^@]*background-position/.test(m), "gant par transform");
assert.ok(m.includes("animation:nbEntHalteres 7.2s linear infinite;will-change:transform"), "calque du gant");

/* Rouages / tour / lueurs : période exacte */
assert.ok(lire("soreal-idle-barre-outils.css").includes("@keyframes tmRouages{from{transform:translateX(0)}to{transform:translateX(28px)}}"), "tmRouages : 28 px = une période");
assert.ok(lire("soreal-idle-menus-boutons-v1.css").includes("@keyframes nbV1_monte{0%{transform:translateY(0)}100%{transform:translateY(25%)}}"), "nbV1_monte : un étage sur quatre");
assert.ok(lire("soreal-idle-renaissance.css").includes("@keyframes rb2Lueurs{from{transform:translateY(0)}to{transform:translateY(-64px)}}"), "rb2Lueurs : 64 px = une tuile");
console.log("idle-animations-compositeur-css-v1: OK");
