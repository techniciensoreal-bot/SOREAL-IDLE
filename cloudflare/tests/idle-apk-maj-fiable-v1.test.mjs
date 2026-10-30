// Norman (2026-10-30) : la mise à jour publiée n'arrivait jamais sur son APK hors ligne, sans qu'il sache pourquoi. Gardes de contenu (on ne peut pas exécuter Android ici) :
// dialogues à chaque lancement, téléchargement forcé en réseau mobile, retour arrière signalé, numéro de version dans les Réglages, nettoyage des médias retirés.
import fs from "node:fs";
import assert from "node:assert/strict";

const lire = (f) => fs.readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const maj = lire("../../android/hors-ligne/app/src/main/java/be/soreal/idle/Maj.java");
const act = lire("../../android/hors-ligne/app/src/main/java/be/soreal/idle/MainActivity.java");
const reglages = lire("../public/modules/ui-reglages-v1.js");
const dico = JSON.parse(lire("../public/modules/traduction-anglais-dict-v1.json"));

// ---------- 1. dialogues
assert.match(maj, /interface Ecouteur \{ void pretePourRelance\(String notes\); void bloqueMobile\(long octets, String notes\); \}/, "l'écouteur connaît le blocage mobile");
// La limite mobile ne fait plus `return` en silence : elle prévient l'écouteur, et le joueur peut la contourner.
assert.match(maj, /if \(!ignorerLimite && octets > LIMITE_DONNEES_MOBILES && donneesMobiles\(\)\) \{[^}]*ecouteur\.bloqueMobile\(octets/, "blocage mobile signalé");
assert.ok(!/LIMITE_DONNEES_MOBILES && donneesMobiles\(\)\) \{ derniereVerification = 0; return; \}/.test(maj), "plus de return silencieux");
assert.match(maj, /void telechargerForce\(final Ecouteur ecouteur\) \{ verifierEnLigne\(ecouteur, true, true\); \}/, "téléchargement forcé");
// Code déjà prêt mais pas appliqué : re-proposé.
assert.match(maj, /pret != null && !shaCode\.isEmpty\(\) && shaCode\.equals\(pret\.optString\("sha256", ""\)\)[^;]*ecouteur\.pretePourRelance/, "code prêt re-proposé");
assert.match(act, /"Télécharger maintenant \(réseau mobile\)"/);
assert.match(act, /"Plus tard"/);
assert.match(act, /"Relancer"/);
assert.match(act, /m\.telechargerForce\(ecouteurMaj\(\)\)/, "le bouton force le téléchargement");
assert.match(act, /new Thread\(new Runnable\(\) \{ @Override public void run\(\) \{\s*try \{ m\.telechargerForce/, "hors du fil d'interface");
assert.match(act, /bloqueMobile\(final long octets, final String notes\)[\s\S]*proposerTelechargementMobile\(octets, notes\)/);
assert.match(act, /Math\.round\(octets \/ 1048576\.0\) \+ " Mo"/, "la taille est dite");
assert.match(act, /m\.verifierEnLigne\(ecouteurMaj\(\), false\)/, "vérification au lancement et au retour (délai de 30 min dans Maj)");
assert.match(maj, /maintenant - derniereVerification < 30L \* 60000L/, "délai de 30 minutes conservé");
assert.match(act, /verifierMiseAJour\(8000\)/);
assert.match(act, /verifierMiseAJour\(3000\)/);
// Réseau absent : verifier() lève une exception avalée, aucun dialogue.
assert.match(maj, /catch \(Exception e\) \{ \/\* hors ligne ou serveur indisponible/);

// ---------- 2. retour arrière
assert.match(maj, /e\.put\("retourArriere", true\);/);
assert.match(maj, /e\.put\("retourArriereDate"/);
assert.match(maj, /e\.put\("retourArriereSha", e\.optString\("courantSha", ""\)\);/);
assert.match(maj, /refuse\.put\(e\.optString\("courantSha", ""\)\);/, "l'empreinte reste refusée (une nouvelle empreinte, jamais)");
assert.match(maj, /synchronized String retourArriere\(\)[\s\S]*e\.put\("retourArriere", false\)/, "dialogue unique : l'indicateur est consommé");
assert.match(maj, /synchronized void reessayer\(String sha\)[\s\S]*refuse\.optString\(i\)\.equals\(sha\)/, "Réessayer retire l'empreinte de refuse");
assert.match(act, /La dernière mise à jour n'a pas pu démarrer : l'ancienne version a été remise\./);
assert.match(act, /"Réessayer"/);
assert.match(act, /"Fermer"/);
assert.match(act, /m\.reessayer\(sha\);\s*verifierMiseAJour\(500\);/);
assert.match(act, /signalerRetourArriere\(\);\s*\}/);
assert.match(maj, /!contient\(e, "refuse", shaCode\)/, "une version refusée n'est pas retéléchargée, une nouvelle empreinte oui");

// ---------- 3. numéro de version
assert.match(act, /@JavascriptInterface public String versionCode\(\)/);
assert.match(maj, /synchronized String versionCode\(\)/);
assert.match(maj, /"embarqué"/);
assert.match(maj, /o\.put\("enAttente", e\.optBoolean\("enAttente", false\)\)/);
assert.match(maj, /e\.put\("courantVersion", p\.optString\("manifeste", ""\)\)/, "version du manifeste stockée à l'activation");
assert.match(maj, /e\.put\("courantDate", p\.optString\("date", ""\)\)/);
assert.match(maj, /p\.put\("manifeste", m\.optString\("version", ""\)\)/);
assert.match(reglages, /window\.AndroidSoreal&&window\.AndroidSoreal\.versionCode/, "affiché seulement dans l'APK");
assert.match(reglages, /htmlCodeApkIdleV1_\(\)\+\s*htmlNotesMajIdleV1_\(\)/);
const apres = reglages.slice(reglages.indexOf("function htmlCodeApkIdleV1_"), reglages.indexOf("function htmlVersionNotesMajIdleV1_"));
assert.ok(!/localStorage|sessionStorage/.test(apres), "règle n°6 : rien de stocké côté page");
assert.ok(!/wiki/i.test(apres + maj + act.slice(act.indexOf("signalerRetourArriere"))), "jamais le mot wiki");
for (const k of ["Code de l’application", "embarqué", "à l’essai"]) assert.ok(typeof dico[k] === "string" && dico[k], "dictionnaire anglais : " + k);

// ---------- 4. nettoyage des médias obsolètes
assert.match(maj, /private boolean nettoyerMedias\(JSONArray medias, JSONObject etags, JSONObject index\)/);
assert.match(maj, /if \(medias == null \|\| medias\.length\(\) == 0\) return false;/, "un manifeste sans médias ne supprime rien");
assert.match(maj, /purgerDossier\(new File\(racine, "medias"\), "", publiees\)/, "seulement files/maj/medias");
assert.match(maj, /!publiees\.contains\(cle\)\) \{ if \(x\.delete\(\)\)/);
assert.match(maj, /o\.remove\(k\)/, "retirés de medias-etags.json et medias-index.json");
assert.match(maj, /if \(nettoyerMedias\(medias, etags, index\)\) \{\s*ecrireJson\(new File\(racine, "medias-etags\.json"\), etags\);\s*ecrireJson\(new File\(racine, "medias-index\.json"\), index\);/);
assert.ok(!/getAssets\(\)\.[a-z]*[Dd]elete/.test(maj), "les assets de l'APK ne sont jamais touchés");

console.log("idle-apk-maj-fiable-v1 : OK");
