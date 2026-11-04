import assert from "node:assert/strict";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/* Norman (2026-11-04) : « dans le coffre, pendentifs ascendés : on doit aussi pouvoir mettre le premier s'il est niveau 100 » */
const s = createIdleAdventureStateV47();
const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "ascendedForestPendant", level: 100 }, {});
Object.assign(s, r.state);
const id = r.result.id;
const o = s.inventory.find((x) => x.id === id);
o.power = 0; o.toughness = 0; o.special = 0; if (Array.isArray(o.specialsAll)) o.specialsAll.forEach((x) => { x.value = 0; });
const dep = applyIdleAdventureActionV47(s, { action: "coffreDeposer", id }, {});
assert.ok(dep.state.coffre.ascendedForestPendant, "le premier pendentif ascendé, niveau 100 sans boosts, entre au coffre");
// un autre pendentif ascendé non terminé est toujours refusé
const s2 = createIdleAdventureStateV47();
const r2 = applyIdleAdventureActionV47(s2, { action: "addItem", definitionId: "ascendedAscendedForestPendant", level: 100 }, {});
Object.assign(s2, r2.state);
const o2 = s2.inventory.find((x) => x.id === r2.result.id);
o2.power = 0; o2.toughness = 0; o2.special = 0; if (Array.isArray(o2.specialsAll)) o2.specialsAll.forEach((x) => { x.value = 0; });
assert.throws(() => applyIdleAdventureActionV47(s2, { action: "coffreDeposer", id: r2.result.id }, {}), /OBJET_NON_MAXE/);
// premier pendentif sous le niveau 100 : refusé
const s3 = createIdleAdventureStateV47();
const r3 = applyIdleAdventureActionV47(s3, { action: "addItem", definitionId: "ascendedForestPendant", level: 99 }, {});
Object.assign(s3, r3.state);
assert.throws(() => applyIdleAdventureActionV47(s3, { action: "coffreDeposer", id: r3.result.id }, {}), /OBJET_NON_MAXE/);
console.log("idle-coffre-premier-pendentif-v1: OK");
