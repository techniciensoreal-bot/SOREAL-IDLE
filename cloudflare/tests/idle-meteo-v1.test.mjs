import assert from "node:assert/strict";
import { idleMeteoCategorieV1, idleMeteoCoordonneesV1, idleMeteoRepondreV1, idleMeteoUrlAmontV1, IDLE_METEO_CATEGORIES_V1 } from "../src/idle-meteo-v1.js";

/* correspondance des codes WMO */
const attendu = { 0: "clair", 1: "clair", 2: "nuageux", 3: "couvert", 45: "brouillard", 48: "brouillard", 51: "bruine", 57: "bruine", 61: "pluie", 63: "pluie", 65: "forte-pluie", 66: "pluie", 67: "forte-pluie", 71: "neige", 73: "neige", 75: "forte-neige", 77: "neige", 80: "pluie", 82: "forte-pluie", 85: "neige", 86: "forte-neige", 95: "orage", 96: "orage", 99: "orage" };
for (const [code, cat] of Object.entries(attendu)) assert.equal(idleMeteoCategorieV1(Number(code)), cat, "code " + code);
assert.equal(idleMeteoCategorieV1("x"), "clair");
for (const c of Object.values(attendu)) assert.ok(IDLE_METEO_CATEGORIES_V1.includes(c));

/* confidentialité : arrondi à 0,1°, bornes */
assert.deepEqual(idleMeteoCoordonneesV1("50.8467", "4.3525"), { lat: 50.8, lon: 4.4 });
assert.equal(idleMeteoCoordonneesV1("91", "0"), null);
assert.equal(idleMeteoCoordonneesV1("0", "181"), null);
assert.equal(idleMeteoCoordonneesV1("abc", "0"), null);
const u = idleMeteoUrlAmontV1({ lat: 50.8, lon: 4.4 });
assert.ok(u.startsWith("https://api.open-meteo.com/") && !/ip|key|user/i.test(u.replace("api.open-meteo.com", "")), "aucune donnée du joueur dans l'appel amont");

/* route : réponse d'une catégorie seulement */
let appele = "";
const lire = async (x) => { appele = x; return { ok: true, json: async () => ({ current: { weather_code: 95 } }) }; };
let r = await idleMeteoRepondreV1(new URL("https://x/api/idle/media/meteo?lat=50.8467&lon=4.3525"), lire);
assert.equal(r.status, 200);
assert.deepEqual(await r.json(), { ok: true, categorie: "orage" });
assert.ok(appele.includes("latitude=50.8&longitude=4.4"), "l'amont ne reçoit que les coordonnées arrondies : " + appele);
r = await idleMeteoRepondreV1(new URL("https://x/m?lat=zz&lon=1"), lire);
assert.equal(r.status, 400);
r = await idleMeteoRepondreV1(new URL("https://x/m?lat=1&lon=1"), async () => { throw new Error("réseau"); });
assert.equal(r.status, 503);
r = await idleMeteoRepondreV1(new URL("https://x/m?lat=1&lon=1"), async () => ({ ok: true, json: async () => ({}) }));
assert.equal(r.status, 503);
console.log("idle-meteo-v1: OK");
