import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Audit 2026-11-14 (faille critique) : un lien « ?relais=<code> » piégé déposait SANS CLIC le jeton de session de la victime sous un code connu de l'attaquant (relu ensuite par GET /api/v1/relais). Le dépôt (et l'envoi du jeton à l'exe) exige maintenant une confirmation, avec les 4 derniers caractères du code, affichés aussi dans l'application. */
const pont = readFileSync(new URL("../public/standalone-bridge.js", import.meta.url), "utf8");
const apk = readFileSync(new URL("../public/modules/apk-connexion-v1.js", import.meta.url), "utf8");
const m = pont.match(/async function modeRelaisV1\(code\)\{([\s\S]*?)\n  \}\n  async function transmettreRelaisV1/);
assert.ok(m, "modeRelaisV1 trouvé");
assert.ok(!m[1].includes('fetch("/api/v1/relais"'), "modeRelaisV1 ne dépose jamais le jeton lui-même");
assert.ok(m[1].includes("confirmerEnvoiJetonV1(") && m[1].includes("code.slice(-4).toUpperCase()") && m[1].includes("transmettreRelaisV1(code,jeton)"), "dépôt seulement après confirmation, code court affiché");
const t = pont.match(/async function transmettreRelaisV1\(code,jeton\)\{([\s\S]*?)\n  \}\n  \/\* Confirmation/);
assert.ok(t && t[1].includes('fetch("/api/v1/relais"'), "le dépôt est dans la fonction appelée par le bouton");
const l = pont.match(/async function modeLiaisonV1\(l\)\{([\s\S]*?)\n  \}/);
assert.ok(l && /confirmerEnvoiJetonV1\([\s\S]*location\.replace\("http:\/\/127\.0\.0\.1:"/.test(l[1]) && l[1].indexOf("confirmerEnvoiJetonV1(") < l[1].indexOf("location.replace("), "liaison de l'exe : redirection avec le jeton seulement après confirmation");
assert.ok(apk.includes("function codeCourt(code){return String(code||'').slice(-4).toUpperCase();}") && apk.includes("codeCourt(codeEnCours)") && apk.includes("codeCourt(codeReco)"), "l'application affiche le code court (connexion et reconnexion)");
console.log("idle-relais-confirmation-v1 : OK");
