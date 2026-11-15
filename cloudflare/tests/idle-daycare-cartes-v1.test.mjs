import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { idleDaycareFactorsV1, advanceIdleDaycareV1 } from "../src/idle-daycare-v1.js";
import { daycareFactorsV1 } from "../src/idle-ngu-actions.js";

/*
 * Cartes « Vitesse du Daycare » (Norman, 2026-11-15) : leur multiplicateur compte dans la VRAIE vitesse de la garderie
 * (daycareFactorsV1, utilisé par l'avancement et l'affichage), une seule fois (jamais remultiplié dans idleNguBonuses).
 */
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg} (obtenu ${a}, attendu ${b})`);
const ctx = { bosses: 100 };
const T0 = 1_000_000;

// Fonction pure : le facteur de cartes multiplie la vitesse, sans toucher au facteur de temps.
const sans = idleDaycareFactorsV1({});
const avec = idleDaycareFactorsV1({ cardMultiplier: 1.25 });
near(sans.speedMultiplier, 1, "sans cartes : vitesse 1");
near(avec.speedMultiplier, 1.25, "cartes ×1,25 : vitesse 1,25");
near(avec.timeFactor, sans.timeFactor, "les cartes ne changent pas le facteur de temps");
near(idleDaycareFactorsV1({ cardMultiplier: 0.5 }).speedMultiplier, 1, "jamais en dessous de 1");

// État complet : le moteur lit les cartes, une seule fois.
const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
s.bonuses = Object.assign({}, s.bonuses, { cards: { daycare: 10 } });
near(daycareFactorsV1(s).speedMultiplier, 1.1, "daycareFactorsV1 : cartes +10 % = ×1,10");
near(idleNguBonuses(s).daycareSpeedMultiplier, 1.1, "bonus affichés : ×1,10 (pas ×1,21 : pas de double compte)");

// Avancement réel : une heure de temps réel donne 1,1 h effective.
const data = { slots: [{ item: { id: "a", definitionId: "x", wikiItemId: 0, level: 0 }, levelAtEntry: 0, hours: 0, placedAt: 0 }] };
advanceIdleDaycareV1(data, 3600, daycareFactorsV1(s));
const h = data.slots[0].hours;
assert.ok(h === 0 || Math.abs(h - 1.1) < 1e-9, `heures effectives (obtenu ${h})`);
console.log("idle-daycare-cartes-v1 : OK");
