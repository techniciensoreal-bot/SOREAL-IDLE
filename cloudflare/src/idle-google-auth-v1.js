/*
 * SOREAL IDLE — vérification d'un jeton d'identité Google (« Se connecter avec Google », Google Identity Services).
 *
 * Norman (2026-09-26) : SOREAL IDLE doit pouvoir se jouer sans passer par APP / TV, en se connectant avec son compte Google. Le navigateur reçoit de Google un jeton
 * d'identité (JWT signé RS256) ; il n'est JAMAIS cru sur parole : le Worker vérifie ici la signature avec les clés publiques de Google, le destinataire (notre
 * identifiant client), l'émetteur, l'expiration et le fait que l'adresse est vérifiée. Aucun secret n'est nécessaire (l'identifiant client est public).
 */
const JWKS_URL_V1 = "https://www.googleapis.com/oauth2/v3/certs";
const EMETTEURS_V1 = ["https://accounts.google.com", "accounts.google.com"];
const TOLERANCE_HORLOGE_S_V1 = 60;
const CACHE_CLES_MS_V1 = 60 * 60 * 1000;

let cacheCles = null;

function base64urlVersOctetsV1(texte) {
  const propre = String(texte || "").replace(/-/g, "+").replace(/_/g, "/");
  const rempli = propre + "=".repeat((4 - (propre.length % 4)) % 4);
  const binaire = atob(rempli);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  return octets;
}

function jsonBase64urlV1(texte) {
  return JSON.parse(new TextDecoder().decode(base64urlVersOctetsV1(texte)));
}

async function clesGoogleV1(fetchImpl, force) {
  const maintenant = Date.now();
  if (!force && cacheCles && cacheCles.expire > maintenant) return cacheCles.cles;
  const reponse = await fetchImpl(JWKS_URL_V1, { headers: { accept: "application/json" } });
  if (!reponse.ok) throw new Error("GOOGLE_CLES_INDISPONIBLES");
  const donnees = await reponse.json();
  const cles = Array.isArray(donnees && donnees.keys) ? donnees.keys : [];
  if (!cles.length) throw new Error("GOOGLE_CLES_INDISPONIBLES");
  cacheCles = { cles, expire: maintenant + CACHE_CLES_MS_V1 };
  return cles;
}

export function reinitialiserCacheClesGoogleIdleV1() {
  cacheCles = null;
}

/*
 * Vérifie un jeton d'identité Google. Retourne { ok:true, email, nom, prenom, sub } ou { ok:false, code }.
 * options : { clientId, fetchImpl, maintenantS } (fetchImpl / maintenantS : pour les tests).
 */
export async function verifierJetonGoogleIdleV1(jeton, options = {}) {
  const clientId = String(options.clientId || "").trim();
  if (!clientId) return { ok: false, code: "GOOGLE_NON_CONFIGURE" };
  const morceaux = String(jeton || "").trim().split(".");
  if (morceaux.length !== 3 || morceaux.some((m) => !m) || String(jeton).length > 6000) return { ok: false, code: "GOOGLE_JETON_INVALIDE" };

  let entete;
  let charge;
  try {
    entete = jsonBase64urlV1(morceaux[0]);
    charge = jsonBase64urlV1(morceaux[1]);
  } catch (_) {
    return { ok: false, code: "GOOGLE_JETON_INVALIDE" };
  }
  if (!entete || entete.alg !== "RS256" || !entete.kid) return { ok: false, code: "GOOGLE_JETON_INVALIDE" };

  const fetchImpl = options.fetchImpl || fetch;
  let cle;
  try {
    let cles = await clesGoogleV1(fetchImpl, false);
    cle = cles.find((k) => k.kid === entete.kid);
    if (!cle) {
      cles = await clesGoogleV1(fetchImpl, true);
      cle = cles.find((k) => k.kid === entete.kid);
    }
  } catch (_) {
    return { ok: false, code: "GOOGLE_CLES_INDISPONIBLES" };
  }
  if (!cle) return { ok: false, code: "GOOGLE_JETON_INVALIDE" };

  let signatureValide = false;
  try {
    const cleImportee = await crypto.subtle.importKey(
      "jwk",
      { kty: cle.kty, n: cle.n, e: cle.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    signatureValide = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cleImportee,
      base64urlVersOctetsV1(morceaux[2]),
      new TextEncoder().encode(morceaux[0] + "." + morceaux[1])
    );
  } catch (_) {
    return { ok: false, code: "GOOGLE_JETON_INVALIDE" };
  }
  if (!signatureValide) return { ok: false, code: "GOOGLE_SIGNATURE_INVALIDE" };

  const maintenantS = Number.isFinite(options.maintenantS) ? options.maintenantS : Math.floor(Date.now() / 1000);
  if (!EMETTEURS_V1.includes(String(charge.iss || ""))) return { ok: false, code: "GOOGLE_EMETTEUR_INVALIDE" };
  const destinataires = Array.isArray(charge.aud) ? charge.aud : [charge.aud];
  if (!destinataires.includes(clientId)) return { ok: false, code: "GOOGLE_DESTINATAIRE_INVALIDE" };
  if (!Number.isFinite(charge.exp) || charge.exp + TOLERANCE_HORLOGE_S_V1 < maintenantS) return { ok: false, code: "GOOGLE_JETON_EXPIRE" };
  if (Number.isFinite(charge.nbf) && charge.nbf - TOLERANCE_HORLOGE_S_V1 > maintenantS) return { ok: false, code: "GOOGLE_JETON_INVALIDE" };
  const email = String(charge.email || "").trim().toLowerCase();
  if (!email || !email.includes("@") || charge.email_verified !== true) return { ok: false, code: "GOOGLE_EMAIL_NON_VERIFIE" };
  const sub = String(charge.sub || "").trim();
  if (!sub) return { ok: false, code: "GOOGLE_JETON_INVALIDE" };

  return {
    ok: true,
    email,
    sub,
    nom: String(charge.name || "").trim().slice(0, 80),
    prenom: String(charge.given_name || "").trim().slice(0, 40)
  };
}
