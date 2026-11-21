import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleItopodNomPublicProfilV1, idleItopodSansDoublonsV1 } from "../src/idle-itopod-roster-v1.js";

/*
 * Norman (2026-11-21) : « le badavatar que j'ai créé n'apparaît pas dans l'ITOPOD après plusieurs heures ». Cause : le profil était enregistré sous « norman » (profil d'équipe de TV), entrée retirée de la tour comme doublon de « Redrum (Norman) » :
 * le badavatar doit suivre l'entrée qui RESTE.
 */
// 1. Nom public : le libellé du compte quand il se termine par le nom de TV ; sinon le nom de TV.
assert.equal(idleItopodNomPublicProfilV1("Norman", "Redrum (Norman)"), "Redrum (Norman)");
assert.equal(idleItopodNomPublicProfilV1("Sébastien", "Saka (Sébastien)"), "Saka (Sébastien)", "accents et casse ignorés pour la comparaison");
assert.equal(idleItopodNomPublicProfilV1("Dylan J.", "Dylan J."), "Dylan J.", "libellé identique : inchangé");
assert.equal(idleItopodNomPublicProfilV1("Alexis", "Pseudo (Autre)"), "Alexis", "libellé d'un autre prénom : le nom de TV reste");
assert.equal(idleItopodNomPublicProfilV1("Norman", ""), "Norman", "pas de libellé : le nom de TV");
assert.equal(idleItopodNomPublicProfilV1("", "Redrum (Norman)"), "Redrum (Norman)");
// 2. Cohérence avec la tour : le nom public d'un compte est bien une entrée qui reste après retrait des doublons.
{
  const tour = idleItopodSansDoublonsV1([{ nom: "Norman" }, { nom: "Redrum (Norman)" }, { nom: "Alexis" }]).map((w) => w.nom);
  assert.ok(tour.includes(idleItopodNomPublicProfilV1("Norman", "Redrum (Norman)")), "l'entrée du profil existe encore dans la tour");
  assert.ok(!tour.includes("Norman"), "le prénom seul n'y est plus");
}
// 3. Page : un profil enregistré sous le prénom seul reste retrouvé pour « pseudo (prénom) » (avant migration par le serveur).
{
  const fenetre = {
    __SOREAL_IDLE_ITOPOD_BADAVATARS_V1__: { nomNormalise: (n) => String(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(), appliquerProfil: (d) => d, tirerPourNom: (n) => ({ parts: {}, nom: n }), versionCatalogue: 1, composer: (d) => d },
    fetch: () => new Promise(() => {}), Event: function () {}, document: { dispatchEvent() {} }, Date, sessionStorage: { getItem: () => "" }, localStorage: { getItem: () => null }
  };
  const ctx = vm.createContext(Object.assign({ window: fenetre }, fenetre));
  vm.runInContext(readFileSync(new URL("../public/modules/profil-badavatar-v1.js", import.meta.url), "utf8"), ctx);
  const PB = fenetre.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__;
  assert.ok(PB && typeof PB.pour === "function");
  /* la liste publique vient du serveur : on la pose par le canal normal (lecture) en remplaçant fetch */
  let resolu;
  const liste = { ok: true, profils: { norman: { base: "norman", cat: "1", pieces: {}, choix: null, photo: null } } };
  ctx.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(liste) });
  const tourne = new Promise((r) => { resolu = r; });
  PB.charger(true);
  setTimeout(resolu, 30);
  await tourne;
  assert.ok(PB.pour("Redrum (Norman)"), "« Redrum (Norman) » retrouve le profil enregistré sous « norman »");
  assert.ok(PB.pour("Norman"), "le prénom seul le retrouve aussi (compat)");
  assert.equal(PB.pour("Autre (Dylan)"), null, "un autre prénom ne le retrouve pas");
  assert.equal(PB.pour("Redrum"), null, "un pseudo sans parenthèse ne le retrouve pas");
}
console.log("idle-badavatar-suit-entree-restante-v1: OK");
