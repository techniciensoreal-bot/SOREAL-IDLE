import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-23 (audit de sécurité, 3 dépôts), item Moyenne #10 : aucune
 * Subresource Integrity sur les scripts CDN (jsdelivr) ni aucune
 * Content-Security-Policy. En cas de compromission de jsdelivr ou du
 * paquet npm source, le script injecté s'exécuterait avec un accès
 * complet au DOM/sessionStorage.
 *
 * Fix scopé volontairement : object-src/base-uri/frame-ancestors (sans
 * risque de régression, n'affectent ni le WASM ni les styles inline)
 * + SRI sur piper_phonemize.js (le seul des deux scripts CDN où le
 * navigateur supporte integrity -- <script type="importmap"> ne le
 * supporte pas encore). Une politique script-src/style-src stricte
 * nécessiterait de tester en direct tout le pipeline audio avant
 * déploiement, volontairement pas ajoutée dans cette passe.
 */

const html = readFileSync("cloudflare/public/index.html", "utf8");
const worker = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");

assert.ok(
  html.includes(
    '<meta http-equiv="Content-Security-Policy" content="object-src \'none\'; base-uri \'self\'">'
  ),
  "Le <meta> CSP doit poser object-src/base-uri (sans risque de régression sur le WASM/les styles inline) -- jamais frame-ancestors, ignoré par les navigateurs via <meta>."
);
assert.ok(
  worker.includes(
    'headers.set(\n        "content-security-policy",\n        "object-src \'none\'; base-uri \'self\'; frame-ancestors \'self\'"\n      );'
  ),
  "frame-ancestors doit être appliqué via un VRAI en-tête HTTP côté Worker (idle-worker-entry-v1.js) -- c'est le seul endroit où les navigateurs le respectent."
);

const piperMatch = html.match(
  /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@diffusionstudio\/piper-wasm@1\.0\.0\/build\/piper_phonemize\.js" integrity="(sha384-[A-Za-z0-9+/]{64}=*)" crossorigin="anonymous"><\/script>/
);
assert.ok(
  piperMatch,
  "piper_phonemize.js doit avoir un attribut integrity (sha384) et crossorigin=\"anonymous\" -- sans ça, integrity est silencieusement ignoré par le navigateur."
);

// --- L'importmap (onnxruntime-web) reste sans integrity, avec l'explication (limitation navigateur réelle, pas un oubli) ---
assert.ok(
  html.includes("Les navigateurs ne supportent PAS encore integrity sur"),
  "L'absence de SRI sur l'importmap doit être expliquée explicitement (limitation de la plateforme web), pas laissée comme un oubli silencieux."
);

console.log("index-html-csp-and-sri: OK");
