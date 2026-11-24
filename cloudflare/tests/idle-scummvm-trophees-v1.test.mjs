import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { apBonusMultiplierV1 } from "../src/idle-ngu-bonus.js";
import { idleScummvmDefinirApActifV1, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1, idleScummvmProgresV1, idleScummvmTropheesV1 } from "../src/idle-scummvm-progres-v1.js";
import { IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

/*
 * Trophées d'un jeu ScummVM (Norman, 2026-11-22) : validation du fichier soreal-trophees.json, lecteur de conditions (objet possédé / bit), action moteur `scummvmTrophees`
 * (crédit unique, plafond, AP brut, ordre, menu verrouillé, pas de double crédit avec `scummvmProgres`), client (n'envoie que les trophées nouveaux), page (seulement ce qui est obtenu,
 * aucun total ni liste des autres, nœud persistant), journal d'étalonnage, clé exclue de la synchro du compte, traductions.
 */
idleScummvmDefinirApActifV1(true);   /* le gain d'AP est coupé en production (2026-11-23) : ces tests de crédit l'activent */
const srcSave = readFileSync("cloudflare/public/modules/scummvm-sauvegarde-v1.js", "utf8");
const srcProgres = readFileSync("cloudflare/public/modules/scummvm-progres-v1.js", "utf8");
const srcPage = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const apres = readFileSync("cloudflare/tests/references/scummvm-tentacle-apres-v1.bin");
const debut = readFileSync("cloudflare/tests/references/scummvm-tentacle-debut-v1.bin");
const OBJETS = JSON.parse(readFileSync("cloudflare/tests/references/scummvm-tentacle-objets-v1.json", "utf8"));
const CLE_FICHIER = "/home/web_user/saves/tentacle.s00";
const JEU = { id: "dott", nom: "Day of the Tentacle", dossier: "DOTT", cible: "tentacle", difficulte: "normal", ap: { plafond: 150000, parUnite: 53 } };

/* ---------- bac à sable commun : lecteur + suivi (+ page) ---------- */
function faux(opts = {}) {
  const stock = {};
  const timers = [];
  const actions = [];
  const idb = { fichiers: opts.fichiers || {} };
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error, DecompressionStream, Blob, Response, Uint8Array, DataView, Int32Array, RegExp,
    atob: (s) => Buffer.from(s, "base64").toString("latin1"), btoa: (s) => Buffer.from(s, "latin1").toString("base64"),
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; },
    indexedDB: {
      open() {
        const req = {};
        setTimeout(() => {
          req.result = {
            objectStoreNames: { contains: (n) => n === "FILE_DATA" },
            close() {},
            transaction: () => ({ objectStore: () => ({ get: (k) => { const q = {}; setTimeout(() => { q.result = idb.fichiers[k]; if (q.onsuccess) q.onsuccess(); }, 0); return q; } }) }),
          };
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      },
    },
    addEventListener() {},
    __actionMetaIdleV130__: opts.sansAction ? undefined : (p) => { actions.push(JSON.parse(JSON.stringify(p))); },
    __urls: [],
    __fichierTrophees: opts.trophees === undefined ? undefined : opts.trophees,
  };
  sb.fetch = async (url) => {
    sb.__urls.push(String(url));
    if (String(url).endsWith("/soreal-trophees.json") && sb.__fichierTrophees !== undefined && sb.__fichierTrophees !== null) return { ok: true, json: async () => JSON.parse(JSON.stringify(sb.__fichierTrophees)) };
    return { ok: false, json: async () => ({}) };
  };
  sb.window = sb;
  sb.__SOREAL_IDLE_REG__ = {};
  vm.createContext(sb);
  vm.runInContext(srcSave, sb);
  vm.runInContext(srcProgres, sb);
  sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__.definirApActif(true);   /* gain d'AP coupé en production (2026-11-23) : ce banc l'active */
  const fichier = (buf, ts) => ({ contents: new Uint8Array(buf), timestamp: new Date(ts) });
  return { sb, stock, timers, actions, idb, P: sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__, fichier };
}
/* Quelques trophées d'essai : on cherche dans la sauvegarde de référence les unités vues, pour des conditions vraies (objets possédés, bits à 1) */
const L0 = faux().sb.__SOREAL_IDLE_SCUMMVM_SAVE_V1__;
const profil = L0.PROFILS.tentacle;
const luApres = L0.lire(await L0.decompresser(new Uint8Array(apres)), profil);
const unitesApres = Array.from(L0.unites(luApres, profil));
assert.ok(unitesApres.length >= 1, "la sauvegarde de référence contient au moins une unité de progrès");
const uObjet = unitesApres.find((u) => u < profil.objetsGlobaux);
const unite0 = unitesApres[0];
const trophee = (id, extra = {}) => Object.assign({ id, nom: { fr: "Nom " + id, en: "Name " + id }, ap: 1000, objets: [], bits: [] }, extra);
const T_VRAI = unite0 < profil.objetsGlobaux ? trophee("vrai", { objets: [unite0] }) : trophee("vrai", { bits: [unite0 - profil.objetsGlobaux] });
const T_FAUX = trophee("faux", { objets: [799], bits: [2047] });   /* ni l'objet 799 ni le bit 2047 dans la sauvegarde de référence */
assert.ok(!unitesApres.includes(799) && !unitesApres.includes(profil.objetsGlobaux + 2047));

/* 1. validation du fichier (stricte) */
{
  const P = faux().P;
  const ok = { version: 1, trophees: [trophee("a-b-1", { objets: [352] }), trophee("c", { bits: [0, 5] })] };
  const l = P.validerTrophees(JSON.parse(JSON.stringify(ok)));
  assert.equal(l.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(l[0])), { id: "a-b-1", nom: { fr: "Nom a-b-1", en: "Name a-b-1" }, ap: 1000, objets: [352], bits: [] });
  const mauvais = [
    null, "x", [], {}, { version: 2, trophees: ok.trophees }, { version: 1 }, { version: 1, trophees: [] }, { version: 1, trophees: "x" },
    { version: 1, trophees: [trophee("a", { objets: [1] }), trophee("a", { objets: [2] })] },            /* ids en double */
    { version: 1, trophees: [trophee("A", { objets: [1] })] }, { version: 1, trophees: [trophee("a b", { objets: [1] })] }, { version: 1, trophees: [trophee("", { objets: [1] })] },
    { version: 1, trophees: [trophee("é", { objets: [1] })] },
    { version: 1, trophees: [trophee("a", { ap: 0, objets: [1] })] }, { version: 1, trophees: [trophee("a", { ap: -5, objets: [1] })] }, { version: 1, trophees: [trophee("a", { ap: 1.5, objets: [1] })] },
    { version: 1, trophees: [trophee("a", { ap: "10", objets: [1] })] },
    { version: 1, trophees: [trophee("a", { nom: { fr: "x" }, objets: [1] })] }, { version: 1, trophees: [trophee("a", { nom: { fr: "", en: "y" }, objets: [1] })] }, { version: 1, trophees: [trophee("a", { nom: "x", objets: [1] })] },
    { version: 1, trophees: [trophee("a", { objets: ["1"] })] }, { version: 1, trophees: [trophee("a", { objets: [1.5] })] }, { version: 1, trophees: [trophee("a", { objets: [-1] })] },
    { version: 1, trophees: [trophee("a", { bits: ["x"] })] }, { version: 1, trophees: [trophee("a", {})] },                                       /* aucune condition */
    { version: 1, trophees: [trophee("a", { objets: "1" })] }, { version: 1, trophees: [null] },
  ];
  mauvais.forEach((m, i) => assert.equal(P.validerTrophees(m), null, "invalide #" + i + " : " + JSON.stringify(m)));
}

/* 2. lecteur de conditions : objet possédé OU bit à 1, sur l'ensemble « déjà vu » (départ de partie exclu) */
{
  const f = faux();
  const vu = new Uint8Array((L0.unitesPossibles(profil) + 7) >> 3);
  const poser = (i) => { vu[i >> 3] |= 1 << (i & 7); };
  const liste = f.P.validerTrophees({ version: 1, trophees: [trophee("obj", { objets: [10, 11] }), trophee("bit", { bits: [3, 4] }), trophee("mix", { objets: [20], bits: [9] })] });
  assert.deepEqual(Array.from(f.P.tropheesRemplis(liste, vu, profil).map((t) => t.id)), []);
  poser(11);
  assert.deepEqual(Array.from(f.P.tropheesRemplis(liste, vu, profil).map((t) => t.id)), ["obj"], "un seul des objets suffit");
  poser(profil.objetsGlobaux + 4);
  assert.deepEqual(Array.from(f.P.tropheesRemplis(liste, vu, profil).map((t) => t.id)), ["obj", "bit"], "un seul des bits suffit, dans l'ordre de la liste");
  poser(profil.objetsGlobaux + 9);
  assert.deepEqual(Array.from(f.P.tropheesRemplis(liste, vu, profil).map((t) => t.id)), ["obj", "bit", "mix"], "objet OU bit");
  /* un indice d'objet ne se confond pas avec un bit (objet 9 n'est pas le bit 9) */
  const v2 = new Uint8Array(vu.length); v2[0] |= 1 << 1;   /* unité 1 = objet 1 */
  assert.deepEqual(Array.from(f.P.tropheesRemplis(f.P.validerTrophees({ version: 1, trophees: [trophee("b1", { bits: [1] })] }), v2, profil).map((t) => t.id)), []);
  /* le départ de partie ne compte pas : la sauvegarde du début donne zéro unité */
  const luDebut = L0.lire(await L0.decompresser(new Uint8Array(debut)), profil);
  assert.deepEqual(Array.from(L0.unites(luDebut, profil)), []);
}

/* 3. action moteur */
const t0 = 1_000_000;
const ctx = { bosses: IDLE_SCUMMVM_BOSS_V1 };
const ouvert = () => syncIdleNguState({}, ctx, t0);
const trophees = (etat, p, t = t0 + 1000) => applyIdleNguAction(etat, Object.assign({ action: "scummvmTrophees", jeu: "dott", plafond: 150000 }, p), ctx, t);
const progres = (etat, p, t = t0 + 1000) => applyIdleNguAction(etat, Object.assign({ action: "scummvmProgres", jeu: "dott", plafond: 150000, parUnite: 53 }, p), ctx, t);
{
  const contrat = JSON.stringify(JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")));
  assert.ok(!/scummvmTrophees/i.test(contrat), "pas une opération du protocole");
  /* crédit : AP brut (même avec un multiplicateur d'AP), ordre conservé, état léger */
  const base = ouvert();
  base.systems.perks.data.levels = { 89: 20 };
  assert.ok(apBonusMultiplierV1(base) > 1);
  let r = trophees(base, { trophees: [{ id: "zz", ap: 1800 }, { id: "10", ap: 700 }, { id: "aa", ap: 5 }] });
  assert.equal(r.result.ap, 2505, "somme brute, sans multiplicateur");
  assert.equal(r.state.currencies.ap, 2505);
  assert.deepEqual(r.state.systems.scummvm.data.jeux.dott, { unites: 0, apCredite: 2505, trophees: { zz: 1800, 10: 700, aa: 5 }, ordre: ["zz", "10", "aa"], v: 3 }, "ordre d'obtention conservé même pour un id numérique");
  assert.deepEqual(r.result.nouveaux, ["zz", "10", "aa"]);
  /* jamais deux fois, même si l'ap du fichier change ; les nouveaux s'ajoutent à la fin */
  r = trophees(r.state, { trophees: [{ id: "zz", ap: 99999 }, { id: "bb", ap: 300 }] }, t0 + 2000);
  assert.equal(r.result.ap, 300);
  assert.equal(r.state.currencies.ap, 2805);
  assert.deepEqual(r.state.systems.scummvm.data.jeux.dott.ordre, ["zz", "10", "aa", "bb"]);
  assert.equal(r.state.systems.scummvm.data.jeux.dott.trophees.zz, 1800, "l'AP crédité ne change pas");
  const rien = trophees(r.state, { trophees: [{ id: "zz", ap: 1 }] }, t0 + 3000);
  assert.equal(rien.result.ap, 0); assert.equal(rien.result.ignore, true);
  assert.equal(rien.state.currencies.ap, 2805);
  /* doublon dans la même requête : une seule fois */
  const d = trophees(ouvert(), { trophees: [{ id: "x", ap: 100 }, { id: "x", ap: 100 }] });
  assert.equal(d.state.currencies.ap, 100);
  assert.deepEqual(d.state.systems.scummvm.data.jeux.dott.ordre, ["x"]);
}
{
  /* plafond : borné par le plafond du jeu, le dernier trophée est tronqué (et compte comme obtenu), plus rien ensuite */
  let r = trophees(ouvert(), { trophees: [{ id: "a", ap: 149000 }, { id: "b", ap: 5000 }, { id: "c", ap: 100 }] });
  assert.equal(r.state.currencies.ap, 150000, "jamais plus de 150 000");
  assert.deepEqual(r.state.systems.scummvm.data.jeux.dott.trophees, { a: 149000, b: 1000, c: 0 });
  assert.deepEqual(r.state.systems.scummvm.data.jeux.dott.ordre, ["a", "b", "c"]);
  r = trophees(r.state, { trophees: [{ id: "d", ap: 500 }] }, t0 + 2000);
  assert.equal(r.state.currencies.ap, 150000);
  /* borne absolue du moteur */
  const g = trophees(ouvert(), { plafond: 1e12, trophees: [{ id: "a", ap: 2_000_000 }] });
  assert.equal(g.state.currencies.ap, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1);
  /* deux jeux indépendants */
  let h = trophees(ouvert(), { plafond: 200, trophees: [{ id: "a", ap: 500 }] });
  h = trophees(h.state, { jeu: "autre", plafond: 1000, trophees: [{ id: "a", ap: 300 }] }, t0 + 2000);
  assert.equal(h.state.currencies.ap, 500);
  assert.equal(h.state.systems.scummvm.data.jeux.dott.apCredite, 200);
  assert.equal(h.state.systems.scummvm.data.jeux.autre.apCredite, 300);
}
{
  /* menu verrouillé : refusée, aucun AP */
  const c2 = { bosses: IDLE_SCUMMVM_BOSS_V1 - 1 };
  const ferme = syncIdleNguState({}, c2, t0);
  assert.throws(() => applyIdleNguAction(ferme, { action: "scummvmTrophees", jeu: "dott", plafond: 100, trophees: [{ id: "a", ap: 10 }] }, c2, t0 + 1000), /SYSTEME_VERROUILLE/);
  assert.throws(() => idleScummvmTropheesV1(ferme, { jeu: "dott", plafond: 100, trophees: [{ id: "a", ap: 10 }] }), /SYSTEME_VERROUILLE/);
  assert.equal(ferme.currencies.ap, 0);
  /* formes invalides sans effet */
  for (const p of [{ jeu: "" }, { jeu: "a b" }, { plafond: 0 }, { plafond: "x" }, { trophees: "x" }, { trophees: [{ id: "A", ap: 1 }] }, { trophees: [{ id: "a", ap: 0 }] }, { trophees: [{ id: "a", ap: "x" }] }, { trophees: [{ ap: 5 }] }, { trophees: Array.from({ length: 51 }, (_, i) => ({ id: "t" + i, ap: 1 })) }]) {
    assert.throws(() => idleScummvmTropheesV1(ouvert(), Object.assign({ jeu: "dott", plafond: 100, trophees: [{ id: "a", ap: 1 }] }, p)), /PAYLOAD_INVALIDE/, JSON.stringify(p));
  }
}
{
  /* pas de double crédit avec scummvmProgres : un jeu qui a des trophées ne rapporte plus rien par unités ; un jeu sans trophées garde le comportement par unités */
  let r = trophees(ouvert(), { trophees: [{ id: "a", ap: 1000 }] });
  const p = progres(r.state, { unites: 30 }, t0 + 2000);
  assert.equal(p.result.ap, 0); assert.equal(p.result.ignore, true);
  assert.equal(p.state.currencies.ap, 1000);
  assert.deepEqual(p.state.systems.scummvm.data.jeux.dott.ordre, ["a"], "l'état des trophées n'est pas touché");
  const q = progres(ouvert(), { unites: 3 });
  assert.equal(q.result.ap, 159, "jeu sans trophées : comportement par unités inchangé");
  const q2 = progres(ouvert(), { jeu: "autre", unites: 2 });
  const q3 = trophees(q2.state, { trophees: [{ id: "a", ap: 40 }] }, t0 + 2000);
  assert.equal(q3.state.currencies.ap, 146, "un autre jeu garde ses unités");
  /* les unités déjà créditées avant la liste comptent dans le plafond commun */
  const m = progres(ouvert(), { unites: 2800 });
  const m2 = trophees(m.state, { trophees: [{ id: "a", ap: 5000 }] }, t0 + 2000);
  assert.equal(m2.state.currencies.ap, 150000);
  const src = readFileSync("cloudflare/src/idle-scummvm-progres-v1.js", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/apWithBonusV1|apBonusMultiplierV1/.test(src), "aucun multiplicateur d'AP");
  assert.ok(!/Date\.now|Math\.random|new Date/.test(src), "état sans horodatage ni aléa");
}

/* 4. client : n'envoie que les trophées nouvellement remplis */
{
  const liste = { version: 1, trophees: [T_VRAI, T_FAUX] };
  const f = faux({ trophees: liste, fichiers: {} });
  f.P.demarrer(JEU, "DOTT");
  assert.equal(await f.P.verifier(), -1, "pas encore de fichier d'autosave");
  assert.ok(f.sb.__urls.some((u) => u === "/api/idle/scummvm/jeux/DOTT/soreal-trophees.json"), "liste lue dans le dossier du jeu");
  f.idb.fichiers[CLE_FICHIER] = f.fichier(debut, "2026-11-22T17:52:56.000Z");
  await f.P.verifier();
  assert.equal(f.actions.length, 0, "début de partie : aucun trophée");
  f.idb.fichiers[CLE_FICHIER] = f.fichier(apres, "2026-11-22T18:00:56.000Z");
  await f.P.verifier();
  assert.equal(f.actions.length, 1);
  assert.deepEqual(f.actions[0], { action: "scummvmTrophees", jeu: "dott", plafond: 150000, trophees: [{ id: "vrai", ap: 1000 }] }, "seulement le trophée rempli, pas de scummvmProgres");
  /* même sauvegarde, puis sauvegarde plus ancienne : rien de plus */
  await f.P.verifier();
  f.idb.fichiers[CLE_FICHIER] = f.fichier(debut, "2026-11-22T18:05:00.000Z");
  await f.P.verifier();
  assert.equal(f.actions.length, 1, "un trophée n'est jamais renvoyé");
  const m = JSON.parse(f.stock.soreal_idle_scummvm_progres_v1);
  assert.deepEqual(m.dott.troph, ["vrai"]);
  assert.ok(f.stock.soreal_idle_scummvm_progres_v1.length < 8000, "préférence bornée (règle n°6)");
  assert.ok(!f.actions.some((a) => a.action === "scummvmProgres"), "jamais scummvmProgres pour un jeu avec liste");
  /* un trophée ajouté plus tard à la liste, déjà rempli par ce qui a été vu : envoyé seul, sans relire la sauvegarde */
  const f2 = faux({ trophees: { version: 1, trophees: [T_FAUX] }, fichiers: { [CLE_FICHIER]: f.fichier(apres, "2026-11-22T18:00:56.000Z") } });
  f2.sb.localStorage.setItem("soreal_idle_scummvm_progres_v1", f.stock.soreal_idle_scummvm_progres_v1);
  f2.P.demarrer(JEU, "DOTT");
  await f2.P.verifier();
  assert.equal(f2.actions.length, 0);
  /* trophée déjà connu du serveur : jamais renvoyé (nouvel appareil sans mémoire) */
  const f3 = faux({ trophees: liste, fichiers: { [CLE_FICHIER]: f.fichier(apres, "2026-11-22T18:00:56.000Z") } });
  f3.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { systems: [{ id: "scummvm", state: { data: { jeux: { dott: { trophees: { vrai: 1000 }, ordre: ["vrai"], apCredite: 1000 } } } } }] } };
  f3.P.demarrer(JEU, "DOTT");
  await f3.P.verifier();
  assert.equal(f3.actions.length, 0, "déjà crédité côté serveur");
  /* sans canal d'actions : non marqué envoyé, on réessaiera */
  const f4 = faux({ trophees: liste, sansAction: true, fichiers: { [CLE_FICHIER]: f.fichier(apres, "2026-11-22T18:00:56.000Z") } });
  f4.P.demarrer(JEU, "DOTT");
  await f4.P.verifier();
  assert.deepEqual(JSON.parse(f4.stock.soreal_idle_scummvm_progres_v1).dott.troph, []);
}

/* 5. fichier absent ou invalide : repli sur le comportement actuel par unités, jamais d'erreur */
{
  for (const trophees of [undefined, null, { version: 1, trophees: [] }, { version: 9 }]) {
    const f = faux({ trophees, fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(apres), timestamp: new Date("2026-11-22T18:00:56.000Z") } } });
    f.P.demarrer(JEU, "DOTT");
    await f.P.verifier();
    assert.equal(f.P.tropheesDe("dott"), null);
    assert.equal(f.actions.length, 1);
    assert.deepEqual(f.actions[0], { action: "scummvmProgres", jeu: "dott", unites: unitesApres.length, plafond: 150000, parUnite: 53 });
  }
  /* aucun fetch : même repli */
  const g = faux({ fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(apres), timestamp: new Date() } } });
  delete g.sb.fetch;
  g.P.demarrer(JEU, "DOTT");
  await g.P.verifier();
  assert.equal(g.actions[0].action, "scummvmProgres");
  /* fetch qui échoue */
  const h = faux({ fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(apres), timestamp: new Date() } } });
  h.sb.fetch = async () => { throw new Error("réseau"); };
  h.P.demarrer(JEU, "DOTT");
  await h.P.verifier();
  assert.equal(h.actions[0].action, "scummvmProgres");
}

/* 6. journal d'étalonnage : une entrée par unité nouvelle, plafond, clé exclue de la synchro du compte */
{
  const f = faux({ trophees: undefined, fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(apres), timestamp: new Date("2026-11-22T18:00:56.000Z") } } });
  f.P.demarrer(JEU, "DOTT");
  const avant = Date.now();
  await f.P.verifier();
  const J = JSON.parse(f.stock.soreal_idle_scummvm_journal_v1);
  assert.equal(J.dott.length, unitesApres.length, "une entrée par unité nouvelle");
  assert.deepEqual(J.dott.map((e) => e.u).sort((a, b) => a - b), unitesApres);
  assert.ok(J.dott.every((e) => Object.keys(e).sort().join() === "t,u" && e.t >= avant), "{u, t}");
  /* relire la même sauvegarde, ou une sauvegarde plus ancienne : aucune entrée de plus */
  await f.P.verifier();
  f.idb.fichiers[CLE_FICHIER] = f.fichier(debut, "2026-11-22T18:05:00.000Z");
  await f.P.verifier();
  assert.equal(JSON.parse(f.stock.soreal_idle_scummvm_journal_v1).dott.length, unitesApres.length);
  /* lecture publique */
  const lu = JSON.parse(JSON.stringify(f.sb.__SOREAL_IDLE_SCUMMVM_JOURNAL_V1__()));
  assert.equal(lu.dott.length, unitesApres.length);
  assert.ok(lu.dott.every((e) => (e.u < 800 ? e.type === "objet" && e.id === e.u : e.type === "bit" && e.id === e.u - 800)));
  assert.ok(lu.dott.every((e) => e.nom === undefined), "aucun nom d'objet dans le client");
  const nommes = lu.dott.filter((e) => e.type === "objet").map((e) => ({ ...e, nom: OBJETS[e.id] }));   /* les noms viennent de la table de référence, dans le test seulement */
  assert.ok(nommes.every((e) => typeof e.nom === "string" || e.nom === undefined));
  /* plafond 3000 : les plus anciennes sortent */
  const g = faux();
  const gros = { dott: Array.from({ length: 3000 }, (_, i) => ({ u: i % 2000, t: i })) };
  g.stock.soreal_idle_scummvm_journal_v1 = JSON.stringify(gros);
  g.idb.fichiers[CLE_FICHIER] = g.fichier(apres, "2026-11-22T18:00:56.000Z");
  g.P.demarrer(JEU, "DOTT");
  await g.P.verifier();
  const G = JSON.parse(g.stock.soreal_idle_scummvm_journal_v1).dott;
  assert.equal(G.length, 3000, "plafonné à 3000");
  assert.equal(g.P.JOURNAL_MAX, 3000);
  assert.equal(G[0].t, unitesApres.length, "les plus anciennes sortent");
  /* clé exclue de la synchro du compte (règle n°6) et valide sinon */
  const prefs = readFileSync("cloudflare/public/modules/prefs-compte-v1.js", "utf8");
  const sbp = { window: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 }, console, setTimeout: () => 1, addEventListener() {}, fetch: async () => ({ ok: false }), document: { addEventListener() {} } };
  const motif = prefs.match(/var EXCLUES=(\/\^\(.*?\)\/);/)[1];
  const EXCLUES = new RegExp(motif.slice(1, motif.lastIndexOf("/")));
  assert.ok(EXCLUES.test("soreal_idle_scummvm_journal_v1"), "journal exclu de la synchro du compte");
  assert.ok(!EXCLUES.test("soreal_idle_scummvm_progres_v1"), "la mémoire de progrès reste liée au compte");
  void sbp;
}

/* 7. page : DOM persistant, seulement les trophées obtenus, aucun total ni liste des autres, langue fr/en */
{
  const el = (tag) => {
    const e = {
      tag, children: [], attrs: {}, _t: "", isConnected: true, parent: null, className: "",
      appendChild(c) { c.parent = this; this.children.push(c); return c; },
      removeChild(c) { this.children.splice(this.children.indexOf(c), 1); c.parent = null; return c; },
      setAttribute(k, v) { this.attrs[k] = v; },
      get firstChild() { return this.children[0] || null; },
      get textContent() { return this._t + this.children.map((c) => c.textContent).join(""); },
      set textContent(v) { this._t = String(v); this.ecritures = (this.ecritures || 0) + 1; },
    };
    return e;
  };
  const noeud = el("div");
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error, RegExp,
    localStorage: { _s: {}, getItem(k) { return k in this._s ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); } },
    navigator: {}, screen: {}, addEventListener() {}, sessionStorage: { getItem: (k) => (k === "soreal_idle_session_v1" ? "session-de-test" : null) },
    document: { addEventListener() {}, body: { appendChild() {} }, createElement: el, createTextNode: (t) => { const n = el("#text"); n._t = t; return n; }, getElementById: (id) => (id === "scvTropheesV1" ? noeud : null) },
    setTimeout: () => 1, requestAnimationFrame: () => 1,
  };
  sb.fetch = async (url) => {
    /* accès par compte (2026-11-22) : la page demande son jeton de fichiers au serveur */
    if (String(url).endsWith("/api/v1/scummvm-acces")) return { ok: true, json: async () => ({ ok: true, autorise: true, jeton: "jeton1234.signature-de-test-12345", expire: 4e9 }) };
    if (String(url).endsWith("jeux.json")) return { ok: true, json: async () => ({ jeux: [JEU] }) };
    if (String(url).endsWith("soreal-trophees.json")) return { ok: true, json: async () => ({ version: 1, trophees: [trophee("a", { nom: { fr: "Le livret", en: "The book" }, ap: 1500, objets: [352] }), trophee("b", { nom: { fr: "Le correcteur", en: "The corrector" }, ap: 25000, objets: [350] }), trophee("secret", { nom: { fr: "Trophée secret", en: "Secret trophy" }, ap: 777, objets: [1] })] }) };
    return { ok: false, json: async () => ({}) };
  };
  sb.window = sb;
  sb.__SOREAL_IDLE_REG__ = { entetePageIdleV28_: () => "", formatEntierLisibleIdleV1_: (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") };
  vm.createContext(sb);
  vm.runInContext(srcSave, sb);
  vm.runInContext(srcProgres, sb);
  vm.runInContext(srcPage, sb);
  const A = sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__;
  const etat = (jeux) => ({ systemes: { systems: [{ id: "scummvm", state: { data: { jeux } } }] } });
  const att = () => new Promise((r) => setTimeout(r, 20));
  await att();
  const j0 = etat({});
  sb.__SOREAL_IDLE_REG__.idleEtat = j0;
  A.page(j0); await att(); A.page(j0); await att();
  assert.ok(sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__.tropheesDe("dott"), "liste lue par la page");
  const html = A.page(j0);
  assert.ok(html.includes('id="scvTropheesV1"') && html.includes("data-morph-vivant"), "nœud persistant dans la page");
  assert.ok(!html.includes("AP gagnés"), "jeu avec trophées : pas de compteur tant qu'aucun trophée");
  A.majTrophees();
  assert.equal(noeud.children.length, 0, "rien du tout tant qu'aucun trophée n'est obtenu (pas de titre vide, pas de compteur)");
  /* un trophée obtenu */
  const j1 = etat({ dott: { unites: 0, apCredite: 1500, trophees: { a: 1500 }, ordre: ["a"] } });
  sb.__SOREAL_IDLE_REG__.idleEtat = j1;
  A.majTrophees();
  assert.equal(noeud.children.length, 3);
  assert.ok(noeud.children.every((c) => "data-morph-garder" in c.attrs), "blocs gardés par le morph (règle n°4)");
  assert.equal(noeud.textContent, "TrophéesLe livret+1 500 APAP gagnés avec ce jeu : 1 500");
  const ul = noeud.children[1];
  const li0 = ul.children[0];
  const totalEl = noeud.children[2].children[2];
  const ecr = totalEl.ecritures;
  /* un deuxième : s'ajoute en bas, le premier n'est pas recréé */
  const j2 = etat({ dott: { unites: 0, apCredite: 26500, trophees: { a: 1500, b: 25000 }, ordre: ["a", "b"] } });
  sb.__SOREAL_IDLE_REG__.idleEtat = j2;
  A.majTrophees();
  assert.equal(ul.children.length, 2);
  assert.equal(ul.children[0], li0, "le premier élément est le même nœud (aucun redessin)");
  assert.equal(noeud.children[1], ul);
  assert.equal(noeud.textContent, "TrophéesLe livret+1 500 APLe correcteur+25 000 APAP gagnés avec ce jeu : 26 500");
  /* rien ne change : aucune écriture */
  const e2 = totalEl.ecritures;
  A.majTrophees(); A.majTrophees();
  assert.equal(totalEl.ecritures, e2, "le total n'est pas réécrit quand il ne change pas");
  assert.ok(e2 > ecr);
  /* ni le secret, ni un total possible, ni le plafond, ni un nombre de trophées */
  const t = noeud.textContent;
  assert.ok(!/secret|777|150 ?000|\//i.test(t), "aucun trophée non obtenu, aucun plafond, aucun « x / y » : " + t);
  assert.deepEqual(JSON.parse(JSON.stringify(A.tropheesObtenus(j2))).map((x) => x.id), ["a", "b"]);
  /* un id inconnu de la liste n'est jamais affiché */
  assert.deepEqual(JSON.parse(JSON.stringify(A.tropheesObtenus(etat({ dott: { apCredite: 5, trophees: { zzz: 5 }, ordre: ["zzz"] } })))), []);
  /* anglais : noms anglais ; le nœud est reconstruit une fois */
  sb.localStorage.setItem("soreal_idle_langue_v1", "en");
  A.majTrophees();
  assert.equal(noeud.textContent, "TrophéesThe book+1 500 APThe corrector+25 000 APAP gagnés avec ce jeu : 26 500");
  /* retour au français */
  sb.localStorage.setItem("soreal_idle_langue_v1", "fr");
  A.majTrophees();
  assert.ok(noeud.textContent.includes("Le livret"));
  /* le code de la page : aucune minuterie entre redessin et remise en état, aucun total */
  const nu = srcPage.replace(/\/\*[\s\S]*?\*\//g, "");
  const bloc = nu.slice(nu.indexOf("function majTrophees"), nu.indexOf("function apCredites"));
  assert.ok(!/setTimeout|setInterval|requestAnimationFrame|\.length\s*\+|\.length\s*\/|\/\s*\w*\.length/.test(bloc), "pas de minuterie, aucun total de trophées dans le bloc");
  assert.ok(!/plafond/.test(bloc), "le bloc ne parle jamais du plafond");
}

/* 8. données et textes : table des objets, exemple, dictionnaire, outil */
{
  assert.equal(Object.keys(OBJETS).length, 508);
  assert.equal(OBJETS[352], "le livret de compte en Suisse");
  assert.equal(OBJETS[350], "le correcteur");
  const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
  for (const k of ["Trophées", "AP gagnés avec ce jeu :"]) assert.ok(dico[k], "traduction anglaise : " + k);
  const outil = readFileSync("cloudflare/tools/scummvm-envoyer.mjs", "utf8");
  assert.ok(outil.includes('commande === "trophees"') && outil.includes("soreal-trophees.json") && outil.includes("validerTrophees"));
  const doc = readFileSync("design/SCUMMVM.md", "utf8");
  assert.ok(doc.includes("soreal-trophees.json") && doc.includes("scummvmTrophees") && doc.includes("__SOREAL_IDLE_SCUMMVM_JOURNAL_V1__"));
  const nuP = srcProgres.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/document\.|innerHTML/.test(nuP), "le suivi n'écrit rien dans la page");
}

/* 10. Trophée de collection (nbObjets) : « avoir possédé au moins N objets différents » (les trois trophées de vol de Day of the Tentacle) */
{
  const f = faux();
  const L = f.P.validerTrophees({ version: 1, trophees: [trophee("vol-3", { nbObjets: 3 }), trophee("vol-5", { nbObjets: 5, objets: [], bits: [] })] });
  assert.ok(L && L.length === 2 && L[0].nbObjets === 3, "nbObjets seul suffit comme condition");
  const vu = new Uint8Array((L0.unitesPossibles(profil) + 7) >> 3);
  const poser = (i) => { vu[i >> 3] |= 1 << (i & 7); };
  poser(10); poser(11);
  assert.deepEqual(Array.from(f.P.tropheesRemplis(L, vu, profil).map((t) => t.id)), [], "2 objets : rien");
  poser(12);
  assert.deepEqual(Array.from(f.P.tropheesRemplis(L, vu, profil).map((t) => t.id)), ["vol-3"], "3 objets : le premier");
  poser(profil.objetsGlobaux + 4);   // un indicateur n'est pas un objet : il ne compte pas
  assert.deepEqual(Array.from(f.P.tropheesRemplis(L, vu, profil).map((t) => t.id)), ["vol-3"], "les indicateurs ne comptent pas comme des objets");
  poser(13); poser(14);
  assert.deepEqual(Array.from(f.P.tropheesRemplis(L, vu, profil).map((t) => t.id)), ["vol-3", "vol-5"]);
  for (const mauvais of [0, -1, 801, 1.5, "3", null]) assert.equal(f.P.validerTrophees({ version: 1, trophees: [trophee("x", { nbObjets: mauvais })] }), null, "nbObjets invalide : " + JSON.stringify(mauvais));
  assert.ok(f.P.validerTrophees({ version: 1, trophees: [trophee("x", { objets: [1], nbObjets: 4 })] }), "peut s'ajouter à des objets");
}

console.log("idle-scummvm-trophees-v1 OK");
