import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-10) : agrandir les écritures trop petites, UNIQUEMENT sur ordinateur. */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const i = css.indexOf("Audit des écritures sur PC");
assert.ok(i > 0, "bloc présent");
const bloc = css.slice(i);
const debut = bloc.indexOf("@media (min-width:701px){");
assert.ok(debut > 0, "le bloc est entièrement sous la requête « ordinateur »");
const corps = bloc.slice(debut);
assert.ok(!corps.includes("@media (max-width"), "aucune règle téléphone dans ce bloc");
const tailles = [...corps.matchAll(/font-size:([\d.]+)px!important/g)].map((m) => Number(m[1]));
assert.ok(tailles.length >= 14, "règles présentes : " + tailles.length);
assert.ok(Math.min(...tailles) >= 12, "plus aucun texte sous 12 px sur ordinateur (minimum : " + Math.min(...tailles) + ")");
// Les accolades du bloc sont équilibrées : il ne déborde pas sur les règles suivantes.
assert.equal([...corps].filter((c) => c === "{").length, [...corps].filter((c) => c === "}").length);
console.log("idle-ecritures-pc-v1: OK");
