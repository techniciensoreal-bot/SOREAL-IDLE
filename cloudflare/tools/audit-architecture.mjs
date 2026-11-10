/*
 * Audit d'architecture (Norman, 2026-10-16 : « un audit qui dise : il n'y a rien à corriger »).
 *
 *   node cloudflare/tools/audit-architecture.mjs          -> affiche le rapport ; sort en erreur s'il reste un point à corriger
 *   node cloudflare/tools/audit-architecture.mjs --json   -> même chose en JSON
 *
 * Ce que « parfait » veut dire ICI (seuils objectifs, écrits en dur ci-dessous) :
 *   1. aucun fichier JavaScript du frontend ou du moteur n'a plus de MAX_LIGNES_FICHIER lignes ;
 *   2. aucune fonction n a plus de MAX_LIGNES_FONCTION lignes (EXCEPTIONS_FONCTIONS : vide aujourd hui) ;
 *   3. chaque script/feuille de style/dictionnaire versionné par ?v=N a bien un numéro à jour (maj-pins.mjs --verifier) ;
 *   4. les en-têtes de cache immuables (public/_headers) couvrent les fichiers versionnés ;
 *   5. tous les fichiers JavaScript publics et du moteur passent node --check ; 6. le nombre de !important du CSS ne dépasse pas son plafond (cliquet) ;
 *   7. CLIQUETS DE DETTE (2026-11-09, voir « Cliquets de dette » plus bas ; --detail liste les fichiers responsables) : !important dans le JS, setInterval, requestAnimationFrame,
 *      MutationObserver, styles injectés (par fichier), formateurs de durée/nombre dupliqués, globales window.__X__ lues sans être posées, fichiers JS > 150 Ko, lignes par feuille CSS.
 * Ce que cet audit NE mesure PAS : la justesse du jeu (les tests s'en chargent), le style CSS (voir « dette CSS » du rapport), la vitesse réelle
 * (voir cloudflare/bench/bench-moteur.mjs). Un rapport vert signifie « aucun seuil ci-dessus n'est dépassé », rien de plus.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decouper } from "../tests/_js-scan.mjs";
import { analyzeEsm } from "../tests/_esm-scan.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_LIGNES_FICHIER = 2700;
const MAX_LIGNES_FONCTION = 450;
/* Aucune exception aujourd'hui. Si une fonction doit dépasser le seuil, l'inscrire ici ("fichier:fonction": plafond figé, jamais relevé) et le dire dans le commit. */
const EXCEPTIONS_FONCTIONS = {};

const problemes = []; const infos = [];
const lignesDe = (t) => t.split("\n").length;

const fichiers = [];
for (const [dossier, re] of [["public", /\.js$/], ["public/modules", /\.js$/], ["src", /\.js$/]]) {
  for (const f of readdirSync(join(racine, dossier))) if (re.test(f)) fichiers.push(dossier + "/" + f);
}

/* Fichier GÉNÉRÉ (esbuild, tools/build-moteur-local.mjs) : seule la syntaxe est contrôlée, pas la taille ni les fonctions. */
const GENERES = new Set(["public/moteur-local-worker-v1.js"]);

for (const f of fichiers) {
  if (GENERES.has(f)) {
    if (spawnSync(process.execPath, ["--check", join(racine, f)], { encoding: "utf8" }).status !== 0) problemes.push(`erreur de syntaxe : ${f}`);
    continue;
  }
  const texte = readFileSync(join(racine, f), "utf8").replace(/\r\n/g, "\n");
  const n = lignesDe(texte);
  if (n > MAX_LIGNES_FICHIER) problemes.push(`fichier trop long : ${f} (${n} lignes, maximum ${MAX_LIGNES_FICHIER})`);
  let fonctions = [];
  try {
    if (f.startsWith("src/")) {
      const A = analyzeEsm(join(racine, f));
      fonctions = A.stmts.filter((s) => s.kind === "function").map((s) => [s.names[0], s.endLine - s.startLine + 1]);
    } else {
      const d = decouper(texte);
      fonctions = d.items.filter((i) => i.kind === "function").map((i) => [i.names[0], lignesDe(texte.slice(i.debut, i.fin))]);
    }
  } catch (e) { problemes.push(`analyse impossible : ${f} (${e.message})`); continue; }
  for (const [nom, l] of fonctions) {
    const cle = f + ":" + nom;
    const plafond = EXCEPTIONS_FONCTIONS[cle];
    if (plafond !== undefined) { infos.push(`exception : ${cle} (${l} lignes, plafond ${plafond})`); if (l > plafond) problemes.push(`fonction grossie : ${cle} (${l} lignes, plafond ${plafond})`); continue; }
    if (l > MAX_LIGNES_FONCTION) problemes.push(`fonction trop longue : ${cle} (${l} lignes, maximum ${MAX_LIGNES_FONCTION})`);
  }
  const syntaxe = spawnSync(process.execPath, ["--check", join(racine, f)], { encoding: "utf8" });
  if (syntaxe.status !== 0) problemes.push(`erreur de syntaxe : ${f}`);
}

const pins = spawnSync(process.execPath, [join(racine, "tools", "maj-pins.mjs"), "--verifier"], { encoding: "utf8" });
if (pins.status !== 0) problemes.push("numéros ?v= périmés (lancer node cloudflare/tools/maj-pins.mjs) : " + (pins.stdout + pins.stderr).trim().split("\n")[0]);

/* Modules chargés à la demande (modules/chargeur-v1.js) : listés dans la table JSON de index.html. Ils sont déjà contrôlés plus haut (syntaxe : tout public/modules/*.js ; numéros ?v= : maj-pins.mjs lit la
 * table). Ici : la table est du JSON valide, chaque fichier existe et porte un numéro, et aucun n'est AUSSI un <script> de la page (il serait chargé deux fois). */
{
  const index = readFileSync(join(racine, "public", "index.html"), "utf8");
  const bloc = index.match(/<script type="application\/json" id="soreal-modules-differes-v1">([\s\S]*?)<\/script>/);
  if (!bloc) problemes.push("index.html : table des modules à la demande absente (soreal-modules-differes-v1)");
  else {
    let table = {};
    try { table = JSON.parse(bloc[1]); } catch (e) { problemes.push("index.html : table des modules à la demande invalide (" + e.message + ")"); }
    const scripts = new Set([...index.matchAll(/<script defer src="(\/[^"?]+)\?v=\d+"/g)].map((m) => m[1]));
    for (const [groupe, liste] of Object.entries(table)) {
      for (const u of Array.isArray(liste) ? liste : []) {
        const m = /^(\/[^?]+\.js)\?v=\d+$/.exec(u);
        if (!m) { problemes.push(`modules à la demande (${groupe}) : adresse sans ?v=N : ${u}`); continue; }
        if (!fichiers.includes("public" + m[1])) problemes.push(`modules à la demande (${groupe}) : fichier introuvable : ${m[1]}`);
        if (scripts.has(m[1])) problemes.push(`modules à la demande (${groupe}) : ${m[1]} est aussi un <script defer> de la page`);
      }
    }
    infos.push(`modules à la demande : ${Object.values(table).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0)} fichiers`);
  }
}

const entetes = readFileSync(join(racine, "public", "_headers"), "utf8");
for (const motif of ["/modules/*", "/soreal-idle-*.js", "/soreal-idle-*.css", "immutable"]) if (!entetes.includes(motif)) problemes.push("_headers : motif absent " + motif);

/* Dette CSS connue : nombre de « !important » dans les feuilles de style. Cliquet : le total ne doit JAMAIS augmenter ; en retirer = baisser PLAFOND_IMPORTANT.
 * Aucun outil ne vérifie le rendu visuel : on les retire page par page, à l'œil, pas en masse. */
const PLAFOND_IMPORTANT = 2517;
let important = 0;
for (const f of readdirSync(join(racine, "public"))) if (f.endsWith(".css")) important += (readFileSync(join(racine, "public", f), "utf8").match(/!important/g) || []).length;
infos.push(`dette CSS : ${important} « !important » (plafond ${PLAFOND_IMPORTANT}, ne doit jamais monter)`);
if (important > PLAFOND_IMPORTANT) problemes.push(`CSS : ${important} « !important », plafond ${PLAFOND_IMPORTANT}`);

/* ===== Cliquets de dette (vague 0 de l'audit de cohérence 2026-11-09) =====
 * Chaque plafond ci-dessous est la valeur MESURÉE le jour où il a été figé (2026-11-09). Il ne peut que BAISSER :
 *   - une mesure > plafond fait échouer l'audit : retirer l'ajout (ou factoriser dans le module commun) ; ne JAMAIS relever un plafond sans accord de Norman ;
 *   - une mesure < plafond est signalée (« plafond abaissable ») : baisser la constante pour verrouiller le gain.
 * Périmètre « frontend » = public/modules/*.js + public/soreal-idle-ui.js (le fichier généré moteur-local-worker-v1.js est exclu).
 * `node cloudflare/tools/audit-architecture.mjs --detail` liste les fichiers responsables de chaque compte. */
const PLAFONDS = {
  importantJs: 348,          /* « !important » dans le JS (chaînes CSS comprises) */
  setInterval: 103,          /* setInterval( */
  requestAnimationFrame: 106,/* requestAnimationFrame( */
  mutationObserver: 23,     /* new MutationObserver( */
  styleInjecte: 98,         /* createElement('style') : total */
  formateursDupliques: 11,  /* formateurs de durée/nombre définis hors time-format-v1.js / number-format-v1.js */
};
/* Modules qui injectent du CSS (createElement('style')) : nombre par fichier, jamais en hausse ; un NOUVEAU fichier absent d'ici fait échouer (écrire la feuille dans un .css). */
const STYLE_INJECTE_PAR_FICHIER = {
  "public/modules/admin-histoires-v1.js": 2,
  "public/modules/admin-tutoriel-v1.js": 1,
  "public/modules/adventure-fond-zone-v1.js": 1,
  "public/modules/adventure-scene-v79.js": 1,
  "public/modules/alloc-pop-v1.js": 1,
  "public/modules/animations-hors-ecran-v1.js": 1,
  "public/modules/apk-connexion-v1.js": 2,
  "public/modules/apparition-boss-v1.js": 1,
  "public/modules/aug-led-barres-v1.js": 1,
  "public/modules/barres-actives-v1.js": 1,
  "public/modules/boss-reveal-v1.js": 1,
  "public/modules/boutique-info-i-v1.js": 1,
  "public/modules/bt-neon-v1.js": 1,
  "public/modules/bug-report-v1.js": 1,
  "public/modules/cartes-v1.js": 1,
  "public/modules/challenges-v1.js": 2,
  "public/modules/chat-v1.js": 1,
  "public/modules/coffre-accident-v1.js": 1,
  "public/modules/combat-effets-v1.js": 1,
  "public/modules/competence-debloquee-v1.js": 1,
  "public/modules/connexion-recompense-v1.js": 1,
  "public/modules/credit-exp-admin-v1.js": 1,
  "public/modules/cthulhu-scene-v1.js": 1,
  "public/modules/cthulhu-v1.js": 1,
  "public/modules/cube-aura-v1.js": 1,
  "public/modules/cube-palier-v1.js": 1,
  "public/modules/daycare-page-v1.js": 1,
  "public/modules/daycare-skin-popup-v1.js": 1,
  "public/modules/defilement-theme-v1.js": 1,
  "public/modules/dessins-v1.js": 1,
  "public/modules/dialogue-site-v1.js": 1,
  "public/modules/effets-legers-v1.js": 2,
  "public/modules/etagere-personnage-v1.js": 2,
  "public/modules/etagere-pupilles-v1.js": 1,
  "public/modules/etagere-sommeil-regard-v1.js": 1,
  "public/modules/fade-notice-v1.js": 1,
  "public/modules/feu-v1.js": 1,
  "public/modules/flux-v1.js": 1,
  "public/modules/fond-combat-v1.js": 1,
  "public/modules/foudre-borne-v1.js": 1,
  "public/modules/garderie-bocaux-formes-v1.js": 1,
  "public/modules/garderie-zoom-v1.js": 1,
  "public/modules/hud-haut-v2.js": 2,
  "public/modules/intro-diaporama-v1.js": 1,
  "public/modules/inventory-auto-v1.js": 1,
  "public/modules/item-extra-r2-v77.js": 1,
  "public/modules/item-images-r2-v74.js": 1,
  "public/modules/item-specials-early-v75.js": 1,
  "public/modules/journal-attaques-v1.js": 1,
  "public/modules/labos-page-v1.js": 1,
  "public/modules/lecteur-chroniques-v1.js": 1,
  "public/modules/maj-v1.js": 1,
  "public/modules/mesure-reference-v1.js": 1,
  "public/modules/moqueurs-fuite-v1.js": 1,
  "public/modules/mort-joueur-v1.js": 1,
  "public/modules/morts-boss-nouvelles-v1.js": 1,
  "public/modules/nettoyage-ap-v1.js": 1,
  "public/modules/nouvelle-version-v1.js": 1,
  "public/modules/nuke-blindage-v1.js": 1,
  "public/modules/orage-v1.js": 2,
  "public/modules/perso-boutons-v1.js": 1,
  "public/modules/plein-ecran-v1.js": 1,
  "public/modules/popup-effet-objet-v1.js": 1,
  "public/modules/profil-badavatar-editeur-v1.js": 1,
  "public/modules/profil-visage-v1.js": 1,
  "public/modules/profile-v1.js": 1,
  "public/modules/reapparitions-v1.js": 1,
  "public/modules/renaissance-fenetre-v1.js": 1,
  "public/modules/sang-rituel-decor-v1.js": 1,
  "public/modules/sets-zoom-v1.js": 1,
  "public/modules/stats-detail-v1.js": 1,
  "public/modules/story-engine-v1.js": 1,
  "public/modules/textes-admin-v1.js": 1,
  "public/modules/the-end-ui-v1.js": 1,
  "public/modules/titans-combat-ecran-v1.js": 1,
  "public/modules/titans-v1.js": 1,
  "public/modules/tutorial-hint-v1.js": 1,
  "public/modules/tutorial-tts-v202.js": 1,
  "public/modules/tutoriel-v1.js": 1,
  "public/modules/ui-amorcage-v1.js": 1,
  "public/modules/ui-popups-v1.js": 1,
  "public/modules/ui-renaissance-v1.js": 1,
  "public/modules/ui-tutoriel-v1.js": 1,
  "public/modules/ui.js": 1,
  "public/modules/valise-accident-v1.js": 1,
  "public/modules/valise-v1.js": 2,
  "public/modules/victoire-boss-arcade-v1.js": 1,
  "public/modules/voix-ui-v1.js": 1,
  "public/modules/wandoos-retro-v1.js": 1,
  "public/modules/yggdrasil-elfes-v1.js": 1,
};
/* Globales window.__X__ lues mais posées nulle part dans public/ (écarts connus au 2026-11-09). Une NOUVELLE lecture sans pose fait échouer : poser la globale ou retirer la lecture. */
const GLOBALES_LUES_NON_POSEES = new Set([
  "__SOREAL_IDLE_CHAT_MAJ_MENU__", "__SOREAL_IDLE_FORCER_SYNCHRO_V1__", "__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__", "__jouerSonClicSorealV1__",
  "__SOREAL_IDLE_BORNE_ANIM_FORCEE__",   /* outil de réglage lu dans borne-led-v1.js, posé à la main dans la console */
]);
/* Fichiers JS de plus de SEUIL_OCTETS : plafond en octets par fichier (arrondi au Ko supérieur), jamais en hausse ; un nouveau fichier au-dessus du seuil fait échouer (le découper). */
const SEUIL_OCTETS = 150 * 1024;
const OCTETS_PAR_FICHIER = {
  "public/modules/borne-led-v1.js": 239616,
  "public/modules/sang-rituel-decor-v1.js": 211968,
  "public/modules/release-notes-v1.js": 208896,   /* relevé à 204 Ko avec l accord de Norman (2026-11-10) : une entrée de note par jour */
  "public/modules/augmentations-page-v1.js": 157696,
};
/* Feuilles de style : plafond de lignes par feuille (taille du 2026-11-09), jamais en hausse. Une feuille absente d'ici est limitée à MAX_LIGNES_FICHIER. */
const LIGNES_CSS_PAR_FEUILLE = {
  "soreal-idle-album-titans.css": 65,
  "soreal-idle-album.css": 265,
  "soreal-idle-augment-led-haut-v1.css": 35,
  "soreal-idle-augment-led-v1.css": 71,
  "soreal-idle-augment-pcb-puissance-v1.css": 58,
  "soreal-idle-augment-touches-v1.css": 40,
  "soreal-idle-barre-outils.css": 47,
  "soreal-idle-borne-joueur-v1.css": 52,
  "soreal-idle-borne-led-v1.css": 19,
  "soreal-idle-carte-boss.css": 130,
  "soreal-idle-chroniques.css": 349,
  "soreal-idle-entetes-a.css": 227,
  "soreal-idle-entetes-b.css": 178,
  "soreal-idle-entetes-c.css": 156,
  "soreal-idle-entetes-compactes-v1.css": 89,
  "soreal-idle-entetes-d.css": 255,
  "soreal-idle-entetes-miniature-v1.css": 57,
  "soreal-idle-entrainement-puissance-v1.css": 236,
  "soreal-idle-itopod.css": 2125,
  "soreal-idle-jeu-global.css": 167,
  "soreal-idle-jeu.css": 246,
  "soreal-idle-labos-habillage-v1.css": 42,
  "soreal-idle-lisibilite-v1.css": 14,
  "soreal-idle-machine.css": 99,
  "soreal-idle-menus-boutons-v1.css": 395,
  "soreal-idle-renaissance.css": 46,
  "soreal-idle-themes.css": 2364,
  "soreal-idle-ui.css": 6325,
};

const frontend = fichiers.filter((f) => (f.startsWith("public/modules/") || f === "public/soreal-idle-ui.js") && !GENERES.has(f));
const lire = (f) => readFileSync(join(racine, f), "utf8");
const compte = (re, t) => (t.match(re) || []).length;
const mesure = { importantJs: 0, setInterval: 0, requestAnimationFrame: 0, mutationObserver: 0, styleInjecte: 0, formateursDupliques: 0 };
const styleParFichier = {}; const parFichier = { importantJs: {}, setInterval: {}, requestAnimationFrame: {}, mutationObserver: {} };
const formateurs = [];
const NOM_FORMATEUR = "formater?Duree\\w*|formatDuree\\w*|formatNombre\\w*|formaterNombre\\w*|formatGrandNombre\\w*|formaterGrandNombre\\w*|dureeLongue\\w*";
const reDefFonction = new RegExp("function\\s+(" + NOM_FORMATEUR + ")\\s*(\\([^)]*\\)\\s*\\{)", "g");
const reDefFlechee = new RegExp("(?:const|let|var)\\s+(" + NOM_FORMATEUR + ")\\s*=\\s*(?:async\\s*)?(\\([^)]*\\)\\s*=>|function\\s*\\([^)]*\\)\\s*\\{)", "g");
const reCale = /^\s*return\s+[\w$.\[\]'"]+\.apply\(/;   /* cale : function x(){return REG.x.apply(null,arguments);} */
for (const f of frontend) {
  const t = lire(f);
  for (const [k, re] of [["importantJs", /!important/g], ["setInterval", /\bsetInterval\(/g], ["requestAnimationFrame", /\brequestAnimationFrame\(/g], ["mutationObserver", /new\s+MutationObserver\(/g]]) {
    const n = compte(re, t); if (n) { mesure[k] += n; parFichier[k][f] = n; }
  }
  const s = compte(/createElement\(\s*['"]style['"]\s*\)/g, t); if (s) { mesure.styleInjecte += s; styleParFichier[f] = s; }
  if (f.endsWith("/time-format-v1.js") || f.endsWith("/number-format-v1.js")) continue;
  for (const re of [reDefFonction, reDefFlechee]) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(t))) {
      const suite = t.slice(m.index + m[0].length, m.index + m[0].length + 160);
      if (reCale.test(suite)) continue;
      formateurs.push(f.replace("public/modules/", "") + ":" + m[1]);
    }
  }
}
mesure.formateursDupliques = formateurs.length;
const libelles = {
  importantJs: ["« !important » dans le JS", "retirer l'ajout : mettre la règle dans une feuille .css avec une meilleure spécificité"],
  setInterval: ["setInterval(", "réutiliser le tick commun (ui-boucle-v1.js) au lieu d'une minuterie de plus"],
  requestAnimationFrame: ["requestAnimationFrame(", "réutiliser la boucle d'animation commune au lieu d'en ouvrir une de plus"],
  mutationObserver: ["new MutationObserver(", "réutiliser un observateur existant ou écouter l'évènement qui change la page"],
  styleInjecte: ["createElement('style')", "écrire la règle dans une feuille .css versionnée (pas de style injecté par le JS)"],
  formateursDupliques: ["formateurs de durée/nombre hors time-format-v1.js / number-format-v1.js", "appeler time-format-v1.js / number-format-v1.js (REG) au lieu de redéfinir un formateur"],
};
function cliquet(cle, valeur, plafond, libelle, conseil) {
  if (plafond === null) { infos.push(`MESURE ${cle} : ${valeur}`); return; }
  infos.push(`dette ${libelle} : ${valeur} (plafond ${plafond}${valeur < plafond ? " ; plafond abaissable à " + valeur : ""})`);
  if (valeur > plafond) problemes.push(`${libelle} : ${valeur}, plafond ${plafond}. À faire : ${conseil}. Ne jamais relever le plafond sans accord de Norman.`);
}
for (const k of Object.keys(PLAFONDS)) cliquet(k, mesure[k], PLAFONDS[k], libelles[k][0], libelles[k][1]);
if (STYLE_INJECTE_PAR_FICHIER) for (const [f, n] of Object.entries(styleParFichier)) {
  const p = STYLE_INJECTE_PAR_FICHIER[f];
  if (p === undefined) problemes.push(`${f} injecte du CSS (createElement('style') x${n}) et n'est pas dans STYLE_INJECTE_PAR_FICHIER. À faire : écrire les règles dans une feuille .css versionnée.`);
  else if (n > p) problemes.push(`${f} : ${n} style(s) injecté(s), plafond ${p}. À faire : déplacer les règles dans une feuille .css.`);
}

/* Globales window.__X__ : lues sans être posées. */
function listerPublic(dossier, sortie = []) {
  for (const e of readdirSync(join(racine, dossier), { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith("mediapipe-")) continue;
    const chemin = dossier + "/" + e.name;
    if (e.isDirectory()) listerPublic(chemin, sortie); else if (/\.(js|html)$/.test(e.name) && chemin !== "public/moteur-local-worker-v1.js") sortie.push(chemin);
  }
  return sortie;
}
const posees = new Set(); const lues = new Map();
const reNom = "__[A-Za-z0-9_]+__";
const reAcces = new RegExp("(?:window|globalThis|self)(?:\\.(" + reNom + ")|\\[\\s*['\"](" + reNom + ")['\"]\\s*\\])(\\s*(?:\\|\\||&&|\\?\\?)?=(?!=))?", "g");
const reDecl = new RegExp("(?:var|let|const|function)\\s+(" + reNom + ")", "g");
const reCle = new RegExp("(" + reNom + ")\\s*:", "g");
const reAlias = new RegExp("\\.(" + reNom + ")\\s*(?:\\|\\||&&|\\?\\?)?=(?!=)", "g");   /* alias : root.__X__=... (root = window) */
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
for (const f of listerPublic("public")) {
  const brut = lire(f); const t = sansCommentaires(brut);
  let m; reAcces.lastIndex = 0;
  reAlias.lastIndex = 0; while ((m = reAlias.exec(t))) posees.add(m[1]);
  while ((m = reAcces.exec(t))) { const nom = m[1] || m[2]; if (m[3]) posees.add(nom); else if (!lues.has(nom)) lues.set(nom, f); }
  reDecl.lastIndex = 0; while ((m = reDecl.exec(t))) posees.add(m[1]);
  /* Object.assign(window,{ __X__: ... }) : toute clé __X__: du fichier qui contient l'appel ; Object.defineProperty(window,'__X__') */
  if (/Object\.assign\(\s*(?:window|globalThis|self)\s*,/.test(t)) { reCle.lastIndex = 0; while ((m = reCle.exec(t))) posees.add(m[1]); }
  const reDef = new RegExp("Object\\.defineProperty\\(\\s*(?:window|globalThis|self)\\s*,\\s*['\"](" + reNom + ")['\"]", "g");
  while ((m = reDef.exec(t))) posees.add(m[1]);
}
const orphelines = [...lues.keys()].filter((n) => !posees.has(n)).sort();
infos.push(`globales window.__X__ lues sans être posées : ${orphelines.length} (liste blanche ${GLOBALES_LUES_NON_POSEES.size})`);
for (const n of orphelines) if (!GLOBALES_LUES_NON_POSEES.has(n)) problemes.push(`${n} est lue (${lues.get(n)}) mais posée nulle part dans public/. À faire : la poser (window.${n}=...) avant sa lecture, ou retirer la lecture ; ne pas l'ajouter à GLOBALES_LUES_NON_POSEES sans raison écrite.`);

/* Fichiers JS trop lourds en octets. */
const gros = [];
for (const f of fichiers) {
  if (GENERES.has(f) || f.startsWith("src/")) continue;
  const o = statSync(join(racine, f)).size;
  if (o <= SEUIL_OCTETS) continue;
  gros.push([f, o]);
  if (!OCTETS_PAR_FICHIER) continue;
  const p = OCTETS_PAR_FICHIER[f];
  if (p === undefined) problemes.push(`${f} pèse ${o} octets (seuil ${SEUIL_OCTETS}) et n'est pas dans OCTETS_PAR_FICHIER. À faire : le découper en modules plus petits.`);
  else if (o > p) problemes.push(`${f} a grossi : ${o} octets, plafond ${p}. À faire : sortir du code dans un nouveau module plutôt que de grossir ce fichier.`);
}
infos.push(`fichiers JS > ${SEUIL_OCTETS / 1024} Ko : ${gros.length}` + (gros.length ? " (" + gros.sort((a, b) => b[1] - a[1]).map(([f, o]) => f.replace("public/", "") + " " + Math.round(o / 1024) + " Ko").join(", ") + ")" : ""));

/* Feuilles de style : lignes par feuille. */
const feuilles = readdirSync(join(racine, "public")).filter((f) => f.endsWith(".css")).map((f) => [f, lignesDe(lire("public/" + f).replace(/\r\n/g, "\n").replace(/\n$/, ""))]);
infos.push("lignes par feuille CSS : " + [...feuilles].sort((a, b) => b[1] - a[1]).map(([f, n]) => f.replace(/^soreal-idle-/, "") + " " + n).join(", "));
if (LIGNES_CSS_PAR_FEUILLE) for (const [f, n] of feuilles) {
  const p = LIGNES_CSS_PAR_FEUILLE[f] === undefined ? MAX_LIGNES_FICHIER : LIGNES_CSS_PAR_FEUILLE[f];
  if (n > p) problemes.push(`feuille ${f} : ${n} lignes, plafond ${p}. À faire : ne pas grossir cette feuille (retirer ou factoriser des règles) ; une nouvelle feuille est limitée à ${MAX_LIGNES_FICHIER} lignes.`);
}

if (process.argv.includes("--detail")) {
  for (const k of Object.keys(parFichier)) console.log(`\n${k} par fichier :\n` + Object.entries(parFichier[k]).sort((a, b) => b[1] - a[1]).map(([f, n]) => `  ${n}\t${f}`).join("\n"));
  console.log("\ncreateElement('style') par fichier :\n" + Object.entries(styleParFichier).map(([f, n]) => `  ${n}\t${f}`).join("\n"));
  console.log("\nformateurs hors modules communs :\n" + formateurs.map((x) => "  " + x).join("\n"));
  console.log("\nglobales lues non posées : " + orphelines.join(", "));
  console.log("\nGROS : " + JSON.stringify(Object.fromEntries(gros)));
  console.log("FEUILLES : " + JSON.stringify(Object.fromEntries(feuilles)));
  console.log("STYLE : " + JSON.stringify(styleParFichier));
  console.log("MESURE : " + JSON.stringify(mesure));
}

const rapport = { fichiersAnalyses: fichiers.length, problemes, infos };
if (process.argv.includes("--json")) console.log(JSON.stringify(rapport, null, 2));
else {
  console.log(`Audit d'architecture : ${fichiers.length} fichiers JavaScript analysés.`);
  infos.forEach((i) => console.log("  · " + i));
  if (problemes.length) { console.log(`\n${problemes.length} point(s) à corriger :`); problemes.forEach((p) => console.log("  ✗ " + p)); }
  else console.log("\nIl n'y a rien à corriger selon les seuils de l'audit (voir l'en-tête du script pour ce qu'ils couvrent).");
}
process.exit(problemes.length ? 1 : 0);
