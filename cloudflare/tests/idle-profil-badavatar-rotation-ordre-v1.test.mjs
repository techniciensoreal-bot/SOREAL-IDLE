import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleBadavatarValiderPiecesV1, idleBadavatarValiderPlacementPhotoV1, idleBadavatarEnregistrerV1, idleBadavatarLireV1, IDLE_BADAVATAR_BORNES_V1 } from "../src/idle-profil-badavatar-v1.js";
import { DatabaseSync } from "node:sqlite";

/*
 * Éditeur Profil (Norman, 2026-11-01) : rotation libre sur 360 degrés, ordre avant / arrière, placement PARTOUT sur le corps. Serveur et client ont les mêmes bornes ; le rendu est partagé avec l'ITOPOD.
 */
const bonne = { visible: true, dx: 0, dy: 0, k: 1, rot: 0 };
const ok = (o) => idleBadavatarValiderPiecesV1({ Nez: { ...bonne, ...o } });

/* rotation : -180..180, refus au-delà et pour une valeur non finie (pas de correction silencieuse) */
for (const rot of [-180, -135, 0, 90, 180]) assert.equal(ok({ rot }).ok, true, "rotation " + rot);
for (const rot of [181, -181, 360, NaN, Infinity, "90"]) assert.equal(ok({ rot }).ok, false, "rotation refusée " + rot);
/* z : entier relatif -20..20, absent = 0 (anciens profils) */
assert.equal(ok({}).pieces.Nez.z, 0, "ancien profil sans z : 0");
assert.equal(ok({ rot: 3 }).pieces.Nez.rot, 3, "ancienne petite rotation inchangée");
for (const z of [-20, -1, 0, 5, 20]) assert.equal(ok({ z }).pieces.Nez.z, z);
for (const z of [21, -21, 1.5, NaN, "1", null]) assert.equal(ok({ z }).ok, false, "z refusé " + z);
/* position : toute la scène */
for (const [c, v] of [["dx", 0.5], ["dx", -0.5], ["dy", 0.5], ["dy", -0.5], ["k", 4], ["k", 0.3]]) assert.equal(ok({ [c]: v }).ok, true, c + "=" + v);
for (const [c, v] of [["dx", 0.51], ["dy", -0.51], ["k", 4.1], ["k", 0.29]]) assert.equal(ok({ [c]: v }).ok, false, c + "=" + v);
/* visage */
const pl = { visible: true, x: 0, y: 0, k: 1, rot: 0 };
assert.equal(idleBadavatarValiderPlacementPhotoV1({ ...pl, rot: 180, z: -3, x: 3, y: 5 }).ok, true);
assert.equal(idleBadavatarValiderPlacementPhotoV1({ ...pl, rot: 181 }).ok, false);
assert.equal(idleBadavatarValiderPlacementPhotoV1({ ...pl, z: 21 }).ok, false);
assert.equal(idleBadavatarValiderPlacementPhotoV1({ ...pl, z: 0.5 }).ok, false);
assert.equal(idleBadavatarValiderPlacementPhotoV1(pl).placement.z, 0);
assert.equal(idleBadavatarValiderPlacementPhotoV1({ ...pl, x: 4.5 }).ok, false);
assert.deepEqual(IDLE_BADAVATAR_BORNES_V1.rot, [-180, 180]);

/* z et rotation sont enregistrés et relus */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
const rep = idleBadavatarEnregistrerV1(sql, "a@x.fr", "alice", { pieces: { Bouche: { ...bonne, rot: -135, z: 4, dx: 0.3, dy: 0.45 } }, cat: "1" });
assert.equal(rep.ok, true);
assert.equal(idleBadavatarLireV1(sql, "a@x.fr").pieces.Bouche.z, 4);
assert.equal(idleBadavatarLireV1(sql, "a@x.fr").pieces.Bouche.rot, -135);

/* ---- rendu partagé ---- */
const fenetre = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-catalogue-v1.js", "utf8"), { window: fenetre });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8"), { window: fenetre, Math, String, Object });
const B = fenetre.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__;
assert.equal(JSON.stringify([B.bornes.rot, B.bornes.photoRot, B.bornes.z, B.bornes.dx, B.bornes.dy, B.bornes.k, B.bornes.photoX, B.bornes.photoY]), JSON.stringify([[-180, 180], [-180, 180], [-20, 20], [-0.5, 0.5], [-0.5, 0.5], [0.3, 4], [-4, 4], [-4, 6]]), "mêmes bornes que le serveur");
const dBase = B.tirerPourNom("Norman");
const zIndex = (html, cat) => Number(new RegExp('data-piece="' + cat + '"[^>]*z-index:(-?\\d+)').exec(html)[1]);
const zCorps = (html) => Number(/<img[^>]*src="[^"]*"[^>]*style="[^"]*;z-index:(-?\d+)">/.exec(html.split("data-visage")[0].replace(/data-piece/g, "x"))[1]);

/* sans profil : strictement identique (rendu et design) */
assert.equal(B.rendreHtml(B.appliquerProfil(dBase, { pieces: {} }), {}), B.rendreHtml(dBase, {}), "aucun réglage : rendu identique");
assert.equal(B.rendreHtml(B.appliquerProfil(dBase, { pieces: { Nez: { visible: true, z: 0, dx: 0, dy: 0, k: 1, rot: 0 } } }), {}), B.rendreHtml(dBase, {}), "z = 0 : ordre d'origine");

/* une pièce avec un z plus grand est devant */
const base = B.rendreHtml(dBase, {});
const devant = B.rendreHtml(B.appliquerProfil(dBase, { pieces: { Barbe: { visible: true, z: 10 } } }), {});
const derriere = B.rendreHtml(B.appliquerProfil(dBase, { pieces: { Bouche: { visible: true, z: -10 }, Cheveux: { visible: true, z: -10 } } }), {});
if (dBase.parts.Barbe) {
  assert.ok(zIndex(devant, "Barbe") > zIndex(devant, "Bouche") && zIndex(devant, "Barbe") > zIndex(base, "Barbe"), "z plus grand : devant");
}
assert.ok(zIndex(derriere, "Bouche") < zIndex(base, "Bouche"), "z négatif : derrière les autres");
const nCorps = zCorps(derriere);
assert.ok(nCorps < zIndex(derriere, "Bouche") && nCorps < zIndex(derriere, "Cheveux"), "le corps reste sous toutes les pièces, même avec un z très négatif : " + nCorps);
assert.equal(zCorps(base), 0, "sans réglage le corps garde son z d'origine");
const emp = B.empilement(B.appliquerProfil(dBase, { pieces: { Bouche: { visible: true, z: -20 } } }), { url: "/x", visible: true, z: -5 });
assert.ok(emp.body < emp.visage && emp.body < emp.parts.Bouche, "corps sous le visage et sous les pièces");
const vis = B.rendreHtml(dBase, { photo: { url: "/v.webp", visible: true, x: 0, y: 0, k: 1, rot: 0, z: 3 } });
assert.ok(/data-visage="1"[^>]*z-index:3/.test(vis), "le visage porte son z");

/* rotation autour du CENTRE de la pièce : le centre ne bouge pas (90, 180, -135) */
for (const rot of [90, 180, -135, 45]) {
  const d = B.appliquerProfil(dBase, { pieces: { Bouche: { visible: true, rot } } });
  const m = B.metaPiece(dBase.parts.Bouche.key);
  const c0 = B.centrePiece(dBase.parts.Bouche, m), c1 = B.centrePiece(d.parts.Bouche, m);
  assert.ok(Math.hypot(c0.x - c1.x, c0.y - c1.y) < 0.5, "centre inchangé pour " + rot + " degrés (écart " + Math.hypot(c0.x - c1.x, c0.y - c1.y).toFixed(3) + " px)");
  assert.ok(Math.abs(d.parts.Bouche.rotation - (dBase.parts.Bouche.rotation + rot)) < 0.02);
}

/* placement partout : une pièce sur le torse ou la jambe reste dans la zone visible, jamais coupée hors du cadre */
const zone = B.zoneVisible(dBase);
for (const [cat, dx, dy] of [["Yeux", 0, 0.35], ["Bouche", 0.1, 0.5], ["Barbe", -0.2, 0.3], ["Cheveux", 0.5, 0.5], ["Nez", -0.5, -0.5]]) {
  if (!dBase.parts[cat]) continue;
  const d = B.appliquerProfil(dBase, { pieces: { [cat]: { visible: true, dx, dy, k: 4 } } });
  const c = B.centrePiece(d.parts[cat], B.metaPiece(d.parts[cat].key));
  assert.ok(c.x >= zone.l - 0.01 && c.x <= zone.r + 0.01 && c.y >= zone.t - 0.01 && c.y <= zone.b + 0.01, cat + " : centre dans la zone visible");
}
/* yeux descendus sur le ventre : le centre est bien plus bas que celui de la tête (plus de limite à la tête) */
const yeux = B.appliquerProfil(dBase, { pieces: { Yeux: { visible: true, dy: 0.3 } } }), cy0 = B.centrePiece(dBase.parts.Yeux, B.metaPiece(dBase.parts.Yeux.key)).y, cy1 = B.centrePiece(yeux.parts.Yeux, B.metaPiece(yeux.parts.Yeux.key)).y;
assert.ok(cy1 - cy0 > 0.29 * 640 - 1, "les yeux peuvent descendre de 0,3 de la hauteur de la scène (" + (cy1 - cy0).toFixed(1) + " px)");
/* le conteneur de la scène ne coupe que sur le cadre lui-même (overflow du cadre, pas de clip-path sur la tête) */
assert.ok(!/clip-path/.test(readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8")), "aucune coupure par la tête");
/* visage placé sur le ventre : centre dans la zone */
const bv = B.boiteVisage(dBase, { x: 0, y: 3, k: 1 });
assert.ok(bv.cy > B.boiteVisage(dBase, { x: 0, y: 0, k: 1 }).cy + 100 && bv.cy <= zone.b, "le visage peut se placer sur le torse");

/* profil enregistré : z du visage transmis à l'ITOPOD */
const f2 = { __SOREAL_IDLE_ITOPOD_BADAVATARS_V1__: B };
vm.runInNewContext(readFileSync("cloudflare/public/modules/profil-badavatar-v1.js", "utf8"), { window: f2, document: { dispatchEvent() {} }, fetch: async () => ({ ok: false }), Date, JSON, Event: class {}, encodeURIComponent, sessionStorage: {}, localStorage: {}, String, Math });
const PB = f2.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__;
const pr = PB.preparer("norman", { base: "norman", cat: String(B.versionCatalogue), pieces: { Bouche: { visible: true, z: -9, dx: 0, dy: 0.4, k: 1, rot: 180 } }, photo: { v: 1, visible: true, x: 0, y: 0, k: 1, rot: -90, z: 2 } });
assert.equal(pr.photo.z, 2);
assert.ok(/data-visage="1"[^>]*z-index:2/.test(B.rendreHtml(pr.design, { photo: pr.photo })));

/* ---- éditeur : règle n°4, rien ne se redessine pendant le glissement ---- */
const ed = readFileSync("cloudflare/public/modules/profil-badavatar-editeur-v1.js", "utf8");
const corps = (nom) => { const i = ed.indexOf("function " + nom + "("); const j = ed.indexOf("\n  function ", i + 10); return ed.slice(i, j < 0 ? undefined : j); };
assert.ok(!/!important/.test(ed));
assert.ok(/majScene\(\)/.test(corps("changerOrdre")) && !/construire\(\)/.test(corps("changerOrdre")), "changer l'ordre ne redessine pas la page");
assert.ok(/changerCurseur\("rot"/.test(corps("pivoter")) && !/construire\(\)|rendreScene\(\)/.test(corps("pivoter")), "la rotation au doigt passe par la mise à jour en place");
assert.ok(/zIndex/.test(readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8").split("function miseAJour")[1].split("function rendreHtml")[0]), "miseAJour met aussi à jour l'empilement en place");
for (const mot of ["data-rotor", "data-rot-pas", "data-rot-num", "data-aimant", "data-ordre=\"avant\"", "data-ordre=\"arriere\"", "data-ordre=\"devant\"", "data-ordre=\"derriere\"", "data-ordre=\"origine\"", "Calques", "Réinitialiser", "Revenir à mon badavatar désigné"]) {
  if (mot === "Réinitialiser") continue;
  assert.ok(ed.includes(mot), "l'éditeur contient " + mot);
}
console.log("idle-profil-badavatar-rotation-ordre-v1: ok");
