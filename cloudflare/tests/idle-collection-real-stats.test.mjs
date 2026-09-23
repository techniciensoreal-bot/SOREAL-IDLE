import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_ADVENTURE_MOB_BESTIARY_V1 } from "../src/idle-adventure-v47.js";
import { nguBossStatsV1 } from "../src/idle-ngu-boss-reference-v1.js";

/*
 * 2026-09-23 : la Collection affichait PV = toughness de zone et attaque = power recommandé de zone pour tous les mobs, et
 * les colonnes brutes du catalogue historique pour les boss. Elle lit maintenant le bestiaire wiki (Power, Toughness, HP
 * regen, Max HP, cadence, type) et la définition réelle des boss (Attaque, Défense, PV, EXP).
 */
const src = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(src.includes("definitionBossSorealIdle_(index, 'normal')"), "boss : définition réelle");
assert.ok(src.includes("fichePropre.maxHp") && src.includes("fichePropre.power"), "mobs : stats du bestiaire wiki");
assert.ok(!src.includes("estBoss ? zone.t * 3 : zone.t"), "plus de PV inventés à partir de la toughness de zone");
const v47 = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.ok(v47.includes("if(monsterIndex>=0){\n  const store=boss?s.zone.bossEncountersByIndex"), "rencontres comptées dès qu'un ennemi du bestiaire est tiré");
const premier = IDLE_ADVENTURE_MOB_BESTIARY_V1.tutorial.normal[0];
assert.equal(premier.name, "A Small Piece of Fluff");
assert.equal(premier.maxHp, 40);
assert.equal(nguBossStatsV1(0, "normal").attaque, 50000);
console.log("idle-collection-real-stats ok");
