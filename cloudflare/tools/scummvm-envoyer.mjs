/*
 * Envoi du moteur ScummVM et des jeux vers R2 (ou vers un dossier miroir local), voir src/idle-scummvm-v1.js (disposition `scummvm/…` du seau SOREAL_R2).
 *
 *   node cloudflare/tools/scummvm-envoyer.mjs moteur <dossier-du-moteur>             moteur : scummvm.html, scummvm.js, scummvm.wasm, data/… (compilé par dists/emscripten/build.sh de ScummVM)
 *   node cloudflare/tools/scummvm-envoyer.mjs jeu <dossier-du-jeu> [--nom <dossier>]  un jeu (fichiers de données) -> scummvm/jeux/<nom>/ (par défaut le nom du dossier)
 *   node cloudflare/tools/scummvm-envoyer.mjs catalogue <jeux.json>                   le catalogue des jeux par difficulté (voir le format dans idle-scummvm-v1.js)
 *
 * Options :  --local <dossier>   copie dans <dossier>/scummvm/… (miroir pour SCUMMVM_DOSSIER de local-dev-server.mjs) au lieu d'envoyer sur R2
 *            --simuler           liste ce qui serait envoyé, sans rien écrire ni envoyer
 *
 * Les `index.json` sont GÉNÉRÉS ici (arbre `{nom: taille}` comme le lit ScummVM) : le moteur reçoit `data/index.json` avec `games.baseUrl` = /api/idle/scummvm/jeux ;
 * `data/plugins/index.json` est recalculé. Rien n'est envoyé sur R2 sans cette commande (jamais depuis un test).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BUCKET = "soreal";
const PREFIXE = "scummvm/";
const BASE_URL_JEUX = "/api/idle/scummvm/jeux";
/* types SANS « ; charset=… » : sous Windows wrangler est lancé par un shell qui coupe l'argument au point-virgule (« Unknown argument: charset=utf-8 ») ; la route (idle-scummvm-v1.js) ajoute le charset elle-même à la réponse. */
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".zip": "application/zip", ".txt": "text/plain" };

const args = process.argv.slice(2);
const commande = args[0];
function option(nom) { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : ""; }
const local = option("--local");
const simuler = args.includes("--simuler");
const positionnels = args.slice(1).filter((a, i, t) => !a.startsWith("--") && !(i > 0 && ["--local", "--nom"].includes(t[i - 1])));

function arbre(dossier, ignorer = []) {
  const o = {};
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.name === "index.json" || e.name.startsWith(".") || ignorer.includes(e.name)) continue;
    o[e.name] = e.isDirectory() ? arbre(path.join(dossier, e.name)) : fs.statSync(path.join(dossier, e.name)).size;
  }
  return o;
}
function fichiers(dossier, relatif = "") {
  const liste = [];
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const r = relatif ? relatif + "/" + e.name : e.name;
    if (e.isDirectory()) liste.push(...fichiers(path.join(dossier, e.name), r)); else liste.push(r);
  }
  return liste;
}
/* Écrit un index.json (arbre {nom: taille}) dans chaque dossier du jeu, comme build-make_http_index.js de ScummVM : chaque dossier liste SES fichiers et sous-dossiers. */
function indexer(dossier) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) if (e.isDirectory() && !e.name.startsWith(".")) indexer(path.join(dossier, e.name));
  fs.writeFileSync(path.join(dossier, "index.json"), JSON.stringify(arbre(dossier)));
}

function envoyer(fichierLocal, cle) {
  const type = TYPES[path.extname(cle).toLowerCase()] || "application/octet-stream";
  if (simuler) { console.log("(simulation) " + PREFIXE + cle + "  <-  " + fichierLocal + "  [" + type + "]"); return; }
  if (local) {
    const dest = path.join(local, PREFIXE, cle);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(fichierLocal, dest);
    console.log("copié " + dest);
    return;
  }
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "wrangler", "r2", "object", "put", BUCKET + "/" + PREFIXE + cle, "--file", fichierLocal, "--content-type", type, "--remote"], { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) { console.error("ÉCHEC de l'envoi de " + cle); process.exit(1); }
}

if (commande === "moteur") {
  const src = positionnels[0];
  if (!src || !fs.existsSync(path.join(src, "scummvm.html"))) { console.error("usage : moteur <dossier contenant scummvm.html, scummvm.js, scummvm.wasm, data/>"); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(process.env.TEMP || process.env.TMPDIR || ".", "scummvm-moteur-"));
  fs.cpSync(src, tmp, { recursive: true });
  /* la page de démonstration d'origine envoie des rapports d'erreurs à un service tiers (Sentry) : rien ne doit sortir de notre origine. */
  let html = fs.readFileSync(path.join(tmp, "scummvm.html"), "utf8");
  html = html.replace(/<script>window\.__SENTRY_CFG__[^]*?<\/script>/, "").replace(/<script src="sentry[^>]*><\/script>/, "");
  if (/sentry/i.test(html)) { console.error("la page contient encore « sentry » : à retirer à la main avant l'envoi"); process.exit(3); }
  fs.writeFileSync(path.join(tmp, "scummvm.html"), html);
  fs.rmSync(path.join(tmp, "sentry.bundle.js"), { force: true });
  /* données : index.json recalculé, avec le dossier des jeux servi par notre route */
  const data = path.join(tmp, "data");
  if (fs.existsSync(data)) {
    const di = arbre(data, ["games"]);
    di.games = { baseUrl: BASE_URL_JEUX };
    fs.writeFileSync(path.join(data, "index.json"), JSON.stringify(di));
    for (const sous of fs.readdirSync(data, { withFileTypes: true })) if (sous.isDirectory() && sous.name !== "games") indexer(path.join(data, sous.name));
  }
  fs.rmSync(path.join(data, "games"), { recursive: true, force: true });
  const liste = fichiers(tmp);
  console.log("moteur : " + liste.length + " fichiers");
  for (const f of liste) envoyer(path.join(tmp, f), "moteur/" + f);
  fs.rmSync(tmp, { recursive: true, force: true });
} else if (commande === "jeu") {
  const src = positionnels[0];
  if (!src || !fs.existsSync(src) || !fs.statSync(src).isDirectory()) { console.error("usage : jeu <dossier du jeu> [--nom <dossier>]"); process.exit(2); }
  const nom = option("--nom") || path.basename(path.resolve(src));
  if (!/^[A-Za-z0-9._\-+()]+$/.test(nom)) { console.error("nom de dossier invalide : " + nom); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(process.env.TEMP || process.env.TMPDIR || ".", "scummvm-jeu-"));
  fs.cpSync(src, tmp, { recursive: true });
  indexer(tmp);
  const liste = fichiers(tmp);
  console.log("jeu « " + nom + " » : " + liste.length + " fichiers");
  for (const f of liste) envoyer(path.join(tmp, f), "jeux/" + nom + "/" + f);
  /* index de la liste des jeux (comme le fait la démo de ScummVM) : lu seulement si on parcourt le dossier racine, sans effet sur le catalogue. */
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("pense à déclarer ce jeu dans le catalogue (commande « catalogue »).");
} else if (commande === "catalogue") {
  const src = positionnels[0];
  if (!src || !fs.existsSync(src)) { console.error("usage : catalogue <jeux.json>"); process.exit(2); }
  const c = JSON.parse(fs.readFileSync(src, "utf8"));
  if (!c || !Array.isArray(c.jeux)) { console.error("le catalogue doit être {\"jeux\":[…]}"); process.exit(2); }
  for (const j of c.jeux) {
    if (j && j.dossiers !== undefined) {
      /* un dossier par langue (« fr » et « en ») : le jeu s'affiche et se sous-titre dans la langue des fichiers choisis selon la langue de Soreal */
      if (typeof j.dossiers !== "object" || j.dossiers === null || !Object.entries(j.dossiers).every(([l, d]) => ["fr", "en"].includes(l) && /^[A-Za-z0-9._+()-]+$/.test(String(d)))) { console.error("« dossiers » doit être {\"fr\":\"dossier\",\"en\":\"dossier\"} (noms de dossier sans espace) : " + JSON.stringify(j.dossiers)); process.exit(2); }
    }
    for (const champ of ["id", "nom", "dossier", "cible", "difficulte"]) if (!j || typeof j[champ] !== "string" || !j[champ]) { console.error("entrée invalide (champ « " + champ + " ») : " + JSON.stringify(j)); process.exit(2); }
    /* gain d'AP par progrès (facultatif) : { plafond, parUnite } nombres strictement positifs (AP bruts : plafond total du jeu, AP par unité de progrès ; voir design/SCUMMVM.md) ; chaque jeu a le sien */
    if (j.ap !== undefined) {
      if (typeof j.ap !== "object" || j.ap === null || Array.isArray(j.ap)) { console.error("« ap » doit être {\"plafond\":nombre,\"parUnite\":nombre} : " + JSON.stringify(j)); process.exit(2); }
      for (const champ of ["plafond", "parUnite"]) if (j.ap[champ] !== undefined && !(typeof j.ap[champ] === "number" && Number.isFinite(j.ap[champ]) && j.ap[champ] > 0)) { console.error("ap." + champ + " doit être un nombre strictement positif : " + JSON.stringify(j)); process.exit(2); }
    }
    if (!["normal", "evil", "sadistic"].includes(j.difficulte)) { console.error("difficulte inconnue : " + j.difficulte + " (normal, evil ou sadistic)"); process.exit(2); }
  }
  envoyer(src, "jeux.json");
  /* liste des dossiers de jeux (ScummVM lit jeux/index.json pour parcourir le dossier racine : sans elle « Chemin inexistant ») */
  const dossiers = {};
  for (const j of c.jeux) { dossiers[j.dossier] = {}; for (const d of Object.values(j.dossiers || {})) dossiers[d] = {}; }
  const tmpIndex = path.join(process.env.TEMP || process.env.TMPDIR || ".", "scummvm-jeux-index-" + process.pid + ".json");
  fs.writeFileSync(tmpIndex, JSON.stringify(dossiers));
  envoyer(tmpIndex, "jeux/index.json");
  fs.rmSync(tmpIndex, { force: true });
} else {
  console.error("commandes : moteur <dossier> | jeu <dossier> [--nom n] | catalogue <jeux.json>   (options : --local <dossier> --simuler)");
  process.exit(2);
}
