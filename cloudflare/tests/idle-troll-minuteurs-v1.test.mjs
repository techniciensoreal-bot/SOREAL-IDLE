// Norman (2026-11-02) : « il doit y avoir un timer qui nous dit quand est-ce que le prochain petit troll va arriver, et pareil pour le gros troll ».
// Les temps affichés sont calculés avec la même règle que le moteur (rythme par complétion, un gros troll tous les 5) et confrontés au vrai moteur.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { IDLE_TROLL_INTERVALS_S_V1 } from "../src/idle-ngu-systemes.js";

const norm = (t) => t.split(String.fromCharCode(13)).join("");
const code = norm(readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8"));
const sandbox = { window: {}, document: { getElementById() { return null; }, head: { appendChild() {} } }, requestAnimationFrame() {} };
sandbox.window.window = sandbox.window;
vm.runInNewContext(code, sandbox);
const D = sandbox.window.__SOREAL_IDLE_DEFIS_V1__;
const { prochainsTrolls, minutesSecondes } = D;

// le même rythme que le moteur
const src = norm(readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8"));
assert.ok(src.includes("var INTERVALLES_TROLL=[120,110,100,90,85,80,75];"), "rythme du wiki");
assert.deepEqual([...IDLE_TROLL_INTERVALS_S_V1], [120, 110, 100, 90, 85, 80, 75]);

// formats
assert.equal(minutesSecondes(125), "2:05");
assert.equal(minutesSecondes(0), "0:00");
assert.equal(minutesSecondes(59.2), "1:00", "arrondi à la seconde supérieure : jamais « 0:00 » alors qu'il reste du temps");
assert.equal(minutesSecondes(600), "10:00");

// premier niveau : un troll à 2:00, le gros (5e) à 10:00
let p = prochainsTrolls({ timer: 0, count: 0 }, 0, 0);
assert.equal(p.prochain, 120); assert.equal(p.prochainEstGros, false); assert.equal(p.gros, 600);
// 3 trolls subis, 100 s écoulées : le 4e dans 20 s, le gros (5e) dans 20 + 120 s
p = prochainsTrolls({ timer: 100, count: 3 }, 0, 0);
assert.equal(p.prochain, 20); assert.equal(p.gros, 140); assert.equal(p.prochainEstGros, false);
// 4 trolls subis : le prochain EST le gros
p = prochainsTrolls({ timer: 30, count: 4 }, 0, 0);
assert.equal(p.prochainEstGros, true); assert.equal(p.prochain, 90); assert.equal(p.gros, 90);
// juste après un gros troll : le suivant gros est le 10e
p = prochainsTrolls({ timer: 0, count: 5 }, 0, 0);
assert.equal(p.gros, 120 + 4 * 120);
// le décompte avance entre deux synchros
p = prochainsTrolls({ timer: 10, count: 0 }, 0, 5);
assert.equal(p.prochain, 105);
// jamais négatif
assert.equal(prochainsTrolls({ timer: 500, count: 0 }, 0, 0).prochain, 0);
// niveau 7 (6 complétions faites) : un troll toutes les 75 s, gros troll à 6:15
p = prochainsTrolls({ timer: 0, count: 0 }, 6, 0);
assert.equal(p.prochain, 75); assert.equal(p.gros, 375);
assert.equal(minutesSecondes(p.gros), "6:15");
// complétions au-delà de 7 : on garde le dernier rythme
assert.equal(prochainsTrolls({ timer: 0, count: 0 }, 9, 0).prochain, 75);

// confrontation avec le vrai moteur : le temps annoncé est celui où le troll tombe vraiment, à chaque niveau
const T0 = 1_000_000_000_000;
const CONTEXTE = { bosses: 68 };
function depart(termines) {
  const s = normalizeIdleNguState({}, CONTEXTE, T0);
  s.systems.challenges.unlocked = true; s.records.highestBoss = 68;
  for (const t of ["t2", "t3", "t4"]) s.adventure.titans[t] = Object.assign({}, s.adventure.titans[t], { kills: 1 });
  s.adventure.itemList = s.adventure.itemList || {};
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) s.adventure.itemList["grb:" + slot] = { seen: true };
  s.challenge.bestMs = { basic: 1000 }; s.challenge.active = "troll"; s.challenge.startedAt = T0;
  s.challenge.completions = Object.assign({}, s.challenge.completions, { troll: termines });
  s.runStartedAt = T0;
  return s;
}
for (const termines of [0, 3, 6]) {
  let s = depart(termines), t = T0;
  const seconde = () => { t += 1000; s = advanceIdleNguState(s, 1, CONTEXTE, t); };
  for (let i = 0; i < 37; i++) seconde();
  const attendu = prochainsTrolls(s.challenge.troll, termines, 0);
  let n = 0; const avant = s.challenge.troll.count;
  while (s.challenge.troll.count === avant && n < 400) { seconde(); n += 1; }
  assert.equal(n, attendu.prochain, `niveau ${termines + 1} : le prochain troll tombe bien dans ${attendu.prochain} s (annoncé) = ${n} s (moteur)`);
  // jusqu'au gros troll
  let u = depart(termines), tt = T0;
  const sec2 = () => { tt += 1000; u = advanceIdleNguState(u, 1, CONTEXTE, tt); };
  const annonce = prochainsTrolls(u.challenge.troll, termines, 0).gros;
  let k = 0;
  while (!(u.challenge.troll.last && u.challenge.troll.last.big) && k < 2000) { sec2(); k += 1; }
  assert.equal(k, annonce, `niveau ${termines + 1} : le gros troll tombe à ${annonce} s (annoncé) = ${k} s (moteur)`);
}

// câblage : une pastille visible partout pendant le défi (pas seulement dans le menu Défis) + le cadre « Trolls » de la page Défis
assert.ok(src.includes("w.id='sorealTrollTimerV1'") && src.includes("w.setAttribute('data-morph-garder','1')"), "pastille posée sur la page, laissée en place par le redessin (règle n°4)");
assert.ok(src.includes("if(typeof window.setInterval==='function')window.setInterval(majMinuteursTroll,1000);"), "mise à jour chaque seconde");
assert.ok(src.includes("Prochain troll dans : <b data-troll-prochain") && src.includes("Prochain gros troll dans : <b data-troll-gros"), "cadre « Trolls » de la page Défis");
assert.ok(src.includes("#sorealTrollTimerV1{position:fixed;") && src.includes("pointer-events:none"), "la pastille ne bloque aucun clic");
assert.ok(src.includes("if(l1[i].textContent!==a)l1[i].textContent=a;"), "texte comparé avant écriture (aucune écriture inutile)");
const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
for (const k of ["Prochain troll", "Prochain gros troll", "Prochain troll dans :", "Prochain gros troll dans :"]) assert.ok(dico[k], "traduit en anglais : " + k);

console.log("idle-troll-minuteurs-v1 : OK");
