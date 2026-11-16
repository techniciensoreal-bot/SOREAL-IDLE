import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Hacks (audit hors ligne 2026-11-16, E10 ; lu dans le jeu, build 1260) : chaque hack a SA Resource 3 (Hack.res3, HacksController::addR3 3189) et updateAllHacks (3194) fait avancer TOUS ceux qui en ont ;
 * hors ligne, Character::addOfflineProgress (2250) boucle de même. `allocation.r3` du système reste le total placé ; la barre d'outils commune envoie un NOUVEAU TOTAL.
 */
const context = { bosses: 200 };
const T0 = 1_000_000;
function neuf() {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, context, T0);
  s.systems.hacks.unlocked = true;
  s.resources.r3.cap = 1e9;
  s.resources.r3.current = 1e9;
  return s;
}
const act = (s, a) => applyIdleNguAction(s, a, context, T0).state;
const tr = (s, id) => s.systems.hacks.data.tracks[id];

/* Deux hacks reçoivent chacun leur Resource 3 : les deux avancent, chacun à SA vitesse. */
{
  let s = neuf();
  s = act(s, { action: "allocateHack", track: "attackDefense", value: 10 });
  s = act(s, { action: "allocateHack", track: "hackHack", value: 40 });
  assert.equal(tr(s, "attackDefense").r3, 10);
  assert.equal(tr(s, "hackHack").r3, 40);
  assert.equal(s.systems.hacks.allocation.r3, 50, "allocation.r3 = total");
  assert.equal(s.resources.r3.current, 1e9 - 50, "la ressource libre baisse du total");
  const apres = advanceIdleNguState(s, 1000, context, T0 + 1000_000);
  const a = tr(apres, "attackDefense"), h = tr(apres, "hackHack");
  assert.ok(a.progress > 0 || a.level > 0, "le hack n°1 avance");
  assert.ok(h.progress > 0 || h.level > 0, "le hack n°2 avance aussi (le jeu fait avancer tous les hacks)");
  /* Même vitesse qu'un hack seul avec la même ressource : l'ancien modèle donnait exactement ceci au hack actif. */
  let seul = neuf();
  seul = act(seul, { action: "allocateHack", track: "attackDefense", value: 10 });
  const sApres = advanceIdleNguState(seul, 1000, context, T0 + 1000_000);
  assert.equal(tr(sApres, "attackDefense").level, a.level);
  assert.ok(Math.abs(tr(sApres, "attackDefense").progress - a.progress) < 1e-12, "un hack n'est pas ralenti par les autres");
  /* Hors ligne (absence longue) : tous avancent aussi. */
  const hors = advanceIdleNguState(s, 3600, context, T0 + 3600_000);
  assert.ok(tr(hors, "attackDefense").level + tr(hors, "attackDefense").progress > 0 && tr(hors, "hackHack").level + tr(hors, "hackHack").progress > 0);
}
/* Barre d'outils commune : la valeur est le NOUVEAU TOTAL ; l'écart va sur le hack actif, une baisse est reprise à l'actif puis aux autres ; 0 = tout retirer. */
{
  let s = neuf();
  s.systems.hacks.data.activeTrack = "attackDefense";
  s = act(s, { action: "allocateHack", track: "hackHack", value: 40 });
  s = act(s, { action: "allocate", system: "hacks", resource: "r3", value: 100 });
  assert.equal(tr(s, "attackDefense").r3, 60, "+60 sur le hack actif");
  assert.equal(tr(s, "hackHack").r3, 40);
  s = act(s, { action: "allocate", system: "hacks", resource: "r3", value: 30 });
  assert.equal(tr(s, "attackDefense").r3, 0, "la baisse vide d'abord le hack actif");
  assert.equal(tr(s, "hackHack").r3, 30, "puis reprend aux autres");
  assert.equal(s.systems.hacks.allocation.r3, 30);
  s = act(s, { action: "allocate", system: "hacks", resource: "r3", value: 0 });
  assert.equal(s.systems.hacks.allocation.r3, 0);
  assert.equal(tr(s, "hackHack").r3, 0);
  assert.equal(s.resources.r3.current, 1e9, "tout est rendu");
  assert.throws(() => act(s, { action: "allocateHack", track: "n-existe-pas", value: 1 }), /PISTE_INCONNUE/);
}
/* Ancienne sauvegarde (allocation unique) : tout va au hack actif, rien n'est perdu ni compté deux fois. */
{
  const s = neuf();
  s.systems.hacks.data.activeTrack = "hackHack";
  s.systems.hacks.allocation.r3 = 77;
  for (const t of Object.values(s.systems.hacks.data.tracks)) delete t.r3;
  const n = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), context, T0);
  assert.equal(tr(n, "hackHack").r3, 77);
  assert.equal(n.systems.hacks.allocation.r3, 77);
  const deux = normalizeIdleNguState(JSON.parse(JSON.stringify(n)), context, T0);
  assert.equal(JSON.stringify(deux.systems.hacks), JSON.stringify(n.systems.hacks), "idempotent");
}
/* Le Rebirth rend la Resource 3 de chaque hack. */
{
  let s = neuf();
  s = act(s, { action: "allocateHack", track: "attackDefense", value: 10 });
  s = act(s, { action: "allocateHack", track: "hackHack", value: 40 });
  const r = rebirthIdleNguState(s, context, T0 + 10_000_000);
  const e = r.state || r;
  assert.equal(e.systems.hacks.allocation.r3, 0);
  for (const t of Object.values(e.systems.hacks.data.tracks)) assert.equal(t.r3, 0);
}
/* Interface : chaque piste montre ce qui est placé dessus (hacks seulement). */
{
  const src = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(src.includes("s.id==='hacks'&&Number(st.r3)>0"));
}
console.log("idle-hacks-r3-par-hack-v1 : OK");
