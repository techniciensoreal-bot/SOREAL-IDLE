/* Accès par COMPTE à ScummVM (idle-scummvm-acces-v1.js, Norman 2026-11-22) : liste d'accès R2 (scummvm/acces.json) et jeton signé de fichiers. */
import assert from "node:assert/strict";
import { idleScummvmCompteAutoriseV1, idleScummvmFormeJetonV1, idleScummvmListeAccesV1, idleScummvmNormaliserAccesV1, idleScummvmOublierMemoAccesV1, idleScummvmSecretV1, idleScummvmSignerJetonV1, idleScummvmVerifierJetonV1 } from "../src/idle-scummvm-acces-v1.js";
import { idleScummvmOublierMemoV1 } from "../src/idle-scummvm-v1.js";

/* R2 simulé : objets modifiables ; get() compte les lectures de acces.json */
function fauxEnv(objets, extra = {}) {
  const stats = { lecturesAcces: 0 };
  return {
    stats, objets,
    SOREAL_IDLE_SCUMMVM_SECRET: "secret-de-test-0123456789abcdef",
    SOREAL_R2: {
      async head(cle) { return cle in objets ? { size: String(objets[cle]).length } : null; },
      async get(cle) { if (cle === "scummvm/acces.json") stats.lecturesAcces++; if (!(cle in objets)) return null; const v = objets[cle]; return { async text() { if (v instanceof Error) throw v; return String(v); } }; }
    },
    ...extra
  };
}
const reinit = () => { idleScummvmOublierMemoAccesV1(); idleScummvmOublierMemoV1(); };
const OUVERT = { "scummvm/ouvert": "1" };
const acces = (o) => JSON.stringify(o);
const NORMAN = { email: "norman@exemple.test", admin: true };
const AUTRE = { email: "autre@exemple.test", admin: false };

// 1. normalisation / validation (partagée avec l'outil d'envoi)
assert.deepEqual(idleScummvmNormaliserAccesV1({ admins: true, comptes: [" A@B.test "], tous: false }), { admins: true, comptes: ["a@b.test"], tous: false });
for (const mauvais of [null, [], "x", {}, { admins: "oui", comptes: [], tous: false }, { admins: true, comptes: "a", tous: false }, { admins: true, comptes: [1], tous: false }, { admins: true, comptes: [""], tous: false }, { admins: true, comptes: [], tous: 1 }, { admins: true, comptes: [] }]) {
  assert.equal(idleScummvmNormaliserAccesV1(mauvais), null, "invalide : " + JSON.stringify(mauvais));
}

// 2. décisions
{
  reinit();
  let env = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: true, comptes: [], tous: false }) });
  assert.equal(await idleScummvmCompteAutoriseV1(env, NORMAN), true, "administrateur : autorisé (admins:true)");
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE), false, "un autre joueur : refusé");
  assert.equal(await idleScummvmCompteAutoriseV1(env, { email: "norman@exemple.test", admin: false }), false, "même adresse sans preuve d'administrateur : refusé");
  assert.equal(await idleScummvmCompteAutoriseV1(env, null), false);
  assert.equal(await idleScummvmCompteAutoriseV1(env, {}), false, "pas d'adresse : refusé");

  reinit();
  env = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: false, comptes: ["Autre@Exemple.test"], tous: false }) });
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE), true, "compte listé (casse ignorée)");
  assert.equal(await idleScummvmCompteAutoriseV1(env, { email: "x@y.test", emails: ["autre@exemple.test"], admin: false }), true, "une des adresses du compte suffit");
  assert.equal(await idleScummvmCompteAutoriseV1(env, NORMAN), false, "admins:false : l'administrateur n'est pas listé = refusé");
  assert.equal(await idleScummvmCompteAutoriseV1(env, { email: "tiers@exemple.test", admin: false }), false);

  reinit();
  env = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: false, comptes: [], tous: true }) });
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE), true, "tous:true : ouvert à tout compte connecté");

  reinit();
  env = fauxEnv({ ...OUVERT });
  assert.equal(await idleScummvmCompteAutoriseV1(env, NORMAN), false, "acces.json absent = personne, même l'administrateur");
  for (const corrompu of ["pas du json", "{", "[]", acces({ admins: true }), acces({ admins: "oui", comptes: [], tous: false })]) {
    reinit(); env = fauxEnv({ ...OUVERT, "scummvm/acces.json": corrompu });
    assert.equal(await idleScummvmCompteAutoriseV1(env, NORMAN), false, "illisible = personne : " + corrompu.slice(0, 20));
  }
  reinit(); env = fauxEnv({ ...OUVERT, "scummvm/acces.json": new Error("panne R2") });
  assert.equal(await idleScummvmCompteAutoriseV1(env, NORMAN), false, "erreur R2 : personne, jamais d'exception");
  assert.equal(await idleScummvmCompteAutoriseV1({}, NORMAN), false, "pas de R2 : personne");
  assert.equal(await idleScummvmCompteAutoriseV1(undefined, NORMAN), false);

  // interrupteur général = maître
  reinit();
  env = fauxEnv({ "scummvm/acces.json": acces({ admins: true, comptes: ["autre@exemple.test"], tous: true }) });
  assert.equal(await idleScummvmCompteAutoriseV1(env, NORMAN), false, "scummvm/ouvert absent : fermé pour tous, même avec tous:true");
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE), false);
}

// 3. mémo de 30 s : un changement de liste est vu après 30 s, jamais avant ; jamais plus d'une lecture par fenêtre
{
  reinit();
  const env = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: true, comptes: [], tous: false }) });
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE, 5_000_000), false);
  env.objets["scummvm/acces.json"] = acces({ admins: true, comptes: ["autre@exemple.test"], tous: false });
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE, 5_010_000), false, "mémo : pas encore vu");
  assert.equal(env.stats.lecturesAcces, 1, "une seule lecture dans la fenêtre");
  assert.equal(await idleScummvmCompteAutoriseV1(env, AUTRE, 5_031_000), true, "après 30 s : vu");
  assert.equal((await idleScummvmListeAccesV1(env, 5_031_500)).comptes[0], "autre@exemple.test");
}

// 4. jeton : forme, signature, expiration, altération, compte retiré de la liste
{
  reinit();
  const env = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: true, comptes: ["autre@exemple.test"], tous: false }) });
  const t0 = 1_700_000_000_000;
  const s = await idleScummvmSignerJetonV1(env, "Norman@Exemple.test", true, t0);
  assert.ok(s && s.jeton, "jeton émis");
  assert.ok(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s.jeton), "caractères sûrs pour un segment d'URL : " + s.jeton);
  assert.ok(idleScummvmFormeJetonV1(s.jeton));
  const charge = JSON.parse(Buffer.from(s.jeton.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
  assert.equal(charge.c, "norman@exemple.test", "charge : compte en minuscules");
  assert.equal(charge.e, s.expire, "charge : expiration en secondes");
  const duree = s.expire - t0 / 1000;
  assert.ok(duree >= 12 * 3600 && duree <= 24 * 3600, "vie de 12 à 24 h : " + duree);
  assert.deepEqual(await idleScummvmSignerJetonV1(env, "norman@exemple.test", true, t0 + 60_000), s, "même jeton dans la même tranche (cache du navigateur)");
  assert.equal(await idleScummvmVerifierJetonV1(env, s.jeton, t0 + 1000), "norman@exemple.test", "jeton valide");
  assert.equal(await idleScummvmVerifierJetonV1(env, s.jeton, s.expire * 1000 - 1), "norman@exemple.test", "valide jusqu'à l'expiration");
  assert.equal(await idleScummvmVerifierJetonV1(env, s.jeton, s.expire * 1000 + 1), null, "expiré");
  // altération d'un octet (charge ou signature) : refusé
  const [c, sig] = s.jeton.split(".");
  const permuter = (t, i) => t.slice(0, i) + (t[i] === "A" ? "B" : "A") + t.slice(i + 1);
  for (const faux of [permuter(c, 3) + "." + sig, c + "." + permuter(sig, 5), c + "." + sig.slice(0, -2), c + "x." + sig, c + "." + sig + "AA"]) {
    assert.equal(await idleScummvmVerifierJetonV1(env, faux, t0 + 1000), null, "altéré refusé : " + faux.slice(0, 30));
  }
  // charge forgée avec une autre clé
  const autre = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: true, comptes: [], tous: true }) }, { SOREAL_IDLE_SCUMMVM_SECRET: "une-autre-cle-secrete-0123456789" });
  const forge = await idleScummvmSignerJetonV1(autre, "intrus@exemple.test", false, t0);
  assert.equal(await idleScummvmVerifierJetonV1(env, forge.jeton, t0 + 1000), null, "signé avec une autre clé : refusé");
  // mauvais formats
  for (const mauvais of ["", "abc", "a.b", "....", null, undefined, 42, "x".repeat(700) + "." + "y".repeat(40), "pas un jeton.sig sig", "../a.b"]) {
    assert.equal(await idleScummvmVerifierJetonV1(env, mauvais, t0), null, "format refusé : " + String(mauvais).slice(0, 20));
  }
  // compte retiré de la liste : 404 en moins de 30 s + mémo
  const sa = await idleScummvmSignerJetonV1(env, "autre@exemple.test", false, t0);
  assert.equal(await idleScummvmVerifierJetonV1(env, sa.jeton, t0 + 1000), "autre@exemple.test");
  env.objets["scummvm/acces.json"] = acces({ admins: true, comptes: [], tous: false });
  assert.equal(await idleScummvmVerifierJetonV1(env, sa.jeton, t0 + 20_000), "autre@exemple.test", "mémo de 30 s");
  assert.equal(await idleScummvmVerifierJetonV1(env, sa.jeton, t0 + 31_000), null, "compte retiré de la liste : refusé");
  // administrateur : refusé dès admins:false ; interrupteur général fermé : refusé
  assert.equal(await idleScummvmVerifierJetonV1(env, s.jeton, t0 + 31_000), "norman@exemple.test", "administrateur : toujours accepté avec admins:true");
  env.objets["scummvm/acces.json"] = acces({ admins: false, comptes: [], tous: false });
  assert.equal(await idleScummvmVerifierJetonV1(env, s.jeton, t0 + 70_000), null, "admins:false : jeton d'administrateur refusé");
  env.objets["scummvm/acces.json"] = acces({ admins: true, comptes: [], tous: false });
  delete env.objets["scummvm/ouvert"];
  assert.equal(await idleScummvmVerifierJetonV1(env, s.jeton, t0 + 110_000), null, "interrupteur général fermé : refusé");
}

// 5. clé : secret Worker s'il existe, sinon le Durable Object ; jamais de jeton sans clé
{
  reinit();
  const env = fauxEnv({ ...OUVERT, "scummvm/acces.json": acces({ admins: true, comptes: [], tous: false }) }, { SOREAL_IDLE_SCUMMVM_SECRET: undefined });
  assert.equal(await idleScummvmSignerJetonV1(env, "norman@exemple.test", true), null, "aucune clé disponible : aucun jeton");
  let appels = 0;
  env.SOREAL_IDLE = { idFromName: () => "id", get: () => ({ fetch: async (rq) => { appels++; assert.ok(new URL(rq.url).pathname === "/__soreal-idle-v1/scummvm-secret"); return Response.json({ ok: true, secret: "a".repeat(64) }); } }) };
  assert.equal(await idleScummvmSecretV1(env, 1_000), "a".repeat(64));
  assert.equal(await idleScummvmSecretV1(env, 2_000), "a".repeat(64));
  assert.equal(appels, 1, "clé mémorisée");
  assert.ok(await idleScummvmSignerJetonV1(env, "norman@exemple.test", true), "jeton signé avec la clé du Durable Object");
  reinit();
  env.SOREAL_IDLE = { idFromName: () => "id", get: () => ({ fetch: async () => { throw new Error("panne"); } }) };
  assert.equal(await idleScummvmSecretV1(env), "", "panne du Durable Object : pas de clé, jamais d'exception");
}

console.log("idle-scummvm-acces-liste-v1: OK");
