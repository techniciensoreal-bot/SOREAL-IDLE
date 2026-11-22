import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { PAGES_META } from "./_meta-pages.mjs";
import { preparerNgu, monterNgu } from "./_ngu-vdom.mjs";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { nguEffectPctV1 } from "../src/idle-ngu-catalog-v1.js";
import { hackFxV1, beardBonusMultiplier, convertActiveBeardOnRebirth } from "../src/idle-ngu-bonus.js";
import { beardPartsBonusV1 } from "../src/idle-ngu-pistes.js";
import { IDLE_NGU_TRACKS } from "../src/idle-ngu-catalogues.js";

/*
 * Info-bulles du jeu (IL build 1260, 2026-11-22) :
 *  - NGU (NGUController::displayTooltip) : effet par niveau, rendements décroissants (soft cap), Normal / Evil / SADISTIC / Total Bonus (seulement les paliers atteints) ;
 *  - Hacks (HacksController::showTooltip) : effet actuel et suivant, jalons atteints, niveaux avant le prochain jalon, bonus de jalon, durée ;
 *  - Barbes (BeardController::updateText / showTooltip) : active / inactive, bonus temporaire et permanent, durée, gain au Rebirth (de A à B), « Actives : x / y ».
 */
const ctx = { bosses: 300, basicTrainingComplete: true };

// ---------- NGU ----------
{
  const evil = normalizeIdleNguState({ difficulty: "difficile" }, ctx, 0);
  evil.systems.ngu.unlocked = true;
  evil.systems.ngu.data.ngus.normal.wandoos.level = 500;
  evil.systems.ngu.data.ngus.evil.wandoos.level = 200;
  evil.systems.ngu.data.ngus.normal.respawn.level = 100;
  evil.systems.ngu.data.ngus.evil.respawn.level = 100;
  const snap = idleNguSnapshot(evil, ctx, 1000);
  const w = snap.ngus.tiers.evil.find((n) => n.id === "wandoos");
  assert.equal(w.parNiveau, 0.1, "effet par niveau du palier affiché");
  assert.equal(w.softCap, 1000, "rendements décroissants après le niveau 1000");
  const rn = 1 + nguEffectPctV1("normal", "wandoos", 500) / 100, re = 1 + nguEffectPctV1("evil", "wandoos", 200) / 100;
  assert.deepEqual(w.bonusPaliers.map((b) => b[0]), ["normal", "evil"], "seulement les paliers atteints (jamais SADISTIC en Evil)");
  assert.ok(Math.abs(w.bonusPaliers[0][1] - rn * 100) < 1e-3 && Math.abs(w.bonusPaliers[1][1] - re * 100) < 1e-3);
  assert.ok(Math.abs(w.bonusTotal - rn * re * 100) < 1e-2, "total = produit des paliers");
  const r = snap.ngus.tiers.evil.find((n) => n.id === "respawn");
  assert.equal(r.softCap, 10000, "respawn Evil : 10000");
  assert.ok(Math.abs(r.bonusPaliers[0][1] - (1 - nguEffectPctV1("normal", "respawn", 100) / 100) * 100) < 1e-3, "respawn : le ratio est le temps restant");
  const normal = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  normal.systems.ngu.unlocked = true;
  const sn = idleNguSnapshot(normal, ctx, 1000);
  const wn = sn.ngus.tiers.normal.find((n) => n.id === "wandoos");
  assert.equal(wn.bonusPaliers, undefined, "difficulté Normal : pas de détail par palier (le jeu n'en écrit pas)");
  assert.equal(wn.bonusTotal, undefined);
  assert.equal(wn.parNiveau, 0.1);
  assert.equal(sn.ngus.tiers.evil, undefined, "aucun palier inactif dans la réponse");
}

// ---------- Hacks ----------
{
  const s = normalizeIdleNguState({ difficulty: "difficile" }, ctx, 0);
  s.systems.hacks.unlocked = true;
  s.systems.hacks.data.tracks.attackDefense.level = 25;
  s.systems.hacks.data.tracks.attackDefense.r3 = 1000;
  s.systems.hacks.allocation.r3 = 1000;
  s.resources.r3.cap = 1e5; s.resources.r3.current = 1e5; s.resources.r3.power = 1;
  s.systems.hacks.data.tracks.adventureStats.level = 120;
  s.systems.perks.unlocked = true;
  s.systems.perks.data.levels[113] = 3;   // Adventure Hack Milestone Reducer I : moins de niveaux par jalon
  const snap = idleNguSnapshot(s, ctx, 1000);
  const hacks = snap.systems.find((x) => x.id === "hacks");
  const ad = hacks.tracks.find((t) => t.id === "attackDefense").info;
  const av = hacks.tracks.find((t) => t.id === "adventureStats").info;
  const fx = hackFxV1(s);
  assert.ok(Math.abs(ad.effetActuel - fx.attackDefense * 100) < 1e-4, "effet actuel = celui du moteur (hackFxV1) : " + ad.effetActuel);
  assert.ok(Math.abs(av.effetActuel - fx.adventureStats * 100) < 1e-4, "idem avec le réducteur de jalon");
  const s2 = JSON.parse(JSON.stringify(s));
  s2.systems.hacks.data.tracks.attackDefense.level = 26;
  assert.ok(Math.abs(ad.effetSuivant - hackFxV1(s2).attackDefense * 100) < 1e-4, "niveau suivant = effet du moteur au niveau +1");
  assert.equal(ad.jalons, 2, "25 niveaux, 10 par jalon : 2 jalons");
  assert.equal(ad.niveauxAvantJalon, 5, "prochain jalon dans 5 niveaux");
  assert.equal(ad.bonusJalon, 102.5, "bonus de jalon : 102,5 %");
  assert.ok(ad.secondsPerLevel > 0, "durée du niveau suivant (ressource 3 placée)");
  const sansR3 = hacks.tracks.find((t) => t.id === "adventureStats").info;
  assert.equal(sansR3.secondsPerLevel, null, "aucune ressource placée : pas de durée");
  const n = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  n.systems.hacks.unlocked = true;
  n.systems.hacks.data.tracks.attackDefense.level = 25;
  const hn = idleNguSnapshot(n, ctx, 1000).systems.find((x) => x.id === "hacks").tracks.find((t) => t.id === "attackDefense").info;
  assert.equal(hn.effetActuel, 100, "Normal : les hacks n'ont aucun effet (x1)");
}

// ---------- Barbes ----------
{
  const s = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  s.systems.beards.unlocked = true;
  s.systems.beards.active = true;
  s.systems.beards.data.activeTracks = ["attack"];
  s.systems.beards.data.activeTrack = "attack";
  // formules : (1 + temporaire) x (1 + permanent) identique à beardBonusMultiplier pour chaque rôle, sous et sur le soft cap
  for (const [temp, perm] of [[40, 7], [2500, 1800], [0, 900]]) {
    for (const def of IDLE_NGU_TRACKS.beards.filter((d) => !d.unlockTroll)) {
      const t = JSON.parse(JSON.stringify(s));
      t.systems.beards.data.activeTracks = [def.id];
      t.systems.beards.data.tracks[def.id].tempLevel = temp;
      t.systems.beards.data.tracks[def.id].permanentLevel = perm;
      const [tb, pb] = beardPartsBonusV1(def.beardRole, temp, perm);
      assert.ok(Math.abs(Math.max(1, (1 + tb) * (1 + pb)) - beardBonusMultiplier(t, def.beardRole)) < 1e-12, def.beardRole + " " + temp + "/" + perm);
    }
  }
  s.systems.beards.data.tracks.attack.tempLevel = 400;
  s.systems.beards.data.tracks.attack.permanentLevel = 50;
  s.systems.beards.data.tracks.drop.tempLevel = 100;
  s.runStartedAt = 0;
  const runSeconds = 6 * 3600;
  const snap = idleNguSnapshot(s, ctx, runSeconds * 1000);
  const beards = snap.systems.find((x) => x.id === "beards");
  assert.deepEqual(beards.barbesActives, { actives: 1, emplacements: 1 }, "Actives : 1 / 1");
  const a = beards.tracks.find((t) => t.id === "attack").info, d = beards.tracks.find((t) => t.id === "drop").info;
  assert.equal(a.actif, true);
  assert.equal(d.actif, false);
  assert.ok(Math.abs(a.bonusTemp - 400 * 0.05 * 100) < 1e-6, "temporaire : niveau x 5 %");
  assert.ok(Math.abs(a.bonusPerm - 50 * 0.01 * 100) < 1e-6, "permanent : niveau x 1 %");
  const copie = JSON.parse(JSON.stringify(s));
  const conv = convertActiveBeardOnRebirth(copie, runSeconds);
  assert.equal(a.gagneAuRebirth, conv.gained, "le gain annoncé est celui que le Rebirth applique (addedTrimmings)");
  assert.ok(a.gagneAuRebirth > 0);
  assert.ok(a.permApres > a.permAvant, "de A à B");
  assert.ok(Math.abs(a.permApres - (50 + conv.gained) * 0.01 * 100) < 1e-6);
  assert.equal(beards.tracks.find((t) => t.id === "gold").info, undefined, "une barbe encore verrouillée n'a aucune info (règle n°2)");
  assert.equal(beards.tracks.find((t) => t.id === "gold").unlocked, false);
}

// ---------- interface ----------
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
preparerNgu(window);
vm.runInNewContext(readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8"), { window, document: window.document, setInterval: () => 1, clearInterval() {}, performance: { now: () => 5000 } });
{
  const bac = { window, document: window.document, SOREAL_SESSION: null };
  vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8"), bac);
  for (const f of PAGES_META) vm.runInNewContext(readFileSync("cloudflare/public/modules/" + f, "utf8"), bac);
}
const page = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_;

{
  // NGU : bloc « Détails » (Evil : paliers + total)
  const evil = normalizeIdleNguState({ difficulty: "difficile" }, ctx, 0);
  evil.systems.ngu.unlocked = true;
  evil.systems.ngu.data.tier = "evil";
  evil.systems.ngu.data.ngus.normal.wandoos.level = 500;
  evil.systems.ngu.data.ngus.evil.wandoos.level = 200;
  monterNgu(window, { systemes: idleNguSnapshot(evil, ctx, 1000) });
  const texte = window.document.querySelector('[data-vdom="ngu"]').textContent;
  for (const t of ["Détails", "Effet par niveau : 0", "Rendements décroissants après le niveau 1", "Bonus Normal : ", "Bonus Maléfique : ×", "Bonus total : "]) assert.ok(texte.includes(t), "NGU : " + t);
  assert.ok(!texte.includes("SADIQUE"), "jamais un palier inactif");
}
{
  // Hacks et Barbes : lignes de détail dans les boutons de pistes
  const s = normalizeIdleNguState({ difficulty: "difficile" }, ctx, 0);
  s.systems.hacks.unlocked = true;
  s.systems.hacks.data.tracks.attackDefense.level = 25;
  s.systems.beards.unlocked = true;
  s.systems.beards.active = true;
  s.systems.beards.data.activeTracks = ["attack"];
  s.systems.beards.data.tracks.attack.tempLevel = 400;
  const snap = idleNguSnapshot(s, ctx, 6 * 3600 * 1000);
  const hh = page({ systemes: snap }, "hacks", "Hacks");
  for (const t of ["Effet actuel : ", "Niveau suivant : ", "Jalons atteints : 2", "Prochain jalon dans 5 niveau(x)", "Bonus de jalon : 102"]) assert.ok(hh.includes(t), "Hacks : " + t);
  const hb = page({ systemes: snap }, "beards", "Beards");
  for (const t of ["ACTIVE", "Bonus temporaire : 2K", "Bonus permanent : ", "Si elle est active au Rebirth, cette barbe gagnera ", "Actives : 1 / 1"]) assert.ok(hb.includes(t), "Barbes : " + t);
  assert.ok(!/Fu Manchu[^]*INACTIVE[^]*ACTIVE/.test("") && hb.includes("INACTIVE"), "les barbes inactives le disent");
}
console.log("idle-hacks-barbes-ngu-infobulles-v1: OK");
