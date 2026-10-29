// Norman (2026-10-29) : « l'intro n'a pas les textes traduits en anglais pendant l'intro » : la mise en relief *…* découpait la phrase en morceaux inconnus du dictionnaire ; en anglais la phrase entière est traduite d'abord.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const src = fs.readFileSync("cloudflare/public/modules/intro-diaporama-v1.js", "utf8");
const dict = JSON.parse(fs.readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
const phrases = [...src.matchAll(/\{n:'(\d\d)',t:'((?:[^'\\]|\\.)*)'\}/g)].map((m) => m[2].replace(/\\'/g, "'"));
assert.equal(phrases.length, 16);
for (const p of phrases) assert.ok(dict[p], "phrase de l'intro au dictionnaire : " + p.slice(0, 40));
assert.ok(phrases.some((p) => /\*[^*]+\*/.test(p) && p.replace(/\*[^*]+\*/g, "").trim().length > 10), "il existe une phrase coupée par une mise en relief (image 14)");

/* le module sur un faux navigateur : texteHtml traduit la phrase entière avant de la découper */
const elems = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {} }, querySelector: () => null });
const document = { getElementById: () => null, createElement: elems, head: { appendChild() {} }, documentElement: elems(), body: elems(), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] };
let anglais = true;
const traduire = (s) => (dict[s] ?? s);
const fenetre = { __SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__: { actif: () => anglais, traduire }, matchMedia: () => ({ matches: false }), addEventListener() {}, setTimeout: () => 0 };
vm.runInNewContext(src, { window: fenetre, document, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {}, Date, Math, String, Array, Object, console, localStorage: { getItem: () => null } });
const api = fenetre.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__;
const p14 = phrases.find((p) => p.startsWith("Non, tu as l’impression"));
const h14 = api.texteHtml(p14);
assert.ok(h14.startsWith("No, you get the feeling that <em>") && h14.includes("</em> has sucked out") && !/quelque|aspiré/.test(h14), "image 14 entièrement en anglais, mise en relief conservée : " + h14);
assert.equal(api.texteHtml("*BLOUM*"), "<em>BLOOM</em>", "« BLOUM » traduit aussi");
anglais = false;
assert.equal(api.texteHtml(p14), "Non, tu as l’impression que <em>quelque chose</em> a aspiré la majorité de ta force.", "en français rien ne change");
console.log("idle-intro-anglais-phrase-entiere-v1 : OK");
