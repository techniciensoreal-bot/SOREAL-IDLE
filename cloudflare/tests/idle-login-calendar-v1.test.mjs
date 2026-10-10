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
 * Calendrier de connexion du Money Pit (Norman, 2026-10-03, révisé le 2026-10-10) : récompenses en AP, 150 000 AP par mois, case = jour du mois, dernier jour bien plus élevé.
 * Un jour raté ne remet plus rien à zéro : sa case est grisée et chaque jour raté retire 10 % (cumulé) aux récompenses restantes, dernier lot compris. Le premier mois (octobre 2026)
 * est offert : aucune pénalité, un remerciement à la connexion. Valeurs données par Norman (fonctionnalité SOREAL originale, absente du wiki).
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

const jourParis = (iso) => Date.parse(iso + "T12:00:00+02:00");
const arrondi10 = (v) => Math.round(v / 10) * 10;
function joueur() { return { records: {}, currencies: { ap: 0 } }; }
const B31 = idleLoginCalendarBaremeV1(31);

// 3. Mois normal (décembre) : un jour raté grise sa case, ne remet RIEN à zéro et retire 10 % aux récompenses restantes.
{
  const s = joueur();
  const r1 = idleLoginCalendarReclamerV1(s, jourParis("2026-12-01"));
  assert.equal(r1.case, 1);
  assert.equal(r1.ap, B31[0]);
  assert.equal(s.currencies.ap, r1.ap, "les AP sont crédités");
  assert.throws(() => idleLoginCalendarReclamerV1(s, jourParis("2026-12-01") + 3600000), /CALENDRIER_DEJA_RECLAME/, "une seule récompense par jour");
  // Le 2 décembre est raté. Le 3 : la case 1 reste allumée (pas de retour à 1), la case 2 est grisée.
  const snap3 = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-03"));
  assert.deepEqual(snap3.reclamees, [1]);
  assert.deepEqual(snap3.ratees, [2]);
  assert.equal(snap3.joursRates, 1);
  assert.equal(snap3.multiplicateur, 0.9);
  assert.equal(snap3.offert, false);
  assert.equal(snap3.reclamable, true);
  assert.equal(snap3.prochainAp, arrondi10(B31[2] * 0.9), "la case du jour est réduite de 10 %");
  assert.equal(snap3.bareme[30], arrondi10(B31[30] * 0.9), "le lot final aussi");
  assert.equal(snap3.bareme[0], B31[0], "la case déjà prise n'est pas touchée");
  const r3 = idleLoginCalendarReclamerV1(s, jourParis("2026-12-03"));
  assert.equal(r3.case, 3, "la case 3 est celle du 3 décembre");
  assert.equal(r3.ap, arrondi10(B31[2] * 0.9));
  assert.equal(r3.manques, 1);
  assert.equal(r3.ratesDepuisConnexion, 1);
  assert.equal(r3.reduction, 10);
  assert.equal(r3.merci, false, "pas de remerciement hors du premier mois");
  // Deux jours ratés (4 et 5 décembre) : 10 % de 90 % = 81 % pour la suite.
  const snap6 = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-06"));
  assert.equal(snap6.joursRates, 3);
  assert.deepEqual(snap6.ratees, [2, 4, 5]);
  // Une case prise APRÈS un jour raté est réduite, une case prise AVANT ne change pas.
  assert.equal(snap6.bareme[3], arrondi10(B31[3] * 0.9), "case 4 : un seul jour raté la précède");
  assert.equal(snap6.bareme[5], arrondi10(B31[5] * Math.pow(0.9, 3)), "case 6 : trois jours ratés la précèdent");
  assert.equal(snap6.bareme[30], arrondi10(B31[30] * Math.pow(0.9, 3)), "le lot final suit la même réduction cumulée");
  assert.equal(snap6.multiplicateur, 0.729);
  assert.equal(snap6.reclamable, true);
  assert.equal(idleLoginCalendarReclamerV1(s, jourParis("2026-12-06")).ap, arrondi10(B31[5] * Math.pow(0.9, 3)));
}
{
  // 1000 -> 900 -> 810 : exemple de Norman (le barème de la case du jour passe par l'arrondi à la dizaine).
  const s = joueur();
  idleLoginCalendarReclamerV1(s, jourParis("2026-12-01"));
  const un = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-03")).bareme[10];
  const deux = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-04")).bareme[10];
  assert.equal(un, arrondi10(B31[10] * 0.9));
  assert.equal(deux, arrondi10(B31[10] * 0.81));
  assert.ok(deux < un && un < B31[10]);
}
{
  // Un joueur qui arrive le 15 n'est pas puni pour les jours qui précèdent (cases grisées, mais aucune réduction).
  const s = joueur();
  const snap = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-15"));
  assert.equal(snap.ratees.length, 14, "les jours passés sont grisés");
  assert.equal(snap.joursRates, 0);
  assert.equal(snap.multiplicateur, 1);
  assert.equal(snap.prochainAp, B31[14]);
  const r = idleLoginCalendarReclamerV1(s, jourParis("2026-12-15"));
  assert.equal(r.ap, B31[14]);
  assert.equal(r.ratesDepuisConnexion, 0);
  // Il rate le 16 : seul ce jour-là compte.
  assert.equal(idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-17")).joursRates, 1);
}
{
  // Un joueur qui avait déjà participé un mois précédent est compté dès le 1er du nouveau mois.
  const s = joueur();
  idleLoginCalendarReclamerV1(s, jourParis("2026-11-28"));
  const snap = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-05"));
  assert.equal(snap.joursRates, 4, "les jours 1 à 4 de décembre comptent");
  assert.equal(snap.multiplicateur, Math.round(Math.pow(0.9, 4) * 10000) / 10000);
}

// 4. Premier mois (octobre 2026) : aucune pénalité, remerciement à la connexion seulement si un jour a été raté depuis la dernière connexion.
{
  const s = joueur();
  idleLoginCalendarReclamerV1(s, jourParis("2026-10-04"));
  const r5 = idleLoginCalendarReclamerV1(s, jourParis("2026-10-05"));
  assert.equal(r5.merci, false, "aucun jour raté : pas de message");
  assert.equal(r5.ap, B31[4]);
  // Il rate les 6 et 7 : il reçoit quand même la totalité, avec un remerciement.
  const snap = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-10-08"));
  assert.equal(snap.offert, true);
  assert.equal(snap.multiplicateur, 1);
  assert.deepEqual(snap.ratees.filter((d) => d >= 5), [6, 7], "les cases ratées restent grisées");
  assert.equal(snap.prochainAp, B31[7], "récompense non réduite");
  assert.equal(snap.bareme[30], B31[30], "lot final intact");
  const r8 = idleLoginCalendarReclamerV1(s, jourParis("2026-10-08"));
  assert.equal(r8.ap, B31[7]);
  assert.equal(r8.merci, true);
  assert.equal(r8.ratesDepuisConnexion, 2);
  assert.equal(r8.manques, 0);
  assert.equal(r8.reduction, 0);
  assert.equal(idleLoginCalendarReclamerV1(s, jourParis("2026-10-09")).merci, false, "plus de remerciement ensuite");
}

// 5. Un mois complet sans jour raté rapporte exactement 150 000 AP, le dernier jour compris.
{
  const s = joueur();
  let total = 0;
  for (let j = 1; j <= 31; j += 1) total += idleLoginCalendarReclamerV1(s, jourParis("2026-12-" + String(j).padStart(2, "0"))).ap;
  assert.equal(total, 150000, "un mois complet rapporte exactement 150 000 AP");
  assert.equal(s.currencies.ap, 150000);
  const fin = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-31"));
  assert.equal(fin.serie, 31);
  assert.equal(fin.reclamable, false);
  assert.equal(fin.dejaReclameAujourdhui, true);
  assert.equal(fin.ratees.length, 0);
}

// 6. Nouveau mois : nouveau plateau de 30 cases, rien de repris du précédent.
{
  const s = joueur();
  idleLoginCalendarReclamerV1(s, jourParis("2026-12-31"));
  const nov = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2027-01-01"));
  assert.equal(nov.jours, 31);
  const s2 = joueur();
  idleLoginCalendarReclamerV1(s2, jourParis("2026-10-31"));
  const snapNov = idleLoginCalendarSnapshotV1(s2.records.loginCalendar, jourParis("2026-11-01"));
  assert.equal(snapNov.jours, 30);
  assert.equal(snapNov.bareme.reduce((a, c) => a + c, 0), 150000);
  assert.deepEqual(snapNov.reclamees, []);
  assert.equal(snapNov.joursRates, 0);
}

// 7. Anciennes sauvegardes (série + dernier jour) : converties en cases prises, sans rien perdre.
{
  const s = joueur();
  s.records.loginCalendar = { mois: "2026-12", serie: 3, dernierJour: "2026-12-07", totalReclames: 9, totalAp: 5000, octroi: "" };
  const snap = idleLoginCalendarSnapshotV1(s.records.loginCalendar, jourParis("2026-12-08"));
  assert.deepEqual(snap.reclamees, [5, 6, 7]);
  assert.equal(snap.serie, 3);
}

// 8. Intégration moteur : rien avant le Money Pit (anti-spoil), puis action « loginCalendar » et vue dans le snapshot.
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
  assert.equal(res.result.ap, B31[9], "la case du 10 décembre est la case 10");
  assert.equal(res.state.currencies.ap, res.result.ap);
  const apres = idleNguSnapshot(res.state, { bosses: 40 }, T).loginCalendar;
  assert.equal(apres.serie, 1);
  assert.equal(apres.reclamable, false);
  assert.throws(() => applyIdleNguAction(res.state, { action: "loginCalendar" }, { bosses: 40 }, T + 60000), /CALENDRIER_DEJA_RECLAME/);
}
console.log("idle-login-calendar-v1 OK");
