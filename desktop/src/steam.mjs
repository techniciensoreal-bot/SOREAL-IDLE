/*
 * Ajout de SOREAL IDLE à Steam comme « jeu non-Steam » (Norman, 2026-10-28) : une entrée dans userdata/<compte>/config/shortcuts.vdf (fichier binaire de Steam) et les images de la bibliothèque dans userdata/<compte>/config/grid/ :
 *   <id>p.png   affiche (600 x 900)        <id>.png   capsule large (920 x 430)        <id>_hero.png   bannière de la page du jeu (1920 x 620)
 * <id> = CRC32 de « "<exe>"<nom> » avec le bit de poids fort à 1 : c'est ainsi que Steam retrouve les images d'un raccourci. L'icône est un .ico rangé à côté des données du jeu.
 * Steam réécrit shortcuts.vdf en se fermant : il doit donc être FERMÉ pendant l'ajout (on ne le ferme jamais à sa place). Une sauvegarde de l'ancien fichier est faite une fois (shortcuts.vdf.soreal-sauvegarde).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const NOM_STEAM = "SOREAL IDLE";

/* ---------- CRC32 (identifiant du raccourci) ---------- */
const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(texte) {
  let c = 0xffffffff;
  for (const o of Buffer.from(String(texte), "utf8")) c = TABLE[(c ^ o) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
/* Identifiant d'un raccourci non-Steam : non signé (noms des images) ; signé 32 bits dans le fichier. */
export function identifiantRaccourci(exeEntreGuillemets, nom) {
  return (crc32(exeEntreGuillemets + nom) | 0x80000000) >>> 0;
}

/* ---------- VDF binaire : 0x00 table, 0x01 texte, 0x02 entier 32 bits, 0x08 fin ---------- */
/* Une table = liste ordonnée de { k, t, v } (t : 0 table, 1 texte, 2 entier) ; l'ordre est conservé à l'identique. */
export function lireVdf(tampon) {
  let p = 0;
  const texte = () => { const f = tampon.indexOf(0, p); if (f < 0) throw new Error("VDF_TRONQUE"); const s = tampon.toString("utf8", p, f); p = f + 1; return s; };
  function table() {
    const liste = [];
    for (;;) {
      if (p >= tampon.length) throw new Error("VDF_TRONQUE");
      const t = tampon[p++];
      if (t === 0x08) return liste;
      const k = texte();
      if (t === 0x00) liste.push({ k, t, v: table() });
      else if (t === 0x01) liste.push({ k, t, v: texte() });
      else if (t === 0x02) { liste.push({ k, t, v: tampon.readInt32LE(p) }); p += 4; }
      else throw new Error("VDF_TYPE_INCONNU_" + t);
    }
  }
  const racine = table();
  return racine;
}
export function ecrireVdf(racine) {
  const morceaux = [];
  const txt = (s) => morceaux.push(Buffer.from(String(s) + "\0", "utf8"));
  (function table(liste) {
    for (const e of liste) {
      morceaux.push(Buffer.from([e.t]));
      txt(e.k);
      if (e.t === 0x00) table(e.v);
      else if (e.t === 0x01) txt(e.v);
      else { const b = Buffer.alloc(4); b.writeInt32LE(e.v | 0, 0); morceaux.push(b); }
    }
    morceaux.push(Buffer.from([0x08]));
  })(racine);
  return Buffer.concat(morceaux);
}
const chaine = (k, v) => ({ k, t: 1, v });
const entier = (k, v) => ({ k, t: 2, v });
function entreeRaccourci({ id, nom, exe, dossier, icone }) {
  return [
    entier("appid", id | 0), chaine("AppName", nom), chaine("Exe", exe), chaine("StartDir", dossier), chaine("icon", icone || ""), chaine("ShortcutPath", ""),
    chaine("LaunchOptions", ""), entier("IsHidden", 0), entier("AllowDesktopConfig", 1), entier("AllowOverlay", 1), entier("OpenVR", 0), entier("Devkit", 0),
    chaine("DevkitGameID", ""), entier("DevkitOverrideAppID", 0), entier("LastPlayTime", 0), chaine("FlatpakAppID", ""), { k: "tags", t: 0, v: [] }
  ];
}

/* ---------- Steam sur ce PC ---------- */
export function dossierSteam(env = process.env) {
  if (env.SOREAL_STEAM_DIR) return fs.existsSync(env.SOREAL_STEAM_DIR) ? env.SOREAL_STEAM_DIR : null;
  const candidats = [];
  try {
    const sortie = execFileSync("reg", ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"], { encoding: "utf8", windowsHide: true });
    const m = sortie.match(/SteamPath\s+REG_SZ\s+(.+)/);
    if (m) candidats.push(m[1].trim());
  } catch (_e) { /* pas de clé : Steam n'est pas installé pour cet utilisateur */ }
  candidats.push("C:\\Program Files (x86)\\Steam", "C:\\Program Files\\Steam");
  for (const c of candidats) { if (c && fs.existsSync(path.join(c, "userdata"))) return path.normalize(c); }
  return null;
}
export function comptesSteam(steam) {
  try {
    return fs.readdirSync(path.join(steam, "userdata"), { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^\d+$/.test(e.name) && e.name !== "0")
      .map((e) => e.name);
  } catch (_e) { return []; }
}
export function steamEnCours(env = process.env) {
  if (env.SOREAL_STEAM_EN_COURS !== undefined) return env.SOREAL_STEAM_EN_COURS === "1";
  try {
    const sortie = execFileSync("tasklist", ["/FI", "IMAGENAME eq steam.exe", "/FO", "CSV", "/NH"], { encoding: "utf8", windowsHide: true });
    return /steam\.exe/i.test(sortie);
  } catch (_e) { return false; }
}

function lireRaccourcis(fichier) {
  if (!fs.existsSync(fichier)) return [{ k: "shortcuts", t: 0, v: [] }];
  const racine = lireVdf(fs.readFileSync(fichier));
  if (!racine.some((e) => e.k.toLowerCase() === "shortcuts" && e.t === 0)) racine.push({ k: "shortcuts", t: 0, v: [] });
  return racine;
}
const champ = (entree, nom) => { const e = entree.find((x) => x.k.toLowerCase() === nom.toLowerCase()); return e ? e.v : undefined; };

/* État affiché dans les Réglages. */
export function etatSteam({ exe, nom = NOM_STEAM }, env = process.env) {
  const steam = dossierSteam(env);
  if (!steam) return { ok: true, steam: false };
  const comptes = comptesSteam(steam);
  const cible = '"' + exe + '"';
  let dejaAjoute = false;
  for (const c of comptes) {
    try {
      const table = lireRaccourcis(path.join(steam, "userdata", c, "config", "shortcuts.vdf")).find((e) => e.k.toLowerCase() === "shortcuts");
      if (table.v.some((e) => champ(e.v, "AppName") === nom && champ(e.v, "Exe") === cible)) dejaAjoute = true;
    } catch (_e) { /* fichier illisible : on ne le touchera pas non plus à l'ajout */ }
  }
  return { ok: true, steam: true, comptes: comptes.length, enCours: steamEnCours(env), dejaAjoute };
}

/*
 * Ajoute (ou met à jour) le raccourci pour chaque compte Steam de ce PC.
 *   exe     chemin complet de SOREAL IDLE.exe
 *   icone   Buffer .ico ; images : { grille, portrait, hero } en Buffer PNG
 *   dossierIcone  où ranger l'icône (dossier de données du jeu)
 */
export function ajouterASteam({ exe, nom = NOM_STEAM, icone, images, dossierIcone }, env = process.env) {
  const steam = dossierSteam(env);
  if (!steam) return { ok: false, code: "STEAM_ABSENT" };
  if (steamEnCours(env)) return { ok: false, code: "STEAM_OUVERT" };
  const comptes = comptesSteam(steam);
  if (!comptes.length) return { ok: false, code: "STEAM_SANS_COMPTE" };
  const cible = '"' + exe + '"';
  const id = identifiantRaccourci(cible, nom);
  let fichierIcone = "";
  if (icone && dossierIcone) { fs.mkdirSync(dossierIcone, { recursive: true }); fichierIcone = path.join(dossierIcone, "soreal-idle.ico"); fs.writeFileSync(fichierIcone, icone); }
  const nouveau = entreeRaccourci({ id, nom, exe: cible, dossier: '"' + path.dirname(exe) + '"', icone: fichierIcone });
  const faits = [];
  for (const c of comptes) {
    const config = path.join(steam, "userdata", c, "config");
    const fichier = path.join(config, "shortcuts.vdf");
    let racine;
    try { racine = lireRaccourcis(fichier); } catch (e) { return { ok: false, code: "SHORTCUTS_ILLISIBLE", compte: c, detail: String(e && e.message || e) }; }
    fs.mkdirSync(config, { recursive: true });
    if (fs.existsSync(fichier) && !fs.existsSync(fichier + ".soreal-sauvegarde")) fs.copyFileSync(fichier, fichier + ".soreal-sauvegarde");
    const table = racine.find((e) => e.k.toLowerCase() === "shortcuts");
    const i = table.v.findIndex((e) => champ(e.v, "AppName") === nom && champ(e.v, "Exe") === cible);
    if (i >= 0) table.v[i] = { k: table.v[i].k, t: 0, v: nouveau };
    else {
      const suivant = table.v.reduce((m, e) => Math.max(m, Number(e.k) + 1 || 0), 0);
      table.v.push({ k: String(suivant), t: 0, v: nouveau });
    }
    /* écriture en deux temps : un fichier à moitié écrit ne remplace jamais celui de Steam */
    fs.writeFileSync(fichier + ".soreal-nouveau", ecrireVdf(racine));
    fs.renameSync(fichier + ".soreal-nouveau", fichier);
    const grid = path.join(config, "grid");
    fs.mkdirSync(grid, { recursive: true });
    const ecrire = (suffixe, tampon) => { if (tampon && tampon.length) fs.writeFileSync(path.join(grid, id + suffixe + ".png"), tampon); };
    ecrire("p", images && images.portrait);
    ecrire("", images && images.grille);
    ecrire("_hero", images && images.hero);
    faits.push(c);
  }
  return { ok: true, id, comptes: faits.length, misAJour: undefined };
}
