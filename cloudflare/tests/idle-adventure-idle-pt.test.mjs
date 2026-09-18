import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_TITANS,
  idleAdventureSnapshotV47,
  createIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

/*
 * Idle P/T (2026-09-18, Norman en chat : demande directe -- "Idle P/T" est
 * un troisième nombre publié par le wiki à côté de Manual P/T (z.p/z.t) et
 * One Hit P (z.oneHitP), jamais construit chez SOREAL avant ce correctif).
 * Sourcé de https://ngu-idle.fandom.com/wiki/Adventure_Mode, colonne
 * "Idle P/T" du tableau de zones et de chaque ligne Titan (vérifié en
 * direct au navigateur 2026-09-18) -- voir le commentaire détaillé
 * au-dessus de IDLE_ADVENTURE_ZONES / IDLE_ADVENTURE_TITANS dans
 * idle-adventure-v47.js pour le détail de chaque valeur et des quelques
 * zones où le champ est délibérément omis (ambiguïté réelle entre
 * plusieurs pages wiki, jamais un nombre inventé).
 */

function zone(id) {
  return IDLE_ADVENTURE_ZONES.find((z) => z.id === id);
}
function titan(id) {
  return IDLE_ADVENTURE_TITANS.find((t) => t.id === id);
}

// --- Safe Zone n'a aucun combat : ni oneHitP ni idleP/idleT ---
{
  const safe = zone("safe");
  assert.equal(safe.oneHitP, undefined);
  assert.equal(safe.idleP, undefined);
  assert.equal(safe.idleT, undefined);
}

// --- Zones Normal : spot-check sur quelques valeurs directement lues sur le wiki ---
{
  assert.deepEqual([zone("tutorial").idleP, zone("tutorial").idleT], [13, 13]);
  assert.deepEqual([zone("sewers").idleP, zone("sewers").idleT], [21, 21]);
  assert.deepEqual([zone("sky").idleP, zone("sky").idleT], [750, 650], "Sky est asymétrique Power/Toughness, comme son Manual P/T.");
  assert.deepEqual([zone("mega").idleP, zone("mega").idleT], [265000, 145000]);
  assert.deepEqual(
    [zone("chocolate").idleP, zone("chocolate").idleT],
    [150000000000, 90000000000],
    "Chocolate World publie Idle P/T pour 'Beast Mode OFF' ET 'Beast Mode ON' -- SOREAL ne modélise pas Beast Mode (jamais construit, cf. commentaire fad{} dans SETS), donc seule la valeur OFF (l'état par défaut) est reprise."
  );
}

// --- Zones Evil/Sadistic : spot-check ---
{
  assert.deepEqual([zone("evilverse").idleP, zone("evilverse").idleT], [2.4e13, 1.6e13]);
  assert.deepEqual([zone("aethereansea").idleP, zone("aethereansea").idleT], [4.76e34, 3.4e34]);
}

// --- Beardverse : Idle Power confirmé (2 sources concordantes), Idle Toughness omis (désaccord réel entre la table agrégée et la page dédiée The Beardverse) ---
{
  const b = zone("beardverse");
  assert.equal(b.idleP, 2500000);
  assert.equal(b.idleT, undefined, "Idle Toughness Beardverse est ambigu entre deux pages wiki (2M vs 1.7M) -- jamais tranché arbitrairement.");
}

// --- Typo Zonw : Idle Power omis (écart >25% entre affichage et repli scientifique), Idle Toughness confirmé ---
{
  const t = zone("typozone");
  assert.equal(t.idleP, undefined, "Idle Power Typo Zonw est ambigu (370 Qi affiché vs 2.7E20 en parenthèse, >25% d'écart) -- jamais tranché arbitrairement.");
  assert.equal(t.idleT, 2.4e20);
}

// --- Construction Zone : idleP ET idleT omis (3 valeurs différentes sur 3 sources wiki) ---
{
  const c = zone("construction");
  assert.equal(c.idleP, undefined, "Construction Zone a 3 valeurs différentes pour Idle Power sur 3 sources wiki -- omis entièrement, jamais un choix arbitraire.");
  assert.equal(c.idleT, undefined);
}

// --- Toutes les zones avec p/t>0 (donc combattables) ont soit idleP+idleT ensemble, soit un champ isolé documenté comme ambigu (typozone), soit aucun des deux (construction) -- jamais idleP/idleT à moitié invente ---
{
  const combatZones = IDLE_ADVENTURE_ZONES.filter((z) => z.id !== "safe");
  for (const z of combatZones) {
    if (z.idleP !== undefined) assert.equal(typeof z.idleP, "number", `${z.id}.idleP doit être un nombre si présent.`);
    if (z.idleT !== undefined) assert.equal(typeof z.idleT, "number", `${z.id}.idleT doit être un nombre si présent.`);
  }
}

// --- Titans : t1-t4 (paliers plats), sourcés du wiki ---
{
  assert.deepEqual([titan("t1").idleP, titan("t1").idleT], [2300, 2100]);
  assert.deepEqual([titan("t2").idleP, titan("t2").idleT], [6000, 5000]);
  assert.deepEqual([titan("t3").idleP, titan("t3").idleT], [22000, 14000]);
  assert.deepEqual([titan("t4").idleP, titan("t4").idleT], [600000, 400000]);
}

// --- t5 (Walderp) : le wiki dit explicitement "cannot be idled due to his ability" -- aucun idleP/idleT, ni sur le titan ni sur ses formes ---
{
  const t5 = titan("t5");
  assert.equal(t5.idleP, undefined);
  assert.equal(t5.idleT, undefined);
  assert.ok(Array.isArray(t5.forms) && t5.forms.length > 0);
  for (const form of t5.forms) {
    assert.equal(form.idleP, undefined, "Aucune forme de Walderp ne doit avoir d'Idle P/T inventé.");
    assert.equal(form.idleT, undefined);
  }
}

// --- t6 (The Beast) : Idle P/T publié PAR PALIER (Easy/Normal/Hard/Brutal), x10 à x10 comme Manual ---
{
  const t6 = titan("t6");
  assert.deepEqual(
    t6.difficulties,
    {
      easy: { p: 700000000, t: 500000000, idleP: 1e9, idleT: 7e8 },
      normal: { p: 7000000000, t: 5000000000, idleP: 1e10, idleT: 7e9 },
      hard: { p: 70000000000, t: 50000000000, idleP: 1e11, idleT: 7e10 },
      brutal: { p: 700000000000, t: 500000000000, idleP: 1e12, idleT: 7e11 }
    }
  );
}

// --- t7 (The Exile, "Ninth Titan" du wiki) : aucune ligne Idle publiée, seulement Manual/AutoKill par palier ---
{
  const t7 = titan("t7");
  assert.equal(t7.idleP, undefined);
  assert.equal(t7.idleT, undefined);
  for (const key of Object.keys(t7.difficulties || {})) {
    assert.equal(t7.difficulties[key].idleP, undefined, `t7.difficulties.${key} ne doit pas avoir d'Idle P/T inventé.`);
    assert.equal(t7.difficulties[key].idleT, undefined);
  }
}

// --- Exposition au client : le snapshot Aventure (seule source lue par SOREAL-APP) expose idleP/idleT sans transformation, comme tout autre champ de zone/titan (spread {...z}/{...t}, idle-adventure-v47.js) ---
{
  const s = createIdleAdventureStateV47();
  const snap = idleAdventureSnapshotV47(s, 132, "extreme", { difficile: 132, extreme: 132 });

  const tutoSnap = snap.zones.find((z) => z.id === "tutorial");
  assert.deepEqual([tutoSnap.idleP, tutoSnap.idleT], [13, 13], "Le snapshot Aventure doit exposer idleP/idleT telles quelles côté client.");

  const t6Snap = snap.titans.find((t) => t.id === "t6");
  assert.equal(t6Snap.difficulties.normal.idleP, 1e10, "Le snapshot Titan doit exposer les idleP/idleT par palier.");

  const constructionSnap = snap.zones.find((z) => z.id === "construction");
  assert.equal(constructionSnap.idleP, undefined, "Une zone sans Idle P/T confirmé ne doit jamais en recevoir un via le snapshot.");
}

console.log("idle-adventure-idle-pt: OK");
