import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";

/*
 * Norman (2026-09-26) : « j'aimerais créer un APK pour uniquement SOREAL IDLE ». Le site est installable comme application (manifeste + icônes) ; la configuration
 * de la Trusted Web Activity est dans android/twa-manifest.json (jamais de clé de signature dans le dépôt).
 */
const manifest = JSON.parse(readFileSync("cloudflare/public/manifest.webmanifest", "utf8"));
assert.equal(manifest.name, "SOREAL IDLE");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/");
assert.equal(manifest.scope, "/");
for (const icone of manifest.icons) {
  assert.ok(existsSync("cloudflare/public" + icone.src), "icône présente : " + icone.src);
  assert.ok(statSync("cloudflare/public" + icone.src).size > 1000);
}
assert.ok(manifest.icons.some((i) => i.sizes === "512x512" && i.purpose === "any"), "icône 512 « any »");
assert.ok(manifest.icons.some((i) => i.sizes === "192x192"), "icône 192");
assert.ok(manifest.icons.some((i) => i.purpose === "maskable"), "icône « maskable »");

const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes('<link rel="manifest" href="/manifest.webmanifest">'));
assert.ok(index.includes('<meta name="theme-color" content="#0b1b39">'));

const twa = JSON.parse(readFileSync("android/twa-manifest.json", "utf8"));
assert.equal(twa.host, "soreal-idle.technicien-soreal.workers.dev");
assert.equal(twa.packageId, "be.soreal.idle");
assert.equal(twa.fallbackType, "customtabs", "Chrome (pas de WebView) : la connexion Google y est refusée");
assert.ok(twa.iconUrl.endsWith("/icons/icon-512.png") && twa.webManifestUrl.endsWith("/manifest.webmanifest"));
assert.ok(twa.signingKey.path.endsWith(".keystore"));
const ignore = readFileSync("android/.gitignore", "utf8");
assert.ok(ignore.includes("*.keystore") && ignore.includes("*.jks"), "la clé de signature n'entre jamais dans le dépôt");

console.log("idle-pwa-manifest-v1: OK");
