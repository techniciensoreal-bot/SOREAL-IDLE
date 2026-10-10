import assert from "node:assert/strict";
import { applyIdleNguAction, idleNguSnapshot, normalizeIdleNguState, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { idleLoginCalendarBaremeV1 } from "../src/idle-login-calendar-v1.js";

/*
 * Norman (2026-10-03) : « pour la récompense d'octobre, octroie à tous les joueurs les jours 1 et 2. Le 3e jour sera disponible pour tout le monde mais ils devront cliquer pour récupérer et valider
 * le bonus. » Octroi unique, octobre 2026 seulement, réservé à qui voit le calendrier (Money Pit découvert : donner de l'AP plus tôt dévoilerait la Boutique AP).
 */
const ctx = { bosses: 100 };
const jour = (iso) => Date.parse(iso + "T12:00:00+02:00");
const bareme = idleLoginCalendarBaremeV1(31);
const apAttendu = bareme[0] + bareme[1];

// Money Pit pas découvert : aucun AP, aucune trace.
{
  const T = jour("2026-10-03");
  const e = syncIdleNguState(normalizeIdleNguState({}, ctx, T), ctx, T);
  assert.equal(e.currencies.ap, 0, "pas d'AP offerts avant la découverte du Money Pit (anti-spoil Boutique AP)");
  assert.equal(idleNguSnapshot(e, ctx, T).loginCalendar, null);
}

// Money Pit découvert : cases 1 et 2 octroyées une seule fois, case 3 à réclamer par un clic.
{
  const T = jour("2026-10-03");
  let e = normalizeIdleNguState({}, ctx, T);
  e.systems.moneyPit.unlocked = true;
  e = syncIdleNguState(e, ctx, T);
  assert.equal(e.currencies.ap, apAttendu, "AP des jours 1 et 2 crédités");
  const vue = idleNguSnapshot(e, ctx, T).loginCalendar;
  assert.equal(vue.serie, 2, "cases 1 et 2 allumées");
  assert.equal(vue.reclamable, true, "la case 3 est disponible pour tous");
  assert.equal(vue.prochainAp, bareme[2]);
  // Une deuxième synchro ne rend rien de plus.
  e = syncIdleNguState(e, ctx, T + 60000);
  assert.equal(e.currencies.ap, apAttendu, "octroi unique");
  // La case 3 s'obtient par un clic.
  const r = applyIdleNguAction(e, { action: "loginCalendar" }, ctx, T + 120000);
  assert.equal(r.result.case, 3);
  assert.equal(r.result.ap, bareme[2]);
  assert.equal(r.state.currencies.ap, apAttendu + bareme[2]);
  assert.throws(() => applyIdleNguAction(r.state, { action: "loginCalendar" }, ctx, T + 180000), /CALENDRIER_DEJA_RECLAME/);
  // Le lendemain : case 4, la série continue.
  const demain = applyIdleNguAction(r.state, { action: "loginCalendar" }, ctx, jour("2026-10-04"));
  assert.equal(demain.result.case, 4);
}

// Une ancienne sauvegarde (une récompense réclamée le 3 octobre) reçoit les cases 1 et 2 (jours passés) mais garde sa journée.
{
  const T = jour("2026-10-03");
  let e = normalizeIdleNguState({}, ctx, T);
  e.records.loginCalendar = { mois: "2026-10", serie: 1, dernierJour: "2026-10-03", totalReclames: 1, totalAp: bareme[0], octroi: "" };
  e.currencies.ap = bareme[0];
  e.systems.moneyPit.unlocked = true;
  e = syncIdleNguState(e, ctx, T);
  assert.equal(e.currencies.ap, bareme[0] + bareme[0] + bareme[1], "il reçoit les cases 1 et 2 en plus de ce qu'il avait");
  const vue = idleNguSnapshot(e, ctx, T).loginCalendar;
  assert.deepEqual(vue.reclamees, [1, 2, 3]);
  assert.equal(vue.reclamable, false, "sa journée est déjà prise");
}

// Un joueur déjà au-delà ne reçoit rien ; hors octobre 2026, rien du tout.
{
  const T = jour("2026-10-09");
  let e = normalizeIdleNguState({}, ctx, T);
  e.records.loginCalendar = { mois: "2026-10", serie: 6, dernierJour: "2026-10-08", totalReclames: 6, totalAp: 9999, octroi: "" };
  e.systems.moneyPit.unlocked = true;
  e = syncIdleNguState(e, ctx, T);
  assert.equal(e.currencies.ap, 0);
  assert.equal(idleNguSnapshot(e, ctx, T).loginCalendar.serie, 6);
  const nov = jour("2026-11-03");
  let n = normalizeIdleNguState({}, ctx, nov);
  n.systems.moneyPit.unlocked = true;
  n = syncIdleNguState(n, ctx, nov);
  assert.equal(n.currencies.ap, 0, "aucun octroi en novembre");
  assert.equal(idleNguSnapshot(n, ctx, nov).loginCalendar.serie, 0);
}
console.log("idle-login-calendar-octroi-octobre-v1 OK");
