// APK hors ligne : le bouton Retour FERME l'application (Norman, 2026-10-30 : « l'ancien se fermait ») après avoir laissé la page enregistrer la partie.
import assert from "node:assert/strict";
import fs from "node:fs";
const java = fs.readFileSync(new URL("../../android/hors-ligne/app/src/main/java/be/soreal/idle/MainActivity.java", import.meta.url), "utf8");
assert.ok(!java.includes("moveTaskToBack"), "Retour ne met plus l'application en arrière-plan");
assert.ok(java.includes("void onBackPressed()") && java.includes("finishAndRemoveTask()"), "Retour ferme l'application");
assert.ok(java.includes("dispatchEvent(new Event('pagehide'))") && java.includes("if (fermeture) return;"), "la page enregistre la partie avant la fermeture, et un second appui ne relance rien");
console.log("idle-apk-retour-ferme-v1 : OK");
