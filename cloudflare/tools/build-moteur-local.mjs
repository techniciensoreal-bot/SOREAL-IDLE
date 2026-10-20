/* Construit le moteur du jeu local : cloudflare/local/moteur-local-worker.js (+ src/ + sql.js) → cloudflare/public/moteur-local-worker-v1.js et sql-wasm-v1.wasm.
   Depuis la racine : cd cloudflare/local && npm install && cd ../.. && node cloudflare/tools/build-moteur-local.mjs
   Les deux fichiers produits sont versionnés (le déploiement ne reconstruit rien). Relancer après tout changement de cloudflare/src. */
import { createRequire } from "node:module";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const ici = fileURLToPath(new URL("../local/", import.meta.url));
const pub = fileURLToPath(new URL("../public/", import.meta.url));
const require = createRequire(ici + "package.json");
const esbuild = require("esbuild");
await esbuild.build({
  entryPoints: [ici + "moteur-local-worker.js"],
  outfile: pub + "moteur-local-worker-v1.js",
  bundle: true, format: "iife", platform: "browser", target: "es2022", minify: process.env.SANS_MINIFIER !== "1", legalComments: "none",
  external: ["fs", "path", "crypto", "node:*"],
  logLevel: "warning"
});
fs.copyFileSync(ici + "node_modules/sql.js/dist/sql-wasm-browser.wasm", pub + "sql-wasm-v1.wasm");
/* Le cache est immuable : l'adresse du Worker et du wasm porte l'empreinte de leur contenu, écrite dans modules/moteur-local-v1.js. */
const crypto = await import("node:crypto");
const h = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 10);
const mod = pub + "modules/moteur-local-v1.js";
let src = fs.readFileSync(mod, "utf8");
src = src.replace(/moteur-local-worker-v1\.js\?v=[a-z0-9]+/, "moteur-local-worker-v1.js?v=" + h(pub + "moteur-local-worker-v1.js")).replace(/sql-wasm-v1\.wasm\?v=[a-z0-9]+/, "sql-wasm-v1.wasm?v=" + h(pub + "sql-wasm-v1.wasm"));
fs.writeFileSync(mod, src);
console.log("moteur local construit :", (fs.statSync(pub + "moteur-local-worker-v1.js").size / 1024).toFixed(0), "Ko ;", (fs.statSync(pub + "sql-wasm-v1.wasm").size / 1024).toFixed(0), "Ko de wasm");
