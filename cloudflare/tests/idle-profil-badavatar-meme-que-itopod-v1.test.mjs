import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { idleBadavatarCleNomV1, idleBadavatarEnregistrerV1, idleBadavatarLireV1, idleBadavatarMigrerNomV1 } from "../src/idle-profil-badavatar-v1.js";
import { idleItopodNomRosterV1, idleItopodNomRosterParEmailV1, idleItopodRosterV1 } from "../src/idle-itopod-roster-v1.js";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

/*
 * Norman, 2026-11-01 : « le badavatar désigné dans Réglages > Profil n'est pas celui que je voyais dans l'ITOPOD ».
 * Le Profil et l'ITOPOD tirent le visage par le MÊME code (tirerPourNom + appliquerProfil + rendreHtml) : ils ne peuvent différer que par le NOM donné. Ce test (1) prouve que, pour un même nom,
 * les deux chemins donnent exactement le même rendu ; (2) prouve que le nom du serveur (clé du Profil) est celui du roster, y compris pour un nom de plus de 40 caractères et un nom d'équipe
 * différent du prénom de session ; (3) vérifie la migration d'un profil enregistré sous un mauvais nom ; (4) garde les visages existants inchangés.
 */
const fenetre = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-catalogue-v1.js", "utf8"), { window: fenetre });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8"), { window: fenetre, Math, String, Object });
const B = fenetre.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__;

const NOMS = ["Afflito", "Alessandro", "Alexis", "Anne-Sophie", "Antonio", "Baalrogh", "Bayron", "Dany", "Dylan", "Dylan J.", "Eugène", "Franz", "Hommoursporc", "Jérôme", "Jonathan", "Justine", "Keeny", "La Brute", "Lefebvre", "Lorenzo", "Marco", "Massimo", "Maxence", "Mickaël", "Moamin", "Norman", "Sébastien", "Stéphane", "Sylvain", "Todd"];
const EXTERNES = ["Norman (B)", "  Élodie   DUPONT ", "Jean-Marc de la Fontaine-Saint-Exupéry-Beauregard Junior", "ÉCLAIR", "x".repeat(60)];

/* (4) non-régression : tirerPourNom(nom) est inchangé pour les noms du roster (empreinte relevée avant ce correctif) */
const empreinte = createHash("sha256").update(NOMS.map((n) => JSON.stringify(B.tirerPourNom(n))).join("|")).digest("hex");
assert.equal(empreinte, "c7d93a01d2cad5274a2030ab6ddb4412a317745115737d4cfa9099a3e957356a", "le visage d'un nom du roster ne doit JAMAIS changer");

/* (1) + (2) pour chaque nom du roster : chemin ITOPOD (nom du roster) contre chemin Profil (clé calculée par le serveur, puis base -> tirerPourNom -> appliquerProfil d'un profil vide) */
for (const nomRoster of NOMS.concat(EXTERNES.map(idleItopodNomRosterV1))) {
  const itopod = B.rendreHtml(B.tirerPourNom(nomRoster), {});
  const nomCleServeur = idleBadavatarCleNomV1(idleItopodNomRosterV1(nomRoster));
  assert.equal(nomCleServeur, B.nomNormalise(nomRoster), "clé du Profil = clé du client pour " + nomRoster);
  const profil = B.rendreHtml(B.appliquerProfil(B.tirerPourNom(nomCleServeur), { pieces: {} }), {});
  assert.equal(profil, itopod, "même corps, mêmes pièces, mêmes positions finales pour " + nomRoster);
  assert.deepEqual(B.tirerPourNom(nomCleServeur), B.tirerPourNom(nomRoster));
}

/* Un nom de plus de 40 caractères : le roster le coupe à 40, le Profil aussi (avant : coupé à 60 sur le texte normalisé, donc un autre visage) */
const long = "Jean-Marc de la Fontaine-Saint-Exupéry-Beauregard Junior";
const rosterLong = idleItopodRosterV1({ parEmail: { "a@x.fr": { nom: long } } }).find((w) => w.nom !== "Norman" && w.nom !== "Sébastien").nom;
assert.equal(rosterLong, idleItopodNomRosterV1(long));
assert.equal(rosterLong.length, 40);
assert.notEqual(B.nomNormalise(long), B.nomNormalise(rosterLong), "sans la coupure, la graine diffère");
assert.equal(idleBadavatarCleNomV1(idleItopodNomRosterV1(long)), B.nomNormalise(rosterLong));

/* Le nom d'un ouvrier vient du MÊME champ que le roster (nom du profil d'équipe de TV), retrouvé par l'adresse */
const cosmetiques = { parEmail: { "Dylan@Soreal.test": { nom: "Dylan J." }, "bienvenue@x.fr": { nom: "Bienvenue" } } };
assert.equal(idleItopodNomRosterParEmailV1(cosmetiques, ["autre@x.fr", "dylan@soreal.test"]), "Dylan J.");
assert.equal(idleItopodNomRosterParEmailV1(cosmetiques, "bienvenue@x.fr"), "", "profil d'accueil exclu comme dans le roster");
assert.equal(idleItopodNomRosterParEmailV1(null, "a@x.fr"), "");
assert.ok(idleItopodRosterV1(cosmetiques).some((w) => w.nom === "Dylan J."));

/* (2) par le coordinateur : prénom de session « Dylan », nom d'équipe « Dylan J. » -> le Profil désigne « dylan j. » (= l'ITOPOD) ; sans TV : repli sur le prénom */
async function coordinateur(env) {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, env);
  const appel = async (corps) => (await coord.internal(new Request("https://soreal-idle.invalid/__soreal-idle-v1/badavatar-moi", { method: "POST", body: JSON.stringify(corps) }), new URL("https://soreal-idle.invalid/__soreal-idle-v1/badavatar-moi"))).json();
  const session = (user) => {
    const jeton = "ils_test_" + Math.random().toString(16).slice(2);
    sql.exec("INSERT INTO idle_sessions(session_token,user_json,created_at,expires_at,revoked_at) VALUES(?,?,?,?,NULL)", jeton, JSON.stringify(user), Date.now(), Date.now() + 3600000);
    return jeton;
  };
  return { sql, appel, session };
}
const tvAvec = { SOREAL_TV_API: { fetch: async () => Response.json(cosmetiques) } };
{
  const { appel, session } = await coordinateur(tvAvec);
  const t = session({ email: "dylan@soreal.test", emails: ["dylan@soreal.test"], prenom: "Dylan", role: "ouvrier" });
  const moi = await appel({ sessionToken: t, action: "lire" });
  assert.equal(moi.nomCle, "dylan j.", "le nom d'équipe du roster l'emporte sur le prénom de session");
  const t2 = session({ email: "inconnu@soreal.test", emails: ["inconnu@soreal.test"], prenom: "Sébastien", role: "ouvrier" });
  assert.equal((await appel({ sessionToken: t2, action: "lire" })).nomCle, "sebastien", "adresse absente de TV : prénom de session");
}
/* TV injoignable (cache expiré ou non) : repli sur le prénom, jamais d'erreur */
{
  const { appel, session } = await coordinateur({});
  const t = session({ email: "z@soreal.test", emails: ["z@soreal.test"], prenom: "Zoé", role: "ouvrier" });
  assert.equal((await appel({ sessionToken: t, action: "lire" })).nomCle, "zoe");
}

/* (3) migration d'un profil déjà enregistré sous un mauvais nom */
{
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  const neutre = { Nez: { visible: true, dx: 0, dy: 0, k: 1, rot: 0 } };
  const touche = { Nez: { visible: true, dx: 0.05, dy: 0, k: 1, rot: 0 } };
  idleBadavatarEnregistrerV1(sql, "a@x.fr", "faux nom", { pieces: neutre, cat: "1" });
  idleBadavatarEnregistrerV1(sql, "b@x.fr", "faux nom b", { pieces: touche, cat: "1" });
  assert.equal(idleBadavatarMigrerNomV1(sql, "a@x.fr", "vrai nom"), true);
  assert.equal(idleBadavatarLireV1(sql, "a@x.fr").base, "vrai nom", "rien de personnalisé : la base suit le roster");
  assert.equal(idleBadavatarLireV1(sql, "a@x.fr").nomCle, "vrai nom");
  assert.equal(idleBadavatarMigrerNomV1(sql, "b@x.fr", "vrai nom b"), true);
  assert.equal(idleBadavatarLireV1(sql, "b@x.fr").base, "faux nom b", "pièces déplacées : sa base est gardée");
  assert.equal(idleBadavatarLireV1(sql, "b@x.fr").nomCle, "vrai nom b", "mais la clé publique suit le roster (c'est elle que l'ITOPOD cherche)");
  assert.equal(idleBadavatarMigrerNomV1(sql, "a@x.fr", "vrai nom"), false, "idempotent");
  assert.equal(idleBadavatarMigrerNomV1(sql, "absent@x.fr", "x"), false);
  /* un visage personnalisé compte comme une personnalisation */
  const png = "data:image/png;base64," + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(60, 2)]).toString("base64");
  idleBadavatarEnregistrerV1(sql, "c@x.fr", "faux c", { pieces: neutre, cat: "1", photo: { visible: true, x: 0, y: 0, k: 1, rot: 0, image: png } });
  idleBadavatarMigrerNomV1(sql, "c@x.fr", "vrai c");
  assert.equal(idleBadavatarLireV1(sql, "c@x.fr").base, "faux c");
}

console.log("idle-profil-badavatar-meme-que-itopod-v1: ok");
