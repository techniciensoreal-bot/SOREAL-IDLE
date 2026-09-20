import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bridge=readFileSync(
  new URL("../public/standalone-bridge.js",import.meta.url),
  "utf8"
);
const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.match(bridge,/function escapeHtmlV1\(/);
assert.match(bridge,/window\.escapeHtml=escapeHtmlV1/);
assert.match(bridge,/function escapeAttrV1\(/);
assert.match(bridge,/window\.escapeAttr=escapeAttrV1/);

assert.match(ui,/function idleHtml_\(v\)\{\s*return escapeHtml\(/);
assert.ok(
  bridge.indexOf("window.escapeHtml=escapeHtmlV1")>=0,
  "Le shell autonome doit fournir escapeHtml avant l'ouverture de l'UI."
);

console.log("standalone shell dependencies: ok");
