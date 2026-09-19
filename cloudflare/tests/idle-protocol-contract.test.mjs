import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  idleOperationNames,
  idleRuntimeTestHooks
} from "../src/idle-sqlite-runtime.js";

const contract=JSON.parse(
  readFileSync(
    new URL("../contracts/idle-protocol.json",import.meta.url),
    "utf8"
  )
);

assert.equal(contract.schemaVersion,1);
assert.equal(contract.service,"soreal-idle");
assert.equal(
  contract.protocolVersion,
  idleRuntimeTestHooks.IDLE_PROTOCOL_VERSION,
  "Le contrat JSON et IDLE_PROTOCOL_VERSION doivent évoluer ensemble."
);

const contractOps=[...contract.operations].sort();
const runtimeOps=idleOperationNames().sort();

assert.equal(
  new Set(contractOps).size,
  contractOps.length,
  "Le contrat IDLE ne doit contenir aucune opération en double."
);
assert.deepEqual(
  contractOps,
  runtimeOps,
  "Le contrat machine-readable doit correspondre exactement à IDLE_OPERATIONS."
);

console.log(
  "SOREAL IDLE protocol contract: OK — v"+
  contract.protocolVersion+", "+contractOps.length+" opérations."
);
