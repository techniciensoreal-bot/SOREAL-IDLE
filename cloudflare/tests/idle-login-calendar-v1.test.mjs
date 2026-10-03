import assert from "node:assert/strict";
import {
  IDLE_LOGIN_CALENDAR_TOTAL_AP_V1,
  idleLoginCalendarBaremeV1,
  idleLoginCalendarJourParisV1,
  idleLoginCalendarSnapshotV1,
  idleLoginCalendarReclamerV1,
  idleLoginCalendarJoursDuMoisV1
} from "../src/idle-login-calendar-v1.js";
import { applyIdleNguAction, idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Calendrier de connexion du Money Pit (Norman, 2026-10-03) : récompenses en AP, séries de jours, 150 000 AP par mois, case = jour du mois, dernier jour bien plus élevé, série remise à 0
 * après un jour raté. Valeurs données par Norman (fonctionnalité SOREAL originale, absente du wiki).
 */

// 1. Barème : total exact de 150 000, croissant, dernier jour beaucoup plus élevé, pour chaque longueur de mois.
for (const jours of [28, 29, 30, 31]) {
  const b = idleLoginCalendarBaremeV1(jours);
  assert.equal(b.length, jours, jours + " cases");
  assert.equal(b.reduce((a, c) => a + c, 0), IDLE_LOGIN_CALENDAR_TOTAL_AP_V1, "total exact de 150 000 AP pour " + jours + " jours");
  for (let i = 1; i < b.length; i += 1) assert.ok(b[i] > b[i - 1], "strictement croissant (" + jours + " jours, case " + (i + 1) + ")");
  assert.ok(b[0] >= 100 && b.every((x) => Number.isInteger(x) && x > 0), "sommes entières, la première n'est pas dérisoire");
  assert.ok(b[jours - 1] >= 2.5 * b[jours - 2], "le dernier jour est beaucoup plus élevé que la veille (" + b[jours - 1] + " contre " + b[jours - 2] + ")");
}
assert.equal(IDLE_LOGIN_CALENDAR_TOTAL_AP_V1, 150000);

// 2. Jours du mois (bissextile compris) et jour calendaire de PARIS (pas UTC).
assert.equal(idleLoginCalendarJoursDuMoisV1(2028, 2), 29);
assert.equal(idleLoginCalendarJoursDuMoisV1(2026, 2), 28);
assert.equal(idleLoginCalendarJoursDuMoisV1(2026, 10), 31);
assert.equal(idleLoginCalendarJoursDuMoisV1(2026, 11), 30);
{
  const minuitParis = Date.parse("2026-10-03T22:30:00Z"); // 00:30 le 4 octobre à Paris (UTC+2)
  assert.deepEqual(idleLoginCalendarJourParisV1(minuitParis), { annee: 2026, mois: 10, jour: 4 });
  assert.deepEqual(idleLoginCalendarJourParisV1(Date.parse("2026-10-03T21:30:00Z")), { annee: 2026, mois: 10, jour: 3 });
}

// 3. Série : jours consécutifs, jour raté = retour à 0, nouveau mois = nouveau plateau.
const jourParis = (iso) => Date.parse(iso + "T12:00:00+02:00");
function joueur() { return { records: {}, currencies: { ap: 0 } }; }
{
  const s = joueur();
  const r1 = idleLoginCalendarReclamerV1(s, jourParis("2026-10-01"));
  assert.equal(r1.case, 1);
  assert.equal(r1.ap, idleLoginCalendarBaremeV1(31)[0]);
  assert.equal(s.currencies.ap, r1.ap, "les AP sont crédités");
  assert.throws(() => idleLoginCalendarReclamerV1(s, jourParis("2026-10-01") + 3600000), /CALENDRIER_DEJA_RECLAME/, "une seule récompense par jour");
  const r2 = idleLoginCalendarReclamerV1(s, jourParis("2026-10-02"));
  assert.equal(r2.case, 2);
  assert.ok(r2.ap > r1.ap, "plus on enchaîne, mieux c'est");
  idleLoginCalendarReclamerV1(s, jourParis("2026-10-03"));
  // Jour raté (le 4 octobre) : le 5, retour à la case 1.
  const snap5 = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-10-05"));
  assert.equal(snap5.serie, 0, "un jour raté remet la série à 0");
  assert.equal(snap5.reclamable, true);
  assert.equal(snap5.prochainAp, idleLoginCalendarBaremeV1(31)[0]);
  const r5 = idleLoginCalendarReclamerV1(s, jourParis("2026-10-05"));
  assert.equal(r5.case, 1);
  // Le lendemain, la série continue.
  assert.equal(idleLoginCalendarReclamerV1(s, jourParis("2026-10-06")).case, 2);
  // Nouveau mois : plateau de 30 cases, retour à la case 1.
  const snapNov = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-11-01"));
  assert.equal(snapNov.jours, 30);
  assert.equal(snapNov.bareme.reduce((a, c) => a + c, 0), 150000);
  assert.equal(snapNov.serie, 0);
}
{
  // Série sans faute depuis le 1er : la dernière case du mois est atteinte, puis plus rien à réclamer.
  const s = joueur();
  let total = 0;
  for (let j = 1; j <= 31; j += 1) total += idleLoginCalendarReclamerV1(s, jourParis("2026-10-" + String(j).padStart(2, "0"))).ap;
  assert.equal(total, 150000, "un mois complet rapporte exactement 150 000 AP");
  assert.equal(s.currencies.ap, 150000);
  const fin = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-10-31"));
  assert.equal(fin.serie, 31);
  assert.equal(fin.reclamable, false);
  assert.equal(fin.dejaReclameAujourdhui, true);
}

// 4. Intégration moteur : rien avant le Money Pit (anti-spoil), puis action « loginCalendar » et vue dans le snapshot.
{
  const T = jourParis("2026-12-10");
  const etat = normalizeIdleNguState({}, { bosses: 40 }, T);
  assert.equal(idleNguSnapshot(etat, { bosses: 40 }, T).loginCalendar, null, "Money Pit pas encore découvert : aucune trace du calendrier");
  assert.throws(() => applyIdleNguAction(etat, { action: "loginCalendar" }, { bosses: 40 }, T), /SYSTEME_VERROUILLE/);
  etat.systems.moneyPit.unlocked = true;
  const avant = idleNguSnapshot(etat, { bosses: 40 }, T).loginCalendar;
  assert.equal(avant.reclamable, true);
  assert.equal(avant.jours, 31);
  const res = applyIdleNguAction(etat, { action: "loginCalendar" }, { bosses: 40 }, T);
  assert.equal(res.result.ap, idleLoginCalendarBaremeV1(31)[0]);
  assert.equal(res.state.currencies.ap, res.result.ap);
  const apres = idleNguSnapshot(res.state, { bosses: 40 }, T).loginCalendar;
  assert.equal(apres.serie, 1);
  assert.equal(apres.reclamable, false);
  assert.throws(() => applyIdleNguAction(res.state, { action: "loginCalendar" }, { bosses: 40 }, T + 60000), /CALENDRIER_DEJA_RECLAME/);
}
console.log("idle-login-calendar-v1 OK");
