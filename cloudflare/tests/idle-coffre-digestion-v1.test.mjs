import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : le Coffre rote et pète au hasard, avec des sons synthétisés ; la magie est équilibrée sur toute la hauteur de la barre, avec de grands sigles qui apparaissent et s'effacent. */
const son = readFileSync("cloudflare/public/modules/audio-coffre-v1.js", "utf8");
const effets = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const dig = readFileSync("cloudflare/public/modules/coffre-digestion-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.equal((son.match(/\{id:'rot-(grave|aigu|double|long|gazeux|pardon)'/g) || []).length, 6, "six rots");
assert.equal((son.match(/\{id:'pet-/g) || []).length, 1, "un seul pet normal (coussin) depuis le choix de Norman du 2026-10-23");
assert.ok(son.includes("jouerDigestion") && effets.includes("coffreRot") && effets.includes("coffrePet"), "sons branchés sur le moteur audio");
assert.ok(dig.includes("MIN=20000,MAX=55000,PAS=500") && dig.includes("document.hidden") && dig.includes("coffreVisible_"), "au hasard, jamais hors de vue");
/* Norman (2026-10-11) : le minuteur ne compte QUE le temps où le Coffre est à l'écran (jamais de bruit « en retard » à l'arrivée sur la page). */
{
  const vm = await import("node:vm");
  let visible = true, cache = false, joues = 0, tic = null;
  const el = { classList: { remove() {}, add() {} }, getBoundingClientRect() { return visible ? { top: 100, bottom: 300, left: 0, right: 200, width: 200, height: 200 } : { top: 2000, bottom: 2200, left: 0, right: 200, width: 200, height: 200 }; }, appendChild() {} };
  const document = { querySelector: () => el, createElement: () => ({ setAttribute() {}, style: {}, classList: { add() {} } }), documentElement: { clientHeight: 800, clientWidth: 1200 }, get hidden() { return cache; } };
  const window = { innerHeight: 800, innerWidth: 1200, __SOREAL_IDLE_AUDIO_V199__: { play() { joues += 1; } } };
  vm.runInNewContext(dig, { window, document, setInterval: (f) => { tic = f; return 1; }, setTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => 0 }), console });
  // 60 s hors de vue : rien, et le minuteur ne se charge pas
  visible = false;
  for (let i = 0; i < 120; i += 1) tic();
  assert.equal(joues, 0, "hors de l'écran : aucun bruit");
  // il revient à l'écran : il faut ATTENDRE le délai (20 s au minimum) avant le premier bruit
  visible = true;
  for (let i = 0; i < 39; i += 1) tic();
  assert.equal(joues, 0, "à l'arrivée, aucun bruit tout de suite (19,5 s de présence seulement)");
  tic(); tic();
  assert.equal(joues, 1, "après son délai passé À L'ÉCRAN, il rote ou pète");
  // onglet caché : pause
  cache = true;
  for (let i = 0; i < 400; i += 1) tic();
  assert.equal(joues, 1, "onglet caché : rien");
}
assert.ok(html.includes("/modules/coffre-digestion-v1.js"), "module chargé");
assert.ok(themes.includes("0 0/90px 36px repeat-x") && !themes.includes("0 0/90px 22px repeat-x"), "étoiles de la magie sur toute la hauteur de la barre");
assert.ok(themes.includes("@keyframes sorealHudSigle{0%{opacity:0;") && /100%\{opacity:0;transform:translate\(8px/.test(themes), "grands sigles : fondu d'entrée et de sortie, un seul sens");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(dig.includes("'Désolé'") && dig.includes("2 doigts de chier sur tes affaires") && dig.includes("Math.random()<.125") && !dig.includes("data-sans-traduction") && dig.includes("bg-fumee-v1"), "pet : nuage de fumée et bulle « Désolé » (traduite en anglais depuis le 2026-10-24)");
assert.ok(css.includes("@keyframes bgFumee") && css.includes(".bg-desole-v1"), "styles de la fumée et de la bulle");
assert.ok(themes.includes(".soreal-idle-magic-panel-v1 .soreal-idle-bulles-v2::before{inset:0;bottom:0;background:url(\"data:image/svg+xml,") && themes.includes("0 0/70px 36px repeat-x;--p:70px"), "magie : deuxième couche d'étoiles sur toute la hauteur");
assert.ok(!themes.includes('url("%3Csvg'), "URL de tuile valide (préfixe data:)");
assert.ok(dig.includes("bg-sueur-v1") && dig.includes("delai") && css.includes("@keyframes bgSueur{0%{opacity:0;") && /@keyframes bgSueur\{[^]*?100%\{opacity:0;/.test(css), "goutte de sueur : fondu d'entrée, glissement, fondu de sortie ; réplique rare après « Désolé »");
assert.ok(themes.includes("86%{opacity:0;") && themes.includes("@keyframes sorealHudSigle"), "grand sigle : apparaît et disparaît presque aussitôt (invisible 86 % du cycle)");
const sang = readFileSync("cloudflare/public/modules/bulles-sang-v1.js", "utf8");
assert.ok(html.includes("/modules/bulles-sang-v1.js") && sang.includes("#sorealIdleHudPvBarV2,.soreal-idle-page-root-v28[data-menu=\"combat\"] .soreal-idle-bossbar-v7"), "bulles de sang dans les barres de vie");
assert.ok(themes.includes("@keyframes sgBulle{0%{opacity:0;") && /@keyframes sgBulle\{[^]*?100%\{opacity:0;/.test(themes), "bulles de sang : fondu d'entrée et de sortie, un seul sens");
assert.ok(css.includes("width:min(640px,100%);max-width:640px"), "borne plus grande sur PC");
console.log("idle-coffre-digestion-v1: OK");
