import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { IDLE_PORTRAITS_V1 } from "../src/idle-portraits-v1.js";
import { IDLE_DAYCARE_SKIN_IDS_V1 } from "../src/idle-daycare-skins-v1.js";

/* Apparences du chat de la Garderie : possession par condition, jamais révélatrices (règle n°2). */
const ctx = { bosses: 0, basicTrainingComplete: false };
/* Instant hors de toute fenêtre annuelle (l'époque 0 tombe le 1er janvier : fenêtre de Noël). */
const T0 = Date.parse("2026-06-15T12:00:00Z");
const frais = () => normalizeIdleNguState({}, ctx, T0);
const skins = (s) => idleNguSnapshot(s, ctx, T0).daycare.skins;
const agir = (s, p) => applyIdleNguAction(s, p, ctx, T0 + 1000);

assert.equal(IDLE_DAYCARE_SKIN_IDS_V1.length, 11);
assert.deepEqual({ ...skins(frais()) }, { actif: "defaut", possedes: ["defaut"], nouveaux: [] });

// noeud : Special Prize chaton (et rattrapage), pas le choix AP
{
  assert.deepEqual(skins(agir(frais(), { action: "specialPrize", choice: "ap" }).state).possedes, ["defaut"]);
  const s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
  assert.deepEqual(skins(s).possedes, ["defaut", "noeud"]);
  const r = agir(s, { action: "daycareSkin", id: "noeud" });
  assert.equal(r.result.skin, "noeud");
  assert.equal(skins(r.state).actif, "noeud");
  // survit à la normalisation (identifiant texte)
  assert.equal(skins(normalizeIdleNguState(JSON.parse(JSON.stringify(r.state)), ctx, T0)).actif, "noeud");
  const ancien = frais();
  ancien.records.specialPrizeClaimed = 1;
  ancien.records.specialPrizeChoice = 0;
  assert.ok(skins(ancien).possedes.includes("noeud"), "Special Prize réclamé avant le choix : chaton offert");
}
// arcenciel : souhait 44 niveau 1
{
  const s = frais();
  s.systems.wishes = s.systems.wishes || {};
  const src = readFileSync("cloudflare/src/idle-daycare-skins-v1.js", "utf8");
  assert.ok(src.includes("IDLE_DAYCARE_WISH_ART_ID_V1 = 44") && src.includes("IDLE_DAYCARE_FIBONACCI_NIVEAU_V1 = 1597"));
}
// possession par env direct (fibonacci / matrix / arcenciel)
{
  const { skinsPossedesV1, skinActifV1, choisirSkinV1 } = await import("../src/idle-daycare-skins-v1.js");
  const st = { records: {} };
  const env = (o) => ({ specialPrizeChoice: 0, wishLevel: () => 0, perkLevel: () => 0, achats: () => 0, ...o });
  assert.deepEqual(skinsPossedesV1(st, env({ wishLevel: (id) => (id === 44 ? 1 : 0) })), ["defaut", "arcenciel"]);
  assert.deepEqual(skinsPossedesV1(st, env({ perkLevel: (id) => (id === 94 ? 1596 : 0) })), ["defaut"]);
  assert.deepEqual(skinsPossedesV1(st, env({ perkLevel: (id) => (id === 94 ? 1597 : 0) })), ["defaut", "fibonacci"]);
  assert.deepEqual(skinsPossedesV1(st, env({ achats: (id) => (id === "daycareKittyArt" ? 1 : 0) })), ["defaut", "matrix"]);
  // skins sans condition publiée : jamais possédés, même avec tout
  const tout = skinsPossedesV1(st, env({ specialPrizeChoice: 2, wishLevel: () => 99, perkLevel: () => 9999, achats: () => 9 }));
  assert.deepEqual(tout, ["defaut", "noeud", "arcenciel", "fibonacci", "matrix"]);
  for (const id of ["dore", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"]) {
    assert.ok(!tout.includes(id));
    assert.throws(() => choisirSkinV1(st, id, env({})), /SKIN_GARDERIE_VERROUILLE/);
  }
  assert.throws(() => choisirSkinV1(st, "inconnu", env({})), /SKIN_GARDERIE_INCONNU/);
  // repli sur defaut quand le choix n'est plus possédé
  st.records.daycareSkin = "fibonacci";
  assert.equal(skinActifV1(st, env({})), "defaut");
}
// Décisions de Norman (2026-10-31) : fenêtres Halloween / Noël (Bruxelles), Premium, boss 289 / 296, nega jamais
{
  const { dansFenetreAnnuelleV1, jourBruxellesV1 } = await import("../src/idle-daycare-skins-v1.js");
  const a = (s, ms) => applyIdleNguAction(s, { action: "daycareSkin", id: "defaut" }, ctx, ms).state;
  const poss = (s, ms) => idleNguSnapshot(s, ctx, ms).daycare.skins;
  const acquis = (s) => String(s.records.daycareSkinsAcquis);
  // Halloween : 31 octobre 00:00 -> 7 novembre 23:59 (CET en 2026 : UTC+1) ; fin repoussée du 1er au 7 novembre par Norman
  const h0 = Date.parse("2026-10-30T23:00:00Z");
  assert.ok(!acquis(a(frais(), h0 - 1)).includes("chauvesouris"), "30 oct. 23:59:59 : pas encore");
  assert.ok(acquis(a(frais(), h0)).includes("chauvesouris"), "31 oct. 00:00:00 pile");
  assert.ok(acquis(a(frais(), Date.parse("2026-11-07T22:59:59Z"))).includes("chauvesouris"), "7 nov. 23:59:59");
  assert.ok(!acquis(a(frais(), Date.parse("2026-11-07T23:00:00Z"))).includes("chauvesouris"), "8 nov. 00:00 : fini");
  // acquis pour toujours : possédé après la fin de la fenêtre, avec une autre année
  {
    const s = a(frais(), h0 + 3600000);
    assert.ok(poss(s, h0 + 3600000).possedes.includes("chauvesouris"));
    const apres = Date.parse("2027-03-15T12:00:00Z");
    assert.ok(poss(s, apres).possedes.includes("chauvesouris"));
    const rechargee = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, apres);
    assert.ok(poss(rechargee, apres).possedes.includes("chauvesouris"), "survit à la normalisation");
    assert.ok(!poss(frais(), apres).possedes.includes("chauvesouris"), "jamais vu la fenêtre : non possédé");
    assert.equal(agir(s, { action: "daycareSkin", id: "chauvesouris" }).result.skin, "chauvesouris");
  }
  assert.ok(acquis(a(frais(), Date.parse("2031-10-31T10:00:00Z"))).includes("chauvesouris"), "chaque année");
  // heure de Bruxelles en heure d'été : 31 mars 2026 vs fin de la fenêtre de Noël
  assert.deepEqual(jourBruxellesV1(Date.parse("2026-07-01T22:30:00Z")), { annee: 2026, mois: 7, jour: 2 });
  // Noël : 24 décembre 00:00 -> 2 janvier 23:59, à cheval sur deux années
  const n0 = Date.parse("2026-12-23T23:00:00Z");
  assert.ok(!acquis(a(frais(), n0 - 1)).includes("noel"));
  assert.ok(acquis(a(frais(), n0)).includes("noel"));
  assert.ok(acquis(a(frais(), Date.parse("2026-12-31T12:00:00Z"))).includes("noel"));
  assert.ok(acquis(a(frais(), Date.parse("2027-01-01T00:30:00Z"))).includes("noel"), "1er janvier (autre année)");
  assert.ok(acquis(a(frais(), Date.parse("2027-01-02T22:59:59Z"))).includes("noel"), "2 janv. 23:59:59");
  assert.ok(!acquis(a(frais(), Date.parse("2027-01-02T23:00:00Z"))).includes("noel"), "3 janv. 00:00 : fini");
  assert.ok(!acquis(a(frais(), Date.parse("2026-12-10T12:00:00Z"))).includes("noel"));
  assert.ok(dansFenetreAnnuelleV1(1, 1, [12, 24], [1, 2]) && !dansFenetreAnnuelleV1(6, 1, [12, 24], [1, 2]));
  // Premium : mois complet du calendrier de connexion, y compris rétroactif
  {
    const hors = Date.parse("2027-03-15T12:00:00Z");
    const jours = (n) => Array.from({ length: n }, (_v, i) => i + 1);
    const incomplet = frais();
    incomplet.records.loginCalendar = { mois: "2026-11", cases: jours(29), debut: 1, serie: 29, dernierJour: "2026-11-29", totalReclames: 29, totalAp: 1, octroi: "" };
    assert.ok(!poss(incomplet, hors).possedes.includes("dore"), "29 cases sur 30 : pas Premium");
    const complet = frais();
    complet.records.loginCalendar = { mois: "2026-11", cases: jours(30), debut: 1, serie: 30, dernierJour: "2026-11-30", totalReclames: 30, totalAp: 1, octroi: "" };
    assert.ok(poss(complet, hors).possedes.includes("dore"), "rétroactif à la prochaine synchro");
    const fev = frais();
    fev.records.loginCalendar = { mois: "2027-02", cases: jours(28), debut: 1, serie: 28, dernierJour: "2027-02-28", totalReclames: 28, totalAp: 1, octroi: "" };
    assert.ok(poss(fev, hors).possedes.includes("dore"), "février 28 cases");
    assert.ok(!poss(frais(), hors).possedes.includes("dore"));
    // acquis définitivement même quand le mois suivant écrase l'enregistrement
    const s = a(complet, hors);
    s.records.loginCalendar = { mois: "2027-04", cases: [1], debut: 1, serie: 1, dernierJour: "2027-04-01", totalReclames: 31, totalAp: 1, octroi: "" };
    assert.ok(poss(s, hors).possedes.includes("dore"));
    // dernière case réclamée = acquis tout de suite
    const j = frais();
    j.systems.moneyPit.unlocked = true;
    const t30 = Date.parse("2026-11-30T12:00:00Z");
    j.records.loginCalendar = { mois: "2026-11", cases: jours(29), debut: 1, serie: 29, dernierJour: "2026-11-29", totalReclames: 29, totalAp: 1, octroi: "2026-10" };
    const r = applyIdleNguAction(j, { action: "loginCalendar" }, ctx, t30);
    assert.ok(idleNguSnapshot(r.state, ctx, t30).daycare.skins.possedes.includes("dore"), "case 30 réclamée");
  }
  // Boss : pirate = boss 289 vaincu, tchernobyl = boss 296 vaincu
  {
    const avecBoss = (n) => { const s = frais(); s.records.highestBoss = n; return s; };
    assert.ok(!skins(avecBoss(288)).possedes.includes("pirate"));
    assert.ok(skins(avecBoss(289)).possedes.includes("pirate"));
    assert.ok(!skins(avecBoss(289)).possedes.includes("tchernobyl"));
    assert.ok(!skins(avecBoss(295)).possedes.includes("tchernobyl"));
    assert.ok(skins(avecBoss(296)).possedes.includes("tchernobyl"));
  }
  // nega : commencer en Evil (difficile) ; Sadistic (extreme) rétroactif ; jamais en Normal ; définitif
  {
    const s = frais();
    s.records.highestBoss = 301;
    assert.ok(!skins(s).possedes.includes("nega"), "Normal : jamais");
    assert.ok(!acquis(a(s, T0)).includes("nega"));
    const evil = frais();
    evil.difficulty = "difficile";
    const e2 = a(evil, T0);
    assert.ok(acquis(e2).includes("nega") && skins(e2).possedes.includes("nega"), "Evil");
    e2.difficulty = "normal";
    assert.ok(skins(e2).possedes.includes("nega"), "définitif après retour en Normal");
    const sad = frais();
    sad.difficulty = "extreme";
    assert.ok(skins(sad).possedes.includes("nega"), "Sadistic : rétroactif");
    const fausse = frais();
    fausse.records.daycareSkinsAcquis = "nega";
    assert.ok(skins(fausse).possedes.includes("nega"), "enregistrement conservé");
  }
  // nouveaux + action daycareSkinVu (compte, jamais de skin non possédé)
  {
    const s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
    s.records.highestBoss = 289;
    assert.deepEqual(skins(s).nouveaux, ["noeud", "pirate"]);
    assert.deepEqual(skins(frais()).nouveaux, [], "rien de possédé : aucune annonce");
    assert.throws(() => agir(s, { action: "daycareSkinVu", id: "tchernobyl" }), /SKIN_GARDERIE_VERROUILLE/);
    assert.throws(() => agir(s, { action: "daycareSkinVu", id: "inconnu" }), /SKIN_GARDERIE_INCONNU/);
    const v = agir(s, { action: "daycareSkinVu", id: "noeud" });
    assert.equal(v.result.skin, "noeud");
    assert.deepEqual(skins(v.state).nouveaux, ["pirate"]);
    assert.deepEqual(skins(normalizeIdleNguState(JSON.parse(JSON.stringify(v.state)), ctx, T0)).nouveaux, ["pirate"], "survit à la normalisation");
    const v2 = agir(v.state, { action: "daycareSkinVu", id: "pirate" });
    assert.deepEqual(skins(v2.state).nouveaux, []);
    // une valeur corrompue est assainie (ids inconnus et doublons retirés)
    const c = frais();
    c.records.daycareSkinsVus = "zz,noeud,noeud,<b>";
    assert.equal(normalizeIdleNguState(c, ctx, T0).records.daycareSkinsVus, "noeud");
  }
}
// action refusée côté moteur
assert.throws(() => agir(frais(), { action: "daycareSkin", id: "matrix" }), /SKIN_GARDERIE_VERROUILLE/);
assert.throws(() => agir(frais(), { action: "daycareSkin", id: "nega" }), /SKIN_GARDERIE_VERROUILLE/);

// Le portrait « chaton » n'existe plus parmi les portraits de joueur
assert.ok(!IDLE_PORTRAITS_V1.some((p) => p.id === "kitty" || p.file === "BadKittyDaycareBow"));
{
  const s = agir(frais(), { action: "specialPrize", choice: "kitty" }).state;
  s.records.portrait = "kitty";
  assert.equal(idleNguSnapshot(s, ctx, T0).portraits.selected, "default", "ancien choix : repli sur le portrait par défaut");
  assert.throws(() => agir(s, { action: "portrait", id: "kitty" }), /PORTRAIT_INCONNU/);
  assert.equal(idleNguSnapshot(s, ctx, T0).portraits.specialPrize.choice, "kitty", "le choix du Special Prize reste");
}
// Route média : liste blanche
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
assert.ok(media.includes("/api/idle/media/garderie-skin") && media.includes("IDLE_DAYCARE_SKIN_IDS_V1.includes(id)") && media.includes('"idle/garderie-skins/"+id+".webp"'));
assert.ok(!media.includes("badkittydaycarebow"));

console.log("idle-daycare-skins-v1 OK");
