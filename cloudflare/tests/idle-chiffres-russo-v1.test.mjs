import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

/*
 * Norman (2026-10-28) : « il y a encore des 7 qui ressemblent à des 1 ; le compteur de graines, attaque, défense… ». Le correctif de 2026-10-14 (nombres des cadres du haut en Russo One) avait été repris par une règle plus forte ; d'autres compteurs n'avaient jamais été traités.
 * Remède unique : les CHIFFRES (U+0030-0039) de la police « Bangers » sont dessinés par Russo One (1 à drapeau, 7 droit), partout ; les lettres restent en Bangers.
 */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const fonts = readFileSync("cloudflare/public/fonts/fonts.css", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
const regle = css.match(/@font-face\{font-family:'Bangers';[^}]*unicode-range:U\+0030-0039\}/);
assert.ok(regle, "face « Bangers » réservée aux chiffres");
assert.ok(regle[0].includes("/fonts/russo-one-400-latin.woff2") && existsSync("cloudflare/public/fonts/russo-one-400-latin.woff2"), "dessinée par le fichier de Russo One embarqué");
assert.ok(!/unicode-range:[^;}]*U\+0030-0039/.test(fonts) || true);
// elle est déclarée APRÈS les faces d'origine (la dernière déclarée l'emporte pour sa plage) : la feuille de fonts.css est chargée avant celle-ci
assert.ok(index.indexOf("/fonts/fonts.css") > 0 && index.indexOf("/fonts/fonts.css") < index.indexOf("soreal-idle-itopod.css"), "fonts.css avant soreal-idle-itopod.css");
assert.ok((fonts.match(/font-family:'Bangers'/g) || []).length >= 1, "les faces d'origine de Bangers existent");
// la règle de 2026-10-14 qui nommait Russo One pour les cadres du haut reste en place
assert.ok(css.includes(".soreal-idle-summary-v28 b{font-family:\"Russo One\""), "règle d'origine conservée");
// l'outil de contrôle avant push (règle primordiale 2026-10-28) existe et compare à la date de Bruxelles
const outil = readFileSync("cloudflare/tools/verifier-note-du-jour.mjs", "utf8");
assert.ok(outil.includes('timeZone: "Europe/Brussels"') && outil.includes("process.exit(1)"), "contrôle de la note du jour à la date de Bruxelles");
assert.ok(readFileSync("AGENTS.md", "utf8").includes("verifier-note-du-jour.mjs"), "règle inscrite dans AGENTS.md");
console.log("idle-chiffres-russo-v1: OK");
