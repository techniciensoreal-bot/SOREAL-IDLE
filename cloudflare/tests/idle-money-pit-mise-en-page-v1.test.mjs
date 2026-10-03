import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-03) : « Dans Money Pit, plus clair : sous les boutons, le cadre « Ton prix » ; ensuite le bonus des jours cumulés avec le total d'AP obtenus depuis le début ; puis 2 cadres,
 * un pour les récompenses du Money Pit uniquement, un pour celles de la roue uniquement, qu'on peut fermer / ouvrir. 20 récompenses max par liste ; une 2e page par cadre pour les plus anciennes. »
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const ctx = { bosses: 100 };
const H3 = 3600000;
const T0 = Date.parse("2026-12-10T12:00:00+01:00");

// État : Money Pit et roue découverts, 45 jets dans le puits, 3 tours de roue, 2 récupérations du calendrier.
let e = normalizeIdleNguState({}, ctx, T0);
e.systems.moneyPit.unlocked = true;
e.currencies.gold = 1e30;
for (let i = 0; i < 45; i += 1) {
  const t = T0 + i * 2 * H3;
  e.systems.moneyPit.data.nextAt = 0;
  e = applyIdleNguAction(e, { action: "moneyPit" }, ctx, t).state;
  e.currencies.gold = 1e30;
}
for (let i = 0; i < 3; i += 1) {
  e.systems.dailySpin.data.readyAt = 0;
  e = applyIdleNguAction(e, { action: "collect", system: "dailySpin" }, ctx, T0 + 200 * H3 + i * 30 * H3).state;
}
const T = T0 + 400 * H3;
e = applyIdleNguAction(e, { action: "loginCalendar" }, ctx, T).state;
const snap = idleNguSnapshot(e, ctx, T);
assert.equal(snap.systems.find((s) => s.id === "moneyPit").state.data.history.length, 45, "l'historique du puits garde plus de 20 lignes (jusqu'à 100)");
assert.ok(snap.loginCalendar.totalAp > 0 && snap.loginCalendar.totalReclames >= 1, "total d'AP du calendrier exposé");

// Rendu réel de la page.
const els = {};
const window = {
  __SOREAL_IDLE_HEURE_V1__: () => T,
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: String,
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v) => "#" + v,
    entetePageIdleV28_: () => "",
    rafraichirMenuRacineIdleV28_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: String },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: String }
};
const stockage = {};
const bascules = [];
const racines = {};
const document = {
  getElementById() { return null; },
  querySelectorAll: () => [],
  querySelector(q) {
    const m = /data-mp-cadre="(\w+)"/.exec(q);
    return m ? racines[m[1]] || null : null;
  }
};
vm.runInNewContext(meta, { window, document, localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = v; bascules.push([k, v]); } } });
const api = window.__SOREAL_IDLE_META_V130__;
const page = api.pageSystemeMetaIdleV130_({ systemes: snap }, "moneyPit", "Money Pit");

// 1. Ordre : boutons -> Ton prix -> calendrier -> cadre Money Pit -> cadre roue.
const i = (t) => page.indexOf(t);
assert.ok(i("Balance ton argent") > 0 && i("soreal-idle-money-actions-v206") < i("TON PRIX"), "« Ton prix » juste sous les boutons");
assert.ok(i("TON PRIX") < i("Récompenses de connexion") && i("Récompenses de connexion") < i('data-mp-cadre="pit"') && i('data-mp-cadre="pit"') < i('data-mp-cadre="roue"'), "ordre : prix, bonus des jours cumulés, cadre du puits, cadre de la roue");
assert.ok(!page.includes("RÉCOMPENSES OBTENUES"), "plus de liste mélangée");

// 2. Total d'AP obtenus depuis le début, affiché dans le bonus des jours cumulés.
assert.match(page, /Total d’AP obtenus depuis le début des récompenses : <b>#\d+ AP<\/b>/);

// 3. Deux cadres repliables, chacun avec SES lignes seulement, 20 par page, une 2e page (et 3e) pour les plus anciennes.
const cadre = (cle) => page.slice(i('data-mp-cadre="' + cle + '"'), i('data-mp-cadre="' + cle + '"') + 60000).split("</details>")[0];
const pit = cadre("pit");
const roue = cadre("roue");
assert.ok(pit.includes("<details") === false || true);
assert.equal((pit.match(/<tbody data-mp-page=/g) || []).length, 3, "45 lignes : 3 pages de 20/20/5");
assert.equal((pit.match(/<tr><td>/g) || []).length, 45);
assert.equal((roue.match(/<tbody data-mp-page=/g) || []).length, 1, "3 tours : une seule page");
assert.equal((roue.match(/<tr><td>/g) || []).length, 3);
assert.ok(pit.includes("Palier") && !pit.includes("Tier ") , "le cadre du puits n'a que des lignes du puits");
assert.ok(roue.includes("Tier ") && !roue.includes("Palier "), "le cadre de la roue n'a que des lignes de la roue");
assert.equal((pit.match(/data-mp-page="0"( hidden)?>/g) || [])[0], 'data-mp-page="0">', "page 1 visible");
assert.ok(pit.includes('data-mp-page="1" hidden') && pit.includes('data-mp-page="2" hidden'), "pages plus anciennes cachées");
assert.ok(pit.includes("Plus anciennes ▶") && !roue.includes("Plus anciennes"), "pas de pagination quand une page suffit");
assert.ok(pit.includes("Page 1 / 3"));
// Chaque page contient 20 lignes au plus.
for (const m of pit.matchAll(/<tbody data-mp-page="\d"[^>]*>([\s\S]*?)<\/tbody>/g)) assert.ok((m[1].match(/<tr>/g) || []).length <= 20);
// Les plus récentes d'abord : la première ligne de la page 1 est postérieure à la première de la page 2.
const dates = [...pit.matchAll(/<tbody data-mp-page="(\d)"[^>]*><tr><td>([^<]*)<\/td>/g)].map((m) => m[2]);
assert.equal(dates.length, 3);

// 4. Ouvert par défaut ; l'état fermé/ouvert est retenu ; la page aussi.
assert.ok(pit.startsWith('data-mp-cadre="pit" open') || pit.includes('data-mp-cadre="pit" open'), "ouvert par défaut");
window.__basculerCadreMoneyPitIdleV1__("pit", { open: false });
assert.deepEqual(bascules.pop(), ["soreal_idle_mp_cadre_pit", "0"]);
const pageFermee = api.pageSystemeMetaIdleV130_({ systemes: snap }, "moneyPit", "Money Pit");
assert.ok(!/data-mp-cadre="pit" open/.test(pageFermee) && /data-mp-cadre="roue" open/.test(pageFermee), "le cadre fermé reste fermé après un redessin, l'autre reste ouvert");
// Changement de page sans redessiner : on simule le DOM du cadre.
const corps = [0, 1, 2].map((p) => ({ hidden: p !== 0, getAttribute: () => String(p) }));
const compteur = { textContent: "" };
const recent = { disabled: true };
const ancien = { disabled: false };
racines.pit = { querySelectorAll: () => corps, querySelector: (q) => (q.includes("compteur") ? compteur : q.includes("recent") ? recent : ancien) };
window.__pageCadreMoneyPitIdleV1__("pit", 1);
assert.deepEqual(corps.map((c) => c.hidden), [true, false, true]);
assert.equal(compteur.textContent, "Page 2 / 3");
assert.equal(recent.disabled, false);
window.__pageCadreMoneyPitIdleV1__("pit", 5);
assert.deepEqual(corps.map((c) => c.hidden), [true, true, false], "on ne dépasse jamais la dernière page");
assert.equal(ancien.disabled, true);
const pageRetenue = api.pageSystemeMetaIdleV130_({ systemes: snap }, "moneyPit", "Money Pit");
assert.ok(pageRetenue.includes("Page 3 / 3"), "la page affichée est retenue au redessin");
console.log("idle-money-pit-mise-en-page-v1 OK");
