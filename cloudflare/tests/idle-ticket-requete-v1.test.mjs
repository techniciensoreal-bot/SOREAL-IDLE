import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : le bouton ⚡ de SOREAL APP ouvre le jeu dans son APK (adresse « intent ») : une telle adresse ne peut pas porter de « # », le ticket de lancement arrive donc aussi dans « ?ticket=… ». Même ticket à usage unique
 * (90 s), consommé par le serveur ; l'adresse est nettoyée aussitôt. « #ticket=… » (fenêtre intégrée de APP / TV) continue de fonctionner.
 */
const src = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
const debut = src.indexOf("function ticketFromHashV1(){");
const fin = src.indexOf("function googleSessionStockeeV1(){");
assert.ok(debut > 0 && fin > debut);
function essayer(adresse) {
  const u = new URL(adresse);
  const historique = [];
  const location = { hash: u.hash, search: u.search, pathname: u.pathname };
  const history = { replaceState(_a, _b, url) { historique.push(url); } };
  const f = new Function("location", "history", src.slice(debut, fin) + "\nreturn {ticket:ticketFromHashV1,nettoyer:clearHashV1};")(location, history);
  return { ticket: f.ticket(), nettoyer: () => { f.nettoyer(); return historique[historique.length - 1]; } };
}
const base = "https://soreal-idle.technicien-soreal.workers.dev";
assert.equal(essayer(base + "/#ticket=abc123").ticket, "abc123", "#ticket= (fenêtre intégrée)");
assert.equal(essayer(base + "/?ticket=def456").ticket, "def456", "?ticket= (lancement par l'APK)");
assert.equal(essayer(base + "/?ticket=tk%201%2F2%2Bx").ticket, "tk 1/2+x", "ticket encodé décodé");
assert.equal(essayer(base + "/?ticket=a#ticket=b").ticket, "b", "le # prime s'il y en a un");
assert.equal(essayer(base + "/").ticket, "", "aucun ticket");
assert.equal(essayer(base + "/?ticket=def456").nettoyer(), "/", "adresse nettoyée après consommation");
assert.equal(essayer(base + "/?langue=fr&ticket=def456").nettoyer(), "/?langue=fr", "les autres paramètres sont gardés");
assert.equal(essayer(base + "/#ticket=abc123").nettoyer(), "/", "# retiré aussi");
console.log("idle-ticket-requete-v1: OK");
