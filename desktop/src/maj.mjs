/*
 * Mises à jour de SOREAL IDLE pour Windows (Norman, 2026-10-28 : « quand je mets à jour des images et des sons sur le R2, je propose une mise à jour que la personne voit en haut de la fenêtre ; elle ne retélécharge pas un exe : elle se fait dans la
 * fenêtre et le jeu se relance, comme VLC »).
 *
 * Ce qui se met à jour : le JEU (sources du serveur embarqué, pages, scripts, moteur : un paquet zip) et les MÉDIAS (images, voix, musiques : seulement les fichiers nouveaux ou modifiés). La coque Windows (main.js, preload.js) ne change pas : elle ne se
 * met à jour que par un nouvel installateur, rare.
 *
 * Publication (desktop/publier-maj.mjs, sur le PC de Norman) : un manifeste SIGNÉ (Ed25519) dans R2 (idle/_maj/manifeste.json) liste le paquet de code (idle/_maj/jeu-<empreinte>.zip, sha256) et chaque média (clé, taille, etag). L'application ne fait
 * confiance qu'à un manifeste dont la signature vaut pour la clé PUBLIQUE embarquée (desktop/maj-cle-publique.pem) : le code d'une mise à jour s'exécute dans l'application, personne d'autre que le propriétaire de la clé privée ne doit pouvoir en publier.
 *
 * Sur l'appareil (dossier de données de l'application, sous-dossier maj/) : etat.json (version installée, index des médias, couches), v<id>/ (un dossier par mise à jour : medias/ = fichiers changés, code/ = jeu complet). Au démarrage on lit les
 * couches de la plus récente à la plus ancienne, puis ce qui est embarqué dans l'installateur. Une mise à jour est écrite dans v<id>.partiel/ puis renommée : jamais à moitié installée.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { lireZip } from "./zip.mjs";

export const URL_PRODUCTION = "https://soreal-idle.technicien-soreal.workers.dev";
const FICHIERS_ESSENTIELS = ["cloudflare/src/idle-worker-entry-v1.js", "cloudflare/src/index-idle-coordinator-v1.js", "cloudflare/public/index.html"];

/* ---------- signature ---------- */
function canonique(v) {
  if (Array.isArray(v)) return "[" + v.map(canonique).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonique(v[k])).join(",") + "}";
  return JSON.stringify(v);
}
export function donneesASigner(manifeste) {
  const reste = Object.assign({}, manifeste);
  delete reste.signature;
  return Buffer.from(canonique(reste), "utf8");
}
export function signerManifeste(manifeste, clePriveePem) {
  return crypto.sign(null, donneesASigner(manifeste), clePriveePem).toString("base64");
}
export function signatureValide(manifeste, clePubliquePem) {
  try {
    if (!manifeste || typeof manifeste.signature !== "string" || !clePubliquePem) return false;
    return crypto.verify(null, donneesASigner(manifeste), clePubliquePem, Buffer.from(manifeste.signature, "base64"));
  } catch (_e) { return false; }
}

/* ---------- état local ---------- */
export function lireEtat(dossierMaj, embarque = {}) {
  let e = null;
  try { e = JSON.parse(fs.readFileSync(path.join(dossierMaj, "etat.json"), "utf8")); } catch (_e) { /* première fois */ }
  if (!e || typeof e !== "object") e = {};
  return {
    version: e.version || null, date: e.date || null,
    codeSha: e.codeSha || embarque.codeSha || null,
    codeDossier: e.codeDossier || null,
    mediaDossiers: Array.isArray(e.mediaDossiers) ? e.mediaDossiers : [],
    index: e.index && typeof e.index === "object" ? e.index : (embarque.index || {}),
    enAttente: e.enAttente || null,
    tentatives: Number(e.tentatives) || 0,
    precedent: e.precedent && typeof e.precedent === "object" ? e.precedent : null,
    refusees: Array.isArray(e.refusees) ? e.refusees : []
  };
}
export function ecrireEtat(dossierMaj, etat) {
  fs.mkdirSync(dossierMaj, { recursive: true });
  const f = path.join(dossierMaj, "etat.json");
  fs.writeFileSync(f + ".nouveau", JSON.stringify(etat));
  fs.renameSync(f + ".nouveau", f);
}

/* Couches actives : dossiers de la mise à jour installée qui sont complets (marqueur .ok). */
export function couchesActives(dossierMaj, etat) {
  const ok = (d) => d && fs.existsSync(path.join(dossierMaj, d, ".ok"));
  const code = etat.codeDossier && ok(etat.codeDossier) && FICHIERS_ESSENTIELS.every((f) => fs.existsSync(path.join(dossierMaj, etat.codeDossier, "code", ...f.split("/")))) ? path.join(dossierMaj, etat.codeDossier, "code") : null;
  const medias = etat.mediaDossiers.filter(ok).map((d) => path.join(dossierMaj, d, "medias")).reverse();   /* la plus récente d'abord */
  return { racineCode: code, dossiersMedias: medias };
}

/* ---------- ce qu'il y a à télécharger ---------- */
export function calculerDelta(manifeste, etat) {
  const codeChange = Boolean(manifeste.code && manifeste.code.sha256 && manifeste.code.sha256 !== etat.codeSha);
  const medias = [];
  for (const m of Array.isArray(manifeste.medias) ? manifeste.medias : []) {
    const [cle, taille, etag] = m;
    const l = etat.index[cle];
    if (!l || l[0] !== taille || l[1] !== etag) medias.push(m);
  }
  const octets = medias.reduce((s, m) => s + m[1], 0) + (codeChange ? manifeste.code.taille : 0);
  return { codeChange, medias, octets, nb: medias.length + (codeChange ? 1 : 0) };
}

function manifesteSain(m) {
  return m && m.v === 1 && typeof m.version === "string" && m.version.length <= 40 && Array.isArray(m.medias)
    && m.medias.every((x) => Array.isArray(x) && typeof x[0] === "string" && x[0].startsWith("idle/") && !x[0].split("/").some((seg) => seg === ".." || seg === "") && Number.isInteger(x[1]) && x[1] >= 0 && typeof x[2] === "string")
    && (!m.code || (typeof m.code.cle === "string" && m.code.cle.startsWith("idle/_maj/") && /^[0-9a-f]{64}$/.test(m.code.sha256) && Number.isInteger(m.code.taille)));
}

/* Interroge le serveur : { ok, disponible, manifeste, delta } ; { ok:false } sans réseau ou si le manifeste n'est pas celui du propriétaire. */
export async function verifierMaj({ urlBase = URL_PRODUCTION, clePublique, etat, delaiMs = 10000, fetchFn = fetch }) {
  try {
    const r = await fetchFn(urlBase + "/api/v1/maj/manifeste", { headers: { accept: "application/json" }, signal: AbortSignal.timeout(delaiMs), cache: "no-store" });
    if (!r.ok) return { ok: true, disponible: false };
    const m = await r.json();
    if (!manifesteSain(m)) return { ok: false, code: "MANIFESTE_INVALIDE" };
    if (!signatureValide(m, clePublique)) return { ok: false, code: "SIGNATURE_REFUSEE" };
    if (etat.refusees.includes(m.version)) return { ok: true, disponible: false };
    if (m.version === etat.version) return { ok: true, disponible: false };
    if (etat.date && m.date && Date.parse(m.date) < Date.parse(etat.date)) return { ok: true, disponible: false };   /* jamais de retour en arrière */
    const delta = calculerDelta(m, etat);
    if (!delta.nb) {
      /* rien à télécharger : la version est simplement notée (pas de bandeau) */
      return { ok: true, disponible: false, rienAFaire: true, manifeste: m };
    }
    return { ok: true, disponible: true, manifeste: m, delta };
  } catch (_e) {
    return { ok: false, code: "HORS_LIGNE" };
  }
}

const md5 = (b) => crypto.createHash("md5").update(b).digest("hex");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

/*
 * Télécharge et installe : tout dans v<id>.partiel/, vérifié (taille, md5 quand l'etag en est un, sha256 du paquet), puis renommé en v<id>/ et inscrit dans etat.json.
 * progression({ fait, total, octets, octetsTotal }) est appelée à chaque fichier.
 */
export async function installerMaj({ urlBase = URL_PRODUCTION, manifeste, delta, dossierMaj, etat, progression = () => {}, fetchFn = fetch, simultanes = 4 }) {
  const id = "v" + manifeste.version.replace(/[^0-9A-Za-z]/g, "");
  const final = path.join(dossierMaj, id), partiel = final + ".partiel";
  fs.rmSync(partiel, { recursive: true, force: true });
  fs.rmSync(final, { recursive: true, force: true });
  fs.mkdirSync(path.join(partiel, "medias"), { recursive: true });
  const lire = async (cle) => {
    for (let essai = 1; ; essai += 1) {
      try {
        const r = await fetchFn(urlBase + "/api/v1/maj/fichier?cle=" + encodeURIComponent(cle), { signal: AbortSignal.timeout(120000), cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return Buffer.from(await r.arrayBuffer());
      } catch (e) { if (essai >= 3) throw new Error("TELECHARGEMENT_ECHEC:" + cle + ":" + (e && e.message || e)); await new Promise((ok) => setTimeout(ok, 400 * essai)); }
    }
  };
  let fait = 0, octets = 0;
  const total = delta.nb;
  const avance = (n) => { fait += 1; octets += n; progression({ fait, total, octets, octetsTotal: delta.octets }); };
  try {
    if (delta.codeChange) {
      const zip = await lire(manifeste.code.cle);
      if (zip.length !== manifeste.code.taille || sha256(zip) !== manifeste.code.sha256) throw new Error("PAQUET_CORROMPU");
      for (const e of lireZip(zip)) {
        const dest = path.join(partiel, "code", ...e.nom.split("/"));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, e.donnees);
      }
      for (const f of FICHIERS_ESSENTIELS) if (!fs.existsSync(path.join(partiel, "code", ...f.split("/")))) throw new Error("PAQUET_INCOMPLET:" + f);
      avance(zip.length);
    }
    let i = 0;
    const ouvrier = async () => {
      for (;;) {
        const m = delta.medias[i++];
        if (!m) return;
        const [cle, taille, etag] = m;
        const donnees = await lire(cle);
        if (donnees.length !== taille) throw new Error("TAILLE_INATTENDUE:" + cle);
        if (/^[0-9a-f]{32}$/.test(etag) && md5(donnees) !== etag) throw new Error("EMPREINTE_INATTENDUE:" + cle);
        const dest = path.join(partiel, "medias", ...cle.split("/"));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, donnees);
        avance(taille);
      }
    };
    await Promise.all(Array.from({ length: simultanes }, ouvrier));
  } catch (e) {
    fs.rmSync(partiel, { recursive: true, force: true });
    throw e;
  }
  fs.writeFileSync(path.join(partiel, ".ok"), manifeste.version);
  fs.renameSync(partiel, final);
  /* inscription : l'index devient celui du manifeste (ce que l'appareil possède maintenant) */
  const index = Object.assign({}, etat.index);
  for (const m of manifeste.medias) index[m[0]] = [m[1], m[2]];
  const nouveau = Object.assign({}, etat, {
    version: manifeste.version, date: manifeste.date || null, index,
    codeSha: delta.codeChange ? manifeste.code.sha256 : etat.codeSha,
    codeDossier: delta.codeChange ? id : etat.codeDossier,
    mediaDossiers: delta.medias.length ? etat.mediaDossiers.concat(id) : etat.mediaDossiers,
    enAttente: manifeste.version, tentatives: 0,
    /* de quoi revenir en arrière si le jeu ne démarre pas avec cette mise à jour (voir revenirEnArriere) */
    precedent: { version: etat.version, date: etat.date, codeSha: etat.codeSha, codeDossier: etat.codeDossier, mediaDossiers: etat.mediaDossiers, index: etat.index }
  });
  ecrireEtat(dossierMaj, nouveau);
  /* ménage : on ne garde que le code installé et le précédent ; les dossiers de médias restent (couches) */
  try {
    for (const d of fs.readdirSync(dossierMaj)) {
      if (d.endsWith(".partiel")) fs.rmSync(path.join(dossierMaj, d), { recursive: true, force: true });
    }
  } catch (_e) { /* ménage facultatif */ }
  return nouveau;
}

/* Le jeu a démarré et sa page s'est chargée avec la mise à jour : elle est validée. */
export function validerMaj(dossierMaj, etat) {
  if (!etat.enAttente) return etat;
  const nouveau = Object.assign({}, etat, { enAttente: null, tentatives: 0, precedent: null });
  ecrireEtat(dossierMaj, nouveau);
  return nouveau;
}
/* Le jeu n'a pas démarré avec la mise à jour (ou la page ne s'est pas chargée) : retour à l'état d'avant, et cette version n'est plus proposée. */
export function revenirEnArriere(dossierMaj, etat) {
  const p = etat.precedent;
  const nouveau = Object.assign({}, etat, {
    version: p ? p.version : null, date: p ? p.date : null, codeSha: p ? p.codeSha : null, codeDossier: p ? p.codeDossier : null,
    mediaDossiers: p ? p.mediaDossiers : [], index: p ? p.index : undefined,
    refusees: etat.enAttente ? etat.refusees.concat(etat.enAttente) : etat.refusees, enAttente: null, tentatives: 0, precedent: null
  });
  ecrireEtat(dossierMaj, nouveau);
  return nouveau;
}
