import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-31) : « L'application est en plein écran. Je veux la barre de l'heure en haut et les boutons de navigation toujours apparents, comme sur l'ancien APK. » */
const lire = (f) => readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const manifeste = lire("../../android/hors-ligne/app/src/main/AndroidManifest.xml");
assert.ok(manifeste.includes('android:theme="@android:style/Theme.Black.NoTitleBar">') && !manifeste.includes("Fullscreen"), "thème sans plein écran");
const java = lire("../../android/hors-ligne/app/src/main/java/be/soreal/idle/MainActivity.java");
const i = java.indexOf("private void immersif()");
const corps = java.slice(i, java.indexOf("}", java.indexOf("}", i) ) + 1);
assert.ok(i > 0 && corps.includes("clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)") && corps.includes("SYSTEM_UI_FLAG_LAYOUT_STABLE"), "barres visibles");
assert.ok(!/SYSTEM_UI_FLAG_(HIDE_NAVIGATION|FULLSCREEN|IMMERSIVE|LAYOUT_FULLSCREEN|LAYOUT_HIDE_NAVIGATION)/.test(corps), "plus aucun drapeau de plein écran");
console.log("idle-apk-barres-systeme-v1: OK");
