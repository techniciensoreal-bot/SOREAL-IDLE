/*
 * Contrôle d'accès par COMPTE à ScummVM / « Énigmes » (Norman, 2026-11-22 : « donne l'accès au jeu à mon compte uniquement » ; le jeu est un jeu du commerce :
 * aucun autre joueur ne doit pouvoir télécharger ses fichiers, même en connaissant l'adresse).
 *
 * LISTE D'ACCÈS : objet R2 `scummvm/acces.json` = {"admins":true,"comptes":["<adresse du compte>"],"tous":false}
 *   admins:true = l'administrateur (celui que reconnaît l'opération estAdminSorealIdle) ; comptes = adresses (minuscules) en plus ; tous:true = ouvert à tout le monde (plus tard).
 *   Absent, illisible ou invalide = PERSONNE. L'interrupteur général `scummvm/ouvert` reste le maître (absent = fermé pour tous). Mémo de 30 s dans l'isolat, jamais d'exception.
 * IDENTIFIANT DE COMPTE = l'adresse e-mail de la session, en minuscules (même identifiant que le profil de badavatar).
 * JETON DE FICHIERS : `base64url(charge).base64url(signature)`, charge {c: compte, e: expiration en secondes, a: 1 si le droit venait du drapeau « administrateur »}, signature HMAC-SHA256, durée 12 à 24 h (expiration arrondie à une borne de 12 h : même jeton pendant une tranche, cache du navigateur conservé).
 *   Le drapeau `a` permet de refuser un jeton d'administrateur dès que la liste passe à admins:false, sans relire la session à chaque fichier (le compte est relu dans la liste à chaque requête, mémo 30 s).
 * CLÉ : aucun secret de ticket ou de session n'est lisible depuis le Worker (jetons de session opaques, stockés dans le Durable Object) ; la clé est donc une clé aléatoire de 256 bits créée une fois par le Durable Object
 *   (idle_meta `scummvm_secret_v1`, route interne /__soreal-idle-v1/scummvm-secret, exclue des sauvegardes). Un secret Worker `SOREAL_IDLE_SCUMMVM_SECRET` (16 caractères au moins), s'il existe, est utilisé à sa place.
 */
import { idleScummvmOuvertV1 } from "./idle-scummvm-v1.js";
export const IDLE_SCUMMVM_CLE_ACCES_V1 ="scummvm/acces.json";
export const IDLE_SCUMMVM_JETON_DUREE_S_V1 = 12 * 3600;
const horloge = () => Date.now();   /* heure du Worker (hors du moteur de jeu) : mémos et expiration des jetons */
const MEMO_MS_V1 = 30000;
const MEMO_SECRET_MS_V1 = 600000;

const enc = new TextEncoder();
function versBase64url(octets) {
  let s = "";
  for (let i = 0; i < octets.length; i++) s += String.fromCharCode(octets[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function depuisBase64url(texte) {
  if (typeof texte !== "string" || !/^[A-Za-z0-9_-]+$/.test(texte)) return null;
  try {
    const b = atob(texte.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((texte.length + 3) % 4));
    const o = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i);
    return o;
  } catch (_e) { return null; }
}

/* ---------- liste d'accès ---------- */
const VIDE_V1 = Object.freeze({ admins: false, comptes: Object.freeze([]), tous: false });
let memoListe = { t: -1, valeur: VIDE_V1 };
export function idleScummvmOublierMemoAccesV1() { memoListe = { t: -1, valeur: VIDE_V1 }; memoSecret = { t: -1, valeur: "" }; }

/* Valide un contenu de acces.json : renvoie la liste normalisée ou null si invalide (type faux). Partagée avec l'outil d'envoi. */
export function idleScummvmNormaliserAccesV1(brut) {
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
  if (typeof brut.admins !== "boolean" || typeof brut.tous !== "boolean" || !Array.isArray(brut.comptes)) return null;
  if (brut.comptes.some((c) => typeof c !== "string" || !c.trim() || c.length > 200)) return null;
  return { admins: brut.admins, comptes: brut.comptes.map((c) => c.trim().toLowerCase()), tous: brut.tous };
}

export async function idleScummvmListeAccesV1(env, maintenant = horloge()) {
  if (maintenant - memoListe.t < MEMO_MS_V1 && maintenant >= memoListe.t) return memoListe.valeur;
  let valeur = VIDE_V1;
  try {
    if (env && env.SOREAL_R2 && typeof env.SOREAL_R2.get === "function") {
      const objet = await env.SOREAL_R2.get(IDLE_SCUMMVM_CLE_ACCES_V1);
      if (objet) valeur = idleScummvmNormaliserAccesV1(JSON.parse(await objet.text())) || VIDE_V1;
    }
  } catch (_e) { valeur = VIDE_V1; }
  memoListe = { t: maintenant, valeur };
  return valeur;
}

/* Interrupteur général : import circulaire avec idle-scummvm-v1.js, sans risque (les deux ne s'appellent qu'à l'exécution, jamais à l'évaluation du module). */
const masterOuvert = (env, maintenant) => idleScummvmOuvertV1(env, maintenant);

/*
 * Fonction partagée (aussi utilisée pour protéger les sauvegardes de ScummVM) : vrai si (interrupteur général ouvert) ET (tous OU (admins ET compte administrateur) OU compte dans la liste).
 * `utilisateur` = { email, emails?: string[], emailConnexion?: string, admin: boolean } : l'identité d'une session VÉRIFIÉE (le Worker l'obtient du Durable Object par
 * demanderIdentiteSessionV1 ci-dessous, qui fournit exactement cet objet ; `admin` = résultat de estAdminSorealIdle). Un objet sans adresse n'est jamais autorisé, sauf si `tous` est vrai ET qu'il y a une session.
 */
export async function idleScummvmCompteAutoriseV1(env, utilisateur, maintenant = horloge()) {
  try {
    if (!utilisateur || typeof utilisateur !== "object") return false;
    if (!(await masterOuvert(env, maintenant))) return false;
    const liste = await idleScummvmListeAccesV1(env, maintenant);
    if (liste.tous) return true;
    if (liste.admins && utilisateur.admin === true) return true;
    const adresses = [utilisateur.email, utilisateur.emailConnexion].concat(Array.isArray(utilisateur.emails) ? utilisateur.emails : []).map((e) => String(e || "").trim().toLowerCase()).filter(Boolean);
    return adresses.some((a) => liste.comptes.includes(a));
  } catch (_e) { return false; }
}

/* ---------- identité de la session (Durable Object) ---------- */
async function appelCoordinateur(env, chemin, corps) {
  if (!env || !env.SOREAL_IDLE) return null;
  const stub = env.SOREAL_IDLE.get(env.SOREAL_IDLE.idFromName("global"));
  const r = await stub.fetch(new Request(new URL(chemin, "https://soreal-idle.invalid"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps || {}) }));
  return r && r.ok ? r.json().catch(() => null) : null;
}
/* { ok, email, emails, admin } d'une session vérifiée par le serveur, ou null. */
export async function idleScummvmIdentiteSessionV1(env, sessionToken) {
  try {
    const j = await appelCoordinateur(env, "/__soreal-idle-v1/scummvm-acces", { sessionToken });
    return j && j.ok === true && typeof j.email === "string" && j.email ? { email: j.email, emails: Array.isArray(j.emails) ? j.emails : [j.email], admin: j.admin === true } : null;
  } catch (_e) { return null; }
}

/* ---------- jeton ---------- */
let memoSecret = { t: -1, valeur: "" };
export async function idleScummvmSecretV1(env, maintenant = horloge()) {
  const direct = env && typeof env.SOREAL_IDLE_SCUMMVM_SECRET === "string" ? env.SOREAL_IDLE_SCUMMVM_SECRET : "";
  if (direct.length >= 16) return direct;
  if (memoSecret.valeur && maintenant - memoSecret.t < MEMO_SECRET_MS_V1 && maintenant >= memoSecret.t) return memoSecret.valeur;
  try {
    const j = await appelCoordinateur(env, "/__soreal-idle-v1/scummvm-secret", {});
    const s = j && j.ok === true && typeof j.secret === "string" && j.secret.length >= 16 ? j.secret : "";
    memoSecret = { t: maintenant, valeur: s };
    return s;
  } catch (_e) { return ""; }
}
async function cleHmac(secret, usage) { return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]); }

export async function idleScummvmSignerJetonV1(env, compte, admin, maintenant = horloge()) {
  const secret = await idleScummvmSecretV1(env, maintenant);
  if (!secret || !compte) return null;
  /* Expiration arrondie à une borne de 12 h (la suivante après la fin de la tranche courante) : vie de 12 à 24 h, et le MÊME jeton (donc la même adresse, donc le cache du navigateur) pour un compte pendant toute une tranche. */
  const duree = IDLE_SCUMMVM_JETON_DUREE_S_V1;
  const expire = (Math.floor(maintenant / 1000 / duree) + 2) * duree;
  const charge = versBase64url(enc.encode(JSON.stringify(admin ? { c: String(compte).toLowerCase(), e: expire, a: 1 } : { c: String(compte).toLowerCase(), e: expire })));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await cleHmac(secret, "sign"), enc.encode(charge)));
  return { jeton: charge + "." + versBase64url(signature), expire };
}

/* Forme d'un jeton (segment d'URL) : deux blocs base64url séparés par un point. Sert aussi à reconnaître un segment de chemin « jeton ». */
export function idleScummvmFormeJetonV1(texte) { return typeof texte === "string" && texte.length <= 600 && /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{20,}$/.test(texte); }

/* Compte du jeton si la signature, l'expiration ET l'autorisation actuelle (interrupteur + liste) sont valides ; sinon null. Jamais d'exception. */
export async function idleScummvmVerifierJetonV1(env, jeton, maintenant = horloge()) {
  try {
    if (!idleScummvmFormeJetonV1(jeton)) return null;
    const [blocCharge, blocSignature] = jeton.split(".");
    const signature = depuisBase64url(blocSignature);
    const octetsCharge = depuisBase64url(blocCharge);
    if (!signature || !octetsCharge) return null;
    const secret = await idleScummvmSecretV1(env, maintenant);
    if (!secret) return null;
    if (!(await crypto.subtle.verify("HMAC", await cleHmac(secret, "verify"), signature, enc.encode(blocCharge)))) return null;
    const charge = JSON.parse(new TextDecoder().decode(octetsCharge));
    if (!charge || typeof charge.c !== "string" || !charge.c || !Number.isFinite(charge.e) || charge.e * 1000 <= maintenant) return null;
    const ok = await idleScummvmCompteAutoriseV1(env, { email: charge.c, admin: charge.a === 1 }, maintenant);
    return ok ? charge.c : null;
  } catch (_e) { return null; }
}
