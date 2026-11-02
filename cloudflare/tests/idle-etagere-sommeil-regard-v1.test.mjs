// Norman (2026-11-02) : « les armoires chats doivent dormir aussi, mais pas de ronflement » ; « quand on approche la souris autour d'eux, les yeux doivent suivre la souris (pas dans le patch note) »
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("cloudflare/public/modules/etagere-sommeil-regard-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes('/modules/etagere-sommeil-regard-v1.js?v='), "module chargé par la page");

// aucun son : pas de ronflement
assert.ok(!/Audio|AudioContext|\.play\(|ronfl|snor/i.test(src.replace(/pas de ronflement|SANS aucun bruit|ronflement\)/gi, "")), "aucun son, aucun ronflement");
// règle n°4 : état sur <html>, calque des Z gardé par le morph et remis après redessin
assert.ok(src.includes("R.classList.add('et-dort')") && src.includes("R.classList.add('et-suit')"), "état porté par <html>");
assert.ok(src.includes("z.setAttribute('data-morph-garder','')") && src.includes("window.__SOREAL_IDLE_APRES_REDESSIN_V1__"), "calque des Z gardé et remis après redessin");
// règle n°3 : Z en fondu, même sens
assert.ok(src.includes("@keyframes etZ{0%{opacity:0;") && src.includes("100%{opacity:0;"), "Z : fondu d'entrée et de sortie");
// sommeil : paupières fermées (translate 0), iris centrés ; le délai n'avance que le temps où le chat est vu
assert.ok(src.includes("html.et-dort .et-oeil .et-paup.et-sp{animation:none;transform:translate(0,0);") && src.includes("if(!visible(f))return;"), "paupières fermées pendant le sommeil, délai seulement à l'écran");
// regard : le doigt (touch) ne compte pas ; mouvement réduit : pas de suivi
assert.ok(src.includes("ev.pointerType==='touch'") && src.includes("||reduit()"), "souris seulement, pas en mouvement réduit");
// aucune écriture dans les notes de mise à jour
const notes = readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8");
assert.ok(!/s’endort|dort|suivent la souris|yeux suivent/i.test(notes.slice(0, notes.indexOf("version:'4.6'") > 0 ? notes.indexOf("version:'4.6'") : 4000)), "rien dans la note du jour (demande de Norman)");

// comportement : direction du regard
const sb = { window: { requestAnimationFrame() {}, setInterval() {}, innerHeight: 800, matchMedia: () => ({ matches: false }) }, document: { documentElement: { classList: { add() {}, remove() {}, contains: () => false }, style: { setProperty() {} } }, getElementById: () => ({}), createElement: () => ({}), head: { appendChild() {} }, addEventListener() {}, querySelectorAll: () => [], hidden: false } };
sb.window.window = sb.window;
vm.runInNewContext(src, sb);
const S = sb.window.__SOREAL_IDLE_ETAGERE_SOMMEIL_V1__;
const d1 = S.direction({ x: 500, y: 100 }, { x: 100, y: 100 });
assert.ok(d1.x > 0.99 && Math.abs(d1.y) < 1e-9, "pointeur à droite : regard à droite");
const d2 = S.direction({ x: 100, y: -100 }, { x: 100, y: 100 });
assert.ok(d2.y < -0.99 && Math.abs(d2.x) < 1e-9, "pointeur en haut : regard en haut");
const d3 = S.direction({ x: 110, y: 100 }, { x: 100, y: 100 });
assert.ok(d3.x > 0 && d3.x < 0.2, "tout près de l'œil : regard à peine tourné");
const d4 = S.direction({ x: 100, y: 100 }, { x: 100, y: 100 });
assert.ok(d4.x === 0 && d4.y === 0, "sur l'œil : centré");
assert.equal(S.dort(), false);
console.log("idle-etagere-sommeil-regard-v1 : OK");

// Norman (2026-11-02) : « quand les yeux suivent la souris, la pupille doit se déplacer (effet de changement de vue) »
{
  const pup = readFileSync("cloudflare/public/modules/etagere-pupilles-v1.js", "utf8").split(String.fromCharCode(13)).join("");
  assert.ok(pup.includes("html.et-suit .et-pf{translate:calc(var(--et-mx,0)*var(--ptx,45%)) calc(var(--et-my,0)*var(--pty,10%));"), "la pupille glisse dans l'iris vers la souris");
  assert.ok(pup.includes("html.et-suit.et-pup-bat .et-pf{--ptx:34%}") && pup.includes("html.et-suit.et-pup-arrivee .et-pf,html.et-suit.et-pup-zoom .et-pf{--ptx:7%;--pty:4%}"), "amplitude réduite quand la pupille est large (reste dans l'iris)");
  assert.ok(pup.includes(".et-iris.et-ir{clip-path:circle(50% at 50% 50%)}"), "la pupille ne déborde jamais de son iris : le disque d'iris coupe ce qui sort (Norman, 2026-11-02)");
  assert.ok(pup.includes("#000 86%,rgba(0,0,0,0))") && pup.includes("width:44%;height:110%"), "le patch recouvre franchement la pupille dessinée du sprite (aucun reste presque invisible au centre)");
  console.log("idle-etagere-sommeil-regard-v1 (pupille qui suit) : OK");
}
