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
    'headers.set(\n        "content-security-policy",\n        "object-src \'none\'; base-uri \'self\'; frame-ancestors \'self\' https://soreal-tv.technicien-soreal.workers.dev https://soreal-app.technicien-soreal.workers.dev"\n      );'
  ),
  "frame-ancestors doit être appliqué via un VRAI en-tête HTTP côté Worker (idle-worker-entry-v1.js) -- c'est le seul endroit où les navigateurs le respectent -- et doit lister les origines TV/APP qui embarquent réellement ce frontend en iframe, pas seulement 'self'."
);

// --- Plus de script externe (CDN) dans la page : la voix de secours (synthèse locale) a été supprimée le 2026-11-07, donc plus rien à protéger par integrity ---
assert.ok(!/<script[^>]*src="https:\/\/cdn\.jsdelivr/.test(html), "aucun script CDN dans la page");

console.log("index-html-csp-and-sri: OK");
