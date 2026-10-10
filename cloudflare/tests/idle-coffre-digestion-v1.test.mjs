import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : le Coffre rote et pète au hasard, avec des sons synthétisés ; la magie est équilibrée sur toute la hauteur de la barre, avec de grands sigles qui apparaissent et s'effacent. */
const son = readFileSync("cloudflare/public/modules/audio-coffre-v1.js", "utf8");
const effets = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const dig = readFileSync("cloudflare/public/modules/coffre-digestion-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.equal((son.match(/\{id:'rot-(grave|aigu|double|long|gazeux|pardon)'/g) || []).length, 6, "six rots");
assert.equal((son.match(/\{id:'pet-/g) || []).length, 6, "six pets");
assert.ok(son.includes("jouerDigestion") && effets.includes("coffreRot") && effets.includes("coffrePet"), "sons branchés sur le moteur audio");
assert.ok(dig.includes("MIN=25000,MAX=70000") && dig.includes("document.hidden") && dig.includes("coffreVisible_"), "au hasard, jamais hors de vue");
assert.ok(html.includes("/modules/coffre-digestion-v1.js"), "module chargé");
assert.ok(themes.includes("0 0/90px 36px repeat-x") && !themes.includes("0 0/90px 22px repeat-x"), "étoiles de la magie sur toute la hauteur de la barre");
assert.ok(themes.includes("@keyframes sorealHudSigle{0%{opacity:0;") && /100%\{opacity:0;transform:translate\(28px/.test(themes), "grands sigles : fondu d'entrée et de sortie, un seul sens");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(dig.includes("'Désolé'") && dig.includes("2 doigts de chier sur tes affaires") && dig.includes("Math.random()<.125") && dig.includes("data-sans-traduction") && dig.includes("bg-fumee-v1"), "pet : nuage de fumée et bulle « Désolé » (toujours en français)");
assert.ok(css.includes("@keyframes bgFumee") && css.includes(".bg-desole-v1"), "styles de la fumée et de la bulle");
assert.ok(themes.includes(".soreal-idle-magic-panel-v1 .soreal-idle-bulles-v2::before{inset:0;bottom:0;background:url(\"data:image/svg+xml,") && themes.includes("0 0/70px 36px repeat-x;--p:70px"), "magie : deuxième couche d'étoiles sur toute la hauteur");
assert.ok(!themes.includes('url("%3Csvg'), "URL de tuile valide (préfixe data:)");
console.log("idle-coffre-digestion-v1: OK");
