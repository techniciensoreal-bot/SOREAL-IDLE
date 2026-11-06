import assert from "node:assert/strict";
import fs from "node:fs";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "./_partie-reference.mjs";

/*
 * Norman (2026-11-06) : « les pièces sont max dans le coffre et filtrées (🚫) pour ne plus les looter ; je les loote quand même toutes les heures quand je tue auto GRB » (Titan 1, auto kill en ligne).
 * Cause : l'auto-kill des Titans EN LIGNE tire le butin dans le sac (rollTitanLootV1) sans passer par le filtre de butin, contrairement au combat manuel et au farm hors ligne. Test de bout en bout sur la partie de référence :
 * toutes les pièces GRB filtrées, auto-kill du Titan 1, des heures de jeu en synchros courtes (en ligne) : aucune pièce GRB ne doit entrer dans le sac ; sans filtre, elles tombent (le test est sensible).
 */
const GRB = ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"].map((d) => "grb:" + d);
function jouer(filtrer) {
  const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-2.json", "utf8"));
  const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
  figerLeHasard(); reglerHorloge(Date.parse(ligne[15]) + 60_000);
  const st = JSON.parse(ligne[37]);
  st.metaNgu.selloutShop = st.metaNgu.selloutShop || {}; st.metaNgu.selloutShop.purchases = Object.assign(st.metaNgu.selloutShop.purchases || {}, { improvedLootFilter: 1 });
  const ia = st.metaNgu.adventure.inventoryAuto || (st.metaNgu.adventure.inventoryAuto = {});
  /* le filtre est posé AVANT la première synchro (qui tue déjà le Titan) */
  ia.lootFilters = {}; ia.lootFilter = { types: {}, items: {} }; ia.lootItems = filtrer ? Object.fromEntries(GRB.map((d) => [d, true])) : {};
  st.metaNgu.adventure.inventory = (st.metaNgu.adventure.inventory || []).filter((o) => !GRB.includes(o.definitionId));
  st.metaNgu.adventure.titans = st.metaNgu.adventure.titans || {};
  st.metaNgu.adventure.titans.t1 = Object.assign({ kills: 5, nextAt: 0 }, st.metaNgu.adventure.titans.t1, { autoKill: true, nextAt: 0 });
  ligne[37] = JSON.stringify(st);
  const m = creerMoteur(ligne);
  const sync = () => m.run("synchroniserSorealIdle");
  const killsT1 = () => JSON.parse(m.ligne()[37]).metaNgu.adventure.titans.t1.kills;
  const kills0 = killsT1();
  sync();
  const adv = (r) => r.joueur.systemes.adventure;
  let tombes = 0, dernier = null;
  for (let i = 0; i < 400; i += 1) {   /* 400 synchros de 4 min = ~27 h de jeu en ligne (synchros < 5 min) */
    avancer(240_000);
    dernier = sync();
    tombes = (adv(dernier).inventory || []).filter((o) => GRB.includes(o.definitionId)).length;
    if (!filtrer && tombes > 0) break;
  }
  const kills = killsT1() - kills0;
  return { tombes, kills };
}
const sans = jouer(false);
assert.ok(sans.kills >= 1, "le Titan 1 est bien tué en automatique (" + sans.kills + " kills)");
assert.ok(sans.tombes > 0, "SANS filtre, une pièce GRB tombe dans le sac (le test est sensible) : " + JSON.stringify(sans));
const avec = jouer(true);
assert.ok(avec.kills >= 3, "avec filtre : le Titan est tué aussi (" + avec.kills + ")");
assert.equal(avec.tombes, 0, "AVEC le filtre sur les 7 pièces GRB, aucune ne doit entrer dans le sac (l'auto-kill laissait passer le butin)");
console.log("idle-titan-autokill-filtre-butin-v1: OK (" + avec.kills + " kills filtrés, sans filtre : " + sans.tombes + " pièce(s) tombée(s) en " + sans.kills + " kills)");
