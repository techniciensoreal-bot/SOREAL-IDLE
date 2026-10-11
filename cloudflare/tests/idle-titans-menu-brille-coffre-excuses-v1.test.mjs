import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/* Norman (2026-10-11) : (1) le mot « Titans » du menu brille quand un Titan est prêt ; (2) le Coffre dit « Désolé » (ou une variante) APRÈS le pet. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.ok(ui.includes("function htmlNomMenuIdleV1_(m,j)") && ui.includes("soreal-idle-nav-titans-brille-v1") && ui.includes("api.disponible(j)") && ui.includes("<b>${htmlNomMenuIdleV1_(m,j)}"), "mot Titans du menu, même condition que le bouton de la page Aventure");
assert.ok(/@keyframes soreal-idle-nav-titans-brille-v1\{0%,100%\{filter:[^}]*\}50%\{filter:/.test(css) && css.includes("prefers-reduced-motion:reduce){.soreal-idle-nav-titans-brille-v1"), "brillance en boucle sans à-coup, coupée en mouvement réduit");

const dig = readFileSync("cloudflare/public/modules/coffre-digestion-v1.js", "utf8");
for (const t of ["'Désolé'", "'Oups'", "'Vous avez entendu ?'", "'Il y a de l’orage on dirait'"]) assert.ok(dig.includes(t), "variante " + t);
assert.ok(dig.includes("DELAI_EXCUSE=1100") && dig.includes("bulle_(el,excuse,false,DELAI_EXCUSE)"), "l'excuse sort après le pet");
// comportement : la bulle est créée avec un retard, la fumée tout de suite
const crees = [];
const el = { classList: { remove() {}, add() {} }, getBoundingClientRect() { return { top: 0, bottom: 200, left: 0, right: 200, width: 200, height: 200 }; }, appendChild(n) { crees.push(n); } };
const document = { querySelector: () => el, createElement: () => { const n = { style: {}, setAttribute() {}, className: "", textContent: "", innerHTML: "" }; return n; }, documentElement: { clientHeight: 800, clientWidth: 1200 }, hidden: false };
const window = { innerHeight: 800, innerWidth: 1200, __SOREAL_IDLE_AUDIO_V199__: { play() {} } };
vm.runInNewContext(dig, { window, document, setInterval() {}, setTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => 0.3 }), console });
window.__SOREAL_IDLE_COFFRE_DIGESTION_V1__.jouer("pet");
const bulle = crees.find((n) => /bg-desole-v1/.test(n.className));
const fumee = crees.find((n) => /bg-fumee-v1/.test(n.className));
assert.ok(bulle && fumee, "fumée et bulle créées");
assert.equal(bulle.style.animationDelay, "1100ms", "la bulle attend la fin du bruit");
assert.ok(["Désolé", "Oups", "Vous avez entendu ?", "Il y a de l’orage on dirait"].includes(bulle.textContent), "texte tiré parmi les variantes : " + bulle.textContent);
assert.ok(!fumee.style.animationDelay, "la fumée part tout de suite");
console.log("idle-titans-menu-brille-coffre-excuses-v1: OK");
