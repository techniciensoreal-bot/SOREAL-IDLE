import fs from "node:fs";
const p = "cloudflare/tests/idle-borne-animations-desactivees-v1.test.mjs"; let s = fs.readFileSync(p, "utf8");
function r(a, b) { if (!s.includes(a)) throw new Error(a.slice(0, 70)); s = s.split(a).join(b); }
r("\{mascot:1,sweep:0,redroom:0,egout:0,rire:0\}", "\{mascot:0,sweep:0,redroom:0,egout:0,rire:0,yeuxcb:1\}");
r("'egout'\]\.filter", "'egout','yeuxcb'\]\.filter");
fs.writeFileSync(p, s);
