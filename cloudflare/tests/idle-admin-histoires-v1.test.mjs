import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { IDLE_HISTOIRE_ID_RE_V1 } from "../src/idle-histoires-v1.js";

/*
 * Menu Admin (Norman, 2026-09-30) : éditeur d'histoires visible UNIQUEMENT par l'administrateur, boss choisi « numéroté avec le nom »,
 * images en nombre illimité, texte collé par étape, voix générées sur le PC de l'administrateur (studio local).
 */
const source = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- Le menu n'apparaît que pour l'administrateur (et jamais annoncé comme « nouveau menu ») ---
assert.match(ui, /\{id:'admin',icon:'🛠️',nom:'Admin'\}/);
assert.match(ui, /if\(id==='admin'\)return estAdminSorealIdle_\(\);/, "menu Admin : administrateur seulement");
assert.match(ui, /m\.id!=='admin'&&menuDisponibleIdleV28_\(m\.id,j\)/, "jamais annoncé comme menu débloqué");
assert.match(ui, /case 'admin':\s*return window\.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__\?window\.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__\.page\(j\):'';/);
assert.ok(ui.includes("IDLE_MENUS_SANS_CLIGNOTEMENT_V1=['entrainement','combat','parametres','sellout','shop','admin']"), "pas de clignotement ni de popup d'information");

// --- Rendu réel de la page avec un faux jeu ---
const appels = [];
const histoires = [
  { id: "MagicienEtLaGrotte", titre: "Le Magicien et la Grotte", boss: 17, actif: true, voix: [], etapes: [{ texte: "Un.", image: "legacy:1" }, { texte: "Deux.", image: "legacy:2" }] },
  { id: "MagicienEtLeGrotte2", titre: "Le Magicien et la Grotte 2", boss: null, actif: true, voix: [], etapes: [{ texte: "Trois.", image: "legacy:1" }] }
];
const document_ = { head: { appendChild() {} }, body: { appendChild() {} }, getElementById: () => null, createElement: () => ({ style: {} }), addEventListener() {} };
const window_ = {
  document: document_,
  __SOREAL_IDLE_CALL_V1__: (nom, args) => { appels.push([nom, args]); return Promise.resolve({ ok: true, histoires, boss: [{ numero: 17, nom: "Le Grand Test" }, { numero: 18, nom: "Autre" }] }); },
  __SOREAL_IDLE_TUTORIAL_TTS_V209__: {
    planNarration: (t) => [{ chunk: t }],
    hashBloc: (t) => (t === "Un." ? "00000000000001" : "00000000000002")
  }
};
vm.runInNewContext(source, { window: window_, document: document_, setTimeout, fetch: () => Promise.reject(new Error("hors ligne")) });
const api = window_.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__;
assert.ok(api && typeof api.page === "function");

{
  const premiere = api.page({});
  assert.match(premiere, /sorealIdleAdminListeV1/);
  assert.match(premiere, /Chargement des histoires/);
  await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(appels.map((a) => a[0]), ["listerHistoiresAdminSorealIdle"], "chargement unique via l'opération réservée à l'administrateur");
  const liste = api.page({});
  assert.match(liste, /Le Magicien et la Grotte<\/h4>|Le Magicien et la Grotte/);
  assert.match(liste, /Mort du boss 17 — Le Grand Test/, "boss « numéroté avec le nom »");
  assert.match(liste, /Aucun boss \(jamais déclenchée\)/, "la 2e histoire attend qu'on lui choisisse un boss");
  assert.match(liste, /data-adm-act="modifier"/);
  assert.match(liste, /data-adm-act="jouer"/);
  assert.match(liste, /data-adm-act="supprimer"/);
  assert.match(liste, /Nouvelle histoire/);
  assert.match(liste, /voix studio 0\/2/, "voix réalistes non générées : 0 sur 2 blocs");
}

// --- Utilitaires ---
assert.equal(api.urlImage("essai", "abc.webp"), "/api/idle/media/story-image?id=essai&f=abc.webp");
assert.equal(api.urlImage("MagicienEtLaGrotte", "legacy:3"), "/api/idle/media/story?id=MagicienEtLaGrotte&index=3");
assert.equal(api.urlImage("x", ""), "");
for (const titre of ["Le Magicien & la Grotte !", "Été ★ épique", "", "   ", "x".repeat(100)]) {
  const id = api.nouvelId(titre);
  assert.match(id, IDLE_HISTOIRE_ID_RE_V1, "identifiant technique valide côté serveur : " + id);
}
assert.notEqual(api.nouvelId("a"), api.nouvelId("a"));
assert.equal(api.extensionImage("Scène 1.PNG"), "png");
assert.equal(api.extensionImage("photo.jpeg"), "jpeg");
assert.equal(api.extensionImage("virus.exe"), "");
assert.equal(api.extensionImage("sans-extension"), "");
assert.deepEqual(["10.png", "2.png", "1.png", "9.png"].sort(api.comparerNoms), ["1.png", "2.png", "9.png", "10.png"], "ordre naturel : 2 avant 10");
assert.deepEqual(
  JSON.parse(JSON.stringify(api.statutVoixHistoire({ voix: ["00000000000001"], etapes: [{ texte: "Un." }, { texte: "Deux." }, { texte: "" }] }))),
  { total: 2, prets: 1 },
  "voix prêtes / blocs à lire (une étape sans texte n'a pas de voix)"
);

// --- Code : éditeur, téléversements et génération de voix ---
assert.match(source, /'\/api\/v1\/story-upload\?id='\+encodeURIComponent\(edition\.id\)\+'&ext='\+ext/);
assert.match(source, /authorization:'Bearer '\+jeton_\(\)/, "téléversements authentifiés par le jeton de session");
assert.match(source, /'\/api\/v1\/voice-upload\?h='\+hash/);
assert.match(source, /STUDIO_URL='http:\/\/127\.0\.0\.1:8765'/, "studio de voix local");
assert.match(source, /appel_\('enregistrerHistoireAdminSorealIdle',\[edition\]\)/);
assert.match(source, /appel_\('supprimerHistoireAdminSorealIdle',\[\{id:h\.id\}\]\)/, "l'identifiant part dans un objet (le pont ajoute la session au premier argument texte)");
assert.match(source, /moteur\.jouer\(versLecteur_\(h\),\{marquerVu:false\}\)/, "« Jouer » / « Tester » ne marque jamais l'histoire comme vue");
assert.match(source, /<input type="file" id="sorealIdleAdminFichiersV1"[^>]*multiple/, "plusieurs images d'un coup");
// --- Deux voix (Norman, 2026-09-30 : « faire intervenir une femme de temps en temps ») ---
assert.match(source, /data-adm-parleur/, "choix du parleur par étape");
assert.match(source, /\['femme','👩 Femme'\]/);
assert.match(source, /voix:parleur==='femme'\?'femme':'homme'/, "la voix choisie est transmise au studio");
assert.match(source, /b\.parleur=e\.parleur\|\|'narrateur'/, "chaque bloc de voix retient le parleur de son étape");
const studio = readFileSync("cloudflare/tools/voice-studio/serveur.py", "utf8");
assert.match(studio, /VOIX_FICHIERS = \{"homme": "homme\.wav", "femme": "femme\.wav"\}/);
assert.match(studio, /kwargs\["audio_prompt_path"\] = reference/, "chaque voix imite un extrait de voix FRANÇAISE (pas d'accent anglais)");
assert.match(readFileSync("cloudflare/tools/voice-studio/installer.bat", "utf8"), /creer_references\.py/, "extraits de référence créés à l'installation");

console.log("idle-admin-histoires-v1: OK");
