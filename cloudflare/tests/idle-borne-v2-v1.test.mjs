import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : la borne d'arcade dessinée (Combat de boss), allumée une fois par Renaissance avec un son calé sur l'animation ; boutons lumineux quand disponibles, éteints dans leur couleur sinon. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const borne = readFileSync("cloudflare/public/modules/audio-borne-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");

// Structure : fronton, écran (le duel du jeu), pupitre aux trois vrais boutons, trappe à pièces ; plus d'émojis ni de dômes décoratifs.
const page = ui.slice(ui.indexOf("function pageCombatIdleV28_(j){"), ui.indexOf("function skillBasicTrainingIdleV120_("));
for (const t of ["borne-v2 ${borne.classe}", "${BORNE_FRONTON_IDLE_V2}", "${BORNE_PUPITRE_IDLE_V2}", "${BORNE_BAS_IDLE_V2}", 'id="sorealIdleBossStartV100"', "window.__fuirBossIdleV1__()", "window.__nukerBossIdleV1__()"]) assert.ok(page.includes(t), t);
assert.ok(!/soreal-idle-dome-v1/.test(page) && !/⚔️ Fight|🏃 Fuite|🚀 NUKE/.test(page), "plus de dômes ni d'émojis dans les boutons");
// Les identifiants des dessins sont propres à la borne (aucune collision avec d'autres SVG de la page).
const ids = [...ui.matchAll(/id=\\"(bn[A-Za-z]+)\\"/g)].map((m) => m[1]);
assert.ok(ids.length >= 10 && ids.every((i) => /^bn/.test(i)), "ids SVG préfixés bn");
// Baguette bleue à gauche, rouge à droite, rose au milieu.
assert.ok(ui.includes('stop-color=\\"#2f7bff\\"') && ui.includes('stop-color=\\"#ff4fb0\\"') && ui.includes('stop-color=\\"#ff2a3d\\"'), "bleu, rose, rouge");
// Allumage : une seule fois par Renaissance (logique extraite et rejouée).
const deb = ui.indexOf("let borneAllumageDebutIdleV2=0;"), fin = ui.indexOf("function pageCombatIdleV28_(j){");
const mem = {}; const jouees = [];
const fabrique = new Function("localStorage", "jouerEffetAudioIdleV199_", "idleEntier_", ui.slice(deb, fin) + "\nreturn etatBorneIdleV2_;");
const etat = fabrique({ getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } }, (n) => jouees.push(n), (v) => Math.floor(Number(v)) || 0);
const joueur = (n) => ({ systemes: { records: { totalRebirths: n } } });
let e = etat(joueur(0));
assert.equal(e.classe, "allumage", "premier affichage : la borne s'allume");
assert.deepEqual(jouees, ["borneAllume"], "avec son son");
e = etat(joueur(0));
assert.equal(e.classe, "allumage", "un redessin pendant l'allumage continue la même animation");
assert.ok(e.t >= 0 && e.t < 1);
assert.equal(jouees.length, 1, "le son n'est joué qu'une fois");
// Plus tard (animation finie) : allumée, sans rejouer ; nouvelle Renaissance : elle se rallume.
const base = Date.now; Date.now = () => base() + 5000;
assert.equal(etat(joueur(0)).classe, "allume", "même Renaissance : plus d'allumage");
assert.equal(jouees.length, 1);
assert.equal(etat(joueur(1)).classe, "allumage", "nouvelle Renaissance : elle se rallume");
assert.equal(jouees.length, 2);
Date.now = base;
// CSS : boutons lumineux / éteints dans leur couleur, allumage calé, mouvement réduit.
const b2 = css.slice(css.indexOf("Borne v2 (Norman"));
assert.ok(b2.includes("soreal-idle-boss-control-v39:disabled{filter:brightness(.4) saturate(.9)") && b2.includes(".soreal-idle-boss-control-v39:not(:disabled){animation:bnBtnLuit"), "boutons : lumineux si disponibles, éteints sinon");
assert.ok(b2.includes("--tt") && b2.includes("prefers-reduced-motion:reduce"), "allumage reprenable et coupé en mouvement réduit");
for (const k of ["bnLuitB", "bnLuitR", "bnPulse", "bnScint", "bnBtnLuit"]) assert.ok(new RegExp("@keyframes " + k + "\{0%,100%\{").test(b2), k + " : boucle sans à-coup");
// Son : branché sur le moteur audio, chronologie calée (mêmes dates que l'animation).
assert.ok(audio.includes('borneAllume:{group:"borne"') && audio.includes("__SOREAL_IDLE_AUDIO_BORNE_V1__"), "son dans le moteur audio");
assert.ok(html.includes("/modules/audio-borne-v1.js"), "module chargé");
for (const cue of ["t+.28", "[.45,.57,.72,.84,.98,1.10]", "[.64,.95,1.26]", "t+1.15", "t+1.44", "t+1.84", "[[1.90,700],[2.05,900],[2.20,1150]]"]) assert.ok(borne.includes(cue), "repère sonore " + cue);
for (const dly of ["calc(.3s - var(--tt", "calc(.42s - var(--tt", "calc(.5s - var(--tt", "calc(1.15s - var(--tt", "calc(1.9s - var(--tt", "calc(2.05s - var(--tt", "calc(2.2s - var(--tt"]) assert.ok(b2.includes(dly), "délai CSS " + dly);
console.log("idle-borne-v2-v1: OK");
