// Norman (2026-10-30) : « j'ai monté la graine niveau 100, j'ai eu un popup comme quoi j'avais complété le set seed, mais je ne retrouve l'information nulle part » :
// les sets d'objets (Graine, Nombre, Aisselle, cœurs…) n'étaient pas dans le catalogue de sets envoyé au client (popup « Set complété : seed », rien dans la Collection).
// Anti-spoil : un set d'objets n'est révélé qu'une fois un de ses objets obtenu ou le set complété.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createIdleAdventureStateV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

{
  const neuf = idleAdventureSnapshotV47(createIdleAdventureStateV47(), 0);
  assert.equal(Object.keys(neuf.setCatalog).filter((k) => neuf.setCatalog[k].source === "objets").length, 0, "aucun set d'objets pour un joueur sans objet");
}
{
  const etat = createIdleAdventureStateV47();
  etat.itemList.giantSeed = { seen: true, maxLevel: 12 };
  const s = idleAdventureSnapshotV47(etat, 0).setCatalog;
  assert.ok(s.seed && s.seed.source === "objets", "la graine vue révèle son set");
  assert.deepEqual(s.seed.items, ["giantSeed"]);
  assert.equal(s.seed.reward.poop, 10, "récompense : 10 Poop");
  assert.ok(String(s.seed.name).length > 0 && s.seed.name !== "seed", "le set a un vrai nom");
  assert.equal(Object.keys(s).length, 1, "un seul set révélé (aucun autre set d'objets)");
}
{
  const etat = createIdleAdventureStateV47();
  etat.completedSets.seed = true;
  const s = idleAdventureSnapshotV47(etat, 0).setCatalog;
  assert.ok(s.seed, "un set complété reste dans le catalogue même si l'objet a été consommé");
}
// client : la Collection liste les sets d'objets (onglet Sets) et les sets complétés (onglet Équipement), avec leur bonus en français
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const chro = lire("cloudflare/public/modules/ui-chroniques-v1.js"), inv = lire("cloudflare/public/modules/ui-inventaire-v1.js"), av = lire("cloudflare/public/modules/ui-aventure-1-v1.js");
assert.ok(chro.includes("setDef.source==='objets'") && chro.includes("htmlSetsObjets") && chro.includes("!sets.length&&!setsObjets.length"), "onglet Sets : les sets d'objets");
assert.ok(chro.includes("rendreCollectionEquipementIdleV1_(itemList,catalog,completedSets,cube,catalogueSetsCollectionIdleV164_(a))") && inv.includes("d.source==='objets'"), "onglet Équipement : sets d'objets complétés");
assert.ok(av.includes("if(idleNombre_(r.poop)>0)parts.push('+'+idleEntier_(r.poop)+' Poop');") && av.includes("['beardSpeedPct','vitesse des Barbes']") && av.includes("['nguSpeedPct','NGU Speed']"), "libellés de bonus des sets d'objets");
console.log("idle-sets-objets-catalogue-v1 : OK");
