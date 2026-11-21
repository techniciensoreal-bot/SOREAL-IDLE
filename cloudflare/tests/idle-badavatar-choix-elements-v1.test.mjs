import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";
import { idleBadavatarValiderChoixV1, idleBadavatarEnregistrerV1, idleBadavatarLireV1, idleBadavatarListePubliqueV1, idleBadavatarMigrerNomV1 } from "../src/idle-profil-badavatar-v1.js";
import { idleItopodImagePartageeV1 } from "../src/idle-itopod-roster-v1.js";

/*
 * Norman (2026-11-21) : « pour les badavatars, je veux qu'on puisse choisir parmi les éléments disponibles : accessoires, vêtements… tout pareil que sur Soreal TV ; un badavatar est créé de base au hasard comme actuellement,
 * mais au moment de le modifier on peut choisir parmi tous les éléments ». Serveur : choix validé et rangé ; client : composer() ; images : shared/badavatars/ servi pour les éléments choisis.
 */
const B0 = "shared/badavatars/";
const homme = B0 + "Body_Homme/Image ChatGPT 13 oct. 2026, 16_38_44-1.webp";
const chapeau = B0 + "Accessoires/accessoire_haut_de_forme_noir.webp";
const pull = B0 + "Vetements/pull_noel.webp";
const oreille = B0 + "Oreilles/Droite/Image ChatGPT 13 oct. 2026, 17_10_29-1_droite.webp";

/* ---- validation : forme des clés, dossier de la catégorie, null = aucun élément ---- */
assert.deepEqual(idleBadavatarValiderChoixV1(undefined), { ok: true, choix: null });
assert.deepEqual(idleBadavatarValiderChoixV1({ pieces: {} }), { ok: true, choix: null }, "un choix vide n'est pas gardé");
{
  const r = idleBadavatarValiderChoixV1({ corps: homme, pieces: { Accessoires: chapeau, Vetements: pull, Barbe: null, Oreille_Droite: oreille, Oreille_Gauche: oreille } });
  assert.equal(r.ok, true);
  assert.equal(r.choix.pieces.Barbe, null, "null = la catégorie n'a aucun élément");
}
for (const [nom, brut, code] of [
  ["catégorie inconnue", { pieces: { Chapeau: chapeau } }, "BADAVATAR_PIECE_INCONNUE"],
  ["clé d'un autre dossier", { pieces: { Vetements: chapeau } }, "BADAVATAR_CHOIX_PIECE"],
  ["remontée de dossier", { pieces: { Vetements: B0 + "Vetements/../Accessoires/x.webp" } }, "BADAVATAR_CHOIX_PIECE"],
  ["hors du dossier partagé", { pieces: { Vetements: "idle/badavatars/Vetements/a.webp" } }, "BADAVATAR_CHOIX_PIECE"],
  ["extension", { pieces: { Vetements: B0 + "Vetements/a.exe" } }, "BADAVATAR_CHOIX_PIECE"],
  ["adresse", { pieces: { Vetements: B0 + "Vetements/a.webp?x=1" } }, "BADAVATAR_CHOIX_PIECE"],
  ["corps qui n'est pas un corps", { corps: chapeau }, "BADAVATAR_CHOIX_CORPS"],
  ["oreille hors du dossier des oreilles", { pieces: { Oreille_Droite: pull } }, "BADAVATAR_CHOIX_PIECE"],
  ["liste au lieu d'un objet", { pieces: [] }, "BADAVATAR_CHOIX"]
]) assert.equal(idleBadavatarValiderChoixV1(brut).code, code, nom);
assert.equal(idleBadavatarValiderChoixV1("x").ok, false);

/* ---- enregistrement, lecture, liste publique ; ancienne table sans colonne « choix » ---- */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE idle_badavatar_profils(email TEXT PRIMARY KEY, nom_cle TEXT NOT NULL, base TEXT NOT NULL, cat TEXT NOT NULL DEFAULT '', pieces TEXT NOT NULL DEFAULT '{}', photo TEXT NOT NULL DEFAULT '', photo_placement TEXT NOT NULL DEFAULT '', maj INTEGER NOT NULL)");
db.prepare("INSERT INTO idle_badavatar_profils(email,nom_cle,base,cat,pieces,maj) VALUES('vieux@x.be','vieux','vieux','1','{}',1)").run();
const pieces = { Nez: { visible: true, z: 0, dx: 0, dy: 0, k: 1, rot: 0 } };
{
  const ancien = idleBadavatarLireV1(sql, "vieux@x.be");
  assert.ok(ancien && ancien.choix === null, "un profil d'avant le 2026-11-21 se lit sans choix (la colonne est ajoutée)");
  const r = idleBadavatarEnregistrerV1(sql, "a@x.be", "norman", { pieces, cat: "1", choix: { corps: homme, pieces: { Accessoires: chapeau, Barbe: null } } }, 1000);
  assert.equal(r.ok, true);
  assert.deepEqual(r.profil.choix, { corps: homme, pieces: { Accessoires: chapeau, Barbe: null } });
  const pub = idleBadavatarListePubliqueV1(sql);
  assert.deepEqual(pub.norman.choix, r.profil.choix, "la liste publique porte le choix (affiché chez les autres)");
  assert.ok(!JSON.stringify(pub).includes("@"), "aucune adresse e-mail dans la liste publique");
  assert.equal(idleBadavatarEnregistrerV1(sql, "a@x.be", "norman", { pieces, cat: "1", choix: { pieces: { Vetements: chapeau } } }, 2000).ok, false, "un choix invalide est refusé, rien n'est écrit");
  assert.deepEqual(idleBadavatarLireV1(sql, "a@x.be").choix, r.profil.choix, "le profil précédent est intact");
  assert.equal(idleBadavatarEnregistrerV1(sql, "a@x.be", "norman", { pieces, cat: "1" }, 3000).ok, true);
  assert.equal(idleBadavatarLireV1(sql, "a@x.be").choix, null, "sans choix : retour au badavatar désigné");
  /* un joueur qui a choisi des éléments n'est plus « par défaut » : son visage ne suit plus un changement de pseudo */
  idleBadavatarEnregistrerV1(sql, "b@x.be", "ancienpseudo", { pieces: {}, cat: "1", choix: { pieces: { Accessoires: chapeau } } }, 4000);
  idleBadavatarMigrerNomV1(sql, "b@x.be", "nouveaupseudo");
  assert.equal(idleBadavatarLireV1(sql, "b@x.be").base, "ancienpseudo", "base gardée quand des éléments ont été choisis");
}

/* ---- images : les éléments choisis viennent de shared/badavatars/ (dossiers de pièces seulement) ---- */
{
  const env = { SOREAL_R2: { get: async (k) => ({ body: "x", httpEtag: "e", writeHttpMetadata() {}, k }) } };
  const code = async (cle) => (await idleItopodImagePartageeV1({ method: "GET" }, env, { searchParams: new URLSearchParams({ key: cle }) })).status;
  assert.equal(await code(pull), 200);
  assert.equal(await code(oreille), 200);
  assert.equal(await code(chapeau), 200);
  assert.equal(await code(B0 + "Badavatar.webp"), 400, "pas de fichier à la racine du dossier");
  assert.equal(await code(B0 + "Photos/x.webp"), 400, "pas de dossier hors liste");
  assert.equal(await code(B0 + "Vetements/../x.webp"), 400);
  assert.equal(await code("idle/badavatars/Nez/a.webp"), 200, "les copies du tirage restent servies");
}

/* ---- client : composer() ---- */
const fenetre = {};
for (const f of ["itopod-badavatars-catalogue-v1.js", "itopod-badavatars-choix-catalogue-v1.js", "itopod-badavatars-v1.js"]) vm.runInNewContext(readFileSync("cloudflare/public/modules/" + f, "utf8"), { window: fenetre, Math, String, Object });
const B = fenetre.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__;
const C = B.choixCatalogue;
assert.ok(C.parts.Vetements.length >= 20 && C.parts.Accessoires.length >= 50 && C.parts.Cheveux.length >= 100, "catalogue des éléments choisissables : tout ce que propose TV");
const base = B.tirerPourNom("Norman");
assert.deepEqual(B.tirerPourNom("Norman"), base, "le tirage au hasard est inchangé (même nom, même visage)");
assert.deepEqual(B.composer(base, null), base, "sans choix : le badavatar désigné");
assert.deepEqual(B.composer(base, { pieces: {} }), base, "un choix vide ne change rien");
assert.ok(!base.parts.Vetements && !base.parts.Accessoires, "le tirage ne donne jamais de vêtement ni d'accessoire");
{
  const d = B.composer(base, { pieces: { Vetements: pull, Accessoires: chapeau, Barbe: null } });
  assert.equal(d.parts.Vetements.key, pull);
  assert.equal(d.parts.Accessoires.key, chapeau);
  assert.ok(d.parts.Vetements.order < 0 && d.parts.Accessoires.order > 7, "vêtement derrière le visage, accessoire devant tout");
  assert.ok(!d.parts.Barbe, "null retire la barbe");
  assert.equal(d.parts.Cheveux.key, base.parts.Cheveux.key, "une catégorie non choisie garde l'élément désigné");
  assert.deepEqual(B.composer(base, { pieces: { Vetements: pull, Accessoires: chapeau, Barbe: null } }), d, "toujours le même résultat (aucun hasard)");
  /* le chapeau est AU-DESSUS de la tête, les lunettes sur les yeux, le collier sous le menton */
  const tete = B.corpsEntree(d), haut = tete[1], menton = tete[2];
  const boite = (cle, c) => B.boitePiece(d.parts[c], B.metaPiece(cle));
  assert.ok(boite(chapeau, "Accessoires").b <= haut + 0.35 * (menton - haut), "le chapeau repose sur le haut de la tête");
  const lun = B.composer(base, { pieces: { Accessoires: B0 + "Accessoires/accessoire_lunettes_rondes_violettes.webp" } });
  const bl = B.boitePiece(lun.parts.Accessoires, B.metaPiece(lun.parts.Accessoires.key));
  assert.ok(bl.t > haut + 0.25 * (menton - haut) && bl.b < haut + 0.75 * (menton - haut), "les lunettes sont sur les yeux");
}
{
  /* corps choisi : le genre suit, les éléments gardés se re-posent sur SA tête */
  const femme = (C.bodies.Body_Femme[0] || [])[0];
  const autre = B0 + (base.gender === "Body_Homme" ? femme : C.bodies.Body_Homme.find((m) => B0 + m[0] !== base.body)[0]);
  const d = B.composer(base, { corps: autre });
  assert.equal(d.body, autre);
  assert.equal(d.gender, /Body_Femme/.test(autre) ? "Body_Femme" : "Body_Homme");
  assert.deepEqual(Object.keys(d.parts).sort(), Object.keys(base.parts).sort(), "mêmes catégories");
  const t = B.corpsEntree(d);
  for (const c of ["Yeux", "Nez", "Bouche"]) {
    const b = B.boitePiece(d.parts[c], B.metaPiece(d.parts[c].key));
    assert.ok(b.t >= t[1] - 5 && b.b <= t[2] + 0.4 * (t[2] - t[1]), c + " est sur la tête du nouveau corps");
  }
}
{
  /* oreilles : la gauche reprend l'image de la droite, retournée */
  const d = B.composer(base, { pieces: { Oreille_Droite: oreille, Oreille_Gauche: oreille } });
  assert.equal(d.parts.Oreille_Droite.key, oreille);
  assert.equal(d.parts.Oreille_Gauche.key, oreille);
  assert.equal(d.parts.Oreille_Gauche.flip, true, "l'oreille gauche est l'image retournée");
  assert.ok(!d.parts.Oreille_Droite.flip);
  assert.ok(d.parts.Oreille_Gauche.x < 0 && d.parts.Oreille_Droite.x > 0, "une oreille de chaque côté");
}
assert.deepEqual(B.composer(base, { pieces: { Vetements: B0 + "Vetements/inconnu.webp" } }), base, "une clé absente du catalogue est ignorée (jamais une image cassée)");
/* chemins d'images : copie du tirage = idle/, éléments choisis = shared/ */
assert.ok(decodeURIComponent(B.urlParDefaut(base.body)).includes("key=idle/badavatars/"), "les corps du tirage viennent des copies idle/");
assert.ok(decodeURIComponent(B.urlParDefaut(pull)).includes("key=shared/badavatars/Vetements/"), "les éléments choisis viennent de shared/");
console.log("idle-badavatar-choix-elements-v1: OK");
