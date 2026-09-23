import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const index=readFileSync("cloudflare/public/index.html","utf8");
const bridge=readFileSync("cloudflare/public/standalone-bridge.js","utf8");
const ui=readFileSync("cloudflare/public/soreal-idle-ui.js","utf8");
const runtime=readFileSync("cloudflare/public/modules/runtime.js","utf8");

/*
 * Audit 2026-09-23 (second passage) : runtime.js lisait encore la clé
 * localStorage 'soreal_session_v6b' -- résidu de l'ancienne intégration
 * APP/TV, jamais écrite nulle part dans ce dépôt (IDLE tourne sur sa
 * propre origine, aucun localStorage partagé avec APP/TV). Même règle
 * que pour standalone-bridge.js ci-dessous.
 */
assert.doesNotMatch(runtime,/soreal_session_v6b/);

assert.match(index,/id="app"/);
assert.match(index,/standalone-bridge\.js/);
assert.match(index,/soreal-idle-ui\.css/);
assert.match(index,/soreal-idle-ui\.js/);
assert.ok(index.indexOf("soreal-idle-ui.css")<index.indexOf("standalone-bridge.js"));
assert.ok(index.indexOf("standalone-bridge.js")<index.indexOf("modules/ui.js"));
assert.ok(index.indexOf("modules/ui.js")<index.indexOf("soreal-idle-ui.js"));
assert.match(index,/var SOREAL_SESSION=""/);
assert.match(index,/function header\(\)\{return "";/);

assert.match(bridge,/location\.hash/);
assert.match(bridge,/new URLSearchParams\(raw\)\.get\("ticket"\)/);
assert.match(bridge,/\/api\/v1\/session/);
assert.match(bridge,/\/api\/v1\/call/);
assert.match(bridge,/authorization:"Bearer "\+session/);
assert.match(bridge,/sessionStorage\.getItem\(SESSION_KEY\)/);
assert.doesNotMatch(bridge,/soreal_session_v6b/);
assert.doesNotMatch(bridge,/postMessage\(/);
assert.doesNotMatch(bridge,/soreal-app\.technicien-soreal/);

assert.match(ui,/IDLE_CLIENT_PROTOCOL_VERSION=1/);
assert.match(ui,/window\.__ouvrirSorealIdleModuleV1__/);
assert.match(ui,/\/api\/idle\/media\/player/);
assert.match(ui,/\/api\/idle\/media\/mob/);
assert.match(ui,/\/api\/idle\/media\/boss/);
assert.match(ui,/\/api\/idle\/media\/item/);
new vm.Script(ui,{filename:"soreal-idle-ui.js"});
new vm.Script(bridge,{filename:"standalone-bridge.js"});

console.log("idle standalone ui: ok");
